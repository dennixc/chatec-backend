// /api/chat.js

// 引入 OpenAI 函式庫
import OpenAI from 'openai';

// --- 安全性設定：定義允許存取此 API 的來源網址（白名單）---
const ALLOWED_ORIGIN = 'https://www.dhw.hk';

// 建立一個 OpenAI 客戶端實例，並配置為指向 Poe 的 API
const poeClient = new OpenAI({
  apiKey: process.env.POE_API_KEY, // 從 Vercel 的環境變數讀取金鑰
  baseURL: 'https://api.poe.com/v1',
});

// 這是 Vercel Serverless Function 的主要處理函式
// 它接收 request (req) 和 response (res) 兩個物件
export default async function handler(req, res) {
  
  // --- CORS 和來源驗證 ---
  const origin = req.headers.origin;

  // 檢查請求的來源是否在我們的白名單中
  if (origin === ALLOWED_ORIGIN) {
    // 如果來源相符，設定對應的 CORS 標頭，允許該來源的跨域請求
    res.setHeader('Access-Control-Allow-Origin', ALLOWED_ORIGIN);
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  } else {
    // 如果來源不符，或請求沒有來源 (例如直接從 Postman 或 curl 發送)，則拒絕請求
    // 注意：在某些情況下，您可能希望允許沒有 origin 的請求，但為了最大程度的安全性，這裡我們選擇拒絕
    return res.status(403).json({ error: 'Forbidden: Origin not allowed.' });
  }

  // 處理瀏覽器發送的 "預檢" (preflight) 請求
  // 當前端使用 POST 且 Content-Type 為 application/json 時，瀏覽器會先發送一個 OPTIONS 請求來確認伺服器是否允許
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }
  // --- CORS 處理結束 ---


  // 確保只處理 POST 請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 從請求的 body 中獲取使用者傳來的訊息
    const { message } = req.body;

    // 如果沒有收到 message，回傳錯誤
    if (!message) {
      return res.status(400).json({ error: 'Message is required in the request body.' });
    }

    console.log(`收到來自 ${origin} 的訊息: "${message}"，準備傳送給 Poe...`);

    // 使用 Poe API Client 發送訊息
    const chatCompletion = await poeClient.chat.completions.create({
      model: 'ChatEtoC', // 指定您在 Poe 上設定的 Bot 名稱
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      stream: false,
    });

    // 從 Poe 的回應中提取機器人的回覆內容
    const botResponse = chatCompletion.choices[0].message.content;
    console.log(`來自 Poe 的回應: "${botResponse}"`);

    // 將機器人的回覆以 JSON 格式回傳給前端
    res.status(200).json({ reply: botResponse });

  } catch (error) {
    // 如果過程中發生任何錯誤，記錄錯誤並回傳 500 伺服器錯誤
    console.error('與 Poe API 通訊時發生錯誤:', error);
    res.status(500).json({ error: 'Failed to communicate with the bot API.' });
  }
}