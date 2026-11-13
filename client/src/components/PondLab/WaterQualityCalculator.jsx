import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { usePond } from '../../context/PondContext';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Thermometer,
  Droplets,
  Layers,
  Save
} from 'lucide-react';

export default function WaterQualityCalculator({ onSendToChat }) {
  const {
    selectedPondId,
    selectedSpecies,
    updateSelectedSpecies,
    updateSelectedPond,
    ponds,
    activePond,
    saveReadings,
    latestWaterQuality
  } = usePond();

  const [ph, setPh] = useState(7.2);
  const [dissolvedOxygen, setDissolvedOxygen] = useState(5.5);
  const [ammonia, setAmmonia] = useState(0.04);
  const [nitrite, setNitrite] = useState(0.02);
  const [temperature, setTemperature] = useState(28.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sync state with selected pond readings on mount or pond change
  useEffect(() => {
    if (activePond?.lastWaterQuality) {
      const l = activePond.lastWaterQuality;
      if (l.ph !== null) setPh(Number(l.ph));
      if (l.dissolvedOxygen !== null) setDissolvedOxygen(Number(l.dissolvedOxygen));
      if (l.ammonia !== null) setAmmonia(Number(l.ammonia));
      if (l.nitrite !== null) setNitrite(Number(l.nitrite));
      if (l.temperature !== null) setTemperature(Number(l.temperature));
    }
  }, [selectedPondId, activePond]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const data = await apiClient.analyzePond({
        pondId: selectedPondId,
        species: selectedSpecies,
        ph: Number(ph),
        dissolvedOxygen: Number(dissolvedOxygen),
        ammonia: Number(ammonia),
        nitrite: Number(nitrite),
        temperature: Number(temperature),
        save: true
      });
      if (data.success) {
        setResult(data.result);
      }
    } catch (err) {
      console.error('Failed to run water analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runAnalysis();
  }, [selectedSpecies, ph, dissolvedOxygen, ammonia, nitrite, temperature]);

  const handleSaveToPond = async () => {
    try {
      await saveReadings({
        ph: Number(ph),
        dissolvedOxygen: Number(dissolvedOxygen),
        ammonia: Number(ammonia),
        nitrite: Number(nitrite),
        temperature: Number(temperature),
        source: 'Water Quality Lab'
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Save failed:', err);
    }
  };

  const handleConsultDoctor = async () => {
    // Save latest measurements to pond before navigating to chat
    try {
      await saveReadings({
        ph: Number(ph),
        dissolvedOxygen: Number(dissolvedOxygen),
        ammonia: Number(ammonia),
        nitrite: Number(nitrite),
        temperature: Number(temperature),
        source: 'Water Quality Lab'
      });
    } catch (err) {
      console.warn('Auto-save before chat transfer had a warning:', err);
    }

    const prompt = `Please review my ${selectedSpecies.toUpperCase()} pond water parameters for ${activePond?.name || 'my pond'}: pH is ${ph}, Dissolved Oxygen is ${dissolvedOxygen} mg/L, Total Ammonia is ${ammonia} mg/L, Nitrite is ${nitrite} mg/L, and Temperature is ${temperature} °C. The deterministic health score is ${result?.overallScore || 'unknown'}/100 with status ${result?.status || 'unknown'}. What is the recommended treatment plan?`;
    onSendToChat(prompt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title & Pond Context */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 shadow-xl transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-teal-600 dark:text-teal-400" />
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Deterministic Water Quality Lab</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Calculated by verified biological thresholds. Automatically synchronized with AI Pond Doctor.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Pond Selector */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700">
              <Layers className="w-4 h-4 text-teal-600 dark:text-teal-400" />
              <select
                value={selectedPondId}
                onChange={(e) => updateSelectedPond(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-900 dark:text-slate-100 focus:outline-none cursor-pointer"
              >
                {ponds.map((p) => (
                  <option key={p.id} value={p.id} className="dark:bg-slate-900 text-slate-900 dark:text-slate-100">
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <ShieldCheck className="w-4 h-4" /> 100% Deterministic Engine
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sliders Form (7 cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 space-y-5 shadow-lg transition-colors">
          {/* Species */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Fish / Aquatic Species (Selected: {selectedSpecies.toUpperCase()})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['tilapia', 'catfish', 'carp', 'shrimp'].map((s) => (
                <button
                  key={s}
                  onClick={() => updateSelectedSpecies(s)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    selectedSpecies === s
                      ? 'border-teal-500 bg-teal-50 dark:bg-teal-500/20 text-teal-700 dark:text-teal-300 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* pH Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">pH Level</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{ph}</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="11.0"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Acidic (4.0)</span>
              <span>Optimal (6.5 - 8.5)</span>
              <span>Alkaline (11.0)</span>
            </div>
          </div>

          {/* Dissolved Oxygen Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Dissolved Oxygen (DO)</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{dissolvedOxygen} mg/L</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.1"
              value={dissolvedOxygen}
              onChange={(e) => setDissolvedOxygen(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Hypoxia (&lt;2.0)</span>
              <span>Warning (&lt;3.5)</span>
              <span>Optimal (&gt;5.0 mg/L)</span>
            </div>
          </div>

          {/* Ammonia Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Total Ammonia Nitrogen (TAN)</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{ammonia} mg/L</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="2.50"
              step="0.02"
              value={ammonia}
              onChange={(e) => setAmmonia(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Safe (&lt;0.05)</span>
              <span>Stress (&gt;0.2)</span>
              <span>Lethal (&gt;0.5 mg/L)</span>
            </div>
          </div>

          {/* Nitrite Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Nitrite (NO2-)</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{nitrite} mg/L</span>
            </div>
            <input
              type="range"
              min="0.00"
              max="2.50"
              step="0.02"
              value={nitrite}
              onChange={(e) => setNitrite(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Safe (&lt;0.1)</span>
              <span>Warning (&gt;0.5)</span>
              <span>Toxic (&gt;1.0 mg/L)</span>
            </div>
          </div>

          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-700 dark:text-slate-300">Water Temperature</span>
              <span className="font-mono text-teal-600 dark:text-teal-400">{temperature} °C</span>
            </div>
            <input
              type="range"
              min="16.0"
              max="38.0"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-teal-500 h-2 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
              <span>Cold (16°C)</span>
              <span>Growth Range (26 - 32°C)</span>
              <span>Extreme (38°C)</span>
            </div>
          </div>

          {/* Explicit Save Action */}
          <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={handleSaveToPond}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs border border-slate-200 dark:border-slate-700 transition-colors"
            >
              <Save className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400" />
              <span>Save Readings to {activePond?.name || 'Pond'}</span>
            </button>

            {savedSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium animate-fadeIn">
                <CheckCircle2 className="w-4 h-4" />
                <span>Saved to database!</span>
              </span>
            )}
          </div>
        </div>

        {/* Diagnosis & Recommendations (5 cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-6 flex flex-col justify-between shadow-lg transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Pond Water Health Score
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {activePond?.name || 'Pond 1'}
              </span>
            </div>

            {/* Score Ring / Pill */}
            {result && (
              <div className="text-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 mb-5">
                <div
                  className={`text-5xl font-black mb-1 font-mono ${
                    result.overallScore < 50
                      ? 'text-rose-600 dark:text-rose-400'
                      : result.overallScore < 80
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {result.overallScore}
                  <span className="text-lg text-slate-400 dark:text-slate-500 font-normal">/100</span>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                    result.status === 'CRITICAL'
                      ? 'bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/40'
                      : result.status === 'WARNING'
                      ? 'bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-500/40'
                      : 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/40'
                  }`}
                >
                  {result.status}
                </span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  Evaluation for {result.speciesEvaluated}
                </p>
              </div>
            )}

            {/* Anomalies List */}
            {result?.anomalies && result.anomalies.length > 0 ? (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Detected Stress Hazards ({result.anomalies.length}):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {result.anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          anom.severity === 'CRITICAL' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {anom.parameter} ({anom.value})
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{anom.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All parameters are safely within the optimal growth range!</span>
              </div>
            )}
          </div>

          {/* Action to transfer to Chat */}
          <button
            onClick={handleConsultDoctor}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-900/20 transition-all mt-4"
          >
            <span>Consult AI Doctor on These Readings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
