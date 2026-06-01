export const tutorialSteps = [
  {
    title: "Welcome to the Congressional District Municipal Bond Explorer",
    content: `
      <div style="display: flex; gap: 30px; align-items: center;">
        <div style="flex: 1.5; text-align: center;">
          <img src="./assets/CMF_Logo.png" alt="CMF Logo" style="width: 100%; max-width: 320px; height: auto; display: block; margin: 0 auto; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.5));" />
          <div style="margin-top: 24px; text-align: left; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);">
            <label style="display: flex; align-items: center; gap: 10px; cursor: pointer; color: #fff; font-size: 13px;">
              <input type="checkbox" id="tutorial-dont-show-again" style="width: 16px; height: 16px; cursor: pointer;">
              Do not automatically show this tutorial again
            </label>
          </div>
        </div>
        <div style="flex: 2; font-size: 14px; line-height: 1.6; color: var(--text-main);">
          <p style="margin-bottom: 12px;">
            Tax-exempt municipal bonds are the primary financing tool that state and local governments use to build roads, schools, water supply systems, public and non-profit hospitals and other public infrastructure. Today there are more than $3.5 trillion in active municipal bonds from more than 50,000 individual governments.
          </p>
          <p style="margin-bottom: 12px;">
            The goal of this research is to understand how tax-exempt municipal bonds impact communities. Using a first-of-its-kind dataset, we identify the types of state and local governments that use municipal bonds, and the types of infrastructure investments financed by those bonds, across US Congressional districts. This analysis allows us to explore previously-unknown patterns of municipal bond borrowing and investments both within and across regions.
          </p>
          <p style="margin-bottom: 16px;">
            This analysis is based on data from <a href="https://www.theice.com/market-data/pricing-and-analytics/municipal-bonds" target="_blank" style="color: #02d4ff; text-decoration: underline;">ICE municipal bond reference and geospatial data</a>.
          </p>
          <p style="margin-bottom: 16px;">
            Health Data From: Department of Population Health, NYU Langone Health. <a href="https://www.congressionaldistricthealthdashboard.org/" target="_blank" style="color: #02d4ff; text-decoration: underline;">Congressional District Health Dashboard</a>. Accessed & Data Current as of: (05/21/2026)
          </p>
          <p style="margin-top: 24px; font-size: 14px; color: var(--text-muted); display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
            Use <kbd style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 3px 8px; font-family: monospace; font-style: normal; font-size: 13px; color: var(--text-main); box-shadow: 0 2px 0 rgba(0,0,0,0.3);">&rarr;</kbd> or <kbd style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 3px 8px; font-family: monospace; font-style: normal; font-size: 13px; color: var(--text-main); box-shadow: 0 2px 0 rgba(0,0,0,0.3);">Enter</kbd> to step through the tour. Press <br><kbd style="background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15); border-radius: 6px; padding: 3px 8px; font-family: monospace; font-style: normal; font-size: 13px; color: var(--text-main); box-shadow: 0 2px 0 rgba(0,0,0,0.3); margin-top: 4px;">Esc</kbd> <span style="margin-top: 4px;">to close it any time.</span>
          </p>
        </div>
      </div>
    `,
    target: null,
    onEnter: () => {
      setTimeout(() => {
        const cb = document.getElementById('tutorial-dont-show-again');
        if (cb) {
          cb.checked = localStorage.getItem('hasSeenTutorial') === 'true';
          cb.addEventListener('change', (e) => {
            if (e.target.checked) {
              localStorage.setItem('hasSeenTutorial', 'true');
            } else {
              localStorage.removeItem('hasSeenTutorial');
            }
          });
        }
      }, 50);
    }
  },
  {
    title: "Explore the Data",
    content: `
      <p style="margin-bottom: 8px;">The left sidebar allows you to explore the data using three main modes:</p>
      <ul style="margin: 0; padding-left: 20px; line-height: 1.5;">
        <li style="margin-bottom: 6px;"><strong>Bonds:</strong> Visualize Municipal Bond metrics and filter by Use of Proceeds across the map.</li>
        <li style="margin-bottom: 6px;"><strong>Health:</strong> Explore health outcomes, socioeconomic factors, and environmental metrics.</li>
        <li><strong>Compare:</strong> Enter a split-screen view to visualize geographic correlations side-by-side or using a swipe slider.</li>
      </ul>
    `,
    target: null,
    targetBoxes: () => {
      const topEl = document.querySelector('.segmented-control');
      const bottomEl = document.querySelector('#proceeds-category');
      if (topEl && bottomEl) {
        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        return [{
          top: topRect.top - 8,
          left: topRect.left - 16,
          right: topRect.right + 16,
          bottom: bottomRect.bottom + 8,
          width: topRect.width + 32,
          height: bottomRect.bottom - topRect.top + 16
        }];
      }
      return null;
    },
    onEnter: () => {}
  },
  {
    title: "State and District Overview",
    content: "When you click 'Details' or select a district, this side panel opens. It shows you the full list of all districts and the National Average for the selected metric. Let's look closer at New York.",
    target: null,
    targetBoxes: () => {
      const topEl = document.querySelector('.details-category');
      const stateGroups = document.querySelectorAll('.state-group');
      let bottomEl = null;
      for (let group of stateGroups) {
        if (group.textContent.includes('New York')) {
          bottomEl = group;
          break;
        }
      }
      if (topEl && bottomEl) {
        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        return [{
          top: topRect.top - 8,
          left: topRect.left - 16,
          right: topRect.right + 16,
          bottom: bottomRect.bottom + 8,
          width: topRect.width + 32,
          height: bottomRect.bottom - topRect.top + 16
        }];
      }
      return null;
    },
    onEnter: () => {
      const detailsSidebar = document.getElementById('details-sidebar');
      if (detailsSidebar) {
        detailsSidebar.classList.remove('hidden');
      }
    }
  },
  {
    title: "Deep Dive into Districts",
    content: "Selecting a specific district gives you a detailed breakdown. First, you can expand a state to reveal its individual congressional districts.",
    target: null,
    targetBoxes: () => {
      const stateGroups = document.querySelectorAll('.state-group');
      for (let group of stateGroups) {
        if (group.textContent.includes('New York')) {
          const districts = group.querySelectorAll('.district-item');
          for (let dist of districts) {
            if (dist.textContent.includes('New York 12th')) {
              const rect = dist.getBoundingClientRect();
              return [{
                top: rect.top - 4,
                left: rect.left - 4,
                right: rect.right + 4,
                bottom: rect.bottom + 4,
                width: rect.width + 8,
                height: rect.height + 8
              }];
            }
          }
        }
      }
      return null;
    },
    onEnter: () => {
      const detailsSidebar = document.getElementById('details-sidebar');
      if (detailsSidebar) {
        detailsSidebar.classList.remove('hidden');
      }
      const stateGroups = document.querySelectorAll('.state-group');
      for (let group of stateGroups) {
        if (group.textContent.includes('New York')) {
          const header = group.querySelector('.state-header');
          if (header && !header.classList.contains('expanded')) {
            header.click(); 
          }
          break;
        }
      }
    }
  },
  {
    title: "District Specifics",
    content: `
      <p style="margin-bottom: 12px;">Notice the map has zoomed to the New York City area. In the right panel, you can use the <strong>'Top Issuers'</strong> and <strong>'Use of Proceeds'</strong> buttons to see exactly who is borrowing and what the funds are being used for in this specific district.</p>
      <p style="margin-bottom: 12px;">The tooltip also provides quick links to view <strong>District Insights</strong>, <strong>Charts & Diagrams</strong>, and a downloadable <strong>District Factsheet</strong>.</p>
      <p style="margin-top: 16px; font-size: 11px; color: var(--text-muted); line-height: 1.4;">
        Municipal Bond Data From: <a href="https://munifinance.uchicago.edu/" target="_blank" style="color: #02d4ff; text-decoration: underline;">Center for Municipal Finance at the UChicago</a>, provided by <a href="https://www.theice.com/market-data/pricing-and-analytics/municipal-bonds" target="_blank" style="color: #02d4ff; text-decoration: underline;">Intercontinental Exchange, Inc. (ICE)</a>.
      </p>
    `,
    modalPosition: { top: 'auto', bottom: '40px', left: '40px', right: 'auto', transform: 'none' },
    target: null,
    targetBoxes: () => {
      let boxes = [];
      const leftSidebar = document.getElementById('sidebar-left');
      const detailsSidebar = document.getElementById('details-sidebar');
      const topNav = document.querySelector('.top-nav');
      
      const leftX = leftSidebar ? leftSidebar.getBoundingClientRect().right : 0;
      const rightX = detailsSidebar ? detailsSidebar.getBoundingClientRect().left : window.innerWidth;
      const topY = topNav ? topNav.getBoundingClientRect().bottom : 0;
      
      const mapCenterX = leftX + (rightX - leftX) / 2;
      const mapCenterY = topY + (window.innerHeight - topY) / 2;


      const popup = document.getElementById('map-tooltip');
      if (popup && popup.style.display !== 'none' && popup.style.opacity !== '0') {
        const r = popup.getBoundingClientRect();
        boxes.push({
          top: r.top - 8,
          left: r.left - 8,
          right: r.right + 8,
          bottom: r.bottom + 8,
          width: r.width + 16,
          height: r.height + 16,
          borderColor: 'transparent'
        });
      }
      return boxes.length > 0 ? boxes : null;
    },
    onEnter: () => {
      const searchInput = document.getElementById('district-search');
      if (searchInput) {
        searchInput.value = 'New York 12th';
        searchInput.dispatchEvent(new Event('input'));
        document.dispatchEvent(new CustomEvent('tutorial-fly-to', { detail: { district: 'New York 12th', geoid: '3612' } }));
      }
      setTimeout(() => {
        if (window.toggleInspectorSection) {
          window.toggleInspectorSection('issuers');
        }
      }, 100);
    }
  },
  {
    title: "Back to Overview",
    content: "You can click this 'Back to Overview' button anytime to close the details view, deselect the current district, and return to the national map overview.",
    target: "#back-to-overview-btn",
    onEnter: () => {
      const detailsSidebar = document.getElementById('details-sidebar');
      if (detailsSidebar && detailsSidebar.classList.contains('hidden')) {
        const searchInput = document.getElementById('district-search');
        if (searchInput) {
          searchInput.value = 'New York 12th';
          searchInput.dispatchEvent(new Event('input'));
          document.dispatchEvent(new CustomEvent('tutorial-fly-to', { detail: { district: 'New York 12th', geoid: '3612' } }));
        }
      }
    }
  },
  {
    title: "Multiple Perspectives",
    content: "Use the top navigation tabs to switch between the interactive Map, Scatter Plot Charts, and analytical Insights.",
    target: ".top-nav",
    onEnter: () => {
      const detailsSidebar = document.getElementById('details-sidebar');
      if (detailsSidebar) detailsSidebar.classList.add('hidden');
      document.dispatchEvent(new CustomEvent('tutorial-reset-map'));
    }
  }
];

