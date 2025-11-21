import React, { useState, useRef } from 'react';
import { Download, Upload, Database, UserCog, FileJson, AlertTriangle, CheckCircle2, Calendar, Mail, ArrowRight } from 'lucide-react';
import { Trip, Vehicle, Driver, Order, AppDataExport } from '../types';

interface DataManagementProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  onImportData: (data: AppDataExport) => void;
}

export const DataManagement: React.FC<DataManagementProps> = ({
  trips, vehicles, drivers, orders, onImportData
}) => {
  const [driverId, setDriverId] = useState<string>('');
  const [exportMonth, setExportMonth] = useState<string>(new Date().toISOString().slice(0, 7));
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const ACCOUNTANT_EMAIL = 'Aneta.Kralova@kabelusti.cz';

  const downloadJSON = (data: AppDataExport, filename: string) => {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFullBackup = () => {
    const exportData: AppDataExport = {
      version: 1,
      type: 'full_backup',
      exportDate: new Date().toISOString(),
      data: { trips, vehicles, drivers, orders }
    };
    downloadJSON(exportData, `zaloha_kniha_jizd_${new Date().toISOString().slice(0, 10)}.json`);
  };

  const handleDriverExport = () => {
    if (!driverId) {
      alert('Vyberte řidiče');
      return;
    }

    const filteredTrips = trips.filter(t => {
      const matchesDriver = t.driverId === driverId;
      const matchesMonth = exportMonth ? t.date.startsWith(exportMonth) : true;
      return matchesDriver && matchesMonth;
    });

    const usedVehicleIds = new Set(filteredTrips.map(t => t.vehicleId));
    const usedOrderIds = new Set(filteredTrips.map(t => t.orderId));
    
    const relatedVehicles = vehicles.filter(v => usedVehicleIds.has(v.id));
    const relatedOrders = orders.filter(o => usedOrderIds.has(o.id));
    const relatedDriver = drivers.filter(d => d.id === driverId);

    const driverName = relatedDriver[0]?.name || 'ridic';
    const safeDriverName = driverName.replace(/[^a-z0-9]/gi, '_').toLowerCase();

    const exportData: AppDataExport = {
      version: 1,
      type: 'driver_export',
      exportDate: new Date().toISOString(),
      source: driverName,
      data: {
        trips: filteredTrips,
        vehicles: relatedVehicles,
        drivers: relatedDriver,
        orders: relatedOrders
      }
    };

    downloadJSON(exportData, `export_${safeDriverName}_${exportMonth}.json`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as AppDataExport;
        
        if (!json.version || !json.data) {
          throw new Error('Neplatný formát souboru');
        }

        onImportData(json);
        
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Chyba při čtení souboru. Je to platný JSON?' });
        console.error(err);
      }
    };
    reader.readAsText(file);
  };

  const getMailtoLink = () => {
    if (!driverId) return '#';
    const driver = drivers.find(d => d.id === driverId);
    const driverName = driver ? driver.name : 'Neznámý řidič';
    const subject = encodeURIComponent(`Export dat - Kniha jízd - ${driverName} - ${exportMonth}`);
    const body = encodeURIComponent(`Dobrý den,\n\nv příloze zasílám export knihy jízd za období ${exportMonth}.\n\nS pozdravem,\n${driverName}`);
    
    return `mailto:${ACCOUNTANT_EMAIL}?subject=${subject}&body=${body}`;
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {importStatus && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${importStatus.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' : 'bg-red-50 text-red-800 border border-red-200'}`}>
           {importStatus.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
           <p className="text-sm font-medium">{importStatus.message}</p>
           <button onClick={() => setImportStatus(null)} className="ml-auto hover:opacity-70">
             <span className="sr-only">Zavřít</span>
             &times;
           </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        <div className="space-y-6">
          
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <UserCog size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export pro účetní</h3>
                <p className="text-sm text-gray-500">Stáhnout data řidiče a odeslat emailem.</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Řidič</label>
                <select 
                  value={driverId}
                  onChange={(e) => setDriverId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Vyberte řidiče --</option>
                  {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Měsíc</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="month" 
                    value={exportMonth}
                    onChange={(e) => setExportMonth(e.target.value)}
                    className="w-full pl-10 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 space-y-3">
                {/* Step 1 */}
                <div className="relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-black text-white rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 border-white">1</div>
                  <button 
                    onClick={handleDriverExport}
                    disabled={!driverId}
                    className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-bold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <Download size={18} />
                    Stáhnout soubor
                  </button>
                </div>

                <div className="flex justify-center">
                  <ArrowRight className="text-gray-300 rotate-90" size={20} />
                </div>

                {/* Step 2 */}
                <div className="relative">
                  <div className="absolute -left-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold z-10 border-2 border-white">2</div>
                  <a 
                    href={getMailtoLink()}
                    className={`block w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-center decoration-0 ${!driverId ? 'opacity-50 pointer-events-none' : ''}`}
                  >
                    <Mail size={18} />
                    Odeslat paní Králové
                  </a>
                </div>
                
                <p className="text-[11px] text-center text-amber-700 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start justify-center gap-1.5">
                  <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Důležité:</strong> Stažený soubor musíte do otevřeného emailu přiložit ručně jako přílohu!
                  </span>
                </p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-200 text-gray-700 rounded-lg">
                <Database size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">Kompletní záloha</h3>
                <p className="text-xs text-gray-500">Všechna data aplikace (všechny řidiče, auta, jízdy).</p>
              </div>
            </div>
            <button 
              onClick={handleFullBackup}
              className="w-full bg-white border border-gray-300 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <FileJson size={16} />
              Stáhnout kompletní zálohu
            </button>
          </div>

        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Upload size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Import dat</h3>
              <p className="text-sm text-gray-500">Nahrajte soubor (.json) vytvořený touto aplikací.</p>
            </div>
          </div>

          <div className="flex-grow flex flex-col justify-center items-center border-2 border-dashed border-gray-200 rounded-xl p-8 bg-gray-50/50 hover:bg-blue-50/30 transition-colors">
            <input 
              type="file" 
              ref={fileInputRef}
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <FileJson size={32} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Klikněte pro výběr souboru</p>
                <p className="text-xs text-gray-500 mt-1">Podporuje zálohy i exporty řidičů</p>
              </div>
              <label 
                htmlFor="file-upload"
                className="inline-block bg-black text-white px-6 py-2.5 rounded-lg font-medium cursor-pointer hover:bg-gray-800 transition-colors"
              >
                Vybrat soubor
              </label>
            </div>
          </div>

          <div className="mt-6 space-y-3 text-sm text-gray-500 bg-blue-50 p-4 rounded-lg border border-blue-100">
            <p className="font-medium text-blue-800 flex items-center gap-2">
              <AlertTriangle size={14} />
              Jak funguje import?
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Export řidiče:</strong> Data se inteligentně sloučí. Existující jízdy se aktualizují, nové se přidají. Ostatní řidiči zůstanou beze změny.</li>
              <li><strong>Kompletní záloha:</strong> Aplikace se zeptá, zda chcete přepsat všechna současná data.</li>
            </ul>
          </div>
        </div>

      </div>
    </div>
  );
};