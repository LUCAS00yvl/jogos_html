const canvas = document.getElementById('gameCanvas');
const menuCanvas = document.getElementById('menuCanvas');
const ctx = canvas.getContext('2d');
const menuCtx = menuCanvas.getContext('2d');

// Previne menu de contexto ao clicar com botão direito (M2)
canvas.addEventListener('contextmenu', e => e.preventDefault());

let STATE = 'MENU'; 
let currentStageIndex = 0;
const WORLD_WIDTH = 4000; 
const GRAVITY = 0.6;
const GROUND_HEIGHT = 80;

let camera = { x: 0, shake: 0 };
// Adicionadas as keys de habilidade
const keys = { left: false, right: false, jump: false, interact: false, m1: false, m2: false, shift: false, r: false };
const mouse = { x: 0, y: 0, worldX: 0, worldY: 0 };

let gameFrame = 0, gold = 0;
let gameTimeSeconds = 0, difficultyMultiplier = 1;
let dayNightCycle = 0;

const CLASSES = {
    commando: { name: 'Comando', color: '#ecf0f1', speed: 6, jumpPower: -11, maxHp: 110, damage: 12, critChance: 0.05, isMelee: false,
        skills: { m1: 15, m2: 120, shift: 240, r: 400 } }, // Tempos em frames (60 = 1 seg)
    huntress: { name: 'Caçadora', color: '#e74c3c', speed: 8.5, jumpPower: -12, maxHp: 90, damage: 15, critChance: 0.15, isMelee: false,
        skills: { m1: 20, m2: 180, shift: 180, r: 600 } },
    bandit: { name: 'Bandido', color: '#f1c40f', speed: 6.5, jumpPower: -11, maxHp: 100, damage: 25, critChance: 0.25, isMelee: false,
        skills: { m1: 30, m2: 240, shift: 300, r: 480 } },
    mercenary: { name: 'Mercenário', color: '#3498db', speed: 7.5, jumpPower: -12, maxHp: 130, damage: 35, critChance: 0.1, isMelee: true, jumpsMax: 3,
        skills: { m1: 20, m2: 180, shift: 240, r: 600 } }, 
    artificer: { name: 'Artífice', color: '#f39c12', speed: 5.5, jumpPower: -10, maxHp: 100, damage: 40, critChance: 0.0, isMelee: false, hover: true,
        skills: { m1: 35, m2: 300, shift: 300, r: 600 } }
};

let player = {
    x: 0, y: 100, width: 24, height: 44, vx: 0, vy: 0, isGrounded: false, facingRight: true, 
    hp: 100, invulnTimer: 0,
    // Estado de Cooldowns atuais
    cooldowns: { m1: 0, m2: 0, shift: 0, r: 0 },
    baseSkills: {}, // Guarda os tempos máximos da classe escolhida
    level: 1, xp: 0, maxXP: 50, jumpsMax: 2, jumpsLeft: 2, healOnKill: 0, items: [], blockChance: 0, crowbarBonus: 0, ukuleleChance: 0, missileChance: 0, explodeOnKill: 0
};

const STAGES = [
    { name: "Titanic Plains", bgTop: '#8cb8d8', bgBot: '#d8e5ee', ground: '#5c7a6b', dirt: '#3e5248', obj: '#8c9891', enemies: ['lemurian', 'golem'] },
    { name: "Abyssal Depths", bgTop: '#3a1a1a', bgBot: '#1a0a0a', ground: '#5e2b2b', dirt: '#2e1515', obj: '#4a2525', enemies: ['lemurian', 'wisp'] },
    { name: "Distant Roost", bgTop: '#2c3e50', bgBot: '#182430', ground: '#7f8c8d', dirt: '#34495e', obj: '#bdc3c7', enemies: ['beetle', 'wisp'] }
];

let teleporter = { x: 0, y: 0, width: 100, height: 120, active: false, chargeProgress: 0, maxCharge: 100 };
let bossDefeated = false;

let bullets = [], enemies = [], enemyBullets = [], particles = [], chests = [], shrines = [], platforms = [], mountains = [];
let floatingTexts = [], drones = [], brokenDrones = []; 

let audioCtx; let isMusicPlaying = false; let musicInterval; let masterVolume = 0.3;

document.getElementById('vol-slider').addEventListener('input', (e) => { masterVolume = parseFloat(e.target.value); });
document.getElementById('crt-effect').addEventListener('change', (e) => { document.getElementById('crt-overlay').style.display = e.target.checked ? 'block' : 'none'; });

function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }
function playSynthNote(freq, type, duration, vol) {
    if(!audioCtx || audioCtx.state === 'suspended') return;
    const osc = audioCtx.createOscillator(); const gainNode = audioCtx.createGain();
    osc.type = type; osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(vol * masterVolume, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration);
    osc.connect(gainNode); gainNode.connect(audioCtx.destination);
    osc.start(); osc.stop(audioCtx.currentTime + duration);
}

function startGenerativeMusic() {
    initAudio(); if(isMusicPlaying) return; isMusicPlaying = true;
    const scale = [164.81, 196.00, 220.00, 246.94, 293.66, 329.63, 392.00, 440.00]; let step = 0;
    musicInterval = setInterval(() => {
        if(STATE !== 'PLAYING') return;
        if(step % 8 === 0) playSynthNote(82.41, 'triangle', 1.5, 0.4); 
        if(Math.random() > 0.4) playSynthNote(scale[Math.floor(Math.random() * scale.length)], 'sine', 0.5, 0.2);
        if(step % 4 === 0) playSynthNote(1200, 'square', 0.05, 0.05);
        step++;
    }, 250);
}
function stopGenerativeMusic() { isMusicPlaying = false; clearInterval(musicInterval); }
function toggleAudio() {
    initAudio(); const btn = document.getElementById('audio-toggle');
    if (isMusicPlaying) { stopGenerativeMusic(); if(btn) btn.innerText = "🔇"; } 
    else { startGenerativeMusic(); if(btn) btn.innerText = "🔊"; }
}

function showScreen(id) { document.querySelectorAll('.screen').forEach(s => s.classList.remove('active')); document.getElementById(id).classList.add('active'); }

