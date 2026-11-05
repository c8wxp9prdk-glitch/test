// =============================================================
//  WEAPONS
//  The guns the player can carry, which one is in their hands,
//  and firing it.
//
//  Q = previous gun, E = next gun.
//
//  Each gun is described by a list of settings below. To make a
//  new gun, copy one of them, change the numbers, and add it to
//  the list - swapping, firing and the on-screen display will all
//  pick it up automatically.
// =============================================================

const WEAPONS = [
    {
        name: "SMG",
        automatic: true,     // keeps firing while the mouse button is held
        cooldown: 0.1,       // seconds between shots (0.1 = 10 shots a second)
        bullets: 1,          // bullets fired per shot
        spread: 0,           // width of the cone the bullets fan out in (radians)
        bullet: {
            damage: 1,       // damage dealt by each bullet
                             // (10 shots a second x 1 = 10 damage per second)
            speed: 10,       // metres per second
            range: 10,       // vanishes after 10 metres (the map is 16 metres across)
            size: 0.25,      // how big it looks
            image: SMG_BULLET_IMAGE,
        },
    },
    {
        name: "Shotgun",
        automatic: false,    // one shot per click
        cooldown: 0.7,       // slow to reload
        bullets: 5,          // a blast of 5 pellets...
        spread: 0.2,         // ...fanned out across a cone about 11 degrees wide
        bullet: {
            damage: 1.4,     // per pellet. Chosen to match the SMG's 10 damage per second:
                             //   5 pellets x 1.4 = 7 damage per shot
                             //   7 damage every 0.7 seconds = 10 damage per second
                             // (If you change the cooldown or pellet count, redo this sum!)
            speed: 12,
            range: 2.5,      // pellets vanish after 2.5 metres - get close!
            size: 0.15,
            image: SHOTGUN_PELLET_IMAGE,
        },
    },
];

// Which gun the player is holding: an index into WEAPONS (0 = the first one)
let currentWeapon = 0;

// Counts down after each shot. You can fire again when it reaches 0.
let fireCooldownLeft = 0;

// -------------------------------------------------------------
//  Called once per frame by the game loop.
// -------------------------------------------------------------
function updateWeapons(deltaTime) {
    // ---- 1. Swap guns with Q / E ----
    if (input.switchWeapon !== 0) {
        // Add +1 or -1 and wrap around the ends of the list.
        // (The "+ WEAPONS.length" stops it going negative when you
        //  press Q on the first gun - it wraps round to the last one.)
        currentWeapon = (currentWeapon + input.switchWeapon + WEAPONS.length) % WEAPONS.length;
        input.switchWeapon = 0;
    }

    const weapon = WEAPONS[currentWeapon];

    // ---- 2. Fire? ----
    // Every gun fires on a click. Only automatic guns keep firing
    // while the button is held down.
    fireCooldownLeft -= deltaTime;
    const wantsToFire = input.fireRequested || (weapon.automatic && input.fireHeld);
    if (wantsToFire && fireCooldownLeft <= 0) {
        fireWeapon(weapon);
        // ADD the cooldown rather than setting it. Frames don't line up
        // exactly with the cooldown, so we're usually a little past zero
        // by now - carrying that bit over makes the next shot come a
        // little sooner, which keeps the fire rate steady.
        // (We carry over at most one frame's worth, otherwise after a
        //  long pause between shots the next few would all fire at once.)
        fireCooldownLeft = Math.max(fireCooldownLeft, -deltaTime) + weapon.cooldown;
    }
    input.fireRequested = false; // we've dealt with this click
}

// Fire one shot from a gun: one or more bullets fanned out in a cone
function fireWeapon(weapon) {
    for (let i = 0; i < weapon.bullets; i++) {
        let angle = player.angle;

        if (weapon.bullets > 1) {
            // Spread the bullets evenly from one edge of the cone to the other.
            // For 5 bullets, "fraction" goes 0, 0.25, 0.5, 0.75, 1 ...
            const fraction = i / (weapon.bullets - 1);
            // ... so the angles go from -half the spread to +half the spread.
            angle += (fraction - 0.5) * weapon.spread;
        }

        spawnProjectile(angle, weapon.bullet);
    }
}

// -------------------------------------------------------------
//  Shows which gun is equipped: a list of every gun in the
//  bottom-right corner, with the one in your hands lit up.
// -------------------------------------------------------------
function renderWeaponHud(ctx, screenWidth, screenHeight) {
    const boxWidth = 52;
    const boxHeight = 12;
    const gap = 2;
    const margin = 4;

    ctx.font = "8px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    // Start at the bottom right and stack the boxes upwards,
    // so the first gun sits at the top of the list.
    for (let i = 0; i < WEAPONS.length; i++) {
        const fromBottom = WEAPONS.length - 1 - i;
        const x = screenWidth - margin - boxWidth;
        const y = screenHeight - margin - boxHeight - fromBottom * (boxHeight + gap);
        const equipped = i === currentWeapon;

        // Box: bright and solid if equipped, dim and see-through if not
        ctx.fillStyle = equipped ? "rgba(255, 200, 60, 0.9)" : "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(x, y, boxWidth, boxHeight);

        // Name of the gun
        ctx.fillStyle = equipped ? "black" : "rgba(255, 255, 255, 0.6)";
        ctx.fillText(WEAPONS[i].name.toUpperCase(), x + boxWidth / 2, y + boxHeight / 2 + 1);
    }

    // A reminder of the keys, just above the list
    const topOfList = screenHeight - margin - WEAPONS.length * (boxHeight + gap) + gap;
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.fillText("Q / E", screenWidth - margin - boxWidth / 2, topOfList - 6);
}
