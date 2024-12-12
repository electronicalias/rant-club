import React, { useRef, useState, useEffect } from 'react';


interface AudioPlayerProps {
  file: Blob;
}

const AudioPlayer: React.FC<AudioPlayerProps> = ({ file }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Automatically reset to "Play" when audio ends
  const handleAudioEnd = () => {
    setIsPlaying(false);  // Switch to "Play" state
  };

  useEffect(() => {
    // Set up event listener for the audio's end
    if (audioRef.current) {
      audioRef.current.addEventListener('ended', handleAudioEnd);
    }

    // Clean up the event listener when the component unmounts or audio reference changes
    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener('ended', handleAudioEnd);
      }
    };
  }, []); // Empty dependency array means this runs once when the component mounts


  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <audio ref={audioRef} style={{ display: 'none' }}>
        <source src={URL.createObjectURL(file)} />
        Your browser does not support the audio element.
      </audio>
      <button
        onClick={togglePlayPause}
        style={{
          backgroundColor: '#444',
          color: '#fff',
          border: 'none',
          padding: '8px 16px',
          fontSize: '1rem',
          cursor: 'pointer',
          borderRadius: '4px',
          transition: 'background-color 0.3s ease',
        }}
      >
        {isPlaying ? 'Stop' : 'Play'}
      </button>
    </div>
  );
};

export default AudioPlayer;
