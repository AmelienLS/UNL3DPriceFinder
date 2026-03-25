// --- Types ---

export interface Material {
  id: string;
  name: string;
  type: "FDM" | "SLA/MSLA";
  spoolPrice: number;   // €
  spoolWeight: number;  // kg
  density: number;      // g/cm³
}

export interface Parameters {
  electricityCost: number;      // €/kWh
  machinePurchasePrice: number; // €
  machineLifespan: number;     // heures
  laborRate: number;           // €/h
  failureRate: number;         // 0-1
  vatRate: number;             // 0-1
  profitMargin: number;        // 0-1
}

export interface PrintJob {
  projectName: string;
  materialId: string;
  weightGrams: number;
  printDurationHours: number;
  printerPowerWatts: number;
  manualWorkHours: number;
  quantity: number;
  customBasePrice: number;
  discountStep: number; // 0-1 (ex: 0.05 = 5%)
}

export interface PriceTier {
  quantity: number;
  discount: number;
  unitPrice: number;
  totalPrice: number;
}

export type Profitability = "OUI" | "FAIBLE" | "NON";

export interface PriceResult {
  materialPricePerKg: number;
  materialCost: number;
  electricityCost: number;
  amortizationCost: number;
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
  { id: "1", name: "PLA Standard", type: "FDM", spoolPrice: 20, spoolWeight: 1, density: 1.24 },
  { id: "2", name: "PLA+", type: "FDM", spoolPrice: 25, spoolWeight: 1, density: 1.24 },
  { id: "3", name: "PETG", type: "FDM", spoolPrice: 25, spoolWeight: 1, density: 1.27 },
  { id: "4", name: "ABS", type: "FDM", spoolPrice: 22, spoolWeight: 1, density: 1.04 },
  { id: "5", name: "TPU", type: "FDM", spoolPrice: 35, spoolWeight: 1, density: 1.21 },
  { id: "6", name: "ASA", type: "FDM", spoolPrice: 30, spoolWeight: 1, density: 1.07 },
  { id: "7", name: "Nylon (PA)", type: "FDM", spoolPrice: 45, spoolWeight: 1, density: 1.14 },
  { id: "8", name: "Résine Standard", type: "SLA/MSLA", spoolPrice: 35, spoolWeight: 1, density: 1.10 },
];

export const DEFAULT_PARAMETERS: Parameters = {
  electricityCost: 0.25,
  machinePurchasePrice: 300,
  machineLifespan: 5000,
  laborRate: 15,
  failureRate: 0.10,
  vatRate: 0.20,
  profitMargin: 0.30,
};

export const DEFAULT_PRINT_JOB: PrintJob = {
  projectName: "Mon projet",
  materialId: "7",
  weightGrams: 50,
  printDurationHours: 3.5,
  printerPowerWatts: 150,
  manualWorkHours: 0.5,
  quantity: 25,
  customBasePrice: 20,
  discountStep: 0.05,
};

export const TIER_QUANTITIES = [1, 5, 10, 25, 50, 100, 150];

// --- Calculator ---

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
  const electricityCost =
    (job.printerPowerWatts / 1000) * job.printDurationHours * params.electricityCost;
  const amortizationCost =
    job.printDurationHours * (params.machinePurchasePrice / Math.max(params.machineLifespan, 1));
  const laborCost = job.manualWorkHours * params.laborRate;

  const directSubtotal = materialCost + electricityCost + amortizationCost + laborCost;
  const failureSurcharge = directSubtotal * params.failureRate;
  const vat = directSubtotal * params.vatRate;
  const totalUnitCost = directSubtotal + failureSurcharge + vat;

  const marginAmount = totalUnitCost * params.profitMargin;
  const recommendedUnitPrice = totalUnitCost + marginAmount;
  const recommendedTotalPrice = recommendedUnitPrice * job.quantity;

  // Degressive tiers
  const tiers: PriceTier[] = TIER_QUANTITIES.map((qty, i) => {
    const discount = i * job.discountStep;
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
    electricityCost,
    amortizationCost,
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
} as const;

export function loadMaterials(): Material[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.materials);
    return raw ? JSON.parse(raw) : DEFAULT_MATERIALS;
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
