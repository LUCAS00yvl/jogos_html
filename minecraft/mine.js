// SINTETIZADOR DE ÁUDIO WEB AUDIO API
class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playBreak() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(30, this.ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.1);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playPlace() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(180, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playHurt() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(60, this.ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.5, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.25);
    }

    playPickup() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.08);
        gain.gain.setValueAtTime(0.25, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.08);
    }

    playXP() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.12);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.12);
    }

    playExplosion() {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(20, this.ctx.currentTime + 0.5);
        gain.gain.setValueAtTime(0.8, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + 0.5);
    }
}

const audio = new SoundEngine();

// DEFINIÇÕES E CONSTANTES
const BLOCK_SIZE = 32;
const WORLD_WIDTH = 250;
const WORLD_HEIGHT = 100;

const BLOCKS = {
    0: { id: 0, name: 'Ar', color: null, solid: false, transparent: true },
    1: { id: 1, name: 'Bloco de Grama', color: '#5b8731', topColor: '#71aa34', solid: true, hardness: 1.0 },
    2: { id: 2, name: 'Terra', color: '#7a5a3b', solid: true, hardness: 0.8 },
    3: { id: 3, name: 'Pedra', color: '#7d7d7d', solid: true, hardness: 2.2, drop: 8 },
    4: { id: 4, name: 'Tronco de Madeira', color: '#5c4033', sideColor: '#4a332a', solid: true, hardness: 1.2 },
    5: { id: 5, name: 'Folhas', color: '#397a2b', solid: true, transparent: true, hardness: 0.3 },
    6: { id: 6, name: 'Rocha Matriz', color: '#1a1a1a', solid: true, hardness: Infinity },
    7: { id: 7, name: 'Tábua de Madeira', color: '#9c754d', solid: true, hardness: 1.0 },
    8: { id: 8, name: 'Pedregulho', color: '#616161', solid: true, hardness: 2.0 },
    9: { id: 9, name: 'Minério de Carvão', color: '#666666', spotColor: '#222222', solid: true, hardness: 2.5, dropItem: 'coal', xp: 2 },
    10: { id: 10, name: 'Minério de Ferro', color: '#6a6a6a', spotColor: '#d8af93', solid: true, hardness: 3.0, xp: 3 },
    11: { id: 11, name: 'Tocha', color: '#ffcc00', solid: false, transparent: true, light: 14 },
    12: { id: 12, name: 'Minério de Ouro', color: '#6a6a6a', spotColor: '#ffea00', solid: true, hardness: 3.5, dropItem: 'gold_ingot', xp: 5 },
    13: { id: 13, name: 'Minério de Diamante', color: '#6a6a6a', spotColor: '#00ffff', solid: true, hardness: 4.5, dropItem: 'diamond', xp: 10 },
    14: { id: 14, name: 'Areia', color: '#d6c585', solid: true, hardness: 0.6 },
    15: { id: 15, name: 'Vidro', color: 'rgba(200, 240, 255, 0.6)', solid: true, transparent: true, hardness: 0.4 }
};

const ITEMS = {
    'coal': { name: 'Carvão', color: '#222222' },
    'gold_ingot': { name: 'Barra de Ouro', color: '#ffea00' },
    'diamond': { name: 'Diamante', color: '#00ffff' },
    'raw_pork': { name: 'Carne de Porco Crua', color: '#ff9999', food: 4 },
    'stick': { name: 'Vara de Madeira', color: '#8c6747' },
    'wooden_pickaxe': { name: 'Picareta de Madeira', color: '#9c754d', toolPower: 2.0 },
    'stone_pickaxe': { name: 'Picareta de Pedra', color: '#616161', toolPower: 3.5 },
    'diamond_pickaxe': { name: 'Picareta de Diamante', color: '#00ffff', toolPower: 8.0 },
    'sword': { name: 'Espada de Pedra', color: '#7d7d7d', damage: 6 },
    'diamond_sword': { name: 'Espada de Diamante', color: '#00ffff', damage: 12 }
};

const CRAFTING_RECIPES = [
    { name: 'Tábuas (x4)', inputs: [{ id: 4, count: 1 }], output: { id: 7, count: 4 } },
    { name: 'Vara de Madeira (x4)', inputs: [{ id: 7, count: 2 }], outputItem: { id: 'stick', count: 4 } },
    { name: 'Tochas (x4)', inputs: [{ id: 7, count: 1 }, { id: 'coal', count: 1 }], output: { id: 11, count: 4 } },
    { name: 'Vidro (x2)', inputs: [{ id: 14, count: 2 }, { id: 'coal', count: 1 }], output: { id: 15, count: 2 } },
    { name: 'Picareta de Madeira', inputs: [{ id: 7, count: 3 }, { id: 'stick', count: 2 }], outputItem: { id: 'wooden_pickaxe', count: 1 } },
    { name: 'Picareta de Pedra', inputs: [{ id: 8, count: 3 }, { id: 'stick', count: 2 }], outputItem: { id: 'stone_pickaxe', count: 1 } },
    { name: 'Picareta de Diamante', inputs: [{ id: 'diamond', count: 3 }, { id: 'stick', count: 2 }], outputItem: { id: 'diamond_pickaxe', count: 1 } },
    { name: 'Espada de Pedra', inputs: [{ id: 8, count: 2 }, { id: 'stick', count: 1 }], outputItem: { id: 'sword', count: 1 } },
    { name: 'Espada de Diamante', inputs: [{ id: 'diamond', count: 2 }, { id: 'stick', count: 1 }], outputItem: { id: 'diamond_sword', count: 1 } }
];

// ESTADO GLOBAL DO JOGO
let gameState = 'MENU';
let gameMode = 'survival';
let world = [];
let terrainSurfaceY = []; // Guarda o nível da superfície para cálculo de luz de cavernas
let keys = {};
let mouse = { x: 0, y: 0, leftDown: false, rightDown: false };
let camera = { x: 0, y: 0 };
let dayTime = 1000;
let screenShakeTimer = 0;
let screenShakeIntensity = 0;

// Sistema de Mineração
let miningTarget = null;
let miningProgress = 0;

// Mobs, Itens, Partículas, XP e Textos Flutuantes
let mobs = [];
let itemDrops = [];
let xpOrbs = [];
let particles = [];
let floatingTexts = [];
let stars = [];
let clouds = [];

// INVENTÁRIO
let inventory = new Array(36).fill(null);
let selectedSlot = 0;

