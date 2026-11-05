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
    fireRequested: false, // set to true when the player clicks to shoot
    fireHeld: false,      // true for as long as the mouse button is held down
    switchWeapon: 0,      // -1 = Q pressed (previous gun), +1 = E pressed (next gun)
};

// --- Keyboard ---
// "code" is the physical key (KeyW, KeyA...), so WASD still works
// on keyboards with a different layout.
document.addEventListener("keydown", function (event) {
    input.keys[event.code] = true;

    if (event.code === "KeyM") {
        input.showMap = !input.showMap;
    }

    // Swap guns. "event.repeat" is true when a key is being held down and
    // the computer starts auto-repeating it - we ignore those, so holding
    // Q swaps once instead of spinning through every gun.
    if (event.code === "KeyQ" && !event.repeat) {
        input.switchWeapon = -1;
    }
    if (event.code === "KeyE" && !event.repeat) {
        input.switchWeapon = 1;
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

    // Pressing the mouse button shoots - but only once the mouse is
    // locked to the game. That way the first click (the one that
    // starts the game) doesn't fire a shot.
    //
    // We remember two things:
    //   fireRequested - "a click happened", so even a very quick click
    //                   (pressed and released between two frames) still fires
    //   fireHeld      - "the button is down right now", for full-auto
    document.addEventListener("mousedown", function (event) {
        if (document.pointerLockElement === canvas && event.button === 0) {
            input.fireRequested = true;
            input.fireHeld = true;
        }
    });

    document.addEventListener("mouseup", function (event) {
        if (event.button === 0) {
            input.fireHeld = false;
        }
    });

    // If the mouse gets released from the game (e.g. pressing Esc)
    // while the button is held, we might never see the "mouseup".
    // So stop firing whenever the lock is lost.
    document.addEventListener("pointerlockchange", function () {
        if (document.pointerLockElement !== canvas) {
            input.fireHeld = false;
        }
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