let currentStep = 0;
let overlayEl;
let highlightEls = [];
let modalEl;

let isTutorialInitialized = false;

export function initTutorial() {
  if (isTutorialInitialized) return;
  isTutorialInitialized = true;
  
  const hasSeen = localStorage.getItem('hasSeenTutorial');
  if (!hasSeen) {
    setTimeout(startTutorial, 1000);
  }
}

// Module-level event listener (bound exactly once)
document.addEventListener('keydown', (e) => {
  if (!overlayEl) return;
  if (['ArrowRight', 'Enter', 'ArrowLeft', 'Escape'].includes(e.key)) {
    e.preventDefault();
  }
});

document.addEventListener('keyup', (e) => {
  if (!overlayEl) return;
  
  if (e.key === 'ArrowRight' || e.key === 'Enter') {
    nextStep();
  } else if (e.key === 'ArrowLeft') {
    prevStep();
  } else if (e.key === 'Escape') {
    closeTutorial();
  }
});

export function startTutorial() {
  currentStep = 0;
  
  if (!overlayEl) {
    createTutorialDOM();
  }
  
  document.body.classList.add('tutorial-active');
  let styleEl = document.getElementById('tutorial-dynamic-styles');
  if (!styleEl) {
    styleEl = document.createElement('style');
    styleEl.id = 'tutorial-dynamic-styles';
    styleEl.innerHTML = `
      body.tutorial-active #map-tooltip {
        z-index: 9999 !important;
      }
    `;
    document.head.appendChild(styleEl);
  }
  
  // Observe DOM for map popups to update the mask dynamically
  if (window.tutorialPopupObserver) window.tutorialPopupObserver.disconnect();
  const mapTooltip = document.getElementById('map-tooltip');
  if (mapTooltip) {
    window.tutorialPopupObserver = new MutationObserver((mutations) => {
      let shouldUpdate = false;
      for (const m of mutations) {
        if (m.type === 'attributes' && (m.attributeName === 'style' || m.attributeName === 'class')) {
          shouldUpdate = true;
        }
      }
      if (shouldUpdate) window.dispatchEvent(new Event('resize'));
    });
    window.tutorialPopupObserver.observe(mapTooltip, { attributes: true });
  }
  
  renderStep();
}

