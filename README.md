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

# Product CSV Import Feature

## Overview
The B2B Vegetable Management system now supports importing products from CSV files. This feature allows administrators to bulk upload product information instead of adding products one by one.

## How to Use

1. **Navigate to Products Page**: Go to the dashboard and click on "Products" in the sidebar
2. **Click Import CSV Button**: In the products page header, click the blue "📤 Import CSV" button
3. **Download Template** (Optional): Click "📥 Download Sample CSV Template" to get a properly formatted template
4. **Select CSV File**: Click "Select CSV File" and choose your CSV file
5. **Preview Data**: Review the first 5 rows of your data in the preview table
6. **Import Products**: Click "📤 Import Products" to start the import process
7. **Review Results**: Check the import results showing successful imports and any errors

## CSV Format Requirements

### Required Fields
- `sku`: Stock Keeping Unit - unique identifier (required)
- `name`: Product name (required)

### Optional Fields
- `unit`: Unit of measurement (e.g., kg, piece, box) (defaults to 'piece')
- `price`: Product price as a number (defaults to 0)
- `stock`: Stock quantity as a whole number (defaults to 0)
- `description`: Product description
- `is_active`: Active status (true/false, defaults to true)

### Sample CSV Structure
```csv
sku,name
TOM001,Tomato
CAR001,Carrot
APP001,Apple
LET001,Lettuce
BAN001,Banana
```

## Features

### Data Validation
- Required field validation
- Price and stock number validation
- SKU uniqueness checking
- Data type validation

### Batch Processing
- Efficient batch creation of products
- Processes up to 10 products at a time
- Graceful error handling for individual failures

### Preview & Results
- Preview first 5 rows before importing
- Detailed import results with success/error counts
- Specific error messages for failed imports
- Row-by-row error reporting

### User Experience
- Progress indicator during import
- Download sample template
- Clear instructions and validation rules
- Responsive design for mobile/desktop

## Error Handling

Common errors and solutions:

1. **"SKU is required"**: Ensure `sku` column has unique values
2. **"Product name is required"**: Ensure `name` column has values
3. **"Invalid price value"**: Use numbers only (e.g., 2.50, not $2.50) - optional field
4. **"Invalid stock value"**: Use whole numbers only (e.g., 100, not 100.5) - optional field
5. **"Duplicate SKU"**: Each product must have a unique SKU

## Technical Implementation

### Libraries Used
- **PapaParse**: CSV parsing and validation
- **React**: Component-based UI
- **TypeScript**: Type safety and validation
- **Tailwind CSS**: Styling and responsive design

### API Integration
- Batch import API for efficient database operations
- Real-time validation and error reporting
- Automatic product list refresh after import

### Database
- Supabase PostgreSQL database
- Batch insertion with transaction safety
- Error recovery and rollback capabilities

## Security & Performance

- File size validation
- CSV format validation
- Batch processing to prevent database overload
- Error isolation to prevent full import failures
- Progress tracking for large imports

## Future Enhancements

- Export existing products to CSV
- Image URL import support
- Import history and logging
- Advanced mapping for custom CSV formats 

# Email Notification System

This document describes the email notification system implemented for the B2B Vegetable platform.

## Overview

The email notification system automatically sends emails for key events in the order lifecycle:

1. **Driver Assignment**: When an admin assigns a driver to an order
2. **Order Completion**: When a driver marks an order as completed

## Features

### 🚚 Driver Assignment Notifications
- **Trigger**: Admin assigns a driver to an order
- **Recipient**: Driver
- **Content**: Order details, customer information, special instructions
- **Languages**: English, German, Vietnamese
- **Template**: Professional HTML with company branding

### ✅ Order Completion Notifications
- **Trigger**: Driver marks order as completed
- **Recipients**: Customer and Admin
- **Content**: Delivery confirmation, order summary, completion details
- **Languages**: English, German, Vietnamese
- **Templates**: Separate templates for customer and admin

## Implementation

### Core Files

#### Email API (`src/app/lib/email-api.ts`)
- `sendDriverAssignmentEmail()` - Sends assignment notification to driver
- `sendOrderCompletionEmails()` - Sends completion notifications to customer and admin
- `sendInvoiceEmail()` - Existing invoice functionality

