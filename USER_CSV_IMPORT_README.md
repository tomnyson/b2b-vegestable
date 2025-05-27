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