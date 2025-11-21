import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Plus, 
  CarFront, 
  TrendingUp, 
  CalendarDays,
  PieChart as PieIcon,
  FileText,
  Settings as SettingsIcon,
  Home,
  Filter,
  User,
  Lightbulb
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trip, TripType, Vehicle, Driver, Order, INITIAL_TRIPS, INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_ORDERS, AppDataExport, TripTemplate } from './types';
import { TripList } from './components/TripList';
import { StatsCard } from './components/StatsCard';
import { NewTripModal } from './components/NewTripModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AboutModal } from './components/AboutModal';
import { InstallGuide } from './components/InstallGuide';
import { SmartGuideModal } from './components/SmartGuideModal';
import { Haptics } from './utils/haptics';

// Helper to load data from localStorage safely
const loadFromStorage = <T,>(key: string, initialValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : initialValue;
  } catch (error) {
    console.error(`Error loading ${key} from localStorage`, error);
    return initialValue;
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'reports'>('dashboard');
  
  // Initialize state from LocalStorage, falling back to INITIAL_XYZ constants only if storage is empty
  const [trips, setTrips] = useState<Trip[]>(() => loadFromStorage('win3_trips', INITIAL_TRIPS));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadFromStorage('win3_vehicles', INITIAL_VEHICLES));
  const [drivers, setDrivers] = useState<Driver[]>(() => loadFromStorage('win3_drivers', INITIAL_DRIVERS));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('win3_orders', INITIAL_ORDERS));
  const [templates, setTemplates] = useState<TripTemplate[]>(() => loadFromStorage('win3_templates', []));
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [isSmartGuideOpen, setIsSmartGuideOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  // Dashboard Filter State - persist this too so user stays on their view
  const [dashboardDriverId, setDashboardDriverId] = useState<string>(() => loadFromStorage('win3_pref_driver', 'all'));

  // Closure Date (Uzávěrka)
  const [closureDate, setClosureDate] = useState<string>(() => loadFromStorage('win3_closure_date', ''));

  // --- PERSISTENCE EFFECTS ---
  useEffect(() => {
    localStorage.setItem('win3_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('win3_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('win3_drivers', JSON.stringify(drivers));
  }, [drivers]);

  useEffect(() => {
    localStorage.setItem('win3_orders', JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('win3_templates', JSON.stringify(templates));
  }, [templates]);

  useEffect(() => {
    localStorage.setItem('win3_pref_driver', JSON.stringify(dashboardDriverId));
  }, [dashboardDriverId]);

  useEffect(() => {
    localStorage.setItem('win3_closure_date', JSON.stringify(closureDate));
  }, [closureDate]);
  // ---------------------------

  // Filter trips based on selection
  const filteredTrips = useMemo(() => {
    if (dashboardDriverId === 'all') {
      return trips;
    }
    return trips.filter(t => t.driverId === dashboardDriverId);
  }, [trips, dashboardDriverId]);

  const stats = useMemo(() => {
    const sourceTrips = filteredTrips; // Use filtered trips for calculation

    const totalKm = sourceTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const businessKm = sourceTrips.filter(t => t.type === TripType.BUSINESS).reduce((acc, t) => acc + t.distanceKm, 0);
    const privateKm = sourceTrips.filter(t => t.type === TripType.PRIVATE).reduce((acc, t) => acc + t.distanceKm, 0);
    const tripCount = sourceTrips.length;

    const chartDataMap = new Map<string, number>();
    // Sort trips by date to ensure chart is chronological (simplified approach)
    const sortedTrips = [...sourceTrips].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    sortedTrips.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const current = chartDataMap.get(key) || 0;
      chartDataMap.set(key, current + t.distanceKm);
    });

    const chartData = Array.from(chartDataMap.entries()).map(([name, km]) => ({ name, km }));

    return { totalKm, businessKm, privateKm, tripCount, chartData };
  }, [filteredTrips]);

  const handleAddTrip = (newTripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...newTripData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTrips([newTrip, ...trips]);
    Haptics.success();
  };

  const handleEditTrip = (updatedTrip: Trip) => {
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setTripToEdit(null);
    Haptics.success();
  };

  const openEditModal = (trip: Trip) => {
    // Prevent editing if locked (double check, though UI should hide button)
    if (closureDate && trip.date <= closureDate) {
      Haptics.error();
      alert('Tuto jízdu nelze upravit, spadá do uzavřeného období.');
      return;
    }
    Haptics.light();
    setTripToEdit(trip);
    setIsModalOpen(true);
  };

  const handleDeleteTrip = (id: string) => {
    Haptics.heavy();
    if (window.confirm('Opravdu chcete smazat tuto jízdu?')) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTripToEdit(null);
  };

  // Resource handlers
  const handleAddVehicle = (v: Omit<Vehicle, 'id' | 'isActive'>) => {
    setVehicles([...vehicles, { ...v, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
    Haptics.success();
  };
  const handleUpdateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, ...updates } : v));
    Haptics.success();
  };
  const handleToggleVehicleArchive = (id: string) => {
     Haptics.medium();
     setVehicles(vehicles.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v));
  };

  const handleAddDriver = (d: Omit<Driver, 'id' | 'isActive'>) => {
    setDrivers([...drivers, { ...d, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
    Haptics.success();
  };
  const handleUpdateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(drivers.map(d => d.id === id ? { ...d, ...updates } : d));
    Haptics.success();
  };
  const handleToggleDriverArchive = (id: string) => {
    Haptics.medium();
    setDrivers(drivers.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  const handleAddOrder = (o: Omit<Order, 'id' | 'isActive'>) => {
    setOrders([...orders, { ...o, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
    Haptics.success();
  };
  const handleUpdateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
    Haptics.success();
  };
  const handleToggleOrderArchive = (id: string) => {
    Haptics.medium();
    setOrders(orders.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
  };

  // Template handlers
  const handleAddTemplate = (template: Omit<TripTemplate, 'id'>) => {
    const newTemplate: TripTemplate = {
      ...template,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTemplates([...templates, newTemplate]);
    Haptics.success();
  };

  const handleDeleteTemplate = (id: string) => {
    Haptics.medium();
    setTemplates(templates.filter(t => t.id !== id));
  };

  const handleImportData = (importData: AppDataExport) => {
    if (importData.type === 'full_backup') {
      if (window.confirm('POZOR: Obnovení ze zálohy kompletně PŘEPÍŠE všechna současná data v aplikaci. Chcete pokračovat?')) {
        setTrips(importData.data.trips);
        setVehicles(importData.data.vehicles);
        setDrivers(importData.data.drivers);
        setOrders(importData.data.orders);
        Haptics.success();
        alert('Data byla úspěšně obnovena ze zálohy.');
      }
    } else if (importData.type === 'driver_export') {
      const confirmMsg = `Chcete importovat data řidiče "${importData.source || 'neznámý'}"? \n` +
                         `Importuje se ${importData.data.trips.length} jízd. Data ostatních řidičů zůstanou nedotčena.`;
      
      if (window.confirm(confirmMsg)) {
        const mergeResources = <T extends { id: string }>(current: T[], incoming: T[]) => {
          const currentMap = new Map(current.map(i => [i.id, i]));
          incoming.forEach(item => {
            if (!currentMap.has(item.id)) {
              currentMap.set(item.id, item);
            }
          });
          return Array.from(currentMap.values());
        };

        setVehicles(prev => mergeResources(prev, importData.data.vehicles));
        setDrivers(prev => mergeResources(prev, importData.data.drivers));
        setOrders(prev => mergeResources(prev, importData.data.orders));

        setTrips(prevTrips => {
          const tripMap = new Map(prevTrips.map(t => [t.id, t]));
          let newCount = 0;
          let updateCount = 0;

          importData.data.trips.forEach(t => {
            if (tripMap.has(t.id)) {
              updateCount++;
            } else {
              newCount++;
            }
            tripMap.set(t.id, t);
          });

          Haptics.success();
          alert(`Import dokončen.\nPřidáno nových jízd: ${newCount}\nAktualizováno jízd: ${updateCount}`);
          return Array.from(tripMap.values());
        });
      }
    }
  };

  const switchView = (view: 'dashboard' | 'settings' | 'reports') => {
    Haptics.light();
    setCurrentView(view);
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-10 pt-safe">
      
      {/* Top Navigation - Minimal on Mobile with Win3 Logo, Full on Desktop */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden pt-safe md:pt-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <button 
              onClick={() => {
                Haptics.light();
                setIsAboutOpen(true);
              }}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left"
            >
              <div className="flex items-center justify-center w-10 h-10 bg-black rounded-lg shadow-sm border-2 border-gray-100 text-white font-extrabold text-xs tracking-tighter">
                Win3
              </div>
              <div>
                <h1 className="text-base md:text-lg font-bold text-gray-900 tracking-tight leading-none">Chytrá Kniha Jízd</h1>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider block mt-0.5">Vyrobeno Win3</span>
              </div>
            </button>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-4">
              <button 
                onClick={() => switchView('dashboard')}
                className={`text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Přehled
              </button>
              <button 
                onClick={() => switchView('reports')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === 'reports' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <FileText size={16} />
                Reporty
              </button>
              <button 
                onClick={() => switchView('settings')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <SettingsIcon size={16} />
                Nastavení
              </button>
              <div className="w-px h-6 bg-gray-200 mx-1"></div>
              <button 
                onClick={() => {
                  Haptics.light();
                  setIsSmartGuideOpen(true);
                }}
                className="text-sm font-medium transition-colors flex items-center gap-1 text-gray-500 hover:text-yellow-600"
              >
                <Lightbulb size={16} />
                Chytré tipy
              </button>
            </div>

             <div className="md:hidden flex items-center">
                <button 
                  onClick={() => {
                    Haptics.light();
                    setIsSmartGuideOpen(true);
                  }}
                  className="p-2 text-gray-400 hover:text-yellow-600 bg-gray-50 rounded-full"
                >
                  <Lightbulb size={22} />
                </button>
             </div>
          </div>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-8">
        
        {currentView === 'dashboard' && (
          <>
            {/* Driver Filter Bar */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm mb-6 animate-fade-in sticky top-20 z-20 md:relative md:top-0">
               <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <User size={20} />
                  </div>
                  <div className="flex-grow relative">
                    <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">Zobrazit data pro</label>
                    <select 
                      value={dashboardDriverId}
                      onChange={(e) => {
                        Haptics.light();
                        setDashboardDriverId(e.target.value);
                      }}
                      className="w-full bg-transparent font-bold text-gray-900 text-sm md:text-base focus:outline-none appearance-none pr-8 cursor-pointer"
                    >
                       <option value="all">Všichni řidiči (Účetní přehled)</option>
                       {drivers.map(d => (
                         <option key={d.id} value={d.id}>{d.name}</option>
                       ))}
                    </select>
                    <div className="absolute right-0 bottom-1 pointer-events-none text-gray-400">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                    </div>
                  </div>
               </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6 mb-6 animate-fade-in">
              <StatsCard 
                title="Celkem najeto" 
                value={`${stats.totalKm.toLocaleString('cs-CZ')} km`}
                icon={<TrendingUp size={20} />}
                colorClass="bg-white"
              />
              <StatsCard 
                title="Služební cesty" 
                value={`${stats.businessKm.toLocaleString('cs-CZ')} km`}
                icon={<LayoutDashboard size={20} />}
                colorClass="bg-blue-50 border-blue-100"
                trend={stats.totalKm > 0 ? `${Math.round((stats.businessKm / stats.totalKm) * 100)}% celku` : undefined}
              />
              <StatsCard 
                title="Počet jízd" 
                value={stats.tripCount}
                icon={<CalendarDays size={20} />}
                colorClass="bg-purple-50 border-purple-100"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Historie jízd</h2>
                  <button 
                    onClick={() => {
                      Haptics.medium();
                      setTripToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="hidden md:flex bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors items-center gap-2 shadow-lg shadow-gray-200"
                  >
                    <Plus size={16} />
                    Nová jízda
                  </button>
                </div>

                <TripList 
                  trips={filteredTrips} 
                  vehicles={vehicles} 
                  drivers={drivers}
                  orders={orders}
                  onDelete={handleDeleteTrip} 
                  onEdit={openEditModal}
                  closureDate={closureDate}
                />
              </div>

              <div className="space-y-6">
                {/* Chart */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-base font-bold text-gray-900">Přehled kilometrů</h3>
                     <PieIcon size={18} className="text-gray-400"/>
                  </div>
                  
                  {stats.chartData.length > 0 ? (
                    <div className="h-48 md:h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.chartData}>
                          <XAxis 
                            dataKey="name" 
                            axisLine={false} 
                            tickLine={false} 
                            tick={{fontSize: 10, fill: '#9ca3af'}} 
                            dy={10}
                          />
                          <YAxis hide />
                          <Tooltip 
                            cursor={{fill: '#f3f4f6'}}
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                          />
                          <Bar dataKey="km" radius={[4, 4, 0, 0]}>
                            {stats.chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill="#3b82f6" />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                     <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                       Žádná data pro graf
                     </div>
                  )}
                </div>

                <div className="bg-gradient-to-br from-black to-gray-900 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                  <h3 className="font-bold text-lg mb-2 relative z-10">Win3 AI Asistent</h3>
                  <p className="text-gray-300 text-sm mb-4 relative z-10">
                    Nadiktujte jízdu hlasem nebo vyfoťte účtenku.
                  </p>
                  <button 
                    onClick={() => {
                      Haptics.medium();
                      setTripToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-white text-black py-3 rounded-lg text-sm font-bold transition-colors hover:bg-gray-100 relative z-10"
                  >
                    Otevřít
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {currentView === 'reports' && (
          <ReportsView 
            trips={trips}
            vehicles={vehicles}
            drivers={drivers}
            orders={orders}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView 
            vehicles={vehicles}
            drivers={drivers}
            orders={orders}
            trips={trips}
            
            onAddVehicle={handleAddVehicle}
            onUpdateVehicle={handleUpdateVehicle}
            onToggleVehicleArchive={handleToggleVehicleArchive}
            
            onAddDriver={handleAddDriver}
            onUpdateDriver={handleUpdateDriver}
            onToggleDriverArchive={handleToggleDriverArchive}
            
            onAddOrder={handleAddOrder}
            onUpdateOrder={handleUpdateOrder}
            onToggleOrderArchive={handleToggleOrderArchive}

            onImportData={handleImportData}
            onOpenAbout={() => {
               Haptics.light();
               setIsAboutOpen(true);
            }}
            
            closureDate={closureDate}
            onSetClosureDate={setClosureDate}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation - Fixed & Native Look */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-40 pb-safe bottom-nav shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex justify-around items-center h-16 px-2">
          <button 
            onClick={() => switchView('dashboard')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${currentView === 'dashboard' ? 'text-black' : 'text-gray-400'}`}
          >
            <Home size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Přehled</span>
          </button>
          
          <button 
            onClick={() => switchView('reports')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${currentView === 'reports' ? 'text-black' : 'text-gray-400'}`}
          >
            <FileText size={24} strokeWidth={currentView === 'reports' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Reporty</span>
          </button>
          
          <button 
            onClick={() => switchView('settings')}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 active:scale-95 transition-transform ${currentView === 'settings' ? 'text-black' : 'text-gray-400'}`}
          >
            <SettingsIcon size={24} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Nastavení</span>
          </button>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) - Positioned above Tab Bar */}
      {currentView === 'dashboard' && (
        <div className="fixed bottom-[84px] right-5 md:hidden z-40 fab-button">
          <button 
            onClick={() => {
              Haptics.medium();
              setTripToEdit(null);
              setIsModalOpen(true);
            }}
            className="bg-black text-white p-4 rounded-2xl shadow-xl shadow-gray-900/20 active:scale-90 transition-all flex items-center justify-center"
            aria-label="Nová jízda"
          >
            <Plus size={28} />
          </button>
        </div>
      )}

      <NewTripModal 
        isOpen={isModalOpen} 
        onClose={handleCloseModal}
        onAdd={handleAddTrip}
        onEdit={handleEditTrip}
        vehicles={vehicles}
        drivers={drivers}
        orders={orders}
        existingTrips={trips}
        tripToEdit={tripToEdit}
        templates={templates}
        onAddTemplate={handleAddTemplate}
        onDeleteTemplate={handleDeleteTemplate}
      />

      <SmartGuideModal
        isOpen={isSmartGuideOpen}
        onClose={() => setIsSmartGuideOpen(false)}
      />

      <AboutModal 
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />

      <InstallGuide />
    </div>
  );
};

export default App;