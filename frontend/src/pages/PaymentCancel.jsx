import { useNavigate } from 'react-router-dom';
import './PaymentResult.css';

const PaymentCancel = () => {
  const navigate = useNavigate();

  return (
    <div className="payment-result-page">
      <div className="payment-result-container">
        <div className="result-card cancel">
          <div className="cancel-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M15 9l-6 6M9 9l6 6" />
            </svg>
          </div>
          
          <h1>Payment Cancelled</h1>
          <p className="result-message">
            Your payment was cancelled. No charges were made to your account.
          </p>

          <div className="cancel-info">
            <h3>Need Help?</h3>
            <p>If you encountered any issues or have questions about our plans, we're here to help.</p>
          </div>

          <div className="result-actions">
            <button className="primary-btn" onClick={() => navigate('/pricing')}>
              View Plans
            </button>
            <button className="secondary-btn" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;
