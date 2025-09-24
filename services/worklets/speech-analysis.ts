const SpeechAnalysisWorklet = `
class SpeechAnalysisWorklet extends AudioWorkletProcessor {
    // Configuration
    speakingThreshold = 0.01; // RMS volume to be considered speaking
    silenceThresholdSamples; // min samples of silence to be considered a pause
    hesitationMaxSamples; // max samples for a pause to be a hesitation
    updateIntervalSamples; // how often to send updates

    // State
    samplesSinceLastUpdate = 0;
    speakingSamples = 0;
    currentSilenceSamples = 0;
    isCurrentlySpeaking = false;
    hesitationCount = 0;
    
    // For engagement (volume variance)
    speakingVolumes = [];

    constructor(options) {
        super();
        const sampleRate = options?.processorOptions?.sampleRate || 16000;
        this.silenceThresholdSamples = (300 / 1000) * sampleRate;
        this.hesitationMaxSamples = (1500 / 1000) * sampleRate;
        this.updateIntervalSamples = (2000 / 1000) * sampleRate;
    }

    calculateEngagement() {
        if (this.speakingVolumes.length < 2) {
            return 0.5; // Default neutral value
        }
        const mean = this.speakingVolumes.reduce((a, b) => a + b, 0) / this.speakingVolumes.length;
        const variance = this.speakingVolumes.map(v => (v - mean) ** 2).reduce((a, b) => a + b, 0) / this.speakingVolumes.length;
        const stdDev = Math.sqrt(variance);
        
        // Normalize the standard deviation to a 0-1 range.
        // This is an approximation. 0.05 is an empirically chosen "good" standard deviation for engaging speech.
        const engagement = Math.min(1, stdDev / 0.05); 
        return engagement;
    }

    process(inputs) {
        const input = inputs[0]?.[0];
        if (!input) return true;

        let sum = 0;
        for (let i = 0; i < input.length; i++) {
            sum += input[i] * input[i];
        }
        const rms = Math.sqrt(sum / input.length);

        if (rms > this.speakingThreshold) {
            // We are speaking
            this.speakingVolumes.push(rms);
            if (!this.isCurrentlySpeaking) {
                // Transition from silence to speaking
                if (this.currentSilenceSamples > this.silenceThresholdSamples && this.currentSilenceSamples < this.hesitationMaxSamples) {
                    this.hesitationCount++;
                }
            }
            this.isCurrentlySpeaking = true;
            this.speakingSamples += input.length;
            this.currentSilenceSamples = 0;
        } else {
            // We are silent
            if (this.isCurrentlySpeaking) {
                // Transition from speaking to silence
            }
            this.isCurrentlySpeaking = false;
            this.currentSilenceSamples += input.length;
        }

        this.samplesSinceLastUpdate += input.length;

        if (this.samplesSinceLastUpdate >= this.updateIntervalSamples) {
            const pace = this.speakingSamples / this.samplesSinceLastUpdate;
            const engagement = this.calculateEngagement();

            this.port.postMessage({
                pace: isNaN(pace) ? 0 : pace,
                hesitationCount: this.hesitationCount,
                engagement: isNaN(engagement) ? 0.5 : engagement
            });

            // Reset for the next window
            this.samplesSinceLastUpdate = 0;
            this.speakingSamples = 0;
            this.hesitationCount = 0;
            this.speakingVolumes = [];
            this.currentSilenceSamples = 0;
        }

        return true;
    }
}
`;
export default SpeechAnalysisWorklet;
