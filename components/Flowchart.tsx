
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef } from 'react';
import { FlowchartData, Position, Node as NodeType, Connector as ConnectorType, SideBox as SideBoxType, SupportingPanel as SupportingPanelType, DiagramType, Size } from '../types';

// --- Draggable Hook ---
const useDraggable = (
    initialPosition: Position, 
    onDragEnd: (p: Position) => void, 
    scale: number = 1,
    onDrag?: (p: Position) => void
) => {
    const [position, setPosition] = useState(initialPosition);
    const [dragState, setDragState] = useState({ isDragging: false, start: { x: 0, y: 0 }, elStart: { x: 0, y: 0 } });

    // Use refs to keep callbacks and state stable in event handlers
    const onDragRef = useRef(onDrag);
    const onDragEndRef = useRef(onDragEnd);
    const positionRef = useRef(position);

    useLayoutEffect(() => {
        onDragRef.current = onDrag;
        onDragEndRef.current = onDragEnd;
        positionRef.current = position;
    });

    useEffect(() => {
        if (!dragState.isDragging) {
            setPosition(initialPosition);
        }
    }, [initialPosition.x, initialPosition.y, dragState.isDragging]);

    const handleMove = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragState.isDragging) return;
        
        // Cancel drag if multi-touch (pinch) is detected
        if (window.TouchEvent && e instanceof TouchEvent && e.touches.length > 1) {
             setDragState(d => ({ ...d, isDragging: false }));
             return;
        }

        e.stopPropagation();
        e.preventDefault(); // Prevent scrolling on touch
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
        // Adjust delta by scale
        const dx = (clientX - dragState.start.x) / scale;
        const dy = (clientY - dragState.start.y) / scale;
        
        const newPos = { x: dragState.elStart.x + dx, y: dragState.elStart.y + dy };
        setPosition(newPos);
        
        if (onDragRef.current) {
            onDragRef.current(newPos);
        }
    }, [dragState, scale]);

    const handleEnd = useCallback((e: MouseEvent | TouchEvent) => {
        if (!dragState.isDragging) return;
        e.stopPropagation();
        setDragState(d => ({ ...d, isDragging: false }));
        
        if (onDragEndRef.current) {
            onDragEndRef.current(positionRef.current);
        }
    }, [dragState.isDragging]);

    useEffect(() => {
        if (dragState.isDragging) {
            window.addEventListener('mousemove', handleMove);
            window.addEventListener('touchmove', handleMove, { passive: false });
            window.addEventListener('mouseup', handleEnd);
            window.addEventListener('touchend', handleEnd);
        }
        return () => {
            window.removeEventListener('mousemove', handleMove);
            window.removeEventListener('touchmove', handleMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchend', handleEnd);
        };
    }, [dragState.isDragging, handleMove, handleEnd]);

    const handleStart = (e: React.MouseEvent | React.TouchEvent) => {
        e.stopPropagation();
        // Only left click
        if ('button' in e && e.button !== 0) return;
        
        // Ignore if multi-touch start
        if ('touches' in e && e.touches.length > 1) return;

        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        setDragState({ isDragging: true, start: { x: clientX, y: clientY }, elStart: position });
    };

    return {
        position,
        dragHandlers: {
            onMouseDown: handleStart,
            onTouchStart: handleStart,
        }
    };
};

// --- Helper Functions and Components ---

const getIcon = (iconName?: string): string => {
  switch (iconName) {
    case 'droplet': return '💧'; case 'spring': return '➰'; case 'spark': return '⚡️';
    case 'exhaust': return '💨'; case 'gear': return '⚙️'; case 'pump': return '⛽️';
    case 'bolt': return '⚡️'; case 'idea': return '💡'; case 'check': return '✅';
    case 'warning': return '⚠️'; case 'search': return '🔍';
    default: return '📄';
  }
};

interface DraggableSupportingPanelProps {
    panel: SupportingPanelType;
    nodes: NodeType[];
    onPositionChange: (newPosition: Position, commit?: boolean) => void;
    fontFamily: string;
    scale: number;
}

