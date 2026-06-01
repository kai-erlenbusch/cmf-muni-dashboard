import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawAnimatedSankey(containerId, stateData, sourceName) {
  const container = document.querySelector(containerId);
  if (!container) return;
  d3.select(container).selectAll('svg, .sankey-error').remove();

  // Group categories logic
  const grouped = {
    'Education': 0, 'Healthcare & Human Services': 0, 'Housing': 0,
    'Utilities & Environment': 0, 'Transportation': 0, 
    'Infrastructure & Public Facilities': 0, 'Economic & Commercial Development': 0,
    'Recreation & Culture': 0, 'Other / Unclassified': 0
  };

  stateData.Proceeds_Data.forEach(p => {
    const cat = (p.Category || '').toUpperCase();
    const amtStr = p.Amount !== undefined ? String(p.Amount).replace(/[\$,]/g, '') : null;
    const rawAmt = amtStr !== null ? parseFloat(amtStr) : parseFloat(String(p.Amount_Millions).replace(/[\$,]/g, ''));
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

  let proceeds = Object.keys(grouped)
    .map(k => ({ Category: k, Amount_Millions: grouped[k] }))
    .filter(d => d.Amount_Millions > 0)
    .sort((a, b) => b.Amount_Millions - a.Amount_Millions);
    
  const totalProceeds = d3.sum(proceeds, d => d.Amount_Millions);
  const maxAmount = d3.max(proceeds, d => d.Amount_Millions) || 1;
  
  if (totalProceeds <= 0) return;

  const width = container.clientWidth || 600;
  const height = 420;
  const margin = { top: 30, right: 220, bottom: 30, left: 150 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Make container position relative so we can overlay HTML if needed
  container.style.position = 'relative';

  const svg = d3.select(container).append("svg")
    .attr("width", width)
    .attr("height", height)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Scales
  const xScale = d3.scaleLinear()
    .domain([0, 1])
    .range([0, innerWidth]);

  // Single source node
  const startY = innerHeight / 2;

  // Destination nodes
  const endYScale = d3.scalePoint()
    .domain(proceeds.map(d => d.Category))
    .range([0, innerHeight])
    .padding(0.5);

  const colorScale = d3.scaleOrdinal(d3.schemeSet3)
    .domain(proceeds.map(d => d.Category));

  // Remove the old linear step scale
  // We will use d3.easeCubicInOut directly

  // Draw smooth link paths underneath
  const linkGenerator = d3.linkHorizontal()
    .x(d => d.x)
    .y(d => d.y);

  proceeds.forEach(d => {
    const endY = endYScale(d.Category);
    
    // Draw the subtle curve
    svg.append("path")
      .attr("d", linkGenerator({
        source: { x: 0, y: startY },
        target: { x: innerWidth, y: endY }
      }))
      .attr("fill", "none")
      .attr("stroke", colorScale(d.Category))
      .attr("stroke-width", Math.max(4, (d.Amount_Millions / maxAmount) * 45)) // Scale thickness by proportion
      .attr("stroke-opacity", 0.15);
      
    // Draw destination label
    svg.append("text")
      .attr("x", innerWidth + 15)
      .attr("y", endY)
      .attr("dy", "0.35em")
      .attr("fill", "rgba(255,255,255,0.8)")
      .attr("font-size", "13px")
      .text(d.Category.replace(/([A-Z])/g, ' $1').trim()); // Add spaces to camelCase
      
    // Draw destination amount
    svg.append("text")
      .attr("x", innerWidth + 15)
      .attr("y", endY + 16)
      .attr("fill", colorScale(d.Category))
      .attr("font-size", "12px")
      .attr("font-weight", "bold")
      .text(`$${d.Amount_Millions >= 1000 ? (d.Amount_Millions/1000).toFixed(2) + 'B' : d.Amount_Millions.toFixed(1) + 'M'}`);
  });

  // Source label
  svg.append("text")
    .attr("x", -15)
    .attr("y", startY)
    .attr("text-anchor", "end")
    .attr("dy", "-0.5em")
    .attr("fill", "rgba(255,255,255,0.9)")
    .attr("font-size", "14px")
    .attr("font-weight", "bold")
    .text(sourceName || stateData.State_Name || "Capital");
    
  svg.append("text")
    .attr("x", -15)
    .attr("y", startY)
    .attr("text-anchor", "end")
    .attr("dy", "1em")
    .attr("fill", "var(--accent-cyan)")
    .attr("font-size", "12px")
    .text("Total Capital");

  // Particle Animation System
  const maximumParticles = 200; // Adjust for performance vs density
  const particleDuration = 4000; // ms to cross the screen
  let particles = [];
  
  // Create a container for the particles so they render above paths
  const particleGroup = svg.append("g").attr("class", "particles");

  // Probability distribution array based on amounts
  const distribution = proceeds.map(d => ({
    category: d.Category,
    prob: d.Amount_Millions / totalProceeds
  }));

  function getRandomCategory() {
    let r = Math.random();
    for (let i = 0; i < distribution.length; i++) {
      if (r < distribution[i].prob) return distribution[i].category;
      r -= distribution[i].prob;
    }
    return distribution[distribution.length - 1].category;
  }

  function generateParticle(elapsed) {
    const category = getRandomCategory();
    // Jitter so they don't all follow the exact same pixel path
    const yJitter = (Math.random() - 0.5) * 15;
    return {
      id: Math.random().toString(36).substr(2, 9),
      startTime: elapsed,
      category: category,
      yJitter: yJitter
    };
  }

  // Animation Loop
  const timer = d3.timer((elapsed) => {
    // 1. Calculate linear progress based on elapsed time
    const xProgressAccessor = d => (elapsed - d.startTime) / particleDuration;
    
    // 2. Remove completed particles
    particles = particles.filter(d => xProgressAccessor(d) < 1);

    // 3. Spawn new particles
    if (particles.length < maximumParticles) {
      // Spawn a few per frame to keep it flowing
      particles.push(generateParticle(elapsed));
      if (Math.random() > 0.5) particles.push(generateParticle(elapsed));
    }
    
    // 4. Data bind
    const markers = particleGroup.selectAll(".particle")
      .data(particles, d => d.id);
      
    // Enter
    markers.enter().append("circle")
      .attr("class", "particle")
      .attr("r", 3)
      .attr("fill", d => colorScale(d.category))
      .style("opacity", 0)
      .merge(markers) // Update
      .style("transform", d => {
        const xProg = xProgressAccessor(d);
        const x = xScale(xProg);
        
        const yStart = startY;
        const yEnd = endYScale(d.category);
        const yChange = yEnd - yStart;
        
        // Smoothly split paths along the entire [0, 1] x axis
        const yProgress = d3.easeCubicInOut(xProg);
        const y = yStart + yChange * yProgress + d.yJitter;
        
        return `translate(${x}px, ${y}px)`;
      })
      .style("opacity", d => {
        const xProg = xProgressAccessor(d);
        // Fade in at start, fade out at end
        if (xProg < 0.05) return xProg / 0.05;
        if (xProg > 0.95) return (1 - xProg) / 0.05;
        return 0.8;
      });
      
    // Exit
    markers.exit().remove();
  });

  // Return a cleanup function so we can stop the timer when the view changes
  return () => timer.stop();
}
