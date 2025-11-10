/**
 * ANGULAR EXAMPLE: CINEMATIC SCROLL DASHBOARD COMPONENT
 * 
 * Production-ready example using:
 * - Bootstrap 5 styling with .admin-bootstrap namespace
 * - GSAP ScrollTrigger for scroll animations
 * - Chart.js for scroll-linked charts
 * - Lenis for smooth scroll
 * 
 * Features:
 * - Fade-in animations on scroll
 * - Parallax cards
 * - Scroll-linked chart animations
 * - Bootstrap 5 styling (namespaced to prevent conflicts)
 */

import {
  Component,
  OnInit,
  OnDestroy,
  ViewChildren,
  QueryList,
  ElementRef,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CinematicScrollService } from '../../lib/cinematicScroll.service';

interface DashboardCard {
  id: number;
  title: string;
  value: number;
  label: string;
  icon: string;
  color: string;
}

interface ChartData {
  id: number;
  title: string;
  current: number;
  target: number;
  percentage: number;
}

@Component({
  selector: 'app-cinematic-dashboard',
  template: `
    <div class="admin-bootstrap">
      <!-- ====================================================================
           HEADER SECTION
           ==================================================================== -->
      <header
        class="bg-dark text-white p-4 sticky-top"
        style="z-index: 999"
      >
        <div class="container-fluid">
          <div class="d-flex justify-content-between align-items-center">
            <h1 class="mb-0">📊 Cinematic Dashboard</h1>
            <p class="mb-0 text-muted small">
              Production-ready scroll animations with Bootstrap
            </p>
          </div>
        </div>
      </header>

      <!-- ====================================================================
           HERO SECTION
           ==================================================================== -->
      <section
        class="py-5 px-4"
        style="
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          min-height: 50vh;
          display: flex;
          align-items: center;
          justify-content: center;
        "
        #heroSection
      >
        <div class="text-center">
          <h2 class="display-4 fw-bold mb-3">Smooth Scroll Dashboard</h2>
          <p class="lead mb-4">
            Watch animations come to life as you scroll through this dashboard
          </p>
          <button
            class="btn btn-light btn-lg"
            (click)="scrollToCards()"
          >
            Explore Dashboard ↓
          </button>
        </div>
      </section>

      <!-- ====================================================================
           SPACING
           ==================================================================== -->
      <div style="height: 4rem"></div>

      <!-- ====================================================================
           KPI CARDS SECTION
           ==================================================================== -->
      <section class="py-5 px-4 bg-light">
        <div class="container-fluid">
          <h2 class="mb-4 fw-bold">Key Performance Indicators</h2>

          <div class="row g-4" #cardsContainer>
            <div
              class="col-md-6 col-lg-3"
              *ngFor="let card of kpiCards; let i = index"
              #cardElement
            >
              <div
                class="card h-100 shadow-sm border-0"
                [style.border-top]="'4px solid ' + card.color"
              >
                <div class="card-body">
                  <div class="d-flex justify-content-between align-items-start">
                    <div>
                      <h5 class="card-title text-muted small mb-2">
                        {{ card.label }}
                      </h5>
                      <h3 class="fw-bold mb-0" [style.color]="card.color">
                        {{ card.value }}%
                      </h3>
                    </div>
                    <span style="font-size: 2rem">{{ card.icon }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ====================================================================
           SPACING
           ==================================================================== -->
      <div style="height: 4rem"></div>

      <!-- ====================================================================
           CHARTS SECTION
           ==================================================================== -->
      <section class="py-5 px-4">
        <div class="container-fluid">
          <h2 class="mb-4 fw-bold">Scroll-Linked Analytics</h2>

          <div class="row g-4">
            <div
              class="col-lg-6"
              *ngFor="let chart of chartData; let i = index"
              #chartElement
            >
              <div class="card shadow-sm border-0">
                <div class="card-header bg-white border-bottom">
                  <h5 class="card-title mb-0">{{ chart.title }}</h5>
                </div>
                <div class="card-body">
                  <div class="mb-3">
                    <div class="d-flex justify-content-between mb-2">
                      <span class="text-muted">Progress</span>
                      <span class="fw-bold">
                        <span
                          #progressValue
                          [attr.data-start]="chart.current"
                          [attr.data-end]="chart.target"
                        >
                          {{ chart.current }}
                        </span>
                        / {{ chart.target }}
                      </span>
                    </div>
                    <div class="progress" style="height: 8px">
                      <div
                        class="progress-bar"
                        [style.width.%]="chart.percentage"
                        role="progressbar"
                      ></div>
                    </div>
                  </div>

                  <!-- Mini Chart -->
                  <div class="d-flex justify-content-between align-items-end">
                    <div
                      *ngFor="let bar of generateBars(5)"
                      style="
                        flex: 1;
                        margin: 0 2px;
                        background: linear-gradient(135deg, #667eea, #764ba2);
                        height: calc(20px * {{ bar }});
                        border-radius: 2px;
                      "
                    ></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- ====================================================================
           SPACING
           ==================================================================== -->
      <div style="height: 4rem"></div>

      <!-- ====================================================================
           STATS SECTION
           ==================================================================== -->
      <section
        class="py-5 px-4"
        style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white"
      >
        <div class="container-fluid">
          <h2 class="mb-5 fw-bold text-center">Annual Performance</h2>

          <div class="row text-center g-4">
            <div class="col-md-4" *ngFor="let stat of stats" #statElement>
              <h3 class="display-5 fw-bold mb-2">
                <span #statValue [attr.data-value]="stat.value">
                  {{ stat.value }}
                </span>
                <span *ngIf="stat.unit">{{ stat.unit }}</span>
              </h3>
              <p class="lead mb-0">{{ stat.label }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- ====================================================================
           SPACING
           ==================================================================== -->
      <div style="height: 4rem"></div>

      <!-- ====================================================================
           CTA SECTION
           ==================================================================== -->
      <section class="py-5 px-4 bg-light">
        <div class="container-fluid text-center">
          <h2 class="mb-4 fw-bold">Ready to implement?</h2>
          <p class="lead mb-4">
            Add cinematic smooth scroll to your Angular dashboard with Bootstrap 5
          </p>
          <button class="btn btn-primary btn-lg">
            View Documentation →
          </button>
        </div>
      </section>

      <!-- ====================================================================
           DEBUG INFO
           ==================================================================== -->
      <div
        *ngIf="debug"
        style="
          position: fixed;
          bottom: 20px;
          right: 20px;
          background: #212529;
          color: white;
          padding: 16px;
          border-radius: 8px;
          font-size: 12px;
          font-family: monospace;
          z-index: 9999;
          max-width: 300px;
        "
      >
        <p>Cinematic Initialized: {{ cinematicService.isInitializedCheck() ? '✓' : '✗' }}</p>
        <p>Lenis Active: {{ cinematicService.getLenis() ? '✓' : '✗' }}</p>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      width: 100%;
    }

    .admin-bootstrap {
      --bs-primary: #667eea;
      --bs-danger: #dc3545;
      --bs-success: #198754;
      --bs-warning: #ffc107;
    }

    @media (max-width: 768px) {
      .admin-bootstrap .display-4 {
        font-size: 2rem;
      }
    }
  `],
  imports: [CommonModule],
})
export class CinematicDashboardComponent implements OnInit, OnDestroy {
  @ViewChildren('cardElement') cardElements!: QueryList<ElementRef>;
  @ViewChildren('chartElement') chartElements!: QueryList<ElementRef>;
  @ViewChildren('statElement') statElements!: QueryList<ElementRef>;
  @ViewChild('heroSection') heroSection!: ElementRef;

