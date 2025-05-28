'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { getAppSettings, AppSettings } from '../../lib/settings-api';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ArcElement, 
  PointElement,
  LineElement
} from 'chart.js';
import { Bar, Doughnut, Line, Chart } from 'react-chartjs-2';
import { 
  getOrderCountsByStatus, 
  getOrdersHistory, 
  getTopSellingProducts, 
  getDashboardSummary,
  getTodaysOrders
} from '../../lib/dashboard-api';


// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

interface OrderCount {
  status: string;
  count: number;
}

interface OrderHistory {
  date: string;
  count: number;
  total: number;
}

interface TopProduct {
  product_id: string;
  product_name: string;
  total_quantity: number;
}

interface DashboardSummary {
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_products: number;
}

interface TodayOrder {
  hour: number;
  count: number;
  revenue: number;
}

export default function DashboardPage() {
  const [orderCounts, setOrderCounts] = useState<OrderCount[]>([]);
  const [orderHistory, setOrderHistory] = useState<OrderHistory[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [todayOrders, setTodayOrders] = useState<TodayOrder[]>([]);
  const [summary, setSummary] = useState<DashboardSummary>({
    total_orders: 0,
    total_revenue: 0,
    total_customers: 0,
    total_products: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30); // Days
  const [userTimezone, setUserTimezone] = useState('');
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  const t = useTranslations('dashboard');

  // Set user timezone
  useEffect(() => {
    setUserTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

  // Fetch dashboard data
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all data in parallel
        const [counts, history, products, dashSummary, todayData, settings] = await Promise.all([
          getOrderCountsByStatus(),
          getOrdersHistory(timeRange),
          getTopSellingProducts(10),
          getDashboardSummary(),
          getTodaysOrders(userTimezone),
          getAppSettings()
        ]);
        
        setOrderCounts(counts);
        setOrderHistory(history);
        setTopProducts(products);
        setSummary(dashSummary);
        setTodayOrders(todayData);
        setAppSettings(settings);
      } catch (err: any) {
        console.error('Error fetching dashboard data:', err);
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    
    if (userTimezone) {
      fetchDashboardData();
    }
  }, [timeRange, userTimezone]);

  // Format currency
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  // Prepare data for status chart with emerald/teal colors
  const statusChartData = {
    labels: orderCounts.map(item => item.status.charAt(0).toUpperCase() + item.status.slice(1)),
    datasets: [
      {
        label: 'Orders',
        data: orderCounts.map(item => item.count),
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)', // emerald-500
          'rgba(20, 184, 166, 0.7)', // teal-500
          'rgba(59, 130, 246, 0.7)', // blue-500
          'rgba(249, 115, 22, 0.7)', // orange-500
          'rgba(236, 72, 153, 0.7)', // pink-500
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(20, 184, 166, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(236, 72, 153, 1)',
        ],
        borderWidth: 2,
      },
    ],
  };
  
  // Prepare data for order history chart with emerald/teal colors
  const orderHistoryChartData = {
    labels: orderHistory.map(item => new Date(item.date).toLocaleDateString()),
    datasets: [
      {
        label: 'Orders',
        data: orderHistory.map(item => item.count),
        borderColor: 'rgba(16, 185, 129, 1)',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Revenue',
        data: orderHistory.map(item => item.total),
        borderColor: 'rgba(20, 184, 166, 1)',
        backgroundColor: 'rgba(20, 184, 166, 0.1)',
        tension: 0.4,
        fill: true,
        yAxisID: 'y1',
      },
    ],
  };
  
  // Prepare data for top products chart
  const topProductsChartData = {
    labels: topProducts.map(item => item.product_name),
    datasets: [
      {
        label: 'Units Sold',
        data: topProducts.map(item => item.total_quantity),
        backgroundColor: [
          'rgba(16, 185, 129, 0.7)',
          'rgba(20, 184, 166, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(236, 72, 153, 0.7)',
          'rgba(168, 85, 247, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(14, 165, 233, 0.7)',
          'rgba(245, 158, 11, 0.7)',
          'rgba(239, 68, 68, 0.7)',
        ],
        borderWidth: 2,
        borderColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  };

  // Prepare data for today's orders chart
  const todayOrdersChartData = {
    labels: todayOrders.map(item => `${item.hour}:00`),
    datasets: [
      {
        label: 'Orders',
        data: todayOrders.map(item => item.count),
        backgroundColor: 'rgba(16, 185, 129, 0.7)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
      }
    ],
  };

  // Prepare data for today's revenue chart
  const todayRevenueChartData = {
    labels: todayOrders.map(item => `${item.hour}:00`),
    datasets: [
      {
        label: 'Revenue',
        data: todayOrders.map(item => item.revenue),
        backgroundColor: 'rgba(20, 184, 166, 0.7)',
        borderColor: 'rgba(20, 184, 166, 1)',
        borderWidth: 2,
        tension: 0.4,
        fill: true,
      }
    ],
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-xl lg:text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="mt-1 text-gray-600 text-base">
              Welcome to {appSettings?.company_name ? `${appSettings.company_name}'s` : 'your'} B2B Vegetable management dashboard
            </p>
          </div>
          <div className="mt-4 lg:mt-0 flex items-center space-x-2 text-xs text-gray-500">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Last updated: {new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
      
      {loading ? (
        <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
            <p className="text-base font-medium text-gray-700">{t('loading')}</p>
          </div>
        </div>
      ) : error ? (
        <div className="bg-red-50/80 backdrop-blur-lg rounded-lg shadow-2xl border border-red-200/20 p-4 lg:p-6">
          <div className="flex items-center">
            <svg className="w-4 h-4 text-red-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 font-medium text-sm">{error}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4 group hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h2 className="text-xs font-medium text-gray-500">{t('totalOrders')}</h2>
                  <p className="text-xl font-bold text-gray-900">{summary.total_orders.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            {/* <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4 group hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h2 className="text-xs font-medium text-gray-500">{t('totalRevenue')}</h2>
                  <p className="text-xl font-bold text-gray-900">{formatCurrency(summary.total_revenue)}</p>
                </div>
              </div>
            </div> */}
            
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4 group hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h2 className="text-xs font-medium text-gray-500">{t('customers')}</h2>
                  <p className="text-xl font-bold text-gray-900">{summary.total_customers.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-xl border border-white/20 p-4 group hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center">
                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div className="ml-3 flex-1">
                  <h2 className="text-xs font-medium text-gray-500">{t('products')}</h2>
                  <p className="text-xl font-bold text-gray-900">{summary.total_products.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Today's Orders Chart */}
          {/* <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-gray-900">
                {t('todaysOrders')}
              </h2>
              <div className="text-xs text-gray-500">
                {new Date().toLocaleDateString()} - {userTimezone}
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('orderCountByHour')}</h3>
                <div className="h-64">
                  {todayOrders.some(item => item.count > 0) ? (
                    <Bar 
                      data={todayOrdersChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Number of Orders'
                            },
                            grid: {
                              color: 'rgba(16, 185, 129, 0.1)',
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Hour of Day (24h)'
                            },
                            grid: {
                              display: false,
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <p className="text-gray-500 font-medium text-sm">{t('noOrdersYetToday')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-800 mb-3">{t('revenueByHour')}</h3>
                <div className="h-64">
                  {todayOrders.some(item => item.revenue > 0) ? (
                    <Line 
                      data={todayRevenueChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            display: false,
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            title: {
                              display: true,
                              text: 'Revenue ($)'
                            },
                            grid: {
                              color: 'rgba(20, 184, 166, 0.1)',
                            }
                          },
                          x: {
                            title: {
                              display: true,
                              text: 'Hour of Day (24h)'
                            },
                            grid: {
                              display: false,
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-8 h-8 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                        <p className="text-gray-500 font-medium text-sm">{t('noRevenueGeneratedToday')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div> */}

          {/* Time Range Selector & Order History */}
          {/* <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-4">
              <h2 className="text-base lg:text-xl font-bold text-gray-900 mb-2 lg:mb-0">{t('orderHistory')}</h2>
              <div className="flex flex-wrap gap-2">
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    timeRange === 7 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeRange(7)}
                >
                  {t('last7Days')}
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    timeRange === 30 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeRange(30)}
                >
                  {t('last30Days')}
                </button>
                <button 
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    timeRange === 90 
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  onClick={() => setTimeRange(90)}
                >
                  {t('last90Days')}
                </button>
              </div>
            </div>
            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
              <div className="h-80">
                {orderHistory.length > 0 ? (
                  <Line 
                    data={orderHistoryChartData} 
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: {
                        mode: 'index',
                        intersect: false,
                      },
                      plugins: {
                        legend: {
                          position: 'top',
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Number of Orders'
                          },
                          grid: {
                            color: 'rgba(16, 185, 129, 0.1)',
                          }
                        },
                        y1: {
                          type: 'linear',
                          position: 'right',
                          beginAtZero: true,
                          title: {
                            display: true,
                            text: 'Revenue ($)'
                          },
                          grid: {
                            drawOnChartArea: false,
                          }
                        },
                        x: {
                          title: {
                            display: true,
                            text: 'Date'
                          },
                          grid: {
                            display: false,
                          }
                        }
                      }
                    }}
                  />
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center">
                      <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-gray-500 font-medium text-sm">{t('noOrderHistoryDataAvailable')}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div> */}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Order Status Chart */}
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t('ordersByStatus')}</h2>
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                <div className="h-64">
                  {orderCounts.length > 0 ? (
                    <Doughnut 
                      data={statusChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                            labels: {
                              padding: 20,
                              usePointStyle: true,
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-gray-500 font-medium text-sm">{t('noStatusDataAvailable')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Top Products Chart */}
            <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 p-4 lg:p-6">
              <h2 className="text-base font-bold text-gray-900 mb-4">{t('bestSellingProducts')}</h2>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg p-4">
                <div className="h-64">
                  {topProducts.length > 0 ? (
                    <Bar 
                      data={topProductsChartData} 
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        indexAxis: 'y',
                        plugins: {
                          legend: {
                            display: false
                          }
                        },
                        scales: {
                          x: {
                            title: {
                              display: true,
                              text: 'Units Sold'
                            },
                            grid: {
                              color: 'rgba(20, 184, 166, 0.1)',
                            }
                          },
                          y: {
                            title: {
                              display: true,
                              text: 'Product'
                            },
                            grid: {
                              display: false,
                            }
                          }
                        }
                      }}
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                        <p className="text-gray-500 font-medium text-sm">{t('noProductSalesDataAvailable')}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Top Products Table */}
          <div className="bg-white/80 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 overflow-hidden">
            <div className="px-4 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-900">{t('bestSellingProducts')}</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gradient-to-r from-emerald-50 to-teal-50">
                  <tr>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('rank')}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('product')}
                    </th>
                    <th scope="col" className="px-4 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      {t('unitsSold')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white/50 divide-y divide-gray-100">
                  {topProducts.map((product, index) => (
                    <tr key={product.product_id} className="hover:bg-emerald-50/50 transition-colors duration-200">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-500 text-white' :
                            index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400 text-gray-700' :
                            index === 2 ? 'bg-gradient-to-r from-orange-300 to-orange-400 text-white' :
                            'bg-gradient-to-r from-emerald-100 to-teal-100 text-emerald-700'
                          }`}>
                            #{index + 1}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{product.product_name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm font-semibold text-gray-900">{product.total_quantity.toLocaleString()}</div>
                      </td>
                    </tr>
                  ))}
                  
                  {topProducts.length === 0 && (
                    <tr>
                      <td colSpan={3} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                          </svg>
                          <p className="text-gray-500 font-medium text-sm">{t('noProductDataAvailable')}</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 