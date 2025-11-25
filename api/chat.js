// /api/chat.js (串流版本，適用於 Vercel Edge Function，允許所有來源)

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

// 指定此函式在 Edge Runtime 上運行，這對於串流至關重要
export const runtime = 'edge';

const poeClient = new OpenAI({
  apiKey: process.env.POE_API_KEY,
  baseURL: 'https://api.poe.com/v1',
});

export default async function handler(req) {
  
  // --- CORS 處理 (Edge Function 版本) ---
  // 處理瀏覽器發送的 "預檢" (preflight) 請求
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*', // 允許所有來源
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });
  }
  // --- CORS 處理結束 ---

  // 確保只處理 POST 請求
  if (req.method === 'POST') {
    try {
      const { message } = await req.json();

      if (!message) {
        return new Response('Message is required in the request body.', { status: 400 });
      }

      const origin = req.headers.get('origin') || 'unknown';
      console.log(`收到來自 ${origin} 的串流請求: "${message}"`);

      // 發起對 Poe API 的串流請求
      const response = await poeClient.chat.completions.create({
        model: 'ChatEtoC', // 確保這個名稱與您在 Poe 上的 Bot 名稱完全一致
        messages: [{ role: 'user', content: message }],
        stream: true, // 啟用串流
      });

      // 使用 'ai' SDK 的 OpenAIStream 將 Poe 的回應轉換為前端可讀的流
      const stream = OpenAIStream(response);

      // 返回一個 StreamingTextResponse，它會自動處理串流格式
      // 並在這裡再次設定 CORS header 給實際的 POST 回應
      return new StreamingTextResponse(stream, {
        headers: {
          'Access-Control-Allow-Origin': '*', // 允許所有來源
        },
      });

    } catch (error) {
      console.error('與 Poe API 通訊時發生錯誤:', error);
      return new Response('Failed to communicate with the bot API.', { status: 500 });
    }
  }

  // 對於非 POST 和 OPTIONS 的請求
  return new Response(`Method ${req.method} Not Allowed`, { status: 405, headers: { 'Allow': 'POST, OPTIONS' } });
}