function initMenu() {
    STATE = 'MENU'; resize();
    setInterval(() => {
        if(STATE !== 'MENU') return;
        menuCtx.fillStyle = '#111'; menuCtx.fillRect(0, 0, menuCanvas.width, menuCanvas.height);
        menuCtx.fillStyle = 'rgba(255,255,255,0.1)';
        for(let i=0; i<100; i++) {
            let x = (Math.sin(Date.now() / 2000 + i) * 200) + menuCanvas.width/2 + (i*50 - 2500);
            let y = (Math.cos(Date.now() / 1500 + i) * 100) + menuCanvas.height/2;
            menuCtx.beginPath(); menuCtx.arc(x, y, (i%5)+1, 0, Math.PI*2); menuCtx.fill();
        }
    }, 1000/30);
}

function startGame(classId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById('ui').style.display = 'block';
    canvas.style.display = 'block'; 
    
    let audioBtn = document.getElementById('audio-toggle');
    if (audioBtn) audioBtn.style.display = 'block';
    
    const c = CLASSES[classId]; Object.assign(player, c);
    player.hp = player.maxHp; player.jumpsLeft = player.jumpsMax;
    player.baseSkills = c.skills; // Salva os tempos base
    player.cooldowns = { m1: 0, m2: 0, shift: 0, r: 0 }; // Reseta
    
    document.getElementById('class-text').innerText = c.name.toUpperCase();
    document.getElementById('hp-text').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;

    gameTimeSeconds = 0; player.level = 1; player.xp = 0; gold = 0; 
    currentStageIndex = Math.floor(Math.random() * STAGES.length);
    
    bullets = []; enemies = []; enemyBullets = []; particles = []; floatingTexts = []; player.items = []; drones = [];
    document.getElementById('inventory-container').innerHTML = '';

    buildMap(); STATE = 'PLAYING'; startGenerativeMusic();
}

function togglePause() { if (STATE === 'PLAYING') { STATE = 'PAUSED'; showScreen('pause-menu'); } else if (STATE === 'PAUSED') { resumeGame(); } }
function resumeGame() { document.getElementById('pause-menu').classList.remove('active'); STATE = 'PLAYING'; }

// --- MAPEAMENTO DE INPUTS (PC E MOBILE) ---
window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; mouse.worldX = mouse.x + camera.x; mouse.worldY = mouse.y; });
window.addEventListener('mousedown', e => { if(e.button === 0) keys.m1 = true; if(e.button === 2) keys.m2 = true; });
window.addEventListener('mouseup', e => { if(e.button === 0) keys.m1 = false; if(e.button === 2) keys.m2 = false; });
window.addEventListener('keydown', (e) => {
    if (e.code === 'KeyA') keys.left = true; if (e.code === 'KeyD') keys.right = true;
    if (e.code === 'KeyW' || e.code === 'Space') { if(!keys.jump) player.jumpPressed = true; keys.jump = true; }
    if (e.code === 'KeyE') keys.interact = true;
    if (e.code === 'ShiftLeft') keys.shift = true;
    if (e.code === 'KeyR') keys.r = true;
    if (e.code === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
    if (e.code === 'KeyA') keys.left = false; if (e.code === 'KeyD') keys.right = false;
    if (e.code === 'KeyW' || e.code === 'Space') keys.jump = false;
    if (e.code === 'KeyE') keys.interact = false;
    if (e.code === 'ShiftLeft') keys.shift = false;
    if (e.code === 'KeyR') keys.r = false;
});

function setupMobileBtn(id, keyName) {
    const btn = document.getElementById(id); if(!btn) return;
    const press = (e) => { e.preventDefault(); keys[keyName] = true; btn.style.transform = "scale(0.9)"; };
    const release = (e) => { e.preventDefault(); keys[keyName] = false; btn.style.transform = "scale(1)"; };
    btn.addEventListener('touchstart', press, {passive: false}); btn.addEventListener('touchend', release);
    btn.addEventListener('mousedown', press); btn.addEventListener('mouseup', release); btn.addEventListener('mouseleave', release);
}
setupMobileBtn('btn-left', 'left'); setupMobileBtn('btn-right', 'right');
setupMobileBtn('btn-jump', 'jump'); setupMobileBtn('btn-interact', 'interact');
setupMobileBtn('btn-m1', 'm1'); setupMobileBtn('btn-m2', 'm2');
setupMobileBtn('btn-shift', 'shift'); setupMobileBtn('btn-r', 'r');

function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; menuCanvas.width = window.innerWidth; menuCanvas.height = window.innerHeight; }
window.addEventListener('resize', resize);

function buildMap() {
    platforms.length = 0; mountains.length = 0; chests.length = 0; shrines.length = 0; brokenDrones.length = 0;
    for (let i = 0; i < WORLD_WIDTH / 250; i++) {
        platforms.push({ x: 50 + i * 350 + Math.random()*200, y: canvas.height - 120 - Math.random()*150, w: 100 + Math.random()*250, h: 30 });
        mountains.push({ x: Math.random() * WORLD_WIDTH, w: 300 + Math.random() * 600, h: 100 + Math.random() * 500 });
    }
    teleporter = { x: WORLD_WIDTH - 1200 + Math.random()*800, y: canvas.height - GROUND_HEIGHT - 120, width: 80, height: 120, active: false, chargeProgress: 0, maxCharge: 100 };
    bossDefeated = false;
    for(let i=0; i<8; i++) chests.push({ x: Math.random() * (WORLD_WIDTH-500) + 200, y: canvas.height - GROUND_HEIGHT - 25, w: 35, h: 25, cost: 25 + currentStageIndex * 20 });
    shrines.push({ x: 800 + Math.random() * 1000, y: canvas.height - GROUND_HEIGHT - 60, w: 40, h: 60, cost: 25, uses: 0 });
    for(let i=0; i<3; i++) brokenDrones.push({ x: 500 + Math.random() * (WORLD_WIDTH - 1000), y: canvas.height - GROUND_HEIGHT - 15, w: 20, h: 15, cost: 35 + currentStageIndex * 20 });
    player.x = 200; player.y = 100;
}

