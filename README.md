# B2B Vegetable Ordering Platform

A web application for B2B vegetable ordering with multilingual support (English, Vietnamese, Turkish) using Next.js and Supabase.

## Features

- User authentication with role-based access (Admin, Customer, Driver)
  - Secure login/registration with Supabase Auth
  - Google OAuth integration
  - Password reset functionality
  - User profile management with multiple delivery addresses
  - Protected routes middleware
- Dashboard with role-specific views and data visualization
- Product management with multilingual support
- Order management with status tracking
- Multiple delivery address support with default address selection
- Driver delivery management
- User management with role assignment
- Mobile-first responsive design
- Privacy Policy and Terms of Service pages

## Tech Stack

- **Frontend**: Next.js 13+ (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Authentication**: Supabase Auth with OAuth support
- **Storage**: Supabase Storage
- **State Management**: React Context API
- **Charts**: Chart.js with React-Chartjs-2
- **Deployment**: Vercel (recommended)

## Project Structure

```
src/
├── app/                   # Next.js App Router pages
│   ├── dashboard/         # Admin dashboard pages
│   ├── driver/            # Driver interface
│   ├── store/             # Customer-facing store
│   ├── profile/           # User profile management
│   ├── login/             # Authentication pages
│   ├── register/          # User registration
│   ├── terms/             # Terms of Service
│   ├── privacy/           # Privacy Policy
│   └── ...
├── components/            # Shared components
│   ├── Header.tsx         # Site header
│   ├── OrderDetailModal.tsx # Order details component
│   └── ...
├── lib/                   # Core functionality
│   ├── api.ts             # API request handlers
│   ├── auth.ts            # Authentication functions
│   ├── product-api.ts     # Product management
│   ├── order-api.ts       # Order processing
│   ├── customer-api.ts    # Customer data handling
│   ├── dashboard-api.ts   # Dashboard analytics
│   ├── supabase.ts        # Supabase client setup
│   └── ...
├── contexts/              # React context providers
├── hooks/                 # Custom React hooks
└── styles/                # Global styles
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm/yarn
- Supabase account and project

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/b2b-vegestable.git
   cd b2b-vegestable
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   ```

3. Create a `.env.local` file in the root directory based on the example:
   ```bash
   cp src/lib/env.example .env.local
   ```

4. Update the Supabase credentials in `.env.local` with your own project details:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

5. Set up Google OAuth (optional):
   - Create a Google OAuth client in Google Cloud Console
   - Add the credentials to your Supabase Auth settings
   - Configure the redirect URL in Supabase dashboard

6. Run the database setup script:
   ```bash
   npx ts-node src/scripts/setup-db.ts
   ```

7. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   ```

8. Open [http://localhost:3000](http://localhost:3000) in your browser.

## User Guide

### Authentication

- **Register**: New users can register as customers
- **Login**: Users can login with email/password or Google account
- **Password Reset**: Available through the forgot password flow

### Customer Flow

1. **Browse Products**: View available products with search and filter options
2. **Add to Cart**: Select products and quantities
3. **Checkout**:
   - Review order details
   - Select delivery address (or choose a different saved address)
   - Add order notes if needed
   - Confirm order
4. **Track Orders**: View order history and status in profile section
5. **Manage Profile**: Update personal information and delivery addresses

### Admin Dashboard

Accessible at `/dashboard` for users with admin role:

1. **Overview**: View sales metrics, order counts, and revenue charts
2. **Products**: Manage product catalog, add/edit/delete products
3. **Orders**: View and manage all orders with filtering and status updates
4. **Users**: Manage user accounts and assign roles
5. **Drivers**: Assign drivers to delivery routes

### Driver Interface

Accessible at `/driver` for users with driver role:

1. **My Deliveries**: View assigned orders for delivery
2. **Update Status**: Mark orders as in-transit, delivered, or issues
3. **Route Planning**: See customer locations for efficient delivery

## Database Structure

The application uses the following database tables:

- **users**: User accounts with roles and profiles
  - Stores user information, addresses, and preferences
- **products**: Product catalog with multilingual names
- **orders**: Customer orders with status tracking
- **order_items**: Items within orders

## API Structure

Core API functionality is organized into domain-specific modules:

- **auth.ts**: Authentication and user profile management
- **product-api.ts**: Product CRUD operations
- **order-api.ts**: Order processing and management
- **customer-api.ts**: Customer-specific operations
- **driver-api.ts**: Driver assignment and delivery management
- **dashboard-api.ts**: Analytics and reporting endpoints

## Deployment

### Deploying to Vercel

1. Push your code to a Git repository.
2. Connect your repository to Vercel.
3. Add the environment variables from `.env.local` to your Vercel project.
4. Deploy the project.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details. # b2b-vegestable
