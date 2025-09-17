/* Weight & Balance Calculator - Data Storage */
/* LocalStorage management and data persistence */

import { STATIONS, macConfig, APP_STATE } from './config.js';

/**
 * Save application data to localStorage
 */
export function saveData() {
    try {
        const data = {
            weights: {},
            arms: {},
            macConfig: { ...macConfig },
            isMetric: APP_STATE.isMetric,
            customStationNames: {},
            cargoItems: [...APP_STATE.cargoItems],
            fuelTankPriorities: [...APP_STATE.fuelTankPriorities],
            timestamp: new Date().toISOString()
        };

        // Save weights and arms
        STATIONS.forEach((station, index) => {
            const stationNumber = index + 1;
            const weightInput = document.getElementById(`weight_${stationNumber}`);
            const armInput = document.getElementById(`arm_${stationNumber}`);

            if (weightInput) {
                data.weights[stationNumber] = parseFloat(weightInput.value) || 0;
            }
            if (armInput) {
                data.arms[stationNumber] = parseFloat(armInput.value) || station[1];
            }
        });

        // Save custom station names
        STATIONS.forEach((station, index) => {
            const stationNumber = index + 1;
            if (station[0] !== getOriginalStationName(stationNumber)) {
                data.customStationNames[stationNumber] = station[0];
            }
        });

        localStorage.setItem('weightBalanceData', JSON.stringify(data));
        console.log('Data saved to localStorage');
    } catch (error) {
        console.error('Error saving data:', error);
    }
}

/**
 * Load application data from localStorage
 */
export function loadData() {
    try {
        const savedData = localStorage.getItem('weightBalanceData');
        if (!savedData) return;

        const data = JSON.parse(savedData);

        // Load MAC configuration
        if (data.macConfig) {
            Object.assign(macConfig, data.macConfig);
            updateMacConfigInputs();
        }

        // Load unit preference
        if (typeof data.isMetric === 'boolean') {
            APP_STATE.isMetric = data.isMetric;
            const unitSwitch = document.getElementById('unitSwitch');
            if (unitSwitch) unitSwitch.checked = data.isMetric;
        }

        // Load custom station names
        if (data.customStationNames) {
            Object.entries(data.customStationNames).forEach(([stationNumber, name]) => {
                updateStationName(parseInt(stationNumber), name);
            });
        }

        // Load weights and arms
        if (data.weights) {
            Object.entries(data.weights).forEach(([stationNumber, weight]) => {
                const input = document.getElementById(`weight_${stationNumber}`);
                if (input) input.value = weight;
            });
        }

        if (data.arms) {
            Object.entries(data.arms).forEach(([stationNumber, arm]) => {
                const input = document.getElementById(`arm_${stationNumber}`);
                if (input) input.value = arm;
            });
        }

        // Load cargo items
        if (data.cargoItems) {
            APP_STATE.cargoItems = data.cargoItems;
        }

        // Load fuel tank priorities
        if (data.fuelTankPriorities) {
            APP_STATE.fuelTankPriorities = data.fuelTankPriorities;
        }

        console.log('Data loaded from localStorage');
    } catch (error) {
        console.error('Error loading data:', error);
    }
}

/**
 * Clear all saved data
 */
export function clearSavedData() {
    try {
        localStorage.removeItem('weightBalanceData');
        localStorage.removeItem('weightBalanceProfiles');
        localStorage.removeItem('weightBalanceHistory');
        console.log('All saved data cleared');
    } catch (error) {
        console.error('Error clearing data:', error);
    }
}

/**
 * Save calculation to history
 * @param {Object} calculationData - Current calculation data
 */
export function saveToHistory(calculationData) {
    try {
        const historyData = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            profileName: APP_STATE.currentProfile?.name || 'Custom Configuration',
            ...calculationData
        };

        let history = getHistory();
        history.unshift(historyData);

        // Keep only last 50 calculations
        if (history.length > 50) {
            history = history.slice(0, 50);
        }

        localStorage.setItem('weightBalanceHistory', JSON.stringify(history));
        console.log('Calculation saved to history');
    } catch (error) {
        console.error('Error saving to history:', error);
    }
}

/**
 * Get calculation history
 * @returns {Array} Array of historical calculations
 */
export function getHistory() {
    try {
        const history = localStorage.getItem('weightBalanceHistory');
        return history ? JSON.parse(history) : [];
    } catch (error) {
        console.error('Error loading history:', error);
        return [];
    }
}

/**
 * Clear calculation history
 */
