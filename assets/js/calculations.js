/* Weight & Balance Calculator - Core Calculations */
/* Mathematical functions for weight, balance, and MAC calculations */

import { CONSTANTS, macConfig, STATIONS } from './config.js';

const { MOMENT_DIVISOR, IN_TO_M, LB_TO_KG } = CONSTANTS;

/**
 * Safely evaluate a MAC formula with a given CG value
 * @param {string} formula - The MAC formula containing CG variable
 * @param {number} cgValue - The center of gravity value
 * @returns {number} The calculated MAC percentage
 */
export function evaluateFormula(formula, cgValue) {
    // Replace CG with the actual value
    let expression = formula.replace(/CG/gi, cgValue.toString());

    // Basic security check - only allow numbers, operators, parentheses, and decimal points
    if (!/^[0-9+\-*/().\s]+$/.test(expression)) {
        throw new Error('Formula contains invalid characters');
    }

    // Evaluate the expression safely
    try {
        return Function('"use strict"; return (' + expression + ')')();
    } catch (e) {
        throw new Error('Mathematical error in formula');
    }
}

/**
 * Calculate MAC percentage from center of gravity
 * @param {number} cg - Center of gravity value
 * @param {boolean} isMetric - Whether values are in metric units
 * @returns {number} MAC percentage
 */
export function calculateMacPercentage(cg, isMetric = false) {
    try {
        const cgValue = isMetric ? cg / IN_TO_M : cg;
        return evaluateFormula(macConfig.formula, cgValue);
    } catch (error) {
        console.error('Error calculating MAC percentage:', error);
        return 0;
    }
}

/**
 * Get current station data with calculated moments
 * @returns {Array} Array of station objects with weights, arms, and moments
 */
export function getStationData() {
    return STATIONS.map((station, index) => {
        const stationNumber = index + 1;
        const weightInput = document.getElementById(`weight_${stationNumber}`);
        const armInput = document.getElementById(`arm_${stationNumber}`);

        const weight = weightInput ? parseFloat(weightInput.value) || 0 : 0;
        const arm = armInput ? parseFloat(armInput.value) || 0 : station[1];
        const moment = weight * arm;

        return {
            number: stationNumber,
            description: station[0],
            type: station[2],
            weight,
            arm,
            moment
        };
    });
}

/**
 * Calculate summaries for ZFW, TOW, and LDW
 * @param {Array} stationData - Array of station data objects
 * @returns {Object} Summary object with ZFW, TOW, LDW calculations
 */
export function calculateSummaries(stationData) {
    let zfwWeight = 0, zfwMoment = 0;
    let fuelWeight = 0, fuelMoment = 0;
    let landingFuelWeight = 0, landingFuelMoment = 0;
    let totalWeight = 0, totalMoment = 0;
    let totalArm = 0;

    stationData.forEach(station => {
        const moment = station.weight * station.arm;

        // Accumulate weights and moments
        if (station.type !== 'landing_fuel') {
            totalWeight += station.weight;
            totalMoment += moment;
        }

        // Calculate total ARM (sum of all arms with weight > 0)
        if (station.weight > 0) {
            totalArm += station.arm;
        }

        if (station.type === 'fuel') {
            fuelWeight += station.weight;
            fuelMoment += moment;
        } else if (station.type === 'landing_fuel') {
            landingFuelWeight = station.weight;
            landingFuelMoment = moment;
        } else {
            zfwWeight += station.weight;
            zfwMoment += moment;
        }
    });

    return {
        zfw: { weight: zfwWeight, moment: zfwMoment },
        tow: { weight: zfwWeight + fuelWeight, moment: zfwMoment + fuelMoment },
        ldw: { weight: zfwWeight + landingFuelWeight, moment: zfwMoment + landingFuelMoment },
        totals: { weight: totalWeight, moment: totalMoment, arm: totalArm }
    };
}

/**
 * Calculate envelope data for ZFW, TOW, and LDW
 * @param {Array} stationData - Array of station data objects
 * @param {boolean} isMetric - Whether to use metric units
 * @returns {Object} Envelope data with CG, weight, and MAC for each configuration
 */
export function calculateEnvelopeData(stationData, isMetric = false) {
    const summaries = calculateSummaries(stationData);

    const calculatePoint = (weight, moment) => {
        let cg = 0, mac = 0;
        if (weight > 0) {
            cg = moment / weight;
            mac = calculateMacPercentage(cg, isMetric);
        }
        return { cg, weight, mac };
    };

    return {
        zfw: calculatePoint(summaries.zfw.weight, summaries.zfw.moment),
        tow: calculatePoint(summaries.tow.weight, summaries.tow.moment),
        ldw: calculatePoint(summaries.ldw.weight, summaries.ldw.moment)
    };
}

