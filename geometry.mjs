export function cleanBox(b, w, h) {
  if (![b.x,b.y,b.width,b.height,w,h].every(Number.isFinite) || w<=0 || h<=0 || b.width<=0 || b.height<=0) return null;
  const x=Math.max(0,b.x), y=Math.max(0,b.y), right=Math.min(w,b.x+b.width), bottom=Math.min(h,b.y+b.height);
  return right>x && bottom>y ? {x,y,width:right-x,height:bottom-y} : null;
}
export function centerCrop(w,h,ratio) {
  if (![w,h,ratio].every(v=>Number.isFinite(v)&&v>0)) throw new Error('Invalid dimensions');
  const width=Math.min(w,h*ratio),height=width/ratio;
  return {x:(w-width)/2,y:(h-height)/2,width,height};
}
export function contains(a,b) {
  const e=1e-7;
  return b.x>=a.x-e && b.y>=a.y-e && b.x+b.width<=a.x+a.width+e && b.y+b.height<=a.y+a.height+e;
}
export function planCrop(w,h,ratio,boxes,margin=0) {
  const center=centerCrop(w,h,ratio);
  if (!Number.isFinite(margin)||margin<0||margin>1) throw new Error('Invalid margin');
  const valid=boxes.map(b=>cleanBox(b,w,h)).filter(Boolean);
  if (!valid.length) return {mode:'review',crop:center,center,boxes:[],kept:0};
  const expanded=valid.map(b=>cleanBox({x:b.x-b.width*margin,y:b.y-b.height*margin,width:b.width*(1+2*margin),height:b.height*(1+2*margin)},w,h));
  const left=Math.min(...expanded.map(b=>b.x)), top=Math.min(...expanded.map(b=>b.y));
  const right=Math.max(...expanded.map(b=>b.x+b.width)), bottom=Math.max(...expanded.map(b=>b.y+b.height));
  const union={x:left,y:top,width:right-left,height:bottom-top};
  const kept=valid.filter(b=>contains(center,b)).length;
  if (union.width>center.width+1e-7||union.height>center.height+1e-7) return {mode:'padding',crop:{x:0,y:0,width:w,height:h},center,boxes:valid,expanded,union,kept};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const x=clamp(center.x,Math.max(0,right-center.width),Math.min(left,w-center.width));
  const y=clamp(center.y,Math.max(0,bottom-center.height),Math.min(top,h-center.height));
  return {mode:'crop',crop:{...center,x,y},center,boxes:valid,expanded,union,kept};
}
