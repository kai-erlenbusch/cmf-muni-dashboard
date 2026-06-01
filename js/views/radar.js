import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function drawRadarChart(id, data, options) {
    const cfg = {
        w: 300,
        h: 300,
        margin: { top: 40, right: 40, bottom: 40, left: 40 },
        levels: 4,
        maxValue: 1,
        labelFactor: 1.15,
        wrapWidth: 60,
        opacityArea: 0.2,
        dotRadius: 4,
        opacityCircles: 0.1,
        strokeWidth: 3,
        color: d3.scaleOrdinal().range(["#02D4FF", "#888888"]) // Cyan for District, Grey for State
    };

    if (options) {
        for (let i in options) {
            if (options[i] !== undefined) cfg[i] = options[i];
        }
    }

    const allAxis = data[0].axes.map(i => i.axis);
    const total = allAxis.length;
    const radius = Math.min(cfg.w / 2, cfg.h / 2);
    const angleSlice = Math.PI * 2 / total;

    d3.select(id).select("svg").remove();

    const svg = d3.select(id)
        .append("svg")
        .attr("width", cfg.w + cfg.margin.left + cfg.margin.right)
        .attr("height", cfg.h + cfg.margin.top + cfg.margin.bottom)
        .append("g")
        .attr("transform", "translate(" + (cfg.w / 2 + cfg.margin.left) + "," + (cfg.h / 2 + cfg.margin.top) + ")");

    // Filter out "empty" levels (for glowing effects)
    const defs = svg.append("defs");
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3.5").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    // Circular Grid
    const axisGrid = svg.append("g").attr("class", "axisWrapper");
    for (let j = 0; j < cfg.levels; j++) {
        const levelFactor = radius * ((j + 1) / cfg.levels);
        axisGrid.append("circle")
            .attr("class", "gridCircle")
            .attr("r", levelFactor)
            .style("fill", "none")
            .style("stroke", "rgba(255, 255, 255, 0.2)")
            .style("stroke-width", "0.5px");
    }

    // Axes lines
    const axis = axisGrid.selectAll(".axis")
        .data(allAxis)
        .enter()
        .append("g")
        .attr("class", "axis");

    axis.append("line")
        .attr("x1", 0)
        .attr("y1", 0)
        .attr("x2", (d, i) => radius * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y2", (d, i) => radius * Math.sin(angleSlice * i - Math.PI / 2))
        .attr("class", "line")
        .style("stroke", "rgba(255, 255, 255, 0.4)")
        .style("stroke-width", "1px")
        .style("stroke-dasharray", "2,2");

    // Axis labels
    axis.append("text")
        .attr("class", "legend")
        .style("font-size", "10px")
        .style("fill", "rgba(255,255,255,0.7)")
        .attr("text-anchor", (d, i) => {
            const angle = angleSlice * i;
            if (Math.abs(angle - 0) < 0.1 || Math.abs(angle - Math.PI) < 0.1) return "middle";
            return angle < Math.PI ? "start" : "end";
        })
        .attr("dy", (d, i) => {
            const angle = angleSlice * i;
            if (Math.abs(angle - Math.PI) < 0.1) return "0.5em"; // Bottom
            if (Math.abs(angle - 0) < 0.1) return "-1.5em"; // Top
            return "0.35em"; // Sides
        })
        .attr("x", (d, i) => radius * cfg.labelFactor * Math.cos(angleSlice * i - Math.PI / 2))
        .attr("y", (d, i) => radius * cfg.labelFactor * Math.sin(angleSlice * i - Math.PI / 2))
        .text(d => d)
        .call(wrap, cfg.wrapWidth);

    // Radar Line and Polygons
    const radarLine = d3.lineRadial()
        .angle((d, i) => i * angleSlice)
        .curve(d3.curveLinearClosed)
        .radius(d => radius * Math.max(d.value, 0)); // Ensure no negative radius

    const blobWrapper = svg.selectAll(".radarWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "radarWrapper");

    // Polygon background
    blobWrapper.append("path")
        .attr("class", "radarArea")
        .attr("d", d => radarLine(d.axes))
        .style("fill", "none");

    // Outer line
    blobWrapper.append("path")
        .attr("class", "radarStroke")
        .attr("d", d => radarLine(d.axes))
        .style("stroke-width", (d, i) => i === 0 ? "3px" : "2px")
        .style("stroke", (d, i) => cfg.color(i))
        .style("fill", "none")
        .style("stroke-dasharray", (d, i) => i === 1 ? "4,4" : "none") // State line is dashed
        .style("filter", (d, i) => i === 0 ? "url(#glow)" : "none");

    // Tooltip for radar chart
    let tooltip = d3.select("body").select(".radar-tooltip");
    if (tooltip.empty()) {
        tooltip = d3.select("body").append("div")
            .attr("class", "radar-tooltip glass-panel")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("pointer-events", "none")
            .style("z-index", 1000)
            .style("padding", "8px 12px")
            .style("border-radius", "8px")
            .style("font-size", "12px")
            .style("font-weight", "500")
            .style("color", "#fff")
            .style("transition", "opacity 0.2s ease");
    }

    // Format currency
    function formatCurrency(value) {
        if (typeof value !== 'number') return value;
        if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'B';
        return '$' + value.toFixed(1) + 'M';
    }

    // Beaded Bubbles (Nightingale Style)
    const beadsWrapper = svg.selectAll(".beadsWrapper")
        .data(data)
        .enter().append("g")
        .attr("class", "beadsWrapper");

    beadsWrapper.each(function(d, i) {
        if (i !== 0) return; // Only draw beads for the district data
        
        const g = d3.select(this);
        
        d.axes.forEach((axisData, axisIndex) => {
            const val = Math.max(axisData.value, 0);
            
            // Draw bubbles at each grid level up to the value
            for (let j = 0; j <= cfg.levels; j++) {
                const levelVal = j / cfg.levels;
                if (levelVal <= val) {
                    const beadRadius = Math.max(14 - (levelVal * 10), 4); // Larger near center, smaller outwards
                    
                    const r = radius * levelVal;
                    const cx = r * Math.cos(angleSlice * axisIndex - Math.PI / 2);
                    const cy = r * Math.sin(angleSlice * axisIndex - Math.PI / 2);
                    
                    g.append("circle")
                        .attr("cx", cx)
                        .attr("cy", cy)
                        .attr("r", beadRadius)
                        .style("fill", cfg.color(0))
                        .style("fill-opacity", 0.35)
                        .style("stroke", cfg.color(0))
                        .style("stroke-width", "0.5px")
                        .style("stroke-opacity", 0.6);
                }
            }
            
            // Ensure there is always a bubble exactly at the data point
            const exactR = radius * val;
            const exactCx = exactR * Math.cos(angleSlice * axisIndex - Math.PI / 2);
            const exactCy = exactR * Math.sin(angleSlice * axisIndex - Math.PI / 2);
            g.append("circle")
                .attr("class", "exact-bead")
                .attr("cx", exactCx)
                .attr("cy", exactCy)
                .attr("r", Math.max(14 - (val * 10), 6)) // Slightly larger minimum for the exact point to make clicking/hovering easier
                .style("fill", cfg.color(0))
                .style("fill-opacity", 0.8)
                .style("stroke", "#fff")
                .style("stroke-width", "1px")
                .style("cursor", "pointer")
                .style("filter", "url(#glow)")
                .on("mouseover", function(event) {
                    d3.select(this).style("fill-opacity", 1).attr("r", Math.max(14 - (val * 10), 6) + 3);
                    tooltip.transition().duration(200).style("opacity", 1);
                    
                    let valDisplay = axisData.rawValue;
                    // If it's Proceeds Data, we know it's in millions and should be formatted as currency
                    if (id === '#radar-proceeds' && typeof axisData.rawValue === 'number') {
                        valDisplay = formatCurrency(axisData.rawValue);
                    } else if (id === '#radar-bonds') {
                        if (axisData.formatKey === 'Total_Inv_Value' || axisData.formatKey === 'Sub_State_Inv_Value' || axisData.formatKey === 'Sub_State_Sav_Value') {
                            valDisplay = formatCurrency(axisData.rawValue);
                        } else if (axisData.formatKey === 'Small_Borrowers_Pct') {
                            valDisplay = axisData.rawValue.toFixed(1) + '%';
                        } else {
                            valDisplay = Math.round(axisData.rawValue).toLocaleString();
                        }
                    } else if (id === '#radar-health' || id === '#radar-economic') {
                        valDisplay = Math.round(axisData.value * 100) + 'th percentile';
                    }
                    
                    tooltip.html(`<strong>${axisData.axis}</strong><br/>${valDisplay}`)
                        .style("left", (event.pageX + 15) + "px")
                        .style("top", (event.pageY - 15) + "px");
                })
                .on("mousemove", function(event) {
                    tooltip.style("left", (event.pageX + 15) + "px")
                           .style("top", (event.pageY - 15) + "px");
                })
                .on("mouseout", function() {
                    d3.select(this).style("fill-opacity", 0.8).attr("r", Math.max(14 - (val * 10), 6));
                    tooltip.transition().duration(500).style("opacity", 0);
                });
        });
    });



    // Wrap helper
    function wrap(text, width) {
        text.each(function () {
            const text = d3.select(this),
                words = text.text().split(/\s+/).reverse();
            let word,
                line = [],
                lineNumber = 0,
                lineHeight = 1.4, // ems
                y = text.attr("y"),
                x = text.attr("x"),
                dy = parseFloat(text.attr("dy")),
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
