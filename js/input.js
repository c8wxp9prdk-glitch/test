// =============================================================
//  INPUT
//  Keeps track of which keys are held down and how far the
//  mouse has moved, so the rest of the game can just ask
//  "is W held?" or "how far did the mouse move?".
// =============================================================

const input = {
    keys: {},        // e.g. keys["KeyW"] = true while W is held
    mouseMoveX: 0,   // how far the mouse moved sideways since last frame
    mouseMoveY: 0,   // how far the mouse moved up/down since last frame
    showMap: true,   // is the minimap visible? (press M to toggle)
};

// --- Keyboard ---
// "code" is the physical key (KeyW, KeyA...), so WASD still works
// on keyboards with a different layout.
document.addEventListener("keydown", function (event) {
    input.keys[event.code] = true;

    if (event.code === "KeyM") {
        input.showMap = !input.showMap;
    }
});

document.addEventListener("keyup", function (event) {
    input.keys[event.code] = false;
});

// --- Mouse ---
// Browsers don't let a web page grab your mouse until you click on it.
// "Pointer lock" hides the cursor and gives us unlimited mouse movement,
// which is exactly what a first-person game needs.
function setupMouse(canvas) {
    canvas.addEventListener("click", function () {
        canvas.requestPointerLock();
    });

    document.addEventListener("mousemove", function (event) {
        // Only turn the view while the mouse is locked to the game
        if (document.pointerLockElement === canvas) {
            // movementX = how many pixels the mouse moved sideways
            // movementY = how many pixels the mouse moved up/down
            //             (positive = down, negative = up)
            input.mouseMoveX += event.movementX;
            input.mouseMoveY += event.movementY;
        }
    });
}

// Called by the player once per frame: hands over the mouse movement
// collected so far, then resets it to zero for the next frame.
// It returns an object with two numbers, e.g. { x: 5, y: -2 }
function takeMouseMovement() {
    const movement = { x: input.mouseMoveX, y: input.mouseMoveY };
    input.mouseMoveX = 0;
    input.mouseMoveY = 0;
    return movement;
}
