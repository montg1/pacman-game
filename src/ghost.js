// ===== Ghost AI =====
import { TILE_SIZE, MAP_COLS, MAP_ROWS, isWalkable, isGhostHouse } from './map.js';

// ===== Preload ghost sprite (Tung-Tung-Sahur) =====
const ghostImage = new Image();
ghostImage.src = '/images/ghost.png';
let ghostImageLoaded = false;
ghostImage.onload = () => { ghostImageLoaded = true; };

const GHOST_COLORS = {
    blinky: '#ff1744',  // Red
    pinky: '#ff80ab',  // Pink
    inky: '#00e5ff',  // Cyan
    clyde: '#ff9100',  // Orange
};

// Ghost starting positions inside the ghost house
const START_POSITIONS = {
    blinky: { row: 9, col: 10 },  // starts above house
    pinky: { row: 10, col: 10 },
    inky: { row: 10, col: 9 },
    clyde: { row: 10, col: 11 },
};

// Scatter targets (corners)
const SCATTER_TARGETS = {
    blinky: { row: 0, col: MAP_COLS - 1 },
    pinky: { row: 0, col: 0 },
    inky: { row: MAP_ROWS - 1, col: MAP_COLS - 1 },
    clyde: { row: MAP_ROWS - 1, col: 0 },
};

// Ghost sprite size (slightly larger than tile for visual impact)
const GHOST_DRAW_SIZE = TILE_SIZE + 8;
const GHOST_OFFSET = (GHOST_DRAW_SIZE - TILE_SIZE) / 2;

export class Ghost {
    constructor(name) {
        this.name = name;
        this.color = GHOST_COLORS[name];
        this.scatterTarget = SCATTER_TARGETS[name];
        this.startPos = START_POSITIONS[name];
        this.releaseDelay = { blinky: 0, pinky: 100, inky: 200, clyde: 300 }[name];
        this.reset();
    }

    reset() {
        this.col = this.startPos.col;
        this.row = this.startPos.row;
        this.x = this.col * TILE_SIZE;
        this.y = this.row * TILE_SIZE;
        this.direction = { x: 0, y: -1 };
        this.speed = 1.5;
        this.mode = 'waiting'; // waiting, chase, scatter, frightened, eaten
        this.frightenedTimer = 0;
        this.waitTimer = this.releaseDelay;
        this.modeTimer = 0;
        this.isInHouse = true;
    }

    getGridPos() {
        return {
            row: Math.round(this.y / TILE_SIZE),
            col: Math.round(this.x / TILE_SIZE),
        };
    }

    isAligned() {
        return Math.abs(this.x % TILE_SIZE) < this.speed && Math.abs(this.y % TILE_SIZE) < this.speed;
    }

    snapToGrid() {
        this.x = Math.round(this.x / TILE_SIZE) * TILE_SIZE;
        this.y = Math.round(this.y / TILE_SIZE) * TILE_SIZE;
    }

    setFrightened() {
        if (this.mode !== 'eaten' && this.mode !== 'waiting' && this.mode !== 'exiting' && this.mode !== 'entering') {
            this.mode = 'frightened';
            this.frightenedTimer = 420; // ~7 seconds at 60fps
            this.speed = 1;
            // Reverse direction
            this.direction = { x: -this.direction.x, y: -this.direction.y };
        }
    }

    /**
     * Get the chase target based on ghost personality.
     */
    getChaseTarget(playerPos, blinkyPos) {
        switch (this.name) {
            case 'blinky':
                // Directly chase player
                return playerPos;
            case 'pinky':
                // Target 4 tiles ahead of player
                return {
                    row: playerPos.row + (playerPos.dy || 0) * 4,
                    col: playerPos.col + (playerPos.dx || 0) * 4,
                };
            case 'inky': {
                // Complex: vector from blinky to 2 tiles ahead of player, doubled
                const ahead = {
                    row: playerPos.row + (playerPos.dy || 0) * 2,
                    col: playerPos.col + (playerPos.dx || 0) * 2,
                };
                return {
                    row: ahead.row + (ahead.row - blinkyPos.row),
                    col: ahead.col + (ahead.col - blinkyPos.col),
                };
            }
            case 'clyde': {
                // Chase when far, scatter when close
                const dist = Math.abs(this.row - playerPos.row) + Math.abs(this.col - playerPos.col);
                return dist > 8 ? playerPos : this.scatterTarget;
            }
            default:
                return playerPos;
        }
    }

