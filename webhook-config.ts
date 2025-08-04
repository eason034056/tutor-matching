// webhook-config.ts
// n8n Webhook 配置

import { CaseNotificationData } from '@/server/types'

export const WEBHOOK_CONFIG = {
  // n8n 基礎 URL - 請根據您的 n8n 實例修改
  N8N_BASE_URL: process.env.NEXT_PUBLIC_N8N_WEBHOOK_BASE_URL || 'https://n8n.srv919029.hstgr.cloud',
  
  // 管理員通知 webhook 端點
  ADMIN_NOTIFICATION_WEBHOOK: process.env.NEXT_PUBLIC_ADMIN_NOTIFICATION_WEBHOOK_URL || 'https://n8n.srv919029.hstgr.cloud/webhook/admin-notifications',

  // 新家教案件郵件通知 webhook 端點
  NEW_CASE_EMAIL_WEBHOOK: process.env.NEXT_PUBLIC_NEW_CASE_EMAIL_WEBHOOK_URL || 'https://n8n.srv919029.hstgr.cloud/webhook/new-tutor-case',
  
  // webhook 請求超時時間（毫秒）- 增加到 15 秒
  WEBHOOK_TIMEOUT: 60000,
  
  // 最大重試次數
  MAX_RETRIES: 3,
  
  // 是否啟用 webhook 功能
  ENABLE_WEBHOOKS: process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_ENABLE_WEBHOOKS === 'true',
}

// 輸出環境變數值以進行除錯
console.log('NODE_ENV:', process.env.NODE_ENV)
console.log('ENABLE_WEBHOOKS env:', process.env.NEXT_PUBLIC_ENABLE_WEBHOOKS)
console.log('ENABLE_WEBHOOKS config:', WEBHOOK_CONFIG.ENABLE_WEBHOOKS)

// 延遲函數
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// webhook 發送函數
export const sendWebhookNotification = async (type: 'new_case' | 'new_tutor', data: any) => {
  // 如果 webhook 功能未啟用，直接返回
  if (!WEBHOOK_CONFIG.ENABLE_WEBHOOKS) {
    console.log('Webhook 功能未啟用，跳過通知發送')
    return
  }

  let lastError: Error | null = null;
  
  // 重試機制
  for (let attempt = 1; attempt <= WEBHOOK_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`嘗試發送 webhook 通知 (第 ${attempt} 次嘗試)`)
      
      const response = await fetch(WEBHOOK_CONFIG.ADMIN_NOTIFICATION_WEBHOOK || '', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          data,
          timestamp: new Date().toISOString(),
        }),
        signal: AbortSignal.timeout(WEBHOOK_CONFIG.WEBHOOK_TIMEOUT),
      })

      if (!response.ok) {
        throw new Error(`Webhook 請求失敗: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('管理員通知已發送:', result)
      return result
      
    } catch (error) {
      lastError = error as Error;
      console.error(`發送管理員通知失敗 (第 ${attempt} 次嘗試):`, error)
      
      if (attempt < WEBHOOK_CONFIG.MAX_RETRIES) {
        // 計算延遲時間（使用指數退避）
        const delayTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`等待 ${delayTime}ms 後重試...`)
        await delay(delayTime)
      }
    }
  }

  // 所有重試都失敗了
  console.error(`在 ${WEBHOOK_CONFIG.MAX_RETRIES} 次嘗試後仍無法發送通知:`, lastError)
  // 不拋出錯誤，避免影響主要業務流程
  return null
}

// 發送新案件郵件通知的專用函數  
export const sendNewCaseEmailNotification = async (caseData: CaseNotificationData, emailList: string[]) => {
  // 如果 webhook 功能未啟用，直接返回
  if (!WEBHOOK_CONFIG.ENABLE_WEBHOOKS) {
    console.log('Webhook 功能未啟用，跳過新案件郵件通知發送')
    return { success: false, message: 'Webhook功能未啟用' }
  }

  if (emailList.length === 0) {
    console.log('沒有有效的教師email，跳過郵件通知')
    return { success: false, message: '沒有有效的教師email' }
  }

  let lastError: Error | null = null;
  
  // 重試機制
  for (let attempt = 1; attempt <= WEBHOOK_CONFIG.MAX_RETRIES; attempt++) {
    try {
      console.log(`嘗試發送新案件郵件通知 (第 ${attempt} 次嘗試) - 案件: ${caseData.caseNumber}`)
      
      const notificationData = {
        caseData: {
          caseNumber: caseData.caseNumber,
          subject: caseData.subject,
          hourlyFee: caseData.hourlyFee,
          location: caseData.location,
          availableTime: caseData.availableTime,
          teacherRequirements: caseData.teacherRequirements || '',
          studentDescription: caseData.studentDescription || ''
        },
        emailList: emailList
      };

      const response = await fetch(WEBHOOK_CONFIG.NEW_CASE_EMAIL_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(notificationData),
        signal: AbortSignal.timeout(WEBHOOK_CONFIG.WEBHOOK_TIMEOUT),
      })

      if (!response.ok) {
        throw new Error(`新案件郵件通知請求失敗: ${response.status} ${response.statusText}`)
      }

      const result = await response.json()
      console.log('新案件郵件通知已發送:', result)
      return { success: true, ...result }
      
    } catch (error) {
      lastError = error as Error;
      console.error(`發送新案件郵件通知失敗 (第 ${attempt} 次嘗試):`, error)
      
      if (attempt < WEBHOOK_CONFIG.MAX_RETRIES) {
        // 計算延遲時間（使用指數退避）
        const delayTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        console.log(`等待 ${delayTime}ms 後重試...`)
        await delay(delayTime)
      }
    }
  }

  // 所有重試都失敗了
  console.error(`在 ${WEBHOOK_CONFIG.MAX_RETRIES} 次嘗試後仍無法發送新案件郵件通知:`, lastError)
  return { success: false, message: lastError?.message || '發送失敗' }
} 