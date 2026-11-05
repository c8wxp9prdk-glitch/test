// =============================================================
//  PROJECTILES
//  Bullets in flight. Each one flies in a straight line across
//  the map until it hits a wall (then gives a quick flash) or
//  runs out of range (then it simply disappears).
//
//  Which gun fires them, and when, lives in weapons.js.
//  This file just moves them and holds their pictures.
//
//  A projectile is a small object:
//      x, y        = where it is on the map
//      dirX, dirY  = which way it is flying (an arrow of length 1)
//      damage      = how much it hurts whatever it hits
//      speed       = metres per second
//      range       = how far it can fly before vanishing (metres)
//      travelled   = how far it has flown so far (metres)
//      size        = how big it looks (1 = a whole wall tall)
//      image       = the picture drawn for it while flying
//      state       = "flying" or "hit"
//      timer       = how long the "hit" flash has left (seconds)
// =============================================================

const HIT_FLASH_TIME = 0.15;      // how long the flash lasts after a hit (seconds)

// Every projectile currently in the world
const projectiles = [];

// -------------------------------------------------------------
//  Create a new projectile at the player, flying at "angle".
//  "settings" says how fast, how far and how big (see the
//  weapon list in weapons.js).
// -------------------------------------------------------------
function spawnProjectile(angle, settings) {
    const dirX = Math.cos(angle);
    const dirY = Math.sin(angle);

    projectiles.push({
        // Start a little in front of the player, not inside their head
        x: player.x + dirX * 0.3,
        y: player.y + dirY * 0.3,
        dirX: dirX,
        dirY: dirY,
        damage: settings.damage,
        speed: settings.speed,
        range: settings.range,
        travelled: 0,
        size: settings.size,
        image: settings.image,
        state: "flying",
        timer: 0,
    });
}

// -------------------------------------------------------------
//  Called once per frame by the game loop: moves every projectile.
// -------------------------------------------------------------
function updateProjectiles(deltaTime) {
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
        const distance = p.speed * deltaTime;

        // Move in small steps, checking for a wall after each one.
        // If we moved the whole distance in one jump, a fast projectile
        // could jump right over a thin corner without ever "touching" it.
        const smallStep = 0.05;
        let movedThisFrame = 0;
        while (movedThisFrame < distance) {
            const step = Math.min(smallStep, distance - movedThisFrame);
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
            movedThisFrame += step;
        }

        // Flown too far without hitting anything? It's gone.
        p.travelled += movedThisFrame;
        if (p.state === "flying" && p.travelled >= p.range) {
            projectiles.splice(i, 1);
        }
    }
}

// -------------------------------------------------------------
//  Pictures for projectiles, made once when the page loads.
//  Each is a glowing ball: bright white in the middle fading out
//  to see-through at the edges.
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

const SMG_BULLET_IMAGE = makeGlowImage("rgb(120, 220, 255)", "rgba(0, 120, 255, 0)");    // blue
const SHOTGUN_PELLET_IMAGE = makeGlowImage("rgb(255, 240, 120)", "rgba(255, 200, 0, 0)"); // yellow
const HIT_IMAGE = makeGlowImage("rgb(255, 180, 60)", "rgba(255, 60, 0, 0)");              // orange splat
