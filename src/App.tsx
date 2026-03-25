import { useState, useEffect, useCallback } from "react";
import {
  type Material,
  type Parameters,
  type PrintJob,
  loadMaterials,
  saveMaterials,
  loadParameters,
  saveParameters,
  loadPrintJob,
  savePrintJob,
  DEFAULT_MATERIALS,
  DEFAULT_PARAMETERS,
} from "./models";
import CalculatorPage from "./components/CalculatorPage";
import MaterialsPage from "./components/MaterialsPage";
import ParametersPage from "./components/ParametersPage";

type Page = "calculator" | "materials" | "parameters";

const NAV_ITEMS: { id: Page; label: string; icon: string }[] = [
  { id: "calculator", label: "Calculateur", icon: "⌘" },
  { id: "materials", label: "Matériaux", icon: "◆" },
  { id: "parameters", label: "Paramètres", icon: "⚙" },
];

export default function App() {
  const [page, setPage] = useState<Page>("calculator");
  const [materials, setMaterials] = useState<Material[]>(loadMaterials);
  const [parameters, setParameters] = useState<Parameters>(loadParameters);
  const [printJob, setPrintJob] = useState<PrintJob>(loadPrintJob);

  useEffect(() => saveMaterials(materials), [materials]);
  useEffect(() => saveParameters(parameters), [parameters]);
  useEffect(() => savePrintJob(printJob), [printJob]);

  const updateJob = useCallback(
    (patch: Partial<PrintJob>) => setPrintJob((prev) => ({ ...prev, ...patch })),
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
            />
          )}
          {page === "materials" && (
            <MaterialsPage
              materials={materials}
              setMaterials={setMaterials}
              onReset={() => setMaterials(DEFAULT_MATERIALS)}
            />
          )}
          {page === "parameters" && (
            <ParametersPage
              parameters={parameters}
              setParameters={setParameters}
              onReset={() => setParameters(DEFAULT_PARAMETERS)}
            />
          )}
        </main>
      </div>
    </>
  );
}
