import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';
import { formatMetricValue } from './details.js';

/**
 * Draw a diverging horizontal bar chart.
 * @param {string} containerId - The DOM ID of the container
 * @param {string} title - Chart title
 * @param {string} subtitle - Chart subtitle
 * @param {Array} data - Array of objects: { label, districtVal, stateAvg, deviationPct, formatKey }
 */
export function renderDeviationChart(containerId, title, subtitle, data) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = ''; // Clear previous

    const margin = { top: 10, right: 50, bottom: 20, left: 180 };
    let containerWidth = container.clientWidth;
    if (containerWidth < 100) containerWidth = 400; // Fallback if reflow hasn't happened
    const width = containerWidth - margin.left - margin.right;
    
    // ensure height is not NaN if container has no height
    let containerHeight = container.clientHeight;
    if (containerHeight < 100) containerHeight = 350;
    const height = containerHeight - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Scales
    const y = d3.scaleBand()
        .domain(data.map(d => d.label))
        .range([0, height])
        .padding(0.15);

    // Find max absolute deviation to balance the x-axis
    let maxDev = d3.max(data, d => Math.abs(d.deviationPct));
    if (!maxDev || maxDev === 0) maxDev = 0.1; // Default if 0
    // add 10% padding
    maxDev = maxDev * 1.1;

    // Leave 50px of padding on both sides of the X-axis for bar text labels to prevent overlap with Y-axis categories
    const xPad = 50;
    const x = d3.scaleLinear()
        .domain([-maxDev, maxDev])
        .range([xPad, Math.max(xPad + 10, width - xPad)]);

    // X Axis
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(4).tickFormat(d => (d > 0 ? '+' : '') + d.toFixed(0) + '%'))
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "var(--glass-border)"))
        .call(g => g.selectAll(".tick text").attr("fill", "var(--text-secondary)").attr("font-size", "11px"));

    // Grid lines
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisBottom(x)
            .tickSize(height)
            .tickFormat("")
            .ticks(4)
        )
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line")
            .attr("stroke", "rgba(255,255,255,0.05)")
            .attr("stroke-dasharray", "2,2")
        );

    // Y Axis (Labels)
    const yAxis = d3.axisLeft(y)
        .tickSize(0);

    svg.append("g")
        .attr("class", "y-axis")
        .call(yAxis)
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick text")
            .attr("fill", "var(--text-primary)")
            .attr("font-size", "14px")
            .attr("font-weight", "500")
            .attr("dx", "-10px")
            .call(wrap, margin.left - 15)
        );

    // Zero Line
    svg.append("line")
        .attr("x1", x(0))
        .attr("x2", x(0))
        .attr("y1", 0)
        .attr("y2", height)
        .attr("stroke", "rgba(255, 255, 255, 0.3)")
        .attr("stroke-width", 1.5);

    // Bars
    const bars = svg.selectAll(".bar")
        .data(data)
        .enter()
        .append("g");

    // Draw bars
    bars.append("rect")
        .attr("class", d => d.deviationPct < 0 ? "bar-negative" : "bar-positive")
        .attr("y", d => y(d.label))
        .attr("height", y.bandwidth())
        .attr("x", d => x(Math.min(0, d.deviationPct)))
        .attr("width", d => Math.max(1, Math.abs(x(d.deviationPct) - x(0))))
        .attr("fill", d => d.deviationPct < 0 ? "var(--accent-purple)" : "var(--accent-cyan)")
        .attr("rx", 2)
        .attr("opacity", 0.8)
        .style("transition", "opacity 0.2s");

    // Bar Labels
    bars.append("text")
        .attr("class", "bar-label")
        .attr("y", d => y(d.label) + y.bandwidth() / 2)
        .attr("x", d => {
            return d.deviationPct < 0 ? x(d.deviationPct) - 6 : x(d.deviationPct) + 6;
        })
        .attr("alignment-baseline", "middle")
        .attr("text-anchor", d => d.deviationPct < 0 ? "end" : "start")
        .attr("fill", "var(--text-primary)")
        .attr("font-size", "11px")
        .attr("font-weight", "500")
        .text(d => (d.deviationPct > 0 ? '+' : '') + d.deviationPct.toFixed(1) + '%');

    // Tooltip interactivity
    const tooltip = d3.select("body").append("div")
        .attr("class", "glass-panel tooltip-dev")
        .style("position", "absolute")
        .style("display", "none")
        .style("padding", "10px")
        .style("border-radius", "8px")
        .style("pointer-events", "none")
        .style("z-index", "1000")
        .style("font-size", "12px")
        .style("color", "var(--text-primary)")
        .style("box-shadow", "0 4px 15px rgba(0,0,0,0.3)")
        .style("border", "1px solid var(--glass-border)")
        .style("background", "rgba(15, 23, 36, 0.9)");

    bars.on("mouseover", function(event, d) {
        d3.select(this).select("rect").attr("opacity", 1).attr("stroke", "#fff").attr("stroke-width", 1);
        
        let distStr = "N/A";
        let stateStr = "N/A";
        
        if (d.formatKey === 'percent_alloc') {
            distStr = (d.districtVal * 100).toFixed(1) + '%';
            stateStr = (d.stateAvg * 100).toFixed(1) + '%';
        } else {
            distStr = formatMetricValue(d.districtVal, d.formatKey, { isHover: true });
            stateStr = formatMetricValue(d.stateAvg, d.formatKey, { isHover: true });
        }

        const tooltipHtml = `
            <div style="font-weight: 600; margin-bottom: 5px; color: var(--accent-cyan);">${d.label}</div>
            <div style="display: grid; grid-template-columns: auto 1fr; gap: 4px 12px;">
                <span style="color: var(--text-secondary);">District:</span>
                <span style="text-align: right; font-weight: 500;">${distStr}</span>
                <span style="color: var(--text-secondary);">State Avg:</span>
                <span style="text-align: right; font-weight: 500;">${stateStr}</span>
            </div>
            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--glass-border); display: flex; justify-content: space-between;">
                <span style="color: var(--text-secondary);">Deviation:</span>
                <span style="font-weight: 600; color: ${d.deviationPct >= 0 ? 'var(--accent-cyan)' : 'var(--accent-purple)'}">${(d.deviationPct > 0 ? '+' : '')}${d.deviationPct.toFixed(1)}%</span>
            </div>
        `;
        
        tooltip.html(tooltipHtml)
            .style("display", "block")
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY + 15) + "px");
    })
    .on("mousemove", function(event) {
        tooltip
            .style("left", (event.pageX + 15) + "px")
            .style("top", (event.pageY + 15) + "px");
    })
    .on("mouseout", function() {
        d3.select(this).select("rect").attr("opacity", 0.8).attr("stroke", "none");
        tooltip.style("display", "none");
    });

    // Wrap helper
    function wrap(text, width) {
        text.each(function () {
            const text = d3.select(this),
                words = text.text().split(/\s+/).reverse();
            let word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.2, // ems
                y = text.attr("y"),
                x = text.attr("x") || 0,
                dy = parseFloat(text.attr("dy") || 0),
                tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");

            while (word = words.pop()) {
                line.push(word);
                tspan.text(line.join(" "));
                if (tspan.node().getComputedTextLength() > width) {
                    line.pop();
                    tspan.text(line.join(" "));
                    line = [word];
                    tspan = text.append("tspan").attr("x", x).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                }
            }
        });
    }
}
