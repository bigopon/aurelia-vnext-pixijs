
// Aliases
let Application = PIXI.Application,
    Container = PIXI.Container,
    loader = PIXI.loader,
    resources = PIXI.loader.resources,
    TextureCache = PIXI.utils.TextureCache,
    Sprite = PIXI.Sprite,
    Rectangle = PIXI.Rectangle;

// Create a Pixi Application
let app = new Application({
    width: 512,
    height: 512,
    antialias: true,
    transparent: false,
    resolution: 1
  }
);
window['app'] = app;

// Add the canvas that Pixi automatically created for you to the HTML document
document.body.appendChild(app.view);

// load a JSON file and run the `setup` function when it's done
loader
  .add([
    'static/feelings-wheel.jpg',
    'static/cow.jpg'
  ])
  .load(setup);

// Define variables that might be used in more
// than one function
let dungeon, explorer, treasure, door, id;
// This `setup` function will run when the image has loaded
function setup() {

  // Create the cat sprite
  let cat = new PIXI.Sprite(PIXI.loader.resources['static/feelings-wheel.jpg'].texture);
  let cow = new PIXI.Sprite(PIXI.loader.resources['static/cow.jpg'].texture);

  let ct = new PIXI.Container();
  ct.addChild(cow);

  // Add the cat to the stage
  app.stage.addChild(cat, ct);
}

export class PixiApp {

}