// JOGADOR
const player = {
    x: 0,
    y: 0,
    width: BLOCK_SIZE * 0.7,
    height: BLOCK_SIZE * 1.8,
    vx: 0,
    vy: 0,
    speed: 4.5,
    jumpStrength: 8.5,
    gravity: 0.4,
    grounded: false,
    health: 20,
    maxHealth: 20,
    hunger: 20,
    hungerTimer: 0,
    invulnerableTimer: 0,
    color: '#3498db',
    swinging: false,
    swingTimer: 0,
    xp: 0,
    level: 0,
    xpToNextLevel: 10
};

// ELEMENTOS DE CÉU E PARALAXE
function initSkyElements() {
    stars = [];
    for (let i = 0; i < 80; i++) {
        stars.push({
            x: Math.random(),
            y: Math.random() * 0.5,
            size: Math.random() * 2 + 1,
            phase: Math.random() * Math.PI * 2,
            speed: 0.03 + Math.random() * 0.05
        });
    }

    clouds = [];
    for (let i = 0; i < 10; i++) {
        clouds.push({
            x: Math.random() * WORLD_WIDTH * BLOCK_SIZE,
            y: 40 + Math.random() * 120,
            width: 100 + Math.random() * 140,
            height: 30 + Math.random() * 20,
            speed: 0.3 + Math.random() * 0.4
        });
    }
}

// GERAÇÃO DO MUNDO
function generateWorld() {
    world = new Array(WORLD_HEIGHT).fill(0).map(() => new Array(WORLD_WIDTH).fill(0));
    terrainSurfaceY = new Array(WORLD_WIDTH).fill(0);
    
    let heights = [];
    let h = WORLD_HEIGHT / 2.2;
    for (let x = 0; x < WORLD_WIDTH; x++) {
        if (x % 4 === 0) h += (Math.random() * 6 - 3);
        h = Math.max(25, Math.min(WORLD_HEIGHT - 25, h));
        heights[x] = Math.floor(h);
    }

    for (let x = 0; x < WORLD_WIDTH; x++) {
        let sum = 0, count = 0;
        for (let i = -3; i <= 3; i++) {
            if (x + i >= 0 && x + i < WORLD_WIDTH) {
                sum += heights[x + i];
                count++;
            }
        }
        let surfaceY = Math.floor(sum / count);
        terrainSurfaceY[x] = surfaceY;

        for (let y = 0; y < WORLD_HEIGHT; y++) {
            if (y === WORLD_HEIGHT - 1) {
                world[y][x] = 6;
            } else if (y > surfaceY + 5) {
                let rand = Math.random();
                let depth = y - surfaceY;

                if (depth > 35 && rand < 0.012) world[y][x] = 13; // Minério de Diamante
                else if (depth > 20 && rand < 0.025) world[y][x] = 12; // Minério de Ouro
                else if (rand < 0.02) world[y][x] = 10; // Ferro
                else if (rand < 0.04) world[y][x] = 9;  // Carvão
                else world[y][x] = 3; // Pedra
            } else if (y > surfaceY) {
                if (y === surfaceY + 1 && Math.random() < 0.2) world[y][x] = 14; // Areia nas margens
                else world[y][x] = 2;
            } else if (y === surfaceY) {
                world[y][x] = 1;
                if (x > 5 && x < WORLD_WIDTH - 5 && Math.random() < 0.1) {
                    spawnTree(x, y - 1);
                }
            }
        }
    }
    initSkyElements();
}

function spawnTree(x, baseY) {
    let treeHeight = Math.floor(Math.random() * 2) + 4;
    for (let i = 0; i < treeHeight; i++) {
        if (baseY - i >= 0) world[baseY - i][x] = 4;
    }
    let leafY = baseY - treeHeight;
    for (let ly = -2; ly <= 1; ly++) {
        for (let lx = -2; lx <= 2; lx++) {
            if (Math.abs(lx) === 2 && Math.abs(ly) === 2) continue;
            let cx = x + lx, cy = leafY + ly;
            if (cx >= 0 && cx < WORLD_WIDTH && cy >= 0 && cy < WORLD_HEIGHT) {
                if (world[cy][cx] === 0) world[cy][cx] = 5;
            }
        }
    }
}

// SISTEMA DE PARTÍCULAS E EXP
class Particle {
    constructor(x, y, color, type = 'block') {
        this.x = x;
        this.y = y;
        this.color = color;
        this.type = type;
        this.size = type === 'block' ? (Math.random() * 4 + 2) : (Math.random() * 3 + 1);
        this.vx = (Math.random() - 0.5) * (type === 'block' ? 5 : 2);
        this.vy = type === 'block' ? (Math.random() * -4 - 1) : (Math.random() * -2 - 1);
        this.life = 1.0;
        this.decay = type === 'block' ? (0.02 + Math.random() * 0.03) : (0.015 + Math.random() * 0.02);
    }

    update() {
        if (this.type === 'block') this.vy += 0.25;
        this.x += this.vx;
        this.y += this.vy;
        this.life -= this.decay;
        return this.life <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camera.x, this.y - camera.y, this.size, this.size);
        ctx.restore();
    }
}

class XPOrb {
    constructor(x, y, amount) {
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.vy = -2;
        this.vx = (Math.random() - 0.5) * 2;
        this.bounce = Math.random() * Math.PI;
    }

    update() {
        this.vy += 0.15;
        this.x += this.vx;
        this.y += this.vy;
        this.bounce += 0.1;

        let bx = Math.floor(this.x / BLOCK_SIZE);
        let by = Math.floor((this.y + 6) / BLOCK_SIZE);
        if (by >= 0 && by < WORLD_HEIGHT && world[by][bx] !== 0 && BLOCKS[world[by][bx]].solid) {
            this.y = by * BLOCK_SIZE - 6;
            this.vy = 0;
            this.vx *= 0.5;
        }

        let dist = Math.hypot((player.x + player.width / 2) - this.x, (player.y + player.height / 2) - this.y);
        if (dist < BLOCK_SIZE * 3.5) {
            this.x += ((player.x + player.width / 2) - this.x) * 0.18;
            this.y += ((player.y + player.height / 2) - this.y) * 0.18;

            if (dist < BLOCK_SIZE * 0.8) {
                addXP(this.amount);
                audio.playXP();
                return true;
            }
        }
        return false;
    }

    draw(ctx) {
        let sx = this.x - camera.x;
        let sy = this.y - camera.y + Math.sin(this.bounce) * 2;
        ctx.fillStyle = '#55ff55';
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.vy = -1.2;
        this.life = 1.0;
    }

