import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const KB_PATH = path.resolve(__dirname, 'knowledgeBase.json');

export class RAGEngine {
  constructor() {
    this.kb = this.loadKnowledgeBase();
    this.documents = this.flattenDocuments();
  }

  loadKnowledgeBase() {
    try {
      const data = fs.readFileSync(KB_PATH, 'utf-8');
      return JSON.parse(data);
    } catch (err) {
      console.error('Failed to load knowledgeBase.json:', err.message);
      return { speciesProfiles: {}, diseases: [], verifiedProcedures: [] };
    }
  }

  flattenDocuments() {
    const docs = [];

    // Flatten species
    for (const [key, spec] of Object.entries(this.kb.speciesProfiles || {})) {
      docs.push({
        id: `species_${key}`,
        type: 'species_profile',
        title: `${spec.commonName} Water Quality Standards`,
        keywords: [key, spec.commonName.toLowerCase(), 'ph', 'dissolved oxygen', 'ammonia', 'temperature', 'alkalinity'],
        content: `Species: ${spec.commonName}. Optimal pH: ${spec.optimalRange.ph.min}-${spec.optimalRange.ph.max} (Lethal: <${spec.optimalRange.ph.lethalLow} or >${spec.optimalRange.ph.lethalHigh}). Dissolved Oxygen optimal: ${spec.optimalRange.dissolvedOxygen.optimal} (Stress <${spec.optimalRange.dissolvedOxygen.stress}, Lethal <${spec.optimalRange.dissolvedOxygen.lethal}). Safe un-ionized Ammonia: <${spec.optimalRange.ammonia.safe} mg/L (Lethal >${spec.optimalRange.ammonia.lethal}). Safe Nitrite: <${spec.optimalRange.nitrite.safe} mg/L. Optimal Temp: ${spec.optimalRange.temperature.min}-${spec.optimalRange.temperature.max}°C. Notes: ${spec.criticalNotes}`,
        source: `AquaCare Aquaculture Compendium: ${spec.commonName} Guide`
      });
    }

    // Flatten diseases
    for (const dis of this.kb.diseases || []) {
      docs.push({
        id: `disease_${dis.id}`,
        type: 'disease_pathology',
        title: `${dis.name} Pathology & Intervention`,
        keywords: [
          dis.name.toLowerCase(),
          dis.pathogen.toLowerCase(),
          ...dis.symptoms.map(s => s.toLowerCase()),
          'treatment',
          'cure',
          'disease'
        ],
        content: `Disease: ${dis.name}. Pathogen: ${dis.pathogen}. Severity: ${dis.severity}. Symptoms: ${dis.symptoms.join('; ')}. Verified Treatments: ${dis.treatments.join('; ')}. Prevention: ${dis.prevention}`,
        source: `AquaCare Fish Pathology Manual: Section ${dis.name}`
      });
    }

    // Flatten procedures
    for (const proc of this.kb.verifiedProcedures || []) {
      docs.push({
        id: `procedure_${proc.name.toLowerCase().replace(/[^a-z0-9]/g, '_')}`,
        type: 'verified_procedure',
        title: `Protocol: ${proc.name}`,
        keywords: [proc.name.toLowerCase(), 'steps', 'protocol', 'how to', 'emergency'],
        content: `Standard Operating Procedure: ${proc.name}. Steps: ${proc.steps.join(' ')}`,
        source: `AquaCare SOP: ${proc.name}`
      });
    }

    return docs;
  }

  /**
   * Search knowledge base using weighted keyword matching
   */
  search(query, options = {}) {
    if (!query || typeof query !== 'string') {
      return { matches: [], totalFound: 0, query: '' };
    }

    const { limit = 3, minScore = 2 } = options;
    const cleanTokens = query
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(t => t.length > 2);

    const scored = this.documents.map(doc => {
      let score = 0;
      const titleLower = doc.title.toLowerCase();
      const contentLower = doc.content.toLowerCase();

      for (const token of cleanTokens) {
        // Exact token matches in title
        if (titleLower.includes(token)) score += 5;
        // Exact keyword matches
        if (doc.keywords.some(k => k.includes(token))) score += 4;
        // Content matches
        if (contentLower.includes(token)) score += 1.5;
      }

      // Bonus for phrase match
      if (query.length > 4 && (titleLower.includes(query.toLowerCase()) || contentLower.includes(query.toLowerCase()))) {
        score += 8;
      }

      return { ...doc, score };
    });

    const filtered = scored
      .filter(d => d.score >= minScore)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return {
      query,
      totalFound: filtered.length,
      matches: filtered.map(f => ({
        id: f.id,
        title: f.title,
        content: f.content,
        source: f.source,
        score: f.score
      }))
    };
  }

  /**
   * Retrieve grounded context string for LLM injection
   */
  getContextForPrompt(query) {
    const searchRes = this.search(query, { limit: 3 });

    if (searchRes.matches.length === 0) {
      return {
        contextText: 'No specific aquaculture documents matched this query with high confidence in the verified local knowledge base.',
        sources: []
      };
    }

    const contextText = searchRes.matches
      .map((m, idx) => `[Source ${idx + 1}: ${m.source}]\n${m.content}`)
      .join('\n\n');

    const sources = searchRes.matches.map(m => m.source);

    return { contextText, sources };
  }
}

export const ragEngine = new RAGEngine();

