// /api/chat.js

// 引入 OpenAI 函式庫
import OpenAI from 'openai';

// 建立一個 OpenAI 客戶端實例，並配置為指向 Poe 的 API
const poeClient = new OpenAI({
  apiKey: process.env.POE_API_KEY, // 從 Vercel 的環境變數讀取金鑰
  baseURL: 'https://api.poe.com/v1',
});

// 這是 Vercel Serverless Function 的主要處理函式
// 它接收 request (req) 和 response (res) 兩個物件
export default async function handler(req, res) {
  // 確保只處理 POST 請求
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  try {
    // 從請求的 body 中獲取使用者傳來的訊息
    // 我們約定前端會傳來一個 JSON 物件，格式為 { "message": "用戶的訊息" }
    const { message } = req.body;

    // 如果沒有收到 message，回傳錯誤
    if (!message) {
      return res.status(400).json({ error: 'Message is required in the request body.' });
    }

    console.log(`收到的訊息: "${message}"，準備傳送給 Poe...`);

    // 使用 Poe API Client 發送訊息
    const chatCompletion = await poeClient.chat.completions.create({
      model: 'ChatEtoC', // 指定您在 Poe 上設定的 Bot 名稱
      messages: [
        {
          role: 'user',
          content: message,
        },
      ],
      stream: false, // 為了簡單起見，我們先不使用串流模式
    });

    // 從 Poe 的回應中提取機器人的回覆內容
    const botResponse = chatCompletion.choices[0].message.content;
    console.log(`來自 Poe 的回應: "${botResponse}"`);

    // 將機器人的回覆以 JSON 格式回傳給前端
    // 格式為 { "reply": "機器人的回覆" }
    res.status(200).json({ reply: botResponse });

  } catch (error) {
    // 如果過程中發生任何錯誤，記錄錯誤並回傳 500 伺服器錯誤
    console.error('與 Poe API 通訊時發生錯誤:', error);
    res.status(500).json({ error: 'Failed to communicate with the bot API.' });
  }
}