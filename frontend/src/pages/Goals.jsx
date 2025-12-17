import { useState, useEffect } from 'react';
import axios from 'axios';
import {
  TrophyIcon,
  PlusIcon,
  FireIcon,
  CheckCircleIcon,
  ClockIcon,
  UserGroupIcon,
  ChartBarIcon,
  LightBulbIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { TrophyIcon as TrophySolidIcon } from '@heroicons/react/24/solid';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: 'all', status: 'all', category: 'all' });
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState(null);

  useEffect(() => {
    fetchGoals();
    fetchStatistics();
    fetchSuggestions();
    fetchLeaderboard();
  }, [filter]);

  const fetchGoals = async () => {
    try {
      const params = new URLSearchParams();
      if (filter.type !== 'all') params.append('type', filter.type);
      if (filter.status !== 'all') params.append('status', filter.status);
      if (filter.category !== 'all') params.append('category', filter.category);

      const response = await axios.get(`/goals?${params}`);
      setGoals(response.data.data);
    } catch (error) {
      console.error('Error fetching goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await axios.get('/goals/statistics');
      setStatistics(response.data.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const response = await axios.get('/goals/suggestions');
      setSuggestions(response.data.data);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchLeaderboard = async () => {
    try {
      const response = await axios.get('/goals/leaderboard?limit=5');
      setLeaderboard(response.data.data);
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    }
  };

  const incrementGoalProgress = async (goalId, amount = 1) => {
    try {
      const response = await axios.post(`/goals/${goalId}/increment`, { amount });
      if (response.data.success) {
        fetchGoals();
        fetchStatistics();
      }
    } catch (error) {
      console.error('Error updating progress:', error);
    }
  };

  const markCompleted = async (goalId) => {
    try {
      const response = await axios.post(`/goals/${goalId}/complete`);
      if (response.data.success) {
        fetchGoals();
        fetchStatistics();
        // Show celebration modal/animation
      }
    } catch (error) {
      console.error('Error completing goal:', error);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'active': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'cancelled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'مكتمل';
      case 'active': return 'نشط';
      case 'failed': return 'فشل';
      case 'cancelled': return 'ملغى';
      default: return status;
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'tasks': return CheckCircleIcon;
      case 'projects': return ChartBarIcon;
      case 'courses': return TrophyIcon;
      case 'learning': return LightBulbIcon;
      case 'productivity': return FireIcon;
      default: return TrophyIcon;
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
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <TrophySolidIcon className="h-10 w-10 text-yellow-500" />
            أهدافي
          </h1>
          <p className="text-gray-600 mt-2">حدد أهدافك وحقق طموحاتك</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <PlusIcon className="h-5 w-5" />
          هدف جديد
        </button>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-100">إجمالي الأهداف</span>
              <TrophyIcon className="h-8 w-8 text-blue-100" />
            </div>
            <p className="text-4xl font-bold">{statistics.total_goals}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-green-100">مكتملة</span>
              <CheckCircleIcon className="h-8 w-8 text-green-100" />
            </div>
            <p className="text-4xl font-bold">{statistics.completed_goals}</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-yellow-100">معدل الإنجاز</span>
              <FireIcon className="h-8 w-8 text-yellow-100" />
            </div>
            <p className="text-4xl font-bold">{statistics.completion_rate}%</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <span className="text-purple-100">النقاط المكتسبة</span>
              <TrophySolidIcon className="h-8 w-8 text-purple-100" />
            </div>
            <p className="text-4xl font-bold">{statistics.total_points_earned}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">النوع</label>
            <select
              value={filter.type}
              onChange={(e) => setFilter({ ...filter, type: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">الكل</option>
              <option value="personal">شخصي</option>
              <option value="team">فريق</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الحالة</label>
            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">الكل</option>
              <option value="active">نشط</option>
              <option value="completed">مكتمل</option>
              <option value="failed">فشل</option>
              <option value="cancelled">ملغى</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">الفئة</label>
            <select
              value={filter.category}
              onChange={(e) => setFilter({ ...filter, category: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">الكل</option>
              <option value="tasks">مهام</option>
              <option value="projects">مشاريع</option>
              <option value="courses">دورات</option>
              <option value="learning">تعلم</option>
              <option value="productivity">إنتاجية</option>
              <option value="custom">مخصص</option>
            </select>
          </div>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Goals */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-bold text-gray-900">أهدافي ({goals.length})</h2>

          {goals.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <TrophyIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">لا توجد أهداف بعد</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                أنشئ هدفك الأول
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {goals.map((goal) => {
                const Icon = getCategoryIcon(goal.category);
                return (
                  <div key={goal.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-3 bg-blue-100 rounded-lg">
                          <Icon className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-gray-900 mb-1">{goal.title}</h3>
                          <p className="text-gray-600 text-sm mb-3">{goal.description}</p>

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span className={`px-3 py-1 rounded-full ${getStatusColor(goal.status)}`}>
                              {getStatusText(goal.status)}
                            </span>
                            {goal.type === 'team' && (
                              <span className="flex items-center gap-1">
                                <UserGroupIcon className="h-4 w-4" />
                                فريق
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <ClockIcon className="h-4 w-4" />
                              {goal.days_remaining} يوم متبقي
                            </span>
                          </div>
                        </div>
                      </div>

                      {goal.reward_points > 0 && (
                        <div className="text-center px-4 py-2 bg-yellow-50 rounded-lg">
                          <TrophySolidIcon className="h-6 w-6 text-yellow-500 mx-auto mb-1" />
                          <span className="text-sm font-bold text-yellow-700">{goal.reward_points}</span>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="font-medium text-gray-700">
                          التقدم: {goal.current_value} / {goal.target_value}
                        </span>
                        <span className="font-bold text-blue-600">{goal.progress_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(goal.progress_percentage, 100)}%` }}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    {goal.status === 'active' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => incrementGoalProgress(goal.id)}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                        >
                          + تقدم
                        </button>
                        {goal.progress_percentage >= 100 && (
                          <button
                            onClick={() => markCompleted(goal.id)}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                          >
                            ✓ إكمال
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <LightBulbIcon className="h-5 w-5 text-yellow-500" />
                اقتراحات أهداف
              </h3>
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-1">{suggestion.title}</h4>
                    <p className="text-sm text-gray-600 mb-2">{suggestion.description}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{suggestion.reward_points} نقطة</span>
                      <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                        إنشاء
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Leaderboard */}
          {leaderboard.length > 0 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrophySolidIcon className="h-5 w-5 text-yellow-500" />
                المتصدرون
              </h3>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.user_id} className="flex items-center gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      index === 2 ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-50 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">{user.total_points} نقطة</p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-bold text-gray-900">{user.completed_goals}</p>
                      <p className="text-xs text-gray-500">أهداف</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
