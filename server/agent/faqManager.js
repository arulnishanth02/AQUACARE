import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FAQS_FILE = path.resolve(__dirname, '../data/faqs.json');

export class FAQManager {
  constructor() {
    this.faqs = this.loadFaqs();
  }

  loadFaqs() {
    try {
      if (fs.existsSync(FAQS_FILE)) {
        const raw = fs.readFileSync(FAQS_FILE, 'utf-8');
        return JSON.parse(raw);
      }
      console.warn('faqs.json not found at:', FAQS_FILE);
      return [];
    } catch (err) {
      console.error('Failed to load faqs.json:', err.message);
      return [];
    }
  }

  /**
   * Return all unique categories with counts
   */
  getCategories() {
    const counts = {};
    for (const faq of this.faqs) {
      counts[faq.category] = (counts[faq.category] || 0) + 1;
    }

    const categories = Object.keys(counts).map(name => ({
      name,
      count: counts[name]
    }));

    return {
      total: this.faqs.length,
      categories
    };
  }

  /**
   * Filter and search FAQs
   */
  getFaqs(options = {}) {
    const { category, search, severity } = options;
    let filtered = [...this.faqs];

    // Filter by Category
    if (category && category.toLowerCase() !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(f => f.category.toLowerCase() === catLower);
    }

    // Filter by Severity
    if (severity && severity.toLowerCase() !== 'all') {
      const sevLower = severity.toLowerCase();
      filtered = filtered.filter(f => f.severity.toLowerCase() === sevLower);
    }

    // Filter by Search Query
    if (search && typeof search === 'string' && search.trim().length > 0) {
      const tokens = search.toLowerCase().trim().split(/\s+/);
      filtered = filtered.filter(f => {
        const searchableText = [
          f.title,
          f.shortDescription,
          f.overview,
          f.category,
          ...(f.symptoms || []),
          ...(f.possibleCauses || [])
        ].join(' ').toLowerCase();

        return tokens.every(token => searchableText.includes(token));
      });
    }

    // Return sanitized summary objects for card listing
    return filtered.map(f => ({
      id: f.id,
      title: f.title,
      category: f.category,
      severity: f.severity,
      shortDescription: f.shortDescription,
      symptomsPreview: (f.symptoms || []).slice(0, 2),
      referencesCount: (f.references || []).length
    }));
  }

  /**
   * Retrieve full details of an FAQ by ID
   */
  getFaqById(id) {
    if (!id || typeof id !== 'string') return null;

    const targetId = id.toLowerCase().trim();
    const faq = this.faqs.find(f => f.id.toLowerCase() === targetId);
    if (!faq) return null;

    // Resolve related FAQs with brief metadata for easy navigation
    const relatedFaqsDetails = (faq.relatedFaqs || []).map(relId => {
      const related = this.faqs.find(f => f.id.toLowerCase() === relId.toLowerCase());
      if (related) {
        return {
          id: related.id,
          title: related.title,
          category: related.category,
          severity: related.severity,
          shortDescription: related.shortDescription
        };
      }
      return null;
    }).filter(Boolean);

    return {
      ...faq,
      relatedFaqsDetails
    };
  }
}

export const faqManager = new FAQManager();

