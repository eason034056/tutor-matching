/**
 * Dcard 貼文文字生成器
 *
 * 從案件資料自動組裝出 Dcard 發文格式的標題與內文。
 * 產出的文字可直接複製貼上到 Dcard 發文區。
 */

interface DcardPostInput {
  subject: string
  budgetRange: string
  location: string
  availableTime: string
  studentDescription: string
  teacherRequirements: string
  grade: string
  studentGender: string
  department: string
}

/**
 * 從完整地址字串擷取前段（城市+區域）作為標題用的短地名。
 * 例如 "新竹市東區光復路，近清大" → "新竹市東區"
 */
// 💡 中文地址常見結構：{城市}{區/鎮/鄉}{路名}，用「區/鎮/鄉/市」結尾來截斷
function extractShortLocation(location: string): string {
  const match = location.match(/^(.+?[區鎮鄉市])/)
  return match ? match[1] : location.slice(0, 6)
}

// 💡 資料庫存英文 "male"/"female"，顯示時轉成中文
const GENDER_MAP: Record<string, string> = {
  male: '男',
  female: '女',
}

export function generateDcardPostText(data: DcardPostInput): {
  title: string
  body: string
} {
  const shortLocation = extractShortLocation(data.location)
  const genderLabel = GENDER_MAP[data.studentGender] ?? data.studentGender

  const title = `【徵${data.subject}家教｜${shortLocation}｜${data.grade}${genderLabel}｜時薪${data.budgetRange}】`

  const body = [
    `上課地點：${data.location}`,
    `學生性別與年齡：${data.grade}${genderLabel}`,
    `就讀學校：${data.department || '未填寫'}`,
    `年級：${data.grade}`,
    `上課時段：${data.availableTime}`,
    `時薪：${data.budgetRange}`,
    '',
    '【學生目前程度】',
    data.studentDescription || '未填寫',
    '',
    '【教師條件】',
    data.teacherRequirements || '無特殊要求',
    '',
    '──────',
    '有興趣的同學歡迎直接私訊我！',
  ].join('\n')

  return { title, body }
}
