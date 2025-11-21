
import React from 'react';
import { DepthLevel, DiagramType } from '../types';
import { THEMES } from '../constants';

interface ControlsProps {
  topic: string;
  setTopic: (topic: string) => void;
  depth: DepthLevel;
  setDepth: (depth: DepthLevel) => void;
  diagramType: DiagramType;
  setDiagramType: (type: DiagramType) => void;
  jsonText: string;
  setJsonText: (json: string) => void;
  isDarkMode: boolean;
  setDarkMode: (isDark: boolean) => void;
  onGenerate: () => void;
  onRender: () => void;
  onDownloadSVG: () => void;
  onAddNode: () => void;
  isLoading: boolean;
  canvasWidth: number;
  canvasHeight: number;
  onCanvasSizeChange: (dimension: 'width' | 'height', value: number) => void;
  currentTheme: string;
  setTheme: (themeKey: string) => void;
  backgroundColor: string;
  setBackgroundColor: (color: string) => void;
}

const PRESET_COLORS = ['#f8fafc', '#ffffff', '#f0f9ff', '#fef2f2', '#f0fdf4', '#fffbeb', '#f3e8ff', '#1e293b'];

const Controls: React.FC<ControlsProps> = ({
  topic,
  setTopic,
  depth,
  setDepth,
  diagramType,
  setDiagramType,
  jsonText,
  setJsonText,
  isDarkMode,
  setDarkMode,
  onGenerate,
  onRender,
  onDownloadSVG,
  onAddNode,
  isLoading,
  canvasWidth,
  canvasHeight,
  onCanvasSizeChange,
  currentTheme,
  setTheme,
  backgroundColor,
  setBackgroundColor
}) => {
  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 overflow-y-auto bg-[var(--bg-panel)] border-r border-[var(--border-light)]">
        <div className="flex-grow flex flex-col">
            <h1 className="text-xl font-bold mb-4">AI Generator</h1>

            <div className="mb-4">
                <label htmlFor="topic" className="block text-sm font-medium mb-2">Topic</label>
                <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., The water cycle"
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                />
            </div>

            <div className="mb-4">
                <label htmlFor="diagramType" className="block text-sm font-medium mb-2">Diagram Type</label>
                <select
                    id="diagramType"
                    value={diagramType}
                    onChange={(e) => setDiagramType(e.target.value as DiagramType)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                >
                    {Object.values(DiagramType).map(type => (
                        <option key={type} value={type}>{type}</option>
                    ))}
                </select>
            </div>

            <div className="mb-4">
                <label htmlFor="depth" className="block text-sm font-medium mb-2">Level of Detail</label>
                <select
                    id="depth"
                    value={depth}
                    onChange={(e) => setDepth(e.target.value as DepthLevel)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                >
                    {Object.values(DepthLevel).map(level => (
                        <option key={level} value={level}>{level}</option>
                    ))}
                </select>
            </div>

             <div className="mb-4">
                <label htmlFor="theme" className="block text-sm font-medium mb-2">Color Theme</label>
                <select
                    id="theme"
                    value={currentTheme}
                    onChange={(e) => setTheme(e.target.value)}
                    className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                >
                    {Object.entries(THEMES).map(([key, theme]) => (
                        <option key={key} value={key}>{theme.name}</option>
                    ))}
                </select>
            </div>
            
            <div className="mb-4">
                <label htmlFor="bgColor" className="block text-sm font-medium mb-2">Background Color</label>
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2 bg-[var(--bg)] p-2 rounded-md border border-[var(--border-med)]">
                        <input
                            id="bgColor"
                            type="color"
                            value={backgroundColor}
                            onChange={(e) => setBackgroundColor(e.target.value)}
                            className="h-8 w-12 p-0 border-0 rounded cursor-pointer bg-transparent"
                        />
                        <span className="text-xs text-[var(--text-muted)] font-mono">{backgroundColor}</span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                         {PRESET_COLORS.map(c => (
                            <button 
                                key={c} 
                                onClick={() => setBackgroundColor(c)}
                                className={`w-6 h-6 rounded-full border shadow-sm transition-transform hover:scale-110 ${backgroundColor === c ? 'border-[var(--text-accent)] ring-2 ring-[var(--text-accent)]' : 'border-[var(--border-med)]'}`}
                                style={{ backgroundColor: c }}
                                title={c}
                                aria-label={`Select color ${c}`}
                            />
                        ))}
                    </div>
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Canvas Dimensions</label>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label htmlFor="canvasWidth" className="text-xs text-[var(--text-muted)]">Width</label>
                        <input
                            id="canvasWidth"
                            type="number"
                            value={canvasWidth}
                            onChange={(e) => onCanvasSizeChange('width', parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                        />
                    </div>
                    <div>
                        <label htmlFor="canvasHeight" className="text-xs text-[var(--text-muted)]">Height</label>
                        <input
                            id="canvasHeight"
                            type="number"
                            value={canvasHeight}
                            onChange={(e) => onCanvasSizeChange('height', parseInt(e.target.value, 10) || 0)}
                            className="w-full px-3 py-2 bg-[var(--bg)] border border-[var(--border-med)] rounded-md focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                        />
                    </div>
                </div>
            </div>

            <button
                onClick={onGenerate}
                disabled={isLoading || !topic}
                className="w-full bg-[var(--text-accent)] text-[var(--text-light)] font-bold py-2 px-4 rounded-md hover:bg-[var(--bg-panel-header-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
                {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                {isLoading ? 'Generating...' : 'Generate with AI'}
            </button>

            <div className="mt-6 flex-grow flex flex-col">
                <label htmlFor="jsonInput" className="block text-sm font-medium mb-2">Generated JSON (Editable)</label>
                <textarea
                    id="jsonInput"
                    spellCheck="false"
                    value={jsonText}
                    onChange={(e) => setJsonText(e.target.value)}
                    className="w-full flex-grow bg-[var(--bg)] border border-[var(--border-med)] rounded-md p-2 font-mono text-sm resize-y min-h-[150px]"
                />
            </div>
             <button
                onClick={onRender}
                className="w-full mt-2 bg-[var(--bg-panel-alt)] text-[var(--text)] border border-[var(--border-med)] font-semibold py-2 px-4 rounded-md hover:bg-[var(--border-light)] transition-colors"
            >
                Render from JSON
            </button>

            <button
                onClick={onAddNode}
                className="w-full mt-2 bg-[var(--bg-panel)] text-[var(--text-accent)] border border-[var(--text-accent)] font-semibold py-2 px-4 rounded-md hover:bg-[var(--bg-alt)] transition-colors flex items-center justify-center"
            >
                + Add New Node
            </button>

            <div className="grid grid-cols-1 gap-2 mt-4">
                 <button onClick={onDownloadSVG} className="bg-[var(--bg-panel-alt)] text-[var(--text)] border border-[var(--border-med)] text-sm font-semibold py-2 px-4 rounded-md hover:bg-[var(--border-light)] transition-colors">Download SVG</button>
            </div>
             <div className="flex justify-center items-center mt-4">
                <label htmlFor="darkModeToggle" className="text-sm text-[var(--text-muted)] mr-2">Dark Mode</label>
                <input type="checkbox" id="darkModeToggle" checked={isDarkMode} onChange={(e) => setDarkMode(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            </div>

        </div>
    </div>
  );
};

export default Controls;
