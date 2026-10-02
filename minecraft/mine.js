 const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d', { alpha: false }); // Otimização

        // Configurações do Mundo
        const BLOCK_SIZE = 32;
        const WORLD_WIDTH = 200; // Largura do mundo em blocos
        const WORLD_HEIGHT = 100; // Altura do mundo em blocos
        const CHUNK_SIZE = 16;
        
        // Definição dos blocos (ID -> Cor/Propriedades)
        const BLOCKS = {
            0: { name: 'Air', color: null, solid: false },
            1: { name: 'Grass', color: '#5b8731', topColor: '#71aa34', solid: true }, // Bloco superior
            2: { name: 'Dirt', color: '#7a5a3b', solid: true },
            3: { name: 'Stone', color: '#7d7d7d', solid: true },
            4: { name: 'Wood', color: '#5c4033', sideColor: '#4a332a', solid: true }, // Tronco
            5: { name: 'Leaves', color: '#397a2b', solid: true },
            6: { name: 'Bedrock', color: '#1a1a1a', solid: true } // Fundo inquebrável
        };

        // Estado do Jogo
        let world = [];
        let keys = {};
        let mouse = { x: 0, y: 0, leftDown: false, rightDown: false, worldX: 0, worldY: 0 };
        
        // Câmera
        let camera = { x: 0, y: 0 };
        
        // Inventário
        let inventory = [1, 2, 3, 4, 5]; // IDs dos blocos disponíveis
        let selectedSlot = 0; // Índice (0 a 4)

        function initWorld() {
            world = new Array(WORLD_HEIGHT).fill(0).map(() => new Array(WORLD_WIDTH).fill(0));
            
            // Gerador de ruído simples (Smooth Random 1D) para relevo
            let heights = [];
            let h = WORLD_HEIGHT / 2; // Altura base (50)
            
            for(let x = 0; x < WORLD_WIDTH; x++) {
                // Interpolação super simples para terreno ondulado
                if (x % 5 === 0) {
                    h += (Math.random() * 6 - 3); // Muda direção a cada 5 blocos
                    h = Math.max(20, Math.min(WORLD_HEIGHT - 20, h)); // Clampar altura
                }
                heights[x] = Math.floor(h);
            }
            
            // Suavização do terreno
            let smoothHeights = [];
            for (let x = 0; x < WORLD_WIDTH; x++) {
                let sum = 0;
                let count = 0;
                for(let i = -2; i <= 2; i++) {
                    if(x+i >= 0 && x+i < WORLD_WIDTH) {
                        sum += heights[x+i];
                        count++;
                    }
                }
                smoothHeights[x] = Math.floor(sum / count);
            }

            // Preencher mundo baseado nas alturas
            for (let x = 0; x < WORLD_WIDTH; x++) {
                let surfaceY = smoothHeights[x];
                
                for (let y = 0; y < WORLD_HEIGHT; y++) {
                    if (y === WORLD_HEIGHT - 1) {
                        world[y][x] = 6; // Bedrock na última camada
                    } else if (y > surfaceY + Math.random() * 2 + 3) {
                        world[y][x] = 3; // Pedra no fundo
                    } else if (y > surfaceY) {
                        world[y][x] = 2; // Terra logo abaixo da superfície
                    } else if (y === surfaceY) {
                        world[y][x] = 1; // Grama na superfície
                        
                        // Árvores (Chance pequena se for grama)
                        if (x > 5 && x < WORLD_WIDTH - 5 && Math.random() < 0.08) {
                            buildTree(x, y - 1);
                        }
                    }
                }
            }
        }

        // Função auxiliar para construir árvores
        function buildTree(x, baseY) {
            let height = Math.floor(Math.random() * 3) + 4; // Tronco de 4 a 6 blocos
            
            // Tronco
            for(let i = 0; i < height; i++) {
                if(baseY - i >= 0) world[baseY - i][x] = 4; // Madeira
            }
            
            // Folhas (Um pequeno "círculo" de folhas no topo)
            let leafCenterY = baseY - height + 1;
            for(let ly = -2; ly <= 1; ly++) {
                for(let lx = -2; lx <= 2; lx++) {
                    if(Math.abs(lx) === 2 && Math.abs(ly) === 2) continue; // Arredondar bordas
                    if(ly === 1 && Math.abs(lx) === 2) continue; // Topo menor
                    
                    let cx = x + lx;
                    let cy = leafCenterY + ly;
                    
                    // Colocar folha apenas se estiver vazio
                    if(cy >= 0 && cy < WORLD_HEIGHT && cx >= 0 && cx < WORLD_WIDTH) {
                        if(world[cy][cx] === 0) world[cy][cx] = 5; 
                    }
                }
            }
        }

        const player = {
            x: WORLD_WIDTH * BLOCK_SIZE / 2, // Centro do mapa
            y: 0, 
            width: BLOCK_SIZE * 0.7, // Um pouco mais estreito que o bloco para não agarrar
            height: BLOCK_SIZE * 1.8, // Quase 2 blocos de altura
            vx: 0,
            vy: 0,
            speed: 5,
            jumpStrength: 8.5,
            gravity: 0.4,
            grounded: false,
            color: '#3498db'
        };

        // Spawn inicial (Colocar jogador acima da superfície)
        function spawnPlayer() {
            let px = Math.floor(player.x / BLOCK_SIZE);
            for(let y = 0; y < WORLD_HEIGHT; y++) {
                if(world[y][px] !== 0) {
                    player.y = (y * BLOCK_SIZE) - player.height - 10;
                    break;
                }
            }
        }

        function getBlockAt(x, y) {
            let bx = Math.floor(x / BLOCK_SIZE);
            let by = Math.floor(y / BLOCK_SIZE);
            if (bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return BLOCKS[6]; // Limite do mundo age como bedrock
            return BLOCKS[world[by][bx]];
        }

        function checkCollision(x, y) {
            // Pontos do retângulo do jogador
            const left = x;
            const right = x + player.width;
            const top = y;
            const bottom = y + player.height;

            // Checa os cantos e os meios do jogador contra a grid de blocos
            return getBlockAt(left, top).solid ||
                   getBlockAt(right, top).solid ||
                   getBlockAt(left, bottom).solid ||
                   getBlockAt(right, bottom).solid ||
                   getBlockAt(left, top + player.height/2).solid ||
                   getBlockAt(right, top + player.height/2).solid;
        }

        function updatePlayer() {
            // Controles X
            if (keys['a'] || keys['arrowleft']) player.vx = -player.speed;
            else if (keys['d'] || keys['arrowright']) player.vx = player.speed;
            else player.vx *= 0.7; // Fricção (Deslize rápido)

            // Movimento Horizontal
            player.x += player.vx;
            
            // Colisão Horizontal
            if (checkCollision(player.x, player.y)) {
                // Resolver colisão movendo de volta e travando a velocidade
                if (player.vx > 0) {
                    player.x = Math.floor((player.x + player.width) / BLOCK_SIZE) * BLOCK_SIZE - player.width - 0.1;
                } else if (player.vx < 0) {
                    player.x = Math.floor(player.x / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE + 0.1;
                }
                player.vx = 0;
            }

            // Pulo
            if ((keys['w'] || keys['arrowup'] || keys[' ']) && player.grounded) {
                player.vy = -player.jumpStrength;
                player.grounded = false;
            }

            // Aplicar Gravidade
            player.vy += player.gravity;
            
            // Limite de velocidade terminal
            if(player.vy > 15) player.vy = 15;

            // Movimento Vertical
            player.y += player.vy;
            player.grounded = false;

            // Colisão Vertical
            if (checkCollision(player.x, player.y)) {
                if (player.vy > 0) {
                    // Batendo no chão
                    player.y = Math.floor((player.y + player.height) / BLOCK_SIZE) * BLOCK_SIZE - player.height - 0.1;
                    player.grounded = true;
                } else if (player.vy < 0) {
                    // Batendo o teto
                    player.y = Math.floor(player.y / BLOCK_SIZE) * BLOCK_SIZE + BLOCK_SIZE + 0.1;
                }
                player.vy = 0;
            }

            // Limites do mundo (laterais)
            if (player.x < 0) player.x = 0;
            if (player.x + player.width > WORLD_WIDTH * BLOCK_SIZE) player.x = WORLD_WIDTH * BLOCK_SIZE - player.width;
            
            // Fundo do mundo (morte = respawn no topo)
            if (player.y > WORLD_HEIGHT * BLOCK_SIZE) {
                spawnPlayer();
            }
        }

        function updateCamera() {
            // Suavizar câmera em direção ao jogador
            let targetCamX = player.x + player.width / 2 - canvas.width / 2;
            let targetCamY = player.y + player.height / 2 - canvas.height / 2;
            
            camera.x += (targetCamX - camera.x) * 0.1;
            camera.y += (targetCamY - camera.y) * 0.1;

            // Limites da Câmera
            camera.x = Math.max(0, Math.min(camera.x, WORLD_WIDTH * BLOCK_SIZE - canvas.width));
            camera.y = Math.max(0, Math.min(camera.y, WORLD_HEIGHT * BLOCK_SIZE - canvas.height));
        }

        function interactWithWorld() {
            if(!mouse.leftDown && !mouse.rightDown) return;

            // Posição no mundo baseada no clique + offset da câmera
            mouse.worldX = mouse.x + camera.x;
            mouse.worldY = mouse.y + camera.y;

            let bx = Math.floor(mouse.worldX / BLOCK_SIZE);
            let by = Math.floor(mouse.worldY / BLOCK_SIZE);

            // Checar limites do array do mundo
            if(bx < 0 || bx >= WORLD_WIDTH || by < 0 || by >= WORLD_HEIGHT) return;

            // Distância do jogador para impedir quebrar de longe
            let pCenterX = player.x + player.width / 2;
            let pCenterY = player.y + player.height / 2;
            let dist = Math.hypot(mouse.worldX - pCenterX, mouse.worldY - pCenterY);
            let maxReach = BLOCK_SIZE * 5; // Alcance de 5 blocos

            if (dist > maxReach) return;

            if (mouse.leftDown) {
                // Quebrar bloco
                if(world[by][bx] !== 0 && world[by][bx] !== 6) { // Não quebra Ar ou Bedrock
                    world[by][bx] = 0;
                }
            } else if (mouse.rightDown) {
                // Colocar bloco (checa se está vazio e não colide com o jogador)
                if(world[by][bx] === 0) {
                    // Simular rect de colisão do bloco
                    let bRect = { left: bx*BLOCK_SIZE, right: bx*BLOCK_SIZE + BLOCK_SIZE, top: by*BLOCK_SIZE, bottom: by*BLOCK_SIZE + BLOCK_SIZE };
                    let pRect = { left: player.x, right: player.x + player.width, top: player.y, bottom: player.y + player.height };
                    
                    // Checagem AABB bloco vs jogador
                    let intersect = !(pRect.left >= bRect.right || 
                                      pRect.right <= bRect.left || 
                                      pRect.top >= bRect.bottom || 
                                      pRect.bottom <= bRect.top);

                    if(!intersect) {
                        world[by][bx] = inventory[selectedSlot];
                    }
                }
            }
        }

        function drawBlock(x, y, type) {
            let blockDef = BLOCKS[type];
            if (!blockDef || !blockDef.color) return;

            // Cores
            ctx.fillStyle = blockDef.color;
            ctx.fillRect(x, y, BLOCK_SIZE, BLOCK_SIZE);
            
            // Detalhes visuais para blocos específicos
            if(blockDef.topColor) {
                ctx.fillStyle = blockDef.topColor;
                ctx.fillRect(x, y, BLOCK_SIZE, Math.floor(BLOCK_SIZE * 0.25)); // Topo da grama
            } else if (blockDef.sideColor) {
                ctx.fillStyle = blockDef.sideColor;
                ctx.fillRect(x, y, Math.floor(BLOCK_SIZE*0.2), BLOCK_SIZE); // Textura de madeira
                ctx.fillRect(x + Math.floor(BLOCK_SIZE*0.8), y, Math.floor(BLOCK_SIZE*0.2), BLOCK_SIZE);
            }
            
            // Sombra/Bevel interior simulado (para dar sensação 3D ao tile 2D)
            ctx.fillStyle = 'rgba(0,0,0,0.15)';
            ctx.fillRect(x + BLOCK_SIZE - 2, y, 2, BLOCK_SIZE); // Borda direita escurecida
            ctx.fillRect(x, y + BLOCK_SIZE - 2, BLOCK_SIZE, 2); // Borda fundo escurecida
            
            ctx.fillStyle = 'rgba(255,255,255,0.1)';
            ctx.fillRect(x, y, BLOCK_SIZE, 2); // Borda topo clara
            ctx.fillRect(x, y, 2, BLOCK_SIZE); // Borda esquerda clara
        }

        function render() {
            // Céu (Background dinâmico simples)
            let skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
            skyGradient.addColorStop(0, "#87CEEB"); // Azul céu topo
            skyGradient.addColorStop(1, "#E0F6FF"); // Azul claro horizonte
            ctx.fillStyle = skyGradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Calcular quais blocos estão visíveis na câmera para otimizar desenho (Culling)
            let startCol = Math.floor(camera.x / BLOCK_SIZE);
            let endCol = startCol + Math.floor(canvas.width / BLOCK_SIZE) + 1;
            let startRow = Math.floor(camera.y / BLOCK_SIZE);
            let endRow = startRow + Math.floor(canvas.height / BLOCK_SIZE) + 1;

            // Clampar limites
            startCol = Math.max(0, startCol);
            endCol = Math.min(WORLD_WIDTH, endCol);
            startRow = Math.max(0, startRow);
            endRow = Math.min(WORLD_HEIGHT, endRow);

            // Desenhar Mundo
            for (let y = startRow; y < endRow; y++) {
                for (let x = startCol; x < endCol; x++) {
                    let tile = world[y][x];
                    if (tile !== 0) {
                        drawBlock(
                            Math.floor(x * BLOCK_SIZE - camera.x), 
                            Math.floor(y * BLOCK_SIZE - camera.y), 
                            tile
                        );
                    }
                }
            }

            // Desenhar Highlight do bloco onde o mouse está apontando
            mouse.worldX = mouse.x + camera.x;
            mouse.worldY = mouse.y + camera.y;
            let hbx = Math.floor(mouse.worldX / BLOCK_SIZE);
            let hby = Math.floor(mouse.worldY / BLOCK_SIZE);
            
            let pCenterX = player.x + player.width / 2;
            let pCenterY = player.y + player.height / 2;
            
            if (Math.hypot(mouse.worldX - pCenterX, mouse.worldY - pCenterY) <= BLOCK_SIZE * 5) {
                let sx = hbx * BLOCK_SIZE - camera.x;
                let sy = hby * BLOCK_SIZE - camera.y;
                ctx.strokeStyle = 'rgba(255,255,255,0.7)';
                ctx.lineWidth = 2;
                ctx.strokeRect(Math.floor(sx), Math.floor(sy), BLOCK_SIZE, BLOCK_SIZE);
            }

            // Desenhar Jogador
            let px = Math.floor(player.x - camera.x);
            let py = Math.floor(player.y - camera.y);
            
            // Corpo
            ctx.fillStyle = player.color;
            ctx.fillRect(px, py, player.width, player.height);
            
            // "Cabeça" / Olhos para dar personalidade
            ctx.fillStyle = '#f1c40f'; // Pele
            ctx.fillRect(px, py, player.width, player.width);
            
            ctx.fillStyle = 'black'; // Olhos (olhando na direção do mouse)
            let eyeOffsetX = (mouse.x - canvas.width/2) > 0 ? 4 : 0;
            ctx.fillRect(px + 4 + eyeOffsetX, py + 6, 4, 4);
            ctx.fillRect(px + 12 + eyeOffsetX, py + 6, 4, 4);
        }

        function renderHotbar() {
            const container = document.getElementById('hotbar');
            container.innerHTML = '';
            
            inventory.forEach((blockId, index) => {
                let blockDef = BLOCKS[blockId];
                
                let div = document.createElement('div');
                div.className = `hotbar-slot ${index === selectedSlot ? 'active' : ''}`;
                
                let num = document.createElement('span');
                num.className = 'hotbar-number';
                num.innerText = index + 1;
                
                let preview = document.createElement('div');
                preview.className = 'block-preview';
                preview.style.backgroundColor = blockDef.color;
                
                // Detalhes na preview se houver
                if(blockDef.topColor) {
                    preview.style.borderTop = `6px solid ${blockDef.topColor}`;
                }

                div.appendChild(num);
                div.appendChild(preview);
                
                // Clique para selecionar via mouse
                div.addEventListener('mousedown', (e) => {
                    e.stopPropagation(); // Evita interagir com o mundo
                    selectedSlot = index;
                    renderHotbar();
                });
                
                container.appendChild(div);
            });
        }

        function resize() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
            // Para não borrar em telas de alta densidade mas mantendo pixel art
            ctx.imageSmoothingEnabled = false;
        }

        function setupEvents() {
            window.addEventListener('resize', resize);
            
            // Teclado
            window.addEventListener('keydown', e => {
                keys[e.key.toLowerCase()] = true;
                
                // Seleção da Hotbar (Teclas 1 a 5)
                let num = parseInt(e.key);
                if(num >= 1 && num <= inventory.length) {
                    selectedSlot = num - 1;
                    renderHotbar();
                }
            });
            window.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

            // Mouse
            canvas.addEventListener('mousemove', e => {
                mouse.x = e.clientX;
                mouse.y = e.clientY;
            });
            
            canvas.addEventListener('mousedown', e => {
                if(e.button === 0) mouse.leftDown = true;
                if(e.button === 2) mouse.rightDown = true;
            });
            
            canvas.addEventListener('mouseup', e => {
                if(e.button === 0) mouse.leftDown = false;
                if(e.button === 2) mouse.rightDown = false;
            });

            canvas.addEventListener('contextmenu', e => e.preventDefault());
        }

        let lastInteractionTime = 0;

        function loop(timestamp) {
            updatePlayer();
            updateCamera();
            
            // Controla velocidade de quebra/construção (debounce rápido)
            if(timestamp - lastInteractionTime > 150) { 
                if(mouse.leftDown || mouse.rightDown) {
                    interactWithWorld();
                    lastInteractionTime = timestamp;
                }
            }
            
            render();
            requestAnimationFrame(loop);
        }

        // Inicialização
        function init() {
            resize();
            initWorld();
            spawnPlayer();
            renderHotbar();
            setupEvents();
            requestAnimationFrame(loop);
        }

        // Começar
        init();