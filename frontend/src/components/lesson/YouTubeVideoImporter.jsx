import { useState, useEffect } from 'react';
import axios from 'axios';

const YOUTUBE_REGEX = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;

export default function YouTubeVideoImporter({ lessonId, onImportSuccess, existingUrl, lessonUrl }) {
    const [url, setUrl] = useState(existingUrl || lessonUrl || '');
    const [quality, setQuality] = useState('720');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMessage, setSuccessMessage] = useState(null);

    useEffect(() => {
        if (existingUrl) {
            setUrl(existingUrl);
        } else if (lessonUrl) {
            setUrl(lessonUrl);
        } else {
            setUrl('');
        }
    }, [existingUrl, lessonUrl]);

    const handleSubmit = async (event) => {
        event.preventDefault();

        setError(null);
        setSuccessMessage(null);

        if (!YOUTUBE_REGEX.test(url.trim())) {
            setError('يرجى إدخال رابط صحيح من YouTube');
            return;
        }

        setLoading(true);

        try {
            const response = await axios.post(`/lessons/${lessonId}/video/youtube`, {
                url: url.trim(),
                quality,
            });

            if (response.data.success) {
                const importedVideo = response.data.data;
                onImportSuccess(importedVideo);
                setSuccessMessage('تم استيراد الفيديو بنجاح من YouTube');
                setUrl(importedVideo?.source_url || lessonUrl || '');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'فشل استيراد الفيديو من YouTube');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">استيراد من YouTube</h3>
                {loading && (
                    <span className="text-sm text-gray-500 animate-pulse">
                        جاري جلب الفيديو...
                    </span>
                )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                        رابط الفيديو
                    </label>
                    <input
                        id="youtube-url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                        dir="ltr"
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        سيتم تحميل الفيديو وحفظه على الخادم حتى يتم تشغيله داخل المنصة.
                    </p>
                </div>

                <div>
                    <label htmlFor="youtube-quality" className="block text-sm font-medium text-gray-700 mb-2">
                        الجودة المطلوبة
                    </label>
                    <select
                        id="youtube-quality"
                        value={quality}
                        onChange={(e) => setQuality(e.target.value)}
                        className="w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        disabled={loading}
                    >
                        <option value="360">360p</option>
                        <option value="480">480p</option>
                        <option value="720">720p</option>
                        <option value="1080">1080p</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                        سيحاول النظام اختيار أقرب جودة متاحة إذا لم تتوفر الجودة المحددة.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className={`px-4 py-2 rounded text-white text-sm font-medium transition-colors ${
                        loading ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
                    }`}
                >
                    استيراد الفيديو
                </button>
            </form>

            {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    {error}
                </div>
            )}

            {successMessage && (
                <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                    {successMessage}
                </div>
            )}
        </div>
    );
}
