export interface Tutor {
  id: number;
  name: string;
  phoneNumber: string;
  subjects: string[];
  experience: string;
  school: string;
  major: string;
  expertise: string;
  tutorCode: string;
  isActive: boolean;
}

export const tutors: Tutor[] = [
  {
    id: 1,
    name: "王大明",
    phoneNumber: "0912345678",
    subjects: ["數學", "物理"],
    experience: "5年補教經驗，曾任職補習班講師",
    school: "台灣大學",
    major: "應用數學系",
    expertise: "高中數學、大學微積分",
    tutorCode: "T12345",
    isActive: true
  },
  {
    id: 2,
    name: "李小華",
    phoneNumber: "0923456789",
    subjects: ["英文", "其他外語"],
    experience: "多年英語教學經驗，具備TESOL證照",
    school: "政治大學",
    major: "英國語文學系",
    expertise: "多益準備、商業英文",
    tutorCode: "T23456",
    isActive: true
  },
  {
    id: 3,
    name: "張小美",
    phoneNumber: "0934567890",
    subjects: ["物理"],
    experience: "3年補教經驗，曾任職補習班講師",
    school: "清華大學",
    major: "物理系",
    expertise: "高中物理、大學力學",
    tutorCode: "T34567",
    isActive: true
  },
  {
    id: 4, 
    name: "陳大文",
    phoneNumber: "0945678901",
    subjects: ["化學"],
    experience: "6年補教經驗，曾任職補習班講師",
    school: "交通大學",
    major: "應用化學系",
    expertise: "高中化學、大學有機化學",
    tutorCode: "T45678",
    isActive: true
  },
  {
    id: 5,
    name: "林小玉",
    phoneNumber: "0956789012", 
    subjects: ["生物"],
    experience: "4年補教經驗，曾任職補習班講師",
    school: "陽明交通大學",
    major: "生命科學系",
    expertise: "高中生物、大學生物學",
    tutorCode: "T56789",
    isActive: true
  },
  {
    id: 6,
    name: "黃明德",
    phoneNumber: "0912123123",
    subjects: ["數學", "物理"],
    experience: "5年家教經驗",
    school: "清華大學",
    major: "數學系",
    expertise: "高中數理、大學微積分",
    tutorCode: "T67890",
    isActive: true
  },
  {
    id: 7,
    name: "吳雅婷",
    phoneNumber: "0923234234",
    subjects: ["英文"],
    experience: "4年英語教學經驗",
    school: "清華大學",
    major: "外國語文學系",
    expertise: "英文會話、托福準備",
    tutorCode: "T78901",
    isActive: true
  },
  {
    id: 8,
    name: "李志明",
    phoneNumber: "0934345345",
    subjects: ["化學", "生物"],
    experience: "3年家教經驗",
    school: "陽明交通大學",
    major: "生物科技系",
    expertise: "高中生化、大學普化",
    tutorCode: "T89012",
    isActive: true
  },
  {
    id: 9,
    name: "周佳穎",
    phoneNumber: "0945456456",
    subjects: ["國文", "歷史"],
    experience: "4年補教經驗",
    school: "清華大學",
    major: "中國文學系",
    expertise: "國學常識、文言文",
    tutorCode: "T90123",
    isActive: true
  },
  {
    id: 10,
    name: "劉建宏",
    phoneNumber: "0956567567",
    subjects: ["地理", "公民"],
    experience: "3年教學經驗",
    school: "交通大學",
    major: "人文社會學系",
    expertise: "高中社會、時事分析",
    tutorCode: "T01234",
    isActive: true
  },
  {
    id: 11,
    name: "陳雅琪",
    phoneNumber: "0967678678",
    subjects: ["英文", "日文"],
    experience: "5年語言教學經驗",
    school: "清華大學",
    major: "外國語文學系",
    expertise: "外語會話、檢定考試",
    tutorCode: "T12345",
    isActive: true
  },
  {
    id: 12,
    name: "林志豪",
    phoneNumber: "0978789789",
    subjects: ["數學"],
    experience: "6年家教經驗",
    school: "交通大學",
    major: "應用數學系",
    expertise: "高中數學、大學數學",
    tutorCode: "T23456",
    isActive: true
  },
  {
    id: 13,
    name: "王雅芳",
    phoneNumber: "0989890890",
    subjects: ["物理", "化學"],
    experience: "4年理科教學經驗",
    school: "清華大學",
    major: "物理系",
    expertise: "高中物化、實驗操作",
    tutorCode: "T34567",
    isActive: true
  },
  {
    id: 14,
    name: "張家豪",
    phoneNumber: "0990901901",
    subjects: ["生物", "地科"],
    experience: "3年補教經驗",
    school: "陽明交通大學",
    major: "生命科學系",
    expertise: "自然科學、環境教育",
    tutorCode: "T45678",
    isActive: true
  },
  {
    id: 15,
    name: "李俊宏",
    phoneNumber: "0912567890",
    subjects: ["數學", "物理"],
    experience: "4年家教經驗",
    school: "國立陽明交通大學",
    major: "電機工程系",
    expertise: "大學數學、工程數學",
    tutorCode: "T56789",
    isActive: true
  },
  {
    id: 16,
    name: "吳雅婷",
    phoneNumber: "0923678901",
    subjects: ["化學", "生物"],
    experience: "3年教學經驗",
    school: "國立清華大學",
    major: "化學系",
    expertise: "普通化學、有機化學",
    tutorCode: "T67890",
    isActive: true
  },
  {
    id: 17,
    name: "張書豪",
    phoneNumber: "0934789012",
    subjects: ["英文"],
    experience: "5年英語教學經驗",
    school: "國立清華大學",
    major: "外國語文學系",
    expertise: "英語會話、商業英文",
    tutorCode: "T78901",
    isActive: true
  },
  {
    id: 18,
    name: "林美玲",
    phoneNumber: "0945890123",
    subjects: ["數學", "物理"],
    experience: "4年補教經驗",
    school: "國立陽明交通大學",
    major: "應用數學系",
    expertise: "高等數學、大學物理",
    tutorCode: "T89012",
    isActive: true
  },
  {
    id: 19,
    name: "陳建志",
    phoneNumber: "0956901234",
    subjects: ["生物", "化學"],
    experience: "3年家教經驗",
    school: "國立清華大學",
    major: "生命科學系",
    expertise: "分子生物學、生物化學",
    tutorCode: "T90123",
    isActive: true
  },
  {
    id: 20,
    name: "王思穎",
    phoneNumber: "0967012345",
    subjects: ["英文", "數學"],
    experience: "5年教學經驗",
    school: "國立陽明交通大學",
    major: "人文社會學系",
    expertise: "英文寫作、基礎數學",
    tutorCode: "T01234",
    isActive: true
  },
  {
    id: 21,
    name: "黃志偉",
    phoneNumber: "0978123456",
    subjects: ["物理", "化學"],
    experience: "4年實驗教學經驗",
    school: "國立清華大學",
    major: "物理系",
    expertise: "普通物理、實驗設計",
    tutorCode: "T11223",
    isActive: true
  },
  {
    id: 22,
    name: "劉雅琳",
    phoneNumber: "0989234567",
    subjects: ["數學"],
    experience: "3年補教經驗",
    school: "國立陽明交通大學",
    major: "資訊工程系",
    expertise: "離散數學、線性代數",
    tutorCode: "T22334",
    isActive: true
  },
  {
    id: 23,
    name: "謝明宏",
    phoneNumber: "0990345678",
    subjects: ["英文", "日文"],
    experience: "5年語言教學經驗",
    school: "國立清華大學",
    major: "外國語文學系",
    expertise: "語言檢定、商業會話",
    tutorCode: "T33445",
    isActive: true
  },
  {
    id: 24,
    name: "楊雅文",
    phoneNumber: "0901456789",
    subjects: ["化學", "生物"],
    experience: "4年實驗教學經驗",
    school: "國立陽明交通大學",
    major: "生物科技系",
    expertise: "生物化學、分子生物",
    tutorCode: "T44556",
    isActive: true
  }
];

