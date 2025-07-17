// Bee Bussell
// ParallaxLayer.js
// Attaches an update function to a container that moves its children based on a speed factor.



export function makeLayerParallax(src_component, { speed = 1, app }) {
    // We’ll use their existing container, or the component itself if it's a PIXI.Container
  const container = src_component && src_component.container
      ? src_component.container
      : src_component;

  console.log('Parallax layer created:', container, speed);

  let scroll = 0;

  // Create this containers update function
  function update(delta) {
    // Don't apply parallax if speed is 0
    if (speed === 0) {
        return;
    }

    function applyParallaxToChildren(displayObject) {
        for (const child of displayObject.children) {
            if (child instanceof PIXI.TilingSprite) {

                child.tilePosition.x -=  speed * delta.deltaTime;

                
                
            } else if (child instanceof PIXI.Sprite) {
                child.position.x -= speed * delta.deltaTime;
                if (child.position.x < -child.width) {
                    child.position.x = app.screen.width;
                }
            } else if (child instanceof PIXI.Container) {
                applyParallaxToChildren(child); // recurse
            }
        }
    }

    applyParallaxToChildren(container);

  }

  // Hook it into Pixi’s ticker
  app.ticker.add(update);

  // Return the very same container
  return { container };
}


