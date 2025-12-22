# T10 Lottery Spinner

A high-performance, single-page web application for picking random winners from CSV/Excel datasets. Created with generic HTML/CSS/JS for easy deployment.

## Deploying to GitHub Pages
1. Push this repository to GitHub.
2. Go to **Settings > Pages**.
3. Select `main` branch (or `master`) and `/root` folder.
4. Save. Your site will be live.

## Features
- **CSV/XLSX Import**: Supports huge files (tested up to ~2000 rows).
- **Physics Wheel**: Deterministic 3D-style vertical wheel animation.
- **Theming**: 7+ presets including Dark, Light, and Seasonal themes.
- **Celebration**: Full-screen confetti and fireworks.
- **Persistence**: Remembers your dataset and settings (LocalStorage).

## How to Test
A test suite is available at `/tests/index.html`. Open this file in your browser to run the Mocha unit tests.

## File Structure
- `index.html`: Main app
- `modules/`: Core logic (UI, Store, Wheel, Data)
- `styles.css`: All styling and themes

## Credits
Built with Vanilla JS.
Libraries: SheetJS, Canvas Confetti, Fireworks JS.