    update() {
        this.y += this.vy;
        this.life -= 0.02;
        return this.life <= 0;
    }

    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life);
        ctx.fillStyle = this.color;
        ctx.font = '10px "Press Start 2P"';
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 2;
        ctx.fillText(this.text, this.x - camera.x, this.y - camera.y);
        ctx.restore();
    }
}

function addXP(amount) {
    player.xp += amount;
    while (player.xp >= player.xpToNextLevel) {
        player.xp -= player.xpToNextLevel;
        player.level++;
        player.xpToNextLevel = Math.floor(player.xpToNextLevel * 1.5);
        floatingTexts.push(new FloatingText(player.x + player.width / 2, player.y - 20, `NÍVEL SUBIU! (${player.level})`, '#ffff55'));
    }
    updateHUD();
}

function spawnBlockParticles(bx, by, color) {
    let px = bx * BLOCK_SIZE + BLOCK_SIZE / 2;
    let py = by * BLOCK_SIZE + BLOCK_SIZE / 2;
    for (let i = 0; i < 10; i++) {
        particles.push(new Particle(px, py, color, 'block'));
    }
}

function triggerScreenShake(intensity = 6, duration = 12) {
    screenShakeIntensity = intensity;
    screenShakeTimer = duration;
}

// LÓGICA DO JOGADOR
function updatePlayer() {
    if (gameState !== 'PLAYING') return;

    if (player.swinging) {
        player.swingTimer += 0.2;
        if (player.swingTimer >= Math.PI) {
            player.swinging = false;
            player.swingTimer = 0;
        }
    }

    if (keys['a'] || keys['arrowleft']) player.vx = -player.speed;
    else if (keys['d'] || keys['arrowright']) player.vx = player.speed;
    else player.vx *= 0.7;

    player.x += player.vx;
    if (checkCollision(player.x, player.y)) {
        if (player.vx > 0) player.x = Math.floor((player.x + player.width) / BLOCK_SIZE) * BLOCK_SIZE - player.width - 0.1;
        else if (player.vx < 0) player.x = Math.floor(player.x / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE + 0.1;
        player.vx = 0;
    }

    if ((keys['w'] || keys['arrowup'] || keys[' ']) && player.grounded) {
        player.vy = -player.jumpStrength;
        player.grounded = false;
        if (gameMode === 'survival') player.hunger = Math.max(0, player.hunger - 0.05);
    }

    player.vy += player.gravity;
    if (player.vy > 16) player.vy = 16;

    player.y += player.vy;
    player.grounded = false;

    if (checkCollision(player.x, player.y)) {
        if (player.vy > 0) {
            player.y = Math.floor((player.y + player.height) / BLOCK_SIZE) * BLOCK_SIZE - player.height - 0.1;
            player.grounded = true;
        } else if (player.vy < 0) {
            player.y = Math.floor(player.y / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE + 0.1;
        }
        player.vy = 0;
    }

    if (player.invulnerableTimer > 0) player.invulnerableTimer--;

    if (gameMode === 'survival') {
        player.hungerTimer++;
        if (player.hungerTimer > 300) {
            player.hunger = Math.max(0, player.hunger - 0.5);
            player.hungerTimer = 0;
        }
        if (player.hunger >= 17 && player.health < player.maxHealth && Math.random() < 0.02) {
            player.health = Math.min(player.maxHealth, player.health + 1);
            player.hunger -= 0.5;
        }
        if (player.hunger <= 0 && Math.random() < 0.01) {
            damagePlayer(1, 'Fome');
        }
    }

    if (player.y > WORLD_HEIGHT * BLOCK_SIZE) {
        damagePlayer(100, 'Queda no Vazio');
    }
}

function checkCollision(x, y) {
    const left = x, right = x + player.width;
    const top = y, bottom = y + player.height;
    return isSolid(left, top) || isSolid(right, top) ||
           isSolid(left, bottom) || isSolid(right, bottom) ||
           isSolid(left, top + player.height / 2) || isSolid(right, top + player.height / 2);
}

function isSolid(x, y) {
    let bx = Math.floor(x / BLOCK_SIZE);
    let by = Math.floor(y / BLOCK_SIZE);
    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return true;
    return BLOCKS[world[by][bx]].solid;
}

function damagePlayer(amount, cause = 'Ataque') {
    if (player.invulnerableTimer > 0 || gameMode === 'creative') return;
    
    player.health -= amount;
    player.invulnerableTimer = 20;
    triggerScreenShake(8, 14);
    audio.playHurt();

    floatingTexts.push(new FloatingText(player.x + player.width / 2, player.y - 10, `-${amount}`, '#ff4444'));

    if (player.health <= 0) {
        player.health = 0;
        gameState = 'DEAD';
        document.getElementById('death-cause').innerText = `Causa da Morte: ${cause}`;
        document.getElementById('death-screen').classList.remove('hidden');
    }
    updateHUD();
}

// MOBS (ZUMBIS, PORCOS E CREEPERS)
class Mob {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.width = type === 'pig' ? BLOCK_SIZE * 0.9 : BLOCK_SIZE * 0.7;
        this.height = type === 'pig' ? BLOCK_SIZE * 0.9 : BLOCK_SIZE * 1.8;
        this.vx = 0;
        this.vy = 0;
        this.health = type === 'zombie' ? 20 : (type === 'creeper' ? 20 : 10);
        this.grounded = false;
        this.moveTimer = 0;
        this.damageFlash = 0;
        this.fuse = 60;
        this.isFusing = false;
    }

    update() {
        if (this.damageFlash > 0) this.damageFlash--;

        if (this.type === 'zombie') {
            let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            if (Math.abs(dx) < BLOCK_SIZE * 12) this.vx = dx > 0 ? 1.8 : -1.8;
            else this.vx = 0;

            if (Math.abs(dx) < BLOCK_SIZE * 0.8 && Math.abs(player.y - this.y) < BLOCK_SIZE * 1.5) {
                damagePlayer(3, 'Zumbi');
            }

            if (dayTime < 12000 && Math.random() < 0.02) this.health -= 1;
        } 
        else if (this.type === 'creeper') {
            let dx = (player.x + player.width / 2) - (this.x + this.width / 2);
            let dist = Math.hypot(dx, player.y - this.y);

            if (dist < BLOCK_SIZE * 1.8) {
                this.isFusing = true;
                this.vx = 0;
                this.fuse--;

                if (this.fuse <= 0) {
                    explodeCreeper(this.x + this.width / 2, this.y + this.height / 2);
                    return true;
                }
            } else if (dist < BLOCK_SIZE * 12) {
                this.isFusing = false;
                this.fuse = Math.min(60, this.fuse + 1);
                this.vx = dx > 0 ? 1.5 : -1.5;
            } else {
                this.isFusing = false;
                this.vx = 0;
            }
        }
        else if (this.type === 'pig') {
            this.moveTimer++;
            if (this.moveTimer > 120) {
                this.vx = (Math.random() - 0.5) * 2;
                this.moveTimer = 0;
            }
        }

        if (this.vx !== 0 && this.grounded && checkMobCollision(this.x + this.vx * 5, this.y, this)) {
            this.vy = -6.5;
        }

        this.vy += 0.4;
        this.x += this.vx;
        this.y += this.vy;

        if (checkMobCollision(this.x, this.y + this.height, this)) {
            this.y = Math.floor((this.y + this.height) / BLOCK_SIZE) * BLOCK_SIZE - this.height;
            this.vy = 0;
            this.grounded = true;
        }
        return false;
    }

    draw(ctx) {
        let sx = this.x - camera.x;
        let sy = this.y - camera.y;

        ctx.save();
        if (this.damageFlash > 0 || (this.isFusing && Math.floor(this.fuse / 6) % 2 === 0)) {
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(sx, sy, this.width, this.height);
        } else if (this.type === 'zombie') {
            ctx.fillStyle = '#2e7d32';
            ctx.fillRect(sx, sy, this.width, this.height);
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(sx, sy + this.height / 2, this.width, this.height / 2);
        } else if (this.type === 'creeper') {
            ctx.fillStyle = '#388e3c';
            ctx.fillRect(sx, sy, this.width, this.height);
            ctx.fillStyle = '#000000';
            ctx.fillRect(sx + 4, sy + 6, 4, 4);
            ctx.fillRect(sx + 14, sy + 6, 4, 4);
            ctx.fillRect(sx + 8, sy + 10, 6, 8);
            ctx.fillRect(sx + 6, sy + 14, 2, 6);
            ctx.fillRect(sx + 14, sy + 14, 2, 6);
        } else {
            ctx.fillStyle = '#f48fb1';
            ctx.fillRect(sx, sy, this.width, this.height);
            ctx.fillStyle = '#e91e63';
            ctx.fillRect(sx + 2, sy + 4, 6, 6);
        }
        ctx.restore();
    }
}

function explodeCreeper(cx, cy) {
    audio.playExplosion();
    triggerScreenShake(16, 20);

    let radiusBlocks = 2;
    let centerBx = Math.floor(cx / BLOCK_SIZE);
    let centerBy = Math.floor(cy / BLOCK_SIZE);

    for (let dy = -radiusBlocks; dy <= radiusBlocks; dy++) {
        for (let dx = -radiusBlocks; dx <= radiusBlocks; dx++) {
            let bx = centerBx + dx;
            let by = centerBy + dy;
            if (bx >= 0 && bx < WORLD_WIDTH && by >= 0 && by < WORLD_HEIGHT) {
                if (world[by][bx] !== 0 && world[by][bx] !== 6) {
                    spawnBlockParticles(bx, by, BLOCKS[world[by][bx]].color || '#ffaa00');
                    world[by][bx] = 0;
                }
            }
        }
    }

    for (let i = 0; i < 30; i++) {
        particles.push(new Particle(cx, cy, '#ff4400', 'block'));
        particles.push(new Particle(cx, cy, '#ffaa00', 'block'));
        particles.push(new Particle(cx, cy, '#555555', 'torch_smoke'));
    }

    let distToPlayer = Math.hypot(player.x + player.width / 2 - cx, player.y + player.height / 2 - cy);
    if (distToPlayer < BLOCK_SIZE * 4) {
        let dmg = Math.floor(16 * (1 - distToPlayer / (BLOCK_SIZE * 4)));
        damagePlayer(Math.max(4, dmg), 'Explosão de Creeper');
    }
}

function checkMobCollision(x, y, mob) {
    let bx = Math.floor((x + mob.width / 2) / BLOCK_SIZE);
    let by = Math.floor((y + mob.height / 2) / BLOCK_SIZE);
    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return true;
    return BLOCKS[world[by][bx]].solid;
}

function spawnMobs() {
    if (mobs.length >= 10) return;
    let rx = Math.floor(Math.random() * WORLD_WIDTH);
    let ry = 0;
    while (ry < WORLD_HEIGHT && world[ry][rx] === 0) ry++;

    if (ry < WORLD_HEIGHT) {
        if (dayTime >= 12000) {
            let rand = Math.random();
            if (rand < 0.4) mobs.push(new Mob(rx * BLOCK_SIZE, (ry - 2) * BLOCK_SIZE, 'zombie'));
            else if (rand < 0.7) mobs.push(new Mob(rx * BLOCK_SIZE, (ry - 2) * BLOCK_SIZE, 'creeper'));
        } else if (Math.random() < 0.3) {
            mobs.push(new Mob(rx * BLOCK_SIZE, (ry - 1) * BLOCK_SIZE, 'pig'));
        }
    }
}

// ITEM DROPS
class ItemDrop {
    constructor(x, y, item) {
        this.x = x;
        this.y = y;
        this.item = item;
        this.vy = -3;
        this.bounce = Math.random() * Math.PI;
    }

    update() {
        this.vy += 0.2;
        this.y += this.vy;
        this.bounce += 0.05;

        let bx = Math.floor(this.x / BLOCK_SIZE);
        let by = Math.floor((this.y + 12) / BLOCK_SIZE);
        if (by >= 0 && by < WORLD_HEIGHT && world[by][bx] !== 0 && BLOCKS[world[by][bx]].solid) {
            this.y = by * BLOCK_SIZE - 12;
            this.vy = 0;
        }

        let dist = Math.hypot((player.x + player.width / 2) - this.x, (player.y + player.height / 2) - this.y);
        if (dist < BLOCK_SIZE * 2.5) {
            this.x += ((player.x + player.width / 2) - this.x) * 0.15;
            this.y += ((player.y + player.height / 2) - this.y) * 0.15;

            if (dist < BLOCK_SIZE * 0.8) {
                if (addItemToInventory(this.item)) {
                    audio.playPickup();
                    let name = BLOCKS[this.item.id]?.name || ITEMS[this.item.id]?.name || 'Item';
                    floatingTexts.push(new FloatingText(this.x, this.y - 10, `+1 ${name}`, '#55ff55'));
                    return true;
                }
            }
        }
        return false;
    }

    draw(ctx) {
        let sx = this.x - camera.x;
        let sy = this.y - camera.y + Math.sin(this.bounce) * 3;

        ctx.fillStyle = BLOCKS[this.item.id]?.color || ITEMS[this.item.id]?.color || '#fff';
        ctx.fillRect(sx - 6, sy - 6, 12, 12);
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(sx - 6, sy - 6, 12, 12);
    }
}

// INVENTÁRIO & CRAFTING
function addItemToInventory(item) {
    for (let i = 0; i < 36; i++) {
        if (inventory[i] && inventory[i].id === item.id) {
            inventory[i].count += item.count;
            updateHUD();
            return true;
        }
    }
    for (let i = 0; i < 36; i++) {
        if (!inventory[i]) {
            inventory[i] = { id: item.id, count: item.count };
            updateHUD();
            return true;
        }
    }
    return false;
}

function craftRecipe(recipe) {
    for (let input of recipe.inputs) {
        let countFound = 0;
        for (let i = 0; i < 36; i++) {
            if (inventory[i] && inventory[i].id === input.id) {
                countFound += inventory[i].count;
            }
        }
        if (countFound < input.count) return;
    }

    for (let input of recipe.inputs) {
        let needed = input.count;
        for (let i = 0; i < 36; i++) {
            if (inventory[i] && inventory[i].id === input.id) {
                let take = Math.min(needed, inventory[i].count);
                inventory[i].count -= take;
                needed -= take;
                if (inventory[i].count <= 0) inventory[i] = null;
                if (needed <= 0) break;
            }
        }
    }

    let out = recipe.output ? { ...recipe.output } : { ...recipe.outputItem };
    addItemToInventory(out);
    renderInventoryUI();
}

// INTERAÇÃO COM O MUNDO E MINERAÇÃO PROGRESSIVA
function interactWorld() {
    if (gameState !== 'PLAYING') return;

    let bx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    let by = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);

    if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) {
        miningTarget = null;
        miningProgress = 0;
        return;
    }

    let dist = Math.hypot((player.x + player.width / 2) - (bx * BLOCK_SIZE + BLOCK_SIZE / 2),
                          (player.y + player.height / 2) - (by * BLOCK_SIZE + BLOCK_SIZE / 2));
    
    if (dist > BLOCK_SIZE * 5) {
        miningTarget = null;
        miningProgress = 0;
        return;
    }

    if (mouse.leftDown) {
        player.swinging = true;

        // Atacar Mobs (se houver algum sob o cursor)
        for (let i = mobs.length - 1; i >= 0; i--) {
            let m = mobs[i];
            if (Math.hypot(m.x - (mouse.x + camera.x), m.y - (mouse.y + camera.y)) < BLOCK_SIZE * 1.5) {
                let activeItem = inventory[selectedSlot];
                let dmg = activeItem && ITEMS[activeItem.id]?.damage ? ITEMS[activeItem.id].damage : 4;
                m.health -= dmg;
                m.damageFlash = 10;
                audio.playHurt();

                floatingTexts.push(new FloatingText(m.x + m.width / 2, m.y - 10, `-${dmg}`, '#ffff55'));

                if (m.health <= 0) {
                    if (m.type === 'pig') itemDrops.push(new ItemDrop(m.x, m.y, { id: 'raw_pork', count: 1 }));
                    else itemDrops.push(new ItemDrop(m.x, m.y, { id: 'coal', count: 1 }));

                    xpOrbs.push(new XPOrb(m.x + m.width / 2, m.y, 6));
                    mobs.splice(i, 1);
                }
                mouse.leftDown = false;
                miningTarget = null;
                miningProgress = 0;
                return;
            }
        }

        // Processo de Mineração de Blocos com Progresso
        let targetBlock = world[by][bx];
        if (targetBlock !== 0 && targetBlock !== 6) {
            let activeItem = inventory[selectedSlot];
            let toolPower = activeItem && ITEMS[activeItem.id]?.toolPower ? ITEMS[activeItem.id].toolPower : 1.0;
            let blockHardness = BLOCKS[targetBlock].hardness || 1.0;

            if (!miningTarget || miningTarget.x !== bx || miningTarget.y !== by) {
                miningTarget = { x: bx, y: by };
                miningProgress = 0;
            }

            // Incrementar progresso com base no poder da ferramenta
            miningProgress += (0.08 * toolPower) / blockHardness;

            if (Math.random() < 0.2) audio.playBreak();

            if (miningProgress >= 1.0) {
                audio.playBreak();
                let color = BLOCKS[targetBlock].color || '#aaa';
                spawnBlockParticles(bx, by, color);

                let dropId = BLOCKS[targetBlock].drop || BLOCKS[targetBlock].dropItem || targetBlock;
                itemDrops.push(new ItemDrop(bx * BLOCK_SIZE + 16, by * BLOCK_SIZE + 16, { id: dropId, count: 1 }));

                if (BLOCKS[targetBlock].xp) {
                    xpOrbs.push(new XPOrb(bx * BLOCK_SIZE + 16, by * BLOCK_SIZE + 16, BLOCKS[targetBlock].xp));
                }

                world[by][bx] = 0;
                miningTarget = null;
                miningProgress = 0;
            }
        } else {
            miningTarget = null;
            miningProgress = 0;
        }
    } else {
        miningTarget = null;
        miningProgress = 0;
    }

    if (mouse.rightDown) {
        let activeItem = inventory[selectedSlot];
        if (!activeItem) return;

        player.swinging = true;

        if (ITEMS[activeItem.id]?.food && player.hunger < 20) {
            player.hunger = Math.min(20, player.hunger + ITEMS[activeItem.id].food);
            activeItem.count--;
            if (activeItem.count <= 0) inventory[selectedSlot] = null;
            audio.playPickup();
            updateHUD();
            mouse.rightDown = false;
            return;
        }

        if (typeof activeItem.id === 'number' && world[by][bx] === 0) {
            let pRect = { l: player.x, r: player.x + player.width, t: player.y, b: player.y + player.height };
            let bRect = { l: bx * BLOCK_SIZE, r: bx * BLOCK_SIZE + BLOCK_SIZE, t: by * BLOCK_SIZE, b: by * BLOCK_SIZE + BLOCK_SIZE };
            
            if (!(pRect.l >= bRect.r || pRect.r <= bRect.l || pRect.t >= bRect.b || pRect.b <= bRect.t)) {
                world[by][bx] = activeItem.id;
                audio.playPlace();

                if (gameMode === 'survival') {
                    activeItem.count--;
                    if (activeItem.count <= 0) inventory[selectedSlot] = null;
                }
                updateHUD();
            }
            mouse.rightDown = false;
        }
    }
}

