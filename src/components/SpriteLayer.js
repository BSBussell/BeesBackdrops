// Bee Bussell
// SpriteLayer.js
// This component takes a texture and returns a sprite that can be added to the stage

/**
 * Creates a sprite layer from a texture.
 * @param {PIXI.Texture} texture - The PIXI texture to display.
 * @param {object} [options={}] - Optional configuration.
 * @param {number} [options.scale] - Scale factor to apply to the sprite.
 * @param {number[]} [options.position] - Position [x, y] to set on the sprite.
 * @param {boolean} [options.tile] - Whether to use a tiling sprite.
 * @param {number} [options.tileWidth] - Width of the tiling region.
 * @param {number} [options.tileHeight] - Height of the tiling region.
 * @param {number} [options.alpha] - Initial alpha value for the sprite.
 * @param {number} [options.anchor] - Anchor point for the sprite.
 * @param {number} [options.blendMode] - Blend mode for the sprite.
 * @param {number} [options.tint] - Tint color for the sprite.
 * @returns {object} A component with a container containing the sprite.
 */
export function createSpriteLayer(texture, options = {}) {
    

    let sprite;
    if (options.tile) {
        const width = options.tileWidth || texture.width;
        const height = options.tileHeight || texture.height;
        sprite = new PIXI.TilingSprite(texture, width, height);
    } else {
        sprite = new PIXI.Sprite(texture);
    }

    // Alpha
    if (typeof options.alpha === 'number') {
        sprite.alpha = options.alpha;
    } else {
        sprite.alpha = 1.0; // Default alpha
    }

    // Anchor
    if (typeof options.anchor === 'number') {
        sprite.anchor.set(options.anchor);
    } else {
        sprite.anchor.set(0.0); // Default anchor
    }
    
    // Blend mode
    if (typeof options.blendMode === 'number') {
        sprite.blendMode = options.blendMode;
    } else {
        sprite.blendMode = "normal"; // Default blend mode
    }
    // Tint
    if (typeof options.tint === 'number') {
        sprite.tint = options.tint;
    } else {
        sprite.tint = 0xFFFFFF; // Default tint
    }

    const container = new PIXI.Container();
    container.addChild(sprite);

    if (typeof options.scale === 'number') {
        sprite.scale.set(options.scale);
    }

    if (Array.isArray(options.position) && options.position.length === 2) {
        sprite.position.set(options.position[0], options.position[1]);
    }

    return {
        container,
        sprite,
    };
}
