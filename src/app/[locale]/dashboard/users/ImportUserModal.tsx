'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Papa from 'papaparse';
import { 
  CSVRow, 
  ImportResult, 
  importUsersFromCSV,
  generateSampleCSV 
} from '../../../lib/users-api';
import { toast } from 'react-toastify';

interface ImportUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedCount: number) => void;
}

export default function ImportUserModal({ isOpen, onClose, onImportComplete }: ImportUserModalProps) {
  const t = useTranslations('users');
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<CSVRow[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const downloadSampleCSV = () => {
    const sampleCSV = generateSampleCSV();
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
        try {
          const data = results.data as CSVRow[];
          const result = await importUsersFromCSV(data);
          
          setImportResult(result);
          setIsImporting(false);

          // Show summary
          if (result.success > 0) {
            toast.success(`Successfully imported ${result.success} users`);
            onImportComplete(result.success);
          }
          
          if (result.errors.length > 0) {
            toast.warning(`${result.errors.length} users failed to import. Check the error details.`);
          }
        } catch (error: any) {
          toast.error(`Import failed: ${error.message}`);
          setIsImporting(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
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
              <li>• <strong>All users will get login accounts with random passwords</strong></li>
              <li>• Users without email will get dummy email addresses (user_xxxxx@dummy.email)</li>
              <li>• Users with email will use their actual email for login</li>
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
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Email Type</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Role</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Phone</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Address</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">City</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Zip Code</th>
                      <th className="px-3 py-2 text-left font-medium text-gray-900">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {previewData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">{row.name}</td>
                        <td className="px-3 py-2">{row.email || '-'}</td>
                        <td className="px-3 py-2">
                          {row.email && row.email.trim() ? (
                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Real Email</span>
                          ) : (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Dummy Email</span>
                          )}
                        </td>
                        <td className="px-3 py-2">{row.role || 'customer'}</td>
                        <td className="px-3 py-2">{row.phone_number || '-'}</td>
                        <td className="px-3 py-2">{row.address || '-'}</td>
                        <td className="px-3 py-2">{row.city || '-'}</td>
                        <td className="px-3 py-2">{row.zip_code || '-'}</td>
                        <td className="px-3 py-2">{row.notes || '-'}</td>
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