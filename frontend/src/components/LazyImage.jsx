import React, { useState, useEffect, useRef } from 'react';

const LazyImage = ({ src, alt, placeholder = '/placeholder.png', className = '', rootMargin = '50px', ...props }) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const imgRef = useRef();

  useEffect(() => {
    if (!('IntersectionObserver' in window)) {
      setImageSrc(src);
      return;
    }

    let observer;
    if (imgRef.current) {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imgRef.current);
            }
          });
        },
        { rootMargin, threshold: 0.01 }
      );
      observer.observe(imgRef.current);
    }

    return () => {
      if (observer && imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [src, rootMargin]);

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={}
      onLoad={() => setImageLoaded(true)}
      loading="lazy"
      {...props}
    />
  );
};

export default LazyImage;