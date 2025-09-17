import { NextResponse } from 'next/server';
import { Database } from '@/lib/database';
import { AIRCRAFT_TEMPLATES } from '@/utils/calculations';
import { ApiResponse } from '@/types';

export async function POST() {
  try {
    // Initialize database tables
    await Database.init();

    // Seed with default aircraft templates
    const existingProfiles = await Database.getAircraftProfiles();

    if (existingProfiles.length === 0) {
      // Add default aircraft templates
      for (const [key, template] of Object.entries(AIRCRAFT_TEMPLATES)) {
        await Database.createAircraftProfile({
          name: template.name,
          description: template.description,
          macConfig: template.macConfig,
          stations: template.stations,
          unit: 'imperial',
          timestamp: new Date().toISOString()
        });
      }
    }

    const stats = await Database.getStats();

    return NextResponse.json<ApiResponse<{ profiles: number; calculations: number }>>({
      success: true,
      data: stats,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    console.error('Error initializing database:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to initialize database'
    }, { status: 500 });
  }
}