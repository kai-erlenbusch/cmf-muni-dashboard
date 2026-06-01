import { state } from '../state.js';
import { scaleColors, getPercentageForValue, getColorMapperForMetric } from '../utils/colors.js';
import { flyToDistrict, resetMapView, highlightSelected } from './map.js';
import { METRIC_META as metricMeta } from '../metric_meta.js';
import { getFactsheetUrl } from '../factsheet_urls.js';

export let currentListSort = 'district';

export const higherIsBetter = [
  'High_School_Completion',
  'Broadband_Connection',
  'Life_Expectancy',
  'Dental_Care',
  'Routine_Checkup,_18+',
  'Prenatal_Care'
];
export const neutralMetrics = [
  'Medicaid_Enrollment',
  'Income_Inequality',
  'Neighborhood_Racial/Ethnic_Segregation',
  'Racial/Ethnic_Diversity'
];

export const metricDescriptions = {
  "Breast_Cancer_Deaths": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 females died from breast cancer in {year}.",
  "Cardiovascular_Disease_Deaths": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 people died from cardiovascular disease in {year}.",
  "Colorectal_Cancer_Deaths": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 people died from colorectal cancer in {year}.",
  "Diabetes": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported having diabetes in {year}.",
  "Firearm_Homicides": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 people died by firearm homicide in {year}.",
  "Firearm_Suicides": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 people died by firearm suicide in {year}.",
  "Frequent_Mental_Distress": "Averaging across all congressional districts in the United States, an estimated {avg} of adults in {year} reported that they experienced frequent mental distress in the past 30 days.",
  "High_Blood_Pressure": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported having high blood pressure in {year}.",
  "Independent_Living_Difficulty": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported difficulty living independently in {year}.",
  "Life_Expectancy": "Averaging across all congressional districts in the United States, the estimated life expectancy at birth was {avg} years in {year}.",
  "Low_Birthweight": "Averaging across all congressional districts in the United States, an estimated {avg} of live births were low birthweight (<2500 grams) in {year}.",
  "Obesity": "Averaging across all congressional districts in the United States, an estimated {avg} of adults in {year} had a BMI ≥30 kg/m² (based on their reported weight and height).",
  "Opioid_Overdose_Deaths": "Averaging across all congressional districts in the United States, an estimated {avg} per 100,000 people died from opioid overdose in {year}.",
  "Premature_Deaths_(All_Causes)": "Averaging across all congressional districts in the United States, an estimated {avg} years of potential life were lost before age 75 per 100,000 people in {year}.",
  "Broadband_Connection": "Averaging across all congressional districts in the United States, an estimated {avg} of households had high speed broadband internet in {year}.",
  "Children_in_Poverty": "Averaging across all congressional districts in the United States, an estimated {avg} of children were living in poverty (≤100% of the federal poverty level) in {year}.",
  "Chronic_Absenteeism": "Averaging across all congressional districts in the United States, an estimated {avg} of public school students were chronically absent in {year}.",
  "Food_Insecurity": "Averaging across all congressional districts in the United States, an estimated {avg} of adults in {year} reported that they did not have enough food and did not have money to get more.",
  "High_School_Completion": "Averaging across all congressional districts in the United States, an estimated {avg} of adults (≥25 years old) had a high school diploma equivalent or higher in {year}.",
  "Income_Inequality": "Averaging across all congressional districts in the United States, the estimated income inequality score was {avg} in {year} (scores range from -100 to 100).  A score of 0 can mean two things: disadvantaged AND advantaged households are present in equal numbers, OR every household has an income between $30,000/year and $150,000/year.",
  "Neighborhood_Racial/Ethnic_Segregation": "Averaging across all congressional districts in the United States, the estimated neighborhood racial/ethnic segregation score was {avg} (out of 100) in {year}.",
  "Racial/Ethnic_Diversity": "Averaging across all congressional districts in the United States, the estimated racial/ethnic diversity score was {avg} (out of 100) in {year}.",
  "Rent_Burden": "Averaging across all congressional districts in the United States, an estimated {avg} of households experienced high rent burden (≥30% of income) in {year}.",
  "SNAP_Participation": "Averaging across all congressional districts in the United States, an estimated {avg} of households participated in SNAP in {year}.",
  "Unemployment": "Averaging across all congressional districts in the United States, an estimated {avg} of the labor force was unemployed in {year}.",
  "Youth_Not_in_Work_or_School": "Averaging across all congressional districts in the United States, an estimated {avg} of youth aged 16-19 were neither working nor in school in {year}.",
  "Binge_Drinking": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported binge drinking (past 30 days) in the United States in {year}.",
  "Physical_Inactivity": "Averaging across all congressional districts in the United States, an estimated {avg} of adults in {year} reported that they were physically inactive in the past 30 days.",
  "Smoking": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported current cigarette smoking in {year}.",
  "Teen_Births": "Averaging across all congressional districts in the United States, there were an estimated {avg} births per 1,000 females aged 15-19 in {year}.",
  "Air_Pollution___Ozone": "Averaging across all congressional districts in the United States, the estimated average ozone concentration was {avg} ppb in {year}.",
  "Air_Pollution___Particulate_Matter": "Averaging across all congressional districts in the United States, the estimated annual fine particulate matter concentration was {avg}μg/m³ in {year}.",
  "Housing_with_Potential_Lead_Risk": "Averaging across all congressional districts in the United States, an estimated {avg} of housing had potential elevated lead risk in {year}.",
  "Lead_Exposure_Risk_Index": "Averaging across all congressional districts in the United States, the estimated lead exposure risk index score was {avg} (out of 10) in {year}.",
  "Dental_Care": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported visiting a dentist (past year) in {year}.",
  "Designated_Primary_Care_Shortage_Area": "Averaging across all congressional districts in the United States, an estimated {avg} of the population was living in a designated primary care shortage area in {year}.",
  "Medicaid_Enrollment": "Averaging across all congressional districts in the United States, an estimated {avg} of the population was enrolled (past quarter) in Medicaid in {year}.",
  "Prenatal_Care": "Averaging across all congressional districts in the United States, prenatal care began in the first trimester for an estimated {avg} of births in {year}.",
  "Routine_Checkup,_18+": "Averaging across all congressional districts in the United States, an estimated {avg} of adults reported visiting a doctor for a routine checkup (past year) in {year}.",
  "Uninsured": "Averaging across all congressional districts in the United States, an estimated {avg} of the population under 65 years old did not have health insurance in {year}."
};

