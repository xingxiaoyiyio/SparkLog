import { GoogleGenAI, Chat, Type } from "@google/genai";
import { DailySummaryData, GroundingSource } from "../types";

const API_KEY = process.env.API_KEY || '';

// System instruction defining SparkLog's persona in Chinese
const SYSTEM_INSTRUCTION = `
角色定义：
你是 SparkLog（星火日志），一个碎片化日记助手。你的人设是好奇、充满活力且富有洞察力的“数字死党”。

语言要求：
**全程使用中文**。
**极致简洁**：除非用户要求深究，否则回复控制在 **40字以内**。不要废话，直击重点。

🔴 **关于链接处理的核心规则 (最高优先级)**：
1. **必须调用搜索**：收到 URL 必须使用 Google Search。
2. **严禁瞎猜**：如果 Search 结果只显示“验证码”、“登录”、“首页”或非常泛泛的平台介绍，**绝对不要**根据 URL 里的单词去编造内容。
3. **无法读取时的处理**：
   - 如果你无法从搜索摘要中获取该具体文章/视频的详细内容，**直接承认**。
   - 回复模板：“这个链接我看不到具体内容🙈。是关于什么的？给我个太长不看版（TL;DR）？”
   - **不要**试图解释为什么看不了，直接问用户内容。

交互流程：
1. 碎片记录模式（实时对话）
   - **链接**：尝试搜索 -> 有内容则一句话概括+提问；无内容则直接问用户“讲了啥？”。
   - **文本**：秒回。给予简短的情绪价值（“太棒了！”“抱抱🫂”），或者标记 Todo。
   - **图片**：一句话神吐槽或夸奖。

2. “每日日结”模式
   - 不需要确认，直接生成总结。
`;

class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private modelId = 'gemini-2.5-flash'; 

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: API_KEY });
  }

  // Initialize or retrieve the chat session
  private getChat(): Chat {
    if (!this.chatSession) {
      this.chatSession = this.ai.chats.create({
        model: this.modelId,
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }], // Enable search for link reading
        },
      });
    }
    return this.chatSession;
  }

  // Send a message (text + optional image) to the chat
  async sendMessage(text: string, imageBase64?: string): Promise<{ text: string, sources: GroundingSource[] }> {
    const chat = this.getChat();
    
    let responseText = "";
    let sources: GroundingSource[] = [];

    try {
      let result;
      
      if (imageBase64) {
        // Chat with image support (multimodal)
        result = await chat.sendMessage({
            message: [
                { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
                { text: text || "看看这张图！" }
            ]
        });
      } else {
        // Text only
        result = await chat.sendMessage({ message: text });
      }

      responseText = result.text || "";

      // Extract grounding metadata if available
      const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        chunks.forEach((chunk: any) => {
            if (chunk.web?.uri && chunk.web?.title) {
                sources.push({ uri: chunk.web.uri, title: chunk.web.title });
            }
        });
      }

    } catch (error) {
      console.error("Error sending message:", error);
      responseText = "脑路有点堵车😵‍💫。刚才那句没听清，再说一遍？";
    }

    return { text: responseText, sources };
  }

  // Trigger the Daily Wrap Up specifically
  async generateDailySummary(): Promise<DailySummaryData> {
    const chat = this.getChat();
    
    // Prompt engineered to force specific JSON structure and Chinese content
    // Note: fragmentLog is removed from generation as we will use local history
    const prompt = `
    🔴 系统指令：立即执行【今日日结】任务。
    
    回顾我们今天所有的对话内容，生成一份结构化的日记总结。
    
    要求：
    1. 语言必须是**中文**。
    2. 严格按照下方的 JSON 格式返回。
    3. **stats (数据统计)**：请仔细分析对话，如果有提到具体的花费（金额）、数量（如见了3个客户、跑了5公里、读了2本书），请自动汇总计算。如果没有数字，此项可以为空数组。
    4. **highlight (今日高光)**：3-5 个具体的点，简短有力。
    5. **moodEmoji**：选择一个最能代表今天心情的 Emoji。
    6. **moodColor**：选择一个代表今天心情的颜色 Hex 代码 (例如 #FF5733)。
    
    JSON 结构定义：
    {
      "highlight": ["高光时刻1", "高光时刻2"],
      "actionItems": ["待办1", "计划2"],
      "inspirations": ["链接标题", "灵感碎片"],
      "stats": [
          { "label": "今日消费", "value": "128元" },
          { "label": "完成任务", "value": "3项" }
      ],
      "moodEmoji": "🌟",
      "moodColor": "#HEXCODE"
    }
    `;

    try {
      const result = await chat.sendMessage({
        message: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: {
                type: Type.OBJECT,
                properties: {
                    highlight: { type: Type.ARRAY, items: { type: Type.STRING } },
                    actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                    inspirations: { type: Type.ARRAY, items: { type: Type.STRING } },
                    stats: { 
                        type: Type.ARRAY, 
                        items: { 
                            type: Type.OBJECT, 
                            properties: {
                                label: { type: Type.STRING },
                                value: { type: Type.STRING }
                            } 
                        } 
                    },
                    moodEmoji: { type: Type.STRING },
                    moodColor: { type: Type.STRING }
                },
                required: ["highlight", "actionItems", "inspirations", "moodEmoji", "moodColor"]
            }
        }
      });

      const jsonStr = result.text.trim();
      const cleanJson = jsonStr.replace(/```json|```/g, '');
      const data = JSON.parse(cleanJson);
      
      // Enforce the current system date dynamically
      const today = new Date();
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

      return {
          ...data,
          date: dateString,
          rawLog: [] // Initial empty, will be populated by App.tsx
      } as DailySummaryData;

    } catch (error) {
        console.error("Summary Generation Error", error);
        throw new Error("Failed to generate summary JSON");
    }
  }
}

export const geminiService = new GeminiService();