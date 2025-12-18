import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ChevronLeftIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  TrophyIcon
} from '@heroicons/react/24/outline';
import { useQuizAttempts } from '../hooks/api';

const QuizAttempts = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  // Hook to fetch attempts
  const { data: attemptsResponse, isLoading: loading, error } = useQuizAttempts(quizId);
  const attempts = attemptsResponse?.data || [];

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'text-green-600 dark:text-green-400';
      case 'in_progress': return 'text-blue-600 dark:text-blue-400';
      case 'abandoned': return 'text-red-600 dark:text-red-400';
      default: return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'in_progress': return 'قيد التنفيذ';
      case 'abandoned': return 'غير مكتمل';
      default: return status;
    }
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 transition mb-2"
          >
            <ChevronLeftIcon className="w-5 h-5 rotate-180" />
            <span>العودة للاختبارات</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            محاولات الاختبار
          </h1>
        </div>
      </div>

      {attempts.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400">لا توجد محاولات سابقة لهذا الاختبار</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {attempts.map((attempt) => (
            <div
              key={attempt.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 transition"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-full ${
                    attempt.passed 
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-600' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-600'
                  }`}>
                    {attempt.passed ? (
                      <TrophyIcon className="w-8 h-8" />
                    ) : (
                      <ArrowPathIcon className="w-8 h-8" />
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      المحاولة #{attempt.attempt_number}
                    </h3>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="w-4 h-4" />
                        <span>{new Date(attempt.started_at).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <div className={`font-medium ${getStatusColor(attempt.status)}`}>
                        {getStatusLabel(attempt.status)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النتيجة</p>
                    <p className={`text-2xl font-bold ${
                      attempt.passed ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {attempt.score !== null ? `${attempt.score}%` : '--'}
                    </p>
                  </div>

                  {attempt.status === 'completed' && (
                    <button
                      onClick={() => navigate(`/quiz-results/${attempt.id}`)}
                      className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      عرض التفاصيل
                    </button>
                  )}
                  
                  {attempt.status === 'in_progress' && (
                    <button
                      onClick={() => navigate(`/quizzes/${quizId}`)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                    >
                      مواصلة الاختبار
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuizAttempts;
