import React, { useState, useMemo, useEffect } from 'react';
import { FileText, Download, Printer, User, Briefcase, Fuel, Calendar, Car, ArrowLeft, X } from 'lucide-react';
import { Trip, TripType, Vehicle, Driver, Order } from '../types';

interface ReportsViewProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
}

export const ReportsView: React.FC<ReportsViewProps> = ({ trips, vehicles, drivers, orders }) => {
  // Default to current month
  const today = new Date();
  const defaultMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

  const [reportType, setReportType] = useState<'driver' | 'vehicle'>('driver');
  const [selectedMonth, setSelectedMonth] = useState(defaultMonth);
  
  const [selectedDriverId, setSelectedDriverId] = useState<string>('');
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('');
  
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Initialize selections
  useEffect(() => {
    if (drivers.length > 0 && !selectedDriverId) setSelectedDriverId(drivers[0].id);
    if (vehicles.length > 0 && !selectedVehicleId) setSelectedVehicleId(vehicles[0].id);
  }, [drivers, vehicles]);

  // Helpers
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || 'Neznámý řidič';
  const getVehicleName = (id: string) => {
    const v = vehicles.find(ve => ve.id === id);
    return v ? `${v.name} (${v.licensePlate})` : 'Neznámé vozidlo';
  };
  const getOrderName = (id: string) => orders.find(o => o.id === id)?.name || 'Neurčeno';

  // --- Aggregation Logic ---
  const reportData = useMemo(() => {
    const targetId = reportType === 'driver' ? selectedDriverId : selectedVehicleId;
    if (!selectedMonth || !targetId) return null;

    const [year, month] = selectedMonth.split('-').map(Number);

    // Filter trips by (Driver OR Vehicle) AND Month
    const filteredTrips = trips.filter(t => {
      const d = new Date(t.date);
      const matchesDate = d.getMonth() + 1 === month && d.getFullYear() === year;
      
      if (reportType === 'driver') {
        return t.driverId === selectedDriverId && matchesDate;
      } else {
        return t.vehicleId === selectedVehicleId && matchesDate;
      }
    });

    // 1. Stats
    const totalKm = filteredTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const businessKm = filteredTrips.filter(t => t.type === TripType.BUSINESS).reduce((acc, t) => acc + t.distanceKm, 0);
    const privateKm = filteredTrips.filter(t => t.type === TripType.PRIVATE).reduce((acc, t) => acc + t.distanceKm, 0);
    
    // Get list of related resources
    let relatedResources: string[] = [];
    if (reportType === 'driver') {
        const uniqueIds = Array.from(new Set(filteredTrips.map(t => t.vehicleId))) as string[];
        relatedResources = uniqueIds.map(id => getVehicleName(id));
    } else {
        const uniqueIds = Array.from(new Set(filteredTrips.map(t => t.driverId))) as string[];
        relatedResources = uniqueIds.map(id => getDriverName(id));
    }

    // 2. Project Stats (Controlling)
    const projectStatsMap = new Map<string, number>();
    filteredTrips.forEach(t => {
        const current = projectStatsMap.get(t.orderId) || 0;
        projectStatsMap.set(t.orderId, current + t.distanceKm);
    });

    const projectStats = Array.from(projectStatsMap.entries())
        .map(([orderId, km]) => ({
            orderId,
            name: getOrderName(orderId),
            km,
            percentage: totalKm > 0 ? (km / totalKm) * 100 : 0
        }))
        .sort((a, b) => b.km - a.km);

    // 3. Fuel Stats
    const fuelTrips = filteredTrips.filter(t => t.fuelLiters && t.fuelLiters > 0);
    const totalFuel = fuelTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
    
    const avgConsumption = totalKm > 0 && totalFuel > 0 ? (totalFuel / totalKm) * 100 : 0;

    return {
        trips: filteredTrips,
        totalKm,
        businessKm,
        privateKm,
        relatedResources,
        projectStats,
        fuelTrips,
        totalFuel,
        avgConsumption
    };
  }, [trips, selectedMonth, selectedDriverId, selectedVehicleId, reportType, drivers, vehicles, orders]);

  const handleExportCsv = () => {
    if (!reportData) return;
    
    const BOM = "\uFEFF";
    let csvContent = "Datum;Odkud;Kam;Vzdálenost (km);Typ;Zakázka;Vozidlo;Řidič;Tachometr konec;Tankování (l)\n";
    
    reportData.trips.forEach(t => {
        const row = [
            t.date,
            t.origin,
            t.destination,
            t.distanceKm,
            t.type,
            getOrderName(t.orderId),
            getVehicleName(t.vehicleId),
            getDriverName(t.driverId),
            t.endOdometer,
            t.fuelLiters || ''
        ].map(val => `"${val}"`).join(";");
        csvContent += row + "\n";
    });

    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const identifier = reportType === 'driver' ? getDriverName(selectedDriverId) : getVehicleName(selectedVehicleId);
    const safeName = identifier.replace(/[^a-z0-9]/gi, '_');
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `vykaz_${safeName}_${selectedMonth}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const renderReportContent = () => {
    if (!reportData || reportData.totalKm === 0) {
       return (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-gray-300">
            <div className="mx-auto h-16 w-16 text-gray-300 mb-4">
                <FileText className="w-full h-full" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Žádná data pro zobrazení</h3>
            <p className="text-gray-500 mt-1">
                {reportType === 'driver' 
                    ? 'Pro vybraného řidiče a měsíc neexistují žádné záznamy.' 
                    : 'Pro vybrané vozidlo a měsíc neexistují žádné záznamy.'}
            </p>
        </div>
       );
    }

    return (
        <div className="bg-white rounded-xl shadow-lg p-6 md:p-12 max-w-4xl mx-auto border border-gray-100 text-gray-900 print:shadow-none print:border-none print:p-0 print:max-w-none" id="printable-report">
            
            {/* Report Header */}
            <div className="border-b border-gray-200 pb-6 mb-8 flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                      {reportType === 'driver' ? 'Výkaz jízd řidiče' : 'Kniha jízd vozidla'}
                    </h1>
                    <p className="text-gray-500 text-sm">Podklad pro mzdovou účtárnu a controlling</p>
                </div>
                <div className="text-left sm:text-right">
                    <div className="text-lg font-bold text-gray-900">
                      {reportType === 'driver' ? getDriverName(selectedDriverId) : getVehicleName(selectedVehicleId)}
                    </div>
                    <div className="text-sm text-gray-900 mt-1 font-medium">Období: {selectedMonth}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 print:grid-cols-2 print:gap-8">
                {/* Payroll/Usage Section */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        {reportType === 'driver' ? <User size={16} /> : <Car size={16} />}
                        {reportType === 'driver' ? 'Mzdové údaje' : 'Využití vozidla'}
                    </h3>
                    <div className="bg-gray-50 p-5 rounded-xl border border-gray-100 print:bg-gray-50 print:border-gray-200">
                        <div className="flex justify-between items-center mb-3">
                            <span className="text-gray-700 font-medium">Celkem ujeto</span>
                            <span className="text-xl font-bold text-gray-900">{reportData.totalKm.toLocaleString()} km</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden print:bg-gray-300">
                            <div 
                                className="bg-blue-600 h-2 rounded-full print:bg-black" 
                                style={{ width: `${(reportData.businessKm / reportData.totalKm) * 100}%` }}
                            ></div>
                        </div>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between text-blue-800 print:text-black">
                                <span>Služební</span>
                                <span className="font-medium">{reportData.businessKm.toLocaleString()} km</span>
                            </div>
                            <div className="flex justify-between text-purple-800 print:text-black">
                                <span>Soukromé</span>
                                <span className="font-medium">{reportData.privateKm.toLocaleString()} km</span>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-600">
                            <strong>{reportType === 'driver' ? 'Použitá vozidla:' : 'Řidiči:'}</strong>
                            <div className="mt-1 leading-relaxed">
                                {reportData.relatedResources.join(', ')}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Controlling Section */}
                <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Briefcase size={16} />
                        Náklady na projekty
                    </h3>
                    <div className="space-y-3">
                        {reportData.projectStats.map((stat) => (
                            <div key={stat.orderId} className="relative">
                                <div className="flex justify-between text-sm mb-1 z-10 relative">
                                    <span className="font-medium text-gray-800 truncate max-w-[180px]">{stat.name}</span>
                                    <span className="text-gray-600 whitespace-nowrap">{stat.km.toLocaleString()} km ({Math.round(stat.percentage)}%)</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-md h-8 overflow-hidden relative flex items-center px-2 print:bg-gray-100">
                                    <div 
                                        className="absolute left-0 top-0 bottom-0 bg-blue-50 border-r border-blue-100 print:bg-gray-300 print:border-gray-400" 
                                        style={{ width: `${stat.percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fuel Section */}
            <div className="mb-10 break-inside-avoid">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Fuel size={16} />
                    Tankování a spotřeba
                </h3>
                {reportData.fuelTrips.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Datum</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Místo</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Množství</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reportData.fuelTrips.map(t => (
                                    <tr key={t.id}>
                                        <td className="px-4 py-2 text-sm text-gray-900">{new Date(t.date).toLocaleDateString('cs-CZ')}</td>
                                        <td className="px-4 py-2 text-sm text-gray-600">{t.destination}</td>
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
                        <div className="p-3 bg-orange-50 text-orange-800 text-sm border-t border-orange-100 flex justify-between print:bg-white print:text-black print:border-gray-200">
                            <span>Průměrná měsíční spotřeba (orientační):</span>
                            <span className="font-bold">{reportData.avgConsumption.toFixed(1)} l/100km</span>
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-gray-500 italic border border-dashed border-gray-200 p-4 rounded-lg text-center">
                        V tomto měsíci nebylo evidováno žádné tankování.
                    </p>
                )}
            </div>

            {/* Signature Section */}
            <div className="mt-16 pt-8 border-t border-gray-200 grid grid-cols-2 gap-10 sm:gap-20 break-inside-avoid">
                <div className="text-center">
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-xs text-gray-500 uppercase">
                        {reportType === 'driver' ? 'Podpis řidiče' : 'Správce vozidla'}
                    </p>
                </div>
                <div className="text-center">
                    <div className="border-b border-gray-300 h-8 mb-2"></div>
                    <p className="text-xs text-gray-500 uppercase">Schválil (Nadřízený)</p>
                </div>
            </div>

        </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col xl:flex-row items-center justify-between gap-4">
        
        <div className="flex flex-col md:flex-row items-center gap-4 w-full xl:w-auto">
          
          {/* Switch Type */}
          <div className="flex bg-gray-100 p-1 rounded-lg self-start md:self-auto">
            <button
              onClick={() => setReportType('driver')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${reportType === 'driver' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <User size={16} />
              Řidič
            </button>
            <button
              onClick={() => setReportType('vehicle')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${reportType === 'vehicle' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              <Car size={16} />
              Vozidlo
            </button>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <div className="relative flex-grow md:flex-grow-0">
               <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
                 {reportType === 'driver' ? <User size={16} /> : <Car size={16} />}
               </div>
               
               {reportType === 'driver' ? (
                 <select 
                    value={selectedDriverId}
                    onChange={(e) => setSelectedDriverId(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 >
                    {drivers.map(d => (
                        <option key={d.id} value={d.id} className="text-gray-900">{d.name}</option>
                    ))}
                 </select>
               ) : (
                 <select 
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full md:w-64 pl-10 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                 >
                    {vehicles.map(v => (
                        <option key={v.id} value={v.id} className="text-gray-900">{v.name} ({v.licensePlate})</option>
                    ))}
                 </select>
               )}
            </div>
            
            <div className="relative">
               <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
               <input 
                  type="month" 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
               />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full xl:w-auto">
             <button 
                onClick={handleExportCsv}
                disabled={!reportData || reportData.totalKm === 0}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 hover:text-gray-900 transition-colors disabled:opacity-50"
             >
                <Download size={16} />
                Excel
             </button>
             <button 
                onClick={() => setShowPrintPreview(true)}
                disabled={!reportData || reportData.totalKm === 0}
                className="flex-1 xl:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50"
             >
                <Printer size={16} />
                Tisk / PDF
             </button>
        </div>
      </div>

      {/* Main View Report Content */}
      {renderReportContent()}

      {/* Full Screen Print Preview Modal */}
      {showPrintPreview && (
        <div id="print-preview-container" className="fixed inset-0 z-[9999] bg-white overflow-y-auto animate-fade-in">
            {/* Safe Local Print Style - Only exists when this modal is open */}
            <style>{`
              @media print {
                body > *:not(#print-preview-container) {
                  display: none !important;
                }
                #print-preview-container {
                  position: absolute;
                  top: 0;
                  left: 0;
                  width: 100%;
                  height: 100%;
                  overflow: visible;
                  background: white;
                }
                .no-print {
                  display: none !important;
                }
              }
            `}</style>

            {/* Sticky Header - Hidden in Print via CSS */}
            <div className="sticky top-0 left-0 right-0 bg-white/90 backdrop-blur-sm border-b border-gray-200 p-4 flex items-center justify-between no-print z-10 shadow-sm">
                <button 
                    onClick={() => setShowPrintPreview(false)}
                    className="flex items-center gap-2 text-gray-600 font-medium hover:bg-gray-100 px-4 py-2 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} />
                    Zpět
                </button>
                <div className="font-bold text-gray-900 hidden sm:block">Náhled tisku</div>
                <button 
                    onClick={() => window.print()}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                >
                    <Printer size={20} />
                    Tisknout
                </button>
            </div>
            
            {/* Preview Content */}
            <div className="p-4 md:p-8 min-h-screen bg-gray-100 flex justify-center print:bg-white print:p-0">
                <div className="w-full max-w-4xl print:max-w-none print:w-full bg-white shadow-xl print:shadow-none p-8 md:p-12 print:p-0 rounded-xl print:rounded-none">
                    {renderReportContent()}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};