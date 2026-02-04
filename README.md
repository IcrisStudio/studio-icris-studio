# Studio Internal Management System

A comprehensive management system for Icris Studio built with Next.js, TypeScript, Tailwind CSS, and Convex.

## 🚀 Features Implemented

### Authentication & Authorization
- ✅ Username/Password login system
- ✅ Role-based access control (Super Admin vs Staff)
- ✅ Session management with localStorage
- ✅ Protected routes with automatic redirects

### Dashboard (Admin Only)
- ✅ Financial metrics (Total Income, Expenses, Net Profit, Pending Payments)
- ✅ Task statistics (Total, Completed, In Progress, Pending)
- ✅ Monthly Income vs Expenses bar chart
- ✅ Staff Payment Distribution chart
- ✅ Real-time data visualization with Recharts

### Staff Management (Admin Only)
- ✅ List all active staff members
- ✅ Add new staff with username, password, full name
- ✅ Predefined roles (Content Creator, Digital Marketer, Animator, Video Editor, Cameraman, Model, Web Developer)
- ✅ Custom role option
- ✅ Disable staff accounts
- ✅ View staff status and payment methods

### Task Management (Admin)
- ✅ Create new tasks with project details, client info, budget
- ✅ Set deadlines and received dates
- ✅ Track payment status (Pending, Partial, Paid)
- ✅ Task type selection (Video Production, Photography, Animation, etc.)
- ✅ Assign multiple staff to tasks
- ✅ Set role-specific salary for each staff member
- ✅ Task status tracking (Pending, In Progress, Completed)
- ✅ Mark tasks as completed (automatically adds salaries to pending payments)
- ✅ Reference file support

### Payments (Admin Only)
- ✅ View all pending payments
- ✅ Total payment statistics
- ✅ Process salary payments
- ✅ View staff payment details
- ✅ Bank Transfer payment method display
- ✅ Digital Wallet (Khalti/eSewa) payment method display
- ✅ Upload payment proofs/references
- ✅ Add payment notes and references

### Expenses (Admin Only)
- ✅ Record business expenses
- ✅ Expense type categorization (Staff Salary, Advertising, Tools & Software, Miscellaneous)
- ✅ Summary cards by expense type
- ✅ Expense history with date tracking
- ✅ Payment proof support
- ✅ Total expense tracking

### Salary Dashboard (Staff Only)
- ✅ View personal earnings summary
- ✅ Total earned, total paid, pending payment
- ✅ Task assignment history
- ✅ Completed tasks counter
- ✅ Payment history with status
- ✅ Role-based data restriction (only own data visible)

### Profile Management
- ✅ Upload profile picture
- ✅ Edit profile information
- ✅ Select job role
- ✅ Configure payment method (Bank Transfer or Digital Wallet)
- ✅ Bank details (Bank name, account holder, account number)
- ✅ Wallet details (Khalti/eSewa, registered number)
- ✅ First login required flow for staff

### UI/UX Features
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Sidebar navigation with mobile hamburger menu
- ✅ Clean, modern, professional design
- ✅ Loading states and skeletons
- ✅ Toast notifications for user feedback
- ✅ Form validation
- ✅ Error handling
- ✅ Access denied pages

## 🔐 Default Credentials

**Super Admin Account:**
- Username: `icrisstudio@gmail.com`
- Password: `admin`

**Note:** If the admin account doesn't exist, you'll need to create it through the Convex dashboard or API.

## 📁 Project Structure

```
/home/z/my-project/
├── convex/                    # Convex backend
│   ├── schema.ts             # Database schema
│   ├── auth.ts               # Authentication functions
│   ├── users.ts              # User management
│   ├── tasks.ts              # Task management
│   ├── payments.ts            # Payment processing
│   ├── expenses.ts            # Expense tracking
│   ├── dashboard.ts          # Dashboard metrics
│   ├── files.ts              # File upload functions
│   └── _generated/          # Generated types and API
├── src/
│   ├── app/
│   │   ├── page.tsx          # Home/redirect page
│   │   ├── login/page.tsx     # Login page
│   │   ├── dashboard/        # Admin dashboard
│   │   ├── tasks/            # Task management
│   │   ├── staff/            # Staff management
│   │   ├── payments/          # Payment processing
│   │   ├── expenses/          # Expense tracking
│   │   ├── salary/           # Staff salary dashboard
│   │   ├── profile/          # Profile management
│   ├── components/
│   │   ├── ui/               # shadcn/ui components
│   │   ├── DashboardLayout.tsx
│   │   └── ConvexClientProvider.tsx
│   ├── contexts/
│   │   └── AuthContext.tsx   # Authentication context
│   ├── hooks/
│   │   └── useStorageUrl.ts
│   └── lib/
│       └── convex.ts          # Convex client setup
└── package.json
```

