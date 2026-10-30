/* Photo: a rendered scene used as a living backdrop. The image is sized like object-fit:cover, but in a frame we
   control, so overlays (sun glow, mist, water shimmer) and the scroll camera can be pinned to points in the picture. */
(()=>{
  const mk=(c,p)=>{const d=document.createElement('div');d.className=c;p.appendChild(d);return d;};
  function build(host,o){
    const root=document.createElement('div');root.className='ph';
    const fr=mk('fr',root),img=new Image();img.alt='';img.decoding='async';fr.appendChild(img);
    const glow=mk('glow',fr),mist=mk('mist',fr),mist2=mk('mist m2',fr),shim=mk('shim',fr),flash=mk('flash',root);
    host.prepend(root);
    let v=null,box={w:0,h:0,l:0,t:0};
    function fit(){
      const vw=root.clientWidth||innerWidth,vh=root.clientHeight||innerHeight;
      const nv=(vw/vh<.9&&o.port)?o.port:o.land;
      if(nv!==v){v=nv;img.src=v.src;}
      const w=Math.max(vw,vh*v.ar)*(o.over||1.03),h=w/v.ar;
      let l=(vw-w)/2;const t=(vh-h)/2;
      if(v.fx!=null&&vw/vh>=.9)l=Math.min(0,Math.max(vw-w,vw*v.fx-w*v.sun[0]/100));
      box={w,h,l,t};
      fr.style.cssText=`width:${w}px;height:${h}px;left:${l}px;top:${t}px;transform-origin:${(v.focus||v.sun)[0]}% ${(v.focus||v.sun)[1]}%`;
      glow.style.cssText=`left:${v.sun[0]}%;top:${v.sun[1]}%;width:${v.glow||28}%`;
      mist.style.top=v.hz+'%';mist2.style.top=(v.hz+5)+'%';shim.style.top=(v.hz+2)+'%';
      return v;
    }
    addEventListener('resize',fit);fit();
    /* where a point of the picture is on screen right now (before any camera scale) */
    const pt=([x,y])=>({x:box.l+box.w*x/100,y:box.t+box.h*y/100});
    return {root,fr,img,glow,flash,fit,pt,get v(){return v;}};
  }
  window.Photo={build};
})();
