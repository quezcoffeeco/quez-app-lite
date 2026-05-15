// Quez Coffee Co. — Drink Build Guide
// 15 menu drinks with full recipe cards
// Ingredient pump counts / volumes are reference defaults — update to match current recipe sheet

export const drinkRecipes = [
  // ─── HONEY SIGNATURE LINE ────────────────────────────────────────────────
  {
    id: 'drk_01',
    name: 'Quez Honey Mocha',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '1 pump mocha sauce',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '1.5 pumps mocha sauce',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump honey syrup + mocha sauce into cup',
        'Pull double espresso directly into cup',
        'Stir syrups and espresso together',
        'Steam milk and pour to top',
        'Honey drizzle on foam — must be visible',
      ],
      iced: [
        'Pump honey syrup + mocha sauce into cup',
        'Pull double espresso, pour over syrups',
        'Stir syrups and espresso',
        'Add ice',
        'Pour cold milk to top',
        'Honey drizzle on top',
      ],
    },
    tip: 'Our signature drink. The drizzle represents the brand — make it clean and visible.',
  },
  {
    id: 'drk_02',
    name: 'Hot Honey Spice Latte',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '1 pump cinnamon spice syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '1.5 pumps cinnamon spice syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump honey + spice syrup into cup',
        'Pull double espresso into cup',
        'Stir syrups and espresso',
        'Steam milk and pour to top',
        'Cinnamon dust on top of foam',
      ],
      iced: [
        'Pump honey + spice syrup into cup',
        'Pull double espresso, pour over syrups',
        'Stir',
        'Add ice',
        'Pour cold milk to top',
        'Cinnamon dust on top',
      ],
    },
    tip: 'Cinnamon dust goes on last — light hand, visible but not clumped.',
  },
  {
    id: 'drk_03',
    name: 'Golden Bear Cold Brew',
    category: 'Honey Signature',
    prepType: 'Iced Only',
    buildTime: '30s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '4 oz cold brew concentrate',
        'Milk to top',
        'Ice',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '5 oz cold brew concentrate',
        'Milk to top',
        'Ice',
      ],
    },
    buildSteps: {
      iced: [
        'Add ice to cup',
        'Pump honey syrup',
        'Pour cold brew concentrate over ice',
        'Stir honey and cold brew together',
        'Pour milk to top',
        'Honey drizzle on top',
      ],
    },
    tip: 'Cold brew is pre-brewed concentrate — dilute with milk only, never water.',
  },
  {
    id: 'drk_04',
    name: 'Lavender Honey Fog',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '1 pump lavender syrup',
        '2 shots espresso',
        'Steamed milk + foam to top',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '1.5 pumps lavender syrup',
        '2 shots espresso',
        'Steamed milk + foam to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump honey + lavender syrup into cup',
        'Pull double espresso into cup',
        'Stir syrups and espresso',
        'Steam milk with extra foam',
        'Pour milk, spoon foam layer on top',
        'Light honey drizzle over foam',
      ],
      iced: [
        'Pump honey + lavender syrup into cup',
        'Pull double espresso, pour over syrups',
        'Stir',
        'Add ice',
        'Pour cold milk, finish with cold foam layer',
        'Light honey drizzle',
      ],
    },
    tip: 'The "fog" is the foam layer on top — foam must be present. It defines the drink.',
  },
  {
    id: 'drk_05',
    name: 'Honey Cinnamon Latte',
    category: 'Honey Signature',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '0.5 pump cinnamon syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '1 pump cinnamon syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump honey + cinnamon syrup into cup',
        'Pull double espresso into cup',
        'Stir',
        'Steam milk and pour to top',
        'Cinnamon dust on foam',
      ],
      iced: [
        'Pump honey + cinnamon syrup into cup',
        'Pull double espresso, pour over syrups',
        'Stir',
        'Add ice',
        'Pour cold milk to top',
        'Cinnamon dust on top',
      ],
    },
    tip: 'Light on the cinnamon syrup — honey leads, cinnamon accents. Do not over-pump.',
  },
  {
    id: 'drk_06',
    name: 'Honey Cold Brew',
    category: 'Honey Signature',
    prepType: 'Iced Only',
    buildTime: '30s',
    ingredients: {
      '12oz': [
        '2 pumps honey syrup',
        '4 oz cold brew concentrate',
        'Milk to top',
        'Ice',
      ],
      '16oz': [
        '3 pumps honey syrup',
        '5 oz cold brew concentrate',
        'Milk to top',
        'Ice',
      ],
    },
    buildSteps: {
      iced: [
        'Add ice to cup',
        'Pump honey syrup',
        'Pour cold brew concentrate',
        'Stir to combine',
        'Milk to top',
        'Honey drizzle on top',
      ],
    },
    tip: 'Pure honey cold brew — no additional flavoring. Stir before handing to customer.',
  },
  // ─── ESPRESSO CLASSICS ───────────────────────────────────────────────────
  {
    id: 'drk_07',
    name: 'Vanilla Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps vanilla syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
      '16oz': [
        '3 pumps vanilla syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump vanilla into cup',
        'Pull double espresso into cup',
        'Stir',
        'Steam milk and pour to top',
      ],
      iced: [
        'Pump vanilla into cup',
        'Pull double espresso, pour over syrup',
        'Stir',
        'Add ice',
        'Pour cold milk to top',
      ],
    },
    tip: 'Standard build — get it consistent every time. This is the baseline training drink.',
  },
  {
    id: 'drk_08',
    name: 'Caramel Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps caramel syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
        'Caramel drizzle on top',
      ],
      '16oz': [
        '3 pumps caramel syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
        'Caramel drizzle on top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump caramel into cup',
        'Pull double espresso into cup',
        'Stir',
        'Steam milk and pour to top',
        'Caramel drizzle on foam',
      ],
      iced: [
        'Pump caramel into cup',
        'Pull double espresso, pour over syrup',
        'Stir',
        'Add ice',
        'Pour cold milk to top',
        'Caramel drizzle on top',
      ],
    },
    tip: 'Drizzle goes on last — cross pattern or spiral. Clean presentation required.',
  },
  {
    id: 'drk_09',
    name: 'Salted Caramel Latte',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 60s · Iced: 45s',
    ingredients: {
      '12oz': [
        '2 pumps salted caramel syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
        'Caramel drizzle on top',
      ],
      '16oz': [
        '3 pumps salted caramel syrup',
        '2 shots espresso',
        'Steamed or cold milk to top',
        'Caramel drizzle on top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump salted caramel into cup',
        'Pull double espresso into cup',
        'Stir',
        'Steam milk and pour to top',
        'Caramel drizzle on foam',
      ],
      iced: [
        'Pump salted caramel into cup',
        'Pull double espresso, pour over syrup',
        'Stir',
        'Add ice',
        'Pour cold milk to top',
        'Caramel drizzle on top',
      ],
    },
    tip: 'If using separate salt: small pinch only. Over-salting ruins the drink.',
  },
  {
    id: 'drk_10',
    name: 'Americano',
    category: 'Espresso Classic',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 45s · Iced: 30s',
    ingredients: {
      '12oz': [
        '2 shots espresso',
        'Hot or cold water to fill',
      ],
      '16oz': [
        '3 shots espresso',
        'Hot or cold water to fill',
      ],
    },
    buildSteps: {
      hot: [
        'Pull espresso into cup',
        'Add hot water — pour over shot, do not pour water first',
        'No milk, no syrup unless customer requests',
      ],
      iced: [
        'Add ice to cup',
        'Pull espresso over ice',
        'Add cold water to top',
        'No milk unless customer requests',
      ],
    },
    tip: 'Hot americano: shots first, water second — never reverse. Preserves the crema.',
  },
  // ─── FRAPPES ─────────────────────────────────────────────────────────────
  {
    id: 'drk_11',
    name: 'Caramel Crunch Frappe',
    category: 'Frappe',
    prepType: 'Blended Only',
    buildTime: '90s',
    ingredients: {
      '12oz': [
        '2 pumps caramel syrup',
        '2 oz cold brew or double espresso',
        '4 oz milk',
        '1 cup ice',
        'Whipped cream on top',
        'Caramel drizzle',
        'Caramel crunch topping',
      ],
      '16oz': [
        '3 pumps caramel syrup',
        '2 oz cold brew or double espresso',
        '6 oz milk',
        '1.5 cups ice',
        'Whipped cream on top',
        'Caramel drizzle',
        'Caramel crunch topping',
      ],
    },
    buildSteps: {
      blended: [
        'Add caramel syrup + milk + espresso/cold brew to blender',
        'Add ice',
        'Blend until smooth — about 15 seconds',
        'Pour into cup',
        'Whipped cream to top of cup',
        'Caramel drizzle on whipped cream',
        'Caramel crunch on top',
      ],
    },
    tip: 'Blender clearance required. Blend fully — no ice chunks. Top generously.',
  },
  {
    id: 'drk_12',
    name: 'Mocha Frappe',
    category: 'Frappe',
    prepType: 'Blended Only',
    buildTime: '90s',
    ingredients: {
      '12oz': [
        '2 pumps mocha sauce',
        '2 oz cold brew or double espresso',
        '4 oz milk',
        '1 cup ice',
        'Whipped cream on top',
        'Chocolate drizzle',
      ],
      '16oz': [
        '3 pumps mocha sauce',
        '2 oz cold brew or double espresso',
        '6 oz milk',
        '1.5 cups ice',
        'Whipped cream on top',
        'Chocolate drizzle',
      ],
    },
    buildSteps: {
      blended: [
        'Add mocha sauce + milk + espresso/cold brew to blender',
        'Add ice',
        'Blend until smooth',
        'Pour into cup',
        'Whipped cream on top',
        'Chocolate drizzle on whipped cream',
      ],
    },
    tip: 'Same technique as Caramel Crunch. Consistent blend texture = no watery result.',
  },
  // ─── VOLUME & NON-COFFEE ─────────────────────────────────────────────────
  {
    id: 'drk_13',
    name: 'Drip Coffee',
    category: 'Volume & Non-Coffee',
    prepType: 'Hot Only',
    buildTime: '15s',
    ingredients: {
      '12oz': [
        'Pre-brewed drip coffee from air pot',
        'Cream / sugar per customer request (optional)',
      ],
      '16oz': [
        'Pre-brewed drip coffee from air pot',
        'Cream / sugar per customer request (optional)',
      ],
    },
    buildSteps: {
      hot: [
        'Verify coffee was brewed within the last 2 hours',
        'If over 2 hours old: brew a fresh pot and notify owner',
        'Pour from air pot into cup',
        'Ask customer: "Room for cream?"',
      ],
    },
    tip: 'Fastest drink on the menu. Never serve stale coffee — freshness window is 2 hours.',
  },
  {
    id: 'drk_14',
    name: 'Chai Latte',
    category: 'Volume & Non-Coffee',
    prepType: 'Hot & Iced',
    buildTime: 'Hot: 45s · Iced: 30s',
    ingredients: {
      '12oz': [
        '3 pumps chai concentrate',
        'Steamed or cold milk to top',
      ],
      '16oz': [
        '4 pumps chai concentrate',
        'Steamed or cold milk to top',
      ],
    },
    buildSteps: {
      hot: [
        'Pump chai concentrate into cup',
        'Steam milk and pour to top',
        'Light cinnamon dust on foam',
      ],
      iced: [
        'Pump chai concentrate into cup',
        'Add ice',
        'Pour cold milk to top',
        'Cinnamon dust on top',
      ],
    },
    tip: 'No espresso — this is a non-coffee drink. Common mistake. Confirm if customer is unsure.',
  },
  {
    id: 'drk_15',
    name: 'Strawberry Lemonade',
    category: 'Volume & Non-Coffee',
    prepType: 'Iced Only',
    buildTime: '30s',
    ingredients: {
      '12oz': [
        '2 pumps strawberry syrup',
        '3 oz lemonade mix',
        'Cold water to top',
        'Ice',
      ],
      '16oz': [
        '3 pumps strawberry syrup',
        '4 oz lemonade mix',
        'Cold water to top',
        'Ice',
      ],
    },
    buildSteps: {
      iced: [
        'Add ice to cup',
        'Pump strawberry syrup',
        'Pour lemonade mix over ice',
        'Fill with cold water and stir',
      ],
    },
    tip: 'No espresso, no milk. Pure refresher. Keep lemonade mix cold. Stir before serving.',
  },
];

export const DRINK_CATEGORIES = [
  { key: 'Honey Signature',       label: { en: 'Honey Signature Line',   es: 'Línea Signature de Miel' } },
  { key: 'Espresso Classic',      label: { en: 'Espresso Classics',       es: 'Clásicos de Espresso' } },
  { key: 'Frappe',                label: { en: 'Frappes',                  es: 'Frappés' } },
  { key: 'Volume & Non-Coffee',   label: { en: 'Volume & Non-Coffee',     es: 'Volumen y Sin Café' } },
];

export const PREP_TYPE_COLORS = {
  'Hot & Iced':    '#D4AF37',
  'Iced Only':     '#7BB3F0',
  'Hot Only':      '#F07B7B',
  'Blended Only':  '#B37BF0',
};
