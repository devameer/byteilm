import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLessonQuizzes, useGenerateQuiz, useDeleteQuiz } from '../hooks/api';
import {
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  PlusIcon,
  TrashIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const QuizList = ({ lessonId, isInstructor = false }) => {
  const navigate = useNavigate();
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateOptions, setGenerateOptions] = useState({
    num_questions: 10,
    difficulty: 'medium',
    duration: 15,
    passing_score: 70,
    max_attempts: 3,
    question_types: ['multiple_choice', 'true_false'],
    language: 'ar'
  });

  // React Query hooks
  const { data: quizzesResponse, isLoading: loading } = useLessonQuizzes(lessonId);
  const generateQuizMutation = useGenerateQuiz();
  const deleteQuizMutation = useDeleteQuiz();

  const quizzes = quizzesResponse?.data || [];
  const generating = generateQuizMutation.isPending;

  const handleGenerateQuiz = async () => {
    try {
      await generateQuizMutation.mutateAsync({ lessonId, options: generateOptions });
      alert('تم إنشاء الاختبار بنجاح باستخدام الذكاء الاصطناعي!');
      setShowGenerateModal(false);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert('فشل إنشاء الاختبار: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDeleteQuiz = async (quizId) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاختبار؟')) {
      return;
    }

    try {
      await deleteQuizMutation.mutateAsync(quizId);
      alert('تم حذف الاختبار بنجاح');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('فشل حذف الاختبار');
    }
  };

  const handleStartQuiz = (quizId) => {
    navigate(`/quizzes/${quizId}`);
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      'easy': 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
      'medium': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
      'hard': 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
    };
    return colors[difficulty] || colors['medium'];
  };

  const getDifficultyLabel = (difficulty) => {
    const labels = {
      'easy': 'سهل',
      'medium': 'متوسط',
      'hard': 'صعب'
    };
    return labels[difficulty] || 'متوسط';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          الاختبارات
        </h2>

        {isInstructor && (
          <button
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition"
          >
            <SparklesIcon className="w-5 h-5" />
            إنشاء بالذكاء الاصطناعي
          </button>
        )}
      </div>

      {/* Quizzes List */}
      {quizzes.length === 0 ? (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            لا توجد اختبارات متاحة لهذا الدرس
          </p>
          {isInstructor && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              إنشاء اختبار الآن
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <div
              key={quiz.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-500 transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {quiz.title}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(quiz.difficulty)}`}>
                      {getDifficultyLabel(quiz.difficulty)}
                    </span>
                  </div>

                  {quiz.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {quiz.description}
                    </p>
                  )}
                </div>

                {isInstructor && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteQuiz(quiz.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                      title="حذف الاختبار"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Quiz Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4" />
                  <span>{quiz.duration_minutes} دقيقة</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <ChartBarIcon className="w-4 h-4" />
                  <span>{quiz.questions_count} سؤال</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <CheckCircleIcon className="w-4 h-4" />
                  <span>درجة النجاح: {quiz.passing_score}%</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span>المحاولات: {quiz.user_attempts}/{quiz.max_attempts}</span>
                </div>
              </div>

              {/* User Status */}
              {quiz.has_passed ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                    <CheckCircleIcon className="w-5 h-5" />
                    <span className="font-medium">
                      لقد نجحت في هذا الاختبار! أعلى نتيجة: {quiz.best_score}%
                    </span>
                  </div>
                </div>
              ) : quiz.best_score !== null && quiz.best_score !== undefined ? (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
                    <XCircleIcon className="w-5 h-5" />
                    <span className="font-medium">
                      أفضل نتيجة: {quiz.best_score}% - يمكنك المحاولة مرة أخرى
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex items-center gap-3">
                {quiz.can_take ? (
                  <button
                    onClick={() => handleStartQuiz(quiz.id)}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                  >
                    <PlayIcon className="w-5 h-5" />
                    {quiz.user_attempts > 0 ? 'إعادة المحاولة' : 'بدء الاختبار'}
                  </button>
                ) : (
                  <div className="px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg">
                    لقد استنفذت جميع المحاولات
                  </div>
                )}

                {quiz.user_attempts > 0 && (
                  <button
                    onClick={() => navigate(`/quizzes/${quiz.id}/attempts`)}
                    className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-blue-400 dark:hover:border-blue-500 transition"
                  >
                    عرض المحاولات ({quiz.user_attempts})
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Quiz Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
              إنشاء اختبار بالذكاء الاصطناعي
            </h3>

            <div className="space-y-4">
              {/* Number of Questions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  عدد الأسئلة
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={generateOptions.num_questions}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    num_questions: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مستوى الصعوبة
                </label>
                <select
                  value={generateOptions.difficulty}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    difficulty: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="easy">سهل</option>
                  <option value="medium">متوسط</option>
                  <option value="hard">صعب</option>
                </select>
              </div>

              {/* Language */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  لغة الأسئلة
                </label>
                <select
                  value={generateOptions.language}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    language: e.target.value
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                  <option value="fr">Français</option>
                  <option value="de">Deutsch</option>
                  <option value="es">Español</option>
                  <option value="tr">Türkçe</option>
                  <option value="ur">اردو</option>
                </select>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المدة (دقيقة)
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={generateOptions.duration}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    duration: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Passing Score */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  درجة النجاح (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={generateOptions.passing_score}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    passing_score: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Max Attempts */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الحد الأقصى للمحاولات
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={generateOptions.max_attempts}
                  onChange={(e) => setGenerateOptions({
                    ...generateOptions,
                    max_attempts: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  أنواع الأسئلة
                </label>
                <div className="space-y-2">
                  {[
                    { value: 'multiple_choice', label: 'اختيار من متعدد' },
                    { value: 'true_false', label: 'صح أو خطأ' },
                    { value: 'fill_blank', label: 'إكمال الفراغ' },
                    { value: 'short_answer', label: 'إجابة قصيرة' }
                  ].map((type) => (
                    <label key={type.value} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={generateOptions.question_types.includes(type.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setGenerateOptions({
                              ...generateOptions,
                              question_types: [...generateOptions.question_types, type.value]
                            });
                          } else {
                            setGenerateOptions({
                              ...generateOptions,
                              question_types: generateOptions.question_types.filter(t => t !== type.value)
                            });
                          }
                        }}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-gray-700 dark:text-gray-300">{type.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleGenerateQuiz}
                disabled={generating || generateOptions.question_types.length === 0}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {generating ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    جاري الإنشاء...
                  </>
                ) : (
                  <>
                    <SparklesIcon className="w-5 h-5" />
                    إنشاء بالذكاء الاصطناعي
                  </>
                )}
              </button>

              <button
                onClick={() => setShowGenerateModal(false)}
                disabled={generating}
                className="px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:border-gray-400 disabled:opacity-50 transition"
              >
                إلغاء
              </button>
            </div>

            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                💡 سيتم استخدام الذكاء الاصطناعي Gemini لتوليد أسئلة ذكية بناءً على محتوى الدرس
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizList;
