/**
 * CINEMATIC SCROLL - CONFIGURATION EXAMPLES
 * 
 * Pre-built configurations for different use cases
 * Copy and customize as needed for your project
 */

import type { CinematicConfig } from './cinematicScroll';

// ============================================================================
// DEFAULT CONFIGURATION - Balanced for most use cases
// ============================================================================

export const DEFAULT_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
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

// ============================================================================
// PERFORMANCE-FOCUSED - Minimal animations, optimized for speed
// ============================================================================

export const PERFORMANCE_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 0.8, // Faster scroll
    orientation: 'vertical',
    touchMultiplier: 1.5,
    wheelMultiplier: 0.8,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: false, // Disable ScrollToPlugin for bundle size
  reducedMotion: 'auto',
  animations: {
    parallaxStrength: 0.2, // Subtle parallax
    fadeDistance: 50,      // Short fade distance
    staggerDelay: 0.05,    // Minimal stagger
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: true,   // Disable on mobile
  mobileBreakpoint: 768,
  debug: false,
};

// ============================================================================
// CINEMA-FOCUSED - Heavy animations, dramatic effects
// ============================================================================

export const CINEMA_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 1.8, // Longer scroll
    easing: (t) => {
      // Custom cubic-bezier easing
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    },
    orientation: 'vertical',
    touchMultiplier: 2.5,
    wheelMultiplier: 1.2,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: true,
  reducedMotion: 'auto',
  animations: {
    parallaxStrength: 0.8, // Dramatic parallax
    fadeDistance: 300,     // Large fade distance
    staggerDelay: 0.15,    // Pronounced stagger
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: false,
  mobileBreakpoint: 768,
  debug: false,
};

// ============================================================================
// MOBILE-OPTIMIZED - Smooth scroll, minimal animations for mobile
// ============================================================================

export const MOBILE_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 1,
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    syncTouch: true,
    touchMultiplier: 3,    // Higher mobile sensitivity
    wheelMultiplier: 1,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: false,
  reducedMotion: 'auto',
  animations: {
    parallaxStrength: 0.2, // Subtle on mobile
    fadeDistance: 80,
    staggerDelay: 0.08,
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: false,
  mobileBreakpoint: 1024, // Treat tablet as mobile
  debug: false,
};

// ============================================================================
// ACCESSIBLE-FOCUSED - Respects user preferences, minimal motion
// ============================================================================

export const ACCESSIBLE_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 0.8,
    orientation: 'vertical',
    touchMultiplier: 2,
    wheelMultiplier: 1,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: false,
  reducedMotion: 'auto', // Always respect user preference
  animations: {
    parallaxStrength: 0.2, // Minimal parallax
    fadeDistance: 50,      // Subtle fade
    staggerDelay: 0,       // No stagger
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: true,
  mobileBreakpoint: 768,
  debug: false,
};

// ============================================================================
// DEVELOPMENT-FOCUSED - Debug enabled, verbose logging
// ============================================================================

export const DEVELOPMENT_CONFIG: CinematicConfig = {
  smoothScroll: true,
  lenis: {
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    syncTouch: true,
    touchMultiplier: 2,
    wheelMultiplier: 1,
    autoRaf: true,
  },
  enableScrollTrigger: true,
  enableScrollToPlugin: true,
  reducedMotion: false, // Force animations for testing
  animations: {
    parallaxStrength: 0.5,
    fadeDistance: 150,
    staggerDelay: 0.1,
  },
  disableInModals: true,
  disableInTables: true,
  disableOnMobile: false,
  mobileBreakpoint: 768,
  debug: true, // Enable debug logging
};

// ============================================================================
// CUSTOM CONFIGURATION BUILDERS
// ============================================================================

/**
 * Build a configuration for a specific screen size
 */
export function buildConfigForScreenSize(screenWidth: number): CinematicConfig {
  if (screenWidth < 640) {
    // Mobile
    return {
      ...MOBILE_CONFIG,
      mobileBreakpoint: 640,
    };
  } else if (screenWidth < 1024) {
    // Tablet
    return {
      ...MOBILE_CONFIG,
      mobileBreakpoint: 1024,
    };
  } else {
    // Desktop
    return DEFAULT_CONFIG;
  }
}

