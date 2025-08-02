# Godaddy 企業信箱 SMTP 設置指南

## 🔧 **在 n8n 中設置 SMTP 憑證**

### 1. **前往 n8n 憑證設置**
- 登入您的 n8n 實例
- 點擊右上角的使用者頭像
- 選擇 "Credentials"（憑證）

### 2. **新增 SMTP 憑證**
- 點擊 "Add credential"
- 搜尋並選擇 "SMTP"
- 輸入以下設定：

```
憑證名稱: Godaddy SMTP
主機: smtpout.secureserver.net
端口: 587
安全性: STARTTLS
使用者名稱: 您的完整企業信箱地址 (例如: admin@yourdomain.com)
密碼: 您的信箱密碼
```

### 3. **替代 SMTP 設定（如果上述不行）**

如果 `smtpout.secureserver.net` 無法連接，請嘗試：

```
主機: relay-hosting.secureserver.net
端口: 587
安全性: STARTTLS
```

或使用 SSL：

```
主機: smtpout.secureserver.net
端口: 465
安全性: SSL/TLS
```

### 4. **測試連接**
- 設定完成後，點擊 "Test" 按鈕
- 確保顯示 "Connection successful"

## 🔑 **Godaddy 信箱安全設置**

如果您的 Godaddy 企業信箱啟用了雙重驗證，您可能需要：

1. **創建應用程式密碼**：
   - 登入 Godaddy 企業信箱
   - 前往安全設定
   - 創建專用的應用程式密碼
   - 在 n8n SMTP 設定中使用應用程式密碼而非原始密碼

2. **檢查安全設定**：
   - 確保允許 "較不安全的應用程式" 存取
   - 或設定 OAuth2（更安全但設置更複雜）

## 🚨 **常見問題解決**

### 問題 1: 無法連接到 SMTP 伺服器
**解決方案**：
- 確認主機名稱和端口正確
- 檢查防火牆設定
- 嘗試不同的安全性設定

### 問題 2: 驗證失敗
**解決方案**：
- 確認使用者名稱是完整的電子郵件地址
- 檢查密碼是否正確
- 如有雙重驗證，使用應用程式密碼

### 問題 3: 郵件被拒絕
**解決方案**：
- 確保發件人地址與認證地址一致
- 檢查 Godaddy 的發送限制
- 確認郵件內容不觸發垃圾郵件過濾器

## 📝 **設置完成檢查清單**

- [ ] SMTP 憑證設置完成
- [ ] 測試連接成功
- [ ] 工作流中的 Send Email 節點已選擇正確的憑證
- [ ] Firebase 專案 ID 已更新
- [ ] Webhook URL 已記錄
- [ ] 表單代碼已更新觸發機制 