import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import './hero.css';
import React, { useRef, useState, useEffect } from 'react';
import { Search, MapPin } from 'lucide-react';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

interface HeroSectionProps {
  darkMode: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ darkMode, searchQuery, setSearchQuery }) => {
  const [currentIndex, setCurrentIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [loadedVideos, setLoadedVideos] = useState(0);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const totalVideos = 6;
  const nextVideoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const titleHoverRef = useRef<HTMLHeadingElement>(null);

  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const handleVideoLoad = () => {
    setLoadedVideos((prev) => prev + 1);
  };

  const upcomingVideoIndex = (currentIndex % totalVideos) + 1;

  const getVideoSource = (index: number) => {
    const videos = [
      '/mixkit-flying-over-the-taj-mahal-towards-the-sunset-33805-hd-ready.mp4',
      '/mixkit-swiss-alps-snow-background-time-lapse-4283-full-hd.mp4',
      '/mixkit-dynamic-drone-tour-of-a-beach-at-sunset-44404-full-hd.mp4',
      '/mixkit-slow-aerial-tour-through-a-mist-covered-forest-28342-full-hd.mp4',
      '/mixkit-people-pouring-a-warm-drink-around-a-campfire-513-4k.mp4',
      '/watermarked_preview.mp4'
    ];
    return videos[index - 1] || videos[0];
  };

  const getVideoContent = (index: number) => {
    const content = [
      {
        title: 'Discover',
        highlight: 'Taj Mahal',
        subtitle: 'Experience the eternal symbol of love in Agra'
      },
      {
        title: 'Conquer',
        highlight: 'The Himalayas',
        subtitle: 'Adventure awaits in the world\'s highest peaks'
      },
      {
        title: 'Explore',
        highlight: 'Goa Beaches',
        subtitle: 'Relax on pristine beaches with golden sand'
      },
      {
        title: 'Journey Through',
        highlight: 'Misty Forests',
        subtitle: 'Discover hidden valleys and ancient trails'
      },
      {
        title: 'Experience',
        highlight: 'Mountain Camps',
        subtitle: 'Connect with nature under starlit skies'
      },
      {
        title: 'Visit',
        highlight: 'Incredible India',
        subtitle: 'Your adventure starts here'
      }
    ];
    return content[index - 1] || content[0];
  };
  
  const currentContent = getVideoContent(currentIndex);

  // mouse tracking 
  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  // Subtitle
  useEffect(() => {
    const subtitle = subtitleRef.current;
    const overlay = textRef.current;

    if (!subtitle || !overlay) return;

    const handleMove = (e: MouseEvent) => {
      const rect = subtitle.getBoundingClientRect();
      const relX = e.clientX - rect.left;
      const width = Math.max(0, Math.min(relX, rect.width));

      gsap.to(overlay, {
        width,
        duration: 0.15,
        ease: 'power3.out'
      });
    };

    const reset = () => {
      gsap.to(overlay, {
        width: 0,
        duration: 0.3,
        ease: 'power2.inOut'
      });
    };

    subtitle.addEventListener('mousemove', handleMove);
    subtitle.addEventListener('mouseleave', reset);

    return () => {
      subtitle.removeEventListener('mousemove', handleMove);
      subtitle.removeEventListener('mouseleave', reset);
    };
  }, []);

  // Title 
  useEffect(() => {
    const el = titleHoverRef.current;
    if (!el) return;

    const onEnter = () => {
      gsap.to(el, {
        scale: 1.05,
        filter: 'drop-shadow(0px 0px 25px rgba(140,140,255,0.6))',
        ease: 'power3.out'
      });

      gsap.to('.special-font', {
        backgroundPosition: '50% 0',
        ease: 'power2.inOut'
      });
    };

    const onLeave = () => {
      gsap.to(el, {
        scale: 1,
        filter: 'drop-shadow(0 0 0 rgba(0,0,0,0))',
        ease: 'power1.inOut'
      });

      gsap.to('.special-font', {
        backgroundPosition: '0% 0',
        ease: 'power1.inOut'
      });
    };

    el.addEventListener('mouseenter', onEnter);
    el.addEventListener('mouseleave', onLeave);

    return () => {
      el.removeEventListener('mouseenter', onEnter);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, []);

  // cursor glow
  useGSAP(
    () => {
      if (typeof window === 'undefined') return;

      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      const relX = mouse.x - centerX;
      const relY = mouse.y - centerY;

      gsap.to('.layer-bg', {
        x: relX * 0.005,
        y: relY * 0.005,
        duration: 0.8,
        ease: 'expo.out'
      });
      gsap.to('.layer-mid', {
        x: relX * 0.01,
        y: relY * 0.01,
        duration: 0.8,
        ease: 'expo.out'
      });
      gsap.to('.layer-fg', {
        x: relX * 0.015,
        y: relY * 0.015,
        duration: 0.8,
        ease: 'expo.out'
      });

      if (titleRef.current) {
        gsap.to(titleRef.current, {
          x: relX * 0.01,
          y: relY * 0.01,
          duration: 0.8,
          ease: 'power3.inOut'
        });
      }

      if (heroContentRef.current) {
        gsap.to(heroContentRef.current, {
          rotateY: relX * 0.02,
          rotateX: -relY * 0.02,
          transformPerspective: 800,
          transformOrigin: 'center center',
          duration: 0.8,
          ease: 'power1.inOut'
        });
      }

      gsap.to('.floating-particles', {
        y: '+=40',
        x: '+=20',
        opacity: 0.6,
        duration: 6,
        ease: 'power1.inOut',
        repeat: -1,
        yoyo: true
      });

      gsap.to('.cursor-glow', {
        x: mouse.x - 200,
        y: mouse.y - 200,
        duration: 0.4,
        ease: 'power1.inOut'
      });

      gsap.to('#mini-video-container', {
        x: relX * 0.02,
        y: relY * 0.02,
        duration: 0.8,
        ease: 'power1.inOut'
      });
    },
    { scope: containerRef, dependencies: [mouse] }
  );

  // mini video preview 
  const handlePortalEnter = () => {
    

    const tl = gsap.timeline({
      defaults: { ease: 'power3.in' }
    });

    tl.set('#mini-video-container', { pointerEvents: 'none' });

    //  portal grow + unblur + glow
    tl.to('#mini-video-container', {
      scale: 1.1,
      opacity: 0.6,
      boxShadow: '0 0 50px rgba(0,180,255,0.7)',
      duration: 0.6,
      ease: 'power1.inOut'
    });

    // expansion 
    tl.to('#mini-video-container', {
      scale: 5,
      x :100,
      y : 100,
      opacity: 1,
      duration: 1,
      ease: 'power1.inOut'
    });

    // fade out 
    tl.to('#mini-video-container', {
      opacity: 0,
      ease: 'power1.Out'
    });

    tl.add(() => {
      setCurrentIndex(upcomingVideoIndex);
    });

    tl.fromTo(
      '#current-video',
      { scale: 1.4, opacity: 0 },
      {
        scale: 1,
        opacity: 1,
        duration: 1.1,
        ease: 'power1.inOut'
      }
    );

    // hide mini-video 
    tl.to('#mini-video-container', {
      opacity: 0,
      scale: 1,
      ease: "power2.Out"
    });

    tl.set('#mini-video-container', {
      scale: 1,
      boxShadow: "none",
      pointerEvents: "auto",
      clearProps: "opacity"
    });

    // update video 
    tl.add(() => {
      const nextIdx = (upcomingVideoIndex % totalVideos) + 1;
      if (nextVideoRef.current) {
        const video = nextVideoRef.current;
        
        // Update source
        video.src = getVideoSource(nextIdx);
        
        // Wait for loadeddata event before playing
        const handleLoaded = () => {
          const playPromise = video.play();
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.log('video play prevented:', error);
            });
          }
          video.removeEventListener('loadeddata', handleLoaded);
        };
        
        video.addEventListener('loadeddata', handleLoaded);
        video.load();
      }
    });
  };

  return (
    <div ref={containerRef} className='relative h-screen w-full overflow-hidden bg-black'>
      {/* Cursor */}
      <div className="cursor-glow" />

      {/* Loading Screen */}
      {isLoading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="text-center">
            <div className="relative mb-8">
              <div className="w-24 h-24 mx-auto">
                <div className="absolute inset-0 border-4 border-transparent border-t-blue-500 border-r-purple-500 rounded-full animate-spin"></div>
                <div className="absolute inset-2 border-4 border-transparent border-b-pink-500 border-l-blue-400 rounded-full animate-spin-slow"></div>
                <div className="absolute inset-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <MapPin className="text-white" size={32} />
                </div>
              </div>
            </div>

            <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 animate-pulse">
              Incredible India
            </h2>
            <p className="text-white text-lg mb-6 animate-pulse">Preparing Your Journey...</p>

            <div className="w-64 h-2 bg-gray-800 rounded-full mx-auto overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-loading-bar"></div>
            </div>

            <p className="text-gray-400 text-sm mt-4 animate-fade-in">
              ✨ Discover breathtaking destinations
            </p>
          </div>
        </div>
      )}

      {/* Parallax Layers */}
      <div className="layer layer-bg" />
      <div className="layer layer-mid" />
      <div className="layer layer-fg" />
      <div className="floating-particles" />

      {/* Main Video Frame */}
      <div id='video-frame' className='relative z-0 h-full w-full'>
        {/* Background Video */}
        <video
          id='current-video'
          src={getVideoSource(currentIndex)}
          autoPlay
          muted
          loop
          playsInline
          preload='metadata'
          poster={getVideoSource(currentIndex) + '#t=0.1'}
          className='video absolute inset-0 w-full h-full object-cover will-change-auto'
          style={{ transform: 'translateZ(0)' }}
          onLoadedData={handleVideoLoad}
        />


        <div
          ref={heroContentRef}
          id="hero-content"
          className='relative z-20 h-full flex flex-col items-center justify-center px-4 group/hero'
        >
          {/* Main Heading */}
          <h1
            ref={titleHoverRef}
            className='hero-heading text-5xl md:text-7xl lg:text-8xl font-black text-white text-center mb-6 text-shadow-strong'
          >
            <span className='text-white'>{currentContent.title}</span>
            <br />
            <span className='special-font bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400'>
              {currentContent.highlight}
            </span>
          </h1>

          {/* Subtitle */}
          <p
            ref={subtitleRef}
            className="subtitle-wrapper text-xl md:text-2xl text-gray-200 text-center mb-8 max-w-3xl relative inline-block"
          >
            <span className="subtitle-base">
              {currentContent.subtitle}
            </span>

            <span ref={textRef} className="subtitle-fill">
              {currentContent.subtitle}
            </span>
          </p>

          {/*  mini video  */}
          <div className='relative w-80 h-48 md:w-96 md:h-56 mb-8'>
            <div
              id='mini-video-container'
              onClick={handlePortalEnter}
              className='group video-frame-container absolute inset-0 rounded-2xl overflow-hidden cursor-pointer opacity-0 hover:opacity-100 transition-all duration-500'
            >
              <video
                id='next-video'
                ref={nextVideoRef}
                src={getVideoSource(upcomingVideoIndex)}
                muted
                className='video w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700'
              />
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className='absolute bottom-8 right-8 z-30 group/search'>
          <div className='glass-effect p-4 rounded-full cursor-pointer group-hover/search:hidden transition-all duration-300 shadow-xl'>
            <div className='flex items-center gap-3 px-4'>
              <Search className='text-white' size={24} />
              <span className='text-white font-semibold'>Search</span>
              <MapPin className='text-blue-400' size={20} />
            </div>
          </div>

          <div className='hidden group-hover/search:block glass-effect p-6 rounded-3xl floating transition-all duration-300 animate-in w-96 shadow-2xl'>
            <div className='flex gap-4 items-center flex-col'>
              <div className='relative w-full'>
                <MapPin className='absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-400' size={20} />
                <input
                  type='text'
                  placeholder='Where do you want to explore?'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className='w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent backdrop-blur-md transition-all'
                  autoFocus
                />
              </div>
              <button className='bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 transition-all transform hover:scale-105 shadow-lg w-full justify-center'>
                <Search size={20} />
                <span>Search</span>
              </button>
            </div>

            <div className='mt-4 flex flex-wrap gap-2 justify-center'>
              {['Taj Mahal', 'Himalayas', 'Kerala', 'Goa', 'Rajasthan'].map((place) => (
                <button
                  key={place}
                  onClick={() => setSearchQuery(place)}
                  className='px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full text-white text-sm font-medium transition-all transform hover:scale-105 backdrop-blur-md'
                >
                  {place}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export { HeroSection };
