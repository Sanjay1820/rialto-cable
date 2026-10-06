/* A small orthographic Earth. No libraries, requests or image dependencies. */
document.addEventListener('DOMContentLoaded', () => {
  const panel = document.querySelector('.rc-world');
  if (!panel) return;
  const canvas = panel.querySelector('canvas');
  const context = canvas.getContext('2d');
  if (!context) return;
  const host = panel.querySelector('.rc-world-planet');
  const toggle = panel.querySelector('.rc-world-toggle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // Simplified geographic silhouettes; points are longitude, latitude.
  const land = [
    [[-168,70],[-140,70],[-125,60],[-126,49],[-124,40],[-117,32],[-109,24],[-98,16],[-86,21],[-81,25],[-80,33],[-67,45],[-53,49],[-62,59],[-82,67],[-105,75],[-140,72]],
    [[-81,12],[-70,12],[-60,7],[-50,0],[-35,-7],[-40,-22],[-51,-33],[-67,-55],[-75,-43],[-72,-20],[-81,-3]],
    [[-52,83],[-25,75],[-40,60],[-55,61],[-65,73]],
    [[-17,35],[6,37],[21,32],[34,31],[43,12],[51,11],[42,-12],[33,-26],[18,-35],[12,-19],[5,4],[-12,5],[-18,16]],
    [[-10,36],[-9,43],[2,50],[7,55],[5,61],[22,71],[42,68],[62,72],[92,77],[125,71],[165,63],[179,51],[154,46],[139,35],[124,40],[120,24],[107,21],[106,9],[99,1],[92,22],[80,8],[72,21],[58,25],[44,13],[36,31],[29,41],[16,39],[10,45],[2,43]],
    [[112,-11],[132,-12],[146,-17],[154,-28],[145,-39],[129,-33],[115,-35]],
    [[46,-13],[51,-15],[49,-26],[44,-25]],
    [[130,33],[142,45],[146,43],[139,35]],
    [[-8,50],[2,51],[-3,59],[-7,58]],
    [[95,5],[106,-5],[115,-8],[120,-3],[110,7]],
    [[166,-34],[178,-38],[170,-46],[165,-44]]
  ];
  const cities = [
    { name:'Ahmedabad', lat:23.02, lon:72.57, home:true },
    { name:'Dubai', lat:25.20, lon:55.27 },
    { name:'London', lat:51.51, lon:-.13 },
    { name:'Singapore', lat:1.35, lon:103.82 },
    { name:'New York', lat:40.71, lon:-74.01 },
    { name:'Sydney', lat:-33.87, lon:151.21 },
    { name:'Cape Town', lat:-33.92, lon:18.42 },
    { name:'São Paulo', lat:-23.55, lon:-46.63 },
    { name:'Tokyo', lat:35.68, lon:139.69 },
    { name:'Paris', lat:48.86, lon:2.35 }
  ];
  cities.forEach(city => {
    city.label = document.createElement('span');
    city.label.className = 'rc-city';
    city.label.textContent = city.name;
    city.label.setAttribute('aria-hidden', 'true');
    host.appendChild(city.label);
  });
  function contains(lon, lat, polygon) {
    let inside = false;
    for (let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
      const [xi,yi]=polygon[i], [xj,yj]=polygon[j];
      if ((yi>lat)!==(yj>lat) && lon<(xj-xi)*(lat-yi)/(yj-yi)+xi) inside=!inside;
    }
    return inside;
  }
  const dots = [];
  for (let lat=-75;lat<=80;lat+=4) {
    const step=4/Math.max(.25,Math.cos(lat*Math.PI/180));
    for (let lon=-180;lon<180;lon+=step) {
      if (land.some(polygon => contains(lon,lat,polygon))) dots.push([lat,lon]);
    }
  }
  let width=188,height=166,radius=64,angle=-35*Math.PI/180,time=0;
  let paused=false,visible=true,frame=0,last=0;
  const radians=Math.PI/180;
  function project(lat,lon) {
    const phi=lat*radians,theta=lon*radians+angle;
    const x=Math.cos(phi)*Math.sin(theta);
    const y=Math.sin(phi);
    const z=Math.cos(phi)*Math.cos(theta);
    const tilt=-.12;
    return { x:width/2+radius*(x*Math.cos(tilt)-y*Math.sin(tilt)), y:height/2-radius*(x*Math.sin(tilt)+y*Math.cos(tilt)), z };
  }
  function line(points,color) {
    context.strokeStyle=color;context.lineWidth=.5;
    context.beginPath();let started=false;
    points.forEach(([lat,lon]) => {
      const p=project(lat,lon);
      if (p.z<0) {started=false;return;}
      if (!started) {context.moveTo(p.x,p.y);started=true;} else context.lineTo(p.x,p.y);
    });
    context.stroke();
  }
  function draw() {
    context.clearRect(0,0,width,height);
    const cx=width/2,cy=height/2;
    const haze=context.createRadialGradient(cx,cy,radius*.7,cx,cy,radius*1.22);
    haze.addColorStop(0,'#56c8e800');haze.addColorStop(.7,'#75cfe426');haze.addColorStop(1,'#75cfe400');
    context.fillStyle=haze;context.beginPath();context.arc(cx,cy,radius*1.22,0,Math.PI*2);context.fill();
    const surface=context.createRadialGradient(cx-radius*.4,cy-radius*.45,2,cx+radius*.2,cy+radius*.2,radius*1.4);
    surface.addColorStop(0,'#173f56');surface.addColorStop(.55,'#0b2b42');surface.addColorStop(1,'#061b2d');
    context.fillStyle=surface;context.beginPath();context.arc(cx,cy,radius,0,Math.PI*2);context.fill();
    context.strokeStyle='#84c4d46b';context.lineWidth=.7;context.stroke();
    for (let lat=-60;lat<=60;lat+=30) line(Array.from({length:91},(_,i)=>[lat,i*4-180]),'#87bed02e');
    for (let lon=-180;lon<180;lon+=30) line(Array.from({length:61},(_,i)=>[i*3-90,lon]),'#87bed02e');
    dots.forEach(([lat,lon])=>{
      const p=project(lat,lon);if(p.z<=0)return;
      context.fillStyle=`rgba(119,215,224,${.15+.7*p.z})`;
      context.beginPath();context.arc(p.x,p.y,.6+.35*p.z,0,Math.PI*2);context.fill();
    });
    // A fine orbital ring and a travelling satellite highlight.
    context.save();context.translate(cx,cy);context.rotate(-.32);
    context.strokeStyle='#80a9bd66';context.lineWidth=.6;context.beginPath();context.ellipse(0,0,radius*1.22,radius*.38,0,0,Math.PI*2);context.stroke();
    context.fillStyle='#087ea4';context.beginPath();context.arc(Math.cos(time*.6)*radius*1.22,Math.sin(time*.6)*radius*.38,1.8,0,Math.PI*2);context.fill();context.restore();
    const front=cities.map(city=>({...city,p:project(city.lat,city.lon)})).filter(city=>city.p.z>.12);
    const origin=front.find(city=>city.home);
    if(origin) front.filter(city=>!city.home).slice(0,3).forEach((city,i)=>{
      const a=origin.p,b=city.p,mx=(a.x+b.x)/2,my=Math.min(a.y,b.y)-14;
      context.strokeStyle='#59d0df66';context.lineWidth=.6;context.beginPath();context.moveTo(a.x,a.y);context.quadraticCurveTo(mx,my,b.x,b.y);context.stroke();
      const t=(time*.18+i*.27)%1;
      const x=(1-t)*(1-t)*a.x+2*(1-t)*t*mx+t*t*b.x,y=(1-t)*(1-t)*a.y+2*(1-t)*t*my+t*t*b.y;
      context.fillStyle='#dbfcff';context.beginPath();context.arc(x,y,1.15,0,Math.PI*2);context.fill();
    });
    const used=[];
    cities.forEach(city=>{
      const p=project(city.lat,city.lon);
      city.label.style.opacity='0';
      if(p.z<=.12)return;
      context.fillStyle=city.home?'#ffc28b':'#c0f4ee';context.shadowColor='#7fe4ef';context.shadowBlur=5;
      context.beginPath();context.arc(p.x,p.y,city.home?2.4:1.7,0,Math.PI*2);context.fill();context.shadowBlur=0;
      context.strokeStyle=city.home?'#eaa16b88':'#66d8e866';context.lineWidth=.7;
      const pulse=3+(Math.sin(time*2.1)+1)*2;
      context.beginPath();context.arc(p.x,p.y,pulse,0,Math.PI*2);context.stroke();
      const labelWidth=city.name.length*4.2+6;
      let x=p.x+7,y=p.y-10;
      if(x+labelWidth>width-2)x=p.x-labelWidth-7;
      x=Math.max(2,x);y=Math.max(3,y);
      if(used.some(rect=>Math.abs(rect.y-y)<15&&x<rect.x+rect.w+3&&x+labelWidth>rect.x-3))return;
      used.push({x,y,w:labelWidth});
      city.label.style.transform=`translate(${x}px,${y}px)`;
      city.label.style.opacity=String(Math.min(1,p.z*3));
    });
    canvas.dataset.rotation=angle.toFixed(4);
  }
  function animate(now) {
    frame=0;
    if(paused||reduced.matches||!visible||document.hidden){last=0;return;}
    if(!last||now-last>=32){
      const dt=last?Math.min((now-last)/1000,.1):0;
      time+=dt;angle+=dt*.105;last=now;draw();
    }
    frame=requestAnimationFrame(animate);
  }
  function sync() {
    cancelAnimationFrame(frame);frame=0;last=0;
    draw();
    if(!paused&&!reduced.matches&&visible&&!document.hidden)frame=requestAnimationFrame(animate);
  }
  function resize() {
    width=host.clientWidth;height=host.clientHeight;radius=Math.min(width*.35,height*.385);
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);draw();
  }
  toggle.addEventListener('click',()=>{
    paused=!paused;toggle.textContent=paused?'▶':'Ⅱ';
    toggle.setAttribute('aria-label',paused?'Resume globe rotation':'Pause globe rotation');
    toggle.setAttribute('aria-pressed',String(paused));sync();
  });
  document.addEventListener('visibilitychange',sync);
  reduced.addEventListener('change',sync);
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(host);else window.addEventListener('resize',resize);
  if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;sync();},{threshold:.05}).observe(panel);
  resize();sync();
});