export function clearHistory() {
    try {
        localStorage.removeItem('weightBalanceHistory');
        APP_STATE.history = [];
        console.log('History cleared');
    } catch (error) {
        console.error('Error clearing history:', error);
    }
}

/**
 * Save aircraft profiles
 * @param {Array} profiles - Array of aircraft profiles
 */
export function saveAircraftProfiles(profiles) {
    try {
        localStorage.setItem('weightBalanceProfiles', JSON.stringify(profiles));
        console.log('Aircraft profiles saved');
    } catch (error) {
        console.error('Error saving aircraft profiles:', error);
    }
}

/**
 * Load aircraft profiles
 * @returns {Array} Array of saved aircraft profiles
 */
export function loadAircraftProfiles() {
    try {
        const profiles = localStorage.getItem('weightBalanceProfiles');
        return profiles ? JSON.parse(profiles) : [];
    } catch (error) {
        console.error('Error loading aircraft profiles:', error);
        return [];
    }
}

/**
 * Export all data as JSON
 * @returns {Object} Complete application data
 */
export function exportData() {
    try {
        return {
            version: '1.0.0',
            exportDate: new Date().toISOString(),
            currentData: JSON.parse(localStorage.getItem('weightBalanceData') || '{}'),
            profiles: JSON.parse(localStorage.getItem('weightBalanceProfiles') || '[]'),
            history: JSON.parse(localStorage.getItem('weightBalanceHistory') || '[]'),
            theme: localStorage.getItem('weightBalanceTheme') || 'dark'
        };
    } catch (error) {
        console.error('Error exporting data:', error);
        return null;
    }
}

/**
 * Import data from JSON
 * @param {Object} importData - Data to import
 * @returns {boolean} Success status
 */
export function importData(importData) {
    try {
        if (!importData || typeof importData !== 'object') {
            throw new Error('Invalid import data format');
        }

        // Import current data
        if (importData.currentData) {
            localStorage.setItem('weightBalanceData', JSON.stringify(importData.currentData));
        }

        // Import profiles
        if (importData.profiles) {
            localStorage.setItem('weightBalanceProfiles', JSON.stringify(importData.profiles));
        }

        // Import history
        if (importData.history) {
            localStorage.setItem('weightBalanceHistory', JSON.stringify(importData.history));
        }

        // Import theme
        if (importData.theme) {
            localStorage.setItem('weightBalanceTheme', importData.theme);
        }

        console.log('Data imported successfully');
        return true;
    } catch (error) {
        console.error('Error importing data:', error);
        return false;
    }
}

/**
 * Update MAC configuration inputs in the UI
 */
function updateMacConfigInputs() {
    const formulaInput = document.getElementById('macFormula');
    const macMinInput = document.getElementById('macMin');
    const macMaxInput = document.getElementById('macMax');

    if (formulaInput) formulaInput.value = macConfig.formula;
    if (macMinInput) macMinInput.value = macConfig.macMin;
    if (macMaxInput) macMaxInput.value = macConfig.macMax;
}

/**
 * Update station name in the STATIONS array
 * @param {number} stationNumber - Station number to update
 * @param {string} newName - New station name
 */
function updateStationName(stationNumber, newName) {
    const index = stationNumber - 1;
    if (index >= 0 && index < STATIONS.length) {
        STATIONS[index][0] = newName;
    }
}

/**
 * Get original station name for comparison
 * @param {number} stationNumber - Station number
 * @returns {string} Original station name
 */
function getOriginalStationName(stationNumber) {
    const originalStations = [
        "Basic Aircraft", "Crew (2)", "Crew's Baggage", "Steward's Equipment",
        "Emergency Equipment", "Extra Equipment", "Potable Water", "Cargo",
        "Other", "Other", "Fuel Tank InBoard", "Fuel Tank OutBoard", "Landing Fuel (Est.)"
    ];

    return originalStations[stationNumber - 1] || `Station ${stationNumber}`;
}

/**
 * Get storage usage information
 * @returns {Object} Storage usage statistics
 */
export function getStorageInfo() {
    try {
        const data = exportData();
        const dataSize = JSON.stringify(data).length;
        const quota = 5 * 1024 * 1024; // 5MB typical localStorage quota

        return {
            usedBytes: dataSize,
            totalQuota: quota,
            usedPercentage: (dataSize / quota * 100).toFixed(2),
            itemCounts: {
                profiles: data.profiles.length,
                historyEntries: data.history.length
            }
        };
    } catch (error) {
        console.error('Error getting storage info:', error);
        return null;
    }
}