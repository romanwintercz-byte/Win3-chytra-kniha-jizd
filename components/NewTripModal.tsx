import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MapPin, Calendar, Navigation, Loader2, Car, User, Briefcase, Gauge, Fuel, Mic, MicOff } from 'lucide-react';
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
  existingTrips: Trip[]; // Needed to calculate previous odometer
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
  
  // Voice Input State
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  const [startOdometer, setStartOdometer] = useState<number>(0);
  const [endOdometer, setEndOdometer] = useState<number>(0);
  const [fuelLiters, setFuelLiters] = useState<string>(''); // String to allow empty input
  
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<TripType>(TripType.BUSINESS);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  // Helpers
  const getVehicleLastOdometer = (vId: string): number => {
    const vehicleTrips = existingTrips.filter(t => t.vehicleId === vId && t.id !== tripToEdit?.id);
    
    if (vehicleTrips.length === 0) return 0;
    return Math.max(...vehicleTrips.map(t => t.endOdometer));
  };

  // Initialize form
  useEffect(() => {
    if (isOpen) {
      if (tripToEdit) {
        // Edit Mode
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
        // Create Mode
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

        // --- PERSISTENCE LOGIC START ---
        // Try to load preferences from localStorage
        const storedDriverId = localStorage.getItem('last_driver_id');
        const storedVehicleId = localStorage.getItem('last_vehicle_id');

        // Set Vehicle: Stored -> First Active -> Empty
        let initVehicleId = '';
        if (storedVehicleId && activeVehicles.find(v => v.id === storedVehicleId)) {
          initVehicleId = storedVehicleId;
        } else if (activeVehicles.length > 0) {
          initVehicleId = activeVehicles[0].id;
        }
        setVehicleId(initVehicleId);

        // Set Driver: Stored -> First Active -> Empty
        let initDriverId = '';
        if (storedDriverId && activeDrivers.find(d => d.id === storedDriverId)) {
          initDriverId = storedDriverId;
        } else if (activeDrivers.length > 0) {
          initDriverId = activeDrivers[0].id;
        }
        setDriverId(initDriverId);
        // --- PERSISTENCE LOGIC END ---

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
    
    // Cleanup speech recognition on close
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      setIsListening(false);
    };
  }, [isOpen, tripToEdit, vehicles, drivers, orders, existingTrips]);

  // Update start odometer when vehicle changes (Only in Create Mode or if manually changed)
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
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
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
      console.error("Microphone permission denied:", err);
      alert("Pro použití hlasového zadávání musíte povolit přístup k mikrofonu v prohlížeči.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'cs-CZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      
      if (event.error === 'not-allowed') {
        alert("Přístup k mikrofonu byl zamítnut. Zkontrolujte nastavení oprávnění stránky.");
      } else if (event.error === 'no-speech') {
        // Ignore
      } else {
        alert(`Chyba rozpoznávání řeči: ${event.error}`);
      }
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setAiInput(prev => {
        const spacer = prev && !prev.endsWith(' ') ? ' ' : '';
        return prev + spacer + transcript;
      });
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
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
        alert(
          "Chyba: API klíč nebyl nalezen.\n\n" +
          "Pokud aplikaci hostujete na Vercelu, proměnné prostředí jsou pro prohlížeč skryté.\n" +
          "Přejmenujte proměnnou v nastavení Vercelu na 'VITE_API_KEY' a aplikaci znovu nasaďte (Redeploy)."
        );
      } else {
        alert('Nepodařilo se zpracovat text. Zkuste to prosím znovu nebo údaje zadejte ručně.');
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

    // Save preferences to localStorage for next time
    localStorage.setItem('last_driver_id', driverId);
    localStorage.setItem('last_vehicle_id', vehicleId);

    const tripData = {
      date,
      origin,
      destination,
      distanceKm: distance,
      startOdometer,
      endOdometer,
      fuelLiters: fuelLiters ? Number(fuelLiters) : undefined,
      orderId,
      type,
      vehicleId,
      driverId
    };

    if (tripToEdit) {
      onEdit({ ...tripData, id: tripToEdit.id });
    } else {
      onAdd(tripData);
    }
    onClose();
  };

  if (!isOpen) return null;

  // Helper to render select options
  const renderSelectOptions = <T extends { id: string; name: string; isActive: boolean; [key: string]: any }>(
    items: T[], 
    selectedId: string, 
    renderLabel: (item: T) => string
  ) => {
    return items
      .filter(item => item.isActive || item.id === selectedId)
      .map(item => (
        <option key={item.id} value={item.id}>
          {renderLabel(item)} {!item.isActive ? '(Archivováno)' : ''}
        </option>
      ));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-fade-in max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-gray-900">
            {tripToEdit ? 'Upravit jízdu' : 'Nová jízda'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Mode Switcher - Only show in create mode */}
        {!tripToEdit && (
          <div className="flex p-1 mx-6 mt-4 bg-gray-100 rounded-lg">
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

        <div className="p-6 pt-4">
          {mode === 'ai' ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Popište svou jízdu</label>
                <div className="relative">
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 pr-12"
                    rows={5}
                    placeholder="Klikněte na mikrofon a diktujte, nebo pište: 'Včera cesta Brno Praha, 205km, služebně...'"
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                  />
                  <button
                    onClick={toggleListening}
                    className={`absolute bottom-3 right-3 p-2 rounded-full transition-all shadow-sm ${
                      isListening 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                    }`}
                    title={isListening ? "Zastavit nahrávání" : "Diktovat"}
                  >
                    {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                  </button>
                </div>
              </div>
              
              <button 
                onClick={handleAiParse}
                disabled={isProcessing || !aiInput.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-bold shadow-lg shadow-blue-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles size={18} />}
                {isProcessing ? 'Zpracovávám...' : 'Analyzovat text'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Row 1: Date & Type */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Calendar size={12} className="text-gray-400" />
                    Datum
                  </label>
                  <input 
                    type="date" 
                    required
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Briefcase size={12} className="text-gray-400" />
                    Typ jízdy
                  </label>
                  <select 
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm font-medium"
                    value={type}
                    onChange={(e) => setType(e.target.value as TripType)}
                  >
                    <option value={TripType.BUSINESS}>Služební</option>
                    <option value={TripType.PRIVATE}>Soukromá</option>
                  </select>
                </div>
              </div>

              {/* Row 2: Resources (Driver, Vehicle, Order) - Compact 3 col */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <User size={12} className="text-gray-400" />
                    Řidič
                  </label>
                  <select 
                    required
                    className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 text-sm"
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                  >
                      <option value="" disabled>-- Vyberte --</option>
                      {renderSelectOptions(drivers, driverId, d => d.name)}
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Car size={12} className="text-gray-400" />
                    Vozidlo
                  </label>
                  <select 
                    required
                    className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 text-sm"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                  >
                    <option value="" disabled>-- Vyberte --</option>
                    {renderSelectOptions(vehicles, vehicleId, v => v.name)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <Briefcase size={12} className="text-gray-400" />
                    Zakázka
                  </label>
                  <select 
                    required
                    className="w-full px-2 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold text-gray-800 text-sm"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                  >
                      <option value="" disabled>-- Vyberte --</option>
                      {renderSelectOptions(orders, orderId, o => o.name)}
                  </select>
                </div>
              </div>

              {/* Row 3: Route */}
              <div className="grid grid-cols-2 gap-3 relative">
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-10 bg-white rounded-full p-0.5 border border-gray-200 text-gray-400">
                  <Navigation size={12} className="rotate-90" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                    <MapPin size={12} className="text-gray-400" />
                    Odkud
                  </label>
                  <input 
                    type="text" 
                    required
                    placeholder="Město / Ulice"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 mb-1">Kam</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Cíl cesty"
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 4: Odometer */}
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="flex items-center justify-between mb-2">
                   <label className="text-xs font-bold text-gray-800 flex items-center gap-1">
                     <Gauge size={12} className="text-gray-400" />
                     Stav tachometru
                   </label>
                   <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                     Ujeto: {distance} km
                   </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Start</span>
                    <input 
                      type="number" 
                      required
                      min="0"
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                      value={startOdometer}
                      onChange={(e) => setStartOdometer(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-gray-500 mb-0.5 uppercase tracking-wide">Cíl</span>
                    <input 
                      type="number" 
                      required
                      min={startOdometer}
                      className="w-full px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono"
                      value={endOdometer}
                      onChange={(e) => setEndOdometer(Number(e.target.value))}
                    />
                  </div>
                </div>
              </div>

              {/* Row 5: Fuel */}
              <div>
                 <label className="block text-xs font-bold text-gray-800 mb-1 flex items-center gap-1">
                   <Fuel size={12} className="text-gray-400" />
                   Tankování (nepovinné)
                 </label>
                 <div className="relative">
                   <input 
                     type="number" 
                     min="0"
                     step="0.1"
                     placeholder="0"
                     className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                     value={fuelLiters}
                     onChange={(e) => setFuelLiters(e.target.value)}
                   />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs">litrů</span>
                 </div>
              </div>

              <div className="pt-2 flex gap-3">
                 <button 
                   type="button"
                   onClick={onClose}
                   className="flex-1 py-2.5 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors text-sm"
                 >
                   Zrušit
                 </button>
                 <button 
                   type="submit"
                   className="flex-[2] py-2.5 bg-black text-white font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200 text-sm"
                 >
                   {tripToEdit ? 'Uložit změny' : 'Přidat jízdu'}
                 </button>
              </div>

            </form>
          )}
        </div>
      </div>
    </div>
  );
};