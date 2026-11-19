(() => {
  const boat = document.getElementById('boat');
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const sailText = document.getElementById('sailText');
  const hull = document.getElementById('hull');
  const seams = document.getElementById('seams');

  // Background for each scene: off-white -> light blue -> deeper blues -> navy
  const colors = ['#f6f3ec', '#d4e8f6', '#94bfe0', '#6f9fcc', '#2d5b86', '#0f2236'];

  // Landing page: zoomed right in on the sail, mast near the left edge, boom just
  // below the fold so the hull is out of view. Returns centre (px) + scale.
  // Sail geometry in the SVG (400x520): mast x=64, boom y=414, sail ~0.97 * width tall.
  let lastSailBottom = 0;
  // Phone browsers change innerHeight as the address bar shows and hides; the
  // landing-page layout uses the height from load (or rotation) so it doesn't jump.
  let stableVh = window.innerHeight, stableVw = window.innerWidth;

  function heroFrame(vw, vh, W, isMobile) {
    const H = W * 1.3;
    let WS, boomY, mastX;
    if (isMobile) {
      // the sail fills the top of the screen; the intro text starts below the boom
      WS = Math.min(vw * 1.12, (vh * 0.6) / 0.97); // scaled boat width
      mastX = vw * 0.03;
      boomY = 100 + 0.97 * WS;
      if (boomY !== lastSailBottom) {
        lastSailBottom = boomY;
        document.documentElement.style.setProperty('--sail-bottom', `${Math.round(boomY)}px`);
      }
    } else {
      // fit the whole sail (flag to boom) between the nav and the bottom edge
      WS = Math.min(vw * 0.6, (vh - 90) / 1.01);
      mastX = vw * 0.025;
      boomY = vh + 14;
    }
    const S = WS / W;
    return { x: mastX + (0.5 - 0.16) * WS, y: boomY - (414 / 520 - 0.5) * H * S, s: S, r: 0, o: 1 };
  }

  // Boat position per scene. x / y are % of the viewport (boat centre), s = scale, r = tilt.
  // Desktop: left -> right -> then zig-zags diagonally (down-left, up-right, ...) as the water deepens
  const desktop = [
    { x: 27, y: 55, s: 1.00, r: 0,  o: 1 },
    { x: 74, y: 54, s: 0.86, r: 3,  o: 1 },
    { x: 25, y: 60, s: 0.74, r: -4, o: 1 },
    { x: 75, y: 50, s: 0.74, r: 4,  o: 1 },
    { x: 25, y: 60, s: 0.74, r: -3, o: 1 },
    { x: 74, y: 56, s: 0.80, r: 3,  o: 1 },
  ];
  // Mobile: same journey, but the boat sails faintly behind the text
  const mobile = [
    { x: 50, y: 37, s: 1.00, r: 0,  o: 1 },
    { x: 78, y: 55, s: 0.70, r: 3,  o: 0.2 },
    { x: 24, y: 58, s: 0.66, r: -4, o: 0.2 },
    { x: 76, y: 52, s: 0.66, r: 4,  o: 0.2 },
    { x: 24, y: 58, s: 0.66, r: -3, o: 0.2 },
    { x: 76, y: 56, s: 0.70, r: 3,  o: 0.2 },
  ];

  const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
  const rgb = colors.map(hex);
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => t * t * (3 - 2 * t);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let tops = [];
  // Each scene's "anchor" is the scroll position where the middle of that section
  // sits in the middle of the screen, so the boat rests in place mid-section and
  // only moves between sections.
  const measure = () => {
    const vh = window.innerHeight;
    const max = document.documentElement.scrollHeight - vh;
    tops = scenes.map((s, i) => i === 0 ? 0 : Math.min(max, Math.max(0, s.offsetTop + s.offsetHeight / 2 - vh / 2)));
    for (let i = 1; i < tops.length; i++) tops[i] = Math.max(tops[i], tops[i - 1] + 1);
  };

  function update() {
    const y = window.scrollY;
    const vw = window.innerWidth, vh = window.innerHeight;
    const isMobile = vw <= 820;
    const W = boat.offsetWidth, h = boat.offsetHeight;
    const frames = (isMobile ? mobile : desktop).map(f => ({ ...f, x: f.x / 100 * vw, y: f.y / 100 * vh }));
    frames[0] = heroFrame(vw, isMobile ? stableVh : vh, W, isMobile);

    // which scene are we in, and how far toward the next one?
    let i = 0;
    while (i < tops.length - 1 && y >= tops[i + 1]) i++;
    const j = Math.min(i + 1, tops.length - 1);
    const span = tops[j] - tops[i];
    let t = span > 0 ? Math.min(Math.max((y - tops[i]) / span, 0), 1) : 0;
    t = reduce ? Math.round(t) : ease(t);

    const a = frames[i], b = frames[j];
    const x = lerp(a.x, b.x, t);
    let cy = lerp(a.y, b.y, t);
    let s = lerp(a.s, b.s, t);
    let r = lerp(a.r, b.r, t);

    // Between sections the boat swoops: it dives on one crossing and climbs on
    // the next, then settles back to the centre once the next section is reached.
    if (i > 0 && j !== i) {
      const bump = Math.sin(Math.PI * t);
      const dir = i % 2 ? 1 : -1;
      cy += dir * (isMobile ? 0.12 : 0.17) * vh * bump;
      s *= 1 - 0.16 * bump;
      r += dir * 7 * bump;
    }
    boat.style.transform = `translate3d(${x - W / 2}px, ${cy - h / 2}px, 0) scale(${s}) rotate(${r}deg)`;
    // fade quickly when leaving the landing page so the boat isn't solid behind text
    const ot = a.o > b.o ? Math.min(1, t * 2.5) : t;
    boat.style.opacity = lerp(a.o, b.o, ot);

    // background colour
    const c = rgb[i].map((v, k) => Math.round(lerp(v, rgb[j][k], t)));
    const bg = `rgb(${c.join(',')})`;
    document.body.style.background = bg;
    document.body.style.setProperty('--bg-now', bg);

    // dark mode for nav + boat outline once the water gets deep
    const progress = i + t;
    document.body.classList.toggle('is-dark', progress > 3.55);

    // text on the sail fades out first, then the hull and water fade in as we zoom out
    sailText.style.opacity = Math.max(0, 1 - progress * 3);
    hull.style.opacity = Math.min(1, Math.max(0, (progress - 0.25) * 2.5));
    seams.style.opacity = Math.min(1, Math.max(0, (progress - 0.2) * 2.5));
  }

  let ticking = false;
  const onScroll = () => {
    if (!ticking) { requestAnimationFrame(() => { update(); ticking = false; }); ticking = true; }
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    // only a width change (rotation, desktop resize) counts as a real resize;
    // the phone address bar sliding in and out changes the height only
    if (window.innerWidth !== stableVw || window.innerWidth > 820) {
      stableVw = window.innerWidth; stableVh = window.innerHeight;
    }
    measure(); update();
  });
  window.addEventListener('load', () => { measure(); update(); });
  measure(); update();

  // reveal text as sections come into view
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.2 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // mobile menu
  const menuBtn = document.getElementById('menuBtn');
  const links = document.getElementById('navLinks');
  menuBtn.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    menuBtn.setAttribute('aria-expanded', open);
  });
  links.addEventListener('click', e => {
    if (e.target.closest('a')) { links.classList.remove('open'); menuBtn.setAttribute('aria-expanded', 'false'); }
  });

  // contact form (static site: no backend yet)
  document.getElementById('contactForm').addEventListener('submit', e => {
    e.preventDefault();
    document.getElementById('formNote').textContent = "Thanks! We'll be in touch soon.";
    e.target.reset();
  });

  document.getElementById('year').textContent = new Date().getFullYear();
})();
