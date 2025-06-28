// Bee Bussell
// StarEmitter.js
// Creates and animates stars across the celestial canvas.

function randRange([min, max]) {
    if (min === undefined || max === undefined) {
        console.warn('randRange called with undefined values:', [min, max]);
        return 0;
    }
    return min + Math.random() * (max - min);
}

/**
 * Linearly interpolate between two hex colors.
 * @param {number} a - Start color (0xRRGGBB)
 * @param {number} b - End color (0xRRGGBB)
 * @param {number} t - Progress 0.0–1.0
 * @returns {number} - Interpolated color
 */
function lerpColor(a, b, t) {
    const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
    const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
    const rr = Math.round(ar + (br - ar) * t);
    const rg = Math.round(ag + (bg - ag) * t);
    const rb = Math.round(ab + (bb - ab) * t);
    return (rr << 16) | (rg << 8) | rb;
}

/**
 * Sample a color ramp defined as an object mapping normalized times (0–1) to hex color values.
 * @param {Object} ramp - { t0: color0, t1: color1, ... }
 * @param {number} t - Normalized time (0–1).
 * @returns {number} - Interpolated hex color.
 */
function getColorRampValue(ramp, t) {
    const keys = Object.keys(ramp).map(parseFloat).sort((a, b) => a - b);
    if (t <= keys[0]) return ramp[keys[0]];
    if (t >= keys[keys.length - 1]) return ramp[keys[keys.length - 1]];
    let lower = keys[0], upper = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) {
        if (t >= keys[i] && t <= keys[i + 1]) {
            lower = keys[i];
            upper = keys[i + 1];
            break;
        }
    }
    const span = upper - lower;
    const localT = (t - lower) / span;
    return lerpColor(ramp[lower], ramp[upper], localT);
}

/**
 * Sample a ramp defined as an object mapping normalized times (0–1) to values.
 * @param {Object|Array} ramp - Either an object {t0: v0, t1: v1, ...} or an array [start, end].
 * @param {number} t - Normalized time (0–1).
 * @returns {*} - Interpolated value.
 */
function getRampValue(ramp, t) {
    if (Array.isArray(ramp) && ramp.length === 2) {
        return ramp[0] + (ramp[1] - ramp[0]) * t;
    }

    const keys = Object.keys(ramp).map(parseFloat).sort((a, b) => a - b);
    if (t <= keys[0]) return ramp[keys[0]];
    if (t >= keys[keys.length - 1]) return ramp[keys[keys.length - 1]];

    let lower = keys[0], upper = keys[keys.length - 1];
    for (let i = 0; i < keys.length - 1; i++) {
        if (t >= keys[i] && t <= keys[i + 1]) {
            lower = keys[i];
            upper = keys[i + 1];
            break;
        }
    }

    const span = upper - lower;
    const localT = (t - lower) / span;
    const v0 = ramp[lower], v1 = ramp[upper];

    if (typeof v0 === 'number' && typeof v1 === 'number' && (v0 > 0xFF || v1 > 0xFF)) {
        return lerpColor(v0, v1, localT);
    }

    return v0 + (v1 - v0) * localT;
}

/**
 * StarEmitter creates and animates celestial stars with various animation patterns.
 * @param {PIXI.Application} app - Pixi application instance.
 * @param {Object} config - Star emitter configuration:
 *   @param {number} config.starCount - Total number of stars to maintain.
 *   @param {Object} config.spawnArea - { type: 'rect'|'circle', width?, height?, radius? }.
 *   @param {Object} config.starTexture - PIXI.Texture for the star sprite.
 *   @param {string} config.animationType - 'twinkle'|'pulse'|'shimmer'|'drift'|'static'.
 *   @param {Object} config.scaleRange - { min: number, max: number }.
 *   @param {Object} config.alphaAnimation - Animation properties for alpha.
 *   @param {Object} config.scaleAnimation - Animation properties for scale.
 *   @param {Object} config.colorAnimation - Animation properties for color.
 */