/**
 * Build a configuration with custom parallax strength
 */
export function buildWithParallax(strength: number): CinematicConfig {
  return {
    ...DEFAULT_CONFIG,
    animations: {
      ...DEFAULT_CONFIG.animations,
      parallaxStrength: Math.max(0, Math.min(1, strength)), // Clamp 0-1
    },
  };
}

/**
 * Build a configuration with custom animation speed
 */
export function buildWithSpeed(
  speedMultiplier: number
): CinematicConfig {
  return {
    ...DEFAULT_CONFIG,
    lenis: {
      ...DEFAULT_CONFIG.lenis,
      duration: (DEFAULT_CONFIG.lenis?.duration || 1.2) * speedMultiplier,
    },
    animations: {
      ...DEFAULT_CONFIG.animations,
      staggerDelay: (DEFAULT_CONFIG.animations?.staggerDelay || 0.1) * speedMultiplier,
    },
  };
}

/**
 * Build a configuration that disables animations in specific contexts
 */
export function buildWithDisabledZones(
  disableInModals: boolean,
  disableInTables: boolean,
  disableOnMobile: boolean
): CinematicConfig {
  return {
    ...DEFAULT_CONFIG,
    disableInModals,
    disableInTables,
    disableOnMobile,
  };
}

// ============================================================================
// PRESET CONFIGURATIONS FOR COMMON USE CASES
// ============================================================================

/**
 * E-commerce product showcase
 */
export const ECOMMERCE_CONFIG: CinematicConfig = {
  ...CINEMA_CONFIG,
  animations: {
    parallaxStrength: 0.4,
    fadeDistance: 200,
    staggerDelay: 0.12,
  },
  disableOnMobile: false,
};

/**
 * Blog or content-heavy site
 */
export const BLOG_CONFIG: CinematicConfig = {
  ...DEFAULT_CONFIG,
  animations: {
    parallaxStrength: 0.3,
    fadeDistance: 120,
    staggerDelay: 0.08,
  },
};

/**
 * SaaS dashboard (like your admin panel)
 */
export const SAAS_CONFIG: CinematicConfig = {
  ...DEFAULT_CONFIG,
  animations: {
    parallaxStrength: 0.25, // Subtle for productivity
    fadeDistance: 100,
    staggerDelay: 0.1,
  },
  disableOnMobile: true,
};

/**
 * Portfolio/creative showcase
 */
export const PORTFOLIO_CONFIG: CinematicConfig = {
  ...CINEMA_CONFIG,
  animations: {
    parallaxStrength: 0.6,
    fadeDistance: 250,
    staggerDelay: 0.2,
  },
};

/**
 * Landing page (aggressive animations)
 */
export const LANDING_CONFIG: CinematicConfig = {
  ...CINEMA_CONFIG,
  lenis: {
    ...CINEMA_CONFIG.lenis,
    duration: 2, // Very smooth
  },
  animations: {
    parallaxStrength: 0.7,
    fadeDistance: 300,
    staggerDelay: 0.2,
  },
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/*

// React Example:
import { useCinematicScroll } from '@/hooks/cinema/useCinematicScroll';
import { PERFORMANCE_CONFIG } from '@/config/cinematicConfigs';

function MyComponent() {
  const { lenis } = useCinematicScroll(PERFORMANCE_CONFIG);
  // ...
}

// Next.js Example:
import { useCinematicScrollNextjs } from '@/hooks/useCinematicScrollNextjs';
import { LANDING_CONFIG } from '@/config/cinematicConfigs';

export default function LandingPage() {
  useCinematicScrollNextjs(LANDING_CONFIG);
  // ...
}

// Angular Example:
import { CinematicScrollService } from '@/lib/cinematicScroll.service';
import { SAAS_CONFIG } from '@/config/cinematicConfigs';

@Component({...})
export class DashboardComponent implements OnInit {
  constructor(private cinematicService: CinematicScrollService) {}

  ngOnInit() {
    this.cinematicService.init(SAAS_CONFIG);
  }
}

// Custom Configuration:
const customConfig = buildWithSpeed(1.5); // 50% faster
// or
const responsiveConfig = buildConfigForScreenSize(window.innerWidth);

*/
