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
  name: string;
  code: string;
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
  fuelLiters?: number;
  fuelPrice?: number;
  orderId: string;
  type: TripType;
  vehicleId: string;
  driverId: string;
}

export interface TripTemplate {
  id: string;
  name: string;
  origin: string;
  destination: string;
  orderId: string;
  type: TripType;
  vehicleId?: string; // Optional, might want to use current vehicle
  driverId?: string; // Optional
}

export interface AISuggestion {
  origin?: string;
  destination?: string;
  distanceKm?: number;
  endOdometer?: number;
  fuelLiters?: number;
  fuelPrice?: number;
  orderName?: string;
  date?: string;
  vehicleName?: string;
  driverName?: string;
}

export interface AppDataExport {
  version: number;
  type: 'full_backup' | 'driver_export';
  exportDate: string;
  source?: string;
  data: {
    trips: Trip[];
    vehicles: Vehicle[];
    drivers: Driver[];
    orders: Order[];
  };
}

export const INITIAL_VEHICLES: Vehicle[] = [
  { id: 'v1', name: 'Mercedes-Benz Actros', licensePlate: '1UY 1952', isActive: true },
  { id: 'v2', name: 'Ford Custom', licensePlate: '2UA 0371', isActive: true },
  { id: 'v3', name: 'Ford Tourneo Connect', licensePlate: '1UZ 9849', isActive: true },
  { id: 'v4', name: 'Ford Transit', licensePlate: '2UA 0072', isActive: true },
  { id: 'v5', name: 'Škoda Scala', licensePlate: '1UZ 9705', isActive: true },
  { id: 'v6', name: 'Škoda Scala', licensePlate: '1UY 1998', isActive: true },
  { id: 'v7', name: 'Škoda Octavia', licensePlate: '8U1 3347', isActive: true },
  { id: 'v8', name: 'Škoda Scala', licensePlate: '1UY 1056', isActive: true },
  { id: 'v9', name: 'Škoda Scala', licensePlate: '1UY 1050', isActive: true },
  { id: 'v10', name: 'Ford Transit plošina', licensePlate: '3AI 8559', isActive: true },
  { id: 'v11', name: 'Ford Transit', licensePlate: '1UX 4126', isActive: true },
  { id: 'v12', name: 'Ford Tourneo Connect', licensePlate: '1UY 1051', isActive: true },
  { id: 'v13', name: 'Škoda Octavia', licensePlate: '7AP 9878', isActive: true },
  { id: 'v14', name: 'Škoda Octavia', licensePlate: '5E6 5897', isActive: true },
  { id: 'v15', name: 'Škoda Octavia', licensePlate: '6E0 6617', isActive: true },
  { id: 'v16', name: 'Land Rover', licensePlate: '6E7 4163', isActive: true },
  { id: 'v17', name: 'Škoda Rapid', licensePlate: '5E4 6586', isActive: true },
  { id: 'v18', name: 'Kia Sportage', licensePlate: '7U7 8595', isActive: true },
  { id: 'v19', name: 'VW Transporter', licensePlate: '1UM 2203', isActive: true }
];

export const INITIAL_DRIVERS: Driver[] = [
  { id: 'd1', name: 'Aneta Králová', initials: 'AK', isActive: true },
  { id: 'd2', name: 'Babický Lukáš', initials: 'BL', isActive: true },
  { id: 'd3', name: 'Balogová Michaela', initials: 'BM', isActive: true },
  { id: 'd4', name: 'Berounský Richard', initials: 'BR', isActive: true },
  { id: 'd5', name: 'Cimflová Lenka', initials: 'CL', isActive: true },
  { id: 'd6', name: 'Čáni Marek', initials: 'ČM', isActive: true },
  { id: 'd7', name: 'Gruss Monika', initials: 'GM', isActive: true },
  { id: 'd8', name: 'Havlín Jiří', initials: 'HJ', isActive: true },
  { id: 'd9', name: 'Kašpar Tomáš', initials: 'KT', isActive: true },
  { id: 'd10', name: 'Klaban Vojtěch', initials: 'KV', isActive: true },
  { id: 'd11', name: 'Lečbych Pavel', initials: 'LP', isActive: true },
  { id: 'd12', name: 'Mikeš Marek', initials: 'MM', isActive: true },
  { id: 'd13', name: 'Moravec Marcel', initials: 'MM', isActive: true },
  { id: 'd14', name: 'Novotný Vojtěch', initials: 'NV', isActive: true },
  { id: 'd15', name: 'Pavlíček Karel', initials: 'PK', isActive: true },
  { id: 'd16', name: 'Plachý Pavel', initials: 'PP', isActive: true },
  { id: 'd17', name: 'Popelka Pavel', initials: 'PP', isActive: true },
  { id: 'd18', name: 'Procházka Vojtěch', initials: 'PV', isActive: true },
  { id: 'd19', name: 'Stenský Martin', initials: 'SM', isActive: true },
  { id: 'd20', name: 'Strnad David', initials: 'SD', isActive: true },
  { id: 'd21', name: 'Studničná Lucie', initials: 'SL', isActive: true },
  { id: 'd22', name: 'Šinágl Radek', initials: 'ŠR', isActive: true },
  { id: 'd23', name: 'Tvrz Miroslav', initials: 'TM', isActive: true },
  { id: 'd24', name: 'Virt Luboš', initials: 'VL', isActive: true },
  { id: 'd25', name: 'Vladyková Denisa', initials: 'VD', isActive: true },
  { id: 'd26', name: 'Winterová Lucie', initials: 'WL', isActive: true },
  { id: 'd27', name: 'Zatloukal Petr', initials: 'ZP', isActive: true }
];

