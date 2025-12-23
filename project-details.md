# CRM & Project Management System - Project Details

## 0. Technical Stack & Development Tools

This project is built using modern web technologies to ensure performance, scalability, and a premium user experience.

* **Frontend**: [React](https://reactjs.org/) + [Vite](https://vitejs.dev/)
* **Styling**: [Tailwind CSS](https://tailwindcss.com/)
* **UI Components**: [shadcn/ui](https://ui.shadcn.com/) (Radix UI + Lucide Icons)
* **State Management**: [React Context API](https://reactjs.org/docs/context.html)
* **Backend & DB**: [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage, Edge Functions)
* **Deployment**: Environment-agnostic (Vite build)

---

1. The Core Modules
I have broken down your requirements into four interconnected pillars to ensure data flows logically.
A. CRM & Sales (The Input)
Since you sell software and provide services, your "Leads" are the starting point.
Leads & Follow-ups: Tracking potential clients for services or bulk software licensing.
Contracts: Once a lead converts, a contract is generated. This defines the scope (e.g., "Build an E-commerce App" or "License for Desktop Software").
Invoices: Linked directly to Contracts and Projects.
B. Project Management (The Engine)
This is where the actual work happens.
Projects: These will be of two types in your case:
Client Projects: (e.g., "Client X Website") - Time-bound.
Internal Products: (e.g., "Updates for Android App v2.0") - Continuous.
Work & Tasks: Breaking down projects into sprints or milestones (e.g., "UI Design," "Backend API").
C. HRM (The Resources)
Employees: Managing developers, designers, and testers.
Role Assignment: Linking specific employees to Tasks and Projects to track utilization.
D. Finance (The Health)
Income: Automated via Invoices or manual entry for software sales.
Expenses: Salaries (from HRM), server costs, software licenses, office overhead.
Profitability: The system should be able to calculate (Income from Project A) - (Employee Hours x Hourly Rate) to show if a specific project was profitable.

2. The Data Flow
Here is how the data will connect in your system:
Lead $\rightarrow$ Follow-up (Success) $\rightarrow$ Contract Created.
Contract $\rightarrow$ Triggers a new Project.
Project $\rightarrow$ Divided into Tasks $\rightarrow$ Assigned to Employees.
Tasks Completed $\rightarrow$ Milestones Achieved $\rightarrow$ Triggers Invoice.
Invoice Paid $\rightarrow$ Recorded as Income.

3. Specific Considerations for Your Business Model
Since you sell Android/iOS and Desktop software, your system needs two specific nuances:
License Management: If you sell existing software, you might need a module to track "Licenses Sold" rather than just "Hours Worked."
Maintenance Retainers: For the services side (Web/App), you will likely need recurring invoices for maintenance contracts.

4. The "Active" Work Module (Execution)
This replaces the standard "To-Do" list with a dynamic execution engine.
Granular Assignment: You need a hierarchy: Project $\rightarrow$ Milestone $\rightarrow$ Task $\rightarrow$ Sub-task.
Logic: A task can be assigned to a primary assignee and valid "followers" or "collaborators."
Time Tracking: A built-in timer (Start/Stop) or manual entry log associated with specific Task IDs.
Crucial for your business: This data will calculate the Real Cost of your software projects (Hours $\times$ Employee Hourly Rate).
Completion Matrix: Instead of just "Done/Not Done," you want a percentage-based progress bar (e.g., "API Integration is 80% complete"). This aggregates up to show the total Project Health.
5. The Collaboration Layer
This removes the need for third-party tools (like Slack/WhatsApp) for project-specific talk.
Contextual Communication: A chat stream or comment thread embedded directly inside a Task or Project.
Benefit: If a developer leaves, the conversation history stays with the project, not in a private chat.
Internal Data Sharing: A file repository system linked to projects (e.g., uploading PSDs, SRS documents, or APK builds) with version control.
6. The Gamification & Performance Engine (The Unique Feature)
This is the most complex and powerful part of your request. It turns work into a metric-driven system.
The Logic: You need a "Rules Engine" to award points.
Example: +10 points for finishing a task before the deadline. +5 points for every bug fixed. -2 points for missing a daily update.
The Leaderboard: A dashboard showing top performers.
Appraisal Ready: These points serve as hard data for yearly salary reviews, removing bias from the process.

Revised System Architecture
The complexity has increased. Here is the updated high-level data view:
Module
Key New Data Points
Relationship
Task Engine
Progress_%, Est_Time, Actual_Time, Priority
Linked to Income (Billable hours)
Social
Comment_Logs, File_Attachments, Mentions
Linked to Projects (Audit trail)
Gamification
Point_Ledger, Badge_ID, Trigger_Event
Linked to Employee (Profile rank)

1. Client Support & Ticketing System (AMC Module)
You mentioned selling software. Software always has bugs or needs updates.
The Problem: Currently, if a client has an issue with their Desktop Software, where does that go? It’s not a "Lead" and it’s not exactly a new "Project."
The Feature: A Ticketing System.
Clients raise a "Ticket" (Bug/Issue).
It is linked to their Contract (to check if they have active Annual Maintenance/Support).
It converts to a Task for a developer.
Why you need it: To monetize your after-sales support and keep "bugs" separate from "new development."
2. Client Portal (Guest View)
You have a module for Employees, but what do Clients see?
The Feature: A restricted login area for your clients.
What they can do:
View Project Status (only the high-level percentage, not your internal chats).
Download Invoices and make payments.
Approve Contracts digitally.
Raise Support Tickets.
Why you need it: It reduces the number of "Follow-up" calls you receive asking "What is the status?"
3. Attendance & Leave Management (HRM)
You have "Time Tracking" (Task-based), but that is different from "Attendance" (Day-based).
The Feature: A system to track Check-in/Check-out and Leaves (Sick/Casual).
The Logic: If an employee is marked "On Leave" in this module, the Task Assignment module should block you from assigning them urgent work for that day.
Why you need it: To prevent project delays caused by assigning tasks to absent people.
4. Knowledge Base (Wiki / Code Snippets)
Since you are a software company, your biggest asset is code reusability.
The Feature: An internal "Stack Overflow" or Wiki.
Usage:
"How to setup the server environment."
"Standard code for Login Modules (Android/iOS)."
"Troubleshooting guide for the Desktop Software."
Why you need it: So new employees don't have to ask senior developers the same questions repeatedly. It speeds up onboarding.

5. User Roles & Access Levels
Who uses the system and what can they see?
Super Admin (You/Owner): Full access to everything. Sees all profits, salaries, hidden costs, and can edit any record.
Project Manager (PM): Can create projects, assign tasks, view client details, and see project-level budgets (but not company-wide financials).
Employee (Developer/Designer/QA): Can view assigned tasks, log time, view their own performance/points, and access the Knowledge Base. cannot see other people's salaries or client contract values.
Client (Guest): Restricted access via the Client Portal. Can only see their project status, invoices, and support tickets.
HR/Accountant: Access to Attendance, Leaves, Invoices, and Expenses only.

6. Module Breakdown
Module A: CRM & Sales (The Revenue Engine)
Manage leads before they become projects.
Lead Pipeline: A Kanban board (New $\rightarrow$ Contacted $\rightarrow$ Negotiation $\rightarrow$ Won/Lost).
Lead Capture: ability to manually add leads or import via CSV.
Follow-up Scheduler: Set reminders (e.g., "Call Client X on Tuesday"). System sends an email/notification to the Sales Rep.
Proposal Generator: Create PDF proposals from templates.
Contract Management:
Create contracts with Start/End dates.
Types: Fixed Price (One-time), Hourly, or Retainer (AMC).
Digital Sign-off: Mark contract as "Signed" to trigger Project creation.
Module B: Project Management (The Production Floor)
Where the work happens. Tailored for Android/iOS/Web development.
Project Dashboard: Shows Project Health (Budget vs. Actual Cost), Deadline countdown, and Completion %.
Milestones: Break projects into phases (e.g., "Phase 1: UI Design", "Phase 2: API Integration").
Link: Completing a Milestone can auto-generate an Invoice.
Task Management:

* **Flexible Assignment**: Assign tasks to any employee. Projects can be divided into multiple tasks and assigned to multiple employees.
* **Independent Tasks**: Tasks can be linked to a project or remain "Individual" for general work.
* **Timing & Checkpoints**: Every task has a **Start Date**, **End Date (Due Date)**, and an optional **Checkpoint Date**.
* **Automated Monitoring**: If progress is insufficient at the checkpoint:
  * Automatically send an in-app notification to the employee.
  * Optionally reassign the task to a backup assignee.
Credential Vault (Secrets): A secure, encrypted area within each project to store server passwords, API keys, and App Store credentials.
Asset Library: A dedicated folder for uploading Design files (Figma/PSD), Logos, and Requirement Docs.
Module C: Time Tracking & Productivity
The Timer: A "Start/Stop" button on every task.
Manual Entry: For times when users forget to start the timer.
Screenshot Monitoring (Optional): Option to take random screenshots of the employee's screen while the timer is running (for remote staff).
Timesheet Approval: PMs must approve logged hours before they count towards the project cost.
Module D: HRM (Human Resources)
Attendance System:
Web-based Clock-in/Clock-out.
Geo-fencing (Optional: Ensure they are in the office or a specific location).
Leave Management:
Employee requests leave $\rightarrow$ Manager approves/rejects.
Logic: If approved, the Project System blocks task assignment for those dates.
Directory: Employee profiles with skills (e.g., "React Native Expert"), phone numbers, and emergency contacts.
Module E: Finance (The Bank)
Invoicing:
Auto-generate based on Milestones or Hours worked.
Recurring Invoices for AMC (Maintenance) clients.
Status tracking: Sent $\rightarrow$ Viewed $\rightarrow$ Paid $\rightarrow$ Overdue.
Expense Tracking:
Log company costs (Server bills, Rent, Software Licenses).
Log Project-specific costs (e.g., "Paid $50 for a stock image for Client X").
Profit & Loss (P&L):
Project P&L: (Contract Value) - (Employee Hours $\times$ Hourly Rate + Expenses).
Company P&L: Total Income - Total Expenses.
Module F: Support & Ticketing (After-Sales)
Ticket System: Clients or Internal Staff can raise "Issues" or "Bugs."
Link to Project: Every ticket is linked to a Project/Contract to check if the support is billable or free.
SLA Tracking: Timer counts down based on priority (e.g., "Critical bugs must be fixed in 4 hours").
Module G: Knowledge Base (The Brain)
Wiki: Internal documentation (e.g., "Server Setup Guide," "Coding Standards").
Code Snippets: A library of reusable code blocks to speed up future development.

1. The Gamification System (The "Points" Engine)
This motivates employees by turning work into a game.
The Rules of the Game:
Action
Points
Logic/Condition
Task Completed
+10 pts
When status changes to "Done".
Speed Bonus
+5 pts
If completed > 24 hours before the deadline.
Quality Bonus
+15 pts
If the task passes QA/Review without being sent back for changes.
Bug Smasher
+20 pts
Fixing a ticket marked "Critical Priority".
Consistency
+2 pts
Logging full 8 hours of work in a day.
Knowledge Contributor
+10 pts
Writing a Wiki article that gets approved.
Late Delivery
-10 pts
If task is completed after the deadline.
Rejection Penalty
-5 pts
If QA rejects the task and sends it back to "In Progress".
Tardiness
-2 pts
Clocking in late.

The Rewards:
The Leaderboard: A monthly ranking on the dashboard (e.g., "Employee of the Month").
Badges: Visual icons on their profile.
Bug Hunter: Fixed 50+ bugs.
Speed Demon: Finished 10 tasks early in a week.
Reliable Rock: 100% attendance for 3 months.
Level Up: Employees start at "Level 1" and gain levels as they accumulate total lifetime points.

1. The "Client Portal" (External View)
What your customers see when they log in.
Dashboard: A summary showing "Project is 60% Complete."
My Invoices: View PDF, Print, or Pay (if integrated with Stripe/PayPal).
Support: A simple form to "Report a Bug" which goes directly to your Ticketing module.
Approvals: A section where they can approve Designs or UAT (User Acceptance Testing) so the project can move forward.

2. Internal Communication
Contextual Chat: A chat box inside every Task and Project.
Example: Instead of WhatsApping "Check the header," the dev comments "Check the header" directly on the "Header Task."
Mentions: Use @Name to notify specific people.
Notifications: In-app bell icon and Email summary for missed updates.

3. Reporting & Analytics (For the Boss)
Resource Utilization: Who is overworked? Who has no tasks?
Project Profitability Report: Which projects made money, which lost money.
Attendance Report: Monthly PDF of who was late/absent.
Work/Task Matrix: A breakdown of where time is going (e.g., "We spent 40% of our time on Bug Fixing this month").

## 7. Security, Roles & RBAC

The system implements strict **Role-Based Access Control (RBAC)** enforced at both the UI and Database levels (via Supabase Row Level Security).

* **Admin**: Total system access. Oversees all financials and cross-module analytics.
* **Project Manager (PM)**: Full project and task management control. Can view project budgets but not company-wide financials.
* **Employee**: Focus on task execution, time logging, and personal performance stats. Restricted from sensitive client or financial data.
* **Client**: Restricted view to their specific projects, invoices, and support tickets via the Client Portal.

---

## 8. Implementation Status & Roadmap

| Module | Feature | Status |
| :--- | :--- | :--- |
| **Auth** | Login/Register & Profile | ✅ Implemented |
| **CRM** | Leads & Pipelines | ✅ Implemented |
| **PM** | Projects & Tasks | ✅ Implemented |
| **Checkpoints** | Auto-transfer Logic | 🔄 Partially (DB logic ready, UI in progress) |
| **HRM** | Employee & Attendance | ✅ Implemented |
| **Gamification** | Points & Leaderboard | ✅ Implemented |
| **Finance** | Invoices & Expenses | ✅ Implemented |
| **Wiki** | Knowledge Base | ✅ Implemented |
| **Social** | Task Comments/Chat | 🔄 Planned |
| **Client Portal** | Guest Dashboard | 🔄 Planned |

---

1. The Assignment Interface
The "Create Task" popup will have these additional fields:
Final Deadline: (Standard date/time for completion).
Checkpoint Date: (The intermediate review date).
Minimum Progress % Required: (The target required by the Checkpoint Date).
Backup Assignee (Optional): (Who gets the task if the primary employee fails).
Example Scenario:
Task: Build Login API.
Final Deadline: Friday, 5:00 PM.
Checkpoint Date: Wednesday, 12:00 PM.
Min Progress Required: 50%.
Primary Dev: John.
Backup Dev: Sarah.

2. The Logic Engine (How the System Reacts)
The system runs a check at the exact Checkpoint Date & Time.
Condition:
If (Current_Progress < Min_Progress_Required) at (Checkpoint_Date)
Action A (Auto-Transfer Mode):
Unassign: The task is removed from the Primary Employee (John).
Reassign: The task is automatically assigned to the Backup Assignee (Sarah) or moved to the "Unassigned" pool.
Notification:
To John: "Task Revoked: You failed to meet the 50% progress requirement."
To Manager: "Alert: Task 'Login API' transferred to Sarah due to performance lag."
Action B (Warning Mode - Alternative):
Instead of instant transfer, the system flags the task as "At Risk" (Red Alert) on the Manager's dashboard so they can decide whether to transfer it manually. For your strict requirement, we will use Action A.

3. Impact on Gamification (Points)
This feature connects directly to your points system.
The Penalty: If a task is revoked due to a Checkpoint failure.
Points: -20 Points (Severe penalty for wasting time).
The "Save" Bonus: If the Backup Employee takes over and finishes it by the original deadline.
Points: +15 Points (Bonus for "Saving the day").

Revised Task Data Structure
In the "Project Structure" I gave you earlier, the Tasks module now needs these specific additions:
New Fields in Task Object:
checkpoint_date: DateTime
min_progress_required: Integer (0-100)
backup_assignee_id: User_ID (Nullable)
auto_transfer_enabled: Boolean (True/False)

Summary of the Workflow
Manager assigns task $\rightarrow$ Sets Checkpoint (Wednesday) + Min Progress (50%).
Employee works and logs progress updates (e.g., "Updated to 30%").
Wednesday comes:
Scenario A: Employee is at 60%. Result: Safe. Continue working.
Scenario B: Employee is at 30%. Result: System locks the task for the employee. Moves it to the Backup. Deducts points.

1. The Logic Flow (Step-by-Step)
Here is how the system handles a task with a Checkpoint:
Phase 1: The "Pre-Emptive" Nudge (Option B element)
Trigger: 2 Hours before the Checkpoint time.
Condition: Is Current_Progress < Min_Progress_Required?
System Action:
Sends a yellow alert to the Employee: "⚠️ Warning: You are at 30%. You need to reach 50% by 2:00 PM (in 2 hours) or this task will be revoked."
Purpose: Gives the employee a final chance to update their status or speed up.
Phase 2: The Checkpoint Execution (The Merge)
Trigger: The exact Checkpoint Time arrives.
Condition: Is Current_Progress < Min_Progress_Required?
System Action (If Failed):
Immediate Transfer (Option A): The task is unassigned from the Primary Employee and assigned to the Backup Employee.
Critical Alert (Option B): The Manager receives a "Red Alert" notification: "Task 'Login API' failed checkpoint. Auto-transferred from John to Sarah."
Task Flagging: The task is marked with a special tag FAILED_CHECKPOINT in the database so it stands out in reports.

2. User Interface Updates
For the Manager (Assigning the Task):
When creating a task, they will see a "Risk Management" section:
[x] Enable Checkpoint
Checkpoint Date/Time: [ Wed, 12:00 PM ]
Minimum Progress: [ 50% ]
If Failed: [ Auto-Transfer to Backup ] (Default)
Backup Assignee: [ Select Employee... ]
For the Employee (The Dashboard):
Tasks with checkpoints will have a Live Progress Bar with a visual marker showing the target.
Visual: A red line on the progress bar at 50% marks the "Safety Zone."

3. Database Impact (Schema Updates)
To support this "Merged" option, we need to add a few status flags to the Tasks Table:
Field Name
Type
Purpose
checkpoint_status
Enum
PENDING, PASSED, FAILED_TRANSFERRED
warning_sent
Boolean
To ensure we don't send the "2-hour warning" multiple times.
original_assignee_id
User_ID
Keeps a record of who lost the task (for the penalty system).
transfer_reason
String
Auto-filled with: "Missed 50% target at Checkpoint".

4. The Gamification Impact (Points Adjustment)
Since we merged the options, the point system needs to be fair but strict:
The "Near Miss" (Warning Phase):
If the employee receives the 2-hour warning but manages to reach the target on time: 0 Points deducted. (They saved themselves).
The "Failure" (Transfer Phase):
If the task is auto-transferred: -20 Points.
The "Rescue" (Backup Employee):
If the Backup employee accepts the transfer and finishes the job: +15 Points (Rescue Bonus).

---
