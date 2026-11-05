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

// How far away the wall is in each column of the screen.
// Filled in while drawing walls, then used when drawing projectiles:
// if a projectile is further away than the wall in that column, the
// wall is in front of it, so we don't draw that bit.
// (Game programmers call this a "depth buffer" or "z-buffer".)
const wallDistances = [];

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
    // When textures get stretched, keep them blocky and sharp instead
    // of smudging them (blurry walls look wrong in a retro game).
    ctx.imageSmoothingEnabled = false;

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
        wallDistances[column] = distance; // remember it for drawing projectiles

        // --- How tall should the wall be on screen? ---
        // Height is "1 divided by distance": twice as far = half as tall.
        // A wall 1 metre away fills the whole screen height.
        const wallHeight = screenHeight / distance;
        const wallTop = horizon - wallHeight / 2; // centred on the horizon

        // --- Which texture, and which strip of it? ---
        // hit.wallX says how far along the wall face the ray landed
        // (0 = one edge of the square, 0.99 = the other edge).
        // Turn that into a column of the texture image: 0 to 63.
        const texture = WALL_TEXTURES[hit.wallType] || WALL_TEXTURES[1];
        const textureColumn = Math.floor(hit.wallX * TEXTURE_SIZE);

        // --- Draw it ---
        // Copy that 1-pixel-wide strip out of the texture and stretch it
        // to the wall's height on screen. drawImage's arguments are:
        //   (image, sourceX, sourceY, sourceWidth, sourceHeight,
        //           screenX, screenY, screenWidth, screenHeight)
        ctx.drawImage(
            texture,
            textureColumn, 0, 1, TEXTURE_SIZE,
            column, wallTop, 1, wallHeight
        );

        // --- Shading ---
        // Make far-away walls darker (simple "fog") ...
        let brightness = 1 - distance / MAX_DEPTH;
        // ... and make north/south facing walls a bit darker than east/west
        // ones. This simple trick makes corners much easier to see.
        if (hit.side === 1) {
            brightness *= 0.7;
        }
        brightness = Math.max(0, brightness);

        // We can't easily darken the texture itself, so instead we lay a
        // see-through black strip over the top. The darker the wall should
        // be, the more solid the black.
        ctx.fillStyle = "rgba(0, 0, 0, " + (1 - brightness) + ")";
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
//  Returns { distance, wallType, side, wallX }
//      side = 0 if we hit a wall face pointing east/west
//      side = 1 if we hit a wall face pointing north/south
//      wallX = how far along the wall face we hit, from 0 to 1
//              (used to pick which strip of the texture to draw)
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

            // --- Where exactly on the wall did we hit? ---
            // Work out the exact point the ray reached. If we hit an
            // east/west face, the y coordinate tells us how far along the
            // wall we are; on a north/south face it's the x coordinate.
            let wallX;
            if (side === 0) {
                wallX = startY + distance * rayDirY;
            } else {
                wallX = startX + distance * rayDirX;
            }
            wallX -= Math.floor(wallX); // keep only the part after the decimal point

            // Without this, textures on some wall faces would appear
            // mirrored (back to front). Flip them so they all read the same way.
            if ((side === 0 && rayDirX > 0) || (side === 1 && rayDirY < 0)) {
                wallX = 1 - wallX;
            }

            return { distance: distance, wallType: wallType, side: side, wallX: wallX };
        }
    }

    // Didn't hit anything close enough
    return { distance: MAX_DEPTH, wallType: 1, side: side, wallX: 0 };
}

