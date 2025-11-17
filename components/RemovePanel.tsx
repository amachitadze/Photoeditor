/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface RemovePanelProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  isLoading: boolean;
  onApply: () => void;
  onReset: () => void;
  hasMasks: boolean;
}

const RemovePanel: React.FC<RemovePanelProps> = ({
  brushSize,
  onBrushSizeChange,
  isLoading,
  onApply,
  onReset,
  hasMasks
}) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
        <h3 className="text-base font-semibold text-center text-slate-500">Remove Object</h3>
        <p className="text-sm text-slate-500 -mt-4 text-center">Paint over any object or blemish you want to remove from the image.</p>
        
        <div className="flex flex-col gap-3">
          <label htmlFor="remove-brush-size-slider" className="text-sm font-medium text-slate-600 flex justify-between">
              <span>Brush Size</span>
              <span className="font-bold text-slate-800 tabular-nums">{brushSize}px</span>
          </label>
          <input
            id="remove-brush-size-slider"
            type="range"
            min="5" max="100" step="1"
            value={brushSize}
            onChange={(e) => onBrushSizeChange(parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="hidden md:flex items-center gap-2 mt-auto pt-4 border-t border-slate-200">
            <button onClick={onReset} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors hover:bg-slate-300 active:scale-95" disabled={isLoading || !hasMasks}>Reset</button>
            <button onClick={onApply} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-green-600 active:scale-95" disabled={isLoading || !hasMasks}>Apply Removal</button>
        </div>
    </div>
  );
};

export default RemovePanel;