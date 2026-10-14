// SINTETIZADOR DE ÁUDIO WEB AUDIO API
class SoundEngine {
    constructor() { this.ctx = null; }

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    playTone(freq, type, duration, gainVal = 0.3) {
        if (!this.ctx) return;
        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + duration);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) { }
    }

    playHoe() { this.playTone(130, 'triangle', 0.15, 0.4); }
    playWater() { this.playTone(420, 'sine', 0.2, 0.25); }
    playPlant() { this.playTone(520, 'sine', 0.1, 0.3); }
    playHarvest() { this.playTone(680, 'triangle', 0.25, 0.4); }
    playChop() { this.playTone(100, 'sawtooth', 0.12, 0.5); }
    playMine() { this.playTone(280, 'square', 0.1, 0.3); }
    playFishBite() { this.playTone(880, 'sine', 0.3, 0.5); }
    playReelTick() { this.playTone(320, 'triangle', 0.04, 0.12); }
    playCatchSuccess() { 
        this.playTone(523, 'sine', 0.1, 0.3);
        setTimeout(() => this.playTone(659, 'sine', 0.1, 0.3), 90);
        setTimeout(() => this.playTone(783, 'sine', 0.2, 0.4), 180);
    }
    playFishEscape() { this.playTone(180, 'sawtooth', 0.3, 0.4); }
    playBuy() { this.playTone(750, 'sine', 0.15, 0.3); }
}

const audio = new SoundEngine();

// CONFIGURAÇÕES DO MUNDO
const TILE_SIZE = 32;
const MAP_COLS = 38;
const MAP_ROWS = 28;

const TERRAIN = {
    GRASS: 0, DIRT: 1, WATER: 2, HOUSE_WALL: 3, HOUSE_FLOOR: 4,
    BED: 5, SHIPPING_BIN: 6, TREE: 7, ROCK: 8, PATH: 9, SHOP_COUNTER: 10
};

const CROPS = {
    parsnip: { name: 'Chirívia', growthDays: 3, seedCost: 20, sellValue: 35, leafColor: '#8bc34a', fruitColor: '#ffecb3' },
    cauliflower: { name: 'Couve-Flor', growthDays: 4, seedCost: 80, sellValue: 175, leafColor: '#388e3c', fruitColor: '#ffffff' },
    melon: { name: 'Melão', growthDays: 5, seedCost: 80, sellValue: 250, leafColor: '#2e7d32', fruitColor: '#ff8a80' },
    pumpkin: { name: 'Abóbora', growthDays: 6, seedCost: 100, sellValue: 320, leafColor: '#1b5e20', fruitColor: '#ff6d00' }
};

let HOTBAR_ITEMS = [
    { id: 'hoe', name: 'Enxada', type: 'tool', icon: '⛏️' },
    { id: 'water_can', name: 'Regador', type: 'tool', icon: '💧' },
    { id: 'axe', name: 'Machado', type: 'tool', icon: '🪓' },
    { id: 'pickaxe', name: 'Picareta', type: 'tool', icon: '⛏' },
    { id: 'fishing_rod', name: 'Vara de Pescar', type: 'tool', icon: '🎣' },
    { id: 'seed_parsnip', name: 'Semente de Chirívia', type: 'seed', cropKey: 'parsnip', count: 8, icon: '🌱' },
    { id: 'seed_cauliflower', name: 'Semente de Couve-Flor', type: 'seed', cropKey: 'cauliflower', count: 4, icon: '☘️' }
];

// ESTADOS DO JOGO
let gameState = 'MENU';
let selectedSlot = 0;
let mapGrid = [];
let farmPlots = {};
let particles = [];
let floatingTexts = [];
let screenShake = 0;
let waterTimer = 0;
let walkAnimTimer = 0;

// PESCARIA (QTE)
let fishingState = 'IDLE'; // IDLE, WAITING_BITE, BITE, QTE
let fishingTimer = 0;
let bobberPos = { x: 0, y: 0 };
let qteData = {
    fishY: 50,
    fishTargetY: 50,
    greenBarY: 0,
    greenBarHeight: 28,
    greenBarVel: 0,
    progress: 30
};

let camera = { x: 0, y: 0 };
let mouse = { x: 0, y: 0 };
let isMouseDown = false;

let gameTime = {
    minute: 0, hour: 6, day: 1, dayOfWeekIdx: 0,
    daysOfWeek: ['Seg.', 'Ter.', 'Qua.', 'Qui.', 'Sex.', 'Sáb.', 'Dom.'],
    season: 'Primavera', weather: 'sunny', timer: 0
};

const player = {
    x: 14 * TILE_SIZE, y: 12 * TILE_SIZE, width: 22, height: 28,
    speed: 2.6, sprintSpeed: 4.2, dirX: 0, dirY: 1, isMoving: false,
    energy: 100, maxEnergy: 100, gold: 500, wood: 0, stone: 0
};

