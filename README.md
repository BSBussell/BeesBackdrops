# Bee's Backdrops

Bee's Backdrops is a collection of ambient PixiJS scenes meant to serve as animated backdrops, or interactive screensavers. It includes an evening firefly forest and a dynamic cityscape, and will be updated with more as I continue getting ideas. The intent is to create backdrops optimized for use in streaming software like OBS, but they can be used anywhere, and I plan on packaging them into dynamic MacOS screensavers in the future!!

## Buzz Words!

- **Time-Based Lighting**: Scenes shift gradually from day to night and back.
- **Simple Parallax**: Layered movement adds subtle depth.
- **Particles**: Light effects like fireflies and drifting leaves.

### Planned!

- **URL Arguments**: Allow customization of scroll speed, day/night cycle, and whatever else I need with URL parameters.
- **Screen Saver Mode**: A page built to be used as a screensaver, where it regularly swaps between the backdrops.
- **TSH Integration**: Grab data from Tournament Stream Helper to create visuals that react to game events!
- **More Scenes**(As I get ideas!): Depending on future events, seasons, or just whatever, I will probably create more scenes to add to this collection.

## Scenes

1. **FireFly Forest**: A peaceful forest at night with drifting fireflies and soft lighting. ~~PLEASE PLAY [FIREFLY](bbussell.com/firefly)~~
2. **Scenic City**: A stylized city backdrop with moving lights and layers.

## Getting Started

### Prerequisites

- A modern web browser that supports JavaScript ES6 modules or OBS!

### Setup

### Simple Usage: OBS Sources
These scenes are designed to be loaded as browser sources in OBS. Simply navigate to the scene you would like to use, and paste the URL into a browser source input. For best results, use a 1920x1080 resolution!

#### Local Development Setup
Clone the repository:
   ```bash
   git clone https://github.com/BSBussell/bees-backdrops.git
   cd bees-backdrops
   ```
You can open the HTML files directly using Chromium with the following flag to enable local file access:
```bash
Chromium --allow-file-access-from-files
```
This allows the scenes to run correctly without needing a server.

### File Structure

```
BeesBackdrops/
├── assets/          # Images, textures, and other assets
├── lib/             # External libraries (PixiJS, filters, etc.)
├── src/             # Source code for components and scenes
│   ├── components/  # Reusable components (e.g., SpriteLayer, Parallax, ParticleSystem)
│   ├── scenes/      # Scene-specific scripts
├── index.html       # Main menu
├── ScenicCity.html  # Scenic City scene
├── FireFlyForest.html # FireFly Forest scene
└── README.md        # Project documentation
```

### Development

To modify or extend the project:

1. Create/Edite your HTML file in the root directory.
2. Create/Edit the scene files in `src/scenes/`.
3. Add new components in `src/components/`.
4. Update assets in the `assets/` directory.

### Acknowledgments

- [PixiJS](https://pixijs.com/) for the rendering engine.
- [CraftPix](https://craftpix.net/) for the city assets.
- [Digital Moons](https://digitalmoons.itch.io/) for the Mountain Backdrops.
- [QuintinoPixels](https://quintino-pixels.itch.io/) for Forest Backdrops.
- Inspiration from nature and urban landscapes.

Enjoy! 🐝
