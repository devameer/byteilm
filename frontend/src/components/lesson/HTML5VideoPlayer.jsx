import React, { useRef, useEffect, useState } from 'react';

export default function HTML5VideoPlayer({ video, darkMode }) {
  console.log('🎬 HTML5VideoPlayer rendering with video:', video);

  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    console.log('🎥 Setting up HTML5 video element');

    // Event listeners
    const handleLoadedMetadata = () => {
      console.log('✅ Video metadata loaded:', {
        duration: videoElement.duration,
        videoWidth: videoElement.videoWidth,
        videoHeight: videoElement.videoHeight
      });
      setDuration(videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => {
      console.log('▶️ Video playing');
      setIsPlaying(true);
    };

    const handlePause = () => {
      console.log('⏸️ Video paused');
      setIsPlaying(false);
    };

    const handleError = (e) => {
      console.error('❌ Video error:', {
        error: videoElement.error,
        code: videoElement.error?.code,
        message: videoElement.error?.message,
        src: videoElement.currentSrc
      });
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('error', handleError);
    };
  }, []);

  // Auto-select Arabic subtitle
  useEffect(() => {
    if (video.subtitles && video.subtitles.length > 0) {
      const arabicSubtitle = video.subtitles.find(sub => sub.language === 'ar');
      if (arabicSubtitle) {
        setSelectedSubtitle(arabicSubtitle);
        console.log('🇸🇦 Auto-selected Arabic subtitle:', arabicSubtitle);
      }
    }
  }, [video.subtitles]);

  // Update subtitle track
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const tracks = videoElement.textTracks;
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }

    if (selectedSubtitle) {
      for (let i = 0; i < tracks.length; i++) {
        const track = tracks[i];
        if (track.language === selectedSubtitle.language) {
          track.mode = 'showing';
          console.log('📝 Showing subtitle:', selectedSubtitle.language_name);
          break;
        }
      }
    }
  }, [selectedSubtitle]);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const handleSeek = (e) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const seekTime = parseFloat(e.target.value);
    videoElement.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const handleVolumeChange = (e) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const newVolume = parseFloat(e.target.value);
    videoElement.volume = newVolume;
    setVolume(newVolume);
  };

  const handlePlaybackRateChange = (rate) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
    console.log('⚡ Playback rate:', rate);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const videoUrl = video.proxy_video_url || video.video_url;
  console.log('📹 Video URL:', videoUrl);

  return (
    <div className="space-y-4" dir="rtl">
      {/* Video Container */}
      <div className={`relative rounded-lg overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-black'
      }`}>
        <video
          ref={videoRef}
          className="w-full"
          crossOrigin="anonymous"
          playsInline
          style={{
            width: '100%',
            maxHeight: '600px',
            backgroundColor: '#000'
          }}
        >
          <source src={videoUrl} type={video.mime_type || 'video/mp4'} />

          {/* Subtitles */}
          {video.subtitles?.map((subtitle) => (
            <track
              key={subtitle.id}
              kind="subtitles"
              src={subtitle.proxy_vtt_url || subtitle.vtt_url}
              srcLang={subtitle.language}
              label={subtitle.language_name}
              default={subtitle.language === 'ar'}
            />
          ))}

          متصفحك لا يدعم تشغيل الفيديو
        </video>
      </div>

      {/* Custom Controls */}
      <div className={`p-4 rounded-lg ${
        darkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
      }`}>
        {/* Progress Bar */}
        <div className="mb-4">
          <input
            type="range"
            min={0}
            max={duration || 0}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to left, #3b82f6 0%, #3b82f6 ${(currentTime / duration) * 100}%, #d1d5db ${(currentTime / duration) * 100}%, #d1d5db 100%)`,
              direction: 'rtl'
            }}
          />
          <div className={`flex justify-between mt-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>{formatTime(duration)}</span>
            <span>{formatTime(currentTime)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 flex-wrap">
          {/* Play/Pause */}
          <button
            onClick={togglePlay}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isPlaying ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
            </svg>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* Playback Speed */}
          <div className="flex items-center gap-2">
            <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              السرعة:
            </span>
            <select
              value={playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className={`px-2 py-1 rounded text-sm ${
                darkMode
                  ? 'bg-gray-700 text-gray-200'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2x</option>
            </select>
          </div>

          {/* Subtitle Selector */}
          {video.subtitles && video.subtitles.length > 0 && (
            <div className="flex items-center gap-2">
              <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                الترجمة:
              </span>
              <select
                value={selectedSubtitle?.id || ''}
                onChange={(e) => {
                  const subtitle = video.subtitles.find(s => s.id === parseInt(e.target.value));
                  setSelectedSubtitle(subtitle || null);
                }}
                className={`px-3 py-1.5 rounded ${
                  darkMode
                    ? 'bg-gray-700 text-gray-200'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <option value="">بدون ترجمة</option>
                {video.subtitles.map(subtitle => (
                  <option key={subtitle.id} value={subtitle.id}>
                    {subtitle.language_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Video Info */}
      <div className={`p-3 rounded-lg text-sm ${
        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 shadow-sm'
      }`}>
        <div className="flex items-center gap-4 flex-wrap">
          <span>✅ مشغل HTML5</span>
          <span>📹 {video.mime_type || 'video/mp4'}</span>
          {video.subtitles && video.subtitles.length > 0 && (
            <span>📝 {video.subtitles.length} ترجمة</span>
          )}
        </div>
      </div>
    </div>
  );
}
