# CRM & Project Management System Structure

Based on my analysis of `project-details.md`, here is the structured overview of the project. This system is designed for a software development firm, focusing on automation, productivity, and gamification.

## 1. Core Modules & Functionality

### A. CRM & Sales (The Revenue Engine)

* **Leads Management**: Kanban-style pipeline for tracking potential clients.
* **Contract Management**: Handles Fixed Price, Hourly, and AMC (Retainer) contracts.
* **Proposal Generation**: Automated PDF creation for client proposals.
* **Invoice System**: Direct link between contracts, project milestones, and billing.

### B. Project Management (The Production Floor)

* **Project Dashboard**: High-level health and completion tracking.
* **Milestones & Tasks**: Hierarchical task management (Project -> Milestone -> Task -> Sub-task).
* **Task Checkpoints (Critical)**: Automated progress checks. If a task hits a checkpoint (e.g., Wednesday at 50% progress) and the target is not met, the system auto-transfers the task to a backup assignee and penalizes the original assignee.
* **Credential Vault**: Secure storage for project-related secrets (API keys, SSH keys).
* **Asset Library**: Centralized storage for project documents and design files.

### C. HRM & Time Tracking

* **Attendance & Leaves**: Web-based clock-in/out with leave approval logic that blocks task assignment.
* **Productivity Timer**: Start/Stop timer for granular time logs per task.
* **Employee Profiles**: Skills tracking and performance metrics.

### D. Gamification (The Points Engine)

* **Points Ledger**: Automated point awards for task completion, speed, and quality.
* **Penalties**: Point deductions for late delivery or failing checkpoints.
* **Leaderboard & Badges**: Visual recognition for high performers (e.g., "Bug Hunter," "Speed Demon").

### E. Support & Knowledge Base

* **Ticketing System**: Customer support module linked to maintenance contracts.
* **Internal Wiki**: Knowledge sharing (Server setup, coding standards).
* **Code Snippets**: Reusable code blocks for the team.

### F. Utility & Management

* **Notifications**: System-wide notifications for task updates, mentions, and alerts.
* **Settings**: User-specific preferences (Theme, Notifications, Language).
* **Profile**: Personal dashboard and performance metrics.
* **Finance**: Expense tracking and revenue logging (linked to invoices).

---

## 2. Technical Architecture with Supabase

We will use **Supabase** as the primary backend to handle data, authentication, and file storage.

### Data Schema (Supabase PostgreSQL)

Supabase's PostgreSQL will host all tables with **Row Level Security (RLS)** to enforce strict access roles (Super Admin, PM, Employee, Client).

| Module | Key Tables |
| :--- | :--- |
| **Auth** | `profiles` (extends `auth.users` with points/roles) |
| **CRM** | `leads`, `contracts`, `invoices` |
| **Projects** | `projects`, `task_list`, `checkpoints`, `time_logs`, `secrets` |
| **HRM** | `attendance`, `leave_requests`, `skills` |
| **Finance** | `expenses`, `revenue_logs` |
| **Gamification** | `pts_rules`, `pts_ledger`, `badges`, `user_badges` |
| **Support** | `tickets`, `sla_policies` |
| **Wiki** | `wiki_articles`, `code_snippets` |
| **Common** | `notifications`, `user_settings` |

### Supabase Features to Leverage

1. **Auth**: Managed User Authentication with Role-Based Access Control (RBAC).
2. **Storage**: For `Project Assets`, `Invoices (PDFs)`, `User Avatars`, and `Badge Icons`.
3. **Realtime**: For live status updates on Task Progress and Leaderboard changes.
4. **Edge Functions**: To handle complex server-side logic (e.g., the 2-hour checkpoint nudges and auto-transfer triggers).

---

## 3. Project Folder Structure

```text
/
├── .supabase/              # Supabase migrations & config
├── src/
│   ├── modules/            # Domain-specific logic
│   │   ├── auth/           # Login, Signup, Auth Guard
│   │   ├── dashboard/      # Main stats and overview
│   │   ├── crm/            # Sales, Leads, Invoices
│   │   ├── pm/             # Projects, Tasks, Timer
│   │   ├── hrm/            # Attendance, Leave
│   │   ├── finance/        # Expenses, Revenue
│   │   ├── gamification/   # Points, Badges
│   │   ├── profile/        # User Profile & Stats
│   │   ├── settings/       # User Preferences
│   │   ├── support/        # Tickets, SLA
│   │   ├── wiki/           # Knowledge Base
│   │   └── common/         # Shared logic & Layouts
│   ├── components/         # UI components (shadcn/ui)
│   ├── hooks/              # Custom data fetching hooks
│   ├── lib/                # Supabase client & utilities
│   ├── types/              # TS interfaces for Database
│   ├── assets/             # Images, Global Icons
│   ├── App.tsx             # Main App Router & Provider setup
│   ├── main.tsx            # React entry point
│   └── index.css           # Global styles & Tailwind directives
├── public/                 # Static assets
├── index.html              # HTML template (Vite)
├── vite.config.ts          # Vite configuration
├── tailwind.config.js      # Tailwind CSS configuration
└── components.json         # Shadcn/UI configuration
```
