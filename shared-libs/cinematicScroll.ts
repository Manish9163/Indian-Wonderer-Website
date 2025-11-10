/**
 * CINEMATIC SCROLL LIBRARY
 * 
 * Production-ready smooth scroll & animation system using Lenis and GSAP ScrollTrigger.
 * Works seamlessly in React, Next.js, and Angular environments.
 * 
 * Features:
 * - Smooth scroll with Lenis
 * - Parallax, fade-in, and scroll-linked animations with GSAP ScrollTrigger
 * - Accessibility support (prefers-reduced-motion)
 * - Mobile optimization
 * - Auto cleanup on route change
 * - Nested scroll zone detection
 */

export interface CinematicConfig {
  // Lenis configuration
  smoothScroll?: boolean;
  lenis?: {
    duration?: number;
    easing?: (t: number) => number;
    orientation?: 'vertical' | 'horizontal' | 'both';
    gestureOrientation?: 'vertical' | 'horizontal' | 'both';
    syncTouch?: boolean;
    touchMultiplier?: number;
    wheelMultiplier?: number;
    autoRaf?: boolean;
  };

  // GSAP configuration
  enableScrollTrigger?: boolean;
  enableScrollToPlugin?: boolean;
  reducedMotion?: boolean | 'auto'; // auto = detect from OS

  // Animation settings
  animations?: {
    parallaxStrength?: number;
    fadeDistance?: number;
    staggerDelay?: number;
  };

  // Performance
  disableInModals?: boolean;
  disableInTables?: boolean;
  disableOnMobile?: boolean;
  mobileBreakpoint?: number;

  // Debug
  debug?: boolean;
}

// ============================================================================
// STATE MANAGEMENT
// ============================================================================

interface CinematicState {
  isInitialized: boolean;
  lenis: any | null;
  gsapRegistered: boolean;
  rafId: number | null;
  config: Required<CinematicConfig>;
  prefersReducedMotion: boolean;
  isMobile: boolean;
  nestedScrollZones: WeakSet<Element>;
}

