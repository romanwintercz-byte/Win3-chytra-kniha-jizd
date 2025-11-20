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
  Info,
  Home
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Trip, TripType, Vehicle, Driver, Order, INITIAL_TRIPS, INITIAL_VEHICLES, INITIAL_DRIVERS, INITIAL_ORDERS, AppDataExport } from './types';
import { TripList } from './components/TripList';
import { StatsCard } from './components/StatsCard';
import { NewTripModal } from './components/NewTripModal';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { AboutView } from './components/AboutView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'reports' | 'about'>('dashboard');
  
  // --- PERSISTENCE LOGIC START ---
  // Load from localStorage or fallback to INITIAL_ constants
  const loadFromStorage = <T,>(key: string, fallback: T): T => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : fallback;
    } catch (e) {
      console.error(`Error loading ${key}`, e);
      return fallback;
    }
  };

  const [trips, setTrips] = useState<Trip[]>(() => loadFromStorage('app_trips', INITIAL_TRIPS));
  const [vehicles, setVehicles] = useState<Vehicle[]>(() => loadFromStorage('app_vehicles', INITIAL_VEHICLES));
  const [drivers, setDrivers] = useState<Driver[]>(() => loadFromStorage('app_drivers', INITIAL_DRIVERS));
  const [orders, setOrders] = useState<Order[]>(() => loadFromStorage('app_orders', INITIAL_ORDERS));

  // Save to localStorage whenever data changes
  useEffect(() => { localStorage.setItem('app_trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('app_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('app_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('app_orders', JSON.stringify(orders)); }, [orders]);
  // --- PERSISTENCE LOGIC END ---
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripToEdit, setTripToEdit] = useState<Trip | null>(null);

  // --- Statistics Logic ---
  const stats = useMemo(() => {
    const totalKm = trips.reduce((acc, t) => acc + t.distanceKm, 0);
    const businessKm = trips.filter(t => t.type === TripType.BUSINESS).reduce((acc, t) => acc + t.distanceKm, 0);
    const privateKm = trips.filter(t => t.type === TripType.PRIVATE).reduce((acc, t) => acc + t.distanceKm, 0);
    const tripCount = trips.length;

    const chartDataMap = new Map<string, number>();
    trips.forEach(t => {
      const date = new Date(t.date);
      const key = `${date.getMonth() + 1}/${date.getFullYear()}`;
      const current = chartDataMap.get(key) || 0;
      chartDataMap.set(key, current + t.distanceKm);
    });

    const chartData = Array.from(chartDataMap.entries()).map(([name, km]) => ({ name, km }));

    return { totalKm, businessKm, privateKm, tripCount, chartData };
  }, [trips]);

  // --- Trip Actions ---
  const handleAddTrip = (newTripData: Omit<Trip, 'id'>) => {
    const newTrip: Trip = {
      ...newTripData,
      id: Math.random().toString(36).substr(2, 9)
    };
    setTrips([newTrip, ...trips]);
  };

  const handleEditTrip = (updatedTrip: Trip) => {
    setTrips(trips.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setTripToEdit(null);
  };

  const openEditModal = (trip: Trip) => {
    setTripToEdit(trip);
    setIsModalOpen(true);
  };

  const handleDeleteTrip = (id: string) => {
    if (window.confirm('Opravdu chcete smazat tuto jízdu?')) {
      setTrips(trips.filter(t => t.id !== id));
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setTripToEdit(null);
  };

  // --- Vehicle Actions ---
  const handleAddVehicle = (v: Omit<Vehicle, 'id' | 'isActive'>) => {
    setVehicles([...vehicles, { ...v, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
  };
  const handleUpdateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, ...updates } : v));
  };
  const handleToggleVehicleArchive = (id: string) => {
     setVehicles(vehicles.map(v => v.id === id ? { ...v, isActive: !v.isActive } : v));
  };

  // --- Driver Actions ---
  const handleAddDriver = (d: Omit<Driver, 'id' | 'isActive'>) => {
    setDrivers([...drivers, { ...d, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
  };
  const handleUpdateDriver = (id: string, updates: Partial<Driver>) => {
    setDrivers(drivers.map(d => d.id === id ? { ...d, ...updates } : d));
  };
  const handleToggleDriverArchive = (id: string) => {
    setDrivers(drivers.map(d => d.id === id ? { ...d, isActive: !d.isActive } : d));
  };

  // --- Order Actions ---
  const handleAddOrder = (o: Omit<Order, 'id' | 'isActive'>) => {
    setOrders([...orders, { ...o, id: Math.random().toString(36).substr(2, 9), isActive: true }]);
  };
  const handleUpdateOrder = (id: string, updates: Partial<Order>) => {
    setOrders(orders.map(o => o.id === id ? { ...o, ...updates } : o));
  };
  const handleToggleOrderArchive = (id: string) => {
    setOrders(orders.map(o => o.id === id ? { ...o, isActive: !o.isActive } : o));
  };

  // --- Data Import Action ---
  const handleImportData = (importData: AppDataExport) => {
    if (importData.type === 'full_backup') {
      if (window.confirm('POZOR: Obnovení ze zálohy kompletně PŘEPÍŠE všechna současná data v aplikaci. Chcete pokračovat?')) {
        setTrips(importData.data.trips);
        setVehicles(importData.data.vehicles);
        setDrivers(importData.data.drivers);
        setOrders(importData.data.orders);
        alert('Data byla úspěšně obnovena ze zálohy.');
      }
    } else if (importData.type === 'driver_export') {
      // Merge Strategy
      const confirmMsg = `Chcete importovat data řidiče "${importData.source || 'neznámý'}"? \n` +
                         `Importuje se ${importData.data.trips.length} jízd. Data ostatních řidičů zůstanou nedotčena.`;
      
      if (window.confirm(confirmMsg)) {
        // 1. Merge Resources (Vehicles, Orders, Drivers)
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

        // 2. Merge Trips
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

          alert(`Import dokončen.\nPřidáno nových jízd: ${newCount}\nAktualizováno jízd: ${updateCount}`);
          return Array.from(tripMap.values());
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fc] pb-24 md:pb-10">
      
      {/* Desktop Top Navigation - Hidden on Mobile */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-30 print:hidden hidden md:block">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-2 rounded-lg text-white">
                <CarFront size={20} />
              </div>
              <h1 className="text-xl font-bold text-gray-900 tracking-tight">Kniha Jízd <span className="text-blue-600">AI</span></h1>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setCurrentView('dashboard')}
                className={`text-sm font-medium transition-colors ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                Přehled
              </button>
              <button 
                onClick={() => setCurrentView('reports')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === 'reports' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <FileText size={16} />
                Reporty
              </button>
              <button 
                onClick={() => setCurrentView('settings')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <SettingsIcon size={16} />
                Nastavení
              </button>
              <button 
                onClick={() => setCurrentView('about')}
                className={`text-sm font-medium transition-colors flex items-center gap-1 ${currentView === 'about' ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'}`}
              >
                <Info size={16} />
                O aplikaci
              </button>
              <div className="w-px h-6 bg-gray-200 mx-2"></div>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-medium border border-gray-200">
                 JD
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header - Simple */}
      <div className="md:hidden bg-white p-4 flex items-center justify-between sticky top-0 z-20 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-1.5 rounded-lg text-white">
            <CarFront size={18} />
          </div>
          <h1 className="text-lg font-bold text-gray-900">Kniha Jízd</h1>
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {currentView === 'dashboard' && 'Přehled'}
          {currentView === 'reports' && 'Reporty'}
          {currentView === 'settings' && 'Nastavení'}
          {currentView === 'about' && 'O aplikaci'}
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        
        {currentView === 'dashboard' && (
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-6 md:mb-8 animate-fade-in">
              <StatsCard 
                title="Celkem najeto" 
                value={`${stats.totalKm.toLocaleString('cs-CZ')} km`}
                icon={<TrendingUp size={20} />}
                colorClass="bg-white"
              />
              <div className="hidden md:block">
                <StatsCard 
                  title="Služební cesty" 
                  value={`${stats.businessKm.toLocaleString('cs-CZ')} km`}
                  icon={<LayoutDashboard size={20} />}
                  colorClass="bg-blue-50 border-blue-100"
                  trend={`${Math.round((stats.businessKm / (stats.totalKm || 1)) * 100)}% celku`}
                />
              </div>
              <div className="hidden md:block">
                <StatsCard 
                  title="Počet jízd" 
                  value={stats.tripCount}
                  icon={<CalendarDays size={20} />}
                  colorClass="bg-purple-50 border-purple-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in">
              
              {/* Left Column: Trips List */}
              <div className="lg:col-span-2 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">Historie jízd</h2>
                  <button 
                    onClick={() => {
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
                  trips={trips} 
                  vehicles={vehicles} 
                  drivers={drivers}
                  orders={orders}
                  onDelete={handleDeleteTrip} 
                  onEdit={openEditModal}
                />
              </div>

              {/* Right Column: Chart & Info (Desktop Only) */}
              <div className="space-y-6 hidden lg:block">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-6">
                     <h3 className="text-base font-bold text-gray-900">Přehled kilometrů</h3>
                     <PieIcon size={18} className="text-gray-400"/>
                  </div>
                  
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stats.chartData}>
                        <XAxis 
                          dataKey="name" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fontSize: 12, fill: '#9ca3af'}} 
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
                  <p className="text-xs text-center text-gray-400 mt-2">Měsíční souhrn ujeté vzdálenosti</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                  <h3 className="font-bold text-lg mb-2">AI Asistent</h3>
                  <p className="text-blue-100 text-sm mb-4">
                    Jednoduše napište nebo nadiktujte text jako "Včera cesta Brno Praha, 205km, služebně..."
                  </p>
                  <button 
                    onClick={() => {
                      setTripToEdit(null);
                      setIsModalOpen(true);
                    }}
                    className="w-full bg-white/10 hover:bg-white/20 backdrop-blur-sm py-2 rounded-lg text-sm font-medium transition-colors border border-white/20"
                  >
                    Vyzkoušet
                  </button>
                </div>
              </div>
              
              {/* Mobile AI Promo - visible only on mobile */}
              <div className="lg:hidden mb-20">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-4 text-white shadow-md flex items-center justify-between"
                   onClick={() => {
                     setTripToEdit(null);
                     setIsModalOpen(true);
                   }}
                >
                  <div>
                     <div className="font-bold mb-1">Chytré zadávání</div>
                     <div className="text-xs text-blue-100">Klikněte pro AI asistenta</div>
                  </div>
                  <div className="bg-white/20 p-2 rounded-full">
                    <Plus size={24} />
                  </div>
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
          />
        )}

        {currentView === 'about' && (
          <AboutView />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden pb-safe z-40 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
        <div className="flex items-end justify-between px-2">
          
          <button 
            onClick={() => setCurrentView('dashboard')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Home size={22} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Domů</span>
          </button>

          <button 
            onClick={() => setCurrentView('reports')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${currentView === 'reports' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <FileText size={22} strokeWidth={currentView === 'reports' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Reporty</span>
          </button>

          <div className="relative -top-5">
             <button 
                onClick={() => {
                  setTripToEdit(null);
                  setIsModalOpen(true);
                }}
                className="bg-blue-600 text-white p-4 rounded-full shadow-lg shadow-blue-400/40 hover:scale-105 transition-transform border-4 border-[#f8f9fc]"
             >
                <Plus size={28} />
             </button>
          </div>

          <button 
            onClick={() => setCurrentView('settings')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <SettingsIcon size={22} strokeWidth={currentView === 'settings' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Nastavení</span>
          </button>

          <button 
            onClick={() => setCurrentView('about')}
            className={`flex-1 py-3 flex flex-col items-center gap-1 ${currentView === 'about' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <Info size={22} strokeWidth={currentView === 'about' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">O aplikaci</span>
          </button>

        </div>
      </div>

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
      />
    </div>
  );
};

export default App;