import { state } from './state.js';
import { initMap, updateMap, resizeMap, resetMapView, highlightSelected, flyToDistrict, setupCompareMode, disableCompareMode } from './views/map.js';
import { updateDetailsPanel, updateCompareLegends } from './views/details.js';
import { initScatterPlotControls, updateScatterPlot } from './views/charts.js';

import { updateInsights } from './views/insights.js';
import { METRIC_META } from './metric_meta.js';
import { initTutorial, startTutorial } from './tutorial.js';

export const METRICS_BY_CATEGORY = {
  bonds: [
    { id: 'Total_Inv_Value', name: 'Total Investment Value' },
    { id: 'Total_Issuers', name: 'Total Issuers' },
    { id: 'Small_Borrowers', name: 'Small Borrowers' },
    { id: 'Sub_State_Inv_Value', name: 'Sub-State Investment' },
    { id: 'Sub_State_Inv_Unit', name: 'Sub State Inv Unit' },
    { id: 'Sub_State_Sav_Value', name: 'District Taxpayer Savings' },
    { id: 'Small_Borrowers_Pct', name: 'Small Borrowers Percent (%)' }
  ],
  outcomes: [
    { id: 'Breast_Cancer_Deaths', name: 'Breast Cancer Deaths' },
    { id: 'Cardiovascular_Disease_Deaths', name: 'Cardiovascular Disease Deaths' },
    { id: 'Colorectal_Cancer_Deaths', name: 'Colorectal Cancer Deaths' },
    { id: 'Diabetes', name: 'Diabetes' },
    { id: 'Firearm_Homicides', name: 'Firearm Homicides' },
    { id: 'Firearm_Suicides', name: 'Firearm Suicides' },
    { id: 'Frequent_Mental_Distress', name: 'Frequent Mental Distress' },
    { id: 'Frequent_Physical_Distress', name: 'Frequent Physical Distress' },
    { id: 'High_Blood_Pressure', name: 'High Blood Pressure' },
    { id: 'Independent_Living_Difficulty', name: 'Independent Living Difficulty' },
    { id: 'Life_Expectancy', name: 'Life Expectancy' },
    { id: 'Low_Birthweight', name: 'Low Birthweight' },
    { id: 'Obesity', name: 'Obesity' },
    { id: 'Opioid_Overdose_Deaths', name: 'Opioid Overdose Deaths' },
    { id: 'Premature_Deaths_(All_Causes)', name: 'Premature Deaths (All Causes)' }
  ],
  socioeconomic: [
    { id: 'Broadband_Connection', name: 'Broadband Connection' },
    { id: 'Children_in_Poverty', name: 'Children in Poverty' },
    { id: 'Chronic_Absenteeism', name: 'Chronic Absenteeism' },
    { id: 'Food_Insecurity', name: 'Food Insecurity' },
    { id: 'High_School_Completion', name: 'High School Completion' },
    { id: 'Income_Inequality', name: 'Income Inequality' },
    { id: 'Neighborhood_Racial/Ethnic_Segregation', name: 'Neighborhood Racial/Ethnic Segregation' },
    { id: 'Racial/Ethnic_Diversity', name: 'Racial/Ethnic Diversity' },
    { id: 'Rent_Burden', name: 'Rent Burden' },
    { id: 'SNAP_Participation', name: 'SNAP Participation' },
    { id: 'Unemployment', name: 'Unemployment' },
    { id: 'Youth_Not_in_Work_or_School', name: 'Youth Not in Work or School' }
  ],
  behaviors: [
    { id: 'Binge_Drinking', name: 'Binge Drinking' },
    { id: 'Physical_Inactivity', name: 'Physical Inactivity' },
    { id: 'Smoking', name: 'Smoking' },
    { id: 'Teen_Births', name: 'Teen Births' }
  ],
  environment: [
    { id: 'Air_Pollution___Ozone', name: 'Air Pollution - Ozone' },
    { id: 'Air_Pollution___Particulate_Matter', name: 'Air Pollution - Particulate Matter' },
    { id: 'Housing_with_Potential_Lead_Risk', name: 'Housing with Potential Lead Risk' },
    { id: 'Lead_Exposure_Risk_Index', name: 'Lead Exposure Risk Index' }
  ],
  care: [
    { id: 'Dental_Care', name: 'Dental Care' },
    { id: 'Designated_Primary_Care_Shortage_Area', name: 'Designated Primary Care Shortage Area' },
    { id: 'Medicaid_Enrollment', name: 'Medicaid Enrollment' },
    { id: 'Prenatal_Care', name: 'Prenatal Care' },
    { id: 'Routine_Checkup,_18+', name: 'Routine Checkup, 18+' },
    { id: 'Uninsured', name: 'Uninsured' }
  ],
  proceeds: [
    { id: 'Proceeds_Education_Total', name: 'Education' },
    { id: 'Proceeds_Healthcare_Total', name: 'Healthcare & Human Services' },
    { id: 'Proceeds_Housing_Total', name: 'Housing' },
    { id: 'Proceeds_Utilities_Total', name: 'Utilities & Environment' },
    { id: 'Proceeds_Transportation_Total', name: 'Transportation' },
    { id: 'Proceeds_Infrastructure_Total', name: 'Infrastructure & Public Facilities' },
    { id: 'Proceeds_Economic_Dev_Total', name: 'Economic & Commercial Development' },
    { id: 'Proceeds_Recreation_Total', name: 'Recreation & Culture' },
    { id: 'Proceeds_Other_Total', name: 'Other / Unclassified' }
  ]
};

function updateAllViews() {
  updateMap();
  if (state.compareMode) {
    updateCompareLegends();
  } else {
    updateDetailsPanel();
  }
  renderTimeSliderGraph();
  updateScatterPlot();

  updateInsights();
  renderSubgroupFilter();
}

window.renderSubgroupFilter = renderSubgroupFilter;
function renderSubgroupFilter() {
  const modeRadios = document.querySelector('input[name="sidebar-mode"]:checked');
  const mode = modeRadios ? modeRadios.value : 'bonds';
  
  if (mode === 'compare') {
      document.getElementById('bottom-radial-menu').classList.add('hidden');
      
      const leftContainer = document.getElementById('compare-left-dock-container');
      const rightContainer = document.getElementById('compare-right-dock-container');
      
      if (state.compareLeftSource === 'esg') {
          document.getElementById('bottom-compare-left-menu').classList.remove('hidden');
          buildSubgroupFilterUI(leftContainer, state.compareLeftMetric, state.compareLeftGroup, state.compareLeftPeriod, state.availableDataPeriods, true, 'left');
      } else {
          document.getElementById('bottom-compare-left-menu').classList.add('hidden');
      }
      
      if (state.compareRightSource === 'esg') {
          document.getElementById('bottom-compare-right-menu').classList.remove('hidden');
          buildSubgroupFilterUI(rightContainer, state.compareRightMetric, state.compareRightGroup, state.compareRightPeriod, state.availableDataPeriods, true, 'right');
      } else {
          document.getElementById('bottom-compare-right-menu').classList.add('hidden');
      }
      
  } else {
      document.getElementById('bottom-compare-left-menu').classList.add('hidden');
      document.getElementById('bottom-compare-right-menu').classList.add('hidden');
      
      const mainContainer = document.getElementById('radial-dock-container');
      if (mode === 'esg') {
          document.getElementById('bottom-radial-menu').classList.remove('hidden');
          buildSubgroupFilterUI(mainContainer, state.activeMetric, state.activeGroup, state.currentDataPeriod, state.availableDataPeriods, false, 'main');
      } else {
          document.getElementById('bottom-radial-menu').classList.add('hidden');
      }
  }
}

