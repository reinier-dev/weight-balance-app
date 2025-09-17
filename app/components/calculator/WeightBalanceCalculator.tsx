'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Station, MacConfig, AircraftProfile, EnvelopeData } from '@/types';
import { WeightBalanceCalculator as Calculator, AIRCRAFT_TEMPLATES } from '@/utils/calculations';
import StationTable from './StationTable';
import EnvelopeGraph from './EnvelopeGraph';
import AircraftProfileManager from './AircraftProfileManager';
import CargoManager from './CargoManager';
import FuelSequence from './FuelSequence';
import ExportPanel from './ExportPanel';

interface WeightBalanceCalculatorProps {
  initialProfile?: AircraftProfile;
}

export default function WeightBalanceCalculator({ initialProfile }: WeightBalanceCalculatorProps) {
  const [stations, setStations] = useState<Station[]>(
    initialProfile?.stations || AIRCRAFT_TEMPLATES.cessna172.stations
  );
  const [macConfig, setMacConfig] = useState<MacConfig>(
    initialProfile?.macConfig || AIRCRAFT_TEMPLATES.cessna172.macConfig
  );
  const [unit, setUnit] = useState<'imperial' | 'metric'>(
    initialProfile?.unit || 'imperial'
  );
  const [envelopeData, setEnvelopeData] = useState<EnvelopeData | null>(null);
  const [currentProfile, setCurrentProfile] = useState<AircraftProfile | null>(initialProfile || null);
  const [alerts, setAlerts] = useState<string[]>([]);

  // Calculate envelope data whenever stations or macConfig changes
  const calculateEnvelope = useCallback(() => {
    try {
      const data = Calculator.calculateEnvelopeData(stations, macConfig, unit === 'metric');
      setEnvelopeData(data);

      // Validate limits and set alerts
      const validation = Calculator.validateLimits(data, macConfig);
      const newAlerts: string[] = [];

      if (!validation.zfw) {
        newAlerts.push('ZFW está fuera de los límites MAC');
      }
      if (!validation.tow) {
        newAlerts.push('TOW está fuera de los límites MAC');
      }
      if (!validation.ldw) {
        newAlerts.push('LDW está fuera de los límites MAC');
      }

      setAlerts(newAlerts);
    } catch (error) {
      console.error('Error calculating envelope:', error);
      setAlerts(['Error en los cálculos. Verifique los datos ingresados.']);
    }
  }, [stations, macConfig, unit]);

  useEffect(() => {
    calculateEnvelope();
  }, [calculateEnvelope]);

  // Auto-save to localStorage
  useEffect(() => {
    const saveData = () => {
      const data = {
        stations,
        macConfig,
        unit,
        currentProfile,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('weightBalanceData', JSON.stringify(data));
    };

    const timeoutId = setTimeout(saveData, 1000); // Debounce saves
    return () => clearTimeout(timeoutId);
  }, [stations, macConfig, unit, currentProfile]);

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const savedData = localStorage.getItem('weightBalanceData');
      if (savedData && !initialProfile) {
        const data = JSON.parse(savedData);
        setStations(data.stations || AIRCRAFT_TEMPLATES.cessna172.stations);
        setMacConfig(data.macConfig || AIRCRAFT_TEMPLATES.cessna172.macConfig);
        setUnit(data.unit || 'imperial');
        setCurrentProfile(data.currentProfile || null);
      }
    } catch (error) {
      console.error('Error loading saved data:', error);
    }
  }, [initialProfile]);

  const handleStationUpdate = (updatedStations: Station[]) => {
    setStations(updatedStations);
  };

  const handleProfileLoad = (profile: AircraftProfile) => {
    setStations(profile.stations);
    setMacConfig(profile.macConfig);
    setUnit(profile.unit);
    setCurrentProfile(profile);
  };

  const handleMacConfigUpdate = (newMacConfig: MacConfig) => {
    setMacConfig(newMacConfig);
  };

  const handleUnitChange = (newUnit: 'imperial' | 'metric') => {
    setUnit(newUnit);
  };

  const clearAllData = () => {
    setStations(AIRCRAFT_TEMPLATES.cessna172.stations);
    setMacConfig(AIRCRAFT_TEMPLATES.cessna172.macConfig);
    setUnit('imperial');
    setCurrentProfile(null);
    setAlerts([]);
    localStorage.removeItem('weightBalanceData');
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="alert error">
          <div className="font-medium">⚠️ Alertas:</div>
          <ul className="mt-2 list-disc list-inside">
            {alerts.map((alert, index) => (
              <li key={index}>{alert}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Controls */}
      <div className="calculator-card">
        <div className="flex flex-wrap gap-4 items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-semibold">
              {currentProfile?.name || 'Calculadora de Peso y Balance'}
            </h2>
            {currentProfile?.description && (
              <span className="text-gray-600 text-sm">
                {currentProfile.description}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Unidades:</label>
            <select
              value={unit}
              onChange={(e) => handleUnitChange(e.target.value as 'imperial' | 'metric')}
              className="calculator-input"
            >
              <option value="imperial">Imperial (lb/in)</option>
              <option value="metric">Métrico (kg/m)</option>
            </select>
          </div>
        </div>

        {/* Aircraft Profile Manager */}
        <AircraftProfileManager
          currentProfile={currentProfile}
          onProfileLoad={handleProfileLoad}
          onMacConfigUpdate={handleMacConfigUpdate}
          macConfig={macConfig}
          stations={stations}
          unit={unit}
        />
      </div>

      {/* Station Table */}
      <div className="calculator-card">
        <StationTable
          stations={stations}
          onStationsUpdate={handleStationUpdate}
          unit={unit}
          macConfig={macConfig}
        />
      </div>

      {/* Cargo Manager */}
      <div className="calculator-card">
        <CargoManager
          stations={stations}
          onStationsUpdate={handleStationUpdate}
          unit={unit}
        />
      </div>

      {/* Fuel Sequence */}
      <div className="calculator-card">
        <FuelSequence
          stations={stations}
          onStationsUpdate={handleStationUpdate}
          macConfig={macConfig}
          unit={unit}
        />
      </div>

      {/* Envelope Graph */}
      {envelopeData && (
        <div className="calculator-card">
          <EnvelopeGraph
            envelopeData={envelopeData}
            macConfig={macConfig}
            unit={unit}
          />
        </div>
      )}

      {/* Export Panel */}
      <div className="calculator-card">
        <ExportPanel
          stations={stations}
          macConfig={macConfig}
          envelopeData={envelopeData}
          unit={unit}
          profileName={currentProfile?.name || 'Sin perfil'}
          onClearData={clearAllData}
        />
      </div>
    </div>
  );
}