// --- Types ---

export interface Material {
  id: string;
  name: string;
  brand: string;
  spoolPrice: number;   // €
  spoolWeight: number;  // kg
  density: number;      // g/cm³
  nozzleTemp: number;   // °C
  bedTemp: number;      // °C
}

export type BedSize = "small" | "medium" | "large" | "xlarge";

export const BED_SIZE_OPTIONS: { value: BedSize; label: string; maxW: number }[] = [
  { value: "small",  label: "Petit (≤200 mm, ex: Ender 3)",           maxW: 120 },
  { value: "medium", label: "Moyen (~235 mm, ex: Bambu Lab)",         maxW: 180 },
  { value: "large",  label: "Grand (~300 mm, ex: Prusa Core One L)",  maxW: 250 },
  { value: "xlarge", label: "Très grand (400 mm+, ex: Ender 5 Max)",  maxW: 450 },
];

export interface Parameters {
  electricityCost: number;      // €/kWh
  laborRate: number;           // €/h
  failureRate: number;         // 0-1
  vatRate: number;             // 0-1
  profitMargin: number;        // 0-1
  bedSize: BedSize;
  tierQuantities: number[];    // ex: [1, 5, 10, 25, 50, 100, 150]
  discountStep: number;        // 0-1 (ex: 0.05 = 5% par palier)
}

export interface PrintJob {
  projectName: string;
  materialId: string;
  weightGrams: number;
  printDurationHours: number;
  manualWorkHours: number;
  quantity: number;
  customBasePrice: number;
}

export interface PriceTier {
  quantity: number;
  discount: number;
  unitPrice: number;
  totalPrice: number;
}

export type Profitability = "OUI" | "FAIBLE" | "NON";

export interface SavedProject {
  id: string;
  projectName: string;
  objectNumber: string;
  unitPrice: number;
  client: string;
  date: string;           // ISO date string
  snapshot: PrintJob;     // full job snapshot for restore
  materialId: string;
  materialName: string;
}

export interface ConsumptionBreakdown {
  bedPower: number;          // W
  hotendPower: number;       // W
  motorsPower: number;       // W
  electronicsPower: number;  // W
  avgPowerW: number;         // W total
  warmupWh: number;          // Wh
  totalWh: number;           // Wh
  costEuros: number;         // €
}

export interface PriceResult {
  materialPricePerKg: number;
  materialCost: number;
  consumption: ConsumptionBreakdown;
  electricityCost: number;
  laborCost: number;
  directSubtotal: number;
  failureSurcharge: number;
  vat: number;
  totalUnitCost: number;
  profitMarginRate: number;
  marginAmount: number;
  recommendedUnitPrice: number;
  recommendedTotalPrice: number;
  customDiscount: number;
  customUnitPrice: number;
  customTotalPrice: number;
  recalculatedMargin: number;
  unitProfit: number;
  totalProfit: number;
  profitability: Profitability;
  tiers: PriceTier[];
}

// --- Default data ---

export const DEFAULT_MATERIALS: Material[] = [
  { id: "1", name: "PLA Standard", brand: "Bambu Lab",  spoolPrice: 23,     spoolWeight: 1,   density: 1.24, nozzleTemp: 205, bedTemp: 60  },
  { id: "2", name: "PLA Tough",    brand: "Polymaker",  spoolPrice: 44.58,  spoolWeight: 0.75,density: 1.24, nozzleTemp: 205, bedTemp: 60  },
  { id: "3", name: "PETG",         brand: "Bambu Lab",  spoolPrice: 26,     spoolWeight: 1,   density: 1.27, nozzleTemp: 235, bedTemp: 75  },
  { id: "4", name: "ABS",          brand: "Polymaker",  spoolPrice: 22,     spoolWeight: 1,   density: 1.04, nozzleTemp: 240, bedTemp: 100 },
  { id: "5", name: "TPU",          brand: "Overture",   spoolPrice: 35,     spoolWeight: 1,   density: 1.21, nozzleTemp: 225, bedTemp: 40  },
  { id: "6", name: "ASA",          brand: "Prusament",  spoolPrice: 30,     spoolWeight: 1,   density: 1.07, nozzleTemp: 245, bedTemp: 100 },
  { id: "7", name: "PA6-CF",       brand: "Polymaker",  spoolPrice: 156.98, spoolWeight: 2,   density: 1.14, nozzleTemp: 255, bedTemp: 70  },
];

export const DEFAULT_PARAMETERS: Parameters = {
  electricityCost: 0.25,
  laborRate: 15,
  failureRate: 0.10,
  vatRate: 0.20,
  profitMargin: 0.30,
  bedSize: "medium",
  tierQuantities: [1, 5, 10, 25, 50, 100, 150],
  discountStep: 0.05,
};

export const DEFAULT_PRINT_JOB: PrintJob = {
  projectName: "",
  materialId: "",
  weightGrams: 0,
  printDurationHours: 0,
  manualWorkHours: 0,
  quantity: 1,
  customBasePrice: 0,
};

