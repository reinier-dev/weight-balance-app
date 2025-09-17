'use client';

import React from 'react';
import { Station, MacConfig, EnvelopeData } from '@/types';
import { WeightBalanceCalculator } from '@/utils/calculations';

interface ExportPanelProps {
  stations: Station[];
  macConfig: MacConfig;
  envelopeData: EnvelopeData | null;
  unit: 'imperial' | 'metric';
  profileName: string;
  onClearData: () => void;
}

export default function ExportPanel({
  stations,
  macConfig,
  envelopeData,
  unit,
  profileName,
  onClearData
}: ExportPanelProps) {
  const summaries = WeightBalanceCalculator.calculateSummaries(stations);
  const validation = envelopeData ? WeightBalanceCalculator.validateLimits(envelopeData, macConfig) : null;

  const exportToPDF = async () => {
    try {
      // Dynamically import jsPDF to avoid SSR issues
      const { jsPDF } = await import('jspdf');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let yPosition = margin;

      // Helper functions
      const addText = (text: string, x: number, y: number, options: any = {}) => {
        doc.text(text, x, y, options);
      };

      const addLine = () => {
        yPosition += 8;
      };

      const addSection = (title: string) => {
        yPosition += 10;
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        addText(title, margin, yPosition);
        yPosition += 8;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
      };

      const checkPageBreak = (requiredSpace: number = 30) => {
        if (yPosition + requiredSpace > pageHeight - margin) {
          doc.addPage();
          yPosition = margin;
        }
      };

      // Title
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      addText('CALCULADORA DE PESO Y BALANCE', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Aircraft profile info
      doc.setFontSize(12);
      addText(`Perfil de Aeronave: ${profileName}`, margin, yPosition);
      yPosition += 8;
      addText(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, margin, yPosition);
      yPosition += 8;
      addText(`Unidades: ${unit === 'imperial' ? 'Imperial (lb/in)' : 'Métrico (kg/m)'}`, margin, yPosition);

      // Stations table
      addSection('ESTACIONES DE PESO');
      checkPageBreak(60);

      // Table headers
      const tableStartY = yPosition;
      const colWidths = [15, 60, 25, 25, 25, 30];
      const headers = ['ID', 'Descripción', 'Brazo', 'Peso', 'Momento', 'Tipo'];

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      let xPos = margin;

      headers.forEach((header, index) => {
        addText(header, xPos, yPosition);
        xPos += colWidths[index];
      });

      yPosition += 5;

      // Draw header line
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;

      // Table data
      doc.setFont('helvetica', 'normal');
      const nonZeroStations = stations.filter(station => (station.weight || 0) > 0);

      nonZeroStations.forEach(station => {
        checkPageBreak(10);
        xPos = margin;

        const moment = (station.weight || 0) * station.arm;
        const typeLabel = station.type === 'fuel' ? 'Combustible' :
                         station.type === 'landing_fuel' ? 'Comb.Aterrizaje' :
                         station.type === 'cargo' ? 'Carga' : 'Básico';

        const rowData = [
          station.id.toString(),
          station.description.substring(0, 25),
          station.arm.toFixed(3),
          (station.weight || 0).toFixed(1),
          WeightBalanceCalculator.formatMoment(moment),
          typeLabel
        ];

        rowData.forEach((data, index) => {
          addText(data, xPos, yPosition);
          xPos += colWidths[index];
        });

        yPosition += 5;
      });

      // Summary section
      addSection('RESUMEN DE CÁLCULOS');
      checkPageBreak(80);

      const weightUnit = unit === 'imperial' ? 'lb' : 'kg';
      const lengthUnit = unit === 'imperial' ? 'in' : 'm';

      // Summary data
      if (envelopeData) {
        const summaryData = [
          {
            label: 'Peso Vacío (ZFW)',
            weight: summaries.zfw.weight,
            cg: envelopeData.zfw.cg,
            mac: envelopeData.zfw.mac,
            inLimits: validation?.zfw || false
          },
          {
            label: 'Peso Despegue (TOW)',
            weight: summaries.tow.weight,
            cg: envelopeData.tow.cg,
            mac: envelopeData.tow.mac,
            inLimits: validation?.tow || false
          },
          {
            label: 'Peso Aterrizaje (LDW)',
            weight: summaries.ldw.weight,
            cg: envelopeData.ldw.cg,
            mac: envelopeData.ldw.mac,
            inLimits: validation?.ldw || false
          }
        ];

        const summaryHeaders = ['Configuración', 'Peso', 'CG', '%MAC', 'Estado'];
        const summaryColWidths = [40, 30, 30, 25, 35];

        doc.setFont('helvetica', 'bold');
        xPos = margin;
        summaryHeaders.forEach((header, index) => {
          addText(header, xPos, yPosition);
          xPos += summaryColWidths[index];
        });

        yPosition += 5;
        doc.line(margin, yPosition, pageWidth - margin, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        summaryData.forEach(item => {
          xPos = margin;

          const rowData = [
            item.label,
            `${item.weight.toFixed(1)} ${weightUnit}`,
            `${item.cg.toFixed(3)} ${lengthUnit}`,
            `${item.mac.toFixed(2)}%`,
            item.inLimits ? 'EN LÍMITES' : 'FUERA LÍMITES'
          ];

          rowData.forEach((data, index) => {
            const color = index === 4 && !item.inLimits ? [255, 0, 0] : [0, 0, 0];
            doc.setTextColor(color[0], color[1], color[2]);
            addText(data, xPos, yPosition);
            xPos += summaryColWidths[index];
          });

          doc.setTextColor(0, 0, 0);
          yPosition += 5;
        });
      }

      // MAC Configuration
      addSection('CONFIGURACIÓN MAC');
      checkPageBreak(40);

      addText(`Fórmula MAC: ${macConfig.formula}`, margin, yPosition);
      addLine();
      addText(`Límites MAC: ${macConfig.macMin}% - ${macConfig.macMax}%`, margin, yPosition);

      // Totals
      addSection('TOTALES');
      checkPageBreak(30);

      addText(`Peso Total: ${WeightBalanceCalculator.formatWeight(summaries.totals.weight, unit)}`, margin, yPosition);
      addLine();
      addText(`Momento Total: ${WeightBalanceCalculator.formatMoment(summaries.totals.moment)}`, margin, yPosition);
      addLine();
      addText(`ARM Total: ${summaries.totals.arm.toFixed(3)} ${lengthUnit}`, margin, yPosition);

      // Validation status
      if (validation) {
        addSection('ESTADO DE VALIDACIÓN');
        checkPageBreak(30);

        const overallStatus = validation.allInLimits ? 'DENTRO DE LÍMITES' : 'FUERA DE LÍMITES';
        const statusColor = validation.allInLimits ? [0, 128, 0] : [255, 0, 0];

        doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        doc.setFont('helvetica', 'bold');
        addText(`Estado General: ${overallStatus}`, margin, yPosition);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');

        if (!validation.allInLimits) {
          addLine();
          addText('⚠️ ADVERTENCIA: La aeronave está fuera de los límites de CG.', margin, yPosition);
          addLine();
          addText('Verifique la distribución de peso antes del vuelo.', margin, yPosition);
        }
      }

      // Footer
      const timestamp = new Date().toLocaleString('es-ES');
      doc.setFontSize(8);
      doc.text(`Generado el ${timestamp} por Calculadora de Peso y Balance`, pageWidth / 2, pageHeight - 10, { align: 'center' });

      // Save the PDF
      doc.save(`peso-balance-${profileName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error al generar el PDF. Por favor, inténtelo de nuevo.');
    }
  };

  const exportToJSON = () => {
    const data = {
      profileName,
      timestamp: new Date().toISOString(),
      unit,
      macConfig,
      stations: stations.filter(station => (station.weight || 0) > 0),
      summaries,
      envelopeData,
      validation
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peso-balance-${profileName.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const saveCalculation = async () => {
    try {
      const calculationData = {
        name: `${profileName} - ${new Date().toLocaleDateString('es-ES')}`,
        stations: stations.filter(station => (station.weight || 0) > 0),
        macConfig,
        unit,
        summary: {
          zfw: {
            weight: WeightBalanceCalculator.formatWeight(summaries.zfw.weight, unit),
            cg: WeightBalanceCalculator.formatLength(envelopeData?.zfw.cg || 0, unit)
          },
          tow: {
            weight: WeightBalanceCalculator.formatWeight(summaries.tow.weight, unit),
            cg: WeightBalanceCalculator.formatLength(envelopeData?.tow.cg || 0, unit)
          },
          ldw: {
            weight: WeightBalanceCalculator.formatWeight(summaries.ldw.weight, unit),
            cg: WeightBalanceCalculator.formatLength(envelopeData?.ldw.cg || 0, unit)
          }
        },
        timestamp: new Date().toISOString()
      };

      const response = await fetch('/api/calculations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculationData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Cálculo guardado exitosamente en la base de datos');
      } else {
        throw new Error(result.error || 'Error al guardar');
      }
    } catch (error) {
      console.error('Error saving calculation:', error);
      alert('Error al guardar el cálculo en la base de datos. Los datos se mantienen guardados localmente.');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold mb-4">Exportación y Datos</h3>

      {/* Export Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <button
          onClick={exportToPDF}
          className="calculator-button"
          disabled={!envelopeData}
        >
          📄 Exportar PDF
        </button>

        <button
          onClick={exportToJSON}
          className="calculator-button"
          disabled={!envelopeData}
        >
          💾 Exportar JSON
        </button>

        <button
          onClick={saveCalculation}
          className="calculator-button"
          disabled={!envelopeData}
        >
          🗄️ Guardar en BD
        </button>

        <button
          onClick={onClearData}
          className="calculator-button-secondary"
        >
          🗑️ Limpiar Todo
        </button>
      </div>

      {/* Quick Stats */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium mb-3">Resumen Rápido</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="font-medium text-gray-700">Estaciones Activas</div>
            <div>{stations.filter(s => (s.weight || 0) > 0).length} de {stations.length}</div>
          </div>

          <div>
            <div className="font-medium text-gray-700">Peso Total</div>
            <div>{WeightBalanceCalculator.formatWeight(summaries.totals.weight, unit)}</div>
          </div>

          <div>
            <div className="font-medium text-gray-700">Estado General</div>
            <div className={`status-indicator ${validation?.allInLimits ? 'in-limits' : 'out-of-limits'}`}>
              {validation?.allInLimits ? 'Dentro de límites' : 'Fuera de límites'}
            </div>
          </div>
        </div>

        {envelopeData && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <div className="font-medium">ZFW: {envelopeData.zfw.mac.toFixed(2)}% MAC</div>
                <div className="text-gray-600">Peso Vacío</div>
              </div>
              <div>
                <div className="font-medium">TOW: {envelopeData.tow.mac.toFixed(2)}% MAC</div>
                <div className="text-gray-600">Peso Despegue</div>
              </div>
              <div>
                <div className="font-medium">LDW: {envelopeData.ldw.mac.toFixed(2)}% MAC</div>
                <div className="text-gray-600">Peso Aterrizaje</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Data Management Info */}
      <div className="mt-4 text-sm text-gray-600">
        <p>
          💡 <strong>Tip:</strong> Los datos se guardan automáticamente en el navegador.
          Use las opciones de exportación para crear respaldos permanentes.
        </p>
      </div>
    </div>
  );
}