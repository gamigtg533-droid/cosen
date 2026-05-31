import React from 'react';
import LottieModule from 'lottie-react';
import lodingAnimation from '../assets/loding.json';

const Lottie = LottieModule.default || LottieModule;

const LottieLoader = ({ size = 120, text = "Loading..." }) => {
  return (
    <div className="flex flex-col items-center justify-center w-full py-8">
      <Lottie 
        animationData={lodingAnimation} 
        loop={true} 
        style={{ width: size, height: size }} 
      />
      {text && (
        <span className="mt-2 text-sm font-medium text-gray-500 animate-pulse">
          {text}
        </span>
      )}
    </div>
  );
};

export default LottieLoader;
