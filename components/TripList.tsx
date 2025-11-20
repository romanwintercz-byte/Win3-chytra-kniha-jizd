import React, { useMemo } from 'react';
import { Trip, TripType, Vehicle, Driver, Order } from '../types';
import { Car, Trash2, Calendar, Fuel, Droplet, Pencil } from 'lucide-react';

interface TripListProps {
  trips: Trip[];
  vehicles: Vehicle[];
  drivers: Driver[];
  orders: Order[];
  onDelete: (id: string) => void;
  onEdit: (trip: Trip) => void;
}

export const TripList: React.FC<TripListProps> = ({ trips, vehicles, drivers, orders, onDelete, onEdit }) => {
  const getVehicleName = (id: string) => vehicles.find(v => v.id === id)?.name || '---';
  const getVehiclePlate = (id: string) => vehicles.find(v => v.id === id)?.licensePlate || '';
  const getDriverName = (id: string) => drivers.find(d => d.id === id)?.name || '---';
  
  const getOrderInfo = (id: string) => {
    const order = orders.find(o => o.id === id);
    return order ? { name: order.name, code: order.code } : { name: 'Neurčeno', code: '' };
  };

  // Group trips by Month Year
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
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
        <div className="mx-auto h-12 w-12 text-gray-400 mb-3">
          <Car className="w-full h-full" />
        </div>
        <h3 className="text-lg font-medium text-gray-900">Žádné jízdy</h3>
        <p className="mt-1 text-sm text-gray-500">Začněte přidáním nové jízdy do knihy.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {(Object.entries(groupedTrips) as [string, Trip[]][]).map(([month, monthTrips]) => {
        // Calculate monthly stats
        const totalKm = monthTrips.reduce((acc, t) => acc + t.distanceKm, 0);
        const totalFuel = monthTrips.reduce((acc, t) => acc + (t.fuelLiters || 0), 0);
        const avgConsumption = totalKm > 0 && totalFuel > 0 
          ? ((totalFuel / totalKm) * 100).toFixed(1) 
          : null;

        return (
          <div key={month} className="animate-fade-in">
            {/* Monthly Header with Stats */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 pl-1 gap-2">
               <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                <Calendar size={14} />
                {month}
              </h3>
              
              <div className="flex items-center gap-4 text-xs font-medium">
                <div className="bg-gray-100 px-2 py-1 rounded-md text-gray-600">
                  Celkem: {totalKm.toLocaleString()} km
                </div>
                {totalFuel > 0 && (
                   <div className="bg-orange-50 px-2 py-1 rounded-md text-orange-700 flex items-center gap-1">
                     <Fuel size={10} />
                     {totalFuel.toLocaleString()} l
                   </div>
                )}
                {avgConsumption && (
                  <div className="bg-green-50 px-2 py-1 rounded-md text-green-700 flex items-center gap-1 border border-green-100">
                    <Droplet size={10} />
                    Spotřeba: {avgConsumption} l/100km
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
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
                      <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">Auto / Řidič</th>
                      <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-20">Akce</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {monthTrips.map((trip) => {
                      const dateObj = new Date(trip.date);
                      const day = dateObj.getDate();
                      const dayName = dateObj.toLocaleDateString('cs-CZ', { weekday: 'short' });
                      const orderInfo = getOrderInfo(trip.orderId);

                      return (
                        <tr key={trip.id} className="hover:bg-blue-50/30 transition-colors group">
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
                          <td className="px-4 py-3 whitespace-nowrap text-sm hidden md:table-cell">
                             <div className="flex flex-col">
                               <span className="text-gray-900 font-bold">{getDriverName(trip.driverId)}</span>
                               <span className="text-xs text-gray-600 font-medium mt-0.5">{getVehicleName(trip.vehicleId)} ({getVehiclePlate(trip.vehicleId)})</span>
                             </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};