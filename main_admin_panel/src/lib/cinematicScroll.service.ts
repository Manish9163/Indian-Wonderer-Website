import { Injectable, OnDestroy, NgZone } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';

export interface CinematicConfig {
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
  enableScrollTrigger?: boolean;
  enableScrollToPlugin?: boolean;
  reducedMotion?: boolean | 'auto';
  animations?: {
    parallaxStrength?: number;
    fadeDistance?: number;
    staggerDelay?: number;
  };
  disableInModals?: boolean;
  disableInTables?: boolean;
  disableOnMobile?: boolean;
  mobileBreakpoint?: number;
  debug?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class CinematicScrollService implements OnDestroy {
  private destroy$ = new Subject<void>();
  private lenis: any = null;
  private gsapRegistered = false;
  private isInitialized = false;
  private prefersReducedMotion = false;
  private isMobile = false;
  private rafId: number | null = null;
  private config: CinematicConfig = {
    smoothScroll: true,
    lenis: {
      duration: 1.2,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

  constructor(private router: Router, private ngZone: NgZone) {
    // Handle route changes
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.ngZone.runOutsideAngular(() => {
          this.destroy();
          setTimeout(() => {
            this.ngZone.runOutsideAngular(() => {
              this.init(this.config);
            });
          }, 100);
        });
      });
  }

  /**
   * Initialize cinematic scroll system
   */
  public async init(customConfig?: Partial<CinematicConfig>): Promise<void> {
    this.ngZone.runOutsideAngular(async () => {
      if (this.isInitialized) {
        this.destroy();
      }

      // Merge configs - properly deep merge lenis config
      this.config = {
        ...this.config,
        ...customConfig,
        lenis: {
          ...this.config.lenis,
          ...(customConfig?.lenis || {}),
        },
        animations: {
          ...this.config.animations,
          ...(customConfig?.animations || {}),
        },
      };

      // Detect accessibility settings
      this.prefersReducedMotion =
        this.config.reducedMotion === 'auto'
          ? this.detectReducedMotion()
          : this.config.reducedMotion === true;

      this.isMobile = this.detectMobile();

      if (this.config.debug) {
        console.log('[Angular Cinematic] Initialization started', {
          config: this.config,
          prefersReducedMotion: this.prefersReducedMotion,
          isMobile: this.isMobile,
        });
      }

      // Initialize Lenis
      if (this.config.smoothScroll) {
        this.lenis = await this.initLenis();
      }

      // Register GSAP plugins
      if (this.config.enableScrollTrigger) {
        await this.registerGSAPPlugins();
      }

      this.isInitialized = true;

      if (this.config.debug) {
        console.log('[Angular Cinematic] Initialization complete');
      }
    });
  }

  /**
   * Destroy cinematic scroll system
   */
  public destroy(): void {
    if (this.lenis) {
      this.lenis.destroy?.();
      this.lenis = null;
    }

    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    if (this.gsapRegistered) {
      try {
        import('gsap/ScrollTrigger').then((module) => {
          const ScrollTrigger = module.default;
          ScrollTrigger.getAll().forEach((trigger: any) => trigger.kill());
          ScrollTrigger.refresh();
        });
      } catch (error) {
        // Silently fail
      }
    }

    this.isInitialized = false;

    if (this.config.debug) {
      console.log('[Angular Cinematic] Destroyed');
    }
  }

  /**
   * Create parallax animation on scroll
   */
  public async createParallax(
    element: HTMLElement,
    options?: {
      strength?: number;
      direction?: 'up' | 'down' | 'left' | 'right';
    }
  ): Promise<any> {
    if (!element || this.prefersReducedMotion) return null;

    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(async () => {
        try {
          const gsapModule = await import('gsap');
          const gsap = gsapModule.default;
          const ScrollTriggerModule = await import('gsap/ScrollTrigger');
          const ScrollTrigger = ScrollTriggerModule.default;

          gsap.registerPlugin(ScrollTrigger);

          const strength = options?.strength ?? 0.5;
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
              markers: this.config.debug,
            },
          });

          if (this.config.debug) {
            console.log('[Angular Cinematic] Parallax created', element);
          }

          resolve(trigger);
        } catch (error) {
          console.warn(
            '[Angular Cinematic] Parallax creation failed:',
            error
          );
          resolve(null);
        }
      });
    });
  }

  /**
   * Create fade-in animation on scroll
   */
  public async createFadeIn(
    element: HTMLElement,
    options?: {
      distance?: number;
      duration?: number;
      delay?: number;
    }
  ): Promise<any> {
    if (!element || this.prefersReducedMotion) return null;

    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(async () => {
        try {
          const gsapModule = await import('gsap');
          const gsap = gsapModule.default;
          const ScrollTriggerModule = await import('gsap/ScrollTrigger');
          const ScrollTrigger = ScrollTriggerModule.default;

          gsap.registerPlugin(ScrollTrigger);

          const distance = options?.distance ?? 150;
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
                markers: this.config.debug,
              },
            }
          );

          resolve(trigger);
        } catch (error) {
          console.warn('[Angular Cinematic] Fade-in creation failed:', error);
          resolve(null);
        }
      });
    });
  }

  /**
   * Create scroll-linked chart animation
   */
  public async createScrollLinkedChart(
    element: HTMLElement,
    options?: {
      startValue?: number;
      endValue?: number;
      duration?: number;
      easing?: string;
    }
  ): Promise<any> {
    if (!element || this.prefersReducedMotion) return null;

    return new Promise((resolve) => {
      this.ngZone.runOutsideAngular(async () => {
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
              markers: this.config.debug,
            },
            onUpdate() {
              const text = Math.round(counter.value);
              if (element.textContent !== null) {
                element.textContent = text.toString();
              }
            },
          });

          resolve(trigger);
        } catch (error) {
          console.warn(
            '[Angular Cinematic] Scroll-linked chart failed:',
            error
          );
          resolve(null);
        }
      });
    });
  }

  /**
   * Refresh animations
   */
  public async refresh(): Promise<void> {
    this.ngZone.runOutsideAngular(async () => {
      try {
        const ScrollTriggerModule = await import('gsap/ScrollTrigger');
        const ScrollTrigger = ScrollTriggerModule.default;
        ScrollTrigger.refresh();

        if (this.config.debug) {
          console.log('[Angular Cinematic] Refresh called');
        }
      } catch (error) {
        console.warn('[Angular Cinematic] Refresh failed:', error);
      }
    });
  }

  /**
   * Get current Lenis instance
   */
  public getLenis(): any {
    return this.lenis;
  }

  /**
   * Check if initialized
   */
  public isInitializedCheck(): boolean {
    return this.isInitialized;
  }

  ngOnDestroy(): void {
    this.destroy();
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  private detectReducedMotion(): boolean {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  private detectMobile(): boolean {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < (this.config.mobileBreakpoint || 768);
  }

  private async initLenis(): Promise<any> {
    try {
      const LenisModule = await import('lenis');
      const Lenis = LenisModule.default;

      // Extract autoRaf before passing to Lenis (it's not a Lenis option)
      const mergedConfig = {
        ...this.config.lenis,
      };
      const { autoRaf, ...lenisOptions } = mergedConfig;

      if (
        this.config.disableOnMobile &&
        this.isMobile
      ) {
        if (this.config.debug) {
          console.log('[Angular Cinematic] Lenis disabled on mobile');
        }
        return null;
      }

      // Lenis doesn't support 'both' orientation, use 'vertical' instead
      const lenisConfigForLenis = {
        ...lenisOptions,
        orientation: (lenisOptions.orientation === 'both' ? 'vertical' : lenisOptions.orientation) as any,
        gestureOrientation: (lenisOptions.gestureOrientation === 'both' ? 'vertical' : lenisOptions.gestureOrientation) as any,
      };

      const lenis = new Lenis(lenisConfigForLenis);

      if (autoRaf !== false) {  // Default to true
        const raf = (time: number) => {
          lenis.raf(time);
          this.rafId = requestAnimationFrame(raf);
        };
        this.rafId = requestAnimationFrame(raf);
        if (this.config.debug) console.log('[Angular Cinematic] Lenis RAF loop started');
      } else {
        if (this.config.debug) console.log('[Angular Cinematic] Lenis RAF loop disabled');
      }

      if (this.config.debug) {
        console.log('[Angular Cinematic] Lenis initialized', { ...lenisConfigForLenis, autoRaf });
      }

      return lenis;
    } catch (error) {
      console.warn('[Angular Cinematic] Lenis import failed:', error);
      return null;
    }
  }

  private async registerGSAPPlugins(): Promise<void> {
    try {
      const gsapModule = await import('gsap');
      const gsap = gsapModule.default;

      const ScrollTriggerModule = await import('gsap/ScrollTrigger');
      const ScrollTrigger = ScrollTriggerModule.default;

      gsap.registerPlugin(ScrollTrigger);

      if (this.config.enableScrollToPlugin) {
        const ScrollToPluginModule = await import('gsap/ScrollToPlugin');
        const ScrollToPlugin = ScrollToPluginModule.default;
        gsap.registerPlugin(ScrollToPlugin);

        if (this.config.debug) {
          console.log('[Angular Cinematic] ScrollToPlugin registered');
        }
      }

      this.gsapRegistered = true;

      if (this.config.debug) {
        console.log('[Angular Cinematic] GSAP plugins registered');
      }
    } catch (error) {
      console.warn(
        '[Angular Cinematic] GSAP plugin registration failed:',
        error
      );
    }
  }
}
