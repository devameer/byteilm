import React from 'react';

export default function SimpleVideoPlayer({ video, darkMode }) {
  console.log('🔥 SimpleVideoPlayer RENDERING', { video });

  if (!video) {
    return <div style={{
      padding: '2rem',
      backgroundColor: '#ef4444',
      color: 'white',
      fontSize: '1.5rem'
    }}>
      NO VIDEO DATA!
    </div>;
  }

  return (
    <div style={{
      width: '100%',
      minHeight: '400px',
      backgroundColor: '#000',
      padding: '1rem',
      border: '5px solid #00ff00'  // Green border for debugging
    }}>
      <h1 style={{ color: '#00ff00', fontSize: '2rem' }}>
        ✅ VIDEO PLAYER IS HERE!
      </h1>

      <div style={{
        backgroundColor: '#fff',
        padding: '1rem',
        color: '#000',
        marginTop: '1rem'
      }}>
        <h2>Video Info:</h2>
        <p><strong>proxy_video_url:</strong> {video.proxy_video_url}</p>
        <p><strong>mime_type:</strong> {video.mime_type}</p>
        <p><strong>subtitles:</strong> {video.subtitles?.length || 0}</p>
      </div>

      <video
        controls
        style={{
          width: '100%',
          marginTop: '1rem',
          backgroundColor: '#333'
        }}
        src={video.proxy_video_url || video.video_url}
      >
        Your browser does not support video.
      </video>
    </div>
  );
}
