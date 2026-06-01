import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.2.0/+esm';
import { state } from '../state.js';
import { getColorsForMetric } from '../utils/colors.js';
import { renderMuniInspector, formatMetricValue, toggleCompareDropdown } from './details.js';
import { getFactsheetUrl } from '../factsheet_urls.js';

let map, mapAlaska, mapHawaii, mapCompare;
let mapboxCompareControl = null;
const maps = [];
window.clickPopup = null;
window.goToInsightsFromPopup = function(mode) {
    if (mode === 'bonds') {
        state.setActiveBondMetric(state.activeMetric);
    } else if (mode === 'esg') {
        state.setActiveHealthMetric(state.activeMetric);
    }
    const insightsBtn = document.querySelector('.nav-btn[data-mode="insights"]');
    if (insightsBtn) insightsBtn.click();
    if (window.clickPopup) window.clickPopup.remove();
};
const mapStyle = {
      "version": 8,
      "sources": {
        "basemap": {
          "type": "raster",
          "tiles": ["https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"],
          "tileSize": 256
        },
        "muni": {
          "type": "vector",
          "url": "pmtiles://./data/muni_health.pmtiles?v=" + Date.now(),
          "promoteId": "GEOID"
        }
      },
      "layers": [
        {
          "id": "basemap-layer",
          "type": "raster",
          "source": "basemap"
        },
        {
          "id": "districts-fill",
          "type": "fill",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "fill-color": ["coalesce", ["feature-state", "color"], "#2a2a2a"],
            "fill-opacity": 1
          }
        },
        {
          "id": "districts-line",
          "type": "line",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "line-color": "#ffffff",
            "line-width": [
              'interpolate', ['linear'], ['zoom'],
              3, 0.2,
              6, 0.8,
              10, 2
            ],
            "line-opacity": [
              'interpolate', ['linear'], ['zoom'],
              3, 0.15,
              6, 0.4,
              10, 0.8
            ]
          }
        },
        {
          "id": "districts-hover-fill",
          "type": "fill",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "fill-color": "#ffffff",
            "fill-opacity": [
              "case",
              ["all",
                ["boolean", ["feature-state", "hover"], false],
                ["!", ["boolean", ["feature-state", "selected"], false]]
              ],
              0.25,
              0
            ]
          }
        },
        {
          "id": "districts-selected-fill",
          "type": "fill",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "fill-color": "#ffffff",
            "fill-opacity": ["case", ["boolean", ["feature-state", "selected"], false], 0, 0]
          }
        },
        {
          "id": "districts-hover-line",
          "type": "line",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "line-color": "#ffffff",
            "line-width": ["case", ["boolean", ["feature-state", "hover"], false], 2, 0]
          }
        },
        {
          "id": "districts-selected-line",
          "type": "line",
          "source": "muni",
          "source-layer": "muni_health",
          "paint": {
            "line-color": "#ffffff",
            "line-width": ["case", ["boolean", ["feature-state", "selected"], false], 3, 0]
          }
        }
      ]
    };

let districtBBoxes = null;
let hoveredStateId = null;

export function initMap() {
  fetch('./data/bboxes.json')
    .then(r => r.json())
    .then(data => { districtBBoxes = data; })
    .catch(e => console.error("Failed to load bboxes:", e));

  let protocol = new pmtiles.Protocol();
  maplibregl.addProtocol("pmtiles", protocol.tile);

  map = new maplibregl.Map({
    container: 'map',
    style: mapStyle,
    center: [-98.5, 39.8],
    zoom: 3.5
  });

  map.addControl(new maplibregl.NavigationControl({showCompass: false}), 'bottom-right');

  mapAlaska = new maplibregl.Map({
    container: 'map-alaska',
    style: mapStyle,
    center: [-151.5, 64.5],
    zoom: 0.8,
    interactive: true,
    attributionControl: false
  });

  mapHawaii = new maplibregl.Map({
    container: 'map-hawaii',
    style: mapStyle,
    center: [-156.5, 20.5],
    zoom: 4,
    interactive: true,
    attributionControl: false
  });

  maps.push(map, mapAlaska, mapHawaii);

  // Smoothly handle map resizing (prevents jarring flashes during sidebar transitions)
  let lastContainerWidth = 0;
  const resizeObserver = new ResizeObserver(() => {
    const container = document.getElementById('map-container');
    if (!container) return;
    const newWidth = container.offsetWidth;
    if (newWidth === lastContainerWidth) return; // Prevent spurious resize events that abort zoom
    lastContainerWidth = newWidth;
    
    resizeMap();
    if (state.compareMode && typeof mapboxCompareControl !== 'undefined' && mapboxCompareControl) {
      mapboxCompareControl.setSlider(newWidth / 2);
    }
  });
  resizeObserver.observe(document.getElementById('map-container'));

  maps.forEach(m => m.on('load', () => updateMap()));

  maps.forEach(m => attachMapEvents(m));
}

let hoveredFeatureId = null;


