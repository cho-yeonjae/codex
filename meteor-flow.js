(()=>{
  const field=document.querySelector('.meteor-field');
  const marker=document.querySelector('#marker');
  const scene=document.querySelector('a-scene');
  const lensElement=document.querySelector('.slow-zone');
  const artwork=document.querySelector('.artwork');
  if(!field||!marker||!scene)return;
  const flow=document.createElement('div');flow.className='meteor-flow';field.append(flow);
  const debug=document.createElement('aside');debug.className='ar-debug';debug.setAttribute('aria-live','polite');document.body.append(debug);
  const fast=[['12cqw','7cqw','12cqw'],['28cqw','17cqw','9cqw'],['18cqw','35cqw','10cqw'],['76cqw','6cqw','12cqw'],['85cqw','18cqw','10cqw'],['74cqw','36cqw','11cqw'],['88cqw','42cqw','9cqw'],['47cqw','5cqw','8cqw'],['10cqw','24cqw','8cqw'],['90cqw','29cqw','10cqw']];
  const lensRadius=10;
  let markerVisible=false,mouseLensMode=false,cycle=0,lastSeen=0,lensCenter={x:50,y:28};
  const lensSpecs=()=>[[`${(lensCenter.x+13).toFixed(2)}cqw`,`${(lensCenter.y-13).toFixed(2)}cqw`,'8cqw'],[`${(lensCenter.x+13.4).toFixed(2)}cqw`,`${(lensCenter.y-12.7).toFixed(2)}cqw`,'7cqw'],[`${(lensCenter.x+12.6).toFixed(2)}cqw`,`${(lensCenter.y-13.3).toFixed(2)}cqw`,'6cqw']];
  const removeWhenDone=(node,animation)=>animation.finished.catch(()=>{}).then(()=>node.remove());
  const number=value=>Number.parseFloat(value);
  function dynamicLensMotion(node,startX,startY,hero=false){
    const dx=-30,dy=16.8,total=Math.hypot(dx,dy);let traveled=0,lastTime=0,stopped=false;
    node._lensStop=()=>{stopped=true};
    const step=now=>{
      if(stopped||!markerVisible){node.remove();return}
      if(!lastTime)lastTime=now;
      const px=startX+dx*(traveled/total),py=startY+dy*(traveled/total);
      const inside=Math.hypot(px-lensCenter.x,py-lensCenter.y)<=lensRadius;
      const speed=inside?1.8:21;
      traveled=Math.min(total,traveled+speed*Math.min(48,now-lastTime)/1000);lastTime=now;
      const progress=traveled/total,tx=dx*progress,ty=dy*progress;
      node.style.transform=hero?`translate(${tx}cqw,${ty}cqw) scale(${(.72+progress*.12).toFixed(3)})`:`translate(${tx}cqw,${ty}cqw) rotate(-28deg)`;
      node.style.opacity=progress<.025?(progress/.025).toFixed(2):progress>.96?((1-progress)/.04).toFixed(2):'0.96';
      if(traveled<total)requestAnimationFrame(step);else node.remove();
    };
    requestAnimationFrame(step);
  }
  function trail([x,y,w],slow=false,tiny=false){
    const node=document.createElement('i');node.className=`flow-trail${tiny?' tiny':''}${slow?' lens-trail':''}`;node.style.setProperty('--x',x);node.style.setProperty('--y',y);node.style.setProperty('--w',tiny?`${(number(w)*.65).toFixed(2)}cqw`:w);flow.append(node);
    if(slow){dynamicLensMotion(node,number(x),number(y));return}
    const frames=[{transform:'translate(0,0) rotate(-28deg)',opacity:0},{transform:'translate(-2.4cqw,1.35cqw) rotate(-28deg)',opacity:.98,offset:.13},{transform:'translate(-18cqw,10cqw) rotate(-28deg)',opacity:0}];
    removeWhenDone(node,node.animate(frames,{duration:1350,fill:'forwards',easing:'linear'}));
  }
  function hero(slow=false){
    const node=document.createElement('img');node.className=`flow-hero${slow?' lens-hero':''}`;node.src='assets/center-meteor-v2.png';node.alt='';const x=slow?lensCenter.x+10:78,y=slow?lensCenter.y-17:4;node.style.setProperty('--x',`${x.toFixed(2)}cqw`);node.style.setProperty('--y',`${y.toFixed(2)}cqw`);flow.append(node);
    if(slow){dynamicLensMotion(node,x,y,true);return}
    const frames=[{transform:'translate(0,0) scale(.7)',opacity:0},{transform:'translate(-4cqw,2.25cqw) scale(.74)',opacity:.96,offset:.12},{transform:'translate(-25cqw,14cqw) scale(.82)',opacity:0}];
    removeWhenDone(node,node.animate(frames,{duration:1700,fill:'forwards',easing:'linear'}));
  }
  function fastCycle(){const shift=(cycle*3)%fast.length;cycle+=1;for(let i=0;i<5;i++)setTimeout(()=>trail(fast[(shift+i)%fast.length],false,i>2),i*170);if(markerVisible){lensSpecs().forEach((spec,i)=>setTimeout(()=>trail(spec,true),i*180));if(cycle%3===1)setTimeout(()=>hero(true),420)}}
  function setMarker(active){if(markerVisible===active)return;markerVisible=active;document.body.classList.toggle('marker-active',active);if(active){fastCycle()}else{flow.querySelectorAll('.lens-trail,.lens-hero').forEach(node=>{node._lensStop?.();node.getAnimations().forEach(animation=>animation.cancel());node.remove()})}}
  function placeLens(centerX,centerY){if(!lensElement)return;const x=Math.max(25,Math.min(75,centerX));const y=Math.max(18,Math.min(46,centerY));lensCenter={x,y};lensElement.style.left=`${(x-lensRadius).toFixed(2)}cqw`;lensElement.style.top=`${(y-lensRadius).toFixed(2)}cqw`}
  function moveLens(){const position=marker.object3D&&marker.object3D.position;if(!position)return;placeLens(50+position.x*16,28-position.y*13)}
  function seen(){if(mouseLensMode)return;lastSeen=performance.now();moveLens();setMarker(true)}
  marker.addEventListener('markerFound',seen);scene.addEventListener('markerFound',seen);
  const watch=()=>{if(!mouseLensMode){const visible=Boolean(marker.object3D&&marker.object3D.visible);if(visible)seen();else if(markerVisible&&performance.now()-lastSeen>2800)setMarker(false)}requestAnimationFrame(watch)};watch();
  artwork.addEventListener('pointermove',event=>{if(!mouseLensMode)return;const rect=artwork.getBoundingClientRect();placeLens((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.width*100)});
  window.addEventListener('keydown',event=>{if(event.key.toLowerCase()!=='a'||event.repeat)return;mouseLensMode=!mouseLensMode;document.body.classList.toggle('mouse-lens-mode',mouseLensMode);if(mouseLensMode){placeLens(50,28);setMarker(true)}else{setMarker(false)}});
  const renderDebug=()=>{if(mouseLensMode){debug.innerHTML='<strong class="ok">마우스 렌즈</strong><div>A 키로 AR로 전환</div><div>렌즈 켜짐</div>';return}const age=lastSeen?performance.now()-lastSeen:Infinity;const state=age<350?['인식됨','ok']:age<2800?['신호 약함','wait']:['미인식','lost'];debug.innerHTML=`<strong class="${state[1]}">AR ${state[0]}</strong><div>마지막 인식 ${Number.isFinite(age)?(age/1000).toFixed(1)+'초 전':'없음'}</div><div>렌즈 ${markerVisible?'켜짐':'꺼짐'} · A: 마우스</div>`};setInterval(renderDebug,160);renderDebug();
  fastCycle();setInterval(fastCycle,2300);
})();
