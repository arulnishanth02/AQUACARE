import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PONDS_FILE = path.resolve(__dirname, 'ponds_data.json');

const INITIAL_PONDS = [
  {
    id: 'pond-1',
    name: 'North Nursery Pond 1',
    species: 'tilapia',
    volumeLiters: 50000,
    currentStock: 2500,
    createdAt: new Date().toISOString(),
    lastWaterQuality: {
      ph: 7.2,
      dissolvedOxygen: 5.5,
      ammonia: 0.04,
      nitrite: 0.02,
      temperature: 28.0,
      recordedAt: new Date(Date.now() - 3600000).toISOString(),
      source: 'Water Quality Lab'
    },
    history: [
      {
        ph: 7.2,
        dissolvedOxygen: 5.5,
        ammonia: 0.04,
        nitrite: 0.02,
        temperature: 28.0,
        recordedAt: new Date(Date.now() - 3600000).toISOString(),
        source: 'Water Quality Lab'
      },
      {
        ph: 7.4,
        dissolvedOxygen: 5.8,
        ammonia: 0.03,
        nitrite: 0.01,
        temperature: 27.8,
        recordedAt: new Date(Date.now() - 86400000).toISOString(),
        source: 'Water Quality Lab'
      }
    ]
  },
  {
    id: 'pond-2',
    name: 'Grow-Out Pond 2 (Commercial Catfish)',
    species: 'catfish',
    volumeLiters: 150000,
    currentStock: 4800,
    createdAt: new Date().toISOString(),
    lastWaterQuality: {
      ph: 7.0,
      dissolvedOxygen: 4.2,
      ammonia: 0.15,
      nitrite: 0.08,
      temperature: 29.5,
      recordedAt: new Date(Date.now() - 7200000).toISOString(),
      source: 'Water Quality Lab'
    },
    history: [
      {
        ph: 7.0,
        dissolvedOxygen: 4.2,
        ammonia: 0.15,
        nitrite: 0.08,
        temperature: 29.5,
        recordedAt: new Date(Date.now() - 7200000).toISOString(),
        source: 'Water Quality Lab'
      }
    ]
  },
  {
    id: 'pond-3',
    name: 'Polyculture Carp Pond 3',
    species: 'carp',
    volumeLiters: 200000,
    currentStock: 6000,
    createdAt: new Date().toISOString(),
    lastWaterQuality: {
      ph: 7.5,
      dissolvedOxygen: 5.8,
      ammonia: 0.03,
      nitrite: 0.02,
      temperature: 26.5,
      recordedAt: new Date(Date.now() - 14400000).toISOString(),
      source: 'Water Quality Lab'
    },
    history: [
      {
        ph: 7.5,
        dissolvedOxygen: 5.8,
        ammonia: 0.03,
        nitrite: 0.02,
        temperature: 26.5,
        recordedAt: new Date(Date.now() - 14400000).toISOString(),
        source: 'Water Quality Lab'
      }
    ]
  },
  {
    id: 'pond-new',
    name: 'Pond 4 (New / Unmonitored)',
    species: 'shrimp',
    volumeLiters: 80000,
    currentStock: 10000,
    createdAt: new Date().toISOString(),
    lastWaterQuality: null,
    history: []
  }
];

class PondStore {
  constructor() {
    this.ponds = [];
    this.load();
  }

  load() {
    try {
      if (fs.existsSync(PONDS_FILE)) {
        const raw = fs.readFileSync(PONDS_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          this.ponds = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Could not read ponds data file, initializing defaults:', err.message);
    }

    this.ponds = JSON.parse(JSON.stringify(INITIAL_PONDS));
    this.save();
  }

  save() {
    try {
      fs.writeFileSync(PONDS_FILE, JSON.stringify(this.ponds, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist ponds data:', err.message);
    }
  }

  getAllPonds() {
    return this.ponds.map(p => ({
      id: p.id,
      name: p.name,
      species: p.species,
      volumeLiters: p.volumeLiters,
      currentStock: p.currentStock,
      lastWaterQuality: p.lastWaterQuality
    }));
  }

  getPond(pondId = 'pond-1') {
    return this.ponds.find(p => p.id === pondId) || null;
  }

  updatePond(pondId, updates = {}) {
    const pond = this.getPond(pondId);
    if (!pond) return null;

    if (updates.name) pond.name = updates.name;
    if (updates.species) pond.species = updates.species.toLowerCase();
    if (updates.volumeLiters) pond.volumeLiters = Number(updates.volumeLiters);
    if (updates.currentStock) pond.currentStock = Number(updates.currentStock);

    this.save();
    return pond;
  }

  /**
   * Retrieves the latest available water quality measurements for a pond
   */
  getLatestWaterQuality(pondId = 'pond-1') {
    const pond = this.getPond(pondId);
    if (!pond || !pond.lastWaterQuality) return null;
    return {
      pondId: pond.id,
      pondName: pond.name,
      species: pond.species,
      ...pond.lastWaterQuality
    };
  }

  /**
   * Retrieves historical readings for a pond
   */
  getWaterQualityHistory(pondId = 'pond-1', limit = 10) {
    const pond = this.getPond(pondId);
    if (!pond) return [];
    const history = pond.history || [];
    return history.slice(-limit).reverse();
  }

  /**
   * Saves a new water quality measurement record to a pond
   */
  saveWaterQualityReading(pondId = 'pond-1', reading = {}) {
    let pond = this.getPond(pondId);
    if (!pond) {
      // If pond doesn't exist, create it
      pond = {
        id: pondId,
        name: `Pond (${pondId})`,
        species: (reading.species || 'tilapia').toLowerCase(),
        volumeLiters: 50000,
        currentStock: 2000,
        createdAt: new Date().toISOString(),
        lastWaterQuality: null,
        history: []
      };
      this.ponds.push(pond);
    }

    if (reading.species) {
      pond.species = reading.species.toLowerCase();
    }

    const newRecord = {
      ph: reading.ph !== undefined && reading.ph !== null ? Number(reading.ph) : null,
      dissolvedOxygen: reading.dissolvedOxygen !== undefined && reading.dissolvedOxygen !== null ? Number(reading.dissolvedOxygen) : null,
      ammonia: reading.ammonia !== undefined && reading.ammonia !== null ? Number(reading.ammonia) : null,
      nitrite: reading.nitrite !== undefined && reading.nitrite !== null ? Number(reading.nitrite) : null,
      temperature: reading.temperature !== undefined && reading.temperature !== null ? Number(reading.temperature) : null,
      recordedAt: reading.recordedAt || new Date().toISOString(),
      source: reading.source || 'Water Quality Lab'
    };

    pond.lastWaterQuality = newRecord;
    if (!Array.isArray(pond.history)) pond.history = [];
    pond.history.push(newRecord);

    this.save();
    return {
      pondId: pond.id,
      pondName: pond.name,
      species: pond.species,
      ...newRecord
    };
  }
}

export const pondStore = new PondStore();

