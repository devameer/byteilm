import React, { useState } from 'react';
import AIChatbot from '../components/AIChatbot';
import { 
  useAIDashboard, 
  useAcceptRecommendation, 
  useDismissRecommendation, 
  useMarkInsightRead, 
  useGenerateInsights,
  useAIConversations
} from '../hooks/api';

const AIAssistantDashboard = () => {
  const [activeTab, setActiveTab] = useState('recommendations');
  const [showChatbot, setShowChatbot] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState(null);

  // React Query hooks
  const { data: dashboardResponse, isLoading } = useAIDashboard();
  const { data: conversationsResponse } = useAIConversations();
  const acceptRecommendation = useAcceptRecommendation();
  const dismissRecommendation = useDismissRecommendation();
  const markInsightRead = useMarkInsightRead();
  const generateInsightsMutation = useGenerateInsights();

  const dashboard = dashboardResponse?.data || null;
  const conversations = conversationsResponse?.data || [];

  const handleAcceptRecommendation = (id) => {
    acceptRecommendation.mutate(id);
  };

  const handleDismissRecommendation = (id) => {
    dismissRecommendation.mutate(id);
  };

  const handleMarkInsightAsRead = (id) => {
    markInsightRead.mutate(id);
  };

  const generateInsights = () => {
    generateInsightsMutation.mutate(undefined, {
      onSuccess: () => {
        alert('تم إنشاء رؤى تعليمية جديدة!');
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              المساعد الذكي
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              توصيات ورؤى مدعومة بالذكاء الاصطناعي لتحسين تجربتك التعليمية
            </p>
          </div>

          <button
            onClick={() => setShowChatbot(true)}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            محادثة مع المساعد
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">المحادثات</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboard?.stats?.total_conversations || 0}
                </p>
              </div>
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">التوصيات النشطة</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboard?.stats?.pending_recommendations || 0}
                </p>
              </div>
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 dark:text-gray-400 text-sm">رؤى غير مقروءة</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {dashboard?.stats?.unread_insights || 0}
                </p>
              </div>
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'recommendations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            التوصيات
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'insights'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            الرؤى التعليمية
          </button>
          <button
            onClick={() => setActiveTab('study-times')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'study-times'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            أوقات الدراسة
          </button>
          <button
            onClick={() => setActiveTab('conversations')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'conversations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            المحادثات
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-4 py-2 font-medium transition-colors whitespace-nowrap ${
              activeTab === 'tasks'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            المهام الذكية
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-6">
        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">التوصيات المقترحة لك</h2>
            </div>

            {dashboard?.recommendations && dashboard.recommendations.length > 0 ? (
              dashboard.recommendations.map((rec) => (
                <div key={rec.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          rec.type === 'course' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                          rec.type === 'task' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                        }`}>
                          {rec.type === 'course' ? 'دورة' : rec.type === 'task' ? 'مهمة' : 'تعاون'}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ثقة: {rec.confidence_score}%
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {rec.recommendable?.title || rec.recommendable?.name || 'توصية'}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {rec.reason}
                      </p>

                      <div className="flex gap-3">
                        <button
                          onClick={() => handleAcceptRecommendation(rec.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
                        >
                          قبول
                        </button>
                        <button
                          onClick={() => handleDismissRecommendation(rec.id)}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors text-sm"
                        >
                          تجاهل
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">لا توجد توصيات جديدة حالياً</p>
              </div>
            )}
          </div>
        )}

        {/* Insights Tab */}
        {activeTab === 'insights' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">رؤى التعلم</h2>
              <button
                onClick={generateInsights}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors text-sm"
              >
                إنشاء رؤى جديدة
              </button>
            </div>

            {dashboard?.insights && dashboard.insights.length > 0 ? (
              dashboard.insights.map((insight) => (
                <div key={insight.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          insight.insight_type === 'strength' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          insight.insight_type === 'weakness' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                          insight.insight_type === 'achievement' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                        }`}>
                          {insight.category}
                        </span>
                        {!insight.is_read && (
                          <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>

                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {insight.title}
                      </h3>

                      <p className="text-gray-600 dark:text-gray-400 mb-4">
                        {insight.description}
                      </p>

                      {!insight.is_read && (
                        <button
                          onClick={() => handleMarkInsightAsRead(insight.id)}
                          className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          وضع علامة مقروء
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">لا توجد رؤى متاحة حالياً</p>
                <button
                  onClick={generateInsights}
                  className="mt-4 px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
                >
                  إنشاء رؤى جديدة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Study Times Tab */}
        {activeTab === 'study-times' && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">أوقات الدراسة المقترحة اليوم</h2>

            {dashboard?.study_times_today && dashboard.study_times_today.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dashboard.study_times_today.map((time) => (
                  <div key={time.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                          <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            {time.start_time.slice(0, 5)} - {time.end_time.slice(0, 5)}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {time.duration_minutes} دقيقة
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center gap-1">
                          <span className="text-2xl font-bold text-blue-600">{time.productivity_score}</span>
                          <span className="text-sm text-gray-600 dark:text-gray-400">%</span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">معدل الإنتاجية</p>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {time.reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">لا توجد أوقات دراسة مقترحة لليوم</p>
              </div>
            )}
          </div>
        )}

        {/* Conversations Tab */}
        {activeTab === 'conversations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">المحادثات السابقة</h2>
              <button
                onClick={() => setShowChatbot(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm"
              >
                محادثة جديدة
              </button>
            </div>

            {conversations && conversations.length > 0 ? (
              <div className="space-y-3">
                {conversations.map((conv) => (
                  <div 
                    key={conv.id} 
                    className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedConversation(conv.id);
                      setShowChatbot(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {conv.title || 'محادثة بدون عنوان'}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {conv.context_type && (
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs mr-2">
                              {conv.context_type}
                            </span>
                          )}
                          آخر رسالة: {new Date(conv.last_message_at).toLocaleDateString('ar-SA')}
                        </p>
                      </div>
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">لا توجد محادثات سابقة</p>
                <button
                  onClick={() => setShowChatbot(true)}
                  className="mt-4 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
                >
                  ابدأ محادثة جديدة
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">المهام ذات الأولوية العالية</h2>
            </div>

            {dashboard?.prioritized_tasks && dashboard.prioritized_tasks.length > 0 ? (
              <div className="space-y-3">
                {dashboard.prioritized_tasks.map((task, index) => (
                  <div key={task.id} className="bg-white dark:bg-gray-800 p-5 rounded-lg shadow">
                    <div className="flex items-start gap-4">
                      <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-red-500' :
                        index === 1 ? 'bg-orange-500' :
                        index === 2 ? 'bg-yellow-500' :
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {task.ai_recommendation || 'مهمة تحتاج اهتمامك'}
                        </p>
                        <div className="flex items-center gap-3 mt-3">
                          {task.deadline && (
                            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {new Date(task.deadline).toLocaleDateString('ar-SA')}
                            </span>
                          )}
                          <span className={`px-2 py-1 rounded text-xs ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                            'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                          }`}>
                            {task.priority === 'urgent' ? 'عاجل' :
                             task.priority === 'high' ? 'مرتفع' :
                             task.priority === 'medium' ? 'متوسط' : 'منخفض'}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600">{task.ai_priority_score || 50}</div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">درجة الأولوية</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                <p className="text-gray-600 dark:text-gray-400">لا توجد مهام ذات أولوية حالياً</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Chatbot */}
      {showChatbot && (
        <AIChatbot onClose={() => setShowChatbot(false)} />
      )}
    </div>
  );
};

export default AIAssistantDashboard;
