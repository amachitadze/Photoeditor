/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { PencilIcon, LineIcon, RectangleIcon, TriangleIcon, StarIcon } from './icons';

export type DoodleMode = 'freehand' | 'line' | 'rectangle' | 'triangle' | 'star';

interface DoodlePanelProps {
  mode: DoodleMode;
  onModeChange: (mode: DoodleMode) => void;
  color: string;
  onColorChange: (color: string) => void;
  size: number;
  onSizeChange: (size: number) => void;
  isLoading: boolean;
  onApply: () => void;
  onReset: () => void;
}

const DoodlePanel: React.FC<DoodlePanelProps> = ({
  mode,
  onModeChange,
  color,
  onColorChange,
  size,
  onSizeChange,
  isLoading,
  onApply,
  onReset
}) => {
  const colors = ['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#F472B6', '#8B5CF6'];
  const doodleModes: { id: DoodleMode, name: string, icon: React.FC<{className?: string}> }[] = [
    { id: 'freehand', name: 'Draw', icon: PencilIcon },
    { id: 'line', name: 'Line', icon: LineIcon },
    { id: 'rectangle', name: 'Rectangle', icon: RectangleIcon },
    { id: 'triangle', name: 'Triangle', icon: TriangleIcon },
    { id: 'star', name: 'Star', icon: StarIcon },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
        <h3 className="text-base font-semibold text-center text-slate-500 hidden md:block">Doodle Tool</h3>
        
        <div className="hidden md:flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-600">Shape</label>
            <div className="grid grid-cols-5 gap-2">
                {doodleModes.map(m => (
                    <button key={m.id} onClick={() => onModeChange(m.id)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${mode === m.id ? 'bg-primary-500/10 text-primary-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                        <m.icon className="w-5 h-5"/>
                        <span className="text-xs font-medium">{m.name}</span>
                    </button>
                ))}
            </div>
        </div>

        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Brush Color</label>
          <div className="grid grid-cols-8 gap-2">
            {colors.map(c => (
              <button
                key={c}
                onClick={() => onColorChange(c)}
                className={`w-full h-8 rounded-full transition transform hover:scale-110 ${color === c ? 'ring-2 ring-offset-2 ring-offset-white ring-primary-400' : ''}`}
                style={{ backgroundColor: c, border: c === '#FFFFFF' ? '1px solid #d1d5db' : 'none' }}
                aria-label={`Set color to ${c}`}
              />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <label htmlFor="doodle-size-slider" className="text-sm font-medium text-slate-600 flex justify-between">
              <span>Brush Size</span>
              <span className="font-bold text-slate-800 tabular-nums">{size}px</span>
          </label>
          <input
            id="doodle-size-slider"
            type="range"
            min="1" max="50" step="1"
            value={size}
            onChange={(e) => onSizeChange(parseInt(e.target.value))}
            disabled={isLoading}
          />
        </div>

        <div className="hidden md:flex items-center gap-2 mt-auto pt-4 border-t border-slate-200">
            <button onClick={onReset} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors hover:bg-slate-300 active:scale-95" disabled={isLoading}>Reset</button>
            <button onClick={onApply} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-green-600 active:scale-95" disabled={isLoading}>Apply Doodles</button>
        </div>
    </div>
  );
};

export default DoodlePanel;