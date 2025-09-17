'use client';

import React, { useRef, useEffect, useState } from 'react';
import { EnvelopeData, MacConfig } from '@/types';

interface EnvelopeGraphProps {
  envelopeData: EnvelopeData;
  macConfig: MacConfig;
  unit: 'imperial' | 'metric';
}

export default function EnvelopeGraph({ envelopeData, macConfig, unit }: EnvelopeGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [viewMode, setViewMode] = useState<'cg' | 'mac'>('mac');

  useEffect(() => {
    drawGraph();
  }, [envelopeData, macConfig, unit, viewMode]);

  const drawGraph = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = rect.width;
    const height = rect.height;

    // Clear canvas
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    // Graph margins
    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const graphWidth = width - margin.left - margin.right;
    const graphHeight = height - margin.top - margin.bottom;

    // Determine data ranges
    const weights = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight];
    const minWeight = Math.min(...weights) * 0.9;
    const maxWeight = Math.max(...weights) * 1.1;

    let yValues: number[];
    let yLabel: string;
    let minY: number;
    let maxY: number;

    if (viewMode === 'mac') {
      yValues = [envelopeData.zfw.mac, envelopeData.tow.mac, envelopeData.ldw.mac];
      yLabel = '%MAC';
      minY = Math.min(macConfig.macMin - 5, Math.min(...yValues) - 2);
      maxY = Math.max(macConfig.macMax + 5, Math.max(...yValues) + 2);
    } else {
      yValues = [envelopeData.zfw.cg, envelopeData.tow.cg, envelopeData.ldw.cg];
      yLabel = `CG (${unit === 'imperial' ? 'in' : 'm'})`;
      minY = Math.min(...yValues) * 0.95;
      maxY = Math.max(...yValues) * 1.05;
    }

    // Helper functions
    const scaleX = (weight: number) => margin.left + ((weight - minWeight) / (maxWeight - minWeight)) * graphWidth;
    const scaleY = (y: number) => margin.top + ((maxY - y) / (maxY - minY)) * graphHeight;

    // Draw grid
    ctx.strokeStyle = '#e5e7eb';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const weight = minWeight + (maxWeight - minWeight) * (i / 10);
      const x = scaleX(weight);
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + graphHeight);
      ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = minY + (maxY - minY) * (i / 10);
      const yPos = scaleY(y);
      ctx.beginPath();
      ctx.moveTo(margin.left, yPos);
      ctx.lineTo(margin.left + graphWidth, yPos);
      ctx.stroke();
    }

    // Draw limit lines (only in MAC mode)
    if (viewMode === 'mac') {
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);

      // MAC min line
      const minMacY = scaleY(macConfig.macMin);
      ctx.beginPath();
      ctx.moveTo(margin.left, minMacY);
      ctx.lineTo(margin.left + graphWidth, minMacY);
      ctx.stroke();

      // MAC max line
      const maxMacY = scaleY(macConfig.macMax);
      ctx.beginPath();
      ctx.moveTo(margin.left, maxMacY);
      ctx.lineTo(margin.left + graphWidth, maxMacY);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Draw axes
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top + graphHeight);
    ctx.lineTo(margin.left + graphWidth, margin.top + graphHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + graphHeight);
    ctx.stroke();

    // Draw data points
    const points = [
      { weight: envelopeData.zfw.weight, y: viewMode === 'mac' ? envelopeData.zfw.mac : envelopeData.zfw.cg, label: 'ZFW', color: '#10b981' },
      { weight: envelopeData.tow.weight, y: viewMode === 'mac' ? envelopeData.tow.mac : envelopeData.tow.cg, label: 'TOW', color: '#3b82f6' },
      { weight: envelopeData.ldw.weight, y: viewMode === 'mac' ? envelopeData.ldw.mac : envelopeData.ldw.cg, label: 'LDW', color: '#f59e0b' }
    ];

    points.forEach(point => {
      const x = scaleX(point.weight);
      const y = scaleY(point.y);

      // Draw point
      ctx.fillStyle = point.color;
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, 2 * Math.PI);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#374151';
      ctx.font = '12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x, y - 15);
    });

    // Draw connecting line
    ctx.strokeStyle = '#6b7280';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
      const x = scaleX(point.weight);
      const y = scaleY(point.y);
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Draw labels
    ctx.fillStyle = '#374151';
    ctx.font = '14px Inter, sans-serif';

    // X-axis label
    ctx.textAlign = 'center';
    ctx.fillText(`Peso (${unit === 'imperial' ? 'lb' : 'kg'})`, margin.left + graphWidth / 2, height - 10);

    // Y-axis label
    ctx.save();
    ctx.translate(20, margin.top + graphHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();

    // Title
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Gráfico de Envolvente - Vista ${viewMode === 'mac' ? '%MAC' : 'CG'}`, width / 2, 25);

    // Draw axis values
    ctx.font = '10px Inter, sans-serif';
    ctx.fillStyle = '#6b7280';

    // X-axis values
    ctx.textAlign = 'center';
    for (let i = 0; i <= 5; i++) {
      const weight = minWeight + (maxWeight - minWeight) * (i / 5);
      const x = scaleX(weight);
      ctx.fillText(Math.round(weight).toString(), x, margin.top + graphHeight + 15);
    }

    // Y-axis values
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
      const y = minY + (maxY - minY) * (i / 5);
      const yPos = scaleY(y);
      ctx.fillText(y.toFixed(1), margin.left - 10, yPos + 4);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Gráfico de Envolvente CG</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('mac')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'mac' ? 'calculator-button' : 'calculator-button-secondary'
            }`}
          >
            Vista %MAC
          </button>
          <button
            onClick={() => setViewMode('cg')}
            className={`px-3 py-1 text-sm rounded ${
              viewMode === 'cg' ? 'calculator-button' : 'calculator-button-secondary'
            }`}
          >
            Vista CG
          </button>
        </div>
      </div>

      <div className="relative">
        <canvas
          ref={canvasRef}
          className="envelope-graph w-full h-96"
          style={{ width: '100%', height: '384px' }}
        />
      </div>

      {/* Legend */}
      <div className="mt-4 flex justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span>ZFW (Peso Vacío)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>TOW (Peso Despegue)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
          <span>LDW (Peso Aterrizaje)</span>
        </div>
        {viewMode === 'mac' && (
          <div className="flex items-center gap-2">
            <div className="w-3 h-0.5 bg-red-600" style={{ borderTop: '2px dashed' }}></div>
            <span>Límites MAC</span>
          </div>
        )}
      </div>
    </div>
  );
}