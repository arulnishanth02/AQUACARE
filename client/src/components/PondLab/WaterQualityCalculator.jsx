import React, { useState, useEffect } from 'react';
import { apiClient } from '../../api/client';
import { Activity, AlertTriangle, CheckCircle2, ShieldCheck, ArrowRight, RefreshCw, Thermometer, Droplets } from 'lucide-react';

export default function WaterQualityCalculator({ onSendToChat }) {
  const [species, setSpecies] = useState('tilapia');
  const [ph, setPh] = useState(7.2);
  const [dissolvedOxygen, setDissolvedOxygen] = useState(5.5);
  const [ammonia, setAmmonia] = useState(0.04);
  const [nitrite, setNitrite] = useState(0.02);
  const [temperature, setTemperature] = useState(28.0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      const data = await apiClient.analyzePond({
        species,
        ph: Number(ph),
        dissolvedOxygen: Number(dissolvedOxygen),
        ammonia: Number(ammonia),
        nitrite: Number(nitrite),
        temperature: Number(temperature)
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
  }, [species, ph, dissolvedOxygen, ammonia, nitrite, temperature]);

  const handleConsultDoctor = () => {
    const prompt = `Please review my ${species.toUpperCase()} pond water parameters: pH is ${ph}, Dissolved Oxygen is ${dissolvedOxygen} mg/L, Total Ammonia is ${ammonia} mg/L, Nitrite is ${nitrite} mg/L, and Temperature is ${temperature} °C. The deterministic health score is ${result?.overallScore || 'unknown'}/100 with status ${result?.status || 'unknown'}. What is the recommended treatment plan?`;
    onSendToChat(prompt);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between p-6 rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Activity className="w-5 h-5 text-teal-400" />
            <h2 className="text-xl font-bold text-slate-100">Deterministic Water Quality Lab</h2>
          </div>
          <p className="text-xs text-slate-400">
            Calculated by verified biological thresholds. Never hallucinated by an LLM.
          </p>
        </div>

        <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-4 h-4" /> 100% Deterministic Engine
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Sliders Form (7 cols) */}
        <div className="md:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 space-y-5 shadow-lg">
          {/* Species */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-2">
              Fish / Aquatic Species
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['tilapia', 'catfish', 'carp', 'shrimp'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSpecies(s)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold capitalize transition-all ${
                    species === s
                      ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                      : 'border-slate-800 bg-slate-950 text-slate-400 hover:border-slate-700'
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
              <span className="text-slate-300">pH Level</span>
              <span className="font-mono text-teal-400">{ph}</span>
            </div>
            <input
              type="range"
              min="4.0"
              max="11.0"
              step="0.1"
              value={ph}
              onChange={(e) => setPh(e.target.value)}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span>Acidic (4.0)</span>
              <span>Neutral (7.0)</span>
              <span>Alkaline (11.0)</span>
            </div>
          </div>

          {/* Dissolved Oxygen */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Dissolved Oxygen (DO)</span>
              <span className="font-mono text-teal-400">{dissolvedOxygen} mg/L</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="12.0"
              step="0.1"
              value={dissolvedOxygen}
              onChange={(e) => setDissolvedOxygen(e.target.value)}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span className="text-rose-400">Lethal (&lt;1.5)</span>
              <span className="text-amber-400">Stress (3.0)</span>
              <span className="text-emerald-400">Optimal (&gt;5.0)</span>
            </div>
          </div>

          {/* Ammonia */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Total Ammonia (TAN)</span>
              <span className="font-mono text-teal-400">{ammonia} mg/L</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="3.0"
              step="0.02"
              value={ammonia}
              onChange={(e) => setAmmonia(e.target.value)}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span className="text-emerald-400">Safe (&lt;0.05)</span>
              <span className="text-amber-400">Warning (0.2)</span>
              <span className="text-rose-400">Toxic (&gt;0.5)</span>
            </div>
          </div>

          {/* Nitrite */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Nitrite (NO2-)</span>
              <span className="font-mono text-teal-400">{nitrite} mg/L</span>
            </div>
            <input
              type="range"
              min="0.0"
              max="2.0"
              step="0.02"
              value={nitrite}
              onChange={(e) => setNitrite(e.target.value)}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
              <span className="text-emerald-400">Safe (&lt;0.1)</span>
              <span className="text-rose-400">Brown Blood Risk (&gt;0.5)</span>
            </div>
          </div>

          {/* Temperature */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span className="text-slate-300">Temperature</span>
              <span className="font-mono text-teal-400">{temperature} °C</span>
            </div>
            <input
              type="range"
              min="15.0"
              max="38.0"
              step="0.5"
              value={temperature}
              onChange={(e) => setTemperature(e.target.value)}
              className="w-full accent-teal-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Results Card (5 cols) */}
        <div className="md:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 flex flex-col justify-between shadow-lg">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-4">
              Real-Time Diagnostic Score
            </h3>

            {/* Score Ring / Pill */}
            {result && (
              <div className="text-center p-6 rounded-2xl bg-slate-950 border border-slate-800 mb-5">
                <div
                  className={`text-5xl font-black mb-1 font-mono ${
                    result.overallScore < 50
                      ? 'text-rose-400'
                      : result.overallScore < 80
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {result.overallScore}
                  <span className="text-lg text-slate-500 font-normal">/100</span>
                </div>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase ${
                    result.status === 'CRITICAL'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : result.status === 'WARNING'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {result.status}
                </span>
                <p className="text-[11px] text-slate-400 mt-2">
                  Evaluation for {result.speciesEvaluated}
                </p>
              </div>
            )}

            {/* Anomalies List */}
            {result?.anomalies && result.anomalies.length > 0 ? (
              <div className="space-y-2 mb-4">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Detected Stress Hazards ({result.anomalies.length}):
                </span>
                <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                  {result.anomalies.map((anom, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle
                        className={`w-4 h-4 shrink-0 mt-0.5 ${
                          anom.severity === 'CRITICAL' ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      />
                      <div>
                        <div className="font-semibold text-slate-200">
                          {anom.parameter} ({anom.value})
                        </div>
                        <p className="text-[11px] text-slate-400">{anom.issue}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 mb-4">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All parameters are safely within the optimal growth range!</span>
              </div>
            )}
          </div>

          {/* Action to transfer to Chat */}
          <button
            onClick={handleConsultDoctor}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-teal-900/30 transition-all mt-4"
          >
            <span>Consult AI Doctor on These Readings</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

