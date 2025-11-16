/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { ArrowLeftIcon } from './icons';

// This interface was previously in ProfilePanel.tsx
export interface ProfileConfig {
  shape: 'square' | 'circle';
  background: 'blur' | 'studio' | 'gradient';
}

interface CropPanelProps {
  onApplyCrop: () => void;
  onResetCrop: () => void;
  onSetAspect: (aspect: number | undefined) => void;
  isLoading: boolean;
  hasCrop: boolean;
  hasCompletedCrop: boolean;
  // New props for Profile Picture functionality
  profileConfig: ProfileConfig;
  onProfileConfigChange: React.Dispatch<React.SetStateAction<ProfileConfig>>;
  onCreateProfilePic: () => void;
}

const CropPanel: React.FC<CropPanelProps> = ({ 
    onApplyCrop, onResetCrop, onSetAspect, isLoading, hasCrop, hasCompletedCrop,
    profileConfig, onProfileConfigChange, onCreateProfilePic
}) => {
  const [activeAspect, setActiveAspect] = useState<string>('free');
  const [view, setView] = useState<'crop' | 'profile'>('crop');
  
  const handleAspectChange = (aspect: string, value: number | undefined) => {
    setActiveAspect(aspect);
    onSetAspect(value);
  }

  const aspects: { name: string, displayName: string, value: number | undefined }[] = [
    { name: 'free', displayName: 'Free', value: undefined },
    { name: '1:1', displayName: 'Square', value: 1 / 1 },
    { name: '4:5', displayName: 'Portrait', value: 4 / 5 },
    { name: '9:16', displayName: 'Story', value: 9 / 16 },
    { name: '16:9', displayName: 'Wide', value: 16 / 9 },
    { name: '4:3', displayName: '4:3', value: 4 / 3 },
    { name: '3:2', displayName: '3:2', value: 3 / 2 },
  ];
  
  const shapes: { id: ProfileConfig['shape'], name: string }[] = [
    { id: 'circle', name: 'Circle' },
    { id: 'square', name: 'Square' },
  ];

  const backgrounds: { id: ProfileConfig['background'], name: string }[] = [
    { id: 'blur', name: 'Blur' },
    { id: 'studio', name: 'Studio Gray' },
    { id: 'gradient', name: 'Gradient' },
  ];

  if (view === 'profile') {
    return (
      <div className="w-full flex flex-col gap-6 animate-fade-in h-full">
        <div className="flex items-center gap-2">
          <button onClick={() => setView('crop')} className="p-2 rounded-md hover:bg-slate-100 transition-colors" aria-label="Back to crop tools">
            <ArrowLeftIcon className="w-5 h-5 text-slate-600"/>
          </button>
          <h3 className="text-base font-semibold text-slate-500">Create Profile Picture</h3>
        </div>
        <p className="text-sm text-slate-500 -mt-4 text-center">Enhance your photo and add a professional background.</p>
        
        {/* Shape Selector */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">Shape</label>
          <div className="w-full bg-slate-100 rounded-lg p-1 flex items-center justify-center gap-1">
            {shapes.map(shape => (
                <button
                    key={shape.id}
                    onClick={() => onProfileConfigChange(prev => ({ ...prev, shape: shape.id }))}
                    disabled={isLoading}
                    className={`w-full font-semibold py-2 px-4 rounded-md transition-all duration-200 text-sm ${
                        profileConfig.shape === shape.id
                        ? 'bg-white shadow-sm text-slate-800' 
                        : 'text-slate-600 hover:text-slate-800 hover:bg-white/50'
                    }`}
                >
                    {shape.name}
                </button>
            ))}
          </div>
        </div>

        {/* Background Selector */}
        <div>
          <label className="text-sm font-medium text-slate-600 mb-2 block">AI Background</label>
          <div className="grid grid-cols-3 gap-2">
            {backgrounds.map(bg => (
                <button
                    key={bg.id}
                    onClick={() => onProfileConfigChange(prev => ({ ...prev, background: bg.id }))}
                    disabled={isLoading}
                    className={`w-full text-center bg-slate-100 border-2 text-slate-700 font-semibold py-3 px-3 rounded-md transition-all duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                        profileConfig.background === bg.id ? 'border-primary-500' : 'border-slate-200'
                    }`}
                >
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
    );
  }

  return (
    <div className="w-full flex flex-col gap-6 animate-fade-in h-full overflow-y-auto">
      {/* --- CROP SECTION --- */}
      <div className="flex flex-col gap-4">
        <h3 className="text-base font-semibold text-slate-500">Crop Image</h3>
        <p className="text-sm text-slate-500 -mt-2 text-center">Click and drag on the image to select a crop area.</p>
        
        <div className="grid grid-cols-4 gap-2 p-1 bg-slate-100 rounded-lg">
          {aspects.map(({ name, value, displayName }) => (
            <button
              key={name}
              onClick={() => handleAspectChange(name, value)}
              disabled={isLoading}
              className={`flex-1 px-3 py-2 rounded-md text-xs font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 ${
                activeAspect === name 
                ? 'bg-primary-500 text-white shadow-md shadow-primary-500/10' 
                : 'hover:bg-slate-200 text-slate-600'
              }`}
            >
              {displayName}
            </button>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex items-center gap-2">
              <button onClick={onResetCrop} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || !hasCrop}>
                  Reset
              </button>
              <button onClick={onApplyCrop} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || !hasCompletedCrop}>
                  Apply Crop
              </button>
          </div>
        </div>
      </div>

      {/* --- DIVIDER --- */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-slate-200"></div>
        <span className="flex-shrink mx-4 text-slate-400 text-xs uppercase">Or</span>
        <div className="flex-grow border-t border-slate-200"></div>
      </div>

      {/* --- GO TO PROFILE PIC SECTION --- */}
      <button onClick={() => setView('profile')} className="w-full bg-slate-100 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed border border-slate-200" disabled={isLoading}>
          Create Profile Picture
      </button>
    </div>
  );
};

export default CropPanel;