// ============================================================
// QUEZ APP LITE — Checklist Items Data
// Source: E-02 Operational Checklists v1.0
// Covers: Opening, Mid-Service, Closing sections
// ============================================================

// Item types:
//   'check'   — simple yes/no checkbox
//   'temp'    — numeric temperature input with min/max range
//   'ppm'     — numeric ppm input with min/max range
//   'text'    — free-text input (no range validation)
//   'time'    — time input field

// For 'temp' and 'ppm': min/max define the ACCEPTABLE range.
// Any value outside triggers a red flag + corrective action required.

export const OPENING_ITEMS = [
  // ── OPENING CHECKS ──────────────────────────────────────
  {
    section: 'opening_checks',
    sectionLabel: 'Opening Checks',
    sectionLabelEs: 'Verificaciones de Apertura',
    items: [
      {
        id: 'open_time',
        type: 'time',
        label: 'Open time (actual)',
        labelEs: 'Hora de apertura (real)',
        note: '',
        noteEs: '',
      },
      {
        id: 'fresh_water_tank',
        type: 'check',
        label: 'Fresh water tank — filled',
        labelEs: 'Tanque de agua fresca — lleno',
        note: 'FDA § 5-101.11',
        noteEs: 'FDA § 5-101.11',
      },
      {
        id: 'waste_water_tank',
        type: 'check',
        label: 'Waste water tank — empty',
        labelEs: 'Tanque de aguas residuales — vacío',
        note: 'FDA § 5-402.14',
        noteEs: 'FDA § 5-402.14',
      },
      {
        id: 'refrigerator_temp_open',
        type: 'temp',
        label: 'Refrigerator temp (°F)',
        labelEs: 'Temperatura del refrigerador (°F)',
        note: 'Must be ≤41°F — FDA § 3-501.16',
        noteEs: 'Debe ser ≤41°F — FDA § 3-501.16',
        min: 0,
        max: 41,
        unit: '°F',
      },
      {
        id: 'milk_temp_open',
        type: 'temp',
        label: 'Milk temp (°F)',
        labelEs: 'Temperatura de la leche (°F)',
        note: 'Must be ≤41°F — FDA § 3-501.16',
        noteEs: 'Debe ser ≤41°F — FDA § 3-501.16',
        min: 0,
        max: 41,
        unit: '°F',
      },
      {
        id: 'cold_brew_temp_open',
        type: 'temp',
        label: 'Cold brew temp (°F)',
        labelEs: 'Temperatura del cold brew (°F)',
        note: 'Must be ≤41°F',
        noteEs: 'Debe ser ≤41°F',
        min: 0,
        max: 41,
        unit: '°F',
      },
      {
        id: 'ice_machine',
        type: 'check',
        label: 'Ice machine — clean & producing',
        labelEs: 'Máquina de hielo — limpia y produciendo',
        note: '',
        noteEs: '',
      },
      {
        id: 'espresso_machine_warmup',
        type: 'check',
        label: 'Espresso machine — purge & warm-up',
        labelEs: 'Máquina de espresso — purga y calentamiento',
        note: '',
        noteEs: '',
      },
      {
        id: 'grinders',
        type: 'check',
        label: 'Grinders — calibrated & clean',
        labelEs: 'Molinos — calibrados y limpios',
        note: '',
        noteEs: '',
      },
      {
        id: 'pos_system',
        type: 'check',
        label: 'POS system — on & configured',
        labelEs: 'Sistema POS — encendido y configurado',
        note: '',
        noteEs: '',
      },
      {
        id: 'generator',
        type: 'check',
        label: 'Generator — running, fuel level OK',
        labelEs: 'Generador — funcionando, nivel de combustible OK',
        note: '',
        noteEs: '',
      },
      {
        id: 'test_drink',
        type: 'check',
        label: 'Test drink pulled & tasted',
        labelEs: 'Bebida de prueba preparada y probada',
        note: '',
        noteEs: '',
      },
    ],
  },

  // ── SANITIZER & WATER ────────────────────────────────────
  {
    section: 'sanitizer_water',
    sectionLabel: 'Sanitizer & Water',
    sectionLabelEs: 'Sanitizante y Agua',
    items: [
      {
        id: 'sanitizer_ppm_open',
        type: 'ppm',
        label: 'Sanitizer concentration (ppm)',
        labelEs: 'Concentración del sanitizante (ppm)',
        note: 'Target: 50–100 ppm chlorine',
        noteEs: 'Objetivo: 50–100 ppm cloro',
        min: 50,
        max: 100,
        unit: 'ppm',
      },
      {
        id: 'test_strip',
        type: 'check',
        label: 'Test strip used',
        labelEs: 'Tira de prueba utilizada',
        note: '',
        noteEs: '',
      },
      {
        id: 'handwash_temp',
        type: 'temp',
        label: 'Handwash water temp (°F)',
        labelEs: 'Temperatura del agua para lavado de manos (°F)',
        note: 'Must be ≥100°F — FDA § 5-202.12',
        noteEs: 'Debe ser ≥100°F — FDA § 5-202.12',
        min: 100,
        max: 212,
        unit: '°F',
      },
      {
        id: 'three_comp_sink_open',
        type: 'check',
        label: '3-comp sink — wash/rinse/sanitize set up',
        labelEs: 'Fregadero de 3 compartimentos — configurado',
        note: 'FDA § 4-301.12',
        noteEs: 'FDA § 4-301.12',
      },
      {
        id: 'sanitizer_bucket',
        type: 'check',
        label: 'Sanitizer bucket — wiping cloths in solution',
        labelEs: 'Cubeta de sanitizante — trapos en solución',
        note: 'FDA § 3-304.14',
        noteEs: 'FDA § 3-304.14',
      },
      {
        id: 'hand_soap',
        type: 'check',
        label: 'Hand soap at sink — stocked',
        labelEs: 'Jabón de manos en el lavabo — abastecido',
        note: 'FDA § 6-301.11',
        noteEs: 'FDA § 6-301.11',
      },
      {
        id: 'paper_towels',
        type: 'check',
        label: 'Paper towels at sink — stocked',
        labelEs: 'Toallas de papel en el lavabo — abastecidas',
        note: 'FDA § 6-301.12',
        noteEs: 'FDA § 6-301.12',
      },
    ],
  },

  // ── FOOD SAFETY TEMPS ────────────────────────────────────
  {
    section: 'food_safety_temps',
    sectionLabel: 'Food Safety — Temps',
    sectionLabelEs: 'Seguridad Alimentaria — Temperaturas',
    items: [
      {
        id: 'steamed_milk_temp',
        type: 'temp',
        label: 'Steamed milk temp — first drink (°F)',
        labelEs: 'Temperatura de la leche vaporizada — primera bebida (°F)',
        note: 'Target: 145–155°F',
        noteEs: 'Objetivo: 145–155°F',
        min: 145,
        max: 155,
        unit: '°F',
      },
      {
        id: 'espresso_shot_temp',
        type: 'temp',
        label: 'Espresso shot temp (°F)',
        labelEs: 'Temperatura del shot de espresso (°F)',
        note: '',
        noteEs: '',
        min: 185,
        max: 205,
        unit: '°F',
      },
      {
        id: 'cold_brew_pulled_temp',
        type: 'temp',
        label: 'Cold brew pulled temp (°F)',
        labelEs: 'Temperatura del cold brew servido (°F)',
        note: 'Must be ≤41°F',
        noteEs: 'Debe ser ≤41°F',
        min: 0,
        max: 41,
        unit: '°F',
      },
      {
        id: 'honey_syrup_labeled',
        type: 'check',
        label: 'Honey syrup batch — labeled & dated',
        labelEs: 'Lote de almíbar de miel — etiquetado y fechado',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'hot_honey_labeled',
        type: 'check',
        label: 'Hot honey syrup — labeled & dated',
        labelEs: 'Almíbar de miel picante — etiquetado y fechado',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'earl_grey_brewed',
        type: 'check',
        label: 'Earl Grey concentrate — brewed, time noted',
        labelEs: 'Concentrado de Earl Grey — preparado, hora anotada',
        note: '2-hr hold limit',
        noteEs: 'Límite de retención: 2 horas',
      },
      {
        id: 'syrups_use_by',
        type: 'check',
        label: 'All syrups checked for use-by date',
        labelEs: 'Todos los almíbares verificados con fecha de uso',
        note: '',
        noteEs: '',
      },
      {
        id: 'cold_brew_date',
        type: 'check',
        label: 'Cold brew — brew date verified within 7 days',
        labelEs: 'Cold brew — fecha de preparación verificada (7 días)',
        note: '',
        noteEs: '',
      },
      {
        id: 'drip_coffee_time',
        type: 'check',
        label: 'Drip coffee — batch time written on airpot',
        labelEs: 'Café de goteo — hora del lote escrita en el termo',
        note: '90-min hold limit',
        noteEs: 'Límite de retención: 90 minutos',
      },
    ],
  },
];

