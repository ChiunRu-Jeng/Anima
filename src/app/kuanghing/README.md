# 廣興禮儀 網站 — 維護說明

單頁式網站，路由為 `/kuanghing`。

- `page.tsx` — 字體、SEO、頁面作用域 CSS
- `KuangHingSite.tsx` — 版面與所有區塊內容（文字、服務、流程… 都在這檔的最上方常數）
- `ImageSlot.tsx` — 圖片框（可拖放上傳，存 localStorage；有預設示意圖）

## 改內容

文字 / 電話 / 地址 / 服務項目 / 流程，都在 `KuangHingSite.tsx` 最上方的常數陣列
（`services`、`steps`、`contractPoints`…）。改完重新部署即可。

圖片：在網頁上把照片拖進框＝只存在你這台瀏覽器。要全站生效，請把照片放進
專案並改 `IMG` 常數（`KuangHingSite.tsx`）的預設網址。

## 收到客人填單資料（Email + Google 試算表 + LINE）

表單會 POST 到 `/api/contact`，再由後端轉送到一個 **Google Apps Script** webhook，
由它一次寄 Email、寫進試算表、推 LINE。設定步驟：

### 1. 建立試算表 + 腳本
1. 建一個 Google 試算表（標題列可填：時間、稱呼、電話、諮詢項目、訊息）。
2. 「擴充功能 → Apps Script」，貼上下方程式，存檔。
3. 「部署 → 新增部署 → 類型：網頁應用程式」，執行身分選「我」，存取權選「**任何人**」。
4. 複製產生的網址（`https://script.google.com/macros/s/…/exec`）。

### 2. 設定環境變數
在 Vercel → 專案 Settings → Environment Variables 新增：

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
Email + 試算表只靠上面就好。要再加 LINE：
1. 到 LINE Developers 建一個 Messaging API channel（綁定你的 LINE 官方帳號）。
2. 取得 **channel access token**，填進腳本的 `LINE_TOKEN`。
3. `LINE_TO` 填要收到通知的 userId / groupId，重新部署腳本即可。
   （LINE Notify 已於 2025 年停用，故改用 Messaging API。）
