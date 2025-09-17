import { NextRequest, NextResponse } from 'next/server';
import { Database, dbProfileToProfile } from '@/lib/database';
import { AircraftProfile, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const dbProfiles = await Database.getAircraftProfiles(userId);
    const profiles = dbProfiles.map(dbProfileToProfile);

    return NextResponse.json<ApiResponse<AircraftProfile[]>>({
      success: true,
      data: profiles
    });
  } catch (error) {
    console.error('Error fetching aircraft profiles:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch aircraft profiles'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const profileData: Omit<AircraftProfile, 'id'> = await request.json();

    // Validate required fields
    if (!profileData.name || !profileData.macConfig || !profileData.stations) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields: name, macConfig, and stations are required'
      }, { status: 400 });
    }

    const dbProfile = await Database.createAircraftProfile(profileData, userId);
    const profile = dbProfileToProfile(dbProfile);

    return NextResponse.json<ApiResponse<AircraftProfile>>({
      success: true,
      data: profile
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating aircraft profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create aircraft profile'
    }, { status: 500 });
  }
}