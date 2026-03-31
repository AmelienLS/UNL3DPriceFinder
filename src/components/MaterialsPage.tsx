import { useState, useEffect } from "react";
import { type Material, pricePerKg, guessDensity, guessThermalProfile, loadBrands, addCustomBrand, removeCustomBrand, isCustomBrand } from "../models";
import NumberInput from "./NumberInput";

interface Props {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
}

function emptyMaterial(): Material {
  return {
    id: crypto.randomUUID(),
    name: "",
    brand: "",
    spoolPrice: 20,
    spoolWeight: 1,
    density: 1.24,
    nozzleTemp: 200,
    bedTemp: 60,
  };
}

export default function MaterialsPage({ materials, setMaterials }: Props) {
  const [editing, setEditing] = useState<Material | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [autoFlags, setAutoFlags] = useState({ density: false, thermal: false });
  const [brands, setBrands] = useState<string[]>(loadBrands);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // When the material name changes in "new" mode, auto-fill density + thermal
  useEffect(() => {
    if (!editing || !isNew) return;
    const guessedDensity = guessDensity(editing.name);
    const guessedThermal = guessThermalProfile(editing.name);

    setEditing((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        ...(guessedDensity !== null ? { density: guessedDensity } : {}),
        ...(guessedThermal !== null ? { nozzleTemp: guessedThermal.nozzle, bedTemp: guessedThermal.bed } : {}),
      };
    });
    setAutoFlags({
      density: guessedDensity !== null,
      thermal: guessedThermal !== null,
    });
  }, [editing?.name, isNew]);

  function openAdd() {
    setEditing(emptyMaterial());
    setIsNew(true);
    setAutoFlags({ density: false, thermal: false });
  }

  function openEdit(m: Material) {
    setEditing({ ...m });
    setIsNew(false);
    setAutoFlags({ density: false, thermal: false });
  }

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
    const trimmedBrand = editing.brand.trim();
    if (trimmedBrand) {
      addCustomBrand(trimmedBrand);
      setBrands(loadBrands());
    }
    if (isNew) {
      setMaterials((prev) => [...prev, editing]);
    } else {
      setMaterials((prev) => prev.map((m) => (m.id === editing.id ? editing : m)));
    }
    setEditing(null);
  }

  function handleDelete(id: string) {
    setMaterials((prev) => prev.filter((m) => m.id !== id));
  }

  const autoLabel = (
    <span style={{ marginLeft: 8, fontSize: 11, color: "var(--green)", fontWeight: 500 }}>
      auto
    </span>
  );

  return (
    <div className="page page-wide">
      <h1 className="page-title">Matériaux</h1>

      <div className="toolbar">
        <div className="toolbar-group">
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Ajouter
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Matériau</th>
              <th>Marque</th>
              <th>Prix bobine</th>
              <th>Poids</th>
              <th>Prix/kg</th>
              <th>Densité</th>
              <th>Buse</th>
              <th>Plateau</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.brand}</td>
                <td>{m.spoolPrice.toFixed(2)} €</td>
                <td>{m.spoolWeight.toFixed(2)} kg</td>
                <td>{pricePerKg(m).toFixed(2)} €</td>
                <td>{m.density.toFixed(2)}</td>
                <td>{m.nozzleTemp > 0 ? `${m.nozzleTemp} °C` : "—"}</td>
                <td>{m.bedTemp > 0 ? `${m.bedTemp} °C` : "—"}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>
                    Modifier
                  </button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => setConfirmDeleteId(m.id)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 24 }}>
                  Aucun matériau
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      {confirmDeleteId && (() => {
        const m = materials.find((mat) => mat.id === confirmDeleteId);
        return (
          <div className="modal-overlay" onClick={() => setConfirmDeleteId(null)}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">Confirmer la suppression</div>
              <div className="modal-body">
                Supprimer « {m?.name} » ? Cette action est irréversible.
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setConfirmDeleteId(null)}>Annuler</button>
                <button className="btn btn-danger" onClick={() => { handleDelete(confirmDeleteId); setConfirmDeleteId(null); }}>Supprimer</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Edit / Add Modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              {isNew ? "Nouveau matériau" : `Modifier ${editing.name}`}
            </div>
            <div className="modal-body">
              <div className="modal-field">
                <label>Nom</label>
                <input
                  type="text"
                  value={editing.name}
                  onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                  placeholder="ex: PLA, PETG, ABS..."
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>Marque</label>
                <input
                  type="text"
                  list="brand-list"
                  value={editing.brand}
                  onChange={(e) => setEditing({ ...editing, brand: e.target.value })}
                  placeholder="Choisir ou saisir une marque"
                />
                <datalist id="brand-list">
                  {brands.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
                {brands.some((b) => isCustomBrand(b)) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                    {brands.filter(isCustomBrand).map((b) => (
                      <span
                        key={b}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 11,
                          padding: "2px 8px",
                          borderRadius: 12,
                          background: "var(--bg-grouped)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {b}
                        <button
                          type="button"
                          onClick={() => {
                            removeCustomBrand(b);
                            setBrands(loadBrands());
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "var(--red)",
                            cursor: "default",
                            fontSize: 12,
                            padding: "0 2px",
                            lineHeight: 1,
                          }}
                          title={`Supprimer "${b}"`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="modal-field">
                <label>Prix bobine (€)</label>
                <NumberInput
                  value={editing.spoolPrice}
                  step={0.5}
                  onChange={(v) => setEditing({ ...editing, spoolPrice: v })}
                  style={{ textAlign: "left", width: "100%" }}
                />
              </div>
              <div className="modal-field">
                <label>Poids bobine (kg)</label>
                <NumberInput
                  value={editing.spoolWeight}
                  step={0.1}
                  onChange={(v) => setEditing({ ...editing, spoolWeight: v })}
                  style={{ textAlign: "left", width: "100%" }}
                />
              </div>
              <div className="modal-field">
                <label>
                  Densité (g/cm³)
                  {autoFlags.density && autoLabel}
                </label>
                <NumberInput
                  value={editing.density}
                  step={0.01}
                  onChange={(v) => {
                    setEditing({ ...editing, density: v });
                    setAutoFlags((f) => ({ ...f, density: false }));
                  }}
                  style={{ textAlign: "left", width: "100%" }}
                />
              </div>
              <div style={{ display: "flex", gap: 12 }}>
                <div className="modal-field" style={{ flex: 1 }}>
                  <label>
                    Temp. buse (°C)
                    {autoFlags.thermal && autoLabel}
                  </label>
                  <NumberInput
                    value={editing.nozzleTemp}
                    step={5}
                    min={0}
                    max={400}
                    onChange={(v) => {
                      setEditing({ ...editing, nozzleTemp: v });
                      setAutoFlags((f) => ({ ...f, thermal: false }));
                    }}
                    style={{ textAlign: "left", width: "100%" }}
                  />
                </div>
                <div className="modal-field" style={{ flex: 1 }}>
                  <label>
                    Temp. plateau (°C)
                    {autoFlags.thermal && autoLabel}
                  </label>
                  <NumberInput
                    value={editing.bedTemp}
                    step={5}
                    min={0}
                    max={200}
                    onChange={(v) => {
                      setEditing({ ...editing, bedTemp: v });
                      setAutoFlags((f) => ({ ...f, thermal: false }));
                    }}
                    style={{ textAlign: "left", width: "100%" }}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setEditing(null)}>
                Annuler
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSave}
                disabled={!editing.name.trim()}
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
