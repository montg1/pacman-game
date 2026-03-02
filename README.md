# 🎮 PAC-MAN × Tung-Tung-Sahur

A classic Pac-Man arcade game with a twist — the ghosts are **Tung-Tung-Sahur** meme characters! Built with vanilla JavaScript + HTML5 Canvas for maximum performance.

🕹️ **[Play Now →](https://checkenproject.vercel.app)**

![Pac-Man Gameplay](https://raw.githubusercontent.com/montg1/pacman-game/main/chickencover_.jpg)

## ✨ Features

- 🟡 **Classic Pac-Man gameplay** — eat dots, avoid ghosts, score big
- 👻 **Tung-Tung-Sahur ghosts** — 4 ghosts with unique AI behaviors (Blinky, Pinky, Inky, Clyde)
- 🔊 **Meme sound effects**:
  - Ghost collision → `tung-tung-sahur.mp3`
  - Game over → `chicken-on-tree-screaming.mp3`
  - Power pellet → `huh-cat-meme.mp3`
  - Level clear → `fahhhhhhhhhhhhhh.mp3`
- 🐔 **Spinning chicken** on game over screen
- ⚡ **Power pellets** — eat them to hunt the ghosts
- 🎨 **Neon dark theme** with glassmorphism UI
- 📱 **Touch/swipe support** for mobile
- 🐳 **Dockerized** with nginx for production

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/montg1/pacman-game.git
cd pacman-game

# Install & run
npm install
npm run dev
```

Opens at **http://localhost:3000**

## 🐳 Docker

```bash
docker build -t pacman-game .
docker run -d -p 8080:80 pacman-game
```

Opens at **http://localhost:8080**

## 🎮 Controls

| Input | Action |
|-------|--------|
| `↑` `↓` `←` `→` | Move |
| `W` `A` `S` `D` | Move |
| Swipe (mobile) | Move |

## 🏗️ Tech Stack

- **Vite** — dev server & build
- **Vanilla JS** — zero runtime dependencies
- **HTML5 Canvas** — game rendering
- **Nginx** — production serving (Docker)
- **Vercel** — deployment

## 📁 Project Structure

```
├── src/
│   ├── main.js       # Entry point
│   ├── game.js       # Game loop, collisions, scoring
│   ├── player.js     # Pac-Man movement & animation
│   ├── ghost.js      # Ghost AI (4 unique behaviors)
│   ├── map.js        # Maze layout & rendering
│   ├── sound.js      # Sound effects manager
│   └── style.css     # Neon dark theme
├── public/
│   ├── images/       # Ghost sprite, chicken cover
│   └── sounds/       # MP3 sound effects
├── Dockerfile        # Multi-stage build
├── nginx.conf        # Production server config
└── index.html        # Game page
```

## 📄 License

MIT
