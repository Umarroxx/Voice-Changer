let isVoiceChangerRunning = false;
let audioContext, pitchShifterWave, pitchShifterVoice, analyser, stream;

async function startVoiceChanger() {
    console.log("Before Try")
    try {
        const button = document.getElementById('changeVoiceButton');

        console.log("Before if")
        if (isVoiceChangerRunning) {
            // Stop the voice changer
            pitchShifterWave.disconnect();
            pitchShifterVoice.disconnect();
            analyser.disconnect();
            audioContext.close();
            stream.getTracks().forEach(track => track.stop());
            isVoiceChangerRunning = false;

            // Update button text
            button.textContent = 'Change Your Voice';
            console.log("Before else")
        } else {
            // Start the voice changer
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            analyser = audioContext.createAnalyser();
            const audioInput = audioContext.createMediaStreamSource(stream);
            pitchShifterWave = audioContext.createScriptProcessor(1024, 1, 1);

            audioInput.connect(analyser);
            analyser.connect(pitchShifterWave);
            pitchShifterWave.connect(audioContext.destination);

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            analyser.fftSize = 256;

            const svg = document.getElementById('voiceWave');

            pitchShifterWave.onaudioprocess = function () {
                analyser.getByteFrequencyData(dataArray);
                const values = Array.from(dataArray);
                const numStrokes = values.length;

                svg.innerHTML = '';

                for (let i = 0; i < numStrokes; i++) {
                    const x = (i / numStrokes) * 750;
                    const y = (values[i] / 256) * 350;

                    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                    line.setAttribute('class', 'waveStroke');
                    line.setAttribute('x1', x);
                    line.setAttribute('y1', (350 - y) / 2);
                    line.setAttribute('x2', x);
                    line.setAttribute('y2', (350 + y) / 2);

                    svg.appendChild(line);
                }
            };

            pitchShifterVoice = audioContext.createScriptProcessor(1024, 1, 1);

            audioInput.connect(pitchShifterVoice);
            pitchShifterVoice.connect(audioContext.destination);

            const semitones = -5;

            pitchShifterVoice.onaudioprocess = function (event) {
                const inputData = event.inputBuffer.getChannelData(0);
                const outputData = event.outputBuffer.getChannelData(0);

                for (let i = 0; i < inputData.length; i++) {
                    const newIndex = Math.pow(2, semitones / 12.0) * i;
                    const index1 = Math.floor(newIndex);
                    const index2 = Math.ceil(newIndex);
                    const fraction = newIndex - index1;

                    outputData[i] = (1 - fraction) * inputData[index1] + fraction * inputData[index2];
                }
            };

            isVoiceChangerRunning = true;

            // Update button text
            button.textContent = 'Stop';
        }
    } catch (error) {
        console.error('Error accessing microphone:', error);
    }
}

// Cleanup on Escape key press
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && isVoiceChangerRunning) {
        const button = document.getElementById('changeVoiceButton');

        pitchShifterWave.disconnect();
        pitchShifterVoice.disconnect();
        analyser.disconnect();
        audioContext.close();
        stream.getTracks().forEach(track => track.stop());
        isVoiceChangerRunning = false;

        // Update button text
        button.textContent = 'Change Your Voice';
    }
});