function buildSubgroupFilterUI(container, metric, activeGroup, currentPeriod, availablePeriods, isCompareMode, side) {
  if (!container) return;
  container.innerHTML = '';
  
  const groups = state.metricGroups[metric] || [];
  const hasSubgroups = groups.length > 1;
  
  let periods = availablePeriods;
  const isBondMetric = ["Total_Inv_Value", "Total_Issuers", "Small_Borrowers", "Sub_State_Inv_Value", "Sub_State_Inv_Unit", "Sub_State_Sav_Value", "Small_Borrowers_Pct"].includes(metric) || metric.startsWith("Proceeds_");
  
  if (isBondMetric) {
      periods = [];
  } else if (!periods || periods.length === 0) {
      const pSet = new Set();
      if (state.metricsData && state.metricsData.length > 0) {
          const record = state.metricsData[0];
          const formattedGroup = activeGroup.replace(/ /g, '_').replace(/-/g, '_');
          const prefix = `${metric}__${formattedGroup}__`;
          Object.keys(record).forEach(key => {
              if (key.startsWith(prefix)) {
                  pSet.add(key.replace(prefix, ''));
              }
          });
      }
      periods = Array.from(pSet).sort((a, b) => b.localeCompare(a));
  }
  const hasTimeline = periods && periods.length > 1;
  
  // Close the time slider if it's open but this subgroup has no timeline
  const targetKey = isCompareMode ? side : 'main';
  if (!hasTimeline && state.isTimeSliderOpen[targetKey]) {
      state.isTimeSliderOpen[targetKey] = false;
      renderTimeSliderGraph();
  }
  
  if (!hasSubgroups && !hasTimeline) {
      return;
  }
  
  const categories = { 'Total': [], 'Gender': [], 'Ethnicity': [], 'Age': [] };
  const ethnicityOptions = ["White", "Black", "Asian", "Hispanic", "Other", "Native American", "Two or More Races"];
  
  groups.forEach(g => {
      if (g === 'Total') categories['Total'].push(g);
      else if (g === 'Female' || g === 'Male') categories['Gender'].push(g);
      else if (g.startsWith('Age')) categories['Age'].push(g);
      else if (ethnicityOptions.includes(g)) categories['Ethnicity'].push(g);
      else categories['Total'].push(g);
  });

  Object.keys(categories).forEach(cat => {
      const items = categories[cat];
      if (items.length === 0) return;

      const groupDiv = document.createElement('div');
      groupDiv.className = 'radial-group';
      
      const mainBtn = document.createElement('button');
      mainBtn.className = 'radial-main-btn';
      mainBtn.textContent = cat;
      
      const subgroupWin = document.getElementById('subgroup-window-container');
      const header = document.getElementById('subgroup-window-header');
      const isSubgroupOpen = !isCompareMode && subgroupWin && subgroupWin.style.display === 'flex';
      const isThisCategoryOpen = isSubgroupOpen && header && header.textContent === cat;

      if (isThisCategoryOpen) {
          mainBtn.classList.add('active');
          mainBtn.textContent = cat;
      } else if (items.includes(activeGroup)) {
          if (cat === 'Total' && (isSubgroupOpen || (!isCompareMode && state.isTimeSliderOpen.main))) {
          } else {
               mainBtn.classList.add('active');
          }
          if (cat !== 'Total') {
              mainBtn.textContent = `${cat}: ${activeGroup}`;
          }
      }

      if (items.length === 1 && items[0] === cat) {
        mainBtn.addEventListener('click', () => {
          if (!isCompareMode) {
              if (subgroupWin) subgroupWin.style.display = 'none';
              state.isTimeSliderOpen = { main: false, left: false, right: false };
              ['main', 'left', 'right'].forEach(t => {
                  const c = document.getElementById(`time-slider-container-${t}`);
                  if (c) c.style.display = 'none';
              });
              if (true) {
                  if (state.availableDataPeriods && state.availableDataPeriods.length > 0) {
                      const periods = [...state.availableDataPeriods].sort((a, b) => a.localeCompare(b));
                      state.currentDataPeriod = periods[periods.length - 1];
                  }
              }
              state.setActiveMetric(metric, 'Total');
          } else {
              if (side === 'left') {
                  state.isTimeSliderOpen.left = false;
                  const c = document.getElementById(`time-slider-container-left`);
                  if (c) c.style.display = 'none';
                  state.setCompareLeftMetric(state.compareLeftSource, metric, 'Total', state.compareLeftPeriod);
              } else {
                  state.isTimeSliderOpen.right = false;
                  const c = document.getElementById(`time-slider-container-right`);
                  if (c) c.style.display = 'none';
                  state.setCompareRightMetric(state.compareRightSource, metric, 'Total', state.compareRightPeriod);
              }
              renderTimeSliderGraph();
          }
        });
        groupDiv.appendChild(mainBtn);
      } else {
            const hoverMenu = document.createElement('div');
            hoverMenu.className = 'filter-hover-menu glass-panel';
            
            const titleSpan = document.createElement('span');
            titleSpan.className = 'filter-hover-title';
            titleSpan.textContent = `Select ${cat}`;
            hoverMenu.appendChild(titleSpan);

            const itemsContainer = document.createElement('div');
            itemsContainer.style.display = 'flex';
            itemsContainer.style.gap = '12px';
            itemsContainer.style.flexWrap = 'nowrap';
            hoverMenu.appendChild(itemsContainer);

            items.forEach((item) => {
                const itemBtn = document.createElement('button');
                itemBtn.className = 'filter-hover-btn';
                if (item === activeGroup) itemBtn.classList.add('active');
                itemBtn.textContent = item;
                
                itemBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    hoverMenu.style.display = 'none';
                    if (!isCompareMode) {
                        state.setActiveMetric(metric, item);
                    } else if (side === 'left') {
                        state.isTimeSliderOpen.left = false;
                        const c = document.getElementById(`time-slider-container-left`);
                        if (c) c.style.display = 'none';
                        state.setCompareLeftMetric(state.compareLeftSource, metric, item, state.compareLeftPeriod);
                    } else {
                        state.isTimeSliderOpen.right = false;
                        const c = document.getElementById(`time-slider-container-right`);
                        if (c) c.style.display = 'none';
                        state.setCompareRightMetric(state.compareRightSource, metric, item, state.compareRightPeriod);
                    }
                    if (isCompareMode) renderTimeSliderGraph();
                });
                itemsContainer.appendChild(itemBtn);
            });
            
            groupDiv.appendChild(mainBtn);
            groupDiv.appendChild(hoverMenu);
      }
      container.appendChild(groupDiv);
            
      // HOVER DODGE LOGIC (Only for buttons with hover menus)
      if (cat !== 'Total') {
          groupDiv.addEventListener('mouseenter', () => {
              const c = document.getElementById(`time-slider-container-${targetKey}`);
              if (c && state.isTimeSliderOpen[targetKey]) {
                  // Only move if it hasn't been dragged (yOffset is 0)
                  if (!c.dataset.yOffset || parseFloat(c.dataset.yOffset) === 0) {
                      c.style.bottom = '160px'; // Shift up
                  }
              }
          });
          groupDiv.addEventListener('mouseleave', () => {
              const c = document.getElementById(`time-slider-container-${targetKey}`);
              if (c && state.isTimeSliderOpen[targetKey]) {
                  if (!c.dataset.yOffset || parseFloat(c.dataset.yOffset) === 0) {
                      c.style.bottom = '80px'; // Revert back
                  }
              }
          });
      }
  });

  if (hasTimeline) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'radial-group';
      
      const mainBtn = document.createElement('button');
      mainBtn.className = 'radial-main-btn';
      
      const isThisSideSliderOpen = state.isTimeSliderOpen[targetKey];
      if (isThisSideSliderOpen) {
          mainBtn.classList.add('active');
          mainBtn.textContent = 'Timeline';
      } else {
          if (state.timelineInteracted && state.timelineInteracted[targetKey]) {
              let displayPeriod = currentPeriod || periods[0];
              if (displayPeriod && displayPeriod.length === 6 && /^\d+$/.test(displayPeriod)) {
                  displayPeriod = displayPeriod.substring(4) + '-' + displayPeriod.substring(0, 4);
              }
              mainBtn.classList.add('active');
              mainBtn.textContent = `Timeline: ${displayPeriod}`;
          } else {
              mainBtn.textContent = 'Timeline';
          }
      }
      groupDiv.appendChild(mainBtn);
      
      mainBtn.addEventListener('click', () => {
          const subgroupWin = document.getElementById('subgroup-window-container');
          if (subgroupWin) subgroupWin.style.display = 'none';
          
          state.isTimeSliderOpen[targetKey] = !state.isTimeSliderOpen[targetKey];
          
          // Mark as interacted so it stays cyan when closed
          state.timelineInteracted = state.timelineInteracted || {};
          state.timelineInteracted[targetKey] = true;
          
          if (!isCompareMode) renderSubgroupFilter();
          if (isCompareMode) renderSubgroupFilter();
          renderTimeSliderGraph();
      });
      container.appendChild(groupDiv);
            
            // HOVER DODGE LOGIC FOR TIMELINE BUTTON ITSELF (in case it overlaps something)
            // Not strictly necessary since timeline button doesn't have a hover menu, but for consistency if needed.
            // Actually, we don't need it for timeline button.
  }
}

