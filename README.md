# 🍃 Green Pepper Tutor Center | 青椒老師家教中心

## 🚀 **Revolutionizing Education Through AI-Powered Tutoring**

> **Mission**: Bridging the educational resource gap between different socioeconomic backgrounds by providing free AI tutoring tools and professional tutor matching services.

---

## 🎯 **Project Overview**

**Green Pepper Tutor Center** is a comprehensive educational platform that combines **AI-powered problem-solving** with **professional tutor matching services**. Our core mission is to democratize access to quality education by offering free AI tutoring tools, reducing educational inequality between different economic backgrounds.

### **Why "Free AI Tutoring"?**
We believe education should be accessible to everyone, regardless of economic status. By providing completely free AI tutoring services, we aim to eliminate the educational resource gap that exists between wealthy and low-income families, ensuring every student has access to quality learning support.

---

## ✨ **Key Features**

### 🤖 **AI Problem Solver (Core Innovation)**
- **📸 Image-First Approach**: Upload photos of math/science problems for instant solutions
- **🧠 Multi-Model Intelligence**: Smart routing to OpenAI GPT-4 (Math/Physics), Google Gemini (Chemistry/Biology), DeepSeek (Programming/Logic)
- **🧵 Thread Management**: Organize conversations by problem topics with memory persistence
- **📊 Mathematical Rendering**: Advanced LaTeX and KaTeX support for complex formulas
- **🔄 Interactive Learning**: Follow-up questions and step-by-step explanations

### 👨‍🏫 **Professional Tutor Matching**
- **📋 Comprehensive Screening**: Rigorous verification and approval process
- **💬 Automated Workflow**: SMTP-powered notification and management system

### 🔧 **Advanced Admin System**
- **📊 Real-time Dashboard**: Monitor tutor applications and case submissions
- **✅ Approval Workflow**: Streamlined review process for tutors and cases
- **📧 Automated Notifications**: Direct SMTP email system for administrators and tutors
- **🔍 Smart Search**: Advanced filtering and search capabilities

---

## 🛠️ **Technical Architecture**

### **Frontend Technologies**
- **⚛️ Next.js 15** - Latest App Router with React 18
- **📝 TypeScript** - End-to-end type safety
- **🎨 Tailwind CSS + shadcn/ui** - Modern, responsive design system
- **🧮 KaTeX** - Mathematical formula rendering
- **📖 React Markdown** - Rich text rendering with syntax highlighting

### **Backend & Infrastructure**
- **🔥 Firebase Suite**
  - **Authentication** - Secure user management
  - **Firestore** - Scalable NoSQL database
  - **Storage** - Image upload and management
- **🤖 Multi-Model AI** - OpenAI GPT-4, Google Gemini, DeepSeek API for specialized problem solving
- **📧 SMTP Integration** - Direct email notifications via nodemailer

### **Advanced Features**
- **🖼️ Image Processing** - Compression, cropping, and watermarking
- **🔐 Security** - Input validation, sanitization, and rate limiting
- **📱 PWA Ready** - Progressive Web App capabilities
- **🌐 SEO Optimized** - Meta tags, sitemaps, and structured data

---

## 🏗️ **System Architecture**

### **🔧 Core Technology Stack**
```mermaid
graph LR
    subgraph "Client Side"
        A[Next.js 15<br/>React 18<br/>TypeScript]
        B[Tailwind CSS<br/>shadcn/ui<br/>KaTeX]
        A --> B
    end
    
    subgraph "Server Side"  
        C[Firebase Auth<br/>Firestore DB<br/>Storage]
        D[Multi-Model AI<br/>OpenAI + Gemini + DeepSeek<br/>Subject-Based Routing]
        C -.-> D
    end
    
    subgraph "Notifications"
        E[SMTP / nodemailer<br/>Email Notifications]
    end
    
    %% Cross-layer connections
    A --> C
    A --> D
    C --> E
    B --> D
    
    %% Styling
    classDef client fill:#e3f2fd,stroke:#1976d2,color:#000
    classDef server fill:#e8f5e8,stroke:#388e3c,color:#000
    classDef auto fill:#fce4ec,stroke:#c2185b,color:#000
    
    class A client
    class B client
    class C server
    class D server
    class E auto
```

