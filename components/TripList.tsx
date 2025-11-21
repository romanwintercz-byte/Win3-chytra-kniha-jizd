import React, { useMemo } from 'react';
import { Trip, TripType, Vehicle, Driver, Order } from '../types';
import { Car, Trash2, Calendar, Fuel, Droplet, Pencil, MapPin, Navigation, Briefcase, ChevronRight, Lock } from 'lucide-react';

interface TripListProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  onDelete: (id: string) => void;
  onEdit: (trip: Trip) => void;
  closureDate?: string;
}

export const TripList: React.FC<TripListProps> = ({ trips, vehicles, drivers, orders, onDelete, onEdit, closureDate }) => {
  const getVehicleName = (id: string) => {
    const v = vehicles.find(v => v.id === id);
    return v ? `${v.name} (${v.licensePlate})` : '---';
  };
  
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || '---';
  
  const getOrderInfo = (id: string) => {
    const order = orders.find(o => o.id === id);
    return order ? { name: order.name, code: order.code } : { name: 'Neurčeno', code: '' };
  };

  const isTripLocked = (date: string) => {
    if (!closureDate) return false;
    return date <= closureDate;
  };

  const groupedTrips = useMemo(() => {
    const sorted = [...trips].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    const groups: Record<string, Trip[]> = {};
    
    sorted.forEach(trip => {
      const date = new Date(trip.date);
      const key = date.toLocaleString('cs-CZ', { month: 'long', year: 'numeric' });
      const formattedKey = key.charAt(0).toUpperCase() + key.slice(1);
      
      if (!groups[formattedKey]) {
        groups[formattedKey] = [];
      }
      groups[formattedKey].push(trip);
    });
    
    return groups;
  }, [trips]);

  if (trips.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 mx-auto">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3 flex items-center justify-center bg-gray-50 rounded-full">
          <Car className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Žádné jízdy</h3>
        <p className="mt-1 text-sm text-gray-500">Začněte přidáním nové jízdy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 md:space-y-8 pb-4">
      {(Object.entries(groupedTrips) as [string, Trip[]][]).map(([month, monthTrips]) => {
        const totalKm = monthTrips.reduce((acc, t) => acc + t.distanceKm, 0);
        const totalFuel = monthTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);

        return (
          <div key={month} className="animate-fade-in">
            {/* Month Header */}
            <div className="flex items-center justify-between mb-3 px-1">
               <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} />
                {month}
              </h3>
              <div className="bg-gray-100 px-2 py-1 rounded-full text-xs font-medium text-gray-700">
                {totalKm.toLocaleString()} km
              </div>
            </div>
            
            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-24">Datum</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cíl / Trasa</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Zakázka</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Stav Tach.</th>
                       <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ujeto</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">PHM</th>
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">Auto / Řidič</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthTrips.map((trip) => {
                      const dateObj = new Date(trip.date);
                      const day = dateObj.getDate();
                      const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' });
                      const orderInfo = getOrderInfo(trip.orderId);
                      const locked = isTripLocked(trip.date);

                      return (
                        <tr key={trip.id} className={`hover:bg-blue-50/30 transition-colors group ${locked ? 'opacity-80 bg-gray-50/30' : 'cursor-pointer'}`} onClick={() => !locked && onEdit(trip)}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            <div className="font-medium">{day}.</div>
                            <div className="text-xs text-gray-500">{dayName}</div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                            {trip.origin}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {trip.destination}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className={`w-1.5 h-1.5 rounded-full ${trip.type === TripType.BUSINESS ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                                <span className="font-medium text-gray-900">{orderInfo.name}</span>
                              </div>
                              {orderInfo.code && <span className="text-xs text-gray-400 ml-3.5">{orderInfo.code}</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 text-right font-mono">
                            {trip.endOdometer.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right font-mono font-medium">
                            +{trip.distanceKm} km
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                             {trip.fuelLiters ? (
                               <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-orange-100 text-orange-700">
                                 <Fuel size={10} />
                                 {trip.fuelLiters}l
                               </span>
                             ) : (
                               <span className="text-gray-300">-</span>
                             )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 hidden lg:table-cell">
                             <div className="flex flex-col">
                               <span className="text-gray-900">{getDriverName(trip.driverId)}</span>
                               <span className="text-[10px] text-gray-400">{getVehicleName(trip.vehicleId)}</span>
                             </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            {locked ? (
                               <div className="flex items-center justify-end p-1 text-gray-300">
                                 <Lock size={16} />
                               </div>
                            ) : (
                              <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onEdit(trip);
                                  }}
                                  className="text-gray-400 hover:text-blue-600 transition-colors p-1"
                                  title="Upravit"
                                >
                                  <Pencil size={16} />
                                </button>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(trip.id);
                                  }}
                                  className="text-gray-400 hover:text-red-600 transition-colors p-1"
                                  title="Smazat"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View - Optimized for touch and native feel */}
            <div className="md:hidden space-y-3">
              {monthTrips.map((trip) => {
                 const dateObj = new Date(trip.date);
                 const orderInfo = getOrderInfo(trip.orderId);
                 const isBusiness = trip.type === TripType.BUSINESS;
                 const locked = isTripLocked(trip.date);

                 return (
                   <div 
                    key={trip.id} 
                    onClick={() => !locked && onEdit(trip)}
                    className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 transition-transform touch-manipulation ${locked ? 'opacity-75' : 'active:scale-[0.98]'}`}
                   >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex gap-3">
                           <div className="flex flex-col items-center justify-center bg-gray-50 rounded-xl w-12 h-12 border border-gray-100 flex-shrink-0">
                              <span className="text-sm font-bold text-gray-900">{dateObj.getDate()}.</span>
                              <span className="text-[10px] uppercase text-gray-400 font-medium">{dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' })}</span>
                           </div>
                           
                           <div>
                              <div className="text-sm font-bold text-gray-900 line-clamp-1">{trip.destination}</div>
                              <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <span className={`w-1.5 h-1.5 rounded-full ${isBusiness ? 'bg-blue-500' : 'bg-purple-500'}`}></span>
                                <span className="truncate max-w-[120px]">{orderInfo.name}</span>
                              </div>
                           </div>
                        </div>
                        
                        <div className="text-right flex-shrink-0">
                           <div className="text-lg font-black text-gray-900 tracking-tight">+{trip.distanceKm} <span className="text-xs font-normal text-gray-500">km</span></div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-50 mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-400 overflow-hidden">
                           <Car size={12} className="flex-shrink-0" />
                           <span className="truncate max-w-[150px]">{getVehicleName(trip.vehicleId)}</span>
                           {trip.fuelLiters && (
                             <span className="flex items-center gap-1 text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded font-medium flex-shrink-0">
                               <Fuel size={10} /> {trip.fuelLiters}l
                             </span>
                           )}
                        </div>
                        {locked ? (
                          <Lock size={16} className="text-gray-300 flex-shrink-0" />
                        ) : (
                          <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />
                        )}
                      </div>
                   </div>
                 );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};