
import { GoogleGenAI, Modality } from '@google/genai';
import { FLOWCHART_SCHEMA } from '../constants';
import { FlowchartData, DepthLevel, DiagramType } from '../types';

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const generateFlowchartJson = async (topic: string, depth: DepthLevel, type: DiagramType): Promise<FlowchartData> => {
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
      layoutInstructions = `
      **Layout Strategy: MIND MAP**
      - **Canvas Size**: STRICTLY set canvas width to 1700 and height to 1700.
      - **Structure**: Central Root Node -> Branches (Level 1) -> Sub-branches (Level 2).
      - **Positions**: Place the **Main Topic** node strictly in the center of the canvas (x: 850, y: 850) - centering the node based on its width.
      - **Radial Layout**: Radiate Level 1 nodes outwards in a circle around the center. Place Level 2 nodes further out from their parents.
      - **Sizing (CRITICAL)**: 
          - **Width**: Approx formula: (title_chars * 11) + 80. Min: 200, Max: 400.
          - **Height**: Start with 100. The frontend will auto-resize, but provide a reasonable base.
      - **Visuals**: Nodes will be rendered as rounded rectangles.
      - **Connectors**: Use straight lines connecting Parent to Child. Do NOT use arrows.
      - **Cleanliness**: Do NOT use 'supportingPanel' or 'sideBoxes'.
      - **Spacing**: Spread nodes out significantly to fill the 1700x1700 canvas.
      `;
  }

  const userPrompt = `
    Generate a "${type}" for the topic: "${topic}".
    The level of detail should be "${depth}".
    
    Create a catchy, short title for the diagram in the 'title' field.

    ${layoutInstructions}

    **General Constraints:**
    - For 'Simple', use fewer nodes.
    - For 'Detailed' or 'Expert', increase the number of nodes and complexity espeically in mind map about 6-9 .
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

export const generateNodeImage = async (nodeTitle: string, nodeDescription: string): Promise<string> => {
  const prompt = `Create a clean,   good illustration for a flowchart node titled "${nodeTitle}". Context: ${nodeDescription}. The design should be colorful, suitable for a white background circular icon container. Do not include text in the image.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: prompt },
        ],
      },
      config: {
          responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned from the API.");

  } catch (error) {
    console.error("Error generating node image:", error);
    throw new Error("Failed to generate image. Please try again.");
  }
};

export const generateEnhancedDescription = async (nodeTitle: string, currentDescription: string, topic: string): Promise<string> => {
  const prompt = `
    I have a node in a diagram about "${topic}".
    Node Title: "${nodeTitle}"
    Current Description: "${currentDescription}"
    
    Please expand on the description for this node to provide more depth and detail, in simple text, in  few sentences, and not extra deatil  like introduction , onely the relevent part ("Generate Further").
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
