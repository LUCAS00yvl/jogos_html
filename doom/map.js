const mapWidth = 24;
const mapHeight = 24;
let map = [];

function generateMap() {
    map = Array.from({length: mapHeight}, () => Array(mapWidth).fill(1));
    let x = Math.floor(mapWidth / 2);
    let y = Math.floor(mapHeight / 2);
    let tunnels = 50;
    
    while (tunnels > 0) {
        let length = Math.floor(Math.random() * 8) + 2;
        let dir = Math.floor(Math.random() * 4);
        let dx = 0, dy = 0;
        if (dir === 0) dy = -1; else if (dir === 1) dy = 1; else if (dir === 2) dx = -1; else dx = 1;

        for (let i = 0; i < length; i++) {
            if (x + dx > 1 && x + dx < mapWidth - 2 && y + dy > 1 && y + dy < mapHeight - 2) {
                x += dx; y += dy;
                map[y][x] = 0;
            } else break;
        }
        tunnels--;
    }
    map[Math.floor(mapHeight/2)][Math.floor(mapWidth/2)] = 0;
}

// Gera o mapa inicial
generateMap();