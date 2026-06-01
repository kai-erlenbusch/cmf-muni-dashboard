import { state } from '../state.js';
import { formatMetricValue, higherIsBetter, neutralMetrics, metricDescriptions } from './details.js';
import { METRIC_META } from '../metric_meta.js';
import { resetMapView, flyToDistrict, highlightSelected } from './map.js';
import { scaleColors, getPercentageForValue } from '../utils/colors.js';
import { FACTSHEET_URLS, getFactsheetUrl } from '../factsheet_urls.js';

let tableSortState = {
    proceeds: { col: null, dir: 'asc' },
    issuers: { col: null, dir: 'asc' },
    health: { col: null, dir: 'asc' }
};

const unsortedIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; opacity:0.9; vertical-align:middle; margin-top:-2px;"><polyline points="7 15 12 20 17 15"></polyline><polyline points="7 9 12 4 17 9"></polyline></svg>`;
const ascIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; margin-top:-2px;"><path d="M12 19V5M5 12l7-7 7 7"/></svg>`;
const descIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="margin-left:4px; vertical-align:middle; margin-top:-2px;"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>`;

const getSortIcon = (table, col) => {
    const sCol = tableSortState[table].col;
    if (table === 'issuers' && !sCol && col === 'INVESTMENT') return descIcon;
    if (table === 'health' && !sCol && col === 'Metric') return ascIcon;
    if (table === 'proceeds' && !sCol && col === 'CATEGORY') return ascIcon;
    
    if (sCol !== col) return unsortedIcon;
    return tableSortState[table].dir === 'asc' ? ascIcon : descIcon;
};

const METRIC_METADATA = {
  // Clinical Care
  "Dental_Care": { name: "Dental Care", domain: "Clinical Care", better: "higher" },
  "Designated_Primary_Care_Shortage_Area": { name: "Primary Care Shortage Area", domain: "Clinical Care", better: "lower" },
  "Medicaid_Enrollment": { name: "Medicaid Enrollment", domain: "Clinical Care", better: "lower" },
  "Prenatal_Care": { name: "Prenatal Care", domain: "Clinical Care", better: "higher" },
  "Routine_Checkup,_18+": { name: "Routine Checkup, 18+", domain: "Clinical Care", better: "higher" },
  "Uninsured": { name: "Uninsured", domain: "Clinical Care", better: "lower" },

  // Health Behavior
  "Binge_Drinking": { name: "Binge Drinking", domain: "Health Behavior", better: "lower" },
  "Physical_Inactivity": { name: "Physical Inactivity", domain: "Health Behavior", better: "lower" },
  "Smoking": { name: "Smoking", domain: "Health Behavior", better: "lower" },
  "Teen_Births": { name: "Teen Births", domain: "Health Behavior", better: "lower" },

  // Health Outcomes
  "Breast_Cancer_Deaths": { name: "Breast Cancer Deaths", domain: "Health Outcomes", better: "lower" },
  "Cardiovascular_Disease_Deaths": { name: "Cardiovascular Disease Deaths", domain: "Health Outcomes", better: "lower" },
  "Colorectal_Cancer_Deaths": { name: "Colorectal Cancer Deaths", domain: "Health Outcomes", better: "lower" },
  "Diabetes": { name: "Diabetes", domain: "Health Outcomes", better: "lower" },
  "Firearm_Homicides": { name: "Firearm Homicides", domain: "Health Outcomes", better: "lower" },
  "Firearm_Suicides": { name: "Firearm Suicides", domain: "Health Outcomes", better: "lower" },
  "Frequent_Mental_Distress": { name: "Frequent Mental Distress", domain: "Health Outcomes", better: "lower" },
  "Frequent_Physical_Distress": { name: "Frequent Physical Distress", domain: "Health Outcomes", better: "lower" },
  "High_Blood_Pressure": { name: "High Blood Pressure", domain: "Health Outcomes", better: "lower" },
  "Independent_Living_Difficulty": { name: "Independent Living Difficulty", domain: "Health Outcomes", better: "lower" },
  "Life_Expectancy": { name: "Life Expectancy", domain: "Health Outcomes", better: "higher" },
  "Low_Birthweight": { name: "Low Birthweight", domain: "Health Outcomes", better: "lower" },
  "Obesity": { name: "Obesity", domain: "Health Outcomes", better: "lower" },
  "Opioid_Overdose_Deaths": { name: "Opioid Overdose Deaths", domain: "Health Outcomes", better: "lower" },
  "Premature_Deaths_(All_Causes)": { name: "Premature Deaths", domain: "Health Outcomes", better: "lower" },

  // Environment
  "Air_Pollution___Ozone": { name: "Air Pollution - Ozone", domain: "Environment", better: "lower" },
  "Air_Pollution___Particulate_Matter": { name: "Air Pollution - PM2.5", domain: "Environment", better: "lower" },
  "Housing_with_Potential_Lead_Risk": { name: "Housing with Potential Lead Risk", domain: "Environment", better: "lower" },
  "Lead_Exposure_Risk_Index": { name: "Lead Exposure Risk Index", domain: "Environment", better: "lower" },

  // Socio-Economic Factors
  "Broadband_Connection": { name: "Broadband Connection", domain: "Socio-Economic Factors", better: "higher" },
  "Children_in_Poverty": { name: "Children in Poverty", domain: "Socio-Economic Factors", better: "lower" },
  "Chronic_Absenteeism": { name: "Chronic Absenteeism", domain: "Socio-Economic Factors", better: "lower" },
  "Food_Insecurity": { name: "Food Insecurity", domain: "Socio-Economic Factors", better: "lower" },
  "High_School_Completion": { name: "High School Completion", domain: "Socio-Economic Factors", better: "higher" },
  "Income_Inequality": { name: "Income Inequality", domain: "Socio-Economic Factors", better: "lower" },
  "Neighborhood_Racial/Ethnic_Segregation": { name: "Neighborhood Segregation", domain: "Socio-Economic Factors", better: "neutral" },
  "Racial/Ethnic_Diversity": { name: "Racial/Ethnic Diversity", domain: "Socio-Economic Factors", better: "neutral" },
  "Rent_Burden": { name: "Rent Burden", domain: "Socio-Economic Factors", better: "lower" },
  "SNAP_Participation": { name: "SNAP Participation", domain: "Socio-Economic Factors", better: "lower" },
  "Unemployment": { name: "Unemployment", domain: "Socio-Economic Factors", better: "lower" },
  "Youth_Not_in_Work_or_School": { name: "Youth Not in Work or School", domain: "Socio-Economic Factors", better: "lower" }
};

const METRIC_DESCRIPTIONS_SHORT = {
  "Air_Pollution___Ozone": "was the average daily maximum concentration of ozone throughout a month.",
  "Air_Pollution___Particulate_Matter": "was the average daily concentration of fine particulate matter (PM2.5) throughout a month.",
  "Binge_Drinking": "of adults reported binge drinking in the past 30 days.",
  "Breast_Cancer_Deaths": "people died from breast cancer.",
  "Broadband_Connection": "of households had high speed broadband internet connection.",
  "Cardiovascular_Disease_Deaths": "people died from cardiovascular disease.",
  "Children_in_Poverty": "of children were living in poverty.",
  "Chronic_Absenteeism": "of public school students were chronically absent.",
  "Colorectal_Cancer_Deaths": "people died from colorectal cancer.",
  "Diabetes": "of adults reported having diabetes.",
  "Firearm_Homicides": "people died by firearm homicide.",
  "Firearm_Suicides": "people died by firearm suicide.",
  "Frequent_Mental_Distress": "of adults reported frequent mental distress.",
  "Frequent_Physical_Distress": "of adults reported frequent physical distress.",
  "High_Blood_Pressure": "of adults reported having high blood pressure.",
  "Independent_Living_Difficulty": "of adults reported difficulty living independently.",
  "Life_Expectancy": "was the estimated life expectancy at birth.",
  "Low_Birthweight": "of live births were low birthweight.",
  "Obesity": "of adults had a BMI ≥30 kg/m².",
  "Opioid_Overdose_Deaths": "people died from opioid overdose.",
  "Premature_Deaths_(All_Causes)": "years of potential life were lost before age 75 per 100,000 people.",
  "Housing_with_Potential_Lead_Risk": "of housing had potential elevated lead risk.",
  "Lead_Exposure_Risk_Index": "was the estimated lead exposure risk index score (out of 10).",
  "Dental_Care": "of adults reported visiting a dentist in the past year.",
  "Designated_Primary_Care_Shortage_Area": "of the population was living in a primary care shortage area.",
  "Medicaid_Enrollment": "of the population was enrolled in Medicaid.",
  "Prenatal_Care": "of births began prenatal care in the first trimester.",
  "Routine_Checkup,_18+": "of adults reported visiting a doctor for a routine checkup in the past year.",
  "Uninsured": "of the population under 65 did not have health insurance.",
  "Food_Insecurity": "of adults reported not having enough food.",
  "High_School_Completion": "of adults had a high school diploma equivalent or higher.",
  "Income_Inequality": "was the estimated income inequality score (-100 to 100).",
  "Neighborhood_Racial/Ethnic_Segregation": "was the estimated neighborhood segregation score (out of 100).",
  "Racial/Ethnic_Diversity": "was the estimated racial/ethnic diversity score (out of 100).",
  "Rent_Burden": "of households experienced high rent burden.",
  "SNAP_Participation": "of households participated in SNAP.",
  "Unemployment": "of the labor force was unemployed.",
  "Youth_Not_in_Work_or_School": "of youth aged 16-19 were neither working nor in school.",
  "Physical_Inactivity": "of adults reported physical inactivity in the past 30 days.",
  "Smoking": "of adults reported current cigarette smoking.",
  "Teen_Births": "births per 1,000 females aged 15-19."
};

// Helper to safely get metric value, resolving period keys like __Total__2022
function getMetricValue(d, baseKey) {
    if (baseKey in d) return parseFloat(d[baseKey]);
    const keys = Object.keys(d).filter(k => k.startsWith(baseKey + '__Total'));
    if (keys.length > 0) {
        // Sort descending so the latest year is first
        keys.sort((a,b) => b.localeCompare(a));
        return parseFloat(d[keys[0]]);
    }
    return NaN;
}

// Calculate global stats (mean and stdev) for all metrics once
let globalMetricStats = null;

function calculateGlobalStats() {
    if (globalMetricStats) return globalMetricStats;
    globalMetricStats = {};
    
    const allMetrics = Object.keys(METRIC_METADATA);
    
    allMetrics.forEach(metric => {
        let values = [];
        state.metricsData.forEach(d => {
            const v = getMetricValue(d, metric);
            if (!isNaN(v) && v !== -999) {
                values.push(v);
            }
        });
        
        if (values.length > 0) {
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
            const stdev = Math.sqrt(variance);
            globalMetricStats[metric] = { mean, stdev };
        }
    });
    
    return globalMetricStats;
}

function getUSComparisonIndicator(metric, value, stats, districtName) {
    if (!stats || !stats[metric] || isNaN(value) || value === -999) {
        return `<div class="us-comparison-cell"><span class="indicator-text" style="color:var(--text-secondary)">No Data</span></div>`;
    }
    
    const { mean, stdev } = stats[metric];
    const { better } = METRIC_METADATA[metric];
    
    const isAbove = value > mean + stdev;
    const isBelow = value < mean - stdev;
    
    let status = 'average'; // within 1 stdev
    
    if (better === 'higher') {
        if (isAbove) status = 'better';
        else if (isBelow) status = 'worse';
    } else if (better === 'lower') {
        if (isBelow) status = 'better';
        else if (isAbove) status = 'worse';
    } else {
        // Neutral
        if (isAbove) status = 'above';
        else if (isBelow) status = 'below';
        else status = 'average';
    }
    
    const distText = districtName || "The district";
    const usAvgText = formatMetricValue(mean, metric);
    const tooltipHtml = `<span class="glass-tooltip" style="font-size: 13px;">U.S. Average:<br>${usAvgText}</span>`;
    
    if (better === 'neutral') {
        return `<div class="us-comparison-cell" style="display:flex; align-items:flex-start; gap:8px;">
            <div class="indicator-icon indicator-average" style="margin-top:4px;"></div>
            <span class="indicator-text" style="color:var(--text-primary); font-size:12px; line-height:1.4; white-space:normal;">${distText} is <span class="glass-tooltip-container"><strong class="average" style="text-decoration:underline; color:var(--accent-amber, #ffb347);">around the U.S. average</strong>${tooltipHtml}</span> for this metric.</span>
        </div>`;
    }

    if (status === 'better') {
        return `<div class="us-comparison-cell" style="display:flex; align-items:flex-start; gap:8px;">
            <div class="indicator-icon indicator-better" style="margin-top:4px;"></div>
            <span class="indicator-text" style="color:var(--text-primary); font-size:12px; line-height:1.4; white-space:normal;">${distText} is <span class="glass-tooltip-container"><strong class="better" style="text-decoration:underline; color:var(--accent-emerald, #00c897);">better than the U.S. average</strong>${tooltipHtml}</span> for this metric.</span>
        </div>`;
    } else if (status === 'worse') {
        return `<div class="us-comparison-cell" style="display:flex; align-items:flex-start; gap:8px;">
            <div class="indicator-icon indicator-worse" style="margin-top:4px;"></div>
            <span class="indicator-text" style="color:var(--text-primary); font-size:12px; line-height:1.4; white-space:normal;">${distText} is <span class="glass-tooltip-container"><strong class="worse" style="text-decoration:underline; color:var(--accent-coral, #ff6b6b);">worse than the U.S. average</strong>${tooltipHtml}</span> for this metric.</span>
        </div>`;
    } else {
        return `<div class="us-comparison-cell" style="display:flex; align-items:flex-start; gap:8px;">
            <div class="indicator-icon indicator-average" style="margin-top:4px;"></div>
            <span class="indicator-text" style="color:var(--text-primary); font-size:12px; line-height:1.4; white-space:normal;">${distText} is <span class="glass-tooltip-container"><strong class="average" style="text-decoration:underline; color:var(--accent-amber, #ffb347);">around the U.S. average</strong>${tooltipHtml}</span> for this metric.</span>
        </div>`;
    }
}

export function updateInsights() {
    if (state.activeView !== 'insights') return;
    
    const insightsContainer = document.querySelector('.insights-body');
    if (!insightsContainer) return;
    
    const stats = calculateGlobalStats();
    
    const allDistricts = [...state.metricsData].sort((a,b) => (a.District_Name || '').localeCompare(b.District_Name || ''));
    
    const stateDistrictMap = {};
    allDistricts.forEach(d => {
        const match = d.District_Name.match(/^(.*?)\s+(\d+(?:st|nd|rd|th)|0th|At-Large)$/i);
        const stateName = match ? match[1] : d.District_Name;
        const districtSuffix = match ? match[2] : '';
        if (!stateDistrictMap[stateName]) stateDistrictMap[stateName] = [];
        if (districtSuffix) {
             stateDistrictMap[stateName].push({ suffix: districtSuffix, full: d.District_Name });
        } else {
             stateDistrictMap[stateName].push({ suffix: 'All', full: d.District_Name });
        }
    });
    const allStates = Object.keys(stateDistrictMap).sort();

    const renderGlassControl = (side, selectedDistrict) => {
        let displayLabel = selectedDistrict || "Select District...";
        return `
            <div class="hybrid-control-bar" style="display: flex; gap: 10px; padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.2);">
                <button class="glass-menu-trigger" data-side="${side}" style="flex: 1;">
                    <span>${displayLabel}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="opacity:0.5"><polyline points="6 9 12 15 18 9"></polyline></svg>
                </button>
                <div class="search-container" style="flex: 1;">
                    <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                    <input type="text" class="glass-input insights-search-input" data-side="${side}" placeholder="Search district..." value="">
                    <div class="autocomplete-dropdown" id="autocomplete-${side}"></div>
                </div>
            </div>
        `;
    };

    let leftDistrictData = null;
    let rightDistrictData = null;

    if (state.insightsLeftDistrict) {
        leftDistrictData = state.metricsData.find(d => d.District_Name === state.insightsLeftDistrict || d.GEOID === state.insightsLeftDistrict);
    }
    if (state.insightsRightDistrict) {
        rightDistrictData = state.metricsData.find(d => d.District_Name === state.insightsRightDistrict || d.GEOID === state.insightsRightDistrict);
    }
    
    // Fallbacks if for some reason they weren't set but selectedDistrict is
    if (!leftDistrictData && state.selectedDistrict) {
        leftDistrictData = state.metricsData.find(d => d.District_Name === state.selectedDistrict || d.GEOID === state.selectedDistrict);
    }
    if (!rightDistrictData && state.selectedDistrict) {
        rightDistrictData = state.metricsData.find(d => d.District_Name === state.selectedDistrict || d.GEOID === state.selectedDistrict);
    }

    let leftTarget = state.insightsLeftDistrict || state.selectedDistrict;
    let rightTarget = state.insightsRightDistrict || state.selectedDistrict;

    // --- Render Left Panel: Municipal Bonds ---
    const renderLeftPanel = (districtData) => {
        if (!districtData) {
            return `
                <div class="insights-panel-header">
                    <h3>Municipal Bonds</h3>
                    <p>Tax-exempt municipal bonds are a crucial tool that state and local governments use to finance public infrastructure.</p>
                </div>
                <div class="insights-panel-content" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; color:var(--text-secondary); text-align:center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px; height:48px; margin-bottom:16px; opacity:0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                    <p>Select a congressional district above to view bond insights.</p>
                </div>
                <div class="insights-source" style="margin-top: auto; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--glass-border);">
                    <strong>Municipal Bond Data From:</strong> <a href="https://munifinance.uchicago.edu/congressional/" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Center for Municipal Finance</a> at the UChicago, provided by <a href="https://www.ice.com/fixed-income-data-services/ice-climate-analytics-for-municipal-debt" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Intercontinental Exchange, Inc. (ICE)</a>. Data current as of January 23, 2025.
                </div>
            `;
        }
        
        const districtName = districtData.District_Name || `District ${districtData.GEOID}`;
        
        const activeMetricKey = state.activeBondMetric || 'Total_Inv_Value';
        let activeMetricName = activeMetricKey.replace(/_/g, ' ');
        if (activeMetricKey === 'Total_Inv_Value') activeMetricName = 'Total Investment Value';
        if (activeMetricKey === 'Total_Issuers') activeMetricName = 'Total Issuers';
        if (activeMetricKey === 'Small_Borrowers') activeMetricName = 'Small Borrowers';
        if (activeMetricKey === 'Sub_State_Inv_Value') activeMetricName = 'Sub-State Investment';
        if (activeMetricKey === 'Sub_State_Sav_Value') activeMetricName = 'District Taxpayer Savings';
        if (activeMetricKey === 'Small_Borrowers_Pct') activeMetricName = 'Small Borrowers Percent (%)';

        const leftTabs = [
            { id: 'Bond Metrics', label: `${activeMetricName} ▼`, hasMenu: true },
            { id: 'Use of Proceeds', label: 'Use of Proceeds', hasMenu: false },
            { id: 'Top Issuers', label: 'Top Issuers', hasMenu: false }
        ];

        if (!leftTabs.some(t => t.id === state.activeInsightsLeftTab)) {
            state.activeInsightsLeftTab = 'Bond Metrics';
        }
        
        const tabsHtml = leftTabs.map(t => {
            const dataMenu = t.hasMenu ? ' data-menu="bond-metrics"' : '';
            return `<button class="insights-tab ${t.id === state.activeInsightsLeftTab ? 'active' : ''}" data-side="left" data-tab="${t.id}"${dataMenu}>${t.label}</button>`;
        }).join('');
        
        let contentHtml = '';
        const getUnit = (u, def) => (u && u != '-999' && String(u).trim() !== '') ? u : def;
        const subStateInv = districtData.Sub_State_Inv_Value ? `$${districtData.Sub_State_Inv_Value} ${getUnit(districtData.Sub_State_Inv_Unit, 'billion')}` : 'N/A';
        const totalInv = districtData.Total_Inv_Value ? `$${districtData.Total_Inv_Value} ${getUnit(districtData.Total_Inv_Unit, 'billion')}` : 'N/A';
        const subStateSav = districtData.Sub_State_Sav_Value ? `$${districtData.Sub_State_Sav_Value} ${getUnit(districtData.Sub_State_Sav_Unit, 'million')}` : 'N/A';
        const totalSav = districtData.Total_Sav_Value ? `$${districtData.Total_Sav_Value} ${getUnit(districtData.Total_Sav_Unit, 'million')}` : 'N/A';
        
        const totalIssuers = districtData.Total_Issuers || '0';
        const smallBorrowers = districtData.Small_Borrowers || '0';
        const smallBorrowersPct = districtData.Small_Borrowers_Pct && districtData.Small_Borrowers_Pct != '-999' ? `${districtData.Small_Borrowers_Pct}%` : 'N/A';
        
        let sName = districtName;
        const nameParts = districtName.split(' ');
        if (nameParts.length > 1 && /^\d+(st|nd|rd|th|at-Large)?$/.test(nameParts[nameParts.length - 1])) {
            nameParts.pop();
            sName = nameParts.join(' ');
        }
        
        let overviewHtml = `
            <div class="insights-summary-text" style="padding: 16px; padding-top: 0; padding-bottom: 0;">
                <p style="margin-bottom: 12px; line-height: 1.5;">Sub-state governments in the ${districtName} have invested at least <strong>${subStateInv}</strong> in projects financed by active tax-exempt municipal bonds. Including ${sName} state government projects, that total investment is <strong>${totalInv}</strong>. District taxpayers saved at least an estimated <strong>${subStateSav}</strong> on sub-state projects financed with tax-exempt municipal bonds since 1998. Including state government investments, the total savings was <strong>${totalSav}</strong>. In the ${districtName}, a total of <strong>${totalIssuers}</strong> sub-state governments have active tax-exempt municipal bonds. Of them, <strong>${smallBorrowers}</strong> have less than $30 million of active bonds. These smaller, less frequent borrowers represent <strong>${smallBorrowersPct}</strong> of the District's total sub-state borrowers.</p>
            </div>
        `;

        if (state.activeInsightsLeftTab === 'Use of Proceeds') {
            let proceedsHtml = '<tr><td colspan="3" style="text-align:center; color:var(--text-secondary);">No proceeds data available</td></tr>';
            try {
                let pData = districtData.Proceeds_Data;
                if (typeof pData === 'string') pData = JSON.parse(pData.replace(/""/g, '"'));
                
                if (pData && Array.isArray(pData) && pData.length > 0) {
                    const sCol = tableSortState.proceeds.col || 'CATEGORY';
                    const sDir = tableSortState.proceeds.col ? tableSortState.proceeds.dir : 'asc';
                    pData.sort((a, b) => {
                        let valA = sCol === 'INVESTMENT' ? (parseFloat(a.Amount) || 0) : (a.Category || 'Other');
                        let valB = sCol === 'INVESTMENT' ? (parseFloat(b.Amount) || 0) : (b.Category || 'Other');
                        if (valA < valB) return sDir === 'asc' ? -1 : 1;
                        if (valA > valB) return sDir === 'asc' ? 1 : -1;
                        return 0;
                    });
                    proceedsHtml = pData.map((row, idx) => {
                        const catName = row.Category || 'Other';
                        const val = parseFloat(row.Amount) || 0;
                        const fVal = '$' + val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
                        const isChecked = idx === 0 ? 'checked' : '';
                        return `<tr style="cursor: pointer;" onclick="const radio = this.querySelector('input[type=\\'radio\\']'); if(radio) radio.checked = true;">
                            <td style="text-align:center; width:40px;">
                                <input type="radio" name="proceeds-metric" value="${catName}" ${isChecked} style="accent-color: var(--accent-cyan); cursor: pointer;">
                            </td>
                            <td>${catName}</td>
                            <td>${val > 0 ? fVal : '-'}</td>
                        </tr>`;
                    }).join('');
                }
            } catch(e) {
                console.warn('Error parsing proceeds data:', e);
            }
            
            contentHtml = `
                <div class="insights-table-wrapper" style="margin-bottom: 16px;">
                    <table class="insights-table">
                        <thead style="position: sticky; top: 0; z-index: 2; background: rgba(15, 20, 28, 0.95); backdrop-filter: blur(8px);">
                            <tr>
                                <th style="width: 40px; text-align: center;">Select</th>
                                <th class="sortable-th" data-table="proceeds" data-col="CATEGORY" style="cursor:pointer;">Category ${getSortIcon('proceeds', 'CATEGORY')}</th>
                                <th class="sortable-th" data-table="proceeds" data-col="INVESTMENT" style="cursor:pointer;">Investment ${getSortIcon('proceeds', 'INVESTMENT')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${proceedsHtml}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (state.activeInsightsLeftTab === 'Top Issuers') {
            let issuersHtml = '<tr><td colspan="2" style="text-align:center; color:var(--text-secondary);">No issuer data available</td></tr>';
            try {
                let jData = districtData.Jurisdiction_Data;
                if (typeof jData === 'string') jData = JSON.parse(jData.replace(/""/g, '"'));
                
                if (jData && Array.isArray(jData) && jData.length > 0) {
                    const sCol = tableSortState.issuers.col || 'INVESTMENT';
                    const sDir = tableSortState.issuers.col ? tableSortState.issuers.dir : 'desc';
                    jData.sort((a, b) => {
                        let valA = sCol === 'INVESTMENT' ? (parseFloat(a.Amount) || 0) : (a.Issuer || '');
                        let valB = sCol === 'INVESTMENT' ? (parseFloat(b.Amount) || 0) : (b.Issuer || '');
                        if (valA < valB) return sDir === 'asc' ? -1 : 1;
                        if (valA > valB) return sDir === 'asc' ? 1 : -1;
                        return 0;
                    });
                    issuersHtml = jData
                        .map(j => {
                            let fVal = j.Amount;
                            if (fVal > 1e9) fVal = '$' + (fVal/1e9).toFixed(1) + 'B';
                            else if (fVal > 1e6) fVal = '$' + (fVal/1e6).toFixed(1) + 'M';
                            else fVal = '$' + fVal.toLocaleString();
                            return `<tr><td>${j.Issuer}</td><td>${fVal}</td></tr>`;
                        })
                        .join('');
                }
            } catch(e) {
                console.warn('Error parsing jurisdiction data:', e);
            }
            
            contentHtml = `
                <div class="insights-table-wrapper" style="margin-bottom: 16px;">
                    <table class="insights-table">
                        <thead style="position: sticky; top: 0; z-index: 2; background: rgba(15, 20, 28, 0.95); backdrop-filter: blur(8px);">
                            <tr>
                                <th class="sortable-th" data-table="issuers" data-col="ISSUER" style="cursor:pointer;">Issuer ${getSortIcon('issuers', 'ISSUER')}</th>
                                <th class="sortable-th" data-table="issuers" data-col="INVESTMENT" style="cursor:pointer;">Investment ${getSortIcon('issuers', 'INVESTMENT')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${issuersHtml}
                        </tbody>
                    </table>
                </div>
            `;
        } else if (state.activeInsightsLeftTab === 'Bond Metrics') {
            const metric = state.activeBondMetric || 'Total_Inv_Value';
            const validData = state.metricsData.filter(d => {
                const v = parseFloat(d[metric]);
                return !isNaN(v) && v !== -999;
            });

            const sum = validData.reduce((acc, curr) => acc + parseFloat(curr[metric]), 0);
            const avg = validData.length > 0 ? sum / validData.length : 0;

            const distVal = formatMetricValue(parseFloat(districtData[metric]), metric);
            const avgVal = formatMetricValue(avg, metric);

            const metricNameDisplay = activeMetricName;

            const avgText = `Averaging across all congressional districts, the national average for <strong>${metricNameDisplay.toLowerCase()}</strong> was <strong>${avgVal}</strong>.`;
            overviewHtml = overviewHtml.replace('</p>', ` ${avgText}</p>`);

            const extent = state.getMetricExtent(metric) || [0, 100];
            const pct = extent[1] !== extent[0] ? ((parseFloat(districtData[metric]) - extent[0]) / (extent[1] - extent[0])) * 100 : 50;
            const clampedPct = Math.max(0, Math.min(100, pct));

            const minValStr = formatMetricValue(extent[0], metric, { includeUnit: false });
            const maxValStr = formatMetricValue(extent[1], metric, { includeUnit: false });
            const colors = scaleColors;

            let stateName = '';
            if (districtName) {
                let parts = districtName.split(' ');
                if (parts.length > 1) parts.pop();
                stateName = parts.join(' ');
            }

            let stateAvg = avg;
            if (stateName) {
                const stateData = validData.filter(d => (d.District_Name || "").startsWith(stateName));
                if (stateData.length > 0) {
                    const sum = stateData.reduce((acc, curr) => acc + parseFloat(curr[metric]), 0);
                    stateAvg = sum / stateData.length;
                }
            }

            const stateAvgFormattedVal = formatMetricValue(stateAvg, metric);
            const statePct = extent[1] !== extent[0] ? ((stateAvg - extent[0]) / (extent[1] - extent[0])) * 100 : 50;
            const clampedStatePct = Math.max(0, Math.min(100, statePct));
            
            const usPct = extent[1] !== extent[0] ? ((avg - extent[0]) / (extent[1] - extent[0])) * 100 : 50;
            const clampedUsPct = Math.max(0, Math.min(100, usPct));

            const colorsStr = colors.join(', ');
            const topPointerId = 'bond-insights-top-pointer';
            const topValueId = 'bond-insights-top-value';
            const topLabelId = 'bond-insights-top-label';
            const btnDistrictId = 'bond-insights-btn-district';
            const btnStateId = 'bond-insights-btn-state';

            const gradientHtml = `
            <div class="filter-group" style="margin-top: 0px; margin-bottom: 12px;">
                <div class="glass-panel" style="display: flex; padding: 2px; border-radius: 6px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border);">
                    <button id="${btnDistrictId}" class="toggle-btn active" style="flex: 1; border: none; background: rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 6px 0; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('${topPointerId}').style.left = '${clampedPct}%'; document.getElementById('${topValueId}').innerText = '${distVal}'; document.getElementById('${topLabelId}').innerText = 'District Average'; this.classList.add('active'); this.style.background = 'rgba(255, 255, 255, 0.1)'; this.style.color = '#fff'; document.getElementById('${btnStateId}').classList.remove('active'); document.getElementById('${btnStateId}').style.background = 'transparent'; document.getElementById('${btnStateId}').style.color = 'rgba(255, 255, 255, 0.5)';">District Average</button>
                    <button id="${btnStateId}" class="toggle-btn" style="flex: 1; border: none; background: transparent; border-radius: 4px; padding: 6px 0; color: rgba(255, 255, 255, 0.5); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('${topPointerId}').style.left = '${clampedStatePct}%'; document.getElementById('${topValueId}').innerText = '${stateAvgFormattedVal}'; document.getElementById('${topLabelId}').innerText = '${stateName} Average'; this.classList.add('active'); this.style.background = 'rgba(255, 255, 255, 0.1)'; this.style.color = '#fff'; document.getElementById('${btnDistrictId}').classList.remove('active'); document.getElementById('${btnDistrictId}').style.background = 'transparent'; document.getElementById('${btnDistrictId}').style.color = 'rgba(255, 255, 255, 0.5)';"${!stateName ? ' disabled' : ''}>${stateName ? stateName + ' Average' : 'State Average'}</button>
                </div>
            </div>

            <div class="legend-container" style="display: block; margin-top: 12px;">
                <div class="legend-scale-wrapper">
                    <div class="legend-center-panel" style="width: 100%; position: relative; padding-top: 50px; padding-bottom: 50px;">
                        
                        <div style="display: flex; align-items: center;">
                            <div style="margin-right: 12px; font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: 'IBM Plex Mono', monospace;">${minValStr}</div>
                            
                            <div style="flex: 1; height: 16px; border-radius: 2px; background: linear-gradient(to right, ${colorsStr}); position: relative;">
                                
                                <div class="legend-pointer-container top-pointer" id="${topPointerId}" style="left: ${clampedPct}%;">
                                    <div class="legend-pointer-triangle"></div>
                                    <div class="legend-pointer-value" id="${topValueId}" style="font-family: 'IBM Plex Mono', monospace;">${distVal}</div>
                                    <div class="legend-pointer-label" id="${topLabelId}">District Average</div>
                                </div>

                                <div class="legend-pointer-container" style="left: ${clampedUsPct}%;">
                                    <div class="legend-pointer-triangle"></div>
                                    <div class="legend-pointer-value" style="font-family: 'IBM Plex Mono', monospace;">${avgVal}</div>
                                    <div class="legend-pointer-label">United States Average</div>
                                </div>
                            </div>
                            
                            <div style="margin-left: 12px; font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: 'IBM Plex Mono', monospace;">${maxValStr}</div>
                        </div>

                    </div>
                </div>
            </div>
            `;

            contentHtml = `
                <div style="padding: 16px; padding-bottom: 0;">
                    <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 16px;">
                        <h3 style="font-size: 28px; color: var(--accent-cyan); margin-bottom: 4px; font-family: 'IBM Plex Mono', monospace;">${distVal}</h3>
                        <p style="font-size: 11px; color: #8892b0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin: 0;">${metricNameDisplay}</p>
                    </div>

                    ${gradientHtml}
                </div>
            `;
        }
        
        return `
            <div class="insights-panel-header">
                <h3>Municipal Bonds: ${districtName}</h3>
                <p>Tax-exempt municipal bonds are a crucial tool that state and local governments use to finance public infrastructure.</p>
            </div>
            <div class="insights-tabs">
                ${tabsHtml}
            </div>
            <div class="insights-panel-content" style="padding: 0; gap: 0;">
                ${contentHtml}
                ${overviewHtml}
            </div>
            <div class="insights-source" style="margin-top: auto; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--glass-border);">
                <div style="margin-bottom: 8px;">
                    <a href="${getFactsheetUrl(districtName)}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline; font-weight: 600;">Download District Bonds Factsheet</a>
                </div>
                <strong>Municipal Bond Data From:</strong> <a href="https://munifinance.uchicago.edu/congressional/" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Center for Municipal Finance</a> at the UChicago, provided by <a href="https://www.ice.com/fixed-income-data-services/ice-climate-analytics-for-municipal-debt" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Intercontinental Exchange, Inc. (ICE)</a>. Data current as of <strong style="color: var(--accent-cyan);">January 23, 2025</strong>.
            </div>
        `;
    };
    
    // --- Render Right Panel: Health, Climate, & Census ---
