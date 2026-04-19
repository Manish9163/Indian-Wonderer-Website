import React, { useEffect, useRef } from 'react';
import './AboutUs.css';
import AboutUsParticleBackground from './AboutUsParticleBackground';

// Lenis & GSAP
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger);

const AboutUs = () => {
  const container = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const heroTextRef = useRef<HTMLHeadingElement>(null);
  const missionRef = useRef<HTMLElement>(null);
  const missionImageRef = useRef<HTMLImageElement>(null);
  const timelineRef = useRef<HTMLElement>(null);
  const teamCardsRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    // Basic Hero Text Fade In
    gsap.from(heroTextRef.current, {
      y: 50,
      opacity: 0,
      duration: 1.5,
      ease: "power4.out",
      delay: 0.2
    });

    // Parallax on Hero 
    gsap.to(heroRef.current, {
      yPercent: 30,
      ease: "none",
      scrollTrigger: {
        trigger: heroRef.current,
        start: "top top",
        end: "bottom top",
        scrub: true
      }
    });

    // Mission Image Reveal & Parallax
    gsap.fromTo(missionImageRef.current,
      { clipPath: "polygon(0 0, 100% 0, 100% 0, 0 0)", filter: "blur(20px)", scale: 1.2 },
      {
        clipPath: "polygon(0 0, 100% 0, 100% 100%, 0 100%)",
        filter: "blur(0px)",
        scale: 1,
        duration: 2,
        ease: "power3.inOut",
        scrollTrigger: {
          trigger: missionRef.current,
          start: "top 70%",
          end: "bottom center",
        }
      }
    );

    // Timeline staggered fade up
    const timelineItems = gsap.utils.toArray('.timeline-item');
    timelineItems.forEach((item: any, i) => {
      gsap.from(item, {
        scrollTrigger: {
          trigger: item,
          start: "top 80%"
        },
        y: 100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });
    });

    // Team Cards Stagger
    if (teamCardsRef.current) {
      gsap.from(teamCardsRef.current.children, {
        scrollTrigger: {
          trigger: teamCardsRef.current,
          start: "top 75%"
        },
        y: 100,
        rotationY: 15,
        opacity: 0,
        duration: 1.2,
        stagger: 0.2,
        ease: "power2.out"
      });
    }

  }, { scope: container });

  useEffect(() => {
    window.scrollTo(0, 0);

    const lenis = new Lenis({
      lerp: 0.08,
      smoothWheel: true,
    });

    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  return (
    <>
      <div ref={container} className="about-page-wrapper bg-background text-on-surface font-body dark relative w-full overflow-hidden">
        <AboutUsParticleBackground className="fixed h-screen w-full pointer-events-none" />

        {/* Hero Section */}
        <section ref={heroRef} className="relative h-screen w-full flex items-center justify-center overflow-hidden">
          <div className="video-container">
            <video autoPlay className="w-full h-full object-cover" loop muted playsInline>
              <source src="https://assets.mixkit.co/videos/preview/mixkit-flying-over-the-clouds-at-sunset-24504-large.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 hero-gradient"></div>
          </div>
          <div className="relative z-10 text-center px-4 max-w-5xl">
            <span className="label-md uppercase tracking-[0.5em] text-primary/80 mb-6 block">ESTABLISHED IN THE HEART OF BHARAT</span>
            <h1 ref={heroTextRef} className="font-headline text-5xl md:text-8xl font-bold tracking-tight text-on-surface mb-8 leading-tight drop-shadow-md">
              We don't just show you India, <br />
              <span className="italic font-normal text-primary text-glow-subtle">we let you live it.</span>
            </h1>
            <div className="w-px h-24 bg-gradient-to-b from-primary/60 to-transparent mx-auto mt-12"></div>
          </div>
        </section>

        <div className="relative z-10 bg-background/90 backdrop-blur-sm">
          {/* Mission Section */}
          <section ref={missionRef} className="py-32 px-8 md:px-24 max-w-screen-2xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-16 items-center">
              <div className="md:col-span-5 relative">
                <div className="relative z-10 overflow-hidden rounded-sm">
                  <img ref={missionImageRef} alt="Traditional Indian tea ritual" className="w-full h-[600px] object-cover" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDxiggT7osGwKiCLSaqxbyMgJSBzvqNOVIWCTb8Bgt9BsLeqi3hc1nK6iNv1_zlYtdT94hEBJpfYxIvRIFUFEKPI4-RfTjrXNDRk_WUaDLQ38LPWcfcbGHzhkAzz4XXd9FJsuPG_XacWXayJ04SbnvEbxu1T2tBpeAOb8d6yaA0D4ivzj_sE1CjwCTsaNM05JB_kNc4RaFYpaXvC5j5MG2TRyZsenE3-ziatTIvQGR49Zbx2aNSdEv1_TaCB6_cAa99CuzkqQJBFtFA" />
                </div>
                <div className="absolute -bottom-8 -right-8 w-64 h-64 glass-panel p-8 rounded-sm z-20 hidden md:block border-l-2 border-primary/30 shadow-2xl">
                  <p className="font-headline italic text-primary/90 text-2xl leading-relaxed">"Authenticity is the only currency we trade in."</p>
                </div>
              </div>
              <div className="md:col-span-7 space-y-12">
                <div>
                  <p className="font-label text-primary/70 uppercase tracking-[0.25em] mb-4 text-sm">Our Mission</p>
                  <h2 className="font-headline text-4xl md:text-6xl text-on-surface leading-tight mb-8 drop-shadow-md">Curating the Unseen &amp; The Unforgettable</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="glass-panel p-8 rounded-sm space-y-4 transform transition-transform hover:-translate-y-2 duration-500 hover:shadow-2xl hover:border-primary/50">
                    <span className="material-symbols-outlined text-primary/80 text-4xl">eco</span>
                    <h3 className="font-headline text-xl">Sustainable Soul</h3>
                    <p className="text-on-surface-variant leading-relaxed text-sm">We partner exclusively with local artisans and eco-conscious retreats to ensure India stays vibrant for generations to come.</p>
                  </div>
                  <div className="glass-panel p-8 rounded-sm space-y-4 transform transition-transform hover:-translate-y-2 duration-500 hover:shadow-2xl hover:border-primary/50">
                    <span className="material-symbols-outlined text-primary/80 text-4xl">auto_awesome</span>
                    <h3 className="font-headline text-xl">Authentic Rituals</h3>
                    <p className="text-on-surface-variant leading-relaxed text-sm">From private temple blessings at dawn to hidden spice markets in Old Delhi, we find the magic in the mundane.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Our Story / Timeline */}
          <section ref={timelineRef} className="bg-surface-container-lowest/80 py-32 overflow-hidden backdrop-blur-md">
            <div className="max-w-7xl mx-auto px-8">
              <div className="text-center mb-24">
                <h2 className="font-headline text-4xl md:text-6xl text-on-surface drop-shadow-sm">The Heritage Journey</h2>
                <div className="w-16 h-[2px] bg-primary/40 mx-auto mt-6"></div>
              </div>
              <div className="relative">
                <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-[1px] bg-outline-variant/30"></div>
                {/* Timeline Items */}
                <div className="timeline-item relative flex items-center justify-between mb-32 md:flex-row flex-col">
                  <div className="md:w-5/12 text-right pr-12 order-2 md:order-1">
                    <h4 className="font-headline text-3xl text-primary/80 mb-2">2012</h4>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-[0.2em] text-on-surface/90">The First Spark</h3>
                    <p className="text-on-surface-variant italic text-sm">Founded in a small workshop in Varanasi, with a single mission: to show the world the spiritual heart of the Ganges.</p>
                  </div>
                  <div className="z-20 bg-primary/40 w-3 h-3 rounded-full border-4 border-background order-1 md:order-2 my-4 md:my-0 shadow-[0_0_15px_rgba(201,174,93,0.8)]"></div>
                  <div className="md:w-5/12 pl-12 order-3 overflow-hidden rounded-sm group hover:z-30">
                    <img alt="Varanasi Ganges" className="w-full h-48 object-cover rounded-sm grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 shadow-lg group-hover:shadow-[0_0_25px_rgba(201,174,93,0.3)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCDgQR4NTkSl6cuGp28iqk4in36I5UM0V9XXU9ITeJcs1cAYtLxwvqu6UcKOYoaznccQ0n9q1Uz7TyyCjE4l1e77zUSzti40xPK7gOXJRTJQiK9J0Om6lzKlF-I0XuwmPkMW-o-k_sOKWQlp7wW-jZBUGJhgUSFg-V581MFCQCD2A_Fze_kZvpoC6J6aIu32h8A5TcIt8_m5r0YoxqAPQY_mJPn3fyiVI0o4SVOUGfdBeOaOOgFSOfjJHM2fYPL_0GCvoSca5BUNv5q" />
                  </div>
                </div>

                <div className="timeline-item relative flex items-center justify-between mb-32 md:flex-row flex-col">
                  <div className="md:w-5/12 pr-12 order-3 md:order-1 overflow-hidden rounded-sm group hover:z-30">
                    <img alt="Luxury Palace" className="w-full h-48 object-cover rounded-sm grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 shadow-lg group-hover:shadow-[0_0_25px_rgba(201,174,93,0.3)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBrYa6boZRT0s_GmxeIHaYV7KncWWABtwLaWVpWooY12sbD8Z8EffC95VD71YrovAZ92tI5PCYeoaBTUUXhrzCd-0twG4te9-mfRmXwshn2CkDOmWc7H1jMTpPNUKv26h_9CPFPopw0veJiTkAhwT5O_YRD_rbkFsiJT9I306ersw62j7BHxcO6ZHHz-yln8TWAQXIQwSyoxMQjz8LwpkqaZMmo_9xNF8-HWYgDb0pffOp66pPP-jfD0n4aB6CkOJUQ6hUJGW7Lb_n_" />
                  </div>
                  <div className="z-20 bg-outline-variant w-3 h-3 rounded-full border-4 border-background order-1 md:order-2 my-4 md:my-0"></div>
                  <div className="md:w-5/12 text-left pl-12 order-2 md:order-3">
                    <h4 className="font-headline text-3xl text-primary/80 mb-2">2018</h4>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-[0.2em] text-on-surface/90">Royal Expansion</h3>
                    <p className="text-on-surface-variant italic text-sm">Opened our Concierge wing in Rajasthan, granting exclusive access to private forts and Maharajah-hosted dinners.</p>
                  </div>
                </div>

                <div className="timeline-item relative flex items-center justify-between md:flex-row flex-col">
                  <div className="md:w-5/12 text-right pr-12 order-2 md:order-1">
                    <h4 className="font-headline text-3xl text-primary/80 mb-2">Today</h4>
                    <h3 className="text-lg font-bold mb-4 uppercase tracking-[0.2em] text-on-surface/90">The Wonderer Way</h3>
                    <p className="text-on-surface-variant italic text-sm">A network of 500+ local guides across the subcontinent, redefining luxury as the depth of experience.</p>
                  </div>
                  <div className="z-20 bg-primary w-3 h-3 rounded-full border-4 border-background order-1 md:order-2 my-4 md:my-0 shadow-[0_0_15px_rgba(201,174,93,0.8)]"></div>
                  <div className="md:w-5/12 pl-12 order-3 overflow-hidden rounded-sm group hover:z-30">
                    <img alt="Modern India" className="w-full h-48 object-cover rounded-sm grayscale transition-all duration-1000 group-hover:grayscale-0 group-hover:scale-110 shadow-lg group-hover:shadow-[0_0_25px_rgba(201,174,93,0.3)]" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBdBJDgLzSB_mknibA_WudJuaI51GLNk4u8kAxYIFfXN9TMYBugUHhK8LDEm4nsPN5NDhoH2VaRM7FMBv-akqKkoXnD4ysv53_s-ojxXDSKjXA9mdiAXYoaWP6qFVU0BaJF6PO9AXHeXIWK9JSTnkuBHKpYSk24ehmRm1MbJh2Z1MgNHK-rHwbZwTzrrJaqtwLPQdfnJYdv-fe34-DjSKhTUX10WF2qkjO0wbwb7qDVtFhfl_DCn4rHCDTrrglnJNUKC-jmUYiiFeAy" />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Pillars Section */}
          <section className="py-32 px-8 max-w-7xl mx-auto">
            <div className="mb-16">
              <p className="font-label text-primary/70 uppercase tracking-[0.25em] mb-2 text-sm">Our Pillars</p>
              <h2 className="font-headline text-4xl md:text-5xl text-on-surface">Built on Absolute Truth</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
              <div className="md:col-span-2 md:row-span-2 glass-panel p-10 flex flex-col justify-end relative overflow-hidden group hover:border-primary/40 transition-colors">
                <img className="absolute inset-0 w-full h-full object-cover opacity-10 group-hover:opacity-25 group-hover:scale-105 transition-all duration-1000" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBA6nfsA-gv5KhDcMPKvga11_SX13yqSUP_h1UZRHff1vtPbbDR6HWnVe00o1cmMyF1RvMzA0Me03bgYESYsHyej4zYgSSlZei3uJpXMGVDiaf5FxDKCm9js553ns4L5miiHoqeLffsn4Dnh4qCrfDdnhIa6vSqmfLTnE_8OkQb-Bl-u9N3kFwbodAhW-yZbH2AyKlH1kJDTdl5_e3jMVR4TLur9D9rxMOwEkYehsw3kFykx0sitSqGHBLmqNBneMmekRKNzYTgK5HT" />
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-primary/80 text-5xl mb-6 drop-shadow-md">verified_user</span>
                  <h3 className="font-headline text-3xl mb-4">Unwavering Trust</h3>
                  <p className="text-on-surface-variant text-lg">Every partner, vehicle, and guide is vetted through a 50-point safety and quality protocol.</p>
                </div>
              </div>
              <div className="md:col-span-2 glass-panel p-8 flex items-center gap-6 group hover:border-primary/30 transition-colors cursor-pointer">
                <div className="bg-primary/5 p-4 rounded-full group-hover:scale-110 group-hover:bg-primary/10 transition-transform duration-500">
                  <span className="material-symbols-outlined text-primary/80 text-3xl">diamond</span>
                </div>
                <div>
                  <h3 className="font-headline text-xl mb-1">Tailored Luxury</h3>
                  <p className="text-on-surface-variant text-sm">Not gold faucets, but private moments that money cannot buy.</p>
                </div>
              </div>
              <div className="md:col-span-1 glass-panel p-8 flex flex-col justify-center text-center group hover:border-primary/30 transition-colors">
                <span className="material-symbols-outlined text-primary/60 text-4xl mb-4 group-hover:rotate-12 transition-transform duration-500">handshake</span>
                <h3 className="font-headline text-lg mb-2">Local Agency</h3>
                <p className="text-on-surface-variant text-xs">80% of our revenue stays within the local communities we visit.</p>
              </div>
              <div className="md:col-span-1 bg-primary/95 text-on-primary p-8 flex flex-col justify-center text-center group hover:bg-primary transition-colors hover:shadow-[0_0_25px_rgba(201,174,93,0.4)] relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10 group-hover:translate-x-0 group-hover:scale-125 transition-transform duration-1000"></div>
                <div className="relative z-10">
                  <span className="material-symbols-outlined text-3xl mb-4 group-hover:scale-110 transition-transform duration-500 shadow-sm">history_edu</span>
                  <h3 className="font-headline text-lg mb-2 text-shadow-sm">Heritage First</h3>
                  <p className="text-on-primary/80 text-xs tracking-tight">Preserving the stories that history books often forget.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Team Section */}
          <section className="py-32 px-8 bg-background/50 backdrop-blur-xl border-t border-white/5 relative z-20">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row justify-between items-baseline mb-24 gap-8">
                <div className="max-w-2xl">
                  <h2 className="font-headline text-4xl md:text-6xl text-on-surface mb-6 drop-shadow-lg">The Curators of <span className="italic text-primary/80 text-glow-subtle">Wonder</span></h2>
                  <p className="text-on-surface-variant text-lg font-light">Our guides aren't just experts; they are the sons and daughters of the soil they walk upon.</p>
                </div>
                <button className="text-primary border-b border-primary/40 pb-2 font-label uppercase tracking-widest hover:text-on-surface hover:border-on-surface transition-all text-sm group">Join the collective <span className="inline-block transform group-hover:translate-x-1 transition-transform">&rarr;</span></button>
              </div>
              <div ref={teamCardsRef} className="grid grid-cols-1 md:grid-cols-3 gap-16" style={{ perspective: "1500px" }}>
                <div className="group cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden mb-8 rounded-sm shadow-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700">
                    <img alt="Arjun Malhotra" className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCwgM7Id7puFtgYQnZY_3nLEyTcX6gLDhV78aZ-ciCigPaU97ijE7ffR-5eTEeHbBfAaDVoy4VehJjdvn7xtuK9gzcJIm3IKadZpXCxFWbHi_611GJ2nZ2dORfS-EyfJK3S_UST3ZC1QKn2aPyGDVDGOH3hrNGGIazo6EZjl95wy8W7ey_N8f_4Ylhv3tIzAFOspFeTI5wpKOIbR24RFFSOmEPLgjktkjP2dxkRGJf5XdN6eJiMucnDOxzTUuZtFS3nw7RRqynuuIuH" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                  <div className="text-center group-hover:-translate-y-2 transition-transform duration-500">
                    <p className="text-primary/80 font-label text-[10px] uppercase tracking-[0.4em] mb-2">Chief Historian</p>
                    <h4 className="font-headline text-2xl text-on-surface tracking-wide group-hover:text-primary transition-colors">Arjun Malhotra</h4>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden mb-8 rounded-sm shadow-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700">
                    <img alt="Priya Sharma" className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuA61aQTkWL0Zwa_qHrmrOSoGkH75zvsGPnBQyZVDyGCfYpMb7kxTleBTO8pdVLHagdaccrxcXHIv1t_7-Qy92dX9j-QG3jBuQUGEvRzbidqouJcFiAmoBgxGkLuJeYnrjzPKQawxOZPUZtPGz3ji-dylqTNWcv4XOJAX8fI_jlYDj6J1tnbpLywksHwe1XfIjXx2tVWCvHcUsA8t3UAf9H2Z3VriLCTVL7ojgaHnXcpRLvPusWSzRwo2TXAIY-RzgNXEMmbwpuU2E24" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                  <div className="text-center group-hover:-translate-y-2 transition-transform duration-500">
                    <p className="text-primary/80 font-label text-[10px] uppercase tracking-[0.4em] mb-2">Lead Concierge</p>
                    <h4 className="font-headline text-2xl text-on-surface tracking-wide group-hover:text-primary transition-colors">Priya Sharma</h4>
                  </div>
                </div>

                <div className="group cursor-pointer">
                  <div className="relative aspect-[4/5] overflow-hidden mb-8 rounded-sm shadow-xl group-hover:shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-700">
                    <img alt="Rohan Das" className="w-full h-full object-cover grayscale transition-all duration-700 group-hover:scale-105 group-hover:grayscale-0" src="https://lh3.googleusercontent.com/aida-public/AB6AXuD9SDR29IAL2nZNJ2TtpNnf-5G8qiqNQ-P0bGhzelipM68ddmhygLY91_FBHsJwEIA6yrwJqnmhqe6POnh0dYu3blmaoRhtC1SYa8aKxLObs09JQx3KxOHEM4A1_wIMj5qfdbH1lVjyufBqxnRClNazS6ucppbwamjsVwNivymocPRVzbY16WflSLtKIGKxN0A27fgts3SEHLpZZ7LYtHcAkIQ3MVfb8gVe_ZGf6bKUwNUKPK1SvYAhHSA_BsY343j29pc1zznAtin8" />
                    <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                  <div className="text-center group-hover:-translate-y-2 transition-transform duration-500">
                    <p className="text-primary/80 font-label text-[10px] uppercase tracking-[0.4em] mb-2">Expedition Leader</p>
                    <h4 className="font-headline text-2xl text-on-surface tracking-wide group-hover:text-primary transition-colors">Rohan Das</h4>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-48 px-8 text-center relative overflow-hidden bg-[#0a0a0a]">
            {/* Ambient Background Light */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-primary/10 rounded-full blur-[150px] mix-blend-screen pointer-events-none"></div>

            <div className="relative z-10 max-w-4xl mx-auto">
              <h2 className="font-headline text-5xl md:text-7xl mb-12 leading-tight drop-shadow-xl text-on-surface">Design Your Next <span className="italic text-primary/80 text-glow-subtle">Masterpiece.</span></h2>
              <p className="text-on-surface-variant text-lg mb-12 max-w-2xl mx-auto font-light leading-relaxed">Your journey through the Indian subcontinent begins with a single conversation. Let our curators craft your legacy.</p>

              <div className="flex flex-col md:flex-row gap-8 justify-center items-center">
                <button className="bg-primary text-on-primary px-12 py-5 rounded-sm font-label uppercase tracking-[0.25em] hover:bg-primary-container hover:scale-105 transition-all text-sm shadow-[0_0_20px_rgba(201,174,93,0.3)] hover:shadow-[0_0_35px_rgba(201,174,93,0.5)]">Inquire Now</button>
                <button className="text-on-surface/80 px-4 py-2 font-label uppercase tracking-[0.2em] hover:text-primary transition-all text-xs border-b border-transparent hover:border-primary/40 hover:-translate-y-1">View Our Portfolios</button>
              </div>
            </div>
          </section>

        </div>
      </div>
    </>
  );
};

export default AboutUs;
