/* Research-Practice Bridge Card. Standalone, no dependencies, no server uploads. */
(() => {
  'use strict';
  const FIELD_IDS = ['purpose', 'audience', 'relevance', 'route', 'barriers'];
  const FIELD_INFO = [
    { title: 'Purpose', question: 'What do you want to achieve by bridging research and practice?', accent: '#5178E7' },
    { title: 'Audience', question: 'Who specifically do you want to reach or learn from?', accent: '#8B62D8' },
    { title: 'Relevance', question: 'Why would this audience care, contribute, or respond?', accent: '#C567A1' },
    { title: 'Route', question: 'How and where could you connect or engage with them?', accent: '#E98B6D' },
    { title: 'Barriers', question: 'What is currently getting in the way?', accent: '#C9973B' }
  ];
  const STORE_KEY = 'woic-bridge-card-v1';
  const card = document.getElementById('cardCanvas');
  const ctx = card.getContext('2d', { alpha: false });
  const inputName = document.getElementById('participantName');
  const form = document.getElementById('cardForm');
  const toastNode = document.getElementById('toast');
  let toastTimeout;

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
    ctx.fillStyle = '#F6F8FD'; ctx.fillRect(0, 0, w, h);
    // The preview IS the PDF artwork. The PDF generator embeds these exact pixels.
    const band = ctx.createLinearGradient(0, 0, 1180, 360);
    band.addColorStop(0, '#12265A'); band.addColorStop(.39, '#43327E');
    band.addColorStop(.72, '#92518B'); band.addColorStop(1, '#DE867F');
    ctx.fillStyle = band; ctx.fillRect(0, 0, w, 334);
    ctx.save();ctx.beginPath();ctx.rect(650, 0, 590, 334);ctx.clip();
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();ctx.ellipse(1030, 187, 76 + j * 56, 47 + j * 34, -.09, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(255,230,248,${.31 - j * .035})`;ctx.lineWidth = 2.8;ctx.stroke();
    }
    ctx.restore();
    // Draw ripple logo at full fidelity.
    softFill(ctx, 75, 57, 62, 62, 18, 'rgba(255,255,255,.13)');
    ctx.strokeStyle = 'rgba(255,255,255,.92)';ctx.lineWidth = 2.4;
    for (let j=0;j<3;j++){ctx.beginPath();ctx.ellipse(106,88,9+j*10,7+j*7,0,0,Math.PI*2);ctx.stroke();}
    ctx.fillStyle='#FFFFFF';ctx.beginPath();ctx.arc(106,88,3.7,0,Math.PI*2);ctx.fill();
    useFont(ctx, 21, 800);ctx.letterSpacing='2px';ctx.fillStyle='#E7E5FF';ctx.fillText('RESEARCH IMPACT HUB  /  WOIC 2026',159,92);ctx.letterSpacing='0px';
    useFont(ctx, 66, 850);ctx.fillStyle='#FFFFFF';ctx.fillText('Research-Practice',76,205);
    ctx.fillText('Bridge Card',76,282);
    const name = values.name ? `PREPARED BY  ${values.name}` : 'YOUR PERSONAL STRATEGY SNAPSHOT';
    useFont(ctx, 17, 700);ctx.fillStyle='#EBDAF6';
    const displayName = name.length > 56 ? name.slice(0,53)+'...' : name;
    ctx.fillText(displayName, 79,317);

    const startY = 350, rowHeight = 248, gap = 13;
    FIELD_INFO.forEach((info, idx) => {
      const y = startY + idx * (rowHeight + gap), x = 73, width = 1094;
      ctx.save();ctx.shadowColor='rgba(34,51,96,.06)';ctx.shadowBlur=19;ctx.shadowOffsetY=5;
      softFill(ctx, x, y, width, rowHeight, 23, '#FFFFFF');ctx.restore();
      ctx.strokeStyle='#E4E9F4';ctx.lineWidth=1.4;roundRect(ctx,x,y,width,rowHeight,23);ctx.stroke();
      softFill(ctx, x+19, y+24, 73, 61, 18, info.accent);
      useFont(ctx, 27, 830);ctx.fillStyle='#FFFFFF';ctx.textAlign='center';ctx.fillText(String(idx+1).padStart(2,'0'),x+55,y+65);ctx.textAlign='left';
      useFont(ctx, 35, 830);ctx.fillStyle='#172447';ctx.fillText(info.title,x+122,y+60);
      useFont(ctx, 22, 470);ctx.fillStyle='#66728B';ctx.fillText(info.question,x+122,y+98);
      const answer = values[FIELD_IDS[idx]] || 'Your reflection will appear here as you type…';
      const availableWidth = width - 160, maxHeight = 125;
      let fontSize = 27, lines = [], height=0;
      while (fontSize >= 17) {
        useFont(ctx,fontSize,values[FIELD_IDS[idx]]?510:430);
        lines=wrapLines(ctx,answer,availableWidth);
        height = lines.length * (fontSize*1.31);
        if (height <= maxHeight) break;
        fontSize--;
      }
      ctx.fillStyle=values[FIELD_IDS[idx]]?'#243250':'#A8B2C7';
      const baseline=y+142;
      lines.forEach((t,lineIndex)=>ctx.fillText(t,x+122,baseline+lineIndex*fontSize*1.31));
    });
    ctx.fillStyle='#5E6B86';useFont(ctx,18,730);
    ctx.fillText('PURPOSE  ·  AUDIENCE  ·  RELEVANCE  ·  ROUTE  ·  BARRIERS',80,1692);
    useFont(ctx,17,500);ctx.fillStyle='#7A86A0';ctx.textAlign='right';ctx.fillText('socialmedia.marcelbogers.com',1166,1692);ctx.textAlign='left';
    ctx.strokeStyle='#D7DDEA';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(80,1661);ctx.lineTo(1160,1661);ctx.stroke();
  }
  // A small dependency-free PDF writer embeds a high-resolution JPEG of the
  // very same canvas shown on screen. This prevents differences in layout,
  // clipping, and third-party library failures at conferences.
  function canvasToPdfBlob(canvas) {
    const jpeg = canvas.toDataURL('image/jpeg', .96).split(',')[1];
    const raw = atob(jpeg), image = new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) image[i]=raw.charCodeAt(i);
    const encoder = new TextEncoder();
    const parts=[], offsets=[0];let total=0;
    const bytes = (str) => encoder.encode(str);
    const push = (data) => {parts.push(data);total+=data.length;};
    const pushString = (str) => push(bytes(str));
    const addObj = (i, prefix, binary, suffix) => {
      offsets[i]=total;pushString(`${i} 0 obj\n${prefix}`);
      if(binary) push(binary);
      pushString(`${suffix||''}\nendobj\n`);
    };
    pushString('%PDF-1.4\n');
    addObj(1,'<< /Type /Catalog /Pages 2 0 R >>',null);
    addObj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',null);
    addObj(3,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>',null);
    const stream='q\n595.28 0 0 841.89 0 0 cm\n/Im0 Do\nQ\n';
    addObj(4,`<< /Length ${bytes(stream).length} >>\nstream\n${stream}endstream`,null);
    addObj(5,`<< /Type /XObject /Subtype /Image /Width ${canvas.width} /Height ${canvas.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.length} >>\nstream\n`,image,'\nendstream');
    const xrefStart=total;
    pushString('xref\n0 6\n0000000000 65535 f \n');
    for(let i=1;i<=5;i++) pushString(String(offsets[i]).padStart(10,'0')+' 00000 n \n');
    pushString(`trailer\n<< /Root 1 0 R /Size 6 >>\nstartxref\n${xrefStart}\n%%EOF\n`);
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

  // Animate the source photograph's pixels, not graphic rings over the image.
  // The source image remains visible as a CSS fallback if WebGL is unavailable.
  function startLiquid() {
    if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas=document.getElementById('rippleCanvas');
    const gl=canvas.getContext('webgl',{antialias:false,alpha:false,powerPreference:'low-power'});
    if(!gl) return;
    const vs=`attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}`;
    const fs=`precision highp float;
    uniform sampler2D uTex; uniform vec2 uRes; uniform vec2 uTexSize; uniform float uTime;
    void main(){
      vec2 uv=gl_FragCoord.xy/uRes;
      float screenRatio=uRes.x/uRes.y;float imgRatio=uTexSize.x/uTexSize.y;
      vec2 fit=vec2(1.);
      if(screenRatio>imgRatio)fit.y=imgRatio/screenRatio;
      else fit.x=screenRatio/imgRatio;
      vec2 tUv=(uv-.5)*fit+.5;
      vec2 center=vec2(.735,.46);
      vec2 delta=(tUv-center)*vec2(imgRatio,1.);
      float r=max(length(delta),.001);
      float wave=sin(r*48.-uTime*.95)*.0062 + sin(r*28.-uTime*.61)*.0024;
      wave*=exp(-r*.65);
      tUv+=normalize(delta)*wave*vec2(1./imgRatio,1.);
      gl_FragColor=texture2D(uTex,clamp(tUv,vec2(.001),vec2(.999)));
    }`;
    const shader=(type,source)=>{const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;};
    let program;
    try{program=gl.createProgram();gl.attachShader(program,shader(gl.VERTEX_SHADER,vs));gl.attachShader(program,shader(gl.FRAGMENT_SHADER,fs));gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error('WebGL link error');}
    catch(e){console.warn(e);return;}
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
    gl.useProgram(program);const pos=gl.getAttribLocation(program,'p');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
    const uniformRes=gl.getUniformLocation(program,'uRes'),uniformSize=gl.getUniformLocation(program,'uTexSize'),uniformTime=gl.getUniformLocation(program,'uTime');
    const img=new Image();img.src='assets/ripple-background.webp';
    img.onload=()=>{
      const texture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,img);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.uniform2f(uniformSize,img.width,img.height);gl.uniform1i(gl.getUniformLocation(program,'uTex'),0);
      const resize=()=>{const dpr=Math.min(window.devicePixelRatio||1,1.3);let w=Math.round(innerWidth*dpr),h=Math.round(innerHeight*dpr);if(w!==canvas.width||h!==canvas.height){canvas.width=w;canvas.height=h;gl.viewport(0,0,w,h);}gl.uniform2f(uniformRes,w,h);};
      window.addEventListener('resize',resize,{passive:true});resize();
      let last=-Infinity;
      const loop=now=>{if(!document.hidden&&now-last>=32){last=now;gl.uniform1f(uniformTime,now/1000);gl.drawArrays(gl.TRIANGLES,0,6);}requestAnimationFrame(loop);};
      requestAnimationFrame(loop);
    };
    img.onerror=()=>console.warn('Ripple image failed to load: falling back to static background.');
  }
  startLiquid();
})();