// RENDERIZAÇÃO & ILUMINAÇÃO DE CAVERNAS
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function drawParallaxBackground(skyColor) {
    ctx.fillStyle = skyColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let skyCenterX = canvas.width / 2;
    let skyCenterY = canvas.height * 0.75;
    let radius = Math.min(canvas.width, canvas.height) * 0.65;
    
    let sunAngle = ((dayTime / 24000) * Math.PI * 2) - Math.PI / 2;
    let moonAngle = sunAngle + Math.PI;

    let sunX = skyCenterX + Math.cos(sunAngle) * radius;
    let sunY = skyCenterY + Math.sin(sunAngle) * radius;
    if (sunY < canvas.height) {
        ctx.save();
        ctx.fillStyle = '#ffea00';
        ctx.shadowColor = '#ffaa00';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(sunX, sunY, 26, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    let moonX = skyCenterX + Math.cos(moonAngle) * radius;
    let moonY = skyCenterY + Math.sin(moonAngle) * radius;
    if (moonY < canvas.height) {
        ctx.save();
        ctx.fillStyle = '#eeeeee';
        ctx.shadowColor = '#ffffff';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(moonX, moonY, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    if (dayTime > 11000 && dayTime < 23500) {
        let nightFactor = dayTime > 13000 && dayTime < 22500 ? 1 : 0.5;
        ctx.save();
        stars.forEach(star => {
            star.phase += star.speed;
            let alpha = (Math.sin(star.phase) * 0.4 + 0.6) * nightFactor;
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.fillRect(star.x * canvas.width, star.y * canvas.height, star.size, star.size);
        });
        ctx.restore();
    }

    drawMountains(0.15, '#233226', canvas.height - 180, 120);
    drawMountains(0.35, '#18241b', canvas.height - 120, 80);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    clouds.forEach(cloud => {
        cloud.x += cloud.speed;
        if (cloud.x > WORLD_WIDTH * BLOCK_SIZE) cloud.x = -cloud.width;
        let cx = cloud.x - camera.x * 0.2;
        ctx.fillRect(cx, cloud.y, cloud.width, cloud.height);
        ctx.fillRect(cx + 10, cloud.y - 8, cloud.width - 20, cloud.height);
    });
}

function drawMountains(parallaxFactor, color, baseHeight, heightVariance) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    let step = 40;
    for (let x = 0; x <= canvas.width + step; x += step) {
        let worldX = x + camera.x * parallaxFactor;
        let y = baseHeight + Math.sin(worldX * 0.005) * heightVariance + Math.cos(worldX * 0.012) * (heightVariance * 0.5);
        ctx.lineTo(x, y);
    }
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    ctx.fill();
}

function render() {
    ctx.save();

    if (screenShakeTimer > 0) {
        screenShakeTimer--;
        let dx = (Math.random() - 0.5) * screenShakeIntensity;
        let dy = (Math.random() - 0.5) * screenShakeIntensity;
        ctx.translate(dx, dy);
    }

    let skyColor = '#87CEEB';
    if (dayTime > 10500 && dayTime <= 12500) skyColor = '#e67e22';
    else if (dayTime > 12500 && dayTime <= 22500) skyColor = '#090a15';
    else if (dayTime > 22500) skyColor = '#f39c12';

    drawParallaxBackground(skyColor);

    let startCol = Math.max(0, Math.floor(camera.x / BLOCK_SIZE));
    let endCol = Math.min(WORLD_WIDTH, startCol + Math.ceil(canvas.width / BLOCK_SIZE) + 1);
    let startRow = Math.max(0, Math.floor(camera.y / BLOCK_SIZE));
    let endRow = Math.min(WORLD_HEIGHT, startRow + Math.ceil(canvas.height / BLOCK_SIZE) + 1);

    // Desenhar Blocos
    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            let tile = world[y][x];
            if (tile !== 0) {
                let sx = x * BLOCK_SIZE - camera.x;
                let sy = y * BLOCK_SIZE - camera.y;
                let def = BLOCKS[tile];

                ctx.fillStyle = def.color;
                ctx.fillRect(sx, sy, BLOCK_SIZE, BLOCK_SIZE);

                if (def.topColor) {
                    ctx.fillStyle = def.topColor;
                    ctx.fillRect(sx, sy, BLOCK_SIZE, 8);
                } else if (def.spotColor) {
                    ctx.fillStyle = def.spotColor;
                    ctx.fillRect(sx + 8, sy + 8, 8, 8);
                    ctx.fillRect(sx + 18, sy + 18, 6, 6);
                }

                if (tile === 11 && Math.random() < 0.3) {
                    particles.push(new Particle(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 8, '#ff9900', 'torch_fire'));
                    particles.push(new Particle(x * BLOCK_SIZE + 16, y * BLOCK_SIZE + 6, '#555555', 'torch_smoke'));
                }
            }
        }
    }

    // Desenhar Animação de Rachadelas/Fissuras durante a Mineração
    if (miningTarget && miningProgress > 0) {
        let msx = miningTarget.x * BLOCK_SIZE - camera.x;
        let msy = miningTarget.y * BLOCK_SIZE - camera.y;
        let stage = Math.floor(miningProgress * 5);

        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        for (let i = 0; i <= stage; i++) {
            ctx.moveTo(msx + (i * 6), msy + 2);
            ctx.lineTo(msx + 16, msy + 16);
            ctx.lineTo(msx + 30 - (i * 4), msy + 30);
        }
        ctx.stroke();
    }

    itemDrops.forEach(drop => drop.draw(ctx));
    xpOrbs.forEach(orb => orb.draw(ctx));
    mobs.forEach(mob => mob.draw(ctx));

    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].update()) particles.splice(i, 1);
        else particles[i].draw(ctx);
    }

    let px = player.x - camera.x;
    let py = player.y - camera.y;

    ctx.save();
    if (player.invulnerableTimer % 4 < 2) {
        if (player.invulnerableTimer > 0) ctx.fillStyle = '#ff0000';
        else ctx.fillStyle = player.color;
        
        ctx.fillRect(px, py, player.width, player.height);

        ctx.fillStyle = '#f1c40f';
        ctx.fillRect(px, py, player.width, player.width);

        let eyeCenterX = px + player.width / 2;
        let eyeCenterY = py + 10;
        let angleToMouse = Math.atan2((mouse.y + camera.y) - (player.y + 10), (mouse.x + camera.x) - (player.x + player.width / 2));
        let eyeOffsetX = Math.cos(angleToMouse) * 3;
        let eyeOffsetY = Math.sin(angleToMouse) * 2;

        ctx.fillStyle = '#000000';
        ctx.fillRect(px + 4 + eyeOffsetX, py + 8 + eyeOffsetY, 3, 3);
        ctx.fillRect(px + 14 + eyeOffsetX, py + 8 + eyeOffsetY, 3, 3);

        ctx.save();
        ctx.translate(px + player.width / 2, py + player.height / 3);
        let armAngle = player.swinging ? Math.sin(player.swingTimer) * 1.2 : 0;
        ctx.rotate(armAngle);
        ctx.fillStyle = '#e67e22';
        ctx.fillRect(0, 0, 14, 6);

        let activeItem = inventory[selectedSlot];
        if (activeItem) {
            ctx.fillStyle = BLOCKS[activeItem.id]?.color || ITEMS[activeItem.id]?.color || '#fff';
            ctx.fillRect(10, -8, 8, 16);
        }
        ctx.restore();
    }
    ctx.restore();

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        if (floatingTexts[i].update()) floatingTexts.splice(i, 1);
        else floatingTexts[i].draw(ctx);
    }

    // SISTEMA DE ILUMINAÇÃO AVANÇADO (NOITE & CAVERNAS)
    let isNight = dayTime >= 10500 && dayTime < 23500;
    let surfaceNightAlpha = 0;
    if (isNight) {
        if (dayTime >= 10500 && dayTime < 12500) surfaceNightAlpha = ((dayTime - 10500) / 2000) * 0.88;
        else if (dayTime >= 12500 && dayTime < 22500) surfaceNightAlpha = 0.88;
        else if (dayTime >= 22500 && dayTime < 23500) surfaceNightAlpha = (1 - (dayTime - 22500) / 1000) * 0.88;
    }

    ctx.save();
    // Renderizar máscara de sombra ladrilhada para cavernas e superfícies
    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            let surfaceY = terrainSurfaceY[x] || 30;
            let tileAlpha = surfaceNightAlpha;

            // Se estiver abaixo do nível da superfície, aplica escuridão de caverna (mesmo de dia)
            if (y > surfaceY + 2) {
                let depth = y - (surfaceY + 2);
                let caveAlpha = Math.min(0.92, 0.4 + (depth * 0.08));
                tileAlpha = Math.max(tileAlpha, caveAlpha);
            }

            if (tileAlpha > 0) {
                let tx = x * BLOCK_SIZE - camera.x;
                let ty = y * BLOCK_SIZE - camera.y;
                ctx.fillStyle = `rgba(5, 5, 18, ${tileAlpha})`;
                ctx.fillRect(tx, ty, BLOCK_SIZE, BLOCK_SIZE);
            }
        }
    }

    // Recortar fontes de luz quentes com 'destination-out'
    ctx.globalCompositeOperation = 'destination-out';

    // Luz em volta do Jogador
    let pGlow = ctx.createRadialGradient(px + player.width / 2, py + player.height / 2, 10, px + player.width / 2, py + player.height / 2, 130);
    pGlow.addColorStop(0, 'rgba(0,0,0,1)');
    pGlow.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = pGlow;
    ctx.beginPath();
    ctx.arc(px + player.width / 2, py + player.height / 2, 130, 0, Math.PI * 2);
    ctx.fill();

    // Luz em volta das Tochas
    for (let y = startRow; y < endRow; y++) {
        for (let x = startCol; x < endCol; x++) {
            if (world[y][x] === 11) {
                let tx = x * BLOCK_SIZE - camera.x + 16;
                let ty = y * BLOCK_SIZE - camera.y + 16;
                let torchGlow = ctx.createRadialGradient(tx, ty, 5, tx, ty, 160);
                torchGlow.addColorStop(0, 'rgba(0,0,0,1)');
                torchGlow.addColorStop(0.7, 'rgba(0,0,0,0.7)');
                torchGlow.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = torchGlow;
                ctx.beginPath();
                ctx.arc(tx, ty, 160, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    ctx.restore();

    // Destaque (Highlight) do Bloco Apontado pelo Cursor
    let hbx = Math.floor((mouse.x + camera.x) / BLOCK_SIZE);
    let hby = Math.floor((mouse.y + camera.y) / BLOCK_SIZE);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(hbx * BLOCK_SIZE - camera.x, hby * BLOCK_SIZE - camera.y, BLOCK_SIZE, BLOCK_SIZE);

    ctx.restore();
}

// ATUALIZAÇÃO DA INTERFACE, HUD E TOOLTIPS
function updateHUD() {
    const heartsContainer = document.getElementById('hearts-container');
    heartsContainer.innerHTML = '';
    let isLowHealth = player.health <= 6;

    for (let i = 0; i < 10; i++) {
        let heart = document.createElement('div');
        let isFull = i * 2 < player.health;
        heart.className = `heart ${isFull ? 'heart-full' : 'heart-empty'} ${isLowHealth && isFull ? 'pulse' : ''}`;
        heartsContainer.appendChild(heart);
    }

    const hungerContainer = document.getElementById('hunger-container');
    hungerContainer.innerHTML = '';
    for (let i = 0; i < 10; i++) {
        let h = document.createElement('div');
        h.className = `hunger ${i * 2 < player.hunger ? 'hunger-full' : 'hunger-empty'}`;
        hungerContainer.appendChild(h);
    }

    let xpPercent = Math.min(100, Math.floor((player.xp / player.xpToNextLevel) * 100));
    document.getElementById('xp-bar-fill').style.width = `${xpPercent}%`;
    document.getElementById('xp-level-text').innerText = `${player.level}`;

    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        let slot = document.createElement('div');
        slot.className = `mc-slot ${i === selectedSlot ? 'active' : ''}`;
        
        let item = inventory[i];
        if (item) {
            let color = BLOCKS[item.id]?.color || ITEMS[item.id]?.color || '#fff';
            slot.innerHTML = `<div style="width:22px;height:22px;background:${color};border:1px solid #000;"></div>`;
            if (item.count > 1) {
                slot.innerHTML += `<span class="mc-slot-count">${item.count}</span>`;
            }
        }
        slot.onclick = () => { selectedSlot = i; updateHUD(); };
        addTooltipEvents(slot, item);
        hotbar.appendChild(slot);
    }

    let active = inventory[selectedSlot];
    document.getElementById('active-item-name').innerText = active ? (BLOCKS[active.id]?.name || ITEMS[active.id]?.name) : '';
    document.getElementById('hud-time-text').innerText = (dayTime > 10500 && dayTime < 22500) ? 'Noite' : 'Dia';
}

function renderInventoryUI() {
    const grid = document.getElementById('inventory-grid');
    grid.innerHTML = '';
    for (let i = 9; i < 36; i++) {
        grid.appendChild(createSlotElement(i));
    }

    const hbGrid = document.getElementById('inventory-hotbar-grid');
    hbGrid.innerHTML = '';
    for (let i = 0; i < 9; i++) {
        hbGrid.appendChild(createSlotElement(i));
    }

    const recipesDiv = document.getElementById('crafting-recipes');
    recipesDiv.innerHTML = '';
    CRAFTING_RECIPES.forEach(r => {
        let btn = document.createElement('button');
        btn.className = 'mc-button text-[10px] p-2 text-left w-full';
        btn.innerText = r.name;
        btn.onclick = () => craftRecipe(r);
        recipesDiv.appendChild(btn);
    });
}

function createSlotElement(index) {
    let slot = document.createElement('div');
    slot.className = 'mc-slot';
    let item = inventory[index];

    if (item) {
        let color = BLOCKS[item.id]?.color || ITEMS[item.id]?.color || '#fff';
        slot.innerHTML = `<div style="width:22px;height:22px;background:${color};border:1px solid #000;"></div>`;
        if (item.count > 1) {
            slot.innerHTML += `<span class="mc-slot-count">${item.count}</span>`;
        }
    }
    addTooltipEvents(slot, item);
    return slot;
}

function addTooltipEvents(element, item) {
    const tooltip = document.getElementById('tooltip');
    element.addEventListener('mouseenter', e => {
        if (item) {
            let name = BLOCKS[item.id]?.name || ITEMS[item.id]?.name || 'Item';
            tooltip.innerText = `${name} (x${item.count})`;
            tooltip.style.display = 'block';
        }
    });
    element.addEventListener('mousemove', e => {
        tooltip.style.left = `${e.clientX + 12}px`;
        tooltip.style.top = `${e.clientY + 12}px`;
    });
    element.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
    });
}

