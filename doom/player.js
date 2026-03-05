const player = {
    x: mapWidth / 2 + 0.5,
    y: mapHeight / 2 + 0.5,
    dirX: -1, dirY: 0, 
    planeX: 0, planeY: 0.66,
    moveSpeed: 0.05,
    rotSpeed: 0.04,
    hp: 100,         
    floor: 1,        
    isShooting: false,
    canShoot: true,
    shakeTime: 0 // NOVO: Controle de tremor
};

const keys = { w: false, s: false, a: false, d: false };

function handleShoot() {
    if (player.canShoot) {
        player.isShooting = true;
        player.canShoot = false;
        player.shakeTime = 5; // Inicia o tremor na tela

        if(typeof playShootSound === 'function') playShootSound();
        
        setTimeout(() => { 
            player.isShooting = false; 
            player.canShoot = true; 
        }, 400); // Aumentei o cooldown para sentir mais peso na escopeta
    }
}

// Reduz o tempo de tremor constantemente
setInterval(() => {
    if (player.shakeTime > 0) player.shakeTime--;
}, 16);

// Teclado
window.addEventListener('keydown', (e) => {
    if(e.key === 'w' || e.key === 'ArrowUp') keys.w = true;
    if(e.key === 's' || e.key === 'ArrowDown') keys.s = true;
    if(e.key === 'a' || e.key === 'ArrowLeft') keys.a = true;
    if(e.key === 'd' || e.key === 'ArrowRight') keys.d = true;
    if(e.code === 'Space') handleShoot();
});

window.addEventListener('keyup', (e) => {
    if(e.key === 'w' || e.key === 'ArrowUp') keys.w = false;
    if(e.key === 's' || e.key === 'ArrowDown') keys.s = false;
    if(e.key === 'a' || e.key === 'ArrowLeft') keys.a = false;
    if(e.key === 'd' || e.key === 'ArrowRight') keys.d = false;
});

// Mouse para atirar
window.addEventListener('mousedown', (e) => {
    if (document.pointerLockElement === document.getElementById('gameCanvas')) {
        handleShoot();
    }
});