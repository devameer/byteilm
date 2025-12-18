import React, { useState, useEffect } from 'react';
import {
  FunnelIcon,
  ArrowPathIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import axios from 'axios';
import { showSuccess, showError, showConfirm } from '../utils/sweetAlert';

const LogViewer = () => {
  const [logs, setLogs] = useState([]);
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    level: '',
    search: '',
    date: 'current',
    limit: 100
  });
  const [stats, setStats] = useState({ total: 0, file: '', size: '' });

  const logLevels = [
    { value: '', label: 'الكل', color: 'gray' },
    { value: 'emergency', label: 'طوارئ', color: 'red' },
    { value: 'alert', label: 'تنبيه', color: 'red' },
    { value: 'critical', label: 'حرج', color: 'red' },
    { value: 'error', label: 'خطأ', color: 'red' },
    { value: 'warning', label: 'تحذير', color: 'yellow' },
    { value: 'notice', label: 'ملاحظة', color: 'blue' },
    { value: 'info', label: 'معلومة', color: 'blue' },
    { value: 'debug', label: 'تصحيح', color: 'gray' }
  ];

  useEffect(() => {
    fetchLogs();
    fetchDates();
  }, [filters.level, filters.date, filters.limit]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/logs', { params: filters });
      setLogs(response.data.data.logs);
      setStats({
        total: response.data.data.total,
        file: response.data.data.file,
        size: response.data.data.size
      });
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDates = async () => {
    try {
      const response = await axios.get('/logs/dates');
      setDates(response.data.data);
    } catch (error) {
      console.error('Error fetching dates:', error);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleDownload = async () => {
    try {
      const response = await axios.get('/logs/download', {
        params: { date: filters.date },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laravel-${filters.date}.log`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading log:', error);
    }
  };

  const handleClear = async () => {
    const result = await showConfirm(
      `هل أنت متأكد من حذف سجل ${filters.date === 'current' ? 'الحالي' : filters.date}؟ لا يمكن التراجع عن هذا الإجراء!`,
      'تنظيف السجل'
    );

    if (!result.isConfirmed) {
      return;
    }

    try {
      await axios.delete('/logs/clear', { params: { date: filters.date } });
      await showSuccess('تم تنظيف السجل بنجاح', 'نجح!');
      fetchLogs();
    } catch (error) {
      console.error('Error clearing log:', error);
      await showError(
        error.response?.data?.message || 'حدث خطأ أثناء تنظيف السجل',
        'فشل تنظيف السجل'
      );
    }
  };

  const getLevelIcon = (level) => {
    switch (level) {
      case 'error':
      case 'critical':
      case 'alert':
      case 'emergency':
        return <XCircleIcon className="w-5 h-5" />;
      case 'warning':
        return <ExclamationTriangleIcon className="w-5 h-5" />;
      default:
        return <InformationCircleIcon className="w-5 h-5" />;
    }
  };

  const getLevelColor = (level) => {
    const colors = {
      'emergency': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800',
      'alert': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800',
      'critical': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-300 dark:border-red-800',
      'error': 'bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800',
      'warning': 'bg-yellow-50 dark:bg-yellow-900/10 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800',
      'notice': 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'info': 'bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
      'debug': 'bg-gray-50 dark:bg-gray-900/10 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-800'
    };
    return colors[level] || colors['debug'];
  };

  return (
    <div className="container mx-auto px-4 py-8" dir="rtl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          عارض السجلات
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          عرض وفلترة سجلات Laravel
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* Log Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              مستوى السجل
            </label>
            <select
              value={filters.level}
              onChange={(e) => setFilters({ ...filters, level: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {logLevels.map(level => (
                <option key={level.value} value={level.value}>{level.label}</option>
              ))}
            </select>
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              التاريخ
            </label>
            <select
              value={filters.date}
              onChange={(e) => setFilters({ ...filters, date: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              {dates.map((date, index) => (
                <option key={index} value={date.date}>
                  {date.date === 'current' ? 'الحالي' : date.date} ({date.size})
                </option>
              ))}
            </select>
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              عدد السجلات
            </label>
            <select
              value={filters.limit}
              onChange={(e) => setFilters({ ...filters, limit: parseInt(e.target.value) })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            >
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>

          {/* Actions */}
          <div className="flex items-end gap-2">
            <button
              onClick={fetchLogs}
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              title="تحميل السجل"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              <span className="hidden md:inline">تحميل</span>
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-2"
              title="تنظيف السجل"
            >
              <TrashIcon className="w-5 h-5" />
              <span className="hidden md:inline">تنظيف</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch}>
          <div className="relative">
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder="البحث في السجلات..."
              className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <button
              type="submit"
              className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <MagnifyingGlassIcon className="w-5 h-5" />
            </button>
          </div>
        </form>

        {/* Stats & Quick Actions */}
        <div className="mt-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>الملف: {stats.file}</span>
            <span>الحجم: {stats.size}</span>
            <span>السجلات: {stats.total}</span>
          </div>

          {/* Quick Clear Button */}
          {stats.total > 0 && (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition flex items-center gap-2 text-sm"
            >
              <TrashIcon className="w-4 h-4" />
              تنظيف هذا السجل ({stats.total} إدخال)
            </button>
          )}
        </div>
      </div>

      {/* Logs List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : logs.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">لا توجد سجلات</p>
          </div>
        ) : (
          logs.map((log, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getLevelColor(log.level)}`}
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getLevelIcon(log.level)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-1 bg-white dark:bg-gray-800 rounded text-xs font-medium">
                      {log.level.toUpperCase()}
                    </span>
                    <span className="text-xs opacity-75">{log.env}</span>
                    <span className="text-xs opacity-75">{log.timestamp}</span>
                  </div>

                  {/* Message */}
                  <div className="text-sm font-medium mb-2 break-words">
                    {log.message}
                  </div>

                  {/* Stacktrace */}
                  {log.stacktrace && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-xs font-medium hover:underline">
                        عرض التفاصيل
                      </summary>
                      <pre className="mt-2 p-3 bg-black/10 dark:bg-black/30 rounded text-xs overflow-x-auto">
                        {log.stacktrace}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default LogViewer;
