import { useMemo, useState } from "react";
import { type Parameters, type PrintJob, type PriceResult, type Material, calculate } from "../models";
import NumberInput from "./NumberInput";
import ChartsSection from "./ChartsSection";

type Tab = "calc" | "charts";

interface Props {
  materials: Material[];
  parameters: Parameters;
  printJob: PrintJob;
  updateJob: (patch: Partial<PrintJob>) => void;
  onSaveProject: (extra: { objectNumber: string; client: string; unitPrice: number }) => void;
}

function fmt(n: number, decimals = 2): string {
  return n.toFixed(decimals);
}

function euro(n: number): string {
  return `${fmt(n)} €`;
}

function pct(n: number): string {
  return `${fmt(n * 100, 1)} %`;
}

export default function CalculatorPage({ materials, parameters, printJob: job, updateJob, onSaveProject }: Props) {
  const [tab, setTab] = useState<Tab>("calc");
  const [showSave, setShowSave] = useState(false);
  const [saveFields, setSaveFields] = useState({ objectNumber: "", client: "" });
  const material = materials.find((m) => m.id === job.materialId) ?? materials[0];

  const result: PriceResult | null = useMemo(() => {
    if (!material) return null;
    return calculate(job, material, parameters);
  }, [job, material, parameters]);

  return (
    <div className="page page-wide">
      <h1 className="page-title">Calculateur</h1>

      {/* --- Tab bar --- */}
      <div className="tab-bar">
        <button className={`tab-item ${tab === "calc" ? "active" : ""}`} onClick={() => setTab("calc")}>
          Calcul
        </button>
        <button className={`tab-item ${tab === "charts" ? "active" : ""}`} onClick={() => setTab("charts")}>
          Graphiques
        </button>
      </div>

      {/* --- Input Section (full width) --- */}
      <div className="card-header">Données de l'impression</div>
      <div className="card">
        <div className="card-row">
          <span className="card-row-label">Nom du projet</span>
          <input
            type="text"
            value={job.projectName}
            onChange={(e) => updateJob({ projectName: e.target.value })}
            style={{ width: 200 }}
          />
        </div>
        <div className="card-row">
          <span className="card-row-label">Matériau</span>
          <select
            value={job.materialId}
            onChange={(e) => updateJob({ materialId: e.target.value })}
          >
            {materials.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} — {m.brand}
              </option>
            ))}
          </select>
        </div>
        <div className="card-row">
          <span className="card-row-label">Poids estimé</span>
          <div className="input-group">
            <NumberInput
              value={job.weightGrams}
              step={1}
              onChange={(v) => updateJob({ weightGrams: v })}
            />
            <span className="input-unit">g</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Durée d'impression</span>
          <div className="input-group">
            <NumberInput
              value={job.printDurationHours}
              step={0.5}
              onChange={(v) => updateJob({ printDurationHours: v })}
            />
            <span className="input-unit">h</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Temps de travail manuel</span>
          <div className="input-group">
            <NumberInput
              value={job.manualWorkHours}
              step={0.25}
              onChange={(v) => updateJob({ manualWorkHours: v })}
            />
            <span className="input-unit">h</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Quantité</span>
          <NumberInput
            value={job.quantity}
            min={1}
            step={1}
            onChange={(v) => updateJob({ quantity: Math.max(1, Math.round(v)) })}
          />
        </div>
      </div>

      {result && tab === "calc" && (
        <div className="calc-layout">
          {/* ====== LEFT: costs & pricing ====== */}
          <div className="calc-main">
            {/* --- Cost Breakdown --- */}
            <div className="card-header">Décomposition des coûts</div>
            <div className="card">
              <div className="card-row">
                <span className="card-row-label">Prix / kg du matériau</span>
                <span className="card-row-value">{euro(result.materialPricePerKg)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Coût matière</span>
                <span className="card-row-value">{euro(result.materialCost)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Coût électricité</span>
                <span className="card-row-value">{euro(result.electricityCost)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Coût main d'œuvre</span>
                <span className="card-row-value">{euro(result.laborCost)}</span>
              </div>
              <div className="divider" />
              <div className="card-row">
                <span className="card-row-label">Sous-total coût direct</span>
                <span className="card-row-value strong">{euro(result.directSubtotal)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Majoration taux d'échec ({pct(parameters.failureRate)})</span>
                <span className="card-row-value">{euro(result.failureSurcharge)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">TVA ({pct(parameters.vatRate)})</span>
                <span className="card-row-value">{euro(result.vat)}</span>
              </div>
              <div className="summary-row">
                <span className="summary-label">Coût total unitaire</span>
                <span className="summary-value">{euro(result.totalUnitCost)}</span>
              </div>
            </div>

            {/* --- Recommended Price --- */}
            <div className="card-header">Prix de vente recommandé</div>
            <div className="card">
              <div className="card-row">
                <span className="card-row-label">Marge bénéficiaire ({pct(result.profitMarginRate)})</span>
                <span className="card-row-value">{euro(result.marginAmount)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Prix unitaire HT</span>
                <span className="card-row-value strong">{euro(result.recommendedUnitPrice)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Prix total HT (×{job.quantity})</span>
                <span className="card-row-value accent">{euro(result.recommendedTotalPrice)}</span>
              </div>
            </div>

            {/* --- Custom Pricing --- */}
            <div className="card-header">Tarification personnalisée</div>
            <div className="card">
              <div className="card-row">
                <span className="card-row-label">Prix TTC</span>
                <div className="input-group">
                  <NumberInput
                    value={job.customBasePrice}
                    step={0.5}
                    onChange={(v) => updateJob({ customBasePrice: v })}
                  />
                  <span className="input-unit">€</span>
                </div>
              </div>
              <div className="divider" />
              <div className="card-row">
                <span className="card-row-label">Remise appliquée (auto)</span>
                <span className="card-row-value">{pct(result.customDiscount)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Prix unitaire après remise</span>
                <span className="card-row-value strong">{euro(result.customUnitPrice)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Prix total HT</span>
                <span className="card-row-value accent">{euro(result.customTotalPrice)}</span>
              </div>
              <div className="divider" />
              <div className="card-row">
                <span className="card-row-label">Marge recalculée / coût</span>
                <span className="card-row-value">{pct(result.recalculatedMargin)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Bénéfice unitaire</span>
                <span className="card-row-value">{euro(result.unitProfit)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Bénéfice total</span>
                <span className="card-row-value strong">{euro(result.totalProfit)}</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Rentable ?</span>
                <span
                  className={`badge ${
                    result.profitability === "OUI"
                      ? "badge-green"
                      : result.profitability === "FAIBLE"
                        ? "badge-orange"
                        : "badge-red"
                  }`}
                >
                  {result.profitability}
                </span>
              </div>
            </div>
          </div>

          {/* ====== RIGHT: consumption + tiers ====== */}
          <div className="calc-side">
            {/* --- Consumption Breakdown --- */}
            <div className="card-header">Consommation électrique</div>
            <div className="card">
              <div className="card-row">
                <span className="card-row-label">Plateau</span>
                <span className="card-row-value">{fmt(result.consumption.bedPower, 1)} W</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Hotend</span>
                <span className="card-row-value">{fmt(result.consumption.hotendPower, 1)} W</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Moteurs</span>
                <span className="card-row-value">{result.consumption.motorsPower} W</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Électronique</span>
                <span className="card-row-value">{result.consumption.electronicsPower} W</span>
              </div>
              <div className="divider" />
              <div className="card-row">
                <span className="card-row-label">Puissance moy.</span>
                <span className="card-row-value strong">{fmt(result.consumption.avgPowerW, 1)} W</span>
              </div>
              <div className="card-row">
                <span className="card-row-label">Énergie totale</span>
                <span className="card-row-value">{fmt(result.consumption.totalWh, 1)} Wh</span>
              </div>
              <div className="card-row">
                <span className="card-row-label" style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
                  dont préchauffage
                </span>
                <span className="card-row-value" style={{ fontSize: 11 }}>
                  {fmt(result.consumption.warmupWh, 1)} Wh
                </span>
              </div>
            </div>

            {/* --- Degressive Tiers --- */}
            <div className="card-header">Paliers dégressifs</div>
            <div className="card">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Qté</th>
                    <th>Remise</th>
                    <th>Unit. HT</th>
                    <th>Total HT</th>
                  </tr>
                </thead>
                <tbody>
                  {result.tiers.map((tier) => (
                    <tr
                      key={tier.quantity}
                      className={tier.quantity === closestTierQty(job.quantity, result.tiers.map(t => t.quantity)) ? "highlight-row" : ""}
                    >
                      <td>{tier.quantity}</td>
                      <td>{pct(tier.discount)}</td>
                      <td>{euro(tier.unitPrice)}</td>
                      <td>{euro(tier.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {result && tab === "charts" && (
        <ChartsSection
          result={result}
          customBasePrice={job.customBasePrice}
          quantity={job.quantity}
          onCustomPriceChange={(v) => updateJob({ customBasePrice: v })}
          onQuantityChange={(v) => updateJob({ quantity: v })}
        />
      )}

      {/* --- Save button (floating) --- */}
      {result && (
        <div className="save-fab">
          <button className="btn btn-primary" onClick={() => {
            setSaveFields({ objectNumber: job.projectName, client: "" });
            setShowSave(true);
          }}>
            Sauvegarder le projet
          </button>
        </div>
      )}

      {/* --- Save modal --- */}
      {showSave && result && (
        <div className="modal-overlay" onClick={() => setShowSave(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">Sauvegarder le projet</div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Nom du projet</label>
                <input type="text" value={job.projectName} disabled style={{ opacity: 0.6 }} />
              </div>
              <div className="modal-field">
                <label>N° Objet</label>
                <input
                  type="text"
                  value={saveFields.objectNumber}
                  onChange={(e) => setSaveFields((f) => ({ ...f, objectNumber: e.target.value }))}
                  placeholder="ex: OBJ-001"
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>Prix unitaire (€)</label>
                <input
                  type="text"
                  value={euro(result.customUnitPrice)}
                  disabled
                  style={{ opacity: 0.6 }}
                />
              </div>
              <div className="modal-field">
                <label>Client</label>
                <input
                  type="text"
                  value={saveFields.client}
                  onChange={(e) => setSaveFields((f) => ({ ...f, client: e.target.value }))}
                  placeholder="Nom du client"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSave(false)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  onSaveProject({
                    objectNumber: saveFields.objectNumber,
                    client: saveFields.client,
                    unitPrice: result.customUnitPrice,
                  });
                  setShowSave(false);
                }}
              >
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function closestTierQty(quantity: number, tiers: number[]): number {
  let best = tiers[0];
  for (const t of tiers) {
    if (quantity >= t) best = t;
  }
  return best;
}