export const INITIAL_ORDERS: Order[] = [
  { 
    id: 'o1', 
    code: '7110/25/023', 
    name: 'Ústí nad Labem, Sociální péče zvýšení bezpečnosti/SSZ Bělehradská', 
    isActive: true 
  },
  { 
    id: 'o2', 
    code: '7110/25/022', 
    name: 'PS 0110-VÚ Brdy Stará kasárna - Výměna zkorodovaných stožárů osvětlení', 
    isActive: true 
  },
  { 
    id: 'o3', 
    code: '7110/25/021', 
    name: '4. ZŠ V. Talicha, Most - Instalace přístupového systému a systému chráněných únikových cest', 
    isActive: true 
  },
  { 
    id: 'o4', 
    code: '7110/25/020', 
    name: 'Údržba a opravy elektronických zabezpečovacích a slaboproudých systémů OŘ UNL 2025-2029', 
    isActive: true 
  },
  { 
    id: 'o5', 
    code: '7110/25/019', 
    name: 'Praha, Ruzyně - osvětlení sportovní haly - rekonstrukce', 
    isActive: true 
  },
  { 
    id: 'o6', 
    code: '7110/25/018', 
    name: 'DŮ stavba 511, Běchovice - D1', 
    isActive: true 
  },
  { 
    id: 'o7', 
    code: '7110/25/017', 
    name: 'Mapování dat technické infrastruktury v majetku obcí LK - Kamenický Šenov', 
    isActive: true 
  },
  { 
    id: 'o8', 
    code: '7110/25/015', 
    name: 'Mapování dat technické infrastruktury - Osečná', 
    isActive: true 
  },
  { 
    id: 'o9', 
    code: '7110/25/014', 
    name: 'MAKRO Liberec osvětlení', 
    isActive: true 
  },
  { 
    id: 'o10', 
    code: '7110/25/013', 
    name: 'Rekonstrukce TTV, křižovatka Sociální Péče x Bělehradská x Krušnohorská x Stará', 
    isActive: true 
  },
  { 
    id: 'o11', 
    code: '7110/25/011', 
    name: 'Praha - Čakovice "Výstavba 2 železničních zastávek v rámci dotace TZZ vlečky a změna účelu"', 
    isActive: true 
  },
  { 
    id: 'o12', 
    code: '7110/25/010', 
    name: 'Rekonstrukce mosteckého a počeradského zhlaví v žst Obrnice', 
    isActive: true 
  },
  { 
    id: 'o13', 
    code: '7110/25/008', 
    name: 'REKLAMACE na zakázkách 2025', 
    isActive: true 
  },
  { 
    id: 'o14', 
    code: '7110/25/007', 
    name: 'SÚ Česká Třebová - Přístavba haly ČD', 
    isActive: true 
  },
  { 
    id: 'o15', 
    code: '7110/25/006', 
    name: 'ŽST Hrádek nad Nisou, rekonstrukce výpravní budovy', 
    isActive: true 
  },
  { 
    id: 'o16', 
    code: '7110/25/004', 
    name: 'Drobné výkony sdělovací 2025', 
    isActive: true 
  },
  { 
    id: 'o17', 
    code: '7110/25/003', 
    name: 'Výstavba trakčního trolejového vedení, Výstupní, Ústí nad Labem', 
    isActive: true 
  },
  { 
    id: 'o18', 
    code: '7110/25/001', 
    name: 'Rekonstrukce výpravní budovy ŽST Plzeň-Jižní Předměstí', 
    isActive: true 
  },
  { 
    id: 'o19', 
    code: '101', 
    name: 'Správa', 
    isActive: true 
  },
  { 
    id: 'o20', 
    code: '102', 
    name: 'THP', 
    isActive: true 
  },
  { 
    id: 'o21', 
    code: '103', 
    name: 'Dělníci', 
    isActive: true 
  }
];

export const INITIAL_TRIPS: Trip[] = [];