class Particle {
    constructor(x, y, color, vx, vy, life, size = 3) {
        this.x = x; this.y = y; this.color = color;
        this.vx = vx; this.vy = vy; this.life = life; this.maxLife = life; this.size = size;
    }
    update() {
        this.x += this.vx; this.y += this.vy; this.life--;
        return this.life <= 0;
    }
    draw(ctx, camX, camY) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / this.maxLife);
        ctx.fillStyle = this.color;
        ctx.fillRect(this.x - camX, this.y - camY, this.size, this.size);
        ctx.restore();
    }
}

class FloatingText {
    constructor(x, y, text, color) {
        this.x = x; this.y = y; this.text = text; this.color = color; this.vy = -1.2; this.life = 55;
    }
    update() { this.y += this.vy; this.life--; return this.life <= 0; }
    draw(ctx, camX, camY) {
        ctx.save();
        ctx.globalAlpha = Math.max(0, this.life / 55);
        ctx.fillStyle = this.color;
        ctx.font = '10px "Press Start 2P"';
        ctx.shadowColor = '#000'; ctx.shadowBlur = 4;
        ctx.fillText(this.text, this.x - camX, this.y - camY);
        ctx.restore();
    }
}

let keys = {};
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false });

function initWorldMap() {
    mapGrid = new Array(MAP_ROWS).fill(0).map(() => new Array(MAP_COLS).fill(TERRAIN.GRASS));
    farmPlots = {};

    // Lagoa com formato orgânico
    for (let r = 17; r < 24; r++) {
        for (let c = 26; c < 34; c++) mapGrid[r][c] = TERRAIN.WATER;
    }

    // Limites com árvores
    for (let c = 0; c < MAP_COLS; c++) {
        mapGrid[0][c] = TERRAIN.TREE; mapGrid[MAP_ROWS - 1][c] = TERRAIN.TREE;
    }
    for (let r = 0; r < MAP_ROWS; r++) {
        mapGrid[r][0] = TERRAIN.TREE; mapGrid[r][MAP_COLS - 1] = TERRAIN.TREE;
    }

    let resourceCoords = [
        {r: 10, c: 5, t: TERRAIN.TREE}, {r: 12, c: 4, t: TERRAIN.TREE}, {r: 15, c: 7, t: TERRAIN.TREE},
        {r: 18, c: 8, t: TERRAIN.ROCK}, {r: 20, c: 10, t: TERRAIN.ROCK}, {r: 22, c: 14, t: TERRAIN.ROCK}
    ];
    resourceCoords.forEach(rc => mapGrid[rc.r][rc.c] = rc.t);

    // Casa
    for (let r = 3; r < 8; r++) {
        for (let c = 3; c < 9; c++) {
            if (r === 3 || r === 7 || c === 3 || c === 8) mapGrid[r][c] = TERRAIN.HOUSE_WALL;
            else mapGrid[r][c] = TERRAIN.HOUSE_FLOOR;
        }
    }
    mapGrid[7][6] = TERRAIN.HOUSE_FLOOR;
    mapGrid[4][4] = TERRAIN.BED;

    // Balcão do Pierre
    for (let c = 12; c < 16; c++) mapGrid[4][c] = TERRAIN.SHOP_COUNTER;

    // Caminhos
    for (let r = 8; r < 12; r++) mapGrid[r][6] = TERRAIN.PATH;
    for (let c = 6; c < 24; c++) mapGrid[11][c] = TERRAIN.PATH;

    mapGrid[8][10] = TERRAIN.SHIPPING_BIN;

    // Terra de cultivo
    for (let r = 12; r < 22; r++) {
        for (let c = 12; c < 24; c++) mapGrid[r][c] = TERRAIN.DIRT;
    }
}

initWorldMap();

function getTargetTile() {
    let mouseWorldX = mouse.x + camera.x;
    let mouseWorldY = mouse.y + camera.y;
    let mouseCol = Math.floor(mouseWorldX / TILE_SIZE);
    let mouseRow = Math.floor(mouseWorldY / TILE_SIZE);

    let pCenterX = player.x + player.width / 2;
    let pCenterY = player.y + player.height / 2;

    let distToMouse = Math.hypot(mouseWorldX - pCenterX, mouseWorldY - pCenterY);

    if (distToMouse <= TILE_SIZE * 3.5 && mouseCol >= 0 && mouseCol < MAP_COLS && mouseRow >= 0 && mouseRow < MAP_ROWS) {
        return { col: mouseCol, row: mouseRow, worldX: mouseWorldX, worldY: mouseWorldY };
    }

    let targetX = pCenterX + (player.dirX * TILE_SIZE * 0.9);
    let targetY = pCenterY + (player.dirY * TILE_SIZE * 0.9);
    let col = Math.floor(targetX / TILE_SIZE);
    let row = Math.floor(targetY / TILE_SIZE);
    return { col: Math.max(0, Math.min(MAP_COLS - 1, col)), row: Math.max(0, Math.min(MAP_ROWS - 1, row)), worldX: targetX, worldY: targetY };
}