function renderTimePeriodFilter() {
  const timeSelect = document.getElementById('time-period-select');
  const group = document.getElementById('time-period-group');
  if (!timeSelect || !group) return;

  if (state.availableDataPeriods && state.availableDataPeriods.length > 0) {
    group.style.display = 'block';
    
    // Remember current selection if it's still available
    const currentVal = state.currentDataPeriod;
    timeSelect.innerHTML = '';
    
    state.availableDataPeriods.forEach(period => {
      const option = document.createElement('option');
      option.value = period;
      
      let displayPeriod = period;
      if (period.length === 6 && /^\d+$/.test(period)) {
        // format YYYYMM to MM-YYYY
        displayPeriod = period.substring(4) + '-' + period.substring(0, 4);
      }
      option.textContent = displayPeriod;
      timeSelect.appendChild(option);
    });
    
    if (state.availableDataPeriods.includes(currentVal)) {
      timeSelect.value = currentVal;
    } else {
      timeSelect.value = state.availableDataPeriods[0];
    }
  } else {
    group.style.display = 'none';
  }
}

function updateMetricAboutSection() {
  const group = document.getElementById('metric-about-group');
  if (!group) return;
  
  const metricSelect = document.getElementById('esg-metric');
  if (!metricSelect) return;
  
  const activeOption = metricSelect.options[metricSelect.selectedIndex];
  if (!activeOption) return;
  
  const metricName = activeOption.innerText;
  const meta = METRIC_META[metricName];
  
  if (meta) {
    let desc = meta.description;
    const activeMetricId = activeOption.value;
    const isMuni = ['Total_Inv_Value', 'Total_Sav_Value', 'Total_Issuers', 'Small_Borrowers', 'Sub_State_Inv_Value', 'Sub_State_Sav_Value', 'Small_Borrowers_Pct'].includes(activeMetricId) || (activeMetricId && activeMetricId.startsWith('Proceeds_'));
    
    const higherIsBetter = ['High_School_Completion', 'Broadband_Connection', 'Life_Expectancy', 'Dental_Care', 'Routine_Checkup,_18+', 'Prenatal_Care'];
    const neutralMetrics = ['Medicaid_Enrollment', 'Income_Inequality', 'Neighborhood_Racial/Ethnic_Segregation', 'Racial/Ethnic_Diversity'];
    
    if (!isMuni && !neutralMetrics.includes(activeMetricId)) {
      if (!desc.trim().endsWith('.')) {
        desc = desc.trim() + '.';
      }
      if (higherIsBetter.includes(activeMetricId)) {
        desc += ' Higher values have better outcomes.';
      } else {
        desc += ' Lower values have better outcomes.';
      }
    }
    document.getElementById('metric-description-text').innerText = desc;
    document.getElementById('metric-source-tooltip').innerHTML = `
      Calculated using data from ${meta.data_period}, ${meta.period_type}<br>
      Source: ${meta.source_name}<br><br>
      Visit <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color:#02D4FF; text-decoration: underline;">Congressional District Health Dashboard</a> by NYU Langone Health & Partners<br><br>
      <a href="${meta.url}" target="_blank" style="color:#02D4FF; text-decoration: underline;">More About This Metric</a> by Congressional District Health Dashboard
    `;
  } else {
    document.getElementById('metric-description-text').innerText = 'No description available for this metric.';
    document.getElementById('metric-source-tooltip').innerHTML = 'No source data available.';
  }
}

// Bind state changes to view updates
state.subscribe(() => {
  if (state.selectedDistrict) {
    document.body.classList.add('district-selected');
  } else {
    document.body.classList.remove('district-selected');
  }
  updateAllViews();
});



