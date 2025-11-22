import { GoogleGenAI, Modality, Type, GenerateContentResponse } from "@google/genai";
import { FurnitureItem } from '../types';
import { fileToBase64 } from '../utils/imageUtils';

// Note: We do NOT initialize `ai` globally here anymore.
// We initialize it inside each function to ensure it picks up the latest process.env.API_KEY
// after the user selects it via the window.aistudio UI.

// ============================================================
// SCENE ANALYSIS (Fast Model)
// ============================================================

const sceneAnalysisSchema = {
  type: Type.OBJECT,
  properties: {
    furniture: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          type: { type: Type.STRING },
          bbox: {
            type: Type.OBJECT,
            properties: {
              x: { type: Type.NUMBER, description: "X coordinate in PERCENTAGE (0-100)" },
              y: { type: Type.NUMBER, description: "Y coordinate in PERCENTAGE (0-100)" },
              width: { type: Type.NUMBER, description: "Width in PERCENTAGE (0-100)" },
              height: { type: Type.NUMBER, description: "Height in PERCENTAGE (0-100)" },
            },
            required: ['x', 'y', 'width', 'height'],
          },
        },
        required: ['id', 'type', 'bbox'],
      },
    },
  },
  required: ['furniture'],
};

export const analyzeScene = async (roomPhoto: File): Promise<FurnitureItem[]> => {
  console.log("🔍 ANALÝZA MÍSTNOSTI (Gemini 2.5 Flash)...");
  // Initialize here to get the latest key
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const base64Image = await fileToBase64(roomPhoto);
  
  const prompt = `
    Detect ALL furniture pieces in this image.
    Return coordinates in PERCENTAGES (0-100).
    Create tight bounding boxes.
    Assign a unique ID and type.
  `;
  
  try {
    // OPTIMIZATION: Use gemini-2.5-flash for analysis. 
    // It is significantly faster than 3-Pro and sufficient for bounding box detection.
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
        parts: [
            { inlineData: { mimeType: roomPhoto.type, data: base64Image } },
            { text: prompt }
        ]
        },
        config: {
        responseMimeType: 'application/json',
        responseSchema: sceneAnalysisSchema,
        temperature: 0.1
        },
    });

    const parsedJson = JSON.parse(response.text);
    let items = parsedJson.furniture || [];

    items = items.map((item: FurnitureItem) => {
        const { x, width } = item.bbox;
        if (x <= 1 && width <= 1) {
            return {
                ...item,
                bbox: {
                    x: item.bbox.x * 100,
                    y: item.bbox.y * 100,
                    width: item.bbox.width * 100,
                    height: item.bbox.height * 100
                }
            };
        }
        return item;
    });

    return items;
  } catch (e) {
    console.error("Analysis failed", e);
    return [];
  }
};

// ============================================================
// HELPER: RETRY LOGIC
// ============================================================

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 2,
  operationName: string = "Operace"
): Promise<T> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error: any) {
      if (attempt === maxRetries) throw error;
      console.warn(`Retrying ${operationName}...`);
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  throw new Error(`${operationName} selhal`);
}

// ============================================================
// STEP 2: DIRECT REPLACEMENT (ONE-SHOT GENERATION)
// ============================================================

export const integrateFurniture = async (
  roomPhoto: File,
  productPhoto: File,
  targetFurniture: FurnitureItem
): Promise<string> => {
  console.log("🎨 DIRECT REPLACEMENT (Gemini 3 Pro)...");
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const roomBase64 = await fileToBase64(roomPhoto);
  const productBase64 = await fileToBase64(productPhoto);
  
  // 1. Expand Bounding Box slightly to ensure we cover edges
  const padding = 5; 
  const expandedX = Math.max(0, targetFurniture.bbox.x - padding / 2);
  const expandedY = Math.max(0, targetFurniture.bbox.y - padding / 2);
  const expandedWidth = Math.min(100 - expandedX, targetFurniture.bbox.width + padding);
  const expandedHeight = Math.min(100 - expandedY, targetFurniture.bbox.height + padding);

  // PROMPT OPTIMIZATION: Clearer instruction for the Pro model
  const integrationPrompt = `
    TASK: Photo-realistic furniture replacement.
    
    INPUTS:
    1. Room Image (Source)
    2. Product Image (Reference)

    ACTION:
    - Locate the area: x=${expandedX}%, y=${expandedY}%, w=${expandedWidth}%, h=${expandedHeight}%.
    - ERASE the old object in this area completely.
    - GENERATE the Reference Product in that exact spot.
    - MATCH the room's lighting, shadows, and perspective perfectly.
    - If the new product reveals floor/wall behind the old one, synthesize realistic background.

    OUTPUT:
    - Return the full image. High fidelity.
  `;

  const result = await retryOperation(async () => {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview', // Keeping Pro for QUALITY
      contents: {
        parts: [
          { text: integrationPrompt },
          { inlineData: { mimeType: roomPhoto.type, data: roomBase64 } },
          { inlineData: { mimeType: productPhoto.type, data: productBase64 } },
        ],
      },
      config: { 
        responseModalities: [Modality.IMAGE],
        temperature: 0.2,
        imageConfig: {
            // SPEED OPTIMIZATION: Changed from '2K' to '1K'. 
            // 1K is significantly faster while maintaining the Pro model's intelligence for lighting/shadows.
            imageSize: '1K' 
        }
      },
    });
    return response.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData;
  }, 2, "Výměna nábytku");

  if (!result?.data) throw new Error("Nepodařilo se vygenerovat výsledek.");
  return `data:${result.mimeType};base64,${result.data}`;
};