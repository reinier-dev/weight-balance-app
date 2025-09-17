'use client';

import React, { useState, useEffect } from 'react';
import { AircraftProfile, MacConfig, Station, ApiResponse } from '@/types';
import { AIRCRAFT_TEMPLATES, ValidationUtils } from '@/utils/calculations';

interface AircraftProfileManagerProps {
  currentProfile: AircraftProfile | null;
  onProfileLoad: (profile: AircraftProfile) => void;
  onMacConfigUpdate: (macConfig: MacConfig) => void;
  macConfig: MacConfig;
  stations: Station[];
  unit: 'imperial' | 'metric';
}

export default function AircraftProfileManager({
  currentProfile,
  onProfileLoad,
  onMacConfigUpdate,
  macConfig,
  stations,
  unit
}: AircraftProfileManagerProps) {
  const [availableProfiles, setAvailableProfiles] = useState<AircraftProfile[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newProfile, setNewProfile] = useState({
    name: '',
    description: '',
    macConfig: { ...macConfig }
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfiles();
  }, []);

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aircraft-profiles');
      const result: ApiResponse<AircraftProfile[]> = await response.json();

      if (result.success && result.data) {
        setAvailableProfiles(result.data);
      } else {
        // Fallback to templates if API fails
        const templateProfiles: AircraftProfile[] = Object.entries(AIRCRAFT_TEMPLATES).map(([key, template], index) => ({
          id: index + 1,
          name: template.name,
          description: template.description,
          macConfig: template.macConfig,
          stations: template.stations,
          unit: 'imperial',
          timestamp: new Date().toISOString()
        }));
        setAvailableProfiles(templateProfiles);
      }
    } catch (error) {
      console.error('Error loading profiles:', error);
      // Fallback to templates
      const templateProfiles: AircraftProfile[] = Object.entries(AIRCRAFT_TEMPLATES).map(([key, template], index) => ({
        id: index + 1,
        name: template.name,
        description: template.description,
        macConfig: template.macConfig,
        stations: template.stations,
        unit: 'imperial',
        timestamp: new Date().toISOString()
      }));
      setAvailableProfiles(templateProfiles);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProfile = (profile: AircraftProfile) => {
    onProfileLoad(profile);
  };

  const handleCreateProfile = async () => {
    try {
      const profileData: Omit<AircraftProfile, 'id'> = {
        name: newProfile.name,
        description: newProfile.description,
        macConfig: newProfile.macConfig,
        stations: stations,
        unit: unit,
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/aircraft-profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });

      const result: ApiResponse<AircraftProfile> = await response.json();

      if (result.success && result.data) {
        setAvailableProfiles([result.data, ...availableProfiles]);
        setIsCreating(false);
        setNewProfile({ name: '', description: '', macConfig: { ...macConfig } });
      } else {
        alert('Error al crear el perfil: ' + (result.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error creating profile:', error);
      alert('Error al crear el perfil');
    }
  };

  const handleMacConfigChange = (field: keyof MacConfig, value: string | number) => {
    const updatedMacConfig = { ...macConfig, [field]: value };
    setNewProfile({ ...newProfile, macConfig: updatedMacConfig });

    if (!isCreating && !isEditing) {
      onMacConfigUpdate(updatedMacConfig);
    }
  };

  const validateFormula = () => {
    if (!macConfig.formula) return { isValid: false, error: 'Fórmula requerida' };
    return ValidationUtils.validateFormula(macConfig.formula);
  };

  const formulaValidation = validateFormula();

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Gestión de Perfiles de Aeronave</h3>

      {/* Current Profile Info */}
      {currentProfile && (
        <div className="bg-blue-50 p-4 rounded-lg mb-4">
          <h4 className="font-medium text-blue-800">Perfil Actual</h4>
          <p className="text-blue-700">{currentProfile.name}</p>
          <p className="text-blue-600 text-sm">{currentProfile.description}</p>
        </div>
      )}

      {/* Profile Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div>
          <label className="block text-sm font-medium mb-2">Cargar Perfil Existente</label>
          <select
            className="w-full calculator-input"
            onChange={(e) => {
              const profile = availableProfiles.find(p => p.id === parseInt(e.target.value));
              if (profile) handleLoadProfile(profile);
            }}
            value={currentProfile?.id || ''}
          >
            <option value="">Seleccionar perfil...</option>
            {availableProfiles.map(profile => (
              <option key={profile.id} value={profile.id}>
                {profile.name} - {profile.description}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-end">
          <button
            onClick={() => setIsCreating(true)}
            className="calculator-button"
            disabled={loading}
          >
            Crear Nuevo Perfil
          </button>
        </div>
      </div>

      {/* MAC Configuration */}
      <div className="bg-gray-50 p-4 rounded-lg mb-4">
        <h4 className="font-medium mb-3">Configuración MAC</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Fórmula MAC</label>
            <input
              type="text"
              value={macConfig.formula}
              onChange={(e) => handleMacConfigChange('formula', e.target.value)}
              className={`w-full calculator-input ${!formulaValidation.isValid ? 'border-red-500' : ''}`}
              placeholder="((CG - 35.0) / 14.9) * 100"
            />
            {!formulaValidation.isValid && (
              <p className="text-red-600 text-xs mt-1">{formulaValidation.error}</p>
            )}
            <p className="text-gray-600 text-xs mt-1">Use 'CG' como variable</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">MAC Mínimo (%)</label>
            <input
              type="number"
              value={macConfig.macMin}
              onChange={(e) => handleMacConfigChange('macMin', parseFloat(e.target.value) || 0)}
              className="w-full calculator-input"
              step="0.1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">MAC Máximo (%)</label>
            <input
              type="number"
              value={macConfig.macMax}
              onChange={(e) => handleMacConfigChange('macMax', parseFloat(e.target.value) || 0)}
              className="w-full calculator-input"
              step="0.1"
            />
          </div>
        </div>
      </div>

      {/* Create Profile Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full m-4">
            <h4 className="text-lg font-semibold mb-4">Crear Nuevo Perfil</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nombre del Perfil</label>
                <input
                  type="text"
                  value={newProfile.name}
                  onChange={(e) => setNewProfile({ ...newProfile, name: e.target.value })}
                  className="w-full calculator-input"
                  placeholder="Mi Aeronave Personalizada"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Descripción</label>
                <textarea
                  value={newProfile.description}
                  onChange={(e) => setNewProfile({ ...newProfile, description: e.target.value })}
                  className="w-full calculator-input h-20 resize-none"
                  placeholder="Descripción del perfil de aeronave..."
                />
              </div>

              <p className="text-sm text-gray-600">
                Las estaciones actuales y configuración MAC se guardarán con este perfil.
              </p>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={handleCreateProfile}
                className="calculator-button"
                disabled={!newProfile.name.trim()}
              >
                Crear Perfil
              </button>
              <button
                onClick={() => {
                  setIsCreating(false);
                  setNewProfile({ name: '', description: '', macConfig: { ...macConfig } });
                }}
                className="calculator-button-secondary"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Quick Load */}
      <div>
        <h4 className="font-medium mb-2">Plantillas Rápidas</h4>
        <div className="flex flex-wrap gap-2">
          {Object.entries(AIRCRAFT_TEMPLATES).map(([key, template]) => (
            <button
              key={key}
              onClick={() => handleLoadProfile({
                id: Date.now(),
                name: template.name,
                description: template.description,
                macConfig: template.macConfig,
                stations: template.stations,
                unit: 'imperial',
                timestamp: new Date().toISOString()
              })}
              className="calculator-button-secondary text-sm"
            >
              {template.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}