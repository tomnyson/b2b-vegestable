'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { createUser, CreateUserData } from '../../../lib/users-api';
import { supabase } from '../../../lib/supabase';
import { toast } from 'react-toastify';

interface ImportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

interface CSVRow {
  name: string;
  email: string;
  role?: string;
  created_at?: string;
  is_active?: string | boolean;
  address?: string;
  phone_number?: string;
  notes?: string;
  city?: string;
  zip_code?: string;

}

interface ImportResult {
  success: number;
  errors: Array<{ row: number; error: string; data: any }>;
}

export default function ImportUserModal({ isOpen, onClose, onImportComplete }: ImportUserModalProps) {
  const t = useTranslations('users');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Sample CSV template
  const sampleCSV = `name,email,role,phone_number,address,notes
John Doe,john@example.com,customer,+1234567890,123 Main St,Regular customer with login
Jane Smith,,admin,+1234567891,456 Oak Ave,Admin user without login
Bob Wilson,bob@example.com,driver,+1234567892,789 Pine Rd,Delivery driver with login
Alice Johnson,,customer,+1234567893,321 Elm St,Customer without login`;

  const downloadSampleCSV = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'user_import_template.csv';
    link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      parseCSVPreview(selectedFile);
    }
  };

  const parseCSVPreview = (file: File) => {
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as CSVRow[];
        setPreviewData(data.slice(0, 5)); // Show first 5 rows for preview
        setShowPreview(true);
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
      }
    });
  };

  const validateCSVRow = (row: CSVRow, index: number): string | null => {
    // Required fields validation
    if (!row.name || !row.name.trim()) {
      return `Row ${index + 1}: Name is required`;
    }
    
    // Email is now optional - if provided, validate format
    if (row.email && row.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(row.email.trim())) {
        return `Row ${index + 1}: Invalid email format`;
      }
    }

    // Role validation (if provided)
    if (row.role && !['admin', 'customer', 'driver'].includes(row.role.toLowerCase())) {
      return `Row ${index + 1}: Invalid role. Must be admin, customer, or driver`;
    }

    return null;
  };

  const generateRandomPassword = (): string => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
    let password = '';
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const createUserWithoutAuth = async (userData: Omit<CreateUserData, 'password'> & { address?: string }): Promise<any> => {
    // Create user directly in database without auth account
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: crypto.randomUUID(), // Generate random UUID for users without auth
        name: userData.name,
        email: userData.email || null,
        phone: userData.phone,
        city: userData.city,
        zip_code: userData.zip_code,
        notes: userData.notes,
        role: userData.role || 'customer',
        status: userData.status || 'active',
        address: userData.address || null,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  };

  const batchCreateUsers = async (usersData: (CreateUserData & { password?: string; hasEmail: boolean; address?: string })[]): Promise<{ success: any[]; errors: Array<{ index: number; error: string; data: any }> }> => {
    const result = { 
      success: [] as any[], 
      errors: [] as Array<{ index: number; error: string; data: any }> 
    };
    
    // Process users one by one to avoid overwhelming the auth system
    for (let i = 0; i < usersData.length; i++) {
      try {
        const userData = usersData[i];
        let createdUser;
        
        if (userData.hasEmail && userData.password) {
          // Create user with auth account (need to handle address separately since it's not in CreateUserData)
          const { address, hasEmail, ...userDataForAuth } = userData;
          createdUser = await createUser(userDataForAuth as CreateUserData & { password: string });
          
          // Update with address if provided
          if (address) {
            await supabase
              .from('users')
              .update({ address })
              .eq('id', createdUser.id);
          }
        } else {
          // Create user without auth account
          const { hasEmail, password, ...userDataWithoutAuth } = userData;
          createdUser = await createUserWithoutAuth(userDataWithoutAuth);
        }
        
        result.success.push(createdUser);
      } catch (error: any) {
        result.errors.push({ 
          index: i, 
          error: error.message || 'User creation failed', 
          data: usersData[i] 
        });
      }
    }
    
    return result;
  };

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsImporting(true);
    setImportResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as CSVRow[];
        const importResult: ImportResult = { success: 0, errors: [] };
        const validUsersData: (CreateUserData & { password?: string; hasEmail: boolean; address?: string })[] = [];

        // First pass: validate all rows and collect valid users
        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          
          // Validate row
          const validationError = validateCSVRow(row, i);
          if (validationError) {
            importResult.errors.push({ row: i + 1, error: validationError, data: row });
            continue;
          }

          try {
            const hasEmail = !!(row.email && row.email.trim());
            
            // Convert CSV row to CreateUserData
            const userData: CreateUserData & { password?: string; hasEmail: boolean; address?: string } = {
              name: row.name.trim(),
              email: hasEmail ? row.email.trim().toLowerCase() : '',
              phone: row.phone_number?.trim() || '',
              role: (row.role?.toLowerCase() as 'admin' | 'customer' | 'driver') || 'customer',
              status: row.is_active === undefined ? 'active' : 
                     typeof row.is_active === 'string' ? 
                     (row.is_active.toLowerCase() === 'true' ? 'active' : 'inactive') : 
                     (row.is_active ? 'active' : 'inactive'),
              hasEmail,
              address: row.address?.trim() || undefined,
              password: hasEmail ? generateRandomPassword() : undefined // Only generate password if email exists
            };

            validUsersData.push(userData);
          } catch (error: any) {
            importResult.errors.push({ 
              row: i + 1, 
              error: error.message || 'Data conversion error', 
              data: row 
            });
          }
        }

        // Second pass: batch create all valid users
        if (validUsersData.length > 0) {
          try {
            const batchResult = await batchCreateUsers(validUsersData);
            importResult.success = batchResult.success.length;
            
            // Add any batch creation errors to the import result
            batchResult.errors.forEach(batchError => {
              importResult.errors.push({
                row: batchError.index + 1,
                error: batchError.error,
                data: batchError.data
              });
            });
          } catch (error: any) {
            // If batch creation fails completely, mark all valid users as errors
            validUsersData.forEach((userData, index) => {
              importResult.errors.push({
                row: index + 1,
                error: error.message || 'Batch creation failed',
                data: userData
              });
            });
          }
        }

        setImportResult(importResult);
        setIsImporting(false);

        // Show summary
        if (importResult.success > 0) {
          toast.success(`Successfully imported ${importResult.success} users`);
          onImportComplete(importResult.success);
        }
        
        if (importResult.errors.length > 0) {
          toast.warning(`${importResult.errors.length} users failed to import. Check the error details.`);
        }
      },
      error: (error) => {
        toast.error(`CSV parsing error: ${error.message}`);
        setIsImporting(false);
      }
    });
  };

  const handleClose = () => {
    setFile(null);
    setPreviewData([]);
    setShowPreview(false);
    setImportResult(null);
    onClose();
  };