// LOOP DO JOGO
function gameLoop() {
    if (gameState === 'PLAYING') {
        dayTime = (dayTime + 2) % 24000;

        updatePlayer();
        if (Math.random() < 0.005) spawnMobs();

        for (let i = mobs.length - 1; i >= 0; i--) {
            if (mobs[i].update()) mobs.splice(i, 1);
        }

        for (let i = itemDrops.length - 1; i >= 0; i--) {
            if (itemDrops[i].update()) itemDrops.splice(i, 1);
        }

        for (let i = xpOrbs.length - 1; i >= 0; i--) {
            if (xpOrbs[i].update()) xpOrbs.splice(i, 1);
        }

        camera.x += ((player.x + player.width / 2 - canvas.width / 2) - camera.x) * 0.1;
        camera.y += ((player.y + player.height / 2 - canvas.height / 2) - camera.y) * 0.1;

        interactWorld();
        render();
    }
    requestAnimationFrame(gameLoop);
}

// CONTROLADORES DE ESTADO
function startGame(mode) {
    audio.init();
    gameMode = mode;
    document.getElementById('hud-mode-text').innerText = mode === 'survival' ? 'Sobrevivência' : 'Criativo';
    
    generateWorld();

    player.x = (WORLD_WIDTH / 2) * BLOCK_SIZE;
    let sy = 0;
    while (sy < WORLD_HEIGHT && world[sy][WORLD_WIDTH / 2] === 0) sy++;
    player.y = (sy - 2) * BLOCK_SIZE;
    player.health = 20;
    player.hunger = 20;
    player.xp = 0;
    player.level = 0;

    inventory.fill(null);
    inventory[0] = { id: 1, count: 64 };
    inventory[1] = { id: 4, count: 16 };
    inventory[2] = { id: 11, count: 12 };

    gameState = 'PLAYING';
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    updateHUD();
}

