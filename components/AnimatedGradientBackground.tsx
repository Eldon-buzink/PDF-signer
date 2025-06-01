import React from 'react';

const AnimatedGradientBackground = () => (
  <div className="absolute inset-0 -z-10 overflow-hidden">
    <div className="w-full h-full">
      <div className="stripe-gradient" />
    </div>
    <style jsx>{`
      .stripe-gradient {
        position: absolute;
        width: 150vw;
        height: 150vh;
        left: -25vw;
        top: -25vh;
        background: radial-gradient(circle at 20% 30%, #80eaff 0%, transparent 70%),
                    radial-gradient(circle at 80% 70%, #a259ff 0%, transparent 70%),
                    radial-gradient(circle at 50% 50%, #ff6bcb 0%, transparent 70%);
        filter: blur(80px);
        opacity: 0.7;
        animation: moveGradient 12s ease-in-out infinite alternate;
      }
      @keyframes moveGradient {
        0% {
          transform: scale(1) translate(0px, 0px);
        }
        100% {
          transform: scale(1.1) translate(-40px, 40px);
        }
      }
    `}</style>
  </div>
);

export default AnimatedGradientBackground; 