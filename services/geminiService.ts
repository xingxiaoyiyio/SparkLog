import { DailySummaryData, GroundingSource, Message } from "../types";

class GeminiService {
  
  // Call the Next.js API Route for Chat
  async sendMessage(text: string, history: Message[], imageBase64?: string): Promise<{ text: string, sources: GroundingSource[] }> {
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history, image: imageBase64 }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return { text: data.text, sources: data.sources || [] };
    } catch (error) {
      console.error("Error sending message:", error);
      return { 
        text: "脑路有点堵车😵‍💫。网络可能不太好，或者API Key配置有误。再试一次？", 
        sources: [] 
      };
    }
  }

  // Call the Next.js API Route for Summary
  async generateDailySummary(messages: Message[]): Promise<DailySummaryData> {
    try {
      const response = await fetch('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      return data as DailySummaryData;
    } catch (error) {
      console.error("Summary Generation Error", error);
      throw new Error("Failed to generate summary JSON");
    }
  }
}

export const geminiService = new GeminiService();