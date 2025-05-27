# Bee's Backdrops

Bee's Backdrops is a collection of ambient PixiJS scenes meant to serve as animated backdrops, or interactive screensavers. It includes an evening firefly forest and a dynamic cityscape, and will be updated with more as I continue getting ideas. The intent is to create backdrops optimized for use in streaming software like OBS, but they can be used anywhere, and I plan on packaging them into dynamic MacOS screensavers in the future!!

## Buzz Words!

- **Time-Based Lighting**: Scenes shift gradually from day to night and back.
- **Simple Parallax**: Layered movement adds subtle depth.
- **Particles**: Light effects like fireflies and drifting leaves.

## Scenes

1. **FireFly Forest**: A peaceful forest at night with drifting fireflies and soft lighting.
2. **Scenic City**: A stylized city backdrop with moving lights and layers.

## Getting Started

### Prerequisites

- A modern web browser that supports JavaScript ES6 modules or OBS!

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/BSBussell/bees-backdrops.git
   cd bees-backdrops
   ```

### Running the Project

#### Option 1: Use Chromium to Open Local Files
You can open the HTML files directly using Chromium with the following flag to enable local file access:
```bash
Chromium --allow-file-access-from-files
```
This allows the scenes to run correctly without needing a server.

#### Option 2: View on GitHub Pages
If this project is hosted via GitHub Pages, you can visit each scene directly in your browser

### Optional: Use as Visuals in OBS
These scenes can be loaded as browser sources in OBS. Just copy the file path or URL into a browser source input. And set the width and height to 1920x1080 for best results.

### File Structure

```
BeesBackdrops/
├── assets/          # Images, textures, and other assets
├── lib/             # External libraries (PixiJS, filters, etc.)
├── src/             # Source code for components and scenes
│   ├── components/  # Reusable components (e.g., SpriteLayer, Parallax)
│   ├── scenes/      # Scene-specific scripts
├── index.html       # Main menu
├── ScenicCity.html  # Scenic City scene
├── FireFlyForest.html # FireFly Forest scene
└── README.md        # Project documentation
```

### Development

To modify or extend the project:

1. Edit the scene files in `src/scenes/`.
2. Add new components in `src/components/`.
3. Update assets in the `assets/` directory.

### Acknowledgments

- [PixiJS](https://pixijs.com/) for the rendering engine.
- [CraftPix](https://craftpix.net/) for the beautiful assets.
- [QuintinoPixels](https://quintino-pixels.itch.io/) for Forest Backdrops
- Inspiration from nature and urban landscapes.

Enjoy! 🐝