    update(playerPos, blinkyPos) {
        // ===== PHASE: Waiting in house (initial spawn delay) =====
        if (this.mode === 'waiting') {
            this.waitTimer--;
            if (this.waitTimer <= 0) {
                this.mode = 'exiting';
            }
            return;
        }

        // ===== PHASE: Exiting the ghost house =====
        if (this.mode === 'exiting') {
            // Step 1: Move to center column (col 10)
            const targetX = 10 * TILE_SIZE;
            const targetY = 8 * TILE_SIZE; // Row above gate

            if (Math.abs(this.x - targetX) > 1) {
                this.x += this.x < targetX ? 2 : -2;
                this.direction = { x: this.x < targetX ? 1 : -1, y: 0 };
            } else if (Math.abs(this.y - targetY) > 1) {
                this.x = targetX;
                this.y += this.y < targetY ? -2 : -2; // Always move up
                this.direction = { x: 0, y: -1 };
            } else {
                // Arrived at exit
                this.x = targetX;
                this.y = targetY;
                this.col = 10;
                this.row = 8;
                this.isInHouse = false;
                this.mode = 'chase';
                this.speed = 1.5;
                this.direction = { x: -1, y: 0 };
            }
            return;
        }

        // ===== PHASE: Entering the ghost house (after being eaten, arrived at gate) =====
        if (this.mode === 'entering') {
            const targetX = 10 * TILE_SIZE;
            const targetY = 10 * TILE_SIZE; // Center of house

            if (Math.abs(this.y - targetY) > 1) {
                this.y += 2;
                this.direction = { x: 0, y: 1 };
            } else {
                // Arrived inside house — wait briefly then exit
                this.x = targetX;
                this.y = targetY;
                this.col = 10;
                this.row = 10;
                this.isInHouse = true;
                this.mode = 'exiting';
                this.speed = 1.5;
                this.waitTimer = 60; // Brief pause before exiting
                this.mode = 'waiting';
                this.waitTimer = 60;
            }
            return;
        }

        // ===== Handle frightened timer =====
        if (this.mode === 'frightened') {
            this.frightenedTimer--;
            if (this.frightenedTimer <= 0) {
                this.mode = 'chase';
                this.speed = 1.5;
            }
        }

        // ===== Mode switching timer (chase <-> scatter) =====
        if (this.mode === 'chase' || this.mode === 'scatter') {
            this.modeTimer++;
            if (this.mode === 'scatter' && this.modeTimer > 420) {
                this.mode = 'chase';
                this.modeTimer = 0;
            } else if (this.mode === 'chase' && this.modeTimer > 1200) {
                this.mode = 'scatter';
                this.modeTimer = 0;
            }
        }

        // ===== Normal movement (chase, scatter, frightened, eaten) =====
        if (!this.isAligned()) {
            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;
        } else {
            this.snapToGrid();
            const { row, col } = this.getGridPos();
            this.row = row;
            this.col = col;

            // ===== Eaten: check if arrived at gate entrance =====
            if (this.mode === 'eaten') {
                // Target is just above the gate at (8, 10)
                if (row === 8 && col === 10) {
                    // Arrived at gate — start entering the house
                    this.mode = 'entering';
                    this.speed = 2;
                    return;
                }
            }

            // Get target based on mode
            let target;
            let allowReverse = false;

            if (this.mode === 'frightened') {
                target = { row: Math.floor(Math.random() * MAP_ROWS), col: Math.floor(Math.random() * MAP_COLS) };
            } else if (this.mode === 'scatter') {
                target = this.scatterTarget;
            } else if (this.mode === 'eaten') {
                // Navigate to gate entrance (row 8, col 10)
                target = { row: 8, col: 10 };
                this.speed = 3;
                allowReverse = true; // Eaten ghosts CAN reverse
            } else {
                target = this.getChaseTarget(playerPos, blinkyPos);
            }

            // Get possible directions
            const directions = [
                { x: 0, y: -1 }, // up
                { x: 0, y: 1 },  // down
                { x: -1, y: 0 }, // left
                { x: 1, y: 0 },  // right
            ];

            const reverse = { x: -this.direction.x, y: -this.direction.y };
            const validDirs = [];

            for (const dir of directions) {
                // No reversing unless eaten or no other option
                if (!allowReverse && dir.x === reverse.x && dir.y === reverse.y) continue;

                const nextRow = row + dir.y;
                const nextCol = col + dir.x;

                if (isWalkable(nextRow, nextCol)) {
                    // Don't let non-eaten ghosts into the house
                    if (this.mode !== 'eaten' && !this.isInHouse && isGhostHouse(nextRow, nextCol)) continue;
                    // Eaten ghosts should NOT enter ghost house tiles via normal pathfinding
                    // (they enter via the 'entering' phase instead)
                    if (this.mode === 'eaten' && isGhostHouse(nextRow, nextCol)) continue;
                    validDirs.push(dir);
                }
            }

            if (validDirs.length === 0) {
                // Dead end, must reverse
                this.direction = reverse;
            } else if (validDirs.length === 1) {
                this.direction = validDirs[0];
            } else {
                // If we allowed reverse but have non-reverse options, prefer non-reverse
                const nonReverseDirs = validDirs.filter(d => !(d.x === reverse.x && d.y === reverse.y));
                const candidates = nonReverseDirs.length > 0 ? nonReverseDirs : validDirs;

                // Choose direction closest to target
                let bestDir = candidates[0];
                let bestDist = Infinity;
                for (const dir of candidates) {
                    const nr = row + dir.y;
                    const nc = col + dir.x;
                    const dist = (nr - target.row) ** 2 + (nc - target.col) ** 2;
                    if (dist < bestDist) {
                        bestDist = dist;
                        bestDir = dir;
                    }
                }
                this.direction = bestDir;
            }

            // Move
            this.x += this.direction.x * this.speed;
            this.y += this.direction.y * this.speed;
        }

        // Tunnel wrapping
        const canvasWidth = MAP_COLS * TILE_SIZE;
        if (this.x < -TILE_SIZE) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = -TILE_SIZE;

    }

