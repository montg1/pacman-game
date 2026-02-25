// ===== Sound Manager =====

class SoundManager {
    constructor() {
        this.sounds = {};
        this.loaded = false;
    }

    /**
     * Preload all game sounds.
     */
    preload() {
        const files = {
            ghostHit: '/sounds/tung-tung-sahur.mp3',
            gameOver: '/sounds/chicken-on-tree-screaming.mp3',
            powerPellet: '/sounds/huh-cat-meme.mp3',
            levelClear: '/sounds/fahhhhhhhhhhhhhh.mp3',
        };

        const promises = Object.entries(files).map(([key, src]) => {
            return new Promise((resolve) => {
                const audio = new Audio(src);
                audio.preload = 'auto';
                audio.volume = 0.6;
                this.sounds[key] = audio;
                audio.addEventListener('canplaythrough', () => resolve(), { once: true });
                audio.addEventListener('error', () => {
                    console.warn(`Sound "${key}" failed to load: ${src}`);
                    resolve(); // Don't block on sound errors
                });
                // Force load
                audio.load();
            });
        });

        return Promise.all(promises).then(() => {
            this.loaded = true;
        });
    }

    /**
     * Play a sound by key. Creates a clone so overlapping plays work.
     */
    play(key) {
        const sound = this.sounds[key];
        if (!sound) return;

        // Clone the audio for overlapping playback
        const clone = sound.cloneNode();
        clone.volume = sound.volume;
        clone.play().catch(() => {
            // Autoplay might be blocked; ignore silently
        });
    }

    /**
     * Play the ghost collision sound
     */
    playGhostHit() {
        this.play('ghostHit');
    }

    playGameOver() {
        this.play('gameOver');
    }

    playPowerPellet() {
        this.play('powerPellet');
    }

    playLevelClear() {
        this.play('levelClear');
    }
}

export const soundManager = new SoundManager();
