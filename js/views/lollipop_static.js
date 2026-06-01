import { state } from '../state.js';
import { formatMetricValue } from './details.js';

const CARDS_CONFIG = [
  {
    title: "Health Outcomes",
    metrics: [
      'Breast_Cancer_Deaths', 'Cardiovascular_Disease_Deaths', 'Colorectal_Cancer_Deaths', 
      'Diabetes', 'Firearm_Homicides', 'Firearm_Suicides', 'Frequent_Mental_Distress', 
      'Frequent_Physical_Distress', 'High_Blood_Pressure', 'Independent_Living_Difficulty', 
      'Life_Expectancy', 'Low_Birthweight', 'Obesity', 'Opioid_Overdose_Deaths', 
      'Premature_Deaths_(All_Causes)'
    ]
  },
  {
    title: "Social and Economic Factors",
    metrics: [
      'Broadband_Connection', 'Children_in_Poverty', 'Chronic_Absenteeism', 'Food_Insecurity', 
      'High_School_Completion', 'Income_Inequality', 'Neighborhood_Racial/Ethnic_Segregation', 
      'Racial/Ethnic_Diversity', 'Rent_Burden', 'SNAP_Participation', 'Unemployment', 
      'Youth_Not_in_Work_or_School'
    ]
  },
  {
    title: "Health Behaviors",
    metrics: ['Binge_Drinking', 'Physical_Inactivity', 'Smoking', 'Teen_Births']
  },
  {
    title: "Physical Environment",
    metrics: [
      'Air_Pollution___Ozone', 'Air_Pollution___Particulate_Matter', 
      'Housing_with_Potential_Lead_Risk', 'Lead_Exposure_Risk_Index'
    ]
  },
  {
    title: "Clinical Care",
    metrics: [
      'Dental_Care', 'Designated_Primary_Care_Shortage_Area', 'Medicaid_Enrollment', 
      'Prenatal_Care', 'Routine_Checkup,_18+', 'Uninsured'
    ]
  }
];