function toggleInventory() {
    if (gameState !== 'PLAYING' && gameState !== 'INVENTORY') return;

    const invScreen = document.getElementById('inventory-screen');
    const tooltip = document.getElementById('tooltip');
    tooltip.style.display = 'none';

    if (gameState === 'PLAYING') {
        gameState = 'INVENTORY';
        renderInventoryUI();
        invScreen.classList.remove('hidden');
    } else {
        gameState = 'PLAYING';
        invScreen.classList.add('hidden');
        updateHUD();
    }
}

function pauseGame() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        document.getElementById('pause-menu').classList.remove('hidden');
    }
}

function resumeGame() {
    if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        document.getElementById('pause-menu').classList.add('hidden');
    }
}

function respawnPlayer() {
    document.getElementById('death-screen').classList.add('hidden');
    startGame(gameMode);
}

function quitToMenu() {
    gameState = 'MENU';
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('death-screen').classList.add('hidden');
    document.getElementById('hud').classList.add('hidden');
    document.getElementById('main-menu').classList.remove('hidden');
}

function toggleInstructions() {
    document.getElementById('instructions-modal').classList.toggle('hidden');
}

// EVENTOS DE ENTRADA & CONTROLES
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
});

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key.toLowerCase() === 'e') toggleInventory();
    if (e.key === 'Escape') {
        if (gameState === 'INVENTORY') toggleInventory();
        else if (gameState === 'PLAYING') pauseGame();
        else if (gameState === 'PAUSED') resumeGame();
    }
    let num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
        selectedSlot = num - 1;
        updateHUD();
    }
});

window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Roda do Rato para Alternar Hotbar
window.addEventListener('wheel', e => {
    if (gameState !== 'PLAYING') return;
    if (e.deltaY > 0) selectedSlot = (selectedSlot + 1) % 9;
    else if (e.deltaY < 0) selectedSlot = (selectedSlot - 1 + 9) % 9;
    updateHUD();
});

canvas.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

canvas.addEventListener('mousedown', e => {
    // Bloquear cliques se ocorrerem sobre elementos da UI
    if (e.target !== canvas) return;
    if (e.button === 0) mouse.leftDown = true;
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener('mouseup', e => {
    if (e.button === 0) {
        mouse.leftDown = false;
        miningTarget = null;
        miningProgress = 0;
    }
    if (e.button === 2) mouse.rightDown = false;
});

canvas.addEventListener('contextmenu', e => e.preventDefault());

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

requestAnimationFrame(gameLoop);