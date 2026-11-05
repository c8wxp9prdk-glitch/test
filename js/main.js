// =============================================================
//  MAIN
//  Sets everything up and runs the "game loop".
//
//  A game loop is the beating heart of every game. Many times a
//  second it does:
//      1. UPDATE - move things (player, later: enemies, bullets...)
//      2. DRAW   - paint the new picture on the screen
//  ...and then repeats, forever.
// =============================================================

// Grab the canvas from the HTML page, and its 2D drawing tool ("context")
const canvas = document.getElementById("screen");
const ctx = canvas.getContext("2d");

// The real size of our drawing area in pixels (320 x 200, like old DOS games)
const SCREEN_WIDTH = canvas.width;
const SCREEN_HEIGHT = canvas.height;

// Start listening to the mouse
setupMouse(canvas);

// Remembers the time of the previous frame, so we can work out deltaTime
let lastTime = performance.now();

function gameLoop(currentTime) {
    // How many seconds since the last frame? (milliseconds / 1000)
    let deltaTime = (currentTime - lastTime) / 1000;
    lastTime = currentTime;

    // If the browser tab was hidden for a while, deltaTime could be huge and
    // the player would teleport. Cap it to a tenth of a second.
    if (deltaTime > 0.1) deltaTime = 0.1;

    // 1. UPDATE
    updatePlayer(deltaTime);
    updateWeapons(deltaTime);      // swap guns, fire new bullets
    updateProjectiles(deltaTime);  // move the bullets already flying

    // 2. DRAW
    renderScene(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
    renderProjectiles(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
    renderCrosshair(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
    renderWeaponHud(ctx, SCREEN_WIDTH, SCREEN_HEIGHT);
    if (input.showMap) {
        renderMiniMap(ctx);
    }

    // Ask the browser to call gameLoop again on the next screen refresh
    // (normally about 60 times per second)
    requestAnimationFrame(gameLoop);
}

// Kick off the very first frame
requestAnimationFrame(gameLoop);
