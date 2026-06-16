/* ============================================================
   ACM TechTalk 2026 — Interactive JavaScript
   ============================================================ */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // 0. LOADING SCREEN — quick dismiss with swipe-up
  // ----------------------------------------------------------
  const loader = document.getElementById('loaderOverlay');
  const loaderContent = document.getElementById('loaderContent');
  if (loader && loaderContent) {
    document.body.classList.add('loading');
    const minDisplayTime = 600; // ms — keep loader visible at least this long
    const startTime = performance.now();

    function dismissLoader() {
      const elapsed = performance.now() - startTime;
      const remaining = Math.max(0, minDisplayTime - elapsed);

      setTimeout(() => {
        // 1) Fade out the logo (stays centered on screen)
        loaderContent.classList.add('loader-fade');

        // 2) After logo fades, slide the background overlay up
        setTimeout(() => {
          loader.classList.add('loader-exit');
          document.body.classList.remove('loading');

          loader.addEventListener('transitionend', () => {
            loader.classList.add('loader-hidden');
            loaderContent.classList.add('loader-hidden');
          }, { once: true });
        }, 200); // wait for logo fade (300ms transition, start slide at 200ms)
      }, remaining);
    }

    // Dismiss when page is fully loaded (images etc.)
    if (document.readyState === 'complete') {
      dismissLoader();
    } else {
      window.addEventListener('load', dismissLoader, { once: true });
    }
  }

  // ----------------------------------------------------------
  // 1. THEME TOGGLE (persisted via localStorage)
  // ----------------------------------------------------------
  const themeToggle = document.getElementById('themeToggle');
  const root = document.documentElement;

  function getPreferredTheme() {
    const stored = localStorage.getItem('acm-theme');
    if (stored) return stored;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function setTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem('acm-theme', theme);
    themeToggle.setAttribute('aria-label', `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`);
  }

  setTheme(getPreferredTheme());

  themeToggle.addEventListener('click', () => {
    const current = root.getAttribute('data-theme');
    setTheme(current === 'dark' ? 'light' : 'dark');
  });

  // Listen for system preference changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('acm-theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });


  // ----------------------------------------------------------
  // 2. NAVBAR — scroll state & mobile toggle
  // ----------------------------------------------------------
  const navbar = document.getElementById('navbar');
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  let lastScrollY = 0;

  function handleNavScroll() {
    const y = window.scrollY;
    navbar.classList.toggle('scrolled', y > 40);
    lastScrollY = y;
  }

  window.addEventListener('scroll', handleNavScroll, { passive: true });
  handleNavScroll();

  // Mobile nav
  navToggle.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    navToggle.classList.toggle('active', isOpen);
    navToggle.setAttribute('aria-expanded', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      navToggle.classList.remove('active');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // ----------------------------------------------------------
  // 2b. SCROLLSPY (Highlight Nav Links on Scroll)
  // ----------------------------------------------------------
  const sections = document.querySelectorAll('section[id], header[id]');
  const navItems = document.querySelectorAll('.nav-links a[href^="#"], .nav-links a[href^="index.html#"]');

  if (sections.length > 0 && navItems.length > 0) {
    const scrollSpyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navItems.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            // Support both direct IDs (index.html) and paths with hashes (register.html)
            if (href === `#${id}` || href === `index.html#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, {
      // Trigger when the section crosses the middle of the viewport
      rootMargin: '-40% 0px -60% 0px',
      threshold: 0
    });

    sections.forEach(section => scrollSpyObserver.observe(section));
  }


  // ----------------------------------------------------------
  // 3. SCROLL-TRIGGERED REVEALS (Intersection Observer)
  // ----------------------------------------------------------
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!prefersReducedMotion) {
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            setTimeout(() => entry.target.classList.add('reveal-done'), 1000);
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -40px 0px' }
    );

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    // If reduced motion, make everything visible immediately
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  }

  // ----------------------------------------------------------
  // 3b. TIMELINE SCROLL ANIMATION
  // ----------------------------------------------------------
  const timeline = document.querySelector('.timeline');
  if (timeline) {
    let maxLineH = 0; // Keep track of the furthest it has drawn
    const handleTimelineScroll = () => {
      const rect = timeline.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      
      // Calculate how far the timeline is down the screen.
      // Reveal threshold is -40px, so we use -20px to draw the line slightly ahead of the content revealing.
      let lineH = (windowHeight - 20) - rect.top;
      
      if (lineH < 0) lineH = 0;
      if (lineH > rect.height) lineH = rect.height;
      
      // Only draw forward, never backward
      if (lineH > maxLineH) {
        maxLineH = lineH;
        timeline.style.setProperty('--line-height', `${maxLineH}px`);
      }
    };

    if (!prefersReducedMotion) {
      window.addEventListener('scroll', handleTimelineScroll, { passive: true });
      handleTimelineScroll(); // Initial state
    } else {
      // If reduced motion, show full line immediately
      timeline.style.setProperty('--line-height', '100%');
    }
  }


  // ----------------------------------------------------------
  // 4. COUNTDOWN TIMER — September 14, 2026 @ 8:30 AM IST
  // ----------------------------------------------------------
  const countdownEl = document.getElementById('countdownText');
  if (countdownEl) {
    // Event: September 14, 2026, 8:30 AM IST (UTC+5:30)
    const eventDate = new Date('2026-09-14T08:30:00+05:30');

    function updateCountdown() {
      const now = new Date();
      const diff = eventDate - now;

      if (diff <= 0) {
        countdownEl.textContent = 'Event is LIVE!';
        return;
      }

      // Calculate months by stepping through calendar months
      let months = 0;
      const temp = new Date(now);
      while (true) {
        const next = new Date(temp);
        next.setMonth(next.getMonth() + 1);
        if (next > eventDate) break;
        months++;
        temp.setMonth(temp.getMonth() + 1);
      }

      // Remaining time after subtracting full months
      const afterMonths = new Date(now);
      afterMonths.setMonth(afterMonths.getMonth() + months);
      const remaining = eventDate - afterMonths;

      const days  = Math.floor(remaining / (1000 * 60 * 60 * 24));
      const hours = Math.floor((remaining / (1000 * 60 * 60)) % 24);
      const mins  = Math.floor((remaining / (1000 * 60)) % 60);
      const secs  = Math.floor((remaining / 1000) % 60);

      let parts = [];
      if (months > 0) parts.push(`${months}mo`);
      parts.push(`${days}d`);
      parts.push(`${String(hours).padStart(2, '0')}h`);
      parts.push(`${String(mins).padStart(2, '0')}m`);
      parts.push(`${String(secs).padStart(2, '0')}s`);

      countdownEl.textContent = parts.join(' ');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
  }


  // ----------------------------------------------------------
  // 5. HERO CANVAS — Animated Circuit Board Pattern
  //    (Signature Element)
  // ----------------------------------------------------------
  const canvas = document.getElementById('heroCanvas');
  if (canvas && !prefersReducedMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, nodes, edges, pulses;
    let animFrameId;
    let dpr = window.devicePixelRatio || 1;

    // Circuit board config
    const CONFIG = {
      nodeCount: 35,
      connectionDistance: 200,
      nodeRadius: 2.5,
      pulseSpeed: 0.0025,   // slow and steady
      pulseLength: 0.15,
      lineWidth: 1.5,
      glowRadius: 44,
      fadeZone: 0.10,       // fraction of path to fade in/out at each end
    };

    function resize() {
      // Fixed to viewport — canvas covers entire screen
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width  = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createNodes() {
      nodes = [];
      // Place nodes on a rough grid with jitter for circuit-board feel
      const cols = Math.ceil(Math.sqrt(CONFIG.nodeCount * (w / h)));
      const rows = Math.ceil(CONFIG.nodeCount / cols);
      const cellW = w / cols;
      const cellH = h / rows;

      for (let i = 0; i < CONFIG.nodeCount; i++) {
        const col = i % cols;
        const row = Math.floor(i / cols);
        nodes.push({
          x: cellW * (col + 0.5) + (Math.random() - 0.5) * cellW * 0.6,
          y: cellH * (row + 0.5) + (Math.random() - 0.5) * cellH * 0.6,
          vx: (Math.random() - 0.5) * 0.15,
          vy: (Math.random() - 0.5) * 0.15,
        });
      }
    }

    function createEdges() {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONFIG.connectionDistance) {
            edges.push({ a: i, b: j, dist });
          }
        }
      }
    }

    function createPulses() {
      pulses = [];
      // Steady set of travelling pulses — fixed speed, all forward
      const edgeCount = Math.min(edges.length, 12);
      const shuffled = [...edges].sort(() => Math.random() - 0.5).slice(0, edgeCount);
      shuffled.forEach(edge => {
        pulses.push({
          edge,
          t: Math.random(), // staggered start positions
          speed: CONFIG.pulseSpeed,
          forward: true,
        });
      });
    }

    function getColors() {
      const isDark = root.getAttribute('data-theme') === 'dark';
      return {
        line:  isDark ? 'rgba(0, 142, 207, 0.16)' : 'rgba(0, 142, 207, 0.14)',
        node:  isDark ? 'rgba(111, 189, 227, 0.25)' : 'rgba(0, 142, 207, 0.22)',
        pulse: isDark ? 'rgba(111, 189, 227, 0.75)' : 'rgba(0, 142, 207, 0.70)',
        glow:  isDark ? 'rgba(111, 189, 227, 0.25)' : 'rgba(0, 142, 207, 0.18)',
      };
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      const colors = getColors();

      // Move nodes slightly (subtle drift)
      nodes.forEach(n => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      });

      // Recalculate edges periodically (every ~120 frames approx)
      // Actually, for perf keep them static — the drift is subtle enough

      // --- Zig-zag staircase helper ---
      // Returns array of points forming a serpentine route from A to B
      function zigzagPath(ax, ay, bx, by, steps) {
        const pts = [{ x: ax, y: ay }];
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          if (i % 2 === 1) {
            // horizontal step
            pts.push({ x: ax + (bx - ax) * t, y: pts[pts.length - 1].y });
          } else {
            // vertical step
            pts.push({ x: pts[pts.length - 1].x, y: ay + (by - ay) * t });
          }
        }
        // Ensure we end at (bx, by)
        const last = pts[pts.length - 1];
        if (last.x !== bx || last.y !== by) {
          pts.push({ x: bx, y: by });
        }
        return pts;
      }

      // Draw edges — zig-zag staircase circuit routing
      ctx.lineWidth = CONFIG.lineWidth;
      edges.forEach(({ a, b }) => {
        const na = nodes[a];
        const nb = nodes[b];
        const pts = zigzagPath(na.x, na.y, nb.x, nb.y, 2);
        ctx.strokeStyle = colors.line;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.stroke();
      });

      // Draw nodes
      nodes.forEach(n => {
        ctx.fillStyle = colors.node;
        ctx.beginPath();
        ctx.arc(n.x, n.y, CONFIG.nodeRadius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw pulses — follow zig-zag path, fade at ends
      pulses.forEach(p => {
        p.t += p.speed;
        if (p.t >= 1) p.t = 0;

        const na = nodes[p.edge.a];
        const nb = nodes[p.edge.b];

        // Build zig-zag path for this edge
        const pts = zigzagPath(na.x, na.y, nb.x, nb.y, 2);

        // Calculate total path length and segment lengths
        let totalLen = 0;
        const segLens = [];
        for (let i = 1; i < pts.length; i++) {
          const len = Math.abs(pts[i].x - pts[i - 1].x) + Math.abs(pts[i].y - pts[i - 1].y);
          segLens.push(len);
          totalLen += len;
        }
        if (totalLen === 0) return;

        // Find position along the path
        let remaining = p.t * totalLen;
        let px, py;
        for (let i = 0; i < segLens.length; i++) {
          if (remaining <= segLens[i] || i === segLens.length - 1) {
            const frac = segLens[i] > 0 ? remaining / segLens[i] : 0;
            px = pts[i].x + (pts[i + 1].x - pts[i].x) * frac;
            py = pts[i].y + (pts[i + 1].y - pts[i].y) * frac;
            break;
          }
          remaining -= segLens[i];
        }

        // Fade in at start, fade out at end of path
        let alpha = 1;
        const fz = CONFIG.fadeZone;
        if (p.t < fz)           alpha = p.t / fz;
        else if (p.t > 1 - fz)  alpha = (1 - p.t) / fz;
        if (alpha <= 0) return;

        ctx.save();
        ctx.globalAlpha = alpha;

        // Circular glow
        const gradient = ctx.createRadialGradient(px, py, 0, px, py, CONFIG.glowRadius);
        gradient.addColorStop(0, colors.glow);
        gradient.addColorStop(1, 'transparent');
        ctx.beginPath();
        ctx.arc(px, py, CONFIG.glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Crisp circular dot
        ctx.fillStyle = colors.pulse;
        ctx.beginPath();
        ctx.arc(px, py, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      });

      animFrameId = requestAnimationFrame(draw);
    }

    function init() {
      resize();
      createNodes();
      createEdges();
      createPulses();
      draw();
    }

    // Debounced resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        cancelAnimationFrame(animFrameId);
        init();
      }, 200);
    });

    // Pause when not visible
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        cancelAnimationFrame(animFrameId);
      } else {
        draw();
      }
    });

    init();
  } else if (canvas && prefersReducedMotion) {
    // Static fallback: just hide the canvas
    canvas.style.display = 'none';
  }


  // ----------------------------------------------------------
  // 5. SPEAKER CARD TILT (3D micro-interaction)
  // ----------------------------------------------------------
  if (!prefersReducedMotion) {
    document.querySelectorAll('.speaker-card').forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = ((y - centerY) / centerY) * -6;
        const rotateY = ((x - centerX) / centerX) * 6;

        card.style.transform = `translateY(-8px) perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }


  // ----------------------------------------------------------
  // 6. SMOOTH SCROLL for anchor links
  // ----------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId === '#') return;

      const target = document.querySelector(targetId);
      if (target) {
        e.preventDefault();
        const navbarH = navbar.offsetHeight;
        const top = target.getBoundingClientRect().top + window.scrollY - navbarH;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });


  // ----------------------------------------------------------
  // 7. STAT COUNTER ANIMATION
  // ----------------------------------------------------------
  const statNumbers = document.querySelectorAll('.stat-number');

  if (!prefersReducedMotion && statNumbers.length > 0) {
    const countObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            animateCounter(entry.target);
            countObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.5 }
    );

    statNumbers.forEach(el => countObserver.observe(el));
  }

  function animateCounter(el) {
    const text = el.textContent.trim();
    const suffix = text.replace(/[0-9]/g, ''); // e.g. "+"
    const target = parseInt(text);
    const duration = 1200;
    const start = performance.now();

    function tick(now) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease-out quad
      const eased = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(target * eased);
      el.textContent = current + suffix;

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }


  // ----------------------------------------------------------
  // 8. REGISTRATION FORM & POPUP
  // ----------------------------------------------------------
  const registerForm = document.getElementById('registerForm');
  const popupOverlay = document.getElementById('popupOverlay');
  const popupClose = document.getElementById('popupClose');

  if (registerForm && popupOverlay && popupClose) {
    registerForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Here you would typically send the data to a backend.
      // For now, we just show the success popup.
      popupOverlay.classList.add('active');
      document.body.style.overflow = 'hidden'; // prevent scrolling behind popup
    });

    popupClose.addEventListener('click', () => {
      popupOverlay.classList.remove('active');
      document.body.style.overflow = '';
      registerForm.reset(); // clear the form
    });

    // Close if clicking outside the popup box
    popupOverlay.addEventListener('click', (e) => {
      if (e.target === popupOverlay) {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = '';
        registerForm.reset();
      }
    });
  }

  // ----------------------------------------------------------
  // 9. CUSTOM SELECT DROPDOWN
  // ----------------------------------------------------------
  const customSelect = document.getElementById('yearSelect');
  if (customSelect) {
    const selected = customSelect.querySelector('.select-selected');
    const items = customSelect.querySelector('.select-items');
    const hiddenInput = document.getElementById('regYear');
    const optionDivs = items.querySelectorAll('div');

    selected.addEventListener('click', function(e) {
      e.stopPropagation();
      this.classList.toggle('select-arrow-active');
      items.classList.toggle('select-hide');
    });

    optionDivs.forEach(opt => {
      opt.addEventListener('click', function(e) {
        // Update text
        selected.querySelector('span').innerText = this.innerText;
        // Update hidden input
        hiddenInput.value = this.getAttribute('data-value');
        
        // Update active class
        optionDivs.forEach(d => d.classList.remove('same-as-selected'));
        this.classList.add('same-as-selected');
        
        // Close dropdown
        selected.classList.remove('select-arrow-active');
        items.classList.add('select-hide');
      });
    });

    // Close when clicking outside
    document.addEventListener('click', function(e) {
      if (!customSelect.contains(e.target)) {
        selected.classList.remove('select-arrow-active');
        items.classList.add('select-hide');
      }
    });

    // Also close dropdown when clicking the popup overlay or reset the custom dropdown on form reset
    if (registerForm) {
      registerForm.addEventListener('reset', () => {
        // Reset to 1st Year on form clear
        hiddenInput.value = '1';
        selected.querySelector('span').innerText = '1st Year';
        optionDivs.forEach(d => d.classList.remove('same-as-selected'));
        optionDivs[0].classList.add('same-as-selected');
      });
    }
  }

})();