class StarEmitter {
    constructor(app, config) {
        this.app = app;
        const defaultConfig = {
            // Core star properties
            starCount: 50,
            spawnArea: { type: 'rect', width: 800, height: 600 },
            starTexture: PIXI.Texture.WHITE,
            
            // Animation type
            animationType: 'twinkle', // 'twinkle', 'pulse', 'shimmer', 'drift', 'static'
            
            // Visual properties
            scaleRange: { min: 0.3, max: 1.2 },
            baseColor: 0xffffff,
            blendMode: 'normal',
            
            // Animation configurations
            alphaAnimation: {
                enabled: true,
                speed: [0.5, 2.0],  // cycles per second
                range: [0.3, 1.0],
                phase: 'random'     // 'random', 'synchronized', 'wave'
            },
            
            scaleAnimation: {
                enabled: false,
                speed: [0.3, 1.5],
                range: [0.8, 1.2],
                phase: 'random'
            },
            
            colorAnimation: {
                enabled: false,
                speed: [0.2, 0.8],
                colors: [0xffffff, 0xffffcc, 0xccccff],
                phase: 'random'
            },
            
            // Drift movement (for 'drift' animation type)
            drift: {
                enabled: false,
                speed: { x: [-5, 5], y: [-5, 5] },
                bounds: 'wrap' // 'wrap', 'bounce', 'none'
            }
        };

        // Merge config with defaults, preserving nested objects
        this.config = {
            ...defaultConfig,
            ...config,
            // Explicitly merge nested animation configs
            alphaAnimation: { ...defaultConfig.alphaAnimation, ...(config?.alphaAnimation || {}) },
            scaleAnimation: { ...defaultConfig.scaleAnimation, ...(config?.scaleAnimation || {}) },
            colorAnimation: { ...defaultConfig.colorAnimation, ...(config?.colorAnimation || {}) },
            drift: { ...defaultConfig.drift, ...(config?.drift || {}) },
            scaleRange: { ...defaultConfig.scaleRange, ...(config?.scaleRange || {}) },
            spawnArea: { ...defaultConfig.spawnArea, ...(config?.spawnArea || {}) }
        };

        this._container = new PIXI.Container();
        this._stars = [];
        this._update = this._update.bind(this);
        this._running = false;
    }

    start() {
        if (!this._running) {
            this._running = true;
            this._spawnAllStars();
            this.app.ticker.add(this._update);
        }
    }

    stop() {
        if (this._running) {
            this._running = false;
            this.app.ticker.remove(this._update);
        }
    }

    clear() {
        this._stars.forEach(star => {
            if (star.sprite.parent) {
                this._container.removeChild(star.sprite);
            }
            star.sprite.destroy();
        });
        this._stars.length = 0; // Clear array efficiently
    }

    destroy() {
        this.stop();
        this.clear();
        if (this._container.parent) {
            this._container.parent.removeChild(this._container);
        }
        this._container.destroy();
    }

    setConfig(newConfig) {
        Object.assign(this.config, newConfig);
        this.clear();
        if (this._running) {
            this._spawnAllStars();
        }
    }

    get container() {
        return this._container;
    }

    _spawnAllStars() {
        for (let i = 0; i < this.config.starCount; i++) {
            this._createStar();
        }
    }

    _createStar() {
        const sprite = new PIXI.Sprite(this.config.starTexture);
        sprite.anchor.set(0.5);
        sprite.blendMode = this.config.blendMode;
        sprite.tint = this.config.baseColor;

        // Position star within spawn area
        this._positionStar(sprite);

        // Set base scale
        const baseScale = randRange([this.config.scaleRange.min, this.config.scaleRange.max]);
        sprite.scale.set(baseScale);

        // Create star data
        const star = {
            sprite: sprite,
            baseScale: baseScale,
            baseAlpha: 1.0,
            baseColor: this.config.baseColor,
            
            // Animation phases and speeds
            alphaPhase: this._getPhase(this.config.alphaAnimation.phase),
            scalePhase: this._getPhase(this.config.scaleAnimation.phase),
            colorPhase: this._getPhase(this.config.colorAnimation.phase),
            
            alphaSpeed: randRange(this.config.alphaAnimation.speed),
            scaleSpeed: randRange(this.config.scaleAnimation.speed),
            colorSpeed: randRange(this.config.colorAnimation.speed),
            
            // Drift properties
            driftVx: this.config.drift.enabled ? randRange(this.config.drift.speed.x) : 0,
            driftVy: this.config.drift.enabled ? randRange(this.config.drift.speed.y) : 0,
            
            time: 0
        };

        this._container.addChild(sprite);
        this._stars.push(star);
        return star;
    }

    _positionStar(sprite) {
        const { spawnArea } = this.config;
        
        if (spawnArea.type === 'circle') {
            const r = Math.random() * spawnArea.radius;
            const a = Math.random() * Math.PI * 2;
            sprite.x = r * Math.cos(a);
            sprite.y = r * Math.sin(a);
        } else { // rect
            sprite.x = Math.random() * spawnArea.width;
            sprite.y = Math.random() * spawnArea.height;
        }
    }

    _getPhase(phaseType) {
        switch (phaseType) {
            case 'synchronized': return 0;
            case 'wave': return Math.random() * Math.PI * 2;
            case 'random':
            default:
                return Math.random() * Math.PI * 2;
        }
    }

