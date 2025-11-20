import { Type } from "@google/genai";

export enum TripType {
  BUSINESS = 'Služební',
  PRIVATE = 'Soukromá'
}

export interface Vehicle {
  id: string;
  name: string;
  licensePlate: string;
  isActive: boolean;
}

export interface Driver {
  id: string;
  name: string;
  initials: string;
  isActive: boolean;
}

export interface Order {
  id: string;
  name: string; // e.g., "Stavba RD Novák"
  code: string; // e.g., "2023-01"
  isActive: boolean;
}

export interface Trip {
  id: string;
  date: string;
  origin: string;
  destination: string;
  distanceKm: number;
  startOdometer: number;
  endOdometer: number;
  fuelLiters?: number; // Optional refueling
  orderId: string;
  type: TripType;
  vehicleId: string;
  driverId: string;
}

export interface AISuggestion {
  origin?: string;
  destination?: string;
  distanceKm?: number;
  endOdometer?: number;
  fuelLiters?: number;
  orderName?: string;
  date?: string;
  vehicleName?: string;
  driverName?: string;
}

export interface AppDataExport {
  version: number;
  type: 'full_backup' | 'driver_export';
  exportDate: string;
  source?: string; // e.g. driver name
  data: {
    trips: Trip[];
    vehicles: Vehicle[];
    drivers: Driver[];
    orders: Order[];
  };
}

// Initial production data
export const INITIAL_VEHICLES: Vehicle[] = [
  {
    id: 'v_scala',
    name: 'Škoda Scala',
    licensePlate: '1UY 1998',
    isActive: true
  }
];

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'd_aneta',
    name: 'Králová Aneta',
    initials: 'AK',
    isActive: true
  }
];

export const INITIAL_ORDERS: Order[] = [
  {
    id: 'o_sprava',
    name: 'Správa',
    code: '', 
    isActive: true
  }
];

export const INITIAL_TRIPS: Trip[] = [];