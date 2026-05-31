import { useEffect, useState } from 'react';
import LottieModule from 'lottie-react';

const Lottie = LottieModule.default || LottieModule;

export default function LottieUrlRenderer({ url, className, style, loop = true }) {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    if (!url) return;
    fetch(url)
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error('Failed to load lottie:', err));
  }, [url]);

  if (!animationData) return <div className={`flex items-center justify-center animate-pulse bg-slate-100 rounded ${className}`} style={style}></div>;

  return (
    <Lottie 
      animationData={animationData} 
      loop={loop} 
      className={className} 
      style={style} 
    />
  );
}
