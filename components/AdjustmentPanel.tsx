/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { BullseyeIcon, ExposureIcon, SunIcon, ContrastIcon, HighlightsIcon, ShadowsIcon, SaturationIcon, WarmthIcon, TintIcon, VignetteIcon } from './icons';

export interface ManualAdjustments {
  exposure: number;
  brightness: number;
  contrast: number;
  highlights: number;
  shadows: number;
  saturation: number;
  warmth: number;
  tint: number;
  vignette: number;
}
export type ManualAdjustmentTool = keyof ManualAdjustments;

interface AdjustmentPanelProps {
  onApplyAjustment: (prompt: string) => void;
  onRemoveBackground: () => void;
  onApplyManualAdjustments: () => void;
  manualAdjustments: ManualAdjustments;
  onManualAdjustmentChange: React.Dispatch<React.SetStateAction<ManualAdjustments>>;
  isLoading: boolean;
}

const AdjustmentPanel: React.FC<AdjustmentPanelProps> = ({ 
    onApplyAjustment, 
    onRemoveBackground,
    onApplyManualAdjustments,
    manualAdjustments,
    onManualAdjustmentChange,
    isLoading 
}) => {
  const [selectedPresetPrompt, setSelectedPresetPrompt] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [activeManualTool, setActiveManualTool] = useState<ManualAdjustmentTool>('brightness');

  const presets = [
    { name: 'Blur Background', prompt: 'Apply a realistic depth-of-field effect, making the background blurry while keeping the main subject in sharp focus.' },
    { name: 'Enhance Details', prompt: 'Slightly enhance the sharpness and details of the image without making it look unnatural.' },
    { name: 'Warmer Lighting', prompt: 'Adjust the color temperature to give the image warmer, golden-hour style lighting.' },
    { name: 'Studio Light', prompt: 'Add dramatic, professional studio lighting to the main subject.' },
  ];

  const manualTools: { id: ManualAdjustmentTool, name: string, icon: React.FC<{className?: string}>, min: number, max: number, step: number }[] = [
    { id: 'exposure', name: 'Exposure', icon: ExposureIcon, min: -100, max: 100, step: 1 },
    { id: 'brightness', name: 'Brightness', icon: SunIcon, min: -100, max: 100, step: 1 },
    { id: 'contrast', name: 'Contrast', icon: ContrastIcon, min: -100, max: 100, step: 1 },
    { id: 'highlights', name: 'Highlights', icon: HighlightsIcon, min: 0, max: 100, step: 1 },
    { id: 'shadows', name: 'Shadows', icon: ShadowsIcon, min: -100, max: 0, step: 1 },
    { id: 'saturation', name: 'Saturation', icon: SaturationIcon, min: -100, max: 100, step: 1 },
    { id: 'warmth', name: 'Warmth', icon: WarmthIcon, min: -100, max: 100, step: 1 },
    { id: 'tint', name: 'Tint', icon: TintIcon, min: -100, max: 100, step: 1 },
    { id: 'vignette', name: 'Vignette', icon: VignetteIcon, min: 0, max: 100, step: 1 },
  ];
  const activeToolConfig = manualTools.find(t => t.id === activeManualTool)!;
  
  const activePrompt = selectedPresetPrompt || customPrompt;
  const isManuallyAdjusted = Object.values(manualAdjustments).some(val => val !== 0);

  const handlePresetClick = (prompt: string) => {
    setSelectedPresetPrompt(prompt);
    setCustomPrompt('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomPrompt(e.target.value);
    setSelectedPresetPrompt(null);
  };

  const handleApplyAIPrompt = () => {
    if (activePrompt) {
      onApplyAjustment(activePrompt);
    }
  };

  const handleSliderChange = (adjustment: keyof ManualAdjustments, value: number) => {
    onManualAdjustmentChange(prev => ({ ...prev, [adjustment]: value }));
  };

  const resetManualAdjustments = () => {
    onManualAdjustmentChange({ exposure: 0, brightness: 0, contrast: 0, highlights: 0, shadows: 0, saturation: 0, warmth: 0, tint: 0, vignette: 0 });
  };
  
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
      
      {/* --- AI Adjustments Section --- */}
      <div>
        <h3 className="text-base font-semibold text-slate-500 mb-3">AI Quick Actions</h3>
        <div className="grid grid-cols-1 gap-2">
          <button onClick={onRemoveBackground} disabled={isLoading} className="w-full flex flex-col items-center justify-center gap-2 bg-slate-100 text-slate-700 font-semibold py-3 px-3 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200">
            <BullseyeIcon className="w-5 h-5" /> Remove BG
          </button>
        </div>

        <div className="relative flex py-4 items-center">
          <div className="flex-grow border-t border-slate-200"></div>
          <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Or Describe</span>
          <div className="flex-grow border-t border-slate-200"></div>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {presets.map(preset => (
            <button key={preset.name} onClick={() => handlePresetClick(preset.prompt)} disabled={isLoading} className={`w-full text-center bg-slate-100 border-2 text-slate-700 font-semibold py-2 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${selectedPresetPrompt === preset.prompt ? 'border-primary-500' : 'border-slate-200'}`}>
              {preset.name}
            </button>
          ))}
        </div>

        <input type="text" value={customPrompt} onChange={handleCustomChange} placeholder="e.g., 'make background a forest'" className="mt-3 flex-grow bg-white border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm placeholder:text-slate-400" disabled={isLoading} />

        {activePrompt && (
          <div className="animate-fade-in pt-3">
              <button onClick={handleApplyAIPrompt} className="w-full bg-primary-500 text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-primary-500/30 hover:shadow-primary-500/40 hover:bg-primary-600 active:scale-95 active:shadow-inner text-base disabled:bg-primary-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || !activePrompt.trim()}>
                  Apply AI Adjustment
              </button>
          </div>
        )}
      </div>

      <div className="relative flex items-center">
        <div className="flex-grow border-t border-slate-200"></div>
      </div>
      
      {/* --- Manual Adjustments Section --- */}
      <div className="flex-1 flex flex-col gap-4">
          <h3 className="text-base font-semibold text-slate-500 mb-3">Manual Adjustments</h3>
          <div className="grid grid-cols-5 gap-2">
            {manualTools.map(tool => (
                <button key={tool.id} onClick={() => setActiveManualTool(tool.id)} disabled={isLoading} className={`flex flex-col items-center justify-center gap-1.5 p-2 rounded-lg transition-colors duration-200 ${activeManualTool === tool.id ? 'bg-primary-100 text-primary-600' : 'bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700'}`}>
                    <tool.icon className="w-5 h-5" />
                    <span className="text-xs font-medium">{tool.name}</span>
                </button>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-200/50">
            <div className="flex flex-col gap-2">
                <label htmlFor={`${activeToolConfig.id}-slider`} className="text-sm font-medium text-slate-600 capitalize flex justify-between">
                  <span>{activeToolConfig.name}</span>
                  <span className="font-bold text-slate-800 tabular-nums">{manualAdjustments[activeToolConfig.id]}</span>
                </label>
                <input 
                  id={`${activeToolConfig.id}-slider`}
                  type="range"
                  min={activeToolConfig.min} max={activeToolConfig.max} step={activeToolConfig.step}
                  value={manualAdjustments[activeToolConfig.id]}
                  onChange={(e) => handleSliderChange(activeToolConfig.id, parseInt(e.target.value))}
                  disabled={isLoading}
                />
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-slate-200">
              <div className="flex items-center gap-2">
                  <button onClick={resetManualAdjustments} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !isManuallyAdjusted}>
                      Reset
                  </button>
                  <button onClick={onApplyManualAdjustments} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || !isManuallyAdjusted}>
                      Apply Changes
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AdjustmentPanel;