/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { EnhanceIcon } from './icons';

interface FilterPanelProps {
  onApplyFilter: (prompt: string) => void;
  onEnhanceQuality: () => void;
  isLoading: boolean;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ onApplyFilter, onEnhanceQuality, isLoading }) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');

  const presets = [
    { name: 'Synthwave', prompt: 'Apply a vibrant 80s synthwave aesthetic with neon magenta and cyan glows, and subtle scan lines.' },
    { name: 'Anime', prompt: 'Give the image a vibrant Japanese anime style, with bold outlines, cel-shading, and saturated colors.' },
    { name: 'Lomo', prompt: 'Apply a Lomography-style cross-processing film effect with high-contrast, oversaturated colors, and dark vignetting.' },
    { name: 'Hologram', prompt: 'Transform the image into a futuristic holographic projection with digital glitch effects and chromatic aberration.' },
  ];
  
  const activePrompt = selectedPresetPrompt || customPrompt;

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };
  
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApply = () => {
    if (activePrompt) {
      onApplyFilter(activePrompt);
    }
  };

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in">
      <button onClick={onEnhanceQuality} disabled={isLoading} className="w-full flex items-center justify-center gap-2 bg-white border border-slate-300 text-slate-800 font-bold py-3 px-3 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-100 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed">
        <EnhanceIcon className="w-5 h-5 text-primary-500"/> AI Enhance
      </button>

      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Or Apply a Filter</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {presets.map(preset => (
          <button
            key={preset.name}
            onClick={() => handlePresetClick(preset.prompt)}
            disabled={isLoading}
            className={`w-full text-center bg-slate-100 border-2 text-slate-700 font-semibold py-3 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'border-primary-500' : 'border-slate-200'}`}
          >
            {preset.name}
          </button>
        ))}
      </div>

      <input
        type="text"
        value={customPrompt}
        onChange={handleCustomChange}
        placeholder="Or describe a custom filter..."
        className="flex-grow bg-white border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm placeholder:text-slate-400"
        disabled={isLoading}
      />
      
      {activePrompt && (
        <div className="animate-fade-in flex flex-col gap-4 pt-2">
          <button
            onClick={handleApply}
            className="w-full bg-primary-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-primary-500/30 hover:bg-primary-600 active:scale-95 active:shadow-inner text-base disabled:bg-primary-500/50 disabled:shadow-none disabled:cursor-not-allowed"
            disabled={isLoading || !activePrompt.trim()}
          >
            Apply Filter
          </button>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;