/**
 * Validate if envelope data is within MAC limits
 * @param {Object} envelopeData - Envelope data object
 * @returns {Object} Validation results for each configuration
 */
export function validateLimits(envelopeData) {
    const zfwInLimits = envelopeData.zfw.mac >= macConfig.macMin && envelopeData.zfw.mac <= macConfig.macMax;
    const towInLimits = envelopeData.tow.mac >= macConfig.macMin && envelopeData.tow.mac <= macConfig.macMax;
    const ldwInLimits = envelopeData.ldw.mac >= macConfig.macMin && envelopeData.ldw.mac <= macConfig.macMax;

    return {
        zfw: zfwInLimits,
        tow: towInLimits,
        ldw: ldwInLimits,
        allInLimits: zfwInLimits && towInLimits && ldwInLimits
    };
}

/**
 * Convert units between imperial and metric
 * @param {number} value - Value to convert
 * @param {string} fromUnit - Source unit system ('imperial' or 'metric')
 * @param {string} toUnit - Target unit system ('imperial' or 'metric')
 * @param {string} type - Type of measurement ('weight' or 'length')
 * @returns {number} Converted value
 */
export function convertUnits(value, fromUnit, toUnit, type) {
    if (fromUnit === toUnit) return value;

    if (type === 'weight') {
        return fromUnit === 'imperial' ? value * LB_TO_KG : value / LB_TO_KG;
    } else {
        return fromUnit === 'imperial' ? value * IN_TO_M : value / IN_TO_M;
    }
}

/**
 * Format weight for display
 * @param {number} weight - Weight value
 * @param {boolean} isMetric - Whether to use metric units
 * @returns {string} Formatted weight string
 */
export function formatWeight(weight, isMetric = false) {
    const unit = isMetric ? 'kg' : 'lb';
    return `${weight.toFixed(1)} ${unit}`;
}

/**
 * Format length for display
 * @param {number} length - Length value
 * @param {boolean} isMetric - Whether to use metric units
 * @returns {string} Formatted length string
 */
export function formatLength(length, isMetric = false) {
    const unit = isMetric ? 'm' : 'in';
    const decimals = isMetric ? 4 : 3;
    return `${length.toFixed(decimals)} ${unit}`;
}

/**
 * Format moment for display
 * @param {number} moment - Moment value
 * @returns {string} Formatted moment string
 */
export function formatMoment(moment) {
    return (moment / MOMENT_DIVISOR).toFixed(2);
}

/**
 * Calculate CG from MAC percentage (reverse calculation)
 * @param {number} macPercent - MAC percentage
 * @returns {number|null} Calculated CG or null if calculation fails
 */
export function calculateCGFromMac(macPercent) {
    try {
        const formula = macConfig.formula;

        // For simple linear formulas like "a + ((CG - b) / c) * d = macPercent"
        // We can solve for CG
        if (formula.includes('((CG') && formula.includes(') /')) {
            const parts = formula.match(/([\\d\\.]+)\\s*\\+\\s*\\(\\(CG\\s*-\\s*([\\d\\.]+)\\)\\s*\\/\\s*([\\d\\.]+)\\)\\s*\\*\\s*([\\d\\.]+)/);
            if (parts) {
                const a = parseFloat(parts[1]);
                const b = parseFloat(parts[2]);
                const c = parseFloat(parts[3]);
                const d = parseFloat(parts[4]);

                // Solve: a + ((CG - b) / c) * d = macPercent
                // CG = ((macPercent - a) * c / d) + b
                return ((macPercent - a) * c / d) + b;
            }
        }
    } catch (e) {
        console.error('Error calculating CG from MAC:', e);
    }
    return null;
}

/**
 * Validate weight input value
 * @param {number} weight - Weight to validate
 * @param {number} maxWeight - Maximum allowed weight
 * @returns {Object} Validation result
 */
export function validateWeight(weight, maxWeight = 20000) {
    if (weight < 0) {
        return { isValid: false, error: 'Weight cannot be negative' };
    }
    if (weight > maxWeight) {
        return { isValid: false, error: `Weight exceeds maximum allowed (${maxWeight})` };
    }
    return { isValid: true };
}

/**
 * Validate formula syntax and functionality
 * @param {string} formula - Formula to validate
 * @returns {Object} Validation result with error message if invalid
 */
export function validateFormula(formula) {
    try {
        // Test the formula with a sample CG value
        const testCG = 240;
        const testResult = evaluateFormula(formula, testCG);

        if (isNaN(testResult) || !isFinite(testResult)) {
            return { isValid: false, error: 'Formula produces invalid result' };
        }

        return { isValid: true };
    } catch (error) {
        return { isValid: false, error: error.message };
    }
}