import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    
    // Convert message history to a text transcript
    const transcript = messages
      .map((m: any) => `${m.role === 'user' ? '用户' : 'SparkLog'}: ${m.text}`)
      .join('\n');
    
    console.log('Generating summary for messages:', transcript);
    
    // 获取火山引擎API配置
    const apiKey = process.env.VOLCENGINE_API_KEY;
    const apiSecret = process.env.VOLCENGINE_API_SECRET;
    const apiEndpoint = process.env.VOLCENGINE_API_ENDPOINT;

    if (!apiKey || !apiSecret || !apiEndpoint) {
      return NextResponse.json({ 
        error: "火山引擎API配置不完整，请检查.env.local文件",
        highlight: [],
        actionItems: [],
        inspirations: [],
        stats: [],
        moodEmoji: "😐",
        moodColor: "#808080",
        date: new Date().toLocaleDateString('zh-CN'),
        rawLog: []
      }, { status: 500 });
    }
    
    // 构建提示词
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
    
    try {
      // 调用火山引擎大模型API
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'doubao-seed-1-6-251015', // 使用用户提供的新Model ID
          messages: [
            { 
              role: 'user', 
              content: prompt 
            }
          ],
          max_completion_tokens: 65535,
          reasoning_effort: 'medium'
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error('VolcEngine API Error:', data);
        // 如果API调用失败，返回模拟响应作为 fallback
        const mockSummary = {
          highlight: [
            "记录了今天的生活碎片",
            "与AI助手进行了愉快的交流",
            "分享了自己的想法和感受"
          ],
          actionItems: [
            "继续保持记录的习惯",
            "尝试更多的交流方式",
            "回顾今天的收获"
          ],
          inspirations: [
            "生活中的小确幸",
            "AI助手的陪伴",
            "记录的重要性"
          ],
          stats: [
            { "label": "交流次数", "value": `${messages.length}次` },
            { "label": "用户消息", "value": `${messages.filter((m: any) => m.role === 'user').length}条` }
          ],
          moodEmoji: "😊",
          moodColor: "#FFD700"
        };
        
        const today = new Date();
        const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
        
        return NextResponse.json({
          ...mockSummary,
          date: dateString,
          rawLog: [] 
        });
      }
      
      const jsonStr = data.choices?.[0]?.message?.content || "";
      const cleanJson = jsonStr.replace(/```json|```/g, '');
      const summaryData = JSON.parse(cleanJson);
      
      // Enforce server date
      const today = new Date();
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;

      return NextResponse.json({
        ...summaryData,
        date: dateString,
        rawLog: [] 
      });
      
    } catch (error) {
      console.error('Error calling VolcEngine API:', error);
      // 如果API调用失败，返回模拟响应作为 fallback
      const mockSummary = {
        highlight: [
          "记录了今天的生活碎片",
          "与AI助手进行了愉快的交流",
          "分享了自己的想法和感受"
        ],
        actionItems: [
          "继续保持记录的习惯",
          "尝试更多的交流方式",
          "回顾今天的收获"
        ],
        inspirations: [
          "生活中的小确幸",
          "AI助手的陪伴",
          "记录的重要性"
        ],
        stats: [
          { "label": "交流次数", "value": `${messages.length}次` },
          { "label": "用户消息", "value": `${messages.filter((m: any) => m.role === 'user').length}条` }
        ],
        moodEmoji: "😊",
        moodColor: "#FFD700"
      };
      
      const today = new Date();
      const dateString = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
      
      return NextResponse.json({
        ...mockSummary,
        date: dateString,
        rawLog: [] 
      });
    }

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