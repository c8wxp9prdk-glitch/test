// =============================================================
//  GUN LAB
//  A control panel beside the game screen for testing weapons.
//  Every gun in WEAPONS gets its own card full of sliders.
//  Moving a slider changes that gun's settings straight away,
//  while the game keeps running - no need to edit code and reload.
//
//  Next to each slider is a number box. Type into it for an exact
//  value - or to go past the slider's maximum, if you need to.
//
//  (Press Esc first to get your mouse pointer back from the game,
//   then you can drag the sliders.)
//
//  Changes only last until you reload the page. When you find
//  numbers you like, copy them into the WEAPONS list in weapons.js.
// =============================================================

// Every setting the lab can change.
//   key      = the setting's name in WEAPONS
//   part     = "weapon" if it lives on the gun itself,
//              "bullet" if it lives inside the gun's bullet settings
//   min, max = the ends of the slider. The number box can go ABOVE max,
//              but never below min (e.g. a speed of 0 would leave
//              bullets hanging in the air forever).
//   step     = how far the slider jumps each notch
//   decimals = how many decimal places the number box shows
//   unit     = shown after the number box
//   whole    = true if only whole numbers make sense (half a bullet?)
//   scale    = the number box shows (stored value x scale). Only Spread
//              uses it: it's stored in radians, but degrees are easier
//              to picture. Everything else uses 1 (shows the value as-is).
const LAB_SETTINGS = [
    { label: "Range",    key: "range",    part: "bullet", min: 0.5,  max: 20,  step: 0.5,  decimals: 1, unit: "m" },
    { label: "Speed",    key: "speed",    part: "bullet", min: 1,    max: 40,  step: 1,    decimals: 0, unit: "m/s" },
    { label: "Damage",   key: "damage",   part: "bullet", min: 0.1,  max: 10,  step: 0.1,  decimals: 1, unit: "" },
    { label: "Cooldown", key: "cooldown", part: "weapon", min: 0.05, max: 2,   step: 0.05, decimals: 2, unit: "s" },
    { label: "Bullets",  key: "bullets",  part: "weapon", min: 1,    max: 12,  step: 1,    decimals: 0, unit: "", whole: true },
    { label: "Spread",   key: "spread",   part: "weapon", min: 0,    max: 1,   step: 0.01, decimals: 0, unit: "°", scale: 180 / Math.PI },
    { label: "Size",     key: "size",     part: "bullet", min: 0.05, max: 0.6, step: 0.01, decimals: 2, unit: "" },
];

// Should the minimap draw a circle showing the equipped gun's range?
// (renderMiniMap in renderer.js checks this)
const lab = {
    showRangeOnMap: true,
};

// Longest name allowed, so it still fits in the HUD box in the game
const MAX_NAME_LENGTH = 10;

// The number given to the next new gun ("Gun 3", "Gun 4", ...).
// We count up separately instead of using WEAPONS.length, because after
// deleting a gun, WEAPONS.length could give a name that's already taken.
let nextGunNumber = WEAPONS.length + 1;

// Settings live either on the gun or on its bullet - this finds the right one
function labTarget(weapon, setting) {
    return setting.part === "bullet" ? weapon.bullet : weapon;
}

// A copy of a gun's current settings, so "Reset" can put them back.
// We copy just the values the lab can change (not the bullet pictures).
function saveLabDefaults(weapon) {
    const saved = { name: weapon.name, automatic: weapon.automatic };
    for (const setting of LAB_SETTINGS) {
        saved[setting.key] = labTarget(weapon, setting)[setting.key];
    }
    return saved;
}

// -------------------------------------------------------------
//  Build the panel: one card per gun
// -------------------------------------------------------------
function buildGunLab() {
    const panel = document.getElementById("gun-lab");

    // A checkbox for the minimap range circle
    const mapOption = document.createElement("label");
    mapOption.className = "lab-option";
    const mapCheckbox = document.createElement("input");
    mapCheckbox.type = "checkbox";
    mapCheckbox.checked = lab.showRangeOnMap;
    mapCheckbox.addEventListener("change", function () {
        lab.showRangeOnMap = mapCheckbox.checked;
    });
    mapOption.append(mapCheckbox, " Show equipped gun's range on minimap");
    panel.appendChild(mapOption);

    for (const weapon of WEAPONS) {
        panel.appendChild(buildWeaponCard(weapon));
    }

    // A button under all the cards that makes a brand new gun
    const addButton = document.createElement("button");
    addButton.className = "lab-add";
    addButton.textContent = "+ Add new gun";
    addButton.addEventListener("click", function () {
        const weapon = addWeapon();
        // Put the new card above the button, so the button stays at the bottom
        panel.insertBefore(buildWeaponCard(weapon), addButton);
        addButton.blur();
    });
    panel.appendChild(addButton);
}

