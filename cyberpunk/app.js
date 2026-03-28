// --- LÓGICA DAS ABAS DE NAVEGAÇÃO ---
function openTab(tabId) {
    const contents = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-btn');
    
    contents.forEach(content => content.classList.remove('active'));
    buttons.forEach(btn => btn.classList.remove('active'));
    
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// --- LÓGICA DO MINIGAME PROTOCOLO DE INVASÃO ---
const hexValues = ['1C', '55', 'BD', 'E9', 'FF', '7A'];
let matrix = [];
let targetSeq = [];
let playerSeq = [];
let isRow = true; // Começa sempre pela primeira linha (índice 0)
let activeIndex = 0;
const matrixSize = 5;
const bufferSize = 5;
let gameActiveBP = true;

function initBreach() {
    gameActiveBP = true;
    playerSeq = [];
    isRow = true;
    activeIndex = 0; // Linha 0
    document.getElementById('buffer-count').innerText = 0;
    
    generateMatrix();
    generateTarget();
    renderMatrix();
    updateBuffer();
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
    // Gera uma sequência de 3 códigos para o jogador tentar acertar
    for(let i = 0; i < 3; i++) {
        targetSeq.push(hexValues[Math.floor(Math.random() * hexValues.length)]);
    }
    const targetDiv = document.getElementById('target-sequence');
    targetDiv.innerHTML = targetSeq.map(code => `<div class="hex-code">${code}</div>`).join('');
}

function renderMatrix() {
    const grid = document.getElementById('matrix-grid');
    grid.innerHTML = '';
    
    for(let i = 0; i < matrixSize; i++) {
        for(let j = 0; j < matrixSize; j++) {
            const cell = document.createElement('div');
            cell.className = 'matrix-cell';
            cell.innerText = matrix[i][j];

            if (matrix[i][j] === '') {
                // Se estiver vazio, significa que já foi clicado
                cell.classList.add('used');
                cell.innerText = '[]';
            } else if (gameActiveBP) {
                let isSelectable = false;
                
                // Define se a célula está na trilha ativa (linha ou coluna)
                if (isRow && i === activeIndex) {
                    isSelectable = true;
                    cell.classList.add('active-track');
                } else if (!isRow && j === activeIndex) {
                    isSelectable = true;
                    cell.classList.add('active-track');
                }

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

    playerSeq.push(code);
    matrix[r][c] = ''; // Esvazia a célula na matriz
    
    // Inverte a direção: se clicou na linha, o próximo clique tem que ser na coluna do item clicado
    isRow = !isRow;
    activeIndex = isRow ? r : c; 

    updateBuffer();
    checkBreachStatus();

    if(gameActiveBP) renderMatrix();
}

function updateBuffer() {
    const bufferDiv = document.getElementById('player-buffer');
    document.getElementById('buffer-count').innerText = playerSeq.length;
    bufferDiv.innerHTML = playerSeq.map(code => `<div class="hex-code">${code}</div>`).join('');
}

function checkBreachStatus() {
    // Transforma as arrays em strings para facilitar a busca (ex: "1C,BD,55")
    let pStr = playerSeq.join(',');
    let tStr = targetSeq.join(',');

    // Se a sequência alvo estiver contida dentro da sequência do jogador
    if (pStr.includes(tStr)) {
        gameActiveBP = false;
        renderMatrix(); // Atualiza a tela uma última vez sem células selecionáveis
        setTimeout(() => alert("DAEMON CARREGADO. Acesso Concedido ao Sistema!"), 150);
    } 
    // Se estourar o limite do buffer sem acertar
    else if (playerSeq.length >= bufferSize) {
        gameActiveBP = false;
        renderMatrix();
        setTimeout(() => alert("FALHA DE INVASÃO. O ICE corporativo te detectou."), 150);
    }
}

// Inicia o minigame automaticamente ao carregar a página
window.onload = initBreach;
// --- MOTOR DO RPG DE TEXTO ---
const terminal = document.getElementById('rpg-terminal');
const controls = document.getElementById('rpg-controls');

// Máquina de Estados da História do RPG
const storyNodes = {
    start: {
        text: "CHAMADA RECEBIDA: REGINA JONES...\n\n'V, tenho um serviço pra você. Preciso que recupere uma maleta climatizada em um cassino dos Tyger Claws em Westbrook. O pagamento é 10 mil eddies. Faça isso na miúda, se puder.'\n\nVocê chega no beco do lado de fora. Qual é o seu equipamento pra essa corrida?",
        choices: [
            { text: "O Solo (Escopeta Carnage e Armadura Pesada)", next: "solo_approach" },
            { text: "O Trilhas-Rede (Ciberdeque e Pistola com Silenciador)", next: "netrunner_approach" },
            { text: "O Ninja (Camuflagem Óptica e Lâminas Louva-a-Deus)", next: "ninja_approach" }
        ]
    },
    solo_approach: {
        text: "Você engatilha sua escopeta Carnage. A armadura pesada traz uma sensação reconfortante. Dois seguranças Tyger Claw estão na porta, fumando cigarros sintéticos.",
        choices: [
            { text: "Chutar a porta e atirar neles", next: "solo_combat" },
            { text: "Intimidá-los para irem embora", next: "solo_talk" }
        ]
    },
    netrunner_approach: {
        text: "Você se conecta a um ponto de acesso próximo. Você vê a sub-rede do cassino. Dois seguranças na porta, mas há uma câmera e uma máquina de vendas de NiCola perto deles.",
        choices: [
            { text: "Hackear a câmera para distraí-los", next: "netrunner_hack" },
            { text: "Sobrecargar a máquina de vendas", next: "netrunner_distract" }
        ]
    },
    ninja_approach: {
        text: "Você ativa sua camuflagem óptica. O mundo tremeluz ao seu redor. Você sobe a escada de incêndio até uma janela aberta com vista para o salão principal do cassino.",
        choices: [
            { text: "Pular e executar o guarda lá embaixo", next: "ninja_stealth" },
            { text: "Esgueirar-se pelas vigas do teto", next: "ninja_rafters" }
        ]
    },
    // Finais da Demo
    solo_combat: { text: "Você transforma os seguranças em névoa vermelha. O alarme dispara imediatamente. Adeus, 'fazer na miúda'. Hora de abrir caminho na bala pelo cassino inteiro. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] },
    solo_talk: { text: "Você flexiona seus Braços de Gorila e estala os nós dos dedos. Os seguranças dão uma olhada no seu cromo e decidem que não ganham o suficiente pra isso. Eles vão embora. Você está dentro. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] },
    netrunner_hack: { text: "Você coloca o feed da câmera em loop e aciona um alarme falso no beco dos fundos. Os seguranças correm para investigar, deixando a porta da frente escancarada. Suave. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] },
    netrunner_distract: { text: "A máquina de NiCola explode violentamente, banhando os seguranças em faíscas e xarope açucarado. Eles ficam atordoados, te dando uma brecha para passar despercebido. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] },
    ninja_stealth: { text: "Você cai como uma pedra, Lâminas Louva-a-Deus acionadas com um *snikt* letal. O guarda cai silenciosamente. Você agora está nas sombras do salão principal. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] },
    ninja_rafters: { text: "Você se move lentamente pelas vigas de aço. Abaixo de você, Tyger Claws estão contando eddies. Você avista a maleta em um escritório envidraçado do outro lado da sala. [CONTINUA...]", choices: [{ text: "Reiniciar Serviço", next: "start" }] }
};

function addLog(text, isSystem = false) {
    const div = document.createElement('div');
    div.className = 'rpg-log';
    if(isSystem) {
        div.innerHTML = `<span class="rpg-sys">[SISTEMA]</span> <span class="rpg-desc">${text}</span>`;
    } else {
        div.innerHTML = `<span class="rpg-desc">${text}</span>`;
    }
    terminal.appendChild(div);
    terminal.scrollTop = terminal.scrollHeight; // Rolar para baixo automaticamente
}

function renderNode(nodeId) {
    controls.innerHTML = ''; // Limpar botões antigos
    const nodeData = storyNodes[nodeId];
    
    // Adicionar linha em branco para facilitar a leitura
    addLog("--------------------------------------------------", true);
    
    // Simulação de efeito de máquina de escrever para o texto
    const lines = nodeData.text.split('\n');
    lines.forEach(line => {
        if(line.trim() !== '') addLog(line);
    });

    // Gerar botões de escolha
    nodeData.choices.forEach(choice => {
        const btn = document.createElement('button');
        btn.className = 'rpg-btn';
        btn.innerText = "> " + choice.text;
        btn.onclick = () => renderNode(choice.next);
        controls.appendChild(btn);
    });
}

// Inicializar o RPG
renderNode('start');