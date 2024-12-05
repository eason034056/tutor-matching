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
  { id: 3, name: "張小美", phoneNumber: "0934-567-890", subjects: ["物理"], experience: "3年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中物理、大學力學", tutorCode: "T34567", isActive: true },
  { id: 4, name: "陳大文", phoneNumber: "0945-678-901", subjects: ["化學"], experience: "6年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中化學、大學有機化學", tutorCode: "T45678", isActive: true },
  { id: 5, name: "林小玉", phoneNumber: "0956-789-012", subjects: ["生物"], experience: "4年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中生物、大學生物學", tutorCode: "T56789", isActive: true },
  { id: 6, name: "張小美", phoneNumber: "0934-567-890", subjects: ["物理"], experience: "3年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中物理、大學力學", tutorCode: "T34567", isActive: true },
  { id: 7, name: "陳大文", phoneNumber: "0945-678-901", subjects: ["化學"], experience: "6年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中化學、大學有機化學", tutorCode: "T45678", isActive: true },
  { id: 8, name: "林小玉", phoneNumber: "0956-789-012", subjects: ["生物"], experience: "4年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中生物、大學生物學", tutorCode: "T56789", isActive: true },
  { id: 9, name: "張小美", phoneNumber: "0934-567-890", subjects: ["物理"], experience: "3年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中物理、大學力學", tutorCode: "T34567", isActive: true },
  { id: 10, name: "陳大文", phoneNumber: "0945-678-901", subjects: ["化學"], experience: "6年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中化學、大學有機化學", tutorCode: "T45678", isActive: true },
  { id: 11, name: "林小玉", phoneNumber: "0956-789-012", subjects: ["生物"], experience: "4年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中生物、大學生物學", tutorCode: "T56789", isActive: true },
  { id: 12, name: "張小美", phoneNumber: "0934-567-890", subjects: ["物理"], experience: "3年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中物理、大學力學", tutorCode: "T34567", isActive: true },
  { id: 13, name: "陳大文", phoneNumber: "0945-678-901", subjects: ["化學"], experience: "6年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中化學、大學有機化學", tutorCode: "T45678", isActive: true },
  { id: 14, name: "林小玉", phoneNumber: "0956-789-012", subjects: ["生物"], experience: "4年補教經驗，曾任職補習班講師", school: "台灣大學", major: "應用數學系", expertise: "高中生物、大學生物學", tutorCode: "T56789", isActive: true },
];

