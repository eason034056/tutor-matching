export interface Tutor {
    id: string;
    name: string;
    phoneNumber: string;
    subjects: string[];
    experience: string;
    school: string;
    major: string;
    expertise: string;
    tutorCode: string;
    status: 'pending' | 'approved' | 'rejected';
    isActive: boolean; 
    studentIdCardUrl: string;
    idCardUrl: string;
}

export interface TutorCase {
    id: string;
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
    createdAt: string;
    pending: 'pending' | 'approved' | 'rejected';
    idCardUrl: string;
}