## 🗄️ Database Schema

### Tables
- **users** - User accounts and profiles
- **staff_profiles** - Extended staff information (role, payment methods)
- **tasks** - Project tasks with budgets and deadlines
- **task_assignments** - Links tasks to staff with salaries
- **payments** - Salary payment records
- **expenses** - Business expense tracking

### Relationships
- Users → Staff Profiles (1:1)
- Tasks → Task Assignments (1:N)
- Task Assignments → Users (N:1)
- Payments → Users (N:1)
- Payments → Staff Profiles (N:1)

## 🚀 Getting Started

### 1. View the Application
The application is already running. You can view it in the **Preview Panel** on the right side of this interface.

### 2. Login as Admin
1. Navigate to the application
2. You'll be redirected to the login page
3. Enter the admin credentials:
   - Username: `icrisstudio@gmail.com`
   - Password: `admin`
4. You'll be redirected to the Dashboard

### 3. Add Staff Members
1. Go to the **Staff** page from the sidebar
2. Click **Add Staff**
3. Fill in the staff details:
   - Username/Email
   - Password
   - Full Name
   - Role (select from predefined or enter custom)
4. Click **Add Staff**

### 4. Create Tasks
1. Go to the **Tasks** page
2. Click **Create Task**
3. Fill in the task details:
   - Project Name
   - Client Name
   - Task Type
   - Deadline
   - Total Budget
   - Payment Status
   - Payment Received Amount
4. Click **Create Task**
5. Assign staff to the task by clicking **Assign Staff**

### 5. Process Payments
1. Go to the **Payments** page
2. View pending payments
3. Click **Process** on any pending payment
4. Review staff payment information (bank or wallet details)
5. Enter payment reference/notes
6. Click **Complete Payment**

### 6. Record Expenses
1. Go to the **Expenses** page
2. Click **Record Expense**
3. Fill in the expense details:
   - Expense Type (Staff Salary, Advertising, Tools & Software, Miscellaneous)
   - Amount
   - Description
   - Date
4. Click **Record**

### 7. Staff Access (First Login)
1. Staff logs in with their credentials
2. Redirected to **Profile** page (first login required)
3. Complete profile setup:
   - Upload profile picture
   - Confirm name
   - Select role
   - Choose payment method (Bank or Wallet)
   - Fill in payment details
4. Click **Save Profile**
5. Redirected to **Salary** dashboard

## 🔧 Configuration

### Environment Variables
Already configured in `.env.local`:
```
CONVEX_DEPLOYMENT=tame-mallard-377
NEXT_PUBLIC_CONVEX_URL=https://tame-mallard-377.convex.cloud
CONVEX_DEPLOY_KEY=dev:tame-mallard-377|eyJ2MiI6ImVmOTdkMDg1NjA5NDQ1YjhhNWY5NTc3MzEzZjgwZWI0In0=
```

### TypeScript Configuration
Path aliases configured in `tsconfig.json`:
```json
{
  "paths": {
    "@/*": ["./src/*"],
    "@convex/*": ["./convex/*"]
  }
}
```

## 📊 Convex Backend

The Convex backend is deployed and fully configured with:
- **URL:** https://tame-mallard-377.convex.cloud
- **Tables:** 6 (users, staff_profiles, tasks, task_assignments, payments, expenses)
- **Functions:** 30+ across 7 modules
- **Storage:** Enabled for profile pictures and payment proofs

### Convex Functions

#### Auth Module (`auth.ts`)
- `login` - Authenticate user with username/password
- `createDefaultAdmin` - Create default admin account
- `getCurrentUser` - Get user by ID

