const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 1024; canvas.height = 576;

const roster = {
    brigadeiro:  { id: 'brigadeiro', nome: "Brigadeiro", color: '#4a2c2a', avatar: '🍫' },
    trakinas:    { id: 'trakinas',   nome: "Trakinas",   color: '#e67e22', avatar: '🍪' },
    pacoquinha:  { id: 'pacoquinha', nome: "Paçoquinha", color: '#d2b48c', avatar: '🥜' },
    docedelete:  { id: 'docedelete', nome: "Doce de Leite", color: '#c98b42', avatar: '🍮' },
    beijinho:    { id: 'beijinho',   nome: "Beijinho",   color: '#e0e0e0', avatar: '🥥' }
};

let p1Choice = null, p2Choice = null, player, enemy;
let particles = [];
let floatTexts = [];
let screenShake = 0; // TEMPO DE TREMOR
let hitStop = 0;     // CONGELAMENTO NO IMPACTO

const grid = document.getElementById('char-grid');
const title = document.getElementById('select-title');

Object.values(roster).forEach(char => {
    const btn = document.createElement('div'); btn.className = 'char-card';
    btn.innerHTML = `<div class="avatar">${char.avatar}</div><h2>${char.nome}</h2>`;
    btn.onclick = () => selectCharacter(char); grid.appendChild(btn);
});

function selectCharacter(char) {
    if (!p1Choice) { p1Choice = char; title.innerHTML = "P2: ESCOLHA SEU DOCE"; title.style.color = "#3498db"; } 
    else if (!p2Choice) { p2Choice = char; startGame(); }
}

function startGame() {
    document.getElementById('selection-screen').style.display = 'none';
    document.getElementById('game-container').style.display = 'flex';
    document.getElementById('controls').style.display = 'flex';

    player = new Fighter({ charId: p1Choice.id, name: p1Choice.nome, color: p1Choice.color, position: { x: 150, y: 100 }, velocity: { x: 0, y: 0 }, offset: { x: 0, y: 0 } });
    enemy = new Fighter({ charId: p2Choice.id, name: p2Choice.nome, color: p2Choice.color, position: { x: 800, y: 100 }, velocity: { x: 0, y: 0 }, offset: { x: -50, y: 0 } });

    document.getElementById('p1-name').innerText = player.name; document.getElementById('p2-name').innerText = enemy.name;
    decreaseTimer(); animate();
}

const keys = { a: { pressed: false }, d: { pressed: false }, ArrowRight: { pressed: false }, ArrowLeft: { pressed: false } };

function hasCollided({ rect1, rect2 }) {
    return (rect1.attackBox.position.x + rect1.attackBox.width >= rect2.position.x && rect1.attackBox.position.x <= rect2.position.x + rect2.width && rect1.attackBox.position.y + rect1.attackBox.height >= rect2.position.y && rect1.attackBox.position.y <= rect2.position.y + rect2.height);
}

// EFEITO ZIKA DE PORRADA
function applyHit(attacker, defender, comboId, healthBarId) {
    attacker.isAttacking = false; 
    let isHeavy = attacker.currentAttack === 'heavy';
    let dano = attacker.attacks[attacker.currentAttack].damage; 
    
    // Combo damage boost
    let now = Date.now();
    if (now - defender.lastHitTime < 1500) defender.combo++; else defender.combo = 1;
    defender.lastHitTime = now;
    if(defender.combo > 1) dano += 3;

    defender.health -= dano;
    if(defender.health < 0) defender.health = 0;
    document.getElementById(healthBarId).style.width = defender.health + '%';

    // JUICE: Partículas!
    let hitX = defender.position.x + defender.width/2;
    let hitY = defender.position.y + 40;
    for(let i=0; i<15; i++) particles.push(new Particle(hitX, hitY, defender.color));

    // JUICE: Textos Flutuantes
    const words = isHeavy ? ['CRASH!', 'BOOM!', 'ZIKA!'] : ['POUCH', 'BAM', 'SMASH'];
    let word = words[Math.floor(Math.random() * words.length)];
    if(defender.combo > 1) word = `${defender.combo} HITS!`;
    floatTexts.push(new FloatingText(hitX - 20, hitY - 20, word, isHeavy ? 'red' : 'yellow'));

    // JUICE: Tremor de tela e Hitstop
    screenShake = isHeavy ? 15 : 5;
    hitStop = isHeavy ? 6 : 2; // Congela os frames pra dar peso
}

let gameTimer = 60, timerId;
function determineWinner() {
    clearTimeout(timerId); document.getElementById('game-over').style.display = 'flex';
    const winnerText = document.getElementById('winner-text');
    if (player.health === enemy.health) winnerText.innerHTML = 'EMPATE!';
    else if (player.health > enemy.health) winnerText.innerHTML = `${player.name} WINS!`;
    else winnerText.innerHTML = `${enemy.name} WINS!`;
}

