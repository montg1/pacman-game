// ===== Pac-Man Player =====
import { TILE_SIZE, MAP_COLS, isWalkable } from './map.js';

export class Player {
    constructor() {
        this.reset();
    }

    reset() {
        // Start position (center-bottom area of maze)
        this.col = 10;
        this.row = 16;
        this.x = this.col * TILE_SIZE;
        this.y = this.row * TILE_SIZE;
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.speed = 2;
        this.mouthAngle = 0;
        this.mouthOpen = true;
        this.mouthSpeed = 0.15;
        this.visualAngle = 0; // For drawing rotation
    }

    /**
     * Set the next requested direction from keyboard input.
     */
    setDirection(dx, dy) {
        this.nextDirection = { x: dx, y: dy };
    }

    /**
     * Check if pac-man is aligned to grid.
     */
    isAligned() {
        return this.x % TILE_SIZE === 0 && this.y % TILE_SIZE === 0;
    }

    /**
     * Get current grid position.
     */
    getGridPos() {
        return {
            row: Math.round(this.y / TILE_SIZE),
            col: Math.round(this.x / TILE_SIZE),
        };
    }

    update() {
        // Animate mouth
        if (this.mouthOpen) {
            this.mouthAngle += this.mouthSpeed;
            if (this.mouthAngle >= 0.8) this.mouthOpen = false;
        } else {
            this.mouthAngle -= this.mouthSpeed;
            if (this.mouthAngle <= 0.05) this.mouthOpen = true;
        }

        // When aligned to grid, try to turn
        if (this.isAligned()) {
            const { row, col } = this.getGridPos();
            const nextRow = row + this.nextDirection.y;
            const nextCol = col + this.nextDirection.x;

            if (isWalkable(nextRow, nextCol)) {
                this.direction = { ...this.nextDirection };
            }

            // Check if current direction is still valid
            const aheadRow = row + this.direction.y;
            const aheadCol = col + this.direction.x;
            if (!isWalkable(aheadRow, aheadCol)) {
                this.direction = { x: 0, y: 0 };
            }
        }

        // Move
        this.x += this.direction.x * this.speed;
        this.y += this.direction.y * this.speed;

        // Tunnel wrapping
        const canvasWidth = MAP_COLS * TILE_SIZE;
        if (this.x < -TILE_SIZE) this.x = canvasWidth;
        if (this.x > canvasWidth) this.x = -TILE_SIZE;

        // Update visual angle based on direction
        if (this.direction.x === 1) this.visualAngle = 0;
        else if (this.direction.x === -1) this.visualAngle = Math.PI;
        else if (this.direction.y === -1) this.visualAngle = -Math.PI / 2;
        else if (this.direction.y === 1) this.visualAngle = Math.PI / 2;
    }

    draw(ctx) {
        const centerX = this.x + TILE_SIZE / 2;
        const centerY = this.y + TILE_SIZE / 2;
        const radius = TILE_SIZE / 2 - 2;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(this.visualAngle);

        // Glow effect
        ctx.shadowColor = '#ffeb3b';
        ctx.shadowBlur = 12;

        // Draw pac-man body
        ctx.fillStyle = '#ffeb3b';
        ctx.beginPath();
        ctx.arc(0, 0, radius, this.mouthAngle, Math.PI * 2 - this.mouthAngle);
        ctx.lineTo(0, 0);
        ctx.closePath();
        ctx.fill();

        ctx.shadowBlur = 0;

        // Eye
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(2, -radius / 2.5, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }
}
