/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

interface RemovePanelProps {
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  onApplyRemove: () => void;
  onResetMask: () => void;
  isLoading: boolean;
  hasMask: boolean;
}

const RemovePanel: React.FC<RemovePanelProps> = ({
  brushSize,
  onBrushSizeChange,
  onApplyRemove,
  onResetMask,
  isLoading,
  hasMask
}) => {
  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
      <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
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
      </div>

      <div className="mt-auto pt-4 border-t border-slate-200">
        <div className="flex items-center gap-2">
            <button onClick={onResetMask} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !hasMask}>
                Reset
            </button>
            <button onClick={onApplyRemove} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || !hasMask}>
                Remove Object
            </button>
        </div>
      </div>
    </div>
  );
};

export default RemovePanel;