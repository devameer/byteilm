import { Link } from 'react-router-dom';
import { useCurrentSubscription, useCancelSubscription, useResumeSubscription } from '../../hooks/api/useSubscription';
import { useState } from 'react';
import './SubscriptionStatus.css';

const SubscriptionStatus = () => {
  const { data: subscription, isLoading, error } = useCurrentSubscription();
  const cancelMutation = useCancelSubscription();
  const resumeMutation = useResumeSubscription();
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);

  if (isLoading) {
    return (
      <div className="subscription-status-card skeleton">
        <div className="skeleton-header"></div>
        <div className="skeleton-content"></div>
      </div>
    );
  }

  if (error) {
    return null; // Silently fail
  }

  // No subscription - show upgrade prompt
  if (!subscription) {
    return (
      <div className="subscription-status-card no-plan">
        <div className="status-header">
          <h3>Subscription</h3>
        </div>
        <div className="status-content">
          <p className="no-plan-text">You're on the free plan</p>
          <p className="upgrade-hint">Upgrade to unlock more features</p>
        </div>
        <Link to="/pricing" className="upgrade-btn">
          View Plans
        </Link>
      </div>
    );
  }

  const handleCancel = async () => {
    try {
      await cancelMutation.mutateAsync();
      setShowConfirmCancel(false);
    } catch (err) {
      console.error('Failed to cancel subscription:', err);
    }
  };

  const handleResume = async () => {
    try {
      await resumeMutation.mutateAsync();
    } catch (err) {
      console.error('Failed to resume subscription:', err);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`subscription-status-card ${subscription.is_canceled ? 'canceled' : 'active'}`}>
      <div className="status-header">
        <h3>Subscription</h3>
        <span className={`status-badge ${subscription.status}`}>
          {subscription.is_on_trial ? 'Trial' :
           subscription.is_canceled ? 'Canceled' : 
           subscription.is_active ? 'Active' : subscription.status}
        </span>
      </div>

      <div className="status-content">
        <div className="plan-name">{subscription.plan?.display_name || subscription.plan?.name}</div>
        
        <div className="status-details">
          {subscription.is_canceled ? (
            <div className="detail-row warning">
              <span>Access until</span>
              <strong>{formatDate(subscription.ends_at)}</strong>
            </div>
          ) : subscription.is_on_trial ? (
            <div className="detail-row">
              <span>Trial ends</span>
              <strong>{formatDate(subscription.trial_ends_at)}</strong>
            </div>
          ) : (
            <div className="detail-row">
              <span>Renews</span>
              <strong>{formatDate(subscription.ends_at)}</strong>
            </div>
          )}

          {subscription.days_remaining !== null && (
            <div className="days-remaining">
              {subscription.days_remaining} days remaining
            </div>
          )}
        </div>
      </div>

      <div className="status-actions">
        {subscription.is_canceled ? (
          <button 
            className="resume-btn" 
            onClick={handleResume}
            disabled={resumeMutation.isPending}
          >
            {resumeMutation.isPending ? 'Resuming...' : 'Resume Subscription'}
          </button>
        ) : (
          <>
            {!showConfirmCancel ? (
              <button 
                className="cancel-btn" 
                onClick={() => setShowConfirmCancel(true)}
              >
                Cancel Subscription
              </button>
            ) : (
              <div className="confirm-cancel">
                <p>Are you sure you want to cancel?</p>
                <div className="confirm-buttons">
                  <button 
                    className="confirm-yes" 
                    onClick={handleCancel}
                    disabled={cancelMutation.isPending}
                  >
                    {cancelMutation.isPending ? 'Canceling...' : 'Yes, Cancel'}
                  </button>
                  <button 
                    className="confirm-no" 
                    onClick={() => setShowConfirmCancel(false)}
                  >
                    Keep Subscription
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        <Link to="/pricing" className="change-plan-link">
          Change Plan
        </Link>
      </div>
    </div>
  );
};

export default SubscriptionStatus;
