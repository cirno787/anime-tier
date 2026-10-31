// Refresh through the existing action so voice, skip counts and comparison stay consistent.
function isRefreshSwipe(start,end){
 const dx=end.x-start.x,dy=end.y-start.y;
 return Math.abs(dx)>=45&&Math.abs(dy)<Math.abs(dx)*.55&&end.time-start.time<1200;
}
(()=>{
 const mobile=matchMedia('(max-width:600px), (orientation:landscape) and (max-height:500px) and (max-width:1100px)');
 const portrait=matchMedia('(max-width:600px) and (orientation:portrait)');
 const hint=document.createElement('span');hint.className='swipe-hint';hint.textContent='← 左右滑动封面换一批 →';
 $('.pool-actions').prepend(hint);
 let start=null,suppressClickUntil=0;
 document.addEventListener('pointerdown',event=>{
  if(!event.isPrimary){start=null;return}
  if(!mobile.matches||event.pointerType!=='touch'||document.querySelector('dialog[open]')||!event.target.closest('#candidates,.compare-board'))return;
  start={x:event.clientX,y:event.clientY,time:event.timeStamp,id:event.pointerId};
 },true);
 document.addEventListener('pointermove',event=>{
  if(!start||event.pointerId!==start.id)return;
  if(Math.abs(event.clientX-start.x)>15&&Math.abs(event.clientX-start.x)>Math.abs(event.clientY-start.y)*1.8)event.preventDefault();
 },{capture:true,passive:false});
 document.addEventListener('pointerup',event=>{
  if(!start||event.pointerId!==start.id)return;
  const origin=start;start=null;
  if(!mobile.matches||!isRefreshSwipe(origin,{x:event.clientX,y:event.clientY,time:event.timeStamp}))return;
  suppressClickUntil=Date.now()+500;event.preventDefault();
  if(!$('#refresh').disabled&&!document.querySelector('dialog[open]'))$('#refresh').click();
 },true);
 document.addEventListener('pointercancel',()=>{start=null},true);
 document.addEventListener('click',event=>{
  if(Date.now()<suppressClickUntil&&event.target.closest('#candidates,.compare-board')){event.preventDefault();event.stopImmediatePropagation()}
 },true);
 portrait.addEventListener('change',()=>refill());
})();
