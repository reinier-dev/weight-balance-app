import { NextRequest, NextResponse } from 'next/server';
import { Database, dbProfileToProfile } from '@/lib/database';
import { AircraftProfile, ApiResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid profile ID'
      }, { status: 400 });
    }

    const dbProfile = await Database.getAircraftProfileById(id);
    if (!dbProfile) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Aircraft profile not found'
      }, { status: 404 });
    }

    const profile = dbProfileToProfile(dbProfile);

    return NextResponse.json<ApiResponse<AircraftProfile>>({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error fetching aircraft profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch aircraft profile'
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid profile ID'
      }, { status: 400 });
    }

    const updateData: Partial<AircraftProfile> = await request.json();

    const dbProfile = await Database.updateAircraftProfile(id, updateData);
    const profile = dbProfileToProfile(dbProfile);

    return NextResponse.json<ApiResponse<AircraftProfile>>({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error updating aircraft profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to update aircraft profile'
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid profile ID'
      }, { status: 400 });
    }

    const deleted = await Database.deleteAircraftProfile(id);
    if (!deleted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Aircraft profile not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Aircraft profile deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting aircraft profile:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete aircraft profile'
    }, { status: 500 });
  }
}