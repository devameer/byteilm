import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlans } from '../hooks/api/usePlans';
import { useCurrentSubscription } from '../hooks/api/useSubscription';
import './Pricing.css';

const Pricing = () => {
  const navigate = useNavigate();
  const { data: plans, isLoading: plansLoading, error: plansError } = usePlans();
  const { data: subscription } = useCurrentSubscription();
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const filteredPlans = plans?.filter(plan => 
    plan.billing_period === billingPeriod || plan.billing_period === 'lifetime'
  ) || [];

  const handleSelectPlan = (plan) => {
    if (plan.price === 0) {
      // Free plan - go to dashboard
      navigate('/dashboard');
      return;
    }
    if (subscription?.plan?.id === plan.id && subscription?.is_active) {
      return;
    }
    navigate(`/checkout/${plan.id}`);
  };

  const formatPrice = (price, currency = 'USD') => {
    if (price === 0) return 'مجاني';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getBillingLabel = (period, price) => {
    if (price === 0) return '';
    switch (period) {
      case 'monthly': return '/ شهرياً';
      case 'yearly': return '/ سنوياً';
      case 'lifetime': return 'دفعة واحدة';
      default: return '';
    }
  };

  const getPlanIcon = (planName) => {
    const name = planName?.toLowerCase() || '';
    if (name.includes('free') || name.includes('مجان')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      );
    } else if (name.includes('pro') || name.includes('احتراف')) {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z" />
        </svg>
      );
    } else {
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      );
    }
  };

  if (plansLoading) {
    return (
      <div className="pricing-page-v2" dir="rtl">
        <div className="pricing-bg-effects">
          <div className="bg-gradient-orb orb-1"></div>
          <div className="bg-gradient-orb orb-2"></div>
          <div className="bg-gradient-orb orb-3"></div>
        </div>
        <div className="pricing-content-v2">
          <div className="pricing-header-v2">
            <span className="pricing-label">خطط الاشتراك</span>
            <h1>اختر الخطة المناسبة لك</h1>
            <p>ابدأ مجاناً وقم بالترقية في أي وقت</p>
          </div>
          <div className="plans-grid-v2">
            {[1, 2, 3].map(i => (
              <div key={i} className="plan-card-v2 skeleton-card">
                <div className="skeleton-shimmer"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (plansError) {
    return (
      <div className="pricing-page-v2" dir="rtl">
        <div className="pricing-content-v2">
          <div className="pricing-error-v2">
            <div className="error-icon">⚠️</div>
            <h2>تعذر تحميل الخطط</h2>
            <p>يرجى المحاولة مرة أخرى لاحقاً</p>
            <button onClick={() => window.location.reload()}>إعادة المحاولة</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pricing-page-v2" dir="rtl">
      {/* Background Effects */}
      <div className="pricing-bg-effects">
        <div className="bg-gradient-orb orb-1"></div>
        <div className="bg-gradient-orb orb-2"></div>
        <div className="bg-gradient-orb orb-3"></div>
      </div>

      <div className="pricing-content-v2">
        {/* Header */}
        <div className="pricing-header-v2">
          <span className="pricing-label">✨ خطط الاشتراك</span>
          <h1>اختر الخطة المناسبة لك</h1>
          <p>ابدأ رحلتك التعليمية اليوم مع أفضل الأدوات والموارد</p>

          {/* Billing Toggle */}
          <div className="billing-toggle-v2">
            <button
              className={`toggle-btn ${billingPeriod === 'monthly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('monthly')}
            >
              شهري
            </button>
            <button
              className={`toggle-btn ${billingPeriod === 'yearly' ? 'active' : ''}`}
              onClick={() => setBillingPeriod('yearly')}
            >
              سنوي
              <span className="discount-tag">وفر 20%</span>
            </button>
          </div>
        </div>

        {/* Plans Grid */}
        <div className="plans-grid-v2">
          {filteredPlans.map((plan, index) => {
            const isCurrentPlan = subscription?.plan?.id === plan.id && subscription?.is_active;
            const isPopular = plan.is_popular;
            const isFree = plan.price === 0;

            return (
              <div 
                key={plan.id} 
                className={`plan-card-v2 ${isPopular ? 'popular' : ''} ${isCurrentPlan ? 'current' : ''} ${isFree ? 'free' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {isPopular && (
                  <div className="popular-ribbon">
                    <span>الأكثر شعبية</span>
                  </div>
                )}
                {isCurrentPlan && (
                  <div className="current-ribbon">
                    <span>خطتك الحالية</span>
                  </div>
                )}

                <div className="plan-icon-v2">
                  {getPlanIcon(plan.name)}
                </div>

                <h3 className="plan-title-v2">{plan.display_name || plan.name}</h3>
                <p className="plan-desc-v2">{plan.description}</p>

                <div className="plan-price-v2">
                  <span className="price-value">{formatPrice(plan.price, plan.currency)}</span>
                  <span className="price-period">{getBillingLabel(plan.billing_period, plan.price)}</span>
                </div>

                <ul className="plan-features-v2">
                  {plan.features?.slice(0, 6).map((feature, idx) => (
                    <li key={idx}>
                      <span className="feature-check">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  className={`plan-cta-v2 ${isCurrentPlan ? 'disabled' : ''} ${isFree ? 'free-btn' : ''}`}
                  onClick={() => handleSelectPlan(plan)}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan 
                    ? 'خطتك الحالية' 
                    : isFree 
                      ? 'ابدأ مجاناً' 
                      : 'اختر هذه الخطة'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Features Section */}
        <div className="pricing-features-section">
          <h2>جميع الخطط تشمل</h2>
          <div className="features-grid-v2">
            <div className="feature-box">
              <div className="feature-icon-box">🔒</div>
              <h4>دفع آمن</h4>
              <p>تشفير SSL كامل</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon-box">💬</div>
              <h4>دعم فني</h4>
              <p>على مدار الساعة</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon-box">🔄</div>
              <h4>تحديثات مجانية</h4>
              <p>أحدث الميزات دائماً</p>
            </div>
            <div className="feature-box">
              <div className="feature-icon-box">❌</div>
              <h4>إلغاء في أي وقت</h4>
              <p>بدون أي رسوم</p>
            </div>
          </div>
        </div>

        {/* Skip Button */}
        <div className="skip-section">
          <button className="skip-btn" onClick={() => navigate('/dashboard')}>
            تخطي واستمر بالخطة المجانية ←
          </button>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
