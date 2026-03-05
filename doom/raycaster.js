let ZBuffer = []; 

function draw3DEnvironment(ctx, screenWidth, screenHeight) {
    // Teto escuro
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, screenWidth, screenHeight / 2);

    // Chão com "dithering" rústico e iluminação
    let floorGrad = ctx.createLinearGradient(0, screenHeight / 2, 0, screenHeight);
    floorGrad.addColorStop(0, "#0a0a0a"); 
    floorGrad.addColorStop(1, "#2a2a2a");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, screenHeight / 2, screenWidth, screenHeight / 2);

    for (let x = 0; x < screenWidth; x++) {
        let cameraX = 2 * x / screenWidth - 1;
        let rayDirX = player.dirX + player.planeX * cameraX;
        let rayDirY = player.dirY + player.planeY * cameraX;

        let mapX = Math.floor(player.x);
        let mapY = Math.floor(player.y);
        let sideDistX, sideDistY;
        let deltaDistX = Math.abs(1 / rayDirX);
        let deltaDistY = Math.abs(1 / rayDirY);
        let perpWallDist;
        let stepX, stepY, hit = 0, side;

        if (rayDirX < 0) { stepX = -1; sideDistX = (player.x - mapX) * deltaDistX; } 
        else { stepX = 1; sideDistX = (mapX + 1.0 - player.x) * deltaDistX; }
        if (rayDirY < 0) { stepY = -1; sideDistY = (player.y - mapY) * deltaDistY; } 
        else { stepY = 1; sideDistY = (mapY + 1.0 - player.y) * deltaDistY; }

        while (hit === 0) {
            if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; } 
            else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
            if (map[mapY][mapX] > 0) hit = 1;
        }

        if (side === 0) perpWallDist = (mapX - player.x + (1 - stepX) / 2) / rayDirX;
        else perpWallDist = (mapY - player.y + (1 - stepY) / 2) / rayDirY;

        ZBuffer[x] = perpWallDist;

        let lineHeight = Math.floor(screenHeight / perpWallDist);
        let drawStart = -lineHeight / 2 + screenHeight / 2;
        let drawEnd = lineHeight / 2 + screenHeight / 2;
        
        // Limita os eixos para não desenhar fora da tela desnecessariamente
        let drawStartScreen = Math.max(0, drawStart);
        let drawEndScreen = Math.min(screenHeight - 1, drawEnd);

        // ONDE O RAIO BATEU NA PAREDE (Para mapear textura)
        let wallX;
        if (side === 0) wallX = player.y + perpWallDist * rayDirY;
        else wallX = player.x + perpWallDist * rayDirX;
        wallX -= Math.floor(wallX);
        
        let texX = Math.floor(wallX * 32); // Divide o bloco em 32 pixels

        // Cores base (Cinza esverdeado tipo base militar)
        let r = side === 1 ? 50 : 70;
        let g = side === 1 ? 60 : 80;
        let b = side === 1 ? 50 : 70;

        let lightBoost = player.isShooting ? 0.6 : 0;
        let shadow = Math.max(0, (1 - (perpWallDist / 9)) + lightBoost); 
        let shakeY = player.shakeTime > 0 ? (Math.random() - 0.5) * 8 : 0;

        // Desenha a coluna de pixels com Textura Procedural (Bitwise XOR)
        for(let y = drawStartScreen; y < drawEndScreen; y++) {
            let d = y - screenHeight / 2 + lineHeight / 2;
            let texY = Math.floor((d * 32) / lineHeight);
            
            // Cria um padrão de grade/cimento estilo Doom
            let texPattern = (texX ^ texY) % 5 === 0 ? 0.7 : 1.0;
            
            // Desenha bordas de tijolos escuros
            if (texX === 0 || texY % 16 === 0) texPattern = 0.3;

            let finalR = Math.floor(r * shadow * texPattern);
            let finalG = Math.floor(g * shadow * texPattern);
            let finalB = Math.floor(b * shadow * texPattern);

            ctx.fillStyle = `rgb(${finalR}, ${finalG}, ${finalB})`;
            ctx.fillRect(x, y + shakeY, 1, 1); // Renderiza pixel a pixel na vertical
        }
    }
}