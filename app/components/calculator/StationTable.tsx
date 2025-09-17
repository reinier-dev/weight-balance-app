'use client';

import React from 'react';
import { Station, MacConfig } from '@/types';
import { WeightBalanceCalculator } from '@/utils/calculations';

interface StationTableProps {
  stations: Station[];
  onStationsUpdate: (stations: Station[]) => void;
  unit: 'imperial' | 'metric';
  macConfig: MacConfig;
}

export default function StationTable({ stations, onStationsUpdate, unit, macConfig }: StationTableProps) {
  const handleWeightChange = (index: number, weight: number) => {
    const updatedStations = [...stations];
    updatedStations[index] = { ...updatedStations[index], weight };
    onStationsUpdate(updatedStations);
  };

  const summaries = WeightBalanceCalculator.calculateSummaries(stations);
  const envelopeData = WeightBalanceCalculator.calculateEnvelopeData(stations, macConfig, unit === 'metric');
  const validation = WeightBalanceCalculator.validateLimits(envelopeData, macConfig);

  const weightUnit = unit === 'imperial' ? 'lb' : 'kg';
  const lengthUnit = unit === 'imperial' ? 'in' : 'm';

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Estaciones de Peso</h3>

      <div className="overflow-x-auto">
        <table className="calculator-table">
          <thead>
            <tr>
              <th>Estación</th>
              <th>Descripción</th>
              <th>Brazo ({lengthUnit})</th>
              <th>Peso ({weightUnit})</th>
              <th>Momento</th>
              <th>Tipo</th>
            </tr>
          </thead>
          <tbody>
            {stations.map((station, index) => (
              <tr key={station.id} className={station.type === 'fuel' ? 'bg-blue-50' : station.type === 'landing_fuel' ? 'bg-yellow-50' : ''}>
                <td className="font-medium">{station.id}</td>
                <td>{station.description}</td>
                <td>{station.arm.toFixed(3)}</td>
                <td>
                  <input
                    type="number"
                    value={station.weight || 0}
                    onChange={(e) => handleWeightChange(index, parseFloat(e.target.value) || 0)}
                    className="calculator-input"
                    min="0"
                    step="0.1"
                  />
                </td>
                <td>{WeightBalanceCalculator.formatMoment((station.weight || 0) * station.arm)}</td>
                <td>
                  <span className={`status-indicator ${
                    station.type === 'fuel' ? 'bg-blue-100 text-blue-800' :
                    station.type === 'landing_fuel' ? 'bg-yellow-100 text-yellow-800' :
                    station.type === 'cargo' ? 'bg-purple-100 text-purple-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {station.type === 'fuel' ? 'Combustible' :
                     station.type === 'landing_fuel' ? 'Combustible Aterrizaje' :
                     station.type === 'cargo' ? 'Carga' : 'Básico'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Section */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ZFW */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Peso Vacío (ZFW)</h4>
          <div className="space-y-1 text-sm">
            <div>Peso: {WeightBalanceCalculator.formatWeight(summaries.zfw.weight, unit)}</div>
            <div>CG: {WeightBalanceCalculator.formatLength(envelopeData.zfw.cg, unit)}</div>
            <div>%MAC: {envelopeData.zfw.mac.toFixed(2)}%</div>
            <div className={`status-indicator ${validation.zfw ? 'in-limits' : 'out-of-limits'}`}>
              {validation.zfw ? 'Dentro de límites' : 'Fuera de límites'}
            </div>
          </div>
        </div>

        {/* TOW */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Peso Despegue (TOW)</h4>
          <div className="space-y-1 text-sm">
            <div>Peso: {WeightBalanceCalculator.formatWeight(summaries.tow.weight, unit)}</div>
            <div>CG: {WeightBalanceCalculator.formatLength(envelopeData.tow.cg, unit)}</div>
            <div>%MAC: {envelopeData.tow.mac.toFixed(2)}%</div>
            <div className={`status-indicator ${validation.tow ? 'in-limits' : 'out-of-limits'}`}>
              {validation.tow ? 'Dentro de límites' : 'Fuera de límites'}
            </div>
          </div>
        </div>

        {/* LDW */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-gray-700 mb-2">Peso Aterrizaje (LDW)</h4>
          <div className="space-y-1 text-sm">
            <div>Peso: {WeightBalanceCalculator.formatWeight(summaries.ldw.weight, unit)}</div>
            <div>CG: {WeightBalanceCalculator.formatLength(envelopeData.ldw.cg, unit)}</div>
            <div>%MAC: {envelopeData.ldw.mac.toFixed(2)}%</div>
            <div className={`status-indicator ${validation.ldw ? 'in-limits' : 'out-of-limits'}`}>
              {validation.ldw ? 'Dentro de límites' : 'Fuera de límites'}
            </div>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="mt-4 bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-700 mb-2">Totales</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium">Peso Total: </span>
            {WeightBalanceCalculator.formatWeight(summaries.totals.weight, unit)}
          </div>
          <div>
            <span className="font-medium">Momento Total: </span>
            {WeightBalanceCalculator.formatMoment(summaries.totals.moment)}
          </div>
          <div>
            <span className="font-medium">ARM Total: </span>
            {summaries.totals.arm.toFixed(3)} {lengthUnit}
          </div>
        </div>
      </div>
    </div>
  );
}