// --- Known densities (g/cm³) by material keyword ---

const KNOWN_DENSITIES: [string[], number][] = [
  [["pla"], 1.24],
  [["petg", "pet-g"], 1.27],
  [["abs"], 1.04],
  [["tpu", "flex"], 1.21],
  [["asa"], 1.07],
  [["nylon", "pa6", "pa12", "pa "], 1.14],
  [["pc", "polycarbonate"], 1.20],
  [["hips"], 1.04],
  [["pva"], 1.23],
  [["pp", "polypropyl"], 0.90],
  [["carbon", "cf"], 1.30],
];

export function guessDensity(name: string): number | null {
  const lower = name.toLowerCase();
  for (const [keywords, density] of KNOWN_DENSITIES) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return density;
    }
  }
  return null;
}

// --- Known thermal profiles (nozzle °C, bed °C) ---

const KNOWN_THERMAL_PROFILES: [string[], { nozzle: number; bed: number }][] = [
  [["pla"],                         { nozzle: 205, bed: 60  }],
  [["petg", "pet-g"],               { nozzle: 235, bed: 75  }],
  [["abs"],                         { nozzle: 240, bed: 100 }],
  [["asa"],                         { nozzle: 245, bed: 100 }],
  [["tpu", "flex"],                 { nozzle: 225, bed: 40  }],
  [["nylon", "pa6", "pa12", "pa "], { nozzle: 255, bed: 70  }],
  [["pc", "polycarbonate"],         { nozzle: 270, bed: 110 }],
  [["hips"],                        { nozzle: 230, bed: 100 }],
  [["pva"],                         { nozzle: 200, bed: 45  }],
  [["pp", "polypropyl"],            { nozzle: 230, bed: 85  }],
];

export function guessThermalProfile(name: string): { nozzle: number; bed: number } | null {
  const lower = name.toLowerCase();
  for (const [keywords, profile] of KNOWN_THERMAL_PROFILES) {
    for (const kw of keywords) {
      if (lower.includes(kw)) return profile;
    }
  }
  return null;
}

// --- Brands ---

export const BUILTIN_BRANDS = [
  "Bambu Lab",
  "Creality",
  "Elegoo",
  "eSUN",
  "Eryone",
  "Fiberlogy",
  "FormFutura",
  "Hatchbox",
  "Overture",
  "Polymaker",
  "Prusament",
  "Sunlu",
  "3DJake",
];

const CUSTOM_BRANDS_KEY = "unl3d_custom_brands";

export function loadBrands(): string[] {
  const custom = loadCustomBrands();
  const all = [...BUILTIN_BRANDS, ...custom];
  return [...new Set(all)].sort((a, b) => a.localeCompare(b));
}

function loadCustomBrands(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_BRANDS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addCustomBrand(brand: string) {
  const trimmed = brand.trim();
  if (!trimmed) return;
  const builtinLower = BUILTIN_BRANDS.map((b) => b.toLowerCase());
  if (builtinLower.includes(trimmed.toLowerCase())) return;
  const custom = loadCustomBrands();
  if (custom.some((b) => b.toLowerCase() === trimmed.toLowerCase())) return;
  custom.push(trimmed);
  localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(custom));
}

export function removeCustomBrand(brand: string) {
  const custom = loadCustomBrands().filter((b) => b !== brand);
  localStorage.setItem(CUSTOM_BRANDS_KEY, JSON.stringify(custom));
}

export function isCustomBrand(brand: string): boolean {
  return !BUILTIN_BRANDS.some((b) => b.toLowerCase() === brand.toLowerCase());
}

// --- Consumption calculator ---

function pidDuty(targetTemp: number): number {
  const duty = 0.28 + ((targetTemp - 20.0) / 240.0) * 0.45;
  return Math.max(0.15, Math.min(0.85, duty));
}

export function calculateConsumption(
  material: Material,
  durationHours: number,
  bedSize: BedSize,
  electricityPrice: number
): ConsumptionBreakdown {
  const bedMaxW = BED_SIZE_OPTIONS.find((o) => o.value === bedSize)!.maxW;
  const nozzle = material.nozzleTemp;
  const bed = material.bedTemp;

  const bedPower = bedMaxW * pidDuty(bed);
  const hotendMaxW = 30.0 + ((nozzle - 200.0) / 70.0) * 20.0;
  const hotendPower = hotendMaxW * pidDuty(nozzle);
  const motorsPower = 18;
  const electronicsPower = 10;
  const avgPowerW = bedPower + hotendPower + motorsPower + electronicsPower;

  const warmupWh = bedMaxW * (5 / 60); // ~5 min at full bed power
  const totalWh = avgPowerW * durationHours + warmupWh;
  const costEuros = (totalWh / 1000) * electricityPrice;

  return {
    bedPower: Math.round(bedPower * 10) / 10,
    hotendPower: Math.round(hotendPower * 10) / 10,
    motorsPower,
    electronicsPower,
    avgPowerW: Math.round(avgPowerW * 10) / 10,
    warmupWh: Math.round(warmupWh * 10) / 10,
    totalWh: Math.round(totalWh * 10) / 10,
    costEuros,
  };
}

