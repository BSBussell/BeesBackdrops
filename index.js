import { ParticleEmitter } from './src/components/ParticleEmitter.js';


// Create the application helper and add its render target to the page
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

// Enable pixel rounding and crisp pixel art rendering
app.view.style.imageRendering = 'pixelated';

document.getElementById('pixi-container').appendChild(app.canvas);

// Resize the canvas when the window resizes
window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
});

// Create a hard orb texture
const orbCanvas = document.createElement('canvas');
orbCanvas.width = 512;
orbCanvas.height = 512;
const orbCtx = orbCanvas.getContext('2d');

const orbGradient = orbCtx.createRadialGradient(32, 32, 0, 32, 32, 32);
orbGradient.addColorStop(0, 'rgba(255, 248, 200, 1)');
orbGradient.addColorStop(0.5, 'rgba(255, 235, 150, 0.6)');
orbGradient.addColorStop(1, 'rgba(255, 220, 100, 0)');

orbCtx.fillStyle = orbGradient;
orbCtx.beginPath();
orbCtx.arc(32, 32, 32, 0, Math.PI * 2);
orbCtx.fill();

const orbTexture = PIXI.Texture.from(orbCanvas);

function createOrbTexture(colorStops) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);

    colorStops.forEach(([stop, color]) => gradient.addColorStop(stop, color));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(32, 32, 32, 0, Math.PI * 2);
    ctx.fill();

    return PIXI.Texture.from(canvas);
}

const yellowOrbTexture = createOrbTexture([
    [0.0, 'rgba(248, 200, 104, 1)'],
    [0.3, 'rgba(248, 200, 104, 1)'],
    [0.6, 'rgba(248, 200, 104, 1)'],
    [1.0, 'rgba(248, 200, 104, 1)'],
]);

const orangeOrbTexture = createOrbTexture([
    [0.0, 'rgba(255, 142, 101, 1)'],
    [0.3, 'rgba(255, 142, 101, 1)'],
    [0.6, 'rgba(255, 142, 101, 1)'],
    [1.0, 'rgba(255, 142, 101, 1)'],
]);

const blueOrbTexture = createOrbTexture([
    [0.0, 'rgba(101, 211, 255, 1)'],
    [0.3, 'rgba(101, 211, 255, 1)'],
    [0.6, 'rgba(101, 211, 255, 1)'],
    [1.0, 'rgba(101, 211, 255, 1)'],
]);

// Create a background layer emitter (smaller, slower)
const ambientBackEmitter = new ParticleEmitter(app, {
    explosiveness: 0.0,
    maxParticles: 40,
    lifetime: [15, 25],
    spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height } },
    initialVelocity: { speed: [2, 8], angle: [0, Math.PI * 2] },
    acceleration: { x: 0, y: 0 },
    damping: 0.0,
    texture: blueOrbTexture,
    scale: {
        0.0: 0.1,
        0.5: 0.3,
        1.0: 0.1,
    },
    alpha: {
        0.0: 0,
        0.2: 0.1,
        0.5: 0.3,
        0.8: 0.1,
        1.0: 0,
    },
    blendMode: 'normal',
});
ambientBackEmitter.start();


// Create a midground layer emitter (existing ambientEmitter, slightly updated for clarity)
const ambientEmitter = new ParticleEmitter(app, {
    explosiveness: 0.0,
    maxParticles: 60,
    lifetime: [10, 20],
    spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height } },
    initialVelocity: { speed: [5, 20], angle: [0, Math.PI * 2] },
    acceleration: { x: 0, y: 0 },
    damping: 0.0,
    texture: orangeOrbTexture,
    scale: {
        0.0: 0.2,
        0.5: 0.5,
        1.0: 0.2,
    },
    alpha: {
        0.0: 0,
        0.2: 0.15,
        0.5: 1,
        0.8: 0.15,
        1.0: 0,
    },
    blendMode: 'normal',
});
ambientEmitter.start();


// Create a foreground layer emitter (bigger, brighter)
const ambientFrontEmitter = new ParticleEmitter(app, {
    explosiveness: 0.0,
    maxParticles: 25,
    lifetime: [6, 12],
    spawnArea: { type: 'rect', size: { x: app.screen.width, y: app.screen.height } },
    initialVelocity: { speed: [10, 30], angle: [0, Math.PI * 2] },
    acceleration: { x: 0, y: 0 },
    damping: 0.0,
    texture: yellowOrbTexture,
    scale: {
        0.0: 0.6,
        0.5: 1,
        1.0: 0.6,
    },
    alpha: {
        0.0: 0,
        0.2: 0.3,
        0.5: 1,
        0.8: 0.3,
        1.0: 0,
    },
    blendMode: 'add',
});
ambientFrontEmitter.start();


// Create a full-screen white-tinted layer
const whiteTintLayer = new PIXI.Graphics();
whiteTintLayer.beginFill(0xf6f6f6, 0.2); // White color with 10% opacity
whiteTintLayer.drawRect(0, 0, app.screen.width, app.screen.height);
whiteTintLayer.endFill();
whiteTintLayer.zIndex = -1; // Ensure it stays in the background


// Create a blur filter for the entire scene
const blurFilter = new PIXI.filters.BackdropBlurFilter({
    blur: 8
});



whiteTintLayer.filters = [blurFilter];

app.stage.addChildAt(whiteTintLayer, 0);

app.stage.addChildAt(ambientBackEmitter.container, 0);
app.stage.addChild(ambientEmitter.container);
app.stage.addChild(ambientFrontEmitter.container);


app.stage.filters = [blurFilter];
