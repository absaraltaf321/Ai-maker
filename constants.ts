
import { Type } from '@google/genai';
import { FlowchartData } from './types';

export const DEFAULT_FLOWCHART_DATA: FlowchartData = {
  title: 'THE GASOLINE ENGINE: HOW FUEL BECOMES MOTION',
  caption: 'This flowchart illustrates the four-stroke cycle of a gasoline engine, converting chemical energy into mechanical force.',
  canvas: { width: 1500, height: 1300 },
  nodes: [
    { id: 'n1', type: 'main', title: 'Air-Fuel Intake', description: 'Mixture drawn into cylinder as piston moves down.', icon: 'droplet', position: { x: 140, y: 320 }, size: { w: 680, h: 86 } },
    { id: 'n2', type: 'main', title: 'Compression', description: 'Piston moves up, squeezing the air-fuel mixture.', icon: 'spring', position: { x: 140, y: 460 }, size: { w: 680, h: 86 } },
    { id: 'n3', type: 'main', title: 'Ignition & Power Stroke', description: 'Spark plug ignites mixture, forcing piston down powerfully.', icon: 'spark', position: { x: 140, y: 610 }, size: { w: 680, h: 86 } },
    { id: 'n4', type: 'main', title: 'Exhaust', description: 'Piston moves up, pushing used gases out of the cylinder.', icon: 'exhaust', position: { x: 140, y: 760 }, size: { w: 680, h: 86 }, loop: 'dotted' },
    { id: 'n5', type: 'output', title: 'ROTATIONAL MECHANICAL ENERGY', description: 'Crankshaft converts linear motion to rotational force.', icon: 'gear', position: { x: 160, y: 960 }, size: { w: 640, h: 68 }, sideBox: 's4' }
  ],
  connectors: [
    { id: 'c1', from: 'n1', to: 'n2', type: 'flow' },
    { id: 'c2', from: 'n2', to: 'n3', type: 'flow' },
    { id: 'c3', from: 'n3', to: 'n4', type: 'flow' },
    { id: 'c4', from: 'n4', to: 'n1', type: 'flow', style: { strokeDasharray: '6 6', strokeWidth: 2.5 } },
    { id: 'c5', from: 'n4', to: 'n5', type: 'flow' }
  ],
  sideBoxes: [
    { id: 's4', text: 'Drives vehicle motion via drivetrain', attachToNode: 'n5', position: 'right', size: { w: 180, h: 38 }, lineStyle: 'solid' }
  ],
  supportingPanel: {
    title: 'Key Systems',
    position: { x: 860, y: 320 },
    size: { w: 300, h: 280 },
    items: [
      { id: 'sp1', title: 'Fuel Delivery System', description: 'Provides precise fuel mixture', icon: 'pump', connectsToNode: 'n1', color: '#2563eb' },
      { id: 'sp2', title: 'Electrical System', description: 'Generates spark for ignition', icon: 'bolt', connectsToNode: 'n3', color: '#d97706' }
    ]
  }
};


