document.addEventListener('DOMContentLoaded', () => {

  /* NAV SCROLL */
  const nav = document.getElementById('nav');
  const scrollTopBtn = document.getElementById('scrollTop');
  window.addEventListener('scroll', () => {
    const y = window.scrollY;
    nav.classList.toggle('scrolled', y > 80);
    scrollTopBtn.classList.toggle('show', y > 500);
  });
  scrollTopBtn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ACTIVE NAV */
  const secs = document.querySelectorAll('section[id]');
  const nls = document.querySelectorAll('.nl[href^="#"]');
  window.addEventListener('scroll', () => {
    let cur = '';
    secs.forEach(s => { if (window.scrollY >= s.offsetTop - 140) cur = s.id; });
    nls.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + cur));
  });

  /* FADE IN OBSERVER */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const d = parseInt(e.target.dataset.delay || 0);
        setTimeout(() => e.target.classList.add('on'), d);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fu,.fl,.fr').forEach(el => obs.observe(el));

  /* COUNTER ANIMATION */
  const statsObs = new IntersectionObserver((entries) => {
    if (!entries[0].isIntersecting) return;
    document.querySelectorAll('.stat-n[data-target]').forEach(el => {
      const target = parseInt(el.dataset.target);
      const suffix = el.dataset.suffix || '';
      const dur = 1800, start = performance.now();
      const run = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(ease * target) + suffix;
        if (p < 1) requestAnimationFrame(run);
      };
      requestAnimationFrame(run);
    });
    statsObs.disconnect();
  }, { threshold: 0.5 });
  const sb = document.querySelector('.stats-bar');
  if (sb) statsObs.observe(sb);

  /* LIGHTBOX */
  const imgs = [
    'assets/images/racer-vibes.jpg',
    'assets/images/racer-action.jpg',
    'assets/images/racer-close.jpg',
    'assets/images/race1.jpg',
    'assets/images/race2.jpg',
    'assets/images/race3.jpg',
    'assets/images/race4.jpg',
    'assets/images/race5.jpg',
    'assets/images/race-day.jpg',
    'assets/images/kart-fleet.jpg',
  ];
  let lbIdx = 0;
  const lb = document.getElementById('lb');
  const lbImg = document.getElementById('lbImg');
  const lbCnt = document.getElementById('lbCnt');

  window.openLB = (i) => {
    lbIdx = i;
    lbImg.src = imgs[i];
    if (lbCnt) lbCnt.textContent = `${i + 1} / ${imgs.length}`;
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  };
  window.closeLB = () => { lb.classList.remove('open'); document.body.style.overflow = ''; };
  window.lbP = () => { lbIdx = (lbIdx - 1 + imgs.length) % imgs.length; lbImg.src = imgs[lbIdx]; if (lbCnt) lbCnt.textContent = `${lbIdx + 1} / ${imgs.length}`; };
  window.lbN = () => { lbIdx = (lbIdx + 1) % imgs.length; lbImg.src = imgs[lbIdx]; if (lbCnt) lbCnt.textContent = `${lbIdx + 1} / ${imgs.length}`; };
  lb.addEventListener('click', e => { if (e.target === lb) closeLB(); });
  document.addEventListener('keydown', e => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLB();
    if (e.key === 'ArrowLeft') lbP();
    if (e.key === 'ArrowRight') lbN();
  });

  /* VIDEO THUMB PLAY */
  document.querySelectorAll('.vid-thumb').forEach(t => {
    t.addEventListener('click', () => {
      const v = t.querySelector('video'), ov = t.querySelector('.vid-play');
      if (v.paused) { v.play(); if (ov) ov.style.opacity = '0'; }
      else { v.pause(); if (ov) ov.style.opacity = '1'; }
    });
  });

  /* MOBILE NAV CLOSE */
  document.querySelectorAll('.nl').forEach(l => {
    l.addEventListener('click', () => {
      const c = document.getElementById('navMenu');
      const b = bootstrap.Collapse.getInstance(c);
      if (b) b.hide();
    });
  });

  /* FORMS */
  const bForm = document.getElementById('bookingForm');
  if (bForm) {
    bForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = bForm.querySelector('.bsub');
      btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Booking Request Sent!';
      btn.style.background = '#1a7a1a';
      btn.style.borderColor = '#1a7a1a';
      setTimeout(() => {
        bootstrap.Modal.getInstance(document.getElementById('bookModal'))?.hide();
        btn.innerHTML = '<i class="bi bi-flag-fill me-2"></i>Confirm Booking Request';
        btn.style.background = ''; btn.style.borderColor = '';
        bForm.reset();
      }, 2200);
    });
  }
  const cForm = document.getElementById('contactForm');
  if (cForm) {
    cForm.addEventListener('submit', e => {
      e.preventDefault();
      const btn = cForm.querySelector('[type=submit]'), orig = btn.innerHTML;
      btn.innerHTML = '<i class="bi bi-check-circle-fill me-2"></i>Message Sent!';
      btn.style.background = '#1a7a1a';
      setTimeout(() => { btn.innerHTML = orig; btn.style.background = ''; cForm.reset(); }, 3000);
    });
  }

  /* TRACK MAP */
  initMap();
});

