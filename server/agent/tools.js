import { ragEngine } from './ragEngine.js';

// Predefined species profiles for deterministic threshold checks
const SPECIES_THRESHOLDS = {
  tilapia: {
    name: 'Tilapia',
    ph: { min: 6.5, max: 8.5, criticalLow: 5.5, criticalHigh: 9.0 },
    dissolvedOxygen: { optimal: 5.0, warning: 3.5, critical: 2.0 },
    ammonia: { safe: 0.05, warning: 0.2, critical: 0.5 },
    nitrite: { safe: 0.1, warning: 0.5, critical: 1.0 },
    temperature: { min: 26, max: 32, warningLow: 22, warningHigh: 34 }
  },
  catfish: {
    name: 'African Catfish',
    ph: { min: 6.5, max: 8.2, criticalLow: 5.0, criticalHigh: 9.0 },
    dissolvedOxygen: { optimal: 4.0, warning: 2.5, critical: 1.5 },
    ammonia: { safe: 0.1, warning: 0.3, critical: 0.8 },
    nitrite: { safe: 0.2, warning: 0.6, critical: 1.5 },
    temperature: { min: 26, max: 30, warningLow: 22, warningHigh: 33 }
  },
  carp: {
    name: 'Carp',
    ph: { min: 7.0, max: 8.5, criticalLow: 6.0, criticalHigh: 9.0 },
    dissolvedOxygen: { optimal: 5.0, warning: 3.5, critical: 2.0 },
    ammonia: { safe: 0.03, warning: 0.1, critical: 0.5 },
    nitrite: { safe: 0.05, warning: 0.2, critical: 0.8 },
    temperature: { min: 24, max: 30, warningLow: 18, warningHigh: 32 }
  },
  shrimp: {
    name: 'Shrimp / Prawn',
    ph: { min: 7.5, max: 8.5, criticalLow: 7.0, criticalHigh: 9.0 },
    dissolvedOxygen: { optimal: 5.0, warning: 4.0, critical: 2.5 },
    ammonia: { safe: 0.02, warning: 0.08, critical: 0.3 },
    nitrite: { safe: 0.05, warning: 0.2, critical: 0.5 },
    temperature: { min: 28, max: 32, warningLow: 24, warningHigh: 34 }
  }
};

/**
 * Deterministic Water Quality Analyzer
 */
