/**
 * RE-EXPORT: Core Cinematic Scroll Library for Next.js
 * This module re-exports the framework-agnostic core library
 */

export {
  type CinematicConfig,
  initCinematicScroll,
  destroyCinematicScroll,
  refreshCinematicScroll,
  createParallax,
  createFadeIn,
  createScrollLinkedChart,
  registerNestedScrollZone,
  unregisterNestedScrollZone,
  getLenis,
  isCinematicInitialized,
  getCinematicConfig,
} from '../../shared-libs/cinematicScroll';
