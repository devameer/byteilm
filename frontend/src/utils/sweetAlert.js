import Swal from 'sweetalert2';

/**
 * SweetAlert2 Wrapper مع إعدادات مخصصة بالعربية ودعم Dark Mode
 */

// دالة للتحقق من Dark Mode
const isDarkMode = () => {
  return document.documentElement.classList.contains('dark') ||
         localStorage.theme === 'dark' ||
         (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches);
};

// الإعدادات الافتراضية مع دعم Dark Mode
const getDefaultOptions = () => {
  const dark = isDarkMode();

  return {
    confirmButtonColor: '#3b82f6',
    cancelButtonColor: '#ef4444',
    confirmButtonText: 'حسناً',
    cancelButtonText: 'إلغاء',
    reverseButtons: true,
    background: dark ? '#1f2937' : '#ffffff',
    color: dark ? '#f9fafb' : '#111827',
    customClass: {
      popup: dark ? 'swal2-dark' : '',
      title: dark ? 'text-gray-100' : 'text-gray-900',
      htmlContainer: dark ? 'text-gray-300' : 'text-gray-600',
    }
  };
};

/**
 * رسالة نجاح
 */
export const showSuccess = (message, title = 'نجح!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    ...getDefaultOptions(),
  });
};

/**
 * رسالة خطأ
 */
export const showError = (message, title = 'خطأ!') => {
  return Swal.fire({
    icon: 'error',
    title,
    text: message,
    ...getDefaultOptions(),
  });
};

/**
 * رسالة تحذير
 */
export const showWarning = (message, title = 'تحذير!') => {
  return Swal.fire({
    icon: 'warning',
    title,
    text: message,
    ...getDefaultOptions(),
  });
};

/**
 * رسالة معلومات
 */
export const showInfo = (message, title = 'معلومة') => {
  return Swal.fire({
    icon: 'info',
    title,
    text: message,
    ...getDefaultOptions(),
  });
};

/**
 * تأكيد (مع نعم/لا)
 */
export const showConfirm = (message, title = 'هل أنت متأكد؟') => {
  return Swal.fire({
    icon: 'question',
    title,
    text: message,
    showCancelButton: true,
    confirmButtonText: 'نعم',
    cancelButtonText: 'لا',
    ...getDefaultOptions(),
  });
};

/**
 * تحميل (Loading)
 */
export const showLoading = (message = 'جاري التحميل...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
    ...getDefaultOptions(),
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

/**
 * إغلاق الـ Loading
 */
export const closeLoading = () => {
  Swal.close();
};

/**
 * رسالة مع timer (تختفي تلقائياً)
 */
export const showToast = (message, icon = 'success', timer = 3000) => {
  const dark = isDarkMode();

  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
    background: dark ? '#1f2937' : '#ffffff',
    color: dark ? '#f9fafb' : '#111827',
  });
};

/**
 * رسالة خطأ 403 (Forbidden)
 */
export const show403Error = () => {
  return Swal.fire({
    icon: 'error',
    title: 'خطأ 403: غير مصرح',
    html: `
      <p>هذا الاختبار لا ينتمي لحسابك أو انتهت صلاحيته.</p>
      <p>سيتم إعادتك لبدء الاختبار من جديد.</p>
    `,
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#3b82f6',
    ...getDefaultOptions(),
  });
};

/**
 * رسالة خطأ 404 (Not Found)
 */
export const show404Error = () => {
  return Swal.fire({
    icon: 'error',
    title: 'خطأ 404: غير موجود',
    html: `
      <p>الاختبار غير موجود.</p>
      <p>سيتم إعادتك لبدء الاختبار من جديد.</p>
    `,
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#3b82f6',
    ...getDefaultOptions(),
  });
};

/**
 * تأكيد تسليم الاختبار
 */
export const confirmQuizSubmit = (unansweredCount) => {
  const baseOptions = getDefaultOptions();

  if (unansweredCount > 0) {
    return Swal.fire({
      icon: 'warning',
      title: 'هل أنت متأكد؟',
      html: `
        <p>لديك <strong>${unansweredCount}</strong> ${unansweredCount === 1 ? 'سؤال' : 'أسئلة'} لم تجب ${unansweredCount === 1 ? 'عليه' : 'عليها'}.</p>
        <p>هل تريد تسليم الاختبار؟</p>
      `,
      showCancelButton: true,
      confirmButtonText: 'نعم، أسلّم',
      cancelButtonText: 'لا، أريد المراجعة',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      ...baseOptions,
    });
  } else {
    return Swal.fire({
      icon: 'question',
      title: 'هل أنت متأكد؟',
      text: 'هل تريد تسليم الاختبار؟',
      showCancelButton: true,
      confirmButtonText: 'نعم، أسلّم',
      cancelButtonText: 'لا',
      confirmButtonColor: '#10b981',
      cancelButtonColor: '#6b7280',
      reverseButtons: true,
      ...baseOptions,
    });
  }
};

/**
 * رسالة انتهاء الوقت
 */
export const showTimeExpired = () => {
  return Swal.fire({
    icon: 'warning',
    title: 'انتهى الوقت!',
    text: 'انتهى وقت الاختبار. سيتم تسليم إجاباتك تلقائياً.',
    confirmButtonText: 'حسناً',
    confirmButtonColor: '#3b82f6',
    allowOutsideClick: false,
    ...getDefaultOptions(),
  });
};

/**
 * تأكيد حذف الاختبار
 */
export const confirmDeleteQuiz = () => {
  return Swal.fire({
    icon: 'warning',
    title: 'هل أنت متأكد؟',
    text: 'هل تريد حذف هذا الاختبار؟ لا يمكن التراجع عن هذا الإجراء!',
    showCancelButton: true,
    confirmButtonText: 'نعم، احذف',
    cancelButtonText: 'إلغاء',
    confirmButtonColor: '#ef4444',
    cancelButtonColor: '#6b7280',
    reverseButtons: true,
    ...getDefaultOptions(),
  });
};

/**
 * رسالة إنشاء اختبار بالذكاء الاصطناعي
 */
export const showAIQuizGenerating = () => {
  return Swal.fire({
    icon: 'info',
    title: 'جاري إنشاء الاختبار...',
    html: `
      <p>يتم استخدام الذكاء الاصطناعي <strong>Gemini</strong></p>
      <p>لتوليد أسئلة ذكية بناءً على محتوى الدرس</p>
      <p class="text-sm opacity-75 mt-2">قد يستغرق هذا بضع ثوانٍ...</p>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
    ...getDefaultOptions(),
    didOpen: () => {
      Swal.showLoading();
    },
  });
};

export default {
  showSuccess,
  showError,
  showWarning,
  showInfo,
  showConfirm,
  showLoading,
  closeLoading,
  showToast,
  show403Error,
  show404Error,
  confirmQuizSubmit,
  showTimeExpired,
  confirmDeleteQuiz,
  showAIQuizGenerating,
};
