/**
 * REACT CINEMATIC SCROLL HOOK
 * 
 * Production-ready React hook for smooth scroll animations using Lenis and GSAP.
 * Handles mount/unmount, route changes, and cleanup automatically.
 * 
 * Usage in React functional components:
 * 
 * const MyComponent = () => {
 *   const { lenis } = useCinematicScroll({
 *     smoothScroll: true,
 *     enableScrollTrigger: true,
 *   });
 * 
 *   useEffect(() => {
 *     // Create animations
 *     createParallax(ref.current, { strength: 0.5 });
 *   }, []);
 * };
 */

import { useEffect, useRef, useState } from 'react';
import type { CinematicConfig } from '../../lib/cinematicScroll';
import {
  initCinematicScroll,
  destroyCinematicScroll,
  refreshCinematicScroll,
  getLenis,
  isCinematicInitialized,
} from '../../lib/cinematicScroll';

export interface UseCinematicScrollReturn {
  lenis: any | null;
  isInitialized: boolean;
  refresh: () => Promise<void>;
  destroy: () => void;
}

/**
 * Hook: Initialize and manage cinematic scroll on component mount
 * 
 * @example
 * useCinematicScroll({ smoothScroll: true, enableScrollTrigger: true });
 */
export function useCinematicScroll(
  config?: Partial<CinematicConfig>
): UseCinematicScrollReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lenis, setLenis] = useState<any>(null);
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in React Strict Mode
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

    // Cleanup on unmount
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
 * 
 * @example
 * const ref = useRef(null);
 * useParallax(ref, { strength: 0.5, direction: 'up' });
 */
export function useParallax(
  ref: React.RefObject<HTMLElement>,
  options?: { strength?: number; direction?: 'up' | 'down' | 'left' | 'right' }
) {
  const triggerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !isCinematicInitialized()) return;

    const createParallaxAsync = async () => {
      const { createParallax } = await import('../../lib/cinematicScroll');
      triggerRef.current = await createParallax(ref.current, options);
    };

    createParallaxAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Create fade-in animation on scroll
 * 
 * @example
 * const ref = useRef(null);
 * useFadeIn(ref, { distance: 150, duration: 0.8 });
 */
export function useFadeIn(
  ref: React.RefObject<HTMLElement>,
  options?: { distance?: number; duration?: number; delay?: number }
) {
  const triggerRef = useRef<any>(null);

  useEffect(() => {
    if (!ref.current || !isCinematicInitialized()) return;

    const createFadeInAsync = async () => {
      const { createFadeIn } = await import('../../lib/cinematicScroll');
      triggerRef.current = await createFadeIn(ref.current, options);
    };

    createFadeInAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Create scroll-linked chart animation
 * 
 * @example
 * const ref = useRef(null);
 * useScrollLinkedChart(ref, { startValue: 0, endValue: 100 });
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
      const { createScrollLinkedChart } = await import('../../lib/cinematicScroll');
      triggerRef.current = await createScrollLinkedChart(ref.current, options);
    };

    createChartAsync();

    return () => {
      // Cleanup is handled by destroyCinematicScroll
    };
  }, [options]);
}

/**
 * Hook: Auto-refresh animations when content changes
 * Useful for dynamic content or pagination
 * 
 * @example
 * useAutoRefresh(dependencies);
 */
export function useAutoRefresh(dependencies?: any[]) {
  useEffect(() => {
    refreshCinematicScroll();
  }, dependencies);
}

/**
 * Hook: Handle route changes and re-initialize cinematic scroll
 * Use in layout or router component
 * 
 * @example
 * useRouteChangeCinematic(() => {
 *   console.log('Route changed, scroll reset');
 * });
 */
export function useRouteChangeCinematic(
  callback?: () => void,
  config?: Partial<CinematicConfig>
) {
  const prevPathRef = useRef<string>('');

  useEffect(() => {
    const currentPath = window.location.pathname;

    if (prevPathRef.current !== currentPath && prevPathRef.current !== '') {
      // Route changed
      destroyCinematicScroll();

      // Reinitialize
      initCinematicScroll(config).then(() => {
        callback?.();
      });
    }

    prevPathRef.current = currentPath;
  }, [callback, config]);
}
