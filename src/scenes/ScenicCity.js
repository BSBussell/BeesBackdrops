import { createSpriteLayer } from '../components/SpriteLayer.js';
import { makeLayerParallax } from '../components/Parallax.js';
import { makeTimeConstrained } from '../components/TimeConstrained.js'
import { ParticleEmitter } from '../components/ParticleEmitter.js';
import { StarEmitter } from '../components/StarEmitter.js';

const scrollScale = 0.2;


export async function createScenicCity(app, options = {}) {

    const scroll_speed = options.scroll_speed || scrollScale;
    const cycle_seconds = options.cycle_time || 15;
    const real_time = options.real_time || false;
    const test_time = options.test_time;
    const peak_day_hour = options.peak_day_hour || 12;
    const peak_night_hour = options.peak_night_hour || 0;

    const rootContainer = new PIXI.Container();


    // Load assets in parallel
    await PIXI.Assets.load([
    // Sky
    { alias: 'scenic_sky', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/1920x1080px (FullHD)/Parallax Backgrounds 1920x1080px/PixelMountainFullHD01/PixelMountainFullHD01_layer01.png' },
    // Mountains
    { alias: 'scenic_mountains', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/1920x1080px (FullHD)/Parallax Backgrounds 1920x1080px/PixelMountainFullHD01/PixelMountainFullHD01_layer02.png' },
    // Lake
    { alias: 'scenic_lake', src: './assets/MTNS/Pixel Mountains & Hills - Parallax pack/1920x1080px (FullHD)/Parallax Backgrounds 1920x1080px/PixelMountainFullHD01/PixelMountainFullHD01_layer03.png' },
    // City layers
    { alias: 'scenic_cityNear', src: './assets/City/city 8/scaled_4_graded.png' },
    { alias: 'scenic_cityNearWindows', src: './assets/City/city 8/scaled_4_window_layer.png' },
    { alias: 'scenic_cityFront', src: './assets/City/city 8/scaled_5.png' },
    { alias: 'scenic_cityFrontWindows', src: './assets/City/city 8/scaled_5_window_layer.png' },
    // Lights
    { alias: 'scenic_pixel_light', src: './assets/Lights/pixelLight.png' },
    { alias: 'scenic_light', src: './assets/Lights/neutralPointDiy.png' },
    { alias: 'scenic_spotlight', src: './assets/Lights/spotLight.png' },
    // Particles
    { alias: 'scenic_fireflies', src: './assets/Particles/FireFly.png' },
    { alias: 'scenic_leaf', src: './assets/Particles/Leaf.png' },
    { alias: 'scenic_star', src: './assets/Particles/Star.png' },
    // Moon
    { alias: 'scenic_moon', src: './assets/TreeLayers/moon-no-red.png' },
    // Ambient sound
    { alias: 'scenic_ambience', src: './assets/ambience/distant_city.mp3'}
    ]);



    // Setup the day-night cycle
    // CanvasModulate: day–night cycle tint over 60 seconds
    const dayLightFilter = new PIXI.ColorMatrixFilter();
    dayLightFilter.tint(0x4B419B, true);

    // This number will rotate between 0 - 1 - 0 over time
    let dayNightTime = 0;
    let elapsedTime = 7500;

    const cycleDuration = cycle_seconds * 1000; // Convert to ms
    const cycleAngularSpeed = (2 * Math.PI) / cycleDuration; // Angular speed for the sine wave

    app.ticker.add((delta) => {
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
        dayNightTime = dayWeight;
      } else {
        elapsedTime += delta.elapsedMS;
        dayNightTime = 0.5 + 0.5 * Math.sin(cycleAngularSpeed * elapsedTime);
      }

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
    const skyTexture = PIXI.Assets.get('scenic_sky');
    skyTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const skyLayer = createSpriteLayer(skyTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 0]
    });

    // Create starfield using StarEmitter
    const starTexture = PIXI.Assets.get('scenic_star');
    starTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const starEmitter = new StarEmitter(app, {
        starCount: 25,
        spawnArea: { type: 'rect', width: app.screen.width, height: app.screen.height / 2 },
        starTexture: starTexture,
        animationType: 'twinkle',
        scaleRange: { min: 0.8, max: 2.0 },
        baseColor: 0xffffff,
        blendMode: 'normal',
        alphaAnimation: {
            enabled: true,
            speed: [1, 5.8],
            range: [0.3, 1.0],
            phase: 'random'
        },
        scaleAnimation: {
            enabled: true,
            speed: [1, 5.8],
            range: [0.6+0.75, 1.4+0.75
            ],
            phase: 'random'
        },
        colorAnimation: {
            enabled: false
        },
        drift: {
            enabled: false
        }
    });
    starEmitter.start();

    // Moon Layer
    const moonTexture = PIXI.Assets.get('scenic_moon');
    moonTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const moonLayer = createSpriteLayer(moonTexture, {
        tile: false,
        scale: 5,
        position: [100, 300]
    });

    // Add light to moon layer
    const moonLightTexture = PIXI.Assets.get('scenic_light');
    moonLightTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const moonLight = new PIXI.Sprite(moonLightTexture);
    moonLight.anchor.set(0.5);
    moonLight.scale.set(1.5);
    moonLight.alpha = 0.5;
    moonLight.blendMode = "add";
    moonLight.position.set(190, 375);
    moonLayer.container.addChild(moonLight);

    // Mountains layer
    const mountainsTexture = PIXI.Assets.get('scenic_mountains');
    mountainsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const mountainsLayer = createSpriteLayer(mountainsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 0]
    });

    // Lake layer
    const lakeTexture = PIXI.Assets.get('scenic_lake');
    lakeTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const lakeLayer = createSpriteLayer(lakeTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 175]
    });

    // City Near Layers
    const cityNearTexture = PIXI.Assets.get('scenic_cityNear');
    cityNearTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const cityNearLayer = createSpriteLayer(cityNearTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 150]
    });
    cityNearLayer.container.filters = [dayLightFilter];

    const cityNearWindowsTexture = PIXI.Assets.get('scenic_cityNearWindows');
    cityNearWindowsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const cityNearWindowsLayer = createSpriteLayer(cityNearWindowsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 150]
    });

    // Create a new container for the cityNear and cityNearWindows layers
    const cityNearFull = new PIXI.Container();
    cityNearFull.addChild(cityNearLayer.container);
    cityNearFull.addChild(cityNearWindowsLayer.container);

    // City Front Layers
    const cityFrontTexture = PIXI.Assets.get('scenic_cityFront');
    cityFrontTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const cityFrontLayer = createSpriteLayer(cityFrontTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 150]
    });
    cityFrontLayer.container.filters = [dayLightFilter];

    const cityFrontWindowsTexture = PIXI.Assets.get('scenic_cityFrontWindows');
    cityFrontWindowsTexture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST;
    const cityFrontWindowsLayer = createSpriteLayer(cityFrontWindowsTexture, {
        tile: true,
        tileWidth: 1920,
        tileHeight: 1080,
        scale: 1,
        position: [0, 150]
    });

    const cityFrontFull = new PIXI.Container();
    cityFrontFull.addChild(cityFrontLayer.container);
    cityFrontFull.addChild(cityFrontWindowsLayer.container);

    // City Light
    const cityLightTexture = PIXI.Assets.get('scenic_spotlight');
    const cityLightLayer = createSpriteLayer(cityLightTexture, {
        scale: 8,
        position: [0, 0],
        tint: 0x8cefb6,
    });
    cityLightLayer.container.filters = [lightBloomFilter];

    // Apply filters to windows and stars
    cityNearWindowsLayer.container.filters = [windowBloomFilter];
    cityFrontWindowsLayer.container.filters = [windowBloomFilter];
    starEmitter.container.filters = [starBloomFilter];

    // Apply dayLightFilter to other layers
    skyLayer.container.filters = [dayLightFilter];
    mountainsLayer.container.filters = [dayLightFilter];
    lakeLayer.container.filters = [dayLightFilter];

    // Time constrained components
    // ---------------------------
    makeTimeConstrained(starEmitter, 0.5, 1.0, getTime, app, 0.8, 0.8, 0.1);
    makeTimeConstrained(moonLayer, 0.6, 1.0, getTime, app, 0.5, 1.0, 0.1);
    makeTimeConstrained(cityNearWindowsLayer, 0.75, 1.0, getTime, app, 1.0, 0.8, 0.0);
    makeTimeConstrained(cityFrontWindowsLayer, 0.75, 1.0, getTime, app, 1.0, 0.8, 0.0);
    makeTimeConstrained(cityLightLayer, 0.75, 1.0, getTime, app, 1.0, 0.8, 0.0);

    // Apply parallax to layers
    // ------------------------
    makeLayerParallax(skyLayer, { speed: 1.0 * scroll_speed, app });
    makeLayerParallax(starEmitter, { speed: 1.0 * scroll_speed, app });
    makeLayerParallax(moonLayer, { speed: -0.3 * scroll_speed, app });
    makeLayerParallax(mountainsLayer, { speed: 2.0 * scroll_speed, app });
    makeLayerParallax(cityNearFull, { speed: 4.0 * scroll_speed, app });
    makeLayerParallax(cityFrontFull, { speed: 5.0 * scroll_speed, app });
    makeLayerParallax(lakeLayer, { speed: 6.0 * scroll_speed, app });

    // Add containers to stage in order
    rootContainer.addChild(skyLayer.container);
    rootContainer.addChild(starEmitter.container);
    rootContainer.addChild(moonLayer.container);
    rootContainer.addChild(mountainsLayer.container);
    rootContainer.addChild(cityLightLayer.container);
    rootContainer.addChild(cityNearFull);
    rootContainer.addChild(cityFrontFull);
    rootContainer.addChild(lakeLayer.container);

    // Play ambient sound
    const ambience = PIXI.sound.Sound.from(PIXI.Assets.get('scenic_ambience'));
    ambience.loop = true;
    ambience.volume = 0.2;
    ambience.play();

    return {container: rootContainer};

}

if (window.ScenicCityMain) {
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

    const options = {};
    const urlParams = new URLSearchParams(window.location.search);
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
      }
    }

    const city = await createScenicCity(app, options);
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