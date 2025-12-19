import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { useVerifySession } from '../hooks/api/useCheckout';
import { useCurrentSubscription } from '../hooks/api/useSubscription';
import { useQueryClient } from '@tanstack/react-query';
import './PaymentResult.css';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  
  const sessionId = searchParams.get('session_id');
  const stateMessage = location.state?.message;
  
  const [verifying, setVerifying] = useState(!!sessionId);
  
  // For Stripe: verify the session
  const { data: verificationData } = useVerifySession(sessionId, !!sessionId);
  
  // Refetch subscription data
  const { data: subscription, refetch: refetchSubscription } = useCurrentSubscription();

  useEffect(() => {
    // Invalidate subscription cache to get fresh data
    queryClient.invalidateQueries({ queryKey: ['subscription'] });
    refetchSubscription();
    
    // If Stripe session verification is complete
    if (verificationData && verificationData.status !== 'pending') {
      setVerifying(false);
    }
    
    // If no session ID (test gateway), we're done
    if (!sessionId) {
      setVerifying(false);
    }
  }, [verificationData, sessionId, queryClient, refetchSubscription]);

  // Show verifying state for Stripe payments
  if (verifying) {
    return (
      <div className="payment-result-page">
        <div className="payment-result-container">
          <div className="result-card verifying">
            <div className="verifying-spinner"></div>
            <h1>Verifying Payment...</h1>
            <p>Please wait while we confirm your payment</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-card success">
          <div className="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M8 12l2.5 2.5L16 9" />
            </svg>
          </div>
          
          <h1>Payment Successful!</h1>
          <p className="result-message">
            {stateMessage || 'Thank you for your purchase. Your subscription is now active.'}
          </p>

          {subscription && (
            <div className="subscription-details">
              <h3>Your Subscription</h3>
              <div className="detail-row">
                <span>Plan</span>
                <strong>{subscription.plan?.display_name || subscription.plan?.name}</strong>
              </div>
              <div className="detail-row">
                <span>Status</span>
                <span className="status-badge active">Active</span>
              </div>
              {subscription.ends_at && (
                <div className="detail-row">
                  <span>Valid Until</span>
                  <strong>{new Date(subscription.ends_at).toLocaleDateString()}</strong>
                </div>
              )}
            </div>
          )}

          <div className="result-actions">
            <button className="primary-btn" onClick={() => navigate('/dashboard')}>
              Go to Dashboard
            </button>
            <button className="secondary-btn" onClick={() => navigate('/courses')}>
              Browse Courses
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
