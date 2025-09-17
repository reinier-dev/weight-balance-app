'use client';

import React, { useState } from 'react';
import { Station } from '@/types';

interface CargoManagerProps {
  stations: Station[];
  onStationsUpdate: (stations: Station[]) => void;
  unit: 'imperial' | 'metric';
}

interface CargoItem {
  id: number;
  description: string;
  weight: number;
  arm: number;
}

export default function CargoManager({ stations, onStationsUpdate, unit }: CargoManagerProps) {
  const [cargoItems, setCargoItems] = useState<CargoItem[]>([]);
  const [isAddingCargo, setIsAddingCargo] = useState(false);
  const [newCargo, setNewCargo] = useState({
    description: '',
    weight: 0,
    arm: 0
  });
  const [editingStationId, setEditingStationId] = useState<number | null>(null);
  const [editingStationName, setEditingStationName] = useState('');

  const weightUnit = unit === 'imperial' ? 'lb' : 'kg';
  const lengthUnit = unit === 'imperial' ? 'in' : 'm';

  const handleAddCargo = () => {
    if (!newCargo.description.trim() || newCargo.weight <= 0 || newCargo.arm <= 0) {
      alert('Por favor complete todos los campos con valores válidos');
      return;
    }

    const cargoItem: CargoItem = {
      id: Date.now(),
      description: newCargo.description,
      weight: newCargo.weight,
      arm: newCargo.arm
    };

    const updatedCargoItems = [...cargoItems, cargoItem];
    setCargoItems(updatedCargoItems);

    // Update stations by adding cargo as new stations or updating existing cargo stations
    const updatedStations = [...stations];

    // Find the next available ID
    const maxId = Math.max(...updatedStations.map(s => s.id), 0);

    // Add new cargo station
    const newStation: Station = {
      id: maxId + 1,
      description: newCargo.description,
      arm: newCargo.arm,
      type: 'cargo',
      weight: newCargo.weight
    };

    updatedStations.push(newStation);
    onStationsUpdate(updatedStations);

    setNewCargo({ description: '', weight: 0, arm: 0 });
    setIsAddingCargo(false);
  };

  const handleRemoveCargo = (cargoId: number) => {
    const cargoItem = cargoItems.find(item => item.id === cargoId);
    if (!cargoItem) return;

    // Remove from cargo items
    const updatedCargoItems = cargoItems.filter(item => item.id !== cargoId);
    setCargoItems(updatedCargoItems);

    // Remove corresponding station
    const updatedStations = stations.filter(station =>
      !(station.type === 'cargo' && station.description === cargoItem.description)
    );
    onStationsUpdate(updatedStations);
  };

  const handleUpdateStationName = (stationId: number) => {
    if (!editingStationName.trim()) {
      alert('El nombre no puede estar vacío');
      return;
    }

    const updatedStations = stations.map(station =>
      station.id === stationId
        ? { ...station, description: editingStationName }
        : station
    );

    onStationsUpdate(updatedStations);
    setEditingStationId(null);
    setEditingStationName('');
  };

  const startEditingStation = (station: Station) => {
    setEditingStationId(station.id);
    setEditingStationName(station.description);
  };

  const getEditableStations = () => {
    return stations.filter(station =>
      station.id >= 8 && station.id <= 10 && station.type !== 'fuel'
    );
  };

  const distributeCargo = () => {
    if (cargoItems.length === 0) {
      alert('No hay elementos de carga para distribuir');
      return;
    }

    // Calculate total cargo weight and moment
    const totalCargoWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);
    const totalCargoMoment = cargoItems.reduce((sum, item) => sum + (item.weight * item.arm), 0);
    const avgCargoArm = totalCargoMoment / totalCargoWeight;

    // Find available cargo stations
    const cargoStations = stations.filter(station => station.type === 'cargo' || station.type === 'basic');
    const availableCargoStations = cargoStations.slice(0, Math.min(cargoStations.length, cargoItems.length));

    if (availableCargoStations.length === 0) {
      alert('No hay estaciones de carga disponibles');
      return;
    }

    // Distribute cargo evenly among available stations
    const weightPerStation = totalCargoWeight / availableCargoStations.length;

    const updatedStations = stations.map(station => {
      const stationIndex = availableCargoStations.findIndex(s => s.id === station.id);
      if (stationIndex !== -1) {
        return {
          ...station,
          weight: weightPerStation,
          type: 'cargo' as const
        };
      }
      return station;
    });

    onStationsUpdate(updatedStations);
  };

  const clearAllCargo = () => {
    setCargoItems([]);

    // Remove all cargo stations and reset cargo station weights
    const updatedStations = stations.map(station =>
      station.type === 'cargo'
        ? { ...station, weight: 0, type: 'basic' as const }
        : station
    ).filter(station => station.type !== 'cargo' || station.weight === 0);

    onStationsUpdate(updatedStations);
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Gestión de Carga</h3>

      {/* Cargo Items List */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Elementos de Carga</h4>
          <button
            onClick={() => setIsAddingCargo(true)}
            className="calculator-button"
          >
            Agregar Carga
          </button>
        </div>

        {cargoItems.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="calculator-table">
              <thead>
                <tr>
                  <th>Descripción</th>
                  <th>Peso ({weightUnit})</th>
                  <th>Brazo ({lengthUnit})</th>
                  <th>Momento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cargoItems.map(item => (
                  <tr key={item.id}>
                    <td>{item.description}</td>
                    <td>{item.weight.toFixed(1)}</td>
                    <td>{item.arm.toFixed(3)}</td>
                    <td>{(item.weight * item.arm / 100).toFixed(2)}</td>
                    <td>
                      <button
                        onClick={() => handleRemoveCargo(item.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">No hay elementos de carga</p>
        )}

        {cargoItems.length > 0 && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={distributeCargo}
              className="calculator-button"
            >
              Distribuir Carga
            </button>
            <button
              onClick={clearAllCargo}
              className="calculator-button-secondary"
            >
              Limpiar Todo
            </button>
          </div>
        )}
      </div>

      {/* Station Name Editor */}
      <div className="mb-6">
        <h4 className="font-medium mb-3">Editor de Nombres de Estación</h4>
        <p className="text-sm text-gray-600 mb-3">
          Edite los nombres de las estaciones 8, 9 y 10 para personalizar su configuración.
        </p>

        <div className="space-y-2">
          {getEditableStations().map(station => (
            <div key={station.id} className="flex items-center gap-2">
              <span className="w-16 text-sm font-medium">Estación {station.id}:</span>
              {editingStationId === station.id ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingStationName}
                    onChange={(e) => setEditingStationName(e.target.value)}
                    className="calculator-input flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateStationName(station.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleUpdateStationName(station.id)}
                    className="calculator-button text-sm"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => {
                      setEditingStationId(null);
                      setEditingStationName('');
                    }}
                    className="calculator-button-secondary text-sm"
                  >
                    Cancelar
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 flex-1">
                  <span className="flex-1">{station.description}</span>
                  <button
                    onClick={() => startEditingStation(station)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Editar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Add Cargo Modal */}
      {isAddingCargo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h4 className="text-lg font-semibold mb-4">Agregar Elemento de Carga</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <input
                  type="text"
                  value={newCargo.description}
                  onChange={(e) => setNewCargo({ ...newCargo, description: e.target.value })}
                  className="w-full calculator-input"
                  placeholder="Equipaje, herramientas, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Peso ({weightUnit})</label>
                <input
                  type="number"
                  value={newCargo.weight}
                  onChange={(e) => setNewCargo({ ...newCargo, weight: parseFloat(e.target.value) || 0 })}
                  className="w-full calculator-input"
                  min="0"
                  step="0.1"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Brazo ({lengthUnit})</label>
                <input
                  type="number"
                  value={newCargo.arm}
                  onChange={(e) => setNewCargo({ ...newCargo, arm: parseFloat(e.target.value) || 0 })}
                  className="w-full calculator-input"
                  min="0"
                  step="0.001"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleAddCargo}
                className="calculator-button"
                disabled={!newCargo.description.trim() || newCargo.weight <= 0 || newCargo.arm <= 0}
              >
                Agregar
              </button>
              <button
                onClick={() => {
                  setIsAddingCargo(false);
                  setNewCargo({ description: '', weight: 0, arm: 0 });
                }}
                className="calculator-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}