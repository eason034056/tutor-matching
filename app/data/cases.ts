export interface TutorCase {
  id: number;
  caseNumber: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  address: string;
  idNumber: string;
  studentGender: string;
  lineId: string;
  department: string;
  grade: string;
  studentDescription: string;
  subject: string;
  location: string;
  availableTime: string;
  teacherRequirements: string;
  hourlyFee: number;
  message: string;
  status: '急徵' | '已徵到' | '有人接洽';
  applicant?: {
    tutorCode: string;
    appliedAt: string;
    deadline: string;
  };
}

export const tutorCases: TutorCase[] = [
  {
    id: 1,
    caseNumber: "TC001",
    parentName: "王小明",
    parentPhone: "0912345678",
    parentEmail: "wang@example.com",
    address: "台北市大安區和平東路一段",
    idNumber: "A123456789",
    studentGender: "male",
    lineId: "wang_line",
    department: "資訊工程系",
    grade: "大學",
    studentDescription: "目前微積分需要加強，基礎觀念不夠穩固",
    subject: "微積分",
    location: "學生家",
    availableTime: "週一至週五晚上7點後",
    teacherRequirements: "希望有家教經驗，具備耐心",
    hourlyFee: 800,
    message: "希望能在期中考前開始上課",
    status: "急徵",
    applicant: undefined
  },
  {
    id: 2,
    caseNumber: "TC002",
    parentName: "李小華",
    parentPhone: "0923456789",
    parentEmail: "lee@example.com",
    address: "台北市信義區松仁路",
    idNumber: "B234567890",
    studentGender: "female",
    lineId: "lee_line",
    department: "英文系",
    grade: "大學",
    studentDescription: "英文寫作需要加強，希望能提升論文寫作能力",
    subject: "英文寫作",
    location: "線上",
    availableTime: "週末下午2點到6點",
    teacherRequirements: "希望是英文系畢業或有相關經驗",
    hourlyFee: 700,
    message: "可以配合老師時間安排",
    status: "已徵到",
    applicant: {
      tutorCode: "T23456",
      appliedAt: "2024-03-20T10:00:00Z",
      deadline: "2024-03-23T10:00:00Z"
    }
  },
  {
    id: 3,
    caseNumber: "TC003",
    parentName: "張小芳",
    parentPhone: "0934567890",
    parentEmail: "chang@example.com",
    address: "台北市中山區林森北路",
    idNumber: "C345678901",
    studentGender: "female",
    lineId: "chang_line",
    department: "物理系",
    grade: "大學",
    studentDescription: "物理實驗報告寫作需要協助",
    subject: "物理",
    location: "教師家",
    availableTime: "週三、週五晚上",
    teacherRequirements: "需要有物理相關背景",
    hourlyFee: 900,
    message: "希望能同時加強實驗操作和報告寫作",
    status: "急徵",
    applicant: undefined
  },
  {
    id: 4,
    caseNumber: "TC004",
    parentName: "陳小明",
    parentPhone: "0945678901",
    parentEmail: "chen@example.com",
    address: "台北市文山區指南路",
    idNumber: "D456789012",
    studentGender: "male",
    lineId: "chen_line",
    department: "歷史系",
    grade: "大學",
    studentDescription: "論文寫作需要指導",
    subject: "歷史論文寫作",
    location: "線上",
    availableTime: "平日晚上都可以",
    teacherRequirements: "希望是歷史研究所以上學歷",
    hourlyFee: 750,
    message: "預計上課三個月",
    status: "急徵",
    applicant: undefined
  },
  {
    id: 5,
    caseNumber: "TC005",
    parentName: "林小美",
    parentPhone: "0956789012",
    parentEmail: "lin@example.com",
    address: "台北市內湖區成功路",
    idNumber: "E567890123",
    studentGender: "female",
    lineId: "lin_line",
    department: "資工系",
    grade: "大學",
    studentDescription: "Java程式設計需要輔導",
    subject: "Java程式設計",
    location: "學生家",
    availableTime: "週六、週日全天",
    teacherRequirements: "要有程式開發經驗",
    hourlyFee: 1000,
    message: "希望能教到實際應用",
    status: "已徵到",
    applicant: undefined
  }
];

