import { state } from '../state.js';
import { formatMetricValue } from './details.js';
import { drawRadarChart } from './radar.js';
import { drawHorizontalBarChart } from './bar.js';
import { drawAnimatedSankey } from './sankey.js';
import { renderTreemap } from './treemap.js?v=18';
import { renderDeviationChart } from './deviation.js';
import { getFactsheetUrl } from '../factsheet_urls.js';
import { METRICS_BY_CATEGORY } from '../app.js';
import { renderStaticLollipopDash } from './lollipop_static.js';

let hasRenderedTreemap = false;


export function initScatterPlotControls() {
    updateChartsDashboard();
}

export function updateScatterPlot() {
  updateChartsDashboard();
}

export function updateChartsDashboard() {
  if (state.activeView !== 'charts') return;

  const emptyState = document.getElementById('charts-empty-state');
  const dashboard = document.getElementById('charts-dashboard');

  if (!state.selectedDistrict) {
    if (emptyState) emptyState.style.display = 'flex';
    if (dashboard) dashboard.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (dashboard) dashboard.style.display = 'flex';

  const d = state.selectedDistrict;
  const metricsData = state.metricsData || [];
  const districtData = metricsData.find(row => row.District_Name === d || row.GEOID === d);

  if (!districtData) {
    return;
  }

  // Update Header
  document.getElementById('charts-district-title').innerText = districtData.District_Name || d;

  const modeRadios = document.querySelector('input[name="sidebar-mode"]:checked');
  const isBondMode = modeRadios ? (modeRadios.value === 'bonds') : false;

  // Render KPIs
  renderKPIs(districtData, metricsData, isBondMode);

  // Toggle Deep Dive sections
  const healthDiv = document.getElementById('charts-deep-dive-health');
  const bondsDiv = document.getElementById('charts-deep-dive-bonds');
  
  if (isBondMode) {
    const bondsDiv = document.getElementById('charts-deep-dive-bonds');
    if (bondsDiv) {
      bondsDiv.style.display = 'flex'; 
      bondsDiv.style.flexDirection = 'column'; 
    }
    const devDiv = document.getElementById('deviation-charts-section');
    if (devDiv) {
        devDiv.style.display = 'flex';
        devDiv.style.flexDirection = 'row';
        devDiv.style.gap = '20px';
    }
    const treeDiv = document.getElementById('treemap-section');
    if (treeDiv) treeDiv.style.display = 'block';
    const healthSubtitleDiv = document.getElementById('charts-health-subtitle');
    if (healthSubtitleDiv) healthSubtitleDiv.style.display = 'none';
    const footerDiv = document.getElementById('charts-bonds-footer');
    if (footerDiv) {
        footerDiv.style.display = 'block';
        const link = document.getElementById('charts-factsheet-link');
        if (link) {
            const districtName = districtData.District_Name || `District ${districtData.GEOID}`;
            link.href = getFactsheetUrl(districtName);
        }
    }
    renderProceedsChart(districtData);
    } else {
      if (bondsDiv) bondsDiv.style.display = 'none';
      if (healthDiv) healthDiv.style.display = 'flex';
      const devDiv = document.getElementById('deviation-charts-section');
      if (devDiv) devDiv.style.display = 'none';
      const treeDiv = document.getElementById('treemap-section');
      if (treeDiv) treeDiv.style.display = 'none';
      const footerDiv = document.getElementById('charts-bonds-footer');
      if (footerDiv) footerDiv.style.display = 'none';
      const healthSubtitleDiv = document.getElementById('charts-health-subtitle');
      if (healthSubtitleDiv) healthSubtitleDiv.style.display = 'block';
      renderRadarCharts(districtData, metricsData);
      renderStaticLollipopDash(districtData, metricsData);
    }

  // Render Statewide Treemap
  if (districtData && districtData.District_Name) {
      const stateNameMatch = districtData.District_Name.replace(/\s+(\d+(st|nd|rd|th)|At-Large)$/i, '').trim();
      const stateFilteredData = metricsData.filter(d => d.District_Name && d.District_Name.startsWith(stateNameMatch));
      
      // Clear any pending resize timeouts to prevent race conditions
      const container = document.querySelector('#treemap-container');
      if (container && container._resizeTimeout) {
          clearTimeout(container._resizeTimeout);
      }
      
      renderTreemap('#treemap-container', stateFilteredData);
      
      const titleElem = document.getElementById('treemap-title');
      if (titleElem) {
          titleElem.innerText = `${stateNameMatch} - Use of Proceeds Breakdown`;
      }
      
      if (isBondMode) {
          renderAllDeviationCharts(districtData, stateFilteredData);
      }
  }
}

function renderAllDeviationCharts(districtData, stateFilteredData) {
    if (!stateFilteredData || stateFilteredData.length === 0) return;
    
    // Combine all Bond Metrics into one chart
    const bondGroup = [
        { key: 'Total_Inv_Value', label: 'Total Investment Value', format: 'currency' },
        { key: 'Total_Issuers', label: 'Total Issuers', format: 'number' },
        { key: 'Sub_State_Inv_Value', label: 'Sub-State Investment', format: 'currency' },
        { key: 'Small_Borrowers', label: 'Small Borrowers', format: 'number' },
        { key: 'Small_Borrowers_Pct', label: 'Small Borrowers (%)', format: 'percent' },
        { key: 'Sub_State_Sav_Value', label: 'District Taxpayer Savings', format: 'currency' }
    ];

    const calcBondDeviation = (group) => {
        return group.map(metric => {
            const distVal = parseFloat(districtData[metric.key]) || 0;
            const stateAvg = d3.mean(stateFilteredData, d => parseFloat(d[metric.key]) || 0);
            const devPct = stateAvg === 0 ? 0 : ((distVal - stateAvg) / stateAvg) * 100;
            return {
                label: metric.label,
                districtVal: distVal,
                stateAvg: stateAvg,
                deviationPct: devPct,
                formatKey: metric.format === 'currency' ? 'Total_Inv_Value' : (metric.format === 'percent' ? 'Small_Borrowers_Pct' : 'Total_Issuers')
            };
        });
    };

    const dataCombined = calcBondDeviation(bondGroup);

    renderDeviationChart('deviation-bond-combined-chart', null, null, dataCombined);

    // Use of proceeds
    if (districtData.Proceeds_Data) {
        let distProceeds = null;
        try { distProceeds = typeof districtData.Proceeds_Data === 'string' ? JSON.parse(districtData.Proceeds_Data.replace(/'/g, '"')) : districtData.Proceeds_Data; } catch(e){}
        
        if (distProceeds && Array.isArray(distProceeds)) {
            
            const groupProceeds = (proceedsArray) => {
                const grouped = {
                    'Healthcare & Human Services': 0,
                    'Education': 0,
                    'Housing': 0,
                    'Utilities & Environment': 0,
                    'Transportation': 0,
                    'Infrastructure & Public Facilities': 0,
                    'Economic & Commercial Development': 0,
                    'Recreation & Culture': 0,
                    'Other / Unclassified': 0
                };
                proceedsArray.forEach(p => {
                    const cat = (p.Category || '').toUpperCase();
                    const amt = p.Amount !== undefined ? parseFloat(String(p.Amount).replace(/[\$,]/g, '')) : 0;
                    if (!amt) return;
                    
                    if (cat.includes('HOSPITAL') || cat.includes('NURSING') || cat.includes('LIFECARE') || cat.includes('HEALTH') || cat.includes('HUMAN SERVICE') || cat.includes('HUMANSERVICE')) {
                        grouped['Healthcare & Human Services'] += amt;
                    } else if (cat.includes('EDUCATION') || cat.includes('SCHOOL') || cat.includes('STUDENT')) {
                        grouped['Education'] += amt;
                    } else if (cat.includes('HOUSING') || cat.includes('HOMES') || cat.includes('HSG') || cat.includes('LD PRESERVTN')) {
                        grouped['Housing'] += amt;
                    } else if (cat.includes('WATER') || cat.includes('SEWER') || cat.includes('SANITATION') || cat.includes('WASTE') || cat.includes('UTILITY') || cat.includes('UTILITIES') || cat.includes('ELECTRIC') || cat.includes('POWER') || cat.includes('GAS') || cat.includes('COGENERATION') || cat.includes('POLLUTION') || cat.includes('DRAINAGE') || cat.includes('IRRIGATION')) {
                        grouped['Utilities & Environment'] += amt;
                    } else if (cat.includes('TRANSPORTATION') || cat.includes('TRANSIT') || cat.includes('STREET') || cat.includes('HIGHWAY') || cat.includes('BRIDGE') || cat.includes('TUNNEL') || cat.includes('AIRPORT') || cat.includes('SEAPORT') || cat.includes('TERMINAL') || cat.includes('PARKING') || cat.includes('TOLL ROAD') || cat.includes('TOLLROAD') || cat.includes('AIRLINES')) {
                        grouped['Transportation'] += amt;
                    } else if (cat.includes('GOVERNMENT') || cat.includes('PUBLIC BUILDING') || cat.includes('PUBLICBUILDING') || cat.includes('FIRE') || cat.includes('POLICE') || cat.includes('COURT') || cat.includes('GENERAL PURPOSE') || cat.includes('GENERALPURPOSE') || cat.includes('PUBLIC IMPROVEMENT') || cat.includes('PUBLICIMPROVEMENT') || cat.includes('TELECOMMUNICATION')) {
                        grouped['Infrastructure & Public Facilities'] += amt;
                    } else if (cat.includes('ECONOMIC') || cat.includes('INDUSTRIAL') || cat.includes('REDEVELOPMENT') || cat.includes('MALL') || cat.includes('HOTEL') || cat.includes('OFFICE') || cat.includes('AGRICULTURE') || cat.includes('VETERANS')) {
                        grouped['Economic & Commercial Development'] += amt;
                    } else if (cat.includes('PARK') || cat.includes('ZOO') || cat.includes('BEACH') || cat.includes('RECREATION') || cat.includes('CIVIC') || cat.includes('CONVENTION') || cat.includes('STADIUM') || cat.includes('SPORTS') || cat.includes('THEATER') || cat.includes('LIBRARY') || cat.includes('MUSEUM')) {
                        grouped['Recreation & Culture'] += amt;
                    } else {
                        grouped['Other / Unclassified'] += amt;
                    }
                });
                return grouped;
            };
            
            const distTotalsGrouped = groupProceeds(distProceeds);
            
            let stateTotalsGrouped = {
                'Healthcare & Human Services': 0, 'Education': 0, 'Housing': 0, 'Utilities & Environment': 0,
                'Transportation': 0, 'Infrastructure & Public Facilities': 0, 'Economic & Commercial Development': 0,
                'Recreation & Culture': 0, 'Other / Unclassified': 0
            };
            
            stateFilteredData.forEach(d => {
                if (d.Proceeds_Data) {
                    try {
                        const pArray = typeof d.Proceeds_Data === 'string' ? JSON.parse(d.Proceeds_Data.replace(/'/g, '"')) : d.Proceeds_Data;
                        if (Array.isArray(pArray)) {
                            const dGrouped = groupProceeds(pArray);
                            Object.keys(dGrouped).forEach(k => { stateTotalsGrouped[k] += dGrouped[k]; });
                        }
                    } catch(e){}
                }
            });
            
            const distTotal = Object.values(distTotalsGrouped).reduce((a, b) => a + parseFloat(b), 0);
            const stateTotalAll = Object.values(stateTotalsGrouped).reduce((a, b) => a + parseFloat(b), 0);
            
            if (distTotal > 0 && stateTotalAll > 0) {
                // Use all categories to match the Treemap
                const topCats = Object.keys(stateTotalsGrouped).filter(c => distTotalsGrouped[c] > 0 || stateTotalsGrouped[c] > 0);
                
                const proceedsDevData = topCats.map(cat => {
                    const distPct = ((parseFloat(distTotalsGrouped[cat]) || 0) / distTotal);
                    const statePct = ((stateTotalsGrouped[cat] || 0) / stateTotalAll);
                    return {
                        label: cat,
                        districtVal: distPct,
                        stateAvg: statePct,
                        deviationPct: statePct === 0 ? 0 : ((distPct - statePct) / statePct) * 100,
                        formatKey: 'percent_alloc'
                    };
                });
                // Sort by highest deviation to lowest
                proceedsDevData.sort((a,b) => b.deviationPct - a.deviationPct);
                
                renderDeviationChart('deviation-proceeds-chart', null, null, proceedsDevData);
            }
        }
    }
}

function renderKPIs(districtData, allData, isBondMode) {
  // Common helper for percentile
  const getPercentile = (val, key) => {
    const allVals = allData.map(r => parseFloat(r[key]) || 0).sort((a,b) => a - b);
    const rank = allVals.indexOf(val) / allVals.length;
    return `${Math.round(rank * 100)}th percentile`;
  };

  if (isBondMode) {
    // 1. Total Investment
    const totalInv = parseFloat(districtData['Total_Inv_Value']) || 0;
    document.getElementById('kpi-title-1').innerHTML = 'Total Investment Value<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Total municipal bond investments</div></div>';
    document.getElementById('kpi-val-1').innerText = formatMetricValue(totalInv, 'Total_Inv_Value', { includeUnit: false });
    document.getElementById('kpi-sub-1').innerText = getPercentile(totalInv, 'Total_Inv_Value');

    // 2. Total Issuers
    const totalIss = parseFloat(districtData['Total_Issuers']) || 0;
    document.getElementById('kpi-title-2').innerHTML = 'Total Issuers<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Number of municipal bond issuers</div></div>';
    document.getElementById('kpi-val-2').innerText = totalIss.toLocaleString();
    document.getElementById('kpi-sub-2').innerText = getPercentile(totalIss, 'Total_Issuers');

    // 3. Small Borrowers
    const smallBorr = parseFloat(districtData['Small_Borrowers']) || 0;
    document.getElementById('kpi-title-3').innerHTML = 'Small Borrowers<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Number of small borrowers</div></div>';
    document.getElementById('kpi-val-3').innerText = smallBorr.toLocaleString();
    document.getElementById('kpi-sub-3').innerText = getPercentile(smallBorr, 'Small_Borrowers');

    // Show extra cards
    document.getElementById('kpi-card-4').style.display = 'flex';
    document.getElementById('kpi-card-5').style.display = 'flex';
    document.getElementById('kpi-card-6').style.display = 'flex';

    // 4. Sub-State Investment
    const subStateInv = parseFloat(districtData['Sub_State_Inv_Value']) || 0;
    document.getElementById('kpi-title-4').innerHTML = 'Sub-State Investment<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Investment value outside state level</div></div>';
    document.getElementById('kpi-val-4').innerText = formatMetricValue(subStateInv, 'Sub_State_Inv_Value', { includeUnit: false });
    document.getElementById('kpi-sub-4').innerText = getPercentile(subStateInv, 'Sub_State_Inv_Value');

    // 5. District Taxpayer Savings
    const distSav = parseFloat(districtData['Sub_State_Sav_Value']) || 0;
    document.getElementById('kpi-title-5').innerHTML = 'District Taxpayer Savings<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Estimated savings for taxpayers</div></div>';
    document.getElementById('kpi-val-5').innerText = formatMetricValue(distSav, 'Sub_State_Sav_Value', { includeUnit: false });
    document.getElementById('kpi-sub-5').innerText = getPercentile(distSav, 'Sub_State_Sav_Value');

    // 6. Small Borrowers Percent
    const smallBorrPct = parseFloat(districtData['Small_Borrowers_Pct']) || 0;
    document.getElementById('kpi-title-6').innerHTML = 'Small Borrowers Percent (%)<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Percentage of borrowers classified as small</div></div>';
    document.getElementById('kpi-val-6').innerText = smallBorrPct.toFixed(1) + '%';
    document.getElementById('kpi-sub-6').innerText = getPercentile(smallBorrPct, 'Small_Borrowers_Pct');

  } else {
    // Hide extra cards
    document.getElementById('kpi-card-4').style.display = 'none';
    document.getElementById('kpi-card-5').style.display = 'none';
    document.getElementById('kpi-card-6').style.display = 'none';

    // Helper to get latest period field for a metric
    const getLatestFieldFor = (metric) => {
      const prefix = `${metric}__Total__`;
      const keys = Object.keys(districtData).filter(k => k.startsWith(prefix));
      if (keys.length > 0) {
        return keys.sort((a, b) => b.localeCompare(a))[0];
      }
      return `${metric}__Total`;
    };

    // 1. Overall Health (Placeholder using Life Expectancy)
    const lifeExpField = getLatestFieldFor('Life_Expectancy');
    const lifeExp = parseFloat(districtData[lifeExpField]) || 0;
    document.getElementById('kpi-title-1').innerHTML = 'Overall Health Score<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Composite health score</div></div>';
    document.getElementById('kpi-val-1').innerText = lifeExp ? `${lifeExp.toFixed(1)} yrs` : 'N/A';
    document.getElementById('kpi-sub-1').innerText = 'Avg Life Expectancy';

    // 2. Economic Score (Placeholder using Poverty)
    const povField = getLatestFieldFor('Children_in_Poverty');
    const pov = parseFloat(districtData[povField]) || 0;
    document.getElementById('kpi-title-2').innerHTML = 'Economic Score<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Economic resilience</div></div>';
    document.getElementById('kpi-val-2').innerText = pov ? `${(pov*100).toFixed(1)}%` : 'N/A';
    document.getElementById('kpi-sub-2').innerText = 'Children in Poverty';

    // 3. Selected Health Metric
    const activeField = state.getActiveDataField();
    const activeVal = parseFloat(districtData[activeField]) || 0;
    document.getElementById('kpi-title-3').innerHTML = `${state.activeMetric.replace(/_/g, ' ')}<div class="glass-tooltip-container info-icon">i<div class="glass-tooltip">Currently selected map metric</div></div>`;
    document.getElementById('kpi-val-3').innerText = formatMetricValue(activeVal, state.activeMetric, { includeUnit: true });
    document.getElementById('kpi-sub-3').innerText = getPercentile(activeVal, activeField);
  }
}

function renderProceedsChart(districtData) {
  const bondsDiv = document.getElementById('charts-deep-dive-bonds');
  bondsDiv.style.flexDirection = 'column';
  const stateName = districtData.District_Name ? districtData.District_Name.replace(/ \d+(st|nd|rd|th)?$/, '').trim() : '';

  bondsDiv.innerHTML = `
      <div style="width: 100%; margin-bottom: 20px;">
        <h3 id="sankey-title" style="font-size: 12px; letter-spacing: 1px; color: var(--accent-cyan); text-transform: uppercase; margin-bottom: 10px;">${stateName} Capital Flow</h3>
        <div id="sankey-container" style="width: 100%; height: 420px; background: rgba(0, 0, 0, 0.3); border: 1px solid rgba(2, 212, 255, 0.15); border-radius: 8px; position: relative; overflow: hidden;">
          <div style="position: absolute; top: 15px; left: 20px; z-index: 10; display: flex; gap: 10px;">
            <button id="sankey-toggle-state" style="padding: 5px 15px; font-size: 11px; border-radius: 15px; cursor: pointer; transition: all 0.3s ease;">Statewide</button>
            <button id="sankey-toggle-district" style="padding: 5px 15px; font-size: 11px; border-radius: 15px; cursor: pointer; transition: all 0.3s ease;">District</button>
          </div>
        </div>
      </div>
        <div style="display: flex; flex-direction: row; gap: 20px; width: 100%;">
          <div class="radar-section" style="flex: 1;">
            <h3>BOND METRICS PROFILE</h3>
            <div id="radar-bonds" class="radar-container glass-panel" style="flex-direction: column; align-items: center; justify-content: center; position: relative; height: 400px; padding-top: 20px;"></div>
          </div>
          <div class="radar-section" style="flex: 1;">
            <h3>USE OF PROCEEDS</h3>
            <div id="radar-proceeds" class="radar-container glass-panel" style="flex-direction: column; align-items: center; justify-content: center; position: relative; height: 400px; padding-top: 20px;"></div>
          </div>
        </div>
    `;

    // Sankey setup
    let isStatewide = true;
    const btnState = document.getElementById('sankey-toggle-state');
    const btnDistrict = document.getElementById('sankey-toggle-district');
    const sankeyTitle = document.getElementById('sankey-title');

    function renderSankey(mode) {
        if (window.sankeyCleanup) {
            window.sankeyCleanup();
            window.sankeyCleanup = null;
        }
        if (window.sankeyObserver) {
            window.sankeyObserver.disconnect();
            window.sankeyObserver = null;
        }
        
        let drawFunc = null;
        
        if (mode === 'state') {
            sankeyTitle.innerText = `${stateName} Capital Flow`;
            btnState.style.background = 'rgba(2, 212, 255, 0.2)';
            btnState.style.border = '1px solid var(--accent-cyan)';
            btnState.style.color = 'white';
            
            btnDistrict.style.background = 'transparent';
            btnDistrict.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            btnDistrict.style.color = 'rgba(255,255,255,0.6)';
            
            const stateData = (state.stateMuniData || []).find(d => d.State_Name === stateName);
            if (stateData) {
                drawFunc = () => drawAnimatedSankey('#sankey-container', stateData, stateName);
            } else {
                d3.select('#sankey-container').selectAll('svg, .sankey-error').remove();
                d3.select('#sankey-container').append('div')
                    .attr('class', 'sankey-error')
                    .style('color', 'var(--text-muted)')
                    .style('padding', '60px 20px')
                    .style('text-align', 'center')
                    .style('position', 'absolute')
                    .style('width', '100%')
                    .style('top', '40%')
                    .text('No state data available for ' + stateName);
            }
        } else {
            sankeyTitle.innerText = `${districtData.District_Name} Capital Flow`;
            btnDistrict.style.background = 'rgba(2, 212, 255, 0.2)';
            btnDistrict.style.border = '1px solid var(--accent-cyan)';
            btnDistrict.style.color = 'white';
            
            btnState.style.background = 'transparent';
            btnState.style.border = '1px solid rgba(255, 255, 255, 0.2)';
            btnState.style.color = 'rgba(255,255,255,0.6)';
            
            drawFunc = () => drawAnimatedSankey('#sankey-container', districtData, districtData.District_Name);
        }

        if (drawFunc) {
            window.sankeyCleanup = drawFunc();
            
            const containerNode = document.getElementById('sankey-container');
            window.sankeyObserver = new ResizeObserver(entries => {
                const newWidth = entries[0].contentRect.width;
                const oldWidth = parseFloat(containerNode.dataset.renderedWidth) || 0;
                if (newWidth > 0 && Math.abs(newWidth - oldWidth) > 10) {
                    containerNode.dataset.renderedWidth = newWidth;
                    if (window.sankeyCleanup) window.sankeyCleanup();
                    window.sankeyCleanup = drawFunc();
                }
            });
            containerNode.dataset.renderedWidth = containerNode.clientWidth || 0;
            window.sankeyObserver.observe(containerNode);
        }
    }

    btnState.addEventListener('click', () => {
        if (!isStatewide) {
            renderSankey('state');
            isStatewide = !isStatewide;
        }
    });
    btnDistrict.addEventListener('click', () => {
        if (isStatewide) {
            renderSankey('district');
            isStatewide = !isStatewide;
        }
    });
    
    renderSankey('state');

      // DRAW RADAR CHARTS
      const allData = state.metricsData || [];
      const getPercentileRaw = (val, key) => {
        const allVals = allData.map(r => parseFloat(r[key]) || 0).sort((a,b) => a - b);
        if(allVals.length === 0) return 0.5;
        let rank = allVals.indexOf(val);
        if (rank === -1) rank = allVals.findIndex(v => v >= val);
        if (rank === -1) rank = allVals.length - 1;
        return rank / Math.max(1, allVals.length - 1);
      };

      const bMetrics = [
        { label: 'Total Investment', key: 'Total_Inv_Value' },
        { label: 'Total Issuers', key: 'Total_Issuers' },
        { label: 'Small Borrowers', key: 'Small_Borrowers' },
        { label: 'Small Borrowers %', key: 'Small_Borrowers_Pct' },
        { label: 'Sub-State Inv', key: 'Sub_State_Inv_Value' },
        { label: 'Taxpayer Savings', key: 'Sub_State_Sav_Value' }
      ];

      const distAxes = bMetrics.map(m => {
        const v = parseFloat(districtData[m.key]) || 0;
        return { axis: m.label, value: getPercentileRaw(v, m.key), rawValue: v, formatKey: m.key };
      });

      const stateItems = allData.filter(d => d.District_Name && d.District_Name.startsWith(stateName));
      const stateAxes = bMetrics.map(m => {
        const v = d3.mean(stateItems, d => parseFloat(d[m.key]) || 0) || 0;
        return { axis: m.label, value: getPercentileRaw(v, m.key), rawValue: v, formatKey: m.key };
      });

      const natAxes = bMetrics.map(m => {
        const v = d3.mean(allData, d => parseFloat(d[m.key]) || 0) || 0;
        return { axis: m.label, value: getPercentileRaw(v, m.key), rawValue: v, formatKey: m.key };
      });

      const radarData = [
        { name: 'District', axes: distAxes },
        { name: 'State Avg', axes: stateAxes },
        { name: 'National Avg', axes: natAxes }
      ];

      drawRadarChart('#radar-bonds', radarData, { w: 220, h: 220, levels: 5, margin: { top: 70, right: 90, bottom: 70, left: 90 } });

      const grouped = {
        'Healthcare & Human Services': 0,
        'Education': 0,
        'Housing': 0,
        'Utilities & Environment': 0,
        'Transportation': 0,
        'Infrastructure & Public Facilities': 0,
        'Economic & Commercial Development': 0,
        'Recreation & Culture': 0,
        'Other / Unclassified': 0
      };

      if (districtData.Proceeds_Data) {
        let pArray = [];
        try {
          pArray = typeof districtData.Proceeds_Data === 'string' ? JSON.parse(districtData.Proceeds_Data.replace(/'/g, '"')) : districtData.Proceeds_Data;
        } catch (e) {
          console.warn("Failed to parse Proceeds_Data", e);
        }
        
        if (Array.isArray(pArray)) {
          pArray.forEach(p => {
          const cat = (p.Category || '').toUpperCase();
          const rawAmtStr = p.Amount !== undefined ? String(p.Amount) : String(p.Amount_Millions);
          const rawAmt = parseFloat(rawAmtStr.replace(/[\$,]/g, ''));
          const amt = rawAmt || 0;
          if (cat.includes('HOSPITAL') || cat.includes('NURSING') || cat.includes('LIFECARE') || cat.includes('HEALTH') || cat.includes('HUMAN SERVICE') || cat.includes('HUMANSERVICE')) {
            grouped['Healthcare & Human Services'] += amt;
          } else if (cat.includes('EDUCATION') || cat.includes('SCHOOL') || cat.includes('STUDENT')) {
            grouped['Education'] += amt;
          } else if (cat.includes('HOUSING') || cat.includes('HOMES') || cat.includes('HSG') || cat.includes('LD PRESERVTN')) {
            grouped['Housing'] += amt;
          } else if (cat.includes('WATER') || cat.includes('SEWER') || cat.includes('SANITATION') || cat.includes('WASTE') || cat.includes('UTILITY') || cat.includes('UTILITIES') || cat.includes('ELECTRIC') || cat.includes('POWER') || cat.includes('GAS') || cat.includes('COGENERATION') || cat.includes('POLLUTION') || cat.includes('DRAINAGE') || cat.includes('IRRIGATION')) {
            grouped['Utilities & Environment'] += amt;
          } else if (cat.includes('TRANSPORTATION') || cat.includes('TRANSIT') || cat.includes('STREET') || cat.includes('HIGHWAY') || cat.includes('BRIDGE') || cat.includes('TUNNEL') || cat.includes('AIRPORT') || cat.includes('SEAPORT') || cat.includes('TERMINAL') || cat.includes('PARKING') || cat.includes('TOLL ROAD') || cat.includes('TOLLROAD') || cat.includes('AIRLINES')) {
            grouped['Transportation'] += amt;
          } else if (cat.includes('GOVERNMENT') || cat.includes('PUBLIC BUILDING') || cat.includes('PUBLICBUILDING') || cat.includes('FIRE') || cat.includes('POLICE') || cat.includes('COURT') || cat.includes('GENERAL PURPOSE') || cat.includes('GENERALPURPOSE') || cat.includes('PUBLIC IMPROVEMENT') || cat.includes('PUBLICIMPROVEMENT') || cat.includes('TELECOMMUNICATION')) {
            grouped['Infrastructure & Public Facilities'] += amt;
          } else if (cat.includes('ECONOMIC') || cat.includes('INDUSTRIAL') || cat.includes('REDEVELOPMENT') || cat.includes('MALL') || cat.includes('HOTEL') || cat.includes('OFFICE') || cat.includes('AGRICULTURE') || cat.includes('VETERANS')) {
            grouped['Economic & Commercial Development'] += amt;
          } else if (cat.includes('PARK') || cat.includes('ZOO') || cat.includes('BEACH') || cat.includes('RECREATION') || cat.includes('CIVIC') || cat.includes('CONVENTION') || cat.includes('STADIUM') || cat.includes('SPORTS') || cat.includes('THEATER') || cat.includes('LIBRARY') || cat.includes('MUSEUM')) {
            grouped['Recreation & Culture'] += amt;
          } else {
            grouped['Other / Unclassified'] += amt;
          }
          });
        }
      }

      const maxProceeds = d3.max(Object.values(grouped)) || 1;
      const proceedsAxes = Object.keys(grouped).map(k => {
        const v = grouped[k];
        return { axis: k.split(' & ')[0], value: Math.max(0.05, v / maxProceeds), rawValue: v };
      });

      const proceedsData = [
        { name: 'District', axes: proceedsAxes }
      ];

      drawRadarChart('#radar-proceeds', proceedsData, { w: 220, h: 220, levels: 5, margin: { top: 70, right: 90, bottom: 70, left: 90 } });
}

function renderRadarCharts(districtData, allData) {
  const healthContainer = document.getElementById('radar-health');
  const economicContainer = document.getElementById('radar-economic');

  // Helper to get latest period field for a metric
  const getLatestFieldFor = (metric) => {
    const prefix = `${metric}__Total__`;
    const keys = Object.keys(districtData).filter(k => k.startsWith(prefix));
    if (keys.length > 0) {
      return keys.sort((a, b) => b.localeCompare(a))[0];
    }
    return `${metric}__Total`;
  };

  const getPercentileScore = (metricKey, value, isHigherBetter) => {
    if (isNaN(value) || value === null) return 0;
    const allVals = allData.map(d => parseFloat(d[metricKey])).filter(v => !isNaN(v)).sort((a,b) => a - b);
    if (allVals.length === 0) return 0;
    let rank = allVals.findIndex(v => v >= value);
    let percentile = rank / allVals.length;
    return isHigherBetter ? percentile : (1 - percentile);
  };

  const getStateAverage = (stateName, metricKey) => {
    const stateVals = allData
        .filter(d => (d.District_Name && d.District_Name.startsWith(stateName)))
        .map(d => parseFloat(d[metricKey]))
        .filter(v => !isNaN(v));
    if (stateVals.length === 0) return null;
    return stateVals.reduce((a,b)=>a+b, 0) / stateVals.length;
  };

  const stateName = districtData.District_Name ? districtData.District_Name.replace(/ \d+(st|nd|rd|th)?$/, '') : '';

  const processRadarData = (metricDefs) => {
    const districtAxes = [];
    const stateAxes = [];

    metricDefs.forEach(m => {
      const field = getLatestFieldFor(m.id);
      
      const districtRaw = parseFloat(districtData[field]);
      const districtScore = getPercentileScore(field, districtRaw, m.isHigherBetter);
      
      const stateRaw = getStateAverage(stateName, field);
      const stateScore = getPercentileScore(field, stateRaw, m.isHigherBetter);

      districtAxes.push({
        axis: m.label,
        value: districtScore || 0,
        rawValue: districtRaw
      });

      stateAxes.push({
        axis: m.label,
        value: stateScore || 0,
        rawValue: stateRaw
      });
    });

    return [
      { name: districtData.District_Name || "District", axes: districtAxes },
      { name: stateName + " Average", axes: stateAxes }
    ];
  };

  const envMetrics = [
    { id: 'Air_Pollution___Particulate_Matter', label: 'PM2.5', isHigherBetter: false },
    { id: 'Breast_Cancer_Deaths', label: 'Breast Cancer', isHigherBetter: false },
    { id: 'Life_Expectancy', label: 'Life Expect.', isHigherBetter: true },
    { id: 'Obesity', label: 'Obesity', isHigherBetter: false },
    { id: 'Diabetes', label: 'Diabetes', isHigherBetter: false },
    { id: 'Dental_Care', label: 'Dental Care', isHigherBetter: true }
  ];

  const econMetrics = [
    { id: 'Children_in_Poverty', label: 'Poverty', isHigherBetter: false },
    { id: 'Rent_Burden', label: 'Rent Burden', isHigherBetter: false },
    { id: 'Uninsured', label: 'Uninsured', isHigherBetter: false },
    { id: 'Broadband_Connection', label: 'Broadband', isHigherBetter: true },
    { id: 'Unemployment', label: 'Unemployment', isHigherBetter: false },
    { id: 'Income_Inequality', label: 'Inequality', isHigherBetter: false }
  ];

  const envData = processRadarData(envMetrics);
  const econData = processRadarData(econMetrics);

  // Clear placeholders
  healthContainer.innerHTML = '';
  economicContainer.innerHTML = '';

  const radarOptions = {
    w: 220,
    h: 220,
    margin: { top: 40, right: 40, bottom: 40, left: 40 },
    maxValue: 1,
    levels: 4,
    color: d3.scaleOrdinal().range(["#02D4FF", "#888888"])
  };

  drawRadarChart('#radar-health', envData, radarOptions);
  drawRadarChart('#radar-economic', econData, radarOptions);
}

const initChartsButtons = () => {
    const btnNational = document.getElementById('btn-national-view-charts');
    if (btnNational) {
        btnNational.addEventListener('click', (e) => {
            e.preventDefault();
            
            const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
            if (mapTab) mapTab.click();
            
            const bondsRadio = document.querySelector('input[name="sidebar-mode"][value="bonds"]');
            if (bondsRadio) bondsRadio.click();
            
            setTimeout(() => {
                state.setSelectedDistrict(null);
                state.insightsLeftDistrict = null;
                state.insightsRightDistrict = null;
                
                import('./map.js').then(m => m.resetMapView());
            }, 350);
        });
    }

    const btnGoDistrict = document.getElementById('btn-go-district-charts');
    if (btnGoDistrict) {
        btnGoDistrict.addEventListener('click', () => {
            if (state.selectedDistrict) {
                const mapTab = document.querySelector('.tab-btn[data-tab="maps"]');
                if (mapTab) mapTab.click();
                const bondsRadio = document.querySelector('input[name="sidebar-mode"][value="bonds"]');
                if (bondsRadio) bondsRadio.click();
                
                const districtData = state.metricsData.find(d => d.District_Name === state.selectedDistrict || d.GEOID === state.selectedDistrict);
                if (districtData && districtData.GEOID) {
                    if (window.resizeTimeout) clearTimeout(window.resizeTimeout);
                    setTimeout(() => {
                        import('./map.js').then(m => {
                            if (m.flyToDistrict) m.flyToDistrict(districtData.GEOID);
                        });
                    }, 450);
                }
            }
        });
    }
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initChartsButtons);
} else {
    initChartsButtons();
}
