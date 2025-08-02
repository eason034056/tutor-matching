# n8n 郵件通知系統設置指南

## 🎯 **系統概述**

當有新的教師註冊或新案件提交時，系統會自動：
1. 觸發 n8n webhook
2. 從 Firebase 獲取管理員郵箱列表
3. 發送詳細的通知郵件給所有管理員

## 🚀 **設置步驟**

### 第1步：設置 Godaddy SMTP 憑證

請參考 `GODADDY_SMTP_SETUP.md` 文件完成 SMTP 設置。

### 第2步：更新 n8n 工作流配置

1. **更新 Firebase 專案 ID**：
   ```
   在 n8n 工作流的 "Firebase Admin Emails" 節點中：
   將 URL 中的 "YOUR_PROJECT_ID" 替換為您實際的 Firebase 專案 ID
   ```

2. **設置 Firebase 認證**：
   ```
   在 n8n 中創建 Google Firebase Cloud Firestore OAuth2 憑證
   或使用服務帳戶金鑰進行認證
   ```

3. **更新發件人地址**：
   ```
   在 "Send Email" 節點的 "From Email" 欄位中
   輸入您的 Godaddy 企業信箱地址
   ```

### 第3步：Firebase 管理員資料結構

確保您的 Firebase Firestore 中有 `admins` collection，每個文件應包含：

```json
{
  "name": "管理員姓名",
  "email": "admin@yourdomain.com"
}
```

### 第4步：測試系統

1. **測試 webhook**：
   ```bash
   curl -X POST https://n8n.srv919029.hstgr.cloud/webhook-test/admin-notifications \
   -H "Content-Type: application/json" \
   -d '{
     "type": "new_case",
     "data": {
       "parentName": "測試家長",
       "subject": "數學",
       "caseNumber": "TEST001"
     }
   }'
   ```

2. **檢查郵件發送**：
   - 查看 n8n 工作流執行記錄
   - 確認管理員收到通知郵件

## 📧 **郵件內容預覽**

### 新案件通知郵件：
- **主旨**：新案件通知 - [科目]
- **內容**：包含家長資訊、學生狀況、教學需求等完整資訊

### 新教師註冊通知郵件：
- **主旨**：新教師註冊通知 - [教師姓名]
- **內容**：包含教師基本資料、教學科目、經驗等完整資訊

## 🔧 **進階配置**

### 自定義郵件模板

如需修改郵件樣式，請編輯 n8n 工作流中的 "Generate Email Content" 節點：

```javascript
// 修改 HTML 樣式
const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <!-- 您的自定義 HTML 內容 -->
  </div>
`;
```

### 添加更多通知類型

在 "Generate Email Content" 節點中添加新的通知類型：

```javascript
if (notificationType === 'your_new_type') {
  subject = '您的自定義主旨';
  htmlContent = '您的自定義內容';
}
```

### 設置郵件頻率限制

如需避免郵件轟炸，可在工作流中添加：
- 時間延遲節點
- 重複檢查機制
- 郵件合併功能

## 🚨 **故障排除**

### 問題 1：Webhook 無法觸發
**檢查項目**：
- n8n 服務是否正常運行
- 端口 5678 是否可訪問
- 工作流是否已激活

### 問題 2：無法獲取 Firebase 資料
**檢查項目**：
- Firebase 專案 ID 是否正確
- Firebase 認證憑證是否有效
- admins collection 是否存在且有資料

### 問題 3：郵件發送失敗
**檢查項目**：
- SMTP 憑證設置是否正確
- Godaddy 信箱是否允許 SMTP 存取
- 發件人地址是否與認證地址一致

## 📝 **維護建議**

1. **定期檢查**：
   - 每月檢查 n8n 工作流執行狀況
   - 確認管理員郵箱列表是否最新

2. **監控機制**：
   - 設置工作流執行失敗通知
   - 記錄郵件發送統計

3. **備份與恢復**：
   - 定期匯出 n8n 工作流配置
   - 備份 SMTP 憑證設置

## 🎉 **設置完成**

完成所有步驟後，您的系統將會：
- ✅ 自動偵測新教師註冊
- ✅ 自動偵測新案件提交
- ✅ 發送詳細通知郵件給所有管理員
- ✅ 提供完整的審核資訊

如有任何問題，請檢查 n8n 工作流執行記錄或瀏覽器控制台的錯誤訊息。 