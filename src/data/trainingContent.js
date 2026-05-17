// trainingContent.js
// All training content for Phase 1, Phase 2, and Phase 3
// Phase 1 content and quiz built in Session 7 — preserved below
// Phase 2 and Phase 3 content added in Session 8

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — STUDY CONTENT (Session 7, preserved)
// ─────────────────────────────────────────────────────────────────────────────

export const phase1Sections = [
  // ─────────────────────────────────────────────────────────────────────────
  // 1. BRAND & IDENTITY — what Quez is, how you talk about it
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'brand',
    title: { en: 'Brand & Identity', es: 'Marca e Identidad' },
    required: true,
    content: {
      en: [
        {
          heading: 'What Quez Is',
          body: 'You are working at a veteran-owned mobile craft coffee bar — drive-thru and walk-up service, based in Council Bluffs, Iowa, founded by Ryan Rodriquez (U.S. Army veteran). Three pillars define us: VETERAN-OWNED · HONEY-CRAFTED · COMMUNITY-ROOTED. When a customer asks what makes Quez different, you have one line ready: "Veteran-owned mobile craft coffee bar serving Iowa wildflower honey craft coffee — crafted for the community." Memorize that sentence. Say it at the window.',
        },
        {
          heading: 'The Iowa Honey Story',
          body: 'Iowa wildflower honey, sourced from LOCAL Iowa producers, is our identity. No competitor in Council Bluffs or Omaha — corporate or independent — sources Iowa wildflower honey. We always keep TWO suppliers, so we never run out. Mechanically: we use house-made honey SYRUP in every drink, never raw honey, because raw honey will not dissolve in cold liquid — it clumps. Syrup is consistent, dissolved, and correct every time.',
        },
        {
          heading: 'The 15-Drink Menu',
          body: 'Memorize all 15 by category. The first six are Honey Signature — our identity drinks. If a customer asks "what should I get?", start with a Honey Signature.\n\nHoney Signature (6): Quez Honey Mocha · Hot Honey Spice Latte · Golden Bear Cold Brew · Lavender Honey Fog · Honey Cinnamon Latte · Honey Cold Brew.\n\nEspresso Classics (4): Vanilla Latte · Caramel Latte · Salted Caramel Latte · Americano.\n\nFrappes (2): Caramel Crunch Frappe · Mocha Frappe.\n\nVolume & Non-Coffee (3): Drip Coffee · Chai Latte · Strawberry Lemonade.',
        },
        {
          heading: 'The Voice at the Window',
          body: 'You are the brand. Two rules:\n\n1. Lead with the story when relevant. First-time customer? Mention the Iowa honey. Hesitant customer? Recommend the Quez Honey Mocha — our flagship.\n\n2. Never apologize for the price. The Quez Honey Mocha is $6.95. That price buys local Iowa honey, a custom-built bar, and a 3-minute window. 88% of specialty coffee customers will pay a premium for quality-branded ingredients. They expect to. Don\'t undercut yourself.\n\nKnow the competition by name so you can answer "how are you different from X?": three Starbucks, two Scooter\'s, Frosted Pine Coffee (Kanesville Blvd), Louie\'s Coffee House (Valley View Dr). None rotate. None source Iowa honey.',
        },
      ],
      es: [
        {
          heading: 'Qué Es Quez',
          body: 'Trabajas en un bar de café artesanal móvil de propiedad veterana — servicio drive-thru y peatonal en Council Bluffs, Iowa, fundado por Ryan Rodriquez (veterano del Ejército de EE.UU.). Tres pilares nos definen: PROPIEDAD DE VETERANO · ELABORADO CON MIEL · ARRAIGADO EN LA COMUNIDAD. Cuando un cliente pregunte qué hace diferente a Quez, tienes una línea lista: "Bar de café artesanal móvil de propiedad veterana, sirviendo café artesanal con miel silvestre de Iowa — elaborado para la comunidad." Memoriza esa oración. Dila en la ventana.',
        },
        {
          heading: 'La Historia de la Miel de Iowa',
          body: 'La miel silvestre de Iowa, obtenida de productores LOCALES de Iowa, es nuestra identidad. Ningún competidor en Council Bluffs u Omaha — corporativo o independiente — usa miel silvestre de Iowa. Siempre mantenemos DOS proveedores, así nunca nos quedamos sin. Mecánicamente: usamos JARABE de miel casero en cada bebida, nunca miel cruda, porque la miel cruda no se disuelve en líquido frío — hace grumos. El jarabe es consistente, disuelto y correcto siempre.',
        },
        {
          heading: 'El Menú de 15 Bebidas',
          body: 'Memoriza las 15 por categoría. Las primeras seis son Signature de Miel — nuestras bebidas de identidad. Si un cliente pregunta "¿qué me recomiendas?", empieza con una Signature de Miel.\n\nSignature de Miel (6): Quez Honey Mocha · Hot Honey Spice Latte · Golden Bear Cold Brew · Lavender Honey Fog · Honey Cinnamon Latte · Honey Cold Brew.\n\nClásicos de Espresso (4): Vanilla Latte · Caramel Latte · Salted Caramel Latte · Americano.\n\nFrappés (2): Caramel Crunch Frappe · Mocha Frappe.\n\nVolumen y Sin Café (3): Drip Coffee · Chai Latte · Strawberry Lemonade.',
        },
        {
          heading: 'La Voz en la Ventana',
          body: 'Tú eres la marca. Dos reglas:\n\n1. Lidera con la historia cuando aplique. ¿Cliente nuevo? Menciona la miel de Iowa. ¿Cliente indeciso? Recomienda el Quez Honey Mocha — nuestra bebida insignia.\n\n2. Nunca te disculpes por el precio. El Quez Honey Mocha cuesta $6.95. Ese precio paga miel local de Iowa, un bar hecho a la medida, y una ventana de 3 minutos. El 88% de los clientes de café especialidad pagan un premium por ingredientes de marca de calidad. Lo esperan. No te subvalores.\n\nConoce a la competencia por nombre para poder responder "¿en qué se diferencian de X?": tres Starbucks, dos Scooter\'s, Frosted Pine Coffee (Kanesville Blvd), Louie\'s Coffee House (Valley View Dr). Ninguno rota. Ninguno usa miel de Iowa.',
        },
      ],
    },
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 2. OPERATIONS & SERVICE — how/where/when we work, the standards
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'operations',
    title: { en: 'Operations & Service', es: 'Operaciones y Servicio' },
    required: true,
    content: {
      en: [
        {
          heading: 'How We Run',
          body: 'Quez is mobile. We rotate across 2–3 high-traffic Council Bluffs locations each week. Rotation is legally required (Iowa Code 481-31) and intentional — more stops = more touchpoints, less single-site dependency.\n\nHours:\n· Monday–Friday: 6:00 AM – 2:00 PM\n· Saturday: 7:00 AM – 3:00 PM\n· Sunday: 7:00 AM – 1:00 PM\n\nTwo daily peaks: morning rush 6–9 AM (~40% of the day\'s volume) and a 9 AM – 2 PM mid-morning peak. Stock, brew, calibrate BEFORE the rush — never during it.',
        },
        {
          heading: 'The 3-Minute Standard',
          body: 'Pull-up to hand-off in 3 minutes or less. Per-drink build targets you should hit every time:\n\n· Hot drinks: 60 sec\n· Iced drinks: 45 sec\n· Frappes: 90 sec\n· Drip coffee: 15 sec\n\nSpeed AND quality — never one at the expense of the other. If you\'re running long, the recipe is right and your prep is wrong. Get your station ready before the morning rush so you\'re hitting these times by 6:30 AM.',
        },
        {
          heading: 'Loyalty & Seasonal Programs',
          body: 'Two customer-facing programs you run:\n\n1. Stamp-card loyalty — every 10th drink free, tracked by customer NAME on the card. No app. Pull and stamp at every transaction. Calling regulars by name turns walk-ins into dailies — that is the whole game.\n\n2. Seasonal drink — one new drink per season. Scarcity drives return visits. When a seasonal launches, learn the build before your first shift serving it.',
        },
      ],
      es: [
        {
          heading: 'Cómo Operamos',
          body: 'Quez es móvil. Rotamos entre 2–3 ubicaciones de alto tráfico en Council Bluffs cada semana. La rotación es requerida por ley (Código de Iowa 481-31) e intencional — más paradas = más puntos de contacto, menos dependencia de un solo sitio.\n\nHorario:\n· Lunes–Viernes: 6:00 AM – 2:00 PM\n· Sábado: 7:00 AM – 3:00 PM\n· Domingo: 7:00 AM – 1:00 PM\n\nDos picos diarios: hora pico de la mañana 6–9 AM (~40% del volumen del día) y un pico de media mañana 9 AM – 2 PM. Abastécete, prepara, calibra ANTES del pico — nunca durante.',
        },
        {
          heading: 'El Estándar de 3 Minutos',
          body: 'Desde que el cliente llega hasta que recibe el pedido: 3 minutos o menos. Objetivos por bebida que debes cumplir siempre:\n\n· Bebidas calientes: 60 seg\n· Bebidas frías: 45 seg\n· Frappés: 90 seg\n· Café de filtro: 15 seg\n\nVelocidad Y calidad — nunca una a costa de la otra. Si vas atrasado, la receta está bien y tu preparación está mal. Ten tu estación lista antes de la hora pico para alcanzar estos tiempos a las 6:30 AM.',
        },
        {
          heading: 'Programas de Lealtad y Temporada',
          body: 'Dos programas con clientes que tú ejecutas:\n\n1. Tarjeta de lealtad con sellos — cada 10° bebida gratis, rastreado por NOMBRE del cliente en la tarjeta. Sin app. Saca y sella en cada transacción. Llamar a los habituales por nombre los convierte de ocasionales a diarios — ese es todo el juego.\n\n2. Bebida de temporada — una nueva por temporada. La escasez impulsa visitas repetidas. Cuando se lanza una de temporada, aprende la receta antes del primer turno en que se sirva.',
        },
      ],
    },
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 3. FOOD SAFETY — the law, the non-negotiables
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'food_safety',
    title: { en: 'Food Safety', es: 'Seguridad Alimentaria' },
    required: true,
    content: {
      en: [
        {
          heading: 'DIAL Is the Law',
          body: 'You operate under Iowa DIAL (Department of Inspections, Appeals & Licensing) food code IAC 481-31. Every food-safety rule in this training is law, not preference. An inspector can show up unannounced at any time. If one does: be polite, hand them the Daily Operations Log, call the owner.',
        },
        {
          heading: 'TCS Foods & 41°F',
          body: 'TCS = Temperature Control for Safety. Foods that grow bacteria fast at the wrong temperature.\n\nOur TCS items: all milk, cold brew concentrate, house-made syrups, prepared foods. All TCS items must be held at 41°F or below.\n\nEvery opening: read the fridge thermometer and log the number on the Daily Operations Log. If the reading is above 41°F — stop using TCS products immediately and call the owner. Do not serve a drink with a milk you are not sure about.',
        },
        {
          heading: 'Handwashing — 20 Seconds, 100°F',
          body: 'Wash for 20 seconds minimum with soap and water at 100°F minimum. Required every time you:\n\n· Start your shift\n· Touch your face or phone\n· Handle money\n· Come back from a break\n· Touch anything potentially contaminated\n\nSanitizer gel is NOT a substitute. Handwashing is.',
        },
        {
          heading: 'Sanitizer Solution — 50–100 ppm',
          body: 'Mix unscented chlorine bleach with water to 50–100 ppm chlorine. Test with a chlorine strip EVERY MORNING before service. Log the ppm reading on the Daily Operations Log. Wiping cloths live in the sanitizer bucket during service — never on the counter. If your strip reads outside the 50–100 ppm range, remix.',
        },
        {
          heading: 'Hold Times & Allergens',
          body: 'Hold times — discard and remake at these limits:\n\n· Drip coffee: 90 minutes\n· Earl Grey tea concentrate (Lavender Honey Fog): 2 hours\n· Cold brew concentrate: 7 days from filter date\n\nLabel every batch with brew/filter date.\n\nAllergens in our menu: dairy and tree nuts. When a customer requests dairy-free, use a separate pitcher and steam wand cloth. Never use a milk-coated tool on a dairy-free order.',
        },
        {
          heading: 'Illness Reporting',
          body: 'If you have vomiting, diarrhea, or jaundice — do not come to work. Call the owner. Working sick is a DIAL violation, endangers customers, and there is zero pressure to show up sick at Quez. The schedule will be covered.',
        },
      ],
      es: [
        {
          heading: 'DIAL Es la Ley',
          body: 'Operas bajo el código alimentario IAC 481-31 de Iowa DIAL (Departamento de Inspecciones, Apelaciones y Licencias). Cada regla de seguridad alimentaria en este entrenamiento es ley, no preferencia. Un inspector puede llegar sin aviso en cualquier momento. Si llega uno: sé cortés, entrégale el Registro de Operaciones Diarias, llama al dueño.',
        },
        {
          heading: 'Alimentos TCS y 41°F',
          body: 'TCS = Control de Temperatura para la Seguridad. Alimentos que desarrollan bacterias rápido a la temperatura incorrecta.\n\nNuestros artículos TCS: toda la leche, concentrado de cold brew, jarabes caseros, alimentos preparados. Todos los TCS deben mantenerse a 41°F o menos.\n\nCada apertura: lee el termómetro del refrigerador y registra el número en el Registro de Operaciones Diarias. Si la lectura está por encima de 41°F — deja de usar productos TCS inmediatamente y llama al dueño. No sirvas una bebida con leche que no estás seguro.',
        },
        {
          heading: 'Lavado de Manos — 20 Segundos, 100°F',
          body: 'Lávate por 20 segundos como mínimo con jabón y agua a 100°F como mínimo. Obligatorio cada vez que:\n\n· Empiezas tu turno\n· Te tocas la cara o el teléfono\n· Manejas dinero\n· Regresas de un descanso\n· Tocas algo potencialmente contaminado\n\nEl gel sanitizante NO es sustituto. Lavarse las manos lo es.',
        },
        {
          heading: 'Solución Sanitizante — 50–100 ppm',
          body: 'Mezcla blanqueador de cloro sin fragancia con agua a 50–100 ppm de cloro. Prueba con una tira de cloro CADA MAÑANA antes del servicio. Registra la lectura de ppm en el Registro de Operaciones Diarias. Los trapos de limpieza viven en la cubeta sanitizante durante el servicio — nunca en el mostrador. Si tu tira lee fuera del rango 50–100 ppm, vuelve a mezclar.',
        },
        {
          heading: 'Tiempos de Conservación y Alérgenos',
          body: 'Tiempos de conservación — desecha y prepara fresco en estos límites:\n\n· Café de filtro: 90 minutos\n· Concentrado de té Earl Grey (Lavender Honey Fog): 2 horas\n· Concentrado de cold brew: 7 días desde la fecha de filtrado\n\nEtiqueta cada lote con la fecha de preparación/filtrado.\n\nAlérgenos en nuestro menú: lácteos y frutos secos. Cuando un cliente pida sin lácteos, usa una jarra separada y un trapo de varilla de vapor separado. Nunca uses una herramienta con leche en un pedido sin lácteos.',
        },
        {
          heading: 'Reporte de Enfermedades',
          body: 'Si tienes vómitos, diarrea o ictericia — no vengas a trabajar. Llama al dueño. Trabajar enfermo es una violación de DIAL, pone en peligro a los clientes, y no hay presión alguna para venir enfermo a Quez. El turno se cubrirá.',
        },
      ],
    },
  },
  // ─────────────────────────────────────────────────────────────────────────
  // 4. POLICIES & REPORTING — what to log, when to call, what stays internal
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'policies',
    title: { en: 'Policies & Reporting', es: 'Políticas y Reportes' },
    required: true,
    content: {
      en: [
        {
          heading: 'The Daily Log & Waste Water',
          body: 'The Daily Operations Log is a legal document — DIAL inspectors review it. Every shift, fill in every line: fridge temperature, sanitizer ppm, your initials, the waste-water dump site used.\n\nWaste water goes to an APPROVED DUMP SITE ONLY — log the site name every closing. Never dump in a parking lot, storm drain, or gutter. That is an environmental violation and can suspend our permit.',
        },
        {
          heading: 'When to Call the Owner',
          body: 'Three categories trigger an immediate owner call:\n\n1. SAFETY: fridge over 41°F · equipment failure that stops service · any customer safety incident · DIAL inspector on site.\n\n2. CUSTOMER: any Severity-2 complaint (safety concern, significant error, or repeat issue). Complaint flow: (1) apologize immediately, no argument. (2) remake the drink, no question. (3) if Severity-2+, complete the Incident & Complaint Log AND call the owner.\n\n3. CASH: any handling discrepancy.\n\nWhen in doubt — call.',
        },
        {
          heading: 'Confidentiality & Social Media',
          body: 'You signed a confidentiality agreement. Everything internal — recipes, formulas, supplier names, pricing strategy, build procedures — is proprietary. This obligation continues after employment ends. Violations may result in civil liability.\n\nOn social media: no behind-the-scenes content, no recipe details, no ingredient info, no internal procedures, without written approval from the owner. Posting a clean espresso pull is fine. Posting the build sequence for a Quez Honey Mocha is not.',
        },
      ],
      es: [
        {
          heading: 'El Registro Diario y Aguas Residuales',
          body: 'El Registro de Operaciones Diarias es un documento legal — los inspectores de DIAL lo revisan. Cada turno, llena cada línea: temperatura del refrigerador, ppm del sanitizante, tus iniciales, el sitio de descarga de aguas residuales utilizado.\n\nLas aguas residuales van a un SITIO DE DESCARGA APROBADO SOLAMENTE — registra el nombre del sitio cada cierre. Nunca descargues en un estacionamiento, desagüe pluvial o cuneta. Esa es una violación ambiental y puede suspender nuestro permiso.',
        },
        {
          heading: 'Cuándo Llamar al Dueño',
          body: 'Tres categorías disparan una llamada inmediata al dueño:\n\n1. SEGURIDAD: refrigerador por encima de 41°F · falla de equipo que detiene el servicio · cualquier incidente de seguridad del cliente · inspector de DIAL en el sitio.\n\n2. CLIENTE: cualquier queja de Gravedad 2 (preocupación de seguridad, error significativo o problema repetido). Flujo de queja: (1) discúlpate de inmediato, sin argumentos. (2) rehace la bebida, sin preguntas. (3) si es Gravedad 2+, completa el Registro de Incidentes y Quejas Y llama al dueño.\n\n3. EFECTIVO: cualquier discrepancia en el manejo.\n\nAnte la duda — llama.',
        },
        {
          heading: 'Confidencialidad y Redes Sociales',
          body: 'Firmaste un acuerdo de confidencialidad. Todo lo interno — recetas, fórmulas, nombres de proveedores, estrategia de precios, procedimientos de preparación — es propietario. Esta obligación continúa después del empleo. Las violaciones pueden resultar en responsabilidad civil.\n\nEn redes sociales: nada de contenido detrás de cámaras, nada de detalles de recetas, nada de información de ingredientes, nada de procedimientos internos, sin aprobación escrita del dueño. Publicar una extracción limpia de espresso está bien. Publicar la secuencia de preparación de un Quez Honey Mocha no.',
        },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 1 — QUIZ (Session 7, preserved)
// ─────────────────────────────────────────────────────────────────────────────

export const phase1Quiz = [
  {
    id: 'q1',
    question: {
      en: 'What is the maximum refrigerator temperature for TCS foods?',
      es: '¿Cuál es la temperatura máxima del refrigerador para alimentos TCS?',
    },
    options: {
      en: ['41°F', '45°F', '38°F', '50°F'],
      es: ['41°F', '45°F', '38°F', '50°F'],
    },
    correctIndex: 0,
    explanation: {
      en: '41°F is the maximum safe cold holding temperature for TCS foods under Iowa DIAL code IAC 481-31. Above 41°F, bacteria can multiply rapidly.',
      es: '41°F es la temperatura máxima segura de conservación en frío para alimentos TCS según el código Iowa DIAL IAC 481-31. Por encima de 41°F, las bacterias pueden multiplicarse rápidamente.',
    },
  },
  {
    id: 'q2',
    question: {
      en: 'What is the minimum handwash water temperature?',
      es: '¿Cuál es la temperatura mínima del agua para lavarse las manos?',
    },
    options: {
      en: ['100°F', '70°F', '120°F', '85°F'],
      es: ['100°F', '70°F', '120°F', '85°F'],
    },
    correctIndex: 0,
    explanation: {
      en: '100°F minimum water temperature at the handwash sink. This is required by Iowa DIAL — always confirm the water is running hot before washing.',
      es: 'Temperatura mínima de 100°F en el lavabo de manos. Esto es requerido por Iowa DIAL — siempre confirma que el agua está caliente antes de lavarse.',
    },
  },
  {
    id: 'q3',
    question: {
      en: 'What is the acceptable sanitizer concentration range?',
      es: '¿Cuál es el rango aceptable de concentración del sanitizante?',
    },
    options: {
      en: ['50–100 ppm chlorine', '10–25 ppm chlorine', '200–300 ppm chlorine', '150–200 ppm chlorine'],
      es: ['50–100 ppm cloro', '10–25 ppm cloro', '200–300 ppm cloro', '150–200 ppm cloro'],
    },
    correctIndex: 0,
    explanation: {
      en: '50–100 ppm chlorine is the required concentration. Test with chlorine test strips every morning. Too low = ineffective. Too high = unsafe contact with food surfaces.',
      es: '50–100 ppm de cloro es la concentración requerida. Prueba con tiras de prueba de cloro cada mañana. Muy bajo = ineficaz. Muy alto = contacto inseguro con superficies de alimentos.',
    },
  },
  {
    id: 'q4',
    question: {
      en: 'What does TCS stand for, and which of these is a TCS item we use?',
      es: '¿Qué significa TCS, y cuál de estos es un artículo TCS que usamos?',
    },
    options: {
      en: ['Temperature Control for Safety — milk', 'Total Cup Standard — drip coffee', 'Temperature Check System — honey syrup', 'Time-Critical Service — espresso'],
      es: ['Control de Temperatura para Seguridad — leche', 'Estándar Total de Taza — café de filtro', 'Sistema de Verificación de Temperatura — jarabe de miel', 'Servicio Crítico de Tiempo — espresso'],
    },
    correctIndex: 0,
    explanation: {
      en: 'TCS = Temperature Control for Safety. Milk is a TCS item — it supports bacterial growth when held above 41°F. Cold brew concentrate is also TCS.',
      es: 'TCS = Control de Temperatura para Seguridad. La leche es un artículo TCS — favorece el crecimiento bacteriano cuando se mantiene por encima de 41°F. El concentrado de cold brew también es TCS.',
    },
  },
  {
    id: 'q5',
    question: {
      en: 'What is the hold time limit for drip coffee?',
      es: '¿Cuál es el límite de tiempo de conservación del café de filtro?',
    },
    options: {
      en: ['90 minutes — discard after', '2 hours — discard after', '30 minutes — discard after', '4 hours — discard after'],
      es: ['90 minutos — desechar después', '2 horas — desechar después', '30 minutos — desechar después', '4 horas — desechar después'],
    },
    correctIndex: 0,
    explanation: {
      en: '90-minute hold limit for drip coffee. Label the airpot with the brew time. Pull and discard at 90 minutes. Never serve coffee that has been sitting longer than 90 minutes.',
      es: 'Límite de conservación de 90 minutos para el café de filtro. Etiqueta el airpot con la hora de preparación. Retira y desecha a los 90 minutos. Nunca sirvas café que haya estado más de 90 minutos.',
    },
  },
  {
    id: 'q6',
    question: {
      en: 'What is the hold time limit for Earl Grey concentrate?',
      es: '¿Cuál es el límite de tiempo de conservación del concentrado de Earl Grey?',
    },
    options: {
      en: ['2 hours during service', '90 minutes during service', '4 hours during service', '7 days refrigerated'],
      es: ['2 horas durante el servicio', '90 minutos durante el servicio', '4 horas durante el servicio', '7 días refrigerado'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Earl Grey concentrate for the Lavender Honey Fog has a 2-hour hold limit during service. Brew fresh every 2 hours. This is a during-service task.',
      es: 'El concentrado de Earl Grey para el Lavender Honey Fog tiene un límite de conservación de 2 horas durante el servicio. Prepara fresco cada 2 horas. Esto es una tarea durante el servicio.',
    },
  },
  {
    id: 'q7',
    question: {
      en: 'What should you do if you discover the refrigerator temp is above 41°F?',
      es: '¿Qué debes hacer si descubres que la temperatura del refrigerador está por encima de 41°F?',
    },
    options: {
      en: ['Notify owner immediately and check all TCS product', 'Wait 30 minutes and check again', 'Continue service and monitor', 'Discard everything immediately without calling'],
      es: ['Notificar al dueño de inmediato y revisar todos los productos TCS', 'Esperar 30 minutos y revisar de nuevo', 'Continuar el servicio y monitorear', 'Desechar todo de inmediato sin llamar'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Notify the owner immediately. Check all TCS products. Pull any TCS food that has been above temperature for over 4 hours. Do not continue service with TCS products until temperature is confirmed safe.',
      es: 'Notifica al dueño de inmediato. Revisa todos los productos TCS. Retira cualquier alimento TCS que haya estado por encima de la temperatura durante más de 4 horas. No continúes el servicio con productos TCS hasta que la temperatura sea confirmada como segura.',
    },
  },
  {
    id: 'q8',
    question: {
      en: 'Why do we never use raw honey directly in drinks?',
      es: '¿Por qué nunca usamos miel cruda directamente en las bebidas?',
    },
    options: {
      en: ['Cold liquid will not dissolve raw honey — it clumps', 'Raw honey is too expensive for individual drinks', 'Raw honey changes the drink color', 'Raw honey is not available locally'],
      es: ['El líquido frío no disuelve la miel cruda — se apelmaza', 'La miel cruda es demasiado costosa para bebidas individuales', 'La miel cruda cambia el color de la bebida', 'La miel cruda no está disponible localmente'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Cold liquid will not dissolve raw honey — it clumps and creates uneven sweetness. House-made honey syrup dissolves fully and delivers consistent flavor every time.',
      es: 'El líquido frío no disuelve la miel cruda — se apelmaza y crea dulzura irregular. El jarabe de miel casero se disuelve completamente y entrega sabor consistente siempre.',
    },
  },
  {
    id: 'q9',
    question: {
      en: 'What is the minimum handwash duration?',
      es: '¿Cuál es la duración mínima para lavarse las manos?',
    },
    options: {
      en: ['20 seconds with soap and water', '10 seconds with soap and water', '30 seconds with water only', '5 seconds with sanitizer'],
      es: ['20 segundos con jabón y agua', '10 segundos con jabón y agua', '30 segundos solo con agua', '5 segundos con sanitizante'],
    },
    correctIndex: 0,
    explanation: {
      en: '20 seconds minimum with soap and water at 100°F. Sanitizer gel is not a substitute for handwashing. Handwashing is required before service and after any contamination event.',
      es: 'Mínimo 20 segundos con jabón y agua a 100°F. El gel sanitizante no es sustituto del lavado de manos. El lavado de manos es obligatorio antes del servicio y después de cualquier evento de contaminación.',
    },
  },
  {
    id: 'q10',
    question: {
      en: 'What are the three brand pillars of Quez Coffee Co.?',
      es: '¿Cuáles son los tres pilares de la marca Quez Coffee Co.?',
    },
    options: {
      en: [
        'Veteran-owned · Honey-crafted · Community-rooted',
        'Drive-thru · Online · Catering',
        'Fast · Cheap · Convenient',
        'Coffee · Tea · Lemonade',
      ],
      es: [
        'Propiedad de veterano · Elaborado con miel · Arraigado en la comunidad',
        'Drive-thru · En línea · Catering',
        'Rápido · Barato · Conveniente',
        'Café · Té · Limonada',
      ],
    },
    correctIndex: 0,
    explanation: {
      en: 'Veteran-owned, honey-crafted, community-rooted — these are the three brand pillars. They are authentic, unreplicable by corporate competitors, and reinforced at every touchpoint. Every shift you live all three.',
      es: 'Propiedad de veterano, elaborado con miel, arraigado en la comunidad — estos son los tres pilares de la marca. Son auténticos, los competidores corporativos no pueden replicarlos, y se refuerzan en cada interacción. En cada turno vives los tres.',
    },
  },
  {
    id: 'q11',
    question: {
      en: 'A customer complains that their drink tastes wrong. What is the correct first response?',
      es: 'Un cliente se queja de que su bebida sabe mal. ¿Cuál es la primera respuesta correcta?',
    },
    options: {
      en: ['Apologize immediately and offer to remake', 'Explain what went into the drink', 'Ask if they ordered correctly', 'Offer a discount instead of a remake'],
      es: ['Disculparse de inmediato y ofrecer rehacer', 'Explicar qué ingredientes lleva la bebida', 'Preguntar si ordenaron correctamente', 'Ofrecer un descuento en lugar de rehacer'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Apologize immediately — no argument, no defensiveness. Remake the drink without question. If the complaint is Severity 2 or higher, complete the Incident Log and notify the owner.',
      es: 'Disculparte de inmediato — sin argumentos, sin defensas. Rehacer la bebida sin preguntas. Si la queja es de Gravedad 2 o superior, completa el Registro de Incidentes y notifica al dueño.',
    },
  },
  {
    id: 'q12',
    question: {
      en: 'Where must waste water be disposed of?',
      es: '¿Dónde deben desecharse las aguas residuales?',
    },
    options: {
      en: ['An approved dump site — logged every closing', 'Any floor drain at the closest gas station', 'Storm drain or gutter adjacent to the unit', 'On-site — buried or evaporated'],
      es: ['Un sitio de descarga aprobado — registrado cada cierre', 'Cualquier desagüe de piso en la gasolinera más cercana', 'Desagüe pluvial o cuneta adyacente a la unidad', 'En el sitio — enterrado o evaporado'],
    },
    correctIndex: 0,
    explanation: {
      en: 'Waste water must be dumped at an approved site and the site name logged on the Daily Operations Log at every closing. Improper disposal is an environmental violation and can suspend your permit.',
      es: 'Las aguas residuales deben descargarse en un sitio aprobado y el nombre del sitio debe registrarse en el Registro de Operaciones Diarias en cada cierre. La eliminación incorrecta es una violación ambiental y puede suspender tu permiso.',
    },
  },
  {
    id: 'q13',
    question: {
      en: 'Which of the following triggers an immediate call to the owner?',
      es: '¿Cuál de los siguientes desencadena una llamada inmediata al dueño?',
    },
    options: {
      en: ['A DIAL inspector arrives at the coffee bar', 'A customer asks for extra ice', 'The blender needs cleaning', 'You ran out of oat milk'],
      es: ['Un inspector de DIAL llega al bar de café', 'Un cliente pide más hielo', 'La licuadora necesita limpieza', 'Se agotó la leche de avena'],
    },
    correctIndex: 0,
    explanation: {
      en: 'An Iowa DIAL inspector visit is an immediate owner call. Other triggers: fridge above 41°F, equipment failure, safety incident, cash discrepancy, or Severity 2+ complaint.',
      es: 'Una visita de un inspector de Iowa DIAL es una llamada inmediata al dueño. Otros desencadenantes: refrigerador por encima de 41°F, falla de equipo, incidente de seguridad, discrepancia de efectivo o queja de Gravedad 2+.',
    },
  },
  {
    id: 'q14',
    question: {
      en: 'What is the shelf life of cold brew concentrate after filtering?',
      es: '¿Cuál es la vida útil del concentrado de cold brew después de filtrarlo?',
    },
    options: {
      en: ['7 days refrigerated', '3 days refrigerated', '14 days refrigerated', '24 hours refrigerated'],
      es: ['7 días refrigerado', '3 días refrigerado', '14 días refrigerado', '24 horas refrigerado'],
    },
    correctIndex: 0,
    explanation: {
      en: '7 days from filter date. Always label the container with brew date, filter date, and use-by date. Discard after 7 days — do not stretch the shelf life.',
      es: '7 días desde la fecha de filtrado. Siempre etiqueta el recipiente con la fecha de preparación, fecha de filtrado y fecha de vencimiento. Desechar después de 7 días — no extiendas la vida útil.',
    },
  },
  {
    id: 'q15',
    question: {
      en: 'Complete the brand statement: "Veteran-owned mobile craft coffee bar serving Iowa wildflower honey craft coffee — ___."',
      es: 'Completa el enunciado de marca: "Bar de café artesanal móvil de propiedad veterana, sirviendo café artesanal con miel silvestre de Iowa — ___."',
    },
    options: {
      en: ['crafted for the community', 'served with precision', 'built for speed', 'made in Council Bluffs'],
      es: ['elaborado para la comunidad', 'servido con precisión', 'construido para la velocidad', 'hecho en Council Bluffs'],
    },
    correctIndex: 0,
    explanation: {
      en: '"Crafted for the community." This is the full brand statement. Know it. Say it. Every interaction should feel like this sentence.',
      es: '"Elaborado para la comunidad." Este es el enunciado completo de la marca. Conócelo. Dilo. Cada interacción debe sentirse como esta oración.',
    },
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 2 — SUPERVISED HANDS-ON TRAINING SKILLS
// All skill groups and individual skills from E-03 New Hire Training Manual
// ⚠ prefix marks critical safety items
// ─────────────────────────────────────────────────────────────────────────────

export const phase2SkillGroups = [
  {
    id: 'opening',
    title: { en: 'Opening Procedures', es: 'Procedimientos de Apertura' },
    skills: [
      {
        id: 'op_01',
        critical: false,
        skill: {
          en: 'Arrive, park, and position the unit correctly',
          es: 'Llegar, estacionar y posicionar la unidad correctamente',
        },
        note: {
          en: 'Hitch secured, chocks in, level if needed',
          es: 'Enganche asegurado, calzas colocadas, nivelado si es necesario',
        },
      },
      {
        id: 'op_02',
        critical: true,
        skill: {
          en: 'Generator — start procedure, fuel check, exhaust direction confirmed',
          es: 'Generador — procedimiento de arranque, verificación de combustible, dirección del escape confirmada',
        },
        note: {
          en: 'Never run generator in enclosed space',
          es: 'Nunca enciendas el generador en un espacio cerrado',
        },
      },
      {
        id: 'op_03',
        critical: false,
        skill: {
          en: 'Fresh water tank — fill to capacity, inlet cap secured',
          es: 'Tanque de agua dulce — llenar a capacidad, tapa de entrada asegurada',
        },
        note: {
          en: 'Use food-safe hose only',
          es: 'Usa solo manguera apta para alimentos',
        },
      },
      {
        id: 'op_04',
        critical: true,
        skill: {
          en: 'Waste water tank — confirm empty before service begins',
          es: 'Tanque de aguas residuales — confirmar vacío antes de iniciar el servicio',
        },
        note: {
          en: 'Never begin service with full waste tank',
          es: 'Nunca inicies el servicio con el tanque de residuos lleno',
        },
      },
      {
        id: 'op_05',
        critical: false,
        skill: {
          en: 'Refrigerator — power on, temp reading confirmed ≤41°F',
          es: 'Refrigerador — encender, confirmar lectura de temperatura ≤41°F',
        },
        note: {
          en: 'Log temp on Daily Operations Log',
          es: 'Registra la temperatura en el Registro de Operaciones Diarias',
        },
      },
      {
        id: 'op_06',
        critical: false,
        skill: {
          en: 'Espresso machine — power on, purge, warm-up cycle',
          es: 'Máquina de espresso — encender, purgar, ciclo de calentamiento',
        },
        note: {
          en: 'Both machines warmed before first shot',
          es: 'Ambas máquinas calentadas antes del primer shot',
        },
      },
      {
        id: 'op_07',
        critical: true,
        skill: {
          en: 'Sanitizer solution — mix at 50–100 ppm, test strip used, log result',
          es: 'Solución sanitizante — mezclar a 50–100 ppm, usar tira de prueba, registrar resultado',
        },
        note: {
          en: 'Never skip — first thing after equipment on',
          es: 'Nunca omitir — lo primero después de encender el equipo',
        },
      },
      {
        id: 'op_08',
        critical: false,
        skill: {
          en: '3-compartment sink — wash, rinse, sanitize solutions set up',
          es: 'Fregadero de 3 compartimentos — configurar soluciones de lavado, enjuague y sanitizado',
        },
        note: {
          en: 'Correct compartment sequence confirmed',
          es: 'Secuencia correcta de compartimentos confirmada',
        },
      },
      {
        id: 'op_09',
        critical: true,
        skill: {
          en: 'Handwash sink — soap stocked, paper towels stocked, water flowing hot',
          es: 'Lavabo de manos — jabón abastecido, toallas de papel abastecidas, agua caliente fluyendo',
        },
        note: {
          en: '100°F minimum at handwash',
          es: '100°F mínimo en el lavabo de manos',
        },
      },
      {
        id: 'op_10',
        critical: false,
        skill: {
          en: 'POS system — power on, float confirmed, tax rate set to 7%',
          es: 'Sistema POS — encender, caja confirmada, tasa de impuesto configurada al 7%',
        },
        note: {
          en: 'Never open window without POS active',
          es: 'Nunca abras la ventana sin el POS activo',
        },
      },
      {
        id: 'op_11',
        critical: false,
        skill: {
          en: 'Daily Operations Log — date, location, operator filled in',
          es: 'Registro de Operaciones Diarias — fecha, ubicación, operador completados',
        },
        note: {
          en: 'Every shift, every day',
          es: 'Cada turno, cada día',
        },
      },
      {
        id: 'op_12',
        critical: false,
        skill: {
          en: 'Test drink — pull shot, make a drink, taste it',
          es: 'Bebida de prueba — extraer shot, preparar una bebida, probarla',
        },
        note: {
          en: 'Catches problems before customers do',
          es: 'Detecta problemas antes que los clientes',
        },
      },
    ],
  },
  {
    id: 'espresso',
    title: { en: 'Espresso Extraction', es: 'Extracción de Espresso' },
    skills: [
      {
        id: 'es_00',
        critical: true,
        skill: {
          en: 'House extraction standard — memorize: 18g in / 36g out / 25–30s / 200°F brew (1:2 ratio)',
          es: 'Estándar de extracción — memorizar: 18g entrada / 36g salida / 25–30s / 200°F (proporción 1:2)',
        },
        note: {
          en: 'Every shot. Every time. If any of those four numbers is wrong, the shot is wrong.',
          es: 'Cada shot. Siempre. Si alguno de esos cuatro números está mal, el shot está mal.',
        },
      },
      {
        id: 'es_01',
        critical: false,
        skill: {
          en: 'Portafilter — remove, knock, wipe clean',
          es: 'Portafiltro — retirar, golpear, limpiar',
        },
        note: {
          en: 'Never pull a shot in a wet portafilter',
          es: 'Nunca extraigas un shot en un portafiltro mojado',
        },
      },
      {
        id: 'es_02',
        critical: false,
        skill: {
          en: 'Dose — 18g coffee per double shot (weigh, every time)',
          es: 'Dosis — 18g de café por shot doble (pesar, siempre)',
        },
        note: {
          en: 'Eyeballed doses cost money and break consistency. Scale lives next to the grinder.',
          es: 'Dosis a ojo cuestan dinero y rompen la consistencia. La balanza vive junto al molino.',
        },
      },
      {
        id: 'es_03',
        critical: false,
        skill: {
          en: 'Tamp — level, firm, consistent pressure',
          es: 'Tamp — nivelado, firme, presión consistente',
        },
        note: {
          en: 'Do not rock tamp — flat and level',
          es: 'No inclines el tamp — plano y nivelado',
        },
      },
      {
        id: 'es_04',
        critical: false,
        skill: {
          en: 'Pull shot — 25–30 seconds, 36g out',
          es: 'Extraer shot — 25–30 segundos, 36g de salida',
        },
        note: {
          en: 'Watch color — stop if blonding begins',
          es: 'Observa el color — detén si comienza el rubio',
        },
      },
      {
        id: 'es_05',
        critical: false,
        skill: {
          en: 'Shot quality identification — golden crema, correct color',
          es: 'Identificación de calidad del shot — crema dorada, color correcto',
        },
        note: {
          en: 'Pale = under-extracted. Dark/fast = over-extracted.',
          es: 'Pálido = sub-extraído. Oscuro/rápido = sobre-extraído.',
        },
      },
      {
        id: 'es_06',
        critical: true,
        skill: {
          en: 'Grind adjustment — coarser if pull > 30s, finer if pull < 25s; one notch at a time',
          es: 'Ajuste de molienda — más grueso si extracción > 30s, más fino si < 25s; una muesca a la vez',
        },
        note: {
          en: 'Re-dial whenever humidity or bean batch changes. One notch = ~3 seconds on extraction time.',
          es: 'Recalibra cuando cambie humedad o lote de granos. Una muesca = ~3 segundos en tiempo de extracción.',
        },
      },
      {
        id: 'es_07',
        critical: true,
        skill: {
          en: 'Taste diagnostic — sour = under-extracted (grind finer), bitter = over-extracted (grind coarser)',
          es: 'Diagnóstico de sabor — ácido = sub-extraído (moler más fino), amargo = sobre-extraído (moler más grueso)',
        },
        note: {
          en: 'Taste every batch dial-in. Numbers without taste = pretty math, bad coffee.',
          es: 'Prueba cada calibración. Números sin sabor = matemática bonita, mal café.',
        },
      },
      {
        id: 'es_08',
        critical: false,
        skill: {
          en: 'Channeling check — visually inspect crema flow; single uniform stream, no jets or pale streaks',
          es: 'Verificación de canalización — inspeccionar flujo de crema; chorro único uniforme, sin chorros ni rayas pálidas',
        },
        note: {
          en: 'Channeling = uneven tamp or distribution. Pull again. Re-tamp.',
          es: 'Canalización = tamp desigual o mala distribución. Vuelve a extraer. Vuelve a apisonar.',
        },
      },
    ],
  },
  {
    id: 'milk',
    title: { en: 'Milk Steaming', es: 'Vaporización de Leche' },
    skills: [
      {
        id: 'mk_01',
        critical: false,
        skill: {
          en: 'Whole milk — steam to 150°F, microfoam texture',
          es: 'Leche entera — vaporizar a 150°F, textura de microespuma',
        },
        note: {
          en: 'Tap and swirl before pouring',
          es: 'Golpear y girar antes de verter',
        },
      },
      {
        id: 'mk_02',
        critical: false,
        skill: {
          en: 'Oat milk barista — steam to 140–145°F',
          es: 'Leche de avena barista — vaporizar a 140–145°F',
        },
        note: {
          en: 'Scorches faster — watch temperature',
          es: 'Se quema más rápido — vigila la temperatura',
        },
      },
      {
        id: 'mk_03',
        critical: false,
        skill: {
          en: 'Texture check — glossy, velvety, no large bubbles',
          es: 'Verificación de textura — brillante, aterciopelada, sin burbujas grandes',
        },
        note: {
          en: 'Grainy = over-steamed or wrong milk',
          es: 'Granulosa = sobre-vaporizada o leche incorrecta',
        },
      },
      {
        id: 'mk_04',
        critical: true,
        skill: {
          en: 'Steam wand purge — before and after every use',
          es: 'Purgar la varita de vapor — antes y después de cada uso',
        },
        note: {
          en: 'Milk residue burns and harbors bacteria',
          es: 'El residuo de leche se quema y alberga bacterias',
        },
      },
    ],
  },
  {
    id: 'syrup',
    title: { en: 'Syrup & Sauce Handling', es: 'Manejo de Jarabes y Salsas' },
    skills: [
      {
        id: 'sy_01',
        critical: false,
        skill: {
          en: 'Build sequence — syrups first, always',
          es: 'Secuencia de preparación — jarabes primero, siempre',
        },
        note: {
          en: 'Espresso dissolves syrups — add before shot',
          es: 'El espresso disuelve los jarabes — agregar antes del shot',
        },
      },
      {
        id: 'sy_02',
        critical: true,
        skill: {
          en: 'Stir after espresso — 3 seconds every time',
          es: 'Revolver después del espresso — 3 segundos siempre',
        },
        note: {
          en: 'This is not optional',
          es: 'Esto no es opcional',
        },
      },
      {
        id: 'sy_03',
        critical: true,
        skill: {
          en: 'Honey syrup — pump only, never raw honey in drinks',
          es: 'Jarabe de miel — solo bomba, nunca miel cruda en bebidas',
        },
        note: {
          en: 'Cold liquid will not dissolve raw honey',
          es: 'El líquido frío no disuelve la miel cruda',
        },
      },
      {
        id: 'sy_04',
        critical: false,
        skill: {
          en: 'Drizzle technique — one clean spiral pass',
          es: 'Técnica de drizzle — un paso espiral limpio',
        },
        note: {
          en: 'Messy drizzle = sloppy presentation',
          es: 'Drizzle desordenado = presentación descuidada',
        },
      },
    ],
  },
  {
    id: 'iced',
    title: { en: 'Iced Drink Build', es: 'Preparación de Bebida Fría' },
    skills: [
      {
        id: 'ic_01',
        critical: true,
        skill: {
          en: 'Build sequence for iced — syrups, shot, stir, milk, then ice',
          es: 'Secuencia para bebida fría — jarabes, shot, revolver, leche, luego hielo',
        },
        note: {
          en: 'Never ice first',
          es: 'Nunca hielo primero',
        },
      },
      {
        id: 'ic_02',
        critical: false,
        skill: {
          en: 'Ice level — 3/4 cup before liquid',
          es: 'Nivel de hielo — 3/4 de taza antes del líquido',
        },
        note: {
          en: 'Too much ice = diluted drink. Too little = warm.',
          es: 'Demasiado hielo = bebida diluida. Muy poco = tibia.',
        },
      },
    ],
  },
  {
    id: 'coldbrew',
    title: { en: 'Cold Brew', es: 'Cold Brew' },
    skills: [
      {
        id: 'cb_01',
        critical: false,
        skill: {
          en: 'Cold brew — storage location and hold time (7 days from filter date)',
          es: 'Cold brew — ubicación de almacenamiento y tiempo de conservación (7 días desde filtrado)',
        },
        note: {
          en: 'Label with brew date and use-by',
          es: 'Etiquetar con fecha de preparación y vencimiento',
        },
      },
      {
        id: 'cb_02',
        critical: true,
        skill: {
          en: 'Syrup dissolve step — 1oz hot water before cold brew',
          es: 'Paso de disolución de jarabe — 1oz de agua caliente antes del cold brew',
        },
        note: {
          en: 'Cold brew will not dissolve syrups',
          es: 'El cold brew no disuelve los jarabes',
        },
      },
      {
        id: 'cb_03',
        critical: true,
        skill: {
          en: 'Cold brew nightly brew protocol — coarse grind, 18–24 hours, filter, label',
          es: 'Protocolo nocturno de cold brew — molienda gruesa, 18–24 horas, filtrar, etiquetar',
        },
        note: {
          en: 'This is a nightly task — not weekly',
          es: 'Esta es una tarea nocturna — no semanal',
        },
      },
    ],
  },
  {
    id: 'syrup_prep',
    title: { en: 'House-Made Syrup Prep', es: 'Preparación de Jarabes Caseros' },
    skills: [
      {
        id: 'sp_01',
        critical: false,
        skill: {
          en: 'Honey syrup (base) — recipe: 1:1 honey to hot water, whisk until clear',
          es: 'Jarabe de miel (base) — receta: 1:1 miel con agua caliente, batir hasta aclarar',
        },
        note: {
          en: 'Label: 14-day shelf life',
          es: 'Etiquetar: vida útil de 14 días',
        },
      },
      {
        id: 'sp_02',
        critical: true,
        skill: {
          en: 'Hot honey syrup — cayenne level is fixed. Do not adjust.',
          es: 'Jarabe de miel picante — el nivel de cayena es fijo. No ajustar.',
        },
        note: {
          en: 'Heat level is the product',
          es: 'El nivel de picor es el producto',
        },
      },
      {
        id: 'sp_03',
        critical: true,
        skill: {
          en: 'Lavender honey syrup — food-grade lavender only, 15 min steep max',
          es: 'Jarabe de miel de lavanda — solo lavanda grado alimenticio, 15 min de infusión máximo',
        },
        note: {
          en: 'Never use decorative lavender',
          es: 'Nunca uses lavanda decorativa',
        },
      },
      {
        id: 'sp_04',
        critical: true,
        skill: {
          en: 'Label protocol — product name, date made, use-by (14 days)',
          es: 'Protocolo de etiquetado — nombre del producto, fecha de elaboración, vencimiento (14 días)',
        },
        note: {
          en: 'DIAL inspectors check labels. Unlabeled = violation.',
          es: 'Los inspectores de DIAL verifican etiquetas. Sin etiqueta = violación.',
        },
      },
    ],
  },
  {
    id: 'drip_frappe',
    title: { en: 'Drip Coffee & Frappes', es: 'Café de Filtro y Frappés' },
    skills: [
      {
        id: 'df_01',
        critical: true,
        skill: {
          en: 'Drip coffee hold limit — 90 minutes maximum. Pull and discard after.',
          es: 'Límite de conservación del café de filtro — 90 minutos máximo. Retirar y desechar después.',
        },
        note: {
          en: 'Never serve coffee past 90 minutes',
          es: 'Nunca sirvas café pasados los 90 minutos',
        },
      },
      {
        id: 'df_02',
        critical: true,
        skill: {
          en: 'Blender safety — lid secured before running. Build sequence — liquids first, ice on top.',
          es: 'Seguridad de la licuadora — tapa asegurada antes de encender. Secuencia — líquidos primero, hielo arriba.',
        },
        note: {
          en: 'Never run without lid',
          es: 'Nunca encendas sin tapa',
        },
      },
    ],
  },
  {
    id: 'kds',
    title: { en: 'Quez App KDS (Bar Display)', es: 'Quez App KDS (Pantalla de Barra)' },
    skills: [
      {
        id: 'kd_01',
        critical: true,
        skill: {
          en: 'Open Quez App → Orders → Queue. This is your bar at-a-glance.',
          es: 'Abre Quez App → Pedidos → Cola. Esta es tu barra de un vistazo.',
        },
        note: {
          en: 'Square Terminal rings orders at the window; the KDS shows them to you on the bar iPad in real time.',
          es: 'Square Terminal registra pedidos en la ventana; el KDS te los muestra en el iPad de la barra en tiempo real.',
        },
      },
      {
        id: 'kd_02',
        critical: true,
        skill: {
          en: 'Read the timer color — green = under 3 min (build), yellow = 3–5 min (move), red = 5+ min (apologize)',
          es: 'Leer color del cronómetro — verde = menos de 3 min (preparar), amarillo = 3–5 min (acelera), rojo = 5+ min (disculparse)',
        },
        note: {
          en: 'Red tickets get priority over fresh orders. Customer service > FIFO.',
          es: 'Boletos rojos tienen prioridad sobre pedidos nuevos. Servicio al cliente > FIFO.',
        },
      },
      {
        id: 'kd_03',
        critical: false,
        skill: {
          en: 'Tap RECIPE on any drink if you forget the build — modal shows steps with modifier adjustments highlighted',
          es: 'Toca RECETA en cualquier bebida si olvidas la preparación — la ventana muestra pasos con modificadores resaltados',
        },
        note: {
          en: 'No shame in pulling the recipe. Wrong drink wastes more time than the lookup.',
          es: 'No hay vergüenza en consultar la receta. Una bebida mal hecha pierde más tiempo que la consulta.',
        },
      },
      {
        id: 'kd_04',
        critical: true,
        skill: {
          en: 'Watch for the SPECIAL ORDER red banner — honey-on-ice needs dissolve-in-hot-espresso step FIRST',
          es: 'Vigila el banner rojo PEDIDO ESPECIAL — miel sobre hielo requiere disolver en espresso CALIENTE PRIMERO',
        },
        note: {
          en: 'Honey will not dissolve in cold liquid. Skipping this step = customer-facing failure.',
          es: 'La miel no se disuelve en líquido frío. Saltar este paso = falla visible para el cliente.',
        },
      },
      {
        id: 'kd_05',
        critical: false,
        skill: {
          en: 'Mark Complete = single tap. Even if the order has 5 drinks, one tap closes it when you hand it to the customer.',
          es: 'Marcar Completo = un solo toque. Aun si el pedido tiene 5 bebidas, un toque lo cierra al entregarlo.',
        },
        note: {
          en: 'No need to check off each drink individually. Build them all, hand them off, then bump.',
          es: 'No necesitas marcar cada bebida individualmente. Prepáralas todas, entrégalas, luego cierra.',
        },
      },
      {
        id: 'kd_06',
        critical: false,
        skill: {
          en: 'Mistake? 5-second Undo toast on Complete. After that, use Recent → Recall to reopen.',
          es: '¿Error? Aviso de Deshacer durante 5 segundos al completar. Después, usa Recientes → Reabrir.',
        },
        note: {
          en: 'Recent only shows today\'s orders. After midnight, completed orders cannot be recalled.',
          es: 'Recientes solo muestra pedidos de hoy. Después de medianoche, no se pueden reabrir.',
        },
      },
      {
        id: 'kd_07',
        critical: false,
        skill: {
          en: 'New-order chime — soft two-tone ding when a ticket lands. Keep volume up during peak.',
          es: 'Aviso de pedido nuevo — campanilla suave de dos tonos cuando llega un boleto. Mantén volumen durante hora pico.',
        },
        note: {
          en: 'iPad volume controls the chime. Mute mode silences it.',
          es: 'El volumen del iPad controla la campanilla. Modo silencio la apaga.',
        },
      },
    ],
  },
  {
    id: 'pos_service',
    title: { en: 'POS & Customer Service', es: 'POS y Servicio al Cliente' },
    skills: [
      {
        id: 'ps_01',
        critical: false,
        skill: {
          en: 'Ring every sale — no exceptions, no comps without owner approval',
          es: 'Registrar cada venta — sin excepciones, sin cortesías sin aprobación del dueño',
        },
        note: {
          en: 'Every transaction recorded',
          es: 'Cada transacción registrada',
        },
      },
      {
        id: 'ps_02',
        critical: true,
        skill: {
          en: 'Sales tax — 7% applied automatically, never waived',
          es: 'Impuesto sobre ventas — 7% aplicado automáticamente, nunca eliminado',
        },
        note: {
          en: 'Tax is collected not earned',
          es: 'El impuesto se recauda, no se gana',
        },
      },
      {
        id: 'ps_03',
        critical: false,
        skill: {
          en: 'Modifier upsells — size, oat milk, extra shot, honey add-on',
          es: 'Ventas adicionales — tamaño, leche de avena, shot extra, adición de miel',
        },
        note: {
          en: 'One natural offer per transaction',
          es: 'Una oferta natural por transacción',
        },
      },
      {
        id: 'ps_04',
        critical: true,
        skill: {
          en: 'Customer complaint handling — apologize, remake, log if Severity 2+',
          es: 'Manejo de quejas de clientes — disculparse, rehacer, registrar si Gravedad 2+',
        },
        note: {
          en: 'Never argue at the window',
          es: 'Nunca discutas en la ventana',
        },
      },
    ],
  },
  {
    id: 'closing',
    title: { en: 'Closing Procedures', es: 'Procedimientos de Cierre' },
    skills: [
      {
        id: 'cl_01',
        critical: true,
        skill: {
          en: 'All food stored or discarded — no TCS food left unrefrigerated',
          es: 'Todos los alimentos almacenados o desechados — ningún alimento TCS sin refrigerar',
        },
        note: {
          en: 'No open product overnight',
          es: 'Ningún producto abierto de un día para otro',
        },
      },
      {
        id: 'cl_02',
        critical: true,
        skill: {
          en: 'Espresso machine — backflush with cleaning tablet',
          es: 'Máquina de espresso — retrolavado con tableta de limpieza',
        },
        note: {
          en: 'Per machine manual',
          es: 'Según el manual de la máquina',
        },
      },
      {
        id: 'cl_03',
        critical: true,
        skill: {
          en: '3-compartment sink — wash, rinse, sanitize all equipment, drain',
          es: 'Fregadero de 3 compartimentos — lavar, enjuagar, sanitizar todo el equipo, drenar',
        },
        note: {
          en: 'Fully drain — standing water breeds bacteria',
          es: 'Drenar completamente — el agua estancada crea bacterias',
        },
      },
      {
        id: 'cl_04',
        critical: true,
        skill: {
          en: 'Waste water tank — dump at approved site',
          es: 'Tanque de aguas residuales — vaciar en sitio aprobado',
        },
        note: {
          en: 'Log dump site on Daily Operations Log',
          es: 'Registrar sitio de descarga en el Registro de Operaciones Diarias',
        },
      },
      {
        id: 'cl_05',
        critical: true,
        skill: {
          en: 'Generator — shut down sequence, cool before storage',
          es: 'Generador — secuencia de apagado, enfriar antes de guardar',
        },
        note: {
          en: 'Never store hot generator in enclosed unit',
          es: 'Nunca almacenes un generador caliente en la unidad cerrada',
        },
      },
      {
        id: 'cl_06',
        critical: true,
        skill: {
          en: 'Daily Operations Log — closing section completed, operator initials',
          es: 'Registro de Operaciones Diarias — sección de cierre completada, iniciales del operador',
        },
        note: {
          en: 'Every line filled in',
          es: 'Cada línea completada',
        },
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 3 — DRINK PROFICIENCY (15 drinks, trainer observes each)
// ─────────────────────────────────────────────────────────────────────────────

export const phase3Drinks = [
  {
    id: 'drk_01',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Quez Honey Mocha',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_02',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Hot Honey Spice Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_03',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Golden Bear Cold Brew',
    prepType: { en: 'Iced Only', es: 'Solo Frío' },
  },
  {
    id: 'drk_04',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Lavender Honey Fog',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_05',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Honey Cinnamon Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_06',
    category: { en: 'Honey Signature Line', es: 'Línea Signature de Miel' },
    name: 'Honey Cold Brew',
    prepType: { en: 'Iced Only', es: 'Solo Frío' },
  },
  {
    id: 'drk_07',
    category: { en: 'Espresso Classics', es: 'Clásicos de Espresso' },
    name: 'Vanilla Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_08',
    category: { en: 'Espresso Classics', es: 'Clásicos de Espresso' },
    name: 'Caramel Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_09',
    category: { en: 'Espresso Classics', es: 'Clásicos de Espresso' },
    name: 'Salted Caramel Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_10',
    category: { en: 'Espresso Classics', es: 'Clásicos de Espresso' },
    name: 'Americano',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_11',
    category: { en: 'Frappes — blender clearance required', es: 'Frappés — se requiere autorización de licuadora' },
    name: 'Caramel Crunch Frappe',
    prepType: { en: 'Blended Only', es: 'Solo Licuado' },
  },
  {
    id: 'drk_12',
    category: { en: 'Frappes — blender clearance required', es: 'Frappés — se requiere autorización de licuadora' },
    name: 'Mocha Frappe',
    prepType: { en: 'Blended Only', es: 'Solo Licuado' },
  },
  {
    id: 'drk_13',
    category: { en: 'Volume & Non-Coffee', es: 'Volumen y Sin Café' },
    name: 'Drip Coffee',
    prepType: { en: 'Hot Only', es: 'Solo Caliente' },
  },
  {
    id: 'drk_14',
    category: { en: 'Volume & Non-Coffee', es: 'Volumen y Sin Café' },
    name: 'Chai Latte',
    prepType: { en: 'Hot & Iced', es: 'Caliente y Frío' },
  },
  {
    id: 'drk_15',
    category: { en: 'Volume & Non-Coffee', es: 'Volumen y Sin Café' },
    name: 'Strawberry Lemonade',
    prepType: { en: 'Iced Only', es: 'Solo Frío' },
  },
];

// Quick-reference card for espresso extraction — shown in Phase 2 espresso group
export const espressoStandards = {
  en: [
    { label: 'Dose in',     value: '18g',         note: 'Weighed, never eyeballed.' },
    { label: 'Yield out',   value: '36g',         note: 'Double shot. 1:2 ratio.' },
    { label: 'Time',        value: '25–30 sec',   note: 'Start the clock when the pump engages.' },
    { label: 'Brew temp',   value: '200°F',       note: 'LUCCA A53 default; do not adjust without owner sign-off.' },
    { label: 'Steam pressure', value: '1.2 bar',  note: 'Read off the right-hand gauge.' },
    { label: 'Sour shot',   value: 'Grind finer',  note: 'Under-extracted. One notch finer, retry.' },
    { label: 'Bitter shot', value: 'Grind coarser', note: 'Over-extracted. One notch coarser, retry.' },
    { label: 'Channeling',  value: 'Re-tamp',     note: 'Uneven crema, jets, or pale streaks = bad distribution.' },
  ],
  es: [
    { label: 'Dosis entrada', value: '18g',        note: 'Pesada, nunca a ojo.' },
    { label: 'Salida',        value: '36g',        note: 'Shot doble. Proporción 1:2.' },
    { label: 'Tiempo',        value: '25–30 seg',  note: 'Inicia el cronómetro al activar la bomba.' },
    { label: 'Temp. extracción', value: '200°F',   note: 'Default LUCCA A53; no ajustar sin aprobación del dueño.' },
    { label: 'Presión vapor', value: '1.2 bar',    note: 'Lee del manómetro derecho.' },
    { label: 'Shot ácido',    value: 'Moler más fino',  note: 'Sub-extraído. Una muesca más fina, reintenta.' },
    { label: 'Shot amargo',   value: 'Moler más grueso', note: 'Sobre-extraído. Una muesca más gruesa, reintenta.' },
    { label: 'Canalización',  value: 'Re-apisonar', note: 'Crema desigual, chorros o rayas pálidas = mala distribución.' },
  ],
};

// Phase 3 pass standards (shown to trainer for reference)
export const phase3Standards = {
  en: [
    { label: 'Ingredients', desc: 'Correct pumps, correct products, correct sizes. Nothing added or missing.' },
    { label: 'Build Sequence', desc: 'Syrups first. Shot. Stir. Milk. Ice. In that order every time.' },
    { label: 'Presentation', desc: 'Clean drizzle, full whipped cream, correct lid. Does it look worth $6.50?' },
    { label: 'Build Time', desc: 'Hot: 60 sec. Iced: 45 sec. Frappes: 90 sec. Drip: 15 sec.' },
  ],
  es: [
    { label: 'Ingredientes', desc: 'Bombas correctas, productos correctos, tamaños correctos. Nada agregado ni faltante.' },
    { label: 'Secuencia de Preparación', desc: 'Jarabes primero. Shot. Revolver. Leche. Hielo. En ese orden siempre.' },
    { label: 'Presentación', desc: 'Drizzle limpio, crema batida completa, tapa correcta. ¿Se ve que vale $6.50?' },
    { label: 'Tiempo de Preparación', desc: 'Caliente: 60 seg. Frío: 45 seg. Frappés: 90 seg. Filtro: 15 seg.' },
  ],
};
