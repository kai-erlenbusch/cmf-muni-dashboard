import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7/+esm';

export function renderTreemap(containerId, data, page = 0) {
    const container = document.querySelector(containerId);
    if (!container) return;

    const formatCurrency = (value) => {
        if (value >= 1000) return '$' + (value / 1000).toFixed(2) + 'B';
        return '$' + value.toFixed(1) + 'M';
    };

    // Calculate total proceeds for each district
    const districtTotals = data.map(district => {
        let total = 0;
        if (district.Proceeds_Data) {
            district.Proceeds_Data.forEach(p => {
                const rawAmt = p.Amount !== undefined ? parseFloat(String(p.Amount).replace(/[\$,]/g, '')) : 0;
                total += rawAmt || 0;
            });
        }
        return { district, total };
    });
    
    // Sort by total descending
    districtTotals.sort((a, b) => b.total - a.total);
    
    // Pagination logic
    const pageSize = 10;
    const totalPages = Math.ceil(districtTotals.length / pageSize);
    if (page < 0) page = 0;
    if (page >= totalPages && totalPages > 0) page = totalPages - 1;
    
    const startIndex = page * pageSize;
    const endIndex = Math.min(startIndex + pageSize, districtTotals.length);
    const topDistricts = districtTotals.slice(startIndex, endIndex).map(item => item.district);

    // Calculate dynamic height based on the number of districts shown
    const numDistricts = topDistricts.length || 1;
    const dynamicHeight = Math.max(600, Math.min(1000, numDistricts * 70));

    const width = container.clientWidth || 1200;
    let height = dynamicHeight;
    
    // Store latest data on container so resize observer uses it instead of stale closure
    container._currentTreemapData = data;
    container._currentTreemapPage = page;

    if (!container._resizeObserver) {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                const newWidth = entry.contentRect.width;
                if (container._lastTreemapWidth && Math.abs(newWidth - container._lastTreemapWidth) > 5) {
                    if (container._resizeTimeout) clearTimeout(container._resizeTimeout);
                    container._resizeTimeout = setTimeout(() => {
                        renderTreemap(containerId, container._currentTreemapData, container._currentTreemapPage);
                    }, 50);
                }
            }
        });
        resizeObserver.observe(container);
        container._resizeObserver = resizeObserver;
    }
    container._lastTreemapWidth = width;
    
    d3.select(containerId).selectAll("*").remove();

    // Build hierarchy: State -> District -> Category
    const stateName = (data.length > 0 && data[0].District_Name) ? data[0].District_Name.replace(/\s+(\d+(st|nd|rd|th)|At-Large)$/i, '').trim() : "State Overview";
    const hierarchyData = { name: stateName, children: [] };

    // Set the main HTML title simply
    const titleElem = document.getElementById('treemap-title');
    if (titleElem) {
        titleElem.innerText = `${stateName} - Use of Proceeds Breakdown`;
    }
    
    topDistricts.forEach(district => {
        if (!district.Proceeds_Data || district.Proceeds_Data.length === 0) return;
        
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

        district.Proceeds_Data.forEach(p => {
            const cat = (p.Category || '').toUpperCase();
            const rawAmt = p.Amount !== undefined ? parseFloat(String(p.Amount).replace(/[\$,]/g, '')) : 0;
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

        const children = Object.keys(grouped)
            .filter(k => grouped[k] > 0)
            .map(k => ({ name: k, value: grouped[k] }));

        if (children.length > 0) {
            hierarchyData.children.push({
                name: district.District_Name,
                children: children
            });
        }
    });

    const categoryGradients = {
        'Healthcare & Human Services': ["#ffb6b9", "#fae3d9"],
        'Education': ["#b5eaea", "#edf6e5"],
        'Housing': ["#c6bdf8", "#f3d1f4"],
        'Utilities & Environment': ["#f9d276", "#f4b9b8"],
        'Transportation': ["#8fd9a8", "#d2e69c"],
        'Infrastructure & Public Facilities': ["#a2d5f2", "#dcf4ff"],
        'Economic & Commercial Development': ["#e8d3ff", "#f5e6fe"],
        'Recreation & Culture': ["#ffdf91", "#ffc178"],
        'Other / Unclassified': ["#d9d9d9", "#f4f4f4"]
    };

    const originalRoot = d3.hierarchy(hierarchyData)
            .sum(d => d.value ? Math.pow(d.value, 0.3) : 0)
        .sort((a, b) => b.value - a.value);

    // Render function for Treemap to recalculate layout
    function render(currentOriginalRoot) {
        if (!currentOriginalRoot) return;

        // Remove any existing pagination overlay to prevent duplicates when zooming
        d3.select(containerId).selectAll(".treemap-pagination-overlay").remove();

        // 1. Create a fresh hierarchy for the current view to prevent D3 NaN calculation bugs
        const currentData = currentOriginalRoot.data;
        const currentRoot = d3.hierarchy(currentData)
            .sum(d => d.value ? Math.pow(d.value, 0.3) : 0)
            .sort((a, b) => b.value - a.value);

        // Overlay Pagination if at Nationwide/State Root level
        if (!currentOriginalRoot.parent && totalPages > 1) {
            const controlsOverlay = d3.select(containerId).append("div")
                .attr("class", "treemap-pagination-overlay")
                .style("position", "absolute")
                .style("top", "6px")
                .style("left", "8px")
                .style("display", "flex")
                .style("align-items", "center")
                .style("gap", "8px")
                .style("z-index", "10");

            // Add the showing districts text
            controlsOverlay.append("span")
                .style("font-size", "12px")
                .style("color", "rgba(255,255,255,0.5)")
                .style("font-style", "italic")
                .style("margin-right", "8px")
                .text(`(Showing Districts ${startIndex + 1}-${endIndex} of ${districtTotals.length})`);

            // Always show the previous button
            const prevBtn = controlsOverlay.append("button")
                .text("← Previous")
                .attr("class", page > 0 ? "glass-panel btn-glowing" : "glass-panel")
                .style("padding", "3px 8px")
                .style("border", "1px solid rgba(255,255,255,0.2)")
                .style("background", "rgba(0,0,0,0.4)")
                .style("color", "var(--text-primary)")
                .style("border-radius", "4px")
                .style("font-size", "11px")
                .style("cursor", "pointer");
                
            if (page > 0) {
                prevBtn.on("mouseover", function() { d3.select(this).style("background", "rgba(255,255,255,0.15)"); })
                       .on("mouseout", function() { d3.select(this).style("background", "rgba(0,0,0,0.4)"); })
                       .on("click", (event) => { event.stopPropagation(); renderTreemap(containerId, data, page - 1); });
            }

            // Always show the next button, add btn-glowing if on valid page
            const nextBtn = controlsOverlay.append("button")
                .text("Next →")
                .attr("class", page < totalPages - 1 ? "glass-panel btn-glowing" : "glass-panel")
                .style("padding", "3px 8px")
                .style("border", "1px solid rgba(255,255,255,0.2)")
                .style("background", "rgba(0,0,0,0.4)")
                .style("color", "var(--text-primary)")
                .style("border-radius", "4px")
                .style("font-size", "11px")
                .style("cursor", "pointer");
                
            if (page < totalPages - 1) {
                nextBtn.on("mouseover", function() { d3.select(this).style("background", "rgba(255,255,255,0.15)"); })
                       .on("mouseout", function() { d3.select(this).style("background", "rgba(0,0,0,0.4)"); })
                       .on("click", (event) => { event.stopPropagation(); renderTreemap(containerId, data, page + 1); });
            }
        }

        d3.treemap()
            .tile(d3.treemapSquarify)
            .size([width, height])
            .padding(4)
            .paddingTop(d => d === currentRoot ? 35 : (d.depth === 1 ? 28 : 0))
            .paddingInner(4)
            (currentRoot);

        // Draw down to 2 levels deep from current
        const nodesToDraw = currentRoot.descendants().filter(d => d.depth <= 2);

        svg.selectAll(".treemap-layer").remove();
        const layer = svg.append("g").attr("class", "treemap-layer");

        // Tooltip
        let tooltip = d3.select("body").select(".treemap-tooltip");
        if (tooltip.empty()) {
            tooltip = d3.select("body").append("div")
                .attr("class", "treemap-tooltip glass-panel")
                .style("position", "absolute")
                .style("opacity", 0)
                .style("pointer-events", "none")
                .style("z-index", 1000)
                .style("padding", "8px 12px")
                .style("border-radius", "8px")
                .style("font-size", "12px")
                .style("font-weight", "500")
                .style("color", "#fff")
                .style("transition", "opacity 0.1s");
        }

        const node = layer.selectAll("g")
            .data(nodesToDraw)
            .join("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`)
            .style("cursor", d => (d === currentRoot && currentOriginalRoot.parent) || (d.children && d !== currentRoot) ? "pointer" : "default")
            .on("click", (event, d) => {
                event.stopPropagation();
                if (d === currentRoot && currentOriginalRoot.parent) {
                    // Zoom out to parent
                    render(currentOriginalRoot.parent);
                } else if (d.children && d !== currentRoot) {
                    // Zoom into this child
                    const originalNode = currentOriginalRoot.children.find(c => c.data.name === d.data.name);
                    if (originalNode) render(originalNode);
                } else if (!d.children && d.parent !== currentRoot) {
                    // Clicked a leaf, zoom into its parent
                    const originalNode = currentOriginalRoot.children.find(c => c.data.name === d.parent.data.name);
                    if (originalNode) render(originalNode);
                }
            });

        // Hover effects for leaves
        node.filter(d => !d.children)
            .on("mouseover", function(event, d) {
                d3.select(this).select("rect").style("fill-opacity", 1);
                tooltip.transition().duration(100).style("opacity", 1);
                const parentName = d.parent ? d.parent.data.name : "";
                tooltip.html(`<strong>${parentName}</strong><br/>${d.data.name}<br/>${formatCurrency(d.data.value || 0)}`)
                    .style("left", (event.pageX + 15) + "px")
                    .style("top", (event.pageY - 15) + "px");
            })
            .on("mousemove", function(event) {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 15) + "px");
            })
            .on("mouseout", function(event, d) {
                d3.select(this).select("rect").style("fill-opacity", 0.85);
                tooltip.transition().duration(200).style("opacity", 0);
            });

        // State Color Palette for Nationwide View
        const stateColor = d3.scaleOrdinal(d3.schemeCategory10 || ["#1f77b4","#ff7f0e","#2ca02c","#d62728","#9467bd","#8c564b","#e377c2","#7f7f7f","#bcbd22","#17becf"]);

        // Rectangles
        node.append("rect")
            .attr("id", d => (d.nodeUid = `leaf-${Math.random().toString(36).substr(2, 9)}`))
            .attr("fill", d => {
                if (!d.children) {
                    const cleanName = d.data.name.replace(/[^a-zA-Z0-9]/g, '');
                    return `url(#grad-${cleanName})`;
                }
                if (d === currentRoot && currentOriginalRoot.parent) return "rgba(255,255,255,0.02)"; // Current zoomed container
                if (d === currentRoot && !currentOriginalRoot.parent) return "transparent"; // Nationwide root
                if (d.depth === 1) return "rgba(255,255,255,0.03)"; // Districts
                return "rgba(255,255,255,0.05)"; // Sub-categories
            })
            .attr("fill-opacity", d => d.children ? 1 : 0.85)
            .attr("stroke", d => d.children ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)")
            .attr("stroke-width", d => d.children ? 1 : 1.5)
            .attr("rx", 6)
            .attr("ry", 6)
            .attr("width", d => Math.max(0, d.x1 - d.x0))
            .attr("height", d => Math.max(0, d.y1 - d.y0));

        node.append("clipPath")
            .attr("id", d => (d.clipUid = `clip-${d.nodeUid}`))
            .append("use")
            .attr("href", d => `#${d.nodeUid}`);

        // Labels for headers (Districts or State)
        node.filter(d => d.children && (d.x1 - d.x0 > 50))
            .append("text")
            .attr("clip-path", d => `url(#${d.clipUid})`)
            .attr("x", 8)
            .attr("y", d => d === currentRoot ? 20 : 20)
            .style("fill", d => d === currentRoot ? "#02D4FF" : "#ffffff")
            .style("font-weight", "bold")
            .style("font-size", d => d === currentRoot ? "14px" : "14px")
            .style("pointer-events", "none")
            .text(d => {
                if (d === currentRoot) {
                    if (currentOriginalRoot.parent) return "← Back to " + currentOriginalRoot.parent.data.name;
                    return ""; // Don't show state name at root level
                }
                return d.data.name;
            });

        // Labels for leaves (Proceeds Categories)
        node.filter(d => !d.children && (d.y1 - d.y0 > 25) && (d.x1 - d.x0 > 40)) // only draw text if space exists
            .append("text")
            .attr("clip-path", d => `url(#${d.clipUid})`)
            .selectAll("tspan")
            .data(d => {
                // If it's too small, don't show text, they can hover
                if (d.x1 - d.x0 < 60 || d.y1 - d.y0 < 30) return [formatCurrency(d.data.value || 0)];
                
                const lines = d.data.name.split(/\s+/g);
                lines.push(formatCurrency(d.data.value || 0));
                return lines;
            })
            .join("tspan")
            .attr("x", 4)
            .attr("y", (d, i, nodes) => `${(i === nodes.length - 1) ? i * 1.0 + 1.4 : i * 1.1 + 1.2}em`)
            .style("fill", "#000")
            .style("font-size", (d, i, nodes) => (i === nodes.length - 1) ? "11px" : "10px")
            .style("font-weight", (d, i, nodes) => (i === nodes.length - 1) ? "bold" : "normal")
            .style("fill-opacity", 0.8)
            .text(d => d);
            
        // Initial transition animation
        layer.style("opacity", 0)
           .transition()
           .duration(300)
           .style("opacity", 1);
    }

    const svg = d3.select(containerId).append("svg")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", "100%")
        .attr("height", "100%")
        .style("font", "12px sans-serif")
        .style("background", "transparent");

    // Add Gradients to SVG
    const defs = svg.append("defs");
    
    // Add Drop shadow filter
    const filter = defs.append("filter")
        .attr("id", "glass-shadow")
        .attr("x", "-20%")
        .attr("y", "-20%")
        .attr("width", "140%")
        .attr("height", "140%");
    filter.append("feDropShadow")
        .attr("dx", "0")
        .attr("dy", "4")
        .attr("stdDeviation", "6")
        .attr("flood-color", "#000")
        .attr("flood-opacity", "0.3");

    Object.keys(categoryGradients).forEach(key => {
        const cleanName = key.replace(/[^a-zA-Z0-9]/g, '');
        const grad = defs.append("linearGradient")
            .attr("id", `grad-${cleanName}`)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%");
            
        grad.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", categoryGradients[key][0]);
            
        grad.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", categoryGradients[key][1]);
    });

    render(originalRoot);
}
