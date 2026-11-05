// =============================================================
//  TEXTURES
//  The pictures we paint onto the walls.
//
//  Each texture is a small square image (64 x 64 pixels). Instead
//  of loading image files, we "paint" them here with code, one
//  pixel at a time. That means no files to download, and you can
//  tweak the patterns just by changing numbers.
//
//  Each texture is stored on its own hidden canvas. The renderer
//  later copies thin 1-pixel-wide strips out of these canvases
//  and stretches them onto the walls.
//
//  WALL_TEXTURES[n] is the texture for wall number n in the map.
// =============================================================

const TEXTURE_SIZE = 64;

// -------------------------------------------------------------
//  noise(x, y): a "random" number from 0 to 1 for each pixel.
//  It isn't truly random - the same (x, y) always gives the same
//  answer - so the textures look the same every time you load.
//  (It scrambles the bits of x and y together. Don't worry about
//  how it works; just think of it as "random-looking grit".)
// -------------------------------------------------------------
function noise(x, y) {
    let n = Math.imul(x, 374761393) + Math.imul(y, 668265263);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) & 255) / 255;
}

// Keep a number between 0 and 255 (a valid colour value)
function clampColour(value) {
    return Math.max(0, Math.min(255, Math.floor(value)));
}

// -------------------------------------------------------------
//  makeTexture: builds a 64x64 texture on a hidden canvas.
//  You give it a function that answers the question
//  "what colour is the pixel at (x, y)?" as [red, green, blue].
// -------------------------------------------------------------
function makeTexture(pixelColour) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = TEXTURE_SIZE;
    textureCanvas.height = TEXTURE_SIZE;

    const textureCtx = textureCanvas.getContext("2d");
    const image = textureCtx.createImageData(TEXTURE_SIZE, TEXTURE_SIZE);

    // image.data is one long list: R, G, B, A, R, G, B, A, ... for every pixel
    for (let y = 0; y < TEXTURE_SIZE; y++) {
        for (let x = 0; x < TEXTURE_SIZE; x++) {
            const colour = pixelColour(x, y);
            const i = (y * TEXTURE_SIZE + x) * 4;
            image.data[i] = clampColour(colour[0]);
            image.data[i + 1] = clampColour(colour[1]);
            image.data[i + 2] = clampColour(colour[2]);
            image.data[i + 3] = 255; // fully solid (not see-through)
        }
    }

    textureCtx.putImageData(image, 0, 0);
    return textureCanvas;
}

// ---- 1 = grey stone: big blocks with dark gaps between them ----
function greyStone(x, y) {
    const blockW = 32, blockH = 16;
    const row = Math.floor(y / blockH);
    // Every other row is shifted along by half a block, like a real wall
    const shiftedX = x + (row % 2) * (blockW / 2);

    const inGap = (y % blockH === 0) || (shiftedX % blockW === 0);
    if (inGap) return [60, 60, 60];

    // Give each block its own slightly different shade...
    const blockShade = noise(Math.floor(shiftedX / blockW), row) * 30;
    // ...and add fine grit to every pixel
    const grit = noise(x, y) * 40;
    const v = 130 + blockShade + grit;
    return [v, v, v];
}

// ---- 2 = red brick: small bricks with light grey mortar ----
function redBrick(x, y) {
    const brickW = 16, brickH = 8;
    const row = Math.floor(y / brickH);
    const shiftedX = x + (row % 2) * (brickW / 2);

    const inMortar = (y % brickH === 0) || (shiftedX % brickW === 0);
    if (inMortar) {
        const m = 150 + noise(x, y) * 30;
        return [m, m, m - 10];
    }

    const brickShade = noise(Math.floor(shiftedX / brickW), row + 100) * 40;
    const grit = noise(x, y) * 30;
    return [130 + brickShade + grit, 45 + grit / 2, 35 + grit / 2];
}

// ---- 3 = green slime: wobbly blobs with drips running down ----
function greenSlime(x, y) {
    // Overlapping waves make a lumpy, organic pattern
    const wave = Math.sin(x * 0.3) + Math.sin(y * 0.2 + x * 0.1) + Math.sin((x + y) * 0.15);
    const lumpy = (wave + 3) / 6; // squash into 0..1

    // Some columns have a drip that runs part of the way down
    const dripLength = noise(x, 999) > 0.8 ? noise(x, 555) * TEXTURE_SIZE : 0;
    const drip = y < dripLength ? 40 : 0;

    const grit = noise(x, y) * 25;
    return [30 + lumpy * 30, 80 + lumpy * 80 + drip + grit, 30 + lumpy * 20];
}

// ---- 4 = blue tech: metal panels with raised edges and rivets ----
function blueTech(x, y) {
    const panel = 32;
    const px = x % panel; // position inside this panel
    const py = y % panel;

    // Top and left edges catch the light, bottom and right are in shadow.
    // This "bevel" makes the panels look raised.
    if (px === 0 || py === 0) return [140, 160, 230];
    if (px === panel - 1 || py === panel - 1) return [30, 35, 80];

    // A rivet near each corner of the panel
    const nearCornerX = px === 4 || px === panel - 5;
    const nearCornerY = py === 4 || py === panel - 5;
    if (nearCornerX && nearCornerY) return [190, 200, 230];

    // A glowing light strip across the middle of the panel
    if (py === 15 || py === 16) {
        return px > 6 && px < panel - 7 ? [120, 230, 255] : [40, 50, 100];
    }

    const grit = noise(x, y) * 15;
    return [60 + grit, 75 + grit, 150 + grit];
}

// Build all the textures once, when the page loads.
// (Index 0 is unused because 0 means "no wall".)
const WALL_TEXTURES = [
    null,
    makeTexture(greyStone),  // 1
    makeTexture(redBrick),   // 2
    makeTexture(greenSlime), // 3
    makeTexture(blueTech),   // 4
];
