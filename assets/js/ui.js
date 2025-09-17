/* Weight & Balance Calculator - UI Management */
/* User interface functions and DOM manipulation */

import { STATIONS, macConfig, APP_STATE } from './config.js';
import {
    getStationData,
    calculateEnvelopeData,
    validateLimits,
    formatMoment,
    validateFormula,
    evaluateFormula
} from './calculations.js';
import { saveData, loadData } from './storage.js';

/**
 * Populate the station table with current data
 */
export function populateStationTable() {
    const tbody = document.getElementById('stationTableBody');
    if (!tbody) return;

    tbody.innerHTML = '';

    STATIONS.forEach((station, index) => {
        const row = document.createElement('tr');
        const [description, arm, type] = station;
        const stationNumber = index + 1;

        row.innerHTML = `
            <td>${stationNumber}</td>
            <td class="station-desc">${description}</td>
            <td>
                <input type="number"
                       id="weight_${stationNumber}"
                       class="weight-input"
                       value="0"
                       step="0.1"
                       onchange="window.WeightBalance.validateWeightInput(${stationNumber}); window.WeightBalance.saveData(); window.WeightBalance.recalculate()"
                       oninput="window.WeightBalance.validateWeightInput(${stationNumber}); window.WeightBalance.saveData(); window.WeightBalance.recalculate()">
            </td>
            <td>
                <input type="number"
                       id="arm_${stationNumber}"
                       value="${arm}"
                       step="0.01"
                       onchange="window.WeightBalance.recalculate()"
                       oninput="window.WeightBalance.recalculate()">
            </td>
            <td class="moment-cell" id="moment_${stationNumber}">0.00</td>
        `;

        tbody.appendChild(row);
    });
}

/**
 * Setup event listeners for the application
 */
export function setupEventListeners() {
    const unitSwitch = document.getElementById('unitSwitch');
    const themeSwitch = document.getElementById('themeSwitch');

    if (unitSwitch) {
        unitSwitch.addEventListener('change', window.WeightBalance.toggleUnits);
    }
    if (themeSwitch) {
        themeSwitch.addEventListener('change', window.WeightBalance.toggleTheme);
    }
}

/**
 * Toggle MAC configuration display
 */
export function toggleMacConfig() {
    const toggle = document.getElementById('macToggle');
    const config = document.getElementById('macConfig');

    if (!toggle || !config) return;

    APP_STATE.macConfigCollapsed = !APP_STATE.macConfigCollapsed;

    if (APP_STATE.macConfigCollapsed) {
        config.style.display = 'none';
        toggle.classList.add('collapsed');
    } else {
        config.style.display = 'grid';
        toggle.classList.remove('collapsed');
    }
}

/**
 * Validate and update MAC formula
 */
export function validateAndUpdateFormula() {
    const formulaInput = document.getElementById('macFormula');
    const statusDiv = document.getElementById('formulaStatus');

    if (!formulaInput || !statusDiv) return;

    const formula = formulaInput.value.trim();
    const validation = validateFormula(formula);

    if (validation.isValid) {
        // Formula is valid
        macConfig.formula = formula;
        statusDiv.style.background = '#d4edda';
        statusDiv.style.color = '#155724';

        const testCG = 240;
        const testResult = evaluateFormula(formula, testCG);
        statusDiv.textContent = `✓ Formula valid. Test: CG=${testCG} → %MAC=${testResult.toFixed(2)}%`;

        // Update display
        updateMacFormulaDisplay();
        window.WeightBalance.recalculate();
    } else {
        // Formula is invalid
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.color = '#721c24';
        statusDiv.textContent = `✗ Invalid formula: ${validation.error}`;
    }
}

/**
 * Update MAC formula display
 */
export function updateMacFormulaDisplay() {
    const formulaDisplay = document.getElementById('macFormulaDisplay');
    if (formulaDisplay) {
        formulaDisplay.textContent = `Current: %MAC = ${macConfig.formula}`;
    }
}

