
'use client'; // For Next.js

import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  useCinematicScroll,
  useFadeIn,
  useParallax,
  useScrollLinkedChart,
} from '../hooks/cinema/useCinematicScroll';
import { createFadeIn, createParallax } from '../lib/cinematicScroll';

interface CinematicScrollExampleProps {
  /**
   * Show debug information
   */
  debug?: boolean;
}

/**
 * Main component with cinematic scroll animations
 */
export const CinematicScrollExample: React.FC<CinematicScrollExampleProps> = ({
  debug = false,
}) => {
  const { lenis, isInitialized } = useCinematicScroll({
    smoothScroll: true,
    enableScrollTrigger: true,
    reducedMotion: 'auto',
    debug,
  });

  // Refs for various animation elements
  const heroRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Array<HTMLDivElement | null>>([]);
  const countersRef = useRef<Array<HTMLDivElement | null>>([]);

  // Setup fade-in animations
  useEffect(() => {
    if (!isInitialized) return;

    // Animate hero section
    if (heroRef.current) {
      createFadeIn(heroRef.current, {
        distance: 100,
        duration: 1,
        delay: 0.2,
      });
    }

    // Animate cards
    cardRefs.current.forEach((cardEl, index) => {
      if (cardEl) {
        createFadeIn(cardEl, {
          distance: 80,
          duration: 0.8,
          delay: index * 0.1,
        });

        // Add parallax
        createParallax(cardEl, {
          strength: 0.3,
          direction: 'up',
        });
      }
    });

    // Animate counters
    countersRef.current.forEach((counterEl) => {
      if (counterEl) {
        createFadeIn(counterEl, {
          distance: 50,
          duration: 0.8,
        });
      }
    });
  }, [isInitialized]);

  // Data for cards
  const cards = [
    {
      id: 1,
      title: 'Smooth Scrolling',
      description: 'Cinematic smooth scroll powered by Lenis',
      icon: '✨',
    },
    {
      id: 2,
      title: 'Parallax Effects',
      description: 'Depth and layering with scroll-linked parallax',
      icon: '🎬',
    },
    {
      id: 3,
      title: 'Scroll Animations',
      description: 'Fade-in, scale, and color transitions on scroll',
      icon: '🎨',
    },
    {
      id: 4,
      title: 'Accessible',
      description: 'Respects prefers-reduced-motion setting',
      icon: '♿',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >

      <div
        ref={heroRef}
        className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-4"
      >
        <div className="text-center space-y-4 max-w-2xl">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter">
            Cinematic Scroll
          </h1>
          <p className="text-xl md:text-2xl text-slate-300">
            Production-ready smooth scroll + animations for React & Angular
          </p>
          <div className="pt-8">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-8 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
              onClick={() => {
                if (lenis) {
                  lenis.scrollTo(window.innerHeight * 2, {
                    duration: 2,
                  });
                }
              }}
            >
              Explore →
            </motion.button>
          </div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 text-center"
        >
          <div className="text-2xl">⬇</div>
          <p className="text-sm text-slate-400 mt-2">Scroll to explore</p>
        </motion.div>
      </div>

      <div className="h-32 md:h-48"></div>


      <section className="py-20 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
              Features
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need for cinematic web animations
            </p>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {cards.map((card, index) => (
              <div
                key={card.id}
                ref={(el) => {
                  cardRefs.current[index] = el;
                }}
                className="bg-white rounded-xl shadow-lg hover:shadow-xl p-8 transition-shadow"
              >
                <div className="text-5xl mb-4">{card.icon}</div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-slate-600 text-lg">{card.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="h-32 md:h-48"></div>

      <section className="py-20 px-4 bg-slate-900 text-white">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-16">
            By The Numbers
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { label: 'Performance Score', value: 98 },
              { label: 'Compatibility %', value: 100 },
              { label: 'Bundle Size (KB)', value: 45 },
            ].map((stat, index) => (
              <div
                key={index}
                ref={(el) => {
                  countersRef.current[index] = el;
                }}
                className="text-center"
              >
                <div className="text-5xl md:text-6xl font-bold text-blue-400 mb-3">
                  {stat.value}
                </div>
                <p className="text-lg text-slate-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      <div className="h-32 md:h-48"></div>

      <section className="py-32 px-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to get started?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Implement smooth scroll animations in your React or Angular project
            today.
          </p>

          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="inline-block"
          >
            <button className="px-10 py-4 bg-white text-blue-600 font-bold rounded-lg hover:bg-blue-50 transition-colors text-lg">
              View Documentation →
            </button>
          </motion.div>
        </div>
      </section>

      {debug && (
        <div className="fixed bottom-4 right-4 bg-slate-900 text-white p-4 rounded-lg text-xs font-mono max-w-xs">
          <p>Cinematic Initialized: {isInitialized ? '✓' : '✗'}</p>
          <p>Lenis Active: {lenis ? '✓' : '✗'}</p>
          <p>Smooth Scroll: {lenis?.isStopped === false ? '✓' : '✗'}</p>
        </div>
      )}
    </motion.div>
  );
};

export default CinematicScrollExample;
