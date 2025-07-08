import { ParticleEmitter } from '../components/ParticleEmitter.js';

export async function createDustyBackground(app, options = {}) {
    // Core parameters
    const opacity = options.opacity || 0.8;
    const density = options.density || 50; // Direct numeric value (particles count)
    const drift_speed = options.drift_speed || 0.5;
    const particle_size = options.particle_size || 1.0; // Direct numeric scale multiplier
    
    // Ambient floating parameters
    const float_direction = options.float_direction || 'up'; // 'up', 'down', 'random', 'circular'
    const wind_strength = options.wind_strength || 0.3;
    const turbulence = options.turbulence || 0.4;
    const particle_lifetime = options.particle_lifetime || 'long'; // 'short', 'medium', 'long', 'eternal'
    
    // Visual parameters
    const particle_color = options.particle_color || '#FFFFFF'; // Default white
    const blend_mode = options.blend_mode || 'normal'; // 'normal', 'add', 'multiply', 'overlay'
    const shape_distortion = options.shape_distortion || 0.0; // 0.0 = circle, 1.0 = jagged
    const texture_resolution = options.texture_resolution || 1.0; // 0.25 to 2.0
    
    // Particle appearance
    const softness = options.softness || 0.7; // 0.0 sharp edges, 1.0 very soft
    const glow_size = options.glow_size != null ? options.glow_size : 0.5; // Glow radius multiplier
    const glow_intensity = options.glow_intensity != null ? options.glow_intensity : 0.5; // 0.0 = no glow, 1.0 = full brightness
    
    console.log('Glow Intensity:', glow_intensity);
    console.log('Option:', options.glow_intensity);

    // Spawn parameters
    const spawn_area = options.spawn_area || 'full_screen'; // 'full_screen', 'edges', 'center', 'bottom_up'
    const spawn_burst = options.spawn_burst || 0.1; // 0.0 to 1.0 initial explosion
    
    // Motion parameters
    const drift_chaos = options.drift_chaos || 0.3; // 0.0 to 1.0 randomness
    const gravity_strength = options.gravity_strength || 0.1; // -1.0 to 1.0 (negative = anti-gravity)
    const rotation_speed = options.rotation_speed || 0.5; // 0.0 to 2.0

    // Set transparent background for iframe use
    app.renderer.backgroundColor = 0x000000;
    app.renderer.backgroundAlpha = 0;

    const rootContainer = new PIXI.Container();

    // Create dust texture without glow (glow handled by particle light system)
    const dustTexture = createDustTexture(
        shape_distortion,
        particle_color,
        texture_resolution,
        softness
    );

    // Create glow texture for particle light system (only if needed)
    const glowTexture = glow_intensity > 0 ? createGlowTexture(
        glow_size,
        particle_color,
        texture_resolution
    ) : null;

    // Density settings
    // Use density directly as particle count and calculate emitRate
    const particleCount = density;
    const emitRate = density / 50; // Base rate of 1.0 for 50 particles

    // Use particle_size directly as scale multiplier
    const baseSize = particle_size;
    const sizeRange = [baseSize * 0.5, baseSize * 1.5]; // Vary size around the base

    // Lifetime settings
    const lifetimeSettings = {
        short: [3, 8],
        medium: [8, 15],
        long: [15, 30],
        eternal: [30, 60]
    };

    const currentLifetime = lifetimeSettings[particle_lifetime] || lifetimeSettings.long;

    // Convert hex color to PIXI color format
    const baseColor = parseInt(particle_color.replace('#', ''), 16);
    
    // Create color variations for particle lifecycle
    const particleColors = {
        0.0: baseColor,
        0.3: baseColor,
        0.6: baseColor,
        1.0: baseColor
    };

    // Spawn area settings
    const spawnAreas = {
        full_screen: { 
            type: 'rect', 
            size: { x: app.screen.width, y: app.screen.height },
            offset: { x: 0, y: 0 }
        },
        edges: { 
            type: 'rect', 
            size: { x: app.screen.width * 1.2, y: app.screen.height * 1.2 },
            offset: { x: -app.screen.width * 0.1, y: -app.screen.height * 0.1 }
        },
        center: { 
            type: 'circle', 
            radius: Math.min(app.screen.width, app.screen.height) * 0.3,
            offset: { x: app.screen.width * 0.5, y: app.screen.height * 0.5 }
        },
        bottom_up: { 
            type: 'rect', 
            size: { x: app.screen.width, y: app.screen.height * 0.2 },
            offset: { x: 0, y: app.screen.height * 0.8 }
        }
    };

    const currentSpawnArea = spawnAreas[spawn_area] || spawnAreas.full_screen;

    // Direction settings
    const getDirectionSettings = (direction) => {
        switch (direction) {
            case 'up':
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 1.25, Math.PI * 1.75], // Upward (270° ± 45°)
                    acceleration: { x: 0, y: -gravity_strength * 10 }
                };
            case 'down':
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 0.25, Math.PI * 0.75], // Downward (90° ± 45°)
                    acceleration: { x: 0, y: gravity_strength * 10 }
                };
            case 'random':
                return {
                    speed: [3 * drift_speed, 12 * drift_speed],
                    angle: [0, Math.PI * 2], // All directions
                    acceleration: { 
                        x: wind_strength > 0 ? (Math.random() - 0.5) * wind_strength * 20 : 0, 
                        y: gravity_strength * 5 
                    }
                };
            case 'circular':
                return {
                    speed: [8 * drift_speed, 18 * drift_speed],
                    angle: [0, Math.PI * 2], // All directions
                    acceleration: { x: 0, y: 0 },
                    circular: true // Special flag for circular motion
                };
            default:
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 1.25, Math.PI * 1.75], // Default to upward
                    acceleration: { x: 0, y: -gravity_strength * 10 }
                };
        }
    };

    // Create multiple dust emitters for variety
    const dustEmitters = [];

    // Main ambient dust emitter
    const mainDustEmitter = new ParticleEmitter(app, {
        explosiveness: spawn_burst,
        maxParticles: particleCount,
        emitRate: emitRate,
        lifetime: currentLifetime,
        
        spawnArea: currentSpawnArea,
        
        initialVelocity: getDirectionSettings(float_direction),
        
        // Turbulent, chaotic movement
        acceleration: {
            x: wind_strength > 0 ? (Math.random() - 0.5) * wind_strength * 20 * turbulence : 0,
            y: getDirectionSettings(float_direction).acceleration.y + (turbulence > 0 ? (Math.random() - 0.5) * turbulence * 15 : 0)
        },
        
        // Ambient floating behavior
        damping: drift_chaos > 0 ? 0.005 + (drift_chaos * 0.02) : 0.005,
        
        // Size variation for depth
        scale: {
            0.0: sizeRange[0] * (0.8 + Math.random() * 0.4),
            0.5: sizeRange[0] * (1.0 + Math.random() * 0.3),
            1.0: sizeRange[0] * (0.3 + Math.random() * 0.2)
        },
        
        color: particleColors,
        
        // Organic fade pattern
        alpha: {
            0.0: 0.0,
            0.1: opacity * (0.2 + Math.random() * 0.3),
            0.5: opacity * (0.4 + Math.random() * 0.4),
            0.9: opacity * (0.3 + Math.random() * 0.2),
            1.0: 0.0
        },
        
        rotationSpeed: [
            -rotation_speed * 0.04, 
            rotation_speed * 0.04
        ],
        
        texture: dustTexture,
        blendMode: blend_mode,
        
        // Glow light system (only if glow_intensity > 0)
        ...(glow_intensity > 0 && {
            light: {
                texture: glowTexture,
                lightScaleRamp: {
                    0.0: glow_size * 2.0,
                    0.5: glow_size * 2.5,
                    1.0: glow_size * 1.5
                },
                lightHue: {
                    0.0: baseColor,
                    1.0: baseColor
                },
                lightEnergy: {
                    0.0: 0.0,
                    0.1: glow_intensity * 0.6,
                    0.5: glow_intensity * 0.8,
                    0.9: glow_intensity * 0.4,
                    1.0: 0.0
                }
            }
        })
    });

    // Secondary wispy dust layer
    const wispyDustEmitter = new ParticleEmitter(app, {
        explosiveness: spawn_burst * 0.5,
        maxParticles: Math.floor(particleCount * 0.7),
        emitRate: emitRate * 0.6,
        lifetime: [currentLifetime[0] * 1.5, currentLifetime[1] * 1.5],
        
        spawnArea: currentSpawnArea,
        
        initialVelocity: {
            speed: [
                getDirectionSettings(float_direction).speed[0] * 0.5,
                getDirectionSettings(float_direction).speed[1] * 0.5
            ],
            angle: [
                getDirectionSettings(float_direction).angle[0] - Math.PI * 0.3,
                getDirectionSettings(float_direction).angle[1] + Math.PI * 0.3
            ]
        },
        
        acceleration: {
            x: wind_strength > 0 ? (Math.random() - 0.5) * wind_strength * 8 * turbulence : 0,
            y: getDirectionSettings(float_direction).acceleration.y * 0.3
        },
        
        damping: drift_chaos > 0 ? 0.002 + (drift_chaos * 0.01) : 0.002,
        
        scale: {
            0.0: sizeRange[0] * 0.3,
            0.7: sizeRange[0] * 0.6,
            1.0: sizeRange[0] * 0.1
        },
        
        color: particleColors,
        
        alpha: {
            0.0: 0.0,
            0.2: opacity * 0.2,
            0.8: opacity * 0.3,
            1.0: 0.0
        },
        
        rotationSpeed: [
            -rotation_speed * 0.02, 
            rotation_speed * 0.02
        ],
        
        texture: dustTexture,
        blendMode: blend_mode,
        
        // Softer glow for wispy particles (only if glow_intensity > 0)
        ...(glow_intensity > 0 && {
            light: {
                texture: glowTexture,
                lightScaleRamp: {
                    0.0: glow_size * 1.5,
                    0.5: glow_size * 2.0,
                    1.0: glow_size * 1.0
                },
                lightHue: {
                    0.0: baseColor,
                    1.0: baseColor
                },
                lightEnergy: {
                    0.0: 0.0,
                    0.2: glow_intensity * 0.3,
                    0.8: glow_intensity * 0.5,
                    1.0: 0.0
                }
            }
        })
    });

    // Chaotic drift emitter for extra atmosphere
    const chaoticDriftEmitter = new ParticleEmitter(app, {
        explosiveness: spawn_burst * 0.3,
        maxParticles: Math.floor(particleCount * 0.4),
        emitRate: emitRate * 0.4,
        lifetime: [currentLifetime[0] * 0.8, currentLifetime[1] * 1.2],
        
        spawnArea: currentSpawnArea,
        
        initialVelocity: {
            speed: [
                getDirectionSettings(float_direction).speed[0] * 1.5,
                getDirectionSettings(float_direction).speed[1] * 1.5
            ],
            angle: [0, Math.PI * 2] // Full chaos
        },
        
        acceleration: {
            x: wind_strength > 0 ? (Math.random() - 0.5) * wind_strength * 40 * turbulence : 0,
            y: wind_strength > 0 ? (Math.random() - 0.5) * wind_strength * 30 * turbulence : 0
        },
        
        damping: drift_chaos > 0 ? 0.01 + (drift_chaos * 0.03) : 0.01,
        
        scale: {
            0.0: sizeRange[0] * 1.5,
            0.3: sizeRange[0] * 1.8,
            1.0: sizeRange[0] * 0.4
        },
        
        color: particleColors,
        
        alpha: {
            0.0: 0.0,
            0.1: opacity * 0.6,
            0.6: opacity * 0.4,
            1.0: 0.0
        },
        
        rotationSpeed: [
            -rotation_speed * 0.06, 
            rotation_speed * 0.06
        ],
        
        texture: dustTexture,
        blendMode: blend_mode,
        
        // Stronger glow for chaotic particles (only if glow_intensity > 0)
        ...(glow_intensity > 0 && {
            light: {
                texture: glowTexture,
                lightScaleRamp: {
                    0.0: glow_size * 2.5,
                    0.3: glow_size * 3.0,
                    1.0: glow_size * 1.0
                },
                lightHue: {
                    0.0: baseColor,
                    1.0: baseColor
                },
                lightEnergy: {
                    0.0: 0.0,
                    0.1: glow_intensity * 0.7,
                    0.6: glow_intensity * 0.6,
                    1.0: 0.0
                }
            }
        })
    });

    dustEmitters.push(mainDustEmitter, wispyDustEmitter, chaoticDriftEmitter);

    // Add all emitters to scene
    dustEmitters.forEach(emitter => {
        rootContainer.addChild(emitter.container);
        emitter.start(); // Start the emitter
    });

    app.stage.addChild(rootContainer);
    return rootContainer;
}