/**
 * Update MAC limits from input fields
 */
export function updateMacLimits() {
    const macMinInput = document.getElementById('macMin');
    const macMaxInput = document.getElementById('macMax');
    const rangeDisplay = document.getElementById('macRangeDisplay');

    if (macMinInput) macConfig.macMin = parseFloat(macMinInput.value) || 16;
    if (macMaxInput) macConfig.macMax = parseFloat(macMaxInput.value) || 30;

    if (rangeDisplay) {
        rangeDisplay.textContent = `${macConfig.macMin}% ≤ %MAC ≤ ${macConfig.macMax}%`;
    }

    window.WeightBalance.recalculate();
}

/**
 * Reset MAC configuration to defaults
 */
export function resetMacDefaults() {
    const formulaInput = document.getElementById('macFormula');
    const macMinInput = document.getElementById('macMin');
    const macMaxInput = document.getElementById('macMax');

    if (formulaInput) formulaInput.value = "20 + ((CG - 232.28) / 86.22) * 100";
    if (macMinInput) macMinInput.value = 16;
    if (macMaxInput) macMaxInput.value = 30;

    validateAndUpdateFormula();
    updateMacLimits();
}

/**
 * Test formula with user input
 */
export function testFormula() {
    const formulaInput = document.getElementById('macFormula');
    if (!formulaInput) return;

    const formula = formulaInput.value.trim();
    const testCG = prompt('Enter a test CG value to test the formula:', '240');

    if (testCG === null) return;

    const cgValue = parseFloat(testCG);
    if (isNaN(cgValue)) {
        alert('Please enter a valid number for CG.');
        return;
    }

    try {
        const result = evaluateFormula(formula, cgValue);
        alert(`Test Result:\nCG = ${cgValue}\n%MAC = ${result.toFixed(4)}%\n\nFormula: ${formula}`);
    } catch (error) {
        alert(`Error testing formula:\n${error.message}`);
    }
}

/**
 * Validate weight input and apply visual feedback
 * @param {number} stationNumber - Station number to validate
 */
export function validateWeightInput(stationNumber) {
    const input = document.getElementById(`weight_${stationNumber}`);
    if (!input) return;

    const weight = parseFloat(input.value) || 0;

    // Remove existing validation classes
    input.classList.remove('out-of-limits');

    // Basic validation
    if (weight < 0) {
        input.classList.add('out-of-limits');
        showAlert('Weight cannot be negative', 'error');
    } else if (weight > 20000) { // Reasonable maximum
        input.classList.add('out-of-limits');
        showAlert('Weight seems unusually high', 'warning');
    }
}

/**
 * Show alert banner
 * @param {string} message - Alert message
 * @param {string} type - Alert type ('success', 'warning', 'error')
 */
export function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.alert-banner');
    existingAlerts.forEach(alert => alert.remove());

    // Create new alert
    const alert = document.createElement('div');
    alert.className = `alert-banner ${type}`;
    alert.textContent = message;

    document.body.appendChild(alert);

    // Auto-remove after 3 seconds
    setTimeout(() => {
        alert.classList.add('hiding');
        setTimeout(() => alert.remove(), 500);
    }, 3000);
}

/**
 * Update summary displays
 * @param {Object} envelopeData - Calculated envelope data
 * @param {Object} summaries - Calculated summaries
 * @param {Object} validation - Validation results
 */
export function updateSummaryDisplays(envelopeData, summaries, validation) {
    // Update ZFW summary
    updateSummaryBox('zfw', envelopeData.zfw, validation.zfw);

    // Update TOW summary
    updateSummaryBox('tow', envelopeData.tow, validation.tow);

    // Update LDW summary
    updateSummaryBox('ldw', envelopeData.ldw, validation.ldw);

    // Update totals
    updateTotalsDisplay(summaries.totals);

    // Update moments in table
    updateMomentsInTable();
}

