import { useMemo } from "react";
import { type Material, type Parameters, type PrintJob, type PriceResult, calculate } from "../models";

interface Props {
  materials: Material[];
  parameters: Parameters;
  printJob: PrintJob;
  updateJob: (patch: Partial<PrintJob>) => void;
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

export default function CalculatorPage({ materials, parameters, printJob: job, updateJob }: Props) {
  const material = materials.find((m) => m.id === job.materialId) ?? materials[0];

  const result: PriceResult | null = useMemo(() => {
    if (!material) return null;
    return calculate(job, material, parameters);
  }, [job, material, parameters]);

  return (
    <div className="page">
      <h1 className="page-title">Calculateur</h1>

      {/* --- Input Section --- */}
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
                {m.name} ({m.type})
              </option>
            ))}
          </select>
        </div>
        <div className="card-row">
          <span className="card-row-label">Poids estimé</span>
          <div className="input-group">
            <input
              type="number"
              value={job.weightGrams}
              step={1}
              onChange={(e) => updateJob({ weightGrams: parseFloat(e.target.value) || 0 })}
            />
            <span className="input-unit">g</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Durée d'impression</span>
          <div className="input-group">
            <input
              type="number"
              value={job.printDurationHours}
              step={0.5}
              onChange={(e) => updateJob({ printDurationHours: parseFloat(e.target.value) || 0 })}
            />
            <span className="input-unit">h</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Consommation imprimante</span>
          <div className="input-group">
            <input
              type="number"
              value={job.printerPowerWatts}
              step={10}
              onChange={(e) => updateJob({ printerPowerWatts: parseFloat(e.target.value) || 0 })}
            />
            <span className="input-unit">W</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Temps de travail manuel</span>
          <div className="input-group">
            <input
              type="number"
              value={job.manualWorkHours}
              step={0.25}
              onChange={(e) => updateJob({ manualWorkHours: parseFloat(e.target.value) || 0 })}
            />
            <span className="input-unit">h</span>
          </div>
        </div>
        <div className="card-row">
          <span className="card-row-label">Quantité</span>
          <input
            type="number"
            value={job.quantity}
            min={1}
            step={1}
            onChange={(e) => updateJob({ quantity: parseInt(e.target.value) || 1 })}
          />
        </div>
      </div>

      {result && (
        <>
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
              <span className="card-row-label">Coût amortissement machine</span>
              <span className="card-row-value">{euro(result.amortizationCost)}</span>
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
              <span className="card-row-label">Prix de base unitaire HT</span>
              <div className="input-group">
                <input
                  type="number"
                  value={job.customBasePrice}
                  step={0.5}
                  onChange={(e) => updateJob({ customBasePrice: parseFloat(e.target.value) || 0 })}
                />
                <span className="input-unit">€</span>
              </div>
            </div>
            <div className="card-row">
              <span className="card-row-label">Remise par palier</span>
              <div className="input-group">
                <input
                  type="number"
                  value={job.discountStep * 100}
                  step={1}
                  min={0}
                  max={50}
                  onChange={(e) =>
                    updateJob({ discountStep: (parseFloat(e.target.value) || 0) / 100 })
                  }
                />
                <span className="input-unit">%</span>
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

          {/* --- Degressive Tiers --- */}
          <div className="card-header">Paliers dégressifs</div>
          <div className="card">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Quantité</th>
                  <th>Remise</th>
                  <th>Prix unitaire HT</th>
                  <th>Prix total HT</th>
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
        </>
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
