/* Weight & Balance Calculator - Main Application */
/* Main application logic and coordination */

import { APP_STATE, macConfig, STATIONS } from './config.js';
import {
    getStationData,
    calculateEnvelopeData,
    validateLimits,
    calculateSummaries
} from './calculations.js';
import {
    populateStationTable,
    setupEventListeners,
    toggleMacConfig,
    validateAndUpdateFormula,
    updateMacFormulaDisplay,
    updateMacLimits,
    resetMacDefaults,
    testFormula,
    validateWeightInput,
    showAlert,
    updateSummaryDisplays,
    toggleUnits,
    toggleTheme,
    initializeTheme
} from './ui.js';
import { saveData, loadData, clearSavedData, saveToHistory } from './storage.js';

/**
 * Initialize the application
 */
function init() {
    console.log('Initializing Weight & Balance Calculator...');

    // Initialize theme first
    initializeTheme();

    // Load saved data
    loadData();

    // Setup UI
    populateStationTable();
    setupEventListeners();
    validateAndUpdateFormula();
    updateMacFormulaDisplay();
    updateMacLimits();

    // Setup envelope graph
    setupEnvelopeGraph();

    // Initial calculation
    recalculate();

    // Start with MAC config collapsed
    toggleMacConfig();

    console.log('Application initialized successfully');
}

/**
 * Main calculation function - recalculates everything
 */
function recalculate() {
    try {
        const stationData = getStationData();
        const summaries = calculateSummaries(stationData);
        const envelopeData = calculateEnvelopeData(stationData, APP_STATE.isMetric);
        const validation = validateLimits(envelopeData);

        // Store envelope data for graph
        APP_STATE.envelopeData = envelopeData;

        // Update UI displays
        updateSummaryDisplays(envelopeData, summaries, validation);

        // Update envelope graph
        drawEnvelopeGraph();

        // Show alerts for out-of-limits conditions
        if (!validation.allInLimits) {
            const outOfLimitsConfigs = [];
            if (!validation.zfw) outOfLimitsConfigs.push('ZFW');
            if (!validation.tow) outOfLimitsConfigs.push('TOW');
            if (!validation.ldw) outOfLimitsConfigs.push('LDW');

            showAlert(`⚠️ Out of limits: ${outOfLimitsConfigs.join(', ')}`, 'warning');
        }

    } catch (error) {
        console.error('Error in recalculate:', error);
        showAlert('Calculation error occurred', 'error');
    }
}

/**
 * Setup envelope graph canvas and context
 */
function setupEnvelopeGraph() {
    const canvas = document.getElementById('envelopeCanvas');
    if (!canvas) return;

    APP_STATE.envelopeCanvas = canvas;
    APP_STATE.envelopeCtx = canvas.getContext('2d');

    // Set canvas size
    const container = canvas.parentElement;
    if (container) {
        canvas.width = container.clientWidth - 40;
        canvas.height = 200;
    }

    // Setup view mode buttons
    setupGraphControls();

    // Initial draw
    drawEnvelopeGraph();
}

/**
 * Setup envelope graph control buttons
 */
function setupGraphControls() {
    const cgWeightBtn = document.getElementById('cgWeightView');
    const macWeightBtn = document.getElementById('macWeightView');

    if (cgWeightBtn) {
        cgWeightBtn.addEventListener('click', () => {
            APP_STATE.envelopeViewMode = 'cg-weight';
            updateGraphButtons();
            drawEnvelopeGraph();
        });
    }

    if (macWeightBtn) {
        macWeightBtn.addEventListener('click', () => {
            APP_STATE.envelopeViewMode = 'mac-weight';
            updateGraphButtons();
            drawEnvelopeGraph();
        });
    }

    updateGraphButtons();
}

/**
 * Update graph control buttons appearance
 */
function updateGraphButtons() {
    const cgWeightBtn = document.getElementById('cgWeightView');
    const macWeightBtn = document.getElementById('macWeightView');

    if (cgWeightBtn && macWeightBtn) {
        cgWeightBtn.classList.toggle('btn-primary', APP_STATE.envelopeViewMode === 'cg-weight');
        cgWeightBtn.classList.toggle('btn-secondary', APP_STATE.envelopeViewMode !== 'cg-weight');

        macWeightBtn.classList.toggle('btn-primary', APP_STATE.envelopeViewMode === 'mac-weight');
        macWeightBtn.classList.toggle('btn-secondary', APP_STATE.envelopeViewMode !== 'mac-weight');
    }
}

/**
 * Draw the envelope graph
 */
