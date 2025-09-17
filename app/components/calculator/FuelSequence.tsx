'use client';

import React, { useState } from 'react';
import { Station, MacConfig } from '@/types';
import { WeightBalanceCalculator } from '@/utils/calculations';

interface FuelSequenceProps {
  stations: Station[];
  onStationsUpdate: (stations: Station[]) => void;
  macConfig: MacConfig;
  unit: 'imperial' | 'metric';
}

interface FuelTank {
  stationId: number;
  name: string;
  totalFuel: number;
  priority: number;
}

interface FuelStep {
  time: number;
  tanks: { [stationId: number]: number };
  totalWeight: number;
  cg: number;
  mac: number;
}

export default function FuelSequence({ stations, onStationsUpdate, macConfig, unit }: FuelSequenceProps) {
  const [fuelTanks, setFuelTanks] = useState<FuelTank[]>([]);
  const [flightTime, setFlightTime] = useState(2.0);
  const [fuelBurnRate, setFuelBurnRate] = useState(10.0);
  const [fuelSequence, setFuelSequence] = useState<FuelStep[]>([]);
  const [isSequenceVisible, setIsSequenceVisible] = useState(false);

  const weightUnit = unit === 'imperial' ? 'lb/h' : 'kg/h';

  // Initialize fuel tanks from stations
  React.useEffect(() => {
    const fuelStations = stations.filter(station => station.type === 'fuel');
    const tanks: FuelTank[] = fuelStations.map((station, index) => ({
      stationId: station.id,
      name: station.description,
      totalFuel: station.weight || 0,
      priority: index + 1
    }));
    setFuelTanks(tanks);
  }, [stations]);

  const handlePriorityChange = (stationId: number, newPriority: number) => {
    const updatedTanks = fuelTanks.map(tank =>
      tank.stationId === stationId
        ? { ...tank, priority: newPriority }
        : tank
    );
    setFuelTanks(updatedTanks);
  };

  const calculateFuelSequence = () => {
    if (fuelTanks.length === 0) {
      alert('No hay tanques de combustible configurados');
      return;
    }

    const sortedTanks = [...fuelTanks].sort((a, b) => a.priority - b.priority);
    const totalFuelBurn = flightTime * fuelBurnRate;
    const steps: FuelStep[] = [];

    // Initial state
    const initialStations = [...stations];
    let currentFuelInTanks = sortedTanks.map(tank => tank.totalFuel);

    // Calculate steps every 15 minutes
    const timeInterval = 0.25; // 15 minutes
    let remainingFuelToBurn = totalFuelBurn;

    for (let time = 0; time <= flightTime; time += timeInterval) {
      const fuelToBurnThisStep = Math.min(remainingFuelToBurn, fuelBurnRate * timeInterval);

      // Burn fuel from tanks according to priority
      let fuelToBurn = fuelToBurnThisStep;
      for (let i = 0; i < sortedTanks.length && fuelToBurn > 0; i++) {
        const tankIndex = i;
        const fuelBurnedFromTank = Math.min(currentFuelInTanks[tankIndex], fuelToBurn);
        currentFuelInTanks[tankIndex] -= fuelBurnedFromTank;
        fuelToBurn -= fuelBurnedFromTank;
      }

      remainingFuelToBurn -= fuelToBurnThisStep;

      // Create stations snapshot for this time step
      const stepStations = initialStations.map(station => {
        const tankIndex = sortedTanks.findIndex(tank => tank.stationId === station.id);
        if (tankIndex !== -1) {
          return { ...station, weight: currentFuelInTanks[tankIndex] };
        }
        return station;
      });

      // Calculate envelope data for this step
      const envelopeData = WeightBalanceCalculator.calculateEnvelopeData(stepStations, macConfig, unit === 'metric');

      const step: FuelStep = {
        time: time,
        tanks: {},
        totalWeight: envelopeData.tow.weight,
        cg: envelopeData.tow.cg,
        mac: envelopeData.tow.mac
      };

      // Add tank fuel levels to step
      sortedTanks.forEach((tank, index) => {
        step.tanks[tank.stationId] = currentFuelInTanks[index];
      });

      steps.push(step);

      if (remainingFuelToBurn <= 0) break;
    }

    setFuelSequence(steps);
    setIsSequenceVisible(true);
  };

  const applyFuelState = (step: FuelStep) => {
    const updatedStations = stations.map(station => {
      if (station.type === 'fuel' && step.tanks[station.id] !== undefined) {
        return { ...station, weight: step.tanks[station.id] };
      }
      return station;
    });

    onStationsUpdate(updatedStations);
  };

  const resetFuelToFull = () => {
    const updatedStations = stations.map(station => {
      const tank = fuelTanks.find(t => t.stationId === station.id);
      if (tank) {
        return { ...station, weight: tank.totalFuel };
      }
      return station;
    });

    onStationsUpdate(updatedStations);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Secuencia de Consumo de Combustible</h3>

      {/* Fuel Tank Priority Configuration */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Prioridad de Tanques</h4>
        {fuelTanks.length > 0 ? (
          <div className="space-y-2">
            {fuelTanks
              .sort((a, b) => a.priority - b.priority)
              .map(tank => (
                <div key={tank.stationId} className="flex items-center gap-4 p-3 bg-gray-50 rounded">
                  <div className="flex-1">
                    <span className="font-medium">{tank.name}</span>
                    <span className="text-gray-600 ml-2">
                      ({tank.totalFuel.toFixed(1)} {unit === 'imperial' ? 'lb' : 'kg'})
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-sm">Prioridad:</label>
                    <select
                      value={tank.priority}
                      onChange={(e) => handlePriorityChange(tank.stationId, parseInt(e.target.value))}
                      className="calculator-input w-20"
                    >
                      {fuelTanks.map((_, index) => (
                        <option key={index + 1} value={index + 1}>
                          {index + 1}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <p className="text-gray-500">No hay tanques de combustible configurados</p>
        )}
      </div>

      {/* Flight Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-1">Tiempo de Vuelo (horas)</label>
          <input
            type="number"
            value={flightTime}
            onChange={(e) => setFlightTime(parseFloat(e.target.value) || 0)}
            className="calculator-input"
            min="0"
            step="0.1"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Consumo ({weightUnit})</label>
          <input
            type="number"
            value={fuelBurnRate}
            onChange={(e) => setFuelBurnRate(parseFloat(e.target.value) || 0)}
            className="calculator-input"
            min="0"
            step="0.1"
          />
        </div>

        <div className="flex items-end">
          <button
            onClick={calculateFuelSequence}
            className="calculator-button"
            disabled={fuelTanks.length === 0}
          >
            Calcular Secuencia
          </button>
        </div>
      </div>

      {/* Control Buttons */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={resetFuelToFull}
          className="calculator-button-secondary"
        >
          Combustible Completo
        </button>
        <button
          onClick={() => setIsSequenceVisible(!isSequenceVisible)}
          className="calculator-button-secondary"
          disabled={fuelSequence.length === 0}
        >
          {isSequenceVisible ? 'Ocultar' : 'Mostrar'} Secuencia
        </button>
      </div>

      {/* Fuel Sequence Results */}
      {isSequenceVisible && fuelSequence.length > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Secuencia de Combustible</h4>
          <div className="overflow-x-auto">
            <table className="calculator-table">
              <thead>
                <tr>
                  <th>Tiempo (h)</th>
                  <th>Peso Total</th>
                  <th>CG</th>
                  <th>%MAC</th>
                  <th>Estado Tanques</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {fuelSequence.map((step, index) => {
                  const isInLimits = step.mac >= macConfig.macMin && step.mac <= macConfig.macMax;
                  return (
                    <tr key={index} className={!isInLimits ? 'bg-red-50' : ''}>
                      <td>{step.time.toFixed(2)}</td>
                      <td>
                        {WeightBalanceCalculator.formatWeight(step.totalWeight, unit)}
                      </td>
                      <td>
                        {WeightBalanceCalculator.formatLength(step.cg, unit)}
                      </td>
                      <td>
                        <span className={`status-indicator ${isInLimits ? 'in-limits' : 'out-of-limits'}`}>
                          {step.mac.toFixed(2)}%
                        </span>
                      </td>
                      <td>
                        <div className="text-xs space-y-1">
                          {fuelTanks
                            .sort((a, b) => a.priority - b.priority)
                            .map(tank => (
                              <div key={tank.stationId}>
                                {tank.name}: {step.tanks[tank.stationId]?.toFixed(1) || '0'} {unit === 'imperial' ? 'lb' : 'kg'}
                              </div>
                            ))}
                        </div>
                      </td>
                      <td>
                        <button
                          onClick={() => applyFuelState(step)}
                          className="text-blue-600 hover:text-blue-800 text-sm"
                        >
                          Aplicar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            <p><strong>Consumo total:</strong> {(flightTime * fuelBurnRate).toFixed(1)} {unit === 'imperial' ? 'lb' : 'kg'}</p>
            <p><strong>Nota:</strong> Las filas en rojo indican estados fuera de los límites MAC.</p>
          </div>
        </div>
      )}
    </div>
  );
}