import { useState } from "react";
import { type Material, pricePerKg } from "../models";

interface Props {
  materials: Material[];
  setMaterials: React.Dispatch<React.SetStateAction<Material[]>>;
  onReset: () => void;
}

function emptyMaterial(): Material {
  return {
    id: crypto.randomUUID(),
    name: "",
    type: "FDM",
    spoolPrice: 20,
    spoolWeight: 1,
    density: 1.24,
  };
}

export default function MaterialsPage({ materials, setMaterials, onReset }: Props) {
  const [editing, setEditing] = useState<Material | null>(null);
  const [isNew, setIsNew] = useState(false);

  function openAdd() {
    setEditing(emptyMaterial());
    setIsNew(true);
  }

  function openEdit(m: Material) {
    setEditing({ ...m });
    setIsNew(false);
  }

  function handleSave() {
    if (!editing || !editing.name.trim()) return;
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

  return (
    <div className="page">
      <h1 className="page-title">Matériaux</h1>

      <div className="toolbar">
        <div className="toolbar-group">
          <button className="btn btn-primary btn-sm" onClick={openAdd}>
            + Ajouter
          </button>
          <button className="btn btn-danger btn-sm" onClick={onReset}>
            Réinitialiser
          </button>
        </div>
      </div>

      <div className="card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Matériau</th>
              <th>Type</th>
              <th>Prix bobine</th>
              <th>Poids</th>
              <th>Prix/kg</th>
              <th>Densité</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id}>
                <td>{m.name}</td>
                <td>{m.type}</td>
                <td>{m.spoolPrice.toFixed(2)} €</td>
                <td>{m.spoolWeight.toFixed(2)} kg</td>
                <td>{pricePerKg(m).toFixed(2)} €</td>
                <td>{m.density.toFixed(2)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => openEdit(m)}>
                    Modifier
                  </button>{" "}
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                    ×
                  </button>
                </td>
              </tr>
            ))}
            {materials.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 24 }}>
                  Aucun matériau
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

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
                  autoFocus
                />
              </div>
              <div className="modal-field">
                <label>Type</label>
                <select
                  value={editing.type}
                  onChange={(e) =>
                    setEditing({ ...editing, type: e.target.value as Material["type"] })
                  }
                >
                  <option value="FDM">FDM</option>
                  <option value="SLA/MSLA">SLA/MSLA</option>
                </select>
              </div>
              <div className="modal-field">
                <label>Prix bobine (€)</label>
                <input
                  type="number"
                  value={editing.spoolPrice}
                  step={0.5}
                  onChange={(e) =>
                    setEditing({ ...editing, spoolPrice: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="modal-field">
                <label>Poids bobine (kg)</label>
                <input
                  type="number"
                  value={editing.spoolWeight}
                  step={0.1}
                  onChange={(e) =>
                    setEditing({ ...editing, spoolWeight: parseFloat(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="modal-field">
                <label>Densité (g/cm³)</label>
                <input
                  type="number"
                  value={editing.density}
                  step={0.01}
                  onChange={(e) =>
                    setEditing({ ...editing, density: parseFloat(e.target.value) || 0 })
                  }
                />
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