function renderHealthMetricDetails(metricKey, districtData, tabsHtml = '', timeSeriesDropdownHtml = '') {
    if (!metricKey) return '';
    
    let districtName = districtData ? (districtData.District_Name || `District ${districtData.GEOID}`) : state.selectedDistrict;
    if (!districtName) return '<div class="insights-summary-text">Please select a district.</div>';
    
    // Compute data
    const values = [];
    state.metricsData.forEach(d => {
        const v = getMetricValue(d, metricKey);
        if (!isNaN(v) && v !== -999) {
            values.push(v);
        }
    });
    
    if (values.length === 0) return '<div>No data available</div>';
    
    values.sort((a, b) => b - a);
    
    const maxVal = values[0];
    const minVal = values[values.length - 1];
    const usAvg = values.reduce((a, b) => a + b, 0) / values.length;
    
    let distVal = districtData ? getMetricValue(districtData, metricKey) : usAvg;
    if (isNaN(distVal) || distVal === -999) distVal = null;
    
    const validData = state.metricsData.filter(d => {
        const v = getMetricValue(d, metricKey);
        return !isNaN(v) && v !== -999;
    });

    let stateName = '';
    if (districtName) {
        let parts = districtName.split(' ');
        if (parts.length > 1) parts.pop();
        stateName = parts.join(' ');
    }

    let stateAvg = usAvg;
    if (stateName) {
        const stateData = validData.filter(d => (d.District_Name || "").startsWith(stateName));
        if (stateData.length > 0) {
            const sum = stateData.reduce((acc, curr) => acc + getMetricValue(curr, metricKey), 0);
            stateAvg = sum / stateData.length;
        }
    }

    const minFormattedVal = formatMetricValue(minVal, metricKey, { includeUnit: false });
    const maxFormattedVal = formatMetricValue(maxVal, metricKey, { includeUnit: false });
    const usAvgFormattedVal = formatMetricValue(usAvg, metricKey, { includeUnit: false });
    const distFormattedVal = distVal !== null ? formatMetricValue(distVal, metricKey, { includeUnit: false }) : 'N/A';
    
    const usAvgFormattedValWithUnit = formatMetricValue(usAvg, metricKey, { includeUnit: true });
    const distFormattedValWithUnit = distVal !== null ? formatMetricValue(distVal, metricKey, { includeUnit: true }) : 'N/A';
    const stateAvgFormattedVal = formatMetricValue(stateAvg, metricKey, { includeUnit: false });

    // Invert the percentage calculation if necessary so that we are consistent with details.js
    // details.js uses getPercentageForValue(val, metric)
    const usPct = getPercentageForValue(usAvg, metricKey);
    const distPct = distVal !== null ? getPercentageForValue(distVal, metricKey) : 0;
    const statePct = getPercentageForValue(stateAvg, metricKey);
    
    // Format metric label
    const activeOption = document.querySelector(`#esg-metric option[value="${metricKey}"]`);
    let metricLabel = METRIC_METADATA[metricKey] ? METRIC_METADATA[metricKey].name : metricKey.replace(/_/g, ' ');
    if (activeOption) metricLabel = activeOption.innerText;
    
    let yearOptions = [];
    if (state.availableDataPeriods && state.availableDataPeriods.length > 0) {
        yearOptions = [...state.availableDataPeriods];
    } else if (METRIC_META[metricLabel] && METRIC_META[metricLabel].data_period) {
        yearOptions = [METRIC_META[metricLabel].data_period];
    } else if (METRIC_META[metricKey] && METRIC_META[metricKey].data_period) {
        yearOptions = [METRIC_META[metricKey].data_period];
    } else {
        yearOptions = ['Unknown Year'];
    }
    
    // Fallback to the first option if state.currentDataPeriod isn't valid
    let year = state.currentDataPeriod || yearOptions[0];
    if (!yearOptions.includes(year)) year = yearOptions[0];

    const formatYear = (y) => {
        if (!y) return 'Unknown Year';
        if (y.length === 6 && /^\d+$/.test(y)) {
            const yearStr = y.substring(0, 4);
            const monthStr = y.substring(4);
            const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
            const monthIdx = parseInt(monthStr, 10) - 1;
            if (monthIdx >= 0 && monthIdx < 12) return `${months[monthIdx]} ${yearStr}`;
            return `${yearStr}-${monthStr}`;
        }
        return y;
    };
    
    let yearStrForSummary = formatYear(year);
    let summaryText = `Averaging across all congressional districts in the United States, the national average for <strong>${metricLabel.toLowerCase()}</strong> was <strong>${usAvgFormattedVal}</strong> in <strong>${yearStrForSummary}</strong>.`;
    if (metricDescriptions[metricKey]) {
      summaryText = metricDescriptions[metricKey]
        .replace('{avg}', `<strong>${usAvgFormattedVal}</strong>`)
        .replace('{year}', `<strong>${yearStrForSummary}</strong>`);
    }
    
    if (!neutralMetrics.includes(metricKey)) {
        if (!summaryText.trim().endsWith('.')) {
          summaryText = summaryText.trim() + '.';
        }
        if (higherIsBetter.includes(metricKey)) {
          summaryText += ' Higher values have better outcomes.';
        } else {
          summaryText += ' Lower values have better outcomes.';
        }
    }
    
    if (districtName) {
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, an estimated', `In <strong>${districtName}</strong>, an estimated`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, the estimated', `In <strong>${districtName}</strong>, the estimated`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, there were', `In <strong>${districtName}</strong>, there were`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, prenatal care', `In <strong>${districtName}</strong>, prenatal care`);
        summaryText = summaryText.replace('the national average', `the district average`);
        summaryText = summaryText.replace('in the United States', `in <strong>${districtName}</strong>`);
        if (distVal !== null) {
             summaryText = summaryText.replace(`<strong>${usAvgFormattedVal}</strong>`, `<strong>${distFormattedVal}</strong>`);
        }
    }
    
    // Style all strong tags with cyan to match left/right panels
    summaryText = summaryText.replace(/<strong>(.*?)<\/strong>/g, '<strong style="color: var(--accent-cyan); font-weight: 600;">$1</strong>');
    
    let minDescHtml = '';
    let maxDescHtml = '';
    if (metricKey === 'Income_Inequality') {
        minDescHtml = `<div style="position:absolute; top: 18px; left: 0; font-size: 10px; line-height: 1.2; width: 100px; text-align: left; color: var(--text-muted);"><strong style="color:var(--text-primary);">Disadvantaged<br>Population</strong><br><span style="font-size:9px; opacity:0.8;">(&lt;$30k/year)</span></div>`;
        maxDescHtml = `<div style="position:absolute; top: 18px; right: 0; font-size: 10px; line-height: 1.2; width: 100px; text-align: right; color: var(--text-muted);"><strong style="color:var(--text-primary);">Advantaged<br>Population</strong><br><span style="font-size:9px; opacity:0.8;">(&gt;$150k/year)</span></div>`;
    }
    
    const colorsStr = scaleColors.join(', ');

    return `
        <div class="insights-panel-header" style="display: flex; align-items: center; justify-content: space-between;">
            <div>
                <p class="details-category" style="margin: 0; font-size: 11px; color: var(--accent-cyan); text-transform: uppercase; font-weight: 700; letter-spacing: 1px;">METRIC DETAILS</p>
                <div style="display: flex; align-items: center; gap: 12px; margin-top: 4px;">
                    <h3 style="margin: 0;">${districtName}</h3>
                </div>
            </div>
            <button onclick="window.dispatchEvent(new CustomEvent('health-metric-selected', {detail: null}))" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 6px 12px; border-radius: 6px; cursor: pointer; transition: all 0.2s; font-size: 12px;">Close Details</button>
        </div>
        <div class="insights-tabs" style="display: flex; align-items: center; flex-wrap: nowrap; overflow-x: auto;">
            ${tabsHtml}
            ${timeSeriesDropdownHtml}
        </div>
        <div class="insights-panel-content" style="padding: 0; overflow-y: auto;">
            <div style="padding: 16px;">
                <div style="padding: 16px; background: rgba(255,255,255,0.03); border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); margin-bottom: 16px;">
                        <h3 style="font-size: 28px; color: var(--accent-main); margin-bottom: 4px; font-family: 'IBM Plex Mono', monospace;">${distFormattedValWithUnit}</h3>
                        <p style="font-size: 11px; color: #8892b0; text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; margin: 0;">${metricLabel}</p>
                </div>

            <div class="filter-group" style="margin-top: 0px; margin-bottom: 12px;">
                <div class="glass-panel" style="display: flex; padding: 2px; border-radius: 6px; background: rgba(0, 0, 0, 0.2); border: 1px solid var(--glass-border);">
                    <button id="insights-btn-district" class="toggle-btn active" style="flex: 1; border: none; background: rgba(255, 255, 255, 0.1); border-radius: 4px; padding: 6px 0; color: #fff; font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('insights-top-pointer').style.left = '${distPct}%'; document.getElementById('insights-top-value').innerText = '${distFormattedVal}'; document.getElementById('insights-top-label').innerText = 'District Average'; this.classList.add('active'); this.style.background = 'rgba(255, 255, 255, 0.1)'; this.style.color = '#fff'; document.getElementById('insights-btn-state').classList.remove('active'); document.getElementById('insights-btn-state').style.background = 'transparent'; document.getElementById('insights-btn-state').style.color = 'rgba(255, 255, 255, 0.5)';">District Average</button>
                    <button id="insights-btn-state" class="toggle-btn" style="flex: 1; border: none; background: transparent; border-radius: 4px; padding: 6px 0; color: rgba(255, 255, 255, 0.5); font-size: 11px; font-weight: 600; cursor: pointer; transition: all 0.2s;" onclick="document.getElementById('insights-top-pointer').style.left = '${statePct}%'; document.getElementById('insights-top-value').innerText = '${stateAvgFormattedVal}'; document.getElementById('insights-top-label').innerText = '${stateName} Average'; this.classList.add('active'); this.style.background = 'rgba(255, 255, 255, 0.1)'; this.style.color = '#fff'; document.getElementById('insights-btn-district').classList.remove('active'); document.getElementById('insights-btn-district').style.background = 'transparent'; document.getElementById('insights-btn-district').style.color = 'rgba(255, 255, 255, 0.5)';"${!stateName ? ' disabled' : ''}>${stateName ? stateName + ' Average' : 'State Average'}</button>
                </div>
            </div>

            <div class="legend-container" style="display: block; margin-top: 12px;">
                <div class="legend-scale-wrapper">
                    <div class="legend-center-panel" style="width: 100%; position: relative; padding-top: 50px; padding-bottom: 50px;">
                        
                        <div style="display: flex; align-items: center;">
                            <div style="margin-right: 12px; font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: 'IBM Plex Mono', monospace;">${minFormattedVal}</div>
                            
                            <div style="flex: 1; height: 16px; border-radius: 2px; background: linear-gradient(to right, ${colorsStr}); position: relative;">
                                ${minDescHtml}
                                ${maxDescHtml}
                                
                                <div class="legend-pointer-container top-pointer" id="insights-top-pointer" style="left: ${distPct}%;">
                                    <div class="legend-pointer-triangle"></div>
                                    <div class="legend-pointer-value" id="insights-top-value" style="font-family: 'IBM Plex Mono', monospace;">${distFormattedVal}</div>
                                    <div class="legend-pointer-label" id="insights-top-label">District Average</div>
                                </div>

                                <div class="legend-pointer-container" style="left: ${usPct}%;">
                                    <div class="legend-pointer-triangle"></div>
                                    <div class="legend-pointer-value" style="font-family: 'IBM Plex Mono', monospace;">${usAvgFormattedValWithUnit}</div>
                                    <div class="legend-pointer-label">United States Average</div>
                                </div>
                            </div>
                            
                            <div style="margin-left: 12px; font-size: 14px; font-weight: 700; color: var(--text-primary); font-family: 'IBM Plex Mono', monospace;">${maxFormattedVal}</div>
                        </div>

                    </div>
                </div>
            </div>

            <div style="margin-bottom: 16px;">
                <p style="font-size: 14px; line-height: 1.6; color: var(--text-primary); margin-bottom: 16px;">
                    ${summaryText} Calculated using data from ${(METRIC_META[metricLabel] || {}).data_period || '2023'}, ${(METRIC_META[metricLabel] || {}).period_type || '3 year estimate'}.
                </p>
                <p style="font-size: 13px; color: var(--text-primary); line-height: 1.6; margin-bottom: 16px;">
                    Source: ${(METRIC_META[metricLabel] || {}).source_name || 'Multiple Cause of Death Data, National Vital Statistics System, National Center for Health Statistics'}. Visit <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color: var(--accent-cyan); text-decoration: underline;">Congressional District Health Dashboard</a> by NYU Langone Health &amp; Partners.
                </p>
            </div>
            </div>
        </div>
        <div class="insights-source" style="margin-top: auto; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--glass-border);">
            <div style="margin-bottom: 8px;">
                <a href="${(METRIC_META[metricLabel] || {}).url || 'https://www.congressionaldistricthealthdashboard.org/'}" target="_blank" style="color: var(--accent-cyan); text-decoration: underline; font-weight: 600;">More About This Metric</a>
            </div>
            <strong>Health Data From:</strong> Department of Population Health, NYU Langone Health. <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Congressional District Health Dashboard</a>. Accessed &amp; Data Current as of: <strong style="color: var(--accent-cyan);">May 21, 2026</strong>.
        </div>
    `;
}

    const renderRightPanel = (districtData) => {

        if (!districtData) {
            return `
                <div class="insights-panel-header">
                    <h3>Health, Climate & Census</h3>
                    <p>Metrics compared to the distribution of all congressional districts.</p>
                </div>
                <div class="insights-panel-content" style="display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; color:var(--text-secondary); text-align:center;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="width:48px; height:48px; margin-bottom:16px; opacity:0.5;">
                        <circle cx="12" cy="12" r="10"></circle>
                        <path d="M12 16v-4"></path>
                        <path d="M12 8h.01"></path>
                    </svg>
                    <p>Select a congressional district above to view health and census insights.</p>
                </div>
                <div class="insights-source" style="margin-top: auto; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--glass-border);">
                    <strong>Health Data From:</strong> Department of Population Health, NYU Langone Health. <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Congressional District Health Dashboard</a>. Accessed &amp; Data Current as of: (05/21/2026)
                </div>
            `;
        }
        
        

        
        const districtName = districtData.District_Name || `District ${districtData.GEOID}`;
        
        const domains = ['All Metrics', ...[...new Set(Object.values(METRIC_METADATA).map(m => m.domain))].sort()];
        if (!domains.includes(state.activeInsightsRightTab)) state.activeInsightsRightTab = 'All Metrics';
        let timeSeriesDropdownHtml = '';
        if (state.activeHealthMetric) {
            const metricKey = state.activeHealthMetric;
            const yearOptions = Array.isArray(METRIC_METADATA[metricKey]?.data_period) 
                ? [...METRIC_METADATA[metricKey].data_period] 
                : (METRIC_METADATA[metricKey]?.data_period ? [String(METRIC_METADATA[metricKey].data_period)] : []);
            
            // Sort years descending
            yearOptions.sort((a, b) => {
                const yearA = String(a).length > 4 ? parseInt(String(a).substring(0, 4)) : parseInt(a);
                const yearB = String(b).length > 4 ? parseInt(String(b).substring(0, 4)) : parseInt(b);
                return yearB - yearA;
            });

            let currentYear = state.currentDataPeriod || yearOptions[0];
            if (!yearOptions.includes(currentYear)) currentYear = yearOptions[0];

            if (yearOptions.length > 0) {
                timeSeriesDropdownHtml = `
                    <div style="display: flex; align-items: center; gap: 8px; margin-left: 16px; border-left: 1px solid rgba(255,255,255,0.1); padding-left: 16px;">
                        <span style="font-size: 12px; color: var(--text-secondary);">Time Series:</span>
                        <select id="insights-year-select" onchange="window.dispatchEvent(new CustomEvent('data-period-changed', {detail: this.value}))" style="background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: var(--text-primary); border-radius: 4px; padding: 4px 8px; font-size: 12px; cursor: pointer; outline: none;">
                            ${yearOptions.map(y => {
                                let label = y;
                                if (String(y).length === 6 && /^\d+$/.test(y)) {
                                    const yearStr = String(y).substring(0, 4);
                                    const monthStr = String(y).substring(4);
                                    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
                                    const monthIdx = parseInt(monthStr, 10) - 1;
                                    if (monthIdx >= 0 && monthIdx < 12) label = `${months[monthIdx]} ${yearStr}`;
                                    else label = `${yearStr}-${monthStr}`;
                                }
                                return `<option value="${y}" ${y === currentYear ? 'selected' : ''}>${label}</option>`;
                            }).join('')}
                        </select>
                    </div>
                `;
            }
        }

        let tabsHtml = '';
        if (state.activeHealthMetric) {
            const met = Object.keys(METRIC_METADATA).find(k => k === state.activeHealthMetric);
            if (met && METRIC_METADATA[met]) {
                tabsHtml = `<button class="insights-tab active" data-side="right" data-tab="All Metrics" onclick="window.dispatchEvent(new CustomEvent('health-metric-selected', {detail: null}));" style="display: flex; align-items: center; gap: 8px;">
                    ${METRIC_METADATA[met].name}
                    <svg viewBox="0 0 24 24" width="14" height="14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" style="cursor: pointer; opacity: 0.8;"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>`;
            }
        } else {
            tabsHtml = domains.map(d => {
                const isAll = d === 'All Metrics';
                let tabName = isAll ? d : d + ' ▼';
                const dataMenu = isAll ? '' : ' data-menu="health-metrics"';
                return `<button class="insights-tab ${d === state.activeInsightsRightTab ? 'active' : ''}" data-side="right" data-tab="${d}"${dataMenu}>${tabName}</button>`;
            }).join('');
        }
        
        if (state.activeHealthMetric) {
            return renderHealthMetricDetails(state.activeHealthMetric, districtData, tabsHtml, timeSeriesDropdownHtml);
        }

        let esgRows = Object.keys(METRIC_METADATA)
            .filter(metricKey => state.activeInsightsRightTab === 'All Metrics' || METRIC_METADATA[metricKey].domain === state.activeInsightsRightTab)
            .map(metricKey => {
                const meta = METRIC_METADATA[metricKey];
                const val = getMetricValue(districtData, metricKey);
                let formattedVal = isNaN(val) || val === -999 ? 'No Data' : formatMetricValue(val, metricKey);
                const comparison = getUSComparisonIndicator(metricKey, val, stats, districtName);
                const desc = METRIC_DESCRIPTIONS_SHORT[metricKey] || '';
                
                return {
                    domain: meta.domain,
                    name: meta.name,
                    html: `
                        <tr style="border-bottom: 1px solid rgba(255,255,255,0.05); cursor: pointer;" onclick="const radio = this.querySelector('input[type=\\'radio\\']'); if(radio) radio.checked = true; window.dispatchEvent(new CustomEvent('health-metric-selected', {detail: '${metricKey}'}));">
                            <td style="text-align:center; width:40px; padding-top:16px; vertical-align:top;">
                                <input type="radio" name="health-metric" value="${metricKey}" ${state.activeHealthMetric === metricKey ? 'checked' : ''} style="accent-color: var(--accent-cyan); cursor: pointer;">
                            </td>
                            <td style="color:var(--text-secondary); width:25%; vertical-align:top; padding-top:16px;">${meta.domain}</td>
                            <td style="color:var(--accent-main); font-weight:500; border-right: 1px solid rgba(255,255,255,0.05); width:25%; vertical-align:top; padding-top:16px;">
                                <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:12px; padding-right:8px;">
                                    <span style="word-break: break-word; font-size: 15px;">${meta.name}</span>
                                    <span class="custom-tooltip-container" style="cursor:help; position:relative; display:inline-flex; flex-shrink:0; margin-top:2px;">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(255, 255, 255, 0.7)"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/></svg>
                                        <span class="custom-tooltip glass-panel" style="width: 400px; background: rgba(15, 20, 28, 0.98); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px rgba(0,0,0,0.6); top: -10px; left: calc(100% + 15px); bottom: auto; transform: none; white-space: normal; text-transform: none; font-weight: 400; font-size: 13px; line-height: 1.4; color: var(--text-primary); pointer-events: auto; z-index: 99999;">
                                            Calculated using data from ${(METRIC_META[meta.name] || {}).data_period || '2023'}, ${(METRIC_META[meta.name] || {}).period_type || '3 year estimate'}<br>
                                            Source: ${(METRIC_META[meta.name] || {}).source_name || 'Multiple Cause of Death Data, National Vital Statistics System, National Center for Health Statistics'}<br><br>
                                            Visit <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color:#02D4FF; text-decoration: underline;">Congressional District Health Dashboard</a> by NYU Langone Health &amp; Partners<br><br>
                                            <a href="${(METRIC_META[meta.name] || {}).url || 'https://www.congressionaldistricthealthdashboard.org/'}" target="_blank" style="color:#02D4FF; text-decoration: underline;">More About This Metric</a> by Congressional District Health Dashboard
                                        </span>
                                    </span>
                                </div>
                            </td>
                            <td style="border-right: 1px solid rgba(255,255,255,0.05); width:25%; vertical-align:top; padding-top:16px;">
                                <div style="font-size:18px; font-weight:700; color:#02D4FF; margin-bottom:6px;">${formattedVal}</div>
                                <div style="font-size:12px; color:var(--text-muted); line-height:1.4;">${desc}</div>
                            </td>
                            <td style="width:25%; vertical-align:top; padding-top:16px;">${comparison}</td>
                        </tr>
                    `
                };
            });
        
        const hCol = tableSortState.health.col || 'Metric';
        const hDir = tableSortState.health.col ? tableSortState.health.dir : 'asc';
        esgRows.sort((a,b) => {
            let valA = hCol === 'Metric Domain' ? a.domain : a.name;
            let valB = hCol === 'Metric Domain' ? b.domain : b.name;
            if (valA < valB) return hDir === 'asc' ? -1 : 1;
            if (valA > valB) return hDir === 'asc' ? 1 : -1;
            return 0;
        });
        const rightPanelHtml = esgRows.map(r => r.html).join('');
        
        return `
            <div class="insights-panel-header">
                <h3>Health, Climate & Census: ${districtName}</h3>
                <p>Metrics compared to the distribution of all congressional districts.</p>
            </div>
            <div class="insights-tabs">
                ${tabsHtml}
                ${timeSeriesDropdownHtml}
            </div>
            <div class="insights-panel-content" style="padding: 0;">
                <div class="insights-table-wrapper" style="max-height: 500px; overflow-y: auto;">
                    <table class="insights-table" style="border: none; width: 100%;">
                        <thead style="position: sticky; top: 0; z-index: 2; background: rgba(15, 20, 28, 0.95); backdrop-filter: blur(8px);">
                            <tr>
                                <th style="width: 40px; text-align: center;">Select</th>
                                <th class="sortable-th" data-table="health" data-col="Metric Domain" style="cursor:pointer; text-align:left; font-size:12px;">Metric Domain ${getSortIcon('health', 'Metric Domain')}</th>
                                <th class="sortable-th" data-table="health" data-col="Metric" style="cursor:pointer; text-align:left; font-size:12px;">Metric ${getSortIcon('health', 'Metric')}</th>
                                <th style="text-align:left; font-size:12px;">${districtName} Estimate</th>
                                <th style="text-align:left; font-size:12px;">U.S. Comparison</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rightPanelHtml}
                        </tbody>
                    </table>
                </div>
            </div>
            <div class="insights-source" style="margin-top: auto; padding: 16px; font-size: 13px; color: var(--text-secondary); line-height: 1.4; border-top: 1px solid var(--glass-border);">
                <strong>Health Data From:</strong> Department of Population Health, NYU Langone Health. <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color: var(--accent-cyan); text-decoration: none;">Congressional District Health Dashboard</a>. Accessed &amp; Data Current as of: (05/21/2026)
            </div>
        `;
    };
    
    const isComparing = state.insightsLeftDistrict && state.insightsRightDistrict && (state.insightsLeftDistrict !== state.insightsRightDistrict);
    
    // Update top right buttons
    const btnGoDistrict = document.getElementById('btn-go-district');
    if (btnGoDistrict) {
        if (isComparing) {
            btnGoDistrict.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                   <rect x="2" y="3" width="20" height="18" rx="2" ry="2"></rect>
                   <line x1="12" y1="3" x2="12" y2="21"></line>
                </svg>
                Compare Districts
            `;
            btnGoDistrict.classList.add('btn-glowing');
        } else {
            btnGoDistrict.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"></polygon><line x1="9" y1="3" x2="9" y2="18"></line><line x1="15" y1="6" x2="15" y2="21"></line></svg>
                Go to District
            `;
            btnGoDistrict.classList.remove('btn-glowing');
        }
    }

    insightsContainer.innerHTML = `
        <div class="insights-grid">
            <div class="insights-panel">
                ${renderGlassControl('left', leftTarget)}
                ${renderLeftPanel(leftDistrictData)}
            </div>
            
            <div class="insights-panel">
                ${renderGlassControl('right', rightTarget)}
                ${renderRightPanel(rightDistrictData)}
            </div>
        </div>
    `;

    // Setup Glass Menus
    const closeAllMenus = () => {
        document.querySelectorAll('.glass-flyout-menu').forEach(m => m.remove());
    };

    // Remove old document listener if it exists, add new one
    document.removeEventListener('click', window._insightsMenuCloser);
    window._insightsMenuCloser = (e) => {
        if (!e.target.closest('.glass-menu-trigger') && !e.target.closest('.glass-flyout-menu') && !e.target.closest('[data-menu="bond-metrics"]') && !e.target.closest('[data-menu="health-metrics"]')) {
            closeAllMenus();
        }
    };
    document.addEventListener('click', window._insightsMenuCloser);

    // Also handle custom event from health table rows
    if (!window._healthMetricListenerAdded) {
        window.addEventListener('health-metric-selected', (e) => {
            state.setActiveHealthMetric(e.detail);
        });
        window._healthMetricListenerAdded = true;
    }

    insightsContainer.querySelectorAll('.glass-menu-trigger, [data-menu="bond-metrics"], [data-menu="health-metrics"]').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            const side = trigger.dataset.side;
            const menuType = trigger.dataset.menu;
            closeAllMenus();

            const rect = trigger.getBoundingClientRect();
            
            const menu = document.createElement('div');
            menu.className = 'glass-flyout-menu main-state-menu';
            menu.style.top = (rect.bottom + window.scrollY + 8) + 'px';
            menu.style.left = rect.left + 'px';
            menu.style.width = rect.width + 'px';
            
            if (menuType === 'bond-metrics') {
                const metrics = [
                    { key: 'Total_Inv_Value', label: 'Total Investment Value' },
                    { key: 'Total_Issuers', label: 'Total Issuers' },
                    { key: 'Small_Borrowers', label: 'Small Borrowers' },
                    { key: 'Sub_State_Inv_Value', label: 'Sub-State Investment' },
                    { key: 'Sub_State_Sav_Value', label: 'District Taxpayer Savings' },
                    { key: 'Small_Borrowers_Pct', label: 'Small Borrowers Percent (%)' }
                ];
                metrics.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'glass-flyout-item';
                    const isActive = m.key === state.activeBondMetric || (m.key === 'Total_Inv_Value' && !state.activeBondMetric);
                    if (isActive) {
                        item.classList.add('active');
                        item.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 600;">${m.label} ✓</span>`;
                    } else {
                        item.innerHTML = `<span>${m.label}</span>`;
                    }
                    item.addEventListener('click', (ev) => {
                        state.setActiveBondMetric(m.key);
                        closeAllMenus();
                        updateInsights();
                        ev.stopPropagation();
                    });
                    menu.appendChild(item);
                });
                document.body.appendChild(menu);
            } else if (menuType === 'health-metrics') {
                const domain = trigger.dataset.tab;
                const metrics = Object.keys(METRIC_METADATA)
                    .filter(k => METRIC_METADATA[k].domain === domain)
                    .map(k => ({ key: k, label: METRIC_METADATA[k].name }));
                
                metrics.forEach(m => {
                    const item = document.createElement('div');
                    item.className = 'glass-flyout-item';
                    if (m.key === state.activeHealthMetric) {
                        item.classList.add('active');
                        item.innerHTML = `<span style="color: var(--accent-cyan); font-weight: 600;">${m.label} ✓</span>`;
                    } else {
                        item.innerHTML = `<span>${m.label}</span>`;
                    }
                    item.addEventListener('click', (ev) => {
                        state.setActiveInsightsRightTab(domain);
                        state.setActiveHealthMetric(m.key);
                        closeAllMenus();
                        if (typeof updateInsights === 'function') updateInsights();
                        ev.stopPropagation();
                        
                        setTimeout(() => {
                            const tableContainer = document.querySelector('.insights-panel[data-side="right"] .insights-table-wrapper');
                            // querySelector might fail on complex names so escape them
                            const escapedKey = m.key.replace(/"/g, '\\"');
                            const selectedRadio = document.querySelector(`input[name="health-metric"][value="${escapedKey}"]`);
                            if (selectedRadio && tableContainer) {
                                const row = selectedRadio.closest('tr');
                                if (row) {
                                    tableContainer.scrollTop = row.offsetTop - tableContainer.offsetTop - 50;
                                }
                            }
                        }, 100);
                    });
                    menu.appendChild(item);
                });
                document.body.appendChild(menu);
            } else {
                let currentSubmenu = null;

                allStates.forEach(stateName => {
                    const item = document.createElement('div');
                    item.className = 'glass-flyout-item';
                    item.innerHTML = `<span>${stateName}</span><span class="glass-flyout-arrow">›</span>`;
                
                item.addEventListener('mouseenter', () => {
                    if (currentSubmenu) currentSubmenu.remove();
                    Array.from(menu.children).forEach(c => c.classList.remove('active'));
                    item.classList.add('active');

                    const subMenu = document.createElement('div');
                    subMenu.className = 'glass-flyout-menu sub-district-menu';
                    
                    // Sort districts numerically rather than alphabetically
                    const sortedDistricts = [...stateDistrictMap[stateName]].sort((a, b) => {
                        if (a.suffix === 'All') return -1;
                        if (b.suffix === 'All') return 1;
                        if (a.suffix === 'At-Large') return -1;
                        if (b.suffix === 'At-Large') return 1;
                        const numA = parseInt(a.suffix) || 0;
                        const numB = parseInt(b.suffix) || 0;
                        return numA - numB;
                    });
                    
                    sortedDistricts.forEach(d => {
                        const subItem = document.createElement('div');
                        subItem.className = 'glass-flyout-item';
                        subItem.innerHTML = `<span>${d.suffix}</span>`;
                        subItem.addEventListener('click', (ev) => {
                            const val = d.full;
                            if (side === 'left') {
                                state.setInsightsLeftDistrict(val);
                                if (!state.insightsRightDistrict) state.setInsightsRightDistrict(val);
                            } else {
                                state.setInsightsRightDistrict(val);
                                if (!state.insightsLeftDistrict) state.setInsightsLeftDistrict(val);
                            }
                            
                            // Clear selectedDistrict so it doesn't force both sides to match
                            if (state.selectedDistrict) {
                                state.selectedDistrict = null;
                            }
                            
                            closeAllMenus();
                            updateInsights();
                            ev.stopPropagation();
                        });
                        subMenu.appendChild(subItem);
                    });
                    
                    // Append first to get layout bounds
                    document.body.appendChild(subMenu);
                    currentSubmenu = subMenu;

                    const itemRect = item.getBoundingClientRect();
                    const subRect = subMenu.getBoundingClientRect();
                    
                    let top = itemRect.top + window.scrollY - 6;
                    
                    // If the submenu would run off the bottom of the screen, shift it up
                    if (itemRect.top + subRect.height > window.innerHeight - 20) {
                        // Center it vertically relative to the hovered item
                        let adjustedTop = itemRect.top + window.scrollY + (itemRect.height / 2) - (subRect.height / 2);
                        
                        // Ensure it doesn't push below the bottom of the window
                        if (adjustedTop + subRect.height > window.scrollY + window.innerHeight - 20) {
                            adjustedTop = window.scrollY + window.innerHeight - subRect.height - 20;
                        }
                        // Ensure it doesn't push above the top of the window
                        if (adjustedTop < window.scrollY + 20) {
                            adjustedTop = window.scrollY + 20;
                        }
                        top = adjustedTop;
                    }
                    
                    let left = rect.right + 4;
                    // If the submenu runs off the right side of the screen, show it on the left instead!
                    if (rect.right + 4 + subRect.width > window.innerWidth - 20) {
                         left = rect.left - subRect.width - 4;
                    }
                    
                    subMenu.style.top = top + 'px';
                    subMenu.style.left = left + 'px';
                });
                
                menu.appendChild(item);
            });
            
            document.body.appendChild(menu);
            }
            e.stopPropagation();
        });
    });

    // Attach listeners to search inputs
    insightsContainer.querySelectorAll('.insights-search-input').forEach(input => {
        const side = input.dataset.side;
        const dropdown = insightsContainer.querySelector(`#autocomplete-${side}`);
        
        input.addEventListener('input', (e) => {
            const val = e.target.value.toLowerCase();
            dropdown.innerHTML = '';
            if (!val) {
                dropdown.classList.remove('show');
                return;
            }
            function parseDistrictName(name) {
                const match = name.match(/^(.*?)\s*(\d+)(st|nd|rd|th)?$/i);
                if (match) return { state: match[1].trim(), number: parseInt(match[2], 10) };
                return { state: name, number: 0 };
            }
            let matches = allDistricts.filter(d => d.District_Name.toLowerCase().includes(val));
            matches.sort((a, b) => {
                const aParsed = parseDistrictName(a.District_Name || '');
                const bParsed = parseDistrictName(b.District_Name || '');
                if (aParsed.state !== bParsed.state) return aParsed.state.localeCompare(bParsed.state);
                return aParsed.number - bParsed.number;
            });
            if (matches.length > 0) {
                dropdown.innerHTML = matches.map((m, i) => `<div class="autocomplete-option ${i === 0 ? 'active' : ''}" data-val="${m.District_Name}">${m.District_Name}</div>`).join('');
                dropdown.classList.add('show');
            } else {
                dropdown.classList.remove('show');
            }
        });
        
        input.addEventListener('keydown', (e) => {
            const options = Array.from(dropdown.querySelectorAll('.autocomplete-option'));
            if (options.length === 0 || !dropdown.classList.contains('show')) return;
            
            let activeIdx = options.findIndex(opt => opt.classList.contains('active'));
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (activeIdx < options.length - 1) activeIdx++;
                else activeIdx = 0;
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (activeIdx > 0) activeIdx--;
                else activeIdx = options.length - 1;
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (activeIdx >= 0 && activeIdx < options.length) {
                    options[activeIdx].click();
                } else if (options.length > 0) {
                    options[0].click();
                }
                return;
            } else {
                return;
            }
            
            options.forEach((opt, idx) => {
                if (idx === activeIdx) {
                    opt.classList.add('active');
                    opt.scrollIntoView({ block: 'nearest' });
                } else {
                    opt.classList.remove('active');
                }
            });
        });
        
        input.addEventListener('focus', (e) => {
            if (e.target.value) {
                e.target.dispatchEvent(new Event('input'));
            }
        });
        
        input.addEventListener('blur', () => {
            setTimeout(() => {
                if (dropdown) dropdown.classList.remove('show');
            }, 200); 
        });
    });

    // Autocomplete option click (Event delegation)
    insightsContainer.querySelectorAll('.autocomplete-dropdown').forEach(dropdown => {
        dropdown.addEventListener('click', (e) => {
            if (e.target.classList.contains('autocomplete-option')) {
                const val = e.target.dataset.val;
                const side = dropdown.id.split('-')[1]; // autocomplete-left -> left
                
                if (side === 'left') {
                    state.setInsightsLeftDistrict(val);
                    if (!state.insightsRightDistrict) state.setInsightsRightDistrict(val);
                } else {
                    state.setInsightsRightDistrict(val);
                    if (!state.insightsLeftDistrict) state.setInsightsLeftDistrict(val);
                }
                
                // Clear selectedDistrict so it doesn't force both sides to match
                if (state.selectedDistrict) {
                    state.selectedDistrict = null;
                }
                
                updateInsights();
            }
        });
    });

    insightsContainer.querySelectorAll('.sortable-th').forEach(th => {
        th.addEventListener('click', (e) => {
            const table = th.dataset.table;
            const col = th.dataset.col;
            if (tableSortState[table].col === col) {
                tableSortState[table].dir = tableSortState[table].dir === 'asc' ? 'desc' : 'asc';
            } else {
                tableSortState[table].col = col;
                tableSortState[table].dir = 'asc';
            }
            // re-render the view
            updateInsights();
        });
    });

    // Attach listeners to tabs
    const tabs = insightsContainer.querySelectorAll('.insights-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            const side = e.target.dataset.side;
            const tabName = e.target.dataset.tab;
            if (side === 'left') {
                state.setInsightsLeftTab(tabName);
            } else {
                state.setInsightsRightTab(tabName);
            }
            updateInsights();
        });
    });
}

