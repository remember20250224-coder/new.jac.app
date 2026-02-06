# QUEST Enneagram Quick Test (Local Express App)

本專案是一個可在本機運行的 Node.js + Express 網頁 App：
- Landing → Intake → Test Group 1 → Test Group 2 → Result
- 每組 3 句陳述，必須分配 100 分（0–100 整數）
- 以最高分字母組合成 QUEST code，並用固定 mapping 表得到九型人格結果
- 結果儲存至本機 `data/results.json`（沒有資料庫）
- Admin 頁面可看結果與匯出 CSV（UTF-8 BOM，Excel 友好）

## 需求
- Node.js 18+ 建議

## 安裝與啟動

### 1) 建立專案
```bash
mkdir quest-enneagram-quick-test
cd quest-enneagram-quick-test
npm init -y