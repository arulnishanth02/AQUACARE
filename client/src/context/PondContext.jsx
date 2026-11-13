import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiClient } from '../api/client';

const PondContext = createContext(null);

export function PondProvider({ children }) {
  const [selectedPondId, setSelectedPondId] = useState(() => {
    return localStorage.getItem('aquacare_pond_id') || 'pond-1';
  });

  const [selectedSpecies, setSelectedSpecies] = useState(() => {
    return localStorage.getItem('aquacare_species') || 'tilapia';
  });

  const [ponds, setPonds] = useState([]);
  const [latestWaterQuality, setLatestWaterQuality] = useState(null);
  const [loadingPonds, setLoadingPonds] = useState(true);

  // Load all ponds from backend
  const loadPonds = useCallback(async () => {
    try {
      setLoadingPonds(true);
      const res = await apiClient.getAllPonds();
      if (res.success && Array.isArray(res.ponds)) {
        setPonds(res.ponds);

        // Find active pond
        const active = res.ponds.find(p => p.id === selectedPondId) || res.ponds[0];
        if (active) {
          if (active.lastWaterQuality) {
            setLatestWaterQuality(active.lastWaterQuality);
          }
          // If no custom species saved, use pond's species
          if (!localStorage.getItem('aquacare_species') && active.species) {
            setSelectedSpecies(active.species);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to fetch ponds from server:', err.message);
    } finally {
      setLoadingPonds(false);
    }
  }, [selectedPondId]);

  useEffect(() => {
    loadPonds();
  }, [loadPonds]);

  // Update selected pond
  const updateSelectedPond = (pondId) => {
    setSelectedPondId(pondId);
    localStorage.setItem('aquacare_pond_id', pondId);

    const found = ponds.find(p => p.id === pondId);
    if (found) {
      if (found.species) {
        setSelectedSpecies(found.species);
        localStorage.setItem('aquacare_species', found.species);
      }
      setLatestWaterQuality(found.lastWaterQuality || null);
    }
  };

  // Update selected fish species
  const updateSelectedSpecies = (species) => {
    const clean = String(species || 'tilapia').toLowerCase();
    setSelectedSpecies(clean);
    localStorage.setItem('aquacare_species', clean);
  };

  // Save new water quality readings from Lab
  const saveReadings = async (readingData) => {
    try {
      const payload = {
        pondId: selectedPondId,
        species: selectedSpecies,
        ...readingData
      };
      const data = await apiClient.savePondReadings(payload);
      if (data.success && data.savedRecord) {
        setLatestWaterQuality(data.savedRecord);
        // Refresh ponds list
        await loadPonds();
        return data;
      }
    } catch (err) {
      console.error('Failed to save pond water readings:', err);
      throw err;
    }
  };

  const activePond = ponds.find(p => p.id === selectedPondId) || {
    id: selectedPondId,
    name: `Pond (${selectedPondId})`,
    species: selectedSpecies,
    lastWaterQuality: latestWaterQuality
  };

  return (
    <PondContext.Provider
      value={{
        selectedPondId,
        selectedSpecies,
        ponds,
        activePond,
        latestWaterQuality,
        loadingPonds,
        updateSelectedPond,
        updateSelectedSpecies,
        refreshPonds: loadPonds,
        saveReadings
      }}
    >
      {children}
    </PondContext.Provider>
  );
}

export function usePond() {
  const ctx = useContext(PondContext);
  if (!ctx) {
    throw new Error('usePond must be used within a PondProvider');
  }
  return ctx;
}

