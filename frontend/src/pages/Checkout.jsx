import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { usePlan } from '../hooks/api/usePlans';
import { usePaymentGateways, useCreateCheckoutSession, useProcessPayment } from '../hooks/api/useCheckout';
import { useTheme } from '../contexts/ThemeContext';
import './Checkout.css';

const Checkout = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { darkMode } = useTheme();
  
  const { data: plan, isLoading: planLoading, error: planError } = usePlan(planId);
  const { data: gateways } = usePaymentGateways();
  const createSession = useCreateCheckoutSession();
  const processPayment = useProcessPayment();

  const [selectedGateway, setSelectedGateway] = useState(searchParams.get('gateway') || 'test');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (gateways && !searchParams.get('gateway')) {
      const stripeGateway = gateways.find(g => g.name === 'stripe' && g.is_configured);
      if (stripeGateway) {
        setSelectedGateway('stripe');
      }
    }
  }, [gateways, searchParams]);

  const formatCardNumber = (value) => {
    const numbers = value.replace(/\D/g, '');
    const groups = numbers.match(/.{1,4}/g);
    return groups ? groups.join(' ').substring(0, 19) : '';
  };

  const formatExpiry = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return numbers.substring(0, 2) + '/' + numbers.substring(2, 4);
    }
    return numbers;
  };

  const handleCardNumberChange = (e) => setCardNumber(formatCardNumber(e.target.value));
  const handleExpiryChange = (e) => setCardExpiry(formatExpiry(e.target.value));
  const handleCvcChange = (e) => setCardCvc(e.target.value.replace(/\D/g, '').substring(0, 4));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsProcessing(true);

    try {
      if (selectedGateway === 'stripe') {
        const result = await createSession.mutateAsync({
          planId: plan.id,
          gateway: 'stripe',
        });
        if (result.checkout_url) {
          window.location.href = result.checkout_url;
        } else {
          throw new Error('فشل في إنشاء جلسة الدفع');
        }
      } else {
        const result = await processPayment.mutateAsync({
          planId: plan.id,
          gateway: 'test',
          cardNumber: cardNumber.replace(/\s/g, ''),
          cardExpiry,
          cardCvc,
          sessionId: searchParams.get('session_id'),
        });

        if (result.success) {
          navigate('/payment/success', { 
            state: { subscriptionId: result.data.subscription_id, message: result.message } 
          });
        } else {
          setError(result.message || 'فشل الدفع');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'فشل عملية الدفع. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(price);
  };

  if (planLoading) {
    return (
      <div className={`checkout-page-v2 ${darkMode ? 'dark' : 'light'}`} dir="rtl">
        <div className="checkout-bg-effects">
          <div className="bg-orb orb-1"></div>
          <div className="bg-orb orb-2"></div>
        </div>
        <div className="checkout-content-v2">
          <div className="checkout-loading-v2">
            <div className="loading-spinner"></div>
            <p>جاري تحميل بيانات الدفع...</p>
          </div>
        </div>
      </div>
    );
  }

  if (planError || !plan) {
    return (
      <div className={`checkout-page-v2 ${darkMode ? 'dark' : 'light'}`} dir="rtl">
        <div className="checkout-content-v2">
          <div className="checkout-error-v2">
            <div className="error-icon">❌</div>
            <h2>الخطة غير موجودة</h2>
            <p>الخطة التي تبحث عنها غير متاحة</p>
            <button onClick={() => navigate('/pricing')}>العودة للخطط</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`checkout-page-v2 ${darkMode ? 'dark' : 'light'}`} dir="rtl">
      {/* Background */}
      <div className="checkout-bg-effects">
        <div className="bg-orb orb-1"></div>
        <div className="bg-orb orb-2"></div>
      </div>

      <div className="checkout-content-v2">
        {/* Header */}
        <div className="checkout-header-v2">
          <button className="back-link" onClick={() => navigate('/pricing')}>
            → العودة للخطط
          </button>
          <h1>إتمام الدفع</h1>
          <p>أنت على بعد خطوة واحدة من الاشتراك</p>
        </div>

        <div className="checkout-grid-v2">
          {/* Payment Form */}
          <div className="payment-card-v2">
            <div className="card-header">
              <span className="card-icon">💳</span>
              <h2>بيانات الدفع</h2>
            </div>

            {/* Gateway Selection */}
            <div className="gateway-selector">
              <label>اختر طريقة الدفع</label>
              <div className="gateway-buttons">
                {gateways?.filter(g => g.is_configured).map(gateway => (
                  <button
                    key={gateway.name}
                    type="button"
                    className={`gateway-btn ${selectedGateway === gateway.name ? 'active' : ''}`}
                    onClick={() => setSelectedGateway(gateway.name)}
                  >
                    {gateway.name === 'stripe' ? (
                      <>
                        <span className="gateway-icon">💎</span>
                        <span>Stripe</span>
                      </>
                    ) : (
                      <>
                        <span className="gateway-icon">🧪</span>
                        <span>بطاقة تجريبية</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {error && (
              <div className="error-alert">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {selectedGateway === 'test' ? (
                <div className="card-form-v2">
                  <div className="test-notice">
                    <span>💡</span>
                    <span>استخدم <strong dir="ltr">4242 4242 4242 4242</strong> للدفع التجريبي</span>
                  </div>

                  <div className="input-group">
                    <label>رقم البطاقة</label>
                    <input
                      type="text"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      placeholder="0000 0000 0000 0000"
                      maxLength="19"
                      dir="ltr"
                      required
                    />
                  </div>

                  <div className="input-row">
                    <div className="input-group">
                      <label>تاريخ الانتهاء</label>
                      <input
                        type="text"
                        value={cardExpiry}
                        onChange={handleExpiryChange}
                        placeholder="MM/YY"
                        maxLength="5"
                        dir="ltr"
                        required
                      />
                    </div>
                    <div className="input-group">
                      <label>CVC</label>
                      <input
                        type="text"
                        value={cardCvc}
                        onChange={handleCvcChange}
                        placeholder="123"
                        maxLength="4"
                        dir="ltr"
                        required
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="stripe-notice-v2">
                  <div className="stripe-icon">🔒</div>
                  <h3>دفع آمن عبر Stripe</h3>
                  <p>سيتم توجيهك إلى صفحة Stripe الآمنة لإتمام الدفع</p>
                </div>
              )}

              <button 
                type="submit" 
                className="submit-btn-v2"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <span className="btn-spinner"></span>
                    جاري المعالجة...
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    ادفع {formatPrice(plan.price, plan.currency)}
                  </>
                )}
              </button>

              <p className="security-note">
                <span>🔐</span>
                جميع المدفوعات مشفرة وآمنة
              </p>
            </form>
          </div>

          {/* Order Summary */}
          <div className="summary-card-v2">
            <div className="card-header">
              <span className="card-icon">📋</span>
              <h2>ملخص الطلب</h2>
            </div>

            <div className="plan-info-v2">
              <h3>{plan.display_name || plan.name}</h3>
              <p>{plan.description}</p>
              <div className="plan-price-badge">
                <span className="price">{formatPrice(plan.price, plan.currency)}</span>
                <span className="period">
                  /{plan.billing_period === 'monthly' ? 'شهرياً' : plan.billing_period === 'yearly' ? 'سنوياً' : 'مرة واحدة'}
                </span>
              </div>
            </div>

            <div className="features-list-v2">
              <h4>ما ستحصل عليه:</h4>
              <ul>
                {plan.features?.slice(0, 5).map((feature, index) => (
                  <li key={index}>
                    <span className="check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="total-section">
              <div className="total-row">
                <span>المجموع الآن</span>
                <span className="total-price">{formatPrice(plan.price, plan.currency)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
