// =============================================================
//  MAP
//  The world, seen from above, as a 2D grid (an array of rows).
//  Each number is one 1x1 metre square of the world:
//     0 = empty floor (you can walk here)
//     1+ = a solid wall (different numbers = different wall colours)
//
//  The map is read as MAP[y][x]:
//     y = which row    (going down the page  = "south")
//     x = which column (going across the page = "east")
//
//  Try editing the numbers below to build your own level!
//  Just keep a border of walls around the outside so the
//  player can never walk off the edge of the world.
// =============================================================

const MAP = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 2, 0, 2, 0, 0, 1],
    [1, 0, 0, 3, 3, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 4, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 4, 0, 0, 1],
    [1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 0, 0, 1],
    [1, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 4, 4, 4, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 3, 0, 3, 0, 3, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// How big the map is (number of columns and rows)
const MAP_WIDTH = MAP[0].length;
const MAP_HEIGHT = MAP.length;

// The colour used for each wall number. [red, green, blue], each 0-255.
// (Index 0 is unused because 0 means "no wall".)
const WALL_COLOURS = [
    null,
    [170, 170, 170], // 1 = grey stone
    [160, 60, 50],   // 2 = red brick
    [60, 120, 60],   // 3 = green slime
    [70, 90, 170],   // 4 = blue tech
];

// Helper: is the square at (x, y) a wall?
// x and y can be decimals (like 3.7) - we round them down to find the square.
// Anything outside the map counts as a wall, so nothing can escape.
function isWall(x, y) {
    const mapX = Math.floor(x);
    const mapY = Math.floor(y);

    if (mapX < 0 || mapX >= MAP_WIDTH || mapY < 0 || mapY >= MAP_HEIGHT) {
        return true;
    }
    return MAP[mapY][mapX] !== 0;
}
