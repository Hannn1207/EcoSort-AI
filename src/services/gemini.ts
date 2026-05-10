import { GoogleGenAI, Type } from "@google/genai";
import { WasteAnalysis, ChatMessage } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
const MODEL_NAME = "gemini-3-flash-preview";

export async function analyzeWasteImage(base64Image: string, lang: "en" | "id" = "id"): Promise<WasteAnalysis> {
  const prompt = `Analyze this image of waste. Identify what it is and provide recycling information in ${lang === "id" ? "Indonesian" : "English"} in the specified JSON format.`;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Image.split(",")[1] || base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            wasteType: { type: Type.STRING, description: "The specific name of the item" },
            category: { type: Type.STRING, description: "General category like plastic, paper, metal, organic, etc." },
            isRecyclable: { type: Type.BOOLEAN, description: "Whether the item is generally recyclable" },
            recommendation: { type: Type.STRING, description: "Specific instructions on how to dispose of/recycle it" },
            environmentalImpact: { type: Type.STRING, description: "Brief explanation of its impact on the environment" },
            recyclingIdeas: { 
              type: Type.ARRAY, 
              items: { type: Type.STRING },
              description: "3 creative DIY or upcycling ideas that can be made from this specific item" 
            },
            sustainabilityScore: { type: Type.NUMBER, description: "A score from 0-100 representing how sustainable the item/disposal is" },
          },
          required: ["wasteType", "category", "isRecyclable", "recommendation", "environmentalImpact", "recyclingIdeas", "sustainabilityScore"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as WasteAnalysis;
  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    throw new Error("Failed to analyze image. Please try again.");
  }
}

export async function chatWithEcologyAssistant(history: ChatMessage[], message: string, lang: "en" | "id" = "id"): Promise<string> {
  const systemInstruction = lang === "id" 
    ? "Anda adalah EcoSort AI Assistant, ahli dalam keberlanjutan dan daur ulang. Jawablah pertanyaan pengguna dengan bahasa yang sangat sederhana, singkat, dan mudah dimengerti. JANGAN gunakan format Markdown seperti tanda bintang (**) untuk menebalkan teks."
    : "You are EcoSort AI Assistant, an expert in sustainability and recycling. Answer user questions in a very simple, brief, and easy to understand manner. DO NOT use Markdown formatting like asterisks (**) for bolding text.";

  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      config: {
        systemInstruction: systemInstruction,
      },
      history: history.map(m => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    });

    const result = await chat.sendMessage({ message });
    const cleanText = (result.text || "No response").replace(/\*\*/g, '');
    return cleanText;
  } catch (error) {
    console.error("Chat Error:", error);
    throw error;
  }
}
