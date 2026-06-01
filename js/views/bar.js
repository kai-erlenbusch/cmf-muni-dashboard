import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawHorizontalBarChart(containerId, dataStr, nameKey, valKey, options = {}) {
  const container = document.querySelector(containerId);
  if (!container) return;
  container.innerHTML = '';

  if (!dataStr) {
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No data available</div>';
    return;
  }

  let data = [];
  try {
    let parsed = typeof dataStr === 'string' ? JSON.parse(dataStr.replace(/""/g, '"')) : dataStr;
    data = parsed;
  } catch (e) {
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No data available</div>';
    return;
  }

  if (!data || data.length === 0) {
    container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No data available</div>';
    return;
  }

  // Sort and take top 10
  data = data.sort((a, b) => b[valKey] - a[valKey]).slice(0, 10);
  data = data.reverse(); // For horizontal bar chart, bottom to top usually wants highest at top. Wait, d3 scaleBand maps top to bottom. So keep it sorted descending, then don't reverse if we want highest at top.
  data.reverse(); // Actually, to have the highest value at the top, it should be the first item.

  const w = options.w || container.clientWidth || 400;
  const h = options.h || (data.length * 35 + 40);
  const margin = options.margin || { top: 20, right: 30, bottom: 30, left: 140 };

  const width = w - margin.left - margin.right;
  const height = h - margin.top - margin.bottom;

  const svg = d3.select(container)
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  // Add glow filter
  const defs = svg.append("defs");
  const filter = defs.append("filter").attr("id", "glow-bar");
  filter.append("feGaussianBlur").attr("stdDeviation", "2.5").attr("result", "coloredBlur");
  const feMerge = filter.append("feMerge");
  feMerge.append("feMergeNode").attr("in", "coloredBlur");
  feMerge.append("feMergeNode").attr("in", "SourceGraphic");

  const x = d3.scaleLinear()
    .domain([0, d3.max(data, d => d[valKey])])
    .range([0, width]);

  const y = d3.scaleBand()
    .range([0, height])
    .domain(data.map(d => d[nameKey]))
    .padding(0.2);

  const formatCurrency = (val) => {
    if (val >= 1e9) return '$' + (val / 1e9).toFixed(1) + 'B';
    if (val >= 1e6) return '$' + (val / 1e6).toFixed(1) + 'M';
    return '$' + d3.format(",.0f")(val);
  };

  // Grid lines
  svg.append("g")
    .attr("class", "grid")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x)
      .tickSize(-height)
      .tickFormat("")
      .ticks(5)
    )
    .style("stroke-dasharray", "3,3")
    .style("stroke-opacity", 0.1)
    .select(".domain").remove();

  // X axis
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).ticks(5).tickFormat(formatCurrency))
    .selectAll("text")
    .style("fill", "var(--text-muted)")
    .style("font-size", "11px")
    .style("font-family", "var(--font-family)");

  svg.selectAll(".domain").remove();
  svg.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)");

  // Y axis
  svg.append("g")
    .call(d3.axisLeft(y).tickSize(0))
    .selectAll("text")
    .style("fill", "var(--text-primary)")
    .style("font-size", "11px")
    .style("font-weight", "500")
    .style("font-family", "var(--font-family)")
    .call(wrapText, margin.left - 10);

  svg.select(".domain").remove();

  // Tooltip
  let tooltip = d3.select(container).select(".bar-tooltip");
  if (tooltip.empty()) {
    tooltip = d3.select(container).append("div")
      .attr("class", "bar-tooltip glass-panel")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("z-index", 100)
      .style("padding", "8px 12px")
      .style("font-size", "12px");
  }

  // Bars
  svg.selectAll("myRect")
    .data(data)
    .join("rect")
    .attr("x", x(0) )
    .attr("y", d => y(d[nameKey]))
    .attr("width", d => x(d[valKey]))
    .attr("height", y.bandwidth())
    .attr("fill", "rgba(2, 212, 255, 0.4)")
    .attr("stroke", "#02D4FF")
    .attr("stroke-width", 1)
    .style("filter", "url(#glow-bar)")
    .on("mouseover", function(event, d) {
      d3.select(this).attr("fill", "rgba(2, 212, 255, 0.7)");
      tooltip.transition().duration(200).style("opacity", 1);
      tooltip.html(`
        <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">${d[nameKey]}</div>
        <div style="color:var(--accent-cyan);font-weight:600;">${formatCurrency(d[valKey])}</div>
      `)
      .style("left", (event.pageX + 15) + "px")
      .style("top", (event.pageY - 28) + "px");
    })
    .on("mousemove", function(event) {
      tooltip
        .style("left", (event.pageX + 15) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseleave", function() {
      d3.select(this).attr("fill", "rgba(2, 212, 255, 0.4)");
      tooltip.transition().duration(200).style("opacity", 0);
    });

  // Value labels on bars
  svg.selectAll("myText")
    .data(data)
    .join("text")
    .attr("x", d => x(d[valKey]) + 5)
    .attr("y", d => y(d[nameKey]) + y.bandwidth() / 2 + 4)
    .text(d => formatCurrency(d[valKey]))
    .style("fill", "var(--text-secondary)")
    .style("font-size", "10px")
    .style("font-family", "var(--font-family)");
}

function wrapText(text, width) {
  text.each(function() {
    let text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy") || 0.32),
        tspan = text.text(null).append("tspan").attr("x", -10).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", -10).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}
