# 🚀 Softraxa CRM — Complete Project Overview

Softraxa CRM is a world-class, multi-tenant capable CRM and Project Management ecosystem designed for modern software companies. It features a high-performance Next.js web panel and a native Flutter companion app, all powered by a robust Supabase backend.

---

## 🛠️ 1. Technical Stack

### **Web Panel (Next.js)**
- **Framework**: `Next.js 15.1.6` (App Router)
- **Library**: `React 19.x`
- **Styling**: `Tailwind CSS 3.4+` (Transitioning to v4)
- **Animations**: `Framer Motion`
- **Icons**: `Lucide React`
- **Utilities**: `date-fns`, `clsx`, `tailwind-merge`
- **PDF Generation**: `html2pdf.js`

### **Mobile Companion (Flutter)**
- **Framework**: `Flutter` (Stable)
- **State Management**: `Riverpod`
- **Routing**: `go_router`
- **Backend Integration**: `supabase_flutter`
- **Native Bridges**: `url_launcher` (Direct Call/WhatsApp)

### **Backend & Database**
- **Platform**: `Supabase`
- **Database**: `PostgreSQL` (with RLS & Triggers)
- **Authentication**: `Supabase Auth` (GoTrue)
- **Real-time**: Enabled for notifications and chat.

---

## 🏗️ 2. System Architecture

### **Frontend Structure (`src/`)**
The project follows a modular architecture for scalability:
- `src/app/`: Next.js App Router folders. Uses `(dashboard)` grouping for authenticated layouts.
- `src/modules/`: **Domain-driven feature modules**. Each contains its own pages, components, and logic.
- `src/components/`: Shared UI primitives (shadcn-based).
- `src/lib/`: Core service initializations (Supabase, AI, Utils).

### **Mobile Structure (`softraxa_crm_mobile/`)**
- `lib/core/`: Global configurations, theme, and common utilities.
- `lib/features/`: Feature-sliced architecture (Leads, Projects, Auth).

### **Database Schema**
The system uses a highly relational schema with strong data integrity:
- **Core**: `profiles`, `projects`, `tasks`.
- **CRM**: `leads` (with industry-specific extensions), `follow_ups`.
- **Finance**: `invoices`, `expenses`, `transactions`.
- **HRM**: `attendance`, `leave_requests`, `profiles` (extended for HR).
- **Social/Wiki**: `wiki_articles`, `tickets`, `notifications`.

---

## 💎 3. Core Modules & Features

### **1. CRM (Customer Relationship Management)**
- **Lead Lifecycle**: Tracks leads from `new` → `contacted` → `negotiation` → `won`/`lost`.
- **Follow-up Engine**: Sophisticated follow-up reminder system (Today/Overdue views).
- **Lead Tiers**: Supports `normal` and `premium` lead levels.
- **Industry Templates**: Pre-built SQL seeds for Corporate, Education, Manufacturing, Real Estate, and Clinics.

### **2. Project & Task Management**
- **Dynamic Checkpoints**: Tasks can have `checkpoint_date` and `min_progress_required`.
- **Auto-Transfer**: Intelligent system that reassigns tasks to a `backup_assignee_id` if checkpoints are missed.
- **Real-time Tracking**: Duration logging and progress percentage updates.

### **3. AI & Automation**
- **AI Service**: Integrated AI logic for generating content and automating workflows.
- **Social Tools**: Components designed for social media automation and lead scraping.

### **4. HRM (Human Resource Management)**
- **Attendance System**: `clock_in`/`clock_out` with `late` detection.
- **Leave Management**: Full lifecycle of leave requests (`pending` → `approved`/`rejected`).
- **Gamification**: Users earn `points` and `levels` based on task completion and accuracy.

### **5. Finance & Commercials**
- **Proposal/Contract Builder**: Generates professional, branded PDFs using `html2pdf.js`.
- **Invoice Tracking**: Integrated with projects and clients.
- **Expense Management**: Categorized spending linked to project budgets.

---

## 🔐 4. Authentication & Security

### **Role-Based Access Control (RBAC)**
The system implements five distinct roles defined in the `AuthContext`:
1. **Admin**: Full system access (Finance, HRM, CRM).
2. **PM (Project Manager)**: Management of projects, tasks, and team oversight.
3. **Employee**: Day-to-day work, own tasks, and gamification.
4. **Member**: Internal collaborator role.
5. **Client**: Restricted view for external stakeholders (Project progress/Invoices).

### **Security Layers**
- **Supabase RLS**: Every table uses Row Level Security policies to ensure users only see data they are authorized to access.
- **Auth Guarding**: `ProtectedRoute` wrapper in Next.js prevents unauthorized route access.
- **Blocked State**: Dedicated `status` field in `profiles` allows admins to immediately revoke access.

---

## 🚀 5. Development & Deployment

### **Core Scripts**
- `npm run dev`: Starts the Next.js development server.
- `npm run build`: Generates a production build (supports Static Export for Hostinger).
- `flutter run`: Starts the mobile companion app.

### **Coding Standards**
- **Promise Pattern**: Use `Promise.allSettled` for parallel queries to prevent hanging spinners.
- **Client Directives**: Every hook-based component starts with `"use client"`.
- **Tailwind 4 Ready**: Utilizes modern styling patterns compatible with Tailwind v3/v4.

---

## 📈 6. Current Project Status
The project is currently in an **active expansion phase**. Recent developments include:
- Refinement of the **Commercial Documents** module (PDF output optimization).
- Implementation of **Header Animations** and high-fidelity UI polish.
- Expansion of **Industry-Specific CRM** templates.
- Full integration of **RBAC** across all critical modules.
