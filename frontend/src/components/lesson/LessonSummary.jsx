import { useState, useEffect } from 'react';
import axios from 'axios';
import { useTheme } from '../../contexts/ThemeContext';

export default function LessonSummary({ lessonId, initialSummary, onUpdate, video }) {
    const { darkMode } = useTheme();
    const [summary, setSummary] = useState(initialSummary || '');
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        setSummary(initialSummary || '');
    }, [initialSummary]);

    const handleSave = async () => {
        if (!hasChanges) {
            setIsEditing(false);
            return;
        }

        setSaving(true);
        setError(null);

        try {
            const response = await axios.put(`/lessons/${lessonId}`, {
                summary: summary,
            });

            if (response.data.success) {
                setIsEditing(false);
                setHasChanges(false);
                if (onUpdate) {
                    onUpdate(summary);
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل حفظ الملخص');
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setSummary(initialSummary || '');
        setIsEditing(false);
        setHasChanges(false);
        setError(null);
    };

    const handleChange = (e) => {
        setSummary(e.target.value);
        setHasChanges(e.target.value !== initialSummary);
    };

    const handleGenerateSummary = async () => {
        if (!video) {
            setError('يجب رفع الفيديو أولاً');
            return;
        }

        setGenerating(true);
        setError(null);

        try {
            // First, transcribe the video
            const transcribeResponse = await axios.post(
                `/lessons/${lessonId}/video/transcribe`
            );

            if (!transcribeResponse.data.success) {
                throw new Error('فشل في تفريغ الفيديو');
            }

            const transcript = transcribeResponse.data.data.transcript;

            // Then, summarize the transcript
            const summaryResponse = await axios.post(
                `/lessons/${lessonId}/video/summarize`,
                {
                    text: transcript,
                }
            );

            if (summaryResponse.data.success) {
                const generatedSummary = summaryResponse.data.data.summary;
                setSummary(generatedSummary);
                setHasChanges(true);
                setIsEditing(true);
            }
        } catch (err) {
            setError(
                err.response?.data?.message || 'فشل في إنشاء الملخص التلقائي'
            );
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>ملخص الدرس</h3>
                <div className="flex gap-2">
                    {video && !isEditing && (
                        <button
                            onClick={handleGenerateSummary}
                            disabled={generating}
                            className="px-3 py-1 text-sm bg-purple-500 text-white rounded hover:bg-purple-600 disabled:opacity-50"
                        >
                            {generating ? (
                                <span className="flex items-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    جاري الإنشاء...
                                </span>
                            ) : (
                                'إنشاء ملخص تلقائي'
                            )}
                        </button>
                    )}
                    {!isEditing && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                        >
                            {summary ? 'تعديل' : 'إضافة ملخص'}
                        </button>
                    )}
                </div>
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <textarea
                        value={summary}
                        onChange={handleChange}
                        placeholder="اكتب ملخص الدرس هنا..."
                        className={`w-full h-48 px-3 py-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none ${
                            darkMode 
                                ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' 
                                : 'bg-white border-gray-300 text-gray-900'
                        }`}
                        disabled={saving}
                    />

                    <div className="flex items-center justify-between">
                        <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {summary.length} حرف
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={handleCancel}
                                disabled={saving}
                                className={`px-4 py-2 text-sm border rounded disabled:opacity-50 ${
                                    darkMode 
                                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700' 
                                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                إلغاء
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving || !hasChanges}
                                className="px-4 py-2 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                            >
                                {saving ? (
                                    <span className="flex items-center gap-2">
                                        <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                        جاري الحفظ...
                                    </span>
                                ) : (
                                    'حفظ'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className={`p-4 rounded-lg min-h-32 ${darkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    {summary ? (
                        <p className={`whitespace-pre-wrap ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{summary}</p>
                    ) : (
                        <p className={`italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                            لا يوجد ملخص لهذا الدرس بعد
                        </p>
                    )}
                </div>
            )}

            {error && (
                <div className={`p-3 border rounded text-sm ${
                    darkMode 
                        ? 'bg-red-900/30 border-red-800 text-red-300' 
                        : 'bg-red-50 border-red-200 text-red-700'
                }`}>
                    {error}
                </div>
            )}
        </div>
    );
}