function updatePlayer() {
    if (gameState !== 'PLAYING') return;

    let moveX = 0, moveY = 0;
    if (keys['w'] || keys['arrowup']) moveY -= 1;
    if (keys['s'] || keys['arrowdown']) moveY += 1;
    if (keys['a'] || keys['arrowleft']) moveX -= 1;
    if (keys['d'] || keys['arrowright']) moveX += 1;

    player.isMoving = (moveX !== 0 || moveY !== 0);

    if (player.isMoving) {
        walkAnimTimer += 0.2;
        if (moveX !== 0 && moveY !== 0) { moveX *= 0.7071; moveY *= 0.7071; }
        player.dirX = moveX > 0 ? 1 : (moveX < 0 ? -1 : 0);
        player.dirY = moveY > 0 ? 1 : (moveY < 0 ? -1 : 0);

        if (fishingState !== 'IDLE') stopFishing();
    } else {
        walkAnimTimer = 0;
    }

    let speed = keys['shift'] ? player.sprintSpeed : player.speed;
    let nextX = player.x + moveX * speed;
    if (!checkTileCollision(nextX, player.y)) player.x = nextX;

    let nextY = player.y + moveY * speed;
    if (!checkTileCollision(player.x, nextY)) player.y = nextY;

    camera.x += ((player.x + player.width / 2 - canvas.width / 2) - camera.x) * 0.1;
    camera.y += ((player.y + player.height / 2 - canvas.height / 2) - camera.y) * 0.1;
}

function checkTileCollision(px, py) {
    let pLeft = Math.floor((px + 4) / TILE_SIZE);
    let pRight = Math.floor((px + player.width - 4) / TILE_SIZE);
    let pTop = Math.floor((py + player.height / 2) / TILE_SIZE);
    let pBottom = Math.floor((py + player.height) / TILE_SIZE);

    for (let r = pTop; r <= pBottom; r++) {
        for (let c = pLeft; c <= pRight; c++) {
            if (r < 0 || r >= MAP_ROWS || c < 0 || c >= MAP_COLS) return true;
            let tile = mapGrid[r][c];
            if (tile === TERRAIN.WATER || tile === TERRAIN.HOUSE_WALL || tile === TERRAIN.TREE || tile === TERRAIN.ROCK || tile === TERRAIN.SHOP_COUNTER) return true;
        }
    }
    return false;
}

// LÓGICA DA PESCARIA (QTE)
function updateFishingLogic() {
    if (fishingState === 'WAITING_BITE') {
        fishingTimer--;
        if (fishingTimer <= 0) {
            fishingState = 'BITE';
            audio.playFishBite();
            screenShake = 6;
            floatingTexts.push(new FloatingText(player.x, player.y - 20, 'FISGOU! (!)', '#ffea00'));
        }
    } else if (fishingState === 'QTE') {
        if (isMouseDown || keys[' ']) {
            qteData.greenBarVel += 0.45;
        } else {
            qteData.greenBarVel -= 0.38;
        }

        qteData.greenBarY += qteData.greenBarVel;

        let maxBarY = 100 - qteData.greenBarHeight;
        if (qteData.greenBarY <= 0) {
            qteData.greenBarY = 0;
            qteData.greenBarVel = 0;
        } else if (qteData.greenBarY >= maxBarY) {
            qteData.greenBarY = maxBarY;
            qteData.greenBarVel = 0;
        }

        if (Math.random() < 0.035) {
            qteData.fishTargetY = Math.random() * 85;
        }
        qteData.fishY += (qteData.fishTargetY - qteData.fishY) * 0.065;

        let fishCenter = qteData.fishY;
        let barBottom = qteData.greenBarY;
        let barTop = qteData.greenBarY + qteData.greenBarHeight;

        if (fishCenter >= barBottom && fishCenter <= barTop) {
            qteData.progress += 0.48;
            if (Math.random() < 0.15) audio.playReelTick();
        } else {
            qteData.progress -= 0.38;
        }

        qteData.progress = Math.max(0, Math.min(100, qteData.progress));

        document.getElementById('fishing-green-bar').style.bottom = `${qteData.greenBarY}%`;
        document.getElementById('fishing-fish-icon').style.bottom = `${qteData.fishY}%`;
        document.getElementById('fishing-progress-fill').style.height = `${qteData.progress}%`;

        if (qteData.progress >= 100) {
            let fishValue = 80 + Math.floor(Math.random() * 120);
            player.gold += fishValue;
            audio.playCatchSuccess();
            floatingTexts.push(new FloatingText(player.x, player.y - 15, `Peixe Fisgado! +${fishValue}g`, '#29b6f6'));
            stopFishing();
            updateHUD();
        } else if (qteData.progress <= 0) {
            audio.playFishEscape();
            floatingTexts.push(new FloatingText(player.x, player.y - 15, 'Escapou...', '#ff5252'));
            stopFishing();
        }
    }
}