// Create a dust particle texture without glow (glow handled by light system)
function createDustTexture(
    distortion = 0.0,
    hexColor = '#FFFFFF',
    resolution = 1.0,
    softness = 0.7
) {
    const canvas = document.createElement('canvas');
    
    // Scale canvas size based on resolution (32px base, 0.25x to 2x)
    const baseSize = 32;
    const scaledSize = Math.max(8, Math.floor(baseSize * 4 * resolution)); // 8px to 256px
    canvas.width = scaledSize;
    canvas.height = scaledSize;
    
    const ctx = canvas.getContext('2d');
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    // Create a soft, irregular dust mote (scaled based on resolution)
    const centerX = scaledSize / 2;
    const centerY = scaledSize / 2;
    const baseRadius = scaledSize / 4;
    
    // Create main solid dust particle
    const mainGradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
    
    // Calculate gradient stops based on softness
    // softness 0.0 = sharp/solid transitions, softness 1.0 = very soft/gradual
    const softnessInverse = 1.0 - softness;
    const solidCore = Math.min(0.8, softnessInverse * 0.9); // More solid core for dust
    const fadeStart = Math.max(solidCore, softnessInverse * 0.95); // Quick fade
    
    // Add texture variation for realistic dust appearance
    const textureNoise = Math.random() * 0.2 + 0.8;
    const coreAlpha = 0.9 * textureNoise;
    const fadeAlpha = 0.3 * textureNoise;
    
    mainGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${coreAlpha})`);
    mainGradient.addColorStop(solidCore, `rgba(${r}, ${g}, ${b}, ${coreAlpha * 0.9})`);
    mainGradient.addColorStop(fadeStart, `rgba(${r}, ${g}, ${b}, ${fadeAlpha})`);
    mainGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = mainGradient;
    ctx.beginPath();
    
    if (distortion === 0.0) {
        // Perfect circle for main particle
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    } else {
        // Organic distorted shape for main particle
        const numPoints = 8 + Math.floor(distortion * 12);
        const angleStep = (Math.PI * 2) / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep;
            const radiusVariation = 1.0 + (Math.random() - 0.5) * distortion * 0.6;
            const radius = baseRadius * radiusVariation;
            const noisyAngle = angle + (Math.random() - 0.5) * distortion * 0.2;
            
            const x = centerX + Math.cos(noisyAngle) * radius;
            const y = centerY + Math.sin(noisyAngle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                if (distortion > 0.3) {
                    // Smooth curves for organic feel
                    const prevAngle = (i - 1) * angleStep;
                    const prevRadius = baseRadius * (1.0 + (Math.random() - 0.5) * distortion * 0.6);
                    const prevX = centerX + Math.cos(prevAngle) * prevRadius;
                    const prevY = centerY + Math.sin(prevAngle) * prevRadius;
                    
                    const controlX = (prevX + x) / 2 + (Math.random() - 0.5) * distortion * 3;
                    const controlY = (prevY + y) / 2 + (Math.random() - 0.5) * distortion * 3;
                    
                    ctx.quadraticCurveTo(controlX, controlY, x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.closePath();
    }
    
    ctx.fill();
    
    // Add random speckles and texture for more realistic ash/dust appearance
    if (distortion > 0.2) {
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
        const numSpeckles = Math.floor(distortion * 8);
        for (let i = 0; i < numSpeckles; i++) {
            const speckleX = centerX + (Math.random() - 0.5) * baseRadius * 1.5;
            const speckleY = centerY + (Math.random() - 0.5) * baseRadius * 1.5;
            const speckleSize = Math.random() * 2 + 0.5;
            
            ctx.beginPath();
            ctx.arc(speckleX, speckleY, speckleSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Add some irregular texture patches
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
        const numPatches = Math.floor(distortion * 4);
        for (let i = 0; i < numPatches; i++) {
            const patchX = centerX + (Math.random() - 0.5) * baseRadius;
            const patchY = centerY + (Math.random() - 0.5) * baseRadius;
            const patchSize = Math.random() * 4 + 2;
            
            ctx.beginPath();
            ctx.ellipse(patchX, patchY, patchSize, patchSize * 0.6, Math.random() * Math.PI, 0, Math.PI * 2);
            ctx.fill();
        }
    }
    
    return PIXI.Texture.from(canvas);
}

// Create a soft glow texture for particle light system
function createGlowTexture(
    glowSize = 0.5,
    hexColor = '#FFFFFF',
    resolution = 1.0
) {
    const canvas = document.createElement('canvas');
    
    // Scale canvas size based on resolution and glow size
    const baseSize = 64; // Larger base for glow
    const scaledSize = Math.max(16, Math.floor(baseSize * 2 * resolution * (1 + glowSize))); // 16px to 512px
    canvas.width = scaledSize;
    canvas.height = scaledSize;
    
    const ctx = canvas.getContext('2d');
    
    // Enable high-quality rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Convert hex to RGB
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    
    const centerX = scaledSize / 2;
    const centerY = scaledSize / 2;
    const glowRadius = scaledSize / 2;
    
    // Create soft radial gradient for glow
    const glowGradient = ctx.createRadialGradient(
        centerX, centerY, 0,
        centerX, centerY, glowRadius
    );
    
    // Very soft glow with multiple stops for smooth falloff
    glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, 0.8)`);
    glowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, 0.4)`);
    glowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, 0.2)`);
    glowGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, 0.1)`);
    glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);
    
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    
    return PIXI.Texture.from(canvas);
}

// Auto-start when loaded as main
if (window.DustyMain) {
    (async () => {
        const app = new PIXI.Application();
        
        await app.init({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x000000,
            backgroundAlpha: 0,
            antialias: true,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true
        });

        document.body.appendChild(app.canvas);

        // Parse URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hasParams = urlParams.toString().length > 0;
        
        const options = {
            // Core parameters
            opacity: parseFloat(urlParams.get('opacity')) || 0.8,
            density: parseFloat(urlParams.get('density')) || 50,
            drift_speed: parseFloat(urlParams.get('drift_speed')) || 0.5,
            particle_size: parseFloat(urlParams.get('particle_size')) || 1.0,
            
            // Ambient floating parameters
            float_direction: urlParams.get('float_direction') || 'up',
            wind_strength: parseFloat(urlParams.get('wind_strength')) || 0.3,
            turbulence: parseFloat(urlParams.get('turbulence')) || 0.4,
            particle_lifetime: urlParams.get('particle_lifetime') || 'long',
            
            // Visual parameters
            particle_color: urlParams.get('particle_color') || (hasParams ? '#8B7355' : '#FFFFFF'),
            blend_mode: urlParams.get('blend_mode') || 'normal',
            // Glow intensity: use default 0.5 when not specified
            glow_intensity: urlParams.get('glow_intensity') != null ? parseFloat(urlParams.get('glow_intensity')) : 0.5,
            shape_distortion: parseFloat(urlParams.get('shape_distortion')) || 0.0,
            texture_resolution: parseFloat(urlParams.get('texture_resolution')) || 1.0,
            softness: parseFloat(urlParams.get('softness')) || 0.7,
            glow_size: parseFloat(urlParams.get('glow_size')) || 0.5,
            
            // Spawn parameters
            spawn_area: urlParams.get('spawn_area') || 'full_screen',
            spawn_burst: parseFloat(urlParams.get('spawn_burst')) || 0.1,
            
            // Motion parameters
            drift_chaos: parseFloat(urlParams.get('drift_chaos')) || 0.3,
            gravity_strength: parseFloat(urlParams.get('gravity_strength')) || 0.1,
            rotation_speed: parseFloat(urlParams.get('rotation_speed')) || 0.5
        };

        let currentScene = null;
        let testBackground = null;
        
        // Create background for testing (not included in generated links)
        const createTestBackground = (color = 0x000000) => {
            if (testBackground) {
                app.stage.removeChild(testBackground);
            }
            testBackground = new PIXI.Graphics();
            testBackground.beginFill(color);
            testBackground.drawRect(0, 0, app.screen.width, app.screen.height);
            testBackground.endFill();
            app.stage.addChildAt(testBackground, 0); // Add behind particles
        };
        
        // Create scene
        const recreateScene = async () => {
            if (currentScene) {
                app.stage.removeChild(currentScene);
            }
            currentScene = await createDustyBackground(app, options);
        };

        // Create default black background for no-params mode
        if (!hasParams) {
            createTestBackground(0x000000);
        }

        await recreateScene();

        // Show parameter menu if no URL params
        if (!hasParams) {
            createParameterMenu(options, recreateScene, createTestBackground);
        }

        // Handle window resize
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
        });
    })();
}

// Create interactive parameter menu
function createParameterMenu(options, recreateScene, createTestBackground) {
    const menuContainer = document.createElement('div');
    menuContainer.className = 'dust-parameter-menu';
    
    // Test background color (not included in generated links)
    let testBgColor = 0x000000;
    
    // Helper functions for slider-based enums
    const getLifetimeFromSlider = (value) => {
        const lifetimes = ['short', 'medium', 'long', 'eternal'];
        return lifetimes[Math.floor(value)];
    };
    
    const getLifetimeSliderValue = (lifetime) => {
        const lifetimes = ['short', 'medium', 'long', 'eternal'];
        return lifetimes.indexOf(lifetime);
    };
    
    const getSpawnFromSlider = (value) => {
        const spawns = ['full_screen', 'edges', 'center', 'bottom_up'];
        return spawns[Math.floor(value)];
    };
    
    const getSpawnSliderValue = (spawn) => {
        const spawns = ['full_screen', 'edges', 'center', 'bottom_up'];
        return spawns.indexOf(spawn);
    };
    
    const getDirectionFromSlider = (value) => {
        const directions = ['up', 'down', 'random', 'circular'];
        return directions[Math.floor(value)];
    };
    
    const getDirectionSliderValue = (direction) => {
        const directions = ['up', 'down', 'random', 'circular'];
        return directions.indexOf(direction);
    };
    
    const getBlendFromSlider = (value) => {
        const blends = ['normal', 'add', 'multiply', 'overlay'];
        return blends[Math.floor(value)];
    };
    
    const getBlendSliderValue = (blend) => {
        const blends = ['normal', 'add', 'multiply', 'overlay'];
        return blends.indexOf(blend);
    };
    
    // Presets
    const presets = {
        'Stranger Things Upside Down': {
            opacity: 0.7,
            density: 180,
            drift_speed: 0.3,
            particle_size: 0.8,
            float_direction: 'random',
            wind_strength: 0.4,
            turbulence: 0.8,
            particle_lifetime: 'long',
            particle_color: '#4A4A4A',
            blend_mode: 'normal',
            spawn_area: 'full_screen',
            spawn_burst: 0.2,
            drift_chaos: 0.7,
            gravity_strength: 0.05,
            rotation_speed: 0.2,
            shape_distortion: 0.6,
            texture_resolution: 1.2,
            softness: 0.3,
            glow_intensity: 0.5,
            glow_size: 0.4
        },
        'Spore Storm': {
            opacity: 0.8,
            density: 200,
            drift_speed: 0.8,
            particle_size: 0.5,
            float_direction: 'random',
            wind_strength: 0.8,
            turbulence: 0.9,
            particle_lifetime: 'medium',
            particle_color: '#556B2F',
            blend_mode: 'add',
            spawn_area: 'edges',
            spawn_burst: 0.7,
            drift_chaos: 0.8,
            gravity_strength: 0.1,
            rotation_speed: 1.2,
            shape_distortion: 0.8,
            texture_resolution: 1.5,
            softness: 0.4,
            glow_intensity: 0.5,
            glow_size: 0.8
        },
        'Ethereal Decay': {
            opacity: 0.6,
            density: 50,
            drift_speed: 0.2,
            particle_size: 2.0,
            float_direction: 'circular',
            wind_strength: 0.1,
            turbulence: 0.2,
            particle_lifetime: 'eternal',
            particle_color: '#6A5ACD',
            blend_mode: 'overlay',
            spawn_area: 'center',
            spawn_burst: 0.1,
            drift_chaos: 0.1,
            gravity_strength: 0.0,
            rotation_speed: 0.8,
            shape_distortion: 0.2,
            texture_resolution: 2.0,
            softness: 0.9,
            glow_intensity: 0.5,
            glow_size: 0.7
        },
        'Gentle Drift': {
            opacity: 0.5,
            density: 25,
            drift_speed: 0.3,
            particle_size: 1.5,
            float_direction: 'up',
            wind_strength: 0.2,
            turbulence: 0.3,
            particle_lifetime: 'long',
            particle_color: '#FFFFFF',
            blend_mode: 'normal',
            spawn_area: 'bottom_up',
            spawn_burst: 0.0,
            drift_chaos: 0.2,
            gravity_strength: -0.1,
            rotation_speed: 0.4,
            shape_distortion: 0.0,
            texture_resolution: 0.75,
            softness: 0.6,
            glow_intensity: 0.5,
            glow_size: 0.3
        }
    };

    menuContainer.innerHTML = `
        <style>
            .dust-parameter-menu {
                position: fixed;
                top: 20px;
                right: 20px;
                background: rgba(20, 20, 30, 0.95);
                border: 2px solid #444;
                
                

                padding: 20px;
                color: #fff;
                font-family: 'Inter', sans-serif;
                max-width: 350px;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 8px 32px rgba(0,0,0,0.4);
            }
            .menu-header {
                text-align: center;
                margin-bottom: 20px;
                font-size: 18px;
                font-weight: 600;
                color: #f0f0f0;
            }
            .preset-buttons {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 8px;
                margin-bottom: 20px;
            }
            .preset-btn {
                padding: 8px 12px;
                background: #4a4a5a;
                border: 1px solid #666;
                border-radius: 6px;
                color: #fff;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.2s;
                text-align: center;
            }
            .preset-btn:hover {
                background: #5a5a6a;
                border-color: #888;
            }
            .param-group {
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 6px;
            }
            .param-group h4 {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 14px;
            }
            .param-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 8px;
            }
            .param-label {
                font-size: 12px;
                color: #bbb;
                flex: 1;
            }
            .param-control {
                flex: 1;
                margin-left: 10px;
            }
            .param-control input, .param-control select {
                width: 100%;
                padding: 4px 8px;
                border: 1px solid #555;
                border-radius: 4px;
                background: #333;
                color: #fff;
                font-size: 12px;
            }
            .param-control input[type="range"] {
                padding: 0;
            }
            .param-control input[type="color"] {
                width: 60px;
                height: 30px;
                padding: 0;
                border-radius: 4px;
                cursor: pointer;
            }
            .slider-label {
                font-size: 10px;
                color: #999;
                margin-top: 2px;
            }
            .generate-link {
                width: 100%;
                padding: 12px;
                background: #6a5acd;
                border: none;
                border-radius: 6px;
                color: #fff;
                font-weight: 600;
                cursor: pointer;
                margin-top: 15px;
                transition: background 0.2s;
            }
            .generate-link:hover {
                background: #7a6add;
            }
            .generated-link {
                margin-top: 10px;
                padding: 8px;
                background: #2a2a3a;
                border: 1px solid #555;
                border-radius: 4px;
                font-size: 11px;
                word-break: break-all;
                color: #ccc;
            }
            .bg-control {
                background: rgba(255,255,255,0.1);
                padding: 10px;
                border-radius: 6px;
                margin-bottom: 15px;
            }
            .bg-control h4 {
                margin: 0 0 10px 0;
                color: #ccc;
                font-size: 14px;
            }
        </style>
        
        <div class="menu-header">Dust Thing-y</div>
        
        <div class="preset-buttons">
            ${Object.keys(presets).map(name => 
                `<button class="preset-btn" onclick="applyPreset('${name}')">${name}</button>`
            ).join('')}
        </div>
        
        <div class="bg-control">
            <h4>Test Background (Preview Only)</h4>
            <div class="param-row">
                <span class="param-label">Color</span>
                <div class="param-control">
                    <input type="color" value="#000000" onchange="updateBackground(this.value)">
                </div>
            </div>
        </div>
        
        <div class="param-group">
            <h4>Core Parameters</h4>
            <div class="param-row">
                <span class="param-label" title="Overall opacity/transparency of the dust overlay">Opacity</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.opacity}" 
                           onchange="updateParam('opacity', parseFloat(this.value))">
                    <div class="slider-label">${options.opacity}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Total number of dust particles on screen">Density (particles)</span>
                <div class="param-control">
                    <input type="range" min="5" max="500" step="5" value="${options.density}" 
                           onchange="updateParam('density', parseInt(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.density}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Base speed of particle movement - how fast they drift">Drift Speed</span>
                <div class="param-control">
                    <input type="range" min="0" max="2" step="0.1" value="${options.drift_speed}" 
                           onchange="updateParam('drift_speed', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.drift_speed}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Size of individual dust particles">Particle Size (scale)</span>
                <div class="param-control">
                    <input type="range" min="0.1" max="10" step="0.1" value="${options.particle_size}" 
                           onchange="updateParam('particle_size', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.particle_size}</div>
                </div>
            </div>
        </div>
        
        <div class="param-group">
            <h4>Movement & Physics</h4>
            <div class="param-row">
                <span class="param-label" title="Primary direction of particle movement: up, down, random, or circular spiral">Direction</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getDirectionSliderValue(options.float_direction)}" 
                           onchange="updateParam('float_direction', getDirectionFromSlider(this.value)); this.nextElementSibling.textContent = getDirectionFromSlider(this.value);">
                    <div class="slider-label">${options.float_direction}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Horizontal wind force affecting particle drift">Wind Strength</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.wind_strength}" 
                           onchange="updateParam('wind_strength', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.wind_strength}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Random motion variations - higher = more chaotic movement">Turbulence</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.turbulence}" 
                           onchange="updateParam('turbulence', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.turbulence}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Random velocity variations - adds unpredictability to particle paths">Drift Chaos</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.drift_chaos}" 
                           onchange="updateParam('drift_chaos', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.drift_chaos}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Gravity force: negative = particles float up, positive = sink down">Gravity</span>
                <div class="param-control">
                    <input type="range" min="-1" max="1" step="0.1" value="${options.gravity_strength}" 
                           onchange="updateParam('gravity_strength', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.gravity_strength}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="How fast particles rotate as they drift">Rotation Speed</span>
                <div class="param-control">
                    <input type="range" min="0" max="2" step="0.1" value="${options.rotation_speed}" 
                           onchange="updateParam('rotation_speed', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.rotation_speed}</div>
                </div>
            </div>
        </div>
        
        <div class="param-group">
            <h4>Visual & Spawn</h4>
            <div class="param-row">
                <span class="param-label">Particle Color</span>
                <div class="param-control">
                    <input type="color" value="${options.particle_color}" 
                           onchange="updateParam('particle_color', this.value);">
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="How particles combine with the background: normal, add (brighten), multiply (darken), overlay">Blend Mode</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getBlendSliderValue(options.blend_mode)}" 
                           onchange="updateParam('blend_mode', getBlendFromSlider(this.value)); this.nextElementSibling.textContent = getBlendFromSlider(this.value);">
                    <div class="slider-label">${options.blend_mode}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Shape variation: 0 = perfect circles, 1 = jagged organic shapes">Shape Distortion</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.shape_distortion}" 
                           onchange="updateParam('shape_distortion', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.shape_distortion}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Texture quality: lower = better performance, higher = sharper particles">Texture Resolution</span>
                <div class="param-control">
                    <input type="range" min="0.25" max="2" step="0.25" value="${options.texture_resolution}" 
                           onchange="updateParam('texture_resolution', parseFloat(this.value)); this.nextElementSibling.textContent = this.value + 'x';">
                    <div class="slider-label">${options.texture_resolution}x</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Gradient falloff control (0 = sharp/solid edges, 1 = very soft/gradual transitions)">Particle Softness</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.softness}" 
                           onchange="updateParam('softness', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.softness}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Size of glow behind particles (0 = no glow, 1 = large glow)">Glow Size</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.glow_size}" 
                           onchange="updateParam('glow_size', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.glow_size}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Brightness of glow behind particles (0 = no glow, 1 = full brightness)">Glow Intensity</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.glow_intensity}" 
                           onchange="updateParam('glow_intensity', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.glow_intensity}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="Where particles spawn: full screen, edges (slightly outside), center circle, or bottom area">Spawn Area</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getSpawnSliderValue(options.spawn_area)}" 
                           onchange="updateParam('spawn_area', getSpawnFromSlider(this.value)); this.nextElementSibling.textContent = getSpawnFromSlider(this.value);">
                    <div class="slider-label">${options.spawn_area}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="How concentrated the spawn timing is: 0 = steady flow, 1 = burst all at once">Spawn Burst</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.spawn_burst}" 
                           onchange="updateParam('spawn_burst', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.spawn_burst}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label" title="How long each particle lives: short (3-8s), medium (8-15s), long (15-30s), eternal (30-60s)">Lifetime</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getLifetimeSliderValue(options.particle_lifetime)}" 
                           onchange="updateParam('particle_lifetime', getLifetimeFromSlider(this.value)); this.nextElementSibling.textContent = getLifetimeFromSlider(this.value);">
                    <div class="slider-label">${options.particle_lifetime}</div>
                </div>
            </div>
        </div>
        
        <button class="generate-link" onclick="generateLink()">Generate Link</button>
        <div id="generated-link" class="generated-link" style="display: none;"></div>
    `;
    
    document.body.appendChild(menuContainer);
    
    // Global functions for menu interactions
    window.getLifetimeFromSlider = getLifetimeFromSlider;
    window.getSpawnFromSlider = getSpawnFromSlider;
    window.getDirectionFromSlider = getDirectionFromSlider;
    window.getBlendFromSlider = getBlendFromSlider;
    
    window.updateParam = (key, value) => {
        options[key] = value;
        recreateScene();
    };
    
    window.updateBackground = (colorHex) => {
        const colorInt = parseInt(colorHex.replace('#', ''), 16);
        testBgColor = colorInt;
        createTestBackground(colorInt);
    };
    
    window.applyPreset = (presetName) => {
        const preset = presets[presetName];
        Object.assign(options, preset);
        recreateScene();
        // Update all form controls
        updateMenuControls();
    };
    
    window.generateLink = () => {
        const params = new URLSearchParams();
        Object.entries(options).forEach(([key, value]) => {
            params.append(key, value);
        });
        const link = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
        const linkDiv = document.getElementById('generated-link');
        linkDiv.innerHTML = `<strong>Generated Link:</strong><br>${link}`;
        linkDiv.style.display = 'block';
        
        // Copy to clipboard
        navigator.clipboard.writeText(link);
    };
    
    function updateMenuControls() {
        const menu = document.querySelector('.dust-parameter-menu');
        menu.remove();
        createParameterMenu(options, recreateScene, createTestBackground);
    }
}
