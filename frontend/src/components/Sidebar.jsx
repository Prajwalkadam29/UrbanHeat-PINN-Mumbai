import React from 'react';
import { Flame, Map, BarChart2, Layers, Info, Moon, Sun, ChevronDown, Layout } from 'lucide-react';

export default function Sidebar({ currentTab, setCurrentTab, darkMode, setDarkMode, onOpenInstructions }) {
  const navItems = [
    { id: 'heatmap', label: 'Heat Map', icon: Map },
    { id: 'drivers', label: 'Heat Drivers', icon: BarChart2 },
    { id: 'scenarios', label: 'Scenarios', icon: Layers },
  ];

  return (
    <aside className="w-64 h-full bg-[#0F131C] border-r border-[#1E2536] flex flex-col justify-between flex-shrink-0 z-30 select-none">
      {/* Top Header */}
      <div>
        <div className="p-4 flex items-center justify-between border-b border-[#1A2234]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-red-500 flex items-center justify-center shadow-lg shadow-red-500/20">
              <Flame className="w-5 h-5 text-white fill-white" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-wide">Urban Heat</h1>
              <p className="text-[10px] text-slate-400 font-medium tracking-wider uppercase">Mumbai Urban He...</p>
            </div>
          </div>
          <button className="text-slate-500 hover:text-slate-300 transition-colors p-1 rounded-lg hover:bg-[#1A2234]">
            <Layout className="w-4 h-4" />
          </button>
        </div>

        {/* Focus City Selector */}
        <div className="px-4 py-4">
          <label className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block mb-2">
            Focus City
          </label>
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-[#141824] border border-[#232B3E] hover:border-blue-500/50 cursor-pointer transition-all">
            <span className="text-xs font-semibold text-white">Mumbai, Maharashtra</span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="px-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-[#182238] text-blue-400 border border-blue-500/40 shadow-sm shadow-blue-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#141A28]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls */}
      <div className="p-4 border-t border-[#1A2234] space-y-3">
        <button
          onClick={onOpenInstructions}
          className="w-full flex items-center justify-between text-xs text-slate-400 hover:text-white transition-colors py-1 group"
        >
          <span className="flex items-center gap-2">
            <Info className="w-3.5 h-3.5 text-slate-500 group-hover:text-blue-400" />
            Instructions
          </span>
          <span className="w-2 h-2 rounded-full border border-slate-600 group-hover:border-blue-400"></span>
        </button>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            {darkMode ? <Moon className="w-3.5 h-3.5 text-blue-400" /> : <Sun className="w-3.5 h-3.5 text-amber-400" />}
            <span>Dark mode</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ease-in-out flex items-center ${
              darkMode ? 'bg-blue-600 justify-end' : 'bg-slate-700 justify-start'
            }`}
          >
            <div className="w-4 h-4 rounded-full bg-white shadow-md"></div>
          </button>
        </div>
      </div>
    </aside>
  );
}
