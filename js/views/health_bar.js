import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawComparisonBarChart(containerSelector, data, options = {}) {
    const container = document.querySelector(containerSelector);
    if (!container) return;
    container.innerHTML = ''; // Clear previous

    if (!data || data.length === 0) {
        container.innerHTML = '<div style="color:var(--text-muted); text-align:center; padding: 20px;">No data available</div>';
        return;
    }

    const margin = options.margin || { top: 20, right: 80, bottom: 40, left: 160 };
    const w = options.width || container.clientWidth || 600;
    const h = options.height || Math.max(150, data.length * 40 + margin.top + margin.bottom);
    
    const width = w - margin.left - margin.right;
    const height = h - margin.top - margin.bottom;

    const svg = d3.select(container)
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // X axis
    const x = d3.scaleLinear()
        .domain([0, d3.max(data, d => d.value) * 1.1]) // Add 10% padding on the right
        .range([0, width]);

    // Y axis
    const y = d3.scaleBand()
        .range([0, height])
        .domain(data.map(d => d.category))
        .padding(0.3);

    // Format function
    const formatValue = options.formatValue || (d => d3.format(",.1f")(d));

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

    // Add X axis labels
    svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(x).ticks(5))
        .selectAll("text")
        .style("fill", "var(--text-muted)")
        .style("font-size", "11px")
        .style("font-family", "var(--font-family)");

    svg.selectAll(".domain").attr("stroke", "rgba(255,255,255,0.1)");
    svg.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)");

    // Add Y axis labels
    svg.append("g")
        .call(d3.axisLeft(y).tickSize(0))
        .selectAll("text")
        .style("fill", "var(--text-primary)")
        .style("font-size", "13px")
        .style("font-weight", "500")
        .style("font-family", "var(--font-family)")
        .call(wrapText, margin.left - 10);

    svg.select(".domain").remove(); // Remove Y axis line

    // Add Tooltip
    let tooltip = d3.select(container).select(".compare-bar-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select(container).append("div")
            .attr("class", "compare-bar-tooltip glass-panel")
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
        .attr("x", x(0))
        .attr("y", d => y(d.category))
        .attr("width", 0) // start at 0 for animation
        .attr("height", y.bandwidth())
        .attr("fill", d => d.color || "#02D4FF")
        .attr("rx", 4) // Rounded corners
        .on("mouseover", function(event, d) {
            d3.select(this).style("filter", "brightness(1.2)");
            tooltip.transition().duration(200).style("opacity", 1);
            tooltip.html(`
                <div style="font-weight:700;color:var(--text-primary);margin-bottom:4px;">${d.category}</div>
                <div style="color:${d.color || 'var(--accent-cyan)'};font-weight:600;font-size:14px;">${formatValue(d.value)}</div>
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
            d3.select(this).style("filter", "none");
            tooltip.transition().duration(200).style("opacity", 0);
        })
        .transition()
        .duration(800)
        .ease(d3.easeCubicOut)
        .attr("width", d => x(d.value));

    // Value labels on the end of the bars
    svg.selectAll("myText")
        .data(data)
        .join("text")
        .attr("x", d => x(d.value) + 8)
        .attr("y", d => y(d.category) + y.bandwidth() / 2)
        .attr("dy", "0.35em") // center vertically
        .text(d => formatValue(d.value))
        .style("fill", "var(--text-primary)")
        .style("font-size", "12px")
        .style("font-weight", "600")
        .style("font-family", "var(--font-family)")
        .style("opacity", 0)
        .transition()
        .delay(400)
        .duration(600)
        .style("opacity", 1);
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
