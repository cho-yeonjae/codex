(()=>{
  const field=document.querySelector('.meteor-field');
  const marker=document.querySelector('#marker');
  const scene=document.querySelector('a-scene');
  const lensElement=document.querySelector('.slow-zone');
  if(!field||!marker||!scene)return;
  const flow=document.createElement('div');flow.className='meteor-flow';field.append(flow);
  const fast=[['12cqw','7cqw','12cqw'],['28cqw','17cqw','9cqw'],['18cqw','35cqw','10cqw'],['76cqw','6cqw','12cqw'],['85cqw','18cqw','10cqw'],['74cqw','36cqw','11cqw'],['88cqw','42cqw','9cqw'],['47cqw','5cqw','8cqw'],['10cqw','24cqw','8cqw'],['90cqw','29cqw','10cqw']];
  let markerVisible=false,cycle=0,lastSeen=0,lensCenter={x:50,y:28};
  const lensSpecs=()=>[[`${(lensCenter.x+13).toFixed(2)}cqw`,`${(lensCenter.y-13).toFixed(2)}cqw`,'8cqw'],[`${(lensCenter.x+15).toFixed(2)}cqw`,`${(lensCenter.y-14).toFixed(2)}cqw`,'7cqw'],[`${(lensCenter.x+11).toFixed(2)}cqw`,`${(lensCenter.y-11).toFixed(2)}cqw`,'6cqw']];
  const removeWhenDone=(node,animation)=>animation.finished.catch(()=>{}).then(()=>node.remove());
  function trail([x,y,w],slow=false,tiny=false){
    const node=document.createElement('i');node.className=`flow-trail${tiny?' tiny':''}${slow?' lens-trail':''}`;node.style.setProperty('--x',x);node.style.setProperty('--y',y);node.style.setProperty('--w',tiny?`${(parseFloat(w)*.65).toFixed(2)}cqw`:w);flow.append(node);
    const frames=slow?
      [{transform:'translate(0,0) rotate(-28deg)',opacity:0},{transform:'translate(-7.8cqw,4.36cqw) rotate(-28deg)',opacity:.98,offset:.055},{transform:'translate(-17.5cqw,9.85cqw) rotate(-28deg)',opacity:.9,offset:.9},{transform:'translate(-23cqw,12.9cqw) rotate(-28deg)',opacity:.88,offset:.945},{transform:'translate(-30cqw,16.8cqw) rotate(-28deg)',opacity:0}]:
      [{transform:'translate(0,0) rotate(-28deg)',opacity:0},{transform:'translate(-2.4cqw,1.35cqw) rotate(-28deg)',opacity:.98,offset:.13},{transform:'translate(-18cqw,10cqw) rotate(-28deg)',opacity:0}];
    removeWhenDone(node,node.animate(frames,{duration:slow?11000:1350,fill:'forwards',easing:'linear'}));
  }
  function hero(slow=false){
    const node=document.createElement('img');node.className=`flow-hero${slow?' lens-hero':''}`;node.src='assets/center-meteor-v2.png';node.alt='';node.style.setProperty('--x',slow?`${(lensCenter.x+10).toFixed(2)}cqw`:'78cqw');node.style.setProperty('--y',slow?`${(lensCenter.y-17).toFixed(2)}cqw`:'4cqw');flow.append(node);
    const frames=slow?
      [{transform:'translate(0,0) scale(.72)',opacity:0},{transform:'translate(-12cqw,6.72cqw) scale(.76)',opacity:.98,offset:.055},{transform:'translate(-15cqw,8.4cqw) scale(.78)',opacity:.96,offset:.15},{transform:'translate(-19cqw,10.64cqw) scale(.8)',opacity:.95,offset:.9},{transform:'translate(-21cqw,11.76cqw) scale(.82)',opacity:.9,offset:.945},{transform:'translate(-30cqw,16.8cqw) scale(.84)',opacity:0}]:
      [{transform:'translate(0,0) scale(.7)',opacity:0},{transform:'translate(-4cqw,2.25cqw) scale(.74)',opacity:.96,offset:.12},{transform:'translate(-25cqw,14cqw) scale(.82)',opacity:0}];
    removeWhenDone(node,node.animate(frames,{duration:slow?11000:1700,fill:'forwards',easing:'linear'}));
  }
  function fastCycle(){
    const shift=(cycle*3)%fast.length;cycle+=1;
    for(let i=0;i<5;i++)setTimeout(()=>trail(fast[(shift+i)%fast.length],false,i>2),i*170);
    if(markerVisible){lensSpecs().forEach((spec,i)=>setTimeout(()=>trail(spec,true),i*180));if(cycle%3===1)setTimeout(()=>hero(true),420)}
  }
  function setMarker(active){
    if(markerVisible===active)return;markerVisible=active;document.body.classList.toggle('marker-active',active);if(active){fastCycle()}else{flow.querySelectorAll('.lens-trail,.lens-hero').forEach(node=>{node.getAnimations().forEach(animation=>animation.cancel());node.remove()})}}
  function moveLens(){const position=marker.object3D&&marker.object3D.position;if(!position||!lensElement)return;const centerX=Math.max(25,Math.min(75,50+position.x*16));const centerY=Math.max(18,Math.min(46,28-position.y*13));lensCenter={x:centerX,y:centerY};lensElement.style.left=`${(centerX-10).toFixed(2)}cqw`;lensElement.style.top=`${(centerY-10).toFixed(2)}cqw`}
  function seen(){lastSeen=performance.now();moveLens();setMarker(true)}
  marker.addEventListener('markerFound',seen);scene.addEventListener('markerFound',seen);
  const watch=()=>{const visible=Boolean(marker.object3D&&marker.object3D.visible);if(visible)seen();else if(markerVisible&&performance.now()-lastSeen>2800)setMarker(false);requestAnimationFrame(watch)};watch();
  fastCycle();setInterval(fastCycle,2300);
})();
