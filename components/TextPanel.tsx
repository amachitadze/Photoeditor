/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';
import { TextElement } from '../App';
import { PlusIcon, TrashIcon, TextAlignLeftIcon, TextAlignCenterIcon, TextAlignRightIcon, ShadowIcon } from './icons';

interface TextPanelProps {
  textElements: TextElement[];
  selectedElementId: string | null;
  onAddText: () => void;
  onSelectText: (id: string) => void;
  onUpdateText: (id: string, updates: Partial<TextElement>) => void;
  onDeleteText: (id: string) => void;
  onApplyText: () => void;
  onResetText: () => void;
  isLoading: boolean;
}

const TextPanel: React.FC<TextPanelProps> = ({
  textElements,
  selectedElementId,
  onAddText,
  onSelectText,
  onUpdateText,
  onDeleteText,
  onApplyText,
  onResetText,
  isLoading,
}) => {
  const selectedElement = textElements.find(el => el.id === selectedElementId);

  const colors = ['#FFFFFF', '#000000', '#EF4444', '#3B82F6', '#10B981', '#F59E0B'];
  const fonts = [
    { name: 'Sans-Serif', value: 'Inter, sans-serif'},
    { name: 'Serif', value: 'Georgia, serif'},
    { name: 'Monospace', value: '"Courier New", monospace'},
  ];

  const AlignmentButton: React.FC<{align: 'left' | 'center' | 'right', icon: React.FC<{className?: string}>}> = ({align, icon: Icon}) => (
    <button
        onClick={() => onUpdateText(selectedElement!.id, { textAlign: align })}
        className={`flex-1 p-2 rounded-md transition-colors text-sm ${selectedElement?.textAlign === align ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
    >
        <Icon className="w-5 h-5 mx-auto"/>
    </button>
  );

  return (
    <div className="w-full flex flex-col gap-4 animate-fade-in h-full">
        <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-500">Text Tool</h3>
            <button
                onClick={onAddText}
                disabled={isLoading}
                className="flex items-center gap-2 bg-slate-100 border border-slate-200 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-200 active:scale-95 text-sm disabled:opacity-50"
            >
                <PlusIcon className="w-4 h-4"/> Add Text
            </button>
        </div>

        {textElements.length > 0 ? (
            <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
                <div className="flex flex-col gap-2">
                    <p className="text-sm font-medium text-slate-500">Layers</p>
                    {textElements.map(el => (
                        <button
                            key={el.id}
                            onClick={() => onSelectText(el.id)}
                            className={`w-full text-left p-2 rounded-lg transition-colors text-sm truncate ${selectedElementId === el.id ? 'bg-primary-100 text-primary-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}
                        >
                            {el.text || '(empty)'}
                        </button>
                    ))}
                </div>

                {selectedElement && (
                    <div className="flex flex-col gap-4 pt-2 border-t border-slate-200">
                        <textarea
                            value={selectedElement.text}
                            onChange={(e) => onUpdateText(selectedElement.id, { text: e.target.value })}
                            placeholder="Enter text"
                            className="bg-slate-50 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none transition w-full text-sm resize-none"
                            rows={2}
                            disabled={isLoading}
                        />

                        <div className="flex flex-col gap-3">
                            <label htmlFor="size-slider" className="text-sm font-medium text-slate-600 flex justify-between"><span>Size</span> <span className="font-bold text-slate-800 tabular-nums">{selectedElement.size}</span></label>
                            <input
                                id="size-slider" type="range" min="1" max="20" step="0.5"
                                value={selectedElement.size}
                                onChange={(e) => onUpdateText(selectedElement.id, { size: parseFloat(e.target.value) })}
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label htmlFor="font-select" className="text-sm font-medium text-slate-600 mb-2 block">Font</label>
                            <select
                                id="font-select"
                                value={selectedElement.fontFamily}
                                onChange={(e) => onUpdateText(selectedElement.id, { fontFamily: e.target.value })}
                                className="w-full bg-slate-100 border border-slate-200 text-slate-800 rounded-lg p-2 focus:ring-2 focus:ring-primary-500 focus:outline-none transition text-sm"
                            >
                                {fonts.map(font => <option key={font.name} value={font.value}>{font.name}</option>)}
                            </select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                            <AlignmentButton align="left" icon={TextAlignLeftIcon} />
                            <AlignmentButton align="center" icon={TextAlignCenterIcon} />
                            <AlignmentButton align="right" icon={TextAlignRightIcon} />
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">Color:</span>
                            {colors.map(color => (
                                <button
                                    key={color}
                                    onClick={() => onUpdateText(selectedElement.id, { color })}
                                    className={`w-6 h-6 rounded-full transition ${selectedElement.color === color ? 'ring-2 ring-offset-2 ring-offset-white ring-primary-400' : ''}`}
                                    style={{ backgroundColor: color, border: color === '#000000' || color === '#FFFFFF' ? '1px solid #d1d5db' : 'none' }}
                                    aria-label={`Set color to ${color}`}
                                />
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                             <button onClick={() => onUpdateText(selectedElement.id, { bold: !selectedElement.bold })} className={`flex-1 text-center font-bold p-2 rounded-md transition-colors text-sm ${selectedElement.bold ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>B</button>
                             <button onClick={() => onUpdateText(selectedElement.id, { hasShadow: !selectedElement.hasShadow })} className={`flex-1 p-2 rounded-md transition-colors text-sm ${selectedElement.hasShadow ? 'bg-primary-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}><ShadowIcon className="w-5 h-5 mx-auto"/></button>
                             <button onClick={() => onDeleteText(selectedElement.id)} className="p-2 rounded-md bg-red-100 hover:bg-red-200 text-red-500 transition-colors" aria-label="Delete text element"><TrashIcon className="w-5 h-5"/></button>
                        </div>
                    </div>
                )}
            </div>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-500">No text added yet.</p>
                <p className="text-xs text-slate-400">Click "Add Text" to get started.</p>
            </div>
        )}

        <div className="mt-auto pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
                <button onClick={onResetText} className="w-full bg-slate-200 text-slate-800 font-bold py-3 px-6 rounded-lg transition-colors duration-200 ease-in-out hover:bg-slate-300 active:scale-95 text-base disabled:opacity-50 disabled:cursor-not-allowed" disabled={isLoading || textElements.length === 0}>
                    Reset
                </button>
                <button onClick={onApplyText} className="w-full bg-accent-green text-white font-bold py-3 px-6 rounded-lg transition-all duration-300 ease-in-out shadow-md shadow-green-500/30 hover:bg-green-600 active:scale-95 active:shadow-inner text-base disabled:bg-green-500/50 disabled:shadow-none disabled:cursor-not-allowed" disabled={isLoading || textElements.length === 0}>
                    Apply Changes
                </button>
            </div>
        </div>
    </div>
  );
};

export default TextPanel;