console.log(previewData);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">👥 Import Users from CSV</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📋 Import Instructions</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• CSV file must include headers: <strong>name</strong></li>
              <li>• Optional fields: email, role, phone_number, address, notes, is_active</li>
              <li>• Users with email will get login accounts with random passwords</li>
              <li>• Users without email will be created as records only (no login)</li>
              <li>• Role defaults to 'customer' if not provided (admin, customer, driver)</li>
              <li>• Status defaults to 'active' if not provided</li>
              <li>• Email addresses must be unique and valid when provided</li>
            </ul>
            <button
              onClick={downloadSampleCSV}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
            >
              📥 Download Sample CSV Template
            </button>
          </div>

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select CSV File
            </label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100"
            />
          </div>

          {/* Preview */}
          {showPreview && previewData.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">👀 Preview (First 5 rows)</h3>
              <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Name</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Email</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Phone</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Address</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">City</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Zip Code</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Notes</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Login Access</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.email || '-'}</td>
                        <td className="px-3 py-2">{row.role || 'customer'}</td>
                        <td className="px-3 py-2">{row.phone_number || '-'}</td>
                        <td className="px-3 py-2">{row.address || '-'}</td>
                        <td className="px-3 py-2">{row.city || '-'}</td>
                        <td className="px-3 py-2">{row.zip_code || '-'}</td>
                        <td className="px-3 py-2">{row.notes || '-'}</td>
                        <td className="px-3 py-2">
                          {row.email && row.email.trim() ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Yes</span>
                          ) : (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Import Results */}
          {importResult && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">📊 Import Results</h3>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-green-800 font-semibold">✅ Successful</div>
                  <div className="text-2xl font-bold text-green-900">{importResult.success}</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="text-red-800 font-semibold">❌ Failed</div>
                  <div className="text-2xl font-bold text-red-900">{importResult.errors.length}</div>
                </div>
              </div>

              {/* Error Details */}
              {importResult.errors.length > 0 && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Error Details:</h4>
                  <div className="max-h-40 overflow-y-auto border border-red-200 rounded-lg">
                    {importResult.errors.map((error, index) => (
                      <div key={index} className="p-3 border-b border-red-100 last:border-b-0">
                        <div className="text-sm text-red-800">
                          <strong>Row {error.row}:</strong> {error.error}
                        </div>
                        <div className="text-xs text-red-600 mt-1">
                          Data: {JSON.stringify(error.data)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || isImporting}
            className={`px-4 py-2 rounded-lg text-white transition-colors ${
              !file || isImporting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            {isImporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white inline" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Importing...
              </>
            ) : (
              '👥 Import Users'
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 