// ============================================================
// MID-SERVICE SECTION (complete at 10:00 AM)
// ============================================================
export const MID_SERVICE_ITEMS = [
  {
    section: 'mid_service',
    sectionLabel: 'Mid-Service Checks',
    sectionLabelEs: 'Verificaciones de Medio Servicio',
    note: 'Complete at 10:00 AM',
    noteEs: 'Completar a las 10:00 AM',
    items: [
      {
        id: 'refrigerator_temp_mid',
        type: 'temp',
        label: 'Refrigerator temp mid-shift (°F)',
        labelEs: 'Temperatura del refrigerador — mitad del turno (°F)',
        note: '≤41°F — FDA § 3-501.16',
        noteEs: '≤41°F — FDA § 3-501.16',
        min: 0,
        max: 41,
        unit: '°F',
      },
      {
        id: 'sanitizer_ppm_mid',
        type: 'ppm',
        label: 'Sanitizer concentration re-check (ppm)',
        labelEs: 'Reverificación de concentración de sanitizante (ppm)',
        note: '50–100 ppm chlorine',
        noteEs: '50–100 ppm cloro',
        min: 50,
        max: 100,
        unit: 'ppm',
      },
      {
        id: 'earl_grey_refreshed',
        type: 'check',
        label: 'Earl Grey concentrate — refreshed if 2 hrs old',
        labelEs: 'Concentrado de Earl Grey — renovado si tiene 2 horas',
        note: '2-hr hold limit',
        noteEs: 'Límite de retención: 2 horas',
      },
      {
        id: 'drip_coffee_replaced',
        type: 'check',
        label: 'Drip coffee — batch replaced if 90 min old',
        labelEs: 'Café de goteo — reemplazado si tiene 90 minutos',
        note: '90-min hold limit',
        noteEs: 'Límite de retención: 90 minutos',
      },
      {
        id: 'surfaces_mid',
        type: 'check',
        label: 'Work surfaces — wiped & sanitized',
        labelEs: 'Superficies de trabajo — limpias y sanitizadas',
        note: 'FDA § 4-601.11',
        noteEs: 'FDA § 4-601.11',
      },
      {
        id: 'cups_restocked',
        type: 'check',
        label: 'Cups/lids/straws — restocked',
        labelEs: 'Vasos/tapas/popotes — reabastecidos',
        note: '',
        noteEs: '',
      },
    ],
  },
];

