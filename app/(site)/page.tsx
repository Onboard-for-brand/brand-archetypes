"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import { useLenis } from "lenis/react";
import { EdupunkBounceFooter } from "@/components/EdupunkBounceFooter";
import { I18nText } from "@/components/I18nText";
import {
  type AccessCodeError,
  formatAccessCode,
  verifyAccessCode,
} from "@/lib/access-code";
import { archetypes } from "@/lib/archetypes";

import { LanguageToggle } from "@/components/LanguageToggle";
import { HowToGetPanel } from "./HowToGetPanel";
import { InterviewOverlay } from "./InterviewOverlay";

type TestEntryState = "idle" | "access" | "verified";

// Wodniack.dev inspired exact structural clone applied to Brand Archetypes.
export default function Home() {
  const containerRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLElement>(null);
  const accessInputRef = useRef<HTMLInputElement>(null);
  const entryTransitionTimerRef = useRef<number | null>(null);
  const lenis = useLenis();
  const [testEntryState, setTestEntryState] =
    useState<TestEntryState>("idle");
  const [accessCode, setAccessCode] = useState("");
  const [accessError, setAccessError] = useState<AccessCodeError>("");
  const [verifiedCode, setVerifiedCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEntryTransitioning, setIsEntryTransitioning] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [isPageLoaded, setIsPageLoaded] = useState(false);
  const [showHowToGet, setShowHowToGet] = useState(false);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  // Refs for Loader
  const loaderRef = useRef<HTMLDivElement>(null);
  const percentRef = useRef<HTMLSpanElement>(null);
  const loaderBarRef = useRef<HTMLDivElement>(null);

  // Refs for Gallery Hover Effect (Classic Wodniack style)
  const hoverImgContainerRef = useRef<HTMLDivElement>(null);
  const hoverImgRef = useRef<HTMLImageElement>(null);
  const gallerySectionRef = useRef<HTMLDivElement>(null);
  const isTestEntryActive = testEntryState !== "idle";
  const isEntryLocked = isTestEntryActive || isEntryTransitioning || isExiting;
  const showEngaged = isEntryLocked && !isExiting;
  const showWarping = isEntryTransitioning || isExiting;
  const showRevealed = isTestEntryActive && !isExiting;

  useEffect(() => {
    return () => {
      if (entryTransitionTimerRef.current) {
        window.clearTimeout(entryTransitionTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isEntryLocked) {
      return;
    }

    const lenisInstance = lenis;
    const scrollKeys = new Set([
      " ",
      "ArrowDown",
      "ArrowUp",
      "End",
      "Home",
      "PageDown",
      "PageUp",
    ]);

    function ctaScrollY() {
      const cta = ctaRef.current;

      if (!cta) {
        return window.scrollY;
      }

      return Math.max(0, cta.getBoundingClientRect().top + window.scrollY);
    }

    function isInsideScrollAllowList(event: Event): boolean {
      const path =
        typeof (event as Event & { composedPath?: () => EventTarget[] })
          .composedPath === "function"
          ? (event as Event & { composedPath: () => EventTarget[] }).composedPath()
          : [];
      return path.some((node) => {
        if (!(node instanceof HTMLElement)) return false;
        // Editable fields — never swallow keys/scroll inside them.
        const tag = node.tagName;
        if (tag === "TEXTAREA" || tag === "INPUT" || node.isContentEditable) {
          return true;
        }
        return (
          node.classList.contains("how-to-get-panel") ||
          node.classList.contains("interview-block--chat") ||
          node.classList.contains("interview-block--input")
        );
      });
    }

    function preventLockedScroll(event: Event) {
      if (isInsideScrollAllowList(event)) return;
      event.preventDefault();
    }

    function preventLockedKeys(event: KeyboardEvent) {
      if (!scrollKeys.has(event.key)) {
        return;
      }
      if (isInsideScrollAllowList(event)) return;
      event.preventDefault();
    }

    const targetY = ctaScrollY();
    const shouldAlignToCta = Math.abs(window.scrollY - targetY) > 2;

    function lockAtEntry() {
      lenisInstance?.stop();
    }

    if (shouldAlignToCta && lenisInstance) {
      lenisInstance.scrollTo(targetY, {
        duration: 0.25,
        easing: (t) => 1 - (1 - t) ** 4,
        force: true,
        lock: true,
        onComplete: lockAtEntry,
      });
    } else {
      if (shouldAlignToCta) {
        window.scrollTo(0, targetY);
      }
      lockAtEntry();
    }

    window.addEventListener("wheel", preventLockedScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", preventLockedScroll, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", preventLockedKeys, { capture: true });

    return () => {
      lenisInstance?.start();
      window.removeEventListener("wheel", preventLockedScroll, {
        capture: true,
      });
      window.removeEventListener("touchmove", preventLockedScroll, {
        capture: true,
      });
      window.removeEventListener("keydown", preventLockedKeys, {
        capture: true,
      });
    };
  }, [isEntryLocked, lenis]);

  useEffect(() => {
    if (testEntryState !== "access") {
      return;
    }

    const focusTimer = setTimeout(() => {
      accessInputRef.current?.focus();
    }, 640);

    return () => {
      clearTimeout(focusTimer);
    };
  }, [testEntryState]);

  useEffect(() => {
    const previousBodyBackground = document.body.style.background;
    const previousHtmlBackground = document.documentElement.style.background;
    const scrollKeys = new Set([
      " ",
      "ArrowDown",
      "ArrowUp",
      "End",
      "Home",
      "PageDown",
      "PageUp",
    ]);

    function isPageLoading() {
      return document.documentElement.classList.contains("is-page-loading");
    }

    function keepAtTop(event: Event) {
      if (!isPageLoading()) {
        return;
      }

      event.preventDefault();
      window.scrollTo(0, 0);
    }

    function blockScrollKeys(event: KeyboardEvent) {
      if (!isPageLoading() || !scrollKeys.has(event.key)) {
        return;
      }

      event.preventDefault();
      window.scrollTo(0, 0);
    }

    document.body.style.background = "#0a0a0a";
    document.documentElement.style.background = "#0a0a0a";
    document.documentElement.classList.add("is-page-loading");
    window.scrollTo(0, 0);
    window.addEventListener("wheel", keepAtTop, {
      passive: false,
      capture: true,
    });
    window.addEventListener("touchmove", keepAtTop, {
      passive: false,
      capture: true,
    });
    window.addEventListener("keydown", blockScrollKeys, { capture: true });

    return () => {
      document.documentElement.classList.remove("is-page-loading");
      window.removeEventListener("wheel", keepAtTop, { capture: true });
      window.removeEventListener("touchmove", keepAtTop, { capture: true });
      window.removeEventListener("keydown", blockScrollKeys, { capture: true });
      document.documentElement.classList.remove("is-cta-header-hidden");
      document.body.style.background = previousBodyBackground;
      document.documentElement.style.background = previousHtmlBackground;
    };
  }, []);

  useGSAP(
    () => {
      gsap.registerPlugin(ScrollTrigger);

      // --- 0. DYNAMIC HEADER OBSERVER ---
      const sections = [
        { id: "hero", index: 0 },
        { id: "whyto", index: 1 },
        { id: "howto", index: 2 },
        { id: "archetypes", index: 3 },
      ];

      sections.forEach((config) => {
        ScrollTrigger.create({
          trigger: `[data-section="${config.id}"]`,
          start: "top 100px", // Trigger slightly before it hits the top
          end: "bottom 100px",
          onEnter: () => {
            gsap.to(".header-label-track", {
              y: config.index * -16,
              duration: 0.6,
              ease: "power3.inOut",
              overwrite: "auto",
            });
          },
          onEnterBack: () => {
            gsap.to(".header-label-track", {
              y: config.index * -16,
              duration: 0.6,
              ease: "power3.inOut",
              overwrite: "auto",
            });
          },
        });
      });

      let isDynamicHeaderHidden: boolean | null = null;
      let dynamicHeaderRaf = 0;

      function setDynamicHeaderHidden(hidden: boolean, immediate = false) {
        const root = document.documentElement;
        const header = document.querySelector<HTMLElement>(
          ".site-dynamic-header",
        );
        const classIsPresent = root.classList.contains("is-cta-header-hidden");
        const headerLooksHidden =
          header?.style.visibility === "hidden" || header?.style.opacity === "0";

        if (
          isDynamicHeaderHidden === hidden &&
          classIsPresent === hidden &&
          (hidden || !headerLooksHidden)
        ) {
          return;
        }

        isDynamicHeaderHidden = hidden;
        root.classList.toggle("is-cta-header-hidden", hidden);

        if (!header) {
          return;
        }

        gsap.killTweensOf(header);

        if (!hidden) {
          header.style.visibility = "visible";
        }

        gsap.to(header, {
          yPercent: hidden ? -110 : 0,
          opacity: hidden ? 0 : 1,
          visibility: hidden ? "hidden" : "visible",
          duration: immediate ? 0 : 0.25,
          ease: "power2.out",
          overwrite: "auto",
        });
      }

      function shouldHideDynamicHeader() {
        const cta = document.querySelector<HTMLElement>('[data-section="cta"]');

        if (!cta) {
          return false;
        }

        const ctaTop = cta.getBoundingClientRect().top + window.scrollY;
        return window.scrollY >= ctaTop - 96;
      }

      function syncDynamicHeader(immediate = false) {
        setDynamicHeaderHidden(shouldHideDynamicHeader(), immediate);
      }

      function queueDynamicHeaderSync() {
        if (dynamicHeaderRaf) {
          return;
        }

        dynamicHeaderRaf = requestAnimationFrame(() => {
          dynamicHeaderRaf = 0;
          syncDynamicHeader();
        });
      }

      window.addEventListener("scroll", queueDynamicHeaderSync, {
        passive: true,
      });
      window.addEventListener("scrollend", queueDynamicHeaderSync);
      window.addEventListener("resize", queueDynamicHeaderSync);

      ScrollTrigger.create({
        trigger: '[data-section="cta"]',
        start: "top 96px",
        end: "max",
        onUpdate: () => syncDynamicHeader(),
        onRefresh: () => syncDynamicHeader(true),
      });
      syncDynamicHeader(true);

      function cleanupDynamicHeader() {
        if (dynamicHeaderRaf) {
          cancelAnimationFrame(dynamicHeaderRaf);
        }

        window.removeEventListener("scroll", queueDynamicHeaderSync);
        window.removeEventListener("scrollend", queueDynamicHeaderSync);
        window.removeEventListener("resize", queueDynamicHeaderSync);
        document.documentElement.classList.remove("is-cta-header-hidden");
        gsap.set(".site-dynamic-header", {
          clearProps: "opacity,visibility,transform",
        });
      }

      // --- 1. THE WODNIACK PERCENTAGE LOADER ---
      const tlLoader = gsap.timeline({
        onComplete: () => {
          document.documentElement.classList.remove("is-page-loading");
          setIsPageLoaded(true);
          initHeroAnimations();
        },
      });

      const progressObj = { value: 0 };
      tlLoader
        .to(progressObj, {
          value: 100,
          duration: 2,
          ease: "power3.inOut",
          onUpdate: () => {
            if (percentRef.current) {
              percentRef.current.innerText = Math.round(
                progressObj.value,
              ).toString();
            }
            if (loaderBarRef.current) {
              loaderBarRef.current.style.width = `${progressObj.value}%`;
            }
          },
        })
        .to(
          ".loader-text-item",
          {
            yPercent: -100,
            opacity: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: "power2.in",
          },
          "+=0.2",
        )
        .to(
          loaderRef.current,
          {
            yPercent: -100,
            duration: 1,
            ease: "expo.inOut",
          },
          "-=0.2",
        );

      // --- 2. HERO ANIMATIONS (Called after loader) ---
      function initHeroAnimations() {
        // Parallax for the abstract background orb
        gsap.to(".abstract-orb", {
          yPercent: 30,
          ease: "none",
          scrollTrigger: {
            trigger: ".hero-container",
            start: "top top",
            end: "bottom top",
            scrub: true,
          },
        });
      }

      // --- 3. SCROLL REVEALS (Wodniack Style) ---
      const revealSections =
        gsap.utils.toArray<HTMLElement>(".scroll-reveal-text");
      revealSections.forEach((section) => {
        gsap.fromTo(
          section.querySelectorAll(".scroll-reveal-inner"),
          { yPercent: 110, rotateZ: 2 },
          {
            yPercent: 0,
            rotateZ: 0,
            duration: 1,
            stagger: 0.1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 85%",
            },
          },
        );
      });

      const clipSections =
        gsap.utils.toArray<HTMLElement>(".scroll-clip-reveal");
      clipSections.forEach((section) => {
        gsap.fromTo(
          section.querySelectorAll(".scroll-clip-inner"),
          { yPercent: 112, rotateZ: 2 },
          {
            yPercent: 0,
            rotateZ: 0,
            duration: 1,
            stagger: 0.04,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 88%",
            },
          },
        );
      });

      const fadeSections = gsap.utils.toArray<HTMLElement>(".scroll-fade-up");
      fadeSections.forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 30 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
            },
          },
        );
      });

      // --- 4. THE WODNIACK FLOATING GALLERY HOVER ---
      let cleanupHoverMouseMove = () => {};

      if (hoverImgContainerRef.current) {
        // Set up quickTo for smooth cursor following
        const xTo = gsap.quickTo(hoverImgContainerRef.current, "x", {
          duration: 0.4,
          ease: "power3",
        });
        const yTo = gsap.quickTo(hoverImgContainerRef.current, "y", {
          duration: 0.4,
          ease: "power3",
        });

        const moveImg = (e: MouseEvent) => {
          xTo(e.clientX);
          yTo(e.clientY);
        };

        window.addEventListener("mousemove", moveImg);

        cleanupHoverMouseMove = () => {
          window.removeEventListener("mousemove", moveImg);
        };
      }

      return () => {
        cleanupDynamicHeader();
        cleanupHoverMouseMove();
      };
    },
    { scope: containerRef },
  );

  // Handle Gallery Hover Events
  const handleMouseEnter = (imgSrc: string) => {
    if (hoverImgRef.current && hoverImgContainerRef.current) {
      hoverImgRef.current.src = imgSrc;
      gsap.to(hoverImgContainerRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.4,
        ease: "back.out(1.5)",
        overwrite: "auto",
      });
    }
  };

  const handleMouseLeave = () => {
    if (hoverImgContainerRef.current) {
      gsap.to(hoverImgContainerRef.current, {
        scale: 0.5,
        opacity: 0,
        duration: 0.3,
        ease: "power2.in",
        overwrite: "auto",
      });
    }
  };

  function enterAccessMode() {
    if (isEntryLocked) {
      return;
    }

    const cta = ctaRef.current;
    const targetY = cta
      ? Math.max(0, cta.getBoundingClientRect().top + window.scrollY)
      : window.scrollY;
    const shouldAlignToCta = Math.abs(window.scrollY - targetY) > 2;

    function activate() {
      setAccessCode("");
      setAccessError("");
      setVerifiedCode("");
      setIsEntryTransitioning(true);

      if (entryTransitionTimerRef.current) {
        window.clearTimeout(entryTransitionTimerRef.current);
      }

      entryTransitionTimerRef.current = window.setTimeout(() => {
        setTestEntryState("access");
        setIsEntryTransitioning(false);
        entryTransitionTimerRef.current = null;
      }, 720);
    }

    if (!shouldAlignToCta) {
      activate();
      return;
    }

    if (lenis) {
      lenis.scrollTo(targetY, {
        duration: 0.18,
        easing: (t) => 1 - (1 - t) ** 3,
        force: true,
        lock: true,
        onComplete: activate,
      });
      return;
    }

    window.scrollTo(0, targetY);
    window.requestAnimationFrame(activate);
  }

  function exitAccessMode() {
    if (!isTestEntryActive || isExiting || isEntryTransitioning) return;

    setIsExiting(true);

    if (entryTransitionTimerRef.current) {
      window.clearTimeout(entryTransitionTimerRef.current);
    }

    entryTransitionTimerRef.current = window.setTimeout(() => {
      setTestEntryState("idle");
      setAccessCode("");
      setAccessError("");
      setVerifiedCode("");
      setIsExiting(false);
      entryTransitionTimerRef.current = null;
    }, 720);
  }

  useEffect(() => {
    if (!isTestEntryActive) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        exitAccessMode();
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTestEntryActive, isExiting, isEntryTransitioning]);

  function handleAccessCodeChange(value: string) {
    setAccessCode(formatAccessCode(value));

    if (accessError) {
      setAccessError("");
    }
  }

  async function submitAccessCode(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isVerifying) return;

    setAccessError("");
    setIsVerifying(true);

    const result = await verifyAccessCode(accessCode);

    setIsVerifying(false);

    if (!result.ok) {
      setAccessCode(formatAccessCode(accessCode));
      setAccessError(result.error);
      return;
    }

    setVerifiedCode(result.code);
    setTestEntryState("verified");
  }

  return (
    <div
      ref={containerRef}
      className="bg-[#0a0a0a] text-[#e0e0e0] min-h-screen font-sans selection:bg-[#e53935] selection:text-white"
    >
      {/* 1. LOADER (Exact Wodniack Style) */}
      <div
        ref={loaderRef}
        className="fixed inset-0 z-[100] flex flex-col justify-between bg-[#e53935] p-6 md:p-12 text-black"
      >
        <div className="flex justify-between font-mono text-xs uppercase tracking-widest overflow-hidden">
          <div className="loader-text-item">
            <I18nText zh="系统启动中" en="System Booting" />
          </div>
          <div className="loader-text-item">
            <I18nText zh="请稍候..." en="Please Wait..." />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center flex-grow overflow-hidden">
          <div className="loader-text-item text-[15vw] md:text-[10vw] font-bold leading-none tracking-tighter">
            <span ref={percentRef}>0</span>
            <span className="text-white">%</span>
          </div>
        </div>

        <div className="absolute top-0 left-0 w-full h-[1px] bg-black/20 overflow-hidden loader-text-item">
          <div
            ref={loaderBarRef}
            className="absolute top-0 left-0 h-full bg-white w-0"
          />
        </div>
      </div>

      {/* 2. MAIN CONTENT (Only visible behind loader during exit) */}
      <main className="relative z-10 w-full overflow-hidden bg-[#0a0a0a]">
        {/* Navigation Grid Line Style */}
        <header className="site-dynamic-header fixed top-0 left-0 w-full z-50 flex justify-between items-center px-6 py-4 md:px-12 md:py-6 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/10 pointer-events-none">
          <div className="font-mono text-xs uppercase tracking-widest text-white pointer-events-auto overflow-hidden h-[16px] relative min-w-[200px] text-left">
              <div className="header-label-track absolute top-0 left-0 w-full flex flex-col">
                <div className="h-[16px] leading-[16px]">
                ONBOARDING <span className="text-[#e53935]">{"///"}</span>{" "}
                BRAND
              </div>
              <div className="h-[16px] leading-[16px]">
                whyTO <span className="text-[#e53935]">{"///"}</span> CONTEXT
              </div>
              <div className="h-[16px] leading-[16px]">
                howTO <span className="text-[#e53935]">{"///"}</span>{" "}
                KNOWLEDGE
              </div>
              <div className="h-[16px] leading-[16px]">
                ARCHETYPES <span className="text-[#e53935]">{"///"}</span> 12
              </div>
            </div>
          </div>
          <div className="pointer-events-auto">
            <LanguageToggle />
          </div>
        </header>

        {/* HERO SECTION */}
        <section
          data-section="hero"
          className="hero-container relative h-[100svh] w-full flex flex-col justify-end pb-12 md:pb-24 px-6 md:px-12 border-b border-white/10"
        >
          {/* Abstract background element (Wodniack's glowing orb style) */}
          <div className="abstract-orb absolute top-[20%] right-[10%] w-[50vw] h-[50vw] rounded-full bg-[#e53935] blur-[120px] opacity-20 pointer-events-none mix-blend-screen" />

          {/* Grid lines for architectural feel */}
          <div className="absolute top-0 left-[25vw] w-[1px] h-full bg-white/5 hidden md:block grid-border-reveal origin-top" />
          <div className="absolute top-0 left-[75vw] w-[1px] h-full bg-white/5 hidden md:block grid-border-reveal origin-top" />

          <div className="relative z-10 w-full flex flex-col md:flex-row justify-between items-end gap-12">
            {/* Massive Title */}
            <div className="w-full md:w-[70vw]">
              <div className="font-mono text-xs uppercase tracking-[0.3em] text-[#e53935] mb-6 hero-fade-in">
                <I18nText
                  zh="心智 · 身体 · 双手的脚手架"
                  en="scaffolding for mind · body · hands"
                />
              </div>
              <h1 className="text-[14vw] md:text-[11vw] font-bold leading-[0.85] tracking-tighter uppercase m-0 flex flex-col">
                <div className="hero-title-line overflow-hidden py-2">
                  <div className="hero-title-inner">
                    <I18nText zh="品牌" en="BRAND" />
                  </div>
                </div>
                <div className="hero-title-line overflow-hidden py-2">
                  <div className="hero-title-inner text-[#e53935]">
                    <I18nText zh="十二人格" en="ARCHETYPES" />
                  </div>
                </div>
              </h1>
            </div>

            {/* Side Paragraph */}
            <div className="w-full md:w-[25vw] hero-fade-in pl-0 md:pl-8">
              <p className="text-sm md:text-base text-[#a0a0a0] leading-relaxed mb-6 font-mono">
                <I18nText
                  zh="没有标准答案。我们唯一的要求是你保持诚实。这是通向品牌内核的一场解构之旅。"
                  en="No right answers. The only thing we ask is that you stay honest. A deconstructive journey to the brand's core."
                />
              </p>
              <div className="w-full h-[1px] bg-white/10 mb-6" />
              <div className="flex justify-between font-mono text-xs text-[#666]">
                <span>SYSTEM</span>
                <span>PROCESSTA 1.0</span>
              </div>
            </div>
          </div>
        </section>

        {/* STATEMENT SECTION (whyTO) */}
        <section
          data-section="whyto"
          className="relative w-full py-32 md:py-48 px-6 md:px-12 border-b border-white/10 bg-[#0a0a0a] text-white"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="col-span-1 md:col-span-3 font-mono text-xs uppercase tracking-widest text-[#666] scroll-fade-up">
              whyTO <span className="text-[#e53935]">{"///"}</span>{" "}
              <I18nText zh="语境" en="CONTEXT" />
            </div>

            <div className="col-span-1 md:col-span-9 scroll-fade-up">
              <h2 className="text-[6vw] md:text-[4.5vw] font-bold leading-[1.2] tracking-tight uppercase">
                <I18nText
                  block
                  zh={
                    <>
                      你不能坐巴士抵达那里，只能通过
                      <span className="text-[#e53935]">艰难工作和冒险</span>
                      ，以及
                      <span className="text-[#e53935]">
                        并不完全知道自己在做什么
                      </span>
                      。
                    </>
                  }
                  en={
                    <>
                      You can&apos;t get there by bus, only by{" "}
                      <span className="text-[#e53935]">hard work and risk</span>{" "}
                      and by{" "}
                      <span className="text-[#e53935]">
                        not quite knowing what you&apos;re doing
                      </span>
                      .
                    </>
                  }
                />
              </h2>

              <p className="mt-12 text-lg md:text-xl text-[#666] max-w-2xl leading-relaxed font-mono">
                <I18nText
                  zh="建立品牌不是最终目标；目标是让品牌成为每个人成长和创造性行动的反应容器。"
                  en="Building a brand is not the destination; the aim is to make the brand a responsive container for growth and creative action."
                />
              </p>
            </div>
          </div>
        </section>

        {/* METHOD SECTION (howTO) - Technical List Style */}
        <section
          data-section="howto"
          className="relative w-full py-32 md:py-48 px-6 md:px-12 border-b border-white/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
            <div className="col-span-1 md:col-span-3 font-mono text-xs uppercase tracking-widest text-[#666] scroll-fade-up">
              howTO <span className="text-[#e53935]">{"///"}</span>{" "}
              <I18nText zh="知识" en="KNOWLEDGE" />
            </div>

            <div className="col-span-1 md:col-span-9 w-full">
              <div className="scroll-reveal-text mb-16">
                <div className="overflow-hidden py-2">
                  <div className="scroll-reveal-inner text-[6vw] md:text-[4vw] font-bold uppercase leading-none">
                    42 QUESTIONS
                  </div>
                </div>
                <div className="overflow-hidden py-2">
                  <div className="scroll-reveal-inner text-[6vw] md:text-[4vw] font-bold uppercase leading-none text-[#e53935]">
                    FOUR PHASES
                  </div>
                </div>
              </div>

              {/* The Technical List */}
              <div className="w-full border-t border-white/10">
                {[
                  {
                    phase: "01",
                    name: "ROOT",
                    nameZh: "根系",
                    range: "Q1 — Q16",
                    count: "16 questions",
                    countZh: "16 题",
                    q: "16 Qs",
                    descEn:
                      "North Star, identity positioning, internal structure. The deepest excavation.",
                    descZh:
                      "北极星、身份定位、内部结构。最深的挖掘。",
                  },
                  {
                    phase: "02",
                    name: "TRUNK",
                    nameZh: "枝干",
                    range: "Q17 — Q29",
                    count: "13 questions",
                    countZh: "13 题",
                    q: "13 Qs",
                    descEn:
                      "Beliefs and expression. How conviction becomes voice.",
                    descZh: "信念与表达。确信如何变成声音。",
                  },
                  {
                    phase: "03",
                    name: "BARK",
                    nameZh: "树皮",
                    range: "Q30 — Q33",
                    count: "4 questions",
                    countZh: "4 题",
                    q: "4 Qs",
                    descEn:
                      "Taste immune system. What you reject is who you are.",
                    descZh:
                      "品味免疫系统。你拒绝什么，定义了你是谁。",
                  },
                  {
                    phase: "04",
                    name: "CANOPY",
                    nameZh: "树冠",
                    range: "Q34 — Q42",
                    count: "9 questions",
                    countZh: "9 题",
                    q: "9 Qs",
                    descEn:
                      "Content architecture and integration. The visible canopy.",
                    descZh: "内容架构与整合。可见的树冠。",
                  },
                ].map((item) => {
                  const isOpen = expandedPhase === item.name;
                  return (
                    <div
                      key={item.name}
                      className="border-b border-white/10 scroll-fade-up"
                    >
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        onClick={() =>
                          setExpandedPhase(isOpen ? null : item.name)
                        }
                        className={`group flex w-full items-center justify-between px-4 py-8 transition-colors duration-300 cursor-pointer ${
                          isOpen ? "bg-white/[0.04]" : "hover:bg-white/5"
                        }`}
                      >
                        <span className="font-mono text-sm text-[#666]">
                          {item.phase}
                        </span>
                        <span
                          className={`text-3xl md:text-5xl font-bold uppercase transition-colors duration-300 ${
                            isOpen
                              ? "text-[#e53935]"
                              : "group-hover:text-[#e53935]"
                          }`}
                        >
                          {item.name}
                        </span>
                        <span className="flex items-center gap-3 font-mono text-sm text-[#e0e0e0]">
                          <span>{item.q}</span>
                          <span
                            aria-hidden="true"
                            className={`inline-block text-lg leading-none transition-transform duration-500 ease-[cubic-bezier(0.86,0,0.07,1)] ${
                              isOpen
                                ? "rotate-45 text-[#e53935]"
                                : "text-[#666] group-hover:text-[#e0e0e0]"
                            }`}
                          >
                            +
                          </span>
                        </span>
                      </button>
                      <div
                        className="grid transition-[grid-template-rows] duration-500 ease-[cubic-bezier(0.86,0,0.07,1)]"
                        style={{
                          gridTemplateRows: isOpen ? "1fr" : "0fr",
                        }}
                      >
                        <div className="overflow-hidden">
                          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 px-4 pb-10 pt-2">
                            <div className="md:col-span-3 font-mono text-xs uppercase tracking-widest text-[#666]">
                              <span className="text-[#e0e0e0] text-base normal-case tracking-normal">
                                <I18nText
                                  zh={item.nameZh}
                                  en={item.name.charAt(0) + item.name.slice(1).toLowerCase()}
                                />
                              </span>
                              <span className="block mt-2">
                                {item.range}{" "}
                                <span className="text-[#e53935]">·</span>{" "}
                                <I18nText
                                  zh={item.countZh}
                                  en={item.count}
                                />
                              </span>
                            </div>
                            <div className="md:col-span-9 text-base md:text-lg text-[#a0a0a0] leading-relaxed">
                              <I18nText
                                zh={item.descZh}
                                en={item.descEn}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* WODNIACK HOVER GALLERY (The Signature Effect) */}
        <section
          data-section="archetypes"
          ref={gallerySectionRef}
          className="relative w-full py-32 md:py-48 px-6 md:px-12 border-b border-white/10"
        >
          {/* THE FLOATING IMAGE (Follows cursor) */}
          <div
            ref={hoverImgContainerRef}
            className="fixed top-0 left-0 pointer-events-none z-40 opacity-0 scale-50 -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative flex items-center justify-center w-40 h-40 md:w-56 md:h-56 overflow-hidden rounded-full border-4 border-[#e53935] bg-white shadow-2xl">
              <div className="absolute inset-0 bg-[#e53935] mix-blend-multiply opacity-20 z-10 pointer-events-none" />
              {/* Using standard img here because src is dynamic and we need raw DOM speed */}
              <img
                ref={hoverImgRef}
                src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"
                alt="Hover Preview"
                className="w-full h-full object-cover object-top grayscale"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-12 relative z-10">
            <div className="col-span-1 md:col-span-3 font-mono text-xs uppercase tracking-widest text-[#666] scroll-fade-up">
              ARCHETYPES <span className="text-[#e53935]">{"///"}</span> 12
            </div>

            <div
              className="col-span-1 md:col-span-9"
              onMouseLeave={handleMouseLeave}
            >
              <div className="mb-16 scroll-fade-up">
                <p className="text-lg md:text-xl text-[#a0a0a0] max-w-2xl leading-relaxed font-mono">
                  <I18nText
                    zh="每一种人格都有一张手绘肖像。在你的旅程中，真正属于你的那些人格会被逐步揭示。"
                    en="Each archetype is anchored by a hand-drawn portrait. During your journey, only the archetypes that belong to you will reveal their faces."
                  />
                </p>
              </div>

              {archetypes.map((archetype, i) => (
                <div
                  key={archetype.id}
                  className="w-full border-b border-white/10 group cursor-pointer"
                  onMouseEnter={() => handleMouseEnter(archetype.avatar)}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="scroll-clip-reveal flex justify-between items-end overflow-hidden py-10 md:py-16 px-4 group-hover:px-8 transition-all duration-500">
                    <h3 className="overflow-hidden text-4xl md:text-7xl font-bold uppercase tracking-tighter group-hover:text-[#e53935] transition-colors duration-300 leading-none">
                      <span className="scroll-clip-inner block will-change-transform">
                        <I18nText zh={archetype.nameZh} en={archetype.nameEn} />
                      </span>
                    </h3>
                    <span className="overflow-hidden font-mono text-sm text-[#666] group-hover:text-[#e0e0e0] transition-colors duration-300 pb-2">
                      <span className="scroll-clip-inner block will-change-transform">
                        {(i + 1).toString().padStart(2, "0")}
                      </span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA SECTION — floating panel with goo orb */}
        <section
          ref={ctaRef}
          data-section="cta"
          className="cta-section relative isolate z-20 flex min-h-[100svh] w-full items-center justify-center overflow-hidden bg-[#0a0a0a] px-4 py-14 md:px-12 md:py-20"
        >
          <div className="cta-panel">
            <span className="cta-crop tl" aria-hidden="true" />
            <span className="cta-crop tr" aria-hidden="true" />
            <span className="cta-crop bl" aria-hidden="true" />
            <span className="cta-crop br" aria-hidden="true" />

            <div className="cta-meta cta-meta--tl">
              <I18nText zh="访问协议" en="ACCESS PROTOCOL" />{" "}
              <span className="cta-meta__sep">{"///"}</span> 02
            </div>
            <div className="cta-meta cta-meta--tr">
              <I18nText zh="准备就绪" en="READY TO BEGIN" />
            </div>
            <div className="cta-meta cta-meta--bl">PROCESSTA 1.0</div>
            <div className="cta-meta cta-meta--br">
              <I18nText zh="点击进入" en="TAP TO ENTER" />
            </div>

            <div
              className={`cta-stage ${showEngaged ? "is-engaged" : ""} ${
                showWarping ? "is-warping" : ""
              } ${showRevealed ? "is-revealed" : ""}`}
            >
              <button
                type="button"
                className="cta-stage__trigger"
                onClick={enterAccessMode}
                disabled={isEntryLocked}
                aria-label="Start the test"
              >
                <span className="cta-word cta-word--start">START</span>
                <span className="cta-word cta-word--test">THE TEST</span>
              </button>
              <span className="cta-ink" aria-hidden="true" />
            </div>

            <div
              className={`cta-form-layer ${showRevealed ? "is-active" : ""}`}
              aria-hidden={!showRevealed}
            >
              <form
                className="cta-form-content"
                onSubmit={submitAccessCode}
                autoComplete="off"
              >
                  <div className="cta-form-eyebrow">
                    ACCESS PROTOCOL{" "}
                    <span className="cta-form-eyebrow__sep">{"///"}</span>{" "}
                    <I18nText zh="校验码" en="CODE" />
                  </div>
                  <label className="cta-form-field">
                    <span className="sr-only">
                      <I18nText zh="输入访问码" en="Enter access code" />
                    </span>
                    <input
                      ref={accessInputRef}
                      className="cta-form-input"
                      type="text"
                      name="access-protocol-code"
                      value={accessCode}
                      onChange={(event) =>
                        handleAccessCodeChange(event.target.value)
                      }
                      placeholder="XXXX - XXXX - XXXX"
                      maxLength={14}
                      autoCapitalize="characters"
                      autoComplete="off"
                      autoCorrect="off"
                      spellCheck={false}
                      data-1p-ignore="true"
                      data-lpignore="true"
                      data-form-type="other"
                      disabled={!isTestEntryActive || isVerifying}
                    />
                  </label>
                  <div className="cta-form-row">
                    <div>
                      {accessError ? (
                        <p className="cta-form-error" role="alert">
                          {accessError === "length" ? (
                            <I18nText
                              zh="访问码为 12 位"
                              en="Access codes are 12 characters"
                            />
                          ) : accessError === "revoked" ? (
                            <I18nText
                              zh="此访问码已被撤销"
                              en="This code has been revoked"
                            />
                          ) : accessError === "completed" ? (
                            <I18nText
                              zh="此访问码已使用完成"
                              en="This code has already been completed"
                            />
                          ) : accessError === "network" ? (
                            <I18nText
                              zh="网络错误，请重试"
                              en="Network error, try again"
                            />
                          ) : (
                            <I18nText
                              zh="此访问码无法识别"
                              en="This code is not recognized"
                            />
                          )}
                        </p>
                      ) : null}
                      <button
                        type="button"
                        className="cta-form-help"
                        onClick={() => setShowHowToGet(true)}
                      >
                        <I18nText zh="如何获取访问码" en="How to get one" />
                      </button>
                      <p className="cta-form-meta">
                        <I18nText
                          zh="下载完整的 42 题提示文件。在你自己的 Claude Cowork 或 Claude Code 中使用 — 无需注册，无需邮箱。"
                          en="Get the full 42-question prompt file. Use it in your own Claude Cowork or Claude Code environment — no sign-up, no email gate."
                        />
                      </p>
                      <a
                        href="/brand-archetypes-v5.md"
                        download
                        className="cta-form-help cta-form-help--download"
                      >
                        <I18nText zh="下载 .md" en="Download .md" />
                      </a>
                    </div>
                    <button
                      className="cta-form-submit"
                      type="submit"
                      disabled={!isTestEntryActive || isVerifying}
                    >
                      {isVerifying ? (
                        <>
                          VERIFYING{" "}
                          <span className="cta-form-submit__sep">/</span> 校验中
                        </>
                      ) : (
                        <>
                          VERIFY{" "}
                          <span className="cta-form-submit__sep">/</span> 校验
                        </>
                      )}
                    </button>
                  </div>
              </form>
            </div>
          </div>

          <svg
            className="cta-goo-defs"
            width="0"
            height="0"
            aria-hidden="true"
          >
            <defs>
              <filter id="cta-goo">
                <feGaussianBlur
                  in="SourceGraphic"
                  stdDeviation="14"
                  result="blur"
                />
                <feColorMatrix
                  in="blur"
                  mode="matrix"
                  values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 22 -10"
                  result="goo"
                />
                <feBlend in="SourceGraphic" in2="goo" />
              </filter>
            </defs>
          </svg>
        </section>
      </main>
      {isEntryLocked ? null : <EdupunkBounceFooter />}
      <HowToGetPanel
        open={showHowToGet}
        onClose={() => setShowHowToGet(false)}
      />
      {testEntryState === "verified" ? (
        <InterviewOverlay code={verifiedCode} />
      ) : null}
    </div>
  );
}