function getPinnedTooltipHTML(distName, metricLabel, hoverValText, closeId, linkId, linkText, isClickable) {
  const linkColor = isClickable ? 'var(--accent-cyan)' : 'var(--text-secondary)';
  const linkCursor = isClickable ? 'pointer' : 'default';
  const linkEvents = isClickable ? 'auto' : 'none';
  const textDecor = isClickable ? 'underline' : 'none';
  
  const titleHtml = `
    <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
      <span>${distName}</span>
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="color: ${linkColor}; display: flex; align-items: center; transform: rotate(45deg);" title="Pinned to district">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12" fill="currentColor"><path d="M32 32C32 14.3 46.3 0 64 0h256c17.7 0 32 14.3 32 32s-14.3 32-32 32H294.5l-21.4 171.4c-2.1 16.8-10.7 31.9-23.7 41.5L208 304.2V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V304.2L102.6 276.9c-13-9.7-21.6-24.8-23.7-41.5L57.5 64H32C14.3 64 32 49.7 32 32z"/></svg>
        </span>
        <span id="${closeId}" class="glass-tooltip-container" style="cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; transition: color 0.2s;">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
          <span class="glass-tooltip">Close popup</span>
        </span>
      </div>
    </div>
  `;
  const contentHtml = `
    <div>${metricLabel}: ${hoverValText}</div>
    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
      <a href="#" id="${linkId}" style="color: ${linkColor}; text-decoration: ${textDecor}; font-weight: 600; font-size: 13px; cursor: ${linkCursor}; pointer-events: ${linkEvents};">${linkText}</a>
    </div>
  `;
  return { titleHtml, contentHtml };
}


  export function updateSbsTooltips() {
      const tooltip = document.getElementById('map-tooltip');
      const tooltipTitle = document.getElementById('tooltip-title');
      const tooltipContent = document.getElementById('tooltip-content');
      const tooltipCompare = document.getElementById('map-tooltip-compare');
      const tooltipTitleCompare = document.getElementById('tooltip-title-compare');
      const tooltipContentCompare = document.getElementById('tooltip-content-compare');

      if (!tooltip || !tooltipCompare) return;

      const bothSelected = state.selectedDistrictLeft && state.selectedDistrictRight;
      const linkText = bothSelected ? 'View District Insights' : 'Select another district';

      // Left Map
      if (!state.selectedDistrictLeft) {
          tooltip.style.pointerEvents = 'none';
          tooltip.style.display = 'none';
      } else {
          const districtName = state.selectedDistrictLeft;
          const props = state.metricsData.find(d => d.District_Name === districtName) || { District_Name: districtName };
          const dataField = state.getCompareField('left');
          const metricLabel = state.compareLeftMetric.replace(/_/g, ' ');
          const val = props[dataField];
          const hoverValText = val !== undefined && val !== null && val !== -999 ? formatMetricValue(val, dataField, { isHover: true }) : 'N/A';
          
          const html = getPinnedTooltipHTML(districtName, metricLabel, hoverValText, 'close-btn-left', 'insights-link-left', linkText, bothSelected);
          tooltipTitle.innerHTML = html.titleHtml;
          tooltipContent.innerHTML = html.contentHtml;
          
          tooltip.style.pointerEvents = 'auto';
          tooltip.style.display = 'block';
          tooltip.style.left = '25%';
          tooltip.style.top = '60%';
          tooltip.style.transform = 'translate(-50%, -50%)';
          
          const closeBtn = document.getElementById('close-btn-left');
          if (closeBtn) closeBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const backBtn = document.getElementById('back-to-overview-btn');
              if (backBtn) backBtn.click();
          });
          
          if (bothSelected) {
              const link = document.getElementById('insights-link-left');
              if (link) link.addEventListener('click', (ev) => {
                  ev.preventDefault();
                  state.setInsightsLeftDistrict(state.selectedDistrictLeft);
                  state.setInsightsRightDistrict(state.selectedDistrictRight);
                  if (state.compareLeftMetric) {
                      state.activeInsightsLeftTab = state.compareLeftMetric.toLowerCase().includes('proceeds') ? 'Use of Proceeds' : 'Bond Metrics';
                      if (state.activeInsightsLeftTab === 'Bond Metrics') {
                          state.activeBondMetric = state.compareLeftMetric;
                      }
                  }
                  if (state.compareRightMetric) {
                      state.activeInsightsRightTab = 'All Metrics';
                      state.activeHealthMetric = state.compareRightMetric;
                  }
                  const insightsBtn = document.querySelector('.tab-btn[data-tab="insights"]');
                  if (insightsBtn) insightsBtn.click();
              });
          }
      }

      // Right Map
      if (!state.selectedDistrictRight) {
          tooltipCompare.style.pointerEvents = 'none';
          tooltipCompare.style.display = 'none';
      } else {
          const districtName = state.selectedDistrictRight;
          const props = state.metricsData.find(d => d.District_Name === districtName) || { District_Name: districtName };
          const dataField = state.getCompareField('right');
          const metricLabel = state.compareRightMetric.replace(/_/g, ' ');
          const val = props[dataField];
          const hoverValText = val !== undefined && val !== null && val !== -999 ? formatMetricValue(val, dataField, { isHover: true }) : 'N/A';
          
          const html = getPinnedTooltipHTML(districtName, metricLabel, hoverValText, 'close-btn-right', 'insights-link-right', linkText, bothSelected);
          tooltipTitleCompare.innerHTML = html.titleHtml;
          tooltipContentCompare.innerHTML = html.contentHtml;
          
          tooltipCompare.style.pointerEvents = 'auto';
          tooltipCompare.style.display = 'block';
          tooltipCompare.style.left = '75%';
          tooltipCompare.style.top = '60%';
          tooltipCompare.style.transform = 'translate(-50%, -50%)';
          
          const closeBtn = document.getElementById('close-btn-right');
          if (closeBtn) closeBtn.addEventListener('click', (ev) => {
              ev.stopPropagation();
              const backBtn = document.getElementById('back-to-overview-btn');
              if (backBtn) backBtn.click();
          });
          
          if (bothSelected) {
              const link = document.getElementById('insights-link-right');
              if (link) link.addEventListener('click', (ev) => {
                  ev.preventDefault();
                  state.setInsightsLeftDistrict(state.selectedDistrictLeft);
                  state.setInsightsRightDistrict(state.selectedDistrictRight);
                  if (state.compareLeftMetric) {
                      state.activeInsightsLeftTab = state.compareLeftMetric.toLowerCase().includes('proceeds') ? 'Use of Proceeds' : 'Bond Metrics';
                      if (state.activeInsightsLeftTab === 'Bond Metrics') {
                          state.activeBondMetric = state.compareLeftMetric;
                      }
                  }
                  if (state.compareRightMetric) {
                      state.activeInsightsRightTab = 'All Metrics';
                      state.activeHealthMetric = state.compareRightMetric;
                  }
                  const insightsBtn = document.querySelector('.tab-btn[data-tab="insights"]');
                  if (insightsBtn) insightsBtn.click();
              });
          }
      }
      
      if (bothSelected) {
          toggleCompareDropdown('left', true);
          toggleCompareDropdown('right', true);
      }
  }

