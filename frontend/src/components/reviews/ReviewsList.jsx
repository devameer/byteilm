import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ReviewCard from './ReviewCard';
import WriteReview from './WriteReview';

const ReviewsList = ({ courseId }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState(null);
  const [myReview, setMyReview] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWriteReview, setShowWriteReview] = useState(false);
  const [sortBy, setSortBy] = useState('recent');
  const [filterRating, setFilterRating] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchReviews();
    fetchMyReview();
  }, [courseId, sortBy, filterRating, page]);

  const fetchReviews = async () => {
    try {
      const params = new URLSearchParams({
        sort: sortBy,
        page: page.toString()
      });

      if (filterRating) {
        params.append('rating', filterRating);
      }

      const response = await axios.get(`/courses/${courseId}/reviews?${params}`);
      if (response.data.success) {
        if (page === 1) {
          setReviews(response.data.data.data);
        } else {
          setReviews(prev => [...prev, ...response.data.data.data]);
        }
        setSummary(response.data.summary);
        setHasMore(response.data.data.current_page < response.data.data.last_page);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMyReview = async () => {
    try {
      const response = await axios.get(`/courses/${courseId}/my-review`);
      if (response.data.success) {
        setMyReview(response.data.data);
      }
    } catch (error) {
      // User hasn't reviewed yet
    }
  };

  const handleReviewSubmitted = (newReview) => {
    setMyReview(newReview);
    setShowWriteReview(false);
    fetchReviews();
  };

  const handleReviewUpdated = (updatedReview) => {
    setMyReview(updatedReview);
    fetchReviews();
  };

  const handleReviewDeleted = () => {
    setMyReview(null);
    fetchReviews();
  };

  const handleVote = async (reviewId, voteType) => {
    try {
      const response = await axios.post(`/reviews/${reviewId}/vote`, { vote: voteType });
      if (response.data.success) {
        // Update the review in state
        setReviews(reviews.map(review =>
          review.id === reviewId
            ? { ...review, helpful_count: response.data.data.helpful_count, not_helpful_count: response.data.data.not_helpful_count }
            : review
        ));
      }
    } catch (error) {
      console.error('Error voting:', error);
    }
  };

  const RatingSummary = () => {
    if (!summary) return null;

    const total = summary.total_reviews;
    const avg = summary.average_rating;

    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow mb-6">
        <div className="flex items-center gap-8">
          <div className="text-center">
            <div className="text-5xl font-bold text-gray-900 dark:text-white">{avg}</div>
            <div className="flex items-center justify-center mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg
                  key={star}
                  className={`w-6 h-6 ${star <= Math.round(avg) ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{total} تقييم</div>
          </div>

          <div className="flex-1">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = summary[`${['', 'one', 'two', 'three', 'four', 'five'][star]}_star_count`] || 0;
              const percentage = total > 0 ? (count / total) * 100 : 0;

              return (
                <div key={star} className="flex items-center gap-2 mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12">{star} نجوم</span>
                  <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-left">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <RatingSummary />

      {/* My Review or Write Review Button */}
      {myReview ? (
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">مراجعتك</h3>
          <ReviewCard
            review={myReview}
            isMyReview={true}
            onUpdate={handleReviewUpdated}
            onDelete={handleReviewDeleted}
          />
        </div>
      ) : (
        <button
          onClick={() => setShowWriteReview(true)}
          className="w-full px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          اكتب مراجعة
        </button>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="recent">الأحدث</option>
          <option value="helpful">الأكثر إفادة</option>
          <option value="rating_high">التقييم: الأعلى</option>
          <option value="rating_low">التقييم: الأدنى</option>
        </select>

        <select
          value={filterRating || ''}
          onChange={(e) => {
            setFilterRating(e.target.value || null);
            setPage(1);
          }}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
        >
          <option value="">جميع التقييمات</option>
          <option value="5">5 نجوم</option>
          <option value="4">4 نجوم</option>
          <option value="3">3 نجوم</option>
          <option value="2">نجمتان</option>
          <option value="1">نجمة واحدة</option>
        </select>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length > 0 ? (
          reviews.map((review) => (
            <ReviewCard
              key={review.id}
              review={review}
              onVote={handleVote}
            />
          ))
        ) : (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            لا توجد مراجعات بعد. كن أول من يراجع هذه الدورة!
          </div>
        )}
      </div>

      {/* Load More */}
      {hasMore && (
        <button
          onClick={() => setPage(page + 1)}
          className="w-full px-6 py-3 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
        >
          تحميل المزيد
        </button>
      )}

      {/* Write Review Modal */}
      {showWriteReview && (
        <WriteReview
          courseId={courseId}
          onClose={() => setShowWriteReview(false)}
          onSubmit={handleReviewSubmitted}
        />
      )}
    </div>
  );
};

export default ReviewsList;
