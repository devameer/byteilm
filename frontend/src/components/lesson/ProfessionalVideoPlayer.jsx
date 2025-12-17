import React, { useEffect, useRef, useState } from 'react';
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import './videoPlayer.css';
import 'videojs-hotkeys';

export default function ProfessionalVideoPlayer({ video, darkMode }) {
  console.log('🎯 ProfessionalVideoPlayer RENDER - Component is rendering!', { video, darkMode });

  const videoRef = useRef(null);
  const playerRef = useRef(null);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [isTheaterMode, setIsTheaterMode] = useState(false);
  const [currentPlaybackRate, setCurrentPlaybackRate] = useState(1);

  useEffect(() => {
    console.log('🎬 ProfessionalVideoPlayer useEffect triggered');
    console.log('📹 Video data:', video);
    console.log('🎮 Player ref:', playerRef.current);
    console.log('📺 Video element ref:', videoRef.current);

    // Make sure Video.js player is only initialized once
    if (!playerRef.current && videoRef.current && video) {
      console.log('✅ Starting Video.js initialization...');
      const videoElement = videoRef.current;

      // Initialize Video.js player
      const player = videojs(videoElement, {
        controls: true,
        responsive: true,
        fluid: true,
        aspectRatio: '16:9',
        playbackRates: [0.5, 0.75, 1, 1.25, 1.5, 2],
        controlBar: {
          children: [
            'playToggle',
            'volumePanel',
            'currentTimeDisplay',
            'timeDivider',
            'durationDisplay',
            'progressControl',
            'remainingTimeDisplay',
            'playbackRateMenuButton',
            'chaptersButton',
            'subtitlesButton',
            'captionsButton',
            'pictureInPictureToggle',
            'fullscreenToggle',
          ],
        },
        language: 'ar',
        languages: {
          ar: {
            'Play': 'تشغيل',
            'Pause': 'إيقاف مؤقت',
            'Current Time': 'الوقت الحالي',
            'Duration': 'المدة',
            'Remaining Time': 'الوقت المتبقي',
            'Loaded': 'تم التحميل',
            'Progress': 'التقدم',
            'Fullscreen': 'ملء الشاشة',
            'Exit Fullscreen': 'خروج من ملء الشاشة',
            'Mute': 'كتم الصوت',
            'Unmute': 'إلغاء كتم الصوت',
            'Playback Rate': 'سرعة التشغيل',
            'Subtitles': 'الترجمة',
            'Captions': 'التسميات التوضيحية',
            'Chapters': 'الفصول',
            'Quality': 'الجودة',
            'Picture-in-Picture': 'صورة داخل صورة',
            'Exit Picture-in-Picture': 'خروج من صورة داخل صورة',
            'Speed': 'السرعة',
            'Normal': 'عادي',
          },
        },
      });

      console.log('🎮 Video.js player created:', player);

      // Enable hotkeys for better keyboard control
      player.ready(() => {
        console.log('✅ Player is ready!');

        // Add hotkeys plugin
        if (typeof player.hotkeys === 'function') {
          console.log('⌨️ Adding hotkeys...');
          player.hotkeys({
            volumeStep: 0.1,
            seekStep: 5,
            enableModifiersForNumbers: false,
          });
        } else {
          console.warn('⚠️ Hotkeys plugin not available');
        }

        // Load the video source after player is ready
        const videoSource = video.proxy_video_url || video.video_url;
        const videoType = video.mime_type || 'video/mp4';

        console.log('📼 Loading video source:', {
          src: videoSource,
          type: videoType,
          proxy_url: video.proxy_video_url,
          direct_url: video.video_url
        });

        player.src({
          src: videoSource,
          type: videoType
        });

        console.log('✅ Video source loaded');

        // Add subtitle tracks programmatically
        if (video.subtitles && video.subtitles.length > 0) {
          console.log('📝 Adding subtitles:', video.subtitles.length);

          video.subtitles.forEach((subtitle, index) => {
            console.log(`📝 Adding subtitle ${index + 1}:`, {
              language: subtitle.language,
              name: subtitle.language_name,
              proxy_url: subtitle.proxy_vtt_url,
              direct_url: subtitle.vtt_url
            });

            player.addRemoteTextTrack({
              kind: 'subtitles',
              src: subtitle.proxy_vtt_url || subtitle.vtt_url,
              srclang: subtitle.language,
              label: subtitle.language_name,
            }, false);
          });

          console.log('✅ All subtitles added');

          // Auto-select Arabic subtitles if available
          const arabicSubtitle = video.subtitles.find(sub => sub.language === 'ar');
          if (arabicSubtitle) {
            console.log('🇸🇦 Auto-selecting Arabic subtitle');
            setSelectedSubtitle(arabicSubtitle);
          }
        } else {
          console.log('ℹ️ No subtitles available');
        }
      });

      // Store player instance
      playerRef.current = player;
      console.log('💾 Player instance stored');

      // Track playback rate changes
      player.on('ratechange', () => {
        const rate = player.playbackRate();
        console.log('⚡ Playback rate changed:', rate);
        setCurrentPlaybackRate(rate);
      });

      // Track when video starts loading
      player.on('loadstart', () => {
        console.log('📥 Video loading started');
      });

      // Track when metadata is loaded
      player.on('loadedmetadata', () => {
        console.log('📊 Video metadata loaded:', {
          duration: player.duration(),
          videoWidth: player.videoWidth(),
          videoHeight: player.videoHeight()
        });
      });

      // Track when video can play
      player.on('canplay', () => {
        console.log('▶️ Video can play');
      });

      // Track when video starts playing
      player.on('play', () => {
        console.log('▶️ Video started playing');
      });

      // Track when video is paused
      player.on('pause', () => {
        console.log('⏸️ Video paused');
      });

      // Error handling
      player.on('error', (error) => {
        console.error('❌ Video.js error:', error);
        const mediaError = player.error();
        if (mediaError) {
          console.error('❌ Media error details:', {
            code: mediaError.code,
            message: mediaError.message,
            type: mediaError.type,
            MEDIA_ERR_ABORTED: mediaError.MEDIA_ERR_ABORTED,
            MEDIA_ERR_NETWORK: mediaError.MEDIA_ERR_NETWORK,
            MEDIA_ERR_DECODE: mediaError.MEDIA_ERR_DECODE,
            MEDIA_ERR_SRC_NOT_SUPPORTED: mediaError.MEDIA_ERR_SRC_NOT_SUPPORTED
          });

          // Log current source
          const currentSrc = player.currentSrc();
          console.error('❌ Current video source:', currentSrc);
        }
      });

      console.log('✅ Video.js initialization complete');
    } else {
      console.log('⏭️ Skipping initialization:', {
        hasPlayerRef: !!playerRef.current,
        hasVideoRef: !!videoRef.current,
        hasVideoData: !!video
      });
    }

    // Cleanup on unmount
    return () => {
      if (playerRef.current) {
        console.log('🧹 Cleaning up Video.js player');
        playerRef.current.dispose();
        playerRef.current = null;
      }
    };
  }, [video]);

  // Update subtitle when selectedSubtitle changes
  useEffect(() => {
    if (playerRef.current) {
      const player = playerRef.current;
      const textTracks = player.textTracks();

      // Disable all tracks first
      for (let i = 0; i < textTracks.length; i++) {
        textTracks[i].mode = 'disabled';
      }

      // Enable selected track
      if (selectedSubtitle) {
        for (let i = 0; i < textTracks.length; i++) {
          const track = textTracks[i];
          if (track.language === selectedSubtitle.language) {
            track.mode = 'showing';
            break;
          }
        }
      }
    }
  }, [selectedSubtitle]);

  // Toggle theater mode
  const toggleTheaterMode = () => {
    setIsTheaterMode(!isTheaterMode);
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes) return 'غير متوفر';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(2)} ميجابايت`;
  };

  // Format duration
  const formatDuration = (seconds) => {
    if (!seconds) return 'غير متوفر';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Video Player Container */}
      <div
        className={`relative rounded-lg overflow-hidden ${
          isTheaterMode ? 'fixed inset-0 z-50 rounded-none' : ''
        } ${darkMode ? 'bg-gray-900' : 'bg-black'}`}
        style={{
          width: '100%',
          minHeight: '400px',
          display: 'block'
        }}
      >
        {/* Theater Mode Toggle Button */}
        {!isTheaterMode && (
          <button
            onClick={toggleTheaterMode}
            className={`absolute top-2 left-2 z-10 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              darkMode
                ? 'bg-gray-800 text-white hover:bg-gray-700'
                : 'bg-gray-200 text-gray-900 hover:bg-gray-300'
            }`}
            title="وضع المسرح (T)"
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
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </button>
        )}

        {isTheaterMode && (
          <button
            onClick={toggleTheaterMode}
            className="absolute top-4 left-4 z-10 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="الخروج من وضع المسرح (T)"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}

        {/* Video Element */}
        <div data-vjs-player style={{
          width: '100%',
          minHeight: '400px',
          backgroundColor: '#000',
          display: 'block',
          position: 'relative'
        }}>
          <video
            ref={videoRef}
            className="video-js vjs-big-play-centered"
            playsInline
            style={{
              width: '100%',
              height: '100%',
              minHeight: '400px'
            }}
          />
        </div>
      </div>

      {/* Enhanced Subtitle Selector */}
      {!isTheaterMode && video.subtitles && video.subtitles.length > 0 && (
        <div
          className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <h3
              className={`text-lg font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              الترجمات المتاحة
            </h3>
            <span
              className={`text-sm ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {video.subtitles.length} ترجمة
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {/* No Subtitle Button */}
            <button
              onClick={() => setSelectedSubtitle(null)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                !selectedSubtitle
                  ? darkMode
                    ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                    : 'bg-blue-500 text-white ring-2 ring-blue-300'
                  : darkMode
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              بدون ترجمة
            </button>

            {/* Subtitle Buttons */}
            {video.subtitles.map((subtitle) => (
              <button
                key={subtitle.id}
                onClick={() => setSelectedSubtitle(subtitle)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedSubtitle?.id === subtitle.id
                    ? darkMode
                      ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                      : 'bg-blue-500 text-white ring-2 ring-blue-300'
                    : darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subtitle.language_name}
              </button>
            ))}
          </div>

          {selectedSubtitle && (
            <div
              className={`mt-3 p-3 rounded-lg ${
                darkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}
            >
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-300' : 'text-blue-900'
                }`}
              >
                <span className="font-semibold">الترجمة الحالية:</span>{' '}
                {selectedSubtitle.language_name}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Video Information */}
      {!isTheaterMode && (
        <div
          className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            معلومات الفيديو
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                حجم الملف
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatFileSize(video.file_size)}
              </p>
            </div>

            <div>
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                المدة
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {formatDuration(video.duration)}
              </p>
            </div>

            <div>
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                السرعة الحالية
              </p>
              <p
                className={`text-lg font-semibold ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                {currentPlaybackRate}x
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Help */}
      {!isTheaterMode && (
        <div
          className={`p-4 rounded-lg ${
            darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}
        >
          <h3
            className={`text-lg font-semibold mb-3 ${
              darkMode ? 'text-white' : 'text-gray-900'
            }`}
          >
            اختصارات لوحة المفاتيح
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                Space
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                تشغيل/إيقاف
              </span>
            </div>

            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                F
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                ملء الشاشة
              </span>
            </div>

            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                M
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                كتم الصوت
              </span>
            </div>

            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                ←/→
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                تقديم/ترجيع 5 ثواني
              </span>
            </div>

            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                ↑/↓
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                رفع/خفض الصوت
              </span>
            </div>

            <div className="flex items-center gap-2">
              <kbd
                className={`px-2 py-1 rounded text-sm font-mono ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                T
              </kbd>
              <span
                className={`text-sm ${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                وضع المسرح
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
