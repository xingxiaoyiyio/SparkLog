import { NextResponse } from 'next/server';

const SYSTEM_INSTRUCTION = `
角色定义：
你是 SparkLog（星火日志），一个碎片化日记助手。你的人设是好奇、充满活力且富有洞察力的"数字死党"。

语言要求：
**全程使用中文**。
**适当详细**：回复要适当体现你的能力，不要过于简洁。
**准确可靠**：对于链接内容，必须基于实际读取的内容进行总结。

交互流程：
1. 碎片记录模式（实时对话）
   - **链接**：
     - 必须读取链接里面的实际内容
     - 基于内容进行详细总结，体现你的理解能力
     - 总结后进行有深度的反问交流
     - 若无法读取链接内容，**请参考以下内容简短回复**："这是一个文章链接，我无法解读，你可以分享给我吗？"，不要啰嗦，不要猜测或解读网址本身
   - **情绪言语**：
     - 识别用户情绪
     - 给予共情回应
     - 引导用户分享更多细节
   - **图片**：
     - 详细解读图片内容
     - 基于内容进行有意义的反问
   - **普通文本**：
     - 给予有价值的回应
     - 适当展开，体现你的思考

2. "每日日结"模式
   - 不需要确认，直接生成详细总结。
`;

export async function POST(req: Request) {
  // 直接使用火山引擎API配置，不再检查GEMINI_API_KEY
  const volcengineApiKey = process.env.VOLCENGINE_API_KEY;
  const volcengineApiSecret = process.env.VOLCENGINE_API_SECRET;
  const volcengineApiEndpoint = process.env.VOLCENGINE_API_ENDPOINT;

  if (!volcengineApiKey || !volcengineApiSecret || !volcengineApiEndpoint) {
    return NextResponse.json({ 
      text: "火山引擎API配置不完整，请检查.env.local文件", 
      sources: [] 
    }, { status: 500 });
  }

  try {
    const data = await req.json();
    const { text, history = [], image, messages } = data;
    
    // 开发环境和生产环境都调用实际的火山引擎大模型API
    console.log('Calling VolcEngine LLM API...');

    // 直接使用已检查的火山引擎API配置
    const apiKey = volcengineApiKey;
    const apiSecret = volcengineApiSecret;
    const apiEndpoint = volcengineApiEndpoint;

    // 获取最新的用户消息内容
    const latestMessage = text || (messages && messages.length > 0 ? messages[messages.length - 1]?.content : "");
    
    // 构建聊天历史
    let chatHistory = history;
    if (messages && messages.length > 0) {
      chatHistory = messages;
    }
    
    // 转换为火山引擎API要求的格式
    const messagesForVolcengine = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
      ...chatHistory.map((msg: any) => ({
        role: msg.role === 'model' ? 'assistant' : msg.role,
        content: msg.text
      })),
      { role: 'user', content: latestMessage }
    ];
    
    try {
      // 调用火山引擎大模型API
      console.log('Calling VolcEngine API with endpoint:', apiEndpoint);
      console.log('API Key:', apiKey);
      console.log('Request Body:', JSON.stringify({
        model: 'doubao-seed-1-6-251015',
        messages: messagesForVolcengine,
        max_completion_tokens: 65535,
        reasoning_effort: 'medium'
      }, null, 2));
      
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'doubao-seed-1-6-251015', // 使用用户提供的新Model ID
          messages: messagesForVolcengine,
          max_completion_tokens: 65535,
          reasoning_effort: 'medium'
        })
      });
      
      console.log('VolcEngine API Response Status:', response.status);
      console.log('VolcEngine API Response Headers:', Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log('VolcEngine API Response Data:', data);
      
      if (!response.ok) {
        console.error('VolcEngine API Error:', data);
        return NextResponse.json({ 
          text: `火山引擎API调用失败: ${data.error?.message || '未知错误'}，状态码: ${response.status}`, 
          sources: [] 
        }, { status: response.status });
      }
      
      const responseText = data.choices?.[0]?.message?.content || "";
      return NextResponse.json({ text: responseText, sources: [] });
      
    } catch (error) {
      console.error('Error calling VolcEngine API:', error);
      // 如果API调用失败，返回模拟响应作为 fallback
      const fallbackResponses = [
        "我明白你的意思了！",
        "很有趣的想法呢！",
        "这确实值得记录下来。",
        "我会帮你记住这些的。",
        "你的分享让我很有启发！"
      ];
      const fallbackText = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
      return NextResponse.json({ text: fallbackText, sources: [] });
    }

  } catch (error) {
    console.error("Server Chat Error:", error);
    
    // 提供更详细的错误诊断
    let errorMessage = "AI Service Error";
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
      } else {
        errorMessage = `AI服务错误: ${error.message}`;
        errorType = "service";
      }
    }
    
    return NextResponse.json(
      { text: errorMessage, errorType, diagnostic: process.env.NODE_ENV === 'development' ? String(error) : undefined }, 
      { status: 500 }
    );
  }
}