function startFishing(target) {
    fishingState = 'WAITING_BITE';
    fishingTimer = 80 + Math.floor(Math.random() * 120);
    bobberPos = { x: target.worldX, y: target.worldY };

    for (let i = 0; i < 6; i++) {
        particles.push(new Particle(bobberPos.x, bobberPos.y, '#ffffff', (Math.random() - 0.5) * 2, -Math.random() * 2, 20));
    }
    floatingTexts.push(new FloatingText(player.x, player.y - 15, 'Aguardando...', '#ffffff'));
}

function startQTEMinigame() {
    fishingState = 'QTE';
    qteData.fishY = 40;
    qteData.fishTargetY = 50;
    qteData.greenBarY = 20;
    qteData.greenBarVel = 0;
    qteData.progress = 30;

    document.getElementById('fishing-green-bar').style.height = `${qteData.greenBarHeight}%`;
    document.getElementById('fishing-qte-container').classList.remove('hidden');
}

function stopFishing() {
    fishingState = 'IDLE';
    document.getElementById('fishing-qte-container').classList.add('hidden');
}

function interactFrontTile() {
    if (gameState !== 'PLAYING' || player.energy <= 0) return;

    let target = getTargetTile();
    let col = target.col, row = target.row;
    let tile = mapGrid[row][col];
    let key = `${col},${row}`;
    let item = HOTBAR_ITEMS[selectedSlot];

    let pCol = Math.floor((player.x + player.width / 2) / TILE_SIZE);
    let pRow = Math.floor((player.y + player.height / 2) / TILE_SIZE);
    if (tile === TERRAIN.BED || mapGrid[pRow][pCol] === TERRAIN.BED) {
        startSleepTransition();
        return;
    }

    if (tile === TERRAIN.SHOP_COUNTER || (row === 5 && col >= 12 && col <= 15)) {
        toggleShop();
        return;
    }

    if (item && item.id === 'fishing_rod') {
        if (tile === TERRAIN.WATER) {
            if (fishingState === 'IDLE') {
                startFishing(target);
            } else if (fishingState === 'BITE') {
                startQTEMinigame();
            } else if (fishingState === 'WAITING_BITE') {
                stopFishing();
            }
            return;
        }
    }

    if (item && item.id === 'axe' && tile === TERRAIN.TREE) {
        mapGrid[row][col] = TERRAIN.GRASS;
        player.wood += 5;
        player.energy = Math.max(0, player.energy - 3);
        audio.playChop();
        screenShake = 4;

        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(col * TILE_SIZE + 16, row * TILE_SIZE + 16, '#5c4033', (Math.random() - 0.5) * 3, -Math.random() * 2, 20));
        }
        floatingTexts.push(new FloatingText(col * TILE_SIZE, row * TILE_SIZE - 10, '+5 Madeira', '#8d6e63'));
        updateHUD();
        return;
    }

    if (item && item.id === 'pickaxe' && tile === TERRAIN.ROCK) {
        mapGrid[row][col] = TERRAIN.GRASS;
        player.stone += 3;
        player.energy = Math.max(0, player.energy - 3);
        audio.playMine();
        screenShake = 4;

        for (let i = 0; i < 8; i++) {
            particles.push(new Particle(col * TILE_SIZE + 16, row * TILE_SIZE + 16, '#9e9e9e', (Math.random() - 0.5) * 3, -Math.random() * 2, 20));
        }
        floatingTexts.push(new FloatingText(col * TILE_SIZE, row * TILE_SIZE - 10, '+3 Pedra', '#b0bec5'));
        updateHUD();
        return;
    }

    if (tile === TERRAIN.DIRT || tile === TERRAIN.GRASS) {
        let plot = farmPlots[key] || { tilled: false, watered: false, crop: null };

        if (item && item.id === 'hoe' && !plot.tilled) {
            mapGrid[row][col] = TERRAIN.DIRT;
            plot.tilled = true;
            farmPlots[key] = plot;
            player.energy = Math.max(0, player.energy - 2);
            audio.playHoe();

            for (let i = 0; i < 6; i++) {
                particles.push(new Particle(col * TILE_SIZE + 16, row * TILE_SIZE + 16, '#795548', (Math.random() - 0.5) * 2, -Math.random() * 2, 20));
            }
            floatingTexts.push(new FloatingText(player.x, player.y - 10, '-2 E', '#ffcc00'));
            updateHUD();
            return;
        }

        if (item && item.id === 'water_can' && plot.tilled && !plot.watered) {
            plot.watered = true;
            farmPlots[key] = plot;
            player.energy = Math.max(0, player.energy - 1);
            audio.playWater();

            for (let i = 0; i < 8; i++) {
                particles.push(new Particle(col * TILE_SIZE + 16, row * TILE_SIZE + 16, '#29b6f6', (Math.random() - 0.5) * 3, -Math.random() * 2, 25));
            }
            updateHUD();
            return;
        }

        if (item && item.type === 'seed' && plot.tilled && !plot.crop && item.count > 0) {
            let cropInfo = CROPS[item.cropKey];
            plot.crop = { key: item.cropKey, stage: 0, daysGrown: 0, maxDays: cropInfo.growthDays };
            farmPlots[key] = plot;
            item.count--;
            audio.playPlant();
            updateHUD();
            return;
        }

        if (plot.crop && plot.crop.daysGrown >= plot.crop.maxDays) {
            let cropInfo = CROPS[plot.crop.key];
            player.gold += cropInfo.sellValue;
            audio.playHarvest();

            floatingTexts.push(new FloatingText(col * TILE_SIZE + 8, row * TILE_SIZE - 10, `+${cropInfo.sellValue}g`, '#ffd700'));
            for (let i = 0; i < 10; i++) {
                particles.push(new Particle(col * TILE_SIZE + 16, row * TILE_SIZE + 16, cropInfo.fruitColor, (Math.random() - 0.5) * 4, -Math.random() * 3, 30));
            }

            plot.crop = null;
            farmPlots[key] = plot;
            updateHUD();
            return;
        }
    }
}

