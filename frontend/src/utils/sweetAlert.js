import Swal from 'sweetalert2';

/**
 * SweetAlert2 Wrapper مع إعدادات مخصصة بالعربية
 */

// الإعدادات الافتراضية
const defaultOptions = {
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#ef4444',
  confirmButtonText: 'حسناً',
  cancelButtonText: 'إلغاء',
  reverseButtons: true, // لجعل زر الإلغاء على اليسار (مناسب للعربية)
};

/**
 * رسالة نجاح
 */
export const showSuccess = (message, title = 'نجح!') => {
  return Swal.fire({
    icon: 'success',
    title,
    text: message,
    ...defaultOptions,
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
    ...defaultOptions,
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
    ...defaultOptions,
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
    ...defaultOptions,
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
    ...defaultOptions,
  });
};

/**
 * تحميل (Loading)
 */
export const showLoading = (message = 'جاري التحميل...') => {
  return Swal.fire({
    title: message,
    allowOutsideClick: false,
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
  return Swal.fire({
    toast: true,
    position: 'top-end',
    icon,
    title: message,
    showConfirmButton: false,
    timer,
    timerProgressBar: true,
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
  });
};

/**
 * تأكيد تسليم الاختبار
 */
export const confirmQuizSubmit = (unansweredCount) => {
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
      <p class="text-sm text-gray-500 mt-2">قد يستغرق هذا بضع ثوانٍ...</p>
    `,
    allowOutsideClick: false,
    showConfirmButton: false,
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