// ============================================================
// CLOSING SECTION
// ============================================================
export const CLOSING_ITEMS = [
  // ── CLOSING CHECKS ───────────────────────────────────────
  {
    section: 'closing_checks',
    sectionLabel: 'Closing Checks',
    sectionLabelEs: 'Verificaciones de Cierre',
    items: [
      {
        id: 'close_time',
        type: 'time',
        label: 'Close time (actual)',
        labelEs: 'Hora de cierre (real)',
        note: '',
        noteEs: '',
      },
      {
        id: 'food_stored',
        type: 'check',
        label: 'All food items stored or discarded',
        labelEs: 'Todos los alimentos almacenados o desechados',
        note: '',
        noteEs: '',
      },
      {
        id: 'espresso_backflush',
        type: 'check',
        label: 'Espresso machine — backflush & clean',
        labelEs: 'Máquina de espresso — retrolavado y limpieza',
        note: '',
        noteEs: '',
      },
      {
        id: 'steam_wands',
        type: 'check',
        label: 'Steam wands — purged & wiped',
        labelEs: 'Lanzas de vapor — purgadas y limpias',
        note: '',
        noteEs: '',
      },
      {
        id: 'three_comp_sink_close',
        type: 'check',
        label: '3-comp sink — washed, rinsed, sanitized, drained',
        labelEs: 'Fregadero de 3 compartimentos — lavado, enjuagado, sanitizado, drenado',
        note: 'FDA § 4-501.114',
        noteEs: 'FDA § 4-501.114',
      },
      {
        id: 'fresh_water_top_off',
        type: 'check',
        label: 'Fresh water tank — top off for next day',
        labelEs: 'Tanque de agua fresca — rellenado para el día siguiente',
        note: '',
        noteEs: '',
      },
      {
        id: 'waste_water_dumped',
        type: 'check',
        label: 'Waste water tank — dumped at approved site',
        labelEs: 'Tanque de aguas residuales — vaciado en sitio aprobado',
        note: 'FDA § 5-402.15',
        noteEs: 'FDA § 5-402.15',
      },
      {
        id: 'waste_dump_site',
        type: 'text',
        label: 'Waste dump site used (location)',
        labelEs: 'Sitio de descarga utilizado (ubicación)',
        note: 'Required for DIAL compliance',
        noteEs: 'Requerido para cumplimiento DIAL',
      },
      {
        id: 'trash_removed',
        type: 'check',
        label: 'Trash — removed from trailer',
        labelEs: 'Basura — retirada del trailer',
        note: 'FDA § 5-502.11',
        noteEs: 'FDA § 5-502.11',
      },
      {
        id: 'generator_shut_down',
        type: 'check',
        label: 'Generator — shut down & secured',
        labelEs: 'Generador — apagado y asegurado',
        note: '',
        noteEs: '',
      },
      {
        id: 'all_surfaces_close',
        type: 'check',
        label: 'All surfaces — wiped & sanitized',
        labelEs: 'Todas las superficies — limpias y sanitizadas',
        note: '',
        noteEs: '',
      },
      {
        id: 'trailer_locked',
        type: 'check',
        label: 'Trailer — locked & secured',
        labelEs: 'Trailer — cerrado y asegurado',
        note: '',
        noteEs: '',
      },
    ],
  },

  // ── DAILY PRODUCTION ─────────────────────────────────────
  {
    section: 'daily_production',
    sectionLabel: 'Daily Production',
    sectionLabelEs: 'Producción Diaria',
    items: [
      {
        id: 'cold_brew_brewed',
        type: 'check',
        label: 'Cold brew batch brewed tonight',
        labelEs: 'Lote de cold brew preparado esta noche',
        note: '18–24 hr steep',
        noteEs: 'Remojo de 18–24 horas',
      },
      {
        id: 'honey_syrup_made',
        type: 'check',
        label: 'Honey syrup batch made (if low)',
        labelEs: 'Lote de almíbar de miel preparado (si hay poco)',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'hot_honey_made',
        type: 'check',
        label: 'Hot honey syrup made (if low)',
        labelEs: 'Almíbar de miel picante preparado (si hay poco)',
        note: '',
        noteEs: '',
      },
      {
        id: 'lavender_honey_made',
        type: 'check',
        label: 'Lavender honey syrup made (if low)',
        labelEs: 'Almíbar de miel lavanda preparado (si hay poco)',
        note: '',
        noteEs: '',
      },
      {
        id: 'low_stock_items',
        type: 'text',
        label: 'Low stock items to order',
        labelEs: 'Artículos con poco stock para pedir',
        note: 'Leave blank if none',
        noteEs: 'Dejar en blanco si ninguno',
      },
    ],
  },

  // ── OPERATOR SIGN-OFF ─────────────────────────────────────
  {
    section: 'operator_signoff',
    sectionLabel: 'Operator Sign-Off',
    sectionLabelEs: 'Firma del Operador',
    items: [
      {
        id: 'issues_noted',
        type: 'check',
        label: 'Issues noted today? (check if yes)',
        labelEs: '¿Problemas anotados hoy? (marcar si es sí)',
        note: 'If yes — complete Incident Log',
        noteEs: 'Si es sí — completar Registro de Incidentes',
      },
    ],
  },
];