export function analyzeWaterQuality(params = {}) {
  const speciesKey = (params.species || 'tilapia').toLowerCase();
  const species = SPECIES_THRESHOLDS[speciesKey] || SPECIES_THRESHOLDS.tilapia;

  const ph = params.ph !== undefined && params.ph !== null ? Number(params.ph) : null;
  const dissolvedOxygen = params.dissolvedOxygen !== undefined && params.dissolvedOxygen !== null ? Number(params.dissolvedOxygen) : null;
  const ammonia = params.ammonia !== undefined && params.ammonia !== null ? Number(params.ammonia) : null;
  const nitrite = params.nitrite !== undefined && params.nitrite !== null ? Number(params.nitrite) : null;
  const temperature = params.temperature !== undefined && params.temperature !== null ? Number(params.temperature) : null;

  const anomalies = [];
  const recommendations = [];
  let score = 100;

  // 1. Dissolved Oxygen Check
  if (dissolvedOxygen !== null) {
    if (dissolvedOxygen < species.dissolvedOxygen.critical) {
      score -= 40;
      anomalies.push({
        parameter: 'Dissolved Oxygen (DO)',
        value: `${dissolvedOxygen} mg/L`,
        severity: 'CRITICAL',
        issue: `Extremely low DO! Severe asphyxiation/hypoxia risk for ${species.name}.`
      });
      recommendations.push('EMERGENCY: Start all aerators and pumps immediately. Agitate pond surface. Cease feeding.');
    } else if (dissolvedOxygen < species.dissolvedOxygen.warning) {
      score -= 20;
      anomalies.push({
        parameter: 'Dissolved Oxygen (DO)',
        value: `${dissolvedOxygen} mg/L`,
        severity: 'WARNING',
        issue: `Sub-optimal DO below ${species.dissolvedOxygen.optimal} mg/L causes chronic stress and poor feed conversion.`
      });
      recommendations.push('Increase nighttime aeration hours (from 11:00 PM to 7:00 AM).');
    }
  }

  // 2. Ammonia Check
  if (ammonia !== null) {
    if (ammonia >= species.ammonia.critical) {
      score -= 35;
      anomalies.push({
        parameter: 'Ammonia (TAN)',
        value: `${ammonia} mg/L`,
        severity: 'CRITICAL',
        issue: `Lethal ammonia toxicity. Causes irreversible branchial hyperplasia and internal hemorrhaging.`
      });
      recommendations.push('STOP ALL FEEDING immediately! Perform a 30% bottom water exchange with clean aerated water.');
    } else if (ammonia >= species.ammonia.warning) {
      score -= 15;
      anomalies.push({
        parameter: 'Ammonia (TAN)',
        value: `${ammonia} mg/L`,
        severity: 'WARNING',
        issue: `Elevated ammonia indicates biological filter overload or overfeeding.`
      });
      recommendations.push('Cut feed ration by 50%. Siphon sediment from the pond bottom.');
    }
  }

  // 3. pH Check
  if (ph !== null) {
    if (ph < species.ph.criticalLow) {
      score -= 25;
      anomalies.push({
        parameter: 'pH',
        value: ph,
        severity: 'CRITICAL',
        issue: `Dangerous acidification (pH < ${species.ph.criticalLow}) strips mucus coat and burns fish gill membranes.`
      });
      recommendations.push('Apply agricultural limestone (CaCO3) at 200 kg/hectare. Do NOT use quicklime.');
    } else if (ph > species.ph.criticalHigh) {
      score -= 25;
      anomalies.push({
        parameter: 'pH',
        value: ph,
        severity: 'CRITICAL',
        issue: `Extreme alkaline pH (> ${species.ph.criticalHigh}) drastically converts ammonium (NH4+) into toxic un-ionized ammonia (NH3).`
      });
      recommendations.push('Dilute pond with fresh lower pH water or apply humic/citric buffer safely.');
    } else if (ph < species.ph.min || ph > species.ph.max) {
      score -= 10;
      anomalies.push({
        parameter: 'pH',
        value: ph,
        severity: 'WARNING',
        issue: `pH is outside optimal range (${species.ph.min} - ${species.ph.max}) for ${species.name}.`
      });
    }
  }

  // 4. Nitrite Check
  if (nitrite !== null) {
    if (nitrite >= species.nitrite.critical) {
      score -= 30;
      anomalies.push({
        parameter: 'Nitrite (NO2-)',
        value: `${nitrite} mg/L`,
        severity: 'CRITICAL',
        issue: `High nitrite induces brown blood disease (methemoglobinemia), preventing oxygen transport in blood.`
      });
      recommendations.push('Add coarse non-iodized pond salt at 1-2 kg/1,000L to competitively block nitrite uptake at gills.');
    } else if (nitrite >= species.nitrite.warning) {
      score -= 15;
      anomalies.push({
        parameter: 'Nitrite (NO2-)',
        value: `${nitrite} mg/L`,
        severity: 'WARNING',
        issue: `Incomplete biofilter cycling. Nitrite converting bacteria (Nitrobacter) are struggling.`
      });
    }
  }

  // 5. Temperature Check
  if (temperature !== null) {
    if (temperature < species.temperature.warningLow || temperature > species.temperature.warningHigh) {
      score -= 15;
      anomalies.push({
        parameter: 'Temperature',
        value: `${temperature} °C`,
        severity: 'WARNING',
        issue: `Water temperature is outside comfortable growth range (${species.temperature.min}-${species.temperature.max} °C).`
      });
    }
  }

  const overallScore = Math.max(0, Math.min(100, score));
  let status = 'EXCELLENT';
  if (overallScore < 50) status = 'CRITICAL';
  else if (overallScore < 80) status = 'WARNING';
  else if (overallScore < 90) status = 'GOOD';

  return {
    speciesEvaluated: species.name,
    overallScore,
    status,
    anomaliesCount: anomalies.length,
    anomalies,
    deterministicCorrectiveActions: recommendations,
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Deterministic Fish Disease & Problem Detector
 */
export function detectFishProblem(params = {}) {
  const symptoms = (Array.isArray(params.symptoms) ? params.symptoms.join(' ') : String(params.symptoms || '')).toLowerCase();
  const mortalityRate = params.mortalityRate !== undefined ? Number(params.mortalityRate) : 0;
  const species = params.species || 'Fish';

  const matches = [];

  // Disease 1: White Spot / Ich
  if (symptoms.includes('white spot') || symptoms.includes('white dot') || symptoms.includes('rubbing') || symptoms.includes('flashing')) {
    matches.push({
      disease: 'White Spot Disease (Ichthyophthiriasis)',
      pathogen: 'Ichthyophthirius multifiliis',
      confidence: '90%',
      severity: 'High',
      treatment: 'Un-iodized coarse pond salt at 2-3 kg/1,000L for 7-10 days. Siphon bottom sediment to remove fallen cysts.'
    });
  }

  // Disease 2: Ammonia Poisoning / Gill Damage
  if (symptoms.includes('gasping') || symptoms.includes('red gill') || symptoms.includes('purple gill') || symptoms.includes('refusing food') || symptoms.includes('corkscrew')) {
    matches.push({
      disease: 'Ammonia Toxicity / Acute Branchial Damage',
      pathogen: 'Environmental Toxicant (High NH3 / High pH)',
      confidence: '85%',
      severity: 'Critical Emergency',
      treatment: 'Immediately cease 100% feeding! Perform 30% bottom siphon water change and run maximum aeration.'
    });
  }

  // Disease 3: Hypoxia / Low Oxygen
  if (symptoms.includes('surface') || symptoms.includes('piping') || symptoms.includes('morning') || symptoms.includes('mouth open')) {
    matches.push({
      disease: 'Dissolved Oxygen Depletion (Hypoxia)',
      pathogen: 'Environmental (Algal bloom crash / Nighttime respiration)',
      confidence: '85%',
      severity: 'Code Red Emergency',
      treatment: 'Turn on all mechanical aerators and water pumps immediately. Spray fresh water across the surface.'
    });
  }

  // Disease 4: Dropsy / Bacterial Septicemia
  if (symptoms.includes('bloated') || symptoms.includes('pinecone') || symptoms.includes('dropsy') || symptoms.includes('bulging eye') || symptoms.includes('belly')) {
    matches.push({
      disease: 'Infectious Dropsy / Bacterial Septicemia',
      pathogen: 'Aeromonas hydrophila',
      confidence: '80%',
      severity: 'Critical',
      treatment: 'Isolate affected fish into hospital tank. Cease feeding for 48 hours. Perform 30% clean water exchange. Consult aquatic vet.'
    });
  }

  // Disease 5: Columnaris / Cotton Mouth
  if (symptoms.includes('cotton') || symptoms.includes('white mouth') || symptoms.includes('saddleback') || symptoms.includes('frayed fin') || symptoms.includes('fin rot')) {
    matches.push({
      disease: 'Columnaris Disease (Cotton Mouth / Saddleback)',
      pathogen: 'Flavobacterium columnare',
      confidence: '80%',
      severity: 'Very High',
      treatment: 'Reduce stocking stress. 25% clean water change. Salt dip bath at 1-2 g/L. Potassium permanganate (2 mg/L) for earthen pond.'
    });
  }

  // Disease 6: Brown Blood / Nitrite
  if (symptoms.includes('brown gill') || symptoms.includes('chocolate') || symptoms.includes('sluggish')) {
    matches.push({
      disease: 'Nitrite Poisoning (Brown Blood Disease)',
      pathogen: 'Methemoglobinemia (Elevated NO2-)',
      confidence: '85%',
      severity: 'High',
      treatment: 'Apply non-iodized sodium chloride salt to achieve Cl:NO2 ratio > 10:1. Maximize aeration.'
    });
  }

  const isEmergencyMortality = mortalityRate >= 5.0;

  return {
    species,
    symptomsEvaluated: symptoms,
    mortalityRate: `${mortalityRate}%`,
    emergencyMortalityWarning: isEmergencyMortality,
    matchedConditions: matches.length > 0 ? matches : [
      {
        disease: 'Unidentified Fish Stress / Pathogen',
        confidence: 'Low',
        severity: 'Moderate',
        treatment: 'Check all water quality parameters (DO, Ammonia, pH, Nitrite). Stop feeding for 24 hours and observe.'
      }
    ],
    veterinaryAdvisory: isEmergencyMortality
      ? 'CRITICAL NOTICE: Mortality rate >= 5%. Immediately consult a certified aquaculture pathologist or local fisheries extension officer.'
      : 'Monitor fish closely for 48 hours following recommended interventions.'
  };
}

/**
 * Search Verified Aquaculture Knowledge (RAG)
 */
export function searchAquacultureKnowledge(params = {}) {
  const query = params.query || params.topic || '';
  return ragEngine.search(query, { limit: 3 });
}

/**
 * Get Pond History
 */
export function getPondHistory(params = {}) {
  const pondId = params.pondId || 'pond-1';
  return {
    pondId,
    pondName: 'Main Commercial Grow-out Pond 1',
    species: 'Nile Tilapia',
    volumeLiters: 150000,
    currentStock: 4800,
    historicalReadings: [
      { timestamp: 'Yesterday 06:00 AM', ph: 7.2, dissolvedOxygen: 4.8, ammonia: 0.08, temp: 28 },
      { timestamp: 'Yesterday 06:00 PM', ph: 7.9, dissolvedOxygen: 6.9, ammonia: 0.12, temp: 30 },
      { timestamp: 'Today 06:00 AM', ph: 7.1, dissolvedOxygen: 4.2, ammonia: 0.22, temp: 27.5 }
    ],
    lastIncident: 'Nitrite spike 2 weeks ago resolved with 25% water exchange and agricultural salt.'
  };
}

/**
 * Tool registry metadata used for AI function declarations
 */
export const TOOL_DEFINITIONS = [
  {
    name: 'analyzeWaterQuality',
    description: 'Calculates deterministic water quality health score, verifies parameters against scientific species standards, and identifies critical hazards.',
    parameters: {
      type: 'object',
      properties: {
        species: { type: 'string', description: 'Fish species: "tilapia", "catfish", "carp", "shrimp"' },
        ph: { type: 'number', description: 'Pond water pH value (e.g. 7.2)' },
        dissolvedOxygen: { type: 'number', description: 'Dissolved oxygen in mg/L (e.g. 4.5)' },
        ammonia: { type: 'number', description: 'Total Ammonia Nitrogen TAN or un-ionized NH3 in mg/L (e.g. 0.25)' },
        nitrite: { type: 'number', description: 'Nitrite NO2- in mg/L (e.g. 0.05)' },
        temperature: { type: 'number', description: 'Water temperature in Celsius (e.g. 29.0)' }
      }
    }
  },
  {
    name: 'detectFishProblem',
    description: 'Deterministically diagnoses fish disease, physical symptoms, and behavioral anomalies with scientific pathogen matching.',
    parameters: {
      type: 'object',
      properties: {
        symptoms: { type: 'string', description: 'Observed signs (e.g. "white spots on fin, flashing, refusing feed")' },
        species: { type: 'string', description: 'Fish species name' },
        mortalityRate: { type: 'number', description: 'Percentage mortality observed (e.g. 2.5)' }
      },
      required: ['symptoms']
    }
  },
  {
    name: 'searchAquacultureKnowledge',
    description: 'Searches verified aquaculture guidelines, disease pathologies, and treatment SOPs.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Aquaculture question or topic keyword' }
      },
      required: ['query']
    }
  },
  {
    name: 'getPondHistory',
    description: 'Retrieves historical sensor measurements and incident history for a pond.',
    parameters: {
      type: 'object',
      properties: {
        pondId: { type: 'string', description: 'Pond identifier' }
      }
    }
  }
];

export const TOOL_DISPATCHER = {
  analyzeWaterQuality,
  detectFishProblem,
  searchAquacultureKnowledge,
  getPondHistory
};

