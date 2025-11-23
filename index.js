// index.js

// 1. 載入 .env 檔案中的環境變數
require('dotenv').config();

// 2. 【關鍵修正】使用解構賦值從 'openai' 函式庫引入 OpenAI 類別
const { OpenAI } = require("openai");

// 3. 檢查 API 金鑰是否存在，這是一個好的實踐
const apiKey = process.env.POE_API_KEY;
if (!apiKey) {
  console.error('錯誤：找不到 POE_API_KEY。請檢查您的 .env 檔案。');
  process.exit(1); // 終止程式
}

// 4. 建立 Poe API 的客戶端實例
const client = new OpenAI({
  apiKey: apiKey,
  baseURL: "https://api.poe.com/v1", // 指向 Poe 的伺服器
});

// 5. 建立一個主要的非同步函式來執行我們的邏輯
//    這樣做是為了可以使用 await 語法，並且讓程式碼結構更清晰
async function main() {
  try {
    // 根據您的範例，我們要對話的 Bot 是 "chatetoc"
    const modelName = "chatetoc";
    const userMessage = "Hello world";

    console.log(`正在向 Poe 上的 Bot "${modelName}" 傳送訊息: "${userMessage}"`);

    // 6. 使用 client.chat.completions.create 來傳送訊息
    const completion = await client.chat.completions.create({
      model: modelName,
      messages: [
        { role: "user", content: userMessage },
      ],
    });

    // 7. 從回應中提取機器人的回覆內容並印出
    const botReply = completion.choices[0].message.content;
    console.log('機器人的回應:', botReply);

  } catch (error) {
    // 8. 增加更詳細的錯誤處理，方便未來除錯
    console.error('與 Poe API 互動時發生錯誤:');
    // 檢查是否是 API 回傳的錯誤 (例如金鑰錯誤、模型名稱錯誤)
    if (error instanceof OpenAI.APIError) {
      console.error('狀態碼:', error.status); // e.g. 401
      console.error('錯誤類型:', error.type); // e.g. invalid_request_error
      console.error('錯誤訊息:', error.message);
    } else {
      // 其他類型的錯誤 (例如網路問題)
      console.error(error.message);
    }
  }
}

// 9. 執行 main 函式
main();