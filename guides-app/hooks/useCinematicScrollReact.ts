/**
 * REACT CINEMATIC SCROLL HOOKS (for Next.js)
 * 
 * These hooks are compatible with React and can be used in Next.js 'use client' components.
 * Handles mount/unmount, route changes, and cleanup automatically.
 */

import { useEffect, useRef, useState } from 'react';
import type { CinematicConfig } from '../lib/cinematicScroll';
import {
  initCinematicScroll,
  destroyCinematicScroll,
  refreshCinematicScroll,
  getLenis,
  isCinematicInitialized,
  createFadeIn as coreCreateFadeIn,
  createParallax as coreCreateParallax,
  createScrollLinkedChart as coreCreateScrollLinkedChart,
} from '../lib/cinematicScroll';

export interface UseCinematicScrollReturn {
  lenis: any | null;
  isInitialized: boolean;
  refresh: () => Promise<void>;
  destroy: () => void;
}

/**
 * Hook: Initialize and manage cinematic scroll on component mount
 */
export function useCinematicScroll(
  config?: Partial<CinematicConfig>
): UseCinematicScrollReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lenis, setLenis] = useState<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let mounted = true;

    const initialize = async () => {
      try {
        const result = await initCinematicScroll(config);

        if (mounted) {
          setLenis(result.lenis);
          setIsInitialized(result.isInitialized);
        }
      } catch (error) {
        console.error('[Cinematic] Hook initialization failed:', error);
      }
    };

    initialize();

    return () => {
      mounted = false;
      destroyCinematicScroll();
      setIsInitialized(false);
      setLenis(null);
    };
  }, [config]);

  const refresh = async () => {
    await refreshCinematicScroll();
  };

  const destroy = () => {
    destroyCinematicScroll();
    setIsInitialized(false);
    setLenis(null);
  };

  return {
    lenis: lenis || getLenis(),
    isInitialized: isInitialized || isCinematicInitialized(),
    refresh,
    destroy,
  };
}

/**
 * Hook: Create parallax animation on an element
 */
export function useParallax(
  ref: React.RefObject<HTMLElement>,
  options?: { strength?: number; direction?: 'up' | 'down' | 'left' | 'right' }
) {
  const triggerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !isCinematicInitialized()) return;

    const createParallaxAsync = async () => {
      triggerRef.current = await coreCreateParallax(ref.current, options);
    };

    createParallaxAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Create fade-in animation on scroll
 */
export function useFadeIn(
  ref: React.RefObject<HTMLElement>,
  options?: { distance?: number; duration?: number; delay?: number }
) {
  const triggerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !isCinematicInitialized()) return;

    const createFadeInAsync = async () => {
      triggerRef.current = await coreCreateFadeIn(ref.current, options);
    };

    createFadeInAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Create scroll-linked chart animation
 */
export function useScrollLinkedChart(
  ref: React.RefObject<HTMLElement>,
  options?: {
    startValue?: number;
    endValue?: number;
    duration?: number;
    easing?: string;
  }
) {
  const triggerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !isCinematicInitialized()) return;

    const createChartAsync = async () => {
      triggerRef.current = await coreCreateScrollLinkedChart(
        ref.current,
        options
      );
    };

    createChartAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Auto-refresh animations when content changes
 */
export function useAutoRefresh(dependencies?: any[]) {
  useEffect(() => {
    refreshCinematicScroll();
  }, dependencies);
}