function drawEnvelopeGraph() {
    const canvas = APP_STATE.envelopeCanvas;
    const ctx = APP_STATE.envelopeCtx;

    if (!canvas || !ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const { envelopeData } = APP_STATE;
    if (!envelopeData) return;

    // Graph dimensions
    const padding = 40;
    const graphWidth = canvas.width - 2 * padding;
    const graphHeight = canvas.height - 2 * padding;

    // Data ranges
    const weights = [envelopeData.zfw.weight, envelopeData.tow.weight, envelopeData.ldw.weight];
    const maxWeight = Math.max(...weights, 1000);
    const minWeight = Math.min(...weights, 0);

    let yValues, yLabel;
    if (APP_STATE.envelopeViewMode === 'mac-weight') {
        yValues = [envelopeData.zfw.mac, envelopeData.tow.mac, envelopeData.ldw.mac];
        yLabel = '%MAC';
    } else {
        yValues = [envelopeData.zfw.cg, envelopeData.tow.cg, envelopeData.ldw.cg];
        yLabel = `CG (${APP_STATE.isMetric ? 'm' : 'in'})`;
    }

    const maxY = Math.max(...yValues, macConfig.macMax || 30);
    const minY = Math.min(...yValues, macConfig.macMin || 15);

    // Scaling functions
    const scaleX = (weight) => padding + (weight - minWeight) / (maxWeight - minWeight) * graphWidth;
    const scaleY = (y) => canvas.height - padding - (y - minY) / (maxY - minY) * graphHeight;

    // Draw grid
    drawGrid(ctx, canvas, padding, graphWidth, graphHeight, minWeight, maxWeight, minY, maxY);

    // Draw MAC limits if in MAC view
    if (APP_STATE.envelopeViewMode === 'mac-weight') {
        drawMacLimits(ctx, canvas, padding, graphWidth, scaleY);
    }

    // Draw data points and lines
    drawDataPoints(ctx, envelopeData, scaleX, scaleY, yValues);

    // Draw labels
    drawLabels(ctx, canvas, padding, graphWidth, graphHeight, yLabel);
}

/**
 * Draw grid lines on the graph
 */
function drawGrid(ctx, canvas, padding, graphWidth, graphHeight, minWeight, maxWeight, minY, maxY) {
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;

    // Vertical grid lines
    for (let i = 0; i <= 5; i++) {
        const weight = minWeight + (maxWeight - minWeight) * i / 5;
        const x = padding + (graphWidth * i / 5);
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, padding + graphHeight);
        ctx.stroke();
    }

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
        const y = padding + (graphHeight * i / 5);
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(padding + graphWidth, y);
        ctx.stroke();
    }

    // Draw axes
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;

    // X-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding + graphHeight);
    ctx.lineTo(padding + graphWidth, padding + graphHeight);
    ctx.stroke();

    // Y-axis
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, padding + graphHeight);
    ctx.stroke();
}

/**
 * Draw MAC limit lines
 */
function drawMacLimits(ctx, canvas, padding, graphWidth, scaleY) {
    ctx.strokeStyle = '#ff4444';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);

    // MAC min line
    const minY = scaleY(macConfig.macMin);
    ctx.beginPath();
    ctx.moveTo(padding, minY);
    ctx.lineTo(padding + graphWidth, minY);
    ctx.stroke();

    // MAC max line
    const maxY = scaleY(macConfig.macMax);
    ctx.beginPath();
    ctx.moveTo(padding, maxY);
    ctx.lineTo(padding + graphWidth, maxY);
    ctx.stroke();

    ctx.setLineDash([]);
}

/**
 * Draw data points and connecting lines
 */
function drawDataPoints(ctx, envelopeData, scaleX, scaleY, yValues) {
    const points = [
        { data: envelopeData.zfw, label: 'ZFW', color: '#4CAF50', y: yValues[0] },
        { data: envelopeData.tow, label: 'TOW', color: '#2196F3', y: yValues[1] },
        { data: envelopeData.ldw, label: 'LDW', color: '#FF9800', y: yValues[2] }
    ];

    // Draw connecting line
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 2;
    ctx.beginPath();
    points.forEach((point, index) => {
        const x = scaleX(point.data.weight);
        const y = scaleY(point.y);
        if (index === 0) {
            ctx.moveTo(x, y);
        } else {
            ctx.lineTo(x, y);
        }
    });
    ctx.stroke();

    // Draw points
    points.forEach(point => {
        const x = scaleX(point.data.weight);
        const y = scaleY(point.y);

        // Draw point
        ctx.fillStyle = point.color;
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();

        // Draw label
        ctx.fillStyle = '#333';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(point.label, x, y - 15);
    });
}

/**
 * Draw axis labels
 */
