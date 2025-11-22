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
  Lightbulb,
  Briefcase
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
import { HelpView } from './components/HelpView';
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
  const [currentView, setCurrentView] = useState<'dashboard' | 'settings' | 'reports' | 'help'>('dashboard');
  
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
  
  // Closure Date State
  const [closureDate, setClosureDate] = useState<string>(() => {
    return localStorage.getItem('win3_closure_date') || '';
  });

  // Persist data effects
  useEffect(() => { localStorage.setItem('win3_trips', JSON.stringify(trips)); }, [trips]);
  useEffect(() => { localStorage.setItem('win3_vehicles', JSON.stringify(vehicles)); }, [vehicles]);
  useEffect(() => { localStorage.setItem('win3_drivers', JSON.stringify(drivers)); }, [drivers]);
  useEffect(() => { localStorage.setItem('win3_orders', JSON.stringify(orders)); }, [orders]);
  useEffect(() => { localStorage.setItem('win3_templates', JSON.stringify(templates)); }, [templates]);
  useEffect(() => { localStorage.setItem('win3_closure_date', closureDate); }, [closureDate]);

  // Stats logic
  const currentMonthStats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const monthTrips = trips.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const totalKm = monthTrips.reduce((acc, t) => acc + t.distanceKm, 0);
    const totalFuel = monthTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
    const businessTripsCount = monthTrips.filter(t => t.type === TripType.BUSINESS).length;

    return { totalKm, totalFuel, businessTripsCount };
  }, [trips]);

  const chartData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    return last7Days.map(date => {
      const dayTrips = trips.filter(t => t.date === date);
      const km = dayTrips.reduce((acc, t) => acc + t.distanceKm, 0);
      const dayName = new Date(date).toLocaleDateString('cs-CZ', { weekday: 'short' });
      return { name: dayName, km };
    });
  }, [trips]);

  // Handlers
  const handleAddTrip = (newTrip: Omit<Trip, 'id'>) => {
    const trip: Trip = { ...newTrip, id: crypto.randomUUID() };
    setTrips(prev => [trip, ...prev]);
    Haptics.success();
  };

  const handleEditTrip = (updatedTrip: Trip) => {
    setTrips(prev => prev.map(t => t.id === updatedTrip.id ? updatedTrip : t));
    setTripToEdit(null);
    Haptics.success();
  };

  const handleDeleteTrip = (id: string) => {
    if (window.confirm('Opravdu smazat tuto jízdu?')) {
      setTrips(prev => prev.filter(t => t.id !== id));
      Haptics.medium();
    }
  };

  const handleOpenEdit = (trip: Trip) => {
    setTripToEdit(trip);
    setIsModalOpen(true);
    Haptics.light();
  };

  const handleImportData = (importData: AppDataExport) => {
    if (importData.type === 'full_backup') {
       if (window.confirm('POZOR: Import kompletní zálohy přepíše všechna současná data v aplikaci. Chcete pokračovat?')) {
          setTrips(importData.data.trips);
          setVehicles(importData.data.vehicles);
          setDrivers(importData.data.drivers);
          setOrders(importData.data.orders);
          Haptics.success();
          alert('Záloha byla úspěšně obnovena.');
       }
    } else if (importData.type === 'driver_export') {
       // Merge logic for driver export
       const newTrips = importData.data.trips;
       
       // 1. Add/Update trips
       setTrips(prev => {
         const existingIds = new Set(prev.map(t => t.id));
         const merged = [...prev];
         newTrips.forEach(nt => {
           if (!existingIds.has(nt.id)) {
             merged.push(nt);
           } else {
             // Optional: update existing? For now, let's assume ID collision means same trip
             // Find index and update if needed, or just skip
             const idx = merged.findIndex(t => t.id === nt.id);
             if (idx >= 0) merged[idx] = nt;
           }
         });
         return merged;
       });

       // 2. Ensure vehicles exist (basic check by ID)
       setVehicles(prev => {
         const existingIds = new Set(prev.map(v => v.id));
         const merged = [...prev];
         importData.data.vehicles.forEach(v => {
            if (!existingIds.has(v.id)) merged.push(v);
         });
         return merged;
       });
       
       // 3. Ensure orders exist
        setOrders(prev => {
         const existingIds = new Set(prev.map(o => o.id));
         const merged = [...prev];
         importData.data.orders.forEach(o => {
            if (!existingIds.has(o.id)) merged.push(o);
         });
         return merged;
       });
       
       Haptics.success();
       alert(`Data pro řidiče ${importData.source || ''} byla úspěšně importována.`);
    }
  };

  // Template Handlers
  const handleAddTemplate = (t: Omit<TripTemplate, 'id'>) => {
    const newTemplate = { ...t, id: crypto.randomUUID() };
    setTemplates(prev => [...prev, newTemplate]);
    Haptics.success();
  };

  const handleDeleteTemplate = (id: string) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    Haptics.medium();
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900 pb-24 md:pb-0">
      {/* Desktop Header / Sidebar Placeholder */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30 pt-safe">
        <div className="flex items-center justify-between h-16 px-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="bg-black text-white p-1.5 rounded-lg">
              <CarFront size={20} />
            </div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">Kniha<span className="text-gray-400">Jízd</span></h1>
          </div>
          <div className="flex items-center gap-2">
             {/* Smart Guide Button */}
             <button 
               onClick={() => {
                  Haptics.light();
                  setIsSmartGuideOpen(true);
               }}
               className="p-2 text-gray-500 hover:text-yellow-600 transition-colors rounded-full hover:bg-yellow-50 relative group"
               title="Chytré tipy"
             >
               <Lightbulb size={24} className={isSmartGuideOpen ? "fill-yellow-400 text-yellow-400" : ""} />
             </button>

             <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>
             
             <div className="hidden md:flex gap-1">
                <button 
                  onClick={() => setCurrentView('dashboard')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentView === 'dashboard' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  Přehled
                </button>
                <button 
                  onClick={() => setCurrentView('reports')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentView === 'reports' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  Reporty
                </button>
                <button 
                  onClick={() => setCurrentView('settings')}
                  className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${currentView === 'settings' || currentView === 'help' ? 'bg-gray-100 text-black' : 'text-gray-500 hover:text-black'}`}
                >
                  Nastavení
                </button>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        {currentView === 'dashboard' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard 
                title="Ujeto tento měsíc" 
                value={`${currentMonthStats.totalKm.toLocaleString()} km`} 
                icon={<TrendingUp size={24} />}
                colorClass="bg-blue-50/50 border-blue-100"
              />
              <StatsCard 
                title="Služební jízdy" 
                value={currentMonthStats.businessTripsCount} 
                icon={<Briefcase size={24} />} // Changed icon to briefcase
                colorClass="bg-purple-50/50 border-purple-100"
              />
               <StatsCard 
                title="Tankování" 
                value={`${currentMonthStats.totalFuel} l`} 
                icon={<CarFront size={24} />}
                colorClass="bg-orange-50/50 border-orange-100"
              />
            </div>

            {/* Chart Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-64 hidden md:block">
              <h3 className="text-sm font-bold text-gray-400 uppercase mb-4">Posledních 7 dní</h3>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fontSize: 12, fill: '#9CA3AF'}} 
                    dy={10}
                  />
                  <Tooltip 
                    cursor={{fill: '#F3F4F6'}}
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                  />
                  <Bar dataKey="km" radius={[6, 6, 6, 6]} barSize={40}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.km > 0 ? '#18181B' : '#E4E4E7'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Trip List */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900">Poslední jízdy</h2>
                {/* Filter button placeholder */}
              </div>
              <TripList 
                trips={trips} 
                vehicles={vehicles}
                drivers={drivers}
                orders={orders}
                onDelete={handleDeleteTrip}
                onEdit={handleOpenEdit}
                closureDate={closureDate}
              />
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
             trips={trips} // Pass trips for DataManagement
             
             onAddVehicle={(v) => {
                setVehicles(prev => [...prev, { ...v, id: crypto.randomUUID(), isActive: true }]);
                Haptics.success();
             }}
             onUpdateVehicle={(id, v) => {
                setVehicles(prev => prev.map(item => item.id === id ? { ...item, ...v } : item));
                Haptics.medium();
             }}
             onToggleVehicleArchive={(id) => {
                setVehicles(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
                Haptics.medium();
             }}
             
             onAddDriver={(d) => {
                setDrivers(prev => [...prev, { ...d, id: crypto.randomUUID(), isActive: true }]);
                Haptics.success();
             }}
             onUpdateDriver={(id, d) => {
                setDrivers(prev => prev.map(item => item.id === id ? { ...item, ...d } : item));
                Haptics.medium();
             }}
             onToggleDriverArchive={(id) => {
                setDrivers(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
                Haptics.medium();
             }}

             onAddOrder={(o) => {
                setOrders(prev => [...prev, { ...o, id: crypto.randomUUID(), isActive: true }]);
                Haptics.success();
             }}
             onUpdateOrder={(id, o) => {
                setOrders(prev => prev.map(item => item.id === id ? { ...item, ...o } : item));
                Haptics.medium();
             }}
             onToggleOrderArchive={(id) => {
                setOrders(prev => prev.map(item => item.id === id ? { ...item, isActive: !item.isActive } : item));
                Haptics.medium();
             }}

             onImportData={handleImportData}
             onOpenAbout={() => setIsAboutOpen(true)}
             onOpenHelp={() => {
                setCurrentView('help');
                window.scrollTo(0,0);
             }}

             closureDate={closureDate}
             onSetClosureDate={setClosureDate}
           />
        )}

        {currentView === 'help' && (
          <HelpView onBack={() => setCurrentView('settings')} />
        )}
      </main>

      {/* Floating Action Button (Mobile Only) */}
      {currentView === 'dashboard' && (
        <button
          onClick={() => {
            setTripToEdit(null);
            setIsModalOpen(true);
            Haptics.light();
          }}
          className="md:hidden fixed bottom-24 right-4 w-14 h-14 bg-black text-white rounded-full shadow-2xl shadow-black/30 flex items-center justify-center z-40 active:scale-90 transition-transform"
        >
          <Plus size={28} />
        </button>
      )}

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 pb-safe z-40">
        <div className="flex justify-around items-center h-16">
          <button 
            onClick={() => { setCurrentView('dashboard'); Haptics.light(); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'dashboard' ? 'text-black' : 'text-gray-400'}`}
          >
            <LayoutDashboard size={24} strokeWidth={currentView === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Přehled</span>
          </button>
          <button 
            onClick={() => { setCurrentView('reports'); Haptics.light(); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'reports' ? 'text-black' : 'text-gray-400'}`}
          >
            <FileText size={24} strokeWidth={currentView === 'reports' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Reporty</span>
          </button>
          <button 
            onClick={() => { setCurrentView('settings'); Haptics.light(); }}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${currentView === 'settings' || currentView === 'help' ? 'text-black' : 'text-gray-400'}`}
          >
            <SettingsIcon size={24} strokeWidth={currentView === 'settings' || currentView === 'help' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Nastavení</span>
          </button>
        </div>
      </nav>

      {/* Modals */}
      <NewTripModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
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