// -------------------------------------------------------------
//  Make a new gun, starting as a copy of the one in your hands,
//  add it to the end of WEAPONS and equip it. Returns the new gun.
// -------------------------------------------------------------
function addWeapon() {
    const source = WEAPONS[currentWeapon];

    // "..." copies every setting from source into the new object.
    // The bullet settings are their own object, so copy those too -
    // otherwise both guns would share ONE bullet, and changing the
    // new gun's range would change the old gun's range as well.
    const weapon = {
        ...source,
        name: "Gun " + nextGunNumber,
        bullet: { ...source.bullet },
    };
    nextGunNumber++;

    WEAPONS.push(weapon);
    currentWeapon = WEAPONS.length - 1; // equip it straight away
    return weapon;
}

// -------------------------------------------------------------
//  Remove a gun from WEAPONS, keeping the right gun in your hands.
//  Returns false (and does nothing) if it's the only gun left.
// -------------------------------------------------------------
function deleteWeapon(weapon) {
    if (WEAPONS.length === 1) return false; // you always need something to shoot!

    const index = WEAPONS.indexOf(weapon);
    WEAPONS.splice(index, 1); // take it out of the list

    // currentWeapon is a position in the list, and everything after the
    // deleted gun just moved up one place - so fix it up:
    if (currentWeapon > index) {
        // We're holding a gun further down the list: it moved up one
        currentWeapon--;
    } else if (currentWeapon >= WEAPONS.length) {
        // We were holding the deleted gun and it was last: take the new last one
        currentWeapon = WEAPONS.length - 1;
    }
    // (If we were holding the deleted gun anywhere else, the next gun
    //  slides into its place, so we end up holding that one.)
    return true;
}

