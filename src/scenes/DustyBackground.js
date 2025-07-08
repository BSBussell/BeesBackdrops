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
    const color_palette = options.color_palette || 'white'; // Default to white for no-params
    const blend_mode = options.blend_mode || 'normal'; // 'normal', 'add', 'multiply', 'overlay'
    const glow_intensity = options.glow_intensity || 0.0; // 0.0 to 1.0
    const shape_distortion = options.shape_distortion || 0.0; // 0.0 to 1.0 (0 = perfect circle, 1 = jagged)
    
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

    // Create dust texture (simple circular dust mote)
    const dustTexture = createDustTexture(shape_distortion);

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

    // Color palette settings
    const colorPalettes = {
        white: {
            0.0: 0xFFFFFF,  // White
            0.3: 0xF0F0F0,  // Light gray
            0.6: 0xD0D0D0,  // Medium gray
            1.0: 0xB0B0B0   // Darker gray
        },
        dusty_brown: {
            0.0: 0x8B7355,  // Dusty brown
            0.3: 0x9C8A6B,  // Lighter brown
            0.6: 0x7A6A5A,  // Gray-brown
            1.0: 0x6B5B4A   // Dark brown
        },
        ash_gray: {
            0.0: 0x696969,  // Dim gray
            0.3: 0x808080,  // Gray
            0.6: 0x555555,  // Dark gray
            1.0: 0x2F2F2F   // Very dark gray
        },
        spore_green: {
            0.0: 0x556B2F,  // Dark olive green
            0.3: 0x6B8E23,  // Olive drab
            0.6: 0x4F5F2F,  // Dark olive
            1.0: 0x2E3A1F   // Very dark olive
        },
        decay_purple: {
            0.0: 0x6A5ACD,  // Slate blue
            0.3: 0x483D8B,  // Dark slate blue
            0.6: 0x4B0082,  // Indigo
            1.0: 0x301934   // Very dark purple
        }
    };

    const currentColorPalette = colorPalettes[color_palette] || colorPalettes.white;

    // Spawn area settings
    const spawnAreas = {
        full_screen: { type: 'rect', size: { x: app.screen.width, y: app.screen.height } },
        edges: { type: 'rect', size: { x: app.screen.width * 1.2, y: app.screen.height * 1.2 } },
        center: { type: 'circle', radius: Math.min(app.screen.width, app.screen.height) * 0.3 },
        bottom_up: { type: 'rect', size: { x: app.screen.width, y: app.screen.height * 0.2 } }
    };

    const currentSpawnArea = spawnAreas[spawn_area] || spawnAreas.full_screen;

    // Direction settings
    const getDirectionSettings = (direction) => {
        switch (direction) {
            case 'up':
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 1.3, Math.PI * 1.7], // Upward
                    acceleration: { x: 0, y: -gravity_strength * 10 }
                };
            case 'down':
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 0.3, Math.PI * 0.7], // Downward
                    acceleration: { x: 0, y: gravity_strength * 10 }
                };
            case 'random':
                return {
                    speed: [3 * drift_speed, 12 * drift_speed],
                    angle: [0, Math.PI * 2], // All directions
                    acceleration: { 
                        x: (Math.random() - 0.5) * wind_strength * 20, 
                        y: gravity_strength * 5 
                    }
                };
            case 'circular':
                return {
                    speed: [8 * drift_speed, 18 * drift_speed],
                    angle: [0, Math.PI * 2], // All directions
                    acceleration: { x: 0, y: 0 }
                };
            default:
                return {
                    speed: [5 * drift_speed, 15 * drift_speed],
                    angle: [Math.PI * 1.3, Math.PI * 1.7],
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
            x: (Math.random() - 0.5) * wind_strength * 20 * turbulence,
            y: getDirectionSettings(float_direction).acceleration.y + (Math.random() - 0.5) * turbulence * 15
        },
        
        // Ambient floating behavior
        damping: 0.005 + (drift_chaos * 0.02),
        
        // Size variation for depth
        scale: {
            0.0: sizeRange[0] * (0.8 + Math.random() * 0.4),
            0.5: sizeRange[0] * (1.0 + Math.random() * 0.3),
            1.0: sizeRange[0] * (0.3 + Math.random() * 0.2)
        },
        
        color: currentColorPalette,
        
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
        blendMode: blend_mode
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
            x: (Math.random() - 0.5) * wind_strength * 8 * turbulence,
            y: getDirectionSettings(float_direction).acceleration.y * 0.3
        },
        
        damping: 0.002 + (drift_chaos * 0.01),
        
        scale: {
            0.0: sizeRange[0] * 0.3,
            0.7: sizeRange[0] * 0.6,
            1.0: sizeRange[0] * 0.1
        },
        
        color: {
            0.0: currentColorPalette[0.3],
            0.5: currentColorPalette[0.6],
            1.0: currentColorPalette[1.0]
        },
        
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
        blendMode: blend_mode
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
            x: (Math.random() - 0.5) * wind_strength * 40 * turbulence,
            y: (Math.random() - 0.5) * wind_strength * 30 * turbulence
        },
        
        damping: 0.01 + (drift_chaos * 0.03),
        
        scale: {
            0.0: sizeRange[0] * 1.5,
            0.3: sizeRange[0] * 1.8,
            1.0: sizeRange[0] * 0.4
        },
        
        color: {
            0.0: currentColorPalette[0.0],
            0.4: currentColorPalette[0.3],
            1.0: currentColorPalette[1.0]
        },
        
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
        blendMode: blend_mode
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

