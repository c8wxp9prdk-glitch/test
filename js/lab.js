// =============================================================
//  GUN LAB
//  A control panel beside the game screen for testing weapons.
//  Every gun in WEAPONS gets its own card full of sliders.
//  Moving a slider changes that gun's settings straight away,
//  while the game keeps running - no need to edit code and reload.
//
//  (Press Esc first to get your mouse pointer back from the game,
//   then you can drag the sliders.)
//
//  Changes only last until you reload the page. When you find
//  numbers you like, copy them into the WEAPONS list in weapons.js.
// =============================================================

// Every setting the lab can change.
//   key    = the setting's name in WEAPONS
//   part   = "weapon" if it lives on the gun itself,
//            "bullet" if it lives inside the gun's bullet settings
//   show   = turns the number into the text shown next to the slider
const LAB_SETTINGS = [
    { label: "Range",      key: "range",    part: "bullet", min: 0.5,  max: 20, step: 0.5,  show: v => v + " m" },
    { label: "Speed",      key: "speed",    part: "bullet", min: 1,    max: 40, step: 1,    show: v => v + " m/s" },
    { label: "Damage",     key: "damage",   part: "bullet", min: 0.1,  max: 10, step: 0.1,  show: v => v.toFixed(1) },
    { label: "Cooldown",   key: "cooldown", part: "weapon", min: 0.05, max: 2,  step: 0.05, show: v => v.toFixed(2) + " s" },
    { label: "Bullets",    key: "bullets",  part: "weapon", min: 1,    max: 12, step: 1,    show: v => String(v) },
    // Spread is stored in radians, but degrees are easier to picture
    { label: "Spread",     key: "spread",   part: "weapon", min: 0,    max: 1,  step: 0.01, show: v => Math.round(v * 180 / Math.PI) + "°" },
    { label: "Size",       key: "size",     part: "bullet", min: 0.05, max: 0.6, step: 0.01, show: v => v.toFixed(2) },
];

// Should the minimap draw a circle showing the equipped gun's range?
// (renderMiniMap in renderer.js checks this)
const lab = {
    showRangeOnMap: true,
};

// A copy of every gun's starting settings, so "Reset" can put them back.
// We copy just the values the lab can change (not the bullet pictures).
const LAB_DEFAULTS = WEAPONS.map(function (weapon) {
    const saved = { automatic: weapon.automatic };
    for (const setting of LAB_SETTINGS) {
        saved[setting.key] = labTarget(weapon, setting)[setting.key];
    }
    return saved;
});

// Settings live either on the gun or on its bullet - this finds the right one
function labTarget(weapon, setting) {
    return setting.part === "bullet" ? weapon.bullet : weapon;
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

    WEAPONS.forEach(function (weapon, index) {
        panel.appendChild(buildWeaponCard(weapon, index));
    });
}

function buildWeaponCard(weapon, index) {
    const card = document.createElement("section");
    card.className = "lab-card";
    card.dataset.weaponIndex = index;

    // --- Title ---
    const title = document.createElement("h2");
    title.textContent = weapon.name;
    card.appendChild(title);

    // Each slider gets an "update" function; Reset calls them all
    const refreshers = [];

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

    // --- One slider per setting ---
    for (const setting of LAB_SETTINGS) {
        const target = labTarget(weapon, setting);

        const row = document.createElement("label");
        row.className = "lab-row";

        const name = document.createElement("span");
        name.textContent = setting.label;

        const slider = document.createElement("input");
        slider.type = "range";
        slider.min = setting.min;
        slider.max = setting.max;
        slider.step = setting.step;
        slider.value = target[setting.key];

        const valueText = document.createElement("span");
        valueText.className = "lab-value";
        valueText.textContent = setting.show(target[setting.key]);

        // "input" fires continuously while dragging, so the gun
        // changes live as you slide
        slider.addEventListener("input", function () {
            target[setting.key] = Number(slider.value);
            valueText.textContent = setting.show(target[setting.key]);
            updateStats();
        });

        row.append(name, slider, valueText);
        card.appendChild(row);

        refreshers.push(function () {
            slider.value = target[setting.key];
            valueText.textContent = setting.show(target[setting.key]);
        });
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

    // --- Reset button ---
    const reset = document.createElement("button");
    reset.textContent = "Reset " + weapon.name;
    reset.addEventListener("click", function () {
        const saved = LAB_DEFAULTS[index];
        weapon.automatic = saved.automatic;
        for (const setting of LAB_SETTINGS) {
            labTarget(weapon, setting)[setting.key] = saved[setting.key];
        }
        refreshers.forEach(function (refresh) { refresh(); });
        reset.blur();
    });
    card.appendChild(reset);

    return card;
}

// Light up the card of the gun currently in your hands.
// Called every frame by the game loop (cheap: it only flips a class).
function updateGunLab() {
    const cards = document.querySelectorAll(".lab-card");
    cards.forEach(function (card) {
        card.classList.toggle("equipped", Number(card.dataset.weaponIndex) === currentWeapon);
    });
}

buildGunLab();
