const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const screenWidth = 320;
const screenHeight = 200;
canvas.width = screenWidth;
canvas.height = screenHeight;

// Trava o mouse e inicia o áudio
canvas.addEventListener('click', () => {
    canvas.requestPointerLock();
    initAudio(); // A música procedural começa aqui!
});

// Movimento do mouse
document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === canvas) {
        const sensitivity = 0.003; 
        const rot = -e.movementX * sensitivity; // Invertido o sinal para rotacionar natural
        
        let oldDirX = player.dirX;
        player.dirX = player.dirX * Math.cos(rot) - player.dirY * Math.sin(rot);
        player.dirY = oldDirX * Math.sin(rot) + player.dirY * Math.cos(rot);
        
        let oldPlaneX = player.planeX;
        player.planeX = player.planeX * Math.cos(rot) - player.planeY * Math.sin(rot);
        player.planeY = oldPlaneX * Math.sin(rot) + player.planeY * Math.cos(rot);
    }
}, false);

let lastTime = 0;
const fpsEl = document.getElementById('fps');

function updatePlayer(dt) {
    let isMoving = false;
    
    // Calcula velocidade com base no frame rate (suavidade)
    let moveStep = player.moveSpeed; 

    if (keys.w) {
        if (map[Math.floor(player.y)][Math.floor(player.x + player.dirX * moveStep)] === 0) player.x += player.dirX * moveStep;
        if (map[Math.floor(player.y + player.dirY * moveStep)][Math.floor(player.x)] === 0) player.y += player.dirY * moveStep;
        isMoving = true;
    }
    if (keys.s) {
        if (map[Math.floor(player.y)][Math.floor(player.x - player.dirX * moveStep)] === 0) player.x -= player.dirX * moveStep;
        if (map[Math.floor(player.y - player.dirY * moveStep)][Math.floor(player.x)] === 0) player.y -= player.dirY * moveStep;
        isMoving = true;
    }
    
    // Strafe (andar de lado com A e D)
    if (keys.a) {
        let perpDirX = player.dirY; let perpDirY = -player.dirX;
        if (map[Math.floor(player.y)][Math.floor(player.x + perpDirX * moveStep)] === 0) player.x += perpDirX * moveStep;
        if (map[Math.floor(player.y + perpDirY * moveStep)][Math.floor(player.x)] === 0) player.y += perpDirY * moveStep;
        isMoving = true;
    }
    if (keys.d) {
        let perpDirX = -player.dirY; let perpDirY = player.dirX;
        if (map[Math.floor(player.y)][Math.floor(player.x + perpDirX * moveStep)] === 0) player.x += perpDirX * moveStep;
        if (map[Math.floor(player.y + perpDirY * moveStep)][Math.floor(player.x)] === 0) player.y += perpDirY * moveStep;
        isMoving = true;
    }

    return isMoving;
}

// ... (mantenha o topo igual)

function gameLoop(time) {
    const dt = time - lastTime;
    lastTime = time;
    if(time % 10 === 0) fpsEl.innerText = Math.round(1000 / dt);

    let isMoving = updatePlayer(dt);

    draw3DEnvironment(ctx, screenWidth, screenHeight); 
    updateAndDrawEnemies(ctx, screenWidth, screenHeight); // NOME ATUALIZADO AQUI
    drawWeaponAndHUD(ctx, screenWidth, screenHeight, isMoving); 

    requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);