function buildWeaponCard(weapon) {
    const card = document.createElement("section");
    card.className = "lab-card";

    // What "Reset" goes back to: the gun as it was when its card was
    // made (the starting settings, or how a new gun was when added)
    const saved = saveLabDefaults(weapon);

    // --- Title ---
    const title = document.createElement("h2");
    title.textContent = weapon.name;
    card.appendChild(title);

    // Made now but added to the bottom of the card later
    const reset = document.createElement("button");
    reset.textContent = "Reset";

    // Each control gets an "update" function; Reset calls them all
    const refreshers = [];

    // --- Name ---
    const nameRow = document.createElement("label");
    nameRow.className = "lab-row";
    const nameLabel = document.createElement("span");
    nameLabel.textContent = "Name";
    const nameBox = document.createElement("input");
    nameBox.type = "text";
    nameBox.className = "lab-name";
    nameBox.maxLength = MAX_NAME_LENGTH;
    nameBox.value = weapon.name;

    nameBox.addEventListener("input", function () {
        // An empty name would leave a blank box in the HUD
        weapon.name = nameBox.value.trim() || "Unnamed";
        title.textContent = weapon.name;
    });
    blurOnEnter(nameBox);

    nameRow.append(nameLabel, nameBox);
    card.appendChild(nameRow);
    refreshers.push(function () {
        nameBox.value = weapon.name;
        title.textContent = weapon.name;
    });

    // --- Full auto on/off ---
    const autoRow = document.createElement("label");
    autoRow.className = "lab-option";
    const autoCheckbox = document.createElement("input");
    autoCheckbox.type = "checkbox";
    autoCheckbox.checked = weapon.automatic;
    autoCheckbox.addEventListener("change", function () {
        weapon.automatic = autoCheckbox.checked;
        autoCheckbox.blur(); // so pressing keys afterwards doesn't toggle it
    });
    autoRow.append(autoCheckbox, " Full auto (hold to fire)");
    card.appendChild(autoRow);
    refreshers.push(function () { autoCheckbox.checked = weapon.automatic; });

    // --- One slider + number box per setting ---
    for (const setting of LAB_SETTINGS) {
        const target = labTarget(weapon, setting);
        const scale = setting.scale || 1;

        const row = document.createElement("label");
        row.className = "lab-row";

        const name = document.createElement("span");
        name.textContent = setting.label;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = setting.min;
        slider.max = setting.max;
        slider.step = setting.step;

        const numberBox = document.createElement("input");
        numberBox.type = "number";
        numberBox.className = "lab-number";
        numberBox.min = setting.min * scale;
        numberBox.step = "any"; // allow any decimal, not just whole steps

        const unit = document.createElement("span");
        unit.className = "lab-unit";
        unit.textContent = setting.unit;

        // Show the gun's current value in both the slider and the box.
        // (If the value is past the slider's max, the slider just sits
        //  at the far end - the box shows the real number.)
        function showValue() {
            slider.value = target[setting.key];
            numberBox.value = Number((target[setting.key] * scale).toFixed(setting.decimals));
        }
        showValue();
        refreshers.push(showValue);

        // "input" fires continuously while dragging, so the gun
        // changes live as you slide
        slider.addEventListener("input", function () {
            target[setting.key] = Number(slider.value);
            showValue();
            updateStats();
        });

        // Typing in the box: use the number as soon as it makes sense...
        numberBox.addEventListener("input", function () {
            const typed = Number(numberBox.value);
            // (We don't fix up bad numbers here - while typing "0.5",
            //  the box briefly says "0", and we shouldn't fight that.)
            if (numberBox.value !== "" && typed >= setting.min * scale) {
                target[setting.key] = typed / scale;
                slider.value = target[setting.key];
                updateStats();
            }
        });

        // ...and when you finish (Enter, or click away), tidy it up
        numberBox.addEventListener("change", function () {
            let value = Number(numberBox.value) / scale;
            if (numberBox.value === "" || isNaN(value)) {
                value = target[setting.key];   // nonsense typed: keep the old value
            }
            if (setting.whole) value = Math.round(value);
            value = Math.max(setting.min, value); // never below the minimum
            target[setting.key] = value;
            showValue();
            updateStats();
        });
        blurOnEnter(numberBox);

        row.append(name, slider, numberBox, unit);
        card.appendChild(row);
    }

    // --- Worked-out numbers, handy for balancing ---
    const stats = document.createElement("p");
    stats.className = "lab-stats";
    card.appendChild(stats);

    function updateStats() {
        const b = weapon.bullet;
        const perShot = weapon.bullets * b.damage;
        const perSecond = perShot / weapon.cooldown;
        const flightTime = b.range / b.speed;
        stats.textContent =
            "Damage per shot: " + perShot.toFixed(1) +
            "  |  per second: " + perSecond.toFixed(1) +
            "  |  flight time: " + flightTime.toFixed(2) + " s";
    }
    updateStats();
    refreshers.push(updateStats);

    // --- Buttons: Reset and Delete, side by side ---
    const buttons = document.createElement("div");
    buttons.className = "lab-buttons";

    reset.addEventListener("click", function () {
        weapon.name = saved.name;
        weapon.automatic = saved.automatic;
        for (const setting of LAB_SETTINGS) {
            labTarget(weapon, setting)[setting.key] = saved[setting.key];
        }
        refreshers.forEach(function (refresh) { refresh(); });
        reset.blur();
    });

    const del = document.createElement("button");
    del.className = "lab-delete";
    del.textContent = "Delete";
    del.addEventListener("click", function () {
        if (deleteWeapon(weapon)) {
            card.remove(); // take the card off the page too
        } else {
            del.textContent = "Can't delete the last gun";
        }
        del.blur();
    });

    buttons.append(reset, del);
    card.appendChild(buttons);

    return card;
}

// Pressing Enter in a box finishes typing (and, for number boxes,
// triggers the "change" event that tidies the number up)
function blurOnEnter(box) {
    box.addEventListener("keydown", function (event) {
        if (event.key === "Enter") box.blur();
    });
}

// Light up the card of the gun currently in your hands.
// Called every frame by the game loop (cheap: it only flips a class).
// The cards are always in the same order as WEAPONS (new ones are added
// at the end, deleted ones are removed), so card number i is WEAPONS[i].
function updateGunLab() {
    const cards = document.querySelectorAll(".lab-card");
    cards.forEach(function (card, i) {
        card.classList.toggle("equipped", i === currentWeapon);
    });
}

buildGunLab();
