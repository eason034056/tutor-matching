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
- **🧵 Thread Management**: Organize conversations by problem topics with memory persistence
- **📊 Mathematical Rendering**: Advanced LaTeX and KaTeX support for complex formulas
- **🔄 Interactive Learning**: Follow-up questions and step-by-step explanations

### 👨‍🏫 **Professional Tutor Matching**
- **📋 Comprehensive Screening**: Rigorous verification and approval process
- **💬 Automated Workflow**: n8n-powered notification and management system

### 🔧 **Advanced Admin System**
- **📊 Real-time Dashboard**: Monitor tutor applications and case submissions
- **✅ Approval Workflow**: Streamlined review process for tutors and cases
- **📧 Automated Notifications**: n8n-powered email system for administrators
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
- **🤖 OpenAI API** - GPT-powered problem solving
- **🔄 n8n Workflows** - Automated notification and task management
- **📧 SMTP Integration** - Professional email notifications

### **Advanced Features**
- **🖼️ Image Processing** - Compression, cropping, and watermarking
- **🔐 Security** - Input validation, sanitization, and rate limiting
- **📱 PWA Ready** - Progressive Web App capabilities
- **🌐 SEO Optimized** - Meta tags, sitemaps, and structured data

---

## 🏗️ **System Architecture**

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[Next.js 15 App Router]
        B[React 18 Components]
        C[TypeScript Interface]
        D[Tailwind CSS + shadcn/ui]
        A --> B
        B --> C
        C --> D
    end
    
    subgraph "Authentication & Security"
        E[Firebase Auth]
        F[JWT Tokens]
        G[Role-based Access]
        E --> F
        F --> G
    end
    
    subgraph "AI Processing Pipeline"
        H[Image Upload]
        I[Image Compression]
        J[OpenAI Vision API]
        K[GPT-4 Processing]
        L[LaTeX/KaTeX Rendering]
        H --> I
        I --> J
        J --> K
        K --> L
    end
    
    subgraph "Database Layer"
        M[(Firestore)]
        N[Chat Threads]
        O[User Profiles]
        P[Tutor Data]
        Q[Case Management]
        M --> N
        M --> O
        M --> P
        M --> Q
    end
    
    subgraph "Automation & Workflows"
        R[n8n Engine]
        S[Webhook Triggers]
        T[SMTP Integration]
        U[Admin Notifications]
        V[Auto Approval Pipeline]
        R --> S
        S --> T
        T --> U
        S --> V
    end
    
    subgraph "File Management"
        W[Firebase Storage]
        X[Image Processing]
        Y[Watermark System]
        Z[CDN Distribution]
        W --> X
        X --> Y
        Y --> Z
    end
    
    subgraph "API Layer"
        AA[RESTful APIs]
        BB[Solver Endpoint]
        CC[Admin Endpoints]
        DD[Upload Endpoints]
        AA --> BB
        AA --> CC
        AA --> DD
    end
    
    %% Frontend connections
    A --> E
    A --> AA
    
    %% AI Pipeline connections
    BB --> J
    BB --> M
    L --> B
    
    %% Data flow connections
    AA --> M
    AA --> W
    E --> M
    
    %% Automation connections
    CC --> R
    P --> S
    Q --> S
    
    %% Storage connections
    DD --> W
    H --> W
    
    %% Cross-system integration
    G --> CC
    V --> M
    U --> T
    
    %% Styling
    classDef frontend fill:#e1f5fe
    classDef auth fill:#f3e5f5
    classDef ai fill:#fff3e0
    classDef database fill:#e8f5e8
    classDef automation fill:#fce4ec
    classDef storage fill:#f1f8e9
    classDef api fill:#e3f2fd
    
    class A,B,C,D frontend
    class E,F,G auth
    class H,I,J,K,L ai
    class M,N,O,P,Q database
    class R,S,T,U,V automation
    class W,X,Y,Z storage
    class AA,BB,CC,DD api
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
    participant N8N as n8n Workflow
    participant Admin as Admin Panel
    participant Tutor as Tutor

    %% AI Solver Flow
    rect rgb(230, 245, 255)
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
    rect rgb(255, 245, 230)
        Note over Tutor,Admin: Tutor Onboarding Process
        Tutor->>UI: Submit registration form
        UI->>API: POST /api/tutors/pending
        API->>DB: Store tutor data
        API->>N8N: Trigger webhook notification
        N8N->>Admin: Send email notification
        Admin->>UI: Review application
        Admin->>API: Approve/Reject decision
        API->>DB: Update tutor status
        API->>N8N: Trigger approval webhook
        N8N-->>Tutor: Send confirmation email
    end

    %% Case Matching Flow
    rect rgb(240, 255, 240)
        Note over S,Tutor: Case Matching Process
        S->>UI: Submit tutoring case
        UI->>API: POST /api/cases/upload
        API->>DB: Store case data
        API->>N8N: Trigger case notification
        N8N->>Admin: Notify pending case
        Admin->>API: Approve case
        API->>DB: Move to approved cases
        API->>N8N: Trigger tutor notifications
        N8N-->>Tutor: Send case opportunities
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
2. **Auto Processing**: n8n workflow triggers admin notifications
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