// ============================================================
// ALL 15 QUEZ DRINKS — for End of Day Count
// Session 9 will replace this with menuItems from localStorage
// ============================================================
export const DRINK_LIST_DEFAULT = [
  { id: 'honey_latte', name: 'Honey Latte', nameEs: 'Latte de Miel' },
  { id: 'hot_honey_latte', name: 'Hot Honey Latte', nameEs: 'Latte de Miel Picante' },
  { id: 'lavender_honey_latte', name: 'Lavender Honey Latte', nameEs: 'Latte de Miel Lavanda' },
  { id: 'honey_cold_brew', name: 'Honey Cold Brew', nameEs: 'Cold Brew de Miel' },
  { id: 'hot_honey_cold_brew', name: 'Hot Honey Cold Brew', nameEs: 'Cold Brew de Miel Picante' },
  { id: 'lavender_honey_cold_brew', name: 'Lavender Honey Cold Brew', nameEs: 'Cold Brew de Miel Lavanda' },
  { id: 'honey_cappuccino', name: 'Honey Cappuccino', nameEs: 'Cappuccino de Miel' },
  { id: 'honey_cortado', name: 'Honey Cortado', nameEs: 'Cortado de Miel' },
  { id: 'honey_americano', name: 'Honey Americano', nameEs: 'Americano de Miel' },
  { id: 'honey_oat_latte', name: 'Honey Oat Latte', nameEs: 'Latte de Miel y Avena' },
  { id: 'honey_vanilla_latte', name: 'Honey Vanilla Latte', nameEs: 'Latte de Miel y Vainilla' },
  { id: 'honey_caramel_latte', name: 'Honey Caramel Latte', nameEs: 'Latte de Miel y Caramelo' },
  { id: 'honey_mocha', name: 'Honey Mocha', nameEs: 'Mocha de Miel' },
  { id: 'honey_earl_grey_latte', name: 'Honey Earl Grey Latte', nameEs: 'Latte de Miel y Earl Grey' },
  { id: 'drip_coffee', name: 'Drip Coffee', nameEs: 'Café de Goteo' },
];
