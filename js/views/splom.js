import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

/**
 * Draws a Brushable Scatterplot Matrix (SPLOM)
 * @param {string} containerId - The ID of the container element
 * @param {Array} data - Array of data objects (all districts)
 * @param {Array} columns - Array of metric keys to plot against each other
 * @param {string} activeDistrictId - The GEOID of the currently selected district
 */
export function drawSplom(containerId, data, columns, activeDistrictId) {
    const container = d3.select(`#${containerId}`);
    container.selectAll("*").remove();

    if (!data || data.length === 0 || !columns || columns.length < 2) {
        container.append("div")
            .style("padding", "20px")
            .style("color", "var(--text-secondary)")
            .text("Not enough data to render Scatterplot Matrix.");
        return;
    }

    // Filter out rows where any column has NaN or -999 (missing data)
    const validData = data.filter(d => {
        return columns.every(col => {
            const val = parseFloat(d[col]);
            return !isNaN(val) && val !== -999;
        });
    });

    if (validData.length === 0) return;

    // Configuration
    const width = 800; // Increased size to accommodate 6x6 matrix nicely
    const padding = 28;
    const size = (width - (columns.length + 1) * padding) / columns.length + padding;
    
    // Define Scales
    const x = columns.map(c => d3.scaleLinear()
        .domain(d3.extent(validData, d => parseFloat(d[c])))
        .rangeRound([padding / 2, size - padding / 2]));

    const y = x.map(x => x.copy().range([size - padding / 2, padding / 2]));

    const color = d3.scaleOrdinal()
        .domain([true, false]) // true = active district, false = other districts
        .range(["#00d2ff", "rgba(59, 130, 246, 0.3)"]); // Active is cyan, inactive is soft blue

    const axisx = d3.axisBottom()
        .ticks(4)
        .tickSize(size * columns.length);
        
    const axisy = d3.axisLeft()
        .ticks(4)
        .tickSize(-size * columns.length);

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", width) // Square
        .attr("viewBox", [-padding, 0, width, width])
        .attr("style", "max-width: 100%; height: auto; font-family: Inter, sans-serif;");

    svg.append("style").text(`
        .splom-axis line { stroke: rgba(255,255,255,0.1); }
        .splom-axis path { display: none; }
        .splom-axis text { fill: var(--text-secondary); font-size: 10px; }
    `);

    // X-Axes
    const xAxis = svg.append("g")
        .attr("class", "splom-axis")
        .selectAll("g")
        .data(x)
        .join("g")
        .attr("transform", (d, i) => `translate(${i * size},0)`)
        .each(function(d) { d3.select(this).call(axisx.scale(d)); })
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)"));

    // Y-Axes
    const yAxis = svg.append("g")
        .attr("class", "splom-axis")
        .selectAll("g")
        .data(y)
        .join("g")
        .attr("transform", (d, i) => `translate(0,${i * size})`)
        .each(function(d) { d3.select(this).call(axisy.scale(d)); })
        .call(g => g.select(".domain").remove())
        .call(g => g.selectAll(".tick line").attr("stroke", "rgba(255,255,255,0.1)"));

    // Cells
    const cell = svg.append("g")
        .selectAll("g")
        .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
        .join("g")
        .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

    // Add bounding boxes for cells
    cell.append("rect")
        .attr("fill", "none")
        .attr("stroke", "rgba(255,255,255,0.2)")
        .attr("x", padding / 2 + 0.5)
        .attr("y", padding / 2 + 0.5)
        .attr("width", size - padding)
        .attr("height", size - padding);

    // Render the scatterplot dots
    cell.each(function([i, j]) {
        d3.select(this).selectAll("circle")
            .data(validData.filter(d => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])))
            .join("circle")
            .attr("cx", d => x[i](d[columns[i]]))
            .attr("cy", d => y[j](d[columns[j]]))
            .attr("r", d => d.GEOID === activeDistrictId ? 5 : 3)
            .attr("fill-opacity", d => d.GEOID === activeDistrictId ? 1 : 0.8)
            .attr("fill", d => color(d.GEOID === activeDistrictId));
    });

    // Bring active district dots to front
    cell.selectAll("circle").sort((a, b) => (a.GEOID === activeDistrictId ? 1 : 0) - (b.GEOID === activeDistrictId ? 1 : 0));

    // Cell Titles (Labels on diagonal)
    svg.append("g")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .style("fill", "#ffffff")
        .selectAll("text")
        .data(columns)
        .join("text")
        .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
        .attr("x", size / 2)
        .attr("y", size / 2)
        .attr("text-anchor", "middle")
        .attr("dominant-baseline", "middle")
        .text(d => formatColumnName(d))
        .call(wrap, size - padding); // Wrap text if it exceeds cell width

    // Brushing
    const brush = d3.brush()
        .extent([[padding / 2, padding / 2], [size - padding / 2, size - padding / 2]])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    cell.call(brush);

    let brushCell;

    function brushstarted() {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
        }
    }

    function brushed({selection}, [i, j]) {
        let selected = [];
        if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            cell.selectAll("circle").classed("hidden", d => {
                const isActive = x0 > x[i](d[columns[i]]) || x1 < x[i](d[columns[i]]) || y0 > y[j](d[columns[j]]) || y1 < y[j](d[columns[j]]);
                return isActive;
            });
        }
    }

    function brushended({selection}) {
        if (!selection) {
            brushCell = null;
            cell.selectAll("circle").classed("hidden", false);
        }
    }

    // Add hidden class style for unselected dots
    svg.append("style").text(`
        circle.hidden { fill: #000; fill-opacity: 1; r: 1px; opacity: 0.1; }
    `);
}

function formatColumnName(name) {
    return name
        .replace(/__Total__\d{4}$/, '')
        .replace(/__Total$/, '')
        .replace(/___/g, ' - ')
        .replace(/_/g, ' ');
}

// Helper to wrap text inside D3 elements
function wrap(text, width) {
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.2, // ems
            y = text.attr("y"),
            dy = 0, // removed dy fetching since it's centered
            tspan = text.text(null).append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", dy + "em");
            
        while (word = words.pop()) {
            line.push(word);
            tspan.text(line.join(" "));
            if (tspan.node().getComputedTextLength() > width && line.length > 1) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];
                tspan = text.append("tspan").attr("x", text.attr("x")).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
            }
        }
        
        // Adjust entire text block to stay vertically centered
        const totalHeight = lineNumber * lineHeight;
        if (lineNumber > 0) {
            text.selectAll("tspan").attr("dy", function(d, i) {
                return ((i - lineNumber / 2) * lineHeight) + "em";
            });
        }
    });
}
