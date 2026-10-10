import {cleanBox,planCrop} from './geometry.mjs';
const $=id=>document.getElementById(id);
let image=null,boxes=[],ratio=1,margin=.2,draw=false,start=null,busy=false,detector=null,generation=0;
const status=message=>{$('status').textContent=message;};
const invalidate=()=>{$('reviewed').checked=false;$('export').disabled=true;};
function controls(){
  $('detect').disabled=!image||busy;$('draw').disabled=!image||busy;$('add').disabled=!image||busy;
  $('reviewed').disabled=!image||busy||!boxes.length;$('export').disabled=$('reviewed').disabled||!$('reviewed').checked;
}
function drawCrop(canvas,crop,padded=false,width=540){
  canvas.width=width;canvas.height=Math.round(width/ratio);
  const c=canvas.getContext('2d');c.fillStyle='#e8edf0';c.fillRect(0,0,canvas.width,canvas.height);
  let dw=canvas.width,dh=canvas.height,dx=0,dy=0;
  if(padded){const scale=Math.min(dw/image.naturalWidth,dh/image.naturalHeight);dw=image.naturalWidth*scale;dh=image.naturalHeight*scale;dx=(canvas.width-dw)/2;dy=(canvas.height-dh)/2;}
  c.drawImage(image,crop.x,crop.y,crop.width,crop.height,dx,dy,dw,dh);
}
function sourcePaint(){
  if(!image)return;
  const canvas=$('source'),w=image.naturalWidth,h=image.naturalHeight;
  canvas.width=Math.min(1400,w);canvas.height=Math.round(canvas.width*h/w);
  const c=canvas.getContext('2d'),s=canvas.width/w;c.drawImage(image,0,0,canvas.width,canvas.height);
  boxes.forEach((b,i)=>{c.strokeStyle='#03c6a7';c.fillStyle='#087f73';c.lineWidth=2.5;c.strokeRect(b.x*s,b.y*s,b.width*s,b.height*s);c.fillRect(b.x*s,b.y*s,26,23);c.fillStyle='white';c.font='bold 13px Arial';c.fillText(String(i+1),b.x*s+8,b.y*s+16);});
}
function render(){
  controls();$('count').textContent=boxes.length;$('boxes').replaceChildren();
  boxes.forEach((b,i)=>{const li=document.createElement('li'),label=document.createElement('span'),remove=document.createElement('button');label.textContent=`${i+1} · ${b.origin} · ${Math.round(b.width)} × ${Math.round(b.height)} px`;remove.textContent='Remove';remove.setAttribute('aria-label',`Remove region ${i+1}`);remove.disabled=busy;remove.onclick=()=>{boxes.splice(i,1);invalidate();render();};li.append(label,remove);$('boxes').append(li);});
  if(!image)return;
  document.querySelectorAll('.empty').forEach(e=>e.hidden=true);$('sourceEmpty').hidden=true;
  ['source','center','protected'].forEach(id=>$(id).style.display='block');
  const p=planCrop(image.naturalWidth,image.naturalHeight,ratio,boxes,margin);
  drawCrop($('center'),p.center);drawCrop($('protected'),p.crop,p.mode==='padding');sourcePaint();
  $('centerStat').textContent=boxes.length?`${p.kept}/${boxes.length} selected regions kept`:'No reviewed regions';
  $('protectedStat').textContent=p.mode==='review'?'Select regions':p.mode==='padding'?'Fit with padding':'Shifted crop';
  $('decision').textContent=p.mode==='review'?'Find faces or add regions manually. Nothing is protected until you select and review it.':p.mode==='padding'?'These selected regions cannot fit inside this crop ratio. Solid padding preserves the source without inventing new image content.':`A crop can contain all ${boxes.length} selected region${boxes.length===1?'':'s'} with the requested margin. Inspect the original for any missed faces.`;
}
async function loadPhoto(url,name){
  const token=++generation;invalidate();busy=false;image=null;boxes=[];start=null;controls();
  ['source','center','protected'].forEach(id=>$(id).style.display='none');
  document.querySelectorAll('.empty').forEach(e=>e.hidden=false);$('sourceEmpty').hidden=false;
  $('dimensions').textContent='Reading photo';$('count').textContent='0';$('boxes').replaceChildren();
  $('attribution').textContent='';status('Reading local photo…');
  try{const next=new Image();next.src=url;await next.decode();if(token!==generation)return;
    if(next.naturalWidth*next.naturalHeight>40000000)throw new Error('Please choose a photo smaller than 40 megapixels.');
    image=next;draw=false;$('draw').setAttribute('aria-pressed','false');$('dimensions').textContent=`${next.naturalWidth} × ${next.naturalHeight} px`;
    status(`${name} loaded. Run face detection or add regions manually, then review.`);render();
  }catch(error){if(token===generation){status(`Photo could not be loaded. ${error.message}`);controls();}}
}
$('file').onchange=async e=>{const f=e.target.files[0];if(!f)return;if(f.size>20000000){status('Choose a photo under 20 MB.');return;}const url=URL.createObjectURL(f);await loadPhoto(url,f.name);URL.revokeObjectURL(url);};
document.querySelectorAll('[data-ratio]').forEach(b=>b.onclick=()=>{ratio=Number(b.dataset.ratio);document.querySelectorAll('[data-ratio]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));invalidate();render();});
$('margin').oninput=e=>{margin=Number(e.target.value)/100;$('marginValue').textContent=`${e.target.value}%`;invalidate();render();};
function script(src){return new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Model library download failed.'));document.head.append(s);});}
let libraryPromise;
async function getDetector(){
  if(detector)return detector;
  if(!libraryPromise)libraryPromise=(async()=>{
    await script('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js');
    await script('https://cdn.jsdelivr.net/npm/@mediapipe/face_detection@0.4.1646425229/face_detection.js');
    await script('https://cdn.jsdelivr.net/npm/@tensorflow-models/face-detection@1.0.3/dist/face-detection.min.js');
    await window.tf.setBackend('cpu');await window.tf.ready();
    return window.faceDetection.createDetector(window.faceDetection.SupportedModels.MediaPipeFaceDetector,{runtime:'tfjs',modelType:'full',maxFaces:30});
  })();
  try{detector=await libraryPromise;return detector;}catch(e){libraryPromise=null;throw e;}
}
$('detect').onclick=async()=>{
  if(!image||busy)return;const token=generation,photo=image;busy=true;invalidate();render();status('Loading the face detector… First use downloads public model files. Your photo stays local.');
  try{const model=await getDetector();if(token!==generation)return;status('Running real face detection on the CPU…');const t=performance.now();const faces=await model.estimateFaces(photo,{flipHorizontal:false});if(token!==generation)return;
    const manual=boxes.filter(b=>b.origin==='Manual');boxes=[...manual,...faces.map(f=>cleanBox({x:f.box.xMin,y:f.box.yMin,width:f.box.width,height:f.box.height},photo.naturalWidth,photo.naturalHeight)).filter(Boolean).map(b=>({...b,origin:'AI detected'}))];
    status(`${faces.length} model detection${faces.length===1?'':'s'} · ${(performance.now()-t).toFixed(0)} ms · CPU. Review the boxes; small, occluded or side-facing faces may be missed. Manual regions were kept.`);
  }catch(e){if(token===generation)status(`AI unavailable: ${e.message} You can still draw or enter regions manually. No detections were invented.`);}
  finally{if(token===generation){busy=false;render();}}
};
function addBox(raw){if(!image||busy)return;const b=cleanBox(raw,image.naturalWidth,image.naturalHeight);if(!b){status('That rectangle does not overlap the photo. Check the pixel coordinates.');return;}boxes.push({...b,origin:'Manual'});invalidate();render();}
$('manual').onsubmit=e=>{e.preventDefault();const data=new FormData(e.target);addBox(Object.fromEntries(['x','y','width','height'].map(k=>[k,Number(data.get(k))])));};
$('draw').onclick=()=>{draw=!draw;$('draw').setAttribute('aria-pressed',String(draw));$('source').style.cursor=draw?'crosshair':'default';};
function point(e){const r=$('source').getBoundingClientRect();return{x:Math.max(0,Math.min(image.naturalWidth,(e.clientX-r.left)/r.width*image.naturalWidth)),y:Math.max(0,Math.min(image.naturalHeight,(e.clientY-r.top)/r.height*image.naturalHeight))};}
$('source').onpointerdown=e=>{if(!draw||!image||busy)return;start=point(e);$('source').setPointerCapture(e.pointerId);};
$('source').onpointermove=e=>{if(!start||!image)return;sourcePaint();const end=point(e),c=$('source').getContext('2d'),s=$('source').width/image.naturalWidth;c.strokeStyle='#fcbd24';c.setLineDash([6,4]);c.strokeRect(start.x*s,start.y*s,(end.x-start.x)*s,(end.y-start.y)*s);};
$('source').onpointerup=e=>{if(!start||!image)return;const end=point(e),first=start;start=null;addBox({x:Math.min(first.x,end.x),y:Math.min(first.y,end.y),width:Math.abs(end.x-first.x),height:Math.abs(end.y-first.y)});};
$('source').onpointercancel=()=>{start=null;sourcePaint();};
$('reviewed').onchange=controls;
$('export').onclick=()=>{if(!image||busy||!boxes.length||!$('reviewed').checked)return;const p=planCrop(image.naturalWidth,image.naturalHeight,ratio,boxes,margin),canvas=document.createElement('canvas');drawCrop(canvas,p.crop,p.mode==='padding',1080);canvas.toBlob(blob=>{if(!blob){status('PNG export failed. Please try again.');return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`framefair-${canvas.width}x${canvas.height}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);status(`Exported ${canvas.width} × ${canvas.height} PNG. The original photo was not changed.`);},'image/png');};
const demo=new Image();demo.onload=()=>{$('demo').disabled=false;};demo.src='assets/demo.jpg';
$('demo').onclick=async()=>{await loadPhoto('assets/demo.jpg','NASA sample');if(image)$('attribution').textContent='Sample: NASA / James Blair · No endorsement implied.';};
const loadLabel=$('file').parentElement;loadLabel.tabIndex=0;loadLabel.setAttribute('role','button');
loadLabel.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();$('file').click();}};
controls();
