import { useNavigate } from 'react-router-dom';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

export default function LimitReachedModal({ isOpen, onClose, error }) {
  const navigate = useNavigate();

  if (!isOpen || !error) return null;

  const resourceNames = {
    projects: 'المشاريع',
    courses: 'الدورات',
    storage: 'التخزين',
    ai_requests: 'طلبات الذكاء الاصطناعي',
    lessons: 'الدروس'
  };

  const handleUpgrade = () => {
    onClose();
    navigate('/plans');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header bg-gradient-to-r from-orange-50 to-red-50 border-b-2 border-orange-200">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 rounded-full p-2">
              <ExclamationTriangleIcon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-800">تجاوزت الحد المسموح!</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4">
          {/* Error Message */}
          <div className="text-center">
            <p className="text-gray-700 text-lg mb-2">
              {error.message || 'لقد وصلت إلى الحد الأقصى المسموح به في خطتك الحالية'}
            </p>
          </div>

          {/* Usage Details */}
          {error.current !== undefined && error.limit !== undefined && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">
                  {resourceNames[error.resource] || 'المورد'}
                </span>
                <span className="text-sm font-semibold text-red-600">
                  {error.current} / {error.limit}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-orange-500 to-red-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: '100%' }}
                ></div>
              </div>
            </div>
          )}

          {/* Benefits */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-4 border border-indigo-100">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              قم بالترقية للحصول على:
            </h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>عدد غير محدود من المشاريع والدورات</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>مساحة تخزين أكبر لفيديوهاتك</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>طلبات ذكاء اصطناعي غير محدودة</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 mt-0.5">✓</span>
                <span>ميزات إضافية حصرية</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="modal-footer bg-gray-50">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors font-medium"
          >
            إلغاء
          </button>
          <button
            onClick={handleUpgrade}
            className="btn-primary flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            ترقية الخطة الآن
          </button>
        </div>
      </div>
    </div>
  );
}