// Create a dust particle texture with optional shape distortion
function createDustTexture(distortion = 0.0) {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    
    // Create a soft, irregular dust mote
    const centerX = 16;
    const centerY = 16;
    const baseRadius = 8;
    
    // Create radial gradient for soft edges
    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, baseRadius);
    gradient.addColorStop(0, 'rgba(139, 115, 85, 0.9)');
    gradient.addColorStop(0.4, 'rgba(139, 115, 85, 0.6)');
    gradient.addColorStop(0.7, 'rgba(139, 115, 85, 0.3)');
    gradient.addColorStop(1, 'rgba(139, 115, 85, 0)');
    
    ctx.fillStyle = gradient;
    
    // Draw shape based on distortion level
    ctx.beginPath();
    
    if (distortion === 0.0) {
        // Perfect circle
        ctx.arc(centerX, centerY, baseRadius, 0, Math.PI * 2);
    } else {
        // Create jagged, distorted shape
        const numPoints = 8 + Math.floor(distortion * 12); // More points = more jagged
        const angleStep = (Math.PI * 2) / numPoints;
        
        for (let i = 0; i < numPoints; i++) {
            const angle = i * angleStep;
            
            // Base radius with distortion
            const radiusVariation = 1.0 + (Math.random() - 0.5) * distortion * 0.8;
            const jaggedVariation = 1.0 + (Math.random() - 0.5) * distortion * 0.6;
            const radius = baseRadius * radiusVariation * jaggedVariation;
            
            // Add some noise to angle for more organic feel
            const noisyAngle = angle + (Math.random() - 0.5) * distortion * 0.3;
            
            const x = centerX + Math.cos(noisyAngle) * radius;
            const y = centerY + Math.sin(noisyAngle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                // Use curves for more organic shapes at high distortion
                if (distortion > 0.3) {
                    const prevAngle = (i - 1) * angleStep;
                    const prevRadius = baseRadius * (1.0 + (Math.random() - 0.5) * distortion * 0.8);
                    const prevX = centerX + Math.cos(prevAngle) * prevRadius;
                    const prevY = centerY + Math.sin(prevAngle) * prevRadius;
                    
                    // Control point for curve
                    const controlX = (prevX + x) / 2 + (Math.random() - 0.5) * distortion * 4;
                    const controlY = (prevY + y) / 2 + (Math.random() - 0.5) * distortion * 4;
                    
                    ctx.quadraticCurveTo(controlX, controlY, x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        
        ctx.closePath();
    }
    
    ctx.fill();
    
    // Add some texture variation (less pronounced for jagged shapes)
    const textureIntensity = Math.max(0.4, 1.0 - distortion * 0.6);
    ctx.fillStyle = `rgba(156, 138, 107, ${0.4 * textureIntensity})`;
    ctx.beginPath();
    
    if (distortion < 0.5) {
        ctx.arc(centerX - 2, centerY - 2, baseRadius * 0.6, 0, Math.PI * 2);
    } else {
        // Smaller irregular highlight for jagged shapes
        const highlightRadius = baseRadius * 0.4;
        const highlightPoints = 6;
        const highlightAngleStep = (Math.PI * 2) / highlightPoints;
        
        for (let i = 0; i < highlightPoints; i++) {
            const angle = i * highlightAngleStep;
            const radius = highlightRadius * (0.8 + Math.random() * 0.4);
            const x = centerX - 2 + Math.cos(angle) * radius;
            const y = centerY - 2 + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
    }
    
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
            color_palette: urlParams.get('color_palette') || (hasParams ? 'dusty_brown' : 'white'),
            blend_mode: urlParams.get('blend_mode') || 'normal',
            glow_intensity: parseFloat(urlParams.get('glow_intensity')) || 0.0,
            shape_distortion: parseFloat(urlParams.get('shape_distortion')) || 0.0,
            
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
    const getDensityFromSlider = (value) => {
        const densities = ['sparse', 'low', 'medium', 'high', 'heavy', 'overwhelming'];
        return densities[Math.floor(value)];
    };
    
    const getDensitySliderValue = (density) => {
        const densities = ['sparse', 'low', 'medium', 'high', 'heavy', 'overwhelming'];
        return densities.indexOf(density);
    };
    
    const getSizeFromSlider = (value) => {
        const sizes = ['microscopic', 'tiny', 'small', 'medium', 'large', 'massive'];
        return sizes[Math.floor(value)];
    };
    
    const getSizeSliderValue = (size) => {
        const sizes = ['microscopic', 'tiny', 'small', 'medium', 'large', 'massive'];
        return sizes.indexOf(size);
    };
    
    const getLifetimeFromSlider = (value) => {
        const lifetimes = ['short', 'medium', 'long', 'eternal'];
        return lifetimes[Math.floor(value)];
    };
    
    const getLifetimeSliderValue = (lifetime) => {
        const lifetimes = ['short', 'medium', 'long', 'eternal'];
        return lifetimes.indexOf(lifetime);
    };
    
    const getColorFromSlider = (value) => {
        const colors = ['white', 'dusty_brown', 'ash_gray', 'spore_green', 'decay_purple'];
        return colors[Math.floor(value)];
    };
    
    const getColorSliderValue = (color) => {
        const colors = ['white', 'dusty_brown', 'ash_gray', 'spore_green', 'decay_purple'];
        return colors.indexOf(color);
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
            opacity: 0.9,
            density: 120,
            drift_speed: 0.4,
            particle_size: 1.0,
            float_direction: 'up',
            wind_strength: 0.5,
            turbulence: 0.7,
            particle_lifetime: 'long',
            color_palette: 'ash_gray',
            blend_mode: 'normal',
            spawn_area: 'full_screen',
            spawn_burst: 0.3,
            drift_chaos: 0.6,
            gravity_strength: -0.2,
            rotation_speed: 0.3,
            shape_distortion: 0.3
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
            color_palette: 'spore_green',
            blend_mode: 'add',
            spawn_area: 'edges',
            spawn_burst: 0.7,
            drift_chaos: 0.8,
            gravity_strength: 0.1,
            rotation_speed: 1.2,
            shape_distortion: 0.8
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
            color_palette: 'decay_purple',
            blend_mode: 'overlay',
            spawn_area: 'center',
            spawn_burst: 0.1,
            drift_chaos: 0.1,
            gravity_strength: 0.0,
            rotation_speed: 0.8,
            shape_distortion: 0.2
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
            color_palette: 'white',
            blend_mode: 'normal',
            spawn_area: 'bottom_up',
            spawn_burst: 0.0,
            drift_chaos: 0.2,
            gravity_strength: -0.1,
            rotation_speed: 0.4,
            shape_distortion: 0.0
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
                <span class="param-label">Opacity</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.opacity}" 
                           onchange="updateParam('opacity', parseFloat(this.value))">
                    <div class="slider-label">${options.opacity}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Density (particles)</span>
                <div class="param-control">
                    <input type="range" min="5" max="500" step="5" value="${options.density}" 
                           onchange="updateParam('density', parseInt(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.density}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Drift Speed</span>
                <div class="param-control">
                    <input type="range" min="0" max="2" step="0.1" value="${options.drift_speed}" 
                           onchange="updateParam('drift_speed', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.drift_speed}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Particle Size (scale)</span>
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
                <span class="param-label">Direction</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getDirectionSliderValue(options.float_direction)}" 
                           onchange="updateParam('float_direction', getDirectionFromSlider(this.value)); this.nextElementSibling.textContent = getDirectionFromSlider(this.value);">
                    <div class="slider-label">${options.float_direction}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Wind Strength</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.wind_strength}" 
                           onchange="updateParam('wind_strength', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.wind_strength}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Turbulence</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.turbulence}" 
                           onchange="updateParam('turbulence', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.turbulence}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Drift Chaos</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.drift_chaos}" 
                           onchange="updateParam('drift_chaos', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.drift_chaos}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Gravity</span>
                <div class="param-control">
                    <input type="range" min="-1" max="1" step="0.1" value="${options.gravity_strength}" 
                           onchange="updateParam('gravity_strength', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.gravity_strength}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Rotation Speed</span>
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
                <span class="param-label">Color Palette</span>
                <div class="param-control">
                    <input type="range" min="0" max="4" step="1" value="${getColorSliderValue(options.color_palette)}" 
                           onchange="updateParam('color_palette', getColorFromSlider(this.value)); this.nextElementSibling.textContent = getColorFromSlider(this.value);">
                    <div class="slider-label">${options.color_palette}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Blend Mode</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getBlendSliderValue(options.blend_mode)}" 
                           onchange="updateParam('blend_mode', getBlendFromSlider(this.value)); this.nextElementSibling.textContent = getBlendFromSlider(this.value);">
                    <div class="slider-label">${options.blend_mode}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Shape Distortion</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.shape_distortion}" 
                           onchange="updateParam('shape_distortion', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.shape_distortion}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Spawn Area</span>
                <div class="param-control">
                    <input type="range" min="0" max="3" step="1" value="${getSpawnSliderValue(options.spawn_area)}" 
                           onchange="updateParam('spawn_area', getSpawnFromSlider(this.value)); this.nextElementSibling.textContent = getSpawnFromSlider(this.value);">
                    <div class="slider-label">${options.spawn_area}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Spawn Burst</span>
                <div class="param-control">
                    <input type="range" min="0" max="1" step="0.1" value="${options.spawn_burst}" 
                           onchange="updateParam('spawn_burst', parseFloat(this.value)); this.nextElementSibling.textContent = this.value;">
                    <div class="slider-label">${options.spawn_burst}</div>
                </div>
            </div>
            <div class="param-row">
                <span class="param-label">Lifetime</span>
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
    window.getDensityFromSlider = getDensityFromSlider;
    window.getSizeFromSlider = getSizeFromSlider;
    window.getLifetimeFromSlider = getLifetimeFromSlider;
    window.getColorFromSlider = getColorFromSlider;
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
