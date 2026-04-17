# Anima – Ad Platform Integration API

統一串接 **Facebook 廣告後台**、**Google 關鍵字廣告後台** 及 **QDM 官網後台** 的 Python FastAPI 服務。

## 架構

```
main.py                          # FastAPI 應用程式入口
config.py                        # 環境變數設定（Pydantic Settings）
app/
  api/routes.py                  # 所有 REST 路由
  integrations/
    facebook_ads.py              # Meta Marketing API 串接
    google_ads.py                # Google Ads API 串接
    qdm_backend.py               # QDM 官網後台 REST 串接
  models/campaign.py             # Pydantic 資料模型
```

## 快速開始

### 1. 安裝依賴

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env 填入各平台金鑰
```

### 3. 啟動服務

```bash
python main.py
# 或使用 uvicorn
uvicorn main:app --reload --port 8000
```

API 文件：`http://localhost:8000/docs`

---

## 各平台設定說明

### Facebook 廣告後台

1. 至 [Meta for Developers](https://developers.facebook.com/) 建立 App
2. 開啟 **Marketing API** 權限
3. 產生長效 Access Token（Long-lived token）
4. 取得廣告帳號 ID（格式：`act_XXXXXXXXXX`）
5. 填入 `.env`：
   ```
   FB_APP_ID=...
   FB_APP_SECRET=...
   FB_ACCESS_TOKEN=...
   FB_AD_ACCOUNT_ID=act_XXXXXXXXXX
   ```

### Google 關鍵字廣告後台

1. 至 [Google Ads API Center](https://ads.google.com/home/tools/manager-accounts/) 申請開發者 Token
2. 建立 OAuth2 憑證（Client ID / Client Secret）
3. 完成 OAuth2 授權流程取得 Refresh Token
4. 填入 `.env`：
   ```
   GOOGLE_ADS_DEVELOPER_TOKEN=...
   GOOGLE_ADS_CLIENT_ID=...
   GOOGLE_ADS_CLIENT_SECRET=...
   GOOGLE_ADS_REFRESH_TOKEN=...
   GOOGLE_ADS_LOGIN_CUSTOMER_ID=...   # MCC 帳號（選填）
   GOOGLE_ADS_CUSTOMER_ID=...         # 廣告客戶 ID（格式：XXX-XXX-XXXX）
   ```

### QDM 官網後台

支援兩種認證方式：

**方式一：API Key**
```
QDM_BASE_URL=https://your-qdm-domain.com
QDM_API_KEY=your_api_key
```

**方式二：帳號密碼登入**
```
QDM_BASE_URL=https://your-qdm-domain.com
QDM_USERNAME=admin
QDM_PASSWORD=your_password
```

---

## API 端點

| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/v1/facebook/campaigns` | Facebook 廣告活動列表 |
| GET | `/api/v1/facebook/insights` | Facebook 每日成效數據 |
| GET | `/api/v1/facebook/campaigns/{id}/spend` | 單一廣告活動花費 |
| GET | `/api/v1/google/campaigns` | Google 廣告活動列表 |
| GET | `/api/v1/google/keywords` | Google 關鍵字成效 |
| GET | `/api/v1/google/insights` | Google 每日成效數據 |
| GET | `/api/v1/qdm/products` | QDM 商品列表 |
| GET | `/api/v1/qdm/products/{id}` | QDM 單一商品 |
| GET | `/api/v1/qdm/orders/summary` | QDM 訂單摘要 |
| GET | `/api/v1/qdm/traffic` | QDM 網站流量統計 |
| GET | `/api/v1/qdm/site-info` | QDM 網站資訊 |
| GET | `/api/v1/dashboard` | 三平台整合報表 |
| GET | `/health` | 服務健康檢查 |