function createTutorialDOM() {
  overlayEl = document.createElement('div');
  overlayEl.className = 'tutorial-overlay-clip';
  overlayEl.style.position = 'fixed';
  overlayEl.style.top = '0';
  overlayEl.style.left = '0';
  overlayEl.style.width = '100%';
  overlayEl.style.height = '100%';
  overlayEl.style.background = 'rgba(0,0,0,0.7)';
  overlayEl.style.zIndex = '9998';
  overlayEl.style.pointerEvents = 'auto';
  overlayEl.style.transition = 'clip-path 0.3s ease';
  document.body.appendChild(overlayEl);

  modalEl = document.createElement('div');
  modalEl.className = 'tutorial-modal glass-panel';
  document.body.appendChild(modalEl);
  
  window.addEventListener('resize', updateHighlightPos);
}

function updateHighlightPos() {
  if (!overlayEl || currentStep >= tutorialSteps.length) return;
  const step = tutorialSteps[currentStep];
  
  highlightEls.forEach(el => el.remove());
  highlightEls = [];

  let rects = [];
  if (step.targetBoxes) {
    const res = step.targetBoxes();
    if (res) rects = res;
  } else if (step.target) {
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      const elRect = targetEl.getBoundingClientRect();
      rects = [{
        top: elRect.top - 8,
        left: elRect.left - 8,
        right: elRect.right + 8,
        bottom: elRect.bottom + 8,
        width: elRect.width + 16,
        height: elRect.height + 16
      }];
    }
  }

  if (rects.length > 0) {
    let polygon = '0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%';
    
    rects.forEach(rect => {
      const hEl = document.createElement('div');
      hEl.className = 'tutorial-highlight';
      hEl.style.display = 'block';
      hEl.style.top = rect.top + 'px';
      hEl.style.left = rect.left + 'px';
      hEl.style.width = rect.width + 'px';
      hEl.style.height = rect.height + 'px';
      if (rect.isCircle) hEl.style.borderRadius = '50%';
      if (rect.borderColor) hEl.style.borderColor = rect.borderColor;
      document.body.appendChild(hEl);
      highlightEls.push(hEl);

      if (rect.isCircle) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const rx = rect.width / 2;
        const ry = rect.height / 2;
        
        polygon += `, ${cx + rx}px ${cy}px`;
        for (let angle = 0; angle >= -360; angle -= 10) {
          const rad = angle * (Math.PI / 180);
          const x = cx + rx * Math.cos(rad);
          const y = cy + ry * Math.sin(rad);
          polygon += `, ${x.toFixed(1)}px ${y.toFixed(1)}px`;
        }
        polygon += `, ${cx + rx}px ${cy}px, 0% 0%`;
      } else {
        polygon += `, ${rect.left}px ${rect.top}px, ${rect.left}px ${rect.bottom}px, ${rect.right}px ${rect.bottom}px, ${rect.right}px ${rect.top}px, ${rect.left}px ${rect.top}px, 0% 0%`;
      }
    });

    overlayEl.style.clipPath = `polygon(${polygon})`;
    overlayEl.style.webkitClipPath = `polygon(${polygon})`;

    const mainRect = rects[rects.length - 1]; // Use last rect (usually right sidebar) for modal pos
    const ww = window.innerWidth;
    modalEl.style.width = '400px';
    
    if (step.modalPosition) {
      modalEl.style.top = step.modalPosition.top || 'auto';
      modalEl.style.bottom = step.modalPosition.bottom || 'auto';
      modalEl.style.left = step.modalPosition.left || 'auto';
      modalEl.style.right = step.modalPosition.right || 'auto';
      modalEl.style.transform = step.modalPosition.transform || 'none';
    } else {
      modalEl.style.bottom = 'auto';
      modalEl.style.right = 'auto';
      modalEl.style.top = Math.max(20, mainRect.top + 20) + 'px';
      if (mainRect.left > 440) {
        modalEl.style.left = mainRect.left - 420 + 'px';
        modalEl.style.transform = 'none';
      } else if (mainRect.right + 420 < ww) {
        modalEl.style.left = mainRect.right + 20 + 'px';
        modalEl.style.transform = 'none';
      } else {
        modalEl.style.top = '50%';
        modalEl.style.left = '50%';
        modalEl.style.transform = 'translate(-50%, -50%)';
      }
    }
  } else {
    overlayEl.style.clipPath = 'none';
    overlayEl.style.webkitClipPath = 'none';

    if (currentStep === 0) {
      modalEl.style.width = '800px';
    } else {
      modalEl.style.width = '400px';
    }
    modalEl.style.bottom = 'auto';
    modalEl.style.right = 'auto';
    modalEl.style.top = '50%';
    modalEl.style.left = '50%';
    modalEl.style.transform = 'translate(-50%, -50%)';
  }
}