    _update(delta) {
        const dt = this.app.ticker.deltaMS / 1000;

        this._stars.forEach(star => {
            star.time += dt;
            
            // Prevent time overflow for long-running sessions
            if (star.time > 3600) { // Reset every hour
                star.time = star.time % 3600;
            }

            // Alpha animation
            let alphaT = 0.5; // default mid-value
            if (this.config.alphaAnimation.enabled) {
                alphaT = Math.sin(star.time * star.alphaSpeed + star.alphaPhase) * 0.5 + 0.5;
                const [minAlpha, maxAlpha] = this.config.alphaAnimation.range;
                star.sprite.alpha = minAlpha + (maxAlpha - minAlpha) * alphaT;
            }

            // Scale animation - can be independent or synced with alpha
            if (this.config.scaleAnimation.enabled) {
                let scaleT = alphaT; // Default to sync with alpha
                
                // For twinkle animation, use independent scale timing for more natural effect
                if (this.config.animationType === 'twinkle') {
                    scaleT = Math.sin(star.time * star.scaleSpeed + star.scalePhase) * 0.5 + 0.5;
                }
                
                const [minScale, maxScale] = this.config.scaleAnimation.range;
                const animatedScale = minScale + (maxScale - minScale) * scaleT;
                star.sprite.scale.set(star.baseScale * animatedScale);
            }

            // Color animation
            if (this.config.colorAnimation.enabled) {
                const colorT = (Math.sin(star.time * star.colorSpeed + star.colorPhase) + 1) * 0.5;
                const colors = this.config.colorAnimation.colors;
                const colorIndex = colorT * (colors.length - 1);
                const lowerIndex = Math.floor(colorIndex);
                const upperIndex = Math.min(lowerIndex + 1, colors.length - 1);
                const localT = colorIndex - lowerIndex;
                
                star.sprite.tint = lerpColor(colors[lowerIndex], colors[upperIndex], localT);
            }

            // Drift movement
            if (this.config.drift.enabled) {
                star.sprite.x += star.driftVx * dt;
                star.sprite.y += star.driftVy * dt;

                // Handle bounds
                if (this.config.drift.bounds === 'wrap') {
                    if (star.sprite.x < 0) star.sprite.x = this.config.spawnArea.width;
                    if (star.sprite.x > this.config.spawnArea.width) star.sprite.x = 0;
                    if (star.sprite.y < 0) star.sprite.y = this.config.spawnArea.height;
                    if (star.sprite.y > this.config.spawnArea.height) star.sprite.y = 0;
                } else if (this.config.drift.bounds === 'bounce') {
                    if (star.sprite.x < 0 || star.sprite.x > this.config.spawnArea.width) {
                        star.driftVx *= -1;
                        star.sprite.x = Math.max(0, Math.min(this.config.spawnArea.width, star.sprite.x));
                    }
                    if (star.sprite.y < 0 || star.sprite.y > this.config.spawnArea.height) {
                        star.driftVy *= -1;
                        star.sprite.y = Math.max(0, Math.min(this.config.spawnArea.height, star.sprite.y));
                    }
                }
            }

            // Animation type specific behaviors
            this._applyAnimationType(star, dt);
        });
    }

    _applyAnimationType(star, dt) {
        switch (this.config.animationType) {
            case 'twinkle':
                // Smooth speed variation for twinkle effect - no jarring jumps
                if (Math.random() < 0.002) { // Increased chance: 0.8% per frame
                    const speedRange = this.config.alphaAnimation.speed;
                    const targetSpeed = randRange(speedRange);
                    // Smoothly interpolate to new speed instead of jumping
                    star.alphaSpeed += (targetSpeed - star.alphaSpeed) * 0.1;
                    
                    // Also smoothly vary scale speed
                    const scaleSpeedRange = this.config.scaleAnimation.speed;
                    const targetScaleSpeed = randRange(scaleSpeedRange);
                    star.scaleSpeed += (targetScaleSpeed - star.scaleSpeed) * 0.1;
                }
                break;
                
            case 'pulse':
                // Smooth, rhythmic scaling
                const pulseT = Math.sin(star.time * 1.5) * 0.5 + 0.5;
                star.sprite.scale.set(star.baseScale * (0.8 + 0.4 * pulseT));
                break;
                
            case 'shimmer':
                // Color cycling with subtle scale changes
                const shimmerHue = (star.time * 0.5 + star.colorPhase) % (Math.PI * 2);
                const shimmerBrightness = Math.sin(shimmerHue) * 0.3 + 0.7;
                star.sprite.alpha = shimmerBrightness;
                break;
                
            case 'drift':
                // Handled in main update loop
                break;
                
            case 'static':
            default:
                // No additional animation
                break;
        }
    }
}

export { StarEmitter };
