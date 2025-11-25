// /api/chat.js

// 導入 OpenAI SDK
import OpenAI from 'openai';

// 這是 Vercel 的配置，告訴 Vercel 這個函數需要使用 Edge Runtime。
// Edge Runtime 對於處理串流（streaming）有更好的性能和支援。
export const config = {
  runtime: 'edge',
};

// 創建 OpenAI 客戶端實例
// 它會自動從 Vercel 的環境變數中讀取 OPENAI_API_KEY
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// API 路由的主要處理函數
export default async function handler(req) {
  // 只處理 POST 請求
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 從請求的 body 中解析出 JSON
    const { messages } = await req.json();

    // 檢查 messages 是否存在且為陣列
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: 'Invalid messages format' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // 向 OpenAI API 發起請求，並啟用串流模式
    const stream = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo', // 建議先使用速度較快的 gpt-3.5-turbo
      messages: messages,
      stream: true, // 關鍵：啟用串流
    });

    // 創建一個可讀的串流，將 OpenAI 的回應轉換後傳遞給前端
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        for await (const chunk of stream) {
          // 從每個 chunk 中提取內容
          const content = chunk.choices[0]?.delta?.content || '';
          if (content) {
            // 將提取到的內容編碼為 Uint8Array 並放入串流
            controller.enqueue(encoder.encode(content));
          }
        }
        // 串流結束
        controller.close();
      },
    });

    // 返回串流式回應
    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        // 加上 CORS 頭部，以防萬一
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Error in API route:', error);
    // 返回一個詳細的錯誤訊息
    return new Response(JSON.stringify({ error: 'An internal server error occurred.', details: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}