// ============================================================
// QUEZ APP LITE — Checklist Items Data
// Source: E-02 Operational Checklists v1.0
// Covers: Opening, Mid-Service, Closing sections
// ============================================================
 
// Item types:
//   'check'  — green checkmark toggle (yes/no)
//   'range'  — green ✓ / red ✗ toggle pair for temp/ppm checks
//              rangeLabel shown under question, e.g. "≤41°F"
//              red ✗ triggers corrective action popup
//   'text'   — free-text input (optional unless id is in required list)
//
// Time is auto-captured when employee first interacts with a section.
// No manual time entry fields.
 
export const OPENING_ITEMS = [
  // ── OPENING CHECKS ──────────────────────────────────────
  {
    section: 'opening_checks',
    sectionLabel: 'Opening Checks',
    sectionLabelEs: 'Verificaciones de Apertura',
    items: [
      {
        id: 'fresh_water_tank',
        type: 'check',
        label: 'Fresh water tank filled',
        labelEs: 'Tanque de agua fresca lleno',
        note: 'FDA § 5-101.11',
        noteEs: 'FDA § 5-101.11',
      },
      {
        id: 'waste_water_tank',
        type: 'check',
        label: 'Waste water tank empty',
        labelEs: 'Tanque de aguas residuales vacío',
        note: 'FDA § 5-402.14',
        noteEs: 'FDA § 5-402.14',
      },
      {
        id: 'ice_machine',
        type: 'check',
        label: 'Ice machine clean and producing',
        labelEs: 'Máquina de hielo limpia y produciendo',
        note: '',
        noteEs: '',
      },
      {
        id: 'espresso_machine_warmup',
        type: 'check',
        label: 'Espresso machine purged and warmed up',
        labelEs: 'Máquina de espresso purgada y calentada',
        note: '',
        noteEs: '',
      },
      {
        id: 'grinders',
        type: 'check',
        label: 'Grinders calibrated and clean',
        labelEs: 'Molinos calibrados y limpios',
        note: '',
        noteEs: '',
      },
      {
        id: 'pos_system',
        type: 'check',
        label: 'POS system on and configured',
        labelEs: 'Sistema POS encendido y configurado',
        note: '',
        noteEs: '',
      },
      {
        id: 'generator',
        type: 'check',
        label: 'Generator running, fuel level OK',
        labelEs: 'Generador funcionando, nivel de combustible OK',
        note: '',
        noteEs: '',
      },
      {
        id: 'test_drink',
        type: 'check',
        label: 'Test drink pulled and tasted',
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
        type: 'range',
        label: 'Sanitizer concentration within range?',
        labelEs: '¿Concentración del sanitizante dentro del rango?',
        rangeLabel: '50–100 ppm chlorine',
        rangeLabelEs: '50–100 ppm cloro',
        note: 'FDA § 4-501.114',
        noteEs: 'FDA § 4-501.114',
      },
      {
        id: 'test_strip',
        type: 'check',
        label: 'Test strip used to verify',
        labelEs: 'Tira de prueba utilizada para verificar',
        note: '',
        noteEs: '',
      },
      {
        id: 'handwash_temp',
        type: 'range',
        label: 'Handwash water temp within range?',
        labelEs: '¿Temperatura del agua para lavado de manos dentro del rango?',
        rangeLabel: '≥100°F',
        rangeLabelEs: '≥100°F',
        note: 'FDA § 5-202.12',
        noteEs: 'FDA § 5-202.12',
      },
      {
        id: 'three_comp_sink_open',
        type: 'check',
        label: '3-comp sink set up — wash, rinse, sanitize',
        labelEs: 'Fregadero de 3 compartimentos configurado',
        note: 'FDA § 4-301.12',
        noteEs: 'FDA § 4-301.12',
      },
      {
        id: 'sanitizer_bucket',
        type: 'check',
        label: 'Sanitizer bucket with wiping cloths in solution',
        labelEs: 'Cubeta de sanitizante con trapos en solución',
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
    sectionLabel: 'Food Safety — Temperature Checks',
    sectionLabelEs: 'Seguridad Alimentaria — Verificaciones de Temperatura',
    items: [
      {
        id: 'refrigerator_temp_open',
        type: 'range',
        label: 'Refrigerator temp within range?',
        labelEs: '¿Temperatura del refrigerador dentro del rango?',
        rangeLabel: '≤41°F',
        rangeLabelEs: '≤41°F',
        note: 'FDA § 3-501.16',
        noteEs: 'FDA § 3-501.16',
      },
      {
        id: 'milk_temp_open',
        type: 'range',
        label: 'Milk temp within range?',
        labelEs: '¿Temperatura de la leche dentro del rango?',
        rangeLabel: '≤41°F',
        rangeLabelEs: '≤41°F',
        note: 'FDA § 3-501.16',
        noteEs: 'FDA § 3-501.16',
      },
      {
        id: 'cold_brew_temp_open',
        type: 'range',
        label: 'Cold brew temp within range?',
        labelEs: '¿Temperatura del cold brew dentro del rango?',
        rangeLabel: '≤41°F',
        rangeLabelEs: '≤41°F',
        note: '',
        noteEs: '',
      },
      {
        id: 'steamed_milk_temp',
        type: 'range',
        label: 'Steamed milk temp within range? (first drink)',
        labelEs: '¿Temperatura de la leche vaporizada dentro del rango? (primera bebida)',
        rangeLabel: '145–155°F',
        rangeLabelEs: '145–155°F',
        note: '',
        noteEs: '',
      },
      {
        id: 'espresso_shot_temp',
        type: 'range',
        label: 'Espresso shot temp within range?',
        labelEs: '¿Temperatura del shot de espresso dentro del rango?',
        rangeLabel: '185–205°F',
        rangeLabelEs: '185–205°F',
        note: '',
        noteEs: '',
      },
      {
        id: 'cold_brew_pulled_temp',
        type: 'range',
        label: 'Cold brew serving temp within range?',
        labelEs: '¿Temperatura del cold brew servido dentro del rango?',
        rangeLabel: '≤41°F',
        rangeLabelEs: '≤41°F',
        note: '',
        noteEs: '',
      },
      {
        id: 'honey_syrup_labeled',
        type: 'check',
        label: 'Honey syrup batch labeled and dated',
        labelEs: 'Lote de almíbar de miel etiquetado y fechado',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'hot_honey_labeled',
        type: 'check',
        label: 'Hot honey syrup labeled and dated',
        labelEs: 'Almíbar de miel picante etiquetado y fechado',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'earl_grey_brewed',
        type: 'check',
        label: 'Earl Grey concentrate brewed and time noted',
        labelEs: 'Concentrado de Earl Grey preparado y hora anotada',
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
        label: 'Cold brew brew date verified within 7 days',
        labelEs: 'Fecha de preparación del cold brew verificada (7 días)',
        note: '',
        noteEs: '',
      },
      {
        id: 'drip_coffee_time',
        type: 'check',
        label: 'Drip coffee batch time written on airpot',
        labelEs: 'Hora del lote de café de goteo escrita en el termo',
        note: '90-min hold limit',
        noteEs: 'Límite de retención: 90 minutos',
      },
    ],
  },
];
 
// ============================================================
// MID-SERVICE SECTION
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
        type: 'range',
        label: 'Refrigerator temp within range? (mid-shift)',
        labelEs: '¿Temperatura del refrigerador dentro del rango? (mitad del turno)',
        rangeLabel: '≤41°F',
        rangeLabelEs: '≤41°F',
        note: 'FDA § 3-501.16',
        noteEs: 'FDA § 3-501.16',
      },
      {
        id: 'sanitizer_ppm_mid',
        type: 'range',
        label: 'Sanitizer concentration within range? (re-check)',
        labelEs: '¿Concentración del sanitizante dentro del rango? (reverificación)',
        rangeLabel: '50–100 ppm chlorine',
        rangeLabelEs: '50–100 ppm cloro',
        note: 'FDA § 4-501.114',
        noteEs: 'FDA § 4-501.114',
      },
      {
        id: 'earl_grey_refreshed',
        type: 'check',
        label: 'Earl Grey concentrate refreshed if 2 hrs old',
        labelEs: 'Concentrado de Earl Grey renovado si tiene 2 horas',
        note: '2-hr hold limit',
        noteEs: 'Límite de retención: 2 horas',
      },
      {
        id: 'drip_coffee_replaced',
        type: 'check',
        label: 'Drip coffee batch replaced if 90 min old',
        labelEs: 'Lote de café de goteo reemplazado si tiene 90 minutos',
        note: '90-min hold limit',
        noteEs: 'Límite de retención: 90 minutos',
      },
      {
        id: 'surfaces_mid',
        type: 'check',
        label: 'Work surfaces wiped and sanitized',
        labelEs: 'Superficies de trabajo limpias y sanitizadas',
        note: 'FDA § 4-601.11',
        noteEs: 'FDA § 4-601.11',
      },
      {
        id: 'cups_restocked',
        type: 'check',
        label: 'Cups, lids, and straws restocked',
        labelEs: 'Vasos, tapas y popotes reabastecidos',
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
        label: 'Espresso machine backflushed and clean',
        labelEs: 'Máquina de espresso con retrolavado y limpia',
        note: '',
        noteEs: '',
      },
      {
        id: 'steam_wands',
        type: 'check',
        label: 'Steam wands purged and wiped',
        labelEs: 'Lanzas de vapor purgadas y limpias',
        note: '',
        noteEs: '',
      },
      {
        id: 'three_comp_sink_close',
        type: 'check',
        label: '3-comp sink washed, rinsed, sanitized, and drained',
        labelEs: 'Fregadero de 3 compartimentos lavado, enjuagado, sanitizado y drenado',
        note: 'FDA § 4-501.114',
        noteEs: 'FDA § 4-501.114',
      },
      {
        id: 'fresh_water_top_off',
        type: 'check',
        label: 'Fresh water tank topped off for next day',
        labelEs: 'Tanque de agua fresca rellenado para el día siguiente',
        note: '',
        noteEs: '',
      },
      {
        id: 'waste_water_dumped',
        type: 'check',
        label: 'Waste water tank dumped at approved site',
        labelEs: 'Tanque de aguas residuales vaciado en sitio aprobado',
        note: 'FDA § 5-402.15',
        noteEs: 'FDA § 5-402.15',
      },
      {
        id: 'waste_dump_site',
        type: 'text',
        label: 'Waste dump site used',
        labelEs: 'Sitio de descarga utilizado',
        note: 'Required for DIAL compliance',
        noteEs: 'Requerido para cumplimiento DIAL',
        required: true,
      },
      {
        id: 'trash_removed',
        type: 'check',
        label: 'Trash removed from trailer',
        labelEs: 'Basura retirada del trailer',
        note: 'FDA § 5-502.11',
        noteEs: 'FDA § 5-502.11',
      },
      {
        id: 'generator_shut_down',
        type: 'check',
        label: 'Generator shut down and secured',
        labelEs: 'Generador apagado y asegurado',
        note: '',
        noteEs: '',
      },
      {
        id: 'all_surfaces_close',
        type: 'check',
        label: 'All surfaces wiped and sanitized',
        labelEs: 'Todas las superficies limpias y sanitizadas',
        note: '',
        noteEs: '',
      },
      {
        id: 'trailer_locked',
        type: 'check',
        label: 'Trailer locked and secured',
        labelEs: 'Trailer cerrado y asegurado',
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
        label: 'Honey syrup batch made if low',
        labelEs: 'Lote de almíbar de miel preparado si hay poco',
        note: '14-day shelf life',
        noteEs: 'Vida útil de 14 días',
      },
      {
        id: 'hot_honey_made',
        type: 'check',
        label: 'Hot honey syrup made if low',
        labelEs: 'Almíbar de miel picante preparado si hay poco',
        note: '',
        noteEs: '',
      },
      {
        id: 'lavender_honey_made',
        type: 'check',
        label: 'Lavender honey syrup made if low',
        labelEs: 'Almíbar de miel lavanda preparado si hay poco',
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
        required: false,
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