function renderStep() {
  if (currentStep < 0) currentStep = 0;
  if (currentStep >= tutorialSteps.length) {
    closeTutorial();
    return;
  }

  const step = tutorialSteps[currentStep];
  
  if (step.onEnter) {
    step.onEnter();
  }

  setTimeout(() => {
    updateHighlightPos();
  }, 450);

  let dotsHTML = '';
  for (let i = 0; i < tutorialSteps.length; i++) {
    dotsHTML += `<div class="tutorial-dot ${i === currentStep ? 'active' : ''}"></div>`;
  }

  modalEl.innerHTML = `
    <button class="tutorial-close">&times;</button>
    <div class="tutorial-step-info" style="color: #e86c4a; font-size: 10px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 8px;">${currentStep === 0 ? 'INTRO' : 'STEP ' + currentStep + ' / ' + (tutorialSteps.length - 1)}</div>
    <h3 class="tutorial-title" style="margin-bottom: 15px; font-family: serif; font-size: 22px; font-weight: 400; color: #fff;">${step.title}</h3>
    <div class="tutorial-content" style="color: #ccc; line-height: 1.5; font-size: 14px; margin-bottom: 20px;">${step.content}</div>
    <div class="tutorial-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: auto; padding-top: 15px;">
      <div class="tutorial-dots" style="display: flex; gap: 6px;">${dotsHTML}</div>
      <div class="tutorial-actions" style="display: flex; gap: 10px;">
        ${currentStep > 0 ? '<button class="tutorial-btn-back" style="background: none; border: none; color: #aaa; font-size: 11px; cursor: pointer; letter-spacing: 1px;">BACK</button>' : ''}
        <button class="tutorial-btn-next" style="background: #e86c4a; color: #000; border: none; padding: 6px 16px; border-radius: 4px; font-size: 11px; font-weight: 700; cursor: pointer; letter-spacing: 1px;">${currentStep === tutorialSteps.length - 1 ? 'FINISH' : 'NEXT &rarr;'}</button>
      </div>
    </div>
  `;

  modalEl.querySelector('.tutorial-close').addEventListener('click', closeTutorial);
  if (currentStep > 0) {
    modalEl.querySelector('.tutorial-btn-back').addEventListener('click', prevStep);
  }
  modalEl.querySelector('.tutorial-btn-next').addEventListener('click', nextStep);
}