#### Email Route (`src/app/api/send-email/route.ts`)
- Handles different email types: `driver_assignment`, `order_completion_customer`, `order_completion_admin`, `invoice`
- Professional HTML email templates with responsive design
- Company branding and contact information
- **Simplified payload format**: Uses basic email structure with `from`, `to`, `subject`, and `html`

#### Order API Integration (`src/app/lib/order-api.ts`)
- `assignDriverToOrder()` - Enhanced to send driver assignment email
- `updateOrderStatus()` - Enhanced to send completion emails when status is 'completed'

### Email Payload Format

The system uses a simplified email payload format for Supabase Edge Functions:

```json
{
  "from": "support@yourcompany.com",
  "to": "recipient@example.com",
  "subject": "Email Subject",
  "html": "<html>Email content...</html>"
}
```

**From Email Address**: The "from" field is dynamically determined from app settings:
- **Primary**: Uses the Support Email from app settings (`appSettings.supportEmail`)
- **Fallback**: Uses `'info@edukidstaynguyen.com'` if no support email is configured

This format is automatically generated by the API route based on the email type and data provided.

### Email Templates

#### Driver Assignment Email
```html
- Company header with branding
- Greeting with driver name
- Order details (ID, date, status)
- Customer information (name, contact, address)
- Order items table
- Special instructions (if any)
- Call-to-action to log into dashboard
- Company footer with contact info
```

#### Customer Completion Email
```html
- Success header with checkmark
- Personalized greeting
- Delivery confirmation message
- Order details and delivery info
- Items delivered list
- Satisfaction message
- Thank you and contact information
```

#### Admin Completion Email
```html
- Professional header
- Status update notification
- Completion details (driver, date, time)
- Customer and order information
- Order summary with financial details
- Items delivered table
- Automatic notification disclaimer
```

### Translations

Email content is available in multiple languages:

#### English (`src/messages/en/common.json`)
```json
"emails": {
  "driverAssignment": { ... },
  "orderCompletion": {
    "customer": { ... },
    "admin": { ... }
  },
  "common": { ... }
}
```

#### German (`src/messages/de/common.json`)
Professional German translations for all email content.

#### Vietnamese (`src/messages/vi/common.json`)
Native Vietnamese translations for all email content.

## Usage

### Automatic Triggers

The email notifications are automatically triggered by the following actions:

1. **Admin assigns driver to order**:
   ```typescript
   await assignDriverToOrder(orderId, driverId);
   // Automatically sends email to driver
   ```

2. **Driver marks order as completed**:
   ```typescript
   await updateOrderStatus(orderId, 'completed');
   // Automatically sends emails to customer and admin
   ```

### Manual Testing

A test page is available at `/admin/test-emails` for testing email functionality:

- Input order ID, driver ID, and optional admin ID
- Test driver assignment emails
- Test order completion emails
- View success/error messages

### API Usage

#### Send Driver Assignment Email
```typescript
import { sendDriverAssignmentEmail } from '@/app/lib/email-api';

await sendDriverAssignmentEmail(orderId, driverId, adminId);
```

#### Send Order Completion Emails
```typescript
import { sendOrderCompletionEmails } from '@/app/lib/email-api';

await sendOrderCompletionEmails(orderId, driverId);
```

## Configuration

### Environment Variables

Ensure the following environment variables are set:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Supabase Edge Function

The system uses Supabase Edge Functions for email delivery with a simplified payload format:

```javascript
// Expected payload format for the send-email edge function
{
  from: "support@yourcompany.com", // Dynamic: from app settings or fallback
  to: "recipient@example.com", 
  subject: "Email Subject",
  html: "<html>Email content...</html>"
}
```

### App Settings

Email templates use app settings for:
- Company name
- Support email
- Currency formatting
- Contact information

## Error Handling

- Email failures don't prevent order operations
- Errors are logged but don't throw exceptions
- Graceful fallbacks for missing data
- User-friendly error messages in test interface

## Security

- Server-side email sending using Supabase service role
- Input validation and sanitization
- Rate limiting through Supabase Edge Functions
- Secure handling of user data
- **Dynamic sender email**: Uses configured Support Email from app settings with secure fallback

## Monitoring

- Email sending events are logged to `email_logs` table
- Success/failure status tracking
- Order ID and recipient tracking
- Email type classification

## Technical Details

### Email Generation Flow