export function showOverview() {
  document.getElementById('overview-view').classList.remove('hidden');
  document.getElementById('district-view').classList.add('hidden');
  document.getElementById('details-header-controls').classList.add('hidden');
  
  const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
  const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
  
  let title = state.activeMetric;
  if (activeBtn) title = activeBtn.innerText;
  else if (activeOption) title = activeOption.innerText;
  else if (state.activeMetric.startsWith('Proceeds_')) {
    const proceedsOpt = document.querySelector(`#proceeds-category option[value="${state.activeMetric}"]`);
    if (proceedsOpt) title = proceedsOpt.innerText;
  }
  
  if (state.metricGroups[state.activeMetric] && state.activeGroup !== 'Total') {
    title += ` (${state.activeGroup})`;
  }
  if (state.currentDataPeriod) {
    let displayPeriod = state.currentDataPeriod;
    if (displayPeriod.length === 6 && /^\d+$/.test(displayPeriod)) {
      const yearStr = displayPeriod.substring(0, 4);
      const monthStr = displayPeriod.substring(4);
      const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
      const monthIdx = parseInt(monthStr, 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        displayPeriod = `${months[monthIdx]} ${yearStr}`;
      } else {
        displayPeriod = yearStr + '-' + monthStr;
      }
    }
    title += ` (${displayPeriod})`;
  }
  document.getElementById('details-title').innerText = title;
  const downloadBtn = document.getElementById('details-download-factsheet');
  if (downloadBtn) downloadBtn.style.display = 'none';

  const scaleControl = document.getElementById('scale-bar-control-group');
  const topPointer = document.getElementById('legend-top-pointer-container');
  
  if (scaleControl) scaleControl.style.display = 'none';
  if (topPointer) topPointer.style.display = 'none';
}

export function showDistrictDetail(props) {
  document.getElementById('overview-view').classList.add('hidden');
  document.getElementById('district-view').classList.remove('hidden');
  document.getElementById('details-header-controls').classList.remove('hidden');
  
  document.getElementById('details-title').innerText = props.District_Name || props.GEOID;

  const downloadBtn = document.getElementById('details-download-factsheet');
  if (downloadBtn) {
    const isHealthMode = document.getElementById('mode-esg') && document.getElementById('mode-esg').checked;
    if (!isHealthMode && props.District_Name) {
      const url = getFactsheetUrl(props.District_Name);
      if (url && url !== '#') {
        downloadBtn.href = url;
        downloadBtn.style.display = 'flex';
      } else {
        downloadBtn.style.display = 'none';
      }
    } else {
      downloadBtn.style.display = 'none';
    }
  }


  const scaleControl = document.getElementById('scale-bar-control-group');
  const topPointer = document.getElementById('legend-top-pointer-container');
  
  // Show the scale control toggle for both Health and Bonds modes
  const isHealth = document.getElementById('mode-esg') && document.getElementById('mode-esg').checked;
  if (scaleControl) scaleControl.style.display = 'block';
  if (topPointer) topPointer.style.display = 'flex';
  
  const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
  const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
  let metricLabel = state.activeMetric.replace(/_/g, ' ');
  if (activeBtn) metricLabel = activeBtn.innerText;
  else if (activeOption) metricLabel = activeOption.innerText;
  document.getElementById('district-metric-label').innerText = metricLabel;
  
  const dataField = state.getActiveDataField();
  const val = parseFloat(props[dataField]);
  document.getElementById('district-metric-value').innerText = (!isNaN(val) && val !== -999) 
    ? formatMetricValue(val, state.activeMetric) 
    : 'No Data';

  document.getElementById('inspector-buttons').classList.remove('hidden');
  document.getElementById('inspector-content-issuers').classList.add('hidden');
  document.getElementById('inspector-content-proceeds').classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('back-to-overview-btn').addEventListener('click', () => {
    state.setSelectedDistrict(null);
    state.setSelectedDistrictLeft(null);
    state.setSelectedDistrictRight(null);
    highlightSelected();
    
    const tooltip = document.getElementById('map-tooltip');
    if (tooltip) {
      tooltip.style.pointerEvents = 'none';
      tooltip.style.display = 'none';
    }
    const tooltipCompare = document.getElementById('map-tooltip-compare');
    if (tooltipCompare) {
      tooltipCompare.style.pointerEvents = 'none';
      tooltipCompare.style.display = 'none';
    }
    
    showOverview();
    resetMapView();
    
    if (state.compareMode) {
      const leftSidebar = document.getElementById('sidebar-left');
      if (leftSidebar && leftSidebar.classList.contains('collapsed')) {
        leftSidebar.classList.remove('collapsed');
        // Allow transition time before fully resetting map view again
        setTimeout(() => resetMapView(), 350);
      }
    }
    
    // Master close: subgroup window
    const subgroupWin = document.getElementById('subgroup-window-container');
    if (subgroupWin) {
        subgroupWin.style.display = 'none';
    }
    
    // Master close and reset: Time Slider
    state.isTimeSliderOpen = false;
    const timeSliderContainer = document.getElementById('time-slider-container');
    if (timeSliderContainer) {
        timeSliderContainer.style.display = 'none';
        // Reset position
        timeSliderContainer.style.transform = 'translate3d(-50%, 0px, 0px)';
        timeSliderContainer.dataset.xOffset = 0;
        timeSliderContainer.dataset.yOffset = 0;
        
        // Reset timeline back to latest period
        if (state.availableDataPeriods && state.availableDataPeriods.length > 0) {
            const periods = [...state.availableDataPeriods].sort((a, b) => a.localeCompare(b));
            const latestPeriod = periods[periods.length - 1];
            state.currentDataPeriod = latestPeriod;
            
            const slider = document.getElementById('time-slider');
            if (slider) {
                slider.value = periods.length - 1;
            }
        }
    }
    
    // Reset to "Total" which will trigger UI button state re-renders
    state.setActiveMetric(state.activeMetric, 'Total');
    if (typeof window.renderSubgroupFilter === 'function') {
        window.renderSubgroupFilter();
    }
  });

  const sortDistrictBtn = document.getElementById('sort-district-btn');
  const sortStateBtn = document.getElementById('sort-state-btn');
  if (sortDistrictBtn && sortStateBtn) {
    sortDistrictBtn.addEventListener('click', (e) => {
      currentListSort = 'district';
      e.target.style.color = 'var(--accent-cyan)';
      sortStateBtn.style.color = '#8892b0';
      updateDetailsPanel();
    });

    sortStateBtn.addEventListener('click', (e) => {
      currentListSort = 'state';
      e.target.style.color = 'var(--accent-cyan)';
      sortDistrictBtn.style.color = '#8892b0';
      updateDetailsPanel();
    });
  }
});

