// ===== Game Logic =====
import { TILE_SIZE, MAP_COLS, MAP_ROWS, createDotMap, drawMap, countRemainingDots } from './map.js';
import { Player } from './player.js';
import { createGhosts } from './ghost.js';
import { soundManager } from './sound.js';

const POINTS_DOT = 10;
const POINTS_POWER = 50;
const POINTS_GHOST = 200;
const INITIAL_LIVES = 3;
const COLLISION_DISTANCE = TILE_SIZE * 0.7;

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.canvas.width = MAP_COLS * TILE_SIZE;
        this.canvas.height = MAP_ROWS * TILE_SIZE;

        this.scoreEl = document.getElementById('score');
        this.livesEl = document.getElementById('lives');
        this.finalScoreEl = document.getElementById('final-score');
        this.winScoreEl = document.getElementById('win-score');

        this.overlayStart = document.getElementById('overlay-start');
        this.overlayGameOver = document.getElementById('overlay-gameover');
        this.overlayWin = document.getElementById('overlay-win');
        this.chickenImg = document.getElementById('chicken-img');

        this.player = new Player();
        this.ghosts = createGhosts();
        this.dotMap = createDotMap();

        this.score = 0;
        this.lives = INITIAL_LIVES;
        this.state = 'start'; // start, playing, paused, gameover, win
        this.frameCount = 0;
        this.ghostEatCombo = 0;
        this.deathAnimTimer = 0;

        this.bindControls();
        this.bindButtons();
    }

    bindControls() {
        document.addEventListener('keydown', (e) => {
            if (this.state !== 'playing') return;

            switch (e.key) {
                case 'ArrowUp': case 'w': case 'W': this.player.setDirection(0, -1); break;
                case 'ArrowDown': case 's': case 'S': this.player.setDirection(0, 1); break;
                case 'ArrowLeft': case 'a': case 'A': this.player.setDirection(-1, 0); break;
                case 'ArrowRight': case 'd': case 'D': this.player.setDirection(1, 0); break;
            }
            e.preventDefault();
        });

        // Touch / swipe support
        let touchStartX = 0;
        let touchStartY = 0;

        this.canvas.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });

        this.canvas.addEventListener('touchend', (e) => {
            if (this.state !== 'playing') return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;

            if (Math.abs(dx) > Math.abs(dy)) {
                this.player.setDirection(dx > 0 ? 1 : -1, 0);
            } else {
                this.player.setDirection(0, dy > 0 ? 1 : -1);
            }
            e.preventDefault();
        }, { passive: false });
    }

    bindButtons() {
        document.getElementById('btn-start').addEventListener('click', () => {
            this.start();
        });
        document.getElementById('btn-restart').addEventListener('click', () => {
            this.restart();
        });
        document.getElementById('btn-win-restart').addEventListener('click', () => {
            this.restart();
        });
    }

    start() {
        this.overlayStart.classList.add('hidden');
        this.state = 'playing';
        soundManager.preload();
    }

    restart() {
        this.score = 0;
        this.lives = INITIAL_LIVES;
        this.ghostEatCombo = 0;
        this.dotMap = createDotMap();
        this.player.reset();
        this.ghosts = createGhosts();
        this.overlayGameOver.classList.add('hidden');
        this.overlayWin.classList.add('hidden');
        this.chickenImg.classList.remove('spinning');
        this.updateHUD();
        this.state = 'playing';
    }

    resetPositions() {
        this.player.reset();
        this.ghosts.forEach(g => g.reset());
        this.ghostEatCombo = 0;
    }

    loseLife() {
        this.lives--;
        soundManager.playGhostHit(); // 🔊 TUNG TUNG SAHUR!
        this.updateHUD();

        if (this.lives <= 0) {
            this.state = 'gameover';
            this.finalScoreEl.textContent = this.score;
            this.overlayGameOver.classList.remove('hidden');
            // Trigger chicken spin animation
            this.chickenImg.classList.remove('spinning');
            void this.chickenImg.offsetWidth; // Reflow to restart animation
            this.chickenImg.classList.add('spinning');
            soundManager.playGameOver();
            return;
        }

        // Brief death pause then reset positions
        this.state = 'death';
        this.deathAnimTimer = 60;
    }

    updateHUD() {
        this.scoreEl.textContent = this.score;
        this.scoreEl.classList.remove('score-pop');
        void this.scoreEl.offsetWidth; // Reflow
        this.scoreEl.classList.add('score-pop');

        const hearts = '❤️'.repeat(this.lives) + '🖤'.repeat(INITIAL_LIVES - this.lives);
        this.livesEl.textContent = hearts;
    }

    checkDotCollision() {
        const { row, col } = this.player.getGridPos();
        if (row < 0 || row >= MAP_ROWS || col < 0 || col >= MAP_COLS) return;

        const dot = this.dotMap[row][col];
        if (dot === 1) {
            // Regular dot
            this.dotMap[row][col] = 0;
            this.score += POINTS_DOT;
            this.updateHUD();
        } else if (dot === 2) {
            // Power pellet
            this.dotMap[row][col] = 0;
            this.score += POINTS_POWER;
            this.ghostEatCombo = 0;
            this.updateHUD();
            soundManager.playPowerPellet();

            // Frighten all ghosts
            this.ghosts.forEach(g => g.setFrightened());
        }

        // Check win condition
        if (countRemainingDots(this.dotMap) === 0) {
            this.state = 'win';
            this.winScoreEl.textContent = this.score;
            this.overlayWin.classList.remove('hidden');
            soundManager.playLevelClear();
        }
    }

    checkGhostCollision() {
        const px = this.player.x + TILE_SIZE / 2;
        const py = this.player.y + TILE_SIZE / 2;

        for (const ghost of this.ghosts) {
            if (ghost.mode === 'waiting' || ghost.mode === 'eaten' || ghost.mode === 'exiting' || ghost.mode === 'entering') continue;

            const gx = ghost.x + TILE_SIZE / 2;
            const gy = ghost.y + TILE_SIZE / 2;
            const dist = Math.hypot(px - gx, py - gy);

            if (dist < COLLISION_DISTANCE) {
                if (ghost.mode === 'frightened') {
                    // Eat the ghost
                    ghost.mode = 'eaten';
                    this.ghostEatCombo++;
                    this.score += POINTS_GHOST * this.ghostEatCombo;
                    this.updateHUD();
                } else {
                    // Ghost catches pac-man
                    this.loseLife();
                    return;
                }
            }
        }
    }

    update() {
        if (this.state === 'death') {
            this.deathAnimTimer--;
            if (this.deathAnimTimer <= 0) {
                this.resetPositions();
                this.state = 'playing';
            }
            return;
        }

        if (this.state !== 'playing') return;

        this.frameCount++;

        // Update player
        this.player.update();

        // Check dot collision
        this.checkDotCollision();

        // Get player info for ghost AI
        const playerPos = {
            ...this.player.getGridPos(),
            dx: this.player.direction.x,
            dy: this.player.direction.y,
        };
        const blinkyPos = this.ghosts[0].getGridPos();

        // Update ghosts
        for (const ghost of this.ghosts) {
            ghost.update(playerPos, blinkyPos);
        }

        // Check ghost collision
        this.checkGhostCollision();
    }

    draw() {
        const { ctx, canvas } = this;

        // Clear
        ctx.fillStyle = '#000010';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw map (walls + dots)
        drawMap(ctx, this.dotMap, this.frameCount);

        // Draw death animation or player
        if (this.state === 'death') {
            // Pac-man shrinking animation
            const progress = this.deathAnimTimer / 60;
            const centerX = this.player.x + TILE_SIZE / 2;
            const centerY = this.player.y + TILE_SIZE / 2;
            const radius = (TILE_SIZE / 2 - 2) * progress;

            ctx.save();
            ctx.fillStyle = '#ffeb3b';
            ctx.shadowColor = '#ff1744';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(centerX, centerY, Math.max(radius, 0), 0, Math.PI * 2 * progress);
            ctx.lineTo(centerX, centerY);
            ctx.fill();
            ctx.restore();
        } else {
            this.player.draw(ctx);
        }

        // Draw ghosts
        for (const ghost of this.ghosts) {
            ghost.draw(ctx, this.frameCount);
        }
    }

    /**
     * Main game loop.
     */
    loop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.loop());
    }
}
