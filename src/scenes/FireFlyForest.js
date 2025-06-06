import { createSpriteLayer } from '../components/SpriteLayer.js';
import { makeLayerParallax } from '../components/Parallax.js';
import { makeTimeConstrained } from '../components/TimeConstrained.js'
import { ParticleEmitter } from '../components/ParticleEmitter.js';

const SCROLL_SCALE = 0.25;

export async function createFireflyForest(app, options = {}) {

	const scroll_speed = options.scroll_speed || SCROLL_SCALE;
	const cycle_seconds = options.cycle_time || 15;
	const real_time = options.real_time || false;
	const test_time = options.test_time;
	const peak_day_hour = options.peak_day_hour || 12;
	const peak_night_hour = options.peak_night_hour || 0;


	const rootContainer = new PIXI.Container();

	await PIXI.Assets.load([
		{ alias: 'firefly_sky', src: './assets/TreeLayers/bg_sky_4.png' },
		{ alias: 'firefly_stars', src: './assets/TreeLayers/background_sky_green.png' },
		{ alias: 'firefly_moon', src: './assets/TreeLayers/moon.png' },
		{ alias: 'firefly_mountains', src: './assets/TreeLayers/bg_mountains_3.png' },
		{ alias: 'firefly_trees', src: './assets/TreeLayers/bg_treeline_2.png' },
		{ alias: 'firefly_godray', src: './assets/TreeLayers/bg_godlight.png' },
		{ alias: 'firefly_foreground', src: './assets/TreeLayers/bg_treeline_1.png' },
		{ alias: 'firefly_pixel_light', src: './assets/Lights/pixelLight.png' },
		{ alias: 'firefly_light', src: './assets/Lights/neutralPointDiy.png' },
		{ alias: 'firefly_fireflies', src: './assets/Particles/FireFly.png' },
		{ alias: 'firefly_leaf', src: './assets/Particles/Leaf.png' },
		{ alias: 'firefly_star', src: './assets/Particles/Star.png' },
	]);

	// Setup the day-night cycle
	// This number will rotate between 0 - 1 - 0 over time
	let dayNightTime = 0;
	let elapsedTime = 0;

	const cycleSeconds = cycle_seconds;
	const cycleDuration = cycleSeconds * 1000; // Convert to ms
	const cycleAngularSpeed = (2 * Math.PI) / cycleDuration; // Angular speed for the sine wave

	app.ticker.add((delta) => {
		// Update the day-night cycle based on system time
		if (real_time) {
			let timeOfDay;
			if (test_time !== undefined) {
				timeOfDay = test_time;
			} else {
				const now = new Date();
				const hour = now.getHours();
				const minute = now.getMinutes();
				timeOfDay = hour + minute / 60;
			}

			// Compute shortest wrapped distance from timeOfDay to peak_day_hour
			let distanceFromDay = Math.abs(timeOfDay - peak_day_hour);
			distanceFromDay = Math.min(distanceFromDay, 24 - distanceFromDay);

			// Linear falloff over 6 hours
			const dayWeight = Math.min(Math.max(0, distanceFromDay / 6), 1);

			// Log debug information
			console.log(`Time of Day: ${timeOfDay}, Peak Day Hour: ${peak_day_hour}, Day Weight: ${dayWeight}`);

			// Update the dayNightTime based on the weight
			dayNightTime =dayWeight;
		} else {
			elapsedTime += delta.elapsedMS;
			dayNightTime = 0.5 + 0.5 * Math.sin(cycleAngularSpeed * elapsedTime);
		}
	});

	// For use within component update functions
	function getTime() {
		return dayNightTime;
	}


	// Sky Layer
	const skyTexture = PIXI.Assets.get('firefly_sky');
	skyTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const skyLayer = createSpriteLayer(skyTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [0, 0]
	});


	// Stars Layer
	const starsTexture = PIXI.Assets.get('firefly_stars');
	starsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const starsLayer = createSpriteLayer(starsTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [0, 50]
	});

	// Create star particles and add them to the stars layer
	// Build 1x1 pixel texture for the star particle
	const starCanvas = document.createElement('canvas');
	starCanvas.width = 1;
	starCanvas.height = 1;
	const starContext = starCanvas.getContext('2d');
	starContext.fillStyle = '#ffffff';
	starContext.fillRect(0, 0, 1, 1);
	const starTexture = PIXI.Texture.from(starCanvas);
	starTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const starEmitter = new ParticleEmitter(app, {
		explosiveness: 0.0,
		maxParticles: 100,
		lifetime: [2, 3],
		spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height } },
		initialVelocity: { speed: [0, 0], angle: [0, 0] },
		acceleration: { x: 0, y: 0 },
		damping: 0.0,
		texture: starTexture,
		scale: {
			0.3: 0,
			0.5: 4,
			0.7: 0
		},
	});


	// Add star emitter to stars layer
	starsLayer.container.addChild(starEmitter.container);
	starEmitter.start();

	makeLayerParallax(starsLayer, { speed: -0.01 * scroll_speed, app });
	makeTimeConstrained(starsLayer, 0.6, 1.0, getTime, app, 0.5, 1.0, 0.0);

	// Moon Layer
	const moonTexture = PIXI.Assets.get('firefly_moon');
	moonTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const moonLayer = createSpriteLayer(moonTexture, {
		tile: false,
		scale: 5,
		position: [100, 650]
	});

	// Add light to moon layer
	const moonLightTexture = PIXI.Assets.get('firefly_light');
	moonLightTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const moonLight = new PIXI.Sprite(moonLightTexture);
	moonLight.anchor.set(0.5);
	moonLight.scale.set(1.5);
	moonLight.alpha = 0.5;
	moonLight.blendMode = "add";
	moonLight.position.set(190, 740);
	moonLayer.container.addChild(moonLight);

	makeLayerParallax(moonLayer, { speed: -0.3 * scroll_speed, app });
	makeTimeConstrained(moonLayer, 0.6, 1.0, getTime, app, 0.5, 1.0, 0.1);


	// Mountain Layer
	const mountainsTexture = PIXI.Assets.get('firefly_mountains');
	mountainsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const mountainsLayer = createSpriteLayer(mountainsTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [-150, 0]
	});
	makeLayerParallax(mountainsLayer, { speed: 0.2 * scroll_speed, app });


	// Tree Layer
	const treesTexture = PIXI.Assets.get('firefly_trees');
	treesTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const treesLayer = createSpriteLayer(treesTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [-150, 0]
	});
	makeLayerParallax(treesLayer, { speed: 0.5 * scroll_speed, app });

	// GodRay Layer
	const godrayTexture = PIXI.Assets.get('firefly_godray');
	godrayTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const godrayLayer = createSpriteLayer(godrayTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [-150, 0],
		blendMode: "add"
	});
	makeLayerParallax(godrayLayer, { speed: 0.7 * scroll_speed, app });


	// Fireflies particle
	const firefliesTexture = PIXI.Assets.get('firefly_fireflies');
	const lightTexture = PIXI.Assets.get('firefly_pixel_light');
	lightTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const fireflyEmitter = new ParticleEmitter(app, {
		explosiveness: 0.0,
		maxParticles: 150,
		lifetime: [10 * 0.7, 20 * 0.7],
		spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height * 0.3 } },
		initialVelocity: { speed: [100, 100], angle: [0, Math.PI * 5] },
		acceleration: { x: 0, y: 0 },
		damping: 0.0,
		texture: firefliesTexture,
		blendMode: "add",
		scale: {
			0.00: 0,
			0.2: 10,
			0.8: 10,
			1.00: 0
		},
		alpha: {
			0: 0,
			0.1: 1,
			0.9: 1,
			1: 0
		},
		color: {
			0.45: 0x000000,
			0.5: 0xffff00,
			0.55: 0x000000,
		},
		rotationSpeed: [0, 0],
		spin: [0, 0],
		light: {
			texture: lightTexture,
			lightScaleRamp: {
				0.48: 0,
				0.5: 4,
				0.52: 0
			},
			lightEnergy: {
				0.48: 0,
				0.5: 1,
				0.52: 0
			},
			lightHue: {
				0.48: 0x000000,
				0.5: 0xffff00,
				0.52: 0x000000,
			}
		}

	});

	fireflyEmitter.container.position.set(0, app.screen.height * 0.45);
	fireflyEmitter.start();
	makeTimeConstrained(fireflyEmitter, 0.5, 1.0, getTime, app, 0.2, 1.0, 0.2);

	// Leaf particle
	const leafTexture = PIXI.Assets.get('firefly_leaf');
	leafTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const leafEmitter = new ParticleEmitter(app, {
		explosiveness: 0.0,
		maxParticles: 10,
		color: [0x0d1620],
		lifetime: [10, 10],
		spawnArea: { type: 'rect', size: { x: app.screen.width, y: 0 } },
		initialVelocity: {
			speed: [200, 300],                       // slow flutter
			angle: [3 * Math.PI / 4, 3 * Math.PI / 4] // ~= down 17 deg
		},
		rotationSpeed: [-2, 2],
		acceleration: { x: 0, y: 60 },           // “gravity” pulling them down
		damping: 0.1,                            // slows their swing over time
		texture: leafTexture,
		blendMode: "normal",
		rotationSpeed: [-2, 2],
		scale: {
			0.00: 5
		},
		alpha: {
			0: 1
		},
	});
	leafEmitter.start();


	// Foreground Layer
	const foregroundTexture = PIXI.Assets.get('firefly_foreground');
	foregroundTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
	const foregroundLayer = createSpriteLayer(foregroundTexture, {
		tile: true,
		tileWidth: 1920,
		tileHeight: 256 * 5,
		scale: 5,
		position: [-150, 0]
	});
	makeLayerParallax(foregroundLayer, {
		speed: 0.9 * scroll_speed,
		app
	});


	// Filters
	// CanvasModulate: day–night cycle tint over 60 seconds
	const colorFilter = new PIXI.ColorMatrixFilter();
	colorFilter.tint(0x4B419B, true);

	// Shimmer filter
	const shimmerFilter = new PIXI.filters.AdvancedBloomFilter({
		blur: 2.5,
		brightness: 1.0,
		quality: .25,
		threshold: 0.1,
	});


	const starBloomFilter = new PIXI.filters.AdvancedBloomFilter({
		brightness: 1.0,
		bloomScale: 1.5,
		blur: 2.5,
		quality: 0.1,
		threshold: 0.1,
	});

	starEmitter.container.filters = [starBloomFilter];

	// fireflyEmitter.container.filters = [shimmerFilter];
	// godrayLayer.container.filters = [shimmerFilter];

	// Filtered sky layer
	const bgContainer = new PIXI.Container();
	bgContainer.addChild(skyLayer.container);
	bgContainer.filters = [colorFilter];

	// Unfiltered stars layer
	const starsContainer = new PIXI.Container();
	starsContainer.addChild(starsLayer.container);
	starsContainer.addChild(moonLayer.container);

	// Filtered foreground layers
	const fgContainer = new PIXI.Container();
	fgContainer.addChild(mountainsLayer.container);
	fgContainer.addChild(treesLayer.container);
	fgContainer.addChild(leafEmitter.container);
	fgContainer.addChild(godrayLayer.container);
	fgContainer.addChild(fireflyEmitter.container);
	fgContainer.addChild(foregroundLayer.container);


	fgContainer.filters = [colorFilter];

	// Add containers to root container in order
	rootContainer.addChild(bgContainer);
	rootContainer.addChild(starsContainer);
	rootContainer.addChild(fgContainer);



	// Update the filter based on the day-night cycle
	app.ticker.add((delta) => {
		const alpha = dayNightTime
		colorFilter.alpha = alpha;
	});

	return { container: rootContainer };
}