function attachMapEvents(m) {
  const tooltip = document.getElementById('map-tooltip');
  const tooltipTitle = document.getElementById('tooltip-title');
  const tooltipContent = document.getElementById('tooltip-content');

  m.on('mousemove', 'districts-fill', (e) => {
    const isSwipe = state.compareMode && state.compareViewType === 'swipe';
    if ((!state.compareMode || isSwipe) && state.selectedDistrict) return;
    
    const isSbs = (state.compareMode && state.compareViewType === 'sbs');
    if (isSbs && m === map && state.selectedDistrictLeft) return;
    if (isSbs && m === mapCompare && state.selectedDistrictRight) return;
    
    if (e.features.length > 0) {
      const feature = e.features[0];
      const props = feature.properties;
      const featureId = feature.id;
      const distName = props.District_Name;
      let dataField = state.getActiveDataField();
      let metricLabel = state.activeMetric.replace(/_/g, ' ');

      if (state.compareMode) {
        const side = (m === mapCompare) ? 'right' : 'left';
        dataField = state.getCompareField(side);
        metricLabel = side === 'left' 
          ? state.compareLeftMetric.replace(/_/g, ' ') 
          : state.compareRightMetric.replace(/_/g, ' ');
      } else {
        const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
        const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
        if (activeBtn) metricLabel = activeBtn.innerText;
        else if (activeOption) metricLabel = activeOption.innerText;
      }
      
      let val = props[dataField];
      const dist = distName || props.GEOID;
      
      if (val === undefined && distName) {
        const districtData = state.metricsData.find(d => d.District_Name === distName);
        if (districtData) {
          val = districtData[dataField];
        }
      }
      
      if (featureId !== m._hoveredFeatureId) {
        if (m._hoveredFeatureId !== null && m._hoveredFeatureId !== undefined) {
          if (isSbs) {
            m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: false });
          } else {
            maps.forEach(mapInstance => {
              if (mapInstance && mapInstance.getSource('muni')) mapInstance.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: false });
            });
          }
        }
        m._hoveredFeatureId = featureId;
        if (isSbs) {
          m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: true });
        } else {
          maps.forEach(mapInstance => {
            if (mapInstance && mapInstance.getSource('muni')) mapInstance.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: true });
          });
        }
      }

      let t = tooltip;
      let tTitle = tooltipTitle;
      let tContent = tooltipContent;

      if (isSbs && m === mapCompare) {
        t = document.getElementById('map-tooltip-compare');
        tTitle = document.getElementById('tooltip-title-compare');
        tContent = document.getElementById('tooltip-content-compare');
      }

      tTitle.innerText = dist;
      let hoverValText = val !== undefined && val !== null && val !== -999 ? formatMetricValue(val, dataField, { isHover: true }) : 'N/A';
      tContent.innerHTML = `${metricLabel}: ${hoverValText}`;
      const rect = document.getElementById('map-container').getBoundingClientRect();
      const mouseX = e.originalEvent.clientX - rect.left;
      const mouseY = e.originalEvent.clientY - rect.top;
      if (state.compareMode && m === map) {
        t.style.left = (mouseX - 15) + 'px';
        t.style.transform = 'translateX(-100%)';
      } else {
        if (mouseX > rect.width - 700) {
          t.style.left = (mouseX - 15) + 'px';
          t.style.transform = 'translateX(-100%)';
        } else {
          t.style.left = (mouseX + 15) + 'px';
          t.style.transform = 'none';
        }
      }
      if (mouseY > rect.height - 150) {
        t.style.top = (mouseY - 70) + 'px';
      } else {
        t.style.top = (mouseY + 15) + 'px';
      }
      
      t.classList.remove('hidden');
      t.style.display = 'block';
    }
  });
  
  m.on('mouseleave', 'districts-fill', () => {
    const isSwipe = state.compareMode && state.compareViewType === 'swipe';
    if ((!state.compareMode || isSwipe) && state.selectedDistrict) return;
    
    const isSbs = (state.compareMode && state.compareViewType === 'sbs');
    if (isSbs && m === map && state.selectedDistrictLeft) return;
    if (isSbs && m === mapCompare && state.selectedDistrictRight) return;

    if (m._hoveredFeatureId !== null) {
      if (isSbs) {
        m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: false });
      } else {
        maps.forEach(mm => {
          if (mm && mm.getSource('muni')) mm.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: false });
        });
      }
    }
    m._hoveredFeatureId = null;
    
    let t = tooltip;
    if (isSbs && m === mapCompare) {
      t = document.getElementById('map-tooltip-compare');
    }
    if (t) {
      t.classList.add('hidden');
      t.style.display = 'none';
    }
  });
  
  m.on('zoom', (e) => {
    if (!e.originalEvent) return;
    
    // Only process zoom out unselection for the map that actually received the user event
    const container = m.getContainer();
    if (!container.contains(e.originalEvent.target)) return;
    
    const isSbs = state.compareMode && state.compareViewType === 'sbs';
    
    if (isSbs) {
        if (m === map && state.selectedDistrictLeft && m.getZoom() < 6.0) {
            state.setSelectedDistrictLeft(null);
            if (typeof highlightSelected === 'function') highlightSelected();
            if (typeof updateSbsTooltips === 'function') updateSbsTooltips();
        } else if (m === mapCompare && state.selectedDistrictRight && m.getZoom() < 6.0) {
            state.setSelectedDistrictRight(null);
            if (typeof highlightSelected === 'function') highlightSelected();
            if (typeof updateSbsTooltips === 'function') updateSbsTooltips();
        }
        return;
    }
    
    if (state.selectedDistrict && m.getZoom() < 6.0) {
      state.setSelectedDistrict(null);
      if (typeof highlightSelected === 'function') highlightSelected(null);
      
      if (tooltip) {
        tooltip.style.transition = 'opacity 0.4s ease';
        tooltip.style.opacity = '0';
        tooltip.style.pointerEvents = 'none';
        setTimeout(() => {
          tooltip.style.display = 'none';
          tooltip.style.opacity = '1';
          tooltip.style.transition = '';
        }, 400);
      }
      const tooltipCompare = document.getElementById('map-tooltip-compare');
      if (tooltipCompare) {
        tooltipCompare.style.transition = 'opacity 0.4s ease';
        tooltipCompare.style.opacity = '0';
        tooltipCompare.style.pointerEvents = 'none';
        setTimeout(() => {
          tooltipCompare.style.display = 'none';
          tooltipCompare.style.opacity = '1';
          tooltipCompare.style.transition = '';
        }, 400);
      }
      if (!state.compareMode) {
        const distView = document.getElementById('district-view');
        const overView = document.getElementById('overview-view');
        if (distView && !distView.classList.contains('hidden')) {
          distView.style.transition = 'opacity 0.4s ease';
          distView.style.opacity = '0';
          setTimeout(() => {
            distView.classList.add('hidden');
            distView.style.opacity = '1';
            distView.style.transition = '';
            if (overView) {
              overView.style.opacity = '0';
              overView.classList.remove('hidden');
              void overView.offsetWidth;
              overView.style.transition = 'opacity 0.4s ease';
              overView.style.opacity = '1';
              setTimeout(() => {
                overView.style.transition = '';
              }, 400);
            }
          }, 400);
        }
      } else {
        const detailsSidebar = document.getElementById('details-sidebar');
        if (detailsSidebar && !detailsSidebar.classList.contains('hidden')) {
            detailsSidebar.style.transition = 'opacity 0.4s ease';
            detailsSidebar.style.opacity = '0';
            setTimeout(() => {
              detailsSidebar.classList.add('hidden');
              detailsSidebar.style.opacity = '1';
              detailsSidebar.style.transition = '';
            }, 400);
        }
      }
    }
  });

  m.on('click', 'districts-fill', (e) => {
    if (e.features.length > 0) {
      if (!state.compareMode) {
        document.getElementById('details-sidebar').classList.remove('hidden');
      } else {
        document.getElementById('details-sidebar').classList.add('hidden');
      }
      const leftSidebar = document.getElementById('sidebar-left');
      let willCollapse = false;
      const isSbs = (state.compareMode && state.compareViewType === 'sbs');
      
      let props = e.features[0].properties;
      const featureId = e.features[0].id;



      if (props.District_Name) {
        const districtData = state.metricsData.find(d => d.District_Name === props.District_Name);
        if (districtData) {
          props = { ...props, ...districtData };
        }
      }
      
      if (typeof renderMuniInspector === 'function') renderMuniInspector(props);
      const districtName = props.District_Name;
          
      if (isSbs) {
          const isLeft = (m === map);
          if (isLeft) {
              state.setSelectedDistrictLeft((state.selectedDistrictLeft === districtName) ? null : districtName);
          } else {
              state.setSelectedDistrictRight((state.selectedDistrictRight === districtName) ? null : districtName);
          }
          
          if (leftSidebar && state.selectedDistrictLeft && state.selectedDistrictRight && !leftSidebar.classList.contains('collapsed')) {
              willCollapse = true;
          }
          
          updateSbsTooltips();
          
          const bothSelected = state.selectedDistrictLeft && state.selectedDistrictRight;
          if (typeof highlightSelected === 'function') highlightSelected();
      } else {
          state.setSelectedDistrict(districtName);
          const tooltip = document.getElementById('map-tooltip');
          const tooltipTitle = document.getElementById('tooltip-title');
          const tooltipContent = document.getElementById('tooltip-content');
          
          if (window.clickPopup) window.clickPopup.remove();
          
          if (leftSidebar && state.compareMode && !leftSidebar.classList.contains('collapsed')) {
              willCollapse = true;
          }
          
          const isSwipe = state.compareMode && state.compareViewType === 'swipe';
          
          if ((!state.compareMode || isSwipe) && tooltip && tooltipTitle && tooltipContent) {
              const tooltipCompare = document.getElementById('map-tooltip-compare');
              const tooltipTitleCompare = document.getElementById('tooltip-title-compare');
              const tooltipContentCompare = document.getElementById('tooltip-content-compare');

              if (!state.selectedDistrict) {
                  // User unselected the district
                  tooltip.style.pointerEvents = 'none';
                  tooltip.style.display = 'none';
                  if (tooltipCompare) {
                      tooltipCompare.style.pointerEvents = 'none';
                      tooltipCompare.style.display = 'none';
                  }
              } else {
                  // User selected the district
                  const districtNameForLabel = districtName || props.GEOID;
                  
                  const getTooltipHTML = (distName, metricLabel, hoverValText, closeId, linkId) => {
                      const titleHtml = `
                        <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                          <span>${distName}</span>
                          <div style="display: flex; align-items: center; gap: 10px;">
                            <span style="color: var(--accent-cyan); display: flex; align-items: center; transform: rotate(45deg);" title="Pinned to district">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12" fill="currentColor"><path d="M32 32C32 14.3 46.3 0 64 0h256c17.7 0 32 14.3 32 32s-14.3 32-32 32H294.5l-21.4 171.4c-2.1 16.8-10.7 31.9-23.7 41.5L208 304.2V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V304.2L102.6 276.9c-13-9.7-21.6-24.8-23.7-41.5L57.5 64H32C14.3 64 32 49.7 32 32z"/></svg>
                            </span>
                            <span id="${closeId}" class="glass-tooltip-container" style="cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; transition: color 0.2s;">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                              <span class="glass-tooltip">Close popup</span>
                            </span>
                          </div>
                        </div>
                      `;
                      let downloadLinkHtml = '';
                      const isHealthMode = document.getElementById('mode-esg') && document.getElementById('mode-esg').checked;
                      if (!isHealthMode && distName) {
                        const factsheetUrl = getFactsheetUrl(distName);
                        if (factsheetUrl && factsheetUrl !== '#') {
                          downloadLinkHtml = `
                            <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                              <a href="${factsheetUrl}" target="_blank" style="color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; font-size: 11px; pointer-events: auto; display: flex; align-items: center; gap: 4px; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                                Download District Factsheet
                              </a>
                            </div>
                          `;
                        }
                      }
                      const chartsLinkHtml = state.compareMode ? '' : `
                        <div style="margin-top: 4px;">
                          <a href="#" id="${linkId}-charts" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View Charts & Diagrams</a>
                        </div>
                      `;
                      const contentHtml = `
                        <div>${metricLabel}: ${hoverValText}</div>
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                          <a href="#" id="${linkId}" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View District Insights</a>
                        </div>
                        ${chartsLinkHtml}
                        ${downloadLinkHtml}
                      `;
                      return { titleHtml, contentHtml };
                  };
                  
                  // Setup left tooltip
                  let leftDataField = state.compareMode ? state.getCompareField('left') : state.getActiveDataField();
                  let leftMetricLabel = state.compareMode ? state.compareLeftMetric.replace(/_/g, ' ') : state.activeMetric.replace(/_/g, ' ');
                  if (!state.compareMode) {
                      const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
                      const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
                      if (activeBtn) leftMetricLabel = activeBtn.innerText;
                      else if (activeOption) leftMetricLabel = activeOption.innerText;
                  }
                  
                  let leftVal = props[leftDataField];
                  if (leftVal === undefined && districtName) {
                    const districtData = state.metricsData.find(d => d.District_Name === districtName);
                    if (districtData) leftVal = districtData[leftDataField];
                  }
                  let leftHoverValText = leftVal !== undefined && leftVal !== null && leftVal !== -999 ? formatMetricValue(leftVal, leftDataField, { isHover: true }) : 'N/A';
                  
                  const leftHtml = getTooltipHTML(districtNameForLabel, leftMetricLabel, leftHoverValText, 'tooltip-close-btn', 'insights-link');
                  tooltipTitle.innerHTML = leftHtml.titleHtml;
                  tooltipContent.innerHTML = leftHtml.contentHtml;
                  
                  // Setup right tooltip if swipe mode
                  if (isSwipe && tooltipCompare && tooltipTitleCompare && tooltipContentCompare) {
                      let rightDataField = state.getCompareField('right');
                      let rightMetricLabel = state.compareRightMetric.replace(/_/g, ' ');
                      let rightVal = props[rightDataField];
                      if (rightVal === undefined && districtName) {
                        const districtData = state.metricsData.find(d => d.District_Name === districtName);
                        if (districtData) rightVal = districtData[rightDataField];
                      }
                      let rightHoverValText = rightVal !== undefined && rightVal !== null && rightVal !== -999 ? formatMetricValue(rightVal, rightDataField, { isHover: true }) : 'N/A';
                      
                      const rightHtml = getTooltipHTML(districtNameForLabel, rightMetricLabel, rightHoverValText, 'tooltip-close-btn-compare', 'insights-link-compare');
                      tooltipTitleCompare.innerHTML = rightHtml.titleHtml;
                      tooltipContentCompare.innerHTML = rightHtml.contentHtml;
                  }
                  
                  // Add click listener to close buttons
                  setTimeout(() => {
                    const setupCloseBtn = (id, targetTooltip) => {
                        const closeBtn = document.getElementById(id);
                        if (closeBtn && targetTooltip) {
                          closeBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation(); 
                            const backBtn = document.getElementById('back-to-overview-btn');
                            if (backBtn) backBtn.click();
                          });
                          closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--text-primary)');
                          closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--text-secondary)');
                        }
                    };
                    setupCloseBtn('tooltip-close-btn', tooltip);
                    if (isSwipe) setupCloseBtn('tooltip-close-btn-compare', tooltipCompare);
                  }, 0);
                  
                  tooltip.style.pointerEvents = 'auto';
                  tooltip.style.display = 'block';
                  if (isSwipe && tooltipCompare) {
                      tooltipCompare.style.pointerEvents = 'auto';
                      tooltipCompare.style.display = 'block';
                  }

                  const rect = document.getElementById('map-container').getBoundingClientRect();
                  const mouseX = e.originalEvent.clientX - rect.left;
                  const mouseY = e.originalEvent.clientY - rect.top;
                  
                  if (isSwipe) {
                      tooltip.style.left = '30%';
                      tooltip.style.top = '60%';
                      tooltip.style.transform = 'translate(-50%, -50%)';
                      if (tooltipCompare) {
                          tooltipCompare.style.left = '60%';
                          tooltipCompare.style.top = '60%';
                          tooltipCompare.style.transform = 'translate(-50%, -50%)';
                      }
                  } else {
                      let tLeft = mouseX + 15;
                      let tTop = mouseY + 15;
                      let xTrans = '0';
                      let yTrans = '0';
                      if (mouseX > rect.width - 700) {
                          tLeft = mouseX - 15;
                          xTrans = '-100%';
                      }
                      if (mouseY > rect.height - 150) {
                          tTop = mouseY - 15;
                          yTrans = '-100%';
                      }
                      tooltip.style.left = `${tLeft}px`;
                      tooltip.style.top = `${tTop}px`;
                      if (xTrans === '0' && yTrans === '0') {
                          tooltip.style.transform = 'none';
                      } else {
                          tooltip.style.transform = `translate(${xTrans}, ${yTrans})`;
                      }
                  }
                  
                  const setupInsightsLink = (id) => {
                      const link = document.getElementById(id);
                      if (link) {
                        link.addEventListener('click', (ev) => {
                          ev.preventDefault();
                          ev.stopPropagation(); 
                          const modeRadios = document.querySelector('input[name="sidebar-mode"]:checked');
                          const currentMode = modeRadios ? modeRadios.value : 'bonds';
                          
                          if (currentMode === 'bonds') {
                              state.insightsLeftDistrict = districtName;
                              const proceedsContent = document.getElementById('inspector-content-proceeds');
                              const isProceedsOpen = proceedsContent && !proceedsContent.classList.contains('hidden');
                              state.activeInsightsLeftTab = isProceedsOpen ? 'Use of Proceeds' : 'Bond Metrics';
                              if (state.activeInsightsLeftTab === 'Bond Metrics') {
                                  state.activeBondMetric = state.activeMetric;
                              }
                          } else if (currentMode === 'esg') {
                              state.insightsRightDistrict = districtName;
                              state.activeInsightsRightTab = 'All Metrics';
                              state.activeHealthMetric = state.activeMetric;
                          } else if (currentMode === 'compare') {
                              state.insightsLeftDistrict = districtName;
                              state.insightsRightDistrict = districtName;
                              if (state.compareLeftMetric) {
                                  state.activeInsightsLeftTab = state.compareLeftMetric.toLowerCase().includes('proceeds') ? 'Use of Proceeds' : 'Bond Metrics';
                                  if (state.activeInsightsLeftTab === 'Bond Metrics') {
                                      state.activeBondMetric = state.compareLeftMetric;
                                  }
                              }
                              if (state.compareRightMetric) {
                                  state.activeInsightsRightTab = 'All Metrics';
                                  state.activeHealthMetric = state.compareRightMetric;
                              }
                          }
                          
                          const insightsBtn = document.querySelector('.tab-btn[data-tab="insights"]');
                          if (insightsBtn) insightsBtn.click();
                          
                          state.setSelectedDistrict(null);
                          if (typeof highlightSelected === 'function') highlightSelected(null);
                          tooltip.style.pointerEvents = 'none';
                          tooltip.style.display = 'none';
                          if (tooltipCompare) {
                              tooltipCompare.style.pointerEvents = 'none';
                              tooltipCompare.style.display = 'none';
                          }
                        });
                      }
                  };
                  
                  const setupChartsLink = (id) => {
                      const link = document.getElementById(id);
                      if (link) {
                        link.addEventListener('click', (ev) => {
                          ev.preventDefault();
                          ev.stopPropagation();
                          
                          state.setSelectedDistrict(districtName);
                          const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
                          if (chartsBtn) chartsBtn.click();
                          
                          tooltip.style.pointerEvents = 'none';
                          tooltip.style.display = 'none';
                          if (tooltipCompare) {
                              tooltipCompare.style.pointerEvents = 'none';
                              tooltipCompare.style.display = 'none';
                          }
                        });
                      }
                  };
                  
                  setupInsightsLink('insights-link');
                  setupChartsLink('insights-link-charts');
                  if (isSwipe) {
                      setupInsightsLink('insights-link-compare');
                      setupChartsLink('insights-link-compare-charts');
                  }
              }
          }
      }
      
      highlightSelected();

      const isCurrentlySelected = isSbs ? (m === map ? state.selectedDistrictLeft : state.selectedDistrictRight) : state.selectedDistrict;
      if (!isCurrentlySelected) return;

      // Clone feature to prevent Mapbox from garbage-collecting it before the timeout
      const featureToFit = {
        geometry: e.features[0].geometry,
        properties: { ...props }
      };

      if (willCollapse) {
        // Trigger the smooth CSS transition
        leftSidebar.classList.add('collapsed');
        
        // Wait for the CSS transition to finish before zooming.
        // The ResizeObserver will automatically call resizeMap() during the transition, preventing flashes.
        // We use transitionend to guarantee no resize events fire during the 1.2s camera animation.
        leftSidebar.addEventListener('transitionend', function handler(e) {
          if (e.propertyName === 'margin-left') {
            leftSidebar.removeEventListener('transitionend', handler);
            resizeMap();
            setTimeout(() => {
              fitFeatureBounds(featureToFit, m);
              if (m === mapAlaska || m === mapHawaii) {
                fitFeatureBounds(featureToFit, map);
              }
            }, 50);
          }
        });
      } else {
        fitFeatureBounds(featureToFit, m);
        if (m === mapAlaska || m === mapHawaii) {
          fitFeatureBounds(featureToFit, map);
        }
      }
    }
  });
}