  debug = true;

  kpiCards: DashboardCard[] = [
    {
      id: 1,
      title: 'Smooth Scroll',
      value: 98,
      label: 'Performance Score',
      icon: '⚡',
      color: '#667eea',
    },
    {
      id: 2,
      title: 'Animations',
      value: 100,
      label: 'Browser Support',
      icon: '🎬',
      color: '#764ba2',
    },
    {
      id: 3,
      title: 'Bundle Size',
      value: 45,
      label: 'KB (GSAP + Lenis)',
      icon: '📦',
      color: '#f093fb',
    },
    {
      id: 4,
      title: 'Accessibility',
      value: 100,
      label: 'A11y Score',
      icon: '♿',
      color: '#4facfe',
    },
  ];

  chartData: ChartData[] = [
    {
      id: 1,
      title: 'Sales Revenue',
      current: 45,
      target: 100,
      percentage: 45,
    },
    {
      id: 2,
      title: 'User Engagement',
      current: 78,
      target: 100,
      percentage: 78,
    },
    {
      id: 3,
      title: 'Performance',
      current: 92,
      target: 100,
      percentage: 92,
    },
    {
      id: 4,
      title: 'Conversion Rate',
      current: 68,
      target: 100,
      percentage: 68,
    },
  ];

  stats = [
    { value: 250, unit: '+', label: 'Happy Customers' },
    { value: 48, unit: 'h', label: 'Average Response Time' },
    { value: 99.9, unit: '%', label: 'Uptime Guarantee' },
  ];

  constructor(public cinematicService: CinematicScrollService) {}

  ngOnInit(): void {
    // Initialize cinematic scroll with Angular service
    this.cinematicService.init({
      smoothScroll: true,
      enableScrollTrigger: true,
      reducedMotion: 'auto',
      debug: this.debug,
    });

    // Setup animations after a short delay to ensure DOM is ready
    setTimeout(() => {
      this.setupAnimations();
    }, 100);
  }

  ngAfterViewInit(): void {
    // Optional: Setup animations here if needed
  }

  ngOnDestroy(): void {
    this.cinematicService.destroy();
  }

  /**
   * Setup all animations
   */
  private async setupAnimations(): Promise<void> {
    // Animate KPI cards
    this.cardElements.forEach((element, index) => {
      this.cinematicService.createFadeIn(element.nativeElement, {
        distance: 80,
        duration: 0.8,
        delay: index * 0.1,
      });

      // Add parallax
      this.cinematicService.createParallax(element.nativeElement, {
        strength: 0.3,
        direction: 'up',
      });
    });

    // Animate chart cards
    this.chartElements.forEach((element, index) => {
      this.cinematicService.createFadeIn(element.nativeElement, {
        distance: 80,
        duration: 0.8,
        delay: index * 0.15,
      });
    });

    // Animate stats
    this.statElements.forEach((element, index) => {
      this.cinematicService.createFadeIn(element.nativeElement, {
        distance: 50,
        duration: 0.8,
        delay: index * 0.2,
      });
    });
  }

  /**
   * Scroll to cards section
   */
  scrollToCards(): void {
    if (this.cardElements.first) {
      this.cardElements.first.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }

  /**
   * Generate random bars for mini chart
   */
  generateBars(count: number): number[] {
    return Array.from({ length: count }, () => Math.random() * 0.8 + 0.2);
  }
}
