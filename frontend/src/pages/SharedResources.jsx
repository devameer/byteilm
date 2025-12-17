import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext';
import api from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';

export default function SharedResources() {
  const { darkMode } = useTheme();
  const { teamId } = useParams();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSharedResources();
  }, [teamId]);

  const fetchSharedResources = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/teams/${teamId}/resources/options`);
      
      // Combine all resources into one array with type information
      const allResources = [
        ...response.data.courses.map(course => ({ ...course, type: 'course' })),
        ...response.data.projects.map(project => ({ ...project, type: 'project' })),
        ...response.data.tasks.map(task => ({ ...task, type: 'task' }))
      ];
      
      setResources(allResources);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getResourceIcon = (type) => {
    switch (type) {
      case 'course': return '📚';
      case 'project': return '🚀';
      case 'task': return '📋';
      default: return '📄';
    }
  };

  const getResourceLink = (resource) => {
    switch (resource.type) {
      case 'course': return `/courses/${resource.id}`;
      case 'project': return `/projects/${resource.id}`;
      case 'task': return `/tasks/${resource.id}`;
      default: return '#';
    }
  };

  const getStatusBadge = (resource) => {
    if (resource.type === 'task') {
      return resource.completed ? 
        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">مكتمل</span> :
        <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">قيد التنفيذ</span>;
    }
    
    if (resource.type === 'course') {
      return resource.active ? 
        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">نشط</span> :
        <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">غير نشط</span>;
    }
    
    if (resource.type === 'project') {
      const statusMap = {
        'planning': 'قيد التخطيط',
        'in_progress': 'قيد التنفيذ',
        'completed': 'مكتمل',
        'archived': 'مؤرشف'
      };
      
      const statusColors = {
        'planning': 'bg-purple-100 text-purple-800',
        'in_progress': 'bg-blue-100 text-blue-800',
        'completed': 'bg-green-100 text-green-800',
        'archived': 'bg-gray-100 text-gray-800'
      };
      
      return (
        <span className={`px-2 py-1 text-xs ${statusColors[resource.status] || 'bg-gray-100 text-gray-800'} rounded-full`}>
          {statusMap[resource.status] || resource.status}
        </span>
      );
    }
    
    return null;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SharedResourcesPageSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`border rounded-lg p-4 ${
        darkMode
          ? 'bg-red-900/30 border-red-800 text-red-300'
          : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        <p>حدث خطأ أثناء تحميل الموارد المشتركة: {error}</p>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className={`text-2xl font-bold ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>الموارد المشتركة معي</h1>
        <p className={`mt-1 ${
          darkMode ? 'text-gray-400' : 'text-gray-600'
        }`}>جميع الموارد التي تمت مشاركتها معك من قبل أعضاء الفريق</p>
      </div>

      {resources.length === 0 ? (
        <div className={`rounded-lg shadow p-8 text-center transition-colors duration-300 ${
          darkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="text-4xl mb-4">📂</div>
          <h3 className={`text-lg font-medium mb-2 ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>لا توجد موارد مشتركة</h3>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>لم يتم مشاركة أي موارد معك بعد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {resources.map((resource) => (
            <Link
              key={`${resource.type}-${resource.id}`}
              to={getResourceLink(resource)}
              className={`rounded-lg shadow hover:shadow-md transition-all duration-200 p-6 border ${
                darkMode
                  ? 'bg-gray-800 border-gray-700 hover:border-indigo-500'
                  : 'bg-white border-gray-200 hover:border-indigo-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center">
                  <span className="text-2xl mr-3">{getResourceIcon(resource.type)}</span>
                  <div>
                    <h3 className={`font-medium line-clamp-2 transition-colors duration-300 ${
                        darkMode ? 'text-gray-100' : 'text-gray-900'
                    }`}>{resource.name || resource.title}</h3>
                    <p className={`text-sm capitalize mt-1 transition-colors duration-300 ${
                        darkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>{resource.type === 'task' ? 'مهمة' : resource.type === 'project' ? 'مشروع' : 'دورة'}</p>
                  </div>
                </div>
                {getStatusBadge(resource)}
              </div>
              
              <div className={`mt-4 flex items-center text-sm transition-colors duration-300 ${
                darkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors duration-300 ${
                  resource.shared 
                    ? darkMode
                        ? 'bg-green-900/30 text-green-300'
                        : 'bg-green-100 text-green-800'
                    : darkMode
                        ? 'bg-gray-700 text-gray-300'
                        : 'bg-gray-100 text-gray-800'
                }`}>
                  {resource.shared ? 'مشارك' : 'غير مشارك'}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
    </div>
  );
}
