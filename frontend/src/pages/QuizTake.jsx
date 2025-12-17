import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const QuizTake = () => {
  const { quizId } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(null);

  useEffect(() => {
    startQuiz();
  }, [quizId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  // Track time spent on each question
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentQuestionIndex]);

  const startQuiz = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/quizzes/${quizId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setAttempt(data.data);
        setQuiz(data.data.quiz);
        setQuestions(data.data.questions);
        setTimeRemaining(data.data.remaining_time);
      } else {
        alert(data.message);
        navigate(-1);
      }
    } catch (error) {
      console.error('Error starting quiz:', error);
      alert('فشل بدء الاختبار');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value) => {
    const currentQuestion = questions[currentQuestionIndex];
    setAnswers({
      ...answers,
      [currentQuestion.id]: value
    });
  };

  const saveAnswer = async (questionId, answer) => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);

    try {
      await fetch(`/api/quiz-attempts/${attempt.attempt_id}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          question_id: questionId,
          answer: answer,
          time_spent: timeSpent
        })
      });
    } catch (error) {
      console.error('Error saving answer:', error);
    }
  };

  const handleNext = () => {
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];

    if (currentAnswer !== undefined) {
      saveAnswer(currentQuestion.id, currentAnswer);
    }

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = async () => {
    const unansweredCount = questions.length - Object.keys(answers).length;

    if (unansweredCount > 0) {
      if (!confirm(`لديك ${unansweredCount} أسئلة لم تجب عليها. هل أنت متأكد من التسليم؟`)) {
        return;
      }
    }

    // Save current answer if exists
    const currentQuestion = questions[currentQuestionIndex];
    const currentAnswer = answers[currentQuestion.id];
    if (currentAnswer !== undefined) {
      await saveAnswer(currentQuestion.id, currentAnswer);
    }

    try {
      setSubmitting(true);
      const response = await fetch(`/api/quiz-attempts/${attempt.attempt_id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        navigate(`/quiz-results/${attempt.attempt_id}`);
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('فشل تسليم الاختبار');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = async () => {
    alert('انتهى وقت الاختبار. سيتم تسليم إجاباتك تلقائياً.');
    await handleSubmit();
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quiz || !questions.length) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-600">فشل تحميل الاختبار</p>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8" dir="rtl">
      <div className="container mx-auto px-4 max-w-4xl">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {quiz.title}
            </h1>

            {/* Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              timeRemaining < 300
                ? 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
                : 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
            }`}>
              <ClockIcon className="w-5 h-5" />
              <span className="font-mono text-lg font-bold">
                {formatTime(timeRemaining)}
              </span>
            </div>
          </div>

          {/* Progress */}
          <div>
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
              <span>السؤال {currentQuestionIndex + 1} من {questions.length}</span>
              <span>تم الإجابة على {getAnsweredCount()} من {questions.length}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="mb-4">
            <div className="flex items-start justify-between mb-3">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex-1">
                {currentQuestion.question}
              </h2>
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                {currentQuestion.points} {currentQuestion.points === 1 ? 'نقطة' : 'نقاط'}
              </span>
            </div>
          </div>

          {/* Answer Options */}
          <div className="space-y-3">
            {currentQuestion.type === 'multiple_choice' && (
              currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                    currentAnswer === String(index)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={currentAnswer === String(index)}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="mr-3 text-gray-900 dark:text-white flex-1">
                    {option}
                  </span>
                </label>
              ))
            )}

            {currentQuestion.type === 'true_false' && (
              <>
                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  currentAnswer === '0'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="answer"
                    value="0"
                    checked={currentAnswer === '0'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="mr-3 text-gray-900 dark:text-white">صح</span>
                </label>

                <label className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition ${
                  currentAnswer === '1'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                }`}>
                  <input
                    type="radio"
                    name="answer"
                    value="1"
                    checked={currentAnswer === '1'}
                    onChange={(e) => handleAnswerChange(e.target.value)}
                    className="w-5 h-5 text-blue-600"
                  />
                  <span className="mr-3 text-gray-900 dark:text-white">خطأ</span>
                </label>
              </>
            )}

            {(currentQuestion.type === 'fill_blank' || currentQuestion.type === 'short_answer') && (
              <textarea
                value={currentAnswer || ''}
                onChange={(e) => handleAnswerChange(e.target.value)}
                rows={4}
                className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg focus:border-blue-500 focus:ring focus:ring-blue-200 dark:bg-gray-700 dark:text-white"
                placeholder="اكتب إجابتك هنا..."
              />
            )}
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            السابق
          </button>

          <div className="flex-1 text-center">
            {currentQuestionIndex === questions.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 font-bold transition"
              >
                {submitting ? 'جاري التسليم...' : 'تسليم الاختبار'}
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                التالي
              </button>
            )}
          </div>
        </div>

        {/* Question Navigator */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            انتقال سريع للأسئلة
          </h3>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((q, index) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(index)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition ${
                  index === currentQuestionIndex
                    ? 'bg-blue-600 text-white'
                    : answers[q.id] !== undefined
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuizTake;