const DraggableSupportingPanel: React.FC<DraggableSupportingPanelProps> = ({ panel, nodes, onPositionChange, fontFamily, scale }) => {
    const handleDrag = useCallback((newPos: Position) => {
        onPositionChange(newPos, false);
    }, [onPositionChange]);

    const handleDragEnd = useCallback((newPos: Position) => {
        onPositionChange(newPos, true);
    }, [onPositionChange]);

    const { position, dragHandlers } = useDraggable(panel.position, handleDragEnd, scale, handleDrag);
    const textRefs = React.useRef<(HTMLDivElement | null)[]>([]);
    const [itemLayouts, setItemLayouts] = useState<{y: number, height: number}[]>([]);
    
    useLayoutEffect(() => {
        const newLayouts: {y: number, height: number}[] = [];
        let yOffset = position.y + 68;
        
        textRefs.current.forEach((el) => {
            const textHeight = el?.scrollHeight ?? 0;
            const itemHeight = Math.max(62, textHeight + 20);
            newLayouts.push({ y: yOffset, height: itemHeight });
            yOffset += itemHeight + 18;
        });
        
        if (JSON.stringify(newLayouts) !== JSON.stringify(itemLayouts)) {
            setItemLayouts(newLayouts);
        }
    }, [panel.items, position.y, itemLayouts]);

    const { x: px = 0, y: py = 0, w: pw = 0 } = { ...(panel.size || {}), ...position };
    const lastItem = itemLayouts[itemLayouts.length - 1];
    const contentHeight = lastItem ? (lastItem.y + lastItem.height - py) + 20 : 0;
    const panelHeight = Math.max(panel.size.h, contentHeight);

    return (
        <g>
            <rect x={px} y={py} width={pw} height={panelHeight} rx={12} fill="url(#grad-side-panel)" stroke="var(--border-dark)" strokeWidth="1.2" style={{ filter: 'url(#ds-lg)' }} />
            <rect x={px} y={py} width={pw} height={56} rx={12} ry={12} fill="url(#grad-header)" {...dragHandlers} className="svg-draggable" />
            <rect x={px} y={py + 44} width={pw} height={12} fill="url(#grad-header)" />
            <text x={px + 18} y={py + 36} fontSize={18} fontWeight="700" fill="var(--text-header)" style={{ pointerEvents: 'none' }}>{panel.title}</text>
            
            {panel.items.map((item, idx) => {
                const layout = itemLayouts[idx] || { y: py + 68 + idx * 80, height: 62 };
                const { y: iy, height: itemHeight } = layout;
                const node = item.connectsToNode ? nodes.find(n => n.id === item.connectsToNode) : null;
                const toX = node ? node.position.x + node.size.w / 2 : 0;
                const toY = node ? node.position.y : 0;
                const fromX = px;
                const fromY = iy + itemHeight / 2;
                const dPath = node ? `M ${fromX} ${fromY} C ${fromX - 60} ${fromY}, ${toX} ${toY - 60}, ${toX} ${toY}` : '';

                return (
                    <g key={item.id}>
                         {node && (
                            <path d={dPath} stroke={item.color || '#64748b'} strokeWidth="2" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead)" opacity="0.6" />
                        )}
                        <rect x={px + 16} y={iy} width={pw - 32} height={itemHeight} rx={8} fill="var(--bg-panel)" stroke="var(--border-light)" />
                        <circle cx={px + 40} cy={iy + itemHeight/2} r={16} fill={`${item.color || '#3b82f6'}20`} />
                         <text x={px + 40} y={iy + itemHeight/2 + 5} textAnchor="middle" fontSize={16}>{getIcon(item.icon)}</text>
                        <foreignObject x={px + 68} y={iy + 10} width={pw - 90} height={itemHeight - 20}>
                            <div ref={el => { textRefs.current[idx] = el }} style={{ fontFamily, fontSize: '12px', color: 'var(--text)' }}>
                                <strong style={{ display: 'block', marginBottom: '2px' }}>{item.title}</strong>
                                <span style={{ color: 'var(--text-muted)' }}>{item.description}</span>
                            </div>
                        </foreignObject>
                    </g>
                );
            })}
        </g>
    );
};

// --- Draggable Node Component ---