export function updateMap() {
  if (!state.metricsData || state.metricsData.length === 0) return;

  if (state.compareMode) {
    updateCompareMaps();
    return;
  }

  const metricField = state.getActiveDataField();
  const extent = state.getMetricExtent(metricField);
  const colors = getColorsForMetric(metricField);
  
  state.metricsData.forEach(d => {
    if (d.GEOID !== undefined) {
      const color = colors[d.GEOID] || "#2a2a2a";
      maps.forEach(m => {
        if (!m || !m.getLayer('districts-fill')) return;
        m.setFeatureState(
          { source: 'muni', sourceLayer: 'muni_health', id: d.GEOID },
          { color: color }
        );
      });
    }
  });
}

export function resizeMap() {
  maps.forEach(m => { if(m) m.resize(); });
}

export function resetMapView() {
  if (mapAlaska) mapAlaska.flyTo({ center: [-151.5, 64.5], zoom: 0.8 });
  if (mapHawaii) mapHawaii.flyTo({ center: [-156.5, 20.5], zoom: 4 });
  if (map) {
    const isRightOpen = !document.getElementById('details-sidebar').classList.contains('hidden');
    map.fitBounds(
      [[-125, 24], [-66, 50]],
      { padding: { top: 20, bottom: 20, left: 20, right: isRightOpen ? 380 : 20 }, duration: 1200 }
    );
  }
  if (state.compareMode && state.compareViewType === 'sbs' && mapCompare) {
    mapCompare.fitBounds(
      [[-125, 24], [-66, 50]],
      { padding: { top: 20, bottom: 20, left: 20, right: 20 }, duration: 1200 }
    );
  }
  
  // Clear district selection highlight on the map
  highlightSelected();
  
  // Hide any pinned tooltips
  const tooltip = document.getElementById('map-tooltip');
  if (tooltip) {
      tooltip.style.display = 'none';
      tooltip.style.pointerEvents = 'none';
  }
  const tooltipCompare = document.getElementById('map-tooltip-compare');
  if (tooltipCompare) {
      tooltipCompare.style.display = 'none';
      tooltipCompare.style.pointerEvents = 'none';
  }
}

