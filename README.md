# Congressional District Municipal Bond Explorer

The Congressional District Municipal Bond Explorer is an interactive web application that provides insights into municipal bond data across the United States. Designed for researchers, policymakers, and the public, the application allows users to visually explore investment totals, demographics, and key health indicators at the congressional district level.

This project was built for the **Center for Municipal Finance** at the University of Chicago.

## Purpose & Methodology

The primary goal of this application is to bridge the gap between financial investment data and public health/demographic outcomes. By aggregating data at the congressional district level, the dashboard allows users to identify spatial relationships between municipal bond investments and community health indicators.

**Methodology:**
- **Data Aggregation:** Municipal bond transactions (provided by ICE) were mapped to their respective congressional districts and aggregated to calculate total investment values and top issuers.
- **Health Data Integration:** Public health metrics (such as Life Expectancy) were sourced from the Congressional District Health Dashboard (CDHD) and joined with the financial data using unique district identifiers.
- **Serverless Architecture:** To ensure high performance without a dedicated backend server, spatial data was converted into the **PMTiles** format. This allows the MapLibre frontend to fetch only the necessary vector data via HTTP Range Requests.

## Features

- **Interactive Map:** Explore the US by Congressional Districts using a highly optimized MapLibre GL JS vector tile map (`pmtiles`).
- **Bond Insights:** Visualize total municipal investment value, top issuers, and the use of proceeds.
- **Demographics & Health:** Overlay health data such as "Life Expectancy" sourced from the Congressional District Health Dashboard.
- **Compare Mode:** Select and compare multiple districts side-by-side to understand regional disparities in municipal investment.
- **Tutorial System:** An integrated onboarding flow that guides users through the interface.

## Tech Stack

The application is built using a modern, lightweight, and framework-agnostic stack:

- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6)
- **Map Rendering:** [MapLibre GL JS](https://maplibre.org/)
- **Data Visualization:** [D3.js](https://d3js.org/)
- **Tile Hosting:** [PMTiles](https://protomaps.com/docs/pmtiles) (Serverless Vector Tiles)

## Data Sources & Acknowledgments

- **Municipal Bond Data:** Prepared by the Center for Municipal Finance at the University of Chicago. The data is provided by [Intercontinental Exchange, Inc. (ICE) Data Services](https://www.ice.com/fixed-income-data-services/ice-climate-analytics-for-municipal-debt) for informational purposes only.
- **Health Data:** Sourced from the Department of Population Health, NYU Langone Health. [Congressional District Health Dashboard](https://www.congressionaldistricthealthdashboard.org/).

## Directory Structure & Key Files

```text
/
├── index.html                  # Main application entry point & layout structure
├── style.css                   # Core application styling & responsive design rules
├── assets/                     # Logos, icons, and visual assets
├── data/                       # Pre-processed JSON and PMTiles
│   ├── bboxes.json             # Bounding boxes for zooming to specific districts
│   ├── metrics.json            # Core demographic and financial data dictionary
│   └── muni_health.pmtiles     # Vector tiles containing district geometries and map data
├── js/                         # Application logic and UI controllers
│   ├── app.js                  # Main initialization and event listener bindings
│   ├── state.js                # Global state management and data fetching (the "Model")
│   ├── tutorial.js             # Onboarding flow and tutorial tooltips
│   ├── metric_meta.js          # Metadata mappings for UI formatting
│   ├── views/                  # UI components (Map rendering, tooltips, compare mode)
│   └── utils/                  # Helper functions for math, formatting, and colors
└── data_processing/            # Data extraction scripts and raw CSV files
```

### Application Architecture
- **State Management (`state.js`)**: Acts as the central source of truth. It fetches the static JSON datasets and broadcasts state changes to the UI components when the user selects new districts or changes metrics.
- **View Layer (`js/views/`)**: Components like `map.js` and `compare.js` react to state changes to re-render the D3.js charts or update the MapLibre GL instance dynamically.

### Data Processing Pipeline

The `data_processing/` directory contains the Python scripts and Jupyter Notebooks used to extract the raw municipal data from source PDFs and prepare the spatial data.
- `script2.ipynb` contains the core `pdfplumber` extraction logic for pulling the "Use of Proceeds" and "Jurisdiction" tables from raw documents.
- The resulting structured data is output as `Muni_Jurisdiction_Final.csv`, `Muni_Text_Data_Final.csv`, and `Muni_Use_Of_Proceeds_Final.csv`, which are then aggregated into the spatial `.pmtiles` archive for frontend consumption.

## Local Development

To run the application locally, you must serve the files over HTTP (opening `index.html` directly in the browser will result in CORS errors due to fetching `data/` files).

You can use Python's built-in HTTP server:

```bash
# From the root directory:
python -m http.server 8000
```

Then open `http://localhost:8000` in your web browser.

Alternatively, if you have Node.js installed, you can use Vite or `http-server`:

```bash
npx http-server . -p 8000
```
