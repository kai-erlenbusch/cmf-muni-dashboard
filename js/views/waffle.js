export function drawWaffle(containerId, data, title, subtitle) {
    const container = d3.select(containerId);
    container.html(""); // clear

    const width = 300;
    const height = 150;
    const squareSize = 12;
    const gap = 2;
    const squaresPerRow = 10;
    const totalSquares = 100;

    const svg = container.append("svg")
        .attr("width", width)
        .attr("height", height)
        .style("font-family", "Inter, sans-serif");

    // data format: { label: "Apple", value: 45, color: "#fcdbc1" }
    // We expect the total values to sum to 100 or less
    
    let currentSquare = 0;
    let gridData = [];

    data.forEach(item => {
        const count = Math.round(item.value);
        for (let i = 0; i < count; i++) {
            if (currentSquare < totalSquares) {
                gridData.push({
                    index: currentSquare,
                    color: item.color,
                    label: item.label
                });
                currentSquare++;
            }
        }
    });

    // Fill remaining with empty squares if < 100
    while (currentSquare < totalSquares) {
        gridData.push({
            index: currentSquare,
            color: "rgba(255, 255, 255, 0.1)",
            label: "Empty"
        });
        currentSquare++;
    }

    // Title
    svg.append("text")
        .attr("x", 0)
        .attr("y", 15)
        .style("fill", "#fff")
        .style("font-size", "14px")
        .style("font-weight", "600")
        .text(title);

    if (subtitle) {
        svg.append("text")
            .attr("x", 0)
            .attr("y", 32)
            .style("fill", "var(--text-secondary)")
            .style("font-size", "11px")
            .text(subtitle);
    }

    const gridOffset = { x: 0, y: 45 };

    const cells = svg.append("g")
        .attr("transform", `translate(${gridOffset.x}, ${gridOffset.y})`)
        .selectAll("rect")
        .data(gridData)
        .join("rect")
        .attr("x", d => (d.index % squaresPerRow) * (squareSize + gap))
        .attr("y", d => Math.floor(d.index / squaresPerRow) * (squareSize + gap))
        .attr("width", squareSize)
        .attr("height", squareSize)
        .attr("fill", d => d.color)
        .attr("rx", 2)
        .attr("ry", 2);

    // Legend
    const legendOffset = { x: (squaresPerRow * (squareSize + gap)) + 20, y: 45 };
    
    const legend = svg.append("g")
        .attr("transform", `translate(${legendOffset.x}, ${legendOffset.y})`)
        .selectAll("g")
        .data(data)
        .join("g")
        .attr("transform", (d, i) => `translate(0, ${i * 30})`);

    legend.append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", d => d.color)
        .attr("rx", 2)
        .attr("ry", 2);

    legend.append("text")
        .attr("x", 20)
        .attr("y", 6)
        .attr("alignment-baseline", "middle")
        .style("fill", "#fff")
        .style("font-size", "12px")
        .text(d => d.label);
        
    legend.append("text")
        .attr("x", 20)
        .attr("y", 20)
        .attr("alignment-baseline", "middle")
        .style("fill", "var(--text-secondary)")
        .style("font-size", "11px")
        .style("font-weight", "600")
        .text(d => `${d.value}%`);
}
