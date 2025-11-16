/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React, { useState } from 'react';
import { UploadIcon, CloseIcon } from './icons';

interface StartScreenProps {
  onFileSelect: (files: FileList | null) => void;
  isInstallable: boolean;
  onInstallClick: () => void;
  onDismissInstall: () => void;
}

const StartScreen: React.FC<StartScreenProps> = ({ onFileSelect, isInstallable, onInstallClick, onDismissInstall }) => {
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFileSelect(e.target.files);
  };

  return (
    <div 
      className={`w-full max-w-3xl mx-auto text-center p-4 md:p-8 transition-all duration-300 rounded-2xl border-2 ${isDraggingOver ? 'bg-primary-500/10 border-dashed border-primary-400' : 'border-transparent'}`}
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDraggingOver(false);
        onFileSelect(e.dataTransfer.files);
      }}
    >
      <div className="flex flex-col items-center animate-fade-in">
        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-800 tracking-tight">AI Photo Editor, <span className="text-primary-500">Reimagined.</span></h1>
        <p className="mt-4 max-w-xl text-lg text-slate-600">Retouch photos, apply creative filters, or make professional adjustments with simple text prompts. The future of photo editing is here.</p>

        <div className="mt-8 flex flex-col items-center gap-3">
            <label htmlFor="image-upload-start" className="relative inline-flex items-center justify-center px-8 py-4 text-lg font-bold text-white bg-primary-500 rounded-full cursor-pointer group hover:bg-primary-600 transition-colors shadow-lg shadow-primary-500/20">
                <UploadIcon className="w-6 h-6 mr-3 transition-transform duration-300 group-hover:scale-110" />
                Upload an Image
            </label>
            <input id="image-upload-start" type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
            <p className="text-xs text-slate-500">or drag and drop a file</p>
        </div>
      </div>
      {isInstallable && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-[calc(100%-2rem)] max-w-md bg-white/80 backdrop-blur-lg p-4 rounded-xl shadow-2xl shadow-slate-900/10 flex items-center gap-4 z-50 animate-fade-in border border-slate-200">
          <img src="https://i.postimg.cc/RFTg0yDG/Ai-Photo-Edit.png" alt="App Icon" className="w-12 h-12 rounded-lg" />
          <div className="flex-1 text-left">
            <h3 className="font-bold text-slate-800">Install the App</h3>
            <p className="text-sm text-slate-500">Add to Home Screen for a better experience.</p>
          </div>
          <button
            onClick={onInstallClick}
            className="bg-primary-500 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-primary-600 transition-colors active:scale-95 whitespace-nowrap"
          >
            Install
          </button>
          <button
            onClick={onDismissInstall}
            className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Dismiss install prompt"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
};

export default StartScreen;