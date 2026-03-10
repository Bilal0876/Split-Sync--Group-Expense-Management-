# SplitSync - Group Expense Management

A modern, full-stack expense tracking application designed for teams and friend groups. Split expenses, track balances, and settle debts with ease using a clean, intuitive interface.

## Features

- **Dashboard Overview**: Real-time stats on your net balance, active groups, and recent activity.
- **Group Management**: Create groups, manage members, and view consolidated group expenses.
- **Expense Tracking**: Add expenses with automated equal split calculations.
- **Settlement System**: View "who owes whom" and mark debts as settled with a single click.
- **Real-time Statistics**: Live calculations of net balances across all your shared groups.
- **Secure Auth**: JWT-based authentication for secure user registration and login.
- **Responsive Design**: Premium UI built with Plus Jakarta Sans and a custom design system.

## Tech Stack

### Frontend
- **react (Vite)**: For a fast, modern component-based UI.
- **TypeScript**: Ensuring type safety across the entire application.
- **Tailwind CSS**: Utility-first styling for a sleek, responsive design.
- **Axios**: Efficient API communication with interceptors for auth handling.

### Backend
- **Node.js & Express**: Scalable server architecture.
- **Prisma ORM**: Modern database toolkit (PostgreSQL) for type-safe database access and migrations.
- **PostgreSQL**: Robust relational database for reliable data storage.
- **JWT**: Secure token-based authentication.

## Architecture

The project follows a clean **MVC (Model-View-Controller)** pattern on the backend to separate concerns:

- **Models**: Defines the data structure and direct database interactions (leveraging Prisma).
- **Controllers**: Handles the business logic and orchestrates data flow between models and views.
- **Routes**: Defines the API endpoints and maps them to appropriate controllers.
- **Services (Frontend)**: Abstraction layer for API calls, keeping components clean and focused on UI logic.

## Getting Started

### Prerequisites
- Node.js (v18+)
- PostgreSQL instance

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Bilal0876/Split-Sync--Group-Expense-Management-.git
   cd Split-Sync
   ```

2. **Install dependencies**
   ```bash
   # Install server dependencies
   cd server
   npm install

   # Install client dependencies
   cd ../Client
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the `server` directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/split_sync"
   JWT_SECRET="your_secret_key"
   PORT=5000
   ```

4. **Iterate with Prisma**
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   ```

5. **Run the application**
   ```bash
   # From the root directory
   npm run dev
   ```

