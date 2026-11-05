// =============================================================
//  PROJECTILES
//  Things the player shoots. Each one flies in a straight line
//  across the map until it hits a wall, then gives a quick
//  flash ("splat") and disappears.
//
//  A projectile is just a small object:
//      { x, y, dirX, dirY, state, timer }
//  x, y       = where it is on the map
//  dirX, dirY = which way it is flying (an arrow of length 1)
//  state      = "flying" or "hit"
//  timer      = how long the "hit" flash has left (seconds)
// =============================================================

const PROJECTILE_SPEED = 10;      // metres per second
const PROJECTILE_SIZE = 0.25;     // how big it looks (1 = a whole wall tall)
const HIT_FLASH_TIME = 0.15;      // how long the flash lasts after a hit (seconds)
const FIRE_COOLDOWN = 0.1;        // gap between shots (seconds) - 0.1 = 10 shots a second
                                  // when the mouse button is held down

// Every projectile currently in the world
const projectiles = [];

// Counts down after each shot. You can fire again when it reaches 0.
let fireCooldownLeft = 0;

// -------------------------------------------------------------
//  Called once per frame by the game loop.
// -------------------------------------------------------------
function updateProjectiles(deltaTime) {
    // ---- 1. Fire a new projectile if the player clicked or is holding ----
    // Holding the button down keeps firing, one shot every FIRE_COOLDOWN
    // seconds ("full automatic").
    fireCooldownLeft -= deltaTime;
    const wantsToFire = input.fireRequested || input.fireHeld;
    if (wantsToFire && fireCooldownLeft <= 0) {
        fireProjectile();
        // ADD the cooldown rather than setting it. Frames don't line up
        // exactly with the cooldown, so we're usually a little past zero
        // by now - carrying that bit over makes the next shot come a
        // little sooner, which keeps the fire rate steady.
        // (We carry over at most one frame's worth, otherwise after a
        //  long pause between shots the next few would all fire at once.)
        fireCooldownLeft = Math.max(fireCooldownLeft, -deltaTime) + FIRE_COOLDOWN;
    }
    input.fireRequested = false; // we've dealt with this click

    // ---- 2. Move every projectile ----
    // We loop BACKWARDS so we can safely remove items as we go.
    // (Removing an item shifts everything after it down by one,
    //  which would make a forwards loop skip the next projectile.)
    for (let i = projectiles.length - 1; i >= 0; i--) {
        const p = projectiles[i];

        if (p.state === "hit") {
            // Already hit a wall: just let the flash fade, then remove it
            p.timer -= deltaTime;
            if (p.timer <= 0) {
                projectiles.splice(i, 1);
            }
            continue;
        }

        // How far it travels this frame
        const distance = PROJECTILE_SPEED * deltaTime;

        // Move in small steps, checking for a wall after each one.
        // If we moved the whole distance in one jump, a fast projectile
        // could jump right over a thin corner without ever "touching" it.
        const smallStep = 0.05;
        let travelled = 0;
        while (travelled < distance) {
            const step = Math.min(smallStep, distance - travelled);
            const nextX = p.x + p.dirX * step;
            const nextY = p.y + p.dirY * step;

            if (isWall(nextX, nextY)) {
                // Hit! Stop here (just in front of the wall) and start the flash.
                p.state = "hit";
                p.timer = HIT_FLASH_TIME;
                break;
            }

            p.x = nextX;
            p.y = nextY;
            travelled += step;
        }
    }
}

// Create a new projectile at the player, heading the way they face
function fireProjectile() {
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);

    projectiles.push({
        // Start a little in front of the player, not inside their head
        x: player.x + dirX * 0.3,
        y: player.y + dirY * 0.3,
        dirX: dirX,
        dirY: dirY,
        state: "flying",
        timer: 0,
    });
}

// -------------------------------------------------------------
//  Pictures for the projectile, made once when the page loads.
//  A glowing ball: bright white in the middle fading out to
//  see-through at the edges. The "hit" picture is the same
//  idea in orange, for the splat when it hits a wall.
// -------------------------------------------------------------
const PROJECTILE_IMAGE_SIZE = 32;

function makeGlowImage(innerColour, outerColour) {
    const glowCanvas = document.createElement("canvas");
    glowCanvas.width = PROJECTILE_IMAGE_SIZE;
    glowCanvas.height = PROJECTILE_IMAGE_SIZE;
    const glowCtx = glowCanvas.getContext("2d");

    const middle = PROJECTILE_IMAGE_SIZE / 2;
    // A "radial gradient" blends colours outwards in a circle
    const gradient = glowCtx.createRadialGradient(middle, middle, 0, middle, middle, middle);
    gradient.addColorStop(0, "white");
    gradient.addColorStop(0.3, innerColour);
    gradient.addColorStop(1, outerColour);

    glowCtx.fillStyle = gradient;
    glowCtx.fillRect(0, 0, PROJECTILE_IMAGE_SIZE, PROJECTILE_IMAGE_SIZE);
    return glowCanvas;
}

const PROJECTILE_IMAGE = makeGlowImage("rgb(120, 220, 255)", "rgba(0, 120, 255, 0)");
const HIT_IMAGE = makeGlowImage("rgb(255, 180, 60)", "rgba(255, 60, 0, 0)");
