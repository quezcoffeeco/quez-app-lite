// ============================================================
// QUEZ COFFEE CO. LLC — Drink modifiers (customizations)
// Each modifier option declares a `requires` predicate that checks the
// selected drink's `tags` object. The Order picker calls visibleOptions()
// with the prep type AND the drink, and only renders options that match.
//
// Example: Strawberry Lemonade has no espresso and no milk, so the
// Espresso group and the Milk group both end up with zero visible
// options and the picker hides those groups entirely. Lemonade then
// shows just ice options + the free-text note field.
// ============================================================

export const MODIFIER_GROUPS = [
  {
    id: 'milk',
    label: { en: 'Milk', es: 'Leche' },
    multi: false,
    color: '#F5F0E8',
    requiresOnDrink: (drink) => !!drink?.tags?.usesMilk,
    options: [
      { id: 'milk_whole',  label: { en: 'Whole milk',  es: 'Leche entera' } },
      { id: 'milk_2pct',   label: { en: '2% milk',     es: 'Leche 2%' } },
      { id: 'milk_skim',   label: { en: 'Skim milk',   es: 'Leche descremada' } },
      { id: 'milk_oat',    label: { en: 'Oat milk',    es: 'Leche de avena' } },
      { id: 'milk_almond', label: { en: 'Almond milk', es: 'Leche de almendra' } },
      { id: 'milk_none',   label: { en: 'No milk',     es: 'Sin leche' } },
    ],
  },
  {
    id: 'espresso',
    label: { en: 'Espresso', es: 'Espresso' },
    multi: true,
    color: '#B07840',
    requiresOnDrink: (drink) => !!drink?.tags?.usesEspresso,
    options: [
      { id: 'shot_extra',     label: { en: 'Extra shot',  es: 'Shot extra' } },
      { id: 'shot_two_extra', label: { en: '2 extra shots', es: '2 shots extra' } },
      { id: 'shot_decaf',     label: { en: 'Decaf',       es: 'Descafeinado' } },
      { id: 'shot_half',      label: { en: 'Half-caf',    es: 'Mitad cafeína' } },
    ],
  },
  {
    id: 'extras',
    label: { en: 'Extras', es: 'Extras' },
    multi: true,
    color: '#D4AF37',
    requiresOnDrink: () => true, // group always shown if any sub-option applies
    options: [
      // Per-pump extras — only offered if the drink ALREADY contains that flavor.
      // (Adding a "pump of caramel" to a Lavender Fog wouldn't make sense.)
      { id: 'extra_honey',    label: { en: 'Extra pump honey',    es: 'Bomba extra de miel' },
        requires: (d) => !!d?.tags?.containsHoney || !!d?.tags?.acceptsHoneyUpsell },
      { id: 'extra_vanilla',  label: { en: 'Extra pump vanilla',  es: 'Bomba extra de vainilla' },
        requires: (d) => !!d?.tags?.containsVanilla },
      { id: 'extra_caramel',  label: { en: 'Extra pump caramel',  es: 'Bomba extra de caramelo' },
        requires: (d) => !!d?.tags?.containsCaramel },
      { id: 'extra_mocha',    label: { en: 'Extra pump mocha',    es: 'Bomba extra de mocha' },
        requires: (d) => !!d?.tags?.containsMocha },
      { id: 'extra_cinnamon', label: { en: 'Extra pump cinnamon', es: 'Bomba extra de canela' },
        requires: (d) => !!d?.tags?.containsCinnamon },
      { id: 'extra_lavender', label: { en: 'Extra pump lavender', es: 'Bomba extra de lavanda' },
        requires: (d) => !!d?.tags?.containsLavender },
      // Finishes — only offered if the drink can carry them
      { id: 'whip',           label: { en: 'Whipped cream',         es: 'Crema batida' },
        requires: (d) => !!d?.tags?.acceptsWhip },
      { id: 'honey_drizzle',  label: { en: 'Honey drizzle on top',  es: 'Drizzle de miel encima' },
        requires: (d) => !!d?.tags?.containsHoney || !!d?.tags?.acceptsHoneyUpsell },
      { id: 'caramel_drizzle',label: { en: 'Caramel drizzle on top',es: 'Drizzle de caramelo encima' },
        requires: (d) => !!d?.tags?.containsCaramel },
      { id: 'cinnamon_dust',  label: { en: 'Cinnamon dust on top',  es: 'Polvo de canela encima' },
        requires: (d) => !!d?.tags?.containsCinnamon || !!d?.tags?.containsTea },
    ],
  },
  {
    id: 'temp_ice',
    label: { en: 'Temp / Ice', es: 'Temperatura / Hielo' },
    multi: true,
    color: '#7BB3F0',
    requiresOnDrink: () => true,
    options: [
      { id: 'extra_hot',  label: { en: 'Extra hot',           es: 'Extra caliente' }, prep: ['hot'] },
      { id: 'kids_temp',  label: { en: 'Kids temp (≤150°F)',  es: 'Temp para niños (≤150°F)' }, prep: ['hot'] },
      { id: 'light_ice',  label: { en: 'Light ice',           es: 'Poco hielo' }, prep: ['iced', 'blended'] },
      { id: 'no_ice',     label: { en: 'No ice',              es: 'Sin hielo' },   prep: ['iced'] },
      { id: 'extra_ice',  label: { en: 'Extra ice',           es: 'Hielo extra' }, prep: ['iced', 'blended'] },
    ],
  },
];

// Look up an option's label by id. Custom one-off mods are prefixed "__custom__:".
export function getModLabel(id, lang = 'en') {
  if (typeof id === 'string' && id.startsWith('__custom__:')) {
    return id.slice('__custom__:'.length);
  }
  for (const g of MODIFIER_GROUPS) {
    const found = g.options.find((o) => o.id === id);
    if (found) return found.label[lang] || found.label.en;
  }
  return id;
}

// Visible options for a group given current prep type AND selected drink.
// An option is shown only if:
//   1. The drink satisfies the option's `requires` predicate (if defined)
//   2. The option's `prep` array includes the current prep (if defined)
export function visibleOptions(group, prep, drink) {
  return group.options.filter((o) => {
    if (o.requires && !o.requires(drink)) return false;
    if (o.prep && !o.prep.includes(prep)) return false;
    return true;
  });
}

// Visible groups for a drink. A group is hidden when:
//   - its requiresOnDrink predicate rejects the drink, OR
//   - it has zero visible options under the current prep
export function visibleGroups(prep, drink) {
  return MODIFIER_GROUPS.filter((g) => {
    if (g.requiresOnDrink && !g.requiresOnDrink(drink)) return false;
    return visibleOptions(g, prep, drink).length > 0;
  });
}