/**
 * Update individual summary box
 * @param {string} type - Summary type ('zfw', 'tow', 'ldw')
 * @param {Object} data - Data for this summary
 * @param {boolean} inLimits - Whether this configuration is within limits
 */
function updateSummaryBox(type, data, inLimits) {
    const weightElement = document.getElementById(`${type}Weight`);
    const cgElement = document.getElementById(`${type}CG`);
    const macElement = document.getElementById(`${type}MAC`);
    const summaryBox = document.getElementById(`${type}Summary`);

    if (weightElement) {
        const unit = APP_STATE.isMetric ? 'kg' : 'lb';
        weightElement.textContent = `${data.weight.toFixed(1)} ${unit}`;
    }

    if (cgElement) {
        const unit = APP_STATE.isMetric ? 'm' : 'in';
        const decimals = APP_STATE.isMetric ? 4 : 3;
        cgElement.textContent = `${data.cg.toFixed(decimals)} ${unit}`;
        cgElement.className = inLimits ? 'cg-ok' : 'cg-warning';
    }

    if (macElement) {
        macElement.textContent = `${data.mac.toFixed(2)}%`;
        macElement.className = inLimits ? 'cg-ok' : 'cg-warning';
    }

    if (summaryBox) {
        if (inLimits) {
            summaryBox.classList.remove('out-of-limits');
        } else {
            summaryBox.classList.add('out-of-limits');
        }
    }
}

/**
 * Update totals display
 * @param {Object} totals - Total calculations
 */
function updateTotalsDisplay(totals) {
    const totalWeightElement = document.getElementById('totalWeight');
    const totalMomentElement = document.getElementById('totalMoment');
    const totalArmElement = document.getElementById('totalARM');

    if (totalWeightElement) {
        const unit = APP_STATE.isMetric ? 'kg' : 'lb';
        totalWeightElement.textContent = `${totals.weight.toFixed(1)} ${unit}`;
    }

    if (totalMomentElement) {
        totalMomentElement.textContent = formatMoment(totals.moment);
    }

    if (totalArmElement) {
        const unit = APP_STATE.isMetric ? 'm' : 'in';
        totalArmElement.textContent = `${totals.arm.toFixed(3)} ${unit}`;
    }
}

/**
 * Update moment values in the station table
 */
function updateMomentsInTable() {
    const stationData = getStationData();

    stationData.forEach(station => {
        const momentElement = document.getElementById(`moment_${station.number}`);
        if (momentElement) {
            momentElement.textContent = formatMoment(station.moment);
        }
    });
}

/**
 * Toggle between imperial and metric units
 */
export function toggleUnits() {
    APP_STATE.isMetric = !APP_STATE.isMetric;

    // Update unit labels in the UI
    updateUnitLabels();

    // Recalculate and update displays
    window.WeightBalance.recalculate();

    // Save preference
    saveData();
}

/**
 * Update unit labels throughout the UI
 */
function updateUnitLabels() {
    const weightUnit = APP_STATE.isMetric ? 'kg' : 'lb';
    const lengthUnit = APP_STATE.isMetric ? 'm' : 'in';

    // Update table headers
    const headers = document.querySelectorAll('th');
    headers.forEach(header => {
        if (header.textContent.includes('Weight')) {
            header.textContent = `Weight (${weightUnit})`;
        } else if (header.textContent.includes('Arm')) {
            header.textContent = `Arm (${lengthUnit})`;
        }
    });
}

/**
 * Toggle application theme
 */
export function toggleTheme() {
    document.body.classList.toggle('light-mode');

    // Save theme preference
    const isLightMode = document.body.classList.contains('light-mode');
    localStorage.setItem('weightBalanceTheme', isLightMode ? 'light' : 'dark');
}

/**
 * Initialize theme from saved preference
 */
export function initializeTheme() {
    const savedTheme = localStorage.getItem('weightBalanceTheme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        const themeSwitch = document.getElementById('themeSwitch');
        if (themeSwitch) themeSwitch.checked = true;
    }
}