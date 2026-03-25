import type { Parameters } from "../models";

interface Props {
  parameters: Parameters;
  setParameters: React.Dispatch<React.SetStateAction<Parameters>>;
  onReset: () => void;
}

function field(
  label: string,
  value: number,
  onChange: (v: number) => void,
  unit: string,
  opts?: { step?: number; isPercent?: boolean }
) {
  const displayValue = opts?.isPercent ? value * 100 : value;
  return (
    <div className="card-row">
      <span className="card-row-label">{label}</span>
      <div className="input-group">
        <input
          type="number"
          value={displayValue}
          step={opts?.step ?? (opts?.isPercent ? 1 : 0.01)}
          onChange={(e) => {
            const raw = parseFloat(e.target.value);
            if (!isNaN(raw)) {
              onChange(opts?.isPercent ? raw / 100 : raw);
            }
          }}
        />
        <span className="input-unit">{unit}</span>
      </div>
    </div>
  );
}

export default function ParametersPage({ parameters: p, setParameters, onReset }: Props) {
  const set = (patch: Partial<Parameters>) => setParameters((prev) => ({ ...prev, ...patch }));

  const amortization = p.machineLifespan > 0 ? p.machinePurchasePrice / p.machineLifespan : 0;

  return (
    <div className="page">
      <h1 className="page-title">Paramètres</h1>

      <div className="card-header">Électricité</div>
      <div className="card">
        {field("Coût électricité", p.electricityCost, (v) => set({ electricityCost: v }), "€/kWh")}
      </div>

      <div className="card-header">Machine</div>
      <div className="card">
        {field("Prix d'achat imprimante", p.machinePurchasePrice, (v) => set({ machinePurchasePrice: v }), "€", { step: 10 })}
        {field("Durée de vie estimée", p.machineLifespan, (v) => set({ machineLifespan: v }), "heures", { step: 100 })}
        <div className="card-row">
          <span className="card-row-label">Coût amortissement</span>
          <span className="card-row-value">{amortization.toFixed(4)} €/h</span>
        </div>
      </div>

      <div className="card-header">Main d'œuvre</div>
      <div className="card">
        {field("Taux horaire", p.laborRate, (v) => set({ laborRate: v }), "€/h")}
      </div>

      <div className="card-header">Marges & Frais</div>
      <div className="card">
        {field("Taux d'échec moyen", p.failureRate, (v) => set({ failureRate: v }), "%", { isPercent: true })}
        {field("TVA", p.vatRate, (v) => set({ vatRate: v }), "%", { isPercent: true })}
        {field("Marge bénéficiaire", p.profitMargin, (v) => set({ profitMargin: v }), "%", { isPercent: true })}
      </div>

      <div style={{ padding: "4px 0" }}>
        <button className="btn btn-danger btn-sm" onClick={onReset}>
          Réinitialiser les paramètres
        </button>
      </div>
    </div>
  );
}
