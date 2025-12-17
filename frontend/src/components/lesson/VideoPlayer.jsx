import { useRef, useEffect, useState } from 'react';

export default function VideoPlayer({ video }) {
    const videoRef = useRef(null);
    const [selectedSubtitle, setSelectedSubtitle] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Set default subtitle (Arabic if available)
        if (video?.subtitles && video.subtitles.length > 0) {
            const arabicSubtitle = video.subtitles.find(s => s.language === 'ar');
            setSelectedSubtitle(arabicSubtitle || video.subtitles[0]);
        }
    }, [video]);

    useEffect(() => {
        // Update video subtitle track when selection changes
        if (videoRef.current && selectedSubtitle) {
            const tracks = videoRef.current.textTracks;

            // Disable all tracks
            for (let i = 0; i < tracks.length; i++) {
                tracks[i].mode = 'hidden';
            }

            // Enable selected track
            const track = Array.from(tracks).find(
                t => t.label === selectedSubtitle.language_name
            );
            if (track) {
                track.mode = 'showing';
            }
        }
    }, [selectedSubtitle]);

    if (!video) {
        return (
            <div className="bg-gray-100 rounded-lg p-8 text-center">
                <svg
                    className="mx-auto h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                </svg>
                <p className="mt-2 text-gray-600">لا يوجد فيديو لهذا الدرس</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-semibold">مشاهدة الدرس</h3>

            <div className="relative bg-black rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    controls
                    controlsList="nodownload"
                    className="w-full"
                    onError={(e) => setError('فشل تحميل الفيديو')}
                >
                    <source src={video.video_url} type={video.mime_type} />

                    {/* Add subtitle tracks */}
                    {video.subtitles && video.subtitles.map((subtitle) => (
                        <track
                            key={subtitle.id}
                            kind="subtitles"
                            src={subtitle.vtt_url}
                            srcLang={subtitle.language}
                            label={subtitle.language_name}
                            {...(subtitle.language === 'ar' && { default: true })}
                        />
                    ))}

                    متصفحك لا يدعم تشغيل الفيديو.
                </video>

                {error && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-75">
                        <p className="text-white">{error}</p>
                    </div>
                )}
            </div>

            {/* Subtitle selector */}
            {video.subtitles && video.subtitles.length > 0 && (
                <div className="flex items-center gap-4">
                    <label className="text-sm font-medium text-gray-700">
                        الترجمة:
                    </label>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSelectedSubtitle(null)}
                            className={`px-3 py-1 text-sm rounded ${
                                !selectedSubtitle
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                            }`}
                        >
                            بدون ترجمة
                        </button>
                        {video.subtitles.map((subtitle) => (
                            <button
                                key={subtitle.id}
                                onClick={() => setSelectedSubtitle(subtitle)}
                                className={`px-3 py-1 text-sm rounded ${
                                    selectedSubtitle?.id === subtitle.id
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                                }`}
                            >
                                {subtitle.language_name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Video info */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                    <p className="text-xs text-gray-600">حجم الملف</p>
                    <p className="text-sm font-medium">{video.formatted_size}</p>
                </div>
                {video.formatted_duration && (
                    <div>
                        <p className="text-xs text-gray-600">مدة الفيديو</p>
                        <p className="text-sm font-medium">{video.formatted_duration}</p>
                    </div>
                )}
                <div>
                    <p className="text-xs text-gray-600">عدد الترجمات</p>
                    <p className="text-sm font-medium">
                        {video.subtitles?.length || 0}
                    </p>
                </div>
            </div>
        </div>
    );
}
