export class ConversationRecorder {
    private mediaRecorder: MediaRecorder | null = null;
    private recordedChunks: Blob[] = [];
    private mixedStream: MediaStream | null = null;
    private audioContext: AudioContext | null = null;

    async start(userStream: MediaStream, aiStream: MediaStream) {
        if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            console.warn("Recording is already in progress.");
            return;
        }

        try {
            // Create a new context for mixing audio streams
            this.audioContext = new (window.AudioContext)();
            const userSource = this.audioContext.createMediaStreamSource(userStream);
            const aiSource = this.audioContext.createMediaStreamSource(aiStream);
            const destination = this.audioContext.createMediaStreamDestination();

            userSource.connect(destination);
            aiSource.connect(destination);
            
            this.mixedStream = destination.stream;

            const options = { mimeType: 'audio/webm; codecs=opus' };
            this.mediaRecorder = new MediaRecorder(this.mixedStream, options);

            this.mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    this.recordedChunks.push(event.data);
                }
            };

            this.mediaRecorder.start();
            console.log("Recording started.");
        } catch (error) {
            console.error("Failed to start recording:", error);
            this.cleanup(); // Ensure cleanup on failure
        }
    }

    stop(): Promise<Blob | null> {
        return new Promise((resolve) => {
            if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
                resolve(null);
                return;
            }

            this.mediaRecorder.onstop = () => {
                const audioBlob = new Blob(this.recordedChunks, { type: 'audio/webm' });
                this.recordedChunks = [];
                this.cleanup();
                console.log("Recording stopped and blob created.");
                resolve(audioBlob);
            };

            this.mediaRecorder.stop();
        });
    }

    private cleanup() {
        this.mixedStream?.getTracks().forEach(track => track.stop());
        if (this.audioContext?.state !== 'closed') {
            this.audioContext?.close();
        }
        this.mixedStream = null;
        this.audioContext = null;
        this.mediaRecorder = null;
    }
}
