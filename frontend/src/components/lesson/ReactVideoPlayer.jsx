import React, { useState, useRef } from 'react';
import ReactPlayer from 'react-player';

export default function ReactVideoPlayer({ video, darkMode }) {
  console.log('🎬 ReactVideoPlayer rendering with video:', video);

  const playerRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [seeking, setSeeking] = useState(false);

  if (!video) {
    console.error('❌ No video data provided');
    return (
      <div className={`p-8 rounded-lg text-center ${
        darkMode ? 'bg-gray-800 text-gray-300' : 'bg-white text-gray-900'
      }`}>
        <p>لا يوجد فيديو لعرضه</p>
      </div>
    );
  }

  const videoUrl = video.proxy_video_url || video.video_url;
  console.log('📹 Video URL:', videoUrl);

  const handlePlayPause = () => {
    setPlaying(!playing);
    console.log(playing ? '⏸️ Paused' : '▶️ Playing');
  };

  const handleProgress = (state) => {
    if (!seeking) {
      setPlayed(state.played);
    }
    // Update duration if available
    if (state.loadedSeconds && duration === 0) {
      const calculatedDuration = state.playedSeconds / state.played;
      if (calculatedDuration && isFinite(calculatedDuration)) {
        setDuration(calculatedDuration);
        console.log('⏱️ Duration calculated:', calculatedDuration);
      }
    }
  };

  const handleSeekMouseDown = () => {
    setSeeking(true);
  };

  const handleSeekChange = (e) => {
    setPlayed(parseFloat(e.target.value));
  };

  const handleSeekMouseUp = (e) => {
    setSeeking(false);
    playerRef.current?.seekTo(parseFloat(e.target.value));
    console.log('⏩ Seeked to:', parseFloat(e.target.value));
  };

  const handleVolumeChange = (e) => {
    setVolume(parseFloat(e.target.value));
  };

  const handlePlaybackRateChange = (rate) => {
    setPlaybackRate(rate);
    console.log('⚡ Playback rate:', rate);
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const date = new Date(seconds * 1000);
    const hh = date.getUTCHours();
    const mm = date.getUTCMinutes();
    const ss = ('0' + date.getUTCSeconds()).slice(-2);
    if (hh) {
      return `${hh}:${('0' + mm).slice(-2)}:${ss}`;
    }
    return `${mm}:${ss}`;
  };

  const currentTime = duration * played;

  // Auto-select Arabic subtitle if available
  React.useEffect(() => {
    if (video.subtitles && video.subtitles.length > 0) {
      const arabicSubtitle = video.subtitles.find(sub => sub.language === 'ar');
      if (arabicSubtitle) {
        setSelectedSubtitle(arabicSubtitle);
        console.log('🇸🇦 Auto-selected Arabic subtitle');
      }
    }
  }, [video.subtitles]);

  return (
    <div className="space-y-4">
      {/* Video Player Container */}
      <div
        className={`relative rounded-lg overflow-hidden ${
          darkMode ? 'bg-gray-900' : 'bg-black'
        }`}
        style={{
          width: '100%',
          paddingTop: '56.25%', // 16:9 aspect ratio
          position: 'relative'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%'
        }}>
          <ReactPlayer
            ref={playerRef}
            url={videoUrl}
            playing={playing}
            volume={volume}
            muted={muted}
            playbackRate={playbackRate}
            width="100%"
            height="100%"
            onProgress={handleProgress}
            onReady={() => console.log('✅ Player ready')}
            onStart={() => console.log('▶️ Video started')}
            onPlay={() => console.log('▶️ Playing')}
            onPause={() => console.log('⏸️ Paused')}
            onEnded={() => {
              setPlaying(false);
              console.log('⏹️ Video ended');
            }}
            onError={(e) => console.error('❌ Player error:', e)}
            config={{
              file: {
                attributes: {
                  crossOrigin: 'anonymous',
                  controlsList: 'nodownload',
                },
                tracks: video.subtitles?.map(subtitle => ({
                  kind: 'subtitles',
                  src: subtitle.proxy_vtt_url || subtitle.vtt_url,
                  srcLang: subtitle.language,
                  label: subtitle.language_name,
                  default: subtitle.language === 'ar'
                })) || []
              }
            }}
          />
        </div>
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
            max={0.999999}
            step="any"
            value={played}
            onMouseDown={handleSeekMouseDown}
            onChange={handleSeekChange}
            onMouseUp={handleSeekMouseUp}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${played * 100}%, #d1d5db ${played * 100}%, #d1d5db 100%)`
            }}
          />
          <div className={`flex justify-between mt-1 text-sm ${
            darkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-4 mb-4">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPause}
            className={`p-2 rounded-lg transition-colors ${
              darkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {playing ? (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>

          {/* Volume Control */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMuted(!muted)}
              className={`p-2 rounded-lg transition-colors ${
                darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
              }`}
            >
              {muted || volume === 0 ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                </svg>
              )}
            </button>
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
                setSelectedSubtitle(subtitle);
                console.log('📝 Subtitle changed:', subtitle?.language_name);
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

      {/* Video Info */}
      <div className={`p-4 rounded-lg text-sm ${
        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-white text-gray-600 shadow-sm'
      }`}>
        <div className="flex items-center gap-4">
          <span>✅ مشغل فيديو احترافي</span>
          <span>📹 {video.mime_type || 'video/mp4'}</span>
          {video.subtitles && video.subtitles.length > 0 && (
            <span>📝 {video.subtitles.length} ترجمة</span>
          )}
        </div>
      </div>
    </div>
  );
}