export function flyToDistrict(geoid, showSidebar = true) {
  if (!map) return;
  
  const targetId = Number(geoid);
  
  // Query rendered features first (very fast, covers visible area)
  let features = map.queryRenderedFeatures({ layers: ['districts-fill'] })
    .filter(f => Number(f.properties.GEOID) === targetId);
    
  // Fallback to source features if not found on screen
  if (features.length === 0) {
    features = map.querySourceFeatures('muni', { sourceLayer: 'muni_health' })
      .filter(f => Number(f.properties.GEOID) === targetId);
  }
  
  if (features && features.length > 0) {
    if (showSidebar) {
      document.getElementById('details-sidebar').classList.remove('hidden');
    }
    
    let props = features[0].properties;
    if (props.District_Name) {
      const districtData = state.metricsData.find(d => d.District_Name === props.District_Name);
      if (districtData) {
        props = { ...props, ...districtData };
      }
    }
    
    renderMuniInspector(props);
    fitFeatureBounds(features[0]);
    const districtName = props.District_Name;
    state.setSelectedDistrict(districtName);
    highlightSelected(districtName);
    
    // Trigger map click to open tooltip
    setTimeout(() => {
        if (districtBBoxes && districtBBoxes[geoid]) {
            const bbox = districtBBoxes[geoid].bounds;
            const centerLng = (bbox[0] + bbox[2]) / 2;
            const centerLat = (bbox[1] + bbox[3]) / 2;
            const pt = map.project([centerLng, centerLat]);
            
            const tooltip = document.getElementById('map-tooltip');
            const tooltipTitle = document.getElementById('tooltip-title');
            const tooltipContent = document.getElementById('tooltip-content');
            
            if (tooltip && tooltipTitle && tooltipContent) {
                const districtNameForLabel = props.District_Name || props.GEOID;
                
                let dataField = state.getActiveDataField();
                let metricLabel = state.activeMetric.replace(/_/g, ' ');
                const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
                const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
                if (activeBtn) metricLabel = activeBtn.innerText;
                else if (activeOption) metricLabel = activeOption.innerText;
                
                let val = props[dataField];
                
                let hoverValText = val !== undefined && val !== null && val !== -999 ? formatMetricValue(val, dataField, { isHover: true }) : 'N/A';
                
                const titleHtml = `
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span>${districtNameForLabel}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: var(--accent-cyan); display: flex; align-items: center; transform: rotate(45deg);" title="Pinned to district">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12" fill="currentColor"><path d="M32 32C32 14.3 46.3 0 64 0h256c17.7 0 32 14.3 32 32s-14.3 32-32 32H294.5l-21.4 171.4c-2.1 16.8-10.7 31.9-23.7 41.5L208 304.2V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V304.2L102.6 276.9c-13-9.7-21.6-24.8-23.7-41.5L57.5 64H32C14.3 64 32 49.7 32 32z"/></svg>
                      </span>
                      <span id="tooltip-close-btn" class="glass-tooltip-container" style="cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; transition: color 0.2s;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                        <span class="glass-tooltip">Close popup</span>
                      </span>
                    </div>
                  </div>
                `;
                
                let downloadLinkHtml = '';
                const isHealthMode = document.getElementById('mode-esg') && document.getElementById('mode-esg').checked;
                if (!isHealthMode && districtNameForLabel) {
                    const factsheetUrl = getFactsheetUrl(districtNameForLabel);
                    if (factsheetUrl && factsheetUrl !== '#') {
                        downloadLinkHtml = `
                          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                            <a href="${factsheetUrl}" target="_blank" style="color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; font-size: 11px; pointer-events: auto; display: flex; align-items: center; gap: 4px; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Download District Factsheet
                            </a>
                          </div>
                        `;
                    }
                }
                
                const chartsLinkHtml = state.compareMode ? '' : `
                  <div style="margin-top: 4px;">
                    <a href="#" id="insights-link-charts" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View Charts & Diagrams</a>
                  </div>
                `;
                const contentHtml = `
                  <div>${metricLabel}: ${hoverValText}</div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                    <a href="#" id="insights-link" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View District Insights</a>
                  </div>
                  ${chartsLinkHtml}
                  ${downloadLinkHtml}
                `;
                
                tooltipTitle.innerHTML = titleHtml;
                tooltipContent.innerHTML = contentHtml;
                
                // Add click listener to close button
                setTimeout(() => {
                    const closeBtn = document.getElementById('tooltip-close-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const backBtn = document.getElementById('back-to-overview-btn');
                            if (backBtn) backBtn.click();
                        });
                        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--text-primary)');
                        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--text-secondary)');
                    }
                    
                    const insightsLink = document.getElementById('insights-link');
                    if (insightsLink) {
                        insightsLink.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const insightsBtn = document.querySelector('.tab-btn[data-tab="insights"]');
                            if (insightsBtn) insightsBtn.click();
                            tooltip.style.pointerEvents = 'none';
                            tooltip.style.display = 'none';
                        });
                    }
                    
                    const chartsLink = document.getElementById('insights-link-charts');
                    if (chartsLink) {
                        chartsLink.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
                            if (chartsBtn) chartsBtn.click();
                            tooltip.style.pointerEvents = 'none';
                            tooltip.style.display = 'none';
                        });
                    }
                }, 0);
                
                tooltip.style.left = (pt.x + 15) + 'px';
                tooltip.style.top = (pt.y + 15) + 'px';
                tooltip.style.pointerEvents = 'auto';
                tooltip.style.display = 'block';
                tooltip.style.opacity = '1';
                if (window.clickPopup) window.clickPopup.remove();
            }
        }
    }, 1300);
  } else {
    if (districtBBoxes && districtBBoxes[geoid]) {
      const bbox = districtBBoxes[geoid].bounds;
      map.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: { top: 50, bottom: 50, left: 50, right: 400 }, maxZoom: 8, duration: 1200 }
      );
      
      const distData = state.metricsData.find(d => Number(d.GEOID) === targetId);
      if (distData) {
        document.getElementById('details-sidebar').classList.remove('hidden');
        renderMuniInspector(distData);
        state.setSelectedDistrict(distData.District_Name);
        highlightSelected(distData.District_Name);
        
        // Trigger map click to open tooltip
        setTimeout(() => {
            const centerLng = (bbox[0] + bbox[2]) / 2;
            const centerLat = (bbox[1] + bbox[3]) / 2;
            const pt = map.project([centerLng, centerLat]);
            
            const tooltip = document.getElementById('map-tooltip');
            const tooltipTitle = document.getElementById('tooltip-title');
            const tooltipContent = document.getElementById('tooltip-content');
            
            if (tooltip && tooltipTitle && tooltipContent) {
                const districtNameForLabel = distData.District_Name || distData.GEOID;
                
                let dataField = state.getActiveDataField();
                let metricLabel = state.activeMetric.replace(/_/g, ' ');
                const activeBtn = document.querySelector(`.metric-btn[data-metric="${state.activeMetric}"]`);
                const activeOption = document.querySelector(`#esg-metric option[value="${state.activeMetric}"]`);
                if (activeBtn) metricLabel = activeBtn.innerText;
                else if (activeOption) metricLabel = activeOption.innerText;
                
                let val = distData[dataField];
                
                let hoverValText = val !== undefined && val !== null && val !== -999 ? formatMetricValue(val, dataField, { isHover: true }) : 'N/A';
                
                const titleHtml = `
                  <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                    <span>${districtNameForLabel}</span>
                    <div style="display: flex; align-items: center; gap: 10px;">
                      <span style="color: var(--accent-cyan); display: flex; align-items: center; transform: rotate(45deg);" title="Pinned to district">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="12" height="12" fill="currentColor"><path d="M32 32C32 14.3 46.3 0 64 0h256c17.7 0 32 14.3 32 32s-14.3 32-32 32H294.5l-21.4 171.4c-2.1 16.8-10.7 31.9-23.7 41.5L208 304.2V480c0 17.7-14.3 32-32 32s-32-14.3-32-32V304.2L102.6 276.9c-13-9.7-21.6-24.8-23.7-41.5L57.5 64H32C14.3 64 32 49.7 32 32z"/></svg>
                      </span>
                      <span id="tooltip-close-btn" class="glass-tooltip-container" style="cursor: pointer; color: var(--text-secondary); display: flex; align-items: center; transition: color 0.2s;">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width="14" height="14" fill="currentColor"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z"/></svg>
                        <span class="glass-tooltip">Close popup</span>
                      </span>
                    </div>
                  </div>
                `;
                
                let downloadLinkHtml = '';
                const isHealthMode = document.getElementById('mode-esg') && document.getElementById('mode-esg').checked;
                if (!isHealthMode && districtNameForLabel) {
                    const factsheetUrl = getFactsheetUrl(districtNameForLabel);
                    if (factsheetUrl && factsheetUrl !== '#') {
                        downloadLinkHtml = `
                          <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                            <a href="${factsheetUrl}" target="_blank" style="color: rgba(255,255,255,0.85); text-decoration: none; font-weight: 500; font-size: 11px; pointer-events: auto; display: flex; align-items: center; gap: 4px; transition: color 0.2s;" onmouseover="this.style.color='#fff'" onmouseout="this.style.color='rgba(255,255,255,0.85)'">
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                              Download District Factsheet
                            </a>
                          </div>
                        `;
                    }
                }
                
                const chartsLinkHtml = state.compareMode ? '' : `
                  <div style="margin-top: 4px;">
                    <a href="#" id="insights-link-charts" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View Charts & Diagrams</a>
                  </div>
                `;
                const contentHtml = `
                  <div>${metricLabel}: ${hoverValText}</div>
                  <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(100, 255, 218, 0.2);">
                    <a href="#" id="insights-link" style="color: var(--accent-cyan); text-decoration: none; font-weight: 600; font-size: 13px; pointer-events: auto;">View District Insights</a>
                  </div>
                  ${chartsLinkHtml}
                  ${downloadLinkHtml}
                `;
                
                tooltipTitle.innerHTML = titleHtml;
                tooltipContent.innerHTML = contentHtml;
                
                // Add click listener to close button
                setTimeout(() => {
                    const closeBtn = document.getElementById('tooltip-close-btn');
                    if (closeBtn) {
                        closeBtn.addEventListener('click', (ev) => {
                            ev.stopPropagation();
                            const backBtn = document.getElementById('back-to-overview-btn');
                            if (backBtn) backBtn.click();
                        });
                        closeBtn.addEventListener('mouseenter', () => closeBtn.style.color = 'var(--text-primary)');
                        closeBtn.addEventListener('mouseleave', () => closeBtn.style.color = 'var(--text-secondary)');
                    }
                    
                    const insightsLink = document.getElementById('insights-link');
                    if (insightsLink) {
                        insightsLink.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const insightsBtn = document.querySelector('.tab-btn[data-tab="insights"]');
                            if (insightsBtn) insightsBtn.click();
                            tooltip.style.pointerEvents = 'none';
                            tooltip.style.display = 'none';
                        });
                    }
                    
                    const chartsLink = document.getElementById('insights-link-charts');
                    if (chartsLink) {
                        chartsLink.addEventListener('click', (ev) => {
                            ev.preventDefault();
                            ev.stopPropagation();
                            const chartsBtn = document.querySelector('.tab-btn[data-tab="charts"]');
                            if (chartsBtn) chartsBtn.click();
                            tooltip.style.pointerEvents = 'none';
                            tooltip.style.display = 'none';
                        });
                    }
                }, 0);
                
                tooltip.style.left = (pt.x + 15) + 'px';
                tooltip.style.top = (pt.y + 15) + 'px';
                tooltip.style.pointerEvents = 'auto';
                tooltip.style.display = 'block';
                tooltip.style.opacity = '1';
                if (window.clickPopup) window.clickPopup.remove();
            }
        }, 1300);
      }
    } else {
      alert("District is too small to be located at this zoom level. Please manually zoom into the state first.");
    }
  }
}

