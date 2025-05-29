'use client';

import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  t: (key: string) => string;
  itemName?: string; // e.g., 'products', 'users', 'orders'
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  itemsPerPage,
  onPageChange,
  onItemsPerPageChange,
  t,
  itemName = 'items'
}) => {
  const goToFirstPage = () => onPageChange(1);
  const goToLastPage = () => onPageChange(totalPages);
  const prevPage = () => onPageChange(Math.max(currentPage - 1, 1));
  const nextPage = () => onPageChange(Math.min(currentPage + 1, totalPages));

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      const startPage = Math.max(1, currentPage - 2);
      const endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
      
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  };

  if (totalCount === 0) {
    return null;
  }

  return (
    <>
      {/* Pagination with multiple pages */}
      {totalPages > 1 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
            {/* Items per page selector */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-700 font-medium">{t('pagination.itemsPerPage')}:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                  className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>
              
              <div className="text-xs text-gray-700">
                {t('pagination.showing')} <span className="font-semibold">{Math.min((currentPage - 1) * itemsPerPage + 1, totalCount)}</span> {t('pagination.to')}{' '}
                <span className="font-semibold">{Math.min(currentPage * itemsPerPage, totalCount)}</span> {t('pagination.of')}{' '}
                <span className="font-semibold">{totalCount}</span>
              </div>
            </div>

            {/* Page navigation */}
            <div className="flex items-center space-x-1">
              {/* First page button */}
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className={`px-2 py-1 rounded-lg border font-medium transition-all duration-200 text-xs ${
                  currentPage === 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title={t('pagination.first')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                </svg>
              </button>

              {/* Previous page button */}
              <button
                onClick={prevPage}
                disabled={currentPage <= 1}
                className={`px-2 py-1 rounded-lg border font-medium transition-all duration-200 text-xs ${
                  currentPage <= 1
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title={t('pagination.previous')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              {/* Page numbers */}
              <div className="flex items-center space-x-1">
                {getPageNumbers().map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => onPageChange(pageNum)}
                    className={`px-2 py-1 rounded-lg font-medium transition-all duration-200 text-xs ${
                      pageNum === currentPage
                        ? 'bg-emerald-600 text-white border border-emerald-600'
                        : 'border border-gray-300 text-gray-700 hover:bg-emerald-50 hover:border-emerald-400'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>

              {/* Next page button */}
              <button
                onClick={nextPage}
                disabled={currentPage >= totalPages}
                className={`px-2 py-1 rounded-lg border font-medium transition-all duration-200 text-xs ${
                  currentPage >= totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title={t('pagination.next')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Last page button */}
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className={`px-2 py-1 rounded-lg border font-medium transition-all duration-200 text-xs ${
                  currentPage === totalPages
                    ? 'border-gray-200 text-gray-400 cursor-not-allowed bg-gray-50'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400'
                }`}
                title={t('pagination.last')}
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Show pagination info even when there's only one page */}
      {totalPages <= 1 && totalCount > 0 && (
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-gray-700 font-medium">{t('pagination.itemsPerPage')}:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                className="border border-gray-300 rounded-lg px-2 py-1 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            
            <div className="text-xs text-gray-700">
              {t('pagination.showing')} <span className="font-semibold">{totalCount}</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Pagination; 