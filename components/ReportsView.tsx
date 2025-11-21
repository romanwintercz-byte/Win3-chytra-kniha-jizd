import React, { useState, useMemo } from 'react';
import { FileText, Download, Printer, User, Briefcase, Fuel, Calendar, Car } from 'lucide-react';
import { Trip, TripType, Vehicle, Driver, Order } from '../types';

interface ReportsViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ trips, vehicles, drivers, orders }) => {
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  const [selectedDriverId, setSelectedDriverId] = useState<string>(''); // '' = Všichni
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>(''); // '' = Všechna

  const getDriverName = (id: string) => {
    if (!id) return 'Všichni řidiči';
    return drivers.find(d => d.id === id)?.name || 'Neznámý řidič';
  };

  const getVehicleLabel = (id: string) => {
    if (!id) return 'Všechna vozidla';
    const v = vehicles.find(ve => ve.id === id);
    return v ? `${v.name} (${v.licensePlate})` : 'Neznámé vozidlo';
  };

  const getOrderName = (id: string) => orders.find(o => o.id === id)?.name || 'Neurčeno';
  const getOrderCode = (id: string) => orders.find(o => o.id === id)?.code || '';
  const getOrderFullLabel = (id: string) => {
    const o = orders.find(order => order.id === id);
    if (!o) return 'Neurčeno';
    return o.code ? `${o.name} (${o.code})` : o.name;
  };

  const reportData = useMemo(() => {
    if (!selectedMonth) return null;

    const [year, month] = selectedMonth.split('-').map(Number);

    const filteredTrips = trips.filter(t => {
      const d = new Date(t.date);
      const matchDate = d.getMonth() + 1 === month && d.getFullYear() === year;
      const matchDriver = selectedDriverId === '' || t.driverId === selectedDriverId;
      const matchVehicle = selectedVehicleId === '' || t.vehicleId === selectedVehicleId;
      
      return matchDate && matchDriver && matchVehicle;
    });

    const totalKm = filteredTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const businessKm = filteredTrips.filter(t => t.type === TripType.BUSINESS).reduce((acc, t) => acc + t.distanceKm, 0);
    const privateKm = filteredTrips.filter(t => t.type === TripType.PRIVATE).reduce((acc, t) => acc + t.distanceKm, 0);
    
    const usedVehiclesIds: string[] = Array.from(new Set(filteredTrips.map(t => t.vehicleId)));
    const usedVehicles = usedVehiclesIds.map(id => {
       const v = vehicles.find(ve => ve.id === id);
       return v ? v.name : 'Neznámé';
    });

    const projectStatsMap = new Map<string, number>();
    filteredTrips.forEach(t => {
        const current = projectStatsMap.get(t.orderId) || 0;
        projectStatsMap.set(t.orderId, current + t.distanceKm);
    });

    const projectStats = Array.from(projectStatsMap.entries())
        .map(([orderId, km]) => ({
            orderId,
            name: getOrderFullLabel(orderId),
            km,
            percentage: totalKm > 0 ? (km / totalKm) * 100 : 0
        }))
        .sort((a, b) => b.km - a.km);

    const fuelTrips = filteredTrips.filter(t => t.fuelLiters && t.fuelLiters > 0);
    const totalFuel = fuelTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
    
    const avgConsumption = totalKm > 0 && totalFuel > 0 ? (totalFuel / totalKm) * 100 : 0;

    return {
        trips: filteredTrips,
        totalKm,
        businessKm,
        privateKm,
        usedVehicles,
        projectStats,
        fuelTrips,
        totalFuel,
        avgConsumption
    };
  }, [trips, selectedMonth, selectedDriverId, selectedVehicleId, drivers, vehicles, orders]);