// Sidebar & Tabs UI Bindings
function bindEvents() {
  bindCompareEvents();
  bindCompareSbsEvents();
  const modeRadios = document.querySelectorAll('input[name="sidebar-mode"]');
  const bondsControls = document.getElementById('bonds-controls');
  const esgControls = document.getElementById('esg-controls');
  const esgFooter = document.getElementById('esg-sidebar-footer');
  const bondsFooter = document.getElementById('bonds-sidebar-footer');
  const compareFooter = document.getElementById('compare-sidebar-footer');
  const compareControls = document.getElementById('compare-controls');

  const usBtn = document.getElementById('scale-comparison-us-btn');
  const stateBtn = document.getElementById('scale-comparison-state-btn');
  const scaleSelect = document.getElementById('scale-comparison-select');
  
  if (usBtn && stateBtn && scaleSelect) {
    usBtn.addEventListener('click', () => {
      usBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      usBtn.style.color = '#fff';
      stateBtn.style.background = 'transparent';
      stateBtn.style.color = 'rgba(255, 255, 255, 0.5)';
      scaleSelect.value = 'us';
      import('./views/details.js').then(m => m.updateDetailsPanel());
    });
    
    stateBtn.addEventListener('click', () => {
      if (stateBtn.disabled) return;
      stateBtn.style.background = 'rgba(255, 255, 255, 0.1)';
      stateBtn.style.color = '#fff';
      usBtn.style.background = 'transparent';
      usBtn.style.color = 'rgba(255, 255, 255, 0.5)';
      scaleSelect.value = 'state';
      import('./views/details.js').then(m => m.updateDetailsPanel());
    });
  }

  modeRadios.forEach(radio => {
    radio.addEventListener('change', (e) => {
      // Hide floating timeline on mode change (Request 4)
      state.isTimeSliderOpen = { main: false, left: false, right: false };
      state.timelineInteracted = { main: false, left: false, right: false };
      ['main', 'left', 'right'].forEach(t => {
          const c = document.getElementById(`time-slider-container-${t}`);
          if (c) c.style.display = 'none';
      });
      renderTimeSliderGraph();
      
      // Globally return to national view on any mode switch (Request 2)
      if (state.selectedDistrict || state.selectedDistrictLeft || state.selectedDistrictRight) {
        state.setSelectedDistrict(null);
        state.setSelectedDistrictLeft(null);
        state.setSelectedDistrictRight(null);
        highlightSelected();
      }
      
      // Globally ensure left toolbar is expanded on mode switch (Request 3)
      const leftSidebar = document.getElementById('sidebar-left');
      if (leftSidebar) leftSidebar.classList.remove('collapsed');

      // Expand right toolbar if returning to bonds or health (Request 3)
      if (e.target.value !== 'compare') {
        const rightSidebar = document.getElementById('details-sidebar');
        if (rightSidebar) rightSidebar.classList.remove('hidden');
      }

      if (e.target.value === 'compare') {
        const rightSidebar = document.getElementById('details-sidebar');
        if (rightSidebar) rightSidebar.classList.add('hidden');
        
        const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
        if (chartsBtn) {
            chartsBtn.style.display = 'none';
            if (chartsBtn.classList.contains('active')) {
                const mapsBtn = document.querySelector('.tab-btn[data-tab="maps"]');
                if (mapsBtn) mapsBtn.click();
            }
        }
        
        bondsControls.style.display = 'none';
        esgControls.style.display = 'none';
        compareControls.style.display = 'block';
        if (esgFooter) esgFooter.style.display = 'none';
        if (bondsFooter) bondsFooter.style.display = 'none';
        if (compareFooter) compareFooter.style.display = 'block';
        
        document.body.classList.add('compare-mode-active');
        state.setCompareMode(true);
        
        // Sync UI with current compareViewType state
        const swipeBtn = document.getElementById('compare-toggle-swipe');
        const sbsBtn = document.getElementById('compare-toggle-sbs');
        if (state.compareViewType === 'sbs') {
          document.body.classList.add('compare-sbs-active');
          if (swipeBtn) swipeBtn.classList.remove('active');
          if (sbsBtn) sbsBtn.classList.add('active');
        } else {
          document.body.classList.remove('compare-sbs-active');
          if (swipeBtn) swipeBtn.classList.add('active');
          if (sbsBtn) sbsBtn.classList.remove('active');
        }
        
        setupCompareMode();
        
        // Reset Compare
        const resetLeft = document.getElementById('reset-left-map');
        if (resetLeft) resetLeft.click();
        const resetRight = document.getElementById('reset-right-map');
        if (resetRight) resetRight.click();
        
      } else if (e.target.value === 'bonds') {
        const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
        if (chartsBtn) chartsBtn.style.display = 'block';
        
        bondsControls.style.display = 'flex';
        esgControls.style.display = 'none';
        compareControls.style.display = 'none';
        if (esgFooter) esgFooter.style.display = 'none';
        if (bondsFooter) bondsFooter.style.display = 'block';
        if (compareFooter) compareFooter.style.display = 'none';
        
        document.body.classList.remove('compare-mode-active');
        document.body.classList.remove('compare-sbs-active');
        state.setCompareMode(false);
        disableCompareMode();
        
        // Reset Bonds
        const firstBondBtn = document.querySelector('.metric-btn');
        if (firstBondBtn && !firstBondBtn.classList.contains('active')) {
          firstBondBtn.click();
        } else {
          const activeBtn = document.querySelector('.metric-btn.active');
          if (activeBtn) state.setActiveMetric(activeBtn.dataset.metric, 'Total');
        }
      } else {
        const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
        if (chartsBtn) chartsBtn.style.display = 'block';
        
        bondsControls.style.display = 'none';
        esgControls.style.display = 'flex';
        compareControls.style.display = 'none';
        if (esgFooter) esgFooter.style.display = 'block';
        if (bondsFooter) bondsFooter.style.display = 'none';
        if (compareFooter) compareFooter.style.display = 'none';
        
        document.body.classList.remove('compare-mode-active');
        document.body.classList.remove('compare-sbs-active');
        state.setCompareMode(false);
        disableCompareMode();
        
        // Reset Health
        const categorySelect = document.getElementById('esg-category');
        if (categorySelect && categorySelect.value !== 'outcomes') {
          categorySelect.value = 'outcomes';
          categorySelect.dispatchEvent(new Event('change'));
        } else {
          const metricSelect = document.getElementById('esg-metric');
          if (metricSelect && metricSelect.value) {
            state.setActiveMetric(metricSelect.value, 'Total');
          }
        }
      }

      renderSubgroupFilter();
      renderTimePeriodFilter();
      
      // Recenter the map perfectly now that toolbars have toggled
      // Wait long enough (300ms) for CSS transitions to finish before resizing and fitting bounds
      setTimeout(() => {
        resizeMap();
        resetMapView();
      }, 300);
    });
  });

  const categorySelect = document.getElementById('esg-category');
  const metricSelect = document.getElementById('esg-metric');

  if (categorySelect && metricSelect) {
    const populateMetrics = () => {
      const cat = categorySelect.value;
      metricSelect.innerHTML = '';
      if (METRICS_BY_CATEGORY[cat]) {
        METRICS_BY_CATEGORY[cat].forEach(m => {
          const option = document.createElement('option');
          option.value = m.id;
          option.textContent = m.name;
          metricSelect.appendChild(option);
        });
      }
    };

    categorySelect.addEventListener('change', () => {
      populateMetrics();
      metricSelect.dispatchEvent(new Event('change'));
    });

    metricSelect.addEventListener('change', () => {
      const rightSidebar = document.getElementById('details-sidebar');
      if (rightSidebar) rightSidebar.classList.remove('hidden');
      state.setActiveMetric(metricSelect.value, state.activeGroup);
      renderSubgroupFilter();
      renderTimePeriodFilter();
      updateMetricAboutSection();
      if (state.selectedDistrict) {
        state.setSelectedDistrict(null);
        highlightSelected(null);
      }
      resetMapView();
    });

    // Initial populate
    populateMetrics();
    updateMetricAboutSection();
  }

  const timeSelect = document.getElementById('time-period-select');
  if (timeSelect) {
    timeSelect.addEventListener('change', () => {
      state.setDataPeriod(timeSelect.value);
      updateAllViews();
    });
  }

  // Bond metric buttons
  document.querySelectorAll('.metric-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      
      const rightSidebar = document.getElementById('details-sidebar');
      if (rightSidebar) rightSidebar.classList.remove('hidden');
      
      const proceedsSelect = document.getElementById('proceeds-category');
      if (proceedsSelect) proceedsSelect.value = ""; // reset dropdown
      
      state.setActiveMetric(e.target.dataset.metric, 'Total');
      renderSubgroupFilter();
      renderTimePeriodFilter();
      if (state.selectedDistrict) {
        state.setSelectedDistrict(null);
        highlightSelected(null);
      }
      resetMapView();
    });
  });

  const proceedsSelect = document.getElementById('proceeds-category');
  if (proceedsSelect) {
    proceedsSelect.addEventListener('change', () => {
      if (proceedsSelect.value) {
        document.querySelectorAll('.metric-btn').forEach(b => b.classList.remove('active'));
        
        const rightSidebar = document.getElementById('details-sidebar');
        if (rightSidebar) rightSidebar.classList.remove('hidden');
        
        state.setActiveMetric(proceedsSelect.value, 'Total');
        renderSubgroupFilter();
      renderTimePeriodFilter();
        if (state.selectedDistrict) {
          state.setSelectedDistrict(null);
          highlightSelected(null);
        }
        resetMapView();
      } else {
        // if user clears dropdown, select the first bond metric
        document.querySelector('.metric-btn').click();
      }
    });
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      e.target.classList.add('active');
      const activeView = e.target.dataset.tab;
      state.setActiveView(activeView);

      document.querySelectorAll('.view-container').forEach(v => v.classList.remove('active'));
      document.getElementById(`view-${activeView}`).classList.add('active');
      
      const topNav = document.querySelector('.top-nav');
      if (topNav) {
          topNav.style.display = 'flex';
      }

      if (activeView === 'maps') {
        document.getElementById('sidebar-left').classList.remove('collapsed');
        const modeRadios = document.querySelector('input[name="sidebar-mode"]:checked');
        const mode = modeRadios ? modeRadios.value : 'bonds';
        if (mode !== 'compare') {
            const rightSidebar = document.getElementById('details-sidebar');
            if (rightSidebar) rightSidebar.classList.remove('hidden');
        }
        resizeMap();
      } else if (activeView === 'charts') {
        document.getElementById('sidebar-left').classList.add('collapsed');
        const rightSidebar = document.getElementById('details-sidebar');
        if (rightSidebar) rightSidebar.classList.add('hidden');
        updateScatterPlot();

      } else if (activeView === 'insights') {
        document.getElementById('sidebar-left').classList.add('collapsed');
        const rightSidebar = document.getElementById('details-sidebar');
        if (rightSidebar) rightSidebar.classList.add('hidden');
        
        if (state.compareMode) {
            if (state.selectedDistrictLeft && state.selectedDistrictLeft !== state.insightsLeftDistrict) {
                state.setInsightsLeftDistrict(state.selectedDistrictLeft);
            }
            if (state.selectedDistrictRight && state.selectedDistrictRight !== state.insightsRightDistrict) {
                state.setInsightsRightDistrict(state.selectedDistrictRight);
            }
        } else {
            if (state.selectedDistrict && state.selectedDistrict !== state.insightsLeftDistrict) {
                state.setInsightsLeftDistrict(state.selectedDistrict);
                state.setInsightsRightDistrict(state.selectedDistrict);
            }
        }
        
        updateInsights();
      }
    });
  });

  // Global click to close radial menus
  document.addEventListener('click', () => {
    document.querySelectorAll('.radial-group').forEach(g => g.classList.remove('is-open'));
  });

  const toggleBtn = document.getElementById('toggle-details-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      document.getElementById('details-sidebar').classList.remove('hidden');
    });
  }
  const closeBtn = document.getElementById('close-details-btn');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      document.getElementById('details-sidebar').classList.add('hidden');
      setTimeout(() => {
        resizeMap();
        setTimeout(() => {
          if (state.selectedDistrict) {
            const districtData = state.metricsData.find(d => d.District_Name === state.selectedDistrict);
            if (districtData && districtData.GEOID) {
              flyToDistrict(districtData.GEOID, false);
            }
          } else {
            resetMapView();
          }
        }, 50);
      }, 50);
    });
  }

  const homeBtn = document.getElementById('home-btn');
  if (homeBtn) {
    homeBtn.addEventListener('click', () => {
      // 1. Switch back to Bonds mode
      const modeBonds = document.getElementById('mode-bonds');
      if (modeBonds && !modeBonds.checked) {
        modeBonds.checked = true;
        modeBonds.dispatchEvent(new Event('change'));
      }
      
      // 2. Switch to Maps tab
      const mapsTab = document.querySelector('.tab-btn[data-tab="maps"]');
      if (mapsTab && !mapsTab.classList.contains('active')) {
        mapsTab.click();
      }

      // 3. Clear selected district and reset view
      if (state.selectedDistrict) {
        state.setSelectedDistrict(null);
      }
      import('./views/map.js').then(m => {
        m.highlightSelected(null);
        m.resetMapView();
      });
    });
  }

  const tutorialBtn = document.getElementById('tutorial-btn');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', startTutorial);
  }

  document.addEventListener('tutorial-fly-to', (e) => {
    flyToDistrict(e.detail.geoid);
  });

  document.addEventListener('tutorial-reset-map', () => {
    resetMapView();
  });

  const searchInput = document.getElementById('district-search');
  const searchResults = document.getElementById('search-results');
  if (searchInput && searchResults) {
    let searchSelectedIndex = -1;
    let currentMatches = [];

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      searchResults.innerHTML = '';
      searchSelectedIndex = -1;
      if (!query) {
        searchResults.classList.add('hidden');
        return;
      }
      
      function parseDistrictName(name) {
        const match = name.match(/^(.*?)\s*(\d+)(st|nd|rd|th)?$/i);
        if (match) return { state: match[1].trim(), number: parseInt(match[2], 10) };
        return { state: name, number: 0 };
      }

      let matches = state.metricsData.filter(d => (d.District_Name || '').toLowerCase().includes(query));
      matches.sort((a, b) => {
        const aParsed = parseDistrictName(a.District_Name || '');
        const bParsed = parseDistrictName(b.District_Name || '');
        if (aParsed.state !== bParsed.state) return aParsed.state.localeCompare(bParsed.state);
        return aParsed.number - bParsed.number;
      });
      matches = matches.slice(0, 10);
      currentMatches = matches;

      if (matches.length > 0) {
        matches.forEach((m, idx) => {
          const div = document.createElement('div');
          div.className = 'search-result-item';
          div.innerText = m.District_Name;
          div.dataset.index = idx;
          div.addEventListener('click', () => {
            searchInput.value = '';
            searchInput.blur();
            searchResults.classList.add('hidden');
            flyToDistrict(m.GEOID);
          });
          searchResults.appendChild(div);
        });
        searchResults.classList.remove('hidden');
      } else {
        searchResults.classList.add('hidden');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (searchResults.classList.contains('hidden') || currentMatches.length === 0) return;
      
      const items = searchResults.querySelectorAll('.search-result-item');
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        searchSelectedIndex = (searchSelectedIndex + 1) % items.length;
        updateSearchSelection(items);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        searchSelectedIndex = (searchSelectedIndex - 1 + items.length) % items.length;
        updateSearchSelection(items);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchSelectedIndex >= 0 && searchSelectedIndex < currentMatches.length) {
          const selected = currentMatches[searchSelectedIndex];
          searchInput.value = '';
          searchInput.blur();
          searchResults.classList.add('hidden');
          flyToDistrict(selected.GEOID);
        }
      }
    });

    function updateSearchSelection(items) {
      items.forEach((item, idx) => {
        if (idx === searchSelectedIndex) {
          item.classList.add('selected');
        } else {
          item.classList.remove('selected');
        }
      });
    }
  }

  const leftToggle = document.getElementById('left-sidebar-toggle');
  if (leftToggle) {
    leftToggle.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar-left');
      const isCurrentlyCollapsed = sidebar.classList.contains('collapsed');
      
      sidebar.classList.toggle('collapsed');
      
      setTimeout(() => {
        resizeMap();
        setTimeout(() => {
          if (isCurrentlyCollapsed) {
            resetMapView();
            if (state.selectedDistrict) {
              state.setSelectedDistrict(null);
              highlightSelected(null);
            }
          }
        }, 50);
      }, 300);
    });
  }

  const countryViewBtn = document.getElementById('compare-country-view-btn');
  if (countryViewBtn) {
      countryViewBtn.addEventListener('click', () => {
        const detailsSidebar = document.getElementById('details-sidebar');
        if (detailsSidebar) detailsSidebar.classList.add('hidden');
  
        if (state.compareMode && state.compareViewType === 'sbs') {
          state.setSelectedDistrictLeft(null);
          state.setSelectedDistrictRight(null);
        } else {
          state.setSelectedDistrict(null);
        }
        
        if (state.compareMode) {
          state.setCompareLeftMetric(state.compareLeftSource, state.compareLeftMetric, 'Total', null);
          state.setCompareRightMetric(state.compareRightSource, state.compareRightMetric, 'Total', null);
        }
        
        import('./views/map.js').then(m => m.highlightSelected());
      
      const leftSidebar = document.getElementById('sidebar-left');
      if (leftSidebar && leftSidebar.classList.contains('collapsed')) {
        leftSidebar.classList.remove('collapsed');
        leftSidebar.addEventListener('transitionend', function handler(e) {
          if (e.propertyName === 'width' || e.propertyName === 'transform' || e.propertyName === 'flex-basis' || e.propertyName === 'max-width') {
            leftSidebar.removeEventListener('transitionend', handler);
            resizeMap();
            setTimeout(() => resetMapView(), 50);
          }
        });
      } else {
        resizeMap();
        setTimeout(() => resetMapView(), 50);
      }
    });
  }
}