function drawLabels(ctx, canvas, padding, graphWidth, graphHeight, yLabel) {
    ctx.fillStyle = '#333';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';

    // X-axis label
    const weightUnit = APP_STATE.isMetric ? 'kg' : 'lb';
    ctx.fillText(`Weight (${weightUnit})`, padding + graphWidth / 2, canvas.height - 10);

    // Y-axis label
    ctx.save();
    ctx.translate(15, padding + graphHeight / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(yLabel, 0, 0);
    ctx.restore();
}

/**
 * Export current calculation to PDF
 */
function exportToPDF() {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Get current data
        const stationData = getStationData();
        const summaries = calculateSummaries(stationData);
        const envelopeData = calculateEnvelopeData(stationData, APP_STATE.isMetric);
        const validation = validateLimits(envelopeData);

        // PDF content generation
        generatePDFContent(doc, stationData, summaries, envelopeData, validation);

        // Save PDF
        const filename = `weight-balance-${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(filename);

        showAlert('PDF exported successfully', 'success');
    } catch (error) {
        console.error('Error exporting PDF:', error);
        showAlert('Error exporting PDF', 'error');
    }
}

/**
 * Generate PDF content
 */
function generatePDFContent(doc, stationData, summaries, envelopeData, validation) {
    let yPosition = 20;

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('WEIGHT & BALANCE CALCULATION', 105, yPosition, { align: 'center' });
    yPosition += 20;

    // Aircraft info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const profileName = APP_STATE.currentProfile?.name || 'Custom Configuration';
    doc.text(`Aircraft: ${profileName}`, 20, yPosition);
    yPosition += 10;
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 20, yPosition);
    yPosition += 10;
    const unitSystem = APP_STATE.isMetric ? 'Metric (kg/m)' : 'Imperial (lb/in)';
    doc.text(`Units: ${unitSystem}`, 20, yPosition);
    yPosition += 20;

    // Station data table
    doc.setFont('helvetica', 'bold');
    doc.text('STATION DATA', 20, yPosition);
    yPosition += 10;

    const tableData = stationData.filter(station => station.weight > 0);
    tableData.forEach(station => {
        doc.setFont('helvetica', 'normal');
        const line = `${station.number}. ${station.description}: ${station.weight} ${APP_STATE.isMetric ? 'kg' : 'lb'} @ ${station.arm} ${APP_STATE.isMetric ? 'm' : 'in'}`;
        doc.text(line, 20, yPosition);
        yPosition += 7;
    });

    yPosition += 10;

    // Summary
    doc.setFont('helvetica', 'bold');
    doc.text('SUMMARY', 20, yPosition);
    yPosition += 10;

    const weightUnit = APP_STATE.isMetric ? 'kg' : 'lb';
    const lengthUnit = APP_STATE.isMetric ? 'm' : 'in';

    doc.setFont('helvetica', 'normal');
    doc.text(`ZFW: ${envelopeData.zfw.weight.toFixed(1)} ${weightUnit}, CG: ${envelopeData.zfw.cg.toFixed(3)} ${lengthUnit}, MAC: ${envelopeData.zfw.mac.toFixed(2)}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`TOW: ${envelopeData.tow.weight.toFixed(1)} ${weightUnit}, CG: ${envelopeData.tow.cg.toFixed(3)} ${lengthUnit}, MAC: ${envelopeData.tow.mac.toFixed(2)}%`, 20, yPosition);
    yPosition += 7;
    doc.text(`LDW: ${envelopeData.ldw.weight.toFixed(1)} ${weightUnit}, CG: ${envelopeData.ldw.cg.toFixed(3)} ${lengthUnit}, MAC: ${envelopeData.ldw.mac.toFixed(2)}%`, 20, yPosition);
    yPosition += 15;

    // Validation status
    doc.setFont('helvetica', 'bold');
    const status = validation.allInLimits ? 'WITHIN LIMITS' : 'OUT OF LIMITS';
    const statusColor = validation.allInLimits ? [0, 128, 0] : [255, 0, 0];
    doc.setTextColor(...statusColor);
    doc.text(`Status: ${status}`, 20, yPosition);
    doc.setTextColor(0, 0, 0);

    // MAC config
    yPosition += 20;
    doc.setFont('helvetica', 'bold');
    doc.text('MAC CONFIGURATION', 20, yPosition);
    yPosition += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Formula: ${macConfig.formula}`, 20, yPosition);
    yPosition += 7;
    doc.text(`Limits: ${macConfig.macMin}% - ${macConfig.macMax}%`, 20, yPosition);
}

// Create global namespace for functions that need to be called from HTML
window.WeightBalance = {
    // Core functions
    init,
    recalculate,

    // UI functions
    validateWeightInput,
    toggleUnits,
    toggleTheme,
    toggleMacConfig,
    validateAndUpdateFormula,
    updateMacLimits,
    resetMacDefaults,
    testFormula,

    // Storage functions
    saveData,
    loadData,
    clearSavedData,

    // Export functions
    exportToPDF
};

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}

// Export for module usage
export {
    init,
    recalculate,
    setupEnvelopeGraph,
    drawEnvelopeGraph,
    exportToPDF
};