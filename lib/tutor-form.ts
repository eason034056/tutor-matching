import * as z from 'zod'

type CreateTutorFormSchemaOptions = {
  requireStudentIdCard: boolean
  requireIdCard: boolean
  requireTerms: boolean
}

const createImageField = (required: boolean, message: string) =>
  z
    .any()
    .optional()
    .refine((files) => {
      if (!files || files.length === 0) {
        return !required
      }

      const file = files[0]
      return Boolean(file && typeof file.type === 'string' && file.type.startsWith('image/'))
    }, message)

export const createTutorFormSchema = ({
  requireStudentIdCard,
  requireIdCard,
  requireTerms,
}: CreateTutorFormSchemaOptions) =>
  z.object({
    name: z.string().min(2, { message: '姓名至少需要2個字' }).max(50, { message: '姓名不能超過50個字' }),
    email: z.string().email({ message: '請輸入有效的電子郵件格式' }).min(1, { message: '請輸入電子郵件' }),
    phoneNumber: z
      .string()
      .min(10, { message: '請輸入有效的手機號碼（10位數字）' })
      .max(15, { message: '電話號碼不能超過15位數字' })
      .regex(/^[0-9-+\s()]*$/, { message: '手機號碼只能包含數字' }),
    subjects: z.string().min(1, { message: '請輸入教學科目' }).max(200, { message: '教學科目不能超過200個字' }),
    experience: z.string().min(1, { message: '請輸入教學經驗' }).max(500, { message: '教學經驗描述不能超過500個字' }),
    school: z.string().min(1, { message: '請輸入就讀學校' }).max(100, { message: '學校名稱不能超過100個字' }),
    major: z.string().min(1, { message: '請輸入主修科系' }).max(100, { message: '主修科系不能超過100個字' }),
    expertise: z.string().min(1, { message: '請輸入專長' }).max(300, { message: '專長描述不能超過300個字' }),
    receiveNewCaseNotifications: z.boolean().default(true),
    agreedToTerms: requireTerms
      ? z.boolean().refine((value) => value === true, {
          message: '請閱讀並同意服務條款',
        })
      : z.boolean().default(true),
    studentIdCard: createImageField(requireStudentIdCard, '請上傳學生證照片（支援所有圖片格式，系統會自動壓縮大檔案）'),
    idCard: createImageField(requireIdCard, '請上傳身分證照片（支援所有圖片格式，系統會自動壓縮大檔案）'),
  })

export type TutorFormSchema = ReturnType<typeof createTutorFormSchema>
export type TutorFormValues = z.infer<TutorFormSchema>

export type TutorFormSeed = {
  name?: string
  email?: string
  phoneNumber?: string
  subjects?: string[] | string
  experience?: string
  school?: string
  major?: string
  expertise?: string
  receiveNewCaseNotifications?: boolean
  agreedToTerms?: boolean
}

export const createTutorFormDefaults = (seed: TutorFormSeed = {}, requireTerms = true) => ({
  name: seed.name || '',
  email: seed.email || '',
  phoneNumber: seed.phoneNumber || '',
  subjects: Array.isArray(seed.subjects) ? seed.subjects.join(' ') : seed.subjects || '',
  experience: seed.experience || '',
  school: seed.school || '',
  major: seed.major || '',
  expertise: seed.expertise || '',
  receiveNewCaseNotifications: seed.receiveNewCaseNotifications ?? true,
  agreedToTerms: requireTerms ? seed.agreedToTerms ?? false : true,
  studentIdCard: undefined,
  idCard: undefined,
})

export const normalizeTutorSubjects = (subjects: string) =>
  subjects
    .split(/\s+/)
    .map((subject) => subject.trim())
    .filter(Boolean)

const normalizeText = (value: unknown) => (typeof value === 'string' ? value.trim() : '')

export const normalizeTutorSubmissionData = (input: Record<string, unknown>) => {
  const name = normalizeText(input.name)
  const email = normalizeText(input.email)
  const phoneNumber = normalizeText(input.phoneNumber)
  const experience = normalizeText(input.experience)
  const school = normalizeText(input.school)
  const major = normalizeText(input.major)
  const expertise = normalizeText(input.expertise)

  const subjects = Array.isArray(input.subjects)
    ? input.subjects.filter((value): value is string => typeof value === 'string' && value.trim().length > 0).map((value) => value.trim())
    : normalizeTutorSubjects(normalizeText(input.subjects))

  if (!name || !email || !phoneNumber || subjects.length === 0 || !experience || !school || !major || !expertise) {
    throw new Error('缺少必要申請資料')
  }

  return {
    name,
    email,
    phoneNumber,
    subjects,
    experience,
    school,
    major,
    expertise,
    receiveNewCaseNotifications: Boolean(input.receiveNewCaseNotifications),
  }
}