export function renderStaticLollipopDash(districtData, metricsData) {
  const container = document.getElementById('health-static-cards-section');
  if (!container) return;

  // Clear existing cards
  container.innerHTML = '';
  
  // Create a responsive grid layout for the category cards
  container.style.display = 'grid';
  container.style.gridTemplateColumns = 'repeat(auto-fit, minmax(450px, 1fr))';
  container.style.gap = '24px';
  container.style.alignItems = 'start';
  
  if (!districtData || !metricsData || metricsData.length === 0) return;

  const districtName = districtData.District_Name || `District ${districtData.GEOID}`;

  CARDS_CONFIG.forEach(cardConf => {
    // 1. Create Card Container
    const cardDiv = document.createElement('div');
    cardDiv.className = 'glass-panel';
    cardDiv.style.padding = '20px';
    cardDiv.style.borderRadius = '12px';
    cardDiv.style.display = 'flex';
    cardDiv.style.flexDirection = 'column';
    cardDiv.style.height = '100%';
    
    const title = document.createElement('h3');
    title.style.fontSize = '18px';
    title.style.marginBottom = '20px';
    title.style.color = 'var(--text-primary)';
    title.style.textTransform = 'uppercase';
    title.style.letterSpacing = '1px';
    title.innerText = cardConf.title;
    cardDiv.appendChild(title);

    // Use CSS Grid for the metrics inside the card
    const gridContainer = document.createElement('div');
    gridContainer.style.display = 'grid';
    gridContainer.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    gridContainer.style.gap = '15px';
    gridContainer.style.width = '100%';
    gridContainer.style.flexGrow = '1';
    cardDiv.appendChild(gridContainer);
    
    container.appendChild(cardDiv);

    // 2. Prepare Data
    const chartData = [];
    
    cardConf.metrics.forEach(metricId => {
      // Safely Get Field Name (fallback through possible key structures)
      let dataField = `${metricId}__Total__`;
      if (state.currentDataPeriod) {
        dataField += state.currentDataPeriod;
      } else {
        let matchingKeys = Object.keys(districtData).filter(k => k.startsWith(`${metricId}__Total__`));
        if (matchingKeys.length === 0) {
          // Fallback to single underscore or no trailing underscores
          matchingKeys = Object.keys(districtData).filter(k => k.startsWith(`${metricId}__Total`));
        }
        if (matchingKeys.length === 0) {
          // Ultimate fallback for Exact Matches if __Total doesn't exist (e.g. Air Pollution)
          matchingKeys = Object.keys(districtData).filter(k => k.startsWith(metricId));
        }

        if (matchingKeys.length > 0) {
          // Prefer the most recently dated one or the shortest one if no dates
          dataField = matchingKeys.sort().reverse()[0];
        } else {
          dataField = `${metricId}__Total`;
        }
      }

      const rawDistVal = parseFloat(districtData[dataField]);
      const distVal = (!isNaN(rawDistVal) && rawDistVal !== -999) ? rawDistVal : null;

      // Calculate National Average
      const validData = metricsData.map(d => parseFloat(d[dataField])).filter(v => !isNaN(v) && v !== -999);
      const natVal = validData.length > 0 ? validData.reduce((a, b) => a + b, 0) / validData.length : null;

      if (distVal !== null || natVal !== null) {
        chartData.push({
          metricId: metricId,
          metricLabel: metricId.replace(/_/g, ' '),
          distVal: distVal,
          natVal: natVal
        });
      }
    });

    if (chartData.length === 0) {
      gridContainer.innerHTML = '<div style="color: var(--text-muted); font-size: 12px; padding: 20px 0;">No data available for this section.</div>';
      return;
    }

    // 3. Render D3 Chart Grids
    chartData.forEach(d => {
      const itemDiv = document.createElement('div');
      itemDiv.style.background = 'rgba(255,255,255,0.02)';
      itemDiv.style.padding = '15px';
      itemDiv.style.borderRadius = '8px';
      itemDiv.style.border = '1px solid rgba(255,255,255,0.05)';
      gridContainer.appendChild(itemDiv);

      const metricTitle = document.createElement('h4');
      metricTitle.innerText = d.metricLabel;
      metricTitle.style.fontSize = '14px';
      metricTitle.style.marginBottom = '15px';
      metricTitle.style.marginTop = '0';
      metricTitle.style.color = 'var(--text-primary)';
      itemDiv.appendChild(metricTitle);

      const width = 350;
      const height = 80;
      const margin = { top: 10, right: 60, bottom: 10, left: 80 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;

      const svg = d3.select(itemDiv)
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .style('display', 'block');

      const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);

      const y1 = d3.scaleBand()
        .domain(['National Average', districtName])
        .range([0, innerHeight])
        .paddingInner(0.4);

      // Labels
      g.selectAll('.y-label')
        .data(['National Average', districtName])
        .enter()
        .append('text')
        .attr('class', 'y-label')
        .attr('x', -10)
        .attr('y', val => y1(val) + y1.bandwidth() / 2)
        .attr('dy', '0.32em')
        .attr('text-anchor', 'end')
        .attr('fill', val => val === 'National Average' ? '#888888' : 'var(--accent-cyan)')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .style('text-transform', 'uppercase')
        .style('letter-spacing', '0.5px')
        .text(val => val === 'National Average' ? 'National' : 'District');

      // X Scale
      const maxVal = Math.max(d.distVal || 0, d.natVal || 0) * 1.15;
      const x = d3.scaleLinear()
        .domain([0, maxVal])
        .range([0, innerWidth]);

      // Grid lines
      g.selectAll('.grid-line')
        .data(x.ticks(4))
        .enter()
        .append('line')
        .attr('class', 'grid-line')
        .attr('x1', tv => x(tv))
        .attr('x2', tv => x(tv))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', 'rgba(255,255,255,0.05)')
        .attr('stroke-dasharray', '2,2');

      // National
      if (d.natVal !== null) {
        const ny = y1('National Average') + y1.bandwidth() / 2;
        g.append('line')
          .attr('x1', 0).attr('x2', x(d.natVal))
          .attr('y1', ny).attr('y2', ny)
          .attr('stroke', '#888888').attr('stroke-width', 2);
        g.append('circle')
          .attr('cx', x(d.natVal)).attr('cy', ny).attr('r', 4).attr('fill', '#888888');
        g.append('text')
          .attr('x', x(d.natVal) + 8).attr('y', ny).attr('dy', '0.32em')
          .attr('fill', '#888888').style('font-size', '11px').style('font-weight', '600')
          .text(formatMetricValue(d.natVal, d.metricId, { includeUnit: true }));
      }

      // District
      if (d.distVal !== null) {
        const dy = y1(districtName) + y1.bandwidth() / 2;
        g.append('line')
          .attr('x1', 0).attr('x2', x(d.distVal))
          .attr('y1', dy).attr('y2', dy)
          .attr('stroke', 'var(--accent-cyan)').attr('stroke-width', 2);
        g.append('circle')
          .attr('cx', x(d.distVal)).attr('cy', dy).attr('r', 4).attr('fill', 'var(--accent-cyan)');
        g.append('text')
          .attr('x', x(d.distVal) + 8).attr('y', dy).attr('dy', '0.32em')
          .attr('fill', 'var(--text-primary)').style('font-size', '11px').style('font-weight', '600')
          .text(formatMetricValue(d.distVal, d.metricId, { includeUnit: true }));
      }
    });
  });
}
