// ===== Pac-Man Map Definition =====
// 0 = empty (dot), 1 = wall, 2 = empty (no dot), 3 = power pellet, 4 = ghost house

export const TILE_SIZE = 24;

export const MAP_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 3, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 3, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 4, 4, 4, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 2, 0, 0, 0, 1, 4, 4, 4, 4, 4, 1, 0, 0, 0, 2, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [2, 2, 2, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 2, 2, 2],
    [1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 0, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 0, 1, 1, 0, 1],
    [1, 3, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 3, 1],
    [1, 1, 0, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1, 1],
    [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

export const MAP_ROWS = MAP_LAYOUT.length;
export const MAP_COLS = MAP_LAYOUT[0].length;

/**
 * Create a fresh copy of the dot map from the layout.
 * dots[r][c] = 1 (small dot), 2 (power pellet), 0 (no dot)
 */
export function createDotMap() {
    const dots = [];
    for (let r = 0; r < MAP_ROWS; r++) {
        dots[r] = [];
        for (let c = 0; c < MAP_COLS; c++) {
            const tile = MAP_LAYOUT[r][c];
            if (tile === 0) dots[r][c] = 1;       // regular dot
            else if (tile === 3) dots[r][c] = 2;   // power pellet
            else dots[r][c] = 0;                   // wall / empty / ghost house
        }
    }
    return dots;
}

/**
 * Check if a tile is walkable (not a wall).
 */
export function isWalkable(row, col) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) {
        // Allow wrapping through tunnel
        if (row === 10 && (col < 0 || col >= MAP_COLS)) return true;
        return false;
    }
    const tile = MAP_LAYOUT[row][col];
    return tile !== 1;
}

/**
 * Check if tile is the ghost house.
 */
export function isGhostHouse(row, col) {
    if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return false;
    return MAP_LAYOUT[row][col] === 4;
}

/**
 * Draw the map (walls, dots, power pellets).
 */
export function drawMap(ctx, dotMap, frameCount) {
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            const x = c * TILE_SIZE;
            const y = r * TILE_SIZE;
            const tile = MAP_LAYOUT[r][c];

            if (tile === 1) {
                // Draw wall
                ctx.fillStyle = '#0d1b5e';
                ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);

                // Neon border glow
                ctx.strokeStyle = '#1a3bc2';
                ctx.lineWidth = 1.5;
                // Only draw borders adjacent to non-wall tiles
                if (r > 0 && MAP_LAYOUT[r - 1][c] !== 1) {
                    ctx.beginPath(); ctx.moveTo(x, y + 0.5); ctx.lineTo(x + TILE_SIZE, y + 0.5); ctx.stroke();
                }
                if (r < MAP_ROWS - 1 && MAP_LAYOUT[r + 1][c] !== 1) {
                    ctx.beginPath(); ctx.moveTo(x, y + TILE_SIZE - 0.5); ctx.lineTo(x + TILE_SIZE, y + TILE_SIZE - 0.5); ctx.stroke();
                }
                if (c > 0 && MAP_LAYOUT[r][c - 1] !== 1) {
                    ctx.beginPath(); ctx.moveTo(x + 0.5, y); ctx.lineTo(x + 0.5, y + TILE_SIZE); ctx.stroke();
                }
                if (c < MAP_COLS - 1 && MAP_LAYOUT[r][c + 1] !== 1) {
                    ctx.beginPath(); ctx.moveTo(x + TILE_SIZE - 0.5, y); ctx.lineTo(x + TILE_SIZE - 0.5, y + TILE_SIZE); ctx.stroke();
                }
            }

            // Draw dots
            const dot = dotMap[r][c];
            if (dot === 1) {
                // Small dot
                ctx.fillStyle = '#ffe0b2';
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
                ctx.fill();
            } else if (dot === 2) {
                // Power pellet (pulsing)
                const pulse = 4 + Math.sin(frameCount * 0.08) * 2;
                ctx.fillStyle = '#00e5ff';
                ctx.shadowColor = '#00e5ff';
                ctx.shadowBlur = 8;
                ctx.beginPath();
                ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, pulse, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }
    }

    // Draw ghost house gate
    ctx.fillStyle = '#ff80ab';
    const gateRow = 9;
    const gateStartCol = 9;
    const gateEndCol = 11;
    for (let c = gateStartCol; c <= gateEndCol; c++) {
        ctx.fillRect(c * TILE_SIZE + 2, gateRow * TILE_SIZE + TILE_SIZE / 2 - 2, TILE_SIZE - 4, 4);
    }
}

export function countRemainingDots(dotMap) {
    let count = 0;
    for (let r = 0; r < MAP_ROWS; r++) {
        for (let c = 0; c < MAP_COLS; c++) {
            if (dotMap[r][c] > 0) count++;
        }
    }
    return count;
}
