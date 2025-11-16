/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { WatermarkTextIcon, WatermarkPhotoIcon } from './icons';
import { WatermarkConfig } from '../App';

interface WatermarkPanelProps {
  config: WatermarkConfig;
  onConfigChange: React.Dispatch<React.SetStateAction<WatermarkConfig>>;
  onApplyWatermark: () => void;
  onResetWatermark: () => void;
  isLoading: boolean;
}

const WatermarkPanel: React.FC<WatermarkPanelProps> = ({ config, onConfigChange, onApplyWatermark, onResetWatermark, isLoading }) => {
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onConfigChange(prev => ({ ...prev, imageFile: e.target.files![0] }));
        }
    };
    
    const positions = [
        'top-left', 'top-center', 'top-right',
        'middle-left', 'middle-center', 'middle-right',
        'bottom-left', 'bottom-center', 'bottom-right'
    ];

    const hasWatermark = (config.type === 'text' && config.text.trim() !== '') || (config.type === 'photo' && config.imageFile);
  
    return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
        <div className="flex-1 flex flex-col gap-6 overflow-y-auto">
            <h3 className="text-base font-semibold text-center text-slate-500">Add Watermark</h3>
            
            {/* Watermark Type Selector */}
            <div className="w-full bg-slate-100 rounded-lg p-1 flex items-center justify-center gap-1">
                <button
                    onClick={() => onConfigChange(prev => ({...prev, type: 'text'}))}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-md transition-all duration-200 text-sm ${
                        config.type === 'text' 
                        ? 'bg-white shadow-sm text-slate-800' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }`}
                >
                    <WatermarkTextIcon className="w-5 h-5"/> Text
                </button>
                <button
                    onClick={() => onConfigChange(prev => ({...prev, type: 'photo'}))}
                    disabled={isLoading}
                    className={`w-full flex items-center justify-center gap-2 font-semibold py-2 px-4 rounded-md transition-all duration-200 text-sm ${
                        config.type === 'photo' 
                        ? 'bg-white shadow-sm text-slate-800' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }`}
                >
                    <WatermarkPhotoIcon className="w-5 h-5"/> Photo
                </button>
            </div>

            {/* Controls */}
            {config.type === 'text' ? (
                <div className="flex flex-col gap-4 animate-fade-in">
                    <input
                        type="text"
                        value={config.text}
                        onChange={(e) => onConfigChange(prev => ({...prev, text: e.target.value}))}
                        placeholder="Enter watermark text"
                        className="flex-grow bg-white border border-slate-300 text-slate-800 rounded-lg p-3 focus:ring-2 focus:ring-primary-500 focus:outline-none transition w-full disabled:cursor-not-allowed disabled:opacity-60 text-sm placeholder:text-slate-400"
                        disabled={isLoading}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-slate-500">Color:</span>
                        <button onClick={() => onConfigChange(prev => ({...prev, color: '#ffffff'}))} className={`w-8 h-8 rounded-full bg-white transition border border-slate-200 ${config.color === '#ffffff' ? 'ring-2 ring-offset-2 ring-offset-white ring-primary-400' : ''}`}></button>
                        <button onClick={() => onConfigChange(prev => ({...prev, color: '#000000'}))} className={`w-8 h-8 rounded-full bg-black border border-slate-500 transition ${config.color === '#000000' ? 'ring-2 ring-offset-2 ring-offset-white ring-primary-400' : ''}`}></button>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center gap-2 animate-fade-in">
                    <label htmlFor="watermark-upload" className="w-full text-center bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-md transition-colors duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer">
                        {config.imageFile ? `Image: ${config.imageFile.name.substring(0, 20)}...` : 'Upload Logo / Image'}
                    </label>
                    <input id="watermark-upload" type="file" className="hidden" accept="image/png, image/jpeg" onChange={handleFileChange} disabled={isLoading} />
                </div>
            )}

            {/* Common Controls: Opacity and Size */}
            <div className="flex flex-col gap-3">
                <label htmlFor="opacity-slider" className="text-sm font-medium text-slate-600 flex justify-between"><span>Opacity</span> <span className="font-bold text-slate-800 tabular-nums">{Math.round(config.opacity * 100)}%</span></label>
                <input 
                    id="opacity-slider"
                    type="range"
                    min="0" max="1" step="0.05"
                    value={config.opacity}
                    onChange={(e) => onConfigChange(prev => ({...prev, opacity: parseFloat(e.target.value)}))}
                    disabled={isLoading}
                />
            </div>
            <div className="flex flex-col gap-3">
                <label htmlFor="size-slider" className="text-sm font-medium text-slate-600 flex justify-between"><span>Size</span> <span className="font-bold text-slate-800 tabular-nums">{config.size}%</span></label>
                <input 
                    id="size-slider"
                    type="range"
                    min="1" max={config.type === 'text' ? '15' : '50'} step="1"
                    value={config.size}
                    onChange={(e) => onConfigChange(prev => ({...prev, size: parseInt(e.target.value)}))}
                    disabled={isLoading}
                />
            </div>

            {/* Position Control */}
            <div>
                <label className="text-sm font-medium text-slate-600 mb-2 block">Position</label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-md">
                    {positions.map(pos => (
                        <button
                            key={pos}
                            onClick={() => onConfigChange(prev => ({...prev, position: pos}))}
                            className={`h-12 w-full rounded-md transition-colors flex items-center justify-center ${config.position === pos ? 'bg-primary-500' : 'hover:bg-slate-200'}`}
                            aria-label={`Set position to ${pos.replace('-', ' ')}`}
                        >
                            <div className={`w-3 h-3 rounded-full ${config.position === pos ? 'bg-white' : 'bg-slate-300'}`}></div>
                        </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
                <button onClick={onResetWatermark} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !hasWatermark}>
                    Reset
                </button>
                <button onClick={onApplyWatermark} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || !hasWatermark}>
                    Apply Watermark
                </button>
            </div>
        </div>
    </div>
  );
};

export default WatermarkPanel;