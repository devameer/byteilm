import React, { useRef, useEffect, useState } from 'react';

export default function EnhancedVideoPlayer({ video, darkMode }) {
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [selectedSubtitle, setSelectedSubtitle] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isBuffering, setIsBuffering] = useState(false);
  const [showVolumeSlider, setShowVolumeSlider] = useState(false);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [bufferedProgress, setBufferedProgress] = useState(0);
  const [seekAnimation, setSeekAnimation] = useState({ show: false, direction: null, side: null });
  const [isPiP, setIsPiP] = useState(false);
  const [showSubtitleMenu, setShowSubtitleMenu] = useState(false);
  const [currentSubtitleText, setCurrentSubtitleText] = useState('');

  const controlsTimeoutRef = useRef(null);
  const lastTapRef = useRef(0);
  const clickTimeoutRef = useRef(null);
  const lastClickSideRef = useRef(null);

  // Auto-hide controls
  const resetControlsTimeout = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  };

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const handleLoadedMetadata = () => {
      setDuration(videoElement.duration);
      console.log('✅ Video ready:', videoElement.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(videoElement.currentTime);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => {
      setIsPlaying(false);
      setShowControls(true);
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    const handleError = (e) => {
      console.error('❌ Video error:', videoElement.error);
    };

    const handleProgress = () => {
      if (videoElement.buffered.length > 0) {
        const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
        const bufferedPercent = (bufferedEnd / videoElement.duration) * 100;
        setBufferedProgress(bufferedPercent);
      }
    };

    videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
    videoElement.addEventListener('timeupdate', handleTimeUpdate);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('waiting', handleWaiting);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('error', handleError);
    videoElement.addEventListener('progress', handleProgress);

    return () => {
      videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
      videoElement.removeEventListener('timeupdate', handleTimeUpdate);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('waiting', handleWaiting);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('error', handleError);
      videoElement.removeEventListener('progress', handleProgress);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [isPlaying]);

  // Preload video when component mounts
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement || !video) return;

    // Trigger preload by loading the video source
    const videoUrl = video.proxy_video_url || video.video_url;
    if (videoUrl && videoElement.src !== videoUrl) {
      videoElement.load(); // Force preloading
      console.log('🎬 Video preload started:', videoUrl);
    }
  }, [video]);

  // Auto-select Arabic subtitle
  useEffect(() => {
    if (video.subtitles && video.subtitles.length > 0) {
      const arabicSubtitle = video.subtitles.find(sub => sub.language === 'ar');
      if (arabicSubtitle) {
        setSelectedSubtitle(arabicSubtitle);
      }
    }
  }, [video.subtitles]);

  // Update subtitle track - use hidden mode and capture cues for custom display
  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const tracks = videoElement.textTracks;
    
    // Hide all tracks - we'll display subtitles ourselves
    for (let i = 0; i < tracks.length; i++) {
      tracks[i].mode = 'hidden';
    }

    // Find and set up the selected track
    let activeTrack = null;
    if (selectedSubtitle) {
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i].language === selectedSubtitle.language) {
          activeTrack = tracks[i];
          activeTrack.mode = 'hidden'; // Keep hidden, we render manually
          break;
        }
      }
    }

    // Cue change handler
    const handleCueChange = () => {
      if (activeTrack && activeTrack.activeCues && activeTrack.activeCues.length > 0) {
        const cueText = activeTrack.activeCues[0].text;
        setCurrentSubtitleText(cueText);
      } else {
        setCurrentSubtitleText('');
      }
    };

    // Add cuechange listener
    if (activeTrack) {
      activeTrack.addEventListener('cuechange', handleCueChange);
    }

    return () => {
      if (activeTrack) {
        activeTrack.removeEventListener('cuechange', handleCueChange);
      }
    };
  }, [selectedSubtitle]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e) => {
      const videoElement = videoRef.current;
      if (!videoElement) return;
      
      // Don't trigger if user is typing in an input
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      switch(e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          if (videoElement.paused) {
            videoElement.play();
          } else {
            videoElement.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          videoElement.currentTime = Math.max(0, videoElement.currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          videoElement.currentTime = Math.min(videoElement.duration, videoElement.currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          videoElement.volume = Math.min(1, videoElement.volume + 0.1);
          setVolume(videoElement.volume);
          break;
        case 'ArrowDown':
          e.preventDefault();
          videoElement.volume = Math.max(0, videoElement.volume - 0.1);
          setVolume(videoElement.volume);
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          videoElement.muted = !videoElement.muted;
          setIsMuted(videoElement.muted);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen();
          } else {
            document.exitFullscreen();
          }
          break;
        case 'p':
        case 'P':
          e.preventDefault();
          if (document.pictureInPictureElement) {
            document.exitPictureInPicture();
          } else if (document.pictureInPictureEnabled) {
            videoElement.requestPictureInPicture();
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, []);

  const togglePlay = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (isPlaying) {
      videoElement.pause();
    } else {
      videoElement.play();
    }
  };

  const skip = (seconds) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;
    const newTime = videoElement.currentTime + seconds;
    videoElement.currentTime = Math.max(0, Math.min(videoElement.duration || Infinity, newTime));
  };

  const handleSeek = (e) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    const seekTime = parseFloat(e.target.value);
    videoElement.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const changeVolume = (delta) => {
    const newVolume = Math.max(0, Math.min(1, volume + delta));
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    if (newVolume > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handlePlaybackRateChange = (rate) => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    videoElement.playbackRate = rate;
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // YouTube-like click handling:
  // Single click = toggle play/pause
  // Double click on side = seek 10 seconds
  // Double click in center = toggle fullscreen (desktop only)
  const handleVideoClick = (e, side) => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapRef.current;
    
    // Check if desktop (has hover capability = not touch device)
    const isDesktop = window.matchMedia('(hover: hover)').matches;
    
    // Clear any pending single-click action
    if (clickTimeoutRef.current) {
      clearTimeout(clickTimeoutRef.current);
      clickTimeoutRef.current = null;
    }
    
    if (timeSinceLastTap < 300 && timeSinceLastTap > 0 && lastClickSideRef.current === side) {
      // Double tap detected
      if (isDesktop) {
        // On desktop: double-click toggles fullscreen
        toggleFullscreen();
      } else {
        // On mobile: double-tap seeks
        const seekAmount = side === 'right' ? 10 : -10;
        skip(seekAmount);
        setSeekAnimation({ show: true, direction: side === 'right' ? 'forward' : 'backward', side });
        setTimeout(() => setSeekAnimation({ show: false, direction: null, side: null }), 500);
      }
    } else {
      // Possible single tap - wait to see if double tap follows
      clickTimeoutRef.current = setTimeout(() => {
        togglePlay();
        resetControlsTimeout();
        clickTimeoutRef.current = null;
      }, 250);
    }
    
    lastTapRef.current = now;
    lastClickSideRef.current = side;
  };

  // Picture-in-Picture support
  const togglePiP = async () => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPiP(false);
      } else if (document.pictureInPictureEnabled) {
        await videoElement.requestPictureInPicture();
        setIsPiP(true);
      }
    } catch (err) {
      console.error('PiP error:', err);
    }
  };

  const videoUrl = video.proxy_video_url || video.video_url;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className={`select-none
 relative group outline-none ${isFullscreen ? 'fixed inset-0 z-50 bg-black' : ''}`}
      dir="ltr"
      tabIndex={0}
      onMouseMove={resetControlsTimeout}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Container */}
      <div className={`relative rounded-lg overflow-hidden ${
        darkMode ? 'bg-gray-900' : 'bg-black'
      } ${isFullscreen ? 'h-full w-full flex items-center justify-center' : ''}`}>
        <video
          ref={videoRef}
          className={`w-full ${isFullscreen ? 'h-full object-contain' : ''}`}
          crossOrigin="anonymous"
          playsInline
          preload="auto"
          style={{
            width: '100%',
            minHeight: isFullscreen ? 'auto' : '400px',
            maxHeight: isFullscreen ? '100vh' : '600px',
            aspectRatio: '16/9',
            backgroundColor: '#000',
            cursor: 'pointer'
          }}
        >
          <source src={videoUrl} type={video.mime_type || 'video/mp4'} />

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
        </video>

        {/* Loading Spinner */}
        {isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Click zones for play/pause and double-tap seeking */}
        <div className="absolute inset-0 flex z-10">
          {/* Left side - skip backward (LTR) */}
          <div
            className="w-1/2 h-full cursor-pointer"
            onClick={(e) => handleVideoClick(e, 'left')}
          />
          {/* Right side - skip forward (LTR) */}
          <div
            className="w-1/2 h-full cursor-pointer"
            onClick={(e) => handleVideoClick(e, 'right')}
          />
        </div>

        {/* Center Play Button - appears on top when paused */}
        {!isPlaying && !isBuffering && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-blue-500 rounded-full p-6 shadow-lg">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
              </svg>
            </div>
          </div>
        )}

        {/* Seek Animation Overlay */}
        {seekAnimation.show && (
          <div className={`absolute top-0 bottom-0 ${seekAnimation.side === 'right' ? 'right-0 w-1/3' : 'left-0 w-1/3'} flex items-center justify-center pointer-events-none z-15`}>
            <div className="bg-white/30 rounded-full p-4 animate-ping">
              {seekAnimation.direction === 'forward' ? (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M4 18l8.5-6L4 6v12zm9-12v12l8.5-6L13 6z"/>
                </svg>
              ) : (
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M11 18V6l-8.5 6 8.5 6zm.5-6l8.5 6V6l-8.5 6z"/>
                </svg>
              )}
            </div>
            <span className="absolute bottom-1/4 text-white text-lg font-bold">
              {seekAnimation.direction === 'forward' ? '+10' : '-10'}
            </span>
          </div>
        )}

        {/* Custom Subtitle Overlay - positioned above controls */}
        {currentSubtitleText && (
          <div 
            className="absolute left-0 right-0 z-25 flex justify-center pointer-events-none"
            style={{ bottom: '100px' }}
          >
            <div 
              className="px-4 py-2 rounded-lg text-center max-w-[80%]"
              style={{
                backgroundColor: 'rgba(0, 0, 0, 0.85)',
                color: 'white',
                fontSize: '1.25rem',
                lineHeight: '1.6',
                textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                direction: selectedSubtitle?.language === 'ar' ? 'rtl' : 'ltr'
              }}
              dangerouslySetInnerHTML={{ __html: currentSubtitleText }}
            />
          </div>
        )}

        {/* Custom Controls */}
        <div
          className={`absolute bottom-0 left-0 right-0 z-30 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
            showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
          }`}
          style={{ pointerEvents: showControls || !isPlaying ? 'auto' : 'none' }}
        >
          {/* Progress Bar */}
          <div className="px-4 pt-6 pb-2">
            <div className="relative h-1 bg-gray-700 rounded-lg group/progress">
              {/* Buffered Progress */}
              <div 
                className="absolute top-0 left-0 h-full bg-gray-500 rounded-lg transition-all"
                style={{ width: `${bufferedProgress}%` }}
              />
              {/* Playback Progress */}
              <div 
                className="absolute top-0 left-0 h-full bg-blue-500 rounded-lg transition-all"
                style={{ width: `${progress}%` }}
              />
              {/* Seek Input */}
              <input
                type="range"
                min={0}
                max={duration || 0}
                step={0.1}
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
              />
              {/* Thumb indicator */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-blue-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progress}%`, transform: 'translate(-50%, -50%)' }}
              />
            </div>
            {/* Time display - YouTube style: current / duration */}
            <div className="flex justify-between mt-1 text-xs text-white/80">
              <span>{formatTime(currentTime)} / {formatTime(duration)}</span>
              <span></span>
            </div>
          </div>

          {/* Control Buttons */}
          <div className="flex items-center justify-between px-4 pb-4">
            {/* Left Side Controls - Playback */}
            <div className="flex items-center gap-3">
              {/* Play/Pause */}
              <button
                onClick={togglePlay}
                className="text-white hover:text-blue-400 transition-colors"
              >
                {isPlaying ? (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>

              {/* Skip Backward */}
              <button
                onClick={() => skip(-10)}
                className="text-white hover:text-blue-400 transition-colors"
                title="Skip backward 10s (←)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.333 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
                </svg>
              </button>

              {/* Skip Forward */}
              <button
                onClick={() => skip(10)}
                className="text-white hover:text-blue-400 transition-colors"
                title="Skip forward 10s (→)"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.933 12.8a1 1 0 000-1.6L6.6 7.2A1 1 0 005 8v8a1 1 0 001.6.8l5.333-4zM19.933 12.8a1 1 0 000-1.6l-5.333-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.333-4z" />
                </svg>
              </button>

              {/* Volume */}
              <div
                className="relative flex items-center"
                onMouseEnter={() => setShowVolumeSlider(true)}
                onMouseLeave={() => setShowVolumeSlider(false)}
              >
                <button
                  onClick={toggleMute}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Mute (M)"
                >
                  {isMuted || volume === 0 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0L15 8.586l1.293-1.293a1 1 0 111.414 1.414L16.414 10l1.293 1.293a1 1 0 01-1.414 1.414L15 11.414l-1.293 1.293a1 1 0 01-1.414-1.414L13.586 10l-1.293-1.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : volume < 0.5 ? (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM12.293 7.293a1 1 0 011.414 0 4 4 0 010 5.656 1 1 0 01-1.414-1.414 2 2 0 000-2.828 1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M9.383 3.076A1 1 0 0110 4v12a1 1 0 01-1.707.707L4.586 13H2a1 1 0 01-1-1V8a1 1 0 011-1h2.586l3.707-3.707a1 1 0 011.09-.217zM14.657 2.929a1 1 0 011.414 0A9.972 9.972 0 0119 10a9.972 9.972 0 01-2.929 7.071 1 1 0 01-1.414-1.414A7.971 7.971 0 0017 10c0-2.21-.894-4.208-2.343-5.657a1 1 0 010-1.414zm-2.829 2.828a1 1 0 011.415 0A5.983 5.983 0 0115 10a5.984 5.984 0 01-1.757 4.243 1 1 0 01-1.415-1.415A3.984 3.984 0 0013 10a3.983 3.983 0 00-1.172-2.828 1 1 0 010-1.415z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                {/* Volume Slider - inline horizontal */}
                <div className={`overflow-hidden transition-all duration-200 ${showVolumeSlider ? 'w-20 ml-2' : 'w-0 ml-0'}`}>
                  <div className="relative h-1 bg-gray-600 rounded-full">
                    <div 
                      className="absolute top-0 left-0 h-full bg-white rounded-full"
                      style={{ width: `${volume * 100}%` }}
                    />
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={volume}
                      onChange={handleVolumeChange}
                      className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Left Side Controls */}
            <div className="flex items-center gap-3">
              {/* Playback Speed */}
              <div className="relative">
                <button
                  onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                  className="text-white hover:text-blue-400 transition-colors text-sm font-medium px-2 py-1 rounded hover:bg-white/10"
                >
                  {playbackRate}x
                </button>
                {showSpeedMenu && (
                  <div className="absolute bottom-full left-0 mb-2 bg-gray-800 rounded-lg shadow-lg overflow-hidden min-w-[80px]">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map((rate) => (
                      <button
                        key={rate}
                        onClick={() => handlePlaybackRateChange(rate)}
                        className={`w-full px-3 py-2 text-sm text-right hover:bg-blue-600 transition-colors ${
                          playbackRate === rate ? 'bg-blue-500 text-white' : 'text-gray-300'
                        }`}
                      >
                        {rate}x {rate === 1 && '(عادي)'}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Subtitle Selector */}
              {video.subtitles && video.subtitles.length > 0 && (
                <div className="relative">
                  <select
                    value={selectedSubtitle?.id || ''}
                    onChange={(e) => {
                      const subtitle = video.subtitles.find(s => s.id === parseInt(e.target.value));
                      setSelectedSubtitle(subtitle || null);
                    }}
                    className="bg-transparent text-white text-sm border border-white/30 rounded px-2 py-1 hover:bg-white/10 cursor-pointer"
                  >
                    <option value="" className="bg-gray-800">بدون ترجمة</option>
                    {video.subtitles.map(subtitle => (
                      <option key={subtitle.id} value={subtitle.id} className="bg-gray-800">
                        {subtitle.language_name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Picture-in-Picture */}
              {document.pictureInPictureEnabled && (
                <button
                  onClick={togglePiP}
                  className="text-white hover:text-blue-400 transition-colors"
                  title="Picture in Picture (P)"
                >
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {/* Main screen */}
                    <rect x="2" y="4" width="20" height="14" rx="2" />
                    {/* Small PiP window */}
                    <rect x="12" y="10" width="8" height="6" rx="1" className={isPiP ? 'fill-blue-400 stroke-blue-400' : 'fill-gray-600'} />
                  </svg>
                </button>
              )}

              {/* Fullscreen */}
              <button
                onClick={toggleFullscreen}
                className="text-white hover:text-blue-400 transition-colors"
                title="Fullscreen (F)"
              >
                {isFullscreen ? (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {/* Exit fullscreen - arrows pointing inward */}
                    <path d="M8 3v4a1 1 0 01-1 1H3M16 3v4a1 1 0 001 1h4M8 21v-4a1 1 0 00-1-1H3M16 21v-4a1 1 0 011-1h4" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    {/* Enter fullscreen - arrows pointing outward */}
                    <path d="M3 8V5a2 2 0 012-2h3M21 8V5a2 2 0 00-2-2h-3M3 16v3a2 2 0 002 2h3M21 16v3a2 2 0 01-2 2h-3" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard Shortcuts Info */}
      <div className={`mt-2 p-3 rounded-lg text-xs ${
        darkMode ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
      }`}>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <span><kbd className="px-1 bg-gray-700 text-white rounded">Space</kbd> Play/Pause</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">←</kbd> Skip -10s</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">→</kbd> Skip +10s</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">↑↓</kbd> Volume</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">M</kbd> Mute</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">F</kbd> Fullscreen</span>
          <span><kbd className="px-1 bg-gray-700 text-white rounded">P</kbd> PiP</span>
        </div>
      </div>

      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        .slider::-moz-range-thumb {
          width: 14px;
          height: 14px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
        }

        /* Subtitle styling */
        video::cue {
          background-color: rgba(0, 0, 0, 0.8);
          color: white;
          font-size: 1.25rem;
          font-family: 'Segoe UI', Tahoma, sans-serif;
          line-height: 1.5;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
        }

        /* Position subtitles above controls */
        video::-webkit-media-text-track-container {
          bottom: 80px !important;
          transform: translateY(-20px);
        }

        video::-webkit-media-text-track-display {
          bottom: 80px !important;
        }
      `}</style>
    </div>
  );
}