export function flyToDistrictSbs(geoid, side) {
  const targetMap = side === 'left' ? map : mapCompare;
  if (!targetMap) return;
  const targetId = Number(geoid);
  
  const doFit = () => {
    if (districtBBoxes && districtBBoxes[geoid]) {
      const bbox = districtBBoxes[geoid].bounds;
      targetMap.stop();
      targetMap.fitBounds(
        [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
        { padding: { top: 50, bottom: 50, left: 50, right: 50 }, maxZoom: 8, duration: 1200 }
      );
    }
  };

  if (targetMap.isStyleLoaded && targetMap.isStyleLoaded()) {
    doFit();
  } else {
    targetMap.once('load', doFit);
  }
}

function fitFeatureBounds(feature, targetMap = map) {
  if (!targetMap || !feature) return;

  const geoid = feature.properties ? (feature.properties.GEOID || feature.properties.GEOID20) : null;
  
  let padTop = 50, padBottom = 50, padLeft = 50, padRight = 50;
  
  // If we are fitting bounds on the inset maps, they are only 110px wide!
  if (targetMap.getContainer().id === 'map-alaska' || targetMap.getContainer().id === 'map-hawaii') {
    padTop = 5; padBottom = 5; padLeft = 5; padRight = 5;
  } else if (state.compareMode) {
    // In compare mode, we want the district to be centered in the entire screen
    // so the slider can be used to compare its left and right sides.
    padLeft = 50;
    padRight = 50;
  } else {
    // If sidebar is collapsed in national view, right pad can be smaller, but 400 is safe for right details panel
    const rightDetails = document.getElementById('details-sidebar');
    padRight = (rightDetails && !rightDetails.classList.contains('hidden')) ? 400 : 50;
  }

  if (geoid && districtBBoxes && districtBBoxes[geoid]) {
    let bbox = [...districtBBoxes[geoid].bounds];
    // Fix antimeridian crossing bug for Alaska that causes 358-degree wide bounding boxes
    if (geoid === "0200") {
      bbox = [-179, 51, -130, 72];
    }
    
    targetMap.fitBounds(
      [[bbox[0], bbox[1]], [bbox[2], bbox[3]]],
      { padding: { top: padTop, bottom: padBottom, left: padLeft, right: padRight }, maxZoom: 8, duration: 1200 }
    );
    return;
  }

  if (!feature.geometry) return;

  let minLng = 180, maxLng = -180, minLat = 90, maxLat = -90;
  
  const updateBounds = (coord) => {
    if (coord[0] < minLng) minLng = coord[0];
    if (coord[0] > maxLng) maxLng = coord[0];
    if (coord[1] < minLat) minLat = coord[1];
    if (coord[1] > maxLat) maxLat = coord[1];
  };

  const traverse = (coords) => {
    if (typeof coords[0] === 'number') {
      updateBounds(coords);
    } else {
      coords.forEach(traverse);
    }
  };

  traverse(feature.geometry.coordinates);

  if (minLng <= maxLng && minLat <= maxLat) {
    if (geoid === "0200" || (feature.properties && feature.properties.District_Name === "Alaska 0th")) {
      minLng = -179;
      maxLng = -130;
      minLat = 51;
      maxLat = 72;
    }
    
    targetMap.fitBounds(
      [[minLng, minLat], [maxLng, maxLat]],
      { padding: { top: padTop, bottom: padBottom, left: padLeft, right: padRight }, maxZoom: 8, duration: 1200 }
    );
  }
}

export function highlightSelected() {
  if (!map) return;
  
  const isSbs = (state.compareMode && state.compareViewType === 'sbs');
  
  maps.forEach(m => {
    if (!m || !m.getSource('muni')) return;
    
    // Reset specifically known features instead of blanket removal
    if (m._selectedFeatureId !== undefined && m._selectedFeatureId !== null) {
      m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._selectedFeatureId }, { selected: false });
    }
    m._selectedFeatureId = null;

    if (m._hoveredFeatureId !== undefined && m._hoveredFeatureId !== null) {
        m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._hoveredFeatureId }, { hover: false });
    }
    m._hoveredFeatureId = null;
    
    if (state.metricsData) {
        state.metricsData.forEach(d => {
            if (d.GEOID !== undefined) {
                m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: d.GEOID }, { selected: false });
                m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: d.GEOID }, { hover: false });
            }
        });
    }
    
    let targetDistrictName = null;
    if (isSbs) {
      if (m === map) targetDistrictName = state.selectedDistrictLeft;
      else if (m === mapCompare) targetDistrictName = state.selectedDistrictRight;
    } else {
      targetDistrictName = state.selectedDistrict;
    }
    
    if (targetDistrictName) {
      const districtData = state.metricsData.find(d => d.District_Name === targetDistrictName);
      if (districtData && districtData.GEOID !== undefined) {
          m._selectedFeatureId = districtData.GEOID;
          m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._selectedFeatureId }, { selected: true });
      } else {
          const features = m.querySourceFeatures('muni', {
            sourceLayer: 'muni_health',
            filter: ['==', 'District_Name', targetDistrictName]
          });
          if (features.length > 0) {
            m._selectedFeatureId = features[0].id;
            m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: m._selectedFeatureId }, { selected: true });
          }
      }
    }
  });
}

