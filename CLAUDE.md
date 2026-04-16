# Anima

## MCP Servers

### Chrome DevTools MCP

已安裝 [chrome-devtools-mcp](https://github.com/ChromeDevTools/chrome-devtools-mcp)，允許 Claude 控制並檢查真實的 Chrome 瀏覽器。

**功能：**
- 效能分析：錄製追蹤記錄並提取可操作的效能洞察
- 進階瀏覽器除錯：分析網路請求、截圖、檢查 console 訊息
- 可靠的自動化：使用 Puppeteer 自動化 Chrome 操作

**配置（`~/.claude/settings.json`）：**
```json
{
  "mcpServers": {
    "chrome-devtools": {
      "command": "npx",
      "args": ["-y", "chrome-devtools-mcp@latest"]
    }
  }
}
```

**需求：**
- Node.js v20.19 以上
- Google Chrome（目前穩定版或更新版本）
- npm
