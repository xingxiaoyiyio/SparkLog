import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  try {
    const { messages } = await req.json();
    const ai = new GoogleGenerativeAI(apiKey);

    // Convert message history to a text transcript
    const transcript = messages
      .map((m: any) => `${m.role === 'user' ? '用户' : 'SparkLog'}: ${m.text}`)
      .join('\n');

    const prompt = `
    🔴 系统指令：立即执行【今日日结】任务。
    
    以下是今天的完整对话记录：
    ====================
    ${transcript}
    ====================
    
    请根据上述对话内容，生成一份结构化的日记总结。
    
    要求：
    1. 语言必须是**中文**。
    2. 严格按照下方的 JSON 格式返回。
    3. **stats (数据统计)**：请仔细分析对话，如果有提到具体的花费（金额）、数量（如见了3个客户、跑了5公里、读了2本书），请自动汇总计算。如果没有数字，此项必须为空数组 []。
    4. **highlight (今日高光)**：3-5 个具体的点，简短有力，必须基于对话内容，不要编造。
    5. **moodEmoji**：选择一个最能代表今天心情的 Emoji。
    6. **moodColor**：选择一个代表今天心情的颜色 Hex 代码 (必须是有效的颜色代码，例如 #FF5733)。
    
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

    // 重试函数
    async function withRetry<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          return await fn();
        } catch (error) {
          lastError = error as Error;
          console.warn(`API调用尝试 ${attempt + 1} 失败，${delay}ms后重试:`, error);
          
          // 只对网络错误和服务暂时不可用的错误进行重试
          if (!lastError.message.includes('network') && 
              !lastError.message.includes('timeout') && 
              !lastError.message.includes('temporarily unavailable') &&
              !lastError.message.includes('502') &&
              !lastError.message.includes('503') &&
              !lastError.message.includes('504')) {
            throw error; // 认证错误等非临时性错误不重试
          }
          
          // 指数退避策略
          if (attempt < maxRetries - 1) {
            await new Promise(resolve => setTimeout(resolve, delay * Math.pow(1.5, attempt)));
          }
        }
      }
      
      throw lastError || new Error('所有重试都失败了');
    }

    const model = ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // 简化调用，移除responseMimeType配置
    // 在新版本中，可以在prompt中明确要求返回JSON格式
    const result = await withRetry(() => model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }]
    }));

    const jsonStr = result.response.text().trim();
    // Google Generative AI usually returns pure JSON with responseMimeType, but strip code blocks just in case
    const cleanJson = jsonStr.replace(/```json|```/g, '');
    const data = JSON.parse(cleanJson);

    // Enforce server date
    const today = new Date();
    const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

    return NextResponse.json({
      ...data,
      date: dateString,
      rawLog: [] 
    });

  } catch (error) {
    console.error("Server Summary Error:", error);
    
    // 提供更详细的错误诊断
    let errorMessage = "Summary generation failed";
    let errorType = "unknown";
    
    if (error instanceof Error) {
      // 根据错误类型提供更具体的诊断
      if (error.message.includes('401') || error.message.includes('Unauthorized')) {
        errorMessage = "API Key配置错误或已过期，请检查GEMINI_API_KEY";
        errorType = "authentication";
      } else if (error.message.includes('403')) {
        errorMessage = "API访问权限受限，请检查API Key权限设置";
        errorType = "permission";
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = "网络连接问题，请检查网络设置或稍后重试";
        errorType = "network";
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = "API使用配额已用尽，请检查API使用情况";
        errorType = "quota";
      } else if (error.message.includes('JSON')) {
        errorMessage = "JSON解析错误，请检查响应格式";
        errorType = "parsing";
      } else {
        errorMessage = `AI服务错误: ${error.message}`;
        errorType = "service";
      }
    }
    
    return NextResponse.json(
      { 
        error: errorMessage, 
        errorType, 
        diagnostic: process.env.NODE_ENV === 'development' ? String(error) : undefined,
        // 提供一个默认的空总结，以便前端可以继续运行
        highlight: [],
        actionItems: [],
        inspirations: [],
        stats: [],
        moodEmoji: "😐",
        moodColor: "#808080",
        date: new Date().toLocaleDateString('zh-CN'),
        rawLog: []
      }, 
      { status: 500 }
    );
  }
}