window.toggleInspectorSection = function(section) {
  const btnIssuers = document.getElementById('btn-issuers');
  const btnProceeds = document.getElementById('btn-proceeds');
  
  if (btnIssuers && btnProceeds) {
    if (section === 'issuers') {
      btnIssuers.style.background = 'var(--accent-cyan)';
      btnIssuers.style.color = '#0e1117';
      btnProceeds.style.background = 'rgba(255,255,255,0.05)';
      btnProceeds.style.color = 'var(--text-main)';
    } else if (section === 'proceeds') {
      btnProceeds.style.background = 'var(--accent-cyan)';
      btnProceeds.style.color = '#0e1117';
      btnIssuers.style.background = 'rgba(255,255,255,0.05)';
      btnIssuers.style.color = 'var(--text-main)';
    } else {
      btnIssuers.style.background = 'rgba(255,255,255,0.05)';
      btnIssuers.style.color = 'var(--text-main)';
      btnProceeds.style.background = 'rgba(255,255,255,0.05)';
      btnProceeds.style.color = 'var(--text-main)';
    }
  }

  if (section === 'issuers') {
    document.getElementById('inspector-content-issuers').classList.remove('hidden');
    document.getElementById('inspector-content-proceeds').classList.add('hidden');
  } else if (section === 'proceeds') {
    document.getElementById('inspector-content-proceeds').classList.remove('hidden');
    document.getElementById('inspector-content-issuers').classList.add('hidden');
  } else {
    // Hide both (reset)
    document.getElementById('inspector-content-issuers').classList.add('hidden');
    document.getElementById('inspector-content-proceeds').classList.add('hidden');
    if (btnIssuers && btnProceeds) {
      btnIssuers.style.background = 'rgba(255,255,255,0.05)';
      btnIssuers.style.color = 'var(--text-main)';
      btnProceeds.style.background = 'rgba(255,255,255,0.05)';
      btnProceeds.style.color = 'var(--text-main)';
    }
  }
};


export function formatMetricValue(val, metricName, options = {}) {
  const { includeUnit = true, isHover = false } = options;

  if (['Total_Inv_Value', 'Sub_State_Inv_Value'].includes(metricName)) {
    return `$${val.toFixed(2)}B`;
  }
  if (['Sub_State_Sav_Value'].includes(metricName)) {
    return `$${val.toFixed(2)}M`;
  }
  if (['Small_Borrowers_Pct'].includes(metricName)) {
    return `${val.toFixed(1)}%`;
  }
  if (metricName.startsWith('Proceeds_')) {
    if (val >= 1000) return `$${(val / 1000).toFixed(2)}B`;
    return `$${val.toFixed(1)}M`;
  }
  
  const percentMetrics = [
    'Diabetes', 'Frequent_Mental_Distress', 'Frequent_Physical_Distress', 'High_Blood_Pressure', 'Independent_Living_Difficulty',
    'Low_Birthweight', 'Obesity', 'Broadband_Connection', 'Children_in_Poverty',
    'Chronic_Absenteeism', 'Food_Insecurity', 'High_School_Completion', 'Rent_Burden',
    'SNAP_Participation', 'Unemployment', 'Youth_Not_in_Work_or_School',
    'Binge_Drinking', 'Physical_Inactivity', 'Smoking', 'Housing_with_Potential_Lead_Risk',
    'Dental_Care', 'Designated_Primary_Care_Shortage_Area', 'Medicaid_Enrollment',
    'Prenatal_Care', 'Routine_Checkup,_18+', 'Uninsured'
  ];
  if (percentMetrics.some(p => metricName.startsWith(p))) {
    return `${val.toFixed(1)}%`;
  }
  
  const per100kMetrics = [
    'Breast_Cancer_Deaths', 'Cardiovascular_Disease_Deaths', 'Colorectal_Cancer_Deaths',
    'Firearm_Homicides', 'Firearm_Suicides', 'Opioid_Overdose_Deaths', 'Premature_Deaths_(All_Causes)'
  ];
  if (per100kMetrics.some(p => metricName.startsWith(p))) {
    if (!includeUnit) return val.toFixed(1);
    if (isHover) return `<br>${val.toFixed(1)} per 100,000`;
    return `${val.toFixed(1)}\u00A0per\u00A0100,000`;
  }

  if (metricName.startsWith('Teen_Births')) {
    if (!includeUnit) return val.toFixed(1);
    if (isHover) return `${val.toFixed(1)}<br>per 1,000`;
    return `${val.toFixed(1)}\u00A0per\u00A01,000`;
  }

  if (metricName.startsWith('Air_Pollution___Ozone')) {
    if (!includeUnit) return val.toFixed(1);
    if (isHover) return `${val.toFixed(1)}<br>ppb`;
    return `${val.toFixed(1)}\u00A0ppb`;
  }
  
  return Number.isInteger(val) ? val.toLocaleString() : val.toFixed(1);
}

