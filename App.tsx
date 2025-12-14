
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Controls from './components/Controls';
import Flowchart from './components/Flowchart';
import { generateFlowchartJson, generateEnhancedDescription, generateSubnodes } from './services/geminiService';
import { FlowchartData, DepthLevel, Position, Node as NodeType, DiagramType, Size } from './types';
import { DEFAULT_FLOWCHART_DATA, THEMES } from './constants';

const App: React.FC = () => {
  const [topic, setTopic] = useState<string>('How a gasoline engine works');
  const [depth, setDepth] = useState<DepthLevel>(DepthLevel.DETAILED);
  const [diagramType, setDiagramType] = useState<DiagramType>(DiagramType.FLOWCHART);
  const [jsonText, setJsonText] = useState<string>(JSON.stringify(DEFAULT_FLOWCHART_DATA, null, 2));
  const [flowchartData, setFlowchartData] = useState<FlowchartData | null>(DEFAULT_FLOWCHART_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isDarkMode, setDarkMode] = useState<boolean>(false);
  const [isControlsVisible, setControlsVisible] = useState(true);
  const svgRef = useRef<SVGSVGElement>(null);

  // New Feature States
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<Position>({ x: 0, y: 0 });
  const [theme, setTheme] = useState<string>('default');
  const [editingNode, setEditingNode] = useState<NodeType | null>(null);
  const [isDescriptionGenerating, setIsDescriptionGenerating] = useState(false);
  const [isSubnodesGenerating, setIsSubnodesGenerating] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [nodeCount, setNodeCount] = useState<number>(15);

  // Undo/Redo History State
  const [history, setHistory] = useState<FlowchartData[]>([DEFAULT_FLOWCHART_DATA]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Push state to history
  const pushToHistory = useCallback((newData: FlowchartData) => {
      setHistory(prev => {
          const newHistory = prev.slice(0, historyIndex + 1);
          return [...newHistory, newData];
      });
      setHistoryIndex(prev => prev + 1);
      setFlowchartData(newData);
      setJsonText(JSON.stringify(newData, null, 2));
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
      if (historyIndex > 0) {
          const prevData = history[historyIndex - 1];
          setHistoryIndex(historyIndex - 1);
          setFlowchartData(prevData);
          setJsonText(JSON.stringify(prevData, null, 2));
      }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
      if (historyIndex < history.length - 1) {
          const nextData = history[historyIndex + 1];
          setHistoryIndex(historyIndex + 1);
          setFlowchartData(nextData);
          setJsonText(JSON.stringify(nextData, null, 2));
      }
  }, [historyIndex, history]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        handleRedo();
      }
      if (e.key === 'Escape' && editingNode) {
          setEditingNode(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, editingNode]);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      if (backgroundColor === '#f8fafc') setBackgroundColor('#0f172a');
    } else {
      document.documentElement.classList.remove('dark');
      if (backgroundColor === '#0f172a') setBackgroundColor('#f8fafc');
    }
  }, [isDarkMode]);

  const handleGenerate = async () => {
    if (!topic) {
      setError("Please enter a topic.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      // 1. Generate the Structure
      const data = await generateFlowchartJson(topic, depth, diagramType, nodeCount);
      
      setFlowchartData(data);
      setJsonText(JSON.stringify(data, null, 2));
      setHistory([data]);
      setHistoryIndex(0);
      setZoom(1);
      setPan({ x: 0, y: 0 });
      setIsLoading(false); 

    } catch (err) {
      setIsLoading(false);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred while generating the flowchart.");
      }
    }
  };

  const handleRender = () => {
    try {
      const data = JSON.parse(jsonText);
      setFlowchartData(data);
      pushToHistory(data);
      setError(null);
    } catch (err) {
      setError("Invalid JSON format.");
    }
  };
  
  const downloadFile = (content: string, fileName: string, contentType: string) => {
      const a = document.createElement("a");
      const file = new Blob([content], { type: contentType });
      a.href = URL.createObjectURL(file);
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
  };
  
  const handleDownloadSVG = () => {
    if (!svgRef.current || !flowchartData) return;

    // Use strictly the canvas dimensions to ensure WYSIWYG relative to canvas border
    const width = flowchartData.canvas.width;
    const height = flowchartData.canvas.height;

    const serializer = new XMLSerializer();
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', width.toString());
    bgRect.setAttribute('height', height.toString());
    bgRect.setAttribute('fill', backgroundColor);
    svgClone.insertBefore(bgRect, svgClone.firstChild);

    const styleEl = document.createElement('style');
    const themeColors = THEMES[theme as keyof typeof THEMES].colors;
    let cssRules = ':root { ';
    Object.entries(themeColors).forEach(([key, val]) => {
        cssRules += `${key}: ${val}; `;
    });
    cssRules += '}';
    styleEl.textContent = cssRules;
    svgClone.prepend(styleEl);

    const svgString = serializer.serializeToString(svgClone);
    downloadFile(svgString, "flowchart.svg", "image/svg+xml;charset=utf-8");
  };

  const handleDownloadPNG = () => {
    if (!svgRef.current || !flowchartData) return;

    // Use strict canvas dimensions to ensure title centering is correct
    const width = flowchartData.canvas.width;
    const height = flowchartData.canvas.height;
    
    const serializer = new XMLSerializer();
    const svgClone = svgRef.current.cloneNode(true) as SVGSVGElement;
    
    svgClone.setAttribute('width', width.toString());
    svgClone.setAttribute('height', height.toString());
    svgClone.setAttribute('viewBox', `0 0 ${width} ${height}`);
    
    const computedStyle = getComputedStyle(document.documentElement);
    
    const varNames = [
        '--bg', '--bg-alt', '--bg-panel', '--bg-panel-alt', '--bg-panel-header', '--bg-panel-header-dark',
        '--bg-grad-node-1', '--bg-grad-node-2', '--bg-grad-side-panel-1', '--bg-grad-side-panel-2',
        '--bg-grad-title-1', '--bg-grad-title-2', '--sidefill', '--text', '--text-light', '--text-muted',
        '--text-accent', '--text-header', '--border-light', '--border-med', '--border-dark', '--border-accent',
        '--shadow-color', '--font'
    ];
    
    const themeColors = THEMES[theme as keyof typeof THEMES].colors;
    const cssVars = varNames.map(name => {
        const val = themeColors[name as keyof typeof themeColors] || computedStyle.getPropertyValue(name).trim();
        return `${name}: ${val}`;
    }).join(';');

    const styleEl = document.createElement('style');
    styleEl.textContent = `
        :root { ${cssVars} }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        div { font-family: var(--font); line-height: 1.4; word-wrap: break-word; color: var(--text); }
        strong { font-size: 14px; font-weight: 700; color: var(--text); display: block; }
        span { font-size: 12px; color: var(--text-muted); }
    `;

    const defs = svgClone.querySelector('defs') || document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    if (!svgClone.querySelector('defs')) {
        svgClone.insertBefore(defs, svgClone.firstChild);
    }
    defs.appendChild(styleEl);

    const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    bgRect.setAttribute('width', width.toString());
    bgRect.setAttribute('height', height.toString());
    bgRect.setAttribute('fill', backgroundColor);
    svgClone.insertBefore(bgRect, svgClone.firstChild);
    
    const svgString = serializer.serializeToString(svgClone);
    const svgStringUTF8 = unescape(encodeURIComponent(svgString));
    const base64SVG = btoa(svgStringUTF8);
    const url = `data:image/svg+xml;base64,${base64SVG}`;

    const img = new Image();
    const canvas = document.createElement('canvas');
    const scale = 2; 
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');

    img.onload = () => {
        if (ctx) {
            ctx.scale(scale, scale);
            ctx.drawImage(img, 0, 0);
            const pngUrl = canvas.toDataURL('image/png');
            const a = document.createElement('a');
            a.href = pngUrl;
            a.download = 'flowchart.png';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    };
    img.src = url;
  };
  
  const handlePanelPositionChange = useCallback((newPosition: Position, commit: boolean = true) => {
    if (!flowchartData) return;
    const newData = { ...flowchartData, supportingPanel: flowchartData.supportingPanel ? { ...flowchartData.supportingPanel, position: newPosition } : undefined };
    if (flowchartData.supportingPanel) {
         if (commit) {
            pushToHistory(newData);
         } else {
            setFlowchartData(newData);
         }
    }
  }, [flowchartData, pushToHistory]);

  const handleNodePositionChange = useCallback((nodeId: string, newPosition: Position, commit: boolean = true) => {
    if (!flowchartData) return;

    let newNodes = [...flowchartData.nodes];

    // Check if dragging Root Node in Mind Map
    const isMindMap = flowchartData.diagramType === DiagramType.MINDMAP || diagramType === DiagramType.MINDMAP;
    const isRootNode = isMindMap && !flowchartData.connectors.some(c => c.to === nodeId);

    if (isRootNode) {
        const draggingNode = flowchartData.nodes.find(n => n.id === nodeId);
        if (draggingNode) {
            // Calculate Delta
            const oldPos = draggingNode.position;
            const dx = newPosition.x - oldPos.x;
            const dy = newPosition.y - oldPos.y;

            // Move all nodes by delta
            newNodes = newNodes.map(node => ({
                ...node,
                position: {
                    x: node.position.x + dx,
                    y: node.position.y + dy
                }
            }));
        }
    } else {
        newNodes = newNodes.map(node => 
            node.id === nodeId ? { ...node, position: newPosition } : node
        );
    }
    
    const newData = { ...flowchartData, nodes: newNodes };
    
    if (commit) {
        pushToHistory(newData);
    } else {
        setFlowchartData(newData);
    }
  }, [flowchartData, pushToHistory, diagramType]);

  const handleNodeSizeChange = useCallback((nodeId: string, newSize: Size) => {
      setFlowchartData(prev => {
          if (!prev) return null;
          const newNodes = prev.nodes.map(node => 
              node.id === nodeId ? { ...node, size: newSize } : node
          );
          const newData = { ...prev, nodes: newNodes };
          setTimeout(() => setJsonText(JSON.stringify(newData, null, 2)), 0);
          return newData;
      });
  }, []);

  const handleCanvasResize = useCallback((newSize: Size, commit: boolean = true) => {
    if (!flowchartData) return;
    
    const newData = { 
        ...flowchartData, 
        canvas: { 
            width: Math.max(100, Math.floor(newSize.w)), 
            height: Math.max(100, Math.floor(newSize.h)) 
        } 
    };

    if (commit) {
        pushToHistory(newData);
    } else {
        setFlowchartData(newData);
    }
  }, [flowchartData, pushToHistory]);

  const handleNodeEditSave = (newTitle: string, newDesc: string) => {
      if (!editingNode || !flowchartData) return;
      const newNodes = flowchartData.nodes.map(n => n.id === editingNode.id ? { ...n, title: newTitle, description: newDesc } : n);
      const newData = { ...flowchartData, nodes: newNodes };
      pushToHistory(newData);
      setEditingNode(null);
  };

  const handleGenerateDescription = async () => {
      if (!editingNode) return;
      
      const textarea = document.getElementById('edit-desc') as HTMLTextAreaElement;
      const currentDesc = textarea ? textarea.value : editingNode.description;

      setIsDescriptionGenerating(true);
      try {
          const enhancedDesc = await generateEnhancedDescription(editingNode.title, currentDesc, topic);
          if (textarea) {
              textarea.value = enhancedDesc;
          }
      } catch (err) {
          console.error(err);
      } finally {
          setIsDescriptionGenerating(false);
      }
  };

  const handleGenerateSubnodes = async () => {
      if (!editingNode || !flowchartData) return;
      setIsSubnodesGenerating(true);
      
      try {
          const newSubnodes = await generateSubnodes(editingNode, topic);
          
          if (newSubnodes.length === 0) return;

          const isMindMap = flowchartData.diagramType === DiagramType.MINDMAP;
          
          // Calculate positions
          // Flowchart: Place below. Mindmap: Place radially outwards
          const parentCenter = { 
              x: editingNode.position.x + editingNode.size.w/2, 
              y: editingNode.position.y + editingNode.size.h/2 
          };

          const newNodes: NodeType[] = [];
          const newConnectors: any[] = [];
          
          const radius = 350;
          const startAngle = Math.random() * Math.PI * 2; // Random rotation start if no parent

          // Simple angle determination
          // If parent has a parent, continue that vector. If root, radiate.
          const incomingConnector = flowchartData.connectors.find(c => c.to === editingNode.id);
          let baseAngle = Math.PI / 2; // Default down
          
          if (isMindMap) {
               if (incomingConnector) {
                  const parentNode = flowchartData.nodes.find(n => n.id === incomingConnector.from);
                  if (parentNode) {
                      const pCenter = { x: parentNode.position.x + parentNode.size.w/2, y: parentNode.position.y + parentNode.size.h/2 };
                      baseAngle = Math.atan2(parentCenter.y - pCenter.y, parentCenter.x - pCenter.x);
                  }
               } else {
                   // Root
                   baseAngle = -Math.PI / 2;
               }
          }

          const angleSpread = isMindMap ? (incomingConnector ? Math.PI / 3 : Math.PI * 2) : 0; // If root, full circle. If child, narrow cone.
          
          newSubnodes.forEach((sn, idx) => {
              const id = `n-${Date.now()}-${idx}`;
              
              let nx, ny;

              if (isMindMap) {
                  let angle;
                  if (!incomingConnector) {
                      // Root: distribute evenly
                      angle = (idx / newSubnodes.length) * Math.PI * 2;
                  } else {
                      // Child: Cone
                      const offset = (idx - (newSubnodes.length - 1) / 2) * (Math.PI / 8); 
                      angle = baseAngle + offset;
                  }
                  
                  nx = parentCenter.x + Math.cos(angle) * radius - 150; // Centering offset assuming width 300
                  ny = parentCenter.y + Math.sin(angle) * radius - 40;
              } else {
                  // Flowchart: Vertical stack below
                  nx = editingNode.position.x + (idx - (newSubnodes.length-1)/2) * 320; 
                  ny = editingNode.position.y + 200;
              }

              newNodes.push({
                  id,
                  type: 'main',
                  title: sn.title,
                  description: sn.description,
                  icon: sn.icon,
                  position: { x: nx, y: ny },
                  size: { w: isMindMap ? 300 : 300, h: 100 }
              });

              newConnectors.push({
                  id: `c-${Date.now()}-${idx}`,
                  from: editingNode.id,
                  to: id,
                  type: 'flow'
              });
          });

          const newData = {
              ...flowchartData,
              nodes: [...flowchartData.nodes, ...newNodes],
              connectors: [...flowchartData.connectors, ...newConnectors]
          };
          
          pushToHistory(newData);

      } catch (e) {
          console.error(e);
          alert("Failed to generate subnodes. Please try again.");
      } finally {
          setIsSubnodesGenerating(false);
      }
  };

  const handleDeleteNode = () => {
    if (!editingNode || !flowchartData) return;
    const newNodes = flowchartData.nodes.filter(n => n.id !== editingNode.id);
    const newConnectors = flowchartData.connectors.filter(c => c.from !== editingNode.id && c.to !== editingNode.id);
    const newSideBoxes = flowchartData.sideBoxes ? flowchartData.sideBoxes.filter(s => s.attachToNode !== editingNode.id) : [];
    const newData = {
        ...flowchartData,
        nodes: newNodes,
        connectors: newConnectors,
        sideBoxes: newSideBoxes
    };
    pushToHistory(newData);
    setEditingNode(null);
  };

  const handleAddNode = () => {
      if (!flowchartData) return;
      const id = `n-${Date.now()}`;
      const centerX = -pan.x / zoom + (window.innerWidth / 2) / zoom;
      const centerY = -pan.y / zoom + (window.innerHeight / 2) / zoom;
      
      const newNode: NodeType = {
          id,
          type: 'main',
          title: 'New Node',
          description: 'Double click to edit description',
          icon: 'idea', 
          position: { x: Math.max(0, centerX - 300), y: Math.max(0, centerY - 40) },
          size: { w: 600, h: 80 }
      };
      const newData = {
          ...flowchartData,
          nodes: [...flowchartData.nodes, newNode]
      };
      pushToHistory(newData);
  };

  const themeStyles = THEMES[theme as keyof typeof THEMES].colors;

  return (
    <div className="relative h-screen w-screen transition-colors duration-300 overflow-hidden" style={{ ...themeStyles, '--bg': backgroundColor } as unknown as React.CSSProperties}>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
          <strong>Error:</strong> {error}
          <button onClick={() => setError(null)} className="absolute top-0 bottom-0 right-0 px-4 py-3 font-bold">&times;</button>
        </div>
      )}

      {/* Floating Node Editor Panel (Right Side) */}
      <div className={`fixed inset-y-0 right-0 z-[100] w-96 bg-[var(--bg-panel)]/95 backdrop-blur-xl border-l border-[var(--border-light)] shadow-2xl transform transition-transform duration-300 ease-in-out ${editingNode ? 'translate-x-0' : 'translate-x-full'}`}>
          {editingNode && (
            <div className="h-full flex flex-col p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-black uppercase text-[var(--text)] tracking-tight">Edit Node</h3>
                    <button onClick={() => setEditingNode(null)} className="p-2 rounded-full hover:bg-[var(--bg-alt)] transition-colors">
                        <svg className="w-6 h-6 text-[var(--text-muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="space-y-6 flex-grow">
                    <div>
                        <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-2">Title</label>
                        <input 
                            autoFocus
                            type="text" 
                            defaultValue={editingNode.title} 
                            id="edit-title"
                            className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)] text-[var(--text)] text-lg font-bold"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider">Description</label>
                            <button 
                                onClick={handleGenerateDescription}
                                disabled={isDescriptionGenerating}
                                className="text-xs font-bold text-[var(--text-accent)] hover:underline disabled:opacity-50 flex items-center gap-1"
                            >
                                {isDescriptionGenerating ? 'Expanding...' : '✨ Enhance w/ AI'}
                            </button>
                        </div>
                        <textarea 
                            defaultValue={editingNode.description} 
                            id="edit-desc"
                            className="w-full px-4 py-3 bg-[var(--bg-alt)] border border-[var(--border-med)] rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--text-accent)] text-[var(--text)] h-32 resize-none"
                        />
                    </div>

                    <div className="p-4 bg-[var(--bg-alt)] rounded-xl border border-[var(--border-med)]">
                        <h4 className="text-xs font-bold text-[var(--text-muted)] uppercase tracking-wider mb-3">AI Actions</h4>
                        <button
                            onClick={handleGenerateSubnodes}
                            disabled={isSubnodesGenerating}
                            className="w-full py-2 px-4 bg-white dark:bg-slate-700 border border-[var(--border-med)] rounded-lg shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 text-sm font-semibold text-[var(--text-accent)]"
                        >
                            {isSubnodesGenerating ? (
                                <>
                                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Generating...
                                </>
                            ) : (
                                <>
                                    <span>🌱</span> Generate Sub-nodes
                                </>
                            )}
                        </button>
                        <p className="text-[10px] text-[var(--text-muted)] mt-2 text-center">Creates 3-5 related child nodes.</p>
                    </div>

                </div>

                <div className="mt-6 space-y-3">
                     <button 
                        onClick={() => {
                            const t = (document.getElementById('edit-title') as HTMLInputElement).value;
                            const d = (document.getElementById('edit-desc') as HTMLTextAreaElement).value;
                            handleNodeEditSave(t, d);
                        }}
                        className="w-full py-3 px-4 bg-[var(--text-accent)] text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all"
                    >
                        Save Changes
                    </button>
                    <button onClick={handleDeleteNode} className="w-full py-3 px-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-semibold rounded-xl transition-colors border border-transparent hover:border-red-200">
                        Delete Node
                    </button>
                </div>
            </div>
          )}
      </div>

      <button 
        onClick={() => setControlsVisible(v => !v)}
        className="fixed top-6 z-30 bg-[var(--bg-panel)] hover:bg-[var(--bg-panel-alt)] border border-l-0 border-[var(--border-med)] rounded-r-lg px-2 py-3 transition-all duration-300 ease-in-out shadow-md"
        style={{ left: isControlsVisible ? '400px' : '0px' }}
        aria-label={isControlsVisible ? 'Hide controls' : 'Show controls'}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform text-[var(--text)] ${isControlsVisible ? '' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
      </button>
      
      <div className={`
        absolute top-0 left-0 h-full w-[400px] z-20 
        transform transition-transform duration-300 ease-in-out
        ${isControlsVisible ? 'translate-x-0' : '-translate-x-full'}
      `}>
          <Controls
            topic={topic}
            setTopic={setTopic}
            depth={depth}
            setDepth={setDepth}
            diagramType={diagramType}
            setDiagramType={setDiagramType}
            jsonText={jsonText}
            setJsonText={setJsonText}
            isDarkMode={isDarkMode}
            setDarkMode={setDarkMode}
            onGenerate={handleGenerate}
            onRender={handleRender}
            onDownloadSVG={handleDownloadSVG}
            onAddNode={handleAddNode}
            isLoading={isLoading}
            canvasWidth={flowchartData?.canvas.width ?? 1200}
            canvasHeight={flowchartData?.canvas.height ?? 1000}
            onCanvasSizeChange={(d, v) => {
                 const current = flowchartData?.canvas || { width: 1200, height: 1000 };
                 const newSize = { w: current.width, h: current.height };
                 if (d === 'width') newSize.w = v;
                 if (d === 'height') newSize.h = v;
                 handleCanvasResize(newSize, true);
            }}
            currentTheme={theme}
            setTheme={setTheme}
            backgroundColor={backgroundColor}
            setBackgroundColor={setBackgroundColor}
            nodeCount={nodeCount}
            setNodeCount={setNodeCount}
          />
      </div>
      
      <div className={`h-full w-full transition-all duration-300 ease-in-out ${isControlsVisible ? 'md:ml-[400px]' : 'ml-0'}`}>
          <main className="relative bg-transparent border-t md:border-t-0 md:border-l border-[var(--border-light)] p-0 overflow-hidden h-full w-full">
            
            <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
                 <div className="bg-[var(--bg-panel)]/90 backdrop-blur-md border border-[var(--border-med)] rounded-xl shadow-lg p-1 flex flex-col items-center">
                    <div className="flex border-b border-[var(--border-med)] w-full justify-center pb-1 mb-1">
                        <button onClick={handleUndo} disabled={historyIndex <= 0} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--bg-alt)] rounded-lg disabled:opacity-30" title="Undo (Ctrl+Z)">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                        </button>
                        <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--bg-alt)] rounded-lg disabled:opacity-30" title="Redo (Ctrl+Y)">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" /></svg>
                        </button>
                    </div>
                    <button onClick={() => setZoom(z => Math.min(z + 0.1, 3))} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--bg-alt)] rounded-lg" title="Zoom In">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                    </button>
                    <button onClick={() => setZoom(1)} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--bg-alt)] rounded-lg text-xs font-bold" title="Reset Zoom">
                        {Math.round(zoom * 100)}%
                    </button>
                    <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.2))} className="p-2 text-[var(--text-muted)] hover:text-[var(--text-accent)] hover:bg-[var(--bg-alt)] rounded-lg" title="Zoom Out">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" /></svg>
                    </button>
                 </div>

                 <button
                    onClick={handleDownloadPNG}
                    className="bg-[var(--bg-panel)]/90 backdrop-blur-md text-[var(--text)] border border-[var(--border-med)] text-xs font-bold py-2 px-3 rounded-xl hover:bg-[var(--border-light)] transition-colors flex items-center justify-center gap-2 shadow-lg"
                    title="Download PNG"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" /></svg>
                    PNG
                </button>
            </div>

            <div className="absolute bottom-4 left-4 z-10 bg-[var(--bg-panel)]/80 backdrop-blur-sm border border-[var(--border-med)] px-4 py-2 rounded-full text-xs font-medium text-[var(--text-muted)] shadow-md pointer-events-none">
                Double-click node to edit • Drag to pan • Ctrl+Z Undo
            </div>

            <Flowchart 
                data={flowchartData} 
                svgRef={svgRef} 
                onPanelPositionChange={handlePanelPositionChange} 
                onNodePositionChange={handleNodePositionChange} 
                onNodeSizeChange={handleNodeSizeChange}
                onNodeDoubleClick={setEditingNode}
                onCanvasResize={handleCanvasResize}
                zoom={zoom}
                onZoomChange={setZoom}
                pan={pan}
                onPanChange={setPan}
                diagramType={diagramType}
            />
          </main>
      </div>
    </div>
  );
};

export default App;