import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: "GEMINI_API_KEY not configured." }, { status: 500 });
  }

  try {
    const { messages } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

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

    const result = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
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
    // Google GenAI usually returns pure JSON with responseMimeType, but strip code blocks just in case
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
    return NextResponse.json({ error: "Summary generation failed" }, { status: 500 });
  }
}