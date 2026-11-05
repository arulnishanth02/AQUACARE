import { aiProviderManager } from '../ai/aiProviderManager.js';
import { TOOL_DISPATCHER, TOOL_DEFINITIONS, analyzeWaterQuality, detectFishProblem } from './tools.js';
import { ragEngine } from './ragEngine.js';

const SYSTEM_PROMPT = `You are AquaCare AI, an expert, certified aquaculture specialist and aquatic veterinarian assistant.
Your mission is to help fish farmers detect pond problems accurately and recommend safe, grounded solutions.

CRITICAL RULES:
1. SAFETY-CRITICAL VALUES: Water quality calculations and threshold evaluations have already been computed deterministically by the backend. Never contradict the deterministic backend tool results.
2. GROUNDING: Base all treatments, medication dosages, and salt bath ratios ONLY on verified scientific aquaculture standards. Never invent chemical dosages or toxic pesticides.
3. FOLLOW-UPS: If essential information is missing (such as fish species, pond volume, dissolved oxygen, or pH), ask targeted follow-up questions.
4. EMERGENCY PROTOCOL: If fish are dying rapidly (>5% mortality) or showing acute asphyxiation/gasping, highlight urgent emergency actions in bold, and advise consulting a local aquatic health professional.
5. TONE: Professional, supportive, practical for farmers, scientifically sound.
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

    // Species detection
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

    // Step 1: Detect if water quality parameters are present
    const extractedParams = this.extractParametersFromText(message);
    if (speciesOverride) extractedParams.species = speciesOverride;

    const hasWaterParams = extractedParams.ph !== undefined ||
      extractedParams.dissolvedOxygen !== undefined ||
      extractedParams.ammonia !== undefined ||
      extractedParams.nitrite !== undefined ||
      extractedParams.temperature !== undefined;

    let waterAnalysisResult = null;
    if (hasWaterParams) {
      waterAnalysisResult = analyzeWaterQuality(extractedParams);
      executedTools.push({
        tool: 'analyzeWaterQuality',
        input: extractedParams,
        output: waterAnalysisResult,
        status: 'completed'
      });
    }

    // Step 2: Detect fish pathology symptoms
    const symptomKeywords = ['spot', 'white', 'gasping', 'surface', 'dying', 'dead', 'bloat', 'fin', 'rot', 'mouth', 'scratch', 'rubbing', 'erratic', 'brown'];
    const hasSymptoms = symptomKeywords.some(k => message.toLowerCase().includes(k));

    let symptomResult = null;
    if (hasSymptoms) {
      symptomResult = detectFishProblem({
        symptoms: message,
        species: extractedParams.species || speciesOverride || 'Tilapia'
      });
      executedTools.push({
        tool: 'detectFishProblem',
        input: { symptoms: message, species: extractedParams.species || speciesOverride || 'Tilapia' },
        output: symptomResult,
        status: 'completed'
      });
    }

    // Step 3: RAG Retrieval from Aquaculture Knowledge Base
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

    // Step 4: Build enriched prompt with deterministic tool outputs
    let contextEnrichment = '\n=== VERIFIED DETERMINISTIC BACKEND TOOL OUTPUTS ===\n';

    if (waterAnalysisResult) {
      contextEnrichment += `\n[WATER QUALITY EVALUATION]\nStatus: ${waterAnalysisResult.status} (Health Score: ${waterAnalysisResult.overallScore}/100)\nSpecies: ${waterAnalysisResult.speciesEvaluated}\nAnomalies Detected:\n${waterAnalysisResult.anomalies.map(a => `- ${a.parameter}: ${a.value} (${a.severity}) -> ${a.issue}`).join('\n')}\nDeterministic Corrective Actions:\n${waterAnalysisResult.deterministicCorrectiveActions.map(c => `- ${c}`).join('\n')}\n`;
    }

    if (symptomResult) {
      contextEnrichment += `\n[PATHOLOGY & DISEASE DETECTION]\nEmergency Warning: ${symptomResult.emergencyMortalityWarning ? 'YES (High Mortality)' : 'No'}\nMatched Conditions:\n${symptomResult.matchedConditions.map(m => `- ${m.disease} (${m.confidence} confidence, Severity: ${m.severity}). Treatment: ${m.treatment}`).join('\n')}\n`;
    }

    if (ragContext) {
      contextEnrichment += `\n[VERIFIED SCIENTIFIC RAG CONTEXT]\n${ragContext}\n`;
    }

    contextEnrichment += '=== END BACKEND DATA ===\n';

    // Format message history
    const formattedMessages = [...conversationHistory];
    const userPromptWithContext = `${message}\n\n${contextEnrichment}\n\nPlease analyze this pond situation. Reference the deterministic findings and provide clear, prioritized steps for the farmer.`;

    formattedMessages.push({
      role: 'user',
      content: userPromptWithContext
    });

    // Step 5: Execute via AI Provider Manager (handles Mode, Health, and Fallback)
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