function initTooltips() {
  const containers = document.querySelectorAll('.custom-tooltip-container');
  containers.forEach(container => {
    const tooltip = container.querySelector('.custom-tooltip');
    if (!tooltip) return;
    
    // Move tooltip to body so it doesn't get clipped by overflow:hidden containers
    document.body.appendChild(tooltip);
    
    let hideTimeout;
    
    const showTooltip = () => {
      clearTimeout(hideTimeout);
      const rect = container.getBoundingClientRect();
      
      // Calculate position (to the right of the icon by default)
      let left = rect.right + 12;
      
      // Vertical alignment: center with icon
      let top = rect.top + (rect.height / 2) - (tooltip.offsetHeight / 2);
      
      // If the tooltip is for the right sidebar (e.g. ALL DISTRICTS, MUNICIPAL BONDS), 
      // place it just above the icon and aligned to the right inside the toolbar
      if (container.closest('.sidebar-right') || container.closest('#details-sidebar')) {
        const sidebar = container.closest('.sidebar-right') || container.closest('#details-sidebar');
        const sidebarRect = sidebar.getBoundingClientRect();
        left = sidebarRect.right - tooltip.offsetWidth - 16; // Aligned to the right inside the toolbar
        top = rect.top - tooltip.offsetHeight - 8; // Hovering just above the title
      }
      
      // Prevent off-screen positioning
      if (left + tooltip.offsetWidth > window.innerWidth) {
        left = window.innerWidth - tooltip.offsetWidth - 12;
      }
      if (left < 10) left = 10;
      
      // Ensure it doesn't go off top or bottom
      top = Math.max(10, Math.min(top, window.innerHeight - tooltip.offsetHeight - 10));
      
      tooltip.style.left = left + 'px';
      tooltip.style.top = top + 'px';
      
      tooltip.style.opacity = '1';
      tooltip.style.visibility = 'visible';
      tooltip.style.pointerEvents = 'auto'; // allow clicking links
      tooltip.style.transform = 'translateY(0)';
    };
    
    const hideTooltip = () => {
      hideTimeout = setTimeout(() => {
        tooltip.style.opacity = '0';
        tooltip.style.visibility = 'hidden';
        tooltip.style.pointerEvents = 'none';
        tooltip.style.transform = 'translateY(5px)';
      }, 300); // Linger for 300ms
    };
    
    container.addEventListener('mouseenter', showTooltip);
    container.addEventListener('mouseleave', hideTooltip);
    tooltip.addEventListener('mouseenter', showTooltip);
    tooltip.addEventListener('mouseleave', hideTooltip);
  });
}

