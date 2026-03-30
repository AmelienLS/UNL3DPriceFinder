import { useRef } from "react";
import {
  type Parameters, type Material, type SavedProject, type ChartColors,
  BED_SIZE_OPTIONS, type BedSize,
  DEFAULT_CHART_COLORS, exportData, importData,
} from "../models";

const COLOR_LABELS: { key: keyof ChartColors; label: string }[] = [
  { key: "material",    label: "Matière première" },
  { key: "electricity", label: "Électricité" },
  { key: "labor",       label: "Main d'œuvre" },
  { key: "failure",     label: "Taux d'échec" },
  { key: "vatIn",       label: "TVA (coût)" },
  { key: "margin",      label: "Marge" },
  { key: "vatOut",      label: "TVA vente" },
];
import NumberInput from "./NumberInput";

interface Props {
  parameters: Parameters;
  setParameters: React.Dispatch<React.SetStateAction<Parameters>>;
  materials: Material[];
  projects: SavedProject[];
  onImport: (data: { materials: Material[]; parameters: Parameters; projects: SavedProject[] }) => void;
}

function Field({
  label,
  value,
  onChange,
  unit,
  step,
  isPercent,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit: string;
  step?: number;
  isPercent?: boolean;
}) {
  const displayValue = isPercent ? value * 100 : value;
  return (
    <div className="card-row">
      <span className="card-row-label">{label}</span>
      <div className="input-group">
        <NumberInput
          value={displayValue}
          step={step ?? (isPercent ? 1 : 0.01)}
          onChange={(v) => onChange(isPercent ? v / 100 : v)}
        />
        <span className="input-unit">{unit}</span>
      </div>
    </div>
  );
}

