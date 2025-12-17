import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  TrashIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Integrations = () => {
  const [connectedIntegrations, setConnectedIntegrations] = useState([]);
  const [availableIntegrations, setAvailableIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIntegration, setSelectedIntegration] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [logs, setLogs] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [syncing, setSyncing] = useState({});
  const [testing, setTesting] = useState({});

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setConnectedIntegrations(data.data.connected);
        setAvailableIntegrations(data.data.available);
      }
    } catch (error) {
      console.error('Error fetching integrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (provider) => {
    try {
      // Get OAuth URL
      const response = await fetch(`/api/integrations/auth/${provider}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        // Open OAuth window
        window.location.href = data.data.auth_url;
      }
    } catch (error) {
      console.error('Error connecting integration:', error);
      alert('فشل الربط. حاول مرة أخرى.');
    }
  };

  const handleDisconnect = async (integrationId) => {
    if (!confirm('هل أنت متأكد من فصل هذا التكامل؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('تم فصل التكامل بنجاح');
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Error disconnecting integration:', error);
      alert('فشل فصل التكامل. حاول مرة أخرى.');
    }
  };

  const handleTest = async (integrationId) => {
    try {
      setTesting({ ...testing, [integrationId]: true });

      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('الاتصال يعمل بنجاح ✓');
      } else {
        alert('فشل اختبار الاتصال: ' + data.message);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      alert('فشل اختبار الاتصال');
    } finally {
      setTesting({ ...testing, [integrationId]: false });
    }
  };

  const handleSync = async (integrationId) => {
    try {
      setSyncing({ ...syncing, [integrationId]: true });

      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        alert('تمت المزامنة بنجاح ✓');
        fetchIntegrations();
      } else {
        alert('فشلت المزامنة: ' + data.message);
      }
    } catch (error) {
      console.error('Error syncing:', error);
      alert('فشلت المزامنة');
    } finally {
      setSyncing({ ...syncing, [integrationId]: false });
    }
  };

  const handleUpdateSettings = async (integrationId, settings) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();
      if (data.success) {
        alert('تم تحديث الإعدادات بنجاح');
        fetchIntegrations();
        setShowSettings(false);
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('فشل تحديث الإعدادات');
    }
  };

  const fetchLogs = async (integrationId) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/logs`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setLogs(data.data.data);
        setShowLogs(true);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  const fetchStatistics = async (integrationId) => {
    try {
      const response = await fetch(`/api/integrations/${integrationId}/statistics`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setStatistics(data.data);
        setShowStatistics(true);
      }
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'لم يتم المزامنة بعد';
    const date = new Date(dateString);
    return new Intl.RelativeTimeFormat('ar', { numeric: 'auto' }).format(
      Math.round((date - new Date()) / (1000 * 60 * 60 * 24)),
      'day'
    );
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          التكاملات الخارجية
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          قم بربط تطبيقك مع خدمات خارجية لزيادة الإنتاجية
        </p>
      </div>

      {/* Connected Integrations */}
      {connectedIntegrations.length > 0 && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            التكاملات المتصلة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {connectedIntegrations.map((integration) => (
              <div
                key={integration.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-2 border-green-200 dark:border-green-700"
              >
                {/* Integration Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-4xl">{integration.provider_icon}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {integration.provider_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        {integration.is_active ? (
                          <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                            <CheckCircleIcon className="w-4 h-4" />
                            نشط
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                            <XCircleIcon className="w-4 h-4" />
                            غير نشط
                          </span>
                        )}
                        {integration.auto_sync && (
                          <span className="text-xs text-blue-600 dark:text-blue-400">
                            • مزامنة تلقائية
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Last Sync */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-4">
                  <ClockIcon className="w-4 h-4" />
                  <span>آخر مزامنة: {formatDate(integration.last_sync_at)}</span>
                </div>

                {/* Error Warning */}
                {integration.error_count > 0 && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                      <ExclamationTriangleIcon className="w-4 h-4" />
                      <span>{integration.error_count} خطأ</span>
                    </div>
                    {integration.last_error && (
                      <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                        {integration.last_error}
                      </p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleSync(integration.id)}
                    disabled={syncing[integration.id] || !integration.is_active}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    <ArrowPathIcon className={`w-4 h-4 ${syncing[integration.id] ? 'animate-spin' : ''}`} />
                    مزامنة
                  </button>

                  <button
                    onClick={() => handleTest(integration.id)}
                    disabled={testing[integration.id]}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition text-sm"
                  >
                    <CheckCircleIcon className="w-4 h-4" />
                    اختبار
                  </button>

                  <button
                    onClick={() => {
                      setSelectedIntegration(integration);
                      setShowSettings(true);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition text-sm"
                  >
                    <Cog6ToothIcon className="w-4 h-4" />
                    إعدادات
                  </button>

                  <button
                    onClick={() => {
                      setSelectedIntegration(integration);
                      fetchStatistics(integration.id);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition text-sm"
                  >
                    <ChartBarIcon className="w-4 h-4" />
                    إحصائيات
                  </button>
                </div>

                {/* Additional Actions */}
                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                  <button
                    onClick={() => {
                      setSelectedIntegration(integration);
                      fetchLogs(integration.id);
                    }}
                    className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    عرض السجلات ({integration.logs_count})
                  </button>

                  <button
                    onClick={() => handleDisconnect(integration.id)}
                    className="flex items-center gap-1 text-sm text-red-600 dark:text-red-400 hover:underline"
                  >
                    <TrashIcon className="w-4 h-4" />
                    فصل
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Integrations */}
      {availableIntegrations.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            التكاملات المتاحة
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableIntegrations.map((integration) => (
              <div
                key={integration.provider}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="text-4xl">{integration.icon}</span>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                      {integration.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {integration.description}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2 mb-4">
                  {integration.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircleIcon className="w-4 h-4 text-green-500" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleConnect(integration.provider)}
                  className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  ربط الآن
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && selectedIntegration && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              إعدادات {selectedIntegration.provider_name}
            </h3>

            <div className="space-y-4">
              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked={selectedIntegration.auto_sync}
                  onChange={(e) => {
                    handleUpdateSettings(selectedIntegration.id, {
                      auto_sync: e.target.checked
                    });
                  }}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  تفعيل المزامنة التلقائية
                </span>
              </label>

              <label className="flex items-center gap-3">
                <input
                  type="checkbox"
                  defaultChecked={selectedIntegration.is_active}
                  onChange={(e) => {
                    handleUpdateSettings(selectedIntegration.id, {
                      is_active: e.target.checked
                    });
                  }}
                  className="w-5 h-5 text-blue-600"
                />
                <span className="text-gray-700 dark:text-gray-300">
                  تفعيل التكامل
                </span>
              </label>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Statistics Modal */}
      {showStatistics && statistics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              إحصائيات {selectedIntegration?.provider_name}
            </h3>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الطلبات</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {statistics.total_requests}
                </p>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">معدل النجاح</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {statistics.success_rate}%
                </p>
              </div>

              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">متوسط المدة</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {Math.round(statistics.average_duration)}ms
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">الأخطاء</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                  {statistics.failed_requests}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowStatistics(false)}
              className="w-full py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full p-6 max-h-[80vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              سجلات {selectedIntegration?.provider_name}
            </h3>

            <div className="space-y-2">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className={`p-4 rounded-lg border ${
                    log.status === 'success'
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {log.status === 'success' ? (
                          <CheckCircleIcon className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircleIcon className="w-5 h-5 text-red-600" />
                        )}
                        <span className="font-medium text-gray-900 dark:text-white">
                          {log.action}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({log.formatted_duration || log.duration_ms + 'ms'})
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {log.message}
                      </p>
                      {log.error_details && (
                        <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                          {log.error_details.error}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(log.created_at).toLocaleString('ar-SA')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setShowLogs(false)}
              className="w-full mt-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Integrations;
