
export interface Position {
  x: number;
  y: number;
}

export interface Size {
  w: number;
  h: number;
}

export interface Node {
  id: string;
  type: 'main' | 'output';
  title: string;
  description: string;
  icon: string;
  imageUrl?: string; // Generated AI image
  position: Position;
  size: Size;
  loop?: 'dotted';
  sideBox?: string;
}

export interface Connector {
  id: string;
  from: string;
  to: string;
  type: 'flow';
  style?: {
    strokeDasharray?: string;
    strokeWidth?: number;
  };
}

export interface SideBox {
  id: string;
  text: string;
  attachToNode: string;
  position: 'right';
  size: Size;
  lineStyle: 'solid' | 'dotted';
}

export interface SupportingPanelItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  connectsToNode?: string;
  color?: string;
}

export interface SupportingPanel {
  title: string;
  position: Position;
  size: Size;
  items: SupportingPanelItem[];
}

export interface FlowchartData {
  title: string;
  caption: string;
  headerImage?: string; // Generated AI header background
  canvas: {
    width: number;
    height: number;
  };
  nodes: Node[];
  connectors: Connector[];
  sideBoxes?: SideBox[];
  supportingPanel?: SupportingPanel;
}

export enum DepthLevel {
  SIMPLE = 'Simple',
  DETAILED = 'Detailed',
  EXPERT = 'Expert',
}

export enum DiagramType {
  FLOWCHART = 'Flowchart',
  MINDMAP = 'Mind Map',
}