export function updateDetailsPanel() {
  if (!state.selectedDistrict) {
    showOverview();
  } else {
    const distData = state.metricsData.find(d => d.District_Name === state.selectedDistrict);
    if (distData) {
      renderMuniInspector(distData);
    }
  }


  const dataField = state.getActiveDataField();

  const validData = state.metricsData.filter(d => {
    const v = parseFloat(d[dataField]);
    return !isNaN(v) && v !== -999;
  }).map(d => ({
    name: d.District_Name || d.GEOID,
    value: parseFloat(d[dataField]),
    geoid: d.GEOID
  })).sort((a, b) => b.value - a.value);

  if (validData.length > 0) {
    const minVal = validData[validData.length - 1].value;
    const maxVal = validData[0].value;
    document.getElementById('legend-min').innerText = formatMetricValue(minVal, state.activeMetric, { includeUnit: false });
    document.getElementById('legend-max').innerText = formatMetricValue(maxVal, state.activeMetric, { includeUnit: false });

    const usAvg = validData.reduce((acc, curr) => acc + curr.value, 0) / validData.length;
    
    // Always update the bottom pointer with the U.S. Average
    const bottomPointerValEl = document.getElementById('legend-pointer-value');
    if (bottomPointerValEl) bottomPointerValEl.innerText = formatMetricValue(usAvg, state.activeMetric, { includeUnit: true });
    const bottomPointerPct = getPercentageForValue(usAvg, state.getActiveDataField());
    const bottomPointerContainer = document.getElementById('legend-pointer-container');
    if (bottomPointerContainer) bottomPointerContainer.style.left = `${bottomPointerPct}%`;

    let topVal = 0;
    let topLabel = "District Average";
    let isStateAvg = false;
    let st = null;
    let topFormattedVal = "";

    const scaleSelect = document.getElementById('scale-comparison-select');
    const stateBtn = document.getElementById('scale-comparison-state-btn');
    
    if (state.selectedDistrict) {
      let parts = state.selectedDistrict.split(' ');
      if (parts.length > 1) parts.pop();
      st = parts.join(' ');

      if (stateBtn) {
        stateBtn.disabled = false;
        stateBtn.innerText = `${st} Average`;
      }
      
      if (scaleSelect && scaleSelect.value === 'state') {
        const stateData = validData.filter(d => (d.name || "").startsWith(st));
        if (stateData.length > 0) {
          topVal = stateData.reduce((acc, curr) => acc + curr.value, 0) / stateData.length;
          topLabel = `${st} Average`;
          isStateAvg = true;
        }
      } else {
        const distData = validData.find(d => d.name === state.selectedDistrict);
        if (distData) {
          topVal = distData.value;
          topLabel = "District Average";
        }
      }

      topFormattedVal = formatMetricValue(topVal, state.activeMetric, { includeUnit: false });
      const topPointerValEl = document.getElementById('legend-top-pointer-value');
      if (topPointerValEl) topPointerValEl.innerText = topFormattedVal;
      
      const topPointerLabelEl = document.getElementById('legend-top-pointer-label');
      if (topPointerLabelEl) topPointerLabelEl.innerText = topLabel;
  
      const topPct = getPercentageForValue(topVal, state.getActiveDataField());
      const topPointerContainer = document.getElementById('legend-top-pointer-container');
      if (topPointerContainer) topPointerContainer.style.left = `${topPct}%`;
    } else {
      if (stateBtn) {
        stateBtn.disabled = true;
        stateBtn.innerText = `State Average`;
      }
      if (scaleSelect) scaleSelect.value = 'us';
    }

    const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
    const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
    let metricLabel = state.activeMetric.replace(/_/g, ' ');
    if (activeBtn) metricLabel = activeBtn.innerText;
    else if (activeOption) metricLabel = activeOption.innerText;
    let year = state.currentDataPeriod || (state.availableDataPeriods && state.availableDataPeriods[0]) || 'Unknown Year';
    if (year.length === 6 && /^\d+$/.test(year)) {
      const yearStr = year.substring(0, 4);
      const monthStr = year.substring(4);
      const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
      const monthIdx = parseInt(monthStr, 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        year = `${months[monthIdx]} ${yearStr}`;
      } else {
        year = yearStr + '-' + monthStr;
      }
    }
    
    const isMuni = ['Total_Inv_Value', 'Total_Sav_Value', 'Total_Issuers', 'Small_Borrowers', 'Sub_State_Inv_Value', 'Sub_State_Sav_Value', 'Small_Borrowers_Pct'].includes(state.activeMetric) || state.activeMetric.startsWith('Proceeds_');
    
    let mapLegendText = '';
    
    if (!isMuni) {
      if (higherIsBetter.includes(state.activeMetric)) {
        mapLegendText = 'Higher values have<br>better outcomes.';
      } else if (!neutralMetrics.includes(state.activeMetric)) {
        mapLegendText = 'Lower values have<br>better outcomes.';
      }
    }

    // Default CDHD layout logic
    document.getElementById('legend-min-desc').style.display = 'none';
    document.getElementById('legend-max-desc').style.display = 'none';

    // Handle Income Inequality specific layout overrides
    if (state.activeMetric === 'Income_Inequality') {
      document.getElementById('legend-min-desc').style.display = 'block';
      document.getElementById('legend-min-desc').innerHTML = '<strong style="color:var(--text-primary);">Disadvantaged<br>Population</strong><br><span style="font-size:9px; opacity:0.8;">(&lt;$30k/year)</span>';
      
      document.getElementById('legend-max-desc').style.display = 'block';
      document.getElementById('legend-max-desc').innerHTML = '<strong style="color:var(--text-primary);">Advantaged<br>Population</strong><br><span style="font-size:9px; opacity:0.8;">(&gt;$150k/year)</span>';
    }



    let summaryFormattedVal = formatMetricValue(usAvg, state.activeMetric, { includeUnit: false });
    if (state.selectedDistrict) {
      summaryFormattedVal = topFormattedVal;
    }

    let summaryText = `Averaging across all congressional districts in the United States, the national average for <strong>${metricLabel.toLowerCase()}</strong> was <strong>${summaryFormattedVal}</strong> in <strong>${year}</strong>.`;
    
    if (isMuni) {
      summaryText = `Averaging across all congressional districts in the United States, the national average for <strong>${metricLabel.toLowerCase()}</strong> was <strong>${summaryFormattedVal}</strong>. Data current as of <strong>January 2025</strong>.`;
    } else if (metricDescriptions[state.activeMetric]) {
      summaryText = metricDescriptions[state.activeMetric]
        .replace('{avg}', `<strong>${summaryFormattedVal}</strong>`)
        .replace('{year}', `<strong>${year}</strong>`);
    }

    if (!isMuni && !neutralMetrics.includes(state.activeMetric)) {
        if (!summaryText.trim().endsWith('.')) {
          summaryText = summaryText.trim() + '.';
        }
        if (higherIsBetter.includes(state.activeMetric)) {
          summaryText += ' Higher values have better outcomes.';
        } else {
          summaryText += ' Lower values have better outcomes.';
        }
    }

    if (state.selectedDistrict) {
      if (isStateAvg && st) {
        summaryText = summaryText.replace('in the United States', `in ${st}`);
        summaryText = summaryText.replace('the national average', `the state average`);
      } else {
        // District average
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, an estimated', `In <strong>${state.selectedDistrict}</strong>, an estimated`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, the estimated', `In <strong>${state.selectedDistrict}</strong>, the estimated`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, there were', `In <strong>${state.selectedDistrict}</strong>, there were`);
        summaryText = summaryText.replace('Averaging across all congressional districts in the United States, prenatal care', `In <strong>${state.selectedDistrict}</strong>, prenatal care`);
        summaryText = summaryText.replace('the national average', `the district average`);
        summaryText = summaryText.replace('in the United States', `in <strong>${state.selectedDistrict}</strong>`);
      }
    }

    document.getElementById('legend-summary-text').innerHTML = summaryText;
    const natAvgValEl = document.getElementById('nat-avg-val');
    if (natAvgValEl) natAvgValEl.innerText = formatMetricValue(usAvg, state.activeMetric, { includeUnit: true });
  } else {
    document.getElementById('legend-min').innerText = '-';
    document.getElementById('legend-max').innerText = '-';
    document.getElementById('legend-pointer-value').innerText = '-';
    document.getElementById('legend-pointer-container').style.left = '50%';
    document.getElementById('legend-summary-text').innerText = 'No data available for this selection.';
    document.getElementById('nat-avg-val').innerText = '-';
  }

  const container = document.getElementById('ranked-list-container');
  container.innerHTML = '';

  const colorScale = getColorMapperForMetric(dataField);

  document.querySelector('.legend-bar').style.background = `linear-gradient(to right, ${scaleColors.join(', ')})`;

  // Group by State
  const stateGroups = {};
  validData.forEach(d => {
    const rawName = d.name.trim();
    const parts = rawName.split(' ');
    const stateName = parts.length > 1 ? parts.slice(0, -1).join(' ') : rawName;
    
    if (!stateGroups[stateName]) stateGroups[stateName] = { total: 0, count: 0, districts: [] };
    stateGroups[stateName].total += d.value;
    stateGroups[stateName].count += 1;
    stateGroups[stateName].districts.push(d);
  });

  // Calculate Averages and Sort States
  const sortedStates = Object.keys(stateGroups).map(st => ({
    name: st,
    avg: stateGroups[st].total / stateGroups[st].count,
    districts: stateGroups[st].districts.sort((a, b) => b.value - a.value)
  })).sort((a, b) => {
    if (currentListSort === 'state') {
      return b.avg - a.avg;
    } else {
      return b.districts[0].value - a.districts[0].value;
    }
  });

  sortedStates.forEach((st, i) => {
    const stateItem = document.createElement('div');
    stateItem.className = 'state-group';

    const stateHeader = document.createElement('div');
    stateHeader.className = 'state-header';
    stateHeader.innerHTML = `
      <div class="rank-badge">${i + 1}</div>
      <div class="rank-color-dot" style="background-color: ${colorScale(st.districts[0].value)}"></div>
      <div class="rank-name">${st.name} <span class="state-count">(${st.districts.length})</span></div>
      <div class="rank-val">${formatMetricValue(st.avg, state.activeMetric, { includeUnit: false })}</div>
    `;

    const districtsContainer = document.createElement('div');
    districtsContainer.className = 'state-districts';

    st.districts.forEach((d, j) => {
      const distItem = document.createElement('div');
      distItem.className = 'ranked-item district-item';
      distItem.innerHTML = `
        <div class="rank-badge">${j + 1}</div>
        <div class="rank-color-dot" style="background-color: ${colorScale(d.value)}"></div>
        <div class="rank-name">${d.name}</div>
        <div class="rank-val">${formatMetricValue(d.value, state.activeMetric, { includeUnit: false })}</div>
      `;
      distItem.addEventListener('click', (e) => {
        e.stopPropagation();
        flyToDistrict(d.geoid);
      });
      districtsContainer.appendChild(distItem);
    });

    stateHeader.addEventListener('click', () => {
      stateHeader.classList.toggle('expanded');
      districtsContainer.classList.toggle('expanded');
    });

    stateItem.appendChild(stateHeader);
    stateItem.appendChild(districtsContainer);
    container.appendChild(stateItem);
  });
}

