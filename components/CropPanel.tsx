/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { CropIcon } from './icons';

export interface ProfileConfig {
  shape: 'square' | 'circle';
  background: 'blur' | 'studio' | 'gradient';
}

interface CropPanelProps {
  isLoading: boolean;
  profileConfig: ProfileConfig;
  onProfileConfigChange: React.Dispatch<React.SetStateAction<ProfileConfig>>;
  onCreateProfilePic: () => void;
  aspect: number | undefined;
  onAspectChange: (aspect: number | undefined) => void;
  onApplyCrop: () => void;
  onResetCrop: () => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ 
    isLoading, profileConfig, onProfileConfigChange, onCreateProfilePic,
    aspect, onAspectChange, onApplyCrop, onResetCrop
}) => {
  const shapes: { id: ProfileConfig['shape'], name: string }[] = [
    { id: 'circle', name: 'Circle' },
    { id: 'square', name: 'Square' },
  ];

  const backgrounds: { id: ProfileConfig['background'], name: string }[] = [
    { id: 'blur', name: 'Blur' },
    { id: 'studio', name: 'Studio' },
    { id: 'gradient', name: 'Gradient' },
  ];

  const aspects: { name: string, value: number | undefined, icon: React.FC<{className?: string}> }[] = [
    { name: 'Free', value: undefined, icon: CropIcon },
    { name: 'Square', value: 1 / 1, icon: CropIcon },
    { name: '4:5', value: 4 / 5, icon: CropIcon },
    { name: '9:16', value: 9 / 16, icon: CropIcon },
    { name: '16:9', value: 16 / 9, icon: CropIcon },
  ];

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
        {/* --- DESKTOP UI --- */}
        <div className="hidden md:flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-500">Crop & Resize</h3>
            <div className="grid grid-cols-3 gap-2">
              {aspects.map(a => (
                <button key={a.name} onClick={() => onAspectChange(a.value)} className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg transition-colors ${aspect === a.value ? 'bg-primary-500/10 text-primary-600' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                  <a.icon className="w-5 h-5"/>
                  <span className="text-xs font-medium">{a.name}</span>
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 mt-auto pt-4 border-t border-slate-200">
                <button onClick={onResetCrop} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors hover:bg-slate-300 active:scale-95" disabled={isLoading}>Reset</button>
                <button onClick={onApplyCrop} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-colors hover:bg-green-600 active:scale-95" disabled={isLoading}>Apply Crop</button>
            </div>
        </div>

        <div className="relative flex items-center hidden md:flex">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Or</span>
            <div className="flex-grow border-t border-slate-200"></div>
        </div>

        <div className="hidden md:flex flex-col gap-4">
            <h3 className="text-base font-semibold text-slate-500">Create Profile Picture</h3>
            <p className="text-sm text-slate-500 -mt-4">Enhance your photo and add a professional background.</p>
            
            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">Shape</label>
              <div className="w-full bg-slate-100 rounded-lg p-1 flex items-center justify-center gap-1">
                {shapes.map(shape => (
                    <button key={shape.id} onClick={() => onProfileConfigChange(prev => ({ ...prev, shape: shape.id }))} disabled={isLoading} className={`w-full font-semibold py-2 px-4 rounded-md transition-all duration-200 text-sm ${profileConfig.shape === shape.id ? 'bg-white shadow-sm text-slate-800' : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'}`}>
                        {shape.name}
                    </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-2 block">AI Background</label>
              <div className="grid grid-cols-3 gap-2">
                {backgrounds.map(bg => (
                    <button key={bg.id} onClick={() => onProfileConfigChange(prev => ({ ...prev, background: bg.id }))} disabled={isLoading} className={`w-full text-center bg-slate-100 border-2 text-slate-700 font-semibold py-3 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${profileConfig.background === bg.id ? 'border-primary-500' : 'border-slate-200'}`}>
                        {bg.name}
                    </button>
                ))}
              </div>
            </div>

            <div className="mt-auto pt-4 border-t border-slate-200">
                <button onClick={onCreateProfilePic} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading}>
                    Create Profile Picture
                </button>
            </div>
        </div>

        {/* --- MOBILE UI --- */}
        <div className="md:hidden text-center text-slate-500">Select a crop aspect ratio or create a profile picture using the options below.</div>
    </div>
  );
};

export default CropPanel;