### **🔄 Data Flow Architecture**
```mermaid
graph TD
    subgraph "User Interface Layer"
        UI[Frontend Components]
        Auth[Authentication]
    end
    
    subgraph "Business Logic Layer"
        API[API Routes]
        Solver[AI Solver Service]
        Admin[Admin Service]
        Upload[Upload Service]
    end
    
    subgraph "Data Layer"
        DB[(Firestore Database)]
        Storage[(Firebase Storage)]
    end
    
    subgraph "AI Model Layer"
        OpenAI[OpenAI GPT-4<br/>Image to LaTeX]
        Gemini[Google Gemini<br/>Math/Physics/Chemistry]
        DeepSeek[DeepSeek API<br/>Chinese/English/History/Geography/Civics]
    end
    
    subgraph "Integration Layer"
        Email[SMTP / nodemailer]
    end
    
    %% Clean connections
    UI --> Auth
    UI --> API
    
    API --> Solver
    API --> Admin  
    API --> Upload
    
    Solver --> OpenAI
    Solver --> Gemini
    Solver --> DeepSeek
    Solver --> DB
    
    Admin --> DB
    Admin --> Email
    
    Upload --> Storage
    Upload --> DB
    
    %% Styling with black text
    classDef ui fill:#bbdefb,stroke:#1976d2,color:#000
    classDef logic fill:#c8e6c9,stroke:#388e3c,color:#000
    classDef data fill:#fff3e0,stroke:#f57c00,color:#000
    classDef ai fill:#e8eaf6,stroke:#3f51b5,color:#000
    classDef integration fill:#f8bbd9,stroke:#c2185b,color:#000
    
    class UI,Auth ui
    class API,Solver,Admin,Upload logic
    class DB,Storage data
    class OpenAI,Gemini,DeepSeek ai
    class Email integration
```

### **🚀 AI Processing Pipeline**
```mermaid
graph LR
    A[📸 Image Upload] --> B[🗜️ Compression]
    B --> C[🔍 Subject Detection]
    C --> D{📚 Subject Routing}
    
    D -->|Image to LaTeX| E1[🤖 OpenAI GPT-4]
    D -->|Math/Physics/Chemistry| E2[🧬 Google Gemini]
    D -->|Chinese/English/History/Geography/Civics| E3[💻 DeepSeek API]
    
    E1 --> F[📊 LaTeX Rendering]
    E2 --> F
    E3 --> F
    F --> G[💬 Chat Response]
    
    classDef process fill:#e1f5fe,stroke:#0277bd,stroke-width:2px,color:#000
    classDef decision fill:#fff3e0,stroke:#ff9800,stroke-width:2px,color:#000
    classDef ai fill:#e8eaf6,stroke:#3f51b5,stroke-width:2px,color:#000
    
    class A,B,C,F,G process
    class D decision
    class E1,E2,E3 ai
```

---

## 🔄 **Data Flow & User Journey**

