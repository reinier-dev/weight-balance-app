// Core Types for Weight & Balance Application

export interface Station {
  id: number;
  description: string;
  arm: number;
  type: 'basic' | 'fuel' | 'landing_fuel' | 'cargo';
  weight?: number;
}

export interface MacConfig {
  formula: string;
  macMin: number;
  macMax: number;
}

export interface AircraftProfile {
  id?: number;
  name: string;
  description: string;
  macConfig: MacConfig;
  stations: Station[];
  unit: 'imperial' | 'metric';
  timestamp: string;
  userId?: string;
}

export interface WeightBalanceCalculation {
  id?: number;
  name: string;
  aircraftProfileId?: number;
  stations: Station[];
  macConfig: MacConfig;
  unit: 'imperial' | 'metric';
  summary: {
    zfw: SummaryData;
    tow: SummaryData;
    ldw: SummaryData;
  };
  timestamp: string;
  userId?: string;
}

export interface SummaryData {
  weight: string;
  cg: string;
}

export interface CargoItem {
  id: number;
  description: string;
  weight: number;
  arm: number;
  moment: number;
}

export interface FuelTankPriority {
  id: number;
  priority: number;
}

export interface FuelSequenceStep {
  tankName: string;
  startTime: number;
  endTime: number;
  fuelBurned: number;
  fuelRemaining: number;
}

export interface EnvelopeData {
  zfw: { cg: number; weight: number; mac: number };
  tow: { cg: number; weight: number; mac: number };
  ldw: { cg: number; weight: number; mac: number };
}

// Database Models
export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DbAircraftProfile {
  id: number;
  name: string;
  description: string;
  mac_formula: string;
  mac_min: number;
  mac_max: number;
  stations_data: string; // JSON string
  unit: string;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface DbCalculation {
  id: number;
  name: string;
  aircraft_profile_id: number | null;
  calculation_data: string; // JSON string
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}