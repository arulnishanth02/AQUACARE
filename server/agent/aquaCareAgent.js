import { aiProviderManager } from '../ai/aiProviderManager.js';
import { TOOL_DISPATCHER, TOOL_DEFINITIONS, analyzeWaterQuality, detectFishProblem, getPondWaterQuality } from './tools.js';
import { ragEngine } from './ragEngine.js';
import { pondStore } from '../storage/pondStore.js';

const SYSTEM_PROMPT = `You are AquaCare AI, an expert certified aquaculture specialist and aquatic veterinarian assistant.
Your mission is to help fish farmers detect pond problems accurately and recommend safe, grounded solutions.

CRITICAL OPERATIONAL RULES:
1. SAFETY-CRITICAL VALUES: Water quality calculations and threshold evaluations have already been computed deterministically by the backend. Never contradict the deterministic backend tool results.
2. GROUNDING: Base all treatments, medication dosages, and salt bath ratios ONLY on verified scientific aquaculture standards (FAO, ICAR-CIFA). Never invent chemical dosages or toxic pesticides.
3. ACTIVE POND & SPECIES AWARENESS:
   - The user's active pond and selected fish species are explicitly provided in [ACTIVE POND & SPECIES CONTEXT].
   - If the fish species is provided in the context, DO NOT ask the user for their fish species. Treat it as already known and confirmed.
   - If the user changes species or mentions a different species in their message, adapt your diagnosis accordingly.
4. WATER QUALITY LAB DATA RECOGNITION:
   - Always inspect the [WATER QUALITY LAB MEASUREMENTS] and [WATER QUALITY EVALUATION] sections below.
   - If measurements exist, USE THEM IMMEDIATELY to answer the user's question. DO NOT ask the user to provide or repeat these measurements.
   - If a specific reading is missing from the pond's records, explicitly identify that specific parameter as missing.
   - If NO water quality records exist on file for this pond (status: NO_MEASUREMENTS), state that no readings are recorded yet and ask the user to enter or test the necessary measurements (DO, pH, Ammonia, Temperature).
   - If measurements are older than 24 hours, reference the timestamp and ask if newer readings are available if relevant.
   - NEVER invent or hallucinate measurement values.
5. EMERGENCY PROTOCOL: If fish are dying rapidly (>5% mortality) or showing acute asphyxiation/surface gasping, highlight urgent emergency actions in bold, and advise consulting a local aquatic health professional.
6. TONE: Professional, supportive, practical for farmers, scientifically sound.
`;