// -------------------------------------------------------------
//  Draw every projectile as a "sprite": a flat picture that always
//  faces the player, scaled by distance just like the walls.
//  Must be called AFTER renderScene, so wallDistances is filled in.
// -------------------------------------------------------------
function renderProjectiles(ctx, screenWidth, screenHeight) {
    const horizon = screenHeight / 2 + player.pitch;

    // Draw the furthest ones first, so nearer ones get painted on top.
    // (sort() with this function puts the biggest distance first)
    const sorted = projectiles.slice().sort(function (a, b) {
        return distanceToPlayer(b) - distanceToPlayer(a);
    });

    for (const p of sorted) {
        // --- Where is it compared to where we're looking? ---
        const dx = p.x - player.x;
        const dy = p.y - player.y;

        // The angle from the player to the projectile, minus the way we
        // face, gives how far left (negative) or right (positive) it is.
        let angleToIt = Math.atan2(dy, dx) - player.angle;
        // Keep the angle between -PI and +PI (otherwise turning around
        // a few times would give silly answers like 7 radians)
        while (angleToIt > Math.PI) angleToIt -= 2 * Math.PI;
        while (angleToIt < -Math.PI) angleToIt += 2 * Math.PI;

        // Behind us or way off to the side? Then it's not on screen.
        if (Math.abs(angleToIt) > FOV) continue;

        // Same "straight ahead" distance trick as the walls (no fisheye)
        const distance = Math.sqrt(dx * dx + dy * dy) * Math.cos(angleToIt);
        if (distance < 0.1) continue; // too close - would be enormous

        // --- Where on screen, and how big? ---
        // Turn the angle back into a screen column (the reverse of what
        // renderScene does to turn a column into an angle).
        const centreColumn = (angleToIt / FOV + 0.5) * screenWidth;

        // A hit "splat" grows a little as it fades
        const scale = p.state === "hit" ? p.size * 1.6 : p.size;
        const size = (screenHeight / distance) * scale;
        const top = horizon - size / 2;  // flying at eye height
        const left = centreColumn - size / 2;

        const image = p.state === "hit" ? HIT_IMAGE : p.image;

        // --- Draw it one column at a time, hiding the bits behind walls ---
        const firstColumn = Math.max(0, Math.floor(left));
        const lastColumn = Math.min(screenWidth - 1, Math.floor(left + size));
        for (let column = firstColumn; column <= lastColumn; column++) {
            if (distance > wallDistances[column]) continue; // a wall is in front

            // Which strip of the projectile picture goes in this column?
            const imageColumn = Math.floor((column - left) / size * PROJECTILE_IMAGE_SIZE);
            ctx.drawImage(
                image,
                imageColumn, 0, 1, PROJECTILE_IMAGE_SIZE,
                column, top, 1, size
            );
        }
    }
}

// Straight-line distance from the player to a projectile
function distanceToPlayer(p) {
    const dx = p.x - player.x;
    const dy = p.y - player.y;
    return Math.sqrt(dx * dx + dy * dy);
}

// A small "+" in the middle of the screen so you can see where you're aiming
function renderCrosshair(ctx, screenWidth, screenHeight) {
    const cx = Math.floor(screenWidth / 2);
    const cy = Math.floor(screenHeight / 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.fillRect(cx - 3, cy, 7, 1); // across
    ctx.fillRect(cx, cy - 3, 1, 7); // down
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

    // Gun Lab: a circle showing how far the equipped gun's bullets fly.
    // (Bullets start 0.3 m in front of the player, so add that on.)
    if (lab.showRangeOnMap) {
        const reach = (WEAPONS[currentWeapon].bullet.range + 0.3) * tileSize;

        // A big range would draw outside the minimap, over the 3D view.
        // "clip" says: only allow drawing inside this rectangle for now.
        // save() / restore() switch the clip back off afterwards.
        ctx.save();
        ctx.beginPath();
        ctx.rect(offset, offset, MAP_WIDTH * tileSize, MAP_HEIGHT * tileSize);
        ctx.clip();

        ctx.strokeStyle = "rgba(255, 200, 60, 0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(offset + player.x * tileSize, offset + player.y * tileSize, reach, 0, 2 * Math.PI);
        ctx.stroke();

        ctx.restore();
    }

    // Projectiles as tiny dots (light blue while flying, orange on a hit)
    for (const p of projectiles) {
        ctx.fillStyle = p.state === "hit" ? "orange" : "#7cf";
        ctx.fillRect(offset + p.x * tileSize - 0.5, offset + p.y * tileSize - 0.5, 1, 1);
    }

    // Player position on the minimap
    const px = offset + player.x * tileSize;
    const py = offset + player.y * tileSize;

    // The player as a small dot
    ctx.fillStyle = "yellow";
    ctx.fillRect(px - 1, py - 1, 2, 2);
}