```mermaid
sequenceDiagram
    participant S as Student
    participant UI as Frontend UI
    participant Auth as Firebase Auth
    participant API as API Layer
    participant AI as OpenAI API
    participant DB as Firestore
    participant SMTP as SMTP Email
    participant Admin as Admin Panel
    participant Tutor as Tutor

    %% AI Solver Flow
    rect rgb(160, 195, 225)
        Note over S,AI: AI Problem Solving Journey
        S->>UI: Upload problem image
        UI->>Auth: Verify authentication
        Auth-->>UI: Return user token
        UI->>API: POST /api/solver (image + question)
        API->>AI: Process with GPT-4 Vision
        AI-->>API: Return solution with LaTeX
        API->>DB: Save thread & messages
        API-->>UI: Stream response
        UI-->>S: Display formatted solution
    end

    %% Tutor Registration Flow  
    rect rgb(195, 180, 170)
        Note over Tutor,Admin: Tutor Onboarding Process
        Tutor->>UI: Submit registration form
        UI->>API: POST /api/tutors/pending
        API->>DB: Store tutor data
        API->>SMTP: Send admin notification email
        SMTP->>Admin: Email notification
        Admin->>UI: Review application
        Admin->>API: Approve/Reject decision
        API->>DB: Update tutor status
        API->>SMTP: Send approval email
        SMTP-->>Tutor: Confirmation email
    end

    %% Case Matching Flow
    rect rgb(170, 190, 170)
        Note over S,Tutor: Case Matching Process
        S->>UI: Submit tutoring case
        UI->>API: POST /api/cases/upload
        API->>DB: Store case data
        API->>SMTP: Send admin notification email
        SMTP->>Admin: Notify pending case
        Admin->>API: Approve case
        API->>DB: Move to approved cases
        API->>SMTP: Send tutor notification emails
        SMTP-->>Tutor: Case opportunity emails
        Tutor->>UI: Apply for case
    end
```

---

## 🎨 **User Experience Design**

### **Three-Page AI Solver Flow**
1. **🏠 Home Page**: Camera/upload selection with clear guidance
2. **❓ Question Page**: Image preview with problem input interface  
3. **💬 Chat Page**: Modern chat interface with formula rendering

### **Responsive Design Philosophy**
- **📱 Mobile-First**: Optimized for smartphone usage
- **💻 Desktop Enhanced**: Rich experience with sidebar navigation
- **🎯 Accessibility**: WCAG 2.1 compliant design patterns


---

## 📱 **Core User Flows**

### **🤖 AI Tutoring Flow**
1. **Upload Problem**: Camera or file upload
2. **Ask Question**: Natural language input
3. **Get Solution**: Step-by-step AI explanation
4. **Follow Up**: Additional questions and clarifications
5. **Save & Review**: Thread-based conversation history

### **👨‍🏫 Tutor Matching Flow**
1. **Submit Case**: Parent/student describes learning needs
2. **Auto Processing**: SMTP email triggers admin notifications
3. **Admin Review**: Case approval and tutor matching
4. **Tutor Notification**: Qualified tutors receive case details
5. **Connection**: Direct communication between parties

---

## 🏢 **Business Model & Impact**

### **Revenue Streams**
- **💰 Tutor Matching Commission**: Service fee from successful matches

### **Social Impact Metrics**
- **🆓 Free AI Sessions**: 10,000+ problems solved monthly
- **👥 Students Served**: 5,000+ active users
- **🎓 Academic Improvement**: 85% report grade improvements

---

## 🔧 **Development Highlights**

### **🎯 Technical Challenges Solved**
- **Multi-Model AI Routing**: Intelligent subject detection and model selection for optimal problem-solving accuracy
- **Image Processing**: Client-side compression with server-side optimization
- **Mathematical Rendering**: KaTeX integration with React Markdown

---

## 📊 **Project Stats**

- **📁 Lines of Code**: 15,000+
- **🔧 Components**: 25+ reusable UI components
- **🗃️ Database Collections**: 8 optimized Firestore collections
- **🔌 API Endpoints**: 12 RESTful API routes
- **📱 Pages**: 15+ responsive pages
- **🎨 UI Framework**: 100% TypeScript coverage

---

## 📞 **Contact & Support**

- **🌐 Website**: [https://tutor-matching.tw/](https://tutor-matching.tw/)
- **📧 Email**: contact@tutor-matching.tw
- **💬 LINE**: home-tutor-tw
- **👨‍💻 Developer**: [My LinkedIn Profile](https://www.linkedin.com/in/yu-sen-wu-aa0961277/)

---

<div align="center">

**🍃 Green Pepper Tutor Center - Democratizing Education Through Technology**

*Building a world where quality education is accessible to everyone, regardless of background.*

[🚀 **Start Learning**](https://tutor-matching.tw/) | [👨‍🏫 **Become a Tutor**](https://tutor-matching.tw/tutor-registration) | [🤖 **Try AI Solver**](https://tutor-matching.tw/solver)

</div>