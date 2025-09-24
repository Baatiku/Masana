
import { audioContext } from './utils';
import AudioRecordingWorklet from './worklets/audio-processing';
import VolMeterWorket from './worklets/vol-meter';
import SpeechAnalysisWorklet from './worklets/speech-analysis';

import { createWorketFromSrc } from './audioworklet-registry';
import EventEmitter from 'eventemitter3';

function arrayBufferToBase64(buffer: ArrayBuffer) {
  var binary = '';
  var bytes = new Uint8Array(buffer);
  var len = bytes.byteLength;
  for (var i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

interface SpeechAnalysisData {
    pace: number;
    hesitationCount: number;
    engagement: number;
}
interface AudioRecorderEvents {
  data: (base64: string) => void;
  volume: (volume: number) => void;
  speechAnalysis: (data: SpeechAnalysisData) => void;
}

export class AudioRecorder {
  private emitter = new EventEmitter<AudioRecorderEvents>();
  public on = this.emitter.on.bind(this.emitter);
  public off = this.emitter.off.bind(this.emitter);

  stream: MediaStream | undefined;
  audioContext: AudioContext | undefined;
  source: MediaStreamAudioSourceNode | undefined;
  recording: boolean = false;
  recordingWorklet: AudioWorkletNode | undefined;
  vuWorklet: AudioWorkletNode | undefined;
  analysisWorklet: AudioWorkletNode | undefined;

  private starting: Promise<void> | null = null;

  constructor(public sampleRate = 16000) {}

  async start() {
    if (this.recording || this.starting) {
      return;
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('Could not request user media');
    }

    this.starting = new Promise<void>(async (resolve, reject) => {
      try {
        this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        this.audioContext = await audioContext({ sampleRate: this.sampleRate });
        this.source = this.audioContext.createMediaStreamSource(this.stream);

        const workletName = 'audio-recorder-worklet';
        const src = createWorketFromSrc(workletName, AudioRecordingWorklet);

        await this.audioContext.audioWorklet.addModule(src);
        this.recordingWorklet = new AudioWorkletNode(
          this.audioContext,
          workletName
        );

        this.recordingWorklet.port.onmessage = async (ev: MessageEvent) => {
          // Worklet processes recording floats and messages converted buffer
          const arrayBuffer = ev.data.data.int16arrayBuffer;

          if (arrayBuffer) {
            const arrayBufferString = arrayBufferToBase64(arrayBuffer);
            this.emitter.emit('data', arrayBufferString);
          }
        };
        this.source.connect(this.recordingWorklet);

        // vu meter worklet
        const vuWorkletName = 'vu-meter';
        await this.audioContext.audioWorklet.addModule(
          createWorketFromSrc(vuWorkletName, VolMeterWorket)
        );
        this.vuWorklet = new AudioWorkletNode(this.audioContext, vuWorkletName);
        this.vuWorklet.port.onmessage = (ev: MessageEvent) => {
          this.emitter.emit('volume', ev.data.volume);
        };

        this.source.connect(this.vuWorklet);
        this.recording = true;
        resolve();
      } catch (err) {
        reject(err);
      } finally {
        this.starting = null;
      }
    });

    this.starting.catch(error => {
      console.error('Failed to start audio recorder:', error);
    });
  }

  async startSpeechAnalysis() {
    if (!this.source || !this.audioContext) {
        console.warn("Audio source not ready for analysis.");
        return;
    }
    if (this.analysisWorklet) return;

    try {
        const workletName = 'speech-analysis-worklet';
        await this.audioContext.audioWorklet.addModule(
            createWorketFromSrc(workletName, SpeechAnalysisWorklet)
        );
        this.analysisWorklet = new AudioWorkletNode(this.audioContext, workletName);
        this.analysisWorklet.port.onmessage = (ev: MessageEvent) => {
            this.emitter.emit('speechAnalysis', ev.data);
        };
        this.source.connect(this.analysisWorklet);
    } catch (error) {
        console.error("Failed to start speech analysis worklet:", error);
    }
  }

  stopSpeechAnalysis() {
    if (this.analysisWorklet && this.source) {
        try {
            this.source.disconnect(this.analysisWorklet);
        } catch(e) { console.warn("Could not disconnect analysis worklet."); }
        this.analysisWorklet = undefined;
    }
  }

  stop() {
    const handleStop = () => {
      if (!this.recording) return;
      this.recording = false;
      this.stopSpeechAnalysis();
      this.source?.disconnect();
      this.stream?.getTracks().forEach(track => track.stop());
      this.stream = undefined;
      this.recordingWorklet = undefined;
      this.vuWorklet = undefined;
    };

    if (this.starting) {
      this.starting.finally(handleStop);
      return;
    }
    handleStop();
  }
}