    draw(ctx, frameCount) {
        const drawX = this.x - GHOST_OFFSET;
        const drawY = this.y - GHOST_OFFSET;

        ctx.save();

        if (this.mode === 'eaten') {
            // Just draw floating eyes when eaten
            const centerX = this.x + TILE_SIZE / 2;
            const centerY = this.y + TILE_SIZE / 2;
            const radius = TILE_SIZE / 2 - 2;
            this.drawEyes(ctx, centerX, centerY, radius);
            ctx.restore();
            return;
        }

        // Subtle bob animation
        const bobOffset = Math.sin(frameCount * 0.08 + this.releaseDelay) * 2;

        if (ghostImageLoaded) {
            // Flip image based on horizontal direction
            const flipX = this.direction.x < 0;

            if (this.mode === 'frightened') {
                // Frightened mode: draw with blue tint + flashing
                const isFlashing = this.frightenedTimer < 120 && Math.floor(frameCount / 10) % 2 === 0;

                ctx.globalAlpha = 0.85;

                if (flipX) {
                    ctx.translate(this.x + TILE_SIZE / 2, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(ghostImage, -GHOST_DRAW_SIZE / 2, drawY + bobOffset, GHOST_DRAW_SIZE, GHOST_DRAW_SIZE);
                    ctx.scale(-1, 1);
                    ctx.translate(-(this.x + TILE_SIZE / 2), 0);
                } else {
                    ctx.drawImage(ghostImage, drawX, drawY + bobOffset, GHOST_DRAW_SIZE, GHOST_DRAW_SIZE);
                }

                // Blue or white tint overlay
                ctx.globalCompositeOperation = 'source-atop';
                ctx.fillStyle = isFlashing ? 'rgba(255,255,255,0.6)' : 'rgba(26,35,126,0.6)';
                ctx.fillRect(drawX - 2, drawY + bobOffset - 2, GHOST_DRAW_SIZE + 4, GHOST_DRAW_SIZE + 4);
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1;
            } else {
                // Normal mode: draw the Tung-Tung-Sahur image with colored glow
                ctx.shadowColor = this.color;
                ctx.shadowBlur = 12;

                if (flipX) {
                    ctx.translate(this.x + TILE_SIZE / 2, 0);
                    ctx.scale(-1, 1);
                    ctx.drawImage(ghostImage, -GHOST_DRAW_SIZE / 2, drawY + bobOffset, GHOST_DRAW_SIZE, GHOST_DRAW_SIZE);
                } else {
                    ctx.drawImage(ghostImage, drawX, drawY + bobOffset, GHOST_DRAW_SIZE, GHOST_DRAW_SIZE);
                }

                ctx.shadowBlur = 0;
            }
        } else {
            // Fallback: simple colored circle if image not loaded yet
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x + TILE_SIZE / 2, this.y + TILE_SIZE / 2 + bobOffset, TILE_SIZE / 2 - 2, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.restore();
    }

    drawEyes(ctx, cx, cy, radius) {
        const eyeOffsetX = radius * 0.35;
        const eyeOffsetY = -radius * 0.15;
        const eyeRadius = radius * 0.28;
        const pupilRadius = radius * 0.15;

        for (const side of [-1, 1]) {
            const ex = cx + side * eyeOffsetX;
            const ey = cy + eyeOffsetY;

            // White of eye
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.ellipse(ex, ey, eyeRadius, eyeRadius * 1.2, 0, 0, Math.PI * 2);
            ctx.fill();

            // Pupil (follows direction)
            const px = ex + this.direction.x * pupilRadius * 0.5;
            const py = ey + this.direction.y * pupilRadius * 0.5;
            ctx.fillStyle = '#1a237e';
            ctx.beginPath();
            ctx.arc(px, py, pupilRadius, 0, Math.PI * 2);
            ctx.fill();
        }
    }
}

/**
 * Create all 4 ghosts.
 */
export function createGhosts() {
    return [
        new Ghost('blinky'),
        new Ghost('pinky'),
        new Ghost('inky'),
        new Ghost('clyde'),
    ];
}
