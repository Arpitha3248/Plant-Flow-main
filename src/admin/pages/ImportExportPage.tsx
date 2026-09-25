// ============================================================
// IMPORT / EXPORT PAGE
// Reuses existing plant validation + Electron IPC
// ============================================================

import React, { useState } from 'react';
import { FileJson, Upload, Download, AlertTriangle, CheckCircle, AlertCircle, FileText } from 'lucide-react';
import { storageService } from '../../services/storageService';
import { validatePlantData } from '../../utils/plantValidation';
import { auditService } from '../../services/auditService';
import { useAuth } from '../../auth/AuthContext';
import { AdminBreadcrumb } from '../AdminLayout';
import type { Plant } from '../../types/plant';

type ImportState = 'idle' | 'validating' | 'valid' | 'error';

export const ImportExportPage: React.FC = () => {
  const { session } = useAuth();
  const [importState, setImportState] = useState<ImportState>('idle');
  const [importError, setImportError] = useState('');
  const [importedPlant, setImportedPlant] = useState<Plant | null>(null);
  const [importFileName, setImportFileName] = useState('');
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false);
  const [exportPlantId, setExportPlantId] = useState<string>('');
  const [toastMsg, setToastMsg] = useState('');

  const plants = storageService.loadPlants();
  const plantList = Object.values(plants);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(''), 3500);
  };

  // ---- Import flow ----------------------------------------------------------
  const processFile = (text: string, fileName: string) => {
    setImportState('validating');
    setImportFileName(fileName);
    setImportError('');
    setImportedPlant(null);

    try {
      const parsed = JSON.parse(text);
      const result = validatePlantData(parsed);
      if (result.isValid && result.sanitizedPlant) {
        setImportedPlant(result.sanitizedPlant);
        setImportState('valid');
      } else {
        setImportError(result.error ?? 'Validation failed.');
        setImportState('error');
      }
    } catch {
      setImportError('Malformed JSON — could not parse file.');
      setImportState('error');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        processFile(ev.target.result, file.name);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleElectronImport = async () => {
    if (!window.desktopAPI) return;
    const res = await window.desktopAPI.openPlantFile();
    if (res.canceled || !res.content) return;
    processFile(res.content, res.filePath ?? 'file.json');
  };

  const confirmImport = () => {
    if (!importedPlant) return;
    // Check if plant already exists
    if (plants[importedPlant.id]) {
      setShowReplaceConfirm(true);
    } else {
      doImport();
    }
  };

  const doImport = () => {
    if (!importedPlant) return;
    const updated = { ...plants, [importedPlant.id]: importedPlant };
    storageService.savePlants(updated);
    auditService.log({
      userId: session?.userId ?? '',
      userEmail: session?.email ?? '',
      userRole: session?.role ?? '',
      action: 'CONFIGURATION_IMPORTED',
      resource: importedPlant.name,
      plantId: importedPlant.id,
      plantName: importedPlant.name,
      status: 'SUCCESS',
      details: `Imported from ${importFileName}`,
    });
    setImportState('idle');
    setImportedPlant(null);
    setShowReplaceConfirm(false);
    showToast(`Plant "${importedPlant.name}" imported successfully.`);
  };

  // ---- Export flow ---------------------------------------------------------
  const handleExport = async () => {
    const targetId = exportPlantId || plantList[0]?.id;
    const plant = plants[targetId];
    if (!plant) return;

    const jsonString = JSON.stringify(plant, null, 2);
    const defaultName = `${plant.id}-config.json`;

    if (window.desktopAPI) {
      const res = await window.desktopAPI.savePlantFile(jsonString, defaultName);
      if (!res.canceled) {
        auditService.log({
          userId: session?.userId ?? '',
          userEmail: session?.email ?? '',
          userRole: session?.role ?? '',
          action: 'CONFIGURATION_EXPORTED',
          resource: plant.name,
          plantId: plant.id,
          plantName: plant.name,
          status: 'SUCCESS',
        });
        showToast(`Plant "${plant.name}" exported.`);
      }
    } else {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = defaultName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      auditService.log({
        userId: session?.userId ?? '',
        userEmail: session?.email ?? '',
        userRole: session?.role ?? '',
        action: 'CONFIGURATION_EXPORTED',
        resource: plant.name,
        plantId: plant.id,
        plantName: plant.name,
        status: 'SUCCESS',
      });
      showToast(`Plant "${plant.name}" exported.`);
    }
  };

  return (
    <div className="space-y-6">
      <AdminBreadcrumb items={[{ label: 'Admin' }, { label: 'Import / Export' }]} />

      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-semibold shadow-xl">
          {toastMsg}
        </div>
      )}

      <div>
        <h1 className="text-xl font-extrabold text-slate-800">Import / Export Configuration</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage plant JSON configuration files. Import validates against the plant schema before applying.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Import panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700">Import Plant Configuration</h2>
          </div>
          <div className="p-5 space-y-4">
            {/* Drop / select */}
            <label className="flex flex-col items-center justify-center gap-3 p-8 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-indigo-300 hover:bg-indigo-50/30 transition-all">
              <FileJson className="w-8 h-8 text-slate-300" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-600">Click to select JSON file</p>
                <p className="text-xs text-slate-400 mt-0.5">or drag and drop (browser only)</p>
              </div>
              <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
            </label>

            {/* Electron native dialog */}
            {window.desktopAPI && (
              <button
                onClick={handleElectronImport}
                className="w-full flex items-center justify-center gap-2 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Open via Native File Dialog
              </button>
            )}

            {/* Validation result */}
            {importState === 'validating' && (
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl text-xs text-slate-600">
                <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                Validating…
              </div>
            )}
            {importState === 'error' && (
              <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Validation Failed</p>
                  <p className="mt-0.5">{importError}</p>
                </div>
              </div>
            )}
            {importState === 'valid' && importedPlant && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Valid Plant Configuration
                  </div>
                  <div className="mt-2 space-y-0.5 text-xs text-emerald-700/80">
                    <p><strong>Name:</strong> {importedPlant.name}</p>
                    <p><strong>ID:</strong> {importedPlant.id}</p>
                    <p><strong>Equipment:</strong> {importedPlant.nodes.length} nodes</p>
                    <p><strong>Connections:</strong> {importedPlant.edges.length} edges</p>
                    <p><strong>Composites:</strong> {Object.keys(importedPlant.compositeProcesses).length}</p>
                  </div>
                </div>
                <button
                  onClick={confirmImport}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  Import This Plant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Export panel */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <Download className="w-4 h-4 text-indigo-500" />
            <h2 className="text-sm font-bold text-slate-700">Export Plant Configuration</h2>
          </div>
          <div className="p-5 space-y-4">
            {plantList.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No plants available to export.</p>
            ) : (
              <>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    Select Plant to Export
                  </label>
                  <select
                    value={exportPlantId || plantList[0]?.id}
                    onChange={(e) => setExportPlantId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  >
                    {plantList.map((p) => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Preview summary */}
                {(() => {
                  const plant = plants[exportPlantId || plantList[0]?.id];
                  if (!plant) return null;
                  return (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-1">
                      <p><strong>Equipment nodes:</strong> {plant.nodes.length}</p>
                      <p><strong>Connections:</strong> {plant.edges.length}</p>
                      <p><strong>Composite processes:</strong> {Object.keys(plant.compositeProcesses).length}</p>
                    </div>
                  );
                })()}

                <button
                  onClick={handleExport}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors"
                >
                  <Download className="w-4 h-4" />
                  {window.desktopAPI ? 'Save via Native Dialog' : 'Download JSON File'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Replace confirm */}
      {showReplaceConfirm && importedPlant && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl"><AlertTriangle className="w-5 h-5 text-amber-600" /></div>
              <h3 className="text-sm font-bold text-slate-800">Replace Existing Plant?</h3>
            </div>
            <p className="text-sm text-slate-600">
              A plant with ID <strong>{importedPlant.id}</strong> already exists. Importing will replace it with the new configuration.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowReplaceConfirm(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg">Cancel</button>
              <button onClick={doImport} className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg">Replace</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
