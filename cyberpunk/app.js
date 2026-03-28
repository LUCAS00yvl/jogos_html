// ==========================================
// --- SISTEMA DE ÁUDIO WEB PROCEDURAL ---
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playSound(frequency, type = 'sine', duration = 0.1) {
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.value = frequency; 
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime); // Volume
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration); // Fade out

    oscillator.start(audioCtx.currentTime);
    oscillator.stop(audioCtx.currentTime + duration);
}

const sounds = {
    hexSelect: () => playSound(800, 'square', 0.05), // Bip curto e agudo
    matched: () => { playSound(1200, 'sine', 0.1); setTimeout(() => playSound(1600, 'sine', 0.1), 50); }, // Arpejo
    error: () => playSound(100, 'sawtooth', 0.3) // Grave e ruidoso
};


// ==========================================
// 1. LÓGICA DAS ABAS DE NAVEGAÇÃO
// ==========================================
function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}


// ==========================================
// 2. LÓGICA DO MINIGAME BREACH
// ==========================================
const hexValues = ['1C', '55', 'BD', 'E9', 'FF', '7A'];
let matrix = []; let targetSeq = []; let playerSeq = []; let isRow = true; let activeIndex = 0;
const matrixSize = 5; const bufferSize = 5; let gameActiveBP = true;

function initBreach() {
    gameActiveBP = true; playerSeq = []; isRow = true; activeIndex = 0; 
    document.getElementById('buffer-count').innerText = 0;
    generateMatrix(); generateTarget(); renderMatrix(); updateBuffer();
}

function generateMatrix() {
    matrix = []; 
    for(let i = 0; i < matrixSize; i++) {
        let row = []; 
        for(let j = 0; j < matrixSize; j++) { 
            row.push(hexValues[Math.floor(Math.random() * hexValues.length)]); 
        }
        matrix.push(row);
    }
}

function generateTarget() {
    targetSeq = []; 
    for(let i = 0; i < 3; i++) { 
        targetSeq.push(hexValues[Math.floor(Math.random() * hexValues.length)]); 
    }
    const targetDiv = document.getElementById('target-sequence');
    targetDiv.innerHTML = targetSeq.map(code => `<div class="hex-code">${code}</div>`).join('');
}

function renderMatrix() {
    const grid = document.getElementById('matrix-grid'); grid.innerHTML = '';
    for(let i = 0; i < matrixSize; i++) {
        for(let j = 0; j < matrixSize; j++) {
            const cell = document.createElement('div'); cell.className = 'matrix-cell';
            cell.innerText = matrix[i][j];
            if (matrix[i][j] === '') { 
                cell.classList.add('used'); cell.innerText = '[]';
            } else if (gameActiveBP) {
                let isSelectable = false;
                if (isRow && i === activeIndex) { isSelectable = true; cell.classList.add('active-track'); }
                else if (!isRow && j === activeIndex) { isSelectable = true; cell.classList.add('active-track'); }
                if (isSelectable) { 
                    cell.classList.add('selectable'); 
                    cell.onclick = () => selectHex(i, j, matrix[i][j]); 
                }
            } 
            grid.appendChild(cell);
        }
    }
}

function selectHex(r, c, code) {
    if(!gameActiveBP) return;
    
    sounds.hexSelect(); // Toca som de seleção

    playerSeq.push(code);
    matrix[r][c] = '';
    isRow = !isRow; activeIndex = isRow ? r : c; updateBuffer(); checkBreachStatus();
    if(gameActiveBP) renderMatrix();
}

function updateBuffer() {
    const bufferDiv = document.getElementById('player-buffer'); document.getElementById('buffer-count').innerText = playerSeq.length;
    bufferDiv.innerHTML = playerSeq.map(code => `<div class="hex-code">${code}</div>`).join('');
}

