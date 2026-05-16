// ============================================================
// QUEZ COFFEE CO. LLC — Drink Build Guide
// Source: F-01 Recipe Bible v2.0 / F-02 Recipe Cards v2.0
// Date locked: 2026-05-15
//
// Each drink declares:
//   - id (stable; orders/waste logs key on this — never renumber)
//   - name, category, prepType, buildTime, price12, price16
//   - ingredients per size (12oz, 16oz, or blended)
//   - buildSteps per prep mode (hot, iced, blended)
//   - allergens (display string), tip (one-liner)
//   - tags  → drives modifier gating in drinkModifiers.js
//
// House specs (apply to every drink):
//   - Espresso: 12oz = double (2oz), 16oz = triple (3oz)
//   - Hot milk: 8oz / 10oz steamed to 150°F (oat 140-145°F MAX)
//   - Iced milk: 5oz / 7oz cold (pre-measured pitcher, NEVER eyeball)
//   - Syrup pump = 1/4 oz · Sauce pump = 1/2 oz · House honey pump = 1/4 oz
//   - Hot-water dissolve REQUIRED for any cold drink with honey, lavender
//     honey, or strawberry puree (0.5oz for 1-2 pumps; 1oz for 3+ pumps).
//   - Iced build order: syrups → espresso → stir → milk → ice. Never ice first.
//     Exceptions: plain iced Americano, cold-brew drinks (ice after syrup
//     dissolve), Strawberry Lemonade (lemonade base before ice).
// ============================================================