function nextStage() { currentStageIndex = (currentStageIndex + 1) % STAGES.length; buildMap(); enemies = []; bullets = []; enemyBullets = []; addFloatingText(player.x, player.y - 50, "STAGE CLEARED", "#2ecc71"); }
function triggerShake(intensity) { camera.shake = intensity; }
function addFloatingText(x, y, text, color, isCrit = false) { floatingTexts.push({ x: x, y: y, text: text, color: color, life: 40, vy: -1.5, isCrit: isCrit }); }
function createParticles(x, y, color, count = 5, speedMod = 1) { for(let i=0; i<count; i++) particles.push({ x: x, y: y, vx: (Math.random() - 0.5) * 10 * speedMod, vy: (Math.random() - 0.5) * 10 * speedMod, life: 20 + Math.random() * 20, color: color }); }
function checkCollision(r1, r2) { return (r1.x < r2.x + r2.w && r1.x + r1.w > r2.x && r1.y < r2.y + r2.h && r1.y + r1.h > r2.y); }

function spawnEnemy() {
    let stageEnemies = STAGES[currentStageIndex].enemies;
    let type = stageEnemies[Math.floor(Math.random() * stageEnemies.length)];
    const isElite = Math.random() > 0.85; const eliteType = isElite ? (Math.random() > 0.5 ? 'fire' : 'lightning') : 'none';
    let hp, w, h, vx, damage, reward, xp;
    if (type === 'golem') { hp = 60; w = 40; h = 60; vx = 0.8; damage = 20; reward = 25; xp = 15; } 
    else if (type === 'wisp') { hp = 15; w = 25; h = 25; vx = 2; damage = 8; reward = 10; xp = 8; }
    else if (type === 'beetle') { hp = 30; w = 30; h = 20; vx = 3.5; damage = 12; reward = 8; xp = 5; } 
    else { hp = 25; w = 25; h = 35; vx = 2; damage = 10; reward = 10; xp = 10; } 
    hp = hp * difficultyMultiplier * (isElite ? 3 : 1); damage = damage * difficultyMultiplier * (isElite ? 2 : 1);
    const side = Math.random() > 0.5 ? 1 : -1;
    enemies.push({ x: camera.x + (side === 1 ? canvas.width + 100 : -100), y: type === 'wisp' ? canvas.height/2 - 100 + Math.random()*150 : canvas.height - GROUND_HEIGHT - h, w: w, h: h, vx: side * -vx, vy: 0, hp: hp, maxHp: hp, type: type, attackTimer: 0, isElite: isElite, eliteType: eliteType, damage: damage, reward: reward * (isElite ? 3 : 1), xp: xp * (isElite ? 2 : 1) });
}

function gainXP(amount) {
    player.xp += amount; addFloatingText(player.x, player.y - 20, `+${amount} XP`, '#9b59b6');
    if (player.xp >= player.maxXP) {
        player.level++; player.xp -= player.maxXP; player.maxXP = Math.floor(player.maxXP * 1.5);
        player.maxHp += 20; player.hp = player.maxHp; player.damage += 2;
        document.getElementById('lvl-display').innerText = player.level;
        addFloatingText(player.x - 10, player.y - 40, "LEVEL UP!", '#f1c40f', true);
        triggerShake(5); createParticles(player.x, player.y, '#f1c40f', 30, 2); playSynthNote(440, 'sine', 0.5, 0.5); 
    }
    document.getElementById('xp-bar').style.width = (player.xp/player.maxXP)*100 + '%';
    document.getElementById('hp-text').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('hp-bar').style.width = (player.hp/player.maxHp)*100 + '%';
}
function heal(amt) {
    if(player.hp >= player.maxHp || amt <= 0) return;
    player.hp = Math.min(player.maxHp, player.hp + amt);
    document.getElementById('hp-text').innerText = `${Math.floor(player.hp)}/${player.maxHp}`;
    document.getElementById('hp-bar').style.width = (player.hp/player.maxHp)*100 + '%';
    createParticles(player.x + player.width/2, player.y, '#2ecc71', 5);
}
function handleKill(e, isLightsOut = false) {
    gold += e.reward; document.getElementById('gold-display').innerText = `$${gold}`;
    gainXP(e.xp); heal(player.healOnKill);
    if(e.type === 'boss') bossDefeated = true;
    createParticles(e.x+e.w/2, e.y+e.h/2, e.type==='boss'?'#f1c40f': (e.type==='beetle'?'#2ecc71':'#c0392b'), 25, 2, true); 
    
    // Mecânica do Bandido: Matar com R reseta os cooldowns
    if(isLightsOut) {
        player.cooldowns.m1 = 0; player.cooldowns.m2 = 0; player.cooldowns.shift = 0;
        addFloatingText(player.x, player.y - 30, "RESET!", "#f1c40f", true);
        playSynthNote(800, 'square', 0.2, 0.3);
    }
}

const ITEM_POOL = [
    { name: "Seringa", color: "#e67e22", apply: () => player.baseSkills.m1 = Math.max(3, player.baseSkills.m1 * 0.85) }, // Aumenta ataque M1
    { name: "Pata de Cabra", color: "#bdc3c7", apply: () => player.speed += 1.0 },
    { name: "Óculos", color: "#e74c3c", apply: () => player.critChance += 0.1 },
    { name: "Dente", color: "#2ecc71", apply: () => player.healOnKill += 5 },
    { name: "Pena", color: "#3498db", apply: () => { player.jumpsMax++; player.jumpsLeft++; } },
    { name: "Ursinho", color: "#e84393", apply: () => player.blockChance += 0.10 },
    { name: "Pé-de-cabra", color: "#7f8c8d", apply: () => player.crowbarBonus += 0.5 },
    { name: "Ukulele", color: "#8e44ad", apply: () => player.ukuleleChance += 0.2 },
    { name: "Míssil", color: "#f39c12", apply: () => player.missileChance += 0.1 }
];

