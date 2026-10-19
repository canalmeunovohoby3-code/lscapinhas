import {
  useEffect,
  useRef,
  useState,
  type MouseEvent,
  type ReactNode,
  type TouchEvent,
  type TransitionEvent,
} from 'react';
import { Link } from 'react-router-dom';
import type { HomeBanner } from '../data/banners';
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from './Icons';

const AUTOPLAY_MS = 2500;
const RESUME_MS = 8000;
const SWIPE_THRESHOLD = 44;

export function HomeCarousel({ banners }: { banners: HomeBanner[] }) {
  const count = banners.length;
  const hasMultiple = count > 1;

  const [position, setPosition] = useState(hasMultiple ? 1 : 0);
  const [animate, setAnimate] = useState(true);
  const [focusPaused, setFocusPaused] = useState(false);
  const [pausedByUser, setPausedByUser] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const resumeTimer = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const swiped = useRef(false);

  const activeIndex = count > 0 ? ((position - 1 + count) % count + count) % count : 0;

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(query.matches);
    const handleChange = (event: MediaQueryListEvent) => setReducedMotion(event.matches);
    query.addEventListener?.('change', handleChange);
    return () => query.removeEventListener?.('change', handleChange);
  }, []);

  useEffect(() => {
    setAnimate(false);
    setPosition(hasMultiple ? 1 : 0);
  }, [count, hasMultiple]);

  useEffect(() => {
    if (animate) return undefined;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  useEffect(() => {
    if (banners.length <= 1) return undefined;
    const timer = window.setTimeout(() => {
      const useMobile = window.matchMedia('(max-width: 760px)').matches;
      banners.slice(1).forEach((banner) => {
        const image = new Image();
        image.src = useMobile ? banner.mobileImage : banner.desktopImage;
      });
    }, 400);
    return () => window.clearTimeout(timer);
  }, [banners]);

  useEffect(() => {
    if (count <= 1 || !animate || focusPaused || pausedByUser) {
      return undefined;
    }
    const timer = window.setTimeout(() => {
      if (reducedMotion) {
        setAnimate(false);
        setPosition((current) => {
          const currentIndex = ((current - 1 + count) % count + count) % count;
          return ((currentIndex + 1) % count) + 1;
        });
        return;
      }
      setPosition((current) => current + 1);
    }, AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [position, animate, count, focusPaused, pausedByUser, reducedMotion]);

  useEffect(
    () => () => {
      if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    },
    [],
  );

  if (count === 0) return null;

  function holdAutoPlay() {
    setPausedByUser(true);
    if (resumeTimer.current !== null) window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => {
      setPausedByUser(false);
      resumeTimer.current = null;
    }, RESUME_MS);
  }

  function advance(direction: 1 | -1) {
    if (!hasMultiple) return;

    if (reducedMotion) {
      const target = (activeIndex + direction + count) % count;
      setAnimate(false);
      setPosition(target + 1);
      return;
    }

    setAnimate(true);
    if (direction === 1 && activeIndex === count - 1) {
      setPosition(count + 1);
    } else if (direction === -1 && activeIndex === 0) {
      setPosition(0);
    } else {
      setPosition(activeIndex + 1 + direction);
    }
  }

  function goToSlide(index: number) {
    if (!hasMultiple) return;
    holdAutoPlay();
    setAnimate(!reducedMotion);
    setPosition(index + 1);
  }

  function handleNext() {
    if (!hasMultiple) return;
    holdAutoPlay();
    advance(1);
  }

  function handlePrevious() {
    if (!hasMultiple) return;
    holdAutoPlay();
    advance(-1);
  }

  function handleTrackTransitionEnd(event: TransitionEvent<HTMLDivElement>) {
    if (event.target !== event.currentTarget || !animate) return;
    if (position === count + 1) {
      setAnimate(false);
      setPosition(1);
    } else if (position === 0) {
      setAnimate(false);
      setPosition(count);
    }
  }

  function handleTouchStart(event: TouchEvent<HTMLDivElement>) {
    if (!hasMultiple) return;
    touchStartX.current = event.touches[0].clientX;
    swiped.current = false;
    holdAutoPlay();
  }

  function handleTouchEnd(event: TouchEvent<HTMLDivElement>) {
    if (touchStartX.current === null || !hasMultiple) return;
    const delta = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(delta) >= SWIPE_THRESHOLD) {
      swiped.current = true;
      advance(delta < 0 ? 1 : -1);
      window.setTimeout(() => {
        swiped.current = false;
      }, 400);
    }
  }

  function handleSlideClick(event: MouseEvent<HTMLElement>) {
    if (swiped.current) {
      event.preventDefault();
      return;
    }
    holdAutoPlay();
  }

  function renderSlide(
    banner: HomeBanner,
    slideIndex: number,
    isClone: boolean,
  ): ReactNode {
    const displayIndex = ((slideIndex - 1 + count) % count + count) % count;
    const isActive = !isClone && slideIndex === position;
    const isFirstReal = !isClone && displayIndex === 0;

    const content = (
      <>
        <picture>
          <source media="(max-width: 760px)" srcSet={banner.mobileImage} />
          <img
            {...(isFirstReal
              ? ({ fetchpriority: 'high' } as Record<string, string>)
              : {})}
            src={banner.desktopImage}
            alt={banner.imageAlt}
            width={1920}
            height={706}
            loading={isFirstReal ? 'eager' : 'lazy'}
            draggable={false}
          />
        </picture>

        {banner.showContent !== false && (
          <div className="home-banner-content">
            <p className="home-banner-eyebrow">{banner.eyebrow}</p>
            <h2>{banner.title}</h2>
            <p className="home-banner-subtitle">{banner.subtitle}</p>
            <span className="home-banner-cta">
              {banner.ctaLabel}
              <ArrowRightIcon width={15} height={15} />
            </span>
          </div>
        )}
      </>
    );

    const commonProps = {
      className: 'home-banner-link',
      onClick: handleSlideClick,
      tabIndex: isActive ? 0 : -1,
      'aria-label': `${banner.title} — ${banner.ctaLabel}`,
    };

    let link: ReactNode;
    if (!banner.href) {
      link = <div className="home-banner-link home-banner-link--static">{content}</div>;
    } else if (/^https?:\/\//i.test(banner.href)) {
      link = (
        <a
          {...commonProps}
          href={banner.href}
          target="_blank"
          rel="noopener noreferrer"
        >
          {content}
        </a>
      );
    } else {
      link = (
        <Link {...commonProps} to={banner.href}>
          {content}
        </Link>
      );
    }

    return (
      <div
        key={`${isClone ? 'clone' : 'real'}-${slideIndex}-${banner.id}`}
        className={`home-banner-slide home-banner-slide--${banner.theme}`}
        role="group"
        aria-roledescription="slide"
        aria-label={`${displayIndex + 1} de ${count}`}
        aria-hidden={!isActive}
      >
        {link}
      </div>
    );
  }

  const slides: ReactNode[] = [];
  if (hasMultiple) {
    slides.push(renderSlide(banners[count - 1], 0, true));
    banners.forEach((banner, index) => {
      slides.push(renderSlide(banner, index + 1, false));
    });
    slides.push(renderSlide(banners[0], count + 1, true));
  } else {
    slides.push(renderSlide(banners[0], 0, false));
  }

  return (
    <section
      className="home-banner"
      aria-roledescription="carrossel"
      aria-label="Banners da LS Case"
      onFocusCapture={() => setFocusPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
          setFocusPaused(false);
        }
      }}
    >
      <div
        className="home-banner-viewport"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="home-banner-track"
          style={{
            transform: `translateX(-${position * 100}%)`,
            transition: reducedMotion || !animate ? 'none' : undefined,
          }}
          onTransitionEnd={handleTrackTransitionEnd}
        >
          {slides}
        </div>
      </div>

      {count > 1 && (
        <div className="home-banner-controls">
          <button
            type="button"
            className="home-banner-arrow"
            onClick={handlePrevious}
            aria-label="Banner anterior"
          >
            <ChevronLeftIcon width={17} height={17} />
          </button>

          <div className="home-banner-dots" role="group" aria-label="Selecionar banner">
            {banners.map((banner, index) => (
              <button
                key={banner.id}
                type="button"
                className={`home-banner-dot${index === activeIndex ? ' is-active' : ''}`}
                onClick={() => goToSlide(index)}
                aria-label={`Ir para o banner ${index + 1}: ${banner.title}`}
                aria-current={index === activeIndex ? 'true' : undefined}
              />
            ))}
          </div>

          <button
            type="button"
            className="home-banner-arrow"
            onClick={handleNext}
            aria-label="Próximo banner"
          >
            <ChevronRightIcon width={17} height={17} />
          </button>
        </div>
      )}
    </section>
  );
}
