import { useState } from "react";
import { type SavedProject, type PrintJob } from "../models";

interface Props {
  projects: SavedProject[];
  setProjects: React.Dispatch<React.SetStateAction<SavedProject[]>>;
  onRestore: (snapshot: PrintJob) => void;
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

export default function ProjectsPage({ projects, setProjects, onRestore }: Props) {
  const [search, setSearch] = useState("");

  const query = search.toLowerCase().trim();
  const filtered = query
    ? projects.filter(
        (p) =>
          p.projectName.toLowerCase().includes(query) ||
          p.objectNumber.toLowerCase().includes(query) ||
          p.client.toLowerCase().includes(query) ||
          p.materialName.toLowerCase().includes(query)
      )
    : projects;

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function handleExportCSV() {
    const header = "Nom;N° Objet;Prix unitaire;Client;Date;Matériau";
    const rows = filtered.map(
      (p) =>
        `${p.projectName};${p.objectNumber};${p.unitPrice.toFixed(2)};${p.client};${formatDate(p.date)};${p.materialName}`
    );
    const csv = [header, ...rows].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `projets_unl3d_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page page-wide">
      <h1 className="page-title">Projets</h1>

      <div className="toolbar">
        <div className="toolbar-group">
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 220, textAlign: "left" }}
          />
        </div>
        <div className="toolbar-group">
          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV} disabled={filtered.length === 0}>
            Exporter CSV
          </button>
        </div>
      </div>

      <div className="card">
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nom du projet</th>
                <th>N° Objet</th>
                <th>Prix unitaire</th>
                <th>Client</th>
                <th>Matériau</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id}>
                  <td>{p.projectName || "—"}</td>
                  <td>{p.objectNumber || "—"}</td>
                  <td>{p.unitPrice.toFixed(2)} €</td>
                  <td>{p.client || "—"}</td>
                  <td>{p.materialName}</td>
                  <td>{formatDate(p.date)}</td>
                  <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => onRestore(p.snapshot)}
                      title="Restaurer dans le calculateur"
                    >
                      Restaurer
                    </button>{" "}
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(p.id)}
                      title="Supprimer"
                    >
                      ×
                    </button>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 24 }}>
                    {projects.length === 0 ? "Aucun projet sauvegardé" : "Aucun résultat"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
