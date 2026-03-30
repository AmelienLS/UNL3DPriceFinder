import { useState, useEffect, useCallback } from "react";
import {
  type Material,
  type Parameters,
  type PrintJob,
  type SavedProject,
  loadMaterials,
  saveMaterials,
  loadParameters,
  saveParameters,
  loadPrintJob,
  savePrintJob,
  loadProjects,
  saveProjects,
} from "./models";
import CalculatorPage from "./components/CalculatorPage";
import MaterialsPage from "./components/MaterialsPage";
import ParametersPage from "./components/ParametersPage";
import ProjectsPage from "./components/ProjectsPage";

type Page = "calculator" | "materials" | "parameters" | "projects";

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "calculator", label: "Calculateur", icon: "⌘" },
  { id: "projects", label: "Projets", icon: "▤" },
  { id: "materials", label: "Matériaux", icon: "◆" },
  { id: "parameters", label: "Paramètres", icon: "⚙" },
];

export default function App() {
  const [page, setPage] = useState<Page>("calculator");
  const [materials, setMaterials] = useState<Material[]>(loadMaterials);
  const [parameters, setParameters] = useState<Parameters>(loadParameters);
  const [printJob, setPrintJob] = useState<PrintJob>(loadPrintJob);
  const [projects, setProjects] = useState<SavedProject[]>(loadProjects);

  useEffect(() => saveMaterials(materials), [materials]);
  useEffect(() => saveParameters(parameters), [parameters]);
  useEffect(() => savePrintJob(printJob), [printJob]);
  useEffect(() => saveProjects(projects), [projects]);

  const updateJob = useCallback(
    (patch: Partial<PrintJob>) => setPrintJob((prev) => ({ ...prev, ...patch })),
    []
  );

  const handleSaveProject = useCallback(
    (extra: { objectNumber: string; client: string; unitPrice: number }) => {
      const material = materials.find((m) => m.id === printJob.materialId) ?? materials[0];
      const project: SavedProject = {
        id: crypto.randomUUID(),
        projectName: printJob.projectName,
        objectNumber: extra.objectNumber,
        unitPrice: extra.unitPrice,
        client: extra.client,
        date: new Date().toISOString(),
        snapshot: { ...printJob },
        materialId: printJob.materialId,
        materialName: material?.name ?? "—",
      };
      setProjects((prev) => [project, ...prev]);
    },
    [printJob, materials]
  );

  const handleRestore = useCallback(
    (snapshot: PrintJob) => {
      setPrintJob(snapshot);
      setPage("calculator");
    },
    []
  );

  return (
    <>
      <div className="titlebar-drag" />
      <div className="app-layout">
        <aside className="sidebar">
          <nav className="sidebar-nav">
            <div className="sidebar-section-title">UNL3D Prix</div>
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                className={`sidebar-item ${page === item.id ? "active" : ""}`}
                onClick={() => setPage(item.id)}
              >
                <span className="sidebar-icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="main-content">
          {page === "calculator" && (
            <CalculatorPage
              materials={materials}
              parameters={parameters}
              printJob={printJob}
              updateJob={updateJob}
              onSaveProject={handleSaveProject}
            />
          )}
          {page === "projects" && (
            <ProjectsPage
              projects={projects}
              setProjects={setProjects}
              onRestore={handleRestore}
            />
          )}
          {page === "materials" && (
            <MaterialsPage
              materials={materials}
              setMaterials={setMaterials}
            />
          )}
          {page === "parameters" && (
            <ParametersPage
              parameters={parameters}
              setParameters={setParameters}
              materials={materials}
              projects={projects}
              onImport={({ materials: m, parameters: p, projects: pr }) => {
                setMaterials(m);
                setParameters(p);
                setProjects(pr);
              }}
            />
          )}
          <footer className="page-footer">
            Amélien LARADE — UNL3D Prix v1.6.0
          </footer>
        </main>
      </div>
    </>
  );
}
