// =============================================================
//  RENDERER (the raycaster)
//
//  How raycasting works, in plain English:
//
//  For every vertical column of pixels on the screen, we fire an
//  imaginary "ray" out from the player, through that column, into
//  the 2D map. We follow the ray square by square until it hits a
//  wall. Then:
//      - near wall  -> draw a TALL vertical line
//      - far wall   -> draw a SHORT vertical line
//  Do that for every column, side by side, and you get a 3D-looking
//  room - even though the map is only 2D!
// =============================================================

const FOV = Math.PI / 3;        // field of view: 60 degrees, in radians
const MAX_DEPTH = 20;           // give up on a ray after this many metres

// Draw one complete frame of the 3D view
function renderScene(ctx, screenWidth, screenHeight) {
    // ---- 0. Where is the horizon? ----
    // The horizon is the line where the floor meets the ceiling far away.
    // Looking straight ahead it sits in the middle of the screen.
    // To "look up" we slide it DOWN the screen (you see more ceiling),
    // to "look down" we slide it UP (you see more floor).
    // This old-school trick is called "y-shearing". It isn't true 3D
    // tilting, but it looks convincing and keeps the maths simple.
    const horizon = screenHeight / 2 + player.pitch;

    // ---- 1. Ceiling and floor ----
    // Just two flat colours: everything above the horizon is ceiling,
    // everything below is floor.
    ctx.fillStyle = "#383838";
    ctx.fillRect(0, 0, screenWidth, horizon);
    ctx.fillStyle = "#5a4a3a";
    ctx.fillRect(0, horizon, screenWidth, screenHeight - horizon);

    // ---- 2. Walls: one ray per column of pixels ----
    for (let column = 0; column < screenWidth; column++) {
        // Where across the screen is this column? -0.5 = left edge, +0.5 = right edge
        const screenFraction = column / screenWidth - 0.5;

        // So the ray's angle is our facing angle, nudged left or right
        const rayAngle = player.angle + screenFraction * FOV;

        // Follow the ray until it hits something
        const hit = castRay(player.x, player.y, rayAngle);

        // --- Fix the "fisheye" effect ---
        // Rays at the edge of the screen travel at an angle, so they measure
        // a longer distance than rays in the middle - which makes flat walls
        // look curved. Multiplying by cos(angle difference) gives the straight
        // ahead distance instead, which keeps walls flat.
        const distance = hit.distance * Math.cos(rayAngle - player.angle);

        // --- How tall should the wall be on screen? ---
        // Height is "1 divided by distance": twice as far = half as tall.
        // A wall 1 metre away fills the whole screen height.
        const wallHeight = screenHeight / distance;
        const wallTop = horizon - wallHeight / 2; // centred on the horizon

        // --- What colour? ---
        const baseColour = WALL_COLOURS[hit.wallType] || [255, 0, 255];

        // Make far-away walls darker (simple "fog") ...
        let brightness = 1 - distance / MAX_DEPTH;
        // ... and make north/south facing walls a bit darker than east/west
        // ones. This simple trick makes corners much easier to see.
        if (hit.side === 1) {
            brightness *= 0.7;
        }
        brightness = Math.max(0, brightness);

        const r = Math.floor(baseColour[0] * brightness);
        const g = Math.floor(baseColour[1] * brightness);
        const b = Math.floor(baseColour[2] * brightness);
        ctx.fillStyle = "rgb(" + r + "," + g + "," + b + ")";

        // --- Draw it: a rectangle 1 pixel wide ---
        ctx.fillRect(column, wallTop, 1, wallHeight);
    }
}

// -------------------------------------------------------------
//  castRay: start at (startX, startY), head off at "angle", and
//  find the first wall we hit.
//
//  This uses a method called "DDA" (Digital Differential Analysis).
//  Instead of creeping forward in tiny steps (slow, and can skip
//  past corners), we jump straight from one grid line to the next.
//  We only ever need to check squares the ray actually passes through.
//
//  Returns { distance, wallType, side }
//      side = 0 if we hit a wall face pointing east/west
//      side = 1 if we hit a wall face pointing north/south
// -------------------------------------------------------------
function castRay(startX, startY, angle) {
    // Direction the ray travels in
    const rayDirX = Math.cos(angle);
    const rayDirY = Math.sin(angle);

    // Which map square are we in right now?
    let mapX = Math.floor(startX);
    let mapY = Math.floor(startY);

    // How far along the ray we must travel to cross ONE whole square
    // in the x direction, and in the y direction.
    // (If the ray never moves in x, it never crosses an x line - use a huge number.)
    const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
    const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

    // stepX / stepY: which way we move through the grid (+1 or -1)
    // sideDistX / sideDistY: distance along the ray to the FIRST x / y grid line
    let stepX, stepY, sideDistX, sideDistY;

    if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (startX - mapX) * deltaDistX;
    } else {
        stepX = 1;
        sideDistX = (mapX + 1 - startX) * deltaDistX;
    }

    if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (startY - mapY) * deltaDistY;
    } else {
        stepY = 1;
        sideDistY = (mapY + 1 - startY) * deltaDistY;
    }

    // Walk through the grid one square at a time
    let side = 0;
    let distance = 0;

    while (distance < MAX_DEPTH) {
        // Whichever grid line is closer, jump to it
        if (sideDistX < sideDistY) {
            distance = sideDistX;   // distance to the line we're crossing
            sideDistX += deltaDistX;
            mapX += stepX;
            side = 0;
        } else {
            distance = sideDistY;
            sideDistY += deltaDistY;
            mapY += stepY;
            side = 1;
        }

        // Did we walk into a wall?
        if (isWall(mapX, mapY)) {
            // isWall() also returns true outside the map, so look up the
            // wall type safely (use 1 if we somehow left the map).
            const inside = mapX >= 0 && mapX < MAP_WIDTH && mapY >= 0 && mapY < MAP_HEIGHT;
            const wallType = inside ? MAP[mapY][mapX] : 1;
            return { distance: distance, wallType: wallType, side: side };
        }
    }

    // Didn't hit anything close enough
    return { distance: MAX_DEPTH, wallType: 1, side: side };
}

// -------------------------------------------------------------
//  A small top-down map in the corner. Not needed for the game,
//  but really handy for seeing what the raycaster is doing.
// -------------------------------------------------------------
function renderMiniMap(ctx) {
    const tileSize = 4;    // each map square drawn as 4x4 pixels
    const offset = 4;      // gap from the corner of the screen

    // Draw every square of the map
    for (let y = 0; y < MAP_HEIGHT; y++) {
        for (let x = 0; x < MAP_WIDTH; x++) {
            const tile = MAP[y][x];
            if (tile === 0) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.6)";
            } else {
                const c = WALL_COLOURS[tile];
                ctx.fillStyle = "rgb(" + c[0] + "," + c[1] + "," + c[2] + ")";
            }
            ctx.fillRect(offset + x * tileSize, offset + y * tileSize, tileSize, tileSize);
        }
    }

    // Player position on the minimap
    const px = offset + player.x * tileSize;
    const py = offset + player.y * tileSize;

    // A line showing which way the player is looking
    ctx.strokeStyle = "yellow";
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + Math.cos(player.angle) * 8, py + Math.sin(player.angle) * 8);
    ctx.stroke();

    // The player as a small dot
    ctx.fillStyle = "yellow";
    ctx.fillRect(px - 1, py - 1, 2, 2);
}
