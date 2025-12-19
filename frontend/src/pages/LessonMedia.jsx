import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useLesson } from "../hooks/api";
import ChunkedVideoUploader from "../components/lesson/ChunkedVideoUploader";
import SubtitleUploader from "../components/lesson/SubtitleUploader";
import SubtitleGenerator from "../components/lesson/SubtitleGenerator";
import EnhancedVideoPlayer from "../components/lesson/EnhancedVideoPlayer";
import LessonSummary from "../components/lesson/LessonSummary";
import LessonMediaSkeleton from "../components/skeletons/LessonMediaSkeleton";
import QuizList from "../components/QuizList";
import axios from "axios"; // Keep for video fetch

export default function LessonMedia() {
    const { darkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [video, setVideo] = useState(null);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState("view"); // view, upload, summary
    const [focusAIGenerator, setFocusAIGenerator] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);

    // Use React Query for lesson data
    const { data: lessonResponse, isLoading: loading } = useLesson(id);
    const lesson = lessonResponse?.data || null;

    // Fetch video when lesson is loaded
    useEffect(() => {
        if (lesson && id) {
            fetchVideo();
        }
    }, [lesson, id]);

    const fetchVideo = async () => {
        try {
            setVideoLoading(true);
            const videoRes = await axios.get(`/lessons/${id}/video`);
            setVideo(videoRes.data.data);
        } catch (videoErr) {
            if (videoErr.response?.status === 404) {
                setVideo(null);
                setActiveTab("upload");
            } else {
                console.warn('⚠️ [LessonMedia] Failed to load video:', videoErr);
                setVideo(null);
            }
        } finally {
            setVideoLoading(false);
        }
    };

    const handleVideoUpload = (uploadedVideo) => {
        setVideo(uploadedVideo);
        if (uploadedVideo && activeTab === "upload") {
            setActiveTab("view");
        }
    };

    const handleSubtitleUpload = (subtitle, deletedId = null) => {
        if (deletedId) {
            // Remove subtitle from list
            setVideo((prev) => ({
                ...prev,
                subtitles: prev.subtitles.filter((s) => s.id !== deletedId),
            }));
        } else if (subtitle) {
            // Check if subtitle exists (update) or is new (add)
            setVideo((prev) => {
                const existingIndex = prev.subtitles?.findIndex(
                    (s) => s.id === subtitle.id
                );
                if (existingIndex !== -1) {
                    // Update existing subtitle
                    const newSubtitles = [...prev.subtitles];
                    newSubtitles[existingIndex] = subtitle;
                    return { ...prev, subtitles: newSubtitles };
                } else {
                    // Add new subtitle
                    return {
                        ...prev,
                        subtitles: [...(prev.subtitles || []), subtitle],
                    };
                }
            });
        }
    };

    const handleOpenAIGenerator = () => {
        setFocusAIGenerator(true);
        // Scroll to AI Generator component
        setTimeout(() => {
            const element = document.getElementById("ai-generator-section");
            if (element) {
                element.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            setFocusAIGenerator(false);
        }, 100);
    };

    const handleSummaryUpdate = (newSummary) => {
        setLesson((prev) => ({
            ...prev,
            summary: newSummary,
        }));
    };

    if (loading) {
        return <LessonMediaSkeleton />;
    }

    if (error) {
        return (
            <div className={`min-h-screen transition-colors duration-300 ${
                darkMode ? 'bg-gray-900' : 'bg-gray-50'
            }`}>
                <div className="container mx-auto px-4 py-8">
                    <div className={`border rounded-lg p-4 ${
                        darkMode
                            ? 'bg-red-900/30 border-red-800 text-red-300'
                            : 'bg-red-50 border-red-200 text-red-700'
                    }`}>
                        {error}
                    </div>
                </div>
            </div>
        );
    }

    if (!lesson) {
        return <LessonMediaSkeleton />;
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${
            darkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="container mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-6">
                <button
                    onClick={() => navigate(-1)}
                    className={`mb-4 flex items-center gap-2 transition-colors ${
                        darkMode
                            ? 'text-blue-400 hover:text-blue-300'
                            : 'text-blue-500 hover:text-blue-700'
                    }`}
                >
                    <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    رجوع
                </button>
                <h1 className={`text-3xl font-bold ${
                    darkMode ? 'text-gray-100' : 'text-gray-900'
                }`}>{lesson.name}</h1>
                {lesson.description && (
                    <p className={`mt-2 ${
                        darkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>{lesson.description}</p>
                )}
            </div>

            {/* Tabs */}
            <div className={`mb-6 border-b ${
                darkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
                <nav className="flex gap-4">
                    <button
                        onClick={() => setActiveTab("view")}
                        className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                            activeTab === "view"
                                ? darkMode
                                    ? "border-blue-400 text-blue-400"
                                    : "border-blue-500 text-blue-600"
                                : darkMode
                                ? "border-transparent text-gray-400 hover:text-gray-300"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        مشاهدة الدرس
                    </button>
                    <button
                        onClick={() => setActiveTab("upload")}
                        className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                            activeTab === "upload"
                                ? darkMode
                                    ? "border-blue-400 text-blue-400"
                                    : "border-blue-500 text-blue-600"
                                : darkMode
                                ? "border-transparent text-gray-400 hover:text-gray-300"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        إدارة الوسائط
                    </button>
                    <button
                        onClick={() => setActiveTab("summary")}
                        className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                            activeTab === "summary"
                                ? darkMode
                                    ? "border-blue-400 text-blue-400"
                                    : "border-blue-500 text-blue-600"
                                : darkMode
                                ? "border-transparent text-gray-400 hover:text-gray-300"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        الملخص
                    </button>
                    <button
                        onClick={() => setActiveTab("quiz")}
                        className={`pb-2 px-1 border-b-2 font-medium transition-colors ${
                            activeTab === "quiz"
                                ? darkMode
                                    ? "border-blue-400 text-blue-400"
                                    : "border-blue-500 text-blue-600"
                                : darkMode
                                ? "border-transparent text-gray-400 hover:text-gray-300"
                                : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        الاختبارات
                    </button>
                </nav>
            </div>

            {/* Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    {activeTab === "view" && (
                        <div className="space-y-6">
                            {video ? (
                                <EnhancedVideoPlayer video={video} darkMode={darkMode} />
                            ) : (
                                <div className={`text-center py-16 rounded-lg shadow transition-colors duration-300 ${
                                    darkMode ? 'bg-gray-800' : 'bg-white'
                                }`}>
                                    <svg
                                        className={`mx-auto h-16 w-16 ${
                                            darkMode ? 'text-gray-600' : 'text-gray-400'
                                        }`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={1.5}
                                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                                        />
                                    </svg>
                                    <h3 className={`mt-4 text-lg font-medium ${
                                        darkMode ? 'text-gray-300' : 'text-gray-900'
                                    }`}>
                                        لا يوجد فيديو
                                    </h3>
                                    <p className={`mt-2 text-sm ${
                                        darkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`}>
                                        ابدأ برفع فيديو لهذا الدرس للاستفادة من كافة الميزات
                                    </p>
                                    <button
                                        onClick={() => setActiveTab("upload")}
                                        className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors shadow-sm"
                                    >
                                        <svg
                                            className="w-5 h-5"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                                            />
                                        </svg>
                                        رفع فيديو الآن
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "upload" && (
                        <div className="space-y-6">
                            {/* <div
                                id="youtube-import-section"
                                className="bg-white rounded-lg shadow p-6"
                            >
                                <YouTubeVideoImporter
                                    lessonId={id}
                                    existingUrl={video?.source_url}
                                    lessonUrl={lesson?.link}
                                    onImportSuccess={handleVideoUpload}
                                />
                            </div> */}

                            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                                darkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <ChunkedVideoUploader
                                    lessonId={id}
                                    existingVideo={video}
                                    onUploadSuccess={handleVideoUpload}
                                />
                            </div>

                            <div
                                id="ai-generator-section"
                                className={`rounded-lg shadow p-6 transition-all ${
                                    darkMode ? 'bg-gray-800' : 'bg-white'
                                } ${
                                    focusAIGenerator
                                        ? darkMode ? "ring-4 ring-purple-500" : "ring-4 ring-purple-300"
                                        : ""
                                }`}
                            >
                                <SubtitleGenerator
                                    lessonId={id}
                                    video={video}
                                    onSuccess={handleSubtitleUpload}
                                />
                            </div>

                            <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                                darkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                                <SubtitleUploader
                                    lessonId={id}
                                    video={video}
                                    onUploadSuccess={handleSubtitleUpload}
                                    onOpenAIGenerator={handleOpenAIGenerator}
                                />
                            </div>
                        </div>
                    )}

                    {activeTab === "summary" && (
                        <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <LessonSummary
                                lessonId={id}
                                initialSummary={lesson.summary}
                                onUpdate={handleSummaryUpdate}
                                video={video}
                            />
                        </div>
                    )}

                    {activeTab === "quiz" && (
                        <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                            darkMode ? 'bg-gray-800' : 'bg-white'
                        }`}>
                            <QuizList
                                lessonId={id}
                                isInstructor={true}
                            />
                        </div>
                    )}
                </div>

                {/* Sidebar */}
                <div className="space-y-4">
                    {/* Lesson Info Card */}
                    <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <h3 className={`font-semibold mb-4 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>معلومات الدرس</h3>
                        <dl className="space-y-2 text-sm">
                            {lesson.duration && (
                                <div>
                                    <dt className={`${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>المدة</dt>
                                    <dd className={`font-medium ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                        {lesson.duration}
                                    </dd>
                                </div>
                            )}
                            {lesson.type && (
                                <div>
                                    <dt className={`${
                                        darkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>النوع</dt>
                                    <dd className={`font-medium ${
                                        darkMode ? 'text-gray-200' : 'text-gray-900'
                                    }`}>
                                        {lesson.type}
                                    </dd>
                                </div>
                            )}
                            <div>
                                <dt className={`${
                                    darkMode ? 'text-gray-400' : 'text-gray-600'
                                }`}>الحالة</dt>
                                <dd>
                                    <span
                                        className={`inline-block px-2 py-1 text-xs rounded ${
                                            lesson.completed
                                                ? "bg-green-100 text-green-800"
                                                : "bg-yellow-100 text-yellow-800"
                                        }`}
                                    >
                                        {lesson.completed
                                            ? "مكتمل"
                                            : "غير مكتمل"}
                                    </span>
                                </dd>
                            </div>
                        </dl>
                    </div>

                    {/* Media Status Card */}
                    <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <h3 className={`font-semibold mb-4 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>حالة الوسائط</h3>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>الفيديو</span>
                                <span
                                    className={`flex items-center gap-1 ${
                                        video
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {video ? (
                                        <>
                                            <svg
                                                className="w-4 h-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            موجود
                                        </>
                                    ) : (
                                        "غير موجود"
                                    )}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>الترجمات</span>
                                <span className={`font-medium ${
                                    darkMode ? 'text-gray-200' : 'text-gray-900'
                                }`}>
                                    {video?.subtitles?.length || 0}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={darkMode ? 'text-gray-400' : 'text-gray-600'}>الملخص</span>
                                <span
                                    className={`flex items-center gap-1 ${
                                        lesson.summary
                                            ? "text-green-600"
                                            : "text-gray-400"
                                    }`}
                                >
                                    {lesson.summary ? (
                                        <>
                                            <svg
                                                className="w-4 h-4"
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path
                                                    fillRule="evenodd"
                                                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                                                    clipRule="evenodd"
                                                />
                                            </svg>
                                            موجود
                                        </>
                                    ) : (
                                        "غير موجود"
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`rounded-lg shadow p-6 transition-colors duration-300 ${
                        darkMode ? 'bg-gray-800' : 'bg-white'
                    }`}>
                        <h3 className={`font-semibold mb-4 ${
                            darkMode ? 'text-gray-100' : 'text-gray-900'
                        }`}>إجراءات سريعة</h3>
                        <div className="space-y-2">
                            {!video && (
                                <button
                                    onClick={() => setActiveTab("upload")}
                                    className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                                >
                                    رفع فيديو
                                </button>
                            )}
                            {/* <button
                                onClick={() => {
                                    setActiveTab("upload");
                                    setTimeout(() => {
                                        const section = document.getElementById(
                                            "youtube-import-section"
                                        );
                                        section?.scrollIntoView({
                                            behavior: "smooth",
                                            block: "center",
                                        });
                                    }, 100);
                                }}
                                className="w-full px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm"
                            >
                                استيراد من YouTube
                            </button> */}
                            {video &&
                                (!video.subtitles ||
                                    video.subtitles.length === 0) && (
                                    <button
                                        onClick={() => setActiveTab("upload")}
                                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                                    >
                                        إضافة ترجمة
                                    </button>
                                )}
                            {!lesson.summary && (
                                <button
                                    onClick={() => setActiveTab("summary")}
                                    className="w-full px-4 py-2 bg-purple-500 text-light rounded hover:bg-purple-600 text-sm"
                                >
                                    إضافة ملخص
                                </button>
                            )}
                            {lesson.link && (
                                <a
                                    href={lesson.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`w-full block text-center px-4 py-2 rounded text-sm transition-colors ${
                                        darkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                                    }`}
                                >
                                    فتح رابط الدرس
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </div>
    );
}
