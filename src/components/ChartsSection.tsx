import { useState, useRef, useEffect, useMemo } from "react";
import { euro, pct, closestTierQty } from "../utils/formatting";
import { type PriceResult, type ChartColors, DEFAULT_CHART_COLORS } from "../models";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
  ReferenceDot,
  ReferenceArea,
} from "recharts";
import NumberInput from "./NumberInput";

interface Props {
  result: PriceResult;
  customBasePrice: number;
  quantity: number;
  vatRate: number;
  chartColors?: ChartColors;
  onCustomPriceChange: (v: number) => void;
  onQuantityChange: (v: number) => void;
}



function CostPie({
  data,
  colors,
  total,
  centerLabel,
  isDark,
  textColor,
  gridColor,
  centerContent,
}: {
  data: { name: string; value: number }[];
  colors: string[];
  total: number;
  centerLabel: string;
  isDark: boolean;
  textColor: string;
  gridColor: string;
  centerContent?: React.ReactNode;
}) {
  return (
    <div className="chart-container">
      <ResponsiveContainer width="100%" height={280}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            stroke="none"
          >
            {data.map((_, i) => (
              <Cell key={i} fill={colors[i % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${euro(Number(value))} (${pct(Number(value) / total)})`,
              name,
            ]}
            contentStyle={{
              background: isDark ? "#2c2c2e" : "#ffffff",
              border: `1px solid ${gridColor}`,
              borderRadius: 10,
              fontSize: 12,
              color: textColor,
            }}
          />
          <Legend
            verticalAlign="bottom"
            iconType="circle"
            iconSize={8}
            formatter={(value: string) => (
              <span style={{ color: textColor, fontSize: 12 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className={`chart-center-label${centerContent ? " interactive" : ""}`}>
        {centerContent ?? (
          <span className="chart-center-amount">{euro(total)}</span>
        )}
        <span className="chart-center-caption">{centerLabel}</span>
      </div>
    </div>
  );
}

function EditablePrice({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editing]);

  function startEdit() {
    setDraft(value.toFixed(2).replace(".", ","));
    setEditing(true);
  }

  function commit() {
    const parsed = parseFloat(draft.replace(",", "."));
    if (!isNaN(parsed) && parsed >= 0) {
      onChange(parsed);
    }
    setEditing(false);
  }

  if (editing) {
    return (
      <input
        ref={inputRef}
        className="chart-center-input"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") setEditing(false);
        }}
      />
    );
  }

  return (
    <button className="chart-center-editable" onClick={startEdit} title="Cliquer pour modifier">
      {euro(value)}
    </button>
  );
}

export default function ChartsSection({ result, customBasePrice, quantity, vatRate, chartColors: userColors, onCustomPriceChange, onQuantityChange }: Props) {
  const { COLORS, PRODUCTION_COLORS, PRICE_COLORS_BASE } = useMemo(() => {
    const C = { ...DEFAULT_CHART_COLORS, ...userColors };
    return {
      COLORS: C,
      PRODUCTION_COLORS: [C.material, C.electricity, C.labor, C.failure, C.vatIn],
      PRICE_COLORS_BASE:  [C.material, C.electricity, C.labor, C.failure, C.vatIn, C.margin, C.vatOut],
    };
  }, [userColors]);
  // --- Find applicable discount for current quantity ---
  let currentDiscount = 0;
  for (const tier of result.tiers) {
    if (quantity >= tier.quantity) currentDiscount = tier.discount;
  }

  const vatRegistered = result.vatRegistered;

  // --- Production cost data (break-even) ---
  // Non-assujetti : la TVA achats est un coût
  // Assujetti : pas de TVA achats dans les coûts
  const productionData = [
    { name: "Matière",      value: result.materialCost },
    { name: "Électricité",  value: result.electricityCost },
    { name: "Main d'œuvre", value: result.laborCost },
    { name: "Échec",        value: result.failureSurcharge },
    ...(!vatRegistered && result.vat > 0 ? [{ name: "TVA (coût)", value: result.vat }] : []),
  ].filter((d) => d.value > 0);

  const productionTotal = productionData.reduce((s, d) => s + d.value, 0);

  // --- Recommended pie ---
  // Assujetti : TTC = HT × (1+taux), on ajoute une slice TVA vente
  // Non-assujetti : le prix client = HT (pas de TVA vente)
  const recoHT = result.recommendedUnitPriceHT * (1 - currentDiscount);
  const recoVATOnSale = vatRegistered ? recoHT * vatRate : 0;
  const recoTTC = recoHT + recoVATOnSale;
  const recoMarginHT = recoHT - productionTotal;
  const recoIsLoss = recoMarginHT < 0;

  const sellingData = recoIsLoss
    ? [
        ...productionData.map((d) => ({
          ...d,
          value: recoHT > 0 ? d.value * (recoHT / productionTotal) : d.value,
        })),
        ...(vatRegistered ? [{ name: "TVA vente", value: recoVATOnSale }] : []),
      ].filter((d) => d.value > 0)
    : [
        ...productionData,
        { name: "Marge", value: recoMarginHT },
        ...(vatRegistered ? [{ name: "TVA vente", value: recoVATOnSale }] : []),
      ].filter((d) => d.value > 0);

  const sellingTotal = recoTTC > 0 ? recoTTC : sellingData.reduce((s, d) => s + d.value, 0);

  // --- Custom pie ---
  const customTTC = result.customUnitPriceTTC * (customBasePrice > 0 ? 1 : 0);
  const customHT = result.customUnitPriceHT;
  const customVATOnSale = result.customVATOnSale;
  const customProfit = customHT - productionTotal;
  const customIsLoss = customProfit < 0 || customBasePrice === 0;

  const customData = customBasePrice > 0
    ? (customIsLoss
      ? [
          ...productionData.map((d) => ({
            ...d,
            value: customHT > 0 ? d.value * (customHT / productionTotal) : d.value,
          })),
          ...(vatRegistered && customVATOnSale > 0 ? [{ name: "TVA vente", value: customVATOnSale }] : []),
        ].filter((d) => d.value > 0)
      : [
          ...productionData,
          { name: "Marge", value: customProfit },
          ...(vatRegistered && customVATOnSale > 0 ? [{ name: "TVA vente", value: customVATOnSale }] : []),
        ].filter((d) => d.value > 0)
      )
    : productionData;

  const customTotal = customTTC > 0 ? customTTC : customData.reduce((s, d) => s + d.value, 0);

  // Same colors for both selling and custom pies
  const lossColors = (n: number) => [
    ...PRODUCTION_COLORS.slice(0, n),
    ...(vatRegistered ? [COLORS.vatOut] : []),
  ];

  const SELLING_COLORS_DYNAMIC = recoIsLoss
    ? lossColors(productionData.length)
    : PRICE_COLORS_BASE.slice(0, sellingData.length);

  const CUSTOM_COLORS_DYNAMIC = customBasePrice === 0
    ? PRODUCTION_COLORS
    : customIsLoss
      ? lossColors(productionData.length)
      : PRICE_COLORS_BASE.slice(0, customData.length);

  // --- Merged data (1–150): continuous lines + bars at tier points ---
  const mergedData = useMemo(() => {
    function getDiscountAtQty(qty: number): number {
      let discount = 0;
      for (const tier of result.tiers) {
        if (qty >= tier.quantity) discount = tier.discount;
      }
      return discount;
    }
    return Array.from({ length: 150 }, (_, i) => {
      const qty = i + 1;
      const discount = getDiscountAtQty(qty);
      const unitPrice = customBasePrice * (1 - discount);
      const totalPrice = unitPrice * qty;
      return { qty, unitPrice, totalPrice };
    });
  }, [customBasePrice, result.tiers]);

  // --- Tier zones (ranges for each tier) ---
  const tierZones = useMemo(() => result.tiers.map((tier, i) => {
    const nextTier = result.tiers[i + 1];
    return {
      x1: tier.quantity,
      x2: nextTier ? nextTier.quantity - 1 : 150,
      discount: tier.discount,
      unitPrice: tier.unitPrice,
    };
  }), [result.tiers]);

  const selectedPoint = mergedData[Math.min(Math.max(quantity - 1, 0), 149)];

  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const textColor = isDark ? "#f5f5f7" : "#1d1d1f";
  const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";

  return (
    <div className="charts-section">
      {/* --- Three pie charts side by side --- */}
      <div className="charts-pies">
        <div className="charts-pie-col">
          <div className="card-header">Coût de production</div>
          <div className="card">
            <CostPie
              data={productionData}
              colors={PRODUCTION_COLORS}
              total={productionTotal}
              centerLabel="Coût prod."
              isDark={isDark}
              textColor={textColor}
              gridColor={gridColor}
            />
          </div>
        </div>
        <div className="charts-pie-col">
          <div className="card-header">
            Prix recommandé
            {currentDiscount > 0 && (
              <span className="card-header-badge">−{(currentDiscount * 100).toFixed(0)}%</span>
            )}
          </div>
          <div className={`card${recoIsLoss ? " card-loss" : ""}`}>
            {recoIsLoss && <div className="loss-banner">Vente à perte</div>}
            <CostPie
              data={sellingData}
              colors={SELLING_COLORS_DYNAMIC}
              total={sellingTotal}
              centerLabel={recoIsLoss ? "À perte" : "TTC reco."}
              isDark={isDark}
              textColor={textColor}
              gridColor={gridColor}
            />
          </div>
        </div>
        <div className="charts-pie-col">
          <div className="card-header">
            Prix personnalisé
            {currentDiscount > 0 && (
              <span className="card-header-badge">−{(currentDiscount * 100).toFixed(0)}%</span>
            )}
          </div>
          <div className={`card${customIsLoss ? " card-loss" : ""}`}>
            {customIsLoss && <div className="loss-banner">Vente à perte</div>}
            <CostPie
              data={customData}
              colors={CUSTOM_COLORS_DYNAMIC}
              total={customTotal}
              centerLabel={customIsLoss ? "À perte" : "TTC perso."}
              isDark={isDark}
              textColor={textColor}
              gridColor={gridColor}
              centerContent={
                <EditablePrice
                  value={customBasePrice}
                  onChange={onCustomPriceChange}
                />
              }
            />
          </div>
        </div>
      </div>

      {/* --- Combined tiers + simulation chart --- */}
      <div className="card-header">Tarifs dégressifs</div>
      <div className="card">
        <div className="chart-quantity-input">
          <span className="card-row-label">Quantité envisagée</span>
          <div className="input-group">
            <NumberInput
              value={quantity}
              min={1}
              max={150}
              step={1}
              onChange={(v) => onQuantityChange(Math.max(1, Math.min(150, Math.round(v))))}
            />
          </div>
        </div>
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={360}>
            <ComposedChart data={mergedData} margin={{ top: 24, right: 16, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis
                dataKey="qty"
                type="number"
                domain={[1, 150]}
                tick={{ fontSize: 11, fill: textColor }}
                label={{
                  value: "Quantité",
                  position: "insideBottomRight",
                  offset: -4,
                  fontSize: 11,
                  fill: isDark ? "#98989d" : "#6e6e73",
                }}
              />
              {/* Left axis: unit price */}
              <YAxis
                yAxisId="unit"
                tick={{ fontSize: 11, fill: textColor }}
                tickFormatter={(v: number) => `${v.toFixed(0)} €`}
                width={56}
                label={{
                  value: "Prix unit.",
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 10,
                  fill: isDark ? "#98989d" : "#6e6e73",
                  offset: 4,
                }}
              />
              {/* Right axis: total price */}
              <YAxis
                yAxisId="total"
                orientation="right"
                tick={{ fontSize: 11, fill: textColor }}
                tickFormatter={(v: number) => `${v.toFixed(0)} €`}
                width={64}
                label={{
                  value: "Prix total",
                  angle: 90,
                  position: "insideRight",
                  fontSize: 10,
                  fill: isDark ? "#98989d" : "#6e6e73",
                  offset: 4,
                }}
              />
              <Tooltip
                contentStyle={{
                  background: isDark ? "#2c2c2e" : "#ffffff",
                  border: `1px solid ${gridColor}`,
                  borderRadius: 10,
                  fontSize: 12,
                  color: textColor,
                }}
                formatter={(value, name) => {
                  if (value == null) return [null, null];
                  if (name === "Remise") return [pct(Number(value)), name];
                  return [euro(Number(value)), name];
                }}
                labelFormatter={(label) => `Quantité : ${label}`}
                itemSorter={() => 0}
              />
              <Legend
                iconType="circle"
                iconSize={8}
                formatter={(value: string) => (
                  <span style={{ color: textColor, fontSize: 12 }}>{value}</span>
                )}
              />
              {/* Tier zones as shaded bands */}
              {tierZones.map((zone, i) => (
                <ReferenceArea
                  key={i}
                  yAxisId="unit"
                  x1={zone.x1}
                  x2={zone.x2}
                  fill={i % 2 === 0 ? "rgba(0, 122, 255, 0.06)" : "rgba(0, 122, 255, 0.14)"}
                  strokeOpacity={0}
                  label={{
                    value: zone.discount > 0 ? `−${(zone.discount * 100).toFixed(0)}%` : "Base",
                    position: "insideTop",
                    fontSize: 10,
                    fill: isDark ? "#98989d" : "#6e6e73",
                    offset: 6,
                  }}
                />
              ))}
              {/* Continuous unit price line */}
              <Line
                yAxisId="unit"
                type="stepAfter"
                dataKey="unitPrice"
                name="Prix unitaire"
                stroke="#34c759"
                strokeWidth={2}
                dot={false}
              />
              {/* Continuous total price line */}
              <Line
                yAxisId="total"
                type="monotone"
                dataKey="totalPrice"
                name="Prix total"
                stroke="#007aff"
                strokeWidth={2}
                dot={false}
              />
              {/* Discount dots at tier quantities */}
              {/* Selected quantity marker on total price curve */}
              {selectedPoint && (
                <ReferenceDot
                  yAxisId="total"
                  x={selectedPoint.qty}
                  y={selectedPoint.totalPrice}
                  r={6}
                  fill="#ff3b30"
                  stroke="#ffffff"
                  strokeWidth={2}
                  label={{
                    value: `${euro(selectedPoint.totalPrice)}`,
                    position: "top",
                    fontSize: 12,
                    fontWeight: 600,
                    fill: isDark ? "#f5f5f7" : "#1d1d1f",
                    offset: 12,
                  }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
