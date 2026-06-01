export const state = {
  activeMetric: 'Total_Inv_Value',
  activeGroup: 'Total', // Default subgroup
  activeView: 'maps',
  compareMode: false,
  compareLeftSource: 'bonds',
  compareLeftMetric: 'Total_Inv_Value',
  compareLeftGroup: 'Total',
  compareLeftPeriod: null,
  compareRightSource: 'esg',
  compareRightMetric: 'Breast_Cancer_Deaths',
  compareRightGroup: 'Total',
  compareRightPeriod: null,
  compareViewType: 'swipe', // 'swipe' or 'sbs'
  compareSbsSource: 'bonds',
  compareSbsMetric: 'Total_Inv_Value',
  compareSbsGroup: 'Total',
  compareSbsPeriod: null,
  compareSbsLeftDistrict: null,
  compareSbsRightDistrict: null,
  isTimeSliderOpen: { main: false, left: false, right: false },
  selectedDistrict: null,
  selectedDistrictLeft: null,
  selectedDistrictRight: null,
  insightsLeftDistrict: null,
  insightsRightDistrict: null,
  insightsLeftState: '',
  insightsRightState: '',
  activeInsightsLeftTab: 'Bond Metrics',
  activeInsightsRightTab: 'All Metrics',
  activeBondMetric: 'Total_Inv_Value',
  activeHealthMetric: null,
  currentDataPeriod: null,
  availableDataPeriods: [],
  metricsData: [],
  stateMuniData: null,
  metricGroups: {
      "Total_Inv_Value": [
          "Total"
      ],
      "Total_Issuers": [
          "Total"
      ],
      "Small_Borrowers": [
          "Total"
      ],
      "Sub_State_Inv_Value": [
          "Total"
      ],
      "Sub_State_Inv_Unit": [
          "Total"
      ],
      "Sub_State_Sav_Value": [
          "Total"
      ],
      "Small_Borrowers_Pct": [
          "Total"
      ],
      "Proceeds_Education_Total": [
          "Total"
      ],
      "Proceeds_Healthcare_Total": [
          "Total"
      ],
      "Proceeds_Housing_Total": [
          "Total"
      ],
      "Proceeds_Utilities_Total": [
          "Total"
      ],
      "Proceeds_Transportation_Total": [
          "Total"
      ],
      "Proceeds_Infrastructure_Total": [
          "Total"
      ],
      "Proceeds_Economic_Dev_Total": [
          "Total"
      ],
      "Proceeds_Recreation_Total": [
          "Total"
      ],
      "Proceeds_Other_Total": [
          "Total"
      ],
      "Breast_Cancer_Deaths": [
          "Asian",
          "Black",
          "Hispanic",
          "Other",
          "Total",
          "White"
      ],
      "Cardiovascular_Disease_Deaths": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Colorectal_Cancer_Deaths": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Diabetes": [
          "Total"
      ],
      "Firearm_Homicides": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Firearm_Suicides": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Frequent_Mental_Distress": [
          "Total"
      ],
      "Frequent_Physical_Distress": [
          "Total"
      ],
      "High_Blood_Pressure": [
          "Total"
      ],
      "Independent_Living_Difficulty": [
          "Age-18-64",
          "Age 65+",
          "Total"
      ],
      "Life_Expectancy": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White",
          " Census Tract Level, 2015"
      ],
      "Low_Birthweight": [
          "Asian",
          "Black",
          "Hispanic",
          "Other",
          "Total",
          "White"
      ],
      "Obesity": [
          "Total"
      ],
      "Opioid_Overdose_Deaths": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Premature_Deaths_(All_Causes)": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Broadband_Connection": [
          "Total"
      ],
      "Children_in_Poverty": [
          "Asian",
          "Black",
          "Hispanic",
          "Other",
          "Total",
          "White"
      ],
      "Chronic_Absenteeism": [
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Food_Insecurity": [
          "Total"
      ],
      "High_School_Completion": [
          "Age 25-34",
          "Age 35-44",
          "Age 45-64",
          "Age 65+",
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Income_Inequality": [
          "Total"
      ],
      "Neighborhood_Racial/Ethnic_Segregation": [
          "Total"
      ],
      "Racial/Ethnic_Diversity": [
          "Total"
      ],
      "Rent_Burden": [
          "Total"
      ],
      "SNAP_Participation": [
          "Total"
      ],
      "Unemployment": [
          "Age 16-19",
          "Age 20-24",
          "Age-25-29",
          "Age 30-34",
          "Age 35-44",
          "Age 45-54",
          "Age 55-59",
          "Age 60-64",
          "Age 65-74",
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ],
      "Youth_Not_in_Work_or_School": [
          "Female",
          "Male",
          "Total"
      ],
      "Binge_Drinking": [
          "Total"
      ],
      "Physical_Inactivity": [
          "Total"
      ],
      "Smoking": [
          "Total"
      ],
      "Teen_Births": [
          "Asian",
          "Black",
          "Hispanic",
          "Other",
          "Total",
          "White"
      ],
      "Air_Pollution___Ozone": [
          "Total"
      ],
      "Air_Pollution___Particulate_Matter": [
          "Total"
      ],
      "Housing_with_Potential_Lead_Risk": [
          "Total"
      ],
      "Lead_Exposure_Risk_Index": [
          "Total"
      ],
      "Dental_Care": [
          "Total"
      ],
      "Designated_Primary_Care_Shortage_Area": [
          "Total"
      ],
      "Medicaid_Enrollment": [
          "Total"
      ],
      "Prenatal_Care": [
          "Asian",
          "Black",
          "Hispanic",
          "Other",
          "Total",
          "White"
      ],
      "Routine_Checkup,_18+": [
          "Total"
      ],
      "Uninsured": [
          "Age 0-18",
          "Age 19-25",
          "Age 26-34",
          "Age 35-44",
          "Age 45-64",
          "Asian",
          "Black",
          "Female",
          "Hispanic",
          "Male",
          "Other",
          "Total",
          "White"
      ]
  },
  
  listeners: [],

  subscribe(callback) {
    this.listeners.push(callback);
  },

  notify() {
    this.listeners.forEach(cb => cb(this));
  },

  setActiveMetric(metric, group = 'Total') {
    if (this.activeMetric && this.activeMetric !== metric) {
        const subgroupWin = document.getElementById('subgroup-window-container');
        if (subgroupWin) {
            subgroupWin.style.display = 'none';
        }
        this.isTimeSliderOpen = { main: false, left: false, right: false };
        
        ['main', 'left', 'right'].forEach(target => {
            const timeSliderContainer = document.getElementById(`time-slider-container-${target}`);
            if (timeSliderContainer) {
                timeSliderContainer.style.display = 'none';
                timeSliderContainer.style.transform = 'translate3d(-50%, 0px, 0px)';
            }
        });
    }

    this.activeMetric = metric;
    this.activeGroup = group;
    this.updateAvailablePeriods();
    this.notify();
  },

  setDataPeriod(period) {
    this.currentDataPeriod = period;
    this.notify();
  },

  setActiveView(view) {
    this.activeView = view;
    this.notify();
  },

  setSelectedDistrict(dist) {
    this.selectedDistrict = dist;
    this.selectedDistrictLeft = null;
    this.selectedDistrictRight = null;
    this.notify();
  },

  setSelectedDistrictLeft(dist) {
    this.selectedDistrictLeft = dist;
    this.notify();
  },

  setSelectedDistrictRight(dist) {
    this.selectedDistrictRight = dist;
    this.notify();
  },

  setInsightsLeftDistrict(districtName) {
    this.insightsLeftDistrict = districtName;
    this.notify();
  },

  setInsightsRightDistrict(districtName) {
    this.insightsRightDistrict = districtName;
    this.notify();
  },

  setInsightsLeftState(stateName) {
    this.insightsLeftState = stateName;
    this.notify();
  },

  setInsightsRightState(stateName) {
    this.insightsRightState = stateName;
    this.notify();
  },

  setInsightsLeftTab(tabName) {
    this.activeInsightsLeftTab = tabName;
    this.notify();
  },

  setActiveBondMetric(metric) {
    this.activeBondMetric = metric;
    this.notify();
  },

  setActiveInsightsRightTab(tabName) {
    this.activeInsightsRightTab = tabName;
    this.notify();
  },

  setActiveHealthMetric(metric) {
    this.activeHealthMetric = metric;
    this.notify();
  },

  async loadData() {
    try {
      const [metricsResponse, stateMuniResponse] = await Promise.all([
        fetch('./data/metrics.json?v=' + Date.now()),
        fetch('./data/State_Muni_Bonds_Data.json?v=' + Date.now()).catch(() => null)
      ]);
      
      if (!metricsResponse.ok) throw new Error('Failed to load data/metrics.json');
      const data = await metricsResponse.json();
      
      if (stateMuniResponse && stateMuniResponse.ok) {
        this.stateMuniData = await stateMuniResponse.json();
        console.log('State Muni Data loaded:', this.stateMuniData.length, 'states');
      }

      this.metricsData = data.map(d => {
        const out = { ...d };

        const proceedsKeys = [
          'Proceeds_Healthcare_Total', 'Proceeds_Education_Total', 'Proceeds_Housing_Total',
          'Proceeds_Utilities_Total', 'Proceeds_Transportation_Total', 'Proceeds_Infrastructure_Total',
          'Proceeds_Economic_Dev_Total', 'Proceeds_Recreation_Total', 'Proceeds_Other_Total'
        ];
        proceedsKeys.forEach(k => out[k] = -999);

        if (out.Proceeds_Data) {
          proceedsKeys.forEach(k => out[k] = 0);
          try {
            const proceedsArray = Array.isArray(out.Proceeds_Data) ? out.Proceeds_Data : JSON.parse(out.Proceeds_Data);
            proceedsArray.forEach(p => {
              const cat = p.Category ? p.Category.toUpperCase() : '';
              const amt = parseFloat(p.Amount) || 0;
              
              if (cat.includes('HOSPITAL') || cat.includes('NURSING') || cat.includes('LIFECARE') || cat.includes('HEALTH') || cat.includes('HUMAN SERVICE') || cat.includes('HUMANSERVICE')) {
                out['Proceeds_Healthcare_Total'] += amt;
              } else if (cat.includes('EDUCATION') || cat.includes('SCHOOL') || cat.includes('STUDENT')) {
                out['Proceeds_Education_Total'] += amt;
              } else if (cat.includes('HOUSING') || cat.includes('HOMES') || cat.includes('HSG') || cat.includes('LD PRESERVTN')) {
                out['Proceeds_Housing_Total'] += amt;
              } else if (cat.includes('WATER') || cat.includes('SEWER') || cat.includes('SANITATION') || cat.includes('WASTE') || cat.includes('UTILITY') || cat.includes('UTILITIES') || cat.includes('ELECTRIC') || cat.includes('POWER') || cat.includes('GAS') || cat.includes('COGENERATION') || cat.includes('POLLUTION') || cat.includes('DRAINAGE') || cat.includes('IRRIGATION')) {
                out['Proceeds_Utilities_Total'] += amt;
              } else if (cat.includes('TRANSPORTATION') || cat.includes('TRANSIT') || cat.includes('STREET') || cat.includes('HIGHWAY') || cat.includes('BRIDGE') || cat.includes('TUNNEL') || cat.includes('AIRPORT') || cat.includes('SEAPORT') || cat.includes('TERMINAL') || cat.includes('PARKING') || cat.includes('TOLL ROAD') || cat.includes('TOLLROAD') || cat.includes('AIRLINES')) {
                out['Proceeds_Transportation_Total'] += amt;
              } else if (cat.includes('GOVERNMENT') || cat.includes('PUBLIC BUILDING') || cat.includes('PUBLICBUILDING') || cat.includes('FIRE') || cat.includes('POLICE') || cat.includes('COURT') || cat.includes('GENERAL PURPOSE') || cat.includes('GENERALPURPOSE') || cat.includes('PUBLIC IMPROVEMENT') || cat.includes('PUBLICIMPROVEMENT') || cat.includes('TELECOMMUNICATION')) {
                out['Proceeds_Infrastructure_Total'] += amt;
              } else if (cat.includes('ECONOMIC') || cat.includes('INDUSTRIAL') || cat.includes('REDEVELOPMENT') || cat.includes('MALL') || cat.includes('HOTEL') || cat.includes('OFFICE') || cat.includes('AGRICULTURE') || cat.includes('VETERANS')) {
                out['Proceeds_Economic_Dev_Total'] += amt;
              } else if (cat.includes('PARK') || cat.includes('ZOO') || cat.includes('BEACH') || cat.includes('RECREATION') || cat.includes('CIVIC') || cat.includes('CONVENTION') || cat.includes('STADIUM') || cat.includes('SPORTS') || cat.includes('THEATER') || cat.includes('LIBRARY') || cat.includes('MUSEUM')) {
                out['Proceeds_Recreation_Total'] += amt;
              } else {
                out['Proceeds_Other_Total'] += amt;
              }
            });
          } catch(e) { console.error(e); }
        }

        for (const k in out) {
          if (k !== 'GEOID' && k !== 'District' && k !== 'NAMELSAD' && k !== 'District_Name' && k !== 'Jurisdiction_Data' && k !== 'Proceeds_Data') {
            const val = parseFloat(out[k]);
            out[k] = isNaN(val) ? -999 : val;
          }
        }
        return out;
      });
      this.updateAvailablePeriods();
      this.notify();
      console.log('Data loaded successfully:', this.metricsData.length, 'records');
    } catch (err) {
      console.error('Data Load Error:', err);
    }
  },

  updateAvailablePeriods() {
    if (!this.metricsData || this.metricsData.length === 0) return;
    
    // For bond metrics and proceeds metrics that don't have periods, clear periods
    if (["Total_Inv_Value", "Total_Issuers", "Small_Borrowers", "Sub_State_Inv_Value", "Sub_State_Inv_Unit", "Sub_State_Sav_Value", "Small_Borrowers_Pct"].includes(this.activeMetric) || this.activeMetric.startsWith("Proceeds_")) {
      this.availableDataPeriods = [];
      this.currentDataPeriod = null;
      return;
    }

    const formattedGroup = this.activeGroup.replace(/ /g, '_').replace(/-/g, '_');
    const prefix = `${this.activeMetric}__${formattedGroup}__`;
    const periods = new Set();
    
    // We check the first record to see what keys exist
    const record = this.metricsData[0];
    Object.keys(record).forEach(key => {
      if (key.startsWith(prefix)) {
        periods.add(key.replace(prefix, ''));
      }
    });
    
    // Sort descending so most recent is first
    this.availableDataPeriods = Array.from(periods).sort((a, b) => b.localeCompare(a));
    
    if (this.availableDataPeriods.length > 0) {
      if (!this.currentDataPeriod || !this.availableDataPeriods.includes(this.currentDataPeriod)) {
        this.currentDataPeriod = this.availableDataPeriods[0];
      }
    } else {
      this.currentDataPeriod = null;
    }
  },

  getActiveDataField() {
    if (this.metricGroups[this.activeMetric]) {
      const formattedGroup = this.activeGroup.replace(/ /g, '_').replace(/-/g, '_');
      // For bond metrics and proceeds metrics that don't have subgroups in the data, just return metric
      if (["Total_Inv_Value", "Total_Issuers", "Small_Borrowers", "Sub_State_Inv_Value", "Sub_State_Inv_Unit", "Sub_State_Sav_Value", "Small_Borrowers_Pct"].includes(this.activeMetric) || this.activeMetric.startsWith("Proceeds_")) {
        return this.activeMetric;
      }
      if (this.currentDataPeriod) {
        return `${this.activeMetric}__${formattedGroup}__${this.currentDataPeriod}`;
      }
      return `${this.activeMetric}__${formattedGroup}`;
    }
    return this.activeMetric;
  },

  getMetricExtent(metricField) {
    if (!this.metricsData.length) return [0, 100];
    const vals = this.metricsData.map(d => d[metricField]).filter(v => v !== undefined && v !== null && v !== -999);
    if (!vals.length) return [0, 100];
    return [Math.min(...vals), Math.max(...vals)];
  },

  setCompareMode(isCompare) {
    this.compareMode = isCompare;
    this.notify();
  },

  setCompareLeftMetric(source, metric, group = 'Total', period = null) {
    this.compareLeftSource = source;
    this.compareLeftMetric = metric;
    this.compareLeftGroup = group;
    this.compareLeftPeriod = period;
    this.notify();
  },

  setCompareRightMetric(source, metric, group = 'Total', period = null) {
    this.compareRightSource = source;
    this.compareRightMetric = metric;
    this.compareRightGroup = group;
    this.compareRightPeriod = period;
    this.notify();
  },

  setCompareLeftPeriod(period) {
    this.compareLeftPeriod = period;
    this.notify();
  },

  setCompareRightPeriod(period) {
    this.compareRightPeriod = period;
    this.notify();
  },

  setCompareViewType(type) {
    this.compareViewType = type;
    this.notify();
  },

  setCompareSbsMetric(source, metric, group = 'Total', period = null) {
    this.compareSbsSource = source;
    this.compareSbsMetric = metric;
    this.compareSbsGroup = group;
    this.compareSbsPeriod = period;
    this.notify();
  },

  setCompareSbsLeftDistrict(geoid) {
    this.compareSbsLeftDistrict = geoid;
    this.notify();
  },

  setCompareSbsRightDistrict(geoid) {
    this.compareSbsRightDistrict = geoid;
    this.notify();
  },

  getCompareField(side) {
    const metric = side === 'left' ? this.compareLeftMetric : side === 'right' ? this.compareRightMetric : this.compareSbsMetric;
    const group = side === 'left' ? this.compareLeftGroup : side === 'right' ? this.compareRightGroup : this.compareSbsGroup;
    const period = side === 'left' ? this.compareLeftPeriod : side === 'right' ? this.compareRightPeriod : this.compareSbsPeriod;
    
    if (this.metricGroups[metric]) {
      const formattedGroup = group.replace(/ /g, '_').replace(/-/g, '_');
      if (["Total_Inv_Value", "Total_Issuers", "Small_Borrowers", "Sub_State_Inv_Value", "Sub_State_Inv_Unit", "Sub_State_Sav_Value", "Small_Borrowers_Pct"].includes(metric) || metric.startsWith("Proceeds_")) {
        return metric;
      }
      if (period) {
        return `${metric}__${formattedGroup}__${period}`;
      } else if (this.currentDataPeriod) {
        return `${metric}__${formattedGroup}__${this.currentDataPeriod}`;
      } else {
        const prefix = `${metric}__${formattedGroup}__`;
        const periods = [];
        if (this.metricsData.length > 0) {
          Object.keys(this.metricsData[0]).forEach(key => {
            if (key.startsWith(prefix)) {
              periods.push(key.replace(prefix, ''));
            }
          });
        }
        if (periods.length > 0) {
          periods.sort((a, b) => b.localeCompare(a));
          return `${metric}__${formattedGroup}__${periods[0]}`;
        }
      }
      return `${metric}__${formattedGroup}`;
    }
    return metric;
  }
};
