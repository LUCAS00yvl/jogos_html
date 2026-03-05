let audioCtx;
let isAudioInitialized = false;

function initAudio() {
    if (isAudioInitialized) return;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    isAudioInitialized = true;
    
    // Drone de fundo suavizado
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gainNode = audioCtx.createGain();
    
    osc.type = 'triangle'; // Menos estridente que o sawtooth
    osc.frequency.setValueAtTime(40, audioCtx.currentTime); 
    
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, audioCtx.currentTime); // Abafa o som, dá clima de caverna

    const lfo = audioCtx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, audioCtx.currentTime); 
    
    const lfoGain = audioCtx.createGain();
    lfoGain.gain.setValueAtTime(0.4, audioCtx.currentTime);
    
    lfo.connect(lfoGain);
    lfoGain.connect(gainNode.gain);
    
    osc.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    lfo.start();
}

// Tiro realista usando Ruído Branco (White Noise) + Filtro
function playShootSound() {
    if (!audioCtx) return;
    
    const bufferSize = audioCtx.sampleRate * 0.4; // 0.4 segundos de áudio
    const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Gera estática pura
    for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1; 
    }
    
    const noise = audioCtx.createBufferSource();
    noise.buffer = buffer;
    
    // Filtra a estática para soar como um estrondo/tiro grave
    const filter = audioCtx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(800, audioCtx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
    
    const gain = audioCtx.createGain();
    gain.gain.setValueAtTime(1.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    
    noise.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);
    
    noise.start();
}