
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
  nodeCount: number;
  setNodeCount: (count: number) => void;
  onAutoLayout: (type: 'radial' | 'tree' | 'horizontal') => void;
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
  setBackgroundColor,
  nodeCount,
  setNodeCount,
  onAutoLayout
}) => {
  return (
    <div className="w-full h-full flex flex-col p-6 overflow-y-auto bg-[var(--bg-panel)]/90 backdrop-blur-xl border-r border-[var(--border-light)] shadow-2xl">
        <div className="flex-grow flex flex-col space-y-6">
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-[var(--text-accent)] to-[var(--text)] tracking-tight">
                AI GEN
            </h1>

            {/* Section: Generation */}
            <div className="space-y-4">
                <div className="group">
                    <label htmlFor="topic" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Topic</label>
                    <input
                        id="topic"
                        type="text"
                        value={topic}
                        onChange={(e) => setTopic(e.target.value)}
                        placeholder="e.g., The water cycle"
                        className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)] transition-all"
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                         <label htmlFor="diagramType" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Type</label>
                        <select
                            id="diagramType"
                            value={diagramType}
                            onChange={(e) => setDiagramType(e.target.value as DiagramType)}
                            className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                        >
                            {Object.values(DiagramType).map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label htmlFor="depth" className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-1">Detail</label>
                        <select
                            id="depth"
                            value={depth}
                            onChange={(e) => setDepth(e.target.value as DepthLevel)}
                            className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                        >
                            {Object.values(DepthLevel).map(level => (
                                <option key={level} value={level}>{level}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {diagramType === DiagramType.MINDMAP && (
                     <div className="bg-[var(--bg-alt)] p-3 rounded-xl border border-[var(--border-light)]">
                        <div className="flex justify-between mb-2">
                             <label htmlFor="nodeCount" className="block text-xs font-bold text-[var(--text-muted)]">NODE COUNT</label>
                             <span className="text-xs font-mono text-[var(--text-accent)]">{nodeCount}</span>
                        </div>
                        <input
                            id="nodeCount"
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={nodeCount}
                            onChange={(e) => setNodeCount(parseInt(e.target.value))}
                            className="w-full h-1 bg-[var(--border-med)] rounded-lg appearance-none cursor-pointer accent-[var(--text-accent)]"
                        />
                    </div>
                )}

                 <button
                    onClick={onGenerate}
                    disabled={isLoading || !topic}
                    className="w-full bg-gradient-to-r from-[var(--text-accent)] to-[var(--bg-panel-header-dark)] text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none transition-all flex items-center justify-center"
                >
                    {isLoading && <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                    {isLoading ? 'GENERATING...' : 'GENERATE DIAGRAM'}
                </button>
            </div>

            <hr className="border-[var(--border-light)]" />

            {/* Section: Auto Layout */}
            <div className="space-y-3">
                <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Auto Layout</h2>
                <div className="grid grid-cols-3 gap-2">
                    <button 
                        onClick={() => onAutoLayout('tree')}
                        className="flex flex-col items-center justify-center p-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg hover:border-[var(--text-accent)] transition-colors"
                        title="Tree Layout"
                    >
                         <svg className="w-5 h-5 mb-1 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3v18M8 8l4-4 4 4M8 16l4 4 4-4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         <span className="text-[10px] font-medium text-[var(--text)]">Tree</span>
                    </button>
                     <button 
                        onClick={() => onAutoLayout('horizontal')}
                        className="flex flex-col items-center justify-center p-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg hover:border-[var(--text-accent)] transition-colors"
                        title="Horizontal Tree"
                    >
                         <svg className="w-5 h-5 mb-1 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 12h18M8 8l-4 4 4 4M16 8l4 4-4 4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                         <span className="text-[10px] font-medium text-[var(--text)]">Horiz.</span>
                    </button>
                    <button 
                        onClick={() => onAutoLayout('radial')}
                        className="flex flex-col items-center justify-center p-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg hover:border-[var(--text-accent)] transition-colors"
                        title="Radial Mind Map"
                    >
                         <svg className="w-5 h-5 mb-1 text-[var(--text-muted)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M12 9V3M12 15v6M9 12H3M15 12h6M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1l2.1-2.1M17 7l2.1-2.1"/></svg>
                         <span className="text-[10px] font-medium text-[var(--text)]">Radial</span>
                    </button>
                </div>
            </div>

            <hr className="border-[var(--border-light)]" />

            {/* Section: Appearance */}
            <div className="space-y-4">
                <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Appearance</h2>
                
                 <div>
                    <select
                        id="theme"
                        value={currentTheme}
                        onChange={(e) => setTheme(e.target.value)}
                        className="w-full px-3 py-2 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)]"
                    >
                        {Object.entries(THEMES).map(([key, theme]) => (
                            <option key={key} value={key}>{theme.name}</option>
                        ))}
                    </select>
                </div>
                
                <div className="flex gap-2 flex-wrap bg-[var(--bg-alt)] p-3 rounded-xl border border-[var(--border-light)]">
                     {PRESET_COLORS.map(c => (
                        <button 
                            key={c} 
                            onClick={() => setBackgroundColor(c)}
                            className={`w-6 h-6 rounded-full border-2 shadow-sm transition-transform hover:scale-110 ${backgroundColor === c ? 'border-[var(--text-accent)] scale-110' : 'border-transparent'}`}
                            style={{ backgroundColor: c }}
                            title={c}
                            aria-label={`Select color ${c}`}
                        />
                    ))}
                    <input
                        type="color"
                        value={backgroundColor}
                        onChange={(e) => setBackgroundColor(e.target.value)}
                        className="w-6 h-6 p-0 border-0 rounded-full overflow-hidden cursor-pointer"
                    />
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--bg-alt)] rounded-xl border border-[var(--border-light)]">
                    <label htmlFor="darkModeToggle" className="text-sm font-medium text-[var(--text)]">Dark Mode</label>
                    <div className="relative inline-block w-10 mr-2 align-middle select-none transition duration-200 ease-in">
                        <input type="checkbox" name="toggle" id="darkModeToggle" checked={isDarkMode} onChange={(e) => setDarkMode(e.target.checked)} className="toggle-checkbox absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer transition-transform duration-200 ease-in-out transform translate-x-0 checked:translate-x-5 checked:bg-[var(--text-accent)] checked:border-0 border-gray-300"/>
                        <label htmlFor="darkModeToggle" className="toggle-label block overflow-hidden h-5 rounded-full bg-gray-300 cursor-pointer"></label>
                    </div>
                </div>
            </div>

            <hr className="border-[var(--border-light)]" />

            {/* Section: Tools */}
            <div className="space-y-3">
                 <h2 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Tools</h2>
                 <button
                    onClick={onAddNode}
                    className="w-full bg-[var(--bg-alt)] text-[var(--text-accent)] border border-[var(--border-med)] hover:border-[var(--text-accent)] font-semibold py-2 px-4 rounded-lg transition-all flex items-center justify-center gap-2 text-sm"
                >
                    <span className="text-lg">+</span> Add Node Manually
                </button>
                 <button onClick={onDownloadSVG} className="w-full bg-[var(--bg-alt)] text-[var(--text)] border border-[var(--border-med)] font-semibold py-2 px-4 rounded-lg hover:bg-[var(--border-light)] transition-colors text-sm">
                    Download SVG
                 </button>
                 
                 <div className="pt-2">
                    <label htmlFor="canvasWidth" className="text-xs text-[var(--text-muted)] block mb-1">Canvas Size</label>
                    <div className="flex gap-2">
                        <input
                            type="number"
                            value={canvasWidth}
                            onChange={(e) => onCanvasSizeChange('width', parseInt(e.target.value, 10) || 0)}
                            className="w-1/2 px-2 py-1 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded text-xs"
                            placeholder="W"
                        />
                        <input
                            type="number"
                            value={canvasHeight}
                            onChange={(e) => onCanvasSizeChange('height', parseInt(e.target.value, 10) || 0)}
                            className="w-1/2 px-2 py-1 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded text-xs"
                            placeholder="H"
                        />
                    </div>
                 </div>
            </div>

            <div className="mt-auto pt-4">
                 <details className="text-xs text-[var(--text-muted)]">
                    <summary className="cursor-pointer hover:text-[var(--text-accent)] mb-2 list-none font-bold">Edit JSON Data</summary>
                    <textarea
                        spellCheck="false"
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        className="w-full bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-md p-2 font-mono text-xs resize-y min-h-[100px]"
                    />
                     <button
                        onClick={onRender}
                        className="w-full mt-2 bg-[var(--bg-panel-alt)] text-[var(--text)] border border-[var(--border-med)] font-semibold py-1 px-2 rounded-md hover:bg-[var(--border-light)] transition-colors text-xs"
                    >
                        Update from JSON
                    </button>
                </details>
            </div>

        </div>
    </div>
  );
};

export default Controls;