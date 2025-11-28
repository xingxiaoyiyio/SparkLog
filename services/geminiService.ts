import { DailySummaryData, GroundingSource, Message, ChatResponse } from "../types";

// 通用重试函数
  async function fetchWithRetry(url: string, options: RequestInit, maxRetries: number = 2, delay: number = 1000): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);
        // 对于5xx错误进行重试，2xx和4xx（客户端错误）不重试
        if (response.status >= 500) {
          throw new Error(`服务器错误: ${response.status}`);
        }
        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`网络请求尝试 ${attempt + 1} 失败，${delay}ms后重试:`, error);
        
        // 只对网络错误和服务器错误进行重试
        if (lastError.message.includes('Failed to fetch') || 
            lastError.message.includes('Network') ||
            lastError.message.includes('服务器错误')) {
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, attempt)));
          }
        } else {
          throw error; // 其他错误不重试
        }
      }
    }
    
    throw lastError || new Error('所有网络请求重试都失败了');
  }

  class GeminiService {
  
  // Call the Next.js API Route for Chat
  async sendMessage(text: string, history: Message[], imageBase64?: string): Promise<ChatResponse> {
    try {
      const response = await fetchWithRetry('/api/chat', {        
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, history, image: imageBase64 }),
      });

      const data = await response.json();
      
      // 无论response.ok状态如何，都尝试解析错误信息
      if (!response.ok) {
        // 服务器端已经提供了详细的错误信息
        const errorText = data.text || "API请求失败";
        console.error("API Error:", errorText, data.errorType || 'unknown');
        return { 
          text: errorText, 
          sources: [],
          error: data.errorType,
          diagnostic: data.diagnostic
        };
      }

      return { text: data.text, sources: data.sources || [] };
    } catch (error) {
      console.error("Error sending message:", error);
      // 客户端网络错误或解析错误
      return { 
        text: "网络连接失败或请求处理异常，请检查网络连接后重试。", 
        sources: [],
        error: "network_client",
        diagnostic: process.env.NODE_ENV === 'development' ? String(error) : undefined
      };
    }
  }

  // Call the Next.js API Route for Summary
  async generateDailySummary(messages: Message[]): Promise<DailySummaryData> {
    try {
      const response = await fetchWithRetry('/api/summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
      });

      const data = await response.json();
      
      // 检查响应是否包含错误字段，但仍然返回数据以允许前端继续运行
      if (data.error) {
        console.error("Summary API Error:", data.error, data.errorType || 'unknown');
        // 即使有错误，仍然返回包含默认值的数据对象，以便前端可以继续运行
        return {
          highlight: data.highlight || [],
          actionItems: data.actionItems || [],
          inspirations: data.inspirations || [],
          stats: data.stats || [],
          moodEmoji: data.moodEmoji || "😐",
          moodColor: data.moodColor || "#808080",
          date: data.date || new Date().toLocaleDateString('zh-CN'),
          rawLog: data.rawLog || [],
          error: data.error,
          errorType: data.errorType
        } as DailySummaryData;
      }

      return data as DailySummaryData;
    } catch (error) {
      console.error("Summary Generation Error", error);
      // 返回默认的空总结数据，而不是抛出错误，确保前端不会崩溃
      return {
        highlight: [],
        actionItems: [],
        inspirations: [],
        stats: [],
        moodEmoji: "😐",
        moodColor: "#808080",
        date: new Date().toLocaleDateString('zh-CN'),
        rawLog: [],
        error: "客户端网络错误",
        errorType: "network_client"
      } as DailySummaryData;
    }
  }
}

export const geminiService = new GeminiService();