// --- Price calculator ---

export function pricePerKg(m: Material): number {
  return m.spoolWeight > 0 ? m.spoolPrice / m.spoolWeight : 0;
}

export function calculate(
  job: PrintJob,
  material: Material,
  params: Parameters
): PriceResult {
  const materialPricePerKg = pricePerKg(material);
  const materialCost = materialPricePerKg * (job.weightGrams / 1000);

  const consumption = calculateConsumption(
    material,
    job.printDurationHours,
    params.bedSize,
    params.electricityCost
  );
  const electricityCost = consumption.costEuros;

  const laborCost = job.manualWorkHours * params.laborRate;

  const directSubtotal = materialCost + electricityCost + laborCost;
  const failureSurcharge = directSubtotal * params.failureRate;
  const vat = directSubtotal * params.vatRate;
  const totalUnitCost = directSubtotal + failureSurcharge + vat;

  const marginAmount = totalUnitCost * params.profitMargin;
  const recommendedUnitPrice = totalUnitCost + marginAmount;
  const recommendedTotalPrice = recommendedUnitPrice * job.quantity;

  // Degressive tiers
  const tiers: PriceTier[] = params.tierQuantities.map((qty: number, i: number) => {
    const discount = i * params.discountStep;
    const unitPrice = job.customBasePrice * (1 - discount);
    return { quantity: qty, discount, unitPrice, totalPrice: unitPrice * qty };
  });

  // Find applicable discount via LOOKUP logic (largest qty <= job.quantity)
  let customDiscount = 0;
  for (const tier of tiers) {
    if (job.quantity >= tier.quantity) {
      customDiscount = tier.discount;
    }
  }

  const customUnitPrice = job.customBasePrice * (1 - customDiscount);
  const customTotalPrice = customUnitPrice * job.quantity;
  const recalculatedMargin =
    totalUnitCost > 0 ? (customUnitPrice - totalUnitCost) / totalUnitCost : 0;
  const unitProfit = customUnitPrice - totalUnitCost;
  const totalProfit = unitProfit * job.quantity;

  let profitability: Profitability;
  if (recalculatedMargin <= 0) profitability = "NON";
  else if (recalculatedMargin < 0.15) profitability = "FAIBLE";
  else profitability = "OUI";

  return {
    materialPricePerKg,
    materialCost,
    consumption,
    electricityCost,
    laborCost,
    directSubtotal,
    failureSurcharge,
    vat,
    totalUnitCost,
    profitMarginRate: params.profitMargin,
    marginAmount,
    recommendedUnitPrice,
    recommendedTotalPrice,
    customDiscount,
    customUnitPrice,
    customTotalPrice,
    recalculatedMargin,
    unitProfit,
    totalProfit,
    profitability,
    tiers,
  };
}

// --- Persistence (localStorage) ---

const STORAGE_KEYS = {
  materials: "unl3d_materials",
  parameters: "unl3d_parameters",
  printJob: "unl3d_printjob",
  projects: "unl3d_projects",
} as const;

export function loadMaterials(): Material[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.materials);
    if (!raw) return DEFAULT_MATERIALS;
    const parsed = JSON.parse(raw) as Partial<Material>[];
    // Migrate old data that may lack nozzleTemp/bedTemp
    return parsed.map((m) => {
      const profile = guessThermalProfile(m.name ?? "");
      return {
        ...m,
        nozzleTemp: m.nozzleTemp ?? profile?.nozzle ?? 200,
        bedTemp: m.bedTemp ?? profile?.bed ?? 60,
      } as Material;
    });
  } catch {
    return DEFAULT_MATERIALS;
  }
}

export function saveMaterials(materials: Material[]) {
  localStorage.setItem(STORAGE_KEYS.materials, JSON.stringify(materials));
}

export function loadParameters(): Parameters {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.parameters);
    return raw ? { ...DEFAULT_PARAMETERS, ...JSON.parse(raw) } : DEFAULT_PARAMETERS;
  } catch {
    return DEFAULT_PARAMETERS;
  }
}

export function saveParameters(params: Parameters) {
  localStorage.setItem(STORAGE_KEYS.parameters, JSON.stringify(params));
}

export function loadPrintJob(): PrintJob {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.printJob);
    return raw ? { ...DEFAULT_PRINT_JOB, ...JSON.parse(raw) } : DEFAULT_PRINT_JOB;
  } catch {
    return DEFAULT_PRINT_JOB;
  }
}

export function savePrintJob(job: PrintJob) {
  localStorage.setItem(STORAGE_KEYS.printJob, JSON.stringify(job));
}

export function loadProjects(): SavedProject[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.projects);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveProjects(projects: SavedProject[]) {
  localStorage.setItem(STORAGE_KEYS.projects, JSON.stringify(projects));
}
