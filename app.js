/* Research-Practice Bridge Card. Standalone, no dependencies, no server uploads. */
(() => {
  'use strict';
  const FIELD_IDS = ['purpose', 'audience', 'relevance', 'route', 'barriers'];
  const FIELD_INFO = [
    { title: 'Purpose', question: 'What do you want to achieve by bridging research and practice?', accent: '#4075E8' },
    { title: 'Audience', question: 'Who specifically do you want to reach or learn from?', accent: '#8763D9' },
    { title: 'Relevance', question: 'Why would this audience care, contribute, or respond?', accent: '#DA6EAA' },
    { title: 'Route', question: 'How and where could you connect or engage with them?', accent: '#F5A36B' },
    { title: 'Barriers', question: 'What is currently getting in the way?', accent: '#2A9C98' }
  ];
  const STORE_KEY = 'woic-bridge-card-v1';
  const card = document.getElementById('cardCanvas');
  const ctx = card.getContext('2d', { alpha: false });
  const inputName = document.getElementById('participantName');
  const form = document.getElementById('cardForm');
  const toastNode = document.getElementById('toast');
  let toastTimeout;
  const cardBg = new Image();
  cardBg.addEventListener('load', () => drawCard(getFields()));
  cardBg.src = 'assets/card-background.svg';
  const logoIcon = new Image();
  logoIcon.addEventListener('load', () => drawCard(getFields()));
  logoIcon.src = 'assets/favicon.svg';
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => drawCard(getFields()));
  }


  function getFields() {
    const values = { name: inputName.value.trim() };
    FIELD_IDS.forEach(id => values[id] = document.getElementById(id).value.trim());
    return values;
  }
  function persist() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(getFields())); } catch (_) { /* private storage may be unavailable */ }
  }
  function restore() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORE_KEY) || '{}');
      inputName.value = typeof saved.name === 'string' ? saved.name.slice(0, 70) : '';
      for (const id of FIELD_IDS) {
        const value = saved[id];
        if (typeof value === 'string') document.getElementById(id).value = value.slice(0, 300);
      }
    } catch (_) { /* ignore malformed saved data */ }
  }
  function toast(message) {
    toastNode.textContent = message;
    toastNode.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toastNode.classList.remove('show'), 3200);
  }
  function update() {
    const values = getFields();
    const done = FIELD_IDS.filter(id => values[id].length > 0).length;
    document.getElementById('progressCount').textContent = `${done}/5`;
    const ring = document.getElementById('progressRing');
    ring.style.setProperty('--progress', (done / 5 * 100).toFixed(0));
    ring.setAttribute('aria-label', `${done} of 5 sections completed`);
    document.getElementById('progressFill').style.width = `${done * 20}%`;
    for (const id of FIELD_IDS) {
      const v = document.getElementById(id).value;
      document.getElementById(id + 'Count').textContent = `${v.length} / 300`;
    }
    drawCard(values);
    persist();
  }
  const roundRect = (g, x, y, w, h, radius) => {
    const r = Math.min(radius, h / 2, w / 2);
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r); g.closePath();
  };
  const softFill = (g, x, y, w, h, radius, color) => { roundRect(g, x, y, w, h, radius); g.fillStyle = color; g.fill(); };
  const useFont = (g, px, weight = 400) => { g.font = `${weight} ${px}px Inter, Arial, sans-serif`; };
  function wrapLines(g, message, maxWidth) {
    const result = [];
    for (const paragraph of String(message).split(/\r?\n/)) {
      if (!paragraph.trim()) { result.push(''); continue; }
      let line = '';
      for (const token of paragraph.trim().split(/\s+/)) {
        const potential = line ? line + ' ' + token : token;
        if (g.measureText(potential).width <= maxWidth) { line = potential; continue; }
        if (line) { result.push(line); line = ''; }
        // Break unusually long unspaced words instead of clipping beyond the card.
        if (g.measureText(token).width > maxWidth) {
          let segment = '';
          for (const ch of token) {
            if (g.measureText(segment + ch).width > maxWidth && segment) { result.push(segment); segment = ch; }
            else segment += ch;
          }
          line = segment;
        } else line = token;
      }
      if (line) result.push(line);
    }
    return result;
  }
  function drawCard(values) {
    const w = card.width, h = card.height;
    ctx.clearRect(0, 0, w, h);
    // Shared card artwork: the on-screen preview is the PDF image.
    if (cardBg.complete && cardBg.naturalWidth) {
      ctx.drawImage(cardBg, 0, 0, w, h);
    } else {
      const grad = ctx.createLinearGradient(0, h, w, 0);
      grad.addColorStop(0, '#071127'); grad.addColorStop(.35, '#182C65');
      grad.addColorStop(.60, '#642E7B'); grad.addColorStop(.82, '#C64F75');
      grad.addColorStop(1, '#F2B85F');
      ctx.fillStyle=grad;ctx.fillRect(0,0,w,h);
    }
    // The Resource Hub's own brand icon, reused unchanged in the PDF.
    if (logoIcon.complete && logoIcon.naturalWidth) {
      ctx.drawImage(logoIcon, 74, 54, 66, 66);
    } else {
      softFill(ctx, 74, 54, 66, 66, 16, '#0B1634');
    }
    useFont(ctx, 20, 800);ctx.letterSpacing='1.7px';ctx.fillStyle='#E9E7FC';
    ctx.fillText('RESEARCH IMPACT HUB  /  WOIC 2026',159,94);ctx.letterSpacing='0px';
    useFont(ctx, 65, 850);ctx.fillStyle='#FFFFFF';
    ctx.fillText('Research-Practice',76,202);
    ctx.fillText('Bridge Card',76,276);
    // Additional breathing room between title and participant name.
    const label = `Prepared by ${values.name || '________________'}`;
    let fontSize=24;
    do {useFont(ctx,fontSize,650);fontSize-=.5;} while (ctx.measureText(label).width>1060 && fontSize>16);
    ctx.fillStyle='#F7E6FB';ctx.fillText(label, 79,350);

    const startY = 392, rowHeight = 236, gap = 12;
    FIELD_INFO.forEach((info, idx) => {
      const y = startY + idx * (rowHeight + gap), x = 73, width = 1094;
      ctx.save();ctx.shadowColor='rgba(7,13,40,.20)';ctx.shadowBlur=21;ctx.shadowOffsetY=7;
      softFill(ctx, x, y, width, rowHeight, 23, '#FFFFFF');ctx.restore();
      ctx.strokeStyle='rgba(223,230,246,.86)';ctx.lineWidth=1.3;
      roundRect(ctx,x,y,width,rowHeight,23);ctx.stroke();
      softFill(ctx, x+20, y+23, 73, 59, 17, info.accent);
      useFont(ctx, 27, 830);ctx.fillStyle='#FFFFFF';ctx.textAlign='center';
      ctx.fillText(String(idx+1).padStart(2,'0'),x+56,y+63);ctx.textAlign='left';
      useFont(ctx, 35, 830);ctx.fillStyle='#172447';ctx.fillText(info.title,x+122,y+57);
      useFont(ctx, 21, 470);ctx.fillStyle='#62708A';ctx.fillText(info.question,x+122,y+95);
      const answer = values[FIELD_IDS[idx]] || 'Your reflection will appear here as you type…';
      const availableWidth = width-166, maxHeight=113;
      let fontSize=27, lines=[];
      while(fontSize>=14){
        useFont(ctx,fontSize,values[FIELD_IDS[idx]]?510:430);
        lines=wrapLines(ctx,answer,availableWidth);
        const height=lines.length*fontSize*1.28;
        if(height<=maxHeight)break;
        fontSize--;
      }
      ctx.fillStyle=values[FIELD_IDS[idx]]?'#243250':'#A1ACBE';
      const baseline=y+141;
      lines.forEach((t,lineIndex)=>ctx.fillText(t,x+122,baseline+lineIndex*fontSize*1.28));
    });
    // Footer: a legible URL + real PDF hyperlink annotation, then copyright.
    ctx.strokeStyle='rgba(234,237,255,.6)';ctx.lineWidth=1;
    ctx.beginPath();ctx.moveTo(81,1664);ctx.lineTo(1161,1664);ctx.stroke();
    useFont(ctx,19,680);ctx.fillStyle='#DCE8FF';
    ctx.fillText('socialmedia.marcelbogers.com',82,1696);
    useFont(ctx,17,510);ctx.fillStyle='#DFD7EE';
    ctx.fillText('© Marcel Bogers and Attabik Awan',82,1727);
  }
  // A small dependency-free PDF writer embeds a high-resolution JPEG of the
  // very same canvas shown on screen. This prevents differences in layout,
  // clipping, and third-party library failures at conferences.
  function canvasToPdfBlob(canvas) {
    const jpeg = canvas.toDataURL('image/jpeg', .96).split(',')[1];
    const raw = atob(jpeg), image = new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) image[i]=raw.charCodeAt(i);
    const encoder=new TextEncoder(),parts=[],offsets=[0];let total=0;
    const bytes = str => encoder.encode(str);
    const push = data => {parts.push(data);total+=data.length;};
    const pushString = str => push(bytes(str));
    const addObj=(i,prefix,binary,suffix)=>{
      offsets[i]=total;pushString(`${i} 0 obj\n${prefix}`);
      if(binary)push(binary);
      pushString(`${suffix||''}\nendobj\n`);
    };
    const pageW=595.28,pageH=841.89;
    const pxToX=x=>Number((x*pageW/canvas.width).toFixed(2));
    const pxToY=y=>Number(((canvas.height-y)*pageH/canvas.height).toFixed(2));
    // Click area precisely covers the visible URL in the footer.
    const rect=[pxToX(77),pxToY(1708),pxToX(500),pxToY(1670)];
    pushString('%PDF-1.4\n');
    addObj(1,'<< /Type /Catalog /Pages 2 0 R >>',null);
    addObj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',null);
    addObj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R /Annots [6 0 R] >>',null);
    const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
    addObj(4,`<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`,null);
    addObj(5,`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,image,'\nendstream');
    addObj(6,`<< /Type /Annot /Subtype /Link /Rect [${rect.join(' ')}] /Border [0 0 0] /A << /S /URI /URI (https://socialmedia.marcelbogers.com/) >> >>`,null);
    const xrefStart=total;
    pushString('xref\n0 7\n0000000000 65535 f \n');
    for(let i=1;i<=6;i++)pushString(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    pushString(`trailer\n<< /Root 1 0 R /Size 7 >>\nstartxref\n${xrefStart}\n%%EOF\n`);
    return new Blob(parts,{type:'application/pdf'});
  }
  function downloadPdf() {
    drawCard(getFields());
    try {
      const blob = canvasToPdfBlob(card);
      const url=URL.createObjectURL(blob);
      const a=document.createElement('a');
      const slug=(inputName.value.trim()||'my').toLowerCase().normalize('NFKD')
        .replace(/[^a-z0-9 -]/g,'').trim().replace(/\s+/g,'-').slice(0,35)||'my';
      a.href=url;a.download=`${slug}-research-practice-bridge-card.pdf`;
      document.body.appendChild(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),15000);
      toast('Your Bridge Card PDF is ready.');
    } catch(e) {console.error('PDF generation failed',e);toast('PDF download failed. Please try again.');}
  }
  function clearAll() {
    if(!confirm('Clear all five answers and your name from this browser?')) return;
    inputName.value='';FIELD_IDS.forEach(id=>document.getElementById(id).value='');
    try{localStorage.removeItem(STORE_KEY)}catch(_){}
    update();toast('Your card has been cleared.');
  }
  restore();update();
  form.addEventListener('submit',e=>e.preventDefault());
  inputName.addEventListener('input',update);
  FIELD_IDS.forEach(id=>document.getElementById(id).addEventListener('input',update));
  document.getElementById('downloadTop').addEventListener('click',downloadPdf);
  document.getElementById('downloadPreview').addEventListener('click',downloadPdf);
  document.getElementById('clearAll').addEventListener('click',clearAll);

  // Exactly the same procedural color palette and moving radial-wave shader as
  // the Research Impact Hub, reused for visual continuity between both sites.
  function startLiquid(){
    const canvas=document.getElementById('rippleCanvas');
    const reduce=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const gl=canvas.getContext('webgl',{alpha:false,antialias:false,powerPreference:'high-performance'});
    if(!gl)return;
    const vertex=`attribute vec2 aPosition;varying vec2 vUv;void main(){vUv=aPosition*.5+.5;gl_Position=vec4(aPosition,0.,1.);}`;
    const fragment=`precision highp float;
    uniform vec2 uResolution;
    uniform float uTime;
    varying vec2 vUv;
    vec3 palette(float t){
      vec3 c0=vec3(.027,.067,.153);
      vec3 c1=vec3(.071,.173,.38);
      vec3 c2=vec3(.31,.15,.49);
      vec3 c3=vec3(.62,.20,.43);
      vec3 c4=vec3(.88,.37,.36);
      vec3 c5=vec3(.96,.65,.34);
      vec3 c6=vec3(.99,.81,.48);
      vec3 c=mix(c0,c1,smoothstep(0.,.24,t));
      c=mix(c,c2,smoothstep(.20,.43,t));
      c=mix(c,c3,smoothstep(.39,.62,t));
      c=mix(c,c4,smoothstep(.58,.78,t));
      c=mix(c,c5,smoothstep(.74,.92,t));
      c=mix(c,c6,smoothstep(.90,1.,t));
      return c;
    }
    float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
    void main(){
      vec2 uv=vUv;
      float aspect=uResolution.x/uResolution.y;
      vec2 center=vec2(.54,.46);
      vec2 p=uv-center;
      p.x*=aspect;
      float d=length(p);
      vec2 dir=p/max(d,.0001);
      dir.x/=aspect;
      float t=uTime;
      float phase=d*74.0-t*2.35;
      float wave=sin(phase)*.58+sin(d*123.0-t*3.75+.7)*.18+sin(d*36.0-t*1.08)*.24;
      float envelope=smoothstep(.018,.07,d)*exp(-d*.48);
      float displacement=wave*.0062*envelope;
      vec2 drift=vec2(sin(uv.y*7.5+t*.16)+sin(uv.y*15.0-t*.11),cos(uv.x*9.0-t*.13)+sin(uv.x*4.7+t*.09))*.00145;
      vec2 q=uv+dir*displacement+drift;
      float ramp=clamp(q.x*.94+q.y*.11-.035,0.,1.);
      vec3 color=palette(ramp);
      float radialGlow=exp(-length((q-vec2(.82,.20))*vec2(1.1,1.45))*2.15);
      color+=vec3(.34,.12,.05)*radialGlow*.34;
      float ring=pow(.5+.5*sin(phase),10.0)*envelope;
      float ring2=pow(.5+.5*sin(d*38.0-t*1.05+.8),12.0)*envelope;
      vec3 highlight=mix(vec3(.19,.43,.72),vec3(1.0,.53,.35),smoothstep(.28,.82,ramp));
      color+=highlight*(ring*.10+ring2*.028);
      color-=vec3(.025,.02,.055)*(1.0-ring)*envelope*.27;
      float vignette=smoothstep(.94,.24,length((uv-.5)*vec2(1.02,.88)));
      color*=mix(.64,1.0,vignette);color*=.92;
      float grain=(hash(gl_FragCoord.xy+floor(t*10.0))-.5)*.012;
      color+=grain;
      gl_FragColor=vec4(color,1.0);
    }`;
    const compile=(type,source)=>{const sh=gl.createShader(type);gl.shaderSource(sh,source);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
    let program;
    try{program=gl.createProgram();gl.attachShader(program,compile(gl.VERTEX_SHADER,vertex));gl.attachShader(program,compile(gl.FRAGMENT_SHADER,fragment));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));}
    catch(e){console.warn('Animated ripple fallback',e);return;}
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    const pos=gl.getAttribLocation(program,'aPosition');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const uResolution=gl.getUniformLocation(program,'uResolution'),uTime=gl.getUniformLocation(program,'uTime');
    const resize=()=>{const dpr=Math.min(devicePixelRatio||1,1.55),w=Math.max(1,Math.floor(innerWidth*dpr)),h=Math.max(1,Math.floor(innerHeight*dpr));if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform2f(uResolution,w,h);};
    resize();canvas.classList.add('is-ready');
    const start=performance.now();
    const render=now=>{resize();gl.uniform1f(uTime,reduce?0:(now-start)/1000);gl.drawArrays(gl.TRIANGLES,0,6);if(!reduce)requestAnimationFrame(render);};
    requestAnimationFrame(render);window.addEventListener('resize',resize,{passive:true});
  }
  startLiquid();
})();