export function generateMiniChartHTML(jsonString, nameKey, valKey) {
  if (!jsonString) {
    return '<span style="font-size:11px;color:#888;">No data available</span>';
  }
  try {
    let parsed = jsonString;
    if (typeof jsonString === 'string') {
      try { parsed = JSON.parse(jsonString); } 
      catch(e) { parsed = JSON.parse(jsonString.replace(/""/g, '"')); }
    }
    
    const data = parsed;
    if (!data || !data.length) {
      return '<span style="font-size:11px;color:#888;">No data</span>';
    }
    const sorted = data.sort((a, b) => b[valKey] - a[valKey]);
    const maxVal = sorted[0][valKey];
    
    let html = '';
    sorted.forEach(d => {
      let fVal = d[valKey];
      if (fVal > 1e9) fVal = '$' + (fVal/1e9).toFixed(1) + 'B';
      else if (fVal > 1e6) fVal = '$' + (fVal/1e6).toFixed(1) + 'M';
      else fVal = '$' + fVal.toLocaleString();
      
      html += `
        <div class="mini-bar-row">
          <div class="mini-bar-label">
            <span>${d[nameKey]}</span>
            <span>${fVal}</span>
          </div>
          <div class="mini-bar-bg">
            <div class="mini-bar-fill" style="width: ${((d[valKey] / maxVal) * 100)}%;"></div>
          </div>
        </div>
      `;
    });
    return html;
  } catch (e) {
    return `<span style="font-size:11px;color:red;">Parse err: ${e.message}</span>`;
  }
}

