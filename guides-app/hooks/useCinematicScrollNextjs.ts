/**
 * NEXT.JS CINEMATIC SCROLL HOOKS
 * 
 * Extended version of React hooks with Next.js router integration
 */

import { useEffect, useRef, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import type { CinematicConfig } from '../lib/cinematicScroll';
import {
  initCinematicScroll,
  destroyCinematicScroll,
  refreshCinematicScroll,
  getLenis,
  isCinematicInitialized,
} from '../lib/cinematicScroll';

export interface UseCinematicScrollReturn {
  lenis: any | null;
  isInitialized: boolean;
  refresh: () => Promise<void>;
  destroy: () => void;
}

/**
 * Next.js Hook: Initialize cinematic scroll with automatic route change handling
 */
export function useCinematicScrollNextjs(
  config?: Partial<CinematicConfig>
): UseCinematicScrollReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [lenis, setLenis] = useState<any>(null);
  const pathname = usePathname();
  const initRef = useRef(false);

  // Initialize on mount
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
        console.error('[Cinematic] NextJS hook initialization failed:', error);
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

  // Handle route changes
  useEffect(() => {
    // Destroy on route change
    destroyCinematicScroll();

    // Re-initialize after route change
    let timeoutId: NodeJS.Timeout;
    timeoutId = setTimeout(async () => {
      const result = await initCinematicScroll(config);
      setLenis(result.lenis);
      setIsInitialized(result.isInitialized);
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [pathname, config]);

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

// Re-export React hooks (local copy in guides-app for consistency)
export {
  useFadeIn,
  useParallax,
  useScrollLinkedChart,
  useAutoRefresh,
} from '../hooks/useCinematicScrollReact';