#### Users Module (`users.ts`)
- `list` - List all users
- `listActiveStaff` - List active staff
- `create` - Create new user
- `update` - Update user info
- `disable` - Disable user account
- `updateStaffProfile` - Update staff profile
- `getStaffProfile` - Get staff profile

#### Tasks Module (`tasks.ts`)
- `list` - List all tasks
- `getById` - Get task with assignments
- `getStaffTasks` - Get tasks for specific staff
- `create` - Create new task
- `update` - Update task details
- `assignStaff` - Assign staff to task
- `removeAssignment` - Remove staff assignment
- `markCompleted` - Mark task as complete
- `remove` - Delete task

#### Payments Module (`payments.ts`)
- `list` - List all payments
- `getPendingPayments` - Get pending payments
- `getStaffPayments` - Get payments for specific staff
- `processPayment` - Complete payment
- `getStaffSummary` - Get staff payment summary
- `rejectPayment` - Reject payment

#### Expenses Module (`expenses.ts`)
- `list` - List all expenses
- `getByType` - Get expenses by type
- `create` - Record expense
- `update` - Update expense
- `remove` - Delete expense
- `getSummary` - Get expense summary

#### Dashboard Module (`dashboard.ts`)
- `getMetrics` - Get dashboard metrics
- `getMonthlyData` - Get monthly income/expense data
- `getStaffPaymentDistribution` - Get payment by staff

#### Files Module (`files.ts`)
- `generateUploadUrl` - Generate upload URL for files
- `storeFileId` - Store file reference
- `getFileUrl` - Get file URL

## 🎨 Design System

### Colors
- Uses Tailwind CSS color variables
- Primary theme colors (no indigo/blue unless specified)
- Light/Dark mode support

### Components
- Built with shadcn/ui component library
- New York style
- Consistent design patterns
- Responsive out of the box

### Typography
- Geist Sans font family
- Consistent hierarchy
- Accessible sizing

## 🔒 Security Features

- ✅ Password hashing (SHA-256)
- ✅ Role-based access control
- ✅ Data visibility restrictions (staff can only see own data)
- ✅ Session management
- ✅ File access control
- ✅ Protected routes

## 📱 Responsive Breakpoints

- **Mobile:** < 768px (hamburger menu, stacked layouts)
- **Tablet:** 768px - 1024px (adjusted layouts)
- **Desktop:** > 1024px (sidebar navigation, full features)

## 🔄 Data Flow

### Staff Onboarding Flow
```
Login → Profile Setup (first time) → Salary Dashboard
```

### Task Payment Flow
```
Create Task → Assign Staff → Work on Task → Mark Complete → Add to Pending Payments → Process Payment → Staff Sees in History
```

### Admin Workflow
```
Dashboard Overview → Create Task → Assign Staff → Process Payments → Record Expenses → View Reports
```

## 🐛 Troubleshooting

### Login Issues
- Verify admin credentials: `icrisstudio@gmail.com` / `admin`
- If account doesn't exist, check Convex dashboard
- Check network connection to Convex cloud

### Build Errors
- Clear Next.js cache: `rm -rf .next`
- Restart dev server
- Check Convex deployment status

### Import Errors
- Verify `src/convex` symlink exists
- Check tsconfig.json paths
- Run `bunx convex dev` to regenerate types

## 📝 Code Quality

- ✅ All ESLint errors resolved
- ✅ React hooks rules compliance
- ✅ TypeScript strict mode enabled
- ✅ Proper component structure
- ✅ Error handling throughout
- ✅ Loading states for all async operations

## 🎯 Next Steps (Optional Enhancements)

1. **Email Notifications** - Add email alerts for new tasks, payments
2. **File Previews** - Show previews of uploaded files
3. **Advanced Reports** - PDF export, date range filtering
4. **Chat System** - Internal team communication
5. **Project Timeline** - Gantt chart for projects
6. **Budget Tracking** - Project vs actual cost tracking
7. **Multi-currency** - Support for multiple currencies
8. **Audit Logs** - Track all system changes

---

**Built with ❤️ using Next.js 16, TypeScript, Tailwind CSS, and Convex**