function updateGameTime() {
    if (gameState !== 'PLAYING') return;

    waterTimer += 0.05;
    if (screenShake > 0) screenShake -= 0.4;

    updateFishingLogic();

    if (gameTime.hour >= 19 || gameTime.hour < 5) {
        if (Math.random() < 0.1) {
            let fx = camera.x + Math.random() * canvas.width;
            let fy = camera.y + Math.random() * canvas.height;
            particles.push(new Particle(fx, fy, '#ccff00', (Math.random() - 0.5) * 0.5, (Math.random() - 0.5) * 0.5, 60, 2));
        }
    } else {
        if (Math.random() < 0.05) {
            let fx = camera.x + canvas.width;
            let fy = camera.y + Math.random() * canvas.height;
            particles.push(new Particle(fx, fy, '#8bc34a', -1.5, 0.5, 120, 3));
        }
    }

    gameTime.timer++;
    if (gameTime.timer >= 120) {
        gameTime.minute += 10;
        gameTime.timer = 0;

        if (gameTime.minute >= 60) {
            gameTime.minute = 0;
            gameTime.hour++;
            if (gameTime.hour >= 26) startSleepTransition(true);
        }
        updateHUD();
    }
}

function startSleepTransition(fainted = false) {
    gameState = 'SLEEPING';
    stopFishing();
    const sleepModal = document.getElementById('sleep-screen');
    const sleepTitle = document.getElementById('sleep-title');
    const sleepSummary = document.getElementById('sleep-summary');

    if (fainted) {
        sleepTitle.innerText = "Você desmaiou de cansaço!";
        sleepSummary.innerText = "Sua energia foi recuperada parcialmente para o próximo dia.";
        player.energy = Math.floor(player.maxEnergy * 0.5);
    } else {
        sleepTitle.innerText = "Você descansou na sua cama...";
        sleepSummary.innerText = "Sua energia foi totalmente restaurada e suas plantas cresceram!";
        player.energy = player.maxEnergy;
    }
    sleepModal.classList.remove('hidden');
}

function wakeUpNextDay() {
    gameTime.day++;
    gameTime.dayOfWeekIdx = (gameTime.dayOfWeekIdx + 1) % 7;
    gameTime.hour = 6;
    gameTime.minute = 0;
    gameTime.weather = Math.random() < 0.3 ? 'rainy' : 'sunny';

    Object.keys(farmPlots).forEach(k => {
        let plot = farmPlots[k];
        if (gameTime.weather === 'rainy' && plot.tilled) plot.watered = true;
        if (plot.crop && plot.watered) {
            plot.crop.daysGrown++;
            plot.crop.stage = Math.min(3, Math.floor((plot.crop.daysGrown / plot.crop.maxDays) * 3));
        }
        if (gameTime.weather !== 'rainy') plot.watered = false;
    });

    player.x = 5 * TILE_SIZE;
    player.y = 5 * TILE_SIZE;

    document.getElementById('sleep-screen').classList.add('hidden');
    gameState = 'PLAYING';
    updateHUD();
}

