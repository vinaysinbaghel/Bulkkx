import { Category, CategoryTemplate, TemplateField } from '../types/domain';

export const FIXED_CORE_FIELDS: TemplateField[] = [
  {
    id: 'core_grade',
    name: 'grade',
    label: 'Standard Grade',
    type: 'text',
    required: true,
    matchable: true,
    shownOnCard: true,
    buyerVisible: true,
    requiredForTerms: true,
    description: 'Commercial commodity grade code or trade specification',
  },
  {
    id: 'core_quantity',
    name: 'quantity',
    label: 'Total Available Quantity',
    type: 'number',
    required: true,
    matchable: true,
    shownOnCard: true,
    buyerVisible: true,
    requiredForTerms: true,
    min: 1,
  },
  {
    id: 'core_unit',
    name: 'unit',
    label: 'Trading Unit',
    type: 'enum',
    required: true,
    matchable: true,
    shownOnCard: true,
    buyerVisible: true,
    requiredForTerms: true,
    options: [
      { value: 'MT', label: 'Metric Tonne (MT)' },
      { value: 'Quintal', label: 'Quintal (100 KG)' },
      { value: 'KG', label: 'Kilogram (KG)' },
      { value: 'Bale', label: 'Bale' },
    ],
  },
  {
    id: 'core_packaging',
    name: 'packaging',
    label: 'Packaging Type',
    type: 'enum',
    required: true,
    matchable: false,
    shownOnCard: false,
    buyerVisible: true,
    requiredForTerms: true,
    options: [
      { value: 'jute_bags_50kg', label: '50 KG Jute Bags' },
      { value: 'pp_bags_50kg', label: '50 KG HDPE/PP Bags' },
      { value: 'bulk_tanker', label: 'Loose / Bulk Tanker' },
      { value: 'carton_boxes', label: 'Corrugated Cartons' },
    ],
  },
  {
    id: 'core_lead_time_days',
    name: 'leadTimeDays',
    label: 'Dispatch Lead Time (Days)',
    type: 'number',
    required: true,
    matchable: true,
    shownOnCard: true,
    buyerVisible: true,
    requiredForTerms: true,
    min: 1,
    max: 30,
  },
  {
    id: 'core_lock_validity_hours',
    name: 'lockValidityHours',
    label: 'Price Lock Window (Hours)',
    type: 'number',
    required: true,
    matchable: false,
    shownOnCard: true,
    buyerVisible: false,
    requiredForTerms: false,
    min: 4,
    max: 72,
    defaultValue: 24,
  },
];

// Seed Category 1: Grains & Cereals (Wheat)
export const WHEAT_TEMPLATE: CategoryTemplate = {
  id: 'tmpl-wheat-v1',
  categoryId: 'cat-grains',
  version: 1,
  name: 'Milling & Sharbati Wheat Spec v1',
  description: 'Standard trading spec for Lokwan, Sharbati, and Milling grade wheat across MP/Punjab/Rajasthan Mandis',
  published: true,
  publishedAt: '2026-10-01T00:00:00.000Z',
  createdBy: 'system_admin',
  coreFields: FIXED_CORE_FIELDS,
  categoryFields: [
    {
      id: 'wheat_variety',
      name: 'variety',
      label: 'Wheat Variety',
      type: 'enum',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      options: [
        { value: 'sharbati', label: 'Sharbati (MP Premium)' },
        { value: 'lokwan', label: 'Lokwan (Standard)' },
        { value: 'malavraj', label: 'Malavraj Durum' },
        { value: 'mill_quality', label: 'Milling Quality (Industrial)' },
      ],
    },
    {
      id: 'wheat_moisture',
      name: 'moisturePercent',
      label: 'Moisture Content (%)',
      type: 'number',
      unit: '%',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      min: 8,
      max: 14,
      description: 'Maximum allowable moisture percentage (typically max 12% in Mandis)',
    },
    {
      id: 'wheat_foreign_matter',
      name: 'foreignMatterPercent',
      label: 'Foreign Matter / Admixture (%)',
      type: 'number',
      unit: '%',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      min: 0,
      max: 3,
    },
    {
      id: 'wheat_protein',
      name: 'proteinPercent',
      label: 'Protein Content (Dry Basis %)',
      type: 'number',
      unit: '%',
      required: false,
      matchable: true,
      shownOnCard: false,
      buyerVisible: true,
      requiredForTerms: false,
      min: 9,
      max: 16,
    },
  ],
};