// Compare Mode Logic
export function setupCompareMode() {
  // Hide Charts tab in compare mode
  const chartsTab = document.querySelector('.tab-btn[data-tab="charts"]');
  if (chartsTab) chartsTab.style.display = 'none';
  if (!mapCompare) {
    mapCompare = new window.maplibregl.Map({
      container: 'map-compare',
      style: JSON.parse(JSON.stringify(mapStyle)),
      center: map.getCenter(),
      zoom: map.getZoom(),
      attributionControl: false
    });
    
    maps.push(mapCompare);
    attachMapEvents(mapCompare);
    
    mapCompare.addControl(new window.maplibregl.NavigationControl({showCompass: false}), 'bottom-right');
    
    mapCompare.on('load', () => {
      if (state.compareViewType === 'swipe') {
        if (!mapboxCompareControl && window.mapboxgl && window.mapboxgl.Compare) {
          mapboxCompareControl = new window.mapboxgl.Compare(map, mapCompare, '#map-container', {});
        }
      }
      updateMap();
      highlightSelected(state.selectedDistrict);
    });
    
    // Sync mapCompare with map movements manually until Compare control is ready
    map.on('move', () => {
      if (state.compareMode && state.compareViewType === 'swipe' && mapCompare && !mapboxCompareControl) {
        mapCompare.jumpTo({ center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });
      }
    });
  } else {
    if (state.compareViewType === 'swipe') {
      // Clean up any zombie compare containers
      document.querySelectorAll('.mapboxgl-compare').forEach(el => el.remove());
      
      // Delay initialization so the map container has time to reflow and become visible
      setTimeout(() => {
        if (!mapboxCompareControl && window.mapboxgl && window.mapboxgl.Compare) {
          mapboxCompareControl = new window.mapboxgl.Compare(map, mapCompare, '#map-container', {});
        }
        if (mapCompare) {
          mapCompare.jumpTo({ center: map.getCenter(), zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() });
        }
      }, 50);
    } else {
      if (mapboxCompareControl) {
        mapboxCompareControl.remove();
        mapboxCompareControl = null;
      }
      if (map && map.getContainer) {
        map.getContainer().style.clip = "";
      }
      if (mapCompare && mapCompare.getContainer) {
        mapCompare.getContainer().style.clip = "";
      }
    }
    setTimeout(() => {
      if (map) map.resize();
      if (mapCompare) mapCompare.resize();
    }, 100);
    updateMap();
    highlightSelected(state.selectedDistrict);
  }
  
  const btnContainer = document.getElementById('compare-country-view-btn-container');
  if (btnContainer) btnContainer.classList.remove('hidden');
}