function grantItem() {
    if(ITEM_POOL.length === 0) return;
    const item = ITEM_POOL[Math.floor(Math.random() * ITEM_POOL.length)]; item.apply(); player.items.push(item);
    const inv = document.getElementById('inventory-container'); 
    const icon = document.createElement('div'); icon.className = 'item-icon'; icon.style.backgroundColor = item.color; icon.title = item.name; 
    inv.appendChild(icon); createParticles(player.x, player.y, item.color, 30, 1.5); playSynthNote(880, 'square', 0.1, 0.2);
}
function procUkulele(startX, startY) { if (Math.random() > player.ukuleleChance) return; enemies.forEach(e => { if (Math.abs(e.x - startX) < 150 && Math.abs(e.y - startY) < 150) { let dmg = player.damage * 0.8; e.hp -= dmg; createParticles(e.x + e.w/2, e.y + e.h/2, '#8e44ad', 5); addFloatingText(e.x, e.y, Math.floor(dmg), '#8e44ad'); } }); }
function procMissile() { if (Math.random() > player.missileChance || enemies.length === 0) return; let target = enemies[0]; bullets.push({ x: player.x, y: player.y - 20, w: 10, h: 10, vx: (target.x > player.x ? 5 : -5), vy: -5, damage: player.damage * 3, isCrit: false, isMissile: true, target: target }); }

function takeDamage(amt) {
    if (player.invulnTimer > 0) return;
    if (Math.random() < player.blockChance) { addFloatingText(player.x, player.y, "BLOCK", '#e84393'); return; }
    player.hp -= amt; player.invulnTimer = 30; triggerShake(10);
    document.getElementById('hp-text').innerText = `${Math.max(0, Math.floor(player.hp))}/${player.maxHp}`;
    document.getElementById('hp-bar').style.width = Math.max(0, (player.hp/player.maxHp)*100) + '%';
    createParticles(player.x, player.y, '#e74c3c', 15, 2); playSynthNote(100, 'sawtooth', 0.2, 0.5); 
    if (player.hp <= 0) { STATE = 'GAMEOVER'; document.getElementById('game-over').classList.add('active'); document.getElementById('final-time').innerText = document.getElementById('time-display').innerText;}
}

setInterval(() => {
    if (STATE !== 'PLAYING') return;
    gameTimeSeconds++;
    let m = Math.floor(gameTimeSeconds / 60).toString().padStart(2, '0');
    let s = (gameTimeSeconds % 60).toString().padStart(2, '0');
    document.getElementById('time-display').innerText = `${m}:${s}`;
    
    dayNightCycle = (Math.sin((gameTimeSeconds / 180) * Math.PI - Math.PI/2) + 1) / 2;
    difficultyMultiplier = 1 + (gameTimeSeconds / 60) + (currentStageIndex * 0.5); 
    
    let diffLevels = ["Fácil", "Médio", "Difícil", "Insano", "HAHAHA"];
    let diffIndex = Math.min(Math.floor(gameTimeSeconds / 90), diffLevels.length - 1);
    document.getElementById('diff-text').innerText = diffLevels[diffIndex];
    document.getElementById('diff-fill').style.width = Math.min((gameTimeSeconds / (90 * 5)) * 100, 100) + '%';
    
    if (teleporter.active && teleporter.chargeProgress < teleporter.maxCharge) {
        teleporter.chargeProgress += (100 / 90); 
        if (teleporter.chargeProgress >= teleporter.maxCharge) teleporter.chargeProgress = teleporter.maxCharge;
    }
}, 1000);

// --- SISTEMA DE HABILIDADES (EXECUÇÃO) ---
function executeSkill(type, angle) {
    player.cooldowns[type] = player.baseSkills[type]; // Inicia o cooldown
    triggerShake(2);

    // M1 (Ataque Básico)
    if (type === 'm1') {
        if (player.isMelee) { 
            let reach = 60; let hitBox = { x: player.x + (player.facingRight ? 0 : -reach), y: player.y - 20, w: reach + player.width, h: player.height + 40 };
            enemies.forEach(e => { if(checkCollision(hitBox, e)) { e.hp -= player.damage; createParticles(e.x, e.y, '#fff', 5); addFloatingText(e.x, e.y, player.damage, '#fff'); } });
            player.vx += Math.cos(angle) * 10; 
        } else { 
            bullets.push({ x: player.x + 12, y: player.y + 20, w: player.hover ? 16 : 8, h: player.hover ? 16 : 4, vx: Math.cos(angle) * 25, vy: Math.sin(angle) * 25, damage: player.damage, isCrit: Math.random() < player.critChance });
            player.vx -= Math.cos(angle) * 3; 
        }
        playSynthNote(600, 'square', 0.05, 0.05); 
    }
    
    // M2 (Ataque Forte/Especial)
    if (type === 'm2') {
        bullets.push({ x: player.x + 12, y: player.y + 15, w: 20, h: 20, vx: Math.cos(angle) * 15, vy: Math.sin(angle) * 15, damage: player.damage * 3, isCrit: Math.random() < player.critChance, piercing: true });
        player.vx -= Math.cos(angle) * 8; triggerShake(5); playSynthNote(400, 'sawtooth', 0.2, 0.2);
    }

    // SHIFT (Mobilidade / Esquiva)
    if (type === 'shift') {
        player.invulnTimer = 20; // Fica invulnerável por 1/3 seg
        player.vy = -5; // Pulo leve
        player.vx = player.facingRight ? 25 : -25; // Dash rápido
        createParticles(player.x, player.y, '#3498db', 20, 2);
        playSynthNote(800, 'sine', 0.3, 0.1);
    }

    // R (Ultimate)
    if (type === 'r') {
        triggerShake(15); playSynthNote(200, 'square', 0.5, 0.3);
        // Dispara 5 projéteis explosivos
        for(let i=-2; i<=2; i++) {
            let spreadAngle = angle + (i * 0.2);
            bullets.push({ x: player.x + 12, y: player.y + 20, w: 15, h: 15, vx: Math.cos(spreadAngle) * 20, vy: Math.sin(spreadAngle) * 20, damage: player.damage * 5, isCrit: true, isLightsOut: player.name === 'Bandido' });
        }
    }
}