/* ═══ INTERACTIVE TRACK MAP ═══ */
function initMap() {
  const canvas = document.getElementById('mapCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let ox = 0, oy = 0, sc = 1, drag = false, lx = 0, ly = 0, active = -1, pulse = 0;

  const DW = 1000, DH = 600;
  const track = [
    [70,310],[105,308],[145,305],[185,300],[225,296],[265,290],[305,284],[345,270],[375,248],[400,218],[415,188],
    [455,170],[515,166],[575,168],[635,173],[675,183],[715,198],[752,224],[766,256],[762,293],[744,328],
    [714,356],[669,376],[614,383],[569,380],[524,374],[479,370],[444,383],[424,408],[419,443],[424,478],
    [432,508],[439,533],[432,556],[412,570],[382,574],[352,566],[322,543],[307,513],[302,478],[307,446],
    [317,416],[312,390],[292,370],[262,353],[217,340],[172,332],[127,326],[92,320],[70,315],[70,310]
  ];
  const markers = [
    { x:110, y:305, label:'Start / Finish', sub:'Race begins here', color:'#C8102E', icon:'🏁' },
    { x:413, y:180, label:'Turn 1 – Fast Right', sub:'Brake late, apex tight', color:'#4EA8DE', icon:'↗' },
    { x:756, y:258, label:'Hairpin – The Snake', sub:'Slowest point, watch speed', color:'#F5C518', icon:'↩' },
    { x:432, y:538, label:'Bottom Hairpin', sub:'Watch for oversteer', color:'#F5C518', icon:'↪' },
    { x:190, y:336, label:'Pit Lane Entry', sub:'Speed limit zone', color:'#6BCB77', icon:'P' },
    { x:574, y:374, label:'Technical S-Section', sub:'Find your rhythm here', color:'#A78BFA', icon:'S' },
  ];

  function toC(px, py) { return [(px/DW)*canvas.width*sc+ox, (py/DH)*canvas.height*sc+oy]; }

  function draw() {
    pulse++;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.035)'; ctx.lineWidth = 1;
    const step = 80;
    for (let x = ox % step; x < canvas.width; x += step) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,canvas.height); ctx.stroke(); }
    for (let y = oy % step; y < canvas.height; y += step) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(canvas.width,y); ctx.stroke(); }

    // Track layers
    [['#1a2a1a',50],['#2a2a2a',36],['#1f1f1f',28]].forEach(([color,lw]) => {
      ctx.beginPath();
      const [sx,sy] = toC(track[0][0],track[0][1]); ctx.moveTo(sx,sy);
      track.slice(1).forEach(([px,py]) => { const [cx,cy] = toC(px,py); ctx.lineTo(cx,cy); });
      ctx.strokeStyle = color; ctx.lineWidth = lw*sc; ctx.lineJoin='round'; ctx.lineCap='round'; ctx.stroke();
    });

    // Racing line dashes
    ctx.beginPath();
    const [sx2,sy2] = toC(track[0][0],track[0][1]); ctx.moveTo(sx2,sy2);
    track.slice(1).forEach(([px,py]) => { const [cx,cy] = toC(px,py); ctx.lineTo(cx,cy); });
    ctx.strokeStyle='rgba(245,197,24,0.45)'; ctx.lineWidth=1.5*sc; ctx.setLineDash([10*sc,9*sc]); ctx.stroke(); ctx.setLineDash([]);

    // Kerbs at start/finish
    const [k1x,k1y]=toC(70,295), [k2x,k2y]=toC(200,285);
    for(let i=0;i<14;i++){
      const t0=i/14,t1=(i+.9)/14;
      ctx.beginPath(); ctx.moveTo(k1x+(k2x-k1x)*t0,k1y+(k2y-k1y)*t0); ctx.lineTo(k1x+(k2x-k1x)*t1,k1y+(k2y-k1y)*t1);
      ctx.strokeStyle=i%2===0?'#C8102E':'#F8F6F2'; ctx.lineWidth=7*sc; ctx.stroke();
    }

    // Markers
    markers.forEach((m, idx) => {
      const [mx,my] = toC(m.x,m.y);
      const isAct = active===idx;
      const r = Math.max(8, 11*sc);
      const p = Math.abs(Math.sin(pulse*.04+idx*.8));

      ctx.beginPath(); ctx.arc(mx,my,r+(isAct?10:5)*p*sc,0,Math.PI*2);
      ctx.strokeStyle=m.color+(isAct?'aa':'55'); ctx.lineWidth=1.5; ctx.stroke();

      ctx.beginPath(); ctx.arc(mx,my,r,0,Math.PI*2);
      ctx.fillStyle=m.color+(isAct?'':'cc');
      ctx.shadowColor=m.color; ctx.shadowBlur=isAct?14:0; ctx.fill(); ctx.shadowBlur=0;

      ctx.fillStyle='#fff'; ctx.font=`bold ${Math.max(8,9*sc)}px Arial`;
      ctx.textAlign='center'; ctx.textBaseline='middle';
      ctx.fillText(m.icon==='🏁'?'■':m.icon, mx, my);

      if(isAct){
        ctx.font=`bold ${Math.max(9,10*sc)}px Inter,Arial`;
        const tw=Math.max(ctx.measureText(m.label).width,ctx.measureText(m.sub).width);
        const bw=tw+20,bh=32*sc,bx=Math.max(4,Math.min(canvas.width-bw-4,mx-bw/2)),by=Math.max(4,my-r-bh-10*sc);
        ctx.fillStyle='rgba(10,10,10,.96)';
        ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,3); ctx.fill();
        ctx.strokeStyle=m.color; ctx.lineWidth=1.5;
        ctx.beginPath(); ctx.roundRect(bx,by,bw,bh,3); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(mx,my-r-2); ctx.lineTo(mx,by+bh);
        ctx.strokeStyle=m.color+'88'; ctx.lineWidth=1; ctx.stroke();
        ctx.fillStyle='#F8F6F2'; ctx.font=`bold ${Math.max(9,10*sc)}px Inter,Arial`;
        ctx.fillText(m.label, bx+bw/2, by+8*sc);
        ctx.fillStyle='#888'; ctx.font=`${Math.max(8,9*sc)}px Inter,Arial`;
        ctx.fillText(m.sub, bx+bw/2, by+20*sc);
      }
    });

    // Compass
    const cx=canvas.width-44,cy=44;
    ctx.fillStyle='rgba(15,15,15,.88)'; ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#2e2e2e'; ctx.lineWidth=1; ctx.beginPath(); ctx.arc(cx,cy,24,0,Math.PI*2); ctx.stroke();
    ctx.font='bold 10px Orbitron,Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle='#C8102E'; ctx.fillText('N',cx,cy-12);
    ctx.fillStyle='#555'; ['S','W','E'].forEach((d,i)=>{ const [dx,dy]=[[cx,cy+12],[cx-12,cy],[cx+12,cy]][i]; ctx.fillText(d,dx,dy); });

    requestAnimationFrame(draw);
  }

  canvas.addEventListener('mousedown', e=>{drag=true;lx=e.clientX;ly=e.clientY;});
  canvas.addEventListener('mousemove', e=>{
    if(drag){ox+=e.clientX-lx;oy+=e.clientY-ly;lx=e.clientX;ly=e.clientY;}
    else{
      const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
      let hit=-1;
      markers.forEach((m,i)=>{ const [cx,cy]=toC(m.x,m.y); if(Math.hypot(mx-cx,my-cy)<18) hit=i; });
      active=hit; canvas.style.cursor=drag?'grabbing':hit>=0?'pointer':'grab';
    }
  });
  canvas.addEventListener('mouseup',()=>{drag=false;});
  canvas.addEventListener('mouseleave',()=>{drag=false;});
  canvas.addEventListener('wheel',e=>{
    e.preventDefault();
    const r=canvas.getBoundingClientRect(),mx=e.clientX-r.left,my=e.clientY-r.top;
    const f=e.deltaY<0?1.12:.9,ns=Math.max(.35,Math.min(3.5,sc*f));
    ox=mx-(mx-ox)*(ns/sc); oy=my-(my-oy)*(ns/sc); sc=ns;
  },{passive:false});

  let ltd=0;
  canvas.addEventListener('touchstart',e=>{e.preventDefault();if(e.touches.length===1){lx=e.touches[0].clientX;ly=e.touches[0].clientY;drag=true;}else{ltd=Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);}},{passive:false});
  canvas.addEventListener('touchmove',e=>{e.preventDefault();if(e.touches.length===1&&drag){ox+=e.touches[0].clientX-lx;oy+=e.touches[0].clientY-ly;lx=e.touches[0].clientX;ly=e.touches[0].clientY;}else if(e.touches.length===2){const d=Math.hypot(e.touches[1].clientX-e.touches[0].clientX,e.touches[1].clientY-e.touches[0].clientY);sc=Math.max(.35,Math.min(3.5,sc*d/ltd));ltd=d;}},{passive:false});
  canvas.addEventListener('touchend',()=>{drag=false;});

  window.resetMap=()=>{ox=0;oy=0;sc=1;active=-1;};
  window.zoomIn=()=>{sc=Math.min(3.5,sc*1.2);};
  window.zoomOut=()=>{sc=Math.max(.35,sc*.85);};

  function resize(){canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;}
  window.addEventListener('resize',resize);
  setTimeout(resize,100);
  draw();
}