interface DraggableNodeProps {
    node: NodeType;
    onPositionChange: (id: string, pos: Position, commit?: boolean) => void;
    onSizeChange: (id: string, size: Size) => void;
    onDoubleClick: (node: NodeType) => void;
    zoom: number;
    diagramType: DiagramType;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ node, onPositionChange, onSizeChange, onDoubleClick, zoom, diagramType }) => {
    const handleDrag = useCallback((newPos: Position) => {
        onPositionChange(node.id, newPos, false);
    }, [node.id, onPositionChange]);

    const handleDragEnd = useCallback((newPos: Position) => {
        onPositionChange(node.id, newPos, true);
    }, [node.id, onPositionChange]);

    const { position, dragHandlers } = useDraggable(node.position, handleDragEnd, zoom, handleDrag);
    const contentRef = React.useRef<HTMLDivElement>(null);

    // Auto-resize node based on text content
    useLayoutEffect(() => {
        if (contentRef.current) {
            const contentHeight = contentRef.current.scrollHeight;
            // Add padding
            const newHeight = Math.max(86, contentHeight + 40); 
            if (Math.abs(newHeight - node.size.h) > 5) {
               onSizeChange(node.id, { w: node.size.w, h: newHeight });
            }
        }
    }, [node.description, node.title, node.size.w, onSizeChange, node.id, diagramType]);

    const { x, y } = position;
    const { w, h } = node.size;

    // Determine Icon Y Position
    const iconY = diagramType === DiagramType.MINDMAP ? 43 : h / 2;

    return (
        <g transform={`translate(${x}, ${y})`} className="svg-draggable" onDoubleClick={(e) => { e.stopPropagation(); onDoubleClick(node); }}>
             <defs>
                <clipPath id={`clip-${node.id}`}>
                    <rect width={w} height={h} rx={diagramType === DiagramType.MINDMAP ? 20 : 8} />
                </clipPath>
            </defs>
            
            <rect 
                width={w} 
                height={h} 
                rx={diagramType === DiagramType.MINDMAP ? 20 : 8} 
                fill={`url(#grad-node-${node.type === 'output' ? 'output' : 'main'})`} 
                stroke={node.type === 'output' ? 'var(--text-accent)' : 'var(--border-med)'} 
                strokeWidth={node.type === 'output' ? 2 : 1}
                style={{ filter: 'url(#ds-sm)' }}
                {...dragHandlers}
            />
            
            {/* Icon Container */}
            <circle cx={40} cy={iconY} r={24} fill="url(#grad-icon)" stroke="var(--border-light)" />
            
            {node.imageUrl ? (
                <image x={16} y={iconY - 24} width={48} height={48} href={node.imageUrl} clipPath={`circle(24px at 24px 24px)`} preserveAspectRatio="xMidYMid slice" pointerEvents="none"/>
            ) : (
                <text x={40} y={iconY + 8} fontSize="24" textAnchor="middle" pointerEvents="none">{getIcon(node.icon)}</text>
            )}

            {/* Text Content */}
            <foreignObject x={80} y={10} width={w - 90} height={h - 20} style={{ pointerEvents: 'none' }}>
                <div ref={contentRef} style={{ 
                    fontFamily: 'var(--font)', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    justifyContent: diagramType === DiagramType.MINDMAP ? 'flex-start' : 'center',
                    height: '100%',
                    paddingTop: diagramType === DiagramType.MINDMAP ? '12px' : '0'
                }}>
                    <div style={{ fontWeight: 'bold', fontSize: '16px', color: 'var(--text)', marginBottom: '4px' }}>{node.title}</div>
                    <div style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: '1.4' }}>{node.description}</div>
                </div>
            </foreignObject>
        </g>
    );
};


// --- Main Flowchart Component ---

interface FlowchartProps {
  data: FlowchartData | null;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onPanelPositionChange: (pos: Position, commit?: boolean) => void;
  onNodePositionChange: (id: string, pos: Position, commit?: boolean) => void;
  onNodeSizeChange: (id: string, size: Size) => void;
  onNodeDoubleClick: (node: NodeType) => void;
  onCanvasResize: (size: Size, commit?: boolean) => void;
  zoom: number;
  onZoomChange: (z: number) => void;
  pan: Position;
  onPanChange: (p: Position) => void;
  diagramType: DiagramType;
}

