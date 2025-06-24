import React from 'react';
import '../styles/Landing.css';
import video_frame from '../assets/video_frame.png'
const Walkthrough = () => {
  return (
    <div className="walkthrough-section" id="walkthrough">
      <h2>Walkthrough Video</h2>
      <div className="walkthrough-content">
        <img src={video_frame} alt="YouTube" className="youtube-logo" />
        <p>Watch our quick demo to see how B.R.A.D. protects you online!</p>
        <a 
          href="https://www.youtube.com/watch?v=your-demo-video-link" 
          target="_blank" 
          rel="noopener noreferrer"
          className="watch-button"
        >
          Watch Now
        </a>
      </div>
    </div>
  );
};

export default Walkthrough;
