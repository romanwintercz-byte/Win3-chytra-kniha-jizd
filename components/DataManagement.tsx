import React, { useState, useRef } from 'react';
import { Download, Upload, Database, UserCog, FileJson, AlertTriangle, CheckCircle2, Calendar, Mail } from 'lucide-react';
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
  const [accountantEmail, setAccountantEmail] = useState<string>('Aneta.kralova@kabelusti.cz');
  const [importStatus, setImportStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Export Logic ---

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

  const getExportPayload = () => {
    if (!driverId) {
      alert('Vyberte řidiče');
      return null;
    }

    // Filter trips
    const filteredTrips = trips.filter(t => {
      const matchesDriver = t.driverId === driverId;
      const matchesMonth = exportMonth ? t.date.startsWith(exportMonth) : true; // If no month, all trips
      return matchesDriver && matchesMonth;
    });

    // Find related resources to include (so we don't break links on import)
    const usedVehicleIds = new Set(filteredTrips.map(t => t.vehicleId));
    const usedOrderIds = new Set(filteredTrips.map(t => t.orderId));
    
    const relatedVehicles = vehicles.filter(v => usedVehicleIds.has(v.id));
    const relatedOrders = orders.filter(o => usedOrderIds.has(o.id));
    const relatedDriver = drivers.filter(d => d.id === driverId);

    const driverName = relatedDriver[0]?.name || 'ridic';
    const safeDriverName = driverName.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `export_${safeDriverName}_${exportMonth}.json`;

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

    return { exportData, filename, driverName };
  };

  const handleDriverExport = () => {
    const payload = getExportPayload();
    if (payload) {
      downloadJSON(payload.exportData, payload.filename);
    }
  };

  const handleFullBackup = () => {
    const exportData: AppDataExport = {
      version: 1,
      type: 'full_backup',
      exportDate: new Date().toISOString(),
      data: {
        trips,
        vehicles,
        drivers,
        orders
      }
    };
    
    const dateStr = new Date().toISOString().split('T')[0];
    downloadJSON(exportData, `kniha_jizd_backup_${dateStr}.json`);
  };

  const handleEmailExport = () => {
    const payload = getExportPayload();
    if (!payload) return;

    if (!accountantEmail) {
      alert("Vyplňte email účetní.");
      return;
    }

    // 1. Download the file first
    downloadJSON(payload.exportData, payload.filename);

    // 2. Construct Mailto link
    const subject = `Výkaz jízd - ${payload.driverName} - ${exportMonth}`;
    const body = `Dobrý den,\n\nv příloze zasílám export dat pro knihu jízd.\n\nSoubor: ${payload.filename}\n\nS pozdravem,\n${payload.driverName}`;
    
    const mailtoLink = `mailto:${accountantEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

    // 3. Open mail client and instruct user
    window.location.href = mailtoLink;

    // 4. Show instruction using alert (timeout ensures it appears after the mail client triggers)
    setTimeout(() => {
      alert(`Krok 1: Soubor '${payload.filename}' byl stažen do vašeho počítače.\n\nKrok 2: Otevřel se váš emailový klient.\n\nKrok 3: PŘETÁHNĚTE stažený soubor do přílohy emailu a odešlete.`);
    }, 500);
  };

  // --- Import Logic ---

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as AppDataExport;
        
        // Basic validation
        if (!json.version || !json.data) {
          throw new Error('Neplatný formát souboru');
        }

        onImportData(json);
        
        // Reset input
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setImportStatus({ type: 'error', message: 'Chyba při čtení souboru. Je to platný JSON?' });
        console.error(err);
      }
    };
    reader.readAsText(file);
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
        
        {/* Left Column: Export Options */}
        <div className="space-y-6">
          
          {/* Driver Export Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                <UserCog size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Export pro účetní</h3>
                <p className="text-sm text-gray-500">Stáhnout jízdy řidiče a odeslat.</p>
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

              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">Email účetní</label>
                <input 
                    type="email"
                    value={accountantEmail}
                    onChange={(e) => setAccountantEmail(e.target.value)}
                    placeholder="email@firma.cz"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button 
                  onClick={handleDriverExport}
                  className="w-full bg-white border border-gray-300 text-gray-700 py-2.5 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Download size={16} />
                  Jen stáhnout
                </button>
                <button 
                  onClick={handleEmailExport}
                  className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Mail size={16} />
                  Připravit email
                </button>
              </div>
            </div>
          </div>

          {/* Full Backup Card */}
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

        {/* Right Column: Import Options */}
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