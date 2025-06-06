import { createSpriteLayer } from '../components/SpriteLayer.js';
import { makeLayerParallax } from '../components/Parallax.js';
import { makeTimeConstrained } from '../components/TimeConstrained.js'
import { ParticleEmitter } from '../components/ParticleEmitter.js';

const scrollScale = 0.2;






export async function createScenicCity(app) {

    const rootContainer = new PIXI.Container();


    // Load assets in parallel
    await PIXI.Assets.load([
    // Sky
    { alias: 'celestial_sky', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer01.png' },
    { alias: 'celestial_clouds', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer02.png' },

    { alias: 'celestial_far_hills', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer03.png' },
    { alias: 'celestial_hills', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer04.png' },
    { alias: 'celestial_near_hills', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer05.png' },
    { alias: 'celestial_trees', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/240x135px/Parallax Backgrounds 240x135px/PixelMountain04/PixelMountain04_layer06.png' },
    // Lights
    
    { alias: 'celestial_light', src: './assets/Lights/neutralPointDiy.png' },
    { alias: 'celestial_pixel_light', src: './assets/Lights/pixelLight.png' },
    // Particles
    { alias: 'celestial_fireflies', src: './assets/Particles/FireFly.png' },
    
    { alias: 'celestial_star', src: './assets/Particles/Star.png' },

    // ambient
    { alias: 'celestial_ambience', src: './assets/ambience/forest_ambience_b.mp3'}
    ]);



    // Setup the day-night cycle
    // CanvasModulate: day–night cycle tint over 60 seconds
    const dayLightFilter = new PIXI.ColorMatrixFilter();
    dayLightFilter.tint(0x4B419B, true);

    // This number will rotate between 0 - 1 - 0 over time
    let dayNightTime = 0;
    let elapsedTime = 7500;

    const cycleSeconds = 15;
    const cycleDuration = cycleSeconds * 1000; // Convert to ms
    const cycleAngularSpeed = (2 * Math.PI) / cycleDuration; // Angular speed for the sine wave

    app.ticker.add((delta) => {    
        elapsedTime += delta.elapsedMS;
        dayNightTime = 0.5 + 0.5 * Math.sin(cycleAngularSpeed * elapsedTime);

        const alpha = dayNightTime;
        dayLightFilter.alpha = alpha;
    });

    // For use within component update functions
    function getTime() {
        return dayNightTime;
    }

    // Filters

    const lightBloomFilter = new PIXI.filters.AdvancedBloomFilter({
        brightness: 1.5,
        bloomScale: 0.5,
        kernelSize: 5,
        quality: 0.1,
        resolution: 1,
        threshold: 0.1,
    });

    const starBloomFilter = new PIXI.filters.AdvancedBloomFilter({
        brightness: 1.0,
        bloomScale: 1.5,
        blur: 2.5,
        quality: 0.1,
        threshold: 0.1,
    });

    const windowBloomFilter = new PIXI.filters.AdvancedBloomFilter({
        blur: 2.5,
        brightness: 1.0,
        quality: 2.5,
        threshold: 0.1,
    });

    // If I decide to use the glow filter, I can use this
    const windowGlowFilter = new PIXI.filters.GlowFilter({
        color: 0x8cefb6,
        distance: 20,
        innerStrength: 0,
        outerStrength: 2,
        quality: 0.25,
    });

    // Layers

    // Sky Layer
    const skyTexture = PIXI.Assets.get('celestial_sky');
    skyTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const skyLayer = createSpriteLayer(skyTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    // Create star particles and add them to the stars layer
    // Build 1x1 pixel texture for the star particle
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, 1, 1);
    const starTexture = PIXI.Texture.from(canvas);
    starTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const starEmitter = new ParticleEmitter(app, {
        explosiveness: 0.0,
        maxParticles: 25,
        lifetime: [2, 3],
        spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height / 2 } },
        initialVelocity: { speed: [0, 0], angle: [0, 0] },
        acceleration: { x: 0, y: 0 },
        damping: 0.0,
        texture: starTexture,
        alpha: {
            0.3: 0,
            0.5: 0.6,
            0.7: 0,
        },
        scale: {
            0.3: 0,
            0.5: 8,
            0.7: 0
        },
    });
    starEmitter.start();

    

    // Add light to moon layer
    const moonLightTexture = PIXI.Assets.get('celestial_light');
    moonLightTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const moonLight = new PIXI.Sprite(moonLightTexture);
    moonLight.anchor.set(0.5);
    moonLight.scale.set(1.7);
    moonLight.alpha = 0.3;
    moonLight.blendMode = "add";
    moonLight.position.set(910, 230);
    skyLayer.container.addChild(moonLight);

    // clouds layer
    const cloudsTexture = PIXI.Assets.get('celestial_clouds');
    cloudsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const cloudsLayer = createSpriteLayer(cloudsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    // celestial layers
    const mountainsTexture = PIXI.Assets.get('celestial_far_hills');
    mountainsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const mountainsLayer = createSpriteLayer(mountainsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    const hillsTexture = PIXI.Assets.get('celestial_hills');
    hillsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const hillsLayer = createSpriteLayer(hillsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    const nearHillsTexture = PIXI.Assets.get('celestial_near_hills');
    nearHillsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const nearHillsLayer = createSpriteLayer(nearHillsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    // Fireflies particle
	const firefliesTexture = PIXI.Assets.get('celestial_fireflies');
	const lightTexture = PIXI.Assets.get('celestial_pixel_light');
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


    const treesTexture = PIXI.Assets.get('celestial_trees');
    treesTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const treesLayer = createSpriteLayer(treesTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 8,
        position: [0, 0]
    });

    

    // Apply filters to windows and stars
    // starEmitter.container.filters = [starBloomFilter];


    // Apply dayLightFilter to other layers
    // skyLayer.container.filters = [dayLightFilter];
    // mountainsLayer.container.filters = [dayLightFilter];
    // hillsLayer.container.filters = [dayLightFilter];
    // nearHillsLayer.container.filters = [dayLightFilter];
    // treesLayer.container.filters = [dayLightFilter];

    // Time constrained components
    // ---------------------------
    // makeTimeConstrained(starEmitter, 0.75, 1.0, getTime, app, 0.8, 0.8, 0.1);

    // Apply parallax to layers
    // ------------------------
    // makeLayerParallax(skyLayer, { speed: 1.0 * scrollScale, app });
    // makeLayerParallax(moonLayer, { speed: -0.3 * scrollScale, app });
    // makeLayerParallax(mountainsLayer, { speed: 2.0 * scrollScale, app });
    makeLayerParallax(cloudsLayer, { speed: -0.05 * scrollScale, app });
    makeLayerParallax(mountainsLayer, { speed: 0.5 * scrollScale, app });
    makeLayerParallax(hillsLayer, { speed: 0.75 * scrollScale, app });
    makeLayerParallax(nearHillsLayer, { speed: 1.0 * scrollScale, app });
    makeLayerParallax(treesLayer, { speed: 1.25 * scrollScale, app });

    // const dropShadowFilter = new PIXI.filters.DropShadowFilter({
    //     color: 0x000000,
    //     alpha: 0.5,
    //     blur: 10,
    //     distance: 5,
    //     quality: 5,
    // });

    // cloudsLayer.container.filters = [dropShadowFilter]
    // mountainsLayer.container.filters = [dropShadowFilter];
    // hillsLayer.container.filters = [dropShadowFilter];
    // nearHillsLayer.container.filters = [dropShadowFilter];
    // treesLayer.container.filters = [dropShadowFilter];

    // Add containers to stage in order
    rootContainer.addChild(skyLayer.container);
    rootContainer.addChild(starEmitter.container);
    rootContainer.addChild(cloudsLayer.container);
    

    rootContainer.addChild(mountainsLayer.container);
    rootContainer.addChild(hillsLayer.container);
    // rootContainer.addChild(fireflyEmitter.container);
    rootContainer.addChild(nearHillsLayer.container);
    rootContainer.addChild(treesLayer.container);

    // play ambient sound
    const ambience = PIXI.sound.Sound.from(PIXI.Assets.get('celestial_ambience'));
    ambience.loop = true;
    ambience.volume = 0.5;
    ambience.play();
    
    

    return {container: rootContainer};

}

if (window.CelestialValley) {
  (async () => {
    const app = new PIXI.Application();
    await app.init({
      width: 1920,
      height: 1080,
      antialias: false,
      backgroundAlpha: 0,
      backgroundColor: 0x000000,
      useBackBuffer: true,
      forceCanvas: false
    });
    app.view.style.imageRendering = 'pixelated';
    document.body.appendChild(app.canvas);

    const city = await createScenicCity(app);
    app.stage.addChild(city.container);

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