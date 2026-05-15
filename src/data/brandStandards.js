// Quez Coffee Co. — Daily brand standard rotator
// One short, action-oriented reminder pulled from the training material.
// A date hash picks one per day so everyone on the team sees the same line.

export const BRAND_STANDARDS = [
  {
    en: 'Pull-up to hand-off in 3 minutes. Speed AND quality — never one at the expense of the other.',
    es: 'Llegada a entrega en 3 minutos. Velocidad Y calidad — nunca una a costa de la otra.',
  },
  {
    en: 'Honey SYRUP — never raw honey in cold liquid. Raw honey clumps.',
    es: 'JARABE de miel — nunca miel cruda en líquido frío. La miel cruda hace grumos.',
  },
  {
    en: 'Three pillars: VETERAN-OWNED · HONEY-CRAFTED · COMMUNITY-ROOTED. Live them at the window.',
    es: 'Tres pilares: PROPIEDAD DE VETERANO · ELABORADO CON MIEL · ARRAIGADO EN LA COMUNIDAD.',
  },
  {
    en: 'TCS at 41°F or below. Read the fridge every opening. Above 41°F? Call the owner before serving.',
    es: 'TCS a 41°F o menos. Lee el refrigerador cada apertura. ¿Sobre 41°F? Llama al dueño antes de servir.',
  },
  {
    en: 'First-time customer? Mention the Iowa wildflower honey. That\'s our story.',
    es: '¿Cliente nuevo? Menciona la miel silvestre de Iowa. Esa es nuestra historia.',
  },
  {
    en: 'Hesitant customer? Recommend the Quez Honey Mocha. That\'s our flagship.',
    es: '¿Cliente indeciso? Recomienda el Quez Honey Mocha. Esa es nuestra bebida insignia.',
  },
  {
    en: '20-second handwash, 100°F water minimum. Sanitizer gel is NOT a substitute.',
    es: 'Lávate 20 segundos, agua a 100°F mínimo. El gel sanitizante NO es sustituto.',
  },
  {
    en: 'Build sequence: syrups → shot → stir → milk → ice. In that order, every time.',
    es: 'Secuencia: jarabes → shot → revolver → leche → hielo. En ese orden, siempre.',
  },
  {
    en: 'Customer complaint? (1) apologize, (2) remake, (3) log if Severity-2+. No defensiveness.',
    es: '¿Queja? (1) discúlpate, (2) rehaz, (3) registra si es Gravedad 2+. Sin defensiva.',
  },
  {
    en: 'Drip coffee — 90-minute hold limit. Past 90? Discard and brew fresh.',
    es: 'Café de filtro — límite de 90 minutos. ¿Más de 90? Desecha y prepara fresco.',
  },
  {
    en: 'Stamp the loyalty card at every transaction. Names turn walk-ins into dailies.',
    es: 'Sella la tarjeta de lealtad en cada transacción. Los nombres convierten ocasionales en habituales.',
  },
  {
    en: 'Vomiting, diarrhea, or jaundice? Do not come to work. Call the owner. Zero pressure.',
    es: '¿Vómitos, diarrea o ictericia? No vengas a trabajar. Llama al dueño. Sin presión.',
  },
  {
    en: 'Sanitizer: 50–100 ppm chlorine. Test every morning. Log the ppm.',
    es: 'Sanitizante: 50–100 ppm de cloro. Prueba cada mañana. Registra el ppm.',
  },
  {
    en: 'Never apologize for the price. Our Iowa honey story buys the premium. Deliver it.',
    es: 'Nunca te disculpes por el precio. Nuestra historia de la miel de Iowa lo justifica.',
  },
  {
    en: 'Two suppliers for honey, always. We are never single-sourced.',
    es: 'Dos proveedores de miel, siempre. Nunca dependemos de uno solo.',
  },
];

// Pick today's standard (deterministic — everyone sees the same one all day).
export function getTodayBrandStandard() {
  const d = new Date();
  const seed = d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
  const idx = seed % BRAND_STANDARDS.length;
  return BRAND_STANDARDS[idx];
}
