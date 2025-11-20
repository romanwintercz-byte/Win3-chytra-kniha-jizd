import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MapPin, Calendar, Navigation, Loader2, Car, User, Briefcase, Gauge, Fuel, Mic, MicOff, Save, ArrowLeft } from 'lucide-react';
import { Trip, TripType, Vehicle, Driver, Order } from '../types';
import { parseTripFromText } from '../services/geminiService';

interface NewTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (trip: Omit<Trip, 'id'>) => void;
  onEdit: (trip: Trip) => void;
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  existingTrips: Trip[]; 
  tripToEdit?: Trip | null;
}

export const NewTripModal: React.FC<NewTripModalProps> = ({ 
  isOpen, 
  onClose, 
  onAdd, 
  onEdit,
  vehicles, 
  drivers, 
  orders, 
  existingTrips,
  tripToEdit
}) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  const [startOdometer, setStartOdometer] = useState<number>(0);
  const [endOdometer, setEndOdometer] = useState<number>(0);
  const [fuelLiters, setFuelLiters] = useState<string>(''); 
  
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<TripType>(TripType.BUSINESS);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  const getVehicleLastOdometer = (vId: string): number => {
    const vehicleTrips = existingTrips.filter(t => t.vehicleId === vId && t.id !== tripToEdit?.id);
    if (vehicleTrips.length === 0) return 0;
    return Math.max(...vehicleTrips.map(t => t.endOdometer));
  };

  useEffect(() => {
    if (isOpen) {
      if (tripToEdit) {
        setMode('manual');
        setAiInput('');
        setDate(tripToEdit.date);
        setOrigin(tripToEdit.origin);
        setDestination(tripToEdit.destination);
        setStartOdometer(tripToEdit.startOdometer);
        setEndOdometer(tripToEdit.endOdometer);
        setFuelLiters(tripToEdit.fuelLiters ? tripToEdit.fuelLiters.toString() : '');
        setOrderId(tripToEdit.orderId);
        setType(tripToEdit.type);
        setVehicleId(tripToEdit.vehicleId);
        setDriverId(tripToEdit.driverId);
      } else {
        setMode('manual');
        setAiInput('');
        setIsProcessing(false);
        
        setDate(new Date().toISOString().split('T')[0]);
        setOrigin('');
        setDestination('');
        setFuelLiters('');
        setType(TripType.BUSINESS);
        
        const activeVehicles = vehicles.filter(v => v.isActive);
        const activeDrivers = drivers.filter(d => d.isActive);
        const activeOrders = orders.filter(o => o.isActive);

        const storedDriverId = localStorage.getItem('last_driver_id');
        const storedVehicleId = localStorage.getItem('last_vehicle_id');

        let initVehicleId = '';
        if (storedVehicleId && activeVehicles.find(v => v.id === storedVehicleId)) {
          initVehicleId = storedVehicleId;
        } else if (activeVehicles.length > 0) {
          initVehicleId = activeVehicles[0].id;
        }
        setVehicleId(initVehicleId);

        let initDriverId = '';
        if (storedDriverId && activeDrivers.find(d => d.id === storedDriverId)) {
          initDriverId = storedDriverId;
        } else if (activeDrivers.length > 0) {
          initDriverId = activeDrivers[0].id;
        }
        setDriverId(initDriverId);

        if (activeOrders.length > 0) setOrderId(activeOrders[0].id);

        if (initVehicleId) {
          const lastOdo = getVehicleLastOdometer(initVehicleId);
          setStartOdometer(lastOdo);
          setEndOdometer(lastOdo);
        } else {
          setStartOdometer(0);
          setEndOdometer(0);
        }
      }
    }
    
    return () => {
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch (e) {}
      }
      setIsListening(false);
    };
  }, [isOpen, tripToEdit, vehicles, drivers, orders, existingTrips]);

  useEffect(() => {
    if (isOpen && !tripToEdit && vehicleId) {
      const lastOdo = getVehicleLastOdometer(vehicleId);
      setStartOdometer(lastOdo);
      if (endOdometer < lastOdo) {
        setEndOdometer(lastOdo);
      }
    }
  }, [vehicleId, isOpen, tripToEdit]);

  const distance = Math.max(0, endOdometer - startOdometer);

  const toggleListening = async () => {
    if (isListening) {
      if (recognitionRef.current) recognitionRef.current.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Váš prohlížeč nepodporuje hlasové zadávání.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
    } catch (err) {
      alert("Pro použití hlasového zadávání musíte povolit přístup k mikrofonu v prohlížeči.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'cs-CZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      if (event.error === 'not-allowed') alert("Přístup k mikrofonu byl zamítnut.");
    };
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(prev => (prev && !prev.endsWith(' ') ? prev + ' ' : prev) + transcript);
    };

    recognitionRef.current = recognition;
    try { recognition.start(); } catch (e) { console.error("Failed to start recognition:", e); }
  };

  const handleAiParse = async () => {
    if (!aiInput.trim()) return;
    setIsProcessing(true);
    try {
      const result = await parseTripFromText(aiInput);
      if (result.origin) setOrigin(result.origin);
      if (result.destination) setDestination(result.destination);
      if (result.date) setDate(result.date);
      if (result.fuelLiters) setFuelLiters(result.fuelLiters.toString());

      let matchedVehicleId = vehicleId;
      if (result.vehicleName) {
        const foundV = vehicles.find(v => v.isActive && v.name.toLowerCase().includes(result.vehicleName?.toLowerCase() || ''));
        if (foundV) {
          matchedVehicleId = foundV.id;
          setVehicleId(foundV.id);
        }
      }

      const currentStartOdo = matchedVehicleId ? getVehicleLastOdometer(matchedVehicleId) : startOdometer;
      setStartOdometer(currentStartOdo);

      if (result.endOdometer) {
        setEndOdometer(result.endOdometer);
      } else if (result.distanceKm) {
        setEndOdometer(currentStartOdo + result.distanceKm);
      }

      if (result.driverName) {
        const foundD = drivers.find(d => d.isActive && d.name.toLowerCase().includes(result.driverName?.toLowerCase() || ''));
        if (foundD) setDriverId(foundD.id);
      }
      if (result.orderName) {
        const foundO = orders.find(o => o.isActive && o.name.toLowerCase().includes(result.orderName?.toLowerCase() || ''));
        if (foundO) setOrderId(foundO.id);
      }
      setMode('manual');
    } catch (e: any) {
      console.error("AI processing error:", e);
       if (e.message === 'API Key not found') {
        alert("Chyba: API klíč nebyl nalezen. Viz návod v konzoli.");
      } else {
        alert('Nepodařilo se zpracovat text. Zkuste to znovu nebo zadejte ručně.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (endOdometer < startOdometer) {
      alert('Konečný stav tachometru nemůže být menší než počáteční!');
      return;
    }
    localStorage.setItem('last_driver_id', driverId);
    localStorage.setItem('last_vehicle_id', vehicleId);

    const tripData = {
      date, origin, destination, distanceKm: distance, startOdometer, endOdometer,
      fuelLiters: fuelLiters ? Number(fuelLiters) : undefined,
      orderId, type, vehicleId, driverId
    };

    if (tripToEdit) {
      onEdit({ ...tripData, id: tripToEdit.id });
    } else {
      onAdd(tripData);
    }
    onClose();
  };

  if (!isOpen) return null;

  const renderSelectOptions = <T extends { id: string; name: string; isActive: boolean; [key: string]: any }>(
    items: T[], selectedId: string, renderLabel: (item: T) => string
  ) => {
    return items
      .filter(item => item.isActive || item.id === selectedId)
      .map(item => (
        <option key={item.id} value={item.id}>{renderLabel(item)} {!item.isActive ? '(Archivováno)' : ''}</option>
      ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white w-full h-full md:h-auto md:max-w-lg md:rounded-2xl shadow-2xl overflow-hidden animate-slide-up md:animate-fade-in flex flex-col md:max-h-[95vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-gray-100 bg-white z-10 shrink-0">
          <h2 className="text-lg md:text-xl font-bold text-gray-900 flex items-center gap-2">
            <button onClick={onClose} className="md:hidden -ml-2 p-2 text-gray-500">
                <ArrowLeft size={24} />
            </button>
            {tripToEdit ? 'Upravit jízdu' : 'Nová jízda'}
          </h2>
          <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
          {/* Mobile Save Button in Header */}
           <button 
              type="button"
              onClick={handleSubmit}
              className="md:hidden text-blue-600 font-bold text-sm bg-blue-50 px-3 py-1.5 rounded-full"
            >
              Uložit
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar pb-24 md:pb-6">
          {/* Mode Switcher */}
          {!tripToEdit && (
            <div className="flex p-1 mb-6 bg-gray-100 rounded-lg shrink-0">
              <button 
                onClick={() => setMode('manual')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Manuální zadání
              </button>
              <button 
                onClick={() => setMode('ai')}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all flex items-center justify-center gap-2 ${mode === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                <Sparkles size={16} />
                AI Asistent
              </button>
            </div>
          )}

          {mode === 'ai' ? (
            <div className="space-y-4 h-full flex flex-col">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Popište svou jízdu</label>
                <div className="relative h-64 md:h-auto">
                  <textarea
                    className="w-full h-full md:h-40 border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 text-base"
                    placeholder="Např: Včera cesta Brno Praha, 205km, služebně..."
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                  />
                  <button
                    onClick={toggleListening}
                    className={`absolute bottom-4 right-4 p-4 md:p-2 rounded-full transition-all shadow-md ${
                      isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-blue-100 text-blue-600'
                    }`}
                  >
                    {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>
                </div>
              </div>
              <button 
                onClick={handleAiParse}
                disabled={isProcessing || !aiInput.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 md:py-3 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 text-lg md:text-base"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={20} />}
                {isProcessing ? 'Zpracovávám...' : 'Analyzovat text'}
              </button>
            </div>
          ) : (
            <form id="trip-form" onSubmit={handleSubmit} className="space-y-5">
              
              {/* Row 1: Date & Type */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                    <Calendar size={14} className="text-gray-400" />
                    Datum
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base font-medium"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                    <Briefcase size={14} className="text-gray-400" />
                    Typ jízdy
                  </label>
                  <div className="relative">
                      <select 
                        className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-base font-medium appearance-none"
                        value={type}
                        onChange={(e) => setType(e.target.value as TripType)}
                      >
                        <option value={TripType.BUSINESS}>Služební</option>
                        <option value={TripType.PRIVATE}>Soukromá</option>
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6"/></svg>
                      </div>
                  </div>
                </div>
              </div>

              {/* Row 2: Resources */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1.5">Řidič</label>
                  <select required className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium" value={driverId} onChange={(e) => setDriverId(e.target.value)}>
                      <option value="" disabled>-- Vyberte --</option>
                      {renderSelectOptions(drivers, driverId, d => d.name)}
                  </select>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">Vozidlo</label>
                        <select required className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium" value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
                            <option value="" disabled>-- Vyberte --</option>
                            {renderSelectOptions(vehicles, vehicleId, v => v.name)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-800 mb-1.5">Zakázka</label>
                        <select required className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-medium" value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                            <option value="" disabled>-- Vyberte --</option>
                            {renderSelectOptions(orders, orderId, o => o.name)}
                        </select>
                    </div>
                </div>
              </div>

              {/* Row 3: Route */}
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                 <div className="absolute left-4 top-[3.25rem] bottom-[3.25rem] w-0.5 bg-gray-200"></div>
                 <div className="space-y-4">
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gray-400 ring-4 ring-gray-100"></div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Odkud</label>
                        <input type="text" required placeholder="Město / Ulice" className="w-full px-0 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base font-medium placeholder:font-normal" value={origin} onChange={(e) => setOrigin(e.target.value)} />
                    </div>
                    <div className="relative pl-8">
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-100"></div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase mb-1">Kam</label>
                        <input type="text" required placeholder="Cíl cesty" className="w-full px-0 bg-transparent border-b border-gray-300 focus:border-blue-500 outline-none py-2 text-base font-medium placeholder:font-normal" value={destination} onChange={(e) => setDestination(e.target.value)} />
                    </div>
                 </div>
              </div>

              {/* Row 4: Odometer */}
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                <div className="flex items-center justify-between mb-3">
                   <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                     <Gauge size={14} className="text-blue-500" />
                     Stav tachometru
                   </label>
                   <span className="text-xs font-bold text-blue-700 bg-white px-2 py-1 rounded border border-blue-100 shadow-sm">
                     + {distance} km
                   </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Start</span>
                    <input type="number" required min="0" className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base font-mono font-medium" value={startOdometer} onChange={(e) => setStartOdometer(Number(e.target.value))} />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 mb-1 uppercase tracking-wide">Cíl</span>
                    <input type="number" required min={startOdometer} className="w-full px-3 py-2 bg-white border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-base font-mono font-medium" value={endOdometer} onChange={(e) => setEndOdometer(Number(e.target.value))} />
                  </div>
                </div>
              </div>

              {/* Row 5: Fuel */}
              <div>
                 <label className="block text-xs font-bold text-gray-800 mb-1.5 flex items-center gap-1">
                   <Fuel size={14} className="text-gray-400" />
                   Tankování
                 </label>
                 <div className="relative">
                   <input type="number" min="0" step="0.1" placeholder="Litry (nepovinné)" className="w-full px-3 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base" value={fuelLiters} onChange={(e) => setFuelLiters(e.target.value)} />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">L</span>
                 </div>
              </div>
            </form>
          )}
        </div>

        {/* Footer Actions (Desktop Only - Mobile has header save) */}
        {mode !== 'ai' && (
            <div className="hidden md:flex p-6 border-t border-gray-100 bg-white gap-3 shrink-0">
                 <button type="button" onClick={onClose} className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm">Zrušit</button>
                 <button type="submit" form="trip-form" className="flex-[2] py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm flex items-center justify-center gap-2">
                   <Save size={18} />
                   {tripToEdit ? 'Uložit změny' : 'Přidat jízdu'}
                 </button>
            </div>
        )}
      </div>
    </div>
  );
};