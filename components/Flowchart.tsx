
import React, { useState, useEffect, useCallback, useLayoutEffect, useRef, useMemo } from 'react';
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
        e.preventDefault(); // Prevent default browser scrolling
        
        const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        
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
        if ('button' in e && e.button !== 0) return;
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

const MIND_MAP_PALETTE = [
    '#ef4444', // Red
    '#f97316', // Orange
    '#f59e0b', // Amber
    '#84cc16', // Lime
    '#10b981', // Emerald
    '#06b6d4', // Cyan
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#d946ef', // Fuchsia
    '#f43f5e', // Rose
];

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
        let yOffset = position.y + 56; // Header height 48 + spacing 8
        
        textRefs.current.forEach((el) => {
            const textHeight = el?.scrollHeight ?? 0;
            const itemHeight = Math.max(50, textHeight + 20);
            newLayouts.push({ y: yOffset, height: itemHeight });
            yOffset += itemHeight + 12;
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
            {/* Main Background Panel */}
            <rect 
                x={px} y={py} 
                width={pw} height={panelHeight} 
                rx={12} 
                fill="var(--bg-panel)" 
                stroke="var(--border-med)" 
                strokeWidth="1" 
                style={{ filter: 'url(#ds-lg)' }} 
            />
            
            {/* Header Area */}
            <path 
                d={`M ${px} ${py+12} a 12 12 0 0 1 12 -12 h ${pw-24} a 12 12 0 0 1 12 12 v 36 h -${pw} z`} 
                fill="var(--bg-panel-header)" 
                {...dragHandlers} 
                className="svg-draggable" 
            />
            <text x={px + 16} y={py + 30} fontSize={15} fontWeight="700" fill="var(--text-header)" style={{ pointerEvents: 'none', letterSpacing: '0.05em' }}>
                {panel.title.toUpperCase()}
            </text>
            
            {/* Items */}
            {panel.items.map((item, idx) => {
                const layout = itemLayouts[idx] || { y: py + 56 + idx * 70, height: 60 };
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
                            <path d={dPath} stroke={item.color || '#64748b'} strokeWidth="1.5" strokeDasharray="4 4" fill="none" markerEnd="url(#arrowhead)" opacity="0.5" />
                        )}
                        
                        {/* Item Container */}
                        <rect x={px + 12} y={iy} width={pw - 24} height={itemHeight} rx={8} fill="var(--bg-alt)" stroke="var(--border-light)" />
                        
                        {/* Color Accent Pill */}
                        <rect x={px + 18} y={iy + 10} width={4} height={itemHeight - 20} rx={2} fill={item.color || '#3b82f6'} />

                        {/* Icon */}
                        <circle cx={px + 44} cy={iy + itemHeight/2} r={14} fill="var(--bg-panel)" stroke="var(--border-light)" />
                        <text x={px + 44} y={iy + itemHeight/2 + 5} textAnchor="middle" fontSize={14}>{getIcon(item.icon)}</text>
                        
                        {/* Text Content */}
                        <foreignObject x={px + 70} y={iy + 8} width={pw - 88} height={itemHeight - 16}>
                            <div ref={el => { textRefs.current[idx] = el }} style={{ fontFamily, fontSize: '12px', color: 'var(--text)' }}>
                                <strong style={{ display: 'block', marginBottom: '1px' }}>{item.title}</strong>
                                <span style={{ color: 'var(--text-muted)', lineHeight: '1.3' }}>{item.description}</span>
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
    index: number;
    onPositionChange: (id: string, pos: Position, commit?: boolean) => void;
    onSizeChange: (id: string, size: Size) => void;
    onDoubleClick: (node: NodeType) => void;
    zoom: number;
    diagramType: DiagramType;
    accentColor?: string;
}

const DraggableNode: React.FC<DraggableNodeProps> = ({ node, index, onPositionChange, onSizeChange, onDoubleClick, zoom, diagramType, accentColor }) => {
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
            const newHeight = Math.max(86, contentHeight + 40); 
            if (Math.abs(newHeight - node.size.h) > 5) {
               onSizeChange(node.id, { w: node.size.w, h: newHeight });
            }
        }
    }, [node.description, node.title, node.size.w, onSizeChange, node.id, diagramType]);

    const { x, y } = position;
    const { w, h } = node.size;
    const iconY = diagramType === DiagramType.MINDMAP ? 43 : h / 2;

    const strokeColor = accentColor || (node.type === 'output' ? 'var(--text-accent)' : 'var(--border-med)');
    const strokeWidth = accentColor ? 2 : (node.type === 'output' ? 2 : 1);

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
                stroke={strokeColor}
                strokeWidth={strokeWidth}
                style={{ filter: 'url(#ds-sm)' }}
                {...dragHandlers}
            />
            
            {/* Index Number Circle */}
            <circle cx={40} cy={iconY} r={20} fill="var(--bg-panel)" stroke={accentColor || "var(--border-dark)"} strokeWidth={2} />
            <text x={40} y={iconY + 6} fontSize="18" fontWeight="bold" textAnchor="middle" fill="var(--text)" pointerEvents="none">{index}</text>

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

  // Compute Mind Map Colors
  const nodeColorMap = useMemo(() => {
    if (diagramType !== DiagramType.MINDMAP) return {};
    
    // 1. Find Root (closest to center of canvas)
    const cx = data.canvas.width / 2;
    const cy = data.canvas.height / 2;
    let rootNode = data.nodes[0];
    let minDist = Infinity;

    data.nodes.forEach(n => {
        const d = Math.hypot((n.position.x + n.size.w/2) - cx, (n.position.y + n.size.h/2) - cy);
        if (d < minDist) {
            minDist = d;
            rootNode = n;
        }
    });

    const colors: Record<string, string> = {};
    const processed = new Set<string>();
    processed.add(rootNode.id);

    // 2. Find Level 1 nodes (connected to Root)
    const level1Nodes: NodeType[] = [];
    data.connectors.forEach(c => {
        if (c.from === rootNode.id) {
            const target = data.nodes.find(n => n.id === c.to);
            if (target) level1Nodes.push(target);
        } else if (c.to === rootNode.id) {
            const source = data.nodes.find(n => n.id === c.from);
            if (source) level1Nodes.push(source);
        }
    });

    // 3. Assign Palette Colors to Level 1
    level1Nodes.forEach((node, idx) => {
        const color = MIND_MAP_PALETTE[idx % MIND_MAP_PALETTE.length];
        colors[node.id] = color;
        processed.add(node.id);
    });

    // 4. Propagate colors to children (BFS/Queue)
    const queue = [...level1Nodes];
    while (queue.length > 0) {
        const parent = queue.shift()!;
        const parentColor = colors[parent.id];
        
        // Find nodes connected to parent that aren't processed
        data.connectors.forEach(c => {
            let childId: string | null = null;
            if (c.from === parent.id && !processed.has(c.to)) childId = c.to;
            if (c.to === parent.id && !processed.has(c.from)) childId = c.from;
            
            if (childId) {
                const child = data.nodes.find(n => n.id === childId);
                if (child) {
                    colors[childId] = parentColor;
                    processed.add(childId);
                    queue.push(child);
                }
            }
        });
    }

    return colors;

  }, [data.nodes, data.connectors, diagramType, data.canvas]);

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
        e.preventDefault(); 
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

  const titleLen = data.title.length;
  const ringWidth = Math.min(data.canvas.width - 40, Math.max(500, titleLen * 24 + 100));
  const ringX = -ringWidth / 2;

  const vbWidth = window.innerWidth / zoom;
  const vbHeight = window.innerHeight / zoom;
  const vbX = -canvasPan.x;
  const vbY = -canvasPan.y;

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
        viewBox={`${vbX} ${vbY} ${vbWidth} ${vbHeight}`}
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
           {/* Neon Ring Gradient */}
           <linearGradient id="grad-neon-ring" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="var(--text-accent)" stopOpacity="0.6" />
                <stop offset="20%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="50%" stopColor="var(--text-accent)" stopOpacity="0.6" />
                <stop offset="80%" stopColor="#ffffff" stopOpacity="0.9" />
                <stop offset="100%" stopColor="var(--text-accent)" stopOpacity="0.6" />
          </linearGradient>
          <filter id="ds-sm" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="var(--shadow-color)" />
          </filter>
          <filter id="ds-lg" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="var(--shadow-color)" />
          </filter>
          <filter id="neon-glow" filterUnits="userSpaceOnUse" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="over"/>
          </filter>
           <filter id="text-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
             <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="var(--border-dark)" />
          </marker>
        </defs>

        <g>
             {/* Canvas Background Area with Neon Outline - Removed non-scaling-stroke to allow zoom consistency */}
            <rect 
                x="2" 
                y="2" 
                width={data.canvas.width - 4} 
                height={data.canvas.height - 4} 
                fill="var(--bg)" 
                stroke="var(--text-accent)" 
                strokeWidth="2" 
                rx="20"
                filter="url(#neon-glow)"
                opacity="0.8"
            />
             <rect 
                x="8" 
                y="8" 
                width={data.canvas.width - 16} 
                height={data.canvas.height - 16} 
                fill="none" 
                stroke="var(--text-accent)" 
                strokeWidth="1" 
                rx="16"
                opacity="0.3"
            />
            
            {/* Header: Neon Ring with Text */}
             <g transform={`translate(${data.canvas.width/2}, 80)`}>
                 {/* Neon Ring Capsule */}
                 <rect 
                    x={ringX} y="-50" 
                    width={ringWidth} height="90" 
                    rx="45" 
                    fill="var(--bg-alt)"
                    stroke="url(#grad-neon-ring)" 
                    strokeWidth="4"
                    filter="url(#neon-glow)"
                 />
                 {/* Inner Detail Ring */}
                  <rect 
                    x={ringX + 10} y="-40" 
                    width={ringWidth - 20} height="70" 
                    rx="35" 
                    fill="none" 
                    stroke="var(--text-accent)" 
                    strokeWidth="1.5"
                    opacity="0.5"
                 />
                 
                 {/* Main Title */}
                 <text 
                    x="0" y="12" 
                    textAnchor="middle" 
                    fontSize="32" 
                    fontWeight="800" 
                    letterSpacing="0.1em"
                    fill="var(--text)"
                    style={{ 
                        filter: 'url(#text-glow)',
                        textTransform: 'uppercase'
                    }}
                >
                    {data.title}
                </text>
                
                {/* Decoration Lines */}
                <path d={`M -60 25 L 60 25`} stroke="var(--text-accent)" strokeWidth="2" opacity="0.6" />

                {/* Caption below */}
                 <text 
                    x="0" y="65" 
                    textAnchor="middle" 
                    fontSize="14" 
                    fontWeight="500"
                    fill="var(--text-muted)"
                    letterSpacing="0.05em"
                >
                    {data.caption}
                </text>
             </g>
            
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

                // Determine Connector Color
                let stroke = "var(--border-accent)";
                if (diagramType === DiagramType.MINDMAP) {
                    // Try to use the target's color, if not, use source's color
                    if (nodeColorMap[conn.to]) stroke = nodeColorMap[conn.to];
                    else if (nodeColorMap[conn.from]) stroke = nodeColorMap[conn.from];
                }

                return (
                    <path 
                        key={conn.id} 
                        d={d} 
                        stroke={stroke} 
                        strokeWidth={conn.style?.strokeWidth || (diagramType === DiagramType.MINDMAP ? 3 : 2)} 
                        strokeDasharray={conn.style?.strokeDasharray}
                        strokeLinecap="round"
                        fill="none" 
                        markerEnd={diagramType === DiagramType.MINDMAP ? "" : "url(#arrowhead)"} 
                        vectorEffect="non-scaling-stroke"
                        opacity={diagramType === DiagramType.MINDMAP ? 0.7 : 1}
                    />
                );
            })}

            {/* Nodes */}
            {data.nodes.map((node, i) => (
                <DraggableNode 
                    key={node.id} 
                    node={node} 
                    index={i + 1}
                    onPositionChange={onNodePositionChange} 
                    onSizeChange={onNodeSizeChange}
                    onDoubleClick={onNodeDoubleClick}
                    zoom={zoom}
                    diagramType={diagramType}
                    accentColor={nodeColorMap[node.id]}
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
                         <path d={`M ${ax} ${ay} L ${bx} ${ay}`} stroke="var(--border-dark)" strokeWidth="1" strokeDasharray={box.lineStyle === 'dotted' ? '3 3' : ''} vectorEffect="non-scaling-stroke" />
                         <rect x={bx} y={by} width={box.size.w} height={box.size.h} rx={4} fill="var(--bg-panel-alt)" stroke="var(--border-med)" vectorEffect="non-scaling-stroke" />
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
                r={10 / zoom} 
                fill="var(--bg-panel)" 
                stroke="var(--text-accent)" 
                strokeWidth={2} 
                cursor="nwse-resize"
                className="svg-draggable shadow-lg"
                {...resizeDrag}
                vectorEffect="non-scaling-stroke"
            />
        </g>
      </svg>
    </div>
  );
};

export default Flowchart;