export function disableCompareMode() {
  // Show Charts tab when leaving compare mode
  const chartsTab = document.querySelector('.tab-btn[data-tab="charts"]');
  if (chartsTab) chartsTab.style.display = '';
  if (mapboxCompareControl) {
    mapboxCompareControl.remove();
    mapboxCompareControl = null;
  }
  
  if (map && map.getContainer) {
    map.getContainer().style.clip = "";
  }
  if (mapCompare && mapCompare.getContainer) {
    mapCompare.getContainer().style.clip = "";
  }
  
  if (map) map.resize();
  
  const btnContainer = document.getElementById('compare-country-view-btn-container');
  if (btnContainer) btnContainer.classList.add('hidden');
  updateMap();
}

function updateCompareMaps() {
  const leftField = state.getCompareField('left');
  const rightField = state.getCompareField('right');
  
  const leftColors = getColorsForMetric(leftField);
  const rightColors = getColorsForMetric(rightField);
  
  state.metricsData.forEach(d => {
    if (d.GEOID !== undefined) {
      const geoid = d.GEOID;
      const leftColor = leftColors[geoid] || '#2a2a2a';
      const rightColor = rightColors[geoid] || '#2a2a2a';
      
      // Update main map (Left) and inset maps
      [map, mapAlaska, mapHawaii].forEach(m => {
        if (m && m.getSource('muni')) {
          m.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: geoid }, { color: leftColor });
        }
      });
      
      // Update compare map (Right)
      if (mapCompare && mapCompare.getSource('muni')) {
        mapCompare.setFeatureState({ source: 'muni', sourceLayer: 'muni_health', id: geoid }, { color: rightColor });
      }
    }
  });
}
