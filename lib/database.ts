import { sql } from '@vercel/postgres';
import { DbAircraftProfile, DbCalculation, AircraftProfile, WeightBalanceCalculation } from '@/types';

// Database connection and utilities
export class Database {
  // Initialize database tables
  static async init() {
    try {
      // Create aircraft_profiles table
      await sql`
        CREATE TABLE IF NOT EXISTS aircraft_profiles (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          mac_formula TEXT NOT NULL,
          mac_min DECIMAL(10,2) NOT NULL,
          mac_max DECIMAL(10,2) NOT NULL,
          stations_data TEXT NOT NULL,
          unit VARCHAR(20) NOT NULL DEFAULT 'imperial',
          user_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create calculations table
      await sql`
        CREATE TABLE IF NOT EXISTS calculations (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          aircraft_profile_id INTEGER REFERENCES aircraft_profiles(id),
          calculation_data TEXT NOT NULL,
          user_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create users table (simple version)
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          name VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;

      // Create indexes for better performance
      await sql`CREATE INDEX IF NOT EXISTS idx_aircraft_profiles_user_id ON aircraft_profiles(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_calculations_user_id ON calculations(user_id);`;
      await sql`CREATE INDEX IF NOT EXISTS idx_calculations_profile_id ON calculations(aircraft_profile_id);`;

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  // Aircraft Profiles Methods
  static async createAircraftProfile(profile: Omit<AircraftProfile, 'id'>, userId?: string): Promise<DbAircraftProfile> {
    const stationsData = JSON.stringify(profile.stations);

    const result = await sql`
      INSERT INTO aircraft_profiles (name, description, mac_formula, mac_min, mac_max, stations_data, unit, user_id)
      VALUES (${profile.name}, ${profile.description}, ${profile.macConfig.formula}, ${profile.macConfig.macMin}, ${profile.macConfig.macMax}, ${stationsData}, ${profile.unit}, ${userId || null})
      RETURNING *;
    `;

    return result.rows[0] as DbAircraftProfile;
  }

  static async getAircraftProfiles(userId?: string): Promise<DbAircraftProfile[]> {
    const result = userId
      ? await sql`SELECT * FROM aircraft_profiles WHERE user_id = ${userId} OR user_id IS NULL ORDER BY created_at DESC;`
      : await sql`SELECT * FROM aircraft_profiles WHERE user_id IS NULL ORDER BY created_at DESC;`;

    return result.rows as DbAircraftProfile[];
  }

  static async getAircraftProfileById(id: number): Promise<DbAircraftProfile | null> {
    const result = await sql`SELECT * FROM aircraft_profiles WHERE id = ${id};`;
    return result.rows[0] as DbAircraftProfile || null;
  }

  static async updateAircraftProfile(id: number, profile: Partial<AircraftProfile>): Promise<DbAircraftProfile> {
    const stationsData = profile.stations ? JSON.stringify(profile.stations) : undefined;

    const result = await sql`
      UPDATE aircraft_profiles
      SET
        name = COALESCE(${profile.name || null}, name),
        description = COALESCE(${profile.description || null}, description),
        mac_formula = COALESCE(${profile.macConfig?.formula || null}, mac_formula),
        mac_min = COALESCE(${profile.macConfig?.macMin || null}, mac_min),
        mac_max = COALESCE(${profile.macConfig?.macMax || null}, mac_max),
        stations_data = COALESCE(${stationsData || null}, stations_data),
        unit = COALESCE(${profile.unit || null}, unit),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
      RETURNING *;
    `;

    return result.rows[0] as DbAircraftProfile;
  }

  static async deleteAircraftProfile(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM aircraft_profiles WHERE id = ${id};`;
    return result.rowCount > 0;
  }

  // Calculations Methods
  static async createCalculation(calculation: Omit<WeightBalanceCalculation, 'id'>, userId?: string): Promise<DbCalculation> {
    const calculationData = JSON.stringify(calculation);

    const result = await sql`
      INSERT INTO calculations (name, aircraft_profile_id, calculation_data, user_id)
      VALUES (${calculation.name}, ${calculation.aircraftProfileId || null}, ${calculationData}, ${userId || null})
      RETURNING *;
    `;

    return result.rows[0] as DbCalculation;
  }

  static async getCalculations(userId?: string, limit: number = 50): Promise<DbCalculation[]> {
    const result = userId
      ? await sql`SELECT * FROM calculations WHERE user_id = ${userId} OR user_id IS NULL ORDER BY created_at DESC LIMIT ${limit};`
      : await sql`SELECT * FROM calculations WHERE user_id IS NULL ORDER BY created_at DESC LIMIT ${limit};`;

    return result.rows as DbCalculation[];
  }

  static async getCalculationById(id: number): Promise<DbCalculation | null> {
    const result = await sql`SELECT * FROM calculations WHERE id = ${id};`;
    return result.rows[0] as DbCalculation || null;
  }

  static async deleteCalculation(id: number): Promise<boolean> {
    const result = await sql`DELETE FROM calculations WHERE id = ${id};`;
    return result.rowCount > 0;
  }

  // Utility Methods
  static async healthCheck(): Promise<boolean> {
    try {
      await sql`SELECT 1;`;
      return true;
    } catch (error) {
      console.error('Database health check failed:', error);
      return false;
    }
  }

  static async getStats(): Promise<{ profiles: number; calculations: number }> {
    const profilesResult = await sql`SELECT COUNT(*) as count FROM aircraft_profiles;`;
    const calculationsResult = await sql`SELECT COUNT(*) as count FROM calculations;`;

    return {
      profiles: parseInt(profilesResult.rows[0].count),
      calculations: parseInt(calculationsResult.rows[0].count)
    };
  }
}

// Helper functions to convert between database and application types
export function dbProfileToProfile(dbProfile: DbAircraftProfile): AircraftProfile {
  return {
    id: dbProfile.id,
    name: dbProfile.name,
    description: dbProfile.description,
    macConfig: {
      formula: dbProfile.mac_formula,
      macMin: dbProfile.mac_min,
      macMax: dbProfile.mac_max
    },
    stations: JSON.parse(dbProfile.stations_data),
    unit: dbProfile.unit as 'imperial' | 'metric',
    timestamp: dbProfile.created_at.toISOString()
  };
}

export function dbCalculationToCalculation(dbCalculation: DbCalculation): WeightBalanceCalculation {
  const calculationData = JSON.parse(dbCalculation.calculation_data);
  return {
    id: dbCalculation.id,
    ...calculationData,
    aircraftProfileId: dbCalculation.aircraft_profile_id,
    timestamp: dbCalculation.created_at.toISOString()
  };
}