function nextStep() {
  currentStep++;
  renderStep();
}

function prevStep() {
  currentStep--;
  renderStep();
}

function closeTutorial() {
  if (overlayEl) overlayEl.style.display = 'none';
  if (modalEl) modalEl.style.display = 'none';
  highlightEls.forEach(el => el.remove());
  highlightEls = [];
  
  document.body.classList.remove('tutorial-active');
  const styleEl = document.getElementById('tutorial-dynamic-styles');
  if (styleEl) styleEl.remove();
  
  if (window.tutorialPopupObserver) {
    window.tutorialPopupObserver.disconnect();
    window.tutorialPopupObserver = null;
  }
  
  document.dispatchEvent(new CustomEvent('tutorial-closed'));
  
  overlayEl = null;
  modalEl = null;
  window.removeEventListener('resize', updateHighlightPos);
  
  // reset app state
  const detailsSidebar = document.getElementById('details-sidebar');
  if (detailsSidebar) detailsSidebar.classList.add('hidden');
  
  const searchInput = document.getElementById('district-search');
  if (searchInput) {
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));
  }
  
  const searchResults = document.getElementById('search-results');
  if (searchResults) {
    searchResults.classList.add('hidden');
  }
  
  if (window.toggleInspectorSection) {
    window.toggleInspectorSection(null);
  }
  
  document.dispatchEvent(new CustomEvent('tutorial-reset-map'));
}
