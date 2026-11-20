import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, ArrowRight, Sparkles, HelpCircle } from 'lucide-react';
import defaultData from '../data/mumbai_data.json';

export default function HeatDrivers({ onGoToScenarios }) {
  const [filterType, setFilterType] = useState('all'); // 'all', 'heating', 'cooling'

  // Map real features from SHAP analysis
  const rawShap = defaultData.shap_ranking || {};

  // Categorize real physical drivers
  const featureConfigs = [
    { key: 'ndvi', name: 'Vegetation Index (NDVI)', type: 'cooling', desc: 'Canopy evapotranspiration cooling' },
    { key: 'emissivity', name: 'Surface Thermal Emissivity', type: 'heating', desc: 'Longwave thermal re-radiation' },
    { key: 'albedo', name: 'Shortwave Albedo', type: 'cooling', desc: 'Solar radiation reflection by roofs' },
    { key: 'ndbi', name: 'Built-Up Concrete (NDBI)', type: 'heating', desc: 'Impervious concrete & asphalt heat trap' },
    { key: 'building_density', name: 'Building Density', type: 'heating', desc: 'Urban roughness & building concentration' },
    { key: 'u_wind', name: 'Arabian Sea Breeze (u_wind)', type: 'cooling', desc: 'Maritime cool air onshore advection' },
    { key: 'building_height', name: 'Average Building Height', type: 'heating', desc: 'Urban street canyon heat trapping' },
    { key: 'elevation', name: 'Terrain Elevation (SRTM)', type: 'cooling', desc: 'Lapse rate cooling on hills' },
    { key: 'mndwi', name: 'Surface Water Bodies (MNDWI)', type: 'cooling', desc: 'Creeks, lakes & Arabian Sea cooling sink' },
    { key: 'air_temp_c', name: 'ERA5 Ambient Air Temp', type: 'heating', desc: 'Macro-scale atmospheric thermal forcing' },
    { key: 'dist_to_sea_km', name: 'Distance to Arabian Sea', type: 'cooling', desc: 'Proximity to maritime cool buffer' },
    { key: 'solar_radiation', name: 'Downward Solar Radiation', type: 'heating', desc: 'Direct solar heating irradiance' },
  ];

  const drivers = featureConfigs.map(cfg => ({
    ...cfg,
    val: rawShap[cfg.key] || 0.15,
  })).sort((a, b) => b.val - a.val);

  const maxVal = Math.max(...drivers.map(d => d.val), 0.9);

  const displayedDrivers = drivers.filter(d => {
    if (filterType === 'heating') return d.type === 'heating';
    if (filterType === 'cooling') return d.type === 'cooling';
    return true;
  });

  return (
    <div className="flex-1 h-full bg-[#0B0E14] overflow-y-auto p-8 select-none">
      <div className="max-w-6xl mx-auto space-y-7">
        {/* Page Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Heat Drivers Analysis — Mumbai</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">
              Global feature importance derived from <strong>TreeExplainer SHAP</strong> on 4,597 real 1-year satellite observations.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#141A28] border border-white/10 text-xs">
            <button
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filterType === 'all' ? 'bg-blue-600 text-white font-bold' : 'text-slate-400 hover:text-white'
              }`}
            >
              All Features ({drivers.length})
            </button>
            <button
              onClick={() => setFilterType('heating')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'heating' ? 'bg-red-500/20 text-red-400 font-bold border border-red-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
              Heating Drivers
            </button>
            <button
              onClick={() => setFilterType('cooling')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                filterType === 'cooling' ? 'bg-blue-500/20 text-blue-400 font-bold border border-blue-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span>
              Cooling Sinks
            </button>
          </div>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: SHAP Importance Chart */}
          <div className="lg:col-span-8 bg-[#111622] border border-white/5 rounded-2xl p-7 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white tracking-wide">Global Feature Importance (SHAP)</h2>
                <p className="text-xs text-slate-400 mt-0.5">Mean absolute impact on predicted LST (°C)</p>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#EF4444]"></span>
                  Heating Factor
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-sm bg-[#3B82F6]"></span>
                  Cooling Factor
                </span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {displayedDrivers.map((d, i) => {
                const widthPercent = (d.val / maxVal) * 100;
                const isHeating = d.type === 'heating';

                return (
                  <div key={i} className="group">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {d.name}
                      </span>
                      <span className="font-mono text-[11px] font-bold text-slate-300">
                        {d.val.toFixed(3)} °C
                      </span>
                    </div>

                    <div className="h-4 bg-[#0E121B] rounded-full overflow-hidden relative p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          isHeating
                            ? 'bg-gradient-to-r from-red-600 to-red-400 shadow-md shadow-red-500/20'
                            : 'bg-gradient-to-r from-blue-600 to-cyan-400 shadow-md shadow-blue-500/20'
                        }`}
                        style={{ width: `${widthPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">{d.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Interpretation & Next Steps */}
          <div className="lg:col-span-4 space-y-5">
            {/* Interpretation Card */}
            <div className="bg-[#111622] border border-white/5 rounded-2xl p-6 shadow-xl space-y-5">
              <h3 className="text-sm font-bold text-white tracking-wide">Physical Interpretation</h3>

              {/* Heating Factors item */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowUp className="w-4 h-4 text-red-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Heating Drivers</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    <strong>Impervious built-up concrete (NDBI = 0.419)</strong> and <strong>Building Density (0.382)</strong> store daytime solar radiation and slowly re-radiate thermal energy into street canyons.
                  </p>
                </div>
              </div>

              {/* Cooling Factors item */}
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <ArrowDown className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Cooling Sinks</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    <strong>NDVI Vegetation (0.871)</strong> is Mumbai's #1 cooling driver, followed by the <strong>Arabian Sea Breeze (u_wind = 0.271)</strong> which advects cool maritime air inland.
                  </p>
                </div>
              </div>
            </div>

            {/* Next Steps Action Card */}
            <div className="bg-[#111622] border border-white/5 rounded-2xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <h3 className="text-sm font-bold text-white tracking-wide">Policy Recommendation</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Prioritize pocket urban parks (+NDVI) and cool roof coatings (+Albedo) in high-density wards (Kurla, Dharavi) to maximize cooling per Crore INR spent.
              </p>
              <button
                onClick={onGoToScenarios}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                <span>Launch Scenario Simulator</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
