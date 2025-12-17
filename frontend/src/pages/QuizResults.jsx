import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  TrophyIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { useQuizResults } from '../hooks/api';

const QuizResults = () => {
  const { attemptId } = useParams();
  const navigate = useNavigate();

  const [showExplanations, setShowExplanations] = useState(true);

  // React Query hook
  const { data: resultsResponse, isLoading: loading, error } = useQuizResults(attemptId);
  const results = resultsResponse?.data || null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">فشل تحميل النتائج</p>
      </div>
    );
  }

  const getGradeColor = (grade) => {
    const colors = {
      'A': 'text-green-600 dark:text-green-400',
      'B': 'text-blue-600 dark:text-blue-400',
      'C': 'text-yellow-600 dark:text-yellow-400',
      'D': 'text-orange-600 dark:text-orange-400',
      'F': 'text-red-600 dark:text-red-400'
    };
    return colors[grade] || colors['F'];
  };

  const getScoreColor = (score, passingScore) => {
    if (score >= passingScore) {
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Results Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 mb-6">
          <div className="text-center mb-6">
            <div className="flex justify-center mb-4">
              {results.passed ? (
                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <TrophyIcon className="w-12 h-12 text-green-600 dark:text-green-400" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <XCircleIcon className="w-12 h-12 text-red-600 dark:text-red-400" />
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {results.passed ? 'مبروك! لقد نجحت' : 'للأسف، لم تنجح هذه المرة'}
            </h1>

            <p className="text-gray-600 dark:text-gray-400">
              {results.quiz_title}
            </p>
          </div>

          {/* Score Display */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النتيجة</p>
              <p className={`text-3xl font-bold ${getScoreColor(results.score, results.passing_score)}`}>
                {results.score}%
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">التقدير</p>
              <p className={`text-3xl font-bold ${getGradeColor(results.grade)}`}>
                {results.grade}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">النقاط</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {results.earned_points}/{results.total_points}
              </p>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">الوقت</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">
                {results.time_spent}
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {results.correct_answers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجابات صحيحة</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {results.incorrect_answers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجابات خاطئة</p>
            </div>

            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {results.questions_count}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">إجمالي الأسئلة</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>النسبة المئوية</span>
              <span>درجة النجاح: {results.passing_score}%</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  results.passed ? 'bg-green-600' : 'bg-red-600'
                }`}
                style={{ width: `${Math.min(results.score, 100)}%` }}
              ></div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate(-2)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              العودة للدرس
            </button>

            {!results.passed && (
              <button
                onClick={() => navigate(`/quizzes/${results.quiz_id}`)}
                className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <ArrowPathIcon className="w-5 h-5" />
                إعادة المحاولة
              </button>
            )}
          </div>
        </div>

        {/* Toggle Explanations */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 mb-6">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-gray-900 dark:text-white font-medium">
              عرض الإجابات الصحيحة والتفسيرات
            </span>
            <input
              type="checkbox"
              checked={showExplanations}
              onChange={(e) => setShowExplanations(e.target.checked)}
              className="w-5 h-5 text-blue-600"
            />
          </label>
        </div>

        {/* Questions Review */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            مراجعة الإجابات
          </h2>

          {results.questions.map((question, index) => (
            <div
              key={question.question_id}
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-r-4 ${
                question.is_correct
                  ? 'border-green-500'
                  : 'border-red-500'
              }`}
            >
              {/* Question Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold text-gray-900 dark:text-white">
                      السؤال {index + 1}
                    </span>
                    {question.is_correct ? (
                      <CheckCircleIcon className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircleIcon className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <p className="text-gray-900 dark:text-white">
                    {question.question}
                  </p>
                </div>

                <div className="text-center mr-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">النقاط</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {question.points_earned}/{question.points}
                  </p>
                </div>
              </div>

              {/* Answer Options (for multiple choice/true-false) */}
              {question.type === 'multiple_choice' && question.options && (
                <div className="space-y-2 mb-4">
                  {question.options.map((option, optIndex) => {
                    const isUserAnswer = question.user_answer === String(optIndex);
                    const isCorrectAnswer = showExplanations && question.correct_answer === String(optIndex);

                    return (
                      <div
                        key={optIndex}
                        className={`p-3 rounded-lg border-2 ${
                          isCorrectAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : isUserAnswer && !question.is_correct
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 dark:text-white">
                            {option}
                          </span>
                          {isCorrectAnswer && (
                            <CheckCircleIcon className="w-5 h-5 text-green-600" />
                          )}
                          {isUserAnswer && !question.is_correct && (
                            <XCircleIcon className="w-5 h-5 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Text Answers */}
              {(question.type === 'fill_blank' || question.type === 'short_answer') && (
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      إجابتك:
                    </p>
                    <div className={`p-3 rounded-lg border-2 ${
                      question.is_correct
                        ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                        : 'border-red-500 bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <p className="text-gray-900 dark:text-white">
                        {question.user_answer || 'لم يتم الإجابة'}
                      </p>
                    </div>
                  </div>

                  {showExplanations && !question.is_correct && (
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        الإجابة الصحيحة:
                      </p>
                      <div className="p-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20">
                        <p className="text-gray-900 dark:text-white">
                          {question.correct_answer}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Explanation */}
              {showExplanations && question.explanation && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <p className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-1">
                    التفسير:
                  </p>
                  <p className="text-blue-800 dark:text-blue-200">
                    {question.explanation}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Bottom Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate(-2)}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
          >
            العودة للدرس
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizResults;
