import { NextRequest, NextResponse } from 'next/server';
import { Database, dbCalculationToCalculation } from '@/lib/database';
import { WeightBalanceCalculation, ApiResponse } from '@/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Invalid calculation ID'
      }, { status: 400 });
    }

    const dbCalculation = await Database.getCalculationById(id);
    if (!dbCalculation) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Calculation not found'
      }, { status: 404 });
    }

    const calculation = dbCalculationToCalculation(dbCalculation);

    return NextResponse.json<ApiResponse<WeightBalanceCalculation>>({
      success: true,
      data: calculation
    });
  } catch (error) {
    console.error('Error fetching calculation:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to fetch calculation'
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
        error: 'Invalid calculation ID'
      }, { status: 400 });
    }

    const deleted = await Database.deleteCalculation(id);
    if (!deleted) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: 'Calculation not found'
      }, { status: 404 });
    }

    return NextResponse.json<ApiResponse>({
      success: true,
      message: 'Calculation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calculation:', error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: 'Failed to delete calculation'
    }, { status: 500 });
  }
}