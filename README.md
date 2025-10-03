# Sanskrithi School of Engineering - Payments Portal

## About

This is the official payments portal for Sanskrithi School of Engineering, providing a comprehensive platform for managing student fees, fines, library dues, cultural event charges, and industrial visit payments.

## Features

- **Student Portal**: View and pay pending dues, track payment history
- **Admin Dashboard**: Manage student payments, generate reports, track dues
- **Multiple Payment Categories**: Library fines, cultural events, industrial visits, complaints
- **Secure Authentication**: Role-based access for students and administrators
- **Session Management**: Auto-logout, session tracking, device management
- **Mobile App Support**: Native iOS and Android apps using Capacitor
- **Payment Integration**: Razorpay payment gateway integration

## Development Setup

### Prerequisites
- Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Getting Started

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to the project directory
cd <YOUR_PROJECT_NAME>

# Install dependencies
npm i

# Start the development server
npm run dev
```

## Technology Stack

- **Frontend**: React, TypeScript, Vite
- **UI Components**: shadcn-ui, Tailwind CSS
- **Backend**: Supabase (Database, Authentication, Storage, Edge Functions)
- **Payment Gateway**: Razorpay
- **Mobile**: Capacitor for iOS/Android
- **State Management**: TanStack Query
- **Form Handling**: React Hook Form with Zod validation

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components and routes
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and configurations
├── services/        # API and service integrations
└── integrations/    # Third-party integrations (Supabase)
```

## Contact

Sanskrithi School of Engineering  
Puttaparthi, Andhra Pradesh 515134  
Phone: +91 8555-287700  
Email: principal@sse.edu.in