// Attach event listeners for top buttons
const initInsightsButtons = () => {
    const btnNational = document.getElementById('btn-national-view');
    if (btnNational) {
        btnNational.addEventListener('click', (e) => {
            e.preventDefault();
            
            const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
            if (mapTab) mapTab.click();
            
            const bondsRadio = document.querySelector('input[name="sidebar-mode"][value="bonds"]');
            if (bondsRadio) bondsRadio.click();

            setTimeout(() => {
                const backBtn = document.getElementById('back-to-overview-btn');
                if (backBtn) backBtn.click();
                
                // Fallback direct calls
                state.setSelectedDistrict(null);
                state.insightsLeftDistrict = null;
                state.insightsRightDistrict = null;
                
                import('./map.js').then(m => m.resetMapView());
            }, 350);
        });
    }

    const btnGoDistrict = document.getElementById('btn-go-district');
    if (btnGoDistrict) {
        btnGoDistrict.addEventListener('click', () => {
            const isComparing = state.insightsLeftDistrict && state.insightsRightDistrict && (state.insightsLeftDistrict !== state.insightsRightDistrict);
            
            if (isComparing) {
                // Switch to Map mode
                const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
                if (mapTab) mapTab.click();
                
                // Directly enable compare mode without firing the radio change event
                // which otherwise calls resetMapView()
                const compareRadio = document.querySelector('input[name="sidebar-mode"][value="compare"]');
                if (compareRadio) compareRadio.checked = true;
                
                document.body.classList.add('compare-mode-active');
                state.setCompareMode(true);
                
                const swipeBtn = document.getElementById('compare-toggle-swipe');
                const sbsBtn = document.getElementById('compare-toggle-sbs');
                if (swipeBtn) swipeBtn.classList.remove('active');
                if (sbsBtn) sbsBtn.classList.add('active');
                document.body.classList.add('compare-sbs-active');
                state.setCompareViewType('sbs');
                
                const leftSidebar = document.getElementById('sidebar-left');
                if (leftSidebar) leftSidebar.classList.add('collapsed');
                
                const rightSidebar = document.getElementById('details-sidebar');
                if (rightSidebar) rightSidebar.classList.add('hidden');
                
                const bondsControls = document.getElementById('bonds-controls');
                const esgControls = document.getElementById('esg-controls');
                const compareControls = document.getElementById('compare-controls');
                if (bondsControls) bondsControls.style.display = 'none';
                if (esgControls) esgControls.style.display = 'none';
                if (compareControls) compareControls.style.display = 'block';

                // Transfer metrics from Insights to Compare Mode
                const leftMetric = state.activeBondMetric || 'Total_Inv_Value';
                const leftSource = 'bonds';
                const leftCategory = leftMetric.toLowerCase().includes('proceeds') ? 'proceeds' : 'bonds';
                
                const rightMetric = state.activeHealthMetric || 'Breast_Cancer_Deaths';
                const rightSource = 'esg';
                const rightDomain = METRIC_METADATA[rightMetric] ? METRIC_METADATA[rightMetric].domain : 'Health Outcomes';
                let rightCategory = 'outcomes';
                if (rightDomain === 'Socio-Economic Factors') rightCategory = 'socioeconomic';
                else if (rightDomain === 'Health Behavior') rightCategory = 'behaviors';
                else if (rightDomain === 'Environment') rightCategory = 'environment';
                else if (rightDomain === 'Clinical Care') rightCategory = 'care';
                
                const syncCompareControl = (side, source, category, metric) => {
                    const sourceEl = document.getElementById(`compare-${side}-source`);
                    const categoryEl = document.getElementById(`compare-${side}-category`);
                    const metricEl = document.getElementById(`compare-${side}-metric`);
                    
                    if (sourceEl && categoryEl && metricEl) {
                        sourceEl.value = source;
                        sourceEl.dispatchEvent(new Event('change'));
                        
                        categoryEl.value = category;
                        categoryEl.dispatchEvent(new Event('change'));
                        
                        metricEl.value = metric;
                        metricEl.dispatchEvent(new Event('change'));
                    }
                };
                
                syncCompareControl('left', leftSource, leftCategory, leftMetric);
                syncCompareControl('right', rightSource, rightCategory, rightMetric);

                state.setSelectedDistrict(null);
                state.setSelectedDistrictLeft(state.insightsLeftDistrict);
                state.setSelectedDistrictRight(state.insightsRightDistrict);
                
                const lData = state.metricsData.find(d => d.District_Name === state.insightsLeftDistrict || d.GEOID === state.insightsLeftDistrict);
                const rData = state.metricsData.find(d => d.District_Name === state.insightsRightDistrict || d.GEOID === state.insightsRightDistrict);

                import('./map.js').then(m => {
                    m.setupCompareMode();
                    m.resizeMap(); // Force resize immediately
                    setTimeout(() => {
                        m.resizeMap(); // Force resize again after CSS transition
                        m.highlightSelected();
                        if (typeof m.updateSbsTooltips === 'function') m.updateSbsTooltips();
                        if (lData && lData.GEOID) m.flyToDistrictSbs(lData.GEOID, 'left');
                        if (rData && rData.GEOID) m.flyToDistrictSbs(rData.GEOID, 'right');
                    }, 500); // Wait for mapCompare to initialize
                });
            } else {
                let targetDistrict = state.insightsLeftDistrict || state.insightsRightDistrict || state.selectedDistrict;
                if (targetDistrict) {
                    const districtData = state.metricsData.find(d => d.District_Name === targetDistrict || d.GEOID === targetDistrict);
                    state.setSelectedDistrict(targetDistrict);
                    
                    // Switch to Map mode
                    const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
                    if (mapTab) mapTab.click();
                    
                    // Ensure we are in bonds mode, not compare
                    const bondsRadio = document.querySelector('input[name="sidebar-mode"][value="bonds"]');
                    if (bondsRadio) bondsRadio.click();
                    
                    if (districtData && districtData.GEOID) {
                        setTimeout(() => {
                            import('./map.js').then(m => m.flyToDistrict(districtData.GEOID));
                        }, 350);
                    }
                } else {
                    const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
                    if (mapTab) mapTab.click();
                }
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initInsightsButtons);
} else {
    initInsightsButtons();
}