export class AquaCareAgent {
  /**
   * Deterministically parses any water quality parameters embedded in text
   */
  extractParametersFromText(text) {
    if (!text || typeof text !== 'string') return {};

    const extracted = {};

    // pH match (e.g. "ph 6.5", "pH is 7.8", "ph: 8")
    const phMatch = text.match(/\bph\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (phMatch) extracted.ph = parseFloat(phMatch[1]);

    // Dissolved oxygen match (e.g. "DO 3.5", "do is 2.1", "dissolved oxygen 4")
    const doMatch = text.match(/\b(?:do|dissolved\s+oxygen)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (doMatch) extracted.dissolvedOxygen = parseFloat(doMatch[1]);

    // Ammonia match (e.g. "ammonia 0.5", "tan 1.2")
    const ammoniaMatch = text.match(/\b(?:ammonia|tan)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (ammoniaMatch) extracted.ammonia = parseFloat(ammoniaMatch[1]);

    // Nitrite match (e.g. "nitrite 0.4", "no2 0.3")
    const nitriteMatch = text.match(/\b(?:nitrite|no2)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (nitriteMatch) extracted.nitrite = parseFloat(nitriteMatch[1]);

    // Temperature match (e.g. "temp 31", "temperature 28.5C", "29 degrees")
    const tempMatch = text.match(/\b(?:temp|temperature)\s*(?:is|=|:)?\s*([0-9]+(?:\.[0-9]+)?)/i);
    if (tempMatch) extracted.temperature = parseFloat(tempMatch[1]);

    // Species detection in text
    if (/tilapia/i.test(text)) extracted.species = 'tilapia';
    else if (/catfish|clarias|pangasius/i.test(text)) extracted.species = 'catfish';
    else if (/carp|rohu|catla/i.test(text)) extracted.species = 'carp';
    else if (/shrimp|prawn|vannamei/i.test(text)) extracted.species = 'shrimp';

    return extracted;
  }

  /**
   * Main conversation processor
   */
  async processUserMessage({
    message,
    conversationHistory = [],
    pondId = 'pond-1',
    speciesOverride = null,
    forceProvider = null
  }) {
    const executedTools = [];
    let ragContext = '';
    let sources = [];

    // Step 1: Resolve Pond Context & Stored Water Quality Lab Data
    const effectivePondId = pondId || 'pond-1';
    const pond = pondStore.getPond(effectivePondId) || pondStore.getPond('pond-1') || {
      id: effectivePondId,
      name: `Pond (${effectivePondId})`,
      species: speciesOverride || 'tilapia'
    };

    // Determine the authoritative species (User explicit select > Pond species > text extracted > fallback)
    const textExtractedParams = this.extractParametersFromText(message);
    const effectiveSpecies = (speciesOverride || textExtractedParams.species || pond.species || 'tilapia').toLowerCase();

    // Call getPondWaterQuality tool for this pond
    const pondWaterQuality = getPondWaterQuality({ pondId: pond.id });
    executedTools.push({
      tool: 'getPondWaterQuality',
      input: { pondId: pond.id },
      output: pondWaterQuality,
      status: 'completed'
    });

    // Step 2: Merge text parameters with stored Water Quality Lab measurements
    const storedReadings = pondStore.getLatestWaterQuality(pond.id);
    const hasStoredReadings = Boolean(storedReadings && (
      storedReadings.ph !== null ||
      storedReadings.dissolvedOxygen !== null ||
      storedReadings.ammonia !== null ||
      storedReadings.nitrite !== null ||
      storedReadings.temperature !== null
    ));

    // Combine parameters: user prompt in message takes precedence, otherwise use stored lab measurements
    const mergedParams = {
      species: effectiveSpecies,
      ph: textExtractedParams.ph !== undefined ? textExtractedParams.ph : storedReadings?.ph ?? null,
      dissolvedOxygen: textExtractedParams.dissolvedOxygen !== undefined ? textExtractedParams.dissolvedOxygen : storedReadings?.dissolvedOxygen ?? null,
      ammonia: textExtractedParams.ammonia !== undefined ? textExtractedParams.ammonia : storedReadings?.ammonia ?? null,
      nitrite: textExtractedParams.nitrite !== undefined ? textExtractedParams.nitrite : storedReadings?.nitrite ?? null,
      temperature: textExtractedParams.temperature !== undefined ? textExtractedParams.temperature : storedReadings?.temperature ?? null
    };

    const hasAnyWaterParams = mergedParams.ph !== null ||
      mergedParams.dissolvedOxygen !== null ||
      mergedParams.ammonia !== null ||
      mergedParams.nitrite !== null ||
      mergedParams.temperature !== null;

    let waterAnalysisResult = null;
    if (hasAnyWaterParams) {
      waterAnalysisResult = analyzeWaterQuality(mergedParams);
      executedTools.push({
        tool: 'analyzeWaterQuality',
        input: mergedParams,
        output: waterAnalysisResult,
        status: 'completed'
      });
    }

    // Step 3: Detect fish pathology symptoms
    const symptomKeywords = ['spot', 'white', 'gasping', 'surface', 'dying', 'dead', 'bloat', 'fin', 'rot', 'mouth', 'scratch', 'rubbing', 'erratic', 'brown', 'corner', 'swimming'];
    const hasSymptoms = symptomKeywords.some(k => message.toLowerCase().includes(k));

    let symptomResult = null;
    if (hasSymptoms) {
      symptomResult = detectFishProblem({
        symptoms: message,
        species: effectiveSpecies
      });
      executedTools.push({
        tool: 'detectFishProblem',
        input: { symptoms: message, species: effectiveSpecies },
        output: symptomResult,
        status: 'completed'
      });
    }

    // Step 4: RAG Retrieval from Aquaculture Knowledge Base
    const ragResult = ragEngine.getContextForPrompt(message);
    ragContext = ragResult.contextText;
    sources = ragResult.sources;

    if (sources.length > 0) {
      executedTools.push({
        tool: 'searchAquacultureKnowledge',
        input: { query: message },
        output: { retrievedSources: sources.length, references: sources },
        status: 'completed'
      });
    }

    // Step 5: Build Enriched Context
    let contextEnrichment = '\n=== VERIFIED POND, WATER QUALITY & DIAGNOSTIC CONTEXT ===\n';

    // A. Active Pond and Species
    contextEnrichment += `\n[ACTIVE POND & SPECIES CONTEXT]\n- Selected Pond: ${pond.name} (ID: ${pond.id})\n- Fish Species: ${effectiveSpecies.toUpperCase()} (CONFIRMED: Do NOT ask the farmer for species; already selected)\n`;

    // B. Water Quality Lab Readings
    if (hasStoredReadings) {
      contextEnrichment += `\n[WATER QUALITY LAB MEASUREMENTS (Latest Saved Records)]\n- Recorded At: ${storedReadings.recordedAt || 'Recent'}\n- Source: ${storedReadings.source || 'Water Quality Lab'}\n- Dissolved Oxygen (DO): ${storedReadings.dissolvedOxygen !== null ? `${storedReadings.dissolvedOxygen} mg/L` : 'NOT RECORDED'}\n- pH Level: ${storedReadings.ph !== null ? storedReadings.ph : 'NOT RECORDED'}\n- Total Ammonia Nitrogen (TAN): ${storedReadings.ammonia !== null ? `${storedReadings.ammonia} mg/L` : 'NOT RECORDED'}\n- Nitrite (NO2-): ${storedReadings.nitrite !== null ? `${storedReadings.nitrite} mg/L` : 'NOT RECORDED'}\n- Temperature: ${storedReadings.temperature !== null ? `${storedReadings.temperature} °C` : 'NOT RECORDED'}\n(RULE: Use these measurements directly in your assessment. Do NOT ask the farmer for measurements that are already present above.)\n`;
    } else {
      contextEnrichment += `\n[WATER QUALITY LAB MEASUREMENTS]\n- Status: NO WATER QUALITY MEASUREMENTS RECORDED ON FILE FOR THIS POND.\n(RULE: Clearly mention to the farmer that no water measurements have been recorded yet for ${pond.name}. Ask them to provide or test DO, pH, ammonia, or temperature to give an accurate evaluation. Never invent values.)\n`;
    }

    // C. Deterministic Evaluation Result
    if (waterAnalysisResult) {
      contextEnrichment += `\n[DETERMINISTIC WATER QUALITY EVALUATION]\n- Overall Health Score: ${waterAnalysisResult.overallScore}/100 (Status: ${waterAnalysisResult.status})\n- Species Evaluated: ${waterAnalysisResult.speciesEvaluated}\n- Anomalies Detected:\n${waterAnalysisResult.anomalies.map(a => `  * ${a.parameter}: ${a.value} (${a.severity}) -> ${a.issue}`).join('\n') || '  * None (All parameters within safe limits)'}\n- Corrective SOP Actions:\n${waterAnalysisResult.deterministicCorrectiveActions.map(c => `  * ${c}`).join('\n') || '  * Continue standard maintenance.'}\n`;
    }

    // D. Pathology & Disease Detection
    if (symptomResult) {
      contextEnrichment += `\n[PATHOLOGY & DISEASE DETECTION]\n- Emergency Mortality Warning: ${symptomResult.emergencyMortalityWarning ? 'YES (High Mortality Alert)' : 'No'}\n- Matched Conditions:\n${symptomResult.matchedConditions.map(m => `  * ${m.disease} (${m.confidence} confidence, Severity: ${m.severity}). Pathogen: ${m.pathogen || 'N/A'}. Treatment: ${m.treatment}`).join('\n')}\n- Advisory: ${symptomResult.veterinaryAdvisory}\n`;
    }

    // E. Verified Scientific RAG Context
    if (ragContext) {
      contextEnrichment += `\n[VERIFIED SCIENTIFIC RAG CONTEXT]\n${ragContext}\n`;
    }

    contextEnrichment += '=== END CONTEXT ===\n';

    // Format message history
    const formattedMessages = [...conversationHistory];
    const userPromptWithContext = `${message}\n\n${contextEnrichment}\n\nPlease analyze this pond situation for ${effectiveSpecies.toUpperCase()}. Reference the deterministic findings and available water quality readings, and provide clear, prioritized guidance.`;

    formattedMessages.push({
      role: 'user',
      content: userPromptWithContext
    });

    // Step 6: Execute via AI Provider Manager (Gemini or Ollama with fallback)
    const aiResult = await aiProviderManager.generateAIResponse({
      messages: formattedMessages,
      systemPrompt: SYSTEM_PROMPT,
      tools: TOOL_DEFINITIONS,
      temperature: 0.3,
      forceProvider
    });

    return {
      provider: aiResult.provider,
      model: aiResult.model,
      response: aiResult.response,
      toolExecutions: executedTools,
      sources,
      pondId: pond.id,
      pondName: pond.name,
      species: effectiveSpecies,
      waterAnalysis: waterAnalysisResult,
      diseaseDiagnosis: symptomResult,
      fallbackOccurred: aiResult.fallbackOccurred || false,
      originalProvider: aiResult.originalProvider || null,
      fallbackReason: aiResult.fallbackReason || null,
      activeMode: aiResult.activeMode,
      usage: aiResult.usage,
      timestamp: new Date().toISOString()
    };
  }
}

export const aquaCareAgent = new AquaCareAgent();
