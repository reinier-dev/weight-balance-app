'use client';

import React, { useEffect, useState } from 'react';
import WeightBalanceCalculator from './components/calculator/WeightBalanceCalculator';
import { ApiResponse } from '@/types';

export default function HomePage() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    // Initialize database on first load
    const initializeDatabase = async () => {
      try {
        const response = await fetch('/api/init', {
          method: 'POST',
        });

        const result: ApiResponse = await response.json();

        if (result.success) {
          setIsInitialized(true);
        } else {
          throw new Error(result.error || 'Unknown initialization error');
        }
      } catch (error) {
        console.error('Database initialization failed:', error);
        setInitError(error instanceof Error ? error.message : 'Database initialization failed');
        // Still allow the app to work in localStorage-only mode
        setIsInitialized(true);
      }
    };

    initializeDatabase();
  }, []);

  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Inicializando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {initError && (
        <div className="alert warning mb-6">
          <div className="font-medium">⚠️ Advertencia</div>
          <p className="mt-1">
            Error al conectar con la base de datos: {initError}
          </p>
          <p className="mt-1 text-sm">
            La aplicación funcionará en modo local. Los datos se guardarán solo en este navegador.
          </p>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Calculadora de Peso y Balance
        </h1>
        <p className="text-gray-600">
          Herramienta profesional para cálculos de peso y balance de aeronaves con gráficos de envolvente,
          gestión de perfiles de aeronave, secuencias de combustible y exportación a PDF.
        </p>
      </div>

      <WeightBalanceCalculator />

      {/* Help Section */}
      <div className="calculator-card mt-8">
        <h3 className="text-lg font-semibold mb-4">Ayuda Rápida</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
          <div>
            <h4 className="font-medium mb-2">Características principales:</h4>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>Cálculos automáticos de peso y balance</li>
              <li>Gráficos de envolvente en tiempo real</li>
              <li>Gestión de perfiles de aeronave</li>
              <li>Planificación de secuencias de combustible</li>
              <li>Gestión detallada de carga</li>
              <li>Exportación a PDF profesional</li>
              <li>Guardado automático local</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium mb-2">Cómo usar:</h4>
            <ul className="space-y-1 list-disc list-inside text-gray-600">
              <li>Seleccione o cree un perfil de aeronave</li>
              <li>Ingrese los pesos en las estaciones correspondientes</li>
              <li>Configure la carga adicional en el gestor de carga</li>
              <li>Planifique la secuencia de combustible si es necesario</li>
              <li>Verifique los límites en el gráfico de envolvente</li>
              <li>Exporte el cálculo a PDF para registros</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}