// Bee Bussell
// ParticleEmitter.js
// Emits particles from a point or area.

function randRange([min, max]) {
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
 * @returns {*} - Interpolated value (number, array, or color hex).
 */
function getRampValue(ramp, t) {

	// If array [start, end], fallback to linear interpolation
	if (Array.isArray(ramp) && ramp.length === 2) {
		return ramp[0] + (ramp[1] - ramp[0]) * t;
	}

	// Otherwise assume object with numeric keys
	const keys = Object.keys(ramp).map(parseFloat).sort((a, b) => a - b);

	// If time is less than first key, return first value
	if (t <= keys[0]) return ramp[keys[0]];

	// If time is greater than last key, return last value
	if (t >= keys[keys.length - 1]) return ramp[keys[keys.length - 1]];

	// Find the lower and upper keys for interpolation
	let lower = keys[0], upper = keys[keys.length - 1];

	// Iterate through the keys to find the ones surrounding/encompassing t
	for (let i = 0; i < keys.length - 1; i++) {

		// If t is between two keys, set lower and upper and
		if (t >= keys[i] && t <= keys[i + 1]) {
			lower = keys[i];
			upper = keys[i + 1];
			break;
		}
	}

	// get the range of values
	const span = upper - lower;

	// Get t within the range (ex, if we are at 0.25 between 0.0 and 0.5, we are 0.5 of the way through)
	const localT = (t - lower) / span;

	// Values at lower and upper keys
	const v0 = ramp[lower], v1 = ramp[upper];

	// If the values represent colors (either start or end > 0xFF), use lerpColor
	if (typeof v0 === 'number' && typeof v1 === 'number' && (v0 > 0xFF || v1 > 0xFF)) {
		return lerpColor(v0, v1, localT);
	}

	// Return adjusted value
	let value = v0 + (v1 - v0) * localT;
	return value;
}

/** Bet it'd be nice if i updated these docstrings huh :3
 * @param {PIXI.Application} app - Pixi application instance.
 * @param {Object} config - Emitter configuration:
 *   @param {number} config.emitRate - particles per second.
 *   @param {number} config.maxParticles - maximum number of particles.
 *   @param {[number, number]} config.lifetime - [min, max] lifetime in seconds.
 *   @param {Object} config.spawnArea - { type: 'point'|'rect'|'circle', size?: {x,y}, radius?: number }.
 *   @param {Object} config.initialVelocity - { x: number, y: number }.
 * 
 */
class ParticleEmitter {
	constructor(app, config) {
		this.app = app;
		this.config = Object.assign({

			// Particle Specific Properties
			explosiveness: 0,
			maxParticles: 100,
			lifetime: [1, 2],
			spawnArea: { type: 'point' },
			initialVelocity: { speed: [0, 0], angle: [0, Math.PI * 2] },
			acceleration: { x: 0, y: 0 },
			damping: 0,
			texture: PIXI.Texture.WHITE,
			blendMode: "normal",
			scale: [1, 1],
			alpha: [1, 1],
			color: [0xffffff, 0xffffff],
			rotationSpeed: [0, 0],
			spin: [0, 0],

			// Particle Lights
			light: {
				texture: null,
				lightScaleRamp: {},
				lightEnergy: {},
				lightHue: {}
			}

		}, config);
		// Support ramp syntax: convert arrays to keyed ramps
		if (Array.isArray(this.config.scale)) {
			this.config.scale = { 0: this.config.scale[0], 1: this.config.scale[1] };
		}
		if (Array.isArray(this.config.alpha)) {
			this.config.alpha = { 0: this.config.alpha[0], 1: this.config.alpha[1] };
		}
		if (Array.isArray(this.config.color)) {
			this.config.color = { 0: this.config.color[0], 1: this.config.color[1] };
		}
		this._container = new PIXI.Container();
		this._particles = [];
		this._accumulator = 0;
		this._update = this._update.bind(this);

		this._systemTime = 0;
		this._cycle = 0;
	}

	start() {
		if (!this._running) {
			this._running = true;
			// Initial burst based on explosiveness
			if (this.config.explosiveness > 0) {
				const burstCount = Math.round(this.config.maxParticles * this.config.explosiveness);
				for (let i = 0; i < burstCount && this._particles.length < this.config.maxParticles; i++) {
					this._spawnParticle();
				}
			}
			this.app.ticker.add(this._update);
		}
	}

	stop() {
		if (this._running) {
			this._running = false;
			this.app.ticker.remove(this._update);
		}
	}

	reset() {
		this._particles.forEach(p => this._container.removeChild(p.sprite));
		this._particles = [];
		this._accumulator = 0;
	}

	setConfig(cfg) {
		Object.assign(this.config, cfg);
		this.reset();
	}

	get container() {
		return this._container;
	}

	_spawnParticle() {
		const { lifetime, spawnArea, initialVelocity, texture } = this.config;
		const sprite = new PIXI.Sprite(texture);
		sprite.anchor.set(0.5);

		// spawn position
		if (spawnArea.type === 'rect') {
			sprite.x = Math.random() * spawnArea.size.x;
			sprite.y = Math.random() * spawnArea.size.y;
		} else if (spawnArea.type === 'circle') {
			const r = Math.random() * spawnArea.radius;
			const a = Math.random() * Math.PI * 2;
			sprite.x = r * Math.cos(a);
			sprite.y = r * Math.sin(a);
		} else {
			sprite.x = 0; sprite.y = 0;
		}

		// compute velocity from speed/angle
		const speed = randRange(this.config.initialVelocity.speed);
		const angle = randRange(this.config.initialVelocity.angle);


		// AGNLE
		const vx = Math.cos(angle) * speed;
		const vy = Math.sin(angle) * speed;


		// initialize sprite appearance
		sprite.tint = this.config.color[0];
		sprite.blendMode = this.config.blendMode;


		

		// Initialize scale from ramp at t=0
		const initScale = getRampValue(this.config.scale, 0);
		if (Array.isArray(initScale)) {
			sprite.scale.set(initScale[0], initScale[1]);
		} else {
			sprite.scale.set(initScale);
		}

		sprite.rotation = randRange(this.config.spin);
		this._container.addChild(sprite);
		let particle = {
			sprite: sprite,
			vx, vy,
			ax: this.config.acceleration.x,
			ay: this.config.acceleration.y,
			damping: this.config.damping,
			age: 0,
			life: randRange(this.config.lifetime),
			rotationSpeed: randRange(this.config.rotationSpeed),

		};

		// Check if light is defined
		if (this.config.light && this.config.light.texture) {
			let light = this.config.light;

			const lightSprite = new PIXI.Sprite(light.texture);
			lightSprite.anchor.set(0.5);

			const lightScale = getRampValue(light.lightScaleRamp, 0);
			const lightHue = getColorRampValue(light.lightHue, 0);
			const lightEnergy = getRampValue(light.lightEnergy, 0);


			lightSprite.scale.set(lightScale);
			lightSprite.tint = lightHue;
			lightSprite.alpha = lightEnergy;
			
			lightSprite.blendMode = "add";
			sprite.addChild(lightSprite);

			this._container.addChild(lightSprite);
			particle.light = lightSprite;
		}


		this._particles.push(particle);
		return particle;
	}

	_update(delta) {
		const dt = this.app.ticker.deltaMS / 1000;

		// How many particles we'd try to 

		const maxLifetime = this.config.lifetime[1]; // worst case particle life
		this._systemTime += dt;
		if (this._systemTime > maxLifetime) {
			this._systemTime -= maxLifetime;
			this._cycle++;
		}



		
		const countToEmit = this.config.maxParticles;
		for (let i = 0; i < countToEmit; i++) {
			const restartPhase = i / countToEmit;
			const randomizedPhase = restartPhase + (this.config.randomness || 0) * Math.random() / countToEmit;
			const modifiedPhase = randomizedPhase * (1 - this.config.explosiveness);
			const restartTime = modifiedPhase * maxLifetime;

			const prevTime = this._systemTime - dt;
			const now = this._systemTime;

			const wrapped = prevTime > now; 
			const crossed = (!wrapped && restartTime >= prevTime && restartTime < now)
				|| (wrapped && (restartTime >= prevTime || restartTime < now));

			const alreadyActive = this._particles.some(p => p._index === i && p.age < p.life);

			if (crossed && !alreadyActive && this._particles.length < this.config.maxParticles) {
				this._spawnParticle();
				
			}
		}





		// update particles
		for (let i = this._particles.length - 1; i >= 0; i--) {

			const p = this._particles[i];
			p.age += dt;
			if (p.age >= p.life) {
				this._container.removeChild(p.sprite);
				this._particles.splice(i, 1);
				continue;
			}

			// Time through life
			const t = p.age / p.life;


			// Velocity
			p.vx += p.ax * dt;
			p.vy += p.ay * dt;

			// Dampening
			p.vx *= 1 - p.damping * dt;
			p.vy *= 1 - p.damping * dt;

			// Positioning
			p.sprite.x += p.vx * dt;
			p.sprite.y += p.vy * dt;

			// appearance ramps via ramps
			const tNorm = p.age / p.life;

			


			// scale ramp
			const s = getRampValue(this.config.scale, tNorm);
			if (Array.isArray(s)) {
				p.sprite.scale.set(s[0], s[1]);
			} else {
				p.sprite.scale.set(s);
			}

			// alpha ramp
			p.sprite.alpha = getRampValue(this.config.alpha, tNorm);
			// color ramp
			p.sprite.tint = getColorRampValue(this.config.color, tNorm);
			// rotation speed
			p.sprite.rotation += p.rotationSpeed * dt;

			// Handling lighting
			if (p.light) {
				const lightSprite = p.light;

				const light = this.config.light;

				const lightScale = getRampValue(light.lightScaleRamp, tNorm);
				const lightHue = getColorRampValue(light.lightHue, tNorm);
				const lightEnergy = getRampValue(light.lightEnergy, tNorm);

				lightSprite.scale.set(lightScale);
				lightSprite.tint = lightHue;
				lightSprite.alpha = lightEnergy;

				lightSprite.x = p.sprite.x;
				lightSprite.y = p.sprite.y;
			}
		}
	}
}

export { ParticleEmitter };