let enemies = [
    { x: player.x + 3, y: player.y + 0, hp: 1 }, 
    { x: player.x + 3, y: player.y + 2, hp: 1 },
    { x: player.x - 3, y: player.y - 2, hp: 1 }
];
let particles = []; // Sistema de sangue
let bobbingTime = 0;
let flashTime = 0;

function drawWeaponAndHUD(ctx, screenWidth, screenHeight, isMoving) {
    if (isMoving) bobbingTime += 0.25;
    else bobbingTime = Math.sin(bobbingTime) > 0 ? bobbingTime + 0.1 : 0; 
    
    const bobY = Math.abs(Math.sin(bobbingTime)) * 12;
    const bobX = Math.cos(bobbingTime) * 8;
    const centerX = screenWidth / 2;
    const bottomY = screenHeight;
    let recoilY = player.isShooting ? 40 : 0;

    // Flash Iluminando tudo
    if (player.isShooting) {
        ctx.fillStyle = "rgba(255, 150, 0, 0.3)";
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        
        let flashSize = 40 + Math.random() * 20;
        let grad = ctx.createRadialGradient(centerX + bobX, bottomY - 110 + bobY + recoilY, 5, centerX + bobX, bottomY - 110 + bobY + recoilY, flashSize);
        grad.addColorStop(0, "white");
        grad.addColorStop(0.5, "orange");
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(centerX + bobX, bottomY - 110 + bobY + recoilY, flashSize, 0, Math.PI * 2);
        ctx.fill();
    }

    // Cano da Escopeta (Com sombreamento e reflexo metálico)
    let gunGrad = ctx.createLinearGradient(centerX + bobX - 20, 0, centerX + bobX + 20, 0);
    gunGrad.addColorStop(0, "#111");
    gunGrad.addColorStop(0.3, "#555"); // Reflexo
    gunGrad.addColorStop(0.5, "#000"); // Fenda do meio
    gunGrad.addColorStop(0.7, "#555"); // Reflexo
    gunGrad.addColorStop(1, "#111");

    ctx.fillStyle = gunGrad;
    ctx.beginPath();
    ctx.moveTo(centerX + bobX - 25, bottomY);
    ctx.lineTo(centerX + bobX - 18, bottomY - 100 + bobY + recoilY);
    ctx.lineTo(centerX + bobX + 18, bottomY - 100 + bobY + recoilY);
    ctx.lineTo(centerX + bobX + 25, bottomY);
    ctx.fill();

    // Mira
    ctx.fillStyle = "rgba(0, 255, 0, 0.5)"; // Mira verde clássica
    ctx.fillRect(centerX - 1, (screenHeight / 2) - 1, 2, 2);

    if (flashTime > 0) {
        ctx.fillStyle = `rgba(255, 0, 0, ${flashTime})`;
        ctx.fillRect(0, 0, screenWidth, screenHeight);
        flashTime -= 0.05;
    }

    ctx.fillStyle = "white";
    ctx.font = "bold 14px Courier";
    ctx.fillText(`HP: ${player.hp} | ANDAR: ${player.floor} | RESTAM: ${enemies.length}`, 10, screenHeight - 10);
}

function updateAndDrawEnemies(ctx, screenWidth, screenHeight) {
    const centerX = screenWidth / 2;
    let shakeY = player.shakeTime > 0 ? (Math.random() - 0.5) * 8 : 0;

    // Processa inimigos
    for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        let dx = player.x - e.x;
        let dy = player.y - e.y;
        let dist = Math.sqrt(dx*dx + dy*dy);
        
        if (dist > 0.5 && dist < 12) {
            let moveX = (dx/dist) * 0.025;
            let moveY = (dy/dist) * 0.025;
            if (map[Math.floor(e.y)][Math.floor(e.x + moveX)] === 0) e.x += moveX;
            if (map[Math.floor(e.y + moveY)][Math.floor(e.x)] === 0) e.y += moveY;
        } else if (dist <= 0.5) {
            player.hp -= 1;
            flashTime = 0.4;
            player.shakeTime = 6;
            if (player.hp <= 0) { alert("MORTO! F5 para reiniciar."); player.hp = 100; }
        }

        let spriteX = e.x - player.x;
        let spriteY = e.y - player.y;

        let invDet = 1.0 / (player.planeX * player.dirY - player.dirX * player.planeY);
        let transformX = invDet * (player.dirY * spriteX - player.dirX * spriteY);
        let transformY = invDet * (-player.planeY * spriteX + player.planeX * spriteY);

        let spriteScreenX = Math.floor((screenWidth / 2) * (1 + transformX / transformY));

        if (transformY > 0) {
            let spriteHeight = Math.abs(Math.floor(screenHeight / transformY));
            let drawStartY = -spriteHeight / 2 + screenHeight / 2 + shakeY;
            
            // Acertou o tiro? Cria partículas de sangue!
            if (player.isShooting && Math.abs(spriteScreenX - centerX) < spriteHeight/2 && transformY < ZBuffer[centerX]) {
                for(let p=0; p<20; p++) {
                    particles.push({
                        x: spriteScreenX, y: drawStartY + spriteHeight/2,
                        vx: (Math.random() - 0.5) * 20, vy: (Math.random() - 0.5) * 20 - 5,
                        life: 1.0, size: Math.random() * 8 + 2
                    });
                }
                enemies.splice(i, 1); 
                continue; 
            }

            if (transformY < ZBuffer[spriteScreenX]) {
                // Sombra do inimigo
                let depth = Math.max(0, 1 - (transformY / 10));
                
                ctx.fillStyle = `rgb(${200 * depth}, 0, 0)`;
                ctx.beginPath();
                ctx.arc(spriteScreenX, drawStartY + spriteHeight/2, spriteHeight/2.5, 0, Math.PI*2);
                ctx.fill();

                ctx.fillStyle = `rgb(${255 * depth}, ${255 * depth}, 0)`; // Olho
                ctx.beginPath();
                ctx.arc(spriteScreenX, drawStartY + spriteHeight/2.5, spriteHeight/8, 0, Math.PI*2);
                ctx.fill();
            }
        }
    }

    // Processa e Desenha Partículas (Sangue)
    for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 1; // Gravidade puxando o sangue pra baixo
        p.life -= 0.05;
        
        if (p.life > 0 && p.y < screenHeight) {
            ctx.fillStyle = `rgba(180, 0, 0, ${p.life})`;
            ctx.fillRect(p.x, p.y + shakeY, p.size, p.size);
        } else {
            particles.splice(i, 1);
        }
    }
}