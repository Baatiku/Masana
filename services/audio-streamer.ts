import {
  createWorketFromSrc,
  registeredWorklets,
} from './audioworklet-registry';

export class AudioStreamer {
  private readonly sampleRate: number = 24000;
  private readonly initialBufferTime: number = 0.1; // 100ms latency for buffering
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private scheduledTime: number = 0;
  public readonly gainNode: GainNode;
  
  constructor(public context: AudioContext) {
    this.gainNode = this.context.createGain();
    this.gainNode.connect(this.context.destination);
  }

  public setVolume(level: number) {
    if (this.gainNode) {
        const clampedLevel = Math.max(0, Math.min(1, level));
        // Use setTargetAtTime for a smoother transition to avoid clicks
        this.gainNode.gain.setTargetAtTime(clampedLevel, this.context.currentTime, 0.01);
    }
  }

  async addWorklet<T extends (d: any) => void>(
    workletName: string,
    workletSrc: string,
    handler: T
  ): Promise<this> {
    let workletsRecord = registeredWorklets.get(this.context);
    if (workletsRecord && workletsRecord[workletName]) {
      workletsRecord[workletName].handlers.push(handler);
      return Promise.resolve(this);
    }

    if (!workletsRecord) {
      registeredWorklets.set(this.context, {});
      workletsRecord = registeredWorklets.get(this.context)!;
    }

    workletsRecord[workletName] = { handlers: [handler] };

    const src = createWorketFromSrc(workletName, workletSrc);
    await this.context.audioWorklet.addModule(src);
    const worklet = new AudioWorkletNode(this.context, workletName);
    workletsRecord[workletName].node = worklet;

    return this;
  }

  private _processPCM16Chunk(chunk: Uint8Array): Float32Array {
    const float32Array = new Float32Array(chunk.length / 2);
    const dataView = new DataView(chunk.buffer);
    for (let i = 0; i < float32Array.length; i++) {
      const int16 = dataView.getInt16(i * 2, true);
      // Convert 16-bit PCM to [-1.0, 1.0] float
      float32Array[i] = int16 < 0 ? int16 / 32768 : int16 / 32767;
    }
    return float32Array;
  }

  public addPCM16(chunk: Uint8Array) {
    const float32Array = this._processPCM16Chunk(chunk);
    if (float32Array.length > 0) {
      this.audioQueue.push(float32Array);
    }
    
    if (!this.isPlaying && this.audioQueue.length > 0) {
      this.play();
    }
  }

  private play() {
    if (this.isPlaying || this.audioQueue.length === 0) {
      return;
    }
    this.isPlaying = true;

    if (this.context.state === 'suspended') {
      this.context.resume();
    }

    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(1, this.context.currentTime + 0.05);


    if (this.scheduledTime < this.context.currentTime) {
      this.scheduledTime = this.context.currentTime + this.initialBufferTime;
    }
    this.scheduleChunks();
  }

  private scheduleChunks() {
    const SCHEDULE_AHEAD_TIME = 0.3; // Schedule 300ms ahead

    while (
      this.audioQueue.length > 0 &&
      this.scheduledTime < this.context.currentTime + SCHEDULE_AHEAD_TIME
    ) {
      const audioData = this.audioQueue.shift()!;
      const audioBuffer = this.context.createBuffer(1, audioData.length, this.sampleRate);
      audioBuffer.getChannelData(0).set(audioData);
      
      const source = this.context.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.gainNode);

      const worklets = registeredWorklets.get(this.context);
      if (worklets) {
        Object.values(worklets).forEach(graph => {
          if (graph.node) {
            source.connect(graph.node);
            graph.node.port.onmessage = (ev) => {
              graph.handlers.forEach(handler => handler.call(graph.node?.port, ev));
            };
            graph.node.connect(this.context.destination);
          }
        });
      }

      source.start(this.scheduledTime);
      this.scheduledTime += audioBuffer.duration;
    }

    if (this.audioQueue.length > 0) {
      const timeUntilNextCheck = (this.scheduledTime - this.context.currentTime - SCHEDULE_AHEAD_TIME) * 1000;
      setTimeout(() => this.scheduleChunks(), Math.max(50, timeUntilNextCheck));
    } else {
      this.isPlaying = false;
    }
  }

  public stop() {
    this.isPlaying = false;
    this.audioQueue = []; 
    this.scheduledTime = 0;

    this.gainNode.gain.cancelScheduledValues(this.context.currentTime);
    this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, this.context.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(0, this.context.currentTime + 0.05);
  }
  
  public async pause() {
    if (this.context.state === 'running') {
        await this.context.suspend();
    }
  }

  public async resume() {
      if (this.context.state === 'suspended') {
          await this.context.resume();
      }
  }
}