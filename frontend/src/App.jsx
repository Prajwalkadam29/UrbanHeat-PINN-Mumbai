import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import HeatMap3D from './components/HeatMap3D';
import HeatDrivers from './components/HeatDrivers';
import Scenarios from './components/Scenarios';
import InstructionsModal from './components/InstructionsModal';

export default function App() {
  const [currentTab, setCurrentTab] = useState('heatmap');
  const [darkMode, setDarkMode] = useState(true);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  return (
    <div className={`w-screen h-screen flex overflow-hidden ${darkMode ? 'bg-[#0A0D14] text-slate-100' : 'bg-slate-900 text-slate-100'}`}>
      {/* Primary Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        onOpenInstructions={() => setIsInstructionsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 h-full relative overflow-hidden flex flex-col">
        {currentTab === 'heatmap' && <HeatMap3D />}
        {currentTab === 'drivers' && (
          <HeatDrivers onGoToScenarios={() => setCurrentTab('scenarios')} />
        )}
        {currentTab === 'scenarios' && <Scenarios />}
      </main>

      {/* Instructions & Specification Modal */}
      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />
    </div>
  );
}
