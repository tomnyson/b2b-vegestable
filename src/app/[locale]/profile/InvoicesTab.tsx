'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import { supabase } from '@/lib/supabase';

interface Invoice {
  id: string;
  path: string;
  notes: string | null;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

export default function InvoicesTab() {
  const t = useTranslations('invoices');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [previewPdfUrl, setPreviewPdfUrl] = useState<string | null>(null);
  const [previewingInvoice, setPreviewingInvoice] = useState<Invoice | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    fetchUserInvoices();
  }, []);

  const fetchUserInvoices = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Not authenticated');
      }

      const { data: invoices, error } = await supabase
        .from('invoices')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInvoices(invoices || []);
    } catch (err) {
      console.error('Error fetching invoices:', err);
      toast.error(t('loadingError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (path: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('products')
        .download(path);

      if (error) throw error;

      // Create blob URL and trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error downloading file:', err);
      toast.error(t('downloadError'));
    }
  };

  // Handle PDF preview
  const handlePreview = async (invoice: Invoice) => {
    try {
      setPreviewLoading(true);
      setPreviewingInvoice(invoice);
      
      // Get the PDF URL from Supabase storage
      const { data, error } = await supabase.storage
        .from('products')
        .createSignedUrl(invoice.path, 60 * 60); // URL valid for 1 hour

      if (error) throw error;

      setPreviewPdfUrl(data.signedUrl);
      setIsPreviewModalOpen(true);
    } catch (err) {
      console.error('Error getting preview URL:', err);
      toast.error('Failed to load preview. Please try downloading the file instead.');
    } finally {
      setPreviewLoading(false);
    }
  };

  // Close preview modal
  const closePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setPreviewPdfUrl(null);
    setPreviewingInvoice(null);
  };

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 lg:p-12">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="text-lg font-medium text-gray-700">{t('labels.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Invoices Table */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
        {/* Mobile Card View */}
        <div className="block lg:hidden">
          <div className="px-4 py-2 border-b border-gray-100">
            <h3 className="text-base font-semibold text-gray-900">{t('title')}</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {invoices.length > 0 ? (
              invoices.map((invoice) => (
                <div key={invoice.id} className="p-4 hover:bg-emerald-50/50 transition-colors duration-200">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                          invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t(`labels.${invoice.status}`)}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs text-gray-600">
                      <div>
                        <span className="font-medium">Date:</span> {new Date(invoice.created_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Notes:</span> {invoice.notes || '-'}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handlePreview(invoice)}
                        className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.preview')}
                      </button>
                      <button
                        onClick={() => handleDownload(invoice.path, `invoice-${invoice.id}.pdf`)}
                        className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors font-medium text-xs"
                      >
                        {t('actions.download')}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500 font-medium">{t('noInvoicesFound')}</p>
              </div>
            )}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-100">
            <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
              <tr>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.date')}
                </th>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.status')}
                </th>
                <th className="px-6 py-2 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.notes')}
                </th>
                <th className="px-6 py-2 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  {t('labels.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white/50 divide-y divide-gray-100">
              {invoices.length > 0 ? (
                invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                    <td className="px-6 py-2 whitespace-nowrap text-sm text-gray-900">
                      {new Date(invoice.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        invoice.status === 'paid' ? 'bg-green-100 text-green-800' :
                        invoice.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {t(`labels.${invoice.status}`)}
                      </span>
                    </td>
                    <td className="px-6 py-2 text-sm text-gray-500">
                      {invoice.notes ? (invoice.notes.length > 50 ? `${invoice.notes.substring(0, 50)}...` : invoice.notes) : '-'}
                    </td>
                    <td className="px-6 py-2 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handlePreview(invoice)}
                          className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded-lg transition-colors"
                          title={t('actions.preview')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDownload(invoice.path, `invoice-${invoice.id}.pdf`)}
                          className="text-emerald-600 hover:text-emerald-900 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                          title={t('actions.download')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center">
                      <svg className="w-16 h-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium">{t('noInvoicesFound')}</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {isPreviewModalOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-6"
          onClick={closePreviewModal}
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">
                  {previewingInvoice ? t('previewInvoice') : t('previewError')}
                </h2>
                <button
                  onClick={closePreviewModal}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 flex-1 overflow-y-auto">
              {previewLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
                </div>
              ) : previewPdfUrl ? (
                <iframe
                  src={previewPdfUrl}
                  width="100%"
                  height="600px"
                  frameBorder="0"
                ></iframe>
              ) : (
                <p className="text-red-700 font-medium">{t('previewError')}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 