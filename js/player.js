// =============================================================
//  PLAYER
//  Where the player is, which way they are facing, and how
//  they move around.
//
//  Angles are in RADIANS (a full circle = 2 * Math.PI, about 6.28).
//  Angle 0 points east (along +x). Because y goes DOWN the map,
//  increasing the angle turns the player clockwise (to the right).
// =============================================================

const player = {
    x: 2.5,            // position in map squares (2.5 = middle of square 2)
    y: 2.5,
    angle: 0,          // which way we are facing (radians)
    pitch: 0,          // looking up/down: how many pixels the horizon is
                       // shifted (positive = looking up, negative = down)
    maxPitch: 100,     // furthest you can look up or down (in pixels)
    moveSpeed: 3.0,    // metres per second
    turnSpeed: 0.003,  // radians turned per pixel of mouse movement
    lookSpeed: 0.5,    // horizon pixels moved per pixel of mouse movement
    radius: 0.2,       // how "fat" the player is, so we don't touch walls
};

// Called once per frame. "deltaTime" is how many seconds have passed since
// the last frame (usually about 0.016). Multiplying speeds by deltaTime makes
// the game run at the same speed on fast and slow computers.
function updatePlayer(deltaTime) {
    // ---- 1. Looking around with the mouse ----
    const mouse = takeMouseMovement();

    // Left/right: turn the player
    player.angle += mouse.x * player.turnSpeed;

    // Up/down: tilt the view. Moving the mouse UP gives a negative number,
    // so we SUBTRACT it to make the pitch go up (look up).
    player.pitch -= mouse.y * player.lookSpeed;

    // Don't let the player look too far, or the view gets very stretched.
    // Math.max / Math.min "clamp" the number between -maxPitch and +maxPitch.
    player.pitch = Math.max(-player.maxPitch, Math.min(player.maxPitch, player.pitch));

    // ---- 2. Work out which way the keys want us to move ----
    // forward/back: +1 = forward, -1 = backward
    // strafe:       +1 = right,   -1 = left
    let forward = 0;
    let strafe = 0;
    if (input.keys["KeyW"]) forward += 1;
    if (input.keys["KeyS"]) forward -= 1;
    if (input.keys["KeyD"]) strafe += 1;
    if (input.keys["KeyA"]) strafe -= 1;

    // Nothing pressed? Then we're done.
    if (forward === 0 && strafe === 0) return;

    // ---- 3. Turn "forward/strafe" into a real direction on the map ----
    // cos/sin of our angle gives the direction we're facing.
    const dirX = Math.cos(player.angle);
    const dirY = Math.sin(player.angle);
    // "Right" is our facing direction turned 90 degrees clockwise.
    const rightX = -dirY;
    const rightY = dirX;

    let moveX = dirX * forward + rightX * strafe;
    let moveY = dirY * forward + rightY * strafe;

    // If moving diagonally (W + D), the combined arrow is longer than 1,
    // which would make us faster. Shrink it back to length 1.
    const length = Math.sqrt(moveX * moveX + moveY * moveY);
    moveX /= length;
    moveY /= length;

    // How far to move this frame
    const step = player.moveSpeed * deltaTime;

    // ---- 4. Move, but don't walk through walls ----
    // We test X and Y separately. That way if you walk into a wall at an
    // angle you "slide" along it instead of getting stuck.
    const newX = player.x + moveX * step;
    if (!touchesWall(newX, player.y)) {
        player.x = newX;
    }

    const newY = player.y + moveY * step;
    if (!touchesWall(player.x, newY)) {
        player.y = newY;
    }
}

// Would a player standing at (x, y) overlap a wall?
// We check the four corners of a small box around the player.
function touchesWall(x, y) {
    const r = player.radius;
    return isWall(x - r, y - r) ||
           isWall(x + r, y - r) ||
           isWall(x - r, y + r) ||
           isWall(x + r, y + r);
}