// RENDERIZAÇÃO GRÁFICA COM ORDENAÇÃO POR PROFUNDIDADE (Y-SORTING)
function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let shakeX = (Math.random() - 0.5) * screenShake;
    let shakeY = (Math.random() - 0.5) * screenShake;

    let camX = Math.floor(camera.x + shakeX);
    let camY = Math.floor(camera.y + shakeY);

    // CAMADA 1: TERRENO BASE
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            let tile = mapGrid[r][c];
            let tx = c * TILE_SIZE - camX;
            let ty = r * TILE_SIZE - camY;

            if (tx + TILE_SIZE < 0 || tx > canvas.width || ty + TILE_SIZE < 0 || ty > canvas.height) continue;

            if (tile === TERRAIN.GRASS) {
                ctx.fillStyle = gameTime.weather === 'rainy' ? '#386623' : '#558b2f';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#689f38';
                if ((c + r) % 5 === 0) ctx.fillRect(tx + 4, ty + 6, 2, 4);
                if ((c * 3 + r) % 7 === 0) {
                    ctx.fillStyle = '#f48fb1'; // Flores
                    ctx.fillRect(tx + 18, ty + 16, 2, 2);
                }
            } else if (tile === TERRAIN.DIRT) {
                ctx.fillStyle = '#795548';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            } else if (tile === TERRAIN.PATH) {
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#6d4c41';
                ctx.fillRect(tx + 4, ty + 4, 8, 8);
                ctx.fillRect(tx + 18, ty + 18, 10, 8);
            } else if (tile === TERRAIN.WATER) {
                ctx.fillStyle = '#0288d1';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
                let waveOffset = Math.sin(waterTimer + c) * 3;
                ctx.fillRect(tx + 4, ty + 12 + waveOffset, 12, 2);
            } else if (tile === TERRAIN.HOUSE_FLOOR) {
                ctx.fillStyle = '#d7ccc8';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
            } else if (tile === TERRAIN.BED) {
                ctx.fillStyle = '#d7ccc8';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#e53935';
                ctx.fillRect(tx + 4, ty + 4, TILE_SIZE - 8, TILE_SIZE - 8);
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(tx + 6, ty + 6, TILE_SIZE - 12, 8);
            } else if (tile === TERRAIN.SHOP_COUNTER) {
                ctx.fillStyle = '#8d6e63';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.fillStyle = '#f57c00';
                ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            } else if (tile === TERRAIN.SHIPPING_BIN) {
                ctx.fillStyle = '#ff8f00';
                ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                ctx.strokeStyle = '#3e2723';
                ctx.strokeRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
            }

            // Solo Arado e Plantas
            let key = `${c},${r}`;
            if (farmPlots[key]) {
                let plot = farmPlots[key];
                if (plot.tilled) {
                    ctx.fillStyle = plot.watered ? '#3e2723' : '#5d4037';
                    ctx.fillRect(tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4);
                }

                if (plot.crop) {
                    let cropInfo = CROPS[plot.crop.key];
                    let stage = plot.crop.stage;

                    if (stage === 0) {
                        ctx.fillStyle = '#aed581';
                        ctx.fillRect(tx + 14, ty + 18, 4, 8);
                    } else if (stage === 1) {
                        ctx.fillStyle = cropInfo.leafColor;
                        ctx.fillRect(tx + 10, ty + 14, 12, 10);
                    } else if (stage === 2) {
                        ctx.fillStyle = cropInfo.leafColor;
                        ctx.fillRect(tx + 8, ty + 10, 16, 14);
                        ctx.fillStyle = cropInfo.fruitColor;
                        ctx.fillRect(tx + 12, ty + 14, 8, 8);
                    } else {
                        ctx.fillStyle = cropInfo.leafColor;
                        ctx.fillRect(tx + 6, ty + 8, 20, 16);
                        ctx.fillStyle = cropInfo.fruitColor;
                        ctx.beginPath();
                        ctx.arc(tx + 16, ty + 16, 7, 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            }
        }
    }

    // CAMADA 2: OBJETOS DE PROFUNDIDADE COM Y-SORTING
    let renderEntities = [];

    // Adicionar Jogador
    renderEntities.push({
        type: 'player',
        y: player.y + player.height,
        draw: () => {
            let px = Math.floor(player.x - camX);
            let py = Math.floor(player.y - camY);
            let bounceY = player.isMoving ? Math.sin(walkAnimTimer) * 2 : 0;

            ctx.fillStyle = 'rgba(0,0,0,0.25)';
            ctx.beginPath();
            ctx.ellipse(px + player.width / 2, py + player.height - 1, 10, 4, 0, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffcc80';
            ctx.fillRect(px, py + bounceY, player.width, player.height - 4);
            ctx.fillStyle = '#1565c0';
            ctx.fillRect(px + 2, py + 12 + bounceY, player.width - 4, player.height - 16);

            ctx.fillStyle = '#fbc02d';
            ctx.fillRect(px - 3, py - 4 + bounceY, player.width + 6, 6);
            ctx.fillRect(px + 3, py - 9 + bounceY, player.width - 6, 6);

            ctx.fillStyle = '#000000';
            let eyeX = px + (player.dirX > 0 ? 14 : (player.dirX < 0 ? 4 : 8));
            let eyeY = py + 3 + bounceY;
            ctx.fillRect(eyeX, eyeY, 3, 3);
        }
    });

    // Adicionar Árvores, Pedras e Paredes
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            let tile = mapGrid[r][c];
            let tx = c * TILE_SIZE - camX;
            let ty = r * TILE_SIZE - camY;

            if (tx + TILE_SIZE < 0 || tx > canvas.width || ty + TILE_SIZE < 0 || ty > canvas.height) continue;

            if (tile === TERRAIN.TREE) {
                renderEntities.push({
                    type: 'tree',
                    y: (r + 1) * TILE_SIZE,
                    draw: () => {
                        ctx.fillStyle = 'rgba(0,0,0,0.2)';
                        ctx.beginPath();
                        ctx.ellipse(tx + 16, ty + 28, 14, 6, 0, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#4e342e';
                        ctx.fillRect(tx + 13, ty + 16, 6, 14);

                        ctx.fillStyle = '#2e7d32';
                        ctx.beginPath();
                        ctx.arc(tx + 16, ty + 8, 16, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#388e3c';
                        ctx.beginPath();
                        ctx.arc(tx + 12, ty + 4, 10, 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            } else if (tile === TERRAIN.ROCK) {
                renderEntities.push({
                    type: 'rock',
                    y: (r + 1) * TILE_SIZE,
                    draw: () => {
                        ctx.fillStyle = '#78909c';
                        ctx.beginPath();
                        ctx.arc(tx + 16, ty + 18, 10, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#b0bec5';
                        ctx.fillRect(tx + 12, ty + 12, 4, 4);
                    }
                });
            } else if (tile === TERRAIN.HOUSE_WALL) {
                renderEntities.push({
                    type: 'wall',
                    y: (r + 1) * TILE_SIZE,
                    draw: () => {
                        ctx.fillStyle = '#4e342e';
                        ctx.fillRect(tx, ty, TILE_SIZE, TILE_SIZE);
                    }
                });
            }
        }
    }

    // Ordenar por Profundidade (Y-Sorting)
    renderEntities.sort((a, b) => a.y - b.y);
    renderEntities.forEach(e => e.draw());

    // CAMADA 3: SOBREPOSIÇÃO (TELHADO, MIRA, LINHAS, LUZ E PARTÍCULAS)
    let houseSx = 3 * TILE_SIZE - camX;
    let houseSy = 3 * TILE_SIZE - camY;
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(houseSx - 4, houseSy - 10, 6 * TILE_SIZE + 8, 16);

    if (gameState === 'PLAYING') {
        let target = getTargetTile();
        ctx.strokeStyle = '#ffee55';
        ctx.lineWidth = 2;
        ctx.strokeRect(target.col * TILE_SIZE - camX, target.row * TILE_SIZE - camY, TILE_SIZE, TILE_SIZE);
    }

    if (fishingState !== 'IDLE') {
        let pHandX = player.x + 11 - camX;
        let pHandY = player.y + 12 - camY;
        let bX = bobberPos.x - camX;
        let bY = bobberPos.y - camY;

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pHandX, pHandY);
        ctx.quadraticCurveTo((pHandX + bX) / 2, (pHandY + bY) / 2 - 15, bX, bY);
        ctx.stroke();

        ctx.fillStyle = '#ff1744';
        ctx.fillRect(bX - 2, bY - 2, 5, 5);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
        if (particles[i].update()) particles.splice(i, 1);
        else particles[i].draw(ctx, camX, camY);
    }

    for (let i = floatingTexts.length - 1; i >= 0; i--) {
        if (floatingTexts[i].update()) floatingTexts.splice(i, 1);
        else floatingTexts[i].draw(ctx, camX, camY);
    }

    // Iluminação Noturna
    if (gameTime.hour >= 18 || gameTime.hour < 6 || gameTime.weather === 'rainy') {
        let nightAlpha = 0.25;
        if (gameTime.weather === 'rainy') nightAlpha += 0.2;
        if (gameTime.hour >= 20 || gameTime.hour < 5) nightAlpha += 0.45;

        ctx.save();
        ctx.fillStyle = `rgba(8, 12, 38, ${nightAlpha})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        let px = Math.floor(player.x - camX);
        let py = Math.floor(player.y - camY);

        ctx.globalCompositeOperation = 'destination-out';
        let pGlow = ctx.createRadialGradient(px + 11, py + 14, 5, px + 11, py + 14, 95);
        pGlow.addColorStop(0, 'rgba(0,0,0,1)');
        pGlow.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = pGlow;
        ctx.beginPath();
        ctx.arc(px + 11, py + 14, 95, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}

// LOJA DO PIERRE
function toggleShop() {
    const modal = document.getElementById('shop-modal');
    if (modal.classList.contains('hidden')) {
        renderShopUI();
        modal.classList.remove('hidden');
    } else {
        modal.classList.add('hidden');
    }
}

function renderShopUI() {
    document.getElementById('shop-gold-display').innerText = `${player.gold}g`;
    const container = document.getElementById('shop-items-grid');
    container.innerHTML = '';

    Object.keys(CROPS).forEach(cropKey => {
        let crop = CROPS[cropKey];
        let row = document.createElement('div');
        row.className = 'flex justify-between items-center bg-black/40 p-2 rounded border border-amber-900';
        row.innerHTML = `
            <div>
                <div class="font-bold text-yellow-300">Semente de ${crop.name}</div>
                <div class="text-[9px] text-amber-200">Cresce em ${crop.growthDays} dias - Vende por ${crop.sellValue}g</div>
            </div>
            <button class="sd-button text-[10px] py-1 px-3" onclick="buySeed('${cropKey}')">${crop.seedCost}g</button>
        `;
        container.appendChild(row);
    });
}

function buySeed(cropKey) {
    let crop = CROPS[cropKey];
    if (player.gold >= crop.seedCost) {
        player.gold -= crop.seedCost;
        audio.playBuy();

        let seedItem = HOTBAR_ITEMS.find(i => i.cropKey === cropKey);
        if (seedItem) {
            seedItem.count++;
        } else {
            HOTBAR_ITEMS.push({
                id: `seed_${cropKey}`, name: `Semente de ${crop.name}`,
                type: 'seed', cropKey: cropKey, count: 1, icon: '🌱'
            });
        }
        renderShopUI();
        updateHUD();
    }
}

function updateHUD() {
    let dayName = gameTime.daysOfWeek[gameTime.dayOfWeekIdx];
    document.getElementById('hud-day').innerText = `${dayName} ${gameTime.day} - ${gameTime.season}`;
    document.getElementById('hud-weather-icon').innerText = gameTime.weather === 'rainy' ? '🌧️' : '☀️';

    let formattedHour = gameTime.hour % 12 === 0 ? 12 : gameTime.hour % 12;
    let period = gameTime.hour >= 12 && gameTime.hour < 24 ? 'PM' : 'AM';
    let formattedMinute = gameTime.minute < 10 ? `0${gameTime.minute}` : gameTime.minute;
    document.getElementById('hud-time').innerText = `${formattedHour}:${formattedMinute} ${period}`;

    document.getElementById('hud-gold').innerText = `${player.gold}g`;

    let energyPercent = Math.min(100, (player.energy / player.maxEnergy) * 100);
    document.getElementById('energy-bar-fill').style.height = `${energyPercent}%`;

    const hotbar = document.getElementById('hotbar');
    hotbar.innerHTML = '';
    HOTBAR_ITEMS.forEach((item, i) => {
        let slot = document.createElement('div');
        slot.className = `sd-slot ${i === selectedSlot ? 'active' : ''}`;
        slot.innerHTML = `
            <span class="sd-slot-key">${i + 1}</span>
            <span style="font-size:16px;">${item.icon}</span>
        `;
        if (item.count !== undefined) {
            slot.innerHTML += `<span class="sd-slot-count">${item.count}</span>`;
        }
        slot.onclick = () => { selectedSlot = i; updateHUD(); };
        hotbar.appendChild(slot);
    });

    let activeItem = HOTBAR_ITEMS[selectedSlot];
    document.getElementById('active-item-name').innerText = activeItem ? activeItem.name : '';
}

function gameLoop() {
    updatePlayer();
    updateGameTime();
    render();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    audio.init();
    initWorldMap();
    gameState = 'PLAYING';
    document.getElementById('main-menu').classList.add('hidden');
    document.getElementById('hud').classList.remove('hidden');
    updateHUD();
}

function toggleInstructions() {
    document.getElementById('instructions-modal').classList.toggle('hidden');
}

// EVENTOS
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    ctx.imageSmoothingEnabled = false;
});

window.addEventListener('keydown', e => {
    keys[e.key.toLowerCase()] = true;
    if (e.key === ' ' || e.key === 'Enter') interactFrontTile();

    let num = parseInt(e.key);
    if (num >= 1 && num <= 8 && num <= HOTBAR_ITEMS.length) {
        selectedSlot = num - 1;
        updateHUD();
    }
});

window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

window.addEventListener('mousemove', e => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
});

window.addEventListener('mousedown', e => {
    if (e.target.closest('#hud') || e.target.closest('#shop-modal') || e.target.closest('#main-menu') || e.target.closest('#instructions-modal')) return;
    isMouseDown = true;
    if (e.button === 0) interactFrontTile();
});

window.addEventListener('mouseup', () => { isMouseDown = false; });
window.addEventListener('blur', () => { isMouseDown = false; keys = {}; });

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
ctx.imageSmoothingEnabled = false;

requestAnimationFrame(gameLoop);