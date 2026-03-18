import { useRef, useState } from "react";
import { exportToYaml, importFromYaml, downloadYaml } from "../db/yaml";

interface Props { onClose: () => void; }

export function YamlModal({ onClose }: Props) {
  const [mode, setMode] = useState<"export" | "import">("export");
  const [yaml, setYaml] = useState("");
  const [status, setStatus] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const out = await exportToYaml();
    setYaml(out);
    setStatus("✓ Ready — click to select all, then copy");
  }

  async function handleDownload() {
    const out = await exportToYaml();
    downloadYaml(out);
    setStatus("✓ Downloaded");
  }

  async function handleImport() {
    if (!yaml.trim()) { setStatus("Paste YAML above first"); return; }
    try {
      await importFromYaml(yaml);
      setStatus("✓ Imported — refreshing…");
      setTimeout(() => window.location.reload(), 800);
    } catch (e: unknown) {
      setStatus(`Error: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="tab-group">
            <button className={`tab ${mode === "export" ? "active" : ""}`} onClick={() => setMode("export")}>Export</button>
            <button className={`tab ${mode === "import" ? "active" : ""}`} onClick={() => setMode("import")}>Import</button>
          </div>
          <button className="icon-btn" onClick={onClose}>✕</button>
        </div>

        {mode === "export" ? (
          <>
            <p className="modal-hint">All habits, entries, moods and journal text as YAML.</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={handleExport}>Generate YAML</button>
              <button className="btn btn-ghost" onClick={handleDownload}>Download file</button>
            </div>
            {yaml && (
              <textarea className="yaml-textarea" readOnly value={yaml}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()} />
            )}
          </>
        ) : (
          <>
            <p className="modal-hint">Paste YAML or upload a file. <strong>Replaces all data.</strong></p>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => fileRef.current?.click()}>Upload file</button>
              <input ref={fileRef} type="file" accept=".yaml,.yml" style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  new Response(f).text().then(setYaml);
                }} />
            </div>
            <textarea className="yaml-textarea" placeholder="Paste YAML here…"
              value={yaml} onChange={(e) => setYaml(e.target.value)} />
            <button className="btn btn-danger" onClick={handleImport}>Import (replaces everything)</button>
          </>
        )}
        {status && <p className="modal-status">{status}</p>}
      </div>
    </div>
  );
}
