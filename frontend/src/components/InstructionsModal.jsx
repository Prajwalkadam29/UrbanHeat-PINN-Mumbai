import React from 'react';
import { X, BookOpen, Cpu, Globe, Scale } from 'lucide-react';
import data from '../data/mumbai_data.json';

export default function InstructionsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const pinn = data.models?.pinn || {};
  const baseline = data.models?.baseline || {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-[#0F131C] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#1E2536]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">System Instructions & Physics Specification</h2>
              <p className="text-xs text-slate-400">Physics-Informed Neural Network (PINN) for Mumbai Urban Heat Island Mitigation</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1E2536] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs leading-relaxed text-slate-300">
          {/* Section 1: Overview */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-400" />
              1. Project Overview & Multi-Month Satellite Ingestion
            </h3>
            <p>
              This industry-grade dashboard visualizes <strong>4,597 co-registered Landsat 8/9, Sentinel-2, MODIS, and ERA5 pixels</strong> across the Mumbai Metropolitan Region (MMR). Spanning the intense dry and heatwave season (Nov 2023 – Mar 2024), temperatures range from <strong>26.6°C to 43.4°C</strong>, with an average urban heat island intensity of <strong>+10.6°C</strong> over rural baselines.
            </p>
          </div>

          {/* Section 2: Physics Formulation */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              2. 2D Advection-Diffusion Heat Equation (PINN)
            </h3>
            <p>
              Unlike purely empirical black-box algorithms, our deep neural network minimizes a dual loss function:
            </p>
            <div className="p-3.5 rounded-xl bg-[#141A28] border border-white/5 font-mono text-[11px] text-blue-300 space-y-1">
              <div>Loss = MSE(T_pred, T_true) + λ_physics · Residual²</div>
              <div className="text-slate-400">Residual = ∂T/∂t - α·∇²T + (u_eff·∂T/∂x + v_eff·∂T/∂y) + λ_exch·(T - T_air) - S</div>
              <div className="text-slate-400">u_eff = u_wind · exp(-dist_to_sea / k_d)</div>
            </div>
            <p className="text-slate-400 text-[11px]">
              The network dynamically discovers physical constants: effective thermal diffusivity (<strong>α = 0.052</strong>) and sea-breeze inland decay length scale (<strong>k_d = 7.91 km</strong>).
            </p>
          </div>

          {/* Section 3: Model Ablation Benchmarks */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-400" />
              3. Spatial Holdout Validation (Zone 4 - Eastern Suburbs)
            </h3>
            <p>
              To eliminate spatial data leakage, 836 pixels in Zone 4 (Kurla, Chembur, Govandi) were held out entirely during training:
            </p>
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="p-3 rounded-xl bg-[#141A28] border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">Random Forest</span>
                <span className="text-sm font-bold text-white">1.645°C RMSE</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141A28] border border-white/5">
                <span className="text-[10px] text-slate-400 block uppercase">XGBoost</span>
                <span className="text-sm font-bold text-white">1.689°C RMSE</span>
              </div>
              <div className="p-3 rounded-xl bg-[#141A28] border border-blue-500/30">
                <span className="text-[10px] text-blue-400 block uppercase font-bold">PINN Stage 3 (+Sea Breeze)</span>
                <span className="text-sm font-bold text-emerald-400">1.864°C RMSE</span>
              </div>
            </div>
          </div>

          {/* Section 4: How to Use Dashboard */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-white">4. Dashboard Navigation</h3>
            <ul className="list-disc list-inside space-y-1 text-slate-400 pl-1">
              <li><strong>Heat Map:</strong> Drag with mouse to orbit Mumbai in 3D. Hover over extruded blocks to inspect exact pixel coordinates and spectral indices.</li>
              <li><strong>Heat Drivers:</strong> View SHAP attributions distinguishing heating drivers (concrete, air temp) from natural cooling sinks (NDVI, sea breeze).</li>
              <li><strong>Scenarios:</strong> Adjust intervention sliders (Tree Cover, Cool Roofs, Green Roofs) and click <em>Run Simulation</em> to view side-by-side thermal reductions in real-time.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#1E2536] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white transition-all shadow-md shadow-blue-600/20"
          >
            Close Specification
          </button>
        </div>
      </div>
    </div>
  );
}
