/**
 * RE-EXPORT: Core Cinematic Scroll Library for React
 * This module re-exports the framework-agnostic core library
 */

// For development/build, you can also do a direct file import:
// import { initCinematicScroll, destroyCinematicScroll, createFadeIn, ... } from 'file-url'

// TypeScript Path Alias Solution:
// Configure in tsconfig.json:
// "paths": { "@shared/*": ["../../../shared-libs/*"] }
// Then import as: import { ... } from '@shared/cinematicScroll';

// Direct file reference - adjust based on your bundler:
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
} from '../../../shared-libs/cinematicScroll';
