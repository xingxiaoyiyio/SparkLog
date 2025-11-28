import { GoogleGenAI } from "@google/genai";
import { NextResponse } from 'next/server';

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

export async function POST(req: Request) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ text: "Error: GEMINI_API_KEY not configured on server." }, { status: 500 });
  }

  try {
    const { text, history, image } = await req.json();
    const ai = new GoogleGenAI({ apiKey });

    // Reconstruct history for the chat session
    // Map existing messages to Content format
    const historyContent = history
      .filter((msg: any) => msg.role !== 'system') // Filter out any system messages if they exist
      .map((msg: any) => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.text }] // Note: We don't re-upload old images in history for simplicity here, just text context
      }));

    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
      history: historyContent
    });

    let result;
    if (image) {
      // Multimodal message
      result = await chat.sendMessage({
        message: [
          { inlineData: { mimeType: 'image/jpeg', data: image } },
          { text: text || "看看这张图！" }
        ]
      });
    } else {
      // Text message
      result = await chat.sendMessage({ message: text });
    }

    const responseText = result.text || "";
    const sources: any[] = [];
    
    const chunks = result.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (chunks) {
      chunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ uri: chunk.web.uri, title: chunk.web.title });
        }
      });
    }

    return NextResponse.json({ text: responseText, sources });

  } catch (error) {
    console.error("Server Chat Error:", error);
    return NextResponse.json({ text: "AI Service Error" }, { status: 500 });
  }
}