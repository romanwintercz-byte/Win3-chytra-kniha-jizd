import React, { useState, useEffect, useRef } from 'react';
import { X, Sparkles, MapPin, Calendar, Navigation, Loader2, Car, User, Briefcase, Gauge, Fuel, Mic, MicOff, ArrowLeft, Save, Bookmark, AlertTriangle, Trash2, Check, Camera, Banknote } from 'lucide-react';
import { Trip, TripType, Vehicle, Driver, Order, TripTemplate } from '../types';
import { parseTripFromText, parseReceiptFromImage } from '../services/geminiService';
import { Haptics } from '../utils/haptics';

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
  templates?: TripTemplate[];
  onAddTemplate?: (template: Omit<TripTemplate, 'id'>) => void;
  onDeleteTemplate?: (id: string) => void;
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
  tripToEdit,
  templates = [],
  onAddTemplate,
  onDeleteTemplate
}) => {
  const [mode, setMode] = useState<'manual' | 'ai'>('manual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [isScanningReceipt, setIsScanningReceipt] = useState(false);
  
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  
  const [startOdometer, setStartOdometer] = useState<number>(0);
  const [endOdometer, setEndOdometer] = useState<number>(0);
  const [fuelLiters, setFuelLiters] = useState<string>('');
  const [fuelPrice, setFuelPrice] = useState<string>('');
  
  const [orderId, setOrderId] = useState('');
  const [type, setType] = useState<TripType>(TripType.BUSINESS);
  const [vehicleId, setVehicleId] = useState('');
  const [driverId, setDriverId] = useState('');

  const [showTemplates, setShowTemplates] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');

  const getVehicleLastOdometer = (vId: string): number => {
    const vehicleTrips = existingTrips.filter(t => t.vehicleId === vId && t.id !== tripToEdit?.id);
    if (vehicleTrips.length === 0) return 0;
    return Math.max(...vehicleTrips.map(t => t.endOdometer));
  };

  const lastKnownOdometer = vehicleId ? getVehicleLastOdometer(vehicleId) : 0;
  const odometerGap = vehicleId && startOdometer !== lastKnownOdometer && lastKnownOdometer > 0;

  useEffect(() => {
    if (isOpen) {
      setSaveAsTemplate(false);
      setTemplateName('');
      setShowTemplates(false);
      setIsScanningReceipt(false);

      if (tripToEdit) {
        setMode('manual');
        setAiInput('');
        setDate(tripToEdit.date);
        setOrigin(tripToEdit.origin);
        setDestination(tripToEdit.destination);
        setStartOdometer(tripToEdit.startOdometer);
        setEndOdometer(tripToEdit.endOdometer);
        setFuelLiters(tripToEdit.fuelLiters ? tripToEdit.fuelLiters.toString() : '');
        setFuelPrice(tripToEdit.fuelPrice ? tripToEdit.fuelPrice.toString() : '');
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
        setFuelPrice('');
        setType(TripType.BUSINESS);
        
        const activeVehicles = vehicles.filter(v => v.isActive);
        const activeDrivers = drivers.filter(d => d.isActive);
        const activeOrders = orders.filter(o => o.isActive);

        const lastVehicle = localStorage.getItem('win3_last_vehicle');
        const lastDriver = localStorage.getItem('win3_last_driver');
        const lastOrder = localStorage.getItem('win3_last_order');

        const isValidVehicle = lastVehicle && activeVehicles.some(v => v.id === lastVehicle);
        const isValidDriver = lastDriver && activeDrivers.some(d => d.id === lastDriver);
        const isValidOrder = lastOrder && activeOrders.some(o => o.id === lastOrder);

        const initVehicleId = isValidVehicle ? lastVehicle : (activeVehicles.length > 0 ? activeVehicles[0].id : '');
        const initDriverId = isValidDriver ? lastDriver : (activeDrivers.length > 0 ? activeDrivers[0].id : '');
        const initOrderId = isValidOrder ? lastOrder : (activeOrders.length > 0 ? activeOrders[0].id : '');

        setVehicleId(initVehicleId);
        setDriverId(initDriverId);
        setOrderId(initOrderId);

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
        try {
          recognitionRef.current.stop();
        } catch (e) {}
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
  }, [vehicleId]);

  const distance = Math.max(0, endOdometer - startOdometer);

  const toggleListening = async () => {
    Haptics.medium();
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
    } catch (err: any) {
      console.error("Microphone permission denied or device not found:", err);
      if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          alert("Nebylo nalezeno žádné vstupní zvukové zařízení (mikrofon).");
      } else {
          alert("Pro použití hlasového zadávání musíte povolit přístup k mikrofonu v prohlížeči.");
      }
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'cs-CZ';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true);
      Haptics.light();
    };

    recognition.onend = () => {
      setIsListening(false);
      Haptics.light();
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      Haptics.error();
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
    Haptics.medium();
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
      Haptics.success();
    } catch (e: any) {
      Haptics.error();
      console.error("AI Processing Error:", e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`Chyba při zpracování: ${errorMsg}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyTemplate = (t: TripTemplate) => {
    Haptics.success();
    setOrigin(t.origin);
    setDestination(t.destination);
    setOrderId(t.orderId);
    setType(t.type);
    if (t.vehicleId) setVehicleId(t.vehicleId);
    if (t.driverId) setDriverId(t.driverId);
    setShowTemplates(false);
  };

  const handleScanReceipt = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanningReceipt(true);
    Haptics.medium();

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const base64String = (event.target?.result as string).split(',')[1];
        const mimeType = file.type;

        const result = await parseReceiptFromImage(base64String, mimeType);

        if (result.date) setDate(result.date);
        if (result.fuelLiters) setFuelLiters(result.fuelLiters.toString());
        if (result.fuelPrice) setFuelPrice(result.fuelPrice.toString());
        
        Haptics.success();
      } catch (error: any) {
        console.error("Receipt scan error:", error);
        Haptics.error();
        const errorMsg = error instanceof Error ? error.message : String(error);
        alert(`Nepodařilo se načíst data z účtenky: ${errorMsg}`);
      } finally {
        setIsScanningReceipt(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (endOdometer < startOdometer) {
      Haptics.error();
      alert('Konečný stav tachometru nemůže být menší než počáteční!');
      return;
    }

    const tripData = {
      date,
      origin,
      destination,
      distanceKm: distance,
      startOdometer,
      endOdometer,
      fuelLiters: fuelLiters ? Number(fuelLiters) : undefined,
      fuelPrice: fuelPrice ? Number(fuelPrice) : undefined,
      orderId,
      type,
      vehicleId,
      driverId
    };

    if (saveAsTemplate && templateName && onAddTemplate) {
      onAddTemplate({
        name: templateName,
        origin,
        destination,
        orderId,
        type,
        vehicleId,
        driverId
      });
    }

    localStorage.setItem('win3_last_vehicle', vehicleId);
    localStorage.setItem('win3_last_driver', driverId);
    localStorage.setItem('win3_last_order', orderId);

    if (tripToEdit) {
      onEdit({ ...tripData, id: tripToEdit.id });
    } else {
      onAdd(tripData);
    }
    onClose();
  };

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 md:backdrop-blur-sm md:p-4">
      <div className="bg-white w-full h-[100dvh] md:h-auto md:max-h-[90vh] md:max-w-lg md:rounded-2xl shadow-2xl overflow-hidden animate-fade-in flex flex-col">
        
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-white z-10 flex-shrink-0 pt-safe">
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="md:hidden text-gray-800 p-2 -ml-2 rounded-full hover:bg-gray-100 active:bg-gray-200">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-lg font-bold text-gray-900">
              {tripToEdit ? 'Upravit jízdu' : 'Nová jízda'}
            </h2>
          </div>
          <button onClick={onClose} className="hidden md:block text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-grow overflow-y-auto custom-scrollbar bg-gray-50/50">
          {!tripToEdit && (
            <div className="sticky top-0 z-20 bg-white px-4 py-3 border-b border-gray-100 flex gap-2">
              <div className="flex p-1 bg-gray-100 rounded-xl flex-grow">
                <button 
                  onClick={() => {
                    Haptics.light();
                    setMode('manual');
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === 'manual' ? 'bg-white text-black shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  Manuální
                </button>
                <button 
                  onClick={() => {
                    Haptics.light();
                    setMode('ai');
                  }}
                  className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${mode === 'ai' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Sparkles size={14} />
                  AI Asistent
                </button>
              </div>
              
              <input 
                type="file" 
                accept="image/*" 
                capture="environment"
                ref={fileInputRef}
                className="hidden"
                onChange={handleFileChange}
              />
              <button 
                onClick={handleScanReceipt}
                disabled={isScanningReceipt}
                className={`p-3 rounded-xl border transition-all ${isScanningReceipt ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                title="Nahrát účtenku"
              >
                 {isScanningReceipt ? <Loader2 size={20} className="animate-spin text-blue-600" /> : <Camera size={20} />}
              </button>

              {mode === 'manual' && (
                 <button 
                  onClick={() => {
                    Haptics.light();
                    setShowTemplates(!showTemplates);
                  }}
                  className={`p-3 rounded-xl border transition-all ${showTemplates ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
                 >
                   <Bookmark size={20} className={showTemplates ? "fill-amber-600" : ""} />
                 </button>
              )}
            </div>
          )}

          <div className="p-4 pb-32 md:pb-6 space-y-6">
            {showTemplates && mode === 'manual' && (
               <div className="bg-white p-4 rounded-2xl shadow-lg border border-amber-100 space-y-3 animate-fade-in">
                 <h3 className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">Oblíbené trasy</h3>
                 {templates.length === 0 ? (
                   <p className="text-sm text-gray-400 italic">Zatím nemáte uloženy žádné šablony. Vyplňte formulář a dole zaškrtněte "Uložit jako šablonu".</p>
                 ) : (
                   <div className="space-y-2">
                     {templates.map(t => (
                       <div key={t.id} className="flex items-center justify-between p-3 bg-amber-50/50 rounded-xl border border-amber-100 hover:bg-amber-50 transition-colors cursor-pointer group" onClick={() => handleApplyTemplate(t)}>
                         <div>
                           <div className="font-bold text-gray-900">{t.name}</div>
                           <div className="text-xs text-gray-500 mt-0.5">{t.origin} → {t.destination}</div>
                         </div>
                         <div className="flex items-center gap-2">
                           {onDeleteTemplate && (
                             <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                if(window.confirm('Smazat šablonu?')) onDeleteTemplate(t.id);
                              }}
                              className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            )}

            {mode === 'ai' ? (
              <div className="space-y-4 h-full flex flex-col">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Popište svou jízdu</label>
                  <div className="relative">
                    <textarea
                      className="w-full border border-gray-200 rounded-2xl p-4 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-700 pr-12 text-base shadow-sm"
                      rows={8}
                      placeholder="Klikněte na mikrofon a diktujte: 'Včera cesta Brno Praha, 205km, služebně...'"
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                    />
                    <button
                      onClick={toggleListening}
                      className={`absolute bottom-3 right-3 p-3 rounded-full transition-all shadow-sm ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-gray-100 text-gray-500 hover:bg-blue-100 hover:text-blue-600'
                      }`}
                    >
                      {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                    </button>
                  </div>
                  {isListening && (
                    <p className="text-xs text-red-500 mt-2 font-medium animate-pulse ml-1">Poslouchám...</p>
                  )}
                </div>
                <button
                  onClick={handleAiParse}
                  disabled={isProcessing || !aiInput.trim()}
                  className="w-full bg-black text-white py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mt-auto"
                >
                  {isProcessing ? <Loader2 className="animate-spin" /> : <Sparkles />}
                  {isProcessing ? 'Analyzuji...' : 'Vyplnit formulář'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Datum</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="date"
                        required
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base font-medium"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Vozidlo</label>
                      <div className="relative">
                        <Car className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={vehicleId}
                          onChange={e => setVehicleId(e.target.value)}
                          className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none text-base font-medium text-gray-900"
                        >
                          <option value="" disabled>Vyberte</option>
                          {renderSelectOptions(vehicles, vehicleId, v => `${v.name} (${v.licensePlate})`)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Řidič</label>
                       <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                          value={driverId}
                          onChange={e => setDriverId(e.target.value)}
                          className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none text-base font-medium text-gray-900"
                        >
                          <option value="" disabled>Vyberte</option>
                          {renderSelectOptions(drivers, driverId, d => d.name)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Start (Odkud)</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="Město startu"
                        value={origin}
                        onChange={e => setOrigin(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base font-medium"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cíl / Trasa</label>
                    <div className="relative">
                      <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <input
                        type="text"
                        required
                        placeholder="Cíl nebo trasa"
                        value={destination}
                        onChange={e => setDestination(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base font-medium"
                      />
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                       <label className="block text-xs font-bold text-blue-800 uppercase mb-1.5">Tachometr Start</label>
                       <div className="relative">
                         <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" size={18} />
                         <input
                          type="number"
                          value={startOdometer}
                          onChange={e => setStartOdometer(Number(e.target.value))}
                          className={`w-full pl-10 pr-2 py-3 bg-white border rounded-xl font-mono text-sm text-gray-900 ${odometerGap ? 'border-red-300 ring-2 ring-red-100' : 'border-blue-200'}`}
                        />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-bold text-blue-800 uppercase mb-1.5">Konečný stav</label>
                       <div className="relative">
                         <Gauge className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-600" size={18} />
                         <input
                          type="number"
                          required
                          min={startOdometer}
                          value={endOdometer}
                          onChange={e => setEndOdometer(Number(e.target.value))}
                          className="w-full pl-10 pr-2 py-3 bg-white border-blue-200 border rounded-xl focus:ring-2 focus:ring-blue-500 text-gray-900 font-bold font-mono text-lg shadow-sm"
                        />
                       </div>
                    </div>
                  </div>

                  {odometerGap && (
                     <div className="mt-3 bg-red-50 border border-red-100 rounded-lg p-3 flex items-start gap-2 animate-fade-in">
                        <AlertTriangle size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
                        <div>
                           <p className="text-xs text-red-800 font-bold">Nesedí návaznost kilometrů!</p>
                           <p className="text-[10px] text-red-600 mt-1">Poslední známý stav tohoto vozu je {lastKnownOdometer} km.</p>
                           <button 
                            type="button"
                            onClick={() => {
                              Haptics.medium();
                              setStartOdometer(lastKnownOdometer);
                              if (endOdometer < lastKnownOdometer) setEndOdometer(lastKnownOdometer);
                            }}
                            className="mt-2 text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold hover:bg-red-200"
                           >
                             Opravit na {lastKnownOdometer}
                           </button>
                        </div>
                     </div>
                  )}

                  <div className="mt-3 text-right text-sm text-blue-700 font-bold">
                     Najeto: {distance} km
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                   <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Zakázka</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                      <select
                        value={orderId}
                        onChange={e => setOrderId(e.target.value)}
                        className="w-full pl-10 pr-8 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none appearance-none text-base font-medium text-gray-900"
                        required
                      >
                        <option value="" disabled>Vyberte zakázku</option>
                        {renderSelectOptions(orders, orderId, o => `${o.name} ${o.code ? `(${o.code})` : ''}`)}
                      </select>
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                          <svg width="10" height="6" viewBox="0 0 10 6" fill="none" xmlns="http://www.w3.org/2000/svg">
                             <path d="M1 1L5 5L9 1" stroke="#9CA3AF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Tankování</label>
                      <div className="relative">
                        <Fuel className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          placeholder="Litrů (l)"
                          value={fuelLiters}
                          onChange={e => setFuelLiters(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base font-medium"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase mb-1.5">Cena celkem</label>
                      <div className="relative">
                        <Banknote className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                          type="number"
                          min="0"
                          step="1"
                          placeholder="Kč"
                          value={fuelPrice}
                          onChange={e => setFuelPrice(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-none text-base font-medium"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pb-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Typ jízdy</label>
                    <div className="flex gap-3">
                      <label className={`flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-xl border flex-1 transition-all ${type === TripType.BUSINESS ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-gray-50 border-transparent text-gray-600'}`}>
                        <input
                          type="radio"
                          name="tripType"
                          checked={type === TripType.BUSINESS}
                          onChange={() => {
                             Haptics.light();
                             setType(TripType.BUSINESS);
                          }}
                          className="hidden"
                        />
                        <span className="text-sm font-bold">Služební</span>
                      </label>
                      <label className={`flex items-center justify-center gap-2 cursor-pointer px-4 py-3 rounded-xl border flex-1 transition-all ${type === TripType.PRIVATE ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-gray-50 border-transparent text-gray-600'}`}>
                        <input
                          type="radio"
                          name="tripType"
                          checked={type === TripType.PRIVATE}
                          onChange={() => {
                             Haptics.light();
                             setType(TripType.PRIVATE);
                          }}
                          className="hidden"
                        />
                        <span className="text-sm font-bold">Soukromá</span>
                      </label>
                    </div>
                  </div>

                  {!tripToEdit && onAddTemplate && (
                    <div className="pt-2 border-t border-gray-100">
                       <label className="flex items-center gap-3 cursor-pointer">
                          <div className={`w-6 h-6 rounded-lg border flex items-center justify-center transition-colors ${saveAsTemplate ? 'bg-amber-500 border-amber-500 text-white' : 'bg-white border-gray-300'}`}>
                             <input 
                              type="checkbox" 
                              className="hidden" 
                              checked={saveAsTemplate}
                              onChange={(e) => setSaveAsTemplate(e.target.checked)}
                             />
                             {saveAsTemplate && <Check size={14} strokeWidth={3} />}
                          </div>
                          <span className="text-sm font-medium text-gray-700">Uložit tuto jízdu do oblíbených</span>
                       </label>
                       
                       {saveAsTemplate && (
                         <div className="mt-3 animate-fade-in">
                           <input 
                            type="text"
                            placeholder="Název šablony (např. Cesta do práce)"
                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-amber-500"
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            required={saveAsTemplate}
                           />
                         </div>
                       )}
                    </div>
                  )}
                </div>

                <div className="md:relative fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-100 md:border-0 md:bg-transparent md:p-0 pb-safe z-20">
                  <button
                    type="submit"
                    className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg hover:bg-gray-800 transition-all shadow-xl shadow-gray-900/10 flex items-center justify-center gap-2 active:scale-[0.98]"
                  >
                    <Save size={20} />
                    {tripToEdit ? 'Uložit změny' : 'Uložit jízdu'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}