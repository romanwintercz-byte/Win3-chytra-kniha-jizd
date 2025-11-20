import React, { useState } from 'react';
import { Car, Users, Archive, Plus, UserPlus, Briefcase, RefreshCw, Pencil } from 'lucide-react';
import { Vehicle, Driver, Order } from '../types';

interface ResourceManagerProps {
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  onAddVehicle: (v: Omit<Vehicle, 'id' | 'isActive'>) => void;
  onUpdateVehicle: (id: string, v: Partial<Vehicle>) => void;
  onToggleVehicleArchive: (id: string) => void;
  
  onAddDriver: (d: Omit<Driver, 'id' | 'isActive'>) => void;
  onUpdateDriver: (id: string, d: Partial<Driver>) => void;
  onToggleDriverArchive: (id: string) => void;

  onAddOrder: (o: Omit<Order, 'id' | 'isActive'>) => void;
  onUpdateOrder: (id: string, o: Partial<Order>) => void;
  onToggleOrderArchive: (id: string) => void;
}

export const ResourceManager: React.FC<ResourceManagerProps> = ({
  vehicles, drivers, orders,
  onAddVehicle, onUpdateVehicle, onToggleVehicleArchive,
  onAddDriver, onUpdateDriver, onToggleDriverArchive,
  onAddOrder, onUpdateOrder, onToggleOrderArchive
}) => {
  // --- Tabs State ---
  const [activeTab, setActiveTab] = useState<'active' | 'archived'>('active');

  // --- Edit States ---
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [editingDriver, setEditingDriver] = useState<Driver | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // --- Input States for New Items (when not editing) ---
  const [newVehicle, setNewVehicle] = useState({ name: '', licensePlate: '' });
  const [newDriver, setNewDriver] = useState({ name: '' });
  const [newOrder, setNewOrder] = useState({ name: '', code: '' });

  // --- Handlers ---

  // Vehicle Handlers
  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingVehicle) {
      onUpdateVehicle(editingVehicle.id, { name: editingVehicle.name, licensePlate: editingVehicle.licensePlate });
      setEditingVehicle(null);
    } else if (newVehicle.name && newVehicle.licensePlate) {
      onAddVehicle(newVehicle);
      setNewVehicle({ name: '', licensePlate: '' });
    }
  };

  // Driver Handlers
  const handleDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingDriver) {
      const initials = editingDriver.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      onUpdateDriver(editingDriver.id, { name: editingDriver.name, initials });
      setEditingDriver(null);
    } else if (newDriver.name) {
      const initials = newDriver.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
      onAddDriver({ name: newDriver.name, initials });
      setNewDriver({ name: '' });
    }
  };

  // Order Handlers
  const handleOrderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder) {
      onUpdateOrder(editingOrder.id, { name: editingOrder.name, code: editingOrder.code });
      setEditingOrder(null);
    } else if (newOrder.name) {
      onAddOrder(newOrder);
      setNewOrder({ name: '', code: '' });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Tabs */}
      <div className="flex justify-center">
        <div className="bg-gray-100 p-1 rounded-lg flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all ${activeTab === 'active' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Aktivní zdroje
          </button>
          <button
            onClick={() => setActiveTab('archived')}
            className={`px-6 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${activeTab === 'archived' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            <Archive size={14} />
            Archiv
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        
        {/* Orders Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-green-50 text-green-600 rounded-lg">
              <Briefcase size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Zakázky</h2>
          </div>

          {activeTab === 'active' && (
            <form onSubmit={handleOrderSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
              <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{editingOrder ? 'Upravit zakázku' : 'Nová zakázka'}</h3>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Kód (nepovinné)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  value={editingOrder ? editingOrder.code : newOrder.code}
                  onChange={e => editingOrder ? setEditingOrder({...editingOrder, code: e.target.value}) : setNewOrder({...newOrder, code: e.target.value})}
                />
                <input
                  type="text"
                  placeholder="Název zakázky"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-green-500"
                  value={editingOrder ? editingOrder.name : newOrder.name}
                  onChange={e => editingOrder ? setEditingOrder({...editingOrder, name: e.target.value}) : setNewOrder({...newOrder, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                 {editingOrder && (
                   <button type="button" onClick={() => setEditingOrder(null)} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Zrušit</button>
                 )}
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  {editingOrder ? 'Uložit' : <><Plus size={16} /> Přidat</>}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
            {orders.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).map(order => (
              <div key={order.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="overflow-hidden">
                  <div className="font-medium text-gray-900 truncate">{order.name}</div>
                  {order.code && (
                    <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                      {order.code}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {activeTab === 'active' && (
                    <button 
                      onClick={() => setEditingOrder(order)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Upravit"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => onToggleOrderArchive(order.id)}
                    className={`p-2 rounded-full transition-colors ${activeTab === 'active' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                    title={activeTab === 'active' ? 'Archivovat' : 'Obnovit'}
                  >
                    {activeTab === 'active' ? <Archive size={16} /> : <RefreshCw size={16} />}
                  </button>
                </div>
              </div>
            ))}
            {orders.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).length === 0 && <p className="text-center text-sm text-gray-400 py-4">Žádné {activeTab === 'active' ? 'aktivní' : 'archivované'} zakázky</p>}
          </div>
        </div>

        {/* Vehicles Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Car size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Vozový park</h2>
          </div>

          {activeTab === 'active' && (
            <form onSubmit={handleVehicleSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{editingVehicle ? 'Upravit auto' : 'Nové auto'}</h3>
              <div className="grid grid-cols-1 gap-3 mb-3">
                <input
                  type="text"
                  placeholder="Název (např. Škoda)"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  value={editingVehicle ? editingVehicle.name : newVehicle.name}
                  onChange={e => editingVehicle ? setEditingVehicle({...editingVehicle, name: e.target.value}) : setNewVehicle({...newVehicle, name: e.target.value})}
                  required
                />
                <input
                  type="text"
                  placeholder="SPZ"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-blue-500"
                  value={editingVehicle ? editingVehicle.licensePlate : newVehicle.licensePlate}
                  onChange={e => editingVehicle ? setEditingVehicle({...editingVehicle, licensePlate: e.target.value}) : setNewVehicle({...newVehicle, licensePlate: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                 {editingVehicle && (
                   <button type="button" onClick={() => setEditingVehicle(null)} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Zrušit</button>
                 )}
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  {editingVehicle ? 'Uložit' : <><Plus size={16} /> Přidat</>}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
            {vehicles.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).map(vehicle => (
              <div key={vehicle.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                <div>
                  <div className="font-medium text-gray-900">{vehicle.name}</div>
                  <div className="text-xs text-gray-500 font-mono bg-gray-100 px-1.5 py-0.5 rounded inline-block mt-1">
                    {vehicle.licensePlate}
                  </div>
                </div>
                 <div className="flex items-center gap-1">
                  {activeTab === 'active' && (
                    <button 
                      onClick={() => setEditingVehicle(vehicle)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Upravit"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => onToggleVehicleArchive(vehicle.id)}
                    className={`p-2 rounded-full transition-colors ${activeTab === 'active' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                    title={activeTab === 'active' ? 'Archivovat' : 'Obnovit'}
                  >
                    {activeTab === 'active' ? <Archive size={16} /> : <RefreshCw size={16} />}
                  </button>
                </div>
              </div>
            ))}
             {vehicles.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).length === 0 && <p className="text-center text-sm text-gray-400 py-4">Žádná {activeTab === 'active' ? 'aktivní' : 'archivovaná'} auta</p>}
          </div>
        </div>

        {/* Drivers Section */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col h-full">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Users size={20} />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Řidiči</h2>
          </div>

          {activeTab === 'active' && (
            <form onSubmit={handleDriverSubmit} className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
               <h3 className="text-xs font-bold text-gray-500 uppercase mb-3">{editingDriver ? 'Upravit řidiče' : 'Nový řidič'}</h3>
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="Jméno a příjmení"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-purple-500"
                  value={editingDriver ? editingDriver.name : newDriver.name}
                  onChange={e => editingDriver ? setEditingDriver({...editingDriver, name: e.target.value}) : setNewDriver({...newDriver, name: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-2">
                 {editingDriver && (
                   <button type="button" onClick={() => setEditingDriver(null)} className="w-1/3 bg-gray-200 text-gray-700 py-2 rounded-lg text-sm font-medium">Zrušit</button>
                 )}
                <button type="submit" className="flex-1 bg-black text-white py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2">
                  {editingDriver ? 'Uložit' : <><UserPlus size={16} /> Přidat</>}
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3 flex-grow overflow-y-auto max-h-[400px] pr-1 custom-scrollbar">
            {drivers.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).map(driver => (
              <div key={driver.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xs font-bold">
                    {driver.initials}
                  </div>
                  <div className="font-medium text-gray-900">{driver.name}</div>
                </div>
                 <div className="flex items-center gap-1">
                  {activeTab === 'active' && (
                    <button 
                      onClick={() => setEditingDriver(driver)}
                      className="text-gray-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors"
                      title="Upravit"
                    >
                      <Pencil size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => onToggleDriverArchive(driver.id)}
                    className={`p-2 rounded-full transition-colors ${activeTab === 'active' ? 'text-gray-400 hover:text-amber-600 hover:bg-amber-50' : 'text-green-500 hover:text-green-700 hover:bg-green-50'}`}
                    title={activeTab === 'active' ? 'Archivovat' : 'Obnovit'}
                  >
                    {activeTab === 'active' ? <Archive size={16} /> : <RefreshCw size={16} />}
                  </button>
                </div>
              </div>
            ))}
            {drivers.filter(item => activeTab === 'active' ? item.isActive : !item.isActive).length === 0 && <p className="text-center text-sm text-gray-400 py-4">Žádní {activeTab === 'active' ? 'aktivní' : 'archivovaní'} řidiči</p>}
          </div>
        </div>
      </div>
    </div>
  );
};