function decreaseTimer() {
    if (gameTimer > 0) { timerId = setTimeout(decreaseTimer, 1000); gameTimer--; document.getElementById('timer').innerHTML = gameTimer; }
    if (gameTimer === 0) determineWinner();
}

function drawBackground(ctx, canvas) {
    let sky = ctx.createLinearGradient(0,0,0,canvas.height);
    sky.addColorStop(0, '#f29ecb'); sky.addColorStop(0.6, '#86a8e7');
    ctx.fillStyle = sky; ctx.fillRect(0,0,canvas.width, canvas.height);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.beginPath(); ctx.arc(150, 450, 200, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(500, 480, 250, 0, Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(850, 440, 180, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#e6b97e'; ctx.fillRect(0, canvas.height - 100, canvas.width, 100); ctx.fillStyle = '#c98b42'; ctx.fillRect(0, canvas.height - 90, canvas.width, 15);
    ctx.strokeStyle = '#c98b42'; ctx.lineWidth = 2; for(let i=0; i<1024; i+=30) { ctx.beginPath(); ctx.moveTo(i, canvas.height-75); ctx.lineTo(i+20, canvas.height); ctx.stroke(); }
}

function animate() {
    window.requestAnimationFrame(animate);

    // HITSTOP: Se tomou um golpe forte, a engine "pula" a atualização e congela tudo
    if (hitStop > 0) { hitStop--; return; }

    ctx.save();
    
    // SCREEN SHAKE: Faz a câmera tremer loucamente
    if (screenShake > 0) {
        let dx = (Math.random() - 0.5) * screenShake * 2;
        let dy = (Math.random() - 0.5) * screenShake * 2;
        ctx.translate(dx, dy);
        screenShake--;
    }

    drawBackground(ctx, canvas);
    
    player.update(ctx, canvas.height); enemy.update(ctx, canvas.height);

    // VELOCIDADE DE CORRIDA AUMENTADA PARA 9 (Mais dinâmico)
    player.velocity.x = 0;
    if (keys.a.pressed && player.position.x > 0) { player.velocity.x = -9; player.facingRight = false; }
    else if (keys.d.pressed && player.position.x + player.width < canvas.width) { player.velocity.x = 9; player.facingRight = true; }

    enemy.velocity.x = 0;
    if (keys.ArrowLeft.pressed && enemy.position.x > 0) { enemy.velocity.x = -9; enemy.facingRight = false; }
    else if (keys.ArrowRight.pressed && enemy.position.x + enemy.width < canvas.width) { enemy.velocity.x = 9; enemy.facingRight = true; }

    // Dano
    if (player.isAttacking && hasCollided({ rect1: player, rect2: enemy })) { applyHit(player, enemy, 'p1-combo', 'p2-health'); }
    if (enemy.isAttacking && hasCollided({ rect1: enemy, rect2: player })) { applyHit(enemy, player, 'p2-combo', 'p1-health'); }

    // Desenha as partículas e textos por cima de tudo
    particles.forEach((particle, i) => { if(particle.alpha <= 0) particles.splice(i, 1); else particle.update(ctx); });
    floatTexts.forEach((text, i) => { if(text.alpha <= 0) floatTexts.splice(i, 1); else text.update(ctx); });

    ctx.restore(); // Limpa o shake pro próximo frame

    if (player.health <= 0 || enemy.health <= 0) determineWinner();
}

window.addEventListener('keydown', (event) => {
    if (!player || !enemy || player.health <= 0 || enemy.health <= 0) return;
    switch (event.key.toLowerCase()) {
        // PULO AUMENTADO PARA -20 (Por conta da gravidade maior)
        case 'd': keys.d.pressed = true; break; case 'a': keys.a.pressed = true; break; case 'w': if (player.velocity.y === 0) player.velocity.y = -20; break; case 'f': player.attack('light'); break; case 'g': player.attack('heavy'); break;
        case 'arrowright': keys.ArrowRight.pressed = true; break; case 'arrowleft': keys.ArrowLeft.pressed = true; break; case 'arrowup': if (enemy.velocity.y === 0) enemy.velocity.y = -20; break; case 'o': enemy.attack('light'); break; case 'p': enemy.attack('heavy'); break;
    }
});

window.addEventListener('keyup', (event) => {
    if (!player || !enemy) return;
    switch (event.key.toLowerCase()) { case 'd': keys.d.pressed = false; break; case 'a': keys.a.pressed = false; break; case 'arrowright': keys.ArrowRight.pressed = false; break; case 'arrowleft': keys.ArrowLeft.pressed = false; break; }
});