export const drinkRecipes = [
  // ─── HONEY SIGNATURE LINE ────────────────────────────────────────────────
  {
    id: 'drk_01',
    name: 'Quez Honey Mocha',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 50s',
    price12: 6.95,
    price16: 7.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsHoney: true,
      containsCaramel: true,
      containsWhiteChocolate: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps white chocolate sauce (Ghirardelli)',
        '2 pumps honey syrup (house §3.1)',
        '1 pump caramel sauce (Ghirardelli)',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat 140-145°F, +$0.65)',
        'Caramel drizzle — one clean spiral pass on top',
      ],
      '16oz': [
        '3 pumps white chocolate sauce (Ghirardelli)',
        '3 pumps honey syrup (house §3.1)',
        '1 pump caramel sauce (Ghirardelli)',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Caramel drizzle — one clean spiral pass on top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump white chocolate, honey syrup, and caramel into cup',
        'Pull shot directly over syrups; stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso in a slow, controlled stream',
        'Caramel drizzle — one clean spiral pass on top',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump white chocolate, honey syrup, and caramel into cup',
        'Pull shot over syrups; stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz) — marked pitcher only',
        'Fill cup with ice to top',
        'Caramel drizzle — spiral on TOP of ice (cascades down the inside)',
        'Lid, straw, pass',
      ],
    },
    tip: 'FLAGSHIP. Most-ordered drink. The caramel drizzle is the visual signature — NEVER skip it.',
  },
  {
    id: 'drk_02',
    name: 'Hot Honey Spice Latte',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 55s · Iced: 45s',
    price12: 6.50,
    price16: 7.10,
    allergens: 'Dairy (default). Spicy — contains cayenne in the hot honey syrup.',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsHoney: true,
      containsCinnamon: true,
      // Cinnamon is BUILT INTO the syrup — extra-cinnamon pump is not the right ask.
      // Hot honey syrup carries the heat and the cinnamon. Extra hot-honey is the upgrade path.
    },
    ingredients: {
      '12oz': [
        '2 pumps hot honey syrup (house §3.2 — pre-built with cayenne & cinnamon)',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on finished foam',
      ],
      '16oz': [
        '3 pumps hot honey syrup (house §3.2)',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on finished foam',
      ],
    },
    buildSteps: {
      hot: [
        'Pump hot honey syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso',
        'Light cinnamon dust on finished foam',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump hot honey syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz)',
        'Fill cup with ice to top',
        'Light cinnamon dust on top of milk surface',
        'Lid, straw, pass',
      ],
    },
    tip: 'Cayenne and cinnamon are PRE-BUILT into the syrup. NEVER add loose cayenne. Spicier? Add ONE more pump of hot honey syrup — never sprinkle.',
  },
  {
    id: 'drk_03',
    name: 'Golden Bear Cold Brew',
    category: 'Honey Signature',
    prepType: 'Iced Only',
    buildTime: '40s',
    price12: 6.50,
    price16: 7.10,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: false,
      usesColdBrew: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: false,
      containsHoney: true,
      containsVanilla: true,
      containsCaramel: true, // salted caramel drizzle finish
    },
    ingredients: {
      '12oz': [
        '2 pumps honey syrup (house §3.1)',
        '1 pump vanilla syrup (Monin)',
        '1 oz hot water to dissolve syrups — MANDATORY',
        '8 oz cold brew concentrate (house §3.5)',
        '2 oz whole milk floated on top (or oat, +$0.65)',
        'Salted caramel drizzle — spiral on milk float',
      ],
      '16oz': [
        '3 pumps honey syrup (house §3.1)',
        '1 pump vanilla syrup (Monin)',
        '1 oz hot water to dissolve syrups — MANDATORY',
        '11 oz cold brew concentrate (house §3.5)',
        '2 oz whole milk floated on top (or oat, +$0.65)',
        'Salted caramel drizzle — spiral on milk float',
      ],
    },
    buildSteps: {
      iced: [
        'Pump honey syrup and vanilla syrup into cup',
        'Add 1 oz hot water, stir 15 seconds — syrups MUST fully dissolve',
        'Fill cup with ice to 3/4 mark',
        'Pour cold brew concentrate over ice (8 oz / 11 oz)',
        'Float 2 oz milk on top — slow pour over the back of a bar spoon',
        'Salted caramel drizzle — spiral on milk float',
        'Lid, straw, pass',
      ],
    },
    tip: 'Hot-water dissolve is MANDATORY. Cold brew alone will NOT dissolve honey — skipping = sweet bottom, bitter top. Milk float is the visual signature.',
  },
  {
    id: 'drk_04',
    name: 'Lavender Honey Fog Tea',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 55s · Iced: 45s',
    price12: 6.50,
    price16: 7.10,
    allergens: 'Dairy (default). Contains tea (Earl Grey / black tea). Oat milk recommended (no upcharge for this drink).',
    tags: {
      // TEA — no espresso, no cold brew. Milk-based, with milk substitution.
      usesEspresso: false,
      usesColdBrew: false,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: false,
      containsHoney: true,
      containsVanilla: true,
      containsLavender: true,
      containsTea: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps lavender honey syrup (house §3.3)',
        '0.5 pump vanilla syrup (Monin) — DO NOT EXCEED',
        '4 oz Earl Grey concentrate (house §3.4)',
        '6 oz oat milk steamed to 140-145°F (recommended) or whole milk',
        'Optional: small pinch culinary lavender garnish',
      ],
      '16oz': [
        '3 pumps lavender honey syrup (house §3.3)',
        '0.5 pump vanilla syrup (Monin) — DO NOT EXCEED',
        '5 oz Earl Grey concentrate (house §3.4)',
        '8 oz oat milk steamed to 140-145°F (recommended) or whole milk',
        'Optional: small pinch culinary lavender garnish',
      ],
    },
    buildSteps: {
      hot: [
        'Pump lavender honey syrup and vanilla syrup into cup',
        'Pour hot Earl Grey concentrate over syrups; stir 3 seconds',
        'Steam oat milk to 140-145°F (DO NOT exceed 145°F — scorches)',
        'Pour milk over tea mixture in a slow stream',
        'Optional: small pinch of culinary lavender on foam',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump lavender honey syrup and vanilla syrup into cup',
        'Pour chilled Earl Grey concentrate over syrups; stir 3 seconds',
        'Add cold milk: 4 oz (12oz) / 6 oz (16oz) — LESS than the espresso lattes',
        'Fill cup with ice to top',
        'Optional: small pinch of culinary lavender on top',
        'Lid, straw, pass',
      ],
    },
    tip: 'FOOD-GRADE culinary lavender only — never decorative. Earl Grey concentrate refreshes every 2 hours during service (set a timer). Vanilla at 0.5 pump is a rounding agent — more overwhelms the lavender.',
  },
  {
    id: 'drk_05',
    name: 'Honey Cinnamon Latte',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 50s · Iced: 45s',
    price12: 5.95,
    price16: 6.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsHoney: true,
      containsCinnamon: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps honey syrup (house §3.1)',
        '1/4 tsp ground cinnamon — MEASURED with measuring spoon',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on finished foam',
      ],
      '16oz': [
        '3 pumps honey syrup (house §3.1)',
        '1/4 tsp ground cinnamon — MEASURED with measuring spoon',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on finished foam',
      ],
    },
    buildSteps: {
      hot: [
        'Pump honey syrup into cup',
        'Pull shot, add 1/4 tsp MEASURED cinnamon to the shot',
        'Stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso',
        'Light cinnamon dust on finished foam',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump honey syrup into cup',
        'Pull shot, add 1/4 tsp MEASURED cinnamon to the shot',
        'Stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz)',
        'Fill cup with ice to top',
        'Light cinnamon dust on top of milk surface',
        'Lid, straw, pass',
      ],
    },
    tip: 'MEASURE the cinnamon — 1/4 tsp every time, never free-shake. Measuring spoon lives at the cinnamon station. Gateway drink for the honey line.',
  },
  {
    id: 'drk_06',
    name: 'Honey Cold Brew',
    category: 'Honey Signature',
    prepType: 'Iced Only',
    buildTime: '30s',
    price12: 4.95,
    price16: 5.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: false,
      usesColdBrew: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: false,
      containsHoney: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps honey syrup (house §3.1)',
        '0.5 oz hot water to dissolve syrup — MANDATORY',
        '9 oz cold brew concentrate (house §3.5)',
        '1 oz whole milk floated on top (or oat, +$0.65)',
      ],
      '16oz': [
        '3 pumps honey syrup (house §3.1)',
        '0.5 oz hot water to dissolve syrup — MANDATORY',
        '12 oz cold brew concentrate (house §3.5)',
        '1 oz whole milk floated on top (or oat, +$0.65)',
      ],
    },
    buildSteps: {
      iced: [
        'Pump honey syrup into cup',
        'Add 0.5 oz hot water, stir 10 seconds — syrup MUST fully dissolve',
        'Fill cup with ice to 3/4 mark',
        'Pour cold brew concentrate over ice (9 oz / 12 oz)',
        'Float 1 oz milk on top — slow pour over the back of a bar spoon',
        'Lid, straw, pass',
      ],
    },
    tip: 'Highest gross margin (81%) and the most loyalty-accelerating drink on the menu. Hot-water dissolve is MANDATORY — never skip.',
  },

  // ─── ESPRESSO CLASSIC LINE ───────────────────────────────────────────────
  {
    id: 'drk_07',
    name: 'Vanilla Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 45s · Iced: 45s',
    price12: 5.95,
    price16: 6.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsVanilla: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps vanilla syrup (Monin or Torani)',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
      ],
      '16oz': [
        '3 pumps vanilla syrup (Monin or Torani)',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
      ],
    },
    buildSteps: {
      hot: [
        'Pump vanilla syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump vanilla syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz)',
        'Fill cup with ice to top',
        'Lid, straw, pass',
      ],
    },
    tip: 'Espresso forward — 2 pumps standard (less sweet than chain coffee). Sweeter on request: add one more pump.',
  },
  {
    id: 'drk_08',
    name: 'Caramel Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 45s · Iced: 45s',
    price12: 5.95,
    price16: 6.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsCaramel: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps caramel syrup (Monin or Torani)',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Caramel drizzle — one spiral pass on top',
      ],
      '16oz': [
        '3 pumps caramel syrup (Monin or Torani)',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Caramel drizzle — one spiral pass on top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump caramel syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso',
        'Caramel drizzle — one spiral pass on top',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump caramel syrup into cup',
        'Pull shot over syrup; stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz)',
        'Fill cup with ice to top',
        'Caramel drizzle — spiral on TOP of ice (cascades down)',
        'Lid, straw, pass',
      ],
    },
    tip: 'Caramel drizzle is NON-NEGOTIABLE. 2 seconds. Separates this from a generic latte.',
  },
  {
    id: 'drk_09',
    name: 'Salted Caramel Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 50s · Iced: 50s',
    price12: 5.95,
    price16: 6.55,
    allergens: 'Dairy (default). Oat milk substitution available (+$0.65).',
    tags: {
      usesEspresso: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsCaramel: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps caramel syrup (Monin or Torani)',
        '1 pump salted caramel sauce (Ghirardelli)',
        'Double shot espresso (2 oz)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Salted caramel drizzle — one spiral pass on top',
        'Fine sea salt — small pinch ON TOP of drizzle (visible, do NOT stir in)',
      ],
      '16oz': [
        '3 pumps caramel syrup (Monin or Torani)',
        '1 pump salted caramel sauce (Ghirardelli)',
        'Triple shot espresso (3 oz)',
        '10 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Salted caramel drizzle — one spiral pass on top',
        'Fine sea salt — small pinch ON TOP of drizzle (visible, do NOT stir in)',
      ],
    },
    buildSteps: {
      hot: [
        'Pump caramel syrup AND salted caramel sauce into cup',
        'Pull shot over syrups; stir 3 seconds',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over espresso',
        'Salted caramel drizzle — one spiral pass on top',
        'Pinch of fine sea salt on TOP of drizzle — visible, do NOT stir in',
        'Lid, sleeve, pass',
      ],
      iced: [
        'Pump caramel syrup AND salted caramel sauce into cup',
        'Pull shot over syrups; stir 3 seconds',
        'Add cold milk: 5 oz (12oz) / 7 oz (16oz)',
        'Fill cup with ice to top',
        'Salted caramel drizzle — one spiral pass on top',
        'Pinch of fine sea salt on TOP of drizzle — visible, do NOT stir in',
        'Lid, straw, pass',
      ],
    },
    tip: 'Salt goes LAST. After the drizzle. VISIBLE on the finished drink. Stirring it in turns this into a regular Caramel Latte.',
  },
  {
    id: 'drk_10',
    name: 'Americano',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 20s · Iced: 25s (with honey: 35s)',
    price12: 3.95,
    price16: 4.55,
    allergens: 'None (default). If honey upsell added: contains honey.',
    tags: {
      usesEspresso: true,
      usesMilk: false, // no milk in the build; can be added by request but not standard
      usesIce: true,
      acceptsWhip: false,
      acceptsHoneyUpsell: true, // the prime upsell drink
    },
    ingredients: {
      '12oz': [
        'Double shot espresso (2 oz)',
        'Hot water — fill to within 1/2 inch of cup top',
        'OPTIONAL upsell: 1 pump honey syrup (+$0.45)',
      ],
      '16oz': [
        'Triple shot espresso (3 oz)',
        'Hot water — fill to within 1/2 inch of cup top',
        'OPTIONAL upsell: 2 pumps honey syrup (+$0.45)',
      ],
    },
    buildSteps: {
      hot: [
        'If honey upsell: pump honey syrup into cup FIRST',
        'Pull shot directly into cup (over syrup if applicable)',
        'Add hot water to fill — within 1/2 inch of cup top',
        'Stir briefly to integrate',
        'Lid, sleeve, pass',
      ],
      iced: [
        'NO HONEY: pull shot, fill ice to 3/4, add cold water to fill',
        'WITH HONEY: pump syrup, add 0.5 oz hot water, stir 10s to dissolve',
        '  → pull shot over dissolved syrup',
        '  → fill ice to 3/4, add cold water to fill',
        'Lid, straw, pass',
      ],
    },
    tip: '82% gross margin. ALWAYS offer the honey upsell — converts 90%+ to repeat customers. Honey on iced REQUIRES the hot-water dissolve.',
  },

  // ─── FRAPPE LINE ─────────────────────────────────────────────────────────
  {
    id: 'drk_11',
    name: 'Caramel Crunch Frappe',
    category: 'Frappe',
    prepType: 'Blended Only',
    buildTime: '90s',
    price12: 6.50,
    price16: 7.10,
    allergens: 'Dairy (default). Contains milk and dairy whipped cream.',
    tags: {
      usesEspresso: true, // OR cold brew — accepted as substitute
      usesColdBrew: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true, // whipped cream is the default finish
      containsCaramel: true,
      blendedOnly: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps caramel syrup (Monin)',
        '1 pump salted caramel sauce (Ghirardelli)',
        '2 oz espresso OR cold brew concentrate (§3.5)',
        '4 oz whole milk',
        '8 oz ice (~1 cup)',
        'Full whipped cream swirl on top',
        'Caramel drizzle — spiral over whipped cream',
        'Light raw sugar crunch sprinkle (optional but encouraged)',
      ],
      '16oz': [
        '3 pumps caramel syrup (Monin)',
        '2 pumps salted caramel sauce (Ghirardelli)',
        '3 oz espresso OR cold brew concentrate (§3.5)',
        '5 oz whole milk',
        '10 oz ice',
        'Full whipped cream swirl on top',
        'Caramel drizzle — spiral over whipped cream',
        'Light raw sugar crunch sprinkle (optional but encouraged)',
      ],
    },
    buildSteps: {
      blended: [
        'Add caramel syrup, salted caramel sauce, espresso (or cold brew), and milk to blender pitcher',
        'Add ice ON TOP of liquid — NEVER ice first (jams the blades)',
        'Blend HIGH 25-30 seconds — no ice chunks remaining',
        'Pour into cup',
        'Full whipped cream swirl on top',
        'Caramel drizzle — spiral over whipped cream',
        'Light raw sugar sprinkle (optional)',
        'Dome lid, straw, pass IMMEDIATELY — texture breaks within 60s',
      ],
    },
    tip: 'Pass within 60 seconds of blending or texture separates. Ice ALWAYS on top of liquid in the blender, never bottom. Raw sugar crunch is the signature finish.',
  },
  {
    id: 'drk_12',
    name: 'Mocha Frappe',
    category: 'Frappe',
    prepType: 'Blended Only',
    buildTime: '90s',
    price12: 6.50,
    price16: 7.10,
    allergens: 'Dairy (default). Contains milk and dairy whipped cream.',
    tags: {
      usesEspresso: true, // OR cold brew
      usesColdBrew: true,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: true,
      containsMocha: true,
      blendedOnly: true,
    },
    ingredients: {
      '12oz': [
        '3 pumps mocha sauce (Ghirardelli)',
        '2 oz espresso OR cold brew concentrate (§3.5)',
        '4 oz whole milk',
        '8 oz ice (~1 cup)',
        'Full whipped cream swirl on top',
        'Mocha drizzle — clean spiral over whipped cream',
      ],
      '16oz': [
        '4 pumps mocha sauce (Ghirardelli)',
        '3 oz espresso OR cold brew concentrate (§3.5)',
        '5 oz whole milk',
        '10 oz ice',
        'Full whipped cream swirl on top',
        'Mocha drizzle — clean spiral over whipped cream',
      ],
    },
    buildSteps: {
      blended: [
        'Add mocha sauce, espresso (or cold brew), and milk to blender pitcher',
        'Add ice ON TOP of liquid — never ice first',
        'Blend HIGH 25-30 seconds — no ice chunks remaining',
        'Pour into cup',
        'Full whipped cream swirl on top',
        'Mocha drizzle — clean spiral, not zigzag',
        'Dome lid, straw, pass IMMEDIATELY',
      ],
    },
    tip: 'Same 60-second pass window as Caramel Crunch. Mocha drizzle is a clean spiral, not a scribble.',
  },

  // ─── NON-COFFEE LINE ─────────────────────────────────────────────────────
  {
    id: 'drk_13',
    name: 'Drip Coffee',
    category: 'Non-Coffee',
    prepType: 'Hot Only',
    buildTime: '15s',
    price12: 3.50,
    price16: 4.10,
    allergens: 'None.',
    tags: {
      // Pour-and-go. No espresso, no milk in the build, no ice.
      // Cream and sugar are offered at the window as a separate gesture.
      usesEspresso: false,
      usesMilk: false,
      usesIce: false,
      acceptsWhip: false,
      isPourAndGo: true,
    },
    ingredients: {
      '12oz': [
        'Brewed drip coffee (house medium roast) — pour from labeled airpot',
      ],
      '16oz': [
        'Brewed drip coffee (house medium roast) — pour from labeled airpot',
      ],
    },
    buildSteps: {
      hot: [
        'Pour from labeled airpot into cup to within 1/2 inch of cup top',
        'Lid, sleeve, pass',
        'Offer cream and sugar at the window',
      ],
    },
    tip: '85% gross margin — highest on the menu. Brew every 60 min peak / 90 min off-peak. Discard after 90 minutes. Airpot MUST be labeled with brew time — if unknown, re-brew.',
  },
  {
    id: 'drk_14',
    name: 'Chai Latte',
    category: 'Non-Coffee',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 40s · Iced: 40s (with honey: 50s)',
    price12: 5.95,
    price16: 6.55,
    allergens: 'Dairy (default). Contains black tea. Oat milk substitution available (+$0.65). If honey upsell added: contains honey.',
    tags: {
      // CHAI — no espresso. Milk-based, with milk substitution.
      // Honey upsell is the #2-converted upsell on the menu.
      usesEspresso: false,
      usesColdBrew: false,
      usesMilk: true,
      usesIce: true,
      acceptsWhip: false,
      containsCinnamon: true,
      containsTea: true,
      acceptsHoneyUpsell: true,
    },
    ingredients: {
      '12oz': [
        '4 oz chai concentrate (Tazo or Oregon Chai)',
        '6 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on foam',
        'OPTIONAL upsell: 1 pump honey syrup (+$0.45)',
      ],
      '16oz': [
        '6 oz chai concentrate (Tazo or Oregon Chai)',
        '8 oz whole milk steamed to 150°F (or oat, +$0.65)',
        'Light cinnamon dust on foam',
        'OPTIONAL upsell: 2 pumps honey syrup (+$0.45)',
      ],
    },
    buildSteps: {
      hot: [
        'If honey upsell: pump honey syrup into cup FIRST',
        'Pour chai concentrate into cup (over honey if applicable)',
        'Steam milk to 150°F (oat 140-145°F)',
        'Pour milk over chai',
        'Light cinnamon dust on foam',
        'Lid, sleeve, pass',
      ],
      iced: [
        'NO HONEY: pour chilled chai concentrate; stir 3s; cold milk 4oz/6oz; ice; cinnamon dust',
        'WITH HONEY: pump syrup, 0.5 oz hot water, stir 10s to dissolve',
        '  → chilled chai concentrate over dissolved honey; stir 3s',
        '  → cold milk 4 oz (12oz) / 6 oz (16oz); ice to top; cinnamon dust',
        'Lid, straw, pass',
      ],
    },
    tip: 'LESS milk than the espresso lattes (chai concentrate fills more cup). Honey on iced Chai REQUIRES hot-water dissolve. Honey upsell on Chai is the #2-converted upsell — offer it every time.',
  },
  {
    id: 'drk_15',
    name: 'Strawberry Lemonade',
    category: 'Non-Coffee',
    prepType: 'Iced Only',
    buildTime: '30s',
    price12: 4.95,
    price16: 5.55,
    allergens: 'None (default). Contains strawberry and citrus.',
    tags: {
      // Pure refresher — no coffee, no tea, no milk. Only the customize note
      // and ice-amount tweak make sense. Modifier picker should reflect that.
      usesEspresso: false,
      usesColdBrew: false,
      usesMilk: false,
      usesIce: true,
      acceptsWhip: false,
      containsStrawberry: true,
      containsLemonade: true,
    },
    ingredients: {
      '12oz': [
        '2 pumps strawberry puree (Monin Wild Strawberry)',
        '0.5 oz warm water to dissolve puree — MANDATORY',
        '8 oz lemonade base concentrate',
        'Ice — fill to top after lemonade',
        'Optional: lemon wheel rim garnish',
      ],
      '16oz': [
        '3 pumps strawberry puree (Monin Wild Strawberry)',
        '0.5 oz warm water to dissolve puree — MANDATORY',
        '11 oz lemonade base concentrate',
        'Ice — fill to top after lemonade',
        'Optional: lemon wheel rim garnish',
      ],
    },
    buildSteps: {
      iced: [
        'Pump strawberry puree into cup',
        'Add 0.5 oz warm water, stir 10 seconds — puree MUST fully dissolve',
        'Pour lemonade base into cup, stir briefly',
        'Fill cup with ice to top',
        'Optional: lemon wheel on rim',
        'Lid, straw, pass',
      ],
    },
    tip: 'Warm-water dissolve is MANDATORY. Strawberry puree will NOT mix into cold lemonade — without it you get pure puree at the bottom and weak lemonade on top. Lemonade base goes in before ice.',
  },
];

export const DRINK_CATEGORIES = [
  { key: 'Honey Signature',  label: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' } },
  { key: 'Espresso Classic', label: { en: 'Espresso Classics',    es: 'Clásicos de Espresso' } },
  { key: 'Frappe',           label: { en: 'Frappes',              es: 'Frappés' } },
  { key: 'Non-Coffee',       label: { en: 'Non-Coffee',           es: 'Sin Café' } },
];

export const PREP_TYPE_COLORS = {
  'Hot & Iced':    '#D4AF37',
  'Iced Only':     '#7BB3F0',
  'Hot Only':      '#F07B7B',
  'Blended Only':  '#B37BF0',
};