function checkBreachStatus() {
    let pStr = playerSeq.join(','); let tStr = targetSeq.join(',');
    
    if (pStr.includes(tStr)) {
        gameActiveBP = false;
        renderMatrix();
        sounds.matched(); // Toca som de sucesso
        setTimeout(() => alert("DAEMON CARREGADO. Acesso Concedido!"), 150);
    } else if (playerSeq.length >= bufferSize) {
        gameActiveBP = false;
        renderMatrix();
        sounds.error(); // Toca som de erro
        setTimeout(() => alert("FALHA DE INVASÃO!"), 150);
    }
}


// ==========================================
// 3. MOTOR DO RPG DE TEXTO E GLITCH
// ==========================================
const terminal = document.getElementById('rpg-terminal'); const controls = document.getElementById('rpg-controls');
let systemErrorActive = false;

const storyNodes = {
    start: { text: "CHAMADA RECEBIDA: REGINA JONES...\n\n'V, preciso que recupere uma maleta climatizada em um cassino Tyger Claws. O pagamento é 10 mil eddies. Faça na miúda.'\n\nQual é o seu equipamento?", choices: [ { text: "O Solo (Carnage e Armadura)", next: "solo_approach" }, { text: "O Trilhas-Rede (Ciberdeque e Pistola)", next: "netrunner_approach" }, { text: "O Ninja (Lâminas Louva-a-Deus)", next: "ninja_approach" } ] },
    solo_approach: { text: "Engatilha a Carnage. Dois Tyger Claws estão na porta, fumando cigarros sintéticos.", choices: [ { text: "Chutar a porta e atirar", next: "solo_combat" }, { text: "Intimidá-los", next: "solo_talk" } ] },
    netrunner_approach: { text: "Se conecta a um ponto próximo. Câmera e máquina de vendas NiCola perto deles.", choices: [ { text: "Hackear a câmera", next: "netrunner_hack" }, { text: "Sobrecargar a máquina de vendas", next: "netrunner_distract" } ] },
    ninja_approach: { text: "Ativa a camuflagem óptica. Sobe a escada de incêndio até uma janela.", choices: [ { text: "Pular e executar o guarda", next: "ninja_stealth" }, { text: "Esgueirar-se pelas vigas", next: "ninja_rafters" } ] },
    solo_combat: { text: "Os seguranças viram névoa vermelha. Alarme dispara. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] },
    solo_talk: { text: "Braços de Gorila estalam. Os seguranças decidem que não ganham o suficiente. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] },
    netrunner_hack: { text: "Coloca a câmera em loop. Alarme falso nos fundos. Porta livre. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] },
    netrunner_distract: { text: "A máquina de NiCola explode em faíscas e xarope. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] },
    ninja_stealth: { text: "Pula como uma pedra, Lâminas Louva-a-Deus *snikt*. Guarda cai silenciosamente. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] },
    ninja_rafters: { text: "Se move lentamente pelas vigas de aço. Avista a maleta. [CONTINUA...]", choices: [{ text: "Reiniciar", next: "start" }] }
};

function addLog(text, isSystem = false) {
    if (systemErrorActive) return; // Se houver erro, para de logar

    const div = document.createElement('div'); div.className = 'rpg-log';
    if(isSystem) { div.innerHTML = `<span class="rpg-sys">[SISTEMA]</span> <span class="rpg-desc">${text}</span>`; }
    else { div.innerHTML = `<span class="rpg-desc">${text}</span>`; }
    
    terminal.appendChild(div); 
    terminal.scrollTop = terminal.scrollHeight; 
    
    // Chance de erro dinâmico (5%) ao adicionar log
    if (Math.random() < 0.05 && storyNodes.current !== 'start') {
        triggerSystemError();
    }
}

function renderNode(nodeId) {
    controls.innerHTML = ''; 
    const nodeData = storyNodes[nodeId];
    addLog("--------------------------------------------------", true);
    const lines = nodeData.text.split('\n'); 
    lines.forEach(line => { if(line.trim() !== '') addLog(line); });
    
    nodeData.choices.forEach(choice => {
        const btn = document.createElement('button'); btn.className = 'rpg-btn';
        btn.innerText = "> " + choice.text; btn.onclick = () => renderNode(choice.next);
        controls.appendChild(btn);
    });
}

function triggerSystemError() {
    systemErrorActive = true;
    controls.innerHTML = ''; // Limpa botões existentes
    
    terminal.classList.add('glitch-shake');
    
    addLog("--------------------------------------------------", true);
    addLog("AVISO DE SISTEMA: DETECTADA ATIVIDADE SUSPEITA!", true);
    addLog("--------------------------------------------------", true);
    addLog("ALERTA: PROTOCOLO DE SEGURANÇA DA ARASAKA ATIVADO.", true);
    addLog("ICE DE SEGURANÇA ESTÁ VARRENDO O TERMINAL...", true);
    
    setTimeout(() => {
        terminal.classList.remove('glitch-shake');
        
        const btn = document.createElement('button');
        btn.className = 'rpg-btn';
        btn.innerText = "> REINICIAR CONEXÃO";
        btn.onclick = recoverConnection;
        controls.appendChild(btn);
    }, 1000);
}

function recoverConnection() {
    systemErrorActive = false;
    terminal.innerHTML = ''; // Limpa o log
    renderNode('start'); // Reinicia a história
    addLog("... CONEXÃO REESTABELECIDA COM REGINA JONES.", true);
}


// ==========================================
// 4. LÓGICA DO CRIADOR E RIPPERDOC
// ==========================================
const currentSettings = { 
    gender: 'feminino', 
    lifepath: 'nômade', 
    implants: { os: 'cyberdeck', eyes: 'kiroshi_base', arms: 'org', legs: 'org' }
};
const stats = { points: 7, corpo: 3, reflexos: 3, tech: 3, inteligencia: 3, frieza: 3 };

function updateVisuals() {
    const genderInput = document.querySelector('input[name="gender"]:checked');
    if (genderInput) currentSettings.gender = genderInput.value;
    drawProceduralDoll(); 
}

function setLifepath(element, lifepath) {
    const buttons = element.closest('.button-group').querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('active'));
    element.classList.add('active'); 
    currentSettings.lifepath = lifepath;
    drawProceduralDoll(); 
}

function updateImplants() {
    currentSettings.implants.os = document.getElementById('cw-os').value;
    currentSettings.implants.eyes = document.getElementById('cw-eyes').value;
    currentSettings.implants.arms = document.getElementById('cw-arms').value;
    currentSettings.implants.legs = document.getElementById('cw-legs').value;
    drawProceduralDoll();
}

function updateStatUI(statKey) {
    document.getElementById(`val-${statKey}`).innerText = stats[statKey];
    document.getElementById(`slider-${statKey}`).value = stats[statKey];
    document.getElementById(`attribute-points`).innerText = stats.points;
}

function changeStat(statKey, delta) {
    const currentValue = stats[statKey];
    if (delta > 0 && stats.points > 0 && currentValue < 20) { stats[statKey]++; stats.points--; }
    else if (delta < 0 && currentValue > 3) { stats[statKey]--; stats.points++; }
    
    updateStatUI(statKey);
    
    if (statKey === 'corpo') { 
        drawProceduralDoll(); 
        updateVitalMonitor(); 
    }
}

function updateStat(statKey, newValue) {
    const oldValue = stats[statKey]; const diff = newValue - oldValue;
    
    if (diff > 0) { 
        if (stats.points >= diff) { stats[statKey] = parseInt(newValue); stats.points -= diff; }
        else { document.getElementById(`slider-${statKey}`).value = oldValue; alert("Pontos insuficientes."); } 
    }
    else if (diff < 0) { stats[statKey] = parseInt(newValue); stats.points += Math.abs(diff); }
    
    updateStatUI(statKey);
    
    if (statKey === 'corpo') { 
        drawProceduralDoll(); 
        updateVitalMonitor(); 
    }
}

function updateVitalMonitor() {
    const heartRateSpan = document.getElementById('vitals-heartrate');
    const stabilitySpan = document.getElementById('vitals-stability');
    if (!heartRateSpan || !stabilitySpan) return;
    
    const heartRate = 90 - (stats.corpo * 2);
    const stability = 50 + (stats.corpo * 2.5);
    
    heartRateSpan.innerText = heartRate;
    stabilitySpan.innerText = Math.round(stability);
}


// ==========================================
// 5. MOTOR PIP-BOY ISAAC // MODO RIPPERDOC
// ==========================================
function drawProceduralDoll() {
    const canvas = document.getElementById('pipboy-canvas'); 
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'rgba(0, 240, 255, 0.1)'; ctx.lineWidth = 1;
    for(let i = 0; i < canvas.width; i += 20) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, canvas.height); ctx.stroke(); }
    for(let i = 0; i < canvas.height; i += 20) { ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(canvas.width, i); ctx.stroke(); }

    const bodyStat = stats.corpo; 
    const gender = currentSettings.gender;
    const imps = currentSettings.implants; 

    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;

    const skinColor = '#00f0ff';     
    const eyeColor = '#0b0b0c';      
    const tearColor = '#ff003c';     
    const metalColor = '#888888';
    const neonOrange = '#ff8c00';

    const headW = 80; const headH = 65; const headY = centerY - 50;
    const beanW = 30 + (bodyStat * 2); 
    const beanH = 45 + (bodyStat * 1.5);
    const beanY = headY + 65;

    ctx.shadowBlur = (imps.os === 'berserk') ? 25 : 0;
    ctx.shadowColor = (imps.os === 'berserk') ? tearColor : 'transparent';

    function drawSolidEllipse(x, y, radiusX, radiusY, fillStyle) {
        ctx.fillStyle = fillStyle; ctx.beginPath();
        ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2); ctx.fill();
    }

    // Camada Costas
    if (imps.os === 'sandevistan') {
        ctx.fillStyle = '#00ff00'; ctx.shadowBlur = 15; ctx.shadowColor = '#00ff00';
        ctx.beginPath(); ctx.roundRect(centerX - 8, beanY - beanH + 10, 16, beanH * 1.5, 5); ctx.fill();
        ctx.shadowBlur = 0; 
    }

    // Camada Pernas
    let legW = 12; let legH = 10; let legColor = skinColor;
    if (imps.legs === 'tendons') { legColor = metalColor; legH = 18; } 
    if (imps.legs === 'ankles') { legColor = '#444'; legW = 18; legH = 15; } 

    drawSolidEllipse(centerX - beanW*0.5, beanY + beanH*0.8, legW, legH, legColor);
    drawSolidEllipse(centerX + beanW*0.5, beanY + beanH*0.8, legW, legH, legColor);

    // Camada Corpo
    drawSolidEllipse(centerX, beanY, beanW, beanH, skinColor);

    // Camada Braços
    let armW = 12; let armH = 18; let armColor = skinColor;
    let armOffsetX = beanW + 5;
    
    if (imps.arms === 'gorilla') { armW = 22; armH = 25; armColor = metalColor; armOffsetX = beanW + 12; }
    
    drawSolidEllipse(centerX - armOffsetX, beanY, armW, armH, armColor);
    drawSolidEllipse(centerX + armOffsetX, beanY, armW, armH, armColor);

    if (imps.arms === 'mantis') {
        ctx.fillStyle = metalColor; ctx.beginPath();
        ctx.moveTo(centerX - armOffsetX - 5, beanY); ctx.lineTo(centerX - armOffsetX - 25, beanY + 30); ctx.lineTo(centerX - armOffsetX + 5, beanY + 15);
        ctx.moveTo(centerX + armOffsetX + 5, beanY); ctx.lineTo(centerX + armOffsetX + 25, beanY + 30); ctx.lineTo(centerX + armOffsetX - 5, beanY + 15);
        ctx.fill();
    }
    else if (imps.arms === 'monowire') {
        ctx.strokeStyle = neonOrange; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = neonOrange;
        ctx.beginPath();
        ctx.moveTo(centerX - armOffsetX, beanY + armH); ctx.quadraticCurveTo(centerX - armOffsetX - 30, beanY + 40, centerX - armOffsetX - 10, beanY + 50);
        ctx.moveTo(centerX + armOffsetX, beanY + armH); ctx.quadraticCurveTo(centerX + armOffsetX + 30, beanY + 40, centerX + armOffsetX + 10, beanY + 50);
        ctx.stroke(); ctx.shadowBlur = 0;
    }

    // Camada Cabeça
    drawSolidEllipse(centerX, headY, headW, headH, skinColor);

    if (imps.os === 'cyberdeck') {
        ctx.fillStyle = '#00ff7f'; ctx.shadowBlur = 10; ctx.shadowColor = '#00ff7f';
        ctx.beginPath(); ctx.arc(centerX + headW - 5, headY - 10, 8, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0;
    }

    // Camada Rosto
    const eyeOffset = 35;
    let eyeW = (gender === 'feminino') ? 20 : 18;
    let eyeH = (gender === 'feminino') ? 25 : 28;

    drawSolidEllipse(centerX - eyeOffset, headY + 5, eyeW, eyeH, eyeColor);
    drawSolidEllipse(centerX + eyeOffset, headY + 5, eyeW, eyeH, eyeColor);

    if (imps.eyes === 'kiroshi_thermo') {
        ctx.strokeStyle = tearColor; ctx.lineWidth = 2; ctx.shadowBlur = 10; ctx.shadowColor = tearColor;
        ctx.beginPath();
        ctx.moveTo(centerX - eyeOffset - 10, headY + 5); ctx.lineTo(centerX - eyeOffset + 10, headY + 5);
        ctx.moveTo(centerX - eyeOffset, headY - 5); ctx.lineTo(centerX - eyeOffset, headY + 15);
        ctx.moveTo(centerX + eyeOffset - 10, headY + 5); ctx.lineTo(centerX + eyeOffset + 10, headY + 5);
        ctx.moveTo(centerX + eyeOffset, headY - 5); ctx.lineTo(centerX + eyeOffset, headY + 15);
        ctx.stroke(); ctx.shadowBlur = 0;
    } else {
        drawSolidEllipse(centerX - eyeOffset + 5, headY - 5, 6, 8, '#ffffff');
        drawSolidEllipse(centerX + eyeOffset + 5, headY - 5, 6, 8, '#ffffff');
    }

    ctx.strokeStyle = eyeColor; ctx.lineWidth = 4; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(centerX, headY + 30, 10, Math.PI, Math.PI * 2, false); ctx.stroke();

    ctx.globalAlpha = 0.8; 
    drawSolidEllipse(centerX - eyeOffset, headY + 45, 8, 25, tearColor);
    drawSolidEllipse(centerX + eyeOffset, headY + 45, 8, 25, tearColor);
    ctx.globalAlpha = 1.0; 
}


// ==========================================
// 6. ANIMAÇÃO WIKI
// ==========================================
function simulateWikiStream() {
    const streamVisual = document.getElementById('wiki-stream-visual');
    if (!streamVisual) return;
    
    streamVisual.innerHTML = '';
    
    for (let i = 0; i < 50; i++) {
        const bar = document.createElement('div');
        bar.className = 'stream-bar';
        bar.style.animationDelay = `${Math.random() * 2}s`;
        bar.style.transform = `scaleY(${0.2 + Math.random() * 0.8})`;
        streamVisual.appendChild(bar);
    }
}


// ==========================================
// INICIALIZAÇÃO GERAL
// ==========================================
window.onload = () => {
    initBreach();
    renderNode('start');
    updateImplants(); 
    updateVitalMonitor();
    simulateWikiStream();
};