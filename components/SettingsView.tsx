import React, { useState } from 'react';
import { Settings, Database, Calendar, Lock } from 'lucide-react';
import { ResourceManager } from './ResourceManager';
import { DataManagement } from './DataManagement';
import { Vehicle, Driver, Order, Trip, AppDataExport } from '../types';
import { Haptics } from '../utils/haptics';

interface SettingsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  trips: Trip[];
  
  onAddVehicle: (v: Omit<Vehicle, 'id' | 'isActive'>) => void;
  onUpdateVehicle: (id: string, v: Partial<Vehicle>) => void;
  onToggleVehicleArchive: (id: string) => void;
  
  onAddDriver: (d: Omit<Driver, 'id' | 'isActive'>) => void;
  onUpdateDriver: (id: string, d: Partial<Driver>) => void;
  onToggleDriverArchive: (id: string) => void;

  onAddOrder: (o: Omit<Order, 'id' | 'isActive'>) => void;
  onUpdateOrder: (id: string, o: Partial<Order>) => void;
  onToggleOrderArchive: (id: string) => void;

  onImportData: (data: AppDataExport) => void;
  onOpenAbout: () => void;

  closureDate?: string;
  onSetClosureDate?: (date: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'data'>('resources');

  return (
    <div className="animate-fade-in pb-10">
      
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => {
            Haptics.light();
            setActiveTab('resources');
          }}
          className={`pb-4 px-6 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'resources' 
              ? 'border-black text-black' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Settings size={18} />
          Správa zdrojů
        </button>
        <button
          onClick={() => {
            Haptics.light();
            setActiveTab('data');
          }}
          className={`pb-4 px-6 text-sm font-medium transition-all border-b-2 flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'data' 
              ? 'border-black text-black' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Database size={18} />
          Data a Synchronizace
        </button>
      </div>

      {activeTab === 'resources' ? (
        <ResourceManager 
          vehicles={props.vehicles}
          drivers={props.drivers}
          orders={props.orders}
          
          onAddVehicle={props.onAddVehicle}
          onUpdateVehicle={props.onUpdateVehicle}
          onToggleVehicleArchive={props.onToggleVehicleArchive}
          
          onAddDriver={props.onAddDriver}
          onUpdateDriver={props.onUpdateDriver}
          onToggleDriverArchive={props.onToggleDriverArchive}
          
          onAddOrder={props.onAddOrder}
          onUpdateOrder={props.onUpdateOrder}
          onToggleOrderArchive={props.onToggleOrderArchive}
        />
      ) : (
        <div className="space-y-8">
           {/* Closure Date Setting */}
           {props.onSetClosureDate && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                 <div className="flex items-center gap-3 mb-4">
                   <div className="p-2 bg-red-50 text-red-600 rounded-lg">
                     <Lock size={24} />
                   </div>
                   <div>
                     <h3 className="text-lg font-bold text-gray-900">Účetní uzávěrka</h3>
                     <p className="text-sm text-gray-500">Jízdy před tímto datem nepůjde upravovat.</p>
                   </div>
                 </div>
                 <div className="relative max-w-xs">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                      type="date" 
                      value={props.closureDate || ''}
                      onChange={(e) => {
                         Haptics.medium();
                         props.onSetClosureDate?.(e.target.value);
                      }}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                 </div>
              </div>
           )}

           <DataManagement 
              trips={props.trips}
              vehicles={props.vehicles}
              drivers={props.drivers}
              orders={props.orders}
              onImportData={props.onImportData}
           />
        </div>
      )}

      <div className="mt-12 pt-8 border-t border-gray-200">
        <button 
          onClick={props.onOpenAbout}
          className="w-full flex flex-col items-center justify-center text-center opacity-60 hover:opacity-100 transition-opacity group"
        >
           <div className="w-12 h-12 bg-black text-white rounded-xl flex items-center justify-center font-extrabold text-sm border-2 border-gray-200 mb-3 shadow-sm group-hover:scale-110 transition-transform">
             Win3
           </div>
           <h4 className="font-bold text-gray-900">Chytrá Kniha Jízd</h4>
           <p className="text-xs text-gray-500 mt-1">Vyrobeno studiem Win3</p>
           <p className="text-[10px] text-gray-400 mt-2 font-mono">v2.2.0 Mobile</p>
        </button>
      </div>
    </div>
  );
};