// Seed Category 2: Spices (Red Chilli)
export const CHILLI_TEMPLATE: CategoryTemplate = {
  id: 'tmpl-chilli-v1',
  categoryId: 'cat-spices',
  version: 1,
  name: 'Dry Red Chilli Spec v1',
  description: 'Standard trading spec for Teja, Sanam 334, and Byadgi chillies across Guntur/Warangal markets',
  published: true,
  publishedAt: '2026-10-01T00:00:00.000Z',
  createdBy: 'system_admin',
  coreFields: FIXED_CORE_FIELDS,
  categoryFields: [
    {
      id: 'chilli_variety',
      name: 'variety',
      label: 'Chilli Variety',
      type: 'enum',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      options: [
        { value: 'teja_s17', label: 'Teja S17 (High Pungency)' },
        { value: 'sanam_s4_334', label: 'Sanam S4 / 334 (Medium Heat)' },
        { value: 'byadgi', label: 'Byadgi (High Colour, Low Heat)' },
        { value: 'wr_273', label: '273 / Wonder Hot' },
      ],
    },
    {
      id: 'chilli_stem_status',
      name: 'stemStatus',
      label: 'Stem Option',
      type: 'enum',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      options: [
        { value: 'with_stem', label: 'Stem With (Whole)' },
        { value: 'stemless', label: 'Stemless (De-stemmed)' },
        { value: 'semi_stemless', label: 'Semi-Stemless (Cut Stem)' },
      ],
    },
    {
      id: 'chilli_shu',
      name: 'heatPungencySHU',
      label: 'Heat / Pungency (SHU)',
      type: 'number',
      unit: 'SHU',
      required: false,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: false,
      min: 10000,
      max: 100000,
    },
    {
      id: 'chilli_moisture',
      name: 'moisturePercent',
      label: 'Moisture (%)',
      type: 'number',
      unit: '%',
      required: true,
      matchable: true,
      shownOnCard: false,
      buyerVisible: true,
      requiredForTerms: true,
      min: 8,
      max: 12,
    },
  ],
};

// Seed Category 3: Industrial Polymers (Polypropylene)
export const POLYMER_TEMPLATE: CategoryTemplate = {
  id: 'tmpl-polymer-v1',
  categoryId: 'cat-polymers',
  version: 1,
  name: 'Polypropylene (PP) Granules Spec v1',
  description: 'Standard industrial polymer specifications for injection moulding, raffia, and blow moulding grades',
  published: true,
  publishedAt: '2026-10-01T00:00:00.000Z',
  createdBy: 'system_admin',
  coreFields: FIXED_CORE_FIELDS,
  categoryFields: [
    {
      id: 'polymer_grade_type',
      name: 'polymerGradeType',
      label: 'Polymer Grade Type',
      type: 'enum',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      options: [
        { value: 'raffia', label: 'Raffia / Woven Sacks' },
        { value: 'injection_moulding', label: 'Injection Moulding' },
        { value: 'film_extrusion', label: 'TQ / BOPP Film Extrusion' },
        { value: 'thermoforming', label: 'Thermoforming' },
      ],
    },
    {
      id: 'polymer_mfi',
      name: 'meltFlowIndexMFI',
      label: 'Melt Flow Index (g/10 min)',
      type: 'number',
      unit: 'g/10min',
      required: true,
      matchable: true,
      shownOnCard: true,
      buyerVisible: true,
      requiredForTerms: true,
      min: 0.5,
      max: 40,
    },
    {
      id: 'polymer_density',
      name: 'density',
      label: 'Density (g/cm³)',
      type: 'number',
      unit: 'g/cm³',
      required: true,
      matchable: false,
      shownOnCard: false,
      buyerVisible: true,
      requiredForTerms: true,
      min: 0.89,
      max: 0.92,
    },
  ],
};

export const SEED_CATEGORIES: Category[] = [
  {
    id: 'cat-grains',
    name: 'Grains & Cereals',
    slug: 'grains-and-cereals',
    description: 'Wheat, Rice, Maize, Bajra and Barley direct from processing hubs & APMCs',
    activeTemplateId: 'tmpl-wheat-v1',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'cat-spices',
    name: 'Spices',
    slug: 'spices',
    description: 'Guntur Dry Chillies, Turmeric, Cumin and Coriander with certified quality parameters',
    activeTemplateId: 'tmpl-chilli-v1',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'cat-polymers',
    name: 'Industrial Polymers',
    slug: 'industrial-polymers',
    description: 'Virgin & Reprocessed PP, HDPE, LDPE, and PVC granules from petrochemical manufacturers',
    activeTemplateId: 'tmpl-polymer-v1',
    active: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
];

/**
 * Validates attribute payload against a template
 */
export function validateAttributesAgainstTemplate(
  attributes: Record<string, any>,
  template: CategoryTemplate
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const allFields = [...template.coreFields, ...template.categoryFields];

  for (const field of allFields) {
    const val = attributes[field.name];

    if (field.required && (val === undefined || val === null || val === '')) {
      errors.push(`Field '${field.label}' (${field.name}) is required.`);
      continue;
    }

    if (val !== undefined && val !== null && val !== '') {
      if (field.type === 'number') {
        const num = Number(val);
        if (isNaN(num)) {
          errors.push(`Field '${field.label}' must be a number.`);
        } else {
          if (field.min !== undefined && num < field.min) {
            errors.push(`Field '${field.label}' must be at least ${field.min}.`);
          }
          if (field.max !== undefined && num > field.max) {
            errors.push(`Field '${field.label}' cannot exceed ${field.max}.`);
          }
        }
      } else if (field.type === 'enum' && field.options) {
        const validValues = field.options.map((o) => o.value);
        if (!validValues.includes(String(val))) {
          errors.push(`Field '${field.label}' value '${val}' is not one of: ${validValues.join(', ')}`);
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
