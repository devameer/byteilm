import { useState, useRef } from 'react';
import axios from 'axios';

const SUPPORTED_LANGUAGES = {
    ar: 'العربية',
    en: 'English',
    fr: 'Français',
    es: 'Español',
    de: 'Deutsch',
};

export default function SubtitleUploader({ lessonId, video, onUploadSuccess, onOpenAIGenerator }) {
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedLanguage, setSelectedLanguage] = useState('ar');
    const [editingSubtitle, setEditingSubtitle] = useState(null);
    const [editLanguage, setEditLanguage] = useState('');
    const [showAddOptions, setShowAddOptions] = useState(false);
    const [showAIGenerator, setShowAIGenerator] = useState(false);
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const extension = file.name.split('.').pop().toLowerCase();
        if (!['srt', 'vtt'].includes(extension)) {
            setError('نوع ملف الترجمة غير مدعوم. الأنواع المدعومة: SRT, VTT');
            return;
        }

        // Validate file size (5MB)
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            setError('حجم ملف الترجمة يجب أن لا يتجاوز 5 ميجابايت');
            return;
        }

        setError(null);
        setUploading(true);

        const formData = new FormData();
        formData.append('subtitle', file);
        formData.append('language', selectedLanguage);
        formData.append('language_name', SUPPORTED_LANGUAGES[selectedLanguage]);

        try {
            const response = await axios.post(`/lessons/${lessonId}/video/subtitles`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                onUploadSuccess(response.data.data);
                // Reset file input
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                // Reset view
                setShowAddOptions(false);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل رفع ملف الترجمة');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (subtitleId) => {
        if (!confirm('هل أنت متأكد من حذف ملف الترجمة؟')) {
            return;
        }

        try {
            const response = await axios.delete(`/subtitles/${subtitleId}`);
            if (response.data.success) {
                onUploadSuccess(null, subtitleId);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل حذف ملف الترجمة');
        }
    };

    const handleEditLanguage = (subtitle) => {
        setEditingSubtitle(subtitle.id);
        setEditLanguage(subtitle.language);
        setError(null);
    };

    const handleCancelEdit = () => {
        setEditingSubtitle(null);
        setEditLanguage('');
        setError(null);
    };

    const handleSaveLanguage = async (subtitleId) => {
        if (!editLanguage) {
            setError('يرجى اختيار اللغة');
            return;
        }

        setUploading(true);
        setError(null);

        try {
            const response = await axios.patch(`/subtitles/${subtitleId}/language`, {
                language: editLanguage,
                language_name: SUPPORTED_LANGUAGES[editLanguage],
            });

            if (response.data.success) {
                onUploadSuccess(response.data.data);
                setEditingSubtitle(null);
                setEditLanguage('');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل تحديث لغة الترجمة');
        } finally {
            setUploading(false);
        }
    };

    if (!video) {
        return (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-700">
                يجب رفع الفيديو أولاً قبل إضافة الترجمات
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">الترجمات</h3>

            {/* Existing Subtitles */}
            {video.subtitles && video.subtitles.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">الترجمات الموجودة:</h4>
                    {video.subtitles.map((subtitle) => (
                        <div
                            key={subtitle.id}
                            className="p-3 bg-gray-50 border rounded"
                        >
                            {editingSubtitle === subtitle.id ? (
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            تعديل اللغة
                                        </label>
                                        <select
                                            value={editLanguage}
                                            onChange={(e) => setEditLanguage(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            disabled={uploading}
                                        >
                                            {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                                <option key={code} value={code}>
                                                    {name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleSaveLanguage(subtitle.id)}
                                            disabled={uploading}
                                            className="px-3 py-1 text-sm bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                                        >
                                            {uploading ? 'جاري الحفظ...' : 'حفظ'}
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            disabled={uploading}
                                            className="px-3 py-1 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                                        >
                                            إلغاء
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">{subtitle.language_name}</p>
                                        <p className="text-sm text-gray-600">
                                            {subtitle.file_name} • {subtitle.formatted_size}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditLanguage(subtitle)}
                                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                                        >
                                            تعديل اللغة
                                        </button>
                                        <button
                                            onClick={() => handleDelete(subtitle.id)}
                                            className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                                        >
                                            حذف
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Add New Subtitle Section */}
            <div className="border rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">إضافة ترجمة جديدة:</h4>

                {!showAddOptions && !showAIGenerator && (
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setShowAIGenerator(true)}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-purple-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-all"
                        >
                            <svg className="w-8 h-8 text-purple-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="text-sm font-medium text-purple-700">تحويل عبر AI</span>
                            <span className="text-xs text-gray-500 mt-1">تفريغ وترجمة تلقائية</span>
                        </button>
                        <button
                            onClick={() => setShowAddOptions(true)}
                            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-blue-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-all"
                        >
                            <svg className="w-8 h-8 text-blue-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            <span className="text-sm font-medium text-blue-700">إضافة ملف</span>
                            <span className="text-xs text-gray-500 mt-1">رفع ملف VTT أو SRT</span>
                        </button>
                    </div>
                )}

                {showAddOptions && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">رفع ملف ترجمة</span>
                            <button
                                onClick={() => {
                                    setShowAddOptions(false);
                                    setError(null);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                إلغاء
                            </button>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                اللغة
                            </label>
                            <select
                                value={selectedLanguage}
                                onChange={(e) => setSelectedLanguage(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={uploading}
                            >
                                {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                                    <option key={code} value={code}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                ملف الترجمة
                            </label>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".srt,.vtt"
                                onChange={handleFileChange}
                                disabled={uploading}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                            <p className="mt-1 text-xs text-gray-500">
                                الأنواع المدعومة: SRT, VTT (حتى 5 ميجابايت)
                            </p>
                        </div>

                        {uploading && (
                            <div className="flex items-center justify-center py-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="mr-2 text-sm text-gray-600">جاري الرفع...</span>
                            </div>
                        )}
                    </div>
                )}

                {showAIGenerator && (
                    <div className="space-y-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">التحويل عبر AI</span>
                            <button
                                onClick={() => {
                                    setShowAIGenerator(false);
                                    setError(null);
                                }}
                                className="text-xs text-gray-500 hover:text-gray-700"
                            >
                                إلغاء
                            </button>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg">
                            <p className="text-sm text-gray-700 mb-3">
                                استخدم الذكاء الاصطناعي لتفريغ الفيديو تلقائياً وإنشاء الترجمات
                            </p>
                            {onOpenAIGenerator ? (
                                <button
                                    onClick={() => {
                                        setShowAIGenerator(false);
                                        onOpenAIGenerator();
                                    }}
                                    className="w-full px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 font-medium transition-all"
                                >
                                    انتقل إلى أداة التفريغ التلقائي
                                </button>
                            ) : (
                                <p className="text-xs text-gray-600 text-center">
                                    يوجد أداة التفريغ التلقائي في نفس الصفحة أعلاه
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                    {error}
                </div>
            )}
        </div>
    );
}
