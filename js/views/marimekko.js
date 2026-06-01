export function drawMarimekko(containerId, data, columns, title, subtitle) {
    const container = d3.select(containerId);
    container.html(""); // clear

    const width = 450;
    const height = 250;
    const margin = { top: 40, right: 20, bottom: 30, left: 40 };

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("font-family", "Inter, sans-serif");

    // Title
    svg.append("text")
        .attr("x", margin.left)
        .attr("y", 15)
        .style("fill", "#fff")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text(title);

    if (subtitle) {
        svg.append("text")
            .attr("x", margin.left)
            .attr("y", 30)
            .style("fill", "var(--text-secondary)")
            .style("font-size", "11px")
            .text(subtitle);
    }

    // Process data
    // Calculate column totals for width
    const colTotals = columns.map(col => {
        return d3.sum(data, d => d[col]);
    });

    const grandTotal = d3.sum(colTotals);

    // Calculate cumulative X positions
    let currentX = 0;
    const xOffsets = columns.map(col => {
        const total = d3.sum(data, d => d[col]);
        const share = total / grandTotal;
        const widthPx = share * (width - margin.left - margin.right);
        const offset = currentX;
        currentX += widthPx + 2; // 2px gap
        return { col, offset, widthPx, total };
    });

    // Scales
    const y = d3.scaleLinear()
        .domain([0, 1]) // Stacked to 100%
        .range([height - margin.bottom, margin.top]);

    const color = d3.scaleOrdinal()
        .domain(data.map(d => d.group))
        .range(["#fc7d68", "#fcdbc1", "#fadb14", "#02D4FF", "#535C68"]);

    // Stack the data
    // D3's stack generator works row by row. But our data is:
    // { group: "Apple", Grocery: 299, Online: 64 } -> wait, columns are columns
    // We need an array where each item is a column, and it has group properties.
    
    // Transform data:
    /*
      [
        { column: "Banana", Grocery: 318.9, Online: 63.5, total: 382.4 },
        ...
      ]
    */
    const transformedData = columns.map(col => {
        const obj = { column: col };
        let total = 0;
        data.forEach(d => {
            obj[d.group] = d[col];
            total += d[col];
        });
        obj.total = total;
        return obj;
    });

    // Normalize values to percentages
    transformedData.forEach(d => {
        data.forEach(groupRow => {
            d[groupRow.group + "_pct"] = d[groupRow.group] / d.total;
        });
    });

    const stack = d3.stack()
        .keys(data.map(d => d.group + "_pct"));
    
    const series = stack(transformedData);

    const g = svg.append("g")
        .attr("transform", `translate(${margin.left}, 0)`);

    // Draw bars
    const groupLayers = g.selectAll("g")
        .data(series)
        .join("g")
        .attr("fill", d => color(d.key.replace("_pct", "")));

    groupLayers.selectAll("rect")
        .data(d => d)
        .join("rect")
        .attr("x", (d, i) => xOffsets[i].offset)
        .attr("y", d => y(d[1]))
        .attr("height", d => y(d[0]) - y(d[1]))
        .attr("width", (d, i) => xOffsets[i].widthPx)
        .attr("stroke", "none");

    // Draw X axis labels
    g.selectAll(".x-axis-label")
        .data(xOffsets)
        .join("text")
        .attr("class", "x-axis-label")
        .attr("x", d => d.offset + (d.widthPx / 2))
        .attr("y", height - margin.bottom + 15)
        .style("text-anchor", "middle")
        .style("fill", "#fff")
        .style("font-size", "11px")
        .text(d => d.col);
        
    // Draw Legend
    const legendOffset = 15;
    const legend = svg.append("g")
        .attr("transform", `translate(${width - margin.right - 80}, ${margin.top})`);
        
    const legendItems = legend.selectAll(".legend-item")
        .data(data.map(d => d.group))
        .join("g")
        .attr("class", "legend-item")
        .attr("transform", (d, i) => `translate(0, ${i * 15})`);
        
    legendItems.append("rect")
        .attr("width", 10)
        .attr("height", 10)
        .attr("fill", d => color(d));
        
    legendItems.append("text")
        .attr("x", 15)
        .attr("y", 8)
        .style("fill", "var(--text-secondary)")
        .style("font-size", "10px")
        .text(d => d);
}
