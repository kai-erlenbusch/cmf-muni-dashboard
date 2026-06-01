import { state } from '../state.js';

export const scaleColors = [
  '#141428', '#1a1f4c', '#202970', '#263494', '#2a41b5', '#2a53d1',
  '#2467e8', '#1a7cf7', '#0892ff', '#00a9ff', '#00beff', '#00d4ff',
  '#00dfed', '#00ead6', '#00f3be', '#00fba6', '#00ff8e', '#45ff7b',
  '#74ff6a', '#9eff5a', '#c7ff4a', '#ecff3b', '#ffd426', '#ffb347'
];

export function getColorMapperForMetric(metricField) {
  const [minVal, maxVal] = state.getMetricExtent(metricField);
  const isLog = ['Total_Inv_Value', 'Total_Sav_Value', 'Sub_State_Inv_Value', 'Sub_State_Sav_Value'].includes(metricField) || metricField.startsWith('Proceeds_');
  
  const safeMin = isLog ? Math.max(minVal, 0.1) : minVal; 
  const safeMax = isLog ? Math.max(maxVal, safeMin + 1) : maxVal; 

  const logMin = isLog ? Math.log10(safeMin) : safeMin;
  const logMax = isLog ? Math.log10(safeMax) : safeMax;
  const step = (logMax - logMin) / (scaleColors.length - 1);
  
  function getColorForValue(val) {
    if (val === undefined || val === null || val === -999) return "#2a2a2a";
    if (val <= safeMin) return scaleColors[0];
    if (val >= safeMax) return scaleColors[scaleColors.length - 1];
    
    const scaleVal = isLog ? Math.log10(val) : val;
    const index = (scaleVal - logMin) / step;
    const lowerIdx = Math.floor(index);
    const upperIdx = Math.ceil(index);
    
    if (lowerIdx === upperIdx) return scaleColors[lowerIdx];
    
    const weight = index - lowerIdx;
    return interpolateColor(scaleColors[lowerIdx], scaleColors[upperIdx], weight);
  }
  
  function interpolateColor(c1, c2, factor) {
    const hex2rgb = hex => {
      const v = parseInt(hex.slice(1), 16);
      return [v >> 16 & 255, v >> 8 & 255, v & 255];
    };
    const rgb1 = hex2rgb(c1);
    const rgb2 = hex2rgb(c2);
    const result = rgb1.map((c, i) => Math.round(c + factor * (rgb2[i] - c)));
    return `#${(1 << 24 | result[0] << 16 | result[1] << 8 | result[2]).toString(16).slice(1)}`;
  }

  return getColorForValue;
}

export function getColorsForMetric(metricField) {
  const getColorForValue = getColorMapperForMetric(metricField);
  const colorDict = {};

  state.metricsData.forEach(d => {
    let val = d[metricField];
    if (d.GEOID !== undefined) {
      colorDict[d.GEOID] = getColorForValue(val);
    }
  });
  
  return colorDict;
}

export function getPercentageForValue(val, metricField) {
  const [minVal, maxVal] = state.getMetricExtent(metricField);
  const isLog = ['Total_Inv_Value', 'Total_Sav_Value', 'Sub_State_Inv_Value', 'Sub_State_Sav_Value'].includes(metricField) || metricField.startsWith('Proceeds_');

  const safeMin = isLog ? Math.max(minVal, 0.1) : minVal; 
  const safeMax = isLog ? Math.max(maxVal, safeMin + 1) : maxVal; 

  if (val <= safeMin) return 0;
  if (val >= safeMax) return 100;

  const logMin = isLog ? Math.log10(safeMin) : safeMin;
  const logMax = isLog ? Math.log10(safeMax) : safeMax;
  
  if (logMax === logMin) return 50;
  
  const scaleVal = isLog ? Math.log10(val) : val;
  const percentage = ((scaleVal - logMin) / (logMax - logMin)) * 100;
  return Math.max(0, Math.min(100, percentage));
}