function updateCooldownsUI() {
    ['m1', 'm2', 'shift', 'r'].forEach(key => {
        if(player.cooldowns[key] > 0) player.cooldowns[key]--;
        
        let box = document.getElementById(`skill-${key}`);
        if(player.cooldowns[key] > 0) {
            box.classList.add('cooldown');
            box.innerText = Math.ceil(player.cooldowns[key] / 60); // Mostra segundos restantes
        } else {
            box.classList.remove('cooldown');
            box.innerText = key.toUpperCase();
        }
    });
}

function update() {
    if (STATE !== 'PLAYING') return;
    if (camera.shake > 0) camera.shake *= 0.9;

    let targetCamX = player.x - canvas.width / 2;
    camera.x += (targetCamX - camera.x) * 0.1;
    if(camera.x < 0) camera.x = 0; if(camera.x > WORLD_WIDTH - canvas.width) camera.x = WORLD_WIDTH - canvas.width;

    let promptEl = document.getElementById('interaction-prompt'); let canInteract = false;

    if (Math.abs((player.x) - (teleporter.x)) < 120) {
        canInteract = true;
        if (!teleporter.active) {
            promptEl.innerText = "[E] ACTIVATE TELEPORTER";
            if (keys.interact) { teleporter.active = true; enemies.push({ x: teleporter.x, y: canvas.height - GROUND_HEIGHT - 120, w: 80, h: 120, vx: -1, vy: 0, hp: 1500 * difficultyMultiplier, maxHp: 1500 * difficultyMultiplier, type: 'boss', attackTimer: 0, damage: 40 * difficultyMultiplier, reward: 500, xp: 300 }); keys.interact = false; triggerShake(20); }
        } else if (teleporter.chargeProgress >= 100 && bossDefeated && enemies.length === 0) {
            promptEl.innerText = "[E] PROCEED TO NEXT STAGE";
            if (keys.interact) { nextStage(); keys.interact = false; }
        } else { promptEl.innerText = "CHARGING... SURVIVE!"; }
    }
    
    shrines.forEach(s => {
        if (Math.abs(player.x - s.x) < 60 && s.uses < 2) {
            canInteract = true; promptEl.innerText = `[E] OFFER TO SHRINE ($${s.cost})`;
            if (keys.interact && gold >= s.cost) {
                gold -= s.cost; document.getElementById('gold-display').innerText = `$${gold}`; s.cost = Math.floor(s.cost * 1.5);
                if(Math.random() > 0.4) { addFloatingText(s.x, s.y - 30, "REWARDED", "#2ecc71"); player.maxHp += 10; player.hp = player.maxHp; } else { addFloatingText(s.x, s.y - 30, "NOTHING", "#e74c3c"); }
                s.uses++; keys.interact = false; createParticles(s.x, s.y, '#8e44ad', 20);
            }
        }
    });

    for (let i = brokenDrones.length - 1; i >= 0; i--) {
        const d = brokenDrones[i];
        if (Math.abs(player.x - d.x) < 60) {
            canInteract = true; promptEl.innerText = `[E] REPAIR DRONE ($${d.cost})`;
            if (keys.interact && gold >= d.cost) {
                gold -= d.cost; document.getElementById('gold-display').innerText = `$${gold}`; drones.push({ x: d.x, y: d.y, vx: 0, vy: 0, shootTimer: 0 }); brokenDrones.splice(i, 1); createParticles(d.x, d.y, '#f1c40f', 15); keys.interact = false;
            }
        }
    }
    promptEl.style.display = canInteract ? 'block' : 'none';

    if (keys.left) { player.vx -= 1; player.facingRight = false; } else if (keys.right) { player.vx += 1; player.facingRight = true; } 
    player.vx *= 0.8; if(Math.abs(player.vx) > player.speed) player.vx = Math.sign(player.vx) * player.speed;
    if(player.isGrounded && Math.abs(player.vx) > 1 && gameFrame % 10 === 0) createParticles(player.x + 10, player.y + 40, '#7f8c8d', 1, 0.2); 

    // Lógica de Mira Adaptativa (Mouse ou Botão Mobile)
    let aimAngle;
    if (window.matchMedia("(pointer: fine)").matches) { // Se for PC
        if(mouse.worldX > player.x) player.facingRight = true; else player.facingRight = false;
        aimAngle = Math.atan2(mouse.y - (player.y + 20), mouse.worldX - (player.x + 12));
    } else { // Mobile (Atira reto baseado em pra onde está andando)
        aimAngle = player.facingRight ? 0 : Math.PI;
    }

    if (player.hover && keys.jump && !player.isGrounded) { player.vy = 1; }
    else if (keys.jump && player.jumpPressed && player.jumpsLeft > 0) { player.vy = player.jumpPower; player.isGrounded = false; player.jumpsLeft--; player.jumpPressed = false; createParticles(player.x + 12, player.y + 44, '#fff', 8, 0.5); }
    if (!keys.jump) player.jumpPressed = true;

    // GESTÃO DE COOLDOWNS E HABILIDADES
    updateCooldownsUI();
    if (keys.m1 && player.cooldowns.m1 <= 0) executeSkill('m1', aimAngle);
    if (keys.m2 && player.cooldowns.m2 <= 0) executeSkill('m2', aimAngle);
    if (keys.shift && player.cooldowns.shift <= 0) executeSkill('shift', aimAngle);
    if (keys.r && player.cooldowns.r <= 0) executeSkill('r', aimAngle);

    player.vy += GRAVITY; player.x += player.vx; player.y += player.vy; player.isGrounded = false;
    const floorY = canvas.height - GROUND_HEIGHT;
    if (player.y + player.height >= floorY) { player.y = floorY - player.height; player.vy = 0; player.isGrounded = true; player.jumpsLeft = player.jumpsMax; }
    platforms.forEach(p => { if (player.vy > 0 && player.y + player.height - player.vy <= p.y + 1 && player.y + player.height >= p.y && player.x + player.width > p.x && player.x < p.x + p.w) { player.y = p.y - player.height; player.vy = 0; player.isGrounded = true; player.jumpsLeft = player.jumpsMax; } });

    if (player.x < 0) player.x = 0; if (player.x + player.width > WORLD_WIDTH) player.x = WORLD_WIDTH - player.width;
    if (player.invulnTimer > 0) player.invulnTimer--;

    drones.forEach((d, idx) => {
        let targetX = player.x + (idx % 2 === 0 ? -40 : 40) + player.width/2; let targetY = player.y - 40 - (Math.floor(idx/2) * 30);
        d.vx += (targetX - d.x) * 0.05; d.vy += (targetY - d.y) * 0.05; d.vx *= 0.8; d.vy *= 0.8; d.x += d.vx; d.y += d.vy;
        d.shootTimer--;
        if(d.shootTimer <= 0 && enemies.length > 0) {
            let target = enemies[0];
            if(Math.hypot(target.x - d.x, target.y - d.y) < 500) {
                let angle = Math.atan2((target.y+target.h/2) - d.y, (target.x+target.w/2) - d.x);
                bullets.push({ x: d.x, y: d.y, w: 8, h: 4, vx: Math.cos(angle)*15, vy: Math.sin(angle)*15, damage: player.damage * 0.5, isCrit: false });
                d.shootTimer = 30; createParticles(d.x, d.y, '#f1c40f', 3, 0.5);
            }
        }
    });

    for (let i = chests.length - 1; i >= 0; i--) { if (checkCollision({x:player.x, y:player.y, w:player.width, h:player.height}, chests[i]) && gold >= chests[i].cost) { gold -= chests[i].cost; document.getElementById('gold-display').innerText = `$${gold}`; grantItem(); chests.splice(i, 1); } }

    for (let i = bullets.length - 1; i >= 0; i--) {
        const b = bullets[i]; 
        if(b.isMissile && b.target && b.target.hp > 0) { b.vx += (b.target.x - b.x) * 0.05; b.vy += (b.target.y - b.y) * 0.05; b.vx = Math.max(-10, Math.min(10, b.vx)); b.vy = Math.max(-10, Math.min(10, b.vy)); }
        b.x += b.vx; b.y += b.vy || 0;
        if (b.x < 0 || b.x > WORLD_WIDTH || b.y > canvas.height || b.y < 0) { bullets.splice(i, 1); continue; }

        let hit = false;
        for (let j = enemies.length - 1; j >= 0; j--) {
            const e = enemies[j];
            if (checkCollision(b, e)) {
                let dmg = b.isCrit ? b.damage * 2 : b.damage;
                if (e.hp / e.maxHp >= 0.9) dmg *= (1 + player.crowbarBonus);
                e.hp -= dmg; createParticles(b.x, b.y, b.isCrit ? '#ff0000' : '#ffffaa', 5);
                addFloatingText(e.x + Math.random()*20, e.y - 10, Math.floor(dmg), b.isCrit ? '#e74c3c' : '#fff', b.isCrit);
                hit = !b.piercing; // Se for piercing, o tiro continua!
                
                if(!b.isMissile && !b.isFireball) procMissile(); procUkulele(e.x, e.y);
                if (e.hp <= 0) { handleKill(e, b.isLightsOut); enemies.splice(j, 1); } else { e.x += b.vx > 0 ? 2 : -2; }
                if(hit) break;
            }
        }
        if (hit) bullets.splice(i, 1);
    }

    let spawnRate = Math.max(15, 120 - (gameTimeSeconds) - (teleporter.active ? 50 : 0)); 
    if (gameFrame % Math.floor(spawnRate) === 0 && enemies.length < 40) spawnEnemy();

    enemies.forEach(e => {
        if (e.type === 'lemurian' || e.type === 'boss' || e.type === 'golem' || e.type === 'beetle') {
            e.x += e.vx; if (e.x < player.x) e.vx = Math.abs(e.vx); else e.vx = -Math.abs(e.vx);
            if (checkCollision({x:player.x, y:player.y, w:player.width, h:player.height}, e)) takeDamage(e.damage);
            if(e.type === 'boss') { e.attackTimer++; if(e.attackTimer > 100 && Math.abs(e.x - player.x) < 200) { e.vy = -12; e.attackTimer = 0; } e.vy += GRAVITY; e.y += e.vy; if(e.y + e.h >= floorY) { if(e.vy > 5) triggerShake(10); e.y = floorY - e.h; e.vy = 0; } }
        } else if (e.type === 'wisp') {
            e.x += e.vx * 0.5; e.y += Math.sin(gameFrame * 0.05) * 1.5; if (e.x < player.x) e.vx = Math.abs(e.vx); else e.vx = -Math.abs(e.vx); e.attackTimer++;
            if (e.attackTimer > 120 && Math.abs(e.x - player.x) < 300) { enemyBullets.push({ x: e.x + e.w/2, y: e.y + e.h/2, w: 10, h: 10, vx: Math.cos(Math.atan2((player.y + player.height/2) - (e.y + e.h/2), (player.x + player.width/2) - (e.x + e.w/2))) * 5, vy: Math.sin(Math.atan2((player.y + player.height/2) - (e.y + e.h/2), (player.x + player.width/2) - (e.x + e.w/2))) * 5, damage: e.damage }); e.attackTimer = 0; }
        }
    });

    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        const eb = enemyBullets[i]; eb.x += eb.vx; eb.y += eb.vy;
        if (eb.x < 0 || eb.x > WORLD_WIDTH || eb.y > canvas.height) { enemyBullets.splice(i, 1); continue; }
        if (checkCollision({x: eb.x, y: eb.y, w: eb.w, h: eb.h}, {x: player.x, y: player.y, w: player.width, h: player.height})) { takeDamage(eb.damage); enemyBullets.splice(i, 1); }
    }

    for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.life--; if(p.isBlood) p.vy += GRAVITY; if (p.life <= 0) particles.splice(i, 1); }
    for (let i = floatingTexts.length - 1; i >= 0; i--) { const ft = floatingTexts[i]; ft.y += ft.vy; ft.life--; if (ft.life <= 0) floatingTexts.splice(i, 1); }
    gameFrame++;
}