  const handlePrint = () => {
    const printContent = document.getElementById('printable-report');
    if (!printContent) return;

    const printWindow = window.open('', '_blank', 'width=900,height=800');
    if (!printWindow) {
      alert('Pro tisk prosím povolte vyskakovací okna v prohlížeči.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="cs">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          <title>Tisk Reportu - Kniha Jízd</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; background: white; }
            
            /* Hide scrollbar for cleaner look on mobile */
            ::-webkit-scrollbar { width: 0px; background: transparent; }
            
            @media print {
              @page { margin: 1cm; size: auto; }
              .no-print { display: none !important; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; padding: 0 !important; }
              .content-wrapper { padding: 0 !important; margin: 0 !important; }
            }
          </style>
        </head>
        <body class="bg-gray-100">
          
          <!-- Navigation Bar (Hidden in Print) -->
          <div class="no-print fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between z-50 shadow-sm safe-area-top">
            <h2 class="font-bold text-gray-900 text-sm md:text-base">Náhled tisku</h2>
            <div class="flex gap-2">
               <button onclick="window.print()" class="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-colors active:scale-95">
                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9V2h12v7"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><path d="M6 14h12v8H6z"/></svg>
                 Tisk / PDF
               </button>
               <button onclick="window.close()" class="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors active:scale-95">
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
               </button>
            </div>
          </div>

          <!-- Content Wrapper -->
          <div class="content-wrapper p-4 pt-20 md:p-10 md:pt-24 min-h-screen flex justify-center">
             <div class="bg-white shadow-xl rounded-none md:rounded-xl w-full max-w-4xl p-8 md:p-12">
                ${printContent.innerHTML}
             </div>
          </div>

          <script>
            window.onload = function() {
              // Small delay to ensure rendering
              setTimeout(function() {
                try {
                    // On mobile, we prefer the user to click the button, 
                    // but on desktop we can auto-trigger
                    if(window.innerWidth > 768) {
                        window.print();
                    }
                } catch(e) {}
              }, 500);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleExportCsv = () => {
    if (!reportData) return;
    
    const BOM = "\uFEFF";
    // Added separate column for Order Code
    let csvContent = "Datum;Odkud;Kam;Vzdálenost (km);Typ;Kód zakázky;Název zakázky;Vozidlo;Řidič;Tachometr konec;Tankování (l)\n";
    
    reportData.trips.forEach(t => {
        const row = [
            t.date,
            t.origin,
            t.destination,
            t.distanceKm,
            t.type,
            getOrderCode(t.orderId), // Separate code
            getOrderName(t.orderId), // Separate name
            getVehicleLabel(t.vehicleId),
            getDriverName(t.driverId),
            t.endOdometer,
            t.fuelLiters || ''
        ].map(val => `"${val}"`).join(";");
        csvContent += row + "\n";
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    
    const driverSegment = selectedDriverId ? getDriverName(selectedDriverId).replace(/\s+/g, '_') : 'Vsichni_ridici';
    const vehicleSegment = selectedVehicleId ? 'VehicleFilter' : 'AllVehicles';
    
    link.download = `vykaz_${driverSegment}_${vehicleSegment}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full lg:w-auto">
          {/* Driver Select */}
          <div className="relative">
             <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <select 
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option value="">Všichni řidiči</option>
                {drivers.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                ))}
             </select>
          </div>

          {/* Vehicle Select */}
          <div className="relative">
             <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <select 
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="w-full pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
             >
                <option value="">Všechna vozidla</option>
                {vehicles.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.licensePlate})</option>
                ))}
             </select>
          </div>
          
          {/* Date Select */}
          <div className="relative">
             <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
                type="month" 
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto">
             <button 
                onClick={handleExportCsv}
                disabled={!reportData || reportData.totalKm === 0}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
             >
                <Download size={16} />
                Excel (CSV)
             </button>
             <button 
                onClick={handlePrint}
                disabled={!reportData || reportData.totalKm === 0}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
             >
                <Printer size={16} />
                Tisk / PDF
             </button>
        </div>
      </div>

      {reportData && reportData.totalKm > 0 ? (
        <div className="bg-white rounded-xl shadow-lg p-8 md:p-12 max-w-4xl mx-auto border border-gray-100" id="printable-report">
            
            <div className="border-b border-gray-200 pb-6 mb-8 flex justify-between items-start flex-wrap gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">Měsíční výkaz jízd</h1>
                    <p className="text-gray-500">Podklad pro mzdovou účtárnu a controlling</p>
                </div>
                <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{getDriverName(selectedDriverId)}</div>
                    {selectedVehicleId && <div className="text-sm text-gray-600">{getVehicleLabel(selectedVehicleId)}</div>}
                    <div className="text-sm text-gray-500 mt-1">Období: {selectedMonth}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <User size={16} />
                        Statistika
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-xl">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-600">Celkem ujeto</span>
                            <span className="text-xl font-bold text-gray-900">{reportData.totalKm.toLocaleString()} km</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                            <div 
                                className="bg-blue-500 h-2 rounded-full" 
                                style={{ width: `${(reportData.businessKm / reportData.totalKm) * 100}%` }}
                            ></div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-blue-700">
                                <span>Služební</span>
                                <span className="font-medium">{reportData.businessKm.toLocaleString()} km</span>
                            </div>
                            <div className="flex justify-between text-purple-700">
                                <span>Soukromé</span>
                                <span className="font-medium">{reportData.privateKm.toLocaleString()} km</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                            <strong>Použitá vozidla v tomto výběru:</strong> {Array.from(new Set(reportData.usedVehicles)).join(', ')}
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase size={16} />
                        Náklady na projekty
                    </h3>
                    <div className="space-y-3">
                        {reportData.projectStats.map((stat) => (
                            <div key={stat.orderId} className="relative">
                                <div className="flex justify-between text-sm mb-1 z-10 relative">
                                    <span className="font-medium text-gray-800">{stat.name}</span>
                                    <span className="text-gray-600">{stat.km.toLocaleString()} km ({Math.round(stat.percentage)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-md h-8 overflow-hidden relative flex items-center px-2">
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-blue-50 border-r border-blue-100" 
                                        style={{ width: `${stat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-10">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Fuel size={16} />
                    Tankování a spotřeba
                </h3>
                {reportData.fuelTrips.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Auto / Místo</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Množství</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.fuelTrips.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{new Date(t.date).toLocaleDateString('cs-CZ')}</td>
                                        <td className="px-4 py-2 text-sm text-gray-500">
                                          {t.vehicleId ? vehicles.find(v => v.id === t.vehicleId)?.name : ''} - {t.destination}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 text-right font-medium">{t.fuelLiters} l</td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-gray-50">
                                <tr>
                                    <td colSpan={2} className="px-4 py-2 text-sm font-bold text-gray-900">Celkem tankováno</td>
                                    <td className="px-4 py-2 text-right text-sm font-bold text-gray-900">{reportData.totalFuel} l</td>
                                </tr>
                            </tfoot>
                        </table>
                        <div className="p-3 bg-orange-50 text-orange-800 text-sm border-t border-orange-100 flex justify-between">
                            <span>Průměrná měsíční spotřeba (orientační):</span>
                            <span className="font-bold">{reportData.avgConsumption.toFixed(1)} l/100km</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic border border-dashed border-gray-200 p-4 rounded-lg text-center">
                        V tomto výběru nebylo evidováno žádné tankování.
                    </p>
                )}
            </div>

            <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 gap-20">
                <div className="text-center">
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-xs text-gray-400 uppercase">Podpis řidiče</p>
                </div>
                <div className="text-center">
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-xs text-gray-400 uppercase">Schválil (Nadřízený)</p>
                </div>
            </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                <FileText className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Žádná data pro zobrazení</h3>
            <p className="text-gray-500 mt-1">Pro vybrané filtry (řidič, auto, měsíc) neexistují žádné záznamy.</p>
        </div>
      )}
    </div>
  );
};