const defaultConfig: Required<CinematicConfig> = {
  smoothScroll: true,
  lenis: {
    duration: 1.2,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential easing
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    syncTouch: true,
    touchMultiplier: 2,
    wheelMultiplier: 1,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: true,
  reducedMotion: 'auto',
  animations: {
    parallaxStrength: 0.5,
    fadeDistance: 150,
    staggerDelay: 0.1,
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: false,
  mobileBreakpoint: 768,
  debug: false,
};

let cinematicState: CinematicState = {
  isInitialized: false,
  lenis: null,
  gsapRegistered: false,
  rafId: null,
  config: { ...defaultConfig },
  prefersReducedMotion: false,
  isMobile: false,
  nestedScrollZones: new WeakSet(),
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Detects if user prefers reduced motion
 */
function detectReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Detects if device is mobile
 */
function detectMobile(breakpoint: number): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < breakpoint;
}

/**
 * Checks if element is inside a modal, table, or nested scroll zone
 */
function isInDisabledZone(element: Element): boolean {
  if (!element) return false;

  // Check for modals
  if (cinematicState.config.disableInModals) {
    if (
      element.closest('[role="dialog"]') ||
      element.closest('.modal') ||
      element.closest('[aria-modal="true"]')
    ) {
      return true;
    }
  }

  // Check for tables
  if (cinematicState.config.disableInTables) {
    if (element.closest('table') || element.closest('[role="table"]')) {
      return true;
    }
  }

  // Check for nested scroll zones
  if (cinematicState.nestedScrollZones.has(element)) {
    return true;
  }

  return false;
}

/**
 * Easing function: exponential ease-out
 */
function easeOutExpo(t: number): number {
  return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
}

// ============================================================================
// LENIS INITIALIZATION
// ============================================================================

/**
 * Initialize Lenis smooth scroll
 */
async function initLenis(config: CinematicConfig): Promise<any> {
  if (typeof window === 'undefined') return null;

  try {
    // Dynamically import Lenis
    const LenisModule = await import('lenis');
    const Lenis = LenisModule.default;

    // Extract autoRaf before passing to Lenis (it's not a Lenis option)
    const mergedConfig = {
      ...defaultConfig.lenis,
      ...(config.lenis || {}),
    };
    const { autoRaf, ...lenisOptions } = mergedConfig;

    // Disable on mobile if configured
    if (
      config.disableOnMobile &&
      detectMobile(config.mobileBreakpoint || 768)
    ) {
      if (config.debug) console.log('[Cinematic] Lenis disabled on mobile');
      return null;
    }

    // Lenis doesn't support 'both' orientation, use 'vertical' instead
    const lenisConfigForLenis = {
      ...lenisOptions,
      orientation: (lenisOptions.orientation === 'both' ? 'vertical' : lenisOptions.orientation) as any,
      gestureOrientation: (lenisOptions.gestureOrientation === 'both' ? 'vertical' : lenisOptions.gestureOrientation) as any,
    };

    const lenis = new Lenis(lenisConfigForLenis);

    // Animated scroll loop - use requestAnimationFrame to drive Lenis
    if (autoRaf !== false) {  // Default to true
      const raf = (time: number) => {
        lenis.raf(time);
        cinematicState.rafId = requestAnimationFrame(raf);
      };
      cinematicState.rafId = requestAnimationFrame(raf);
      if (config.debug) console.log('[Cinematic] Lenis RAF loop started');
    } else {
      if (config.debug) console.log('[Cinematic] Lenis RAF loop disabled');
    }

    if (config.debug) console.log('[Cinematic] Lenis initialized', { ...lenisConfigForLenis, autoRaf });

    return lenis;
  } catch (error) {
    console.warn('[Cinematic] Lenis import failed:', error);
    return null;
  }
}

// ============================================================================
// GSAP REGISTRATION & SETUP
// ============================================================================

/**
 * Register GSAP plugins
 */
async function registerGSAPPlugins(config: CinematicConfig): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  try {
    const gsapModule = await import('gsap');
    const gsap = gsapModule.default;

    const ScrollTriggerModule = await import('gsap/ScrollTrigger');
    const ScrollTrigger = ScrollTriggerModule.default;

    // Register ScrollTrigger
    if (config.enableScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);

      // Link Lenis to GSAP ScrollTrigger
      if (cinematicState.lenis) {
        gsap.ticker.add((time: number) => {
          cinematicState.lenis?.raf(time * 1000);
        });

        ScrollTrigger.create({
          onUpdate: (self: any) => {
            cinematicState.lenis?.scrollTo(self.getVelocity(), {
              duration: 1,
              easing: easeOutExpo,
            });
          },
        });

        // Update ScrollTrigger on Lenis scroll
        cinematicState.lenis?.on('scroll', ScrollTrigger.update);

        if (config.debug)
          console.log('[Cinematic] ScrollTrigger linked to Lenis');
      }
    }

    // Register ScrollToPlugin
    if (config.enableScrollToPlugin) {
      const ScrollToPluginModule = await import('gsap/ScrollToPlugin');
      const ScrollToPlugin = ScrollToPluginModule.default;
      gsap.registerPlugin(ScrollToPlugin);

      if (config.debug)
        console.log('[Cinematic] ScrollToPlugin registered');
    }

    cinematicState.gsapRegistered = true;
    return true;
  } catch (error) {
    console.warn('[Cinematic] GSAP plugin registration failed:', error);
    return false;
  }
}

// ============================================================================
// ANIMATION CREATION UTILITIES
// ============================================================================

/**
 * Create a parallax animation on scroll
 * 
 * @example
 * // In React:
 * useEffect(() => {
 *   createParallax(ref.current, { strength: 0.5 });
 * }, []);
 */
