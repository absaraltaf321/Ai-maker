
import { GoogleGenAI, Type } from '@google/genai';
import { FLOWCHART_SCHEMA } from '../constants';
import { FlowchartData, DepthLevel, DiagramType, Node } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateFlowchartJson = async (topic: string, depth: DepthLevel, type: DiagramType, nodeCount?: number): Promise<FlowchartData> => {
  const systemInstruction = `You are an expert at creating diagram data structures in JSON format. You will be given a topic, a diagram type (Flowchart or Mind Map), and a desired level of detail. Your response must strictly adhere to the provided JSON schema. Do not add any explanatory text or markdown formatting around the JSON output.`;

  let layoutInstructions = '';

  if (type === DiagramType.FLOWCHART) {
      layoutInstructions = `
      **Layout Strategy: VERTICAL FLOWCHART**
      - The overall flow must be strictly vertical, from top-to-bottom.
      - Nodes should be centered horizontally (e.g., x: ~260 if width is 680 and canvas is 1200).
      - **IMPORTANT**: Start the first node at y: 320 or lower to leave ample space for the large title banner.
      - Provide at least 80-100 units of vertical space between each node's bottom edge and the next node's top edge.
      - Use a standard width for main nodes (e.g., w: 680, h: 86).
      - Use 'supportingPanel' to explain key concepts, placed to the right of the main vertical chain (e.g., x: 900+).
      - Connectors should flow downwards.
      `;
  } else if (type === DiagramType.MINDMAP) {
      const targetNodes = nodeCount || 15;
      layoutInstructions = `
      **Layout Strategy: MIND MAP**
      - **Canvas Size**: STRICTLY set canvas width to 1700 and height to 1700.
      - **Structure**: Central Root Node -> Branches (Level 1) -> Sub-branches (Level 2).
      - **Node Count**: You MUST generate approximately **${targetNodes} nodes** in total. Distribute them logically across branches.
      - **Positions**: Place the **Main Topic** node strictly in the center of the canvas (x: 850, y: 850).
      - **Radial Layout**: Radiate Level 1 nodes outwards in a circle around the center. Place Level 2 nodes further out from their parents.
      - **Sizing**: 
          - **Width**: Approx formula: (title_chars * 11) + 80. Min: 200, Max: 400.
          - **Height**: Start with 100.
      - **Visuals**: Nodes will be rendered as rounded rectangles.
      - **Connectors**: Use straight lines connecting Parent to Child. Do NOT use arrows.
      - **Cleanliness**: Do NOT use 'supportingPanel' or 'sideBoxes'.
      - **Spacing**: Spread nodes out significantly to fill the 1700x1700 canvas. Avoid overlapping.
      `;
  }

  const userPrompt = `
    Generate a "${type}" for the topic: "${topic}".
    The level of detail should be "${depth}".
    
    Create a catchy, short title for the diagram in the 'title' field.

    ${layoutInstructions}

    **General Constraints:**
    - For 'Simple', use fewer nodes.
    - For 'Detailed' or 'Expert', increase the complexity.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: userPrompt,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: FLOWCHART_SCHEMA,
      },
    });

    const jsonText = response.text.trim();
    if (!jsonText) {
      throw new Error("API returned an empty response.");
    }
    
    // The API should return a valid JSON object because of responseSchema
    const data = JSON.parse(jsonText) as FlowchartData;
    // Inject the diagram type into the data
    data.diagramType = type;
    return data;

  } catch (error) {
    console.error("Error generating flowchart from Gemini:", error);
    if (error instanceof Error) {
        // Provide a more user-friendly message for common transient API issues.
        if (error.message.includes('xhr error') || error.message.includes('500')) {
             throw new Error('The AI service experienced a temporary issue. Please try generating again.');
        }
        throw new Error(`Failed to generate flowchart: ${error.message}`);
    }
    throw new Error('An unknown error occurred while generating the flowchart.');
  }
};

export const generateEnhancedDescription = async (nodeTitle: string, currentDescription: string, topic: string): Promise<string> => {
  const prompt = `
    I have a node in a diagram about "${topic}".
    Node Title: "${nodeTitle}"
    Current Description: "${currentDescription}"
    
    Please expand on the description for this node to provide more depth and detail, in simple text, in few sentences.
    Maintain the tone of the original diagram.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
    });

    return response.text.trim();
  } catch (error) {
    console.error("Error expanding description:", error);
    throw new Error("Failed to generate expanded description.");
  }
};

export const generateSubnodes = async (parentNode: Node, topic: string, aspect?: string): Promise<{ title: string; description: string; icon: string }[]> => {
    let specificInstruction = "";
    if (aspect && aspect.trim().length > 0) {
        specificInstruction = `Focus the generated sub-concepts specifically on this aspect or perspective: "${aspect}".`;
    }

    const prompt = `
      I have a Mind Map/Flowchart about "${topic}".
      I want to expand on the specific node: "${parentNode.title}" (Description: ${parentNode.description}).
      ${specificInstruction}
      
      Generate 3 to 5 new sub-concepts (child nodes) that stem from this node.
      Return them as a JSON array of objects.
    `;

    const schema = {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                icon: { type: Type.STRING, description: "One of: droplet, spring, spark, exhaust, gear, pump, bolt, idea, check, warning, search, or document" }
            },
            required: ['title', 'description', 'icon']
        }
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: schema
            }
        });
        return JSON.parse(response.text.trim());
    } catch (error) {
        console.error("Error generating subnodes:", error);
        throw new Error("Failed to generate subnodes.");
    }
}