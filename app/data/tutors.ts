export interface Tutor {
  id: number;
  name: string;
  subject: string;
  experience: number;
  hourlyRate: number;
  tutorCode: string;
  isActive: boolean;
}

export const tutors: Tutor[] = [
  { id: 1, name: "王大明", subject: "數學", experience: 5, hourlyRate: 800, tutorCode: "T12345", isActive: true },
  { id: 2, name: "李小華", subject: "英文", experience: 7, hourlyRate: 900, tutorCode: "T23456", isActive: true },
  { id: 3, name: "張小美", subject: "物理", experience: 3, hourlyRate: 750, tutorCode: "T34567", isActive: true },
  { id: 4, name: "陳大文", subject: "化學", experience: 6, hourlyRate: 850, tutorCode: "T45678", isActive: true },
  { id: 5, name: "林小玉", subject: "生物", experience: 4, hourlyRate: 800, tutorCode: "T56789", isActive: true },
];