function bindCompareEvents() {
  ['left', 'right'].forEach(side => {
    const sourceEl = document.getElementById(`compare-${side}-source`);
    const categoryEl = document.getElementById(`compare-${side}-category`);
    const metricEl = document.getElementById(`compare-${side}-metric`);
    if (!sourceEl || !categoryEl || !metricEl) return;

    const updateCategories = () => {
      const source = sourceEl.value;
      categoryEl.innerHTML = '';
      if (source === 'bonds') {
        categoryEl.innerHTML = `
          <option value="bonds">Bond Metrics</option>
          <option value="proceeds">Use of Proceeds</option>
        `;
      } else {
        categoryEl.innerHTML = `
          <option value="outcomes">Health Outcomes</option>
          <option value="socioeconomic">Socio-Economic Factors</option>
          <option value="behaviors">Health Behavior</option>
          <option value="environment">Environment</option>
          <option value="care">Clinical Care</option>
        `;
      }
      updateMetrics();
    };

    const updateMetrics = () => {
      const cat = categoryEl.value;
      metricEl.innerHTML = '';
      if (METRICS_BY_CATEGORY[cat]) {
        METRICS_BY_CATEGORY[cat].forEach(m => {
          const option = document.createElement('option');
          option.value = m.id;
          option.textContent = m.name;
          metricEl.appendChild(option);
        });
      }
      dispatchCompareState();
    };

    const dispatchCompareState = () => {
      const metric = metricEl.value;
      const source = sourceEl.value;
      if (side === 'left') {
        state.setCompareLeftMetric(source, metric);
      } else {
        state.setCompareRightMetric(source, metric);
      }
      
      if (state.compareMode) {
        updateMap();
      }
    };

    sourceEl.addEventListener('change', updateCategories);
    categoryEl.addEventListener('change', updateMetrics);
    metricEl.addEventListener('change', dispatchCompareState);
    
    // Default initializers
    updateCategories();

    // Reset button logic
    const resetBtn = document.getElementById(`reset-${side}-map`);
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        // Hide time slider
        state.isTimeSliderOpen[side] = false;
        const sliderContainer = document.getElementById(`time-slider-container-${side}`);
        if (sliderContainer) sliderContainer.style.display = 'none';

        // Reset dropdowns to defaults
        sourceEl.value = side === 'left' ? 'bonds' : 'esg';
        
        // Explicitly trigger category update
        categoryEl.innerHTML = '';
        if (sourceEl.value === 'bonds') {
          categoryEl.innerHTML = `
            <option value="bonds">Bond Metrics</option>
            <option value="proceeds">Use of Proceeds</option>
          `;
        } else {
          categoryEl.innerHTML = `
            <option value="outcomes">Health Outcomes</option>
            <option value="socioeconomic">Socio-Economic Factors</option>
            <option value="behaviors">Health Behavior</option>
            <option value="environment">Environment</option>
            <option value="care">Clinical Care</option>
          `;
        }
        categoryEl.selectedIndex = 0; // Force to first option

        // Explicitly trigger metric update
        const cat = categoryEl.value;
        metricEl.innerHTML = '';
        if (METRICS_BY_CATEGORY[cat]) {
          METRICS_BY_CATEGORY[cat].forEach(m => {
            const option = document.createElement('option');
            option.value = m.id;
            option.textContent = m.name;
            metricEl.appendChild(option);
          });
        }
        metricEl.selectedIndex = 0; // Force to first option

        // Dispatch state
        dispatchCompareState();
      });
    }
  });
}