if (window.FireFlyMain) {
  (async () => {

	const queryString = window.location.search;
	const urlParams = new URLSearchParams(queryString);
	console.log(urlParams);

	let options = {}
	for (const [key, value] of urlParams.entries()) {
		if (key === 'scroll_speed') {
			options.scroll_speed = parseFloat(value);
		} else if (key === 'cycle_time') {
			options.cycle_time = parseFloat(value);
		} else if (key === 'real_time') {
			options.real_time = value === 'true';
		} else if (key === 'test_time') {
			options.test_time = parseFloat(value);
		} else if (key === 'peak_day_hour') {
			options.peak_day_hour = parseFloat(value);
		} else if (key === 'peak_night_hour') {
			options.peak_night_hour = parseFloat(value);
		} else {
			console.warn(`Unknown parameter: ${key}`);
		}
	}

    const app = new PIXI.Application();
    await app.init({
      width: 1920,
      height: 1080,
      antialias: false,
      backgroundColor: 0x608079,
      useBackBuffer: true,
      forceCanvas: false
    });
    app.view.style.imageRendering = 'pixelated';
    document.body.appendChild(app.canvas);
	
	const motionBlurFilter = new PIXI.filters.MotionBlurFilter({
		velocity: { x: 0, y: 0 },
		kernelSize: 1000,
	});

	const forest = await createFireflyForest(app, options);
	forest.container.filters = [motionBlurFilter];
	app.stage.addChild(forest.container);
	
	// Smooth center zoom and fade-in
    (function transitionIn() {
        const TARGET_SCALE = 1;
        const START_SCALE = 2;
        const FADE_SPEED = 0.07;
        const ZOOM_SPEED = 0.04;

        app.stage.scale.set(START_SCALE);
        app.stage.pivot.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.position.set(app.screen.width / 2, app.screen.height / 2);
        app.stage.alpha = 0;

        function lerp(a, b, t) {
            return a + (b - a) * t;
        }

        const tick = () => {
            app.stage.scale.x = lerp(app.stage.scale.x, TARGET_SCALE, ZOOM_SPEED);
            app.stage.scale.y = lerp(app.stage.scale.y, TARGET_SCALE, ZOOM_SPEED);
            app.stage.alpha = lerp(app.stage.alpha, 1, FADE_SPEED);

            const scaleDone = Math.abs(app.stage.scale.x - TARGET_SCALE) < 0.001;
            const alphaDone = Math.abs(app.stage.alpha - 1) < 0.001;

            if (scaleDone && alphaDone) {
				app.stage.scale.set(TARGET_SCALE);
				app.stage.alpha = 1;
				app.ticker.remove(tick);
            }
        };

        app.ticker.add(tick);
    })();

  })();
}