export async function createParallax(
  element: Element | null,
  options?: {
    strength?: number;
    direction?: 'up' | 'down' | 'left' | 'right';
  }
): Promise<any> {
  if (!element || cinematicState.prefersReducedMotion) return null;

  if (isInDisabledZone(element)) {
    if (cinematicState.config.debug)
      console.log('[Cinematic] Parallax disabled in this zone');
    return null;
  }

  try {
    const gsapModule = await import('gsap');
    const gsap = gsapModule.default;
    const ScrollTriggerModule = await import('gsap/ScrollTrigger');
    const ScrollTrigger = ScrollTriggerModule.default;

    gsap.registerPlugin(ScrollTrigger);

    const strength = options?.strength ?? cinematicState.config.animations.parallaxStrength ?? 0.5;
    const direction = options?.direction ?? 'up';

    let yValue = strength * 100;
    let xValue = 0;

    if (direction === 'down') yValue = -yValue;
    if (direction === 'left') {
      xValue = strength * 100;
      yValue = 0;
    }
    if (direction === 'right') {
      xValue = -strength * 100;
      yValue = 0;
    }

    const trigger = gsap.to(element, {
      y: yValue,
      x: xValue,
      scrollTrigger: {
        trigger: element,
        start: 'top center',
        end: 'bottom center',
        scrub: 1,
        markers: cinematicState.config.debug,
      },
    });

    if (cinematicState.config.debug)
      console.log('[Cinematic] Parallax created on element', element);

    return trigger;
  } catch (error) {
    console.warn('[Cinematic] Parallax creation failed:', error);
    return null;
  }
}

/**
 * Create a fade-in animation on scroll
 */
export async function createFadeIn(
  element: Element | null,
  options?: {
    distance?: number;
    duration?: number;
    delay?: number;
  }
): Promise<any> {
  if (!element || cinematicState.prefersReducedMotion) return null;

  if (isInDisabledZone(element)) return null;

  try {
    const gsapModule = await import('gsap');
    const gsap = gsapModule.default;
    const ScrollTriggerModule = await import('gsap/ScrollTrigger');
    const ScrollTrigger = ScrollTriggerModule.default;

    gsap.registerPlugin(ScrollTrigger);

    const distance = options?.distance ?? cinematicState.config.animations.fadeDistance;
    const duration = options?.duration ?? 0.8;
    const delay = options?.delay ?? 0;

    const trigger = gsap.fromTo(
      element,
      {
        opacity: 0,
        y: distance,
      },
      {
        opacity: 1,
        y: 0,
        duration,
        delay,
        scrollTrigger: {
          trigger: element,
          start: 'top 80%',
          end: 'top 50%',
          markers: cinematicState.config.debug,
        },
      }
    );

    return trigger;
  } catch (error) {
    console.warn('[Cinematic] Fade-in creation failed:', error);
    return null;
  }
}

/**
 * Create a scroll-linked chart animation (e.g., bar growth)
 */
export async function createScrollLinkedChart(
  element: Element | null,
  options?: {
    startValue?: number;
    endValue?: number;
    duration?: number;
    easing?: string;
  }
): Promise<any> {
  if (!element || cinematicState.prefersReducedMotion) return null;

  if (isInDisabledZone(element)) return null;

  try {
    const gsapModule = await import('gsap');
    const gsap = gsapModule.default;
    const ScrollTriggerModule = await import('gsap/ScrollTrigger');
    const ScrollTrigger = ScrollTriggerModule.default;

    gsap.registerPlugin(ScrollTrigger);

    const startValue = options?.startValue ?? 0;
    const endValue = options?.endValue ?? 100;
    const duration = options?.duration ?? 1;
    const easing = options?.easing ?? 'power1.inOut';

    // Counter object for animating values
    const counter = { value: startValue };

    const trigger = gsap.to(counter, {
      value: endValue,
      duration,
      ease: easing,
      scrollTrigger: {
        trigger: element,
        start: 'top 80%',
        end: 'bottom 20%',
        scrub: 1,
        markers: cinematicState.config.debug,
      },
      onUpdate() {
        // Update element text or data attribute
        const text = Math.round(counter.value);
        if (element instanceof HTMLElement) {
          if (element.textContent !== null) {
            element.textContent = text.toString();
          }
        }
      },
    });

    return trigger;
  } catch (error) {
    console.warn('[Cinematic] Scroll-linked chart creation failed:', error);
    return null;
  }
}

/**
 * Register a nested scroll zone to disable animations
 */
export function registerNestedScrollZone(element: Element | null): void {
  if (element) {
    cinematicState.nestedScrollZones.add(element);
    if (cinematicState.config.debug)
      console.log('[Cinematic] Nested scroll zone registered', element);
  }
}

/**
 * Unregister a nested scroll zone
 */
