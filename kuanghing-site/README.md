# 廣興禮儀 官方網站（獨立版）

溫暖、療癒風格的單頁式 RWD 網站，首頁 `/` 即為禮儀網站。這是可**單獨部署**的
獨立 Next.js 專案，與 Anima 儀表板完全分開。

## 本機開發

```bash
cd kuanghing-site
npm install
npm run dev      # http://localhost:3000
```

## 部署到 Vercel（重點）

把這個資料夾接成一個**新的 Vercel 專案**：

1. Vercel → Add New → Project → 選同一個 GitHub repo。
2. **Root Directory** 設成 `kuanghing-site`（關鍵！這樣 Vercel 才會部署這個子專案而不是儀表板）。
3. Framework 會自動偵測為 Next.js，直接 Deploy。
4. 之後在這個專案 Settings → Domains 綁上你買的網址即可（自動上 SSL）。

> 這樣你的網域根目錄 `/` 打開就是禮儀網站。

## 改內容

- 文字 / 電話 / 服務項目 / 流程 → `src/app/KuangHingSite.tsx` 最上方的常數陣列。
- 圖片預設圖 → 同檔的 `IMG` 常數；或在網頁上直接把照片拖進圖片框（存在瀏覽器）。

## 收到客人填單資料（Email + Google 試算表 + LINE）

表單會 POST 到 `/api/contact`，再轉送到一個 **Google Apps Script** webhook，由它一次
寄 Email、寫進試算表、推 LINE。

### 1. 建立試算表 + 腳本
1. 建一個 Google 試算表（標題列可填：時間、稱呼、電話、諮詢項目、訊息）。
2. 「擴充功能 → Apps Script」，貼上下方程式，存檔。
3. 「部署 → 新增部署 → 類型：網頁應用程式」，執行身分選「我」，存取權選「**任何人**」。
4. 複製產生的網址（`https://script.google.com/macros/s/…/exec`）。

### 2. 設定環境變數
在這個 Vercel 專案 → Settings → Environment Variables 新增：

```
CONTACT_WEBHOOK_URL = 你剛剛複製的 Apps Script 網址
```

重新部署後，表單送出就會真的寄到信箱、寫進試算表。
（未設定時表單仍可送出，但資料不會寄出 —— 會在伺服器 log 留警告。）

### Apps Script 範本

```javascript
const NOTIFY_EMAIL = '4051Y016@gmail.com';
const LINE_TOKEN = '';  // 之後填 LINE Messaging API 的 channel access token（留空＝略過 LINE）
const LINE_TO    = '';  // 你的 userId 或 groupId

function doPost(e) {
  const d = JSON.parse(e.postData.contents);
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  sheet.appendRow([new Date(), d.name, d.phone, d.topic, d.message]);

  MailApp.sendEmail({
    to: NOTIFY_EMAIL,
    subject: '【廣興禮儀】新諮詢：' + d.name,
    body: '稱呼：' + d.name +
        '\n電話：' + d.phone +
        '\n諮詢項目：' + d.topic +
        '\n訊息：' + (d.message || '（無）') +
        '\n時間：' + d.submittedAt,
  });

  if (LINE_TOKEN && LINE_TO) {
    UrlFetchApp.fetch('https://api.line.me/v2/bot/message/push', {
      method: 'post',
      headers: { Authorization: 'Bearer ' + LINE_TOKEN },
      contentType: 'application/json',
      payload: JSON.stringify({
        to: LINE_TO,
        messages: [{ type: 'text', text:
          '【廣興禮儀】新諮詢\n' + d.name + ' / ' + d.phone + '\n' + d.topic + '\n' + (d.message || '') }],
      }),
      muteHttpExceptions: true,
    });
  }

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
```

### LINE 通知（選用）
Email + 試算表只靠上面就好。要再加 LINE：到 LINE Developers 建一個 Messaging API
channel，取得 channel access token 填進 `LINE_TOKEN`，`LINE_TO` 填收訊息的
userId/groupId，重新部署腳本即可。（LINE Notify 已於 2025 年停用。）

## 圖片授權
目前的示意圖來自 Wikimedia Commons（CC BY-SA），請替換為公司實際照片。
