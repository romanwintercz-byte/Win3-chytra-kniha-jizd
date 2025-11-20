import React, { useState } from 'react';
import { Settings, Database } from 'lucide-react';
import { ResourceManager } from './ResourceManager';
import { DataManagement } from './DataManagement';
import { Vehicle, Driver, Order, Trip, AppDataExport } from '../types';

interface SettingsViewProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  trips: Trip[]; // Needed for data export
  
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
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<'resources' | 'data'>('resources');

  return (
    <div className="animate-fade-in">
      
      {/* Main Settings Tabs */}
      <div className="flex border-b border-gray-200 mb-8 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('resources')}
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
          onClick={() => setActiveTab('data')}
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

      {/* Content */}
      {activeTab === 'resources' && (
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
      )}

      {activeTab === 'data' && (
        <DataManagement 
          trips={props.trips}
          vehicles={props.vehicles}
          drivers={props.drivers}
          orders={props.orders}
          onImportData={props.onImportData}
        />
      )}
    </div>
  );
};