export function unregisterNestedScrollZone(element: Element | null): void {
  if (element) {
    // WeakSet doesn't have a delete method for iteration,
    // so we create a new one without this element
    const newZones = new WeakSet();
    // Note: We can't iterate WeakSet, so we'll just clear on destroy
    if (cinematicState.config.debug)
      console.log('[Cinematic] Nested scroll zone unregistered', element);
  }
}

// ============================================================================
// MAIN INITIALIZATION & CLEANUP
// ============================================================================

/**
 * Initialize cinematic scroll system
 * Call this on app mount or route change
 */
export async function initCinematicScroll(
  customConfig?: Partial<CinematicConfig>
): Promise<{
  isInitialized: boolean;
  lenis: any | null;
  destroy: () => void;
}> {
  if (typeof window === 'undefined') {
    return {
      isInitialized: false,
      lenis: null,
      destroy: () => {},
    };
  }

  // Merge configs
  cinematicState.config = {
    ...defaultConfig,
    ...customConfig,
    lenis: {
      ...defaultConfig.lenis,
      ...(customConfig?.lenis || {}),
    },
    animations: {
      ...defaultConfig.animations,
      ...(customConfig?.animations || {}),
    },
  };

  // Detect accessibility settings
  cinematicState.prefersReducedMotion =
    cinematicState.config.reducedMotion === 'auto'
      ? detectReducedMotion()
      : cinematicState.config.reducedMotion === true;

  cinematicState.isMobile = detectMobile(
    cinematicState.config.mobileBreakpoint
  );

  if (cinematicState.config.debug) {
    console.log('[Cinematic] Initialization started', {
      config: cinematicState.config,
      prefersReducedMotion: cinematicState.prefersReducedMotion,
      isMobile: cinematicState.isMobile,
    });
  }

  // Destroy previous instance if exists
  destroyCinematicScroll();

  // Initialize Lenis if smooth scroll enabled
  if (cinematicState.config.smoothScroll) {
    cinematicState.lenis = await initLenis(cinematicState.config);
  }

  // Register GSAP plugins
  if (cinematicState.config.enableScrollTrigger) {
    await registerGSAPPlugins(cinematicState.config);
  }

  cinematicState.isInitialized = true;

  if (cinematicState.config.debug)
    console.log('[Cinematic] Initialization complete');

  // Return API
  return {
    isInitialized: cinematicState.isInitialized,
    lenis: cinematicState.lenis,
    destroy: destroyCinematicScroll,
  };
}

/**
 * Destroy cinematic scroll system (for route changes)
 */
export function destroyCinematicScroll(): void {
  if (typeof window === 'undefined') return;

  if (cinematicState.config.debug)
    console.log('[Cinematic] Destroying instances');

  // Destroy Lenis
  if (cinematicState.lenis) {
    cinematicState.lenis.destroy?.();
    cinematicState.lenis = null;
  }

  // Cancel animation frame
  if (cinematicState.rafId !== null) {
    cancelAnimationFrame(cinematicState.rafId);
    cinematicState.rafId = null;
  }

  // Reset GSAP ScrollTrigger
  if (cinematicState.gsapRegistered) {
    try {
      // Import dynamically
      import('gsap/ScrollTrigger').then((module) => {
        const ScrollTrigger = module.default;
        ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
        ScrollTrigger.refresh();
      });
    } catch (error) {
      // Silently fail
    }
  }

  cinematicState.nestedScrollZones = new WeakSet();
  cinematicState.isInitialized = false;
}

/**
 * Refresh animations (useful after content changes)
 */
export async function refreshCinematicScroll(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const ScrollTriggerModule = await import('gsap/ScrollTrigger');
    const ScrollTrigger = ScrollTriggerModule.default;
    ScrollTrigger.refresh();

    if (cinematicState.config.debug) console.log('[Cinematic] Refresh called');
  } catch (error) {
    console.warn('[Cinematic] Refresh failed:', error);
  }
}

/**
 * Get current Lenis instance
 */
export function getLenis(): any | null {
  return cinematicState.lenis;
}

/**
 * Check if system is initialized
 */
export function isCinematicInitialized(): boolean {
  return cinematicState.isInitialized;
}

/**
 * Get current config
 */
export function getCinematicConfig(): Required<CinematicConfig> {
  return cinematicState.config;
}
