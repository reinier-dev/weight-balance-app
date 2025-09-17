import { NextRequest, NextResponse } from 'next/server';
import { Database, dbCalculationToCalculation } from '@/lib/database';
import { WeightBalanceCalculation, ApiResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;
    const limit = parseInt(searchParams.get('limit') || '50');

    const dbCalculations = await Database.getCalculations(userId, limit);
    const calculations = dbCalculations.map(dbCalculationToCalculation);

    return NextResponse.json<ApiResponse<WeightBalanceCalculation[]>>({
      success: true,
      data: calculations
    });
  } catch (error) {
    console.error('Error fetching calculations:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch calculations'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || undefined;

    const calculationData: Omit<WeightBalanceCalculation, 'id'> = await request.json();

    // Validate required fields
    if (!calculationData.name || !calculationData.stations || !calculationData.macConfig) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Missing required fields: name, stations, and macConfig are required'
      }, { status: 400 });
    }

    const dbCalculation = await Database.createCalculation(calculationData, userId);
    const calculation = dbCalculationToCalculation(dbCalculation);

    return NextResponse.json<ApiResponse<WeightBalanceCalculation>>({
      success: true,
      data: calculation
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating calculation:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to create calculation'
    }, { status: 500 });
  }
}