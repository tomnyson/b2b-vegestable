# Invoice Management Feature

This feature adds comprehensive invoice management capabilities to the B2B vegetable platform, allowing admins to upload PDF invoices for customers and customers to view and download their invoices.

## Features

### For Admins
- **Upload PDF Invoices**: Upload PDF files and associate them with specific customers
- **Customer Selection**: Select from a dropdown of all customers when uploading invoices
- **Invoice Status Management**: Set invoice status (pending, paid, cancelled)
- **Add Notes**: Include additional notes with each invoice
- **View All Invoices**: See a comprehensive list of all uploaded invoices
- **Download Invoices**: Download any uploaded invoice PDF

### For Customers
- **View Personal Invoices**: See only their own invoices in their profile
- **Download Invoices**: Download their invoice PDFs directly
- **Status Tracking**: See the current status of each invoice
- **Notes Viewing**: Read any notes added by the admin

## Database Schema

The feature uses the following database structure:

```sql
-- Invoices table
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## File Structure

### New Files Created

```
src/
├── app/[locale]/dashboard/invoices/
│   └── page.tsx                    # Admin invoice management page
├── app/[locale]/profile/
│   └── InvoicesTab.tsx             # Customer invoice view component
├── lib/
│   └── supabase.ts                 # Supabase client configuration
├── messages/en/
│   └── invoices.json               # English translations for invoices
├── messages/en/
│   └── profile.json                # Updated profile translations
└── supabase/migrations/
    ├── 20240320000000_create_invoices.sql      # Creates invoices table
    └── 20240320000001_create_invoice_storage.sql # Creates storage bucket
```

### Modified Files
- `src/app/[locale]/profile/page.tsx` - Added invoices tab integration

## Setup Instructions

### 1. Environment Variables

Ensure you have the following environment variables in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Database Migration

Apply the database migrations to create the invoices table and storage policies:

```bash
# Make the script executable
chmod +x scripts/migrate.sh

# Run the migrations
./scripts/migrate.sh
```

Or manually apply the migrations using Supabase CLI:

```bash
supabase db reset
```

### 3. Storage Bucket

The migration automatically creates a private storage bucket named "invoices" for storing PDF files.

## Security Features

### Row Level Security (RLS)
- Users can only view their own invoices
- Admins can view and manage all invoices
- Proper authentication required for all operations

### Storage Policies
- Private bucket ensures PDFs are not publicly accessible
- Users can only download their own invoice files
- Admins have full access to all invoice files

## Usage

### Admin Usage

1. Navigate to `/dashboard/invoices`
2. Click "Upload Invoice" button
3. Select a customer from the dropdown
4. Upload a PDF file (max 10MB)
5. Add notes (optional)
6. Set invoice status
7. Click "Upload" to save

### Customer Usage

1. Go to profile page `/profile`
2. Click on the "Invoices" tab
3. View list of personal invoices
4. Click download button to get PDF files

## API Endpoints

The feature uses Supabase's built-in APIs:

- **Database Operations**: `supabase.from('invoices')`
- **File Upload**: `supabase.storage.from('invoices').upload()`
- **File Download**: `supabase.storage.from('invoices').download()`

## UI/UX Features

### Consistent Design
- Matches existing application design system
- Glassmorphism effects and gradients
- Responsive design for all screen sizes
- Beautiful loading states and animations

### User Experience
- Toast notifications for success/error feedback
- Progress indicators during file uploads
- Intuitive form validation
- Accessible design with proper ARIA labels

## Error Handling

- File type validation (PDF only)
- File size limits (10MB max)
- Network error handling
- User-friendly error messages
- Graceful fallbacks for missing data

## Performance Considerations

- Lazy loading of invoice data
- Efficient database queries with proper indexing
- Optimized file upload/download processes
- Minimal bundle size impact

## Internationalization

The feature is fully internationalized with support for:
- English translations included
- Extensible for additional languages
- Consistent with existing i18n patterns

## Future Enhancements

Possible future improvements:
- Bulk invoice upload
- Invoice templates
- Email notifications when invoices are uploaded
- Advanced filtering and search
- Invoice analytics and reporting
- Integration with accounting systems

## Troubleshooting

### Common Issues

1. **File Upload Fails**
   - Check file size (must be under 10MB)
   - Ensure file is PDF format
   - Verify Supabase storage permissions

2. **Customer Dropdown Empty**
   - Ensure users table has customers with role='customer'
   - Check database permissions

3. **Download Fails**
   - Verify file exists in storage
   - Check user permissions
   - Ensure proper authentication

### Support

For issues related to this feature, check:
1. Browser console for JavaScript errors
2. Supabase dashboard for database/storage issues
3. Network tab for API call problems

## Contributing

When contributing to this feature:
1. Follow existing code patterns
2. Add proper TypeScript types
3. Include error handling
4. Update translations as needed
5. Test with different user roles
6. Ensure responsive design works

## Dependencies

This feature relies on:
- `@supabase/supabase-js` - Database and storage operations
- `react-toastify` - Toast notifications
- `next-intl` - Internationalization
- Existing authentication system
- Existing user management system 