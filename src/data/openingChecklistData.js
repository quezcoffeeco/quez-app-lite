// src/data/openingChecklistData.js
// All content sourced from E-02 Operational Checklists — Iowa DIAL Compliance
// Do not edit item IDs — they are used as localStorage keys

export const OPENING_CHECKLIST_SECTIONS = [
  {
    id: 'opening_checks',
    label: 'Opening Checks',
    labelEs: 'Verificaciones de Apertura',
    items: [
      {
        id: 'open_time',
        type: 'time_entry',
        label: 'Open time (write actual time)',
        labelEs: 'Hora de apertura (escribir hora real)',
        required: true,
      },
      {
        id: 'operator_initials',
        type: 'text_entry',
        label: 'Operator name / initials',
        labelEs: 'Nombre / iniciales del operador',
        required: true,
      },
      {
        id: 'fresh_water_tank',
        type: 'yes_no',
        label: 'Fresh water tank — filled',
        labelEs: 'Tanque de agua fresca — lleno',
        reference: 'FDA § 5-101.11',
        required: true,
      },
      {
        id: 'waste_water_tank',
        type: 'yes_no',
        label: 'Waste water tank — empty',
        labelEs: 'Tanque de aguas residuales — vacío',
        reference: 'FDA § 5-402.14',
        required: true,
      },
      {
        id: 'refrigerator_temp',
        type: 'temperature',
        label: 'Refrigerator temp (°F)',
        labelEs: 'Temperatura del refrigerador (°F)',
        reference: 'FDA § 3-501.16 — must be ≤41°F',
        referenceEs: 'FDA § 3-501.16 — debe ser ≤41°F',
        min: null,
        max: 41,
        unit: '°F',
        required: true,
      },
      {
        id: 'milk_temp',
        type: 'temperature',
        label: 'Milk temp check (°F)',
        labelEs: 'Verificación de temp. de leche (°F)',
        reference: 'FDA § 3-501.16 — must be ≤41°F',
        referenceEs: 'FDA § 3-501.16 — debe ser ≤41°F',
        min: null,
        max: 41,
        unit: '°F',
        required: true,
      },
      {
        id: 'cold_brew_temp_opening',
        type: 'temperature',
        label: 'Cold brew temp (°F)',
        labelEs: 'Temp. del cold brew (°F)',
        reference: 'Must be ≤41°F',
        referenceEs: 'Debe ser ≤41°F',
        min: null,
        max: 41,
        unit: '°F',
        required: true,
      },
      {
        id: 'ice_machine',
        type: 'yes_no',
        label: 'Ice machine — clean & producing',
        labelEs: 'Máquina de hielo — limpia y produciendo',
        required: true,
      },
      {
        id: 'espresso_machine',
        type: 'yes_no',
        label: 'Espresso machine — purge & warm-up',
        labelEs: 'Máquina de espresso — purgar y calentar',
        required: true,
      },
      {
        id: 'grinders',
        type: 'yes_no',
        label: 'Grinders — calibrated & clean',
        labelEs: 'Molinos — calibrados y limpios',
        required: true,
      },
      {
        id: 'pos_system',
        type: 'yes_no',
        label: 'POS system — on & configured',
        labelEs: 'Sistema POS — encendido y configurado',
        required: true,
      },
      {
        id: 'generator',
        type: 'yes_no',
        label: 'Generator — running, fuel level OK',
        labelEs: 'Generador — funcionando, nivel de combustible OK',
        required: true,
      },
      {
        id: 'test_drink',
        type: 'yes_no',
        label: 'Test drink pulled & tasted',
        labelEs: 'Bebida de prueba preparada y probada',
        required: true,
      },
    ],
  },
  {
    id: 'sanitizer_water',
    label: 'Sanitizer & Water',
    labelEs: 'Sanitizante y Agua',
    items: [
      {
        id: 'sanitizer_ppm',
        type: 'ppm',
        label: 'Sanitizer concentration (ppm)',
        labelEs: 'Concentración de sanitizante (ppm)',
        reference: 'Target: 50–100 ppm chlorine',
        referenceEs: 'Objetivo: 50–100 ppm de cloro',
        min: 50,
        max: 100,
        unit: 'ppm',
        required: true,
      },
      {
        id: 'test_strip_used',
        type: 'yes_no',
        label: 'Test strip used',
        labelEs: 'Tira de prueba utilizada',
        required: true,
      },
      {
        id: 'handwash_water_temp',
        type: 'temperature',
        label: 'Handwash water temp (°F)',
        labelEs: 'Temp. del agua para lavado de manos (°F)',
        reference: 'FDA § 5-202.12 — must be ≥100°F',
        referenceEs: 'FDA § 5-202.12 — debe ser ≥100°F',
        min: 100,
        max: null,
        unit: '°F',
        required: true,
      },
      {
        id: 'three_comp_sink',
        type: 'yes_no',
        label: '3-comp sink — wash/rinse/sanitize set up',
        labelEs: 'Fregadero de 3 compartimentos — lavado/enjuague/sanitizado listo',
        reference: 'FDA § 4-301.12',
        required: true,
      },
      {
        id: 'sanitizer_bucket',
        type: 'yes_no',
        label: 'Sanitizer bucket — wiping cloths in solution',
        labelEs: 'Cubeta de sanitizante — paños en solución',
        reference: 'FDA § 3-304.14',
        required: true,
      },
      {
        id: 'hand_soap',
        type: 'yes_no',
        label: 'Hand soap at sink — stocked',
        labelEs: 'Jabón de manos en el lavabo — abastecido',
        reference: 'FDA § 6-301.11',
        required: true,
      },
      {
        id: 'paper_towels',
        type: 'yes_no',
        label: 'Paper towels at sink — stocked',
        labelEs: 'Toallas de papel en el lavabo — abastecidas',
        reference: 'FDA § 6-301.12',
        required: true,
      },
    ],
  },
  {
    id: 'food_safety_temps',
    label: 'Food Safety — Temps',
    labelEs: 'Seguridad Alimentaria — Temperaturas',
    items: [
      {
        id: 'steamed_milk_temp',
        type: 'temperature',
        label: 'Steamed milk temp — first drink (°F)',
        labelEs: 'Temp. de leche vaporizada — primera bebida (°F)',
        reference: 'Target: 145–155°F',
        referenceEs: 'Objetivo: 145–155°F',
        min: 145,
        max: 155,
        unit: '°F',
        required: true,
      },
      {
        id: 'espresso_shot_temp',
        type: 'temperature',
        label: 'Espresso shot temp (°F)',
        labelEs: 'Temp. del shot de espresso (°F)',
        reference: 'Record actual reading',
        referenceEs: 'Registrar lectura real',
        min: null,
        max: null,
        unit: '°F',
        required: true,
      },
      {
        id: 'cold_brew_pulled_temp',
        type: 'temperature',
        label: 'Cold brew pulled temp (°F)',
        labelEs: 'Temp. del cold brew servido (°F)',
        reference: 'Must be ≤41°F',
        referenceEs: 'Debe ser ≤41°F',
        min: null,
        max: 41,
        unit: '°F',
        required: true,
      },
      {
        id: 'honey_syrup_labeled',
        type: 'yes_no',
        label: 'Honey syrup batch — labeled & dated',
        labelEs: 'Lote de jarabe de miel — etiquetado y fechado',
        reference: '14-day shelf life',
        referenceEs: 'Vida útil de 14 días',
        required: true,
      },
      {
        id: 'hot_honey_labeled',
        type: 'yes_no',
        label: 'Hot honey syrup — labeled & dated',
        labelEs: 'Jarabe de miel picante — etiquetado y fechado',
        reference: '14-day shelf life',
        referenceEs: 'Vida útil de 14 días',
        required: true,
      },
      {
        id: 'earl_grey_brewed',
        type: 'yes_no',
        label: 'Earl Grey concentrate — brewed, time noted',
        labelEs: 'Concentrado de Earl Grey — preparado, hora anotada',
        reference: '2-hr hold limit',
        referenceEs: 'Límite de retención: 2 horas',
        required: true,
      },
      {
        id: 'syrups_use_by',
        type: 'yes_no',
        label: 'All syrups checked for use-by date',
        labelEs: 'Todos los jarabes verificados por fecha de vencimiento',
        required: true,
      },
      {
        id: 'cold_brew_brew_date',
        type: 'yes_no',
        label: 'Cold brew — brew date verified within 7 days',
        labelEs: 'Cold brew — fecha de preparación verificada dentro de 7 días',
        required: true,
      },
      {
        id: 'drip_coffee_time',
        type: 'yes_no',
        label: 'Drip coffee — batch time written on airpot',
        labelEs: 'Café de goteo — hora del lote escrita en el airpot',
        reference: '90-min hold limit',
        referenceEs: 'Límite de retención: 90 minutos',
        required: true,
      },
    ],
  },
];

// Temperature range validation
export function validateReading(item, value) {
  const num = parseFloat(value);
  if (isNaN(num)) return { valid: false, reason: 'No reading entered' };

  if (item.type === 'temperature' || item.type === 'ppm') {
    if (item.min !== null && num < item.min) {
      return {
        valid: false,
        reason: `Reading ${num}${item.unit} is BELOW minimum of ${item.min}${item.unit}`,
        reasonEs: `Lectura ${num}${item.unit} está POR DEBAJO del mínimo de ${item.min}${item.unit}`,
      };
    }
    if (item.max !== null && num > item.max) {
      return {
        valid: false,
        reason: `Reading ${num}${item.unit} is ABOVE maximum of ${item.max}${item.unit}`,
        reasonEs: `Lectura ${num}${item.unit} está POR ENCIMA del máximo de ${item.max}${item.unit}`,
      };
    }
  }

  return { valid: true };
}

export function getTodayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