function drawPlayer(ctx, p) {
    ctx.save(); ctx.translate(p.x + p.width/2, p.y + p.height/2); if (!p.facingRight) ctx.scale(-1, 1); 
    let w = p.width; let h = p.height; ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-w/2, h/2, w*0.8, 4); 
    let walkOffset = (p.isGrounded && Math.abs(p.vx) > 0.5) ? Math.sin(gameFrame * 0.3) * 5 : 0;
    
    if (p.name === 'Caçadora' || p.name === 'Artífice') { ctx.fillStyle = p.name === 'Caçadora' ? '#c0392b' : '#2c3e50'; let scarfSway = Math.sin(gameFrame * 0.1) * 5 - (p.vx * 2); ctx.beginPath(); ctx.moveTo(-w/2 + 5, -h/2 + 5); ctx.lineTo(-w - 10 + scarfSway, -h/2 + 15); ctx.lineTo(-w/2, 0); ctx.fill(); }
    ctx.fillStyle = '#111'; ctx.fillRect(-6 + walkOffset, 0, 6, h/2); ctx.fillRect(2 - walkOffset, 0, 6, h/2); 
    ctx.fillStyle = p.color; ctx.fillRect(-w/2, -h/2, w, h*0.6); 

    let aimAngle;
    if (window.matchMedia("(pointer: fine)").matches) { aimAngle = Math.atan2(mouse.y - (p.y+h/2), mouse.worldX - (p.x+w/2)); if(!p.facingRight) aimAngle = Math.PI - aimAngle; } 
    else { aimAngle = 0; }

    if (p.name === 'Comando') { ctx.fillStyle = '#e67e22'; ctx.shadowBlur = 15 * dayNightCycle; ctx.shadowColor = '#e67e22'; ctx.fillRect(4, -h/2 + 6, 8, 6); ctx.shadowBlur = 0; ctx.save(); ctx.rotate(aimAngle); ctx.fillStyle = '#555'; ctx.fillRect(0, -2, 16, 5); ctx.fillStyle = '#333'; ctx.fillRect(-5, 0, 10, 4); ctx.restore(); } 
    else if (p.name === 'Caçadora') { ctx.fillStyle = '#f1c40f'; ctx.fillRect(6, -h/2 + 8, 4, 4); ctx.save(); ctx.rotate(aimAngle); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(10, 0, 15, -Math.PI/2, Math.PI/2); ctx.stroke(); ctx.restore(); }
    else if (p.name === 'Bandido') { ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-18, -h/2 - 4, 36, 4); ctx.fillRect(-8, -h/2 - 10, 16, 10); ctx.save(); ctx.rotate(aimAngle); ctx.fillStyle = '#8e44ad'; ctx.fillRect(-5, -3, 25, 6); ctx.restore(); }
    else if (p.isMelee) { ctx.fillStyle = '#fff'; ctx.shadowBlur = 10; ctx.shadowColor = '#fff'; ctx.fillRect(2, -h/2 + 8, 12, 3); ctx.shadowBlur = 0; ctx.save(); ctx.rotate(-Math.PI/4); ctx.fillStyle = '#ecf0f1'; ctx.shadowBlur = 5; ctx.shadowColor = '#3498db'; ctx.fillRect(-10, -20, 4, 35); ctx.restore(); ctx.shadowBlur = 0; }
    else if (p.hover) { ctx.fillStyle = '#8e44ad'; ctx.fillRect(-w/2-2, -h/2-5, w+4, 10); ctx.fillStyle = '#f39c12'; ctx.shadowBlur = 15; ctx.shadowColor = '#f39c12'; let orbY = Math.sin(gameFrame * 0.1) * 5; ctx.beginPath(); ctx.arc(15, -10 + orbY, 4, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(-15, -5 - orbY, 3, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; }
    ctx.restore();
}

function drawEnemy(ctx, e) {
    ctx.save(); ctx.translate(e.x + e.w/2, e.y + e.h/2); if (!(e.vx > 0)) ctx.scale(-1, 1);
    if (e.isElite) { ctx.shadowBlur = 15; ctx.shadowColor = e.eliteType === 'fire' ? '#e74c3c' : '#3498db'; ctx.strokeStyle = ctx.shadowColor; ctx.lineWidth = 2; ctx.strokeRect(-e.w/2 - 2, -e.h/2 - 2, e.w + 4, e.h + 4); }
    if (e.type === 'lemurian') { ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.moveTo(-e.w/2, e.h/2); ctx.lineTo(-e.w/2 + 5, -e.h/2); ctx.lineTo(e.w/2, -e.h/2 + 10); ctx.lineTo(e.w/2, e.h/2); ctx.fill(); ctx.fillStyle = '#2c3e50'; ctx.fillRect(-e.w, e.h/2 - 5, e.w, 4); ctx.fillStyle = '#f1c40f'; ctx.shadowBlur = 10 * dayNightCycle; ctx.shadowColor = '#f1c40f'; ctx.fillRect(e.w/2 - 4, -e.h/2 + 4, 4, 4); ctx.shadowBlur = 0; } 
    else if (e.type === 'beetle') { ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.arc(0, 0, e.w/2, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#2c3e50'; ctx.fillRect(-e.w/2 + 5, 0, 4, 8); ctx.fillRect(e.w/2 - 9, 0, 4, 8); }
    else if (e.type === 'golem') { ctx.fillStyle = '#7f8c8d'; ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h); ctx.fillStyle = '#e74c3c'; ctx.shadowBlur = 20 * dayNightCycle; ctx.shadowColor = '#e74c3c'; ctx.beginPath(); ctx.arc(0, -e.h/2 + 15, 6, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur=0; }
    else if (e.type === 'wisp') { ctx.fillStyle = '#2ecc71'; ctx.beginPath(); ctx.arc(0, 0, e.w/2, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#27ae60'; ctx.beginPath(); ctx.moveTo(-e.w/2, 0); ctx.lineTo(0, -e.h); ctx.lineTo(e.w/2, 0); ctx.fill(); }
    else if (e.type === 'boss') { ctx.fillStyle = '#c0392b'; ctx.fillRect(-e.w/2, -e.h/2, e.w, e.h); ctx.fillStyle = '#111'; ctx.fillRect(-e.w/2 - 10, -e.h/2 - 10, e.w + 20, 20); }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; ctx.fillRect(e.x, e.y + e.h + 5, e.w, 4); ctx.fillStyle = e.isElite ? (e.eliteType==='fire'?'#e74c3c':'#3498db') : '#e74c3c'; ctx.fillRect(e.x, e.y + e.h + 5, e.w * (e.hp / e.maxHp), 4);
}

function draw() {
    if(STATE !== 'PLAYING') return;
    let stage = STAGES[currentStageIndex];
    const bgGrad = ctx.createLinearGradient(0, 0, 0, canvas.height); bgGrad.addColorStop(0, stage.bgTop); bgGrad.addColorStop(1, stage.bgBot); ctx.fillStyle = bgGrad; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = `rgba(5, 5, 15, ${dayNightCycle * 0.6})`; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.save(); let shakeX = (Math.random() - 0.5) * camera.shake; let shakeY = (Math.random() - 0.5) * camera.shake; ctx.translate(-camera.x + shakeX, shakeY); 
    ctx.fillStyle = stage.dirt; mountains.forEach(m => { ctx.beginPath(); ctx.moveTo(m.x + camera.x*0.9, canvas.height - GROUND_HEIGHT); ctx.lineTo(m.x + camera.x*0.9 + m.w/2, canvas.height - GROUND_HEIGHT - m.h); ctx.lineTo(m.x + camera.x*0.9 + m.w, canvas.height - GROUND_HEIGHT); ctx.fill(); }); ctx.fillStyle = `rgba(0, 0, 0, ${dayNightCycle * 0.4})`; ctx.fillRect(camera.x, 0, canvas.width, canvas.height);
    ctx.fillStyle = stage.dirt; platforms.forEach(p => { ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = stage.ground; ctx.fillRect(p.x, p.y, p.w, 6); ctx.fillStyle = stage.dirt; }); ctx.fillRect(0, canvas.height - GROUND_HEIGHT, WORLD_WIDTH, GROUND_HEIGHT); ctx.fillStyle = stage.ground; ctx.fillRect(0, canvas.height - GROUND_HEIGHT, WORLD_WIDTH, 8);
    shrines.forEach(s => { ctx.fillStyle = '#2c3e50'; ctx.beginPath(); ctx.moveTo(s.x, s.y+s.h); ctx.lineTo(s.x+s.w/2, s.y); ctx.lineTo(s.x+s.w, s.y+s.h); ctx.fill(); ctx.fillStyle = '#8e44ad'; ctx.shadowBlur = 10 * dayNightCycle; ctx.shadowColor = '#8e44ad'; ctx.beginPath(); ctx.arc(s.x+s.w/2, s.y+20, 5, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0; });
    ctx.fillStyle = stage.obj; ctx.fillRect(teleporter.x, teleporter.y + 100, teleporter.width, 20); ctx.fillStyle = teleporter.active ? '#e74c3c' : '#7f8c8d'; ctx.fillRect(teleporter.x + 10, teleporter.y, 15, 100); ctx.fillRect(teleporter.x + teleporter.width-25, teleporter.y, 15, 100); ctx.shadowBlur = teleporter.active ? 40 : (20 * dayNightCycle); ctx.shadowColor = '#e74c3c'; ctx.beginPath(); ctx.arc(teleporter.x + teleporter.width/2, teleporter.y + 50, 20, 0, Math.PI*2); ctx.fill(); ctx.shadowBlur = 0;
    chests.forEach(c => { ctx.fillStyle = '#8e44ad'; ctx.fillRect(c.x, c.y, c.w, c.h); ctx.fillStyle = '#f1c40f'; ctx.fillRect(c.x + c.w/2 - 4, c.y + c.h/2 - 2, 8, 6); });
    brokenDrones.forEach(d => { ctx.fillStyle = '#7f8c8d'; ctx.fillRect(d.x, d.y, d.w, d.h); ctx.fillStyle = '#f1c40f'; ctx.shadowBlur = 10 * dayNightCycle; ctx.shadowColor = '#f1c40f'; ctx.fillRect(d.x + 2, d.y + 2, 4, 4); ctx.shadowBlur = 0; });
    drones.forEach(d => { ctx.fillStyle = '#bdc3c7'; ctx.beginPath(); ctx.arc(d.x, d.y, 8, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#f1c40f'; ctx.fillRect(d.x + (player.facingRight ? 4 : -6), d.y - 2, 4, 4);  });

    ctx.globalCompositeOperation = 'lighter'; particles.forEach(p => { ctx.globalCompositeOperation = p.isBlood ? 'source-over' : 'lighter'; ctx.fillStyle = p.color; ctx.globalAlpha = Math.max(0, p.life / 40); ctx.beginPath(); ctx.arc(p.x, p.y, p.isBlood ? 4 : 2, 0, Math.PI*2); ctx.fill(); }); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; 
    bullets.forEach(b => { ctx.save(); ctx.translate(b.x, b.y); ctx.rotate(Math.atan2(b.vy, b.vx)); ctx.shadowBlur = b.isCrit ? 20 : 10; ctx.shadowColor = b.isCrit ? '#ff0000' : '#f1c40f'; ctx.fillStyle = b.isCrit ? '#e74c3c' : '#fff'; if(b.isFireball) { ctx.beginPath(); ctx.arc(0, 0, b.w/2, 0, Math.PI*2); ctx.fill(); } else { ctx.fillRect(-b.w/2, -b.h/2, b.w, b.h); } ctx.restore(); });
    enemies.forEach(e => drawEnemy(ctx, e)); if (player.invulnTimer % 8 < 4) drawPlayer(ctx, player);
    floatingTexts.forEach(ft => { ctx.globalAlpha = Math.max(0, ft.life / 40); ctx.fillStyle = ft.color; ctx.font = ft.isCrit ? "bold 30px 'Teko'" : "20px 'Teko'"; ctx.fillText(ft.text, ft.x, ft.y); }); ctx.globalAlpha = 1; ctx.restore(); 
}

function loop() { if(STATE === 'PLAYING') { update(); draw(); } requestAnimationFrame(loop); }
initMenu(); loop();