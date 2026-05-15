// Quez Coffee Co. — Drink modifiers (customizations)
// Used by the Take Order picker to let baristas record substitutions/extras.

export const MODIFIER_GROUPS = [
  {
    id: 'milk',
    label: { en: 'Milk', es: 'Leche' },
    multi: false, // pick one milk substitution
    color: '#F5F0E8',
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
    options: [
      { id: 'shot_extra',  label: { en: 'Extra shot',  es: 'Shot extra' } },
      { id: 'shot_two_extra', label: { en: '2 extra shots', es: '2 shots extra' } },
      { id: 'shot_decaf',  label: { en: 'Decaf',       es: 'Descafeinado' } },
      { id: 'shot_half',   label: { en: 'Half-caf',    es: 'Mitad cafeína' } },
    ],
  },
  {
    id: 'extras',
    label: { en: 'Extras', es: 'Extras' },
    multi: true,
    color: '#D4AF37',
    options: [
      { id: 'extra_honey',    label: { en: 'Extra pump honey',    es: 'Bomba extra de miel' } },
      { id: 'extra_vanilla',  label: { en: 'Extra pump vanilla',  es: 'Bomba extra de vainilla' } },
      { id: 'extra_caramel',  label: { en: 'Extra pump caramel',  es: 'Bomba extra de caramelo' } },
      { id: 'extra_mocha',    label: { en: 'Extra pump mocha',    es: 'Bomba extra de mocha' } },
      { id: 'extra_cinnamon', label: { en: 'Extra pump cinnamon', es: 'Bomba extra de canela' } },
      { id: 'extra_lavender', label: { en: 'Extra pump lavender', es: 'Bomba extra de lavanda' } },
      { id: 'whip',           label: { en: 'Whipped cream',       es: 'Crema batida' } },
      { id: 'honey_drizzle',  label: { en: 'Honey drizzle on top', es: 'Drizzle de miel encima' } },
      { id: 'caramel_drizzle',label: { en: 'Caramel drizzle on top', es: 'Drizzle de caramelo encima' } },
      { id: 'cinnamon_dust',  label: { en: 'Cinnamon dust on top', es: 'Polvo de canela encima' } },
    ],
  },
  {
    id: 'temp_ice',
    label: { en: 'Temp / Ice', es: 'Temperatura / Hielo' },
    multi: true,
    color: '#7BB3F0',
    options: [
      // Hot-only
      { id: 'extra_hot',  label: { en: 'Extra hot',           es: 'Extra caliente' }, prep: ['hot'] },
      { id: 'kids_temp',  label: { en: 'Kids temp (≤150°F)',  es: 'Temp para niños (≤150°F)' }, prep: ['hot'] },
      // Iced/Blended
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

// Get visible options for a group given current prep type
export function visibleOptions(group, prep) {
  return group.options.filter((o) => {
    if (!o.prep) return true;          // no prep restriction
    return o.prep.includes(prep);      // include only if prep matches
  });
}
