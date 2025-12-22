export default class Celebration {
    constructor() {
        this.overlay = document.getElementById('celebration-overlay');
        this.canvas = document.getElementById('fireworks-canvas');
        this.fireworks = null;
        this.timer = null;

        // Init fireworks instance
        if (window.Fireworks) {
            this.fireworks = new window.Fireworks.default(this.canvas, {
                autoresize: true,
                opacity: 0.5,
                acceleration: 1.05,
                friction: 0.97,
                gravity: 1.5,
                particles: 50,
                traceLength: 3,
                traceSpeed: 10,
                explosion: 5,
                intensity: 30,
                flickering: 50,
                lineStyle: 'round',
                hue: { min: 30, max: 60 }, // Gold/Orangeish default
                delay: { min: 15, max: 30 },
                rocketsPoint: { min: 50, max: 50 },
                lineWidth: { explosion: { min: 1, max: 3 }, trace: { min: 1, max: 2 } },
                brightness: { min: 50, max: 80 },
                decay: { min: 0.015, max: 0.03 },
                mouse: { click: false, move: false, max: 1 }
            });
        }
    }

    start(winnerRow, rowNumber, durationSeconds) {
        // 1. Show Overlay
        this.overlay.classList.add('visible');

        // 2. Set Content
        document.getElementById('winner-number').textContent = `#${rowNumber}`;
        document.getElementById('winner-name').textContent = this.getDisplayName(winnerRow);

        // 3. Start Fireworks
        if (this.fireworks) this.fireworks.start();

        // 4. Start Confetti Cannon (CanvasConfetti)
        this.fireConfetti();

        // 5. Timer
        this.timer = setTimeout(() => {
            this.stop();
        }, durationSeconds * 1000);
    }

    stop() {
        if (this.timer) clearTimeout(this.timer);
        this.overlay.classList.remove('visible');
        if (this.fireworks) this.fireworks.stop();
    }

    fireConfetti() {
        if (!window.confetti) return;

        const count = 400;
        const defaults = { origin: { y: 0.7 } };

        const fire = (particleRatio, opts) => {
            confetti(Object.assign({}, defaults, opts, {
                particleCount: Math.floor(count * particleRatio)
            }));
        };

        fire(0.25, { spread: 26, startVelocity: 55 });
        fire(0.2, { spread: 60 });
        fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
        fire(0.1, { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
        fire(0.1, { spread: 120, startVelocity: 45 });
    }

    getDisplayName(row) {
        // Try to find a logical name column or just first value
        if (!row || !row.values) return 'Anonymous';
        return row.values.find(v => typeof v === 'string' && v.length > 0) || 'Winner';
    }
}