function bindCompareSbsEvents() {
  const swipeBtn = document.getElementById('compare-toggle-swipe');
  const sbsBtn = document.getElementById('compare-toggle-sbs');

  if (swipeBtn && sbsBtn) {
    swipeBtn.addEventListener('click', () => {
      swipeBtn.classList.add('active');
      sbsBtn.classList.remove('active');
      document.body.classList.remove('compare-sbs-active');
      state.setCompareViewType('swipe');
      state.setSelectedDistrictLeft(null);
      state.setSelectedDistrictRight(null);
      state.setSelectedDistrict(null);
      state.setCompareLeftMetric(state.compareLeftSource, state.compareLeftMetric, 'Total', null);
      state.setCompareRightMetric(state.compareRightSource, state.compareRightMetric, 'Total', null);
        import('./views/map.js').then(m => {
          m.highlightSelected();
          m.setupCompareMode();
          setTimeout(() => {
              m.resetMapView();
          }, 100);
        });
    });

    sbsBtn.addEventListener('click', () => {
      sbsBtn.classList.add('active');
      swipeBtn.classList.remove('active');
      document.body.classList.add('compare-sbs-active');
      state.setCompareViewType('sbs');
      state.setSelectedDistrict(null);
      state.setCompareLeftMetric(state.compareLeftSource, state.compareLeftMetric, 'Total', null);
      state.setCompareRightMetric(state.compareRightSource, state.compareRightMetric, 'Total', null);
      import('./views/map.js').then(m => {
        m.highlightSelected();
        m.resetMapView();
        m.setupCompareMode();
      });
    });
  }
}

async function init() {
  await state.loadData();
  initMap();
  initTooltips();
  initScatterPlotControls();
  renderSubgroupFilter();
  renderTimePeriodFilter();
  bindEvents();
  updateAllViews();
  initTutorial();
}

init();


function renderTimeSliderGraph() {
  ['main', 'left', 'right'].forEach(targetSide => {
    const container = document.getElementById(`time-slider-container-${targetSide}`);
    if (!container) return;
    
    if (!state.isTimeSliderOpen[targetSide]) {
      container.style.display = 'none';
      return;
    }

    const metric = targetSide === 'left' ? state.compareLeftMetric : (targetSide === 'right' ? state.compareRightMetric : state.activeMetric);
    const group = targetSide === 'left' ? state.compareLeftGroup : (targetSide === 'right' ? state.compareRightGroup : state.activeGroup);
    
    const pSet = new Set();
    if (state.metricsData && state.metricsData.length > 0) {
        const record = state.metricsData[0];
        const formattedGroup = group.replace(/ /g, '_').replace(/-/g, '_');
        const prefix = `${metric}__${formattedGroup}__`;
        Object.keys(record).forEach(key => {
            if (key.startsWith(prefix)) {
                pSet.add(key.replace(prefix, ''));
            }
        });
    }
    const periods = Array.from(pSet).sort((a, b) => a.localeCompare(b));
    
    if (periods.length <= 1) {
      container.style.display = 'none';
      return;
    }
    
    container.classList.remove('hidden');
    container.style.display = 'flex';
    
    const headerText = document.getElementById(`time-slider-header-${targetSide}`);
    if (headerText) {
      let sideLabel = targetSide === 'left' ? ' (Left Map)' : (targetSide === 'right' ? ' (Right Map)' : '');
      headerText.innerText = state.selectedDistrict ? `Time Series: ${state.selectedDistrict}${sideLabel}` : `Time Series: U.S. Average${sideLabel}`;
    }
    
    // Collect data
    const dataPoints = periods.map(p => {
      let val = 0;
      const formattedGroup = group.replace(/ /g, '_').replace(/-/g, '_');
      const field = `${metric}__${formattedGroup}__${p}`;
      
      if (state.selectedDistrict) {
        const d = state.metricsData.find(x => x.District_Name === state.selectedDistrict);
        if (d && d[field] !== undefined && d[field] !== '') {
          val = parseFloat(d[field]) || 0;
        }
      } else {
        let sum = 0, count = 0;
        state.metricsData.forEach(d => {
          if (d[field] !== undefined && d[field] !== '') {
            sum += parseFloat(d[field]) || 0;
            count++;
          }
        });
        val = count > 0 ? sum / count : 0;
      }
      return val;
    });
    
    // draw D3 SVG
    const graphContainer = document.getElementById(`time-slider-graph-${targetSide}`);
    if (graphContainer) {
      graphContainer.innerHTML = '';
      const width = graphContainer.clientWidth || 360;
      const height = 70;
      
      const svg = d3.select(graphContainer).append('svg')
        .attr('width', width)
        .attr('height', height).style('overflow', 'visible');
        
      const xScale = d3.scalePoint()
        .domain(periods)
        .range([8, width - 8]);
        
      const extent = d3.extent(dataPoints);
      if (extent[0] === extent[1]) {
        extent[0] -= 1;
        extent[1] += 1;
      }
      const yPadding = 10;
      const yScale = d3.scaleLinear()
        .domain(extent)
        .range([height - yPadding - 20, yPadding]);
        
      const line = d3.line()
        .x((d, i) => xScale(periods[i]))
        .y(d => yScale(d));
        
      svg.append('path')
        .datum(dataPoints)
        .attr('fill', 'none')
        .attr('stroke', '#66ccff')
        .attr('stroke-width', 2)
        .attr('d', line);
        
      svg.selectAll('.dot')
        .data(dataPoints)
        .enter().append('circle')
        .attr('class', 'dot')
        .attr('cx', (d, i) => xScale(periods[i]))
        .attr('cy', d => yScale(d))
        .attr('r', 4)
        .attr('fill', '#66ccff')
        .attr('stroke', '#000')
        .attr('stroke-width', 1)
        .style('cursor', 'pointer')
        .on('click', (e, d) => {
            const i = dataPoints.indexOf(d);
            const period = periods[i];
            const slider = document.getElementById(`time-slider-${targetSide}`);
            if (slider) {
                slider.value = i;
                slider.dispatchEvent(new Event('input'));
                slider.dispatchEvent(new Event('change'));
            }
        });
        
      const numPeriods = periods.length;
      let labelStep = 1;
      if (numPeriods > 6) {
          labelStep = Math.ceil(numPeriods / 6);
      }

      svg.selectAll('.label')
        .data(periods)
        .enter().append('text')
        .attr('class', 'label')
        .attr('x', d => xScale(d))
        .attr('y', height - 2)
        .attr('text-anchor', 'middle')
        .text((d, i) => {
           let shouldShow = false;
           if (i === 0 || i === numPeriods - 1) shouldShow = true;
           else if (i % labelStep === 0 && (numPeriods - 1 - i) >= labelStep / 2) shouldShow = true;
           
           if (!shouldShow) return '';
           
           let displayPeriod = d;
           if (d.length === 6 && /^\d+$/.test(d)) {
             displayPeriod = d.substring(4) + '-' + d.substring(0, 4);
           }
           return displayPeriod;
        })
        .style('fill', '#8ab4f8')
        .style('font-size', '10px');
    }
    
    const slider = document.getElementById(`time-slider-${targetSide}`);
    if (slider) {
      let periodToCheck = state.currentDataPeriod;
      if (targetSide === 'left') periodToCheck = state.compareLeftPeriod || state.currentDataPeriod;
      if (targetSide === 'right') periodToCheck = state.compareRightPeriod || state.currentDataPeriod;
      let currentIdx = periods.indexOf(periodToCheck);
      if (currentIdx === -1) currentIdx = periods.length - 1;
      
      slider.min = 0;
      slider.max = periods.length - 1;
      slider.value = currentIdx;
      
      slider.oninput = (e) => {
        const val = parseInt(e.target.value);
        if (targetSide === 'left') {
            state.setCompareLeftPeriod(periods[val]);
        } else if (targetSide === 'right') {
            state.setCompareRightPeriod(periods[val]);
        } else {
            state.setDataPeriod(periods[val]);
        }
        state.timelineInteracted = state.timelineInteracted || {};
        state.timelineInteracted[targetSide] = true;
        
        if (typeof renderSubgroupFilter === 'function') renderSubgroupFilter();
      };
      
      slider.onchange = (e) => {
        const val = parseInt(e.target.value);
        if (targetSide === 'left') {
            state.setCompareLeftPeriod(periods[val]);
        } else if (targetSide === 'right') {
            state.setCompareRightPeriod(periods[val]);
        } else {
            state.setDataPeriod(periods[val]);
        }
        state.timelineInteracted = state.timelineInteracted || {};
        state.timelineInteracted[targetSide] = true;
        
        updateAllViews();
      };
    }
  });

  // Request 1c: Auto-collapse left sidebar in compare mode if any timeline is open
  if (state.compareMode) {
      const leftSidebar = document.getElementById('sidebar-left');
      if (leftSidebar) {
          const isBothSlidersOpen = state.isTimeSliderOpen.left && state.isTimeSliderOpen.right;
          const isCollapsed = leftSidebar.classList.contains('collapsed');
          if (isBothSlidersOpen && !isCollapsed) {
              leftSidebar.classList.add('collapsed');
              setTimeout(() => {
                  if (state.mapView) state.mapView.resize();
                  if (state.mapViewCompareRight) state.mapViewCompareRight.resize();
              }, 300);
          }
      }
  }
}

