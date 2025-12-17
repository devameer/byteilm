/**
 * Advanced Analytics Client
 * Tracks events, page views, and heatmap data
 */

class AnalyticsClient {
  constructor(apiUrl = '/api', token = null) {
    this.apiUrl = apiUrl;
    this.token = token || localStorage.getItem('token');
    this.sessionId = this.getOrCreateSessionId();
    this.pageLoadTime = Date.now();
    this.lastScrollDepth = 0;
    this.isTracking = true;

    // Initialize auto-tracking
    this.initAutoTracking();
  }

  /**
   * Initialize automatic tracking
   */
  initAutoTracking() {
    // Track page view on load
    if (typeof window !== 'undefined') {
      window.addEventListener('load', () => {
        this.trackPageView();
      });

      // Track page view on navigation (SPA)
      window.addEventListener('popstate', () => {
        this.trackPageView();
      });

      // Track page exit
      window.addEventListener('beforeunload', () => {
        this.trackPageExit();
      });

      // Track clicks (throttled)
      this.setupClickTracking();

      // Track scroll depth
      this.setupScrollTracking();
    }
  }

  /**
   * Track custom event
   */
  trackEvent(eventName, eventData = {}, category = 'engagement') {
    if (!this.isTracking) return;

    return this.send('/analytics/events', {
      event_name: eventName,
      event_category: category,
      event_data: eventData,
      page_url: window.location.pathname,
      screen_width: window.screen.width,
      screen_height: window.screen.height
    });
  }

  /**
   * Track page view
   */
  trackPageView() {
    if (!this.isTracking) return;

    const timeOnPage = Math.floor((Date.now() - this.pageLoadTime) / 1000);

    this.send('/analytics/page-views', {
      page_url: window.location.pathname,
      page_title: document.title,
      time_on_page: timeOnPage > 0 ? timeOnPage : null,
      scroll_depth: this.getScrollDepth()
    });

    // Reset for new page
    this.pageLoadTime = Date.now();
    this.lastScrollDepth = 0;
  }

  /**
   * Track page exit
   */
  trackPageExit() {
    const timeOnPage = Math.floor((Date.now() - this.pageLoadTime) / 1000);

    if (timeOnPage > 0) {
      // Use sendBeacon for reliable tracking on page unload
      const data = JSON.stringify({
        page_url: window.location.pathname,
        page_title: document.title,
        time_on_page: timeOnPage,
        scroll_depth: this.getScrollDepth(),
        session_id: this.sessionId
      });

      navigator.sendBeacon(
        `${this.apiUrl}/analytics/page-views`,
        new Blob([data], { type: 'application/json' })
      );
    }
  }

  /**
   * Track heatmap click
   */
  trackClick(event) {
    if (!this.isTracking) return;

    const target = event.target;
    const rect = target.getBoundingClientRect();

    this.send('/analytics/heatmap', {
      type: 'click',
      page_url: window.location.pathname,
      x: Math.floor(rect.left + (event.clientX - rect.left)),
      y: Math.floor(rect.top + (event.clientY - rect.top) + window.pageYOffset),
      element: this.getElementSelector(target),
      text: target.textContent?.substring(0, 100),
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight
    });
  }

  /**
   * Track scroll depth
   */
  trackScroll() {
    if (!this.isTracking) return;

    const scrollDepth = this.getScrollDepth();

    // Only track significant scroll changes (every 10%)
    if (scrollDepth > this.lastScrollDepth + 10) {
      this.send('/analytics/heatmap', {
        type: 'scroll',
        page_url: window.location.pathname,
        scroll_depth: scrollDepth,
        viewport_width: window.innerWidth,
        viewport_height: window.innerHeight
      });

      this.lastScrollDepth = scrollDepth;
    }
  }

  /**
   * Setup click tracking (throttled)
   */
  setupClickTracking() {
    let clickTimeout;
    document.addEventListener('click', (event) => {
      clearTimeout(clickTimeout);
      clickTimeout = setTimeout(() => {
        this.trackClick(event);
      }, 100);
    });
  }

  /**
   * Setup scroll tracking (throttled)
   */
  setupScrollTracking() {
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        this.trackScroll();
      }, 500);
    });
  }

  /**
   * Get scroll depth percentage
   */
  getScrollDepth() {
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (documentHeight <= windowHeight) return 100;

    return Math.min(
      100,
      Math.round(((scrollTop + windowHeight) / documentHeight) * 100)
    );
  }

  /**
   * Get CSS selector for element
   */
  getElementSelector(element) {
    if (element.id) return `#${element.id}`;
    if (element.className && typeof element.className === 'string') {
      const classes = element.className.split(' ').filter(c => c);
      if (classes.length > 0) return `.${classes[0]}`;
    }
    return element.tagName.toLowerCase();
  }

  /**
   * Get or create session ID
   */
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('analytics_session_id');

    if (!sessionId) {
      sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }

    return sessionId;
  }

  /**
   * Send data to API
   */
  async send(endpoint, data) {
    if (!this.isTracking) return;

    try {
      const response = await fetch(`${this.apiUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Session-Id': this.sessionId,
          ...(this.token && { 'Authorization': `Bearer ${this.token}` })
        },
        body: JSON.stringify({
          ...data,
          session_id: this.sessionId
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Analytics error:', error);
      return false;
    }
  }

  /**
   * Enable/disable tracking
   */
  setTracking(enabled) {
    this.isTracking = enabled;
  }

  /**
   * Track conversion event (helper)
   */
  trackConversion(conversionName, value = null) {
    return this.trackEvent(conversionName, { value }, 'conversion');
  }

  /**
   * Track purchase (helper)
   */
  trackPurchase(productId, productName, price, quantity = 1) {
    return this.trackEvent('purchase', {
      product_id: productId,
      product_name: productName,
      price,
      quantity,
      total: price * quantity
    }, 'conversion');
  }

  /**
   * Track signup (helper)
   */
  trackSignup(method = 'email') {
    return this.trackEvent('signup', { method }, 'conversion');
  }

  /**
   * Track button click (helper)
   */
  trackButtonClick(buttonId, buttonText, location = null) {
    return this.trackEvent('button_click', {
      button_id: buttonId,
      button_text: buttonText,
      location: location || window.location.pathname
    }, 'engagement');
  }

  /**
   * Track form submission (helper)
   */
  trackFormSubmit(formName, formData = {}) {
    return this.trackEvent('form_submit', {
      form_name: formName,
      ...formData
    }, 'engagement');
  }

  /**
   * Track video play (helper)
   */
  trackVideoPlay(videoId, videoTitle, duration = null) {
    return this.trackEvent('video_play', {
      video_id: videoId,
      video_title: videoTitle,
      duration
    }, 'engagement');
  }

  /**
   * Track search (helper)
   */
  trackSearch(query, resultsCount = null) {
    return this.trackEvent('search', {
      query,
      results_count: resultsCount
    }, 'engagement');
  }
}

// Create and export singleton instance
const analytics = new AnalyticsClient();

// Also export the class for custom instances
export { AnalyticsClient };
export default analytics;
