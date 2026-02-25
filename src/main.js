// ===== Entry Point =====
import './style.css';
import { Game } from './game.js';

const canvas = document.getElementById('game-canvas');
const game = new Game(canvas);
game.loop();