const Flowchart: React.FC<FlowchartProps> = ({ 
    data, svgRef, onPanelPositionChange, onNodePositionChange, onNodeSizeChange, onNodeDoubleClick, onCanvasResize, zoom, onZoomChange, pan, onPanChange, diagramType
}) => {
  if (!data) return <div className="w-full h-full flex items-center justify-center text-[var(--text-muted)]">No data to render</div>;

  // Canvas Draggable (Panning)
  const { position: canvasPan, dragHandlers: canvasDrag } = useDraggable(pan, (p) => onPanChange(p), 1, (p) => onPanChange(p));
  
  // Canvas Resizer
  const handleResizeDrag = (p: Position) => {
      onCanvasResize({ w: Math.max(100, p.x), h: Math.max(100, p.y) }, false);
  };
  const handleResizeEnd = (p: Position) => {
      onCanvasResize({ w: Math.max(100, p.x), h: Math.max(100, p.y) }, true);
  };
  const { position: resizeHandle, dragHandlers: resizeDrag } = useDraggable(
      { x: data.canvas.width, y: data.canvas.height }, 
      handleResizeEnd, 
      zoom, 
      handleResizeDrag
  );

  // --- Pinch Zoom Logic ---
  const containerRef = useRef<HTMLDivElement>(null);
  const latestState = useRef({ zoom, pan });

  // Update refs
  useLayoutEffect(() => {
      latestState.current = { zoom, pan };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let startDist = 0;
    let startZoom = 1;
    let startPan = { x: 0, y: 0 };
    let center = { x: 0, y: 0 };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default browser behavior
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        startDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        const { zoom: z, pan: p } = latestState.current;
        startZoom = z;
        startPan = p;
        
        const rect = container.getBoundingClientRect();
        center = {
          x: (t1.clientX + t2.clientX) / 2 - rect.left,
          y: (t1.clientY + t2.clientY) / 2 - rect.top
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        e.stopPropagation();

        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
        
        if (startDist > 0 && dist > 0) {
           const scale = dist / startDist;
           let newZoom = startZoom * scale;
           newZoom = Math.max(0.2, Math.min(3, newZoom));

           // Pan formula: P_new = P_old + ScreenCenter * (1/Z_new - 1/Z_old)
           const newPanX = startPan.x + center.x * (1/newZoom - 1/startZoom);
           const newPanY = startPan.y + center.y * (1/newZoom - 1/startZoom);
           
           onZoomChange(newZoom);
           onPanChange({ x: newPanX, y: newPanY });
        }
      }
    };

    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
        container.removeEventListener('touchstart', handleTouchStart);
        container.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div 
        ref={containerRef}
        className="w-full h-full overflow-hidden cursor-grab active:cursor-grabbing bg-[var(--bg-alt)] relative" 
        {...canvasDrag}
    >
      <svg
        ref={svgRef}
        width="100%"
        height="100%"
        viewBox={`${-canvasPan.x} ${-canvasPan.y} ${window.innerWidth / zoom} ${window.innerHeight / zoom}`}
        className="block"
        style={{ touchAction: 'none' }}
      >
        <defs>
          <linearGradient id="grad-node-main" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-grad-node-1)" />
            <stop offset="100%" stopColor="var(--bg-grad-node-2)" />
          </linearGradient>
          <linearGradient id="grad-node-output" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-grad-node-1)" />
            <stop offset="100%" stopColor="#eff6ff" />
          </linearGradient>
          <linearGradient id="grad-icon" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-grad-icon-1)" />
            <stop offset="100%" stopColor="var(--bg-grad-icon-2)" />
          </linearGradient>
          <linearGradient id="grad-header" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--bg-panel-header)" />
            <stop offset="100%" stopColor="var(--bg-panel-header-dark)" />
          </linearGradient>
           <linearGradient id="grad-side-panel" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="var(--bg-grad-side-panel-1)" />
            <stop offset="100%" stopColor="var(--bg-grad-side-panel-2)" />
          </linearGradient>
          <filter id="ds-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="var(--shadow-color)" />
          </filter>
          <filter id="ds-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--shadow-color)" />
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-dark)" />
          </marker>
        </defs>

        <g transform={`scale(${zoom})`}>
             {/* Canvas Background Area */}
            <rect x="0" y="0" width={data.canvas.width} height={data.canvas.height} fill="var(--bg)" stroke="var(--border-light)" strokeDasharray="5 5" />
            
            {/* Header Image or Title */}
            {data.headerImage ? (
                <image href={data.headerImage} x="0" y="0" width={data.canvas.width} height={Math.min(300, data.canvas.height/3)} preserveAspectRatio="xMidYMid slice" opacity="0.9"/>
            ) : (
                 <g>
                     <rect x="0" y="0" width={data.canvas.width} height="150" fill="url(#grad-header)" opacity="0.1"/>
                     <text x={data.canvas.width/2} y="80" textAnchor="middle" fontSize="32" fontWeight="bold" fill="var(--text)">{data.title}</text>
                     <text x={data.canvas.width/2} y="110" textAnchor="middle" fontSize="16" fill="var(--text-muted)">{data.caption}</text>
                 </g>
            )}
            
            {/* Connectors */}
            {data.connectors.map(conn => {
                const fromNode = data.nodes.find(n => n.id === conn.from);
                const toNode = data.nodes.find(n => n.id === conn.to);
                if (!fromNode || !toNode) return null;

                const from = { x: fromNode.position.x + fromNode.size.w / 2, y: fromNode.position.y + fromNode.size.h };
                const to = { x: toNode.position.x + toNode.size.w / 2, y: toNode.position.y };
                
                let d = '';
                if (diagramType === DiagramType.MINDMAP) {
                     const fc = { x: fromNode.position.x + fromNode.size.w/2, y: fromNode.position.y + fromNode.size.h/2 };
                     const tc = { x: toNode.position.x + toNode.size.w/2, y: toNode.position.y + toNode.size.h/2 };
                     d = `M ${fc.x} ${fc.y} L ${tc.x} ${tc.y}`;
                } else {
                    if (fromNode.position.y > toNode.position.y + 50) {
                         d = `M ${fromNode.position.x + fromNode.size.w} ${fromNode.position.y + fromNode.size.h/2} C ${fromNode.position.x + fromNode.size.w + 100} ${fromNode.position.y + fromNode.size.h/2}, ${toNode.position.x + toNode.size.w + 100} ${toNode.position.y + toNode.size.h/2}, ${toNode.position.x + toNode.size.w} ${toNode.position.y + toNode.size.h/2}`;
                    } else {
                        d = `M ${from.x} ${from.y} C ${from.x} ${from.y + 60}, ${to.x} ${to.y - 60}, ${to.x} ${to.y}`;
                    }
                }

                return (
                    <path 
                        key={conn.id} 
                        d={d} 
                        stroke="var(--border-accent)" 
                        strokeWidth={conn.style?.strokeWidth || 2} 
                        strokeDasharray={conn.style?.strokeDasharray}
                        fill="none" 
                        markerEnd={diagramType === DiagramType.MINDMAP ? "" : "url(#arrowhead)"} 
                    />
                );
            })}

            {/* Nodes */}
            {data.nodes.map(node => (
                <DraggableNode 
                    key={node.id} 
                    node={node} 
                    onPositionChange={onNodePositionChange} 
                    onSizeChange={onNodeSizeChange}
                    onDoubleClick={onNodeDoubleClick}
                    zoom={zoom}
                    diagramType={diagramType}
                />
            ))}

            {/* Side Boxes */}
            {data.sideBoxes?.map(box => {
                const anchorNode = data.nodes.find(n => n.id === box.attachToNode);
                if (!anchorNode) return null;
                const ax = anchorNode.position.x + anchorNode.size.w;
                const ay = anchorNode.position.y + anchorNode.size.h / 2;
                const bx = anchorNode.position.x + anchorNode.size.w + 60;
                const by = ay - box.size.h/2;
                
                return (
                    <g key={box.id}>
                         <path d={`M ${ax} ${ay} L ${bx} ${ay}`} stroke="var(--border-dark)" strokeWidth="1" strokeDasharray={box.lineStyle === 'dotted' ? '3 3' : ''} />
                         <rect x={bx} y={by} width={box.size.w} height={box.size.h} rx={4} fill="var(--bg-panel-alt)" stroke="var(--border-med)" />
                         <foreignObject x={bx} y={by} width={box.size.w} height={box.size.h}>
                             <div className="flex items-center justify-center h-full text-xs text-center p-2 text-[var(--text-muted)]">
                                 {box.text}
                             </div>
                         </foreignObject>
                    </g>
                )
            })}

            {/* Supporting Panel */}
            {data.supportingPanel && (
                <DraggableSupportingPanel 
                    panel={data.supportingPanel} 
                    nodes={data.nodes} 
                    onPositionChange={onPanelPositionChange}
                    fontFamily="var(--font)"
                    scale={zoom}
                />
            )}
            
             {/* Resize Handle */}
            <circle 
                cx={data.canvas.width} 
                cy={data.canvas.height} 
                r={8 / zoom} 
                fill="white" 
                stroke="var(--text-accent)" 
                strokeWidth={2} 
                cursor="nwse-resize"
                className="svg-draggable"
                {...resizeDrag}
            />
        </g>
      </svg>
    </div>
  );
};

export default Flowchart;
