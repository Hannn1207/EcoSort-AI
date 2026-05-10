export interface WasteAnalysis {
  wasteType: string;
  category: string;
  isRecyclable: boolean;
  recommendation: string;
  environmentalImpact: string;
  recyclingIdeas: string[];
  sustainabilityScore: number; // 0-100
}

export interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export interface AppState {
  image: string | null;
  isAnalyzing: boolean;
  result: WasteAnalysis | null;
  error: string | null;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
}
