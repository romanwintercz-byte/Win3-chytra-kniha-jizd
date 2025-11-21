import { GoogleGenAI, Type } from "@google/genai";
import { AISuggestion } from "../types";

export const parseTripFromText = async (text: string): Promise<AISuggestion> => {
  if (!process.env.API_KEY) {
    console.error("API Key is missing");
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const today = new Date().toISOString().split('T')[0];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Dnešní datum je: ${today}.
      
      Analyzuj následující text a extrahuj informace o jízdě autem pro knihu jízd.
      
      Pravidla pro trasu:
      1. Pokud jde o jednoduchou cestu (A -> B), 'origin' je A a 'destination' je B.
      2. Pokud jde o okružní jízdu nebo trasu s více body (např. "Teplice - Praha - Teplice"), 
         nastav 'origin' jako počáteční bod ("Teplice") a do 'destination' napiš zbytek celé trasy ("Praha - Teplice").

      Pravidla pro tachometr a tankování:
      1. Hledej informace o konečném stavu tachometru (např. "tachometr 150500", "stav 20000", "konec 1500").
      2. Hledej informace o tankování (např. "tankováno 40l", "40 litrů", "plná nádrž 55l").
      3. Pokud je uvedena jen vzdálenost, použij ji pro 'distanceKm'. Pokud je uveden tachometr, použij 'endOdometer'.

      Ostatní:
      - Datum, řidič, vozidlo, zakázka (projekt).
      
      Text: "${text}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            origin: { type: Type.STRING, description: "Místo výjezdu" },
            destination: { type: Type.STRING, description: "Cíl nebo popis trasy" },
            distanceKm: { type: Type.NUMBER, description: "Ujetá vzdálenost v km (pokud je uvedena přímo)" },
            endOdometer: { type: Type.NUMBER, description: "Konečný stav tachometru (pokud je uveden)" },
            fuelLiters: { type: Type.NUMBER, description: "Počet natankovaných litrů paliva" },
            orderName: { type: Type.STRING, description: "Název zakázky" },
            date: { type: Type.STRING, description: "Datum jízdy YYYY-MM-DD" },
            vehicleName: { type: Type.STRING, description: "Název vozidla" },
            driverName: { type: Type.STRING, description: "Jméno řidiče" }
          },
          required: ["origin", "destination"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return {};
    
    return JSON.parse(jsonText) as AISuggestion;
  } catch (error) {
    console.error("Error parsing trip with Gemini:", error);
    return {};
  }
};

export const parseReceiptFromImage = async (base64Image: string, mimeType: string): Promise<AISuggestion> => {
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          {
            text: "Analyzuj tuto účtenku za tankování. Extrahuj datum, celkové množství paliva (litry) a celkovou zaplacenou částku. Pokud datum chybí, použij dnešní."
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            date: { type: Type.STRING, description: "Datum ve formátu YYYY-MM-DD" },
            fuelLiters: { type: Type.NUMBER, description: "Objem paliva v litrech" },
            fuelPrice: { type: Type.NUMBER, description: "Celková cena za tankování v CZK" }
          },
          required: ["fuelLiters", "fuelPrice"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return {};

    return JSON.parse(jsonText) as AISuggestion;
  } catch (error) {
    console.error("Error scanning receipt:", error);
    throw error;
  }
};