1. **API Call**: Frontend calls email API function
2. **Data Gathering**: System fetches order, user, and app settings data
3. **Template Generation**: HTML email template is generated based on type
4. **Payload Creation**: Simple payload with from/to/subject/html is created
5. **Supabase Function**: Edge function receives simplified payload
6. **Email Delivery**: Email is sent via configured email service
7. **Logging**: Event is logged to database

### Payload Simplification Benefits

- **Cleaner Interface**: Simple, standard email format
- **Better Compatibility**: Works with any email service
- **Easier Debugging**: Clear, readable payload structure
- **Reduced Complexity**: No custom data structures in edge function
- **Standard Format**: Follows common email API patterns

## Future Enhancements

Potential improvements for the email system:

1. **Email Templates Editor**: Admin interface to customize email templates
2. **Email Preferences**: User settings for email notifications
3. **SMS Notifications**: Alternative notification method
4. **Email Analytics**: Open rates, click tracking
5. **Scheduled Emails**: Reminder emails for pending deliveries
6. **Rich Media**: Product images in email templates
7. **Email Queuing**: Batch processing for high volume
8. **Multiple Senders**: Different sender addresses for different email types

## Troubleshooting

### Common Issues

1. **Emails not sending**:
   - Check Supabase Edge Function deployment
   - Verify environment variables
   - Check email logs table
   - Verify sender email configuration

2. **Missing order data**:
   - Ensure order exists in database
   - Check order items are properly loaded
   - Verify user relationships

3. **Template rendering issues**:
   - Check for missing app settings
   - Verify translation keys exist
   - Test with different locales

### Debug Mode

Use the test page at `/admin/test-emails` to:
- Test email functionality
- Verify template rendering
- Check error messages
- Validate email delivery

### Payload Verification

To verify the email payload format, check the browser network tab or server logs for the exact JSON being sent to the Supabase Edge Function:

```json
{
  "from": "support@yourcompany.com",
  "to": "driver@example.com",
  "subject": "New Delivery Assignment - Order #abc12345",
  "html": "<!DOCTYPE html><html>...</html>"
}
```

**Note**: The "from" email will be your configured Support Email from app settings, or fall back to `'info@edukidstaynguyen.com'` if not configured.

## Support

For issues or questions about the email notification system:

1. Check the test page for immediate debugging
2. Review server logs for detailed error information
3. Verify Supabase Edge Function status
4. Ensure payload format matches expected structure
5. Contact the development team for assistance 

# Invoice Feature Setup Instructions

This guide helps you set up the invoice management feature in your existing Supabase project.

## Prerequisites

1. Access to your Supabase dashboard
2. SQL Editor access in your Supabase project
3. Existing authentication system

## Database Setup

### Step 1: Run the Invoice Table Migration

In your Supabase SQL Editor, run the following SQL to create the invoices table:

```sql
-- Create invoices table
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  path TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint if users table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    ALTER TABLE public.invoices 
    ADD CONSTRAINT invoices_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END
$$;

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for invoices
CREATE POLICY "Users can view their own invoices" ON public.invoices
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all invoices" ON public.invoices
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can insert invoices" ON public.invoices
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can update invoices" ON public.invoices
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can delete invoices" ON public.invoices
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 2: Create Storage Bucket

Run this SQL to create the invoices storage bucket:

```sql
-- Create the invoices bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies
CREATE POLICY "Admin can upload invoices" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admin can view all invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can view their own invoices" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'invoices' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admin can delete invoices" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'invoices' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
```

### Step 3: Verify Users Table (Optional)

If you don't have a `users` table in the `public` schema, you can create one with this SQL:

```sql
-- Create users table in public schema (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users') THEN
    CREATE TABLE public.users (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      phone TEXT,
      address TEXT,
      role TEXT DEFAULT 'customer',
      newsletter_subscribed BOOLEAN DEFAULT false,
      notifications JSONB DEFAULT '{"orderUpdates": true, "promotions": false, "newProducts": false}',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    
    -- Enable RLS
    ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies
    CREATE POLICY "Users can view their own profile" ON public.users
      FOR SELECT USING (auth.uid() = id);

    CREATE POLICY "Users can update their own profile" ON public.users
      FOR UPDATE USING (auth.uid() = id);

    CREATE POLICY "Admin can view all users" ON public.users
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.users 
          WHERE id = auth.uid() AND role = 'admin'
        )
      );
  END IF;