export function renderMuniInspector(props) {
  showDistrictDetail(props);
  const issuerContainer = document.getElementById('issuer-chart');
  const proceedsContainer = document.getElementById('proceeds-chart');
  issuerContainer.innerHTML = generateMiniChartHTML(props.Jurisdiction_Data, 'Issuer', 'Amount');
  proceedsContainer.innerHTML = generateMiniChartHTML(props.Proceeds_Data, 'Category', 'Amount');

  const titleIssuers = document.getElementById('title-issuers');
  const titleProceeds = document.getElementById('title-proceeds');
  if (titleIssuers) titleIssuers.innerText = `TOP ISSUERS FOR ${props.District_Name.toUpperCase()}`;
  if (titleProceeds) titleProceeds.innerText = `USE OF PROCEEDS FOR ${props.District_Name.toUpperCase()}`;

  // Open 'issuers' by default
  window.toggleInspectorSection('issuers');
}

export function toggleCompareDropdown(side, forceOpen = false) {
  const dropdown = document.getElementById(`compare-dropdown-${side}`);
  if (!dropdown) return;
  
  const isHidden = dropdown.style.display === 'none' || dropdown.style.display === '';
  
  ['left', 'right'].forEach(s => {
    const d = document.getElementById(`compare-dropdown-${s}`);
    if (d) {
      if (forceOpen || isHidden) {
        populateCompareDropdown(s);
        d.style.display = 'block';
      } else {
        d.style.display = 'none';
      }
    }
  });
}