export default function ParametersPage({ parameters: p, setParameters, materials, projects, onImport }: Props) {
  const set = (patch: Partial<Parameters>) => setParameters((prev) => ({ ...prev, ...patch }));
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const data = await importData(file);
      onImport({ materials: data.materials, parameters: data.parameters, projects: data.projects ?? [] });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur d'import.");
    } finally {
      e.target.value = "";
    }
  }

  function updateTierQty(index: number, value: number) {
    const next = [...p.tierQuantities];
    next[index] = Math.max(1, Math.round(value));
    // Keep sorted
    next.sort((a, b) => a - b);
    set({ tierQuantities: next });
  }

  function addTier() {
    const last = p.tierQuantities[p.tierQuantities.length - 1] ?? 0;
    set({ tierQuantities: [...p.tierQuantities, last + 50] });
  }

  function removeTier(index: number) {
    if (p.tierQuantities.length <= 1) return;
    set({ tierQuantities: p.tierQuantities.filter((_, i) => i !== index) });
  }

  return (
    <div className="page">
      <h1 className="page-title">Paramètres</h1>

      <div className="card-header">Données</div>
      <div className="card">
        <div className="card-row">
          <span className="card-row-label">Exporter toutes les données</span>
          <button className="btn btn-secondary btn-sm" onClick={() => exportData(materials, p, projects)}>
            Exporter JSON
          </button>
        </div>
        <div className="card-row">
          <span className="card-row-label">Importer une sauvegarde</span>
          <button className="btn btn-secondary btn-sm" onClick={() => fileInputRef.current?.click()}>
            Importer JSON
          </button>
          <input ref={fileInputRef} type="file" accept=".json" style={{ display: "none" }} onChange={handleImport} />
        </div>
      </div>

      <div className="card-header">Électricité</div>
      <div className="card">
        <Field label="Coût électricité" value={p.electricityCost} onChange={(v) => set({ electricityCost: v })} unit="€/kWh" />
      </div>

      <div className="card-header">Imprimante</div>
      <div className="card">
        <div className="card-row">
          <span className="card-row-label">Taille du plateau</span>
          <select
            value={p.bedSize}
            onChange={(e) => set({ bedSize: e.target.value as BedSize })}
          >
            {BED_SIZE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div className="card-row">
          <span className="card-row-label">Puissance max plateau</span>
          <span className="card-row-value">
            {BED_SIZE_OPTIONS.find((o) => o.value === p.bedSize)?.maxW ?? 0} W
          </span>
        </div>
      </div>

      <div className="card-header">Main d'œuvre</div>
      <div className="card">
        <Field label="Taux horaire" value={p.laborRate} onChange={(v) => set({ laborRate: v })} unit="€/h" />
      </div>

      <div className="card-header">TVA</div>
      <div className="card">
        <div className="card-row">
          <span className="card-row-label">
            Assujetti à la TVA
            <span style={{ display: "block", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 400 }}>
              {p.vatRegistered
                ? "TVA achats récupérée · TVA vente facturée au client"
                : "TVA achats = coût · Pas de TVA facturée au client"}
            </span>
          </span>
          <label className="toggle">
            <input
              type="checkbox"
              checked={p.vatRegistered}
              onChange={(e) => set({ vatRegistered: e.target.checked })}
            />
            <span className="toggle-slider" />
          </label>
        </div>
        <Field label="Taux de TVA" value={p.vatRate} onChange={(v) => set({ vatRate: v })} unit="%" isPercent />
      </div>

      <div className="card-header">Marges & Frais</div>
      <div className="card">
        <Field label="Taux d'échec moyen" value={p.failureRate} onChange={(v) => set({ failureRate: v })} unit="%" isPercent />
        <Field label="Marge bénéficiaire" value={p.profitMargin} onChange={(v) => set({ profitMargin: v })} unit="%" isPercent />
      </div>

      <div className="card-header">Couleurs des graphiques</div>
      <div className="card">
        {COLOR_LABELS.map(({ key, label }) => (
          <div className="card-row" key={key}>
            <span className="card-row-label">{label}</span>
            <div className="input-group">
              <input
                type="color"
                value={p.chartColors?.[key] ?? DEFAULT_CHART_COLORS[key]}
                onChange={(e) => set({ chartColors: { ...(p.chartColors ?? DEFAULT_CHART_COLORS), [key]: e.target.value } })}
                style={{ width: 36, height: 28, padding: 2, border: "1px solid var(--border)", borderRadius: 6, cursor: "pointer" }}
              />
              <span className="input-unit" style={{ fontFamily: "monospace", fontSize: 12 }}>
                {p.chartColors?.[key] ?? DEFAULT_CHART_COLORS[key]}
              </span>
            </div>
          </div>
        ))}
        <div style={{ padding: "8px 16px" }}>
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => set({ chartColors: { ...DEFAULT_CHART_COLORS } })}
          >
            Réinitialiser les couleurs
          </button>
        </div>
      </div>

      <div className="card-header">Paliers dégressifs</div>
      <div className="card">
        <Field
          label="Réduction par palier"
          value={p.discountStep}
          onChange={(v) => set({ discountStep: v })}
          unit="%"
          isPercent
          step={1}
        />
        <div className="divider" />
        {p.tierQuantities.map((qty, i) => (
          <div className="card-row" key={i}>
            <span className="card-row-label">
              Palier {i + 1}
              <span style={{ color: "var(--text-tertiary)", fontSize: 11, marginLeft: 6 }}>
                (−{(i * p.discountStep * 100).toFixed(0)}%)
              </span>
            </span>
            <div className="input-group">
              <NumberInput
                value={qty}
                min={1}
                step={1}
                onChange={(v) => updateTierQty(i, v)}
              />
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeTier(i)}
                disabled={p.tierQuantities.length <= 1}
                style={{ marginLeft: 6 }}
              >
                ×
              </button>
            </div>
          </div>
        ))}
        <div style={{ padding: "8px 16px" }}>
          <button className="btn btn-secondary btn-sm" onClick={addTier}>
            + Ajouter un palier
          </button>
        </div>
      </div>
    </div>
  );
}
