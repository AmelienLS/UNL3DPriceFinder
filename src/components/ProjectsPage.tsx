import { useState } from "react";
import { type SavedProject, type PrintJob, type ProjectStatus, PROJECT_STATUS_LABELS } from "../models";

const STATUS_OPTIONS = Object.entries(PROJECT_STATUS_LABELS) as [ProjectStatus, string][];

const STATUS_COLORS: Record<ProjectStatus, string> = {
  draft:     "var(--text-tertiary)",
  sent:      "var(--accent)",
  accepted:  "var(--green)",
  refused:   "var(--red)",
  delivered: "#5856d6",
};

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
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">("all");

  const query = search.toLowerCase().trim();
  const filtered = projects.filter((p) => {
    const matchesSearch =
      !query ||
      p.projectName.toLowerCase().includes(query) ||
      p.objectNumber.toLowerCase().includes(query) ||
      p.client.toLowerCase().includes(query) ||
      p.materialName.toLowerCase().includes(query);
    const matchesStatus = statusFilter === "all" || (p.status ?? "draft") === statusFilter;
    return matchesSearch && matchesStatus;
  });

  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
  }

  function handleStatusChange(id: string, status: ProjectStatus) {
    setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
  }

  function handleDuplicate(project: SavedProject) {
    const copy: SavedProject = {
      ...project,
      id: crypto.randomUUID(),
      projectName: `${project.projectName} (copie)`,
      date: new Date().toISOString(),
      status: "draft",
    };
    setProjects((prev) => {
      const idx = prev.findIndex((p) => p.id === project.id);
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
  }

  function handleExportCSV() {
    const header = "Nom;N° Objet;Prix unitaire;Client;Date;Matériau;Statut";
    const rows = filtered.map(
      (p) =>
        `${p.projectName};${p.objectNumber};${p.unitPrice.toFixed(2)};${p.client};${formatDate(p.date)};${p.materialName};${PROJECT_STATUS_LABELS[p.status ?? "draft"]}`
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
            style={{ width: 200, textAlign: "left" }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "all")}
          >
            <option value="all">Tous les statuts</option>
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
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
                <th>Statut</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const status: ProjectStatus = p.status ?? "draft";
                return (
                  <tr key={p.id}>
                    <td>{p.projectName || "—"}</td>
                    <td>{p.objectNumber || "—"}</td>
                    <td>{p.unitPrice.toFixed(2)} €</td>
                    <td>{p.client || "—"}</td>
                    <td>{p.materialName}</td>
                    <td>{formatDate(p.date)}</td>
                    <td>
                      <select
                        value={status}
                        onChange={(e) => handleStatusChange(p.id, e.target.value as ProjectStatus)}
                        style={{ color: STATUS_COLORS[status], fontWeight: 500, fontSize: 12 }}
                      >
                        {STATUS_OPTIONS.map(([value, label]) => (
                          <option key={value} value={value}>{label}</option>
                        ))}
                      </select>
                    </td>
                    <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => onRestore(p.snapshot)}
                        title="Restaurer dans le calculateur"
                      >
                        Restaurer
                      </button>{" "}
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleDuplicate(p)}
                        title="Dupliquer"
                      >
                        Dupliquer
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
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: "center", color: "var(--text-tertiary)", padding: 24 }}>
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