function renderCompareTopLowest5(sorted, totalCount, field, metric, formatName) {
  const top5 = sorted.slice(0, 5);
  const bottom5 = sorted.slice(-5).reverse(); 
  
  return `
    <div style="margin-bottom: 12px;">
      <div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Highest 5</div>
      ${top5.map((d, i) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;">${i+1}. ${formatName(d)}</span>
          <span style="font-weight: 500; flex-shrink: 0;">${formatMetricValue(parseFloat(d[field]), metric, { includeUnit: false })}</span>
        </div>
      `).join('')}
    </div>
    
    <div>
      <div style="color: var(--text-muted); font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Lowest 5</div>
      ${bottom5.map((d, i) => `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; margin-right: 8px;">${totalCount - i}. ${formatName(d)}</span>
          <span style="font-weight: 500; flex-shrink: 0;">${formatMetricValue(parseFloat(d[field]), metric, { includeUnit: false })}</span>
        </div>
      `).join('')}
    </div>
  `;
}

function populateCompareDropdown(side) {
  const dropdown = document.getElementById(`compare-dropdown-${side}`);
  if (!dropdown) return;

  const metric = side === 'left' ? state.compareLeftMetric : state.compareRightMetric;
  const field = state.getCompareField(side);
  const isMuni = ['Total_Inv_Value', 'Total_Sav_Value', 'Total_Issuers', 'Small_Borrowers', 'Sub_State_Inv_Value', 'Sub_State_Sav_Value', 'Small_Borrowers_Pct'].includes(metric) || metric.startsWith('Proceeds_');
  
  const validData = state.metricsData.filter(d => {
    const v = parseFloat(d[field]);
    return !isNaN(v) && v !== -999;
  });
  
  if (validData.length === 0) {
    dropdown.innerHTML = '<div style="padding: 10px; text-align: center; color: var(--text-muted);">No data available</div>';
    return;
  }
  
  const sum = validData.reduce((acc, curr) => acc + parseFloat(curr[field]), 0);
  const avg = sum / validData.length;
  
  const sorted = [...validData].sort((a, b) => parseFloat(b[field]) - parseFloat(a[field]));
  const formatName = d => d.District_Name || d.GEOID;
  const metricNameDisplay = metric.replace(/_/g, ' ').replace('Inv', 'Investment').replace('Sav', 'Savings');
  let year = state.currentDataPeriod || (state.availableDataPeriods && state.availableDataPeriods[0]) || '2023';
  if (year.length === 6 && /^\d+$/.test(year)) {
    const yearStr = year.substring(0, 4);
    const monthStr = year.substring(4);
    const months = ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'];
    const monthIdx = parseInt(monthStr, 10) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      year = `${months[monthIdx]} ${yearStr}`;
    } else {
      year = yearStr + '-' + monthStr;
    }
  }
  
  let html = '<div style="padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); margin-top: 12px; font-size: 12px;">';
  
  let avgText = '';
  if (isMuni) {
    avgText = `Averaging across all congressional districts, the national average for ${metricNameDisplay.toLowerCase()} was ${formatMetricValue(avg, metric)}. Data current as of January 2025.`;
  } else {
    avgText = `Averaging across all congressional districts, the national average was ${formatMetricValue(avg, metric, { includeUnit: true })} in ${year}.`;
    if (!neutralMetrics.includes(metric)) {
      if (higherIsBetter.includes(metric)) {
        avgText += ' Higher values have better outcomes.';
      } else {
        avgText += ' Lower values have better outcomes.';
      }
    }
  }
  
  if (state.selectedDistrict) {
    const distData = validData.find(d => d.District_Name === state.selectedDistrict);
    if (distData) {
      const distVal = formatMetricValue(parseFloat(distData[field]), metric);
      
      html += `
        <div style="margin-bottom: 16px;">
          <div style="font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Metric Details</div>
          <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 2px;">${state.selectedDistrict}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 16px;">${isMuni ? 'District Specifics, Top Issuers, and Use of Proceeds' : 'District Specifics'}</div>
          
          <div style="font-size: 24px; font-weight: 700; color: var(--accent-blue); margin-bottom: 2px;">${distVal}</div>
          <div style="font-size: 12px; font-weight: 500; color: var(--text-primary); margin-bottom: 16px;">${metricNameDisplay}</div>

          <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: 16px;">${avgText}</div>
        </div>
      `;
      
      if (isMuni) {
        html += `
          <div style="display: flex; margin-bottom: 12px; background: rgba(0,0,0,0.3); padding: 2px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.1);">
            <button id="compare-toggle-issuer-${side}" style="flex: 1; padding: 6px 4px; font-size: 11px; font-weight: 600; background: rgba(255,255,255,0.1); color: var(--accent-cyan); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; cursor: pointer; transition: all 0.2s;">Top Issuers</button>
            <button id="compare-toggle-proceeds-${side}" style="flex: 1; padding: 6px 4px; font-size: 11px; font-weight: 600; background: transparent; color: var(--text-muted); border: 1px solid transparent; border-radius: 4px; cursor: pointer; transition: all 0.2s;">Use of Proceeds</button>
          </div>
          <div id="compare-chart-issuer-${side}" class="list-scroll-area" style="max-height: 160px; overflow-y: auto; padding-right: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Top Issuers for ${distData.District_Name}</p>
            ${generateMiniChartHTML(distData.Jurisdiction_Data, 'Issuer', 'Amount')}
          </div>
          <div id="compare-chart-proceeds-${side}" class="list-scroll-area" style="display: none; max-height: 160px; overflow-y: auto; padding-right: 4px;">
            <p style="margin: 0 0 8px 0; font-size: 10px; color: var(--text-muted); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px;">Use of Proceeds for ${distData.District_Name}</p>
            ${generateMiniChartHTML(distData.Proceeds_Data, 'Category', 'Amount')}
          </div>
        `;
        
        setTimeout(() => {
          const btnIss = document.getElementById(`compare-toggle-issuer-${side}`);
          const btnProc = document.getElementById(`compare-toggle-proceeds-${side}`);
          const divIss = document.getElementById(`compare-chart-issuer-${side}`);
          const divProc = document.getElementById(`compare-chart-proceeds-${side}`);
          if (btnIss && btnProc && divIss && divProc) {
            btnIss.addEventListener('click', () => {
              btnIss.style.background = 'rgba(255,255,255,0.1)'; btnIss.style.color = 'var(--accent-cyan)'; btnIss.style.border = '1px solid rgba(255,255,255,0.2)';
              btnProc.style.background = 'transparent'; btnProc.style.color = 'var(--text-muted)'; btnProc.style.border = '1px solid transparent';
              divIss.style.display = 'block'; divProc.style.display = 'none';
            });
            btnProc.addEventListener('click', () => {
              btnProc.style.background = 'rgba(255,255,255,0.1)'; btnProc.style.color = 'var(--accent-cyan)'; btnProc.style.border = '1px solid rgba(255,255,255,0.2)';
              btnIss.style.background = 'transparent'; btnIss.style.color = 'var(--text-muted)'; btnIss.style.border = '1px solid transparent';
              divProc.style.display = 'block'; divIss.style.display = 'none';
            });
          }
        }, 0);
      } else {
        html += renderCompareTopLowest5(sorted, validData.length, field, metric, formatName);
      }
    } else {
      html += '<div style="color: var(--text-muted); text-align: center;">No data for selected district</div>';
    }
  } else {
    html += `
      <div style="margin-bottom: 16px;">
        <div style="font-size: 16px; font-weight: 700; color: var(--text-primary); margin-bottom: 4px;">${formatMetricValue(avg, metric)} <span style="font-weight: 500;">${metricNameDisplay}</span></div>
        <div style="font-size: 11px; color: rgba(255, 255, 255, 0.85); line-height: 1.5; margin-bottom: 12px;">${avgText}</div>
      </div>
    `;
    html += renderCompareTopLowest5(sorted, validData.length, field, metric, formatName);
  }
  
  html += '</div>';
  dropdown.innerHTML = html;
}

function attachCompareTooltipEvents() {
  ['left', 'right'].forEach(side => {
    const icon = document.getElementById(`compare-info-icon-${side}`);
    const tooltip = document.getElementById(`compare-info-tooltip-${side}`);
    if (icon && tooltip) {
      const showTooltip = () => {
        const rect = icon.getBoundingClientRect();
        let left = rect.left - 150 + (rect.width / 2);
        if (left < 10) left = 10;
        if (left + 300 > window.innerWidth) left = window.innerWidth - 310;
        let top = rect.bottom + 8;
        
        tooltip.style.left = left + 'px';
        tooltip.style.top = top + 'px';
        tooltip.style.opacity = '1';
        tooltip.style.visibility = 'visible';
      };
      const hideTooltip = () => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
      };
      
      icon.addEventListener('mouseenter', showTooltip);
      icon.addEventListener('mouseleave', hideTooltip);
    }
  });
}

export function updateCompareLegends() {
  const leftField = state.getCompareField('left');
  const rightField = state.getCompareField('right');
  
  const leftExtent = state.getMetricExtent(leftField);
  const rightExtent = state.getMetricExtent(rightField);
  
  const leftMetricName = state.compareLeftMetric.replace(/_/g, ' ').replace('Inv', 'Investment').replace('Sav', 'Savings');
  const rightMetricName = state.compareRightMetric.replace(/_/g, ' ').replace('Inv', 'Investment').replace('Sav', 'Savings');
  
  const leftColors = scaleColors;
  const rightColors = scaleColors;

  const leftBar = document.getElementById('compare-legend-left');
  const rightBar = document.getElementById('compare-legend-right');
  
  const leftMeta = metricMeta[state.compareLeftMetric] || { source_name: 'Unknown Source', data_period: 'N/A' };
  const rightMeta = metricMeta[state.compareRightMetric] || { source_name: 'Unknown Source', data_period: 'N/A' };

  const getPointerInfo = (field, metric) => {
    const validData = state.metricsData.filter(d => {
      const v = parseFloat(d[field]);
      return !isNaN(v) && v !== -999;
    });
    if (!validData.length) return { pct: 50, val: '-' };
    
    let targetVal = 0;
    if (state.selectedDistrict) {
      const distData = validData.find(d => d.District_Name === state.selectedDistrict);
      if (distData) {
        targetVal = parseFloat(distData[field]);
      } else {
        return { pct: 50, val: '-' };
      }
    } else {
      targetVal = validData.reduce((acc, curr) => acc + parseFloat(curr[field]), 0) / validData.length;
    }
    
    const extent = state.getMetricExtent(field);
    const pct = ((targetVal - extent[0]) / (extent[1] - extent[0])) * 100;
    return { pct: Math.max(0, Math.min(100, pct)), val: formatMetricValue(targetVal, metric) };
  };

  if (leftBar && rightBar) {
    const minLeft = formatMetricValue(leftExtent[0], state.compareLeftMetric, { includeUnit: false });
    const maxLeft = formatMetricValue(leftExtent[1], state.compareLeftMetric, { includeUnit: false });
    const minRight = formatMetricValue(rightExtent[0], state.compareRightMetric, { includeUnit: false });
    const maxRight = formatMetricValue(rightExtent[1], state.compareRightMetric, { includeUnit: false });
    const leftPointerInfo = getPointerInfo(leftField, state.compareLeftMetric);
    const rightPointerInfo = getPointerInfo(rightField, state.compareRightMetric);

    let leftMetricNameDisplay = leftMetricName;
    let rightMetricNameDisplay = rightMetricName;
    if (state.selectedDistrict) {
      leftMetricNameDisplay = `${leftMetricName}: ${state.selectedDistrict}`;
      rightMetricNameDisplay = `${rightMetricName}: ${state.selectedDistrict}`;
    }

    leftBar.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <div style="font-weight: 500; display: flex; align-items: center;">
          ${leftMetricNameDisplay}
          <i id="compare-info-icon-left" class="fas fa-info-circle" style="color: var(--text-muted); font-size: 11px; margin-left: 6px; cursor: help;"></i>
        </div>
        <button id="compare-details-btn-left" style="background: var(--bg-dark); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; transition: background 0.2s;">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
        <span>${minLeft}</span>
        <div style="flex-grow: 1; height: 8px; margin: 0 10px; border-radius: 4px; background: linear-gradient(to right, ${leftColors.join(', ')}); position: relative;">
          <div style="position: absolute; left: ${leftPointerInfo.pct}%; top: 100%; transform: translateX(-50%); display: ${leftPointerInfo.val === '-' ? 'none' : 'flex'}; flex-direction: column; align-items: center; z-index: 10;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 4px solid white;"></div>
            <div style="font-size: 10px; color: white; font-weight: bold; margin-top: 1px; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 3px;">${leftPointerInfo.val}</div>
          </div>
        </div>
        <span>${maxLeft}</span>
      </div>
      <div id="compare-dropdown-left" style="display: none;"></div>
      
      <div id="compare-info-tooltip-left" class="glass-panel" style="position: fixed; width: 300px; padding: 12px; font-size: 11px; font-weight: normal; line-height: 1.5; color: var(--text-primary); text-transform: none; opacity: 0; visibility: hidden; transition: opacity 0.2s; z-index: 10000; pointer-events: none;">
        Source: ${leftMeta.source_name}<br>Data from: ${leftMeta.data_period || leftMeta.year || '2023'}
      </div>
    `;

    rightBar.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
        <div style="font-weight: 500; display: flex; align-items: center;">
          ${rightMetricNameDisplay}
          <i id="compare-info-icon-right" class="fas fa-info-circle" style="color: var(--text-muted); font-size: 11px; margin-left: 6px; cursor: help;"></i>
        </div>
        <button id="compare-details-btn-right" style="background: var(--bg-dark); border: 1px solid var(--glass-border); color: var(--text-primary); border-radius: 6px; padding: 4px 8px; font-size: 11px; cursor: pointer; transition: background 0.2s;">
          <i class="fas fa-info-circle"></i> Details
        </button>
      </div>
      <div style="display: flex; align-items: center; justify-content: space-between; font-size: 11px; margin-bottom: 8px;">
        <span>${minRight}</span>
        <div style="flex-grow: 1; height: 8px; margin: 0 10px; border-radius: 4px; background: linear-gradient(to right, ${rightColors.join(', ')}); position: relative;">
          <div style="position: absolute; left: ${rightPointerInfo.pct}%; top: 100%; transform: translateX(-50%); display: ${rightPointerInfo.val === '-' ? 'none' : 'flex'}; flex-direction: column; align-items: center; z-index: 10;">
            <div style="width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-bottom: 4px solid white;"></div>
            <div style="font-size: 10px; color: white; font-weight: bold; margin-top: 1px; background: rgba(0,0,0,0.6); padding: 1px 4px; border-radius: 3px;">${rightPointerInfo.val}</div>
          </div>
        </div>
        <span>${maxRight}</span>
      </div>
      <div id="compare-dropdown-right" style="display: none;"></div>
      
      <div id="compare-info-tooltip-right" class="glass-panel" style="position: fixed; width: 300px; padding: 12px; font-size: 11px; font-weight: normal; line-height: 1.5; color: var(--text-primary); text-transform: none; opacity: 0; visibility: hidden; transition: opacity 0.2s; z-index: 10000; pointer-events: none;">
        Source: ${rightMeta.source_name}<br>Data from: ${rightMeta.data_period || rightMeta.year || '2023'}
      </div>
    `;

    setTimeout(() => {
      ['left', 'right'].forEach(s => {
        const btn = document.getElementById(`compare-details-btn-${s}`);
        if(btn) {
           btn.addEventListener('click', () => toggleCompareDropdown(s));
           btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(255,255,255,0.1)');
           btn.addEventListener('mouseleave', () => btn.style.background = 'var(--bg-dark)');
        }
      });
      
      attachCompareTooltipEvents();
      
      if (state.selectedDistrict || state.selectedDistrictLeft || state.selectedDistrictRight) {
        toggleCompareDropdown('left', true);
        toggleCompareDropdown('right', true);
      }
    }, 0);
  }
}