export const FLOWCHART_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING, description: 'The main title at the top.' },
    caption: { type: Type.STRING, description: 'The small description text at the bottom.' },
    canvas: {
      type: Type.OBJECT,
      properties: {
        width: { type: Type.INTEGER, description: 'SVG ViewBox width.' },
        height: { type: Type.INTEGER, description: 'SVG ViewBox height.' },
      },
      required: ['width', 'height'],
    },
    nodes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique ID for this node. Used by connectors.' },
          type: { type: Type.STRING, description: "'main' or 'output'." },
          title: { type: Type.STRING, description: 'The main text line.' },
          description: { type: Type.STRING, description: 'The smaller text line.' },
          icon: { type: Type.STRING, description: "Icon name (e.g., 'droplet', 'gear', 'spark', 'spring', 'exhaust', 'pump', 'bolt')." },
          position: {
            type: Type.OBJECT,
            properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } },
            required: ['x', 'y'],
          },
          size: {
            type: Type.OBJECT,
            properties: { w: { type: Type.INTEGER }, h: { type: Type.INTEGER } },
            required: ['w', 'h'],
          },
          loop: { type: Type.STRING, description: "'dotted' to draw a small cycle arrow." },
          sideBox: { type: Type.STRING, description: "ID of a sideBox to attach (from 'sideBoxes' array)." },
        },
        required: ['id', 'type', 'title', 'description', 'icon', 'position', 'size'],
      },
    },
    connectors: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique ID for this connector.' },
          from: { type: Type.STRING, description: 'Node ID to draw from.' },
          to: { type: Type.STRING, description: 'Node ID to draw to.' },
          type: { type: Type.STRING, description: "'flow' for standard arrows." },
          style: {
            type: Type.OBJECT,
            properties: {
              strokeDasharray: { type: Type.STRING, description: "e.g., '6 6' for a dotted line." },
              strokeWidth: { type: Type.NUMBER },
            },
          },
        },
        required: ['id', 'from', 'to', 'type'],
      },
    },
    sideBoxes: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING, description: 'Unique ID for this sidebox.' },
          text: { type: Type.STRING, description: 'The text to display.' },
          attachToNode: { type: Type.STRING, description: 'Node ID to attach to.' },
          position: { type: Type.STRING, description: "'right'" },
          size: {
            type: Type.OBJECT,
            properties: { w: { type: Type.INTEGER }, h: { type: Type.INTEGER } },
            required: ['w', 'h'],
          },
          lineStyle: { type: Type.STRING, description: "'solid' or 'dotted'." },
        },
        required: ['id', 'text', 'attachToNode', 'position', 'size', 'lineStyle'],
      },
    },
    supportingPanel: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Panel header title.' },
        position: {
          type: Type.OBJECT,
          properties: { x: { type: Type.INTEGER }, y: { type: Type.INTEGER } },
          required: ['x', 'y'],
        },
        size: {
          type: Type.OBJECT,
          properties: { w: { type: Type.INTEGER }, h: { type: Type.INTEGER } },
          required: ['w', 'h'],
        },
        items: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING, description: 'Unique ID.' },
              title: { type: Type.STRING, description: 'Item title.' },
              description: { type: Type.STRING, description: 'Item description.' },
              icon: { type: Type.STRING, description: 'Icon name.' },
              connectsToNode: { type: Type.STRING, description: 'Node ID to draw a dotted line to.' },
              color: { type: Type.STRING, description: "A CSS color for the connector line (e.g., '#e53e3e')." },
            },
            required: ['id', 'title', 'description', 'icon'],
          },
        },
      },
      required: ['title', 'position', 'size', 'items'],
    },
  },
  required: ['title', 'caption', 'canvas', 'nodes', 'connectors'],
};

export const THEMES = {
  default: {
    name: 'Ocean (Default)',
    colors: {} // Uses default CSS variables
  },
  emerald: {
    name: 'Forest',
    colors: {
      '--bg-panel-header': '#059669',
      '--bg-panel-header-dark': '#047857',
      '--bg-grad-node-2': '#f0fdf4',
      '--bg-grad-icon-1': '#ecfdf5',
      '--bg-grad-icon-2': '#d1fae5',
      '--text-accent': '#059669',
      '--border-accent': '#6ee7b7',
    }
  },
  violet: {
    name: 'Lavender',
    colors: {
      '--bg-panel-header': '#7c3aed',
      '--bg-panel-header-dark': '#6d28d9',
      '--bg-grad-node-2': '#f5f3ff',
      '--bg-grad-icon-1': '#f5f3ff',
      '--bg-grad-icon-2': '#ddd6fe',
      '--text-accent': '#6d28d9',
      '--border-accent': '#c4b5fd',
    }
  },
  rose: {
    name: 'Berry',
    colors: {
      '--bg-panel-header': '#e11d48',
      '--bg-panel-header-dark': '#be123c',
      '--bg-grad-node-2': '#fff1f2',
      '--bg-grad-icon-1': '#fff1f2',
      '--bg-grad-icon-2': '#ffe4e6',
      '--text-accent': '#be123c',
      '--border-accent': '#fda4af',
    }
  },
  amber: {
    name: 'Sunset',
    colors: {
      '--bg-panel-header': '#d97706',
      '--bg-panel-header-dark': '#b45309',
      '--bg-grad-node-2': '#fffbeb',
      '--bg-grad-icon-1': '#fffbeb',
      '--bg-grad-icon-2': '#fef3c7',
      '--text-accent': '#b45309',
      '--border-accent': '#fcd34d',
    }
  }
};
