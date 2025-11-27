// /api/chat.js

import { OpenAI } from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// 根據您的 Poe API 範例進行修改
const client = new OpenAI({
  apiKey: process.env.POE_API_KEY, // *** 修改 1: 使用新的環境變數名稱 POE_API_KEY
  baseURL: "https://api.poe.com/v1", // *** 修改 2: 將 baseURL 指向 Poe 的 API
});

export const runtime = 'edge';

export default async function POST(req) {
  try {
    const { messages } = await req.json();

    // 向 Poe API 發起請求
    const response = await client.chat.completions.create({
      model: 'chatetoc', // *** 修改 3: 使用您指定的 Poe 模型名稱
      stream: true, // 我們仍然使用串流模式，以獲得打字機效果
      messages: messages,
    });

    // 將回應轉換為前端可以讀取的串流格式
    const stream = OpenAIStream(response);

    // 以串流形式返回回應
    return new StreamingTextResponse(stream);

  } catch (error) {
    // 如果發生錯誤，在 Vercel 後台日誌中打印詳細錯誤
    console.error("Error in /api/chat:", error);

    // 向前端返回一個更清晰的錯誤訊息
    // 注意：Poe API 的錯誤物件結構可能與 OpenAI 不同，這裡做一個通用處理
    const errorMessage = error.response ? await error.response.text() : error.message;
    return new Response(JSON.stringify({ 
      error: "Poe API request failed",
      details: errorMessage
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}