END
$$;
```

## Environment Variables

Make sure your `.env.local` file contains:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Testing

1. Create an admin user by updating a user's role in the `users` table:
   ```sql
   UPDATE public.users SET role = 'admin' WHERE email = 'your-admin@email.com';
   ```

2. Access the invoice page at `/dashboard/invoices` (admin only)

3. Try uploading a PDF invoice

4. Check the customer view at `/profile?tab=invoices`

## Troubleshooting

### Common Issues

1. **Foreign Key Error**: If you get foreign key constraint errors, it means the `users` table doesn't exist or has a different structure. Run the users table creation SQL above.

2. **Permission Denied**: Make sure RLS policies are correctly set up and your user has the proper role.

3. **Storage Upload Fails**: Verify the storage bucket was created and policies are in place.

4. **Download Fails**: Check that the storage policies allow the user to access their files.

### Verify Setup

Run these queries to verify everything is set up correctly:

```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN ('users', 'invoices');

-- Check storage bucket
SELECT * FROM storage.buckets WHERE id = 'invoices';

-- Check policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('users', 'invoices');
```

## Support

If you encounter issues:

1. Check the browser console for JavaScript errors
2. Check the Supabase logs in your dashboard
3. Verify that all SQL statements ran successfully
4. Make sure your user has the correct role assigned

The invoice feature should now be fully functional in your application! 

# PDF Export Feature for Order Summary

## Overview
The B2B Vegetable Management system now supports exporting Order Summary reports to PDF format. This feature allows administrators to generate professional PDF reports for procurement planning, inventory management, and record keeping.

## Features

### 📊 **Order Summary PDF Export**
- **Professional Layout**: Clean, branded PDF with company header and report metadata
- **Comprehensive Data**: Includes all product quantities aggregated from orders
- **Date Range Filtering**: Export data for specific date ranges
- **Summary Statistics**: Total products count and total quantities
- **Automatic Filename**: Generated based on date range (e.g., `order-summary-2024-01-01-to-2024-01-31.pdf`)

### 🖨️ **Print Functionality**
- **Print-Optimized Layout**: Special CSS styles for clean printing
- **Print Header**: Company name and report details visible only when printing
- **Responsive Design**: Works on both desktop and mobile devices

## How to Use

### Accessing the Feature
1. **Login as Admin**: Only administrators can access the Order Summary page
2. **Navigate to Summary**: Go to Dashboard → Summary
3. **Set Date Range**: Use the date filter to select your desired time period
4. **Click Filter**: Apply the date range to load order data

### Exporting to PDF
1. **Verify Data**: Ensure the summary table shows the data you want to export
2. **Click "Export PDF"**: The green button in the top-right corner of the summary section
3. **Download**: PDF will be automatically generated and downloaded to your device

### Printing
1. **Click "Print"**: The gray button next to "Export PDF"
2. **Print Dialog**: Your browser's print dialog will open
3. **Print Settings**: Adjust settings as needed and print

## PDF Content Structure

### Header Section
- **Company Name**: "B2B Vegetable Management System"
- **Report Title**: "Order Summary Report"
- **Date Range**: Selected start and end dates
- **Generation Info**: Timestamp and generated by information

### Summary Statistics
- **Total Products**: Number of unique products in the report
- **Total Quantity Ordered**: Sum of all quantities across all products

### Data Table
| Column | Description |
|--------|-------------|
| # | Sequential row number |
| Product Name | English name of the product |
| SKU | Stock Keeping Unit (or "N/A" if not available) |
| Total Quantity | Aggregated quantity from all orders |
| Unit | Unit of measurement (kg, piece, box, etc.) |

### Footer Section
- **Page Numbers**: "Page X of Y" format
- **Notes**: Explanatory text about the report purpose and usage
- **Guidelines**: Instructions for using the report for procurement

## Technical Implementation

### Libraries Used
- **jsPDF**: Core PDF generation library
- **jsPDF-AutoTable**: Table generation plugin for structured data
- **React**: Component-based UI framework
- **TypeScript**: Type safety and development experience

### File Structure
```
src/
├── app/lib/pdf-utils.ts                    # PDF generation utilities
├── app/[locale]/dashboard/summary/page.tsx # Main summary page with export
└── PDF_EXPORT_README.md                   # This documentation
```

### Key Functions
- `exportOrderSummaryToPDF()`: Main export function
- `exportProductListToPDF()`: Generic product list export (future use)

## Styling and Design

### PDF Styling
- **Colors**: Emerald green theme matching the application
- **Typography**: Helvetica font family for professional appearance
- **Layout**: Responsive table with proper column widths
- **Branding**: Consistent with application design language

### Print Styling
- **CSS Classes**:
  - `.print-area`: Content visible when printing
  - `.no-print`: Content hidden when printing
  - `.print-header`: Header visible only in print mode

## Error Handling

### Validation
- **Empty Data Check**: Prevents export when no data is available
- **Date Range Validation**: Ensures valid date ranges
- **User Feedback**: Toast notifications for success/error states

### Error Messages
- **No Data Warning**: "No data to export. Please adjust your date range."
- **Export Success**: "PDF exported successfully!"
- **Export Error**: "Failed to export PDF. Please try again."

## Browser Compatibility

### Supported Browsers
- ✅ **Chrome**: Full support
- ✅ **Firefox**: Full support
- ✅ **Safari**: Full support
- ✅ **Edge**: Full support

### Mobile Support
- ✅ **iOS Safari**: Full support
- ✅ **Android Chrome**: Full support
- ✅ **Mobile Firefox**: Full support

## File Naming Convention

### PDF Files
- **Format**: `order-summary-{start-date}-to-{end-date}.pdf`
- **Example**: `order-summary-2024-01-01-to-2024-01-31.pdf`
- **Date Format**: YYYY-MM-DD

## Security Considerations

### Access Control
- **Admin Only**: Feature restricted to users with admin role
- **Authentication**: Requires valid login session
- **Route Protection**: Server-side route protection implemented

### Data Privacy
- **No External Services**: PDF generation happens client-side
- **Local Download**: Files saved directly to user's device
- **No Data Transmission**: Sensitive data never leaves the user's browser

## Performance Considerations

### Optimization
- **Client-Side Generation**: No server load for PDF creation
- **Efficient Rendering**: Optimized table rendering for large datasets
- **Memory Management**: Proper cleanup after PDF generation

### Limitations
- **Large Datasets**: Performance may degrade with 1000+ products
- **Browser Memory**: Limited by available browser memory
- **File Size**: PDF size increases with data volume

## Future Enhancements

### Planned Features
- **Custom Branding**: Configurable company logo and colors
- **Multiple Formats**: Excel export support
- **Email Integration**: Direct email sending of reports
- **Scheduled Reports**: Automated report generation
- **Advanced Filtering**: More granular data filtering options

### Potential Improvements
- **Chart Integration**: Visual charts in PDF reports
- **Multi-Language**: Localized PDF content
- **Template System**: Customizable report templates
- **Batch Export**: Multiple date ranges in one operation

## Troubleshooting

### Common Issues

#### PDF Not Downloading
- **Check Browser Settings**: Ensure downloads are allowed
- **Popup Blockers**: Disable popup blockers for the site
- **Browser Console**: Check for JavaScript errors

#### Empty PDF
- **Data Verification**: Ensure summary table has data
- **Date Range**: Check if date range includes orders
- **Browser Compatibility**: Try a different browser

#### Print Issues
- **Print Preview**: Use browser's print preview
- **Page Setup**: Adjust margins and orientation
- **CSS Loading**: Ensure all styles are loaded

### Support
For technical issues or feature requests, contact the development team or create an issue in the project repository.

## Changelog

### Version 1.0.0 (Current)
- ✅ Initial PDF export functionality
- ✅ Print optimization
- ✅ Professional PDF layout
- ✅ Error handling and validation
- ✅ Mobile responsive design
- ✅ Admin access control 


# User CSV Import Feature

## Overview
The B2B Vegetable Management system now supports importing users from CSV files. This feature allows administrators to bulk upload user accounts instead of creating them one by one.

## How to Use

1. **Navigate to Users Page**: Go to the dashboard and click on "Users" in the sidebar
2. **Click Import CSV Button**: In the users page header, click the blue "Import CSV" button
3. **Download Template** (Optional): Click "📥 Download Sample CSV Template" to get a properly formatted template
4. **Select CSV File**: Click "Select CSV File" and choose your CSV file
5. **Preview Data**: Review the first 5 rows of your data in the preview table
6. **Import Users**: Click "👥 Import Users" to start the import process
7. **Review Results**: Check the import results showing successful imports and any errors

## CSV Format Requirements

### Required Fields
- `name`: Full name of the user (required)

### Optional Fields
- `email`: Email address - must be unique and valid when provided (optional)
- `role`: User role (admin, customer, driver) (defaults to 'customer')
- `phone_number`: Phone number
- `address`: Physical address
- `notes`: Additional notes about the user
- `is_active`: Active status (true/false, defaults to true)

### Sample CSV Structure
```csv
name,email,role,phone_number,address,notes
John Doe,john.doe@example.com,customer,+1234567890,123 Main St,Regular customer with login
Jane Smith,,admin,+1234567891,456 Oak Ave,Admin user without login
Bob Wilson,bob.wilson@example.com,driver,+1234567892,789 Pine Rd,Delivery driver with login
Alice Johnson,,customer,+1234567893,321 Elm St,Customer without login
```

## Features

### User Account Types
- **Users with Email**: Get login accounts with automatically generated passwords
- **Users without Email**: Created as records only (no login access)

### Automatic Password Generation
- Random secure passwords are automatically generated for users with email addresses
- Passwords are 10 characters long with mixed case, numbers, and special characters
- Users will need to reset their passwords on first login

### Data Validation
- Required field validation (name only)
- Email format validation (when provided)
- Role validation (must be admin, customer, or driver)
- Email uniqueness checking (when provided)
- Data type validation

### User Creation Process
- **With Email**: Creates users in Supabase Auth system + stores metadata in users table
- **Without Email**: Creates user records directly in users table (no auth account)
- Sequential processing to avoid overwhelming the auth system
- Graceful error handling for individual failures

### Preview & Results
- Preview first 5 rows before importing
- Detailed import results with success/error counts
- Specific error messages for failed imports
- Row-by-row error reporting

### User Experience
- Progress indicator during import
- Download sample template
- Clear instructions and validation rules
- Responsive design for mobile/desktop

## Error Handling

Common errors and solutions:

1. **"Name is required"**: Ensure `name` column has values
2. **"Invalid email format"**: Use valid email format (user@domain.com) when email is provided
3. **"Invalid role"**: Use only admin, customer, or driver (case insensitive)
4. **"Email already exists"**: Each user must have a unique email address when provided
5. **"User creation failed"**: Check Supabase auth configuration and limits

## Technical Implementation

### Libraries Used
- **PapaParse**: CSV parsing and validation
- **React**: Component-based UI
- **TypeScript**: Type safety and validation
- **Tailwind CSS**: Styling and responsive design

### API Integration
- Supabase Auth for user authentication
- Supabase Database for user metadata
- Sequential user creation to prevent rate limiting
- Real-time validation and error reporting

### Database Schema
- Users table with fields: id, name, email, phone, role, status, created_at, assigned_route
- Integration with Supabase Auth system
- Automatic user ID generation and linking

## Security & Performance

- Email validation and sanitization
- Role validation to prevent privilege escalation
- Sequential processing to prevent auth system overload
- Error isolation to prevent full import failures
- Secure password generation
- Progress tracking for large imports

## Password Management

### Generated Passwords
- 10-character random passwords
- Include uppercase, lowercase, numbers, and special characters
- Unique for each user
- Not stored in plain text

### User Onboarding
- Users should be notified of their account creation
- Password reset functionality should be used for first login
- Consider implementing email notifications for new accounts

## Future Enhancements

- Export existing users to CSV
- Email notifications for imported users
- Bulk password reset functionality
- Import history and logging
- Advanced mapping for custom CSV formats
- Profile picture URL import support
- Batch email sending for account notifications

## Troubleshooting

### Import Fails Completely
- Check CSV file format and encoding (UTF-8 recommended)
- Verify required columns are present
- Check Supabase connection and permissions

### Some Users Fail to Import
- Review error details in the import results
- Check for duplicate email addresses
- Verify role values are valid
- Ensure email format is correct

### Performance Issues
- Large imports (>100 users) may take several minutes
- Consider breaking large files into smaller batches
- Monitor Supabase auth rate limits

## Support

For technical support or feature requests related to the user import functionality, please contact the development team with:
- CSV file sample (with sensitive data removed)
- Error messages from import results
- Browser console logs if applicable 