function initTimeSliderDraggable() {
  ['main', 'left', 'right'].forEach(targetSide => {
    const container = document.getElementById(`time-slider-container-${targetSide}`);
    const handle = document.getElementById(`time-slider-drag-handle-${targetSide}`);
    
    if (!container || !handle) return;
    
    // Setup close button
    const closeBtn = container.querySelector('.close-time-slider');
    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            state.isTimeSliderOpen[targetSide] = false;
            container.style.display = 'none';
            container.style.transform = 'translate3d(-50%, 0px, 0px)';
            container.dataset.xOffset = 0;
            container.dataset.yOffset = 0;
            xOffset = 0;
            yOffset = 0;
            
            if (typeof renderSubgroupFilter === 'function') {
              renderSubgroupFilter();
            }
        });
    }

    // Setup Hide All button
    const hideAllBtn = container.querySelector('.hide-all-time-sliders');
    if (hideAllBtn) {
        hideAllBtn.addEventListener('click', () => {
            state.isTimeSliderOpen = { main: false, left: false, right: false };
            ['main', 'left', 'right'].forEach(t => {
                const c = document.getElementById(`time-slider-container-${t}`);
                if (c) {
                    c.style.display = 'none';
                    c.style.transform = 'translate3d(-50%, 0px, 0px)';
                    c.dataset.xOffset = 0;
                    c.dataset.yOffset = 0;
                }
            });
            if (typeof renderSubgroupFilter === 'function') {
              renderSubgroupFilter();
            }
        });
    }

    // Dragging logic
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    handle.addEventListener('mousedown', dragStart);
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('mousemove', drag);

    function dragStart(e) {
      xOffset = parseFloat(container.dataset.xOffset) || 0;
      yOffset = parseFloat(container.dataset.yOffset) || 0;
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === handle || handle.contains(e.target)) {
        if (e.target.tagName.toLowerCase() === 'button' || e.target.closest('button')) {
            return; // don't drag if clicking buttons
        }
        isDragging = true;
        handle.style.cursor = 'grabbing';
      }
    }

    function dragEnd(e) {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
      handle.style.cursor = 'grab';
    }

    function drag(e) {
      if (isDragging) {
        e.preventDefault();
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        xOffset = currentX;
        yOffset = currentY;
        container.dataset.xOffset = currentX;
        container.dataset.yOffset = currentY;

        setTranslate(currentX, currentY, container);
      }
    }

    function setTranslate(xPos, yPos, el) {
      el.style.transform = `translate3d(calc(-50% + ${xPos}px), ${yPos}px, 0)`;
    }
  });
}

// Call it
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(initTimeSliderDraggable, 500);
  setTimeout(initSubgroupWindowDraggable, 500);
});

function initSubgroupWindowDraggable() {
  const container = document.getElementById('subgroup-window-container');
  const handle = document.getElementById('subgroup-window-drag-handle');
  const closeBtn = document.getElementById('close-subgroup-window');
  
  if (!container || !handle || !closeBtn) return;
  
  container.dataset.xOffset = 0;
  container.dataset.yOffset = 0;
  
  closeBtn.addEventListener('click', () => {
    container.style.display = 'none';
    if (typeof renderSubgroupFilter === 'function') renderSubgroupFilter();
    container.style.transform = 'translate3d(-50%, 0px, 0px)';
    container.dataset.xOffset = 0;
    container.dataset.yOffset = 0;
    document.querySelectorAll('.radial-group').forEach(g => g.classList.remove('is-open'));
  });

  let isDragging = false;
  let initialX;
  let initialY;

  handle.addEventListener('mousedown', dragStart);
  document.addEventListener('mouseup', dragEnd);
  document.addEventListener('mousemove', drag);

  function dragStart(e) {
    const xOffset = parseFloat(container.dataset.xOffset) || 0;
    const yOffset = parseFloat(container.dataset.yOffset) || 0;
    
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;
    if (e.target === handle || handle.contains(e.target) && e.target !== closeBtn) {
      isDragging = true;
      handle.style.cursor = 'grabbing';
    }
  }

  function dragEnd(e) {
    isDragging = false;
    handle.style.cursor = 'grab';
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();
      const currentX = e.clientX - initialX;
      const currentY = e.clientY - initialY;
      container.dataset.xOffset = currentX;
      container.dataset.yOffset = currentY;
      container.style.transform = `translate3d(calc(-50% + ${currentX}px), ${currentY}px, 0)`;
    }
  }
}
