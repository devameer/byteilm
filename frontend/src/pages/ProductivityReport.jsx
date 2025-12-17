import { useState, useEffect } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import { CalendarIcon, ChartBarIcon, ClockIcon, TrophyIcon, FireIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, ArcElement, Title, Tooltip, Legend);

export default function ProductivityReport() {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [dateRange, setDateRange] = useState('this_month');
  const [customDates, setCustomDates] = useState({
    start_date: '',
    end_date: ''
  });
  const [presetPeriods, setPresetPeriods] = useState([]);

  useEffect(() => {
    fetchPresetPeriods();
  }, []);

  useEffect(() => {
    if (dateRange !== 'custom') {
      fetchReport();
    }
  }, [dateRange]);

  const fetchPresetPeriods = async () => {
    try {
      const response = await fetch('/api/reports/types', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      const data = await response.json();
      setPresetPeriods(data.data.preset_periods);
    } catch (error) {
      console.error('Error fetching periods:', error);
    }
  };

  const fetchReport = async () => {
    setLoading(true);

    try {
      let params = '';

      if (dateRange === 'custom') {
        params = `?start_date=${customDates.start_date}&end_date=${customDates.end_date}`;
      } else {
        const period = presetPeriods.find(p => p.id === dateRange);
        if (period) {
          params = `?start_date=${period.start_date}&end_date=${period.end_date}`;
        }
      }

      const response = await fetch(`/api/reports/productivity${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      const data = await response.json();
      setReportData(data.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCustomDateSubmit = (e) => {
    e.preventDefault();
    fetchReport();
  };

  const exportPDF = () => {
    const period = presetPeriods.find(p => p.id === dateRange);
    const params = dateRange === 'custom'
      ? `?start_date=${customDates.start_date}&end_date=${customDates.end_date}`
      : `?start_date=${period.start_date}&end_date=${period.end_date}`;

    window.open(`/api/reports/productivity/export/pdf${params}`, '_blank');
  };

  const exportExcel = () => {
    const period = presetPeriods.find(p => p.id === dateRange);
    const params = dateRange === 'custom'
      ? `?start_date=${customDates.start_date}&end_date=${customDates.end_date}`
      : `?start_date=${period.start_date}&end_date=${period.end_date}`;

    window.open(`/api/reports/productivity/export/excel${params}`, '_blank');
  };

  // Chart data
  const getDailyBreakdownChart = () => {
    if (!reportData?.daily_breakdown) return null;

    return {
      labels: reportData.daily_breakdown.map(day => day.date),
      datasets: [
        {
          label: 'مكتملة',
          data: reportData.daily_breakdown.map(day => day.completed),
          backgroundColor: 'rgba(34, 197, 94, 0.5)',
          borderColor: 'rgb(34, 197, 94)',
          borderWidth: 2
        },
        {
          label: 'قيد التنفيذ',
          data: reportData.daily_breakdown.map(day => day.in_progress),
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2
        },
        {
          label: 'معلقة',
          data: reportData.daily_breakdown.map(day => day.pending),
          backgroundColor: 'rgba(234, 179, 8, 0.5)',
          borderColor: 'rgb(234, 179, 8)',
          borderWidth: 2
        }
      ]
    };
  };

  const getPriorityDistributionChart = () => {
    if (!reportData?.priority_distribution) return null;

    return {
      labels: ['عالية', 'متوسطة', 'منخفضة'],
      datasets: [{
        data: [
          reportData.priority_distribution.counts.high,
          reportData.priority_distribution.counts.medium,
          reportData.priority_distribution.counts.low
        ],
        backgroundColor: [
          'rgba(239, 68, 68, 0.5)',
          'rgba(234, 179, 8, 0.5)',
          'rgba(34, 197, 94, 0.5)'
        ],
        borderColor: [
          'rgb(239, 68, 68)',
          'rgb(234, 179, 8)',
          'rgb(34, 197, 94)'
        ],
        borderWidth: 2
      }]
    };
  };

  const getProductivityTrendChart = () => {
    if (!reportData?.productivity_trend) return null;

    return {
      labels: reportData.productivity_trend.map(week => `Week ${week.week}`),
      datasets: [{
        label: 'معدل الإنجاز (%)',
        data: reportData.productivity_trend.map(week => week.completion_rate),
        fill: true,
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderColor: 'rgb(59, 130, 246)',
        tension: 0.4
      }]
    };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">تقرير الإنتاجية الشخصية</h1>
        <p className="text-gray-600">تحليل شامل لأدائك وإنتاجيتك</p>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex items-center gap-4 mb-4">
          <CalendarIcon className="h-6 w-6 text-gray-500" />
          <h2 className="text-xl font-semibold">اختر الفترة الزمنية</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              فترة محددة مسبقاً
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {presetPeriods.map(period => (
                <option key={period.id} value={period.id}>
                  {period.name}
                </option>
              ))}
            </select>
          </div>

          {dateRange === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                فترة مخصصة
              </label>
              <form onSubmit={handleCustomDateSubmit} className="flex gap-2">
                <input
                  type="date"
                  value={customDates.start_date}
                  onChange={(e) => setCustomDates({ ...customDates, start_date: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <input
                  type="date"
                  value={customDates.end_date}
                  onChange={(e) => setCustomDates({ ...customDates, end_date: e.target.value })}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg"
                  required
                />
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  عرض
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Export Buttons */}
        {reportData && (
          <div className="flex gap-4 mt-4">
            <button
              onClick={exportPDF}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              تصدير PDF
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              <ArrowDownTrayIcon className="h-5 w-5" />
              تصدير Excel
            </button>
          </div>
        )}
      </div>

      {reportData && (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">إجمالي المهام</span>
                <ChartBarIcon className="h-6 w-6 text-blue-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">{reportData.summary.total_tasks}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">المهام المكتملة</span>
                <TrophyIcon className="h-6 w-6 text-green-600" />
              </div>
              <p className="text-3xl font-bold text-green-600">{reportData.summary.completed_tasks}</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">معدل الإنجاز</span>
                <FireIcon className="h-6 w-6 text-orange-600" />
              </div>
              <p className="text-3xl font-bold text-orange-600">{reportData.summary.completion_rate}%</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-600">متوسط وقت الإنجاز</span>
                <ClockIcon className="h-6 w-6 text-purple-600" />
              </div>
              <p className="text-xl font-bold text-purple-600">
                {reportData.summary.average_completion_time?.formatted || 'غير متاح'}
              </p>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Daily Breakdown */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">التوزيع اليومي للمهام</h3>
              {getDailyBreakdownChart() && (
                <Bar data={getDailyBreakdownChart()} options={{ responsive: true }} />
              )}
            </div>

            {/* Priority Distribution */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-xl font-semibold mb-4">توزيع المهام حسب الأولوية</h3>
              {getPriorityDistributionChart() && (
                <Doughnut data={getPriorityDistributionChart()} options={{ responsive: true }} />
              )}
            </div>
          </div>

          {/* Productivity Trend */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h3 className="text-xl font-semibold mb-4">منحنى الإنتاجية (أسبوعي)</h3>
            {getProductivityTrendChart() && (
              <Line data={getProductivityTrendChart()} options={{ responsive: true }} />
            )}
          </div>

          {/* Achievements */}
          {reportData.achievements?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <TrophyIcon className="h-6 w-6 text-yellow-500" />
                الإنجازات
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reportData.achievements.map((achievement, index) => (
                  <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg p-4 border-2 border-yellow-200">
                    <div className="text-4xl mb-2">{achievement.icon}</div>
                    <h4 className="font-bold text-gray-900 mb-1">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most Productive Days */}
          {reportData.most_productive_days?.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
              <h3 className="text-xl font-semibold mb-4">أكثر الأيام إنتاجية</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">التاريخ</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">اليوم</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">المهام المكتملة</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.most_productive_days.map((day, index) => (
                      <tr key={index} className={index === 0 ? 'bg-green-50' : ''}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.date}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{day.day_name}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                            {day.tasks_completed}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Performance Score */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow-md p-8 text-white text-center">
            <h3 className="text-2xl font-bold mb-4">نقاط الأداء الإجمالية</h3>
            <div className="text-6xl font-bold mb-2">{reportData.summary.performance_score}</div>
            <p className="text-xl">من 100</p>
          </div>
        </>
      )}
    </div>
  );
}
