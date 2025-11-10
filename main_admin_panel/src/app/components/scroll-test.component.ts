/**
 * SCROLL MOTION TEST COMPONENT
 * 
 * Use this component to quickly test if scroll animations are working.
 * 
 * Installation:
 * 1. Import this component in your Angular component
 * 2. Add it to your template
 * 3. Open browser DevTools console
 * 4. Look for [TEST] log messages
 * 5. Scroll the page and watch animations trigger
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CinematicScrollService } from '../../lib/cinematicScroll.service';

@Component({
  selector: 'app-scroll-test',
  template: `
    <div style="padding: 20px; font-family: monospace;">
      <!-- Header -->
      <div style="
        background: #1a1a1a;
        color: #00ff00;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        border: 2px solid #00ff00;
      ">
        <h2>🧪 Scroll Motion Test Suite</h2>
        <p>Open DevTools Console (F12) to see logs</p>
        <p>Status: {{ getStatus() }}</p>
      </div>

      <!-- Spacing -->
      <div style="height: 200px; text-align: center; color: #999;">
        ↓ Scroll Down to Test ↓
      </div>

      <!-- Test Cards -->
      <div *ngFor="let i of testCards" [attr.id]="'test-card-' + i" #testElement
        style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 40px;
          margin: 40px 0;
          border-radius: 12px;
          min-height: 200px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          font-weight: bold;
        ">
        Test Card {{ i + 1 }}
        <span style="display: block; font-size: 12px; margin-top: 10px; opacity: 0.8;">
          This element should fade in and parallax on scroll
        </span>
      </div>

      <!-- Spacing -->
      <div style="height: 200px; text-align: center; color: #999;">
        ↑ End of Test ↑
      </div>

      <!-- Debug Info Box -->
      <div style="
        background: #f0f0f0;
        padding: 20px;
        margin: 20px 0;
        border-radius: 8px;
        border-left: 4px solid #667eea;
        font-family: monospace;
        font-size: 12px;
      ">
        <p><strong>Debug Info:</strong></p>
        <p>Initialized: {{ cinematicService.isInitializedCheck() ? '✓' : '✗' }}</p>
        <p>Lenis Active: {{ cinematicService.getLenis() ? '✓' : '✗' }}</p>
        <p>Cards Found: {{ testCards.length }}</p>
      </div>
    </div>
  `,
  styles: [],
  imports: [CommonModule],
})
export class ScrollTestComponent implements OnInit, OnDestroy {
  @ViewChildren('testElement') testElements!: QueryList<ElementRef>;

  testCards = [1, 2, 3, 4, 5];

  constructor(public cinematicService: CinematicScrollService) {}

  ngOnInit(): void {
    console.log('%c[TEST] ========================================', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('%c[TEST] SCROLL MOTION TEST COMPONENT INITIALIZED', 'color: #00ff00; font-weight: bold; font-size: 14px');
    console.log('%c[TEST] ========================================', 'color: #00ff00; font-weight: bold; font-size: 14px');

    // Initialize cinematic scroll
    console.log('%c[TEST] Initializing Cinematic Scroll...', 'color: #ffff00');
    this.cinematicService.init({
      smoothScroll: true,
      enableScrollTrigger: true,
      reducedMotion: false,  // Force animations
      debug: true,
    });

    // Wait for DOM to be ready
    setTimeout(() => {
      this.setupTestAnimations();
    }, 300);
  }

  ngAfterViewInit(): void {
    console.log('%c[TEST] AfterViewInit called', 'color: #ffff00');
    console.log('%c[TEST] Test elements found:', 'color: #ffff00', this.testElements.length);
  }

  ngOnDestroy(): void {
    console.log('%c[TEST] Component destroyed', 'color: #ff6666');
    this.cinematicService.destroy();
  }

  /**
   * Setup test animations
   */
  private async setupTestAnimations(): Promise<void> {
    console.log('%c[TEST] Setting up test animations...', 'color: #00ff00');
    console.log('%c[TEST] Total elements:', 'color: #00ff00', this.testElements.length);

    this.testElements.forEach((element, index) => {
      const elRef = element.nativeElement;
      console.log(`%c[TEST] Processing element ${index}:`, 'color: #00ffff', elRef);

      // Create fade-in animation
      this.cinematicService
        .createFadeIn(elRef, {
          distance: 100,
          duration: 0.8,
          delay: index * 0.15,
        })
        .then((trigger) => {
          console.log(
            `%c[TEST] ✓ Fade-in created for element ${index}`,
            'color: #00ff00',
            trigger
          );
        })
        .catch((err) => {
          console.error(
            `%c[TEST] ✗ Fade-in failed for element ${index}:`,
            'color: #ff6666',
            err
          );
        });

      // Create parallax animation
      this.cinematicService
        .createParallax(elRef, {
          strength: 0.4,
          direction: 'up',
        })
        .then((trigger) => {
          console.log(
            `%c[TEST] ✓ Parallax created for element ${index}`,
            'color: #00ff00',
            trigger
          );
        })
        .catch((err) => {
          console.error(
            `%c[TEST] ✗ Parallax failed for element ${index}:`,
            'color: #ff6666',
            err
          );
        });
    });

    console.log('%c[TEST] Animation setup complete!', 'color: #00ff00');
    console.log(
      '%c[TEST] Now scroll down and watch the animations trigger! 🎬',
      'color: #00ff00; font-weight: bold; font-size: 14px'
    );
  }

  /**
   * Get current status
   */
  getStatus(): string {
    const lenis = this.cinematicService.getLenis();
    const isInit = this.cinematicService.isInitializedCheck();
    return `${isInit ? '✓' : '✗'} Initialized | ${lenis ? '✓' : '✗'} Lenis Active`;
  }
}
