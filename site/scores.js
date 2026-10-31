// The list view shares membership with the tier board, while scores and tier positions stay independent.
state.scores=state.scores&&typeof state.scores==='object'&&!Array.isArray(state.scores)?state.scores:{};
state.boardStyle=['tiers','scores','compare'].includes(state.boardStyle)?state.boardStyle:'tiers';
for(const [id,value] of Object.entries(state.scores))if(!Number.isFinite(value)||value<0||value>10||Math.abs(value*10-Math.round(value*10))>1e-8)delete state.scores[id];
let scoreSelected=null;
function scoreOrder(){
 const ids=[...ranked()].filter(id=>byId.has(id));
 const order=new Map(ids.map((id,i)=>[id,i]));
 ids.sort((a,b)=>{const av=state.scores?.[a],bv=state.scores?.[b],as=Number.isFinite(av),bs=Number.isFinite(bv);return as&&bs?bv-av||order.get(a)-order.get(b):as?-1:bs?1:order.get(a)-order.get(b)});
 return state.trollMode?ids.reverse():ids;
}
function renderStyleToggle(){$('#tierSettings').hidden=state.boardStyle!=='tiers';const on=state.boardStyle==='scores',button=$('#boardStyle');button.textContent=on?'▤ 档位样式':'☷ 评分样式';button.setAttribute('aria-pressed',String(on));button.title=on?'切回档位榜，保留评分':'切换为评分排名';button.classList.toggle('active',on)}
const renderTierBoard=renderBoard;
renderBoard=function(){
 renderStyleToggle();
 const board=$('#board');board.classList.toggle('score-board',state.boardStyle==='scores');
 if(state.boardStyle!=='scores'){renderTierBoard();return}
 board.replaceChildren();const ids=scoreOrder();
 if(!ids.length){const empty=document.createElement('div');empty.className='score-empty';empty.textContent='点击下方作品评分，开始排名';board.append(empty)}
 ids.forEach((id,index)=>{const work=byId.get(id),row=document.createElement('button');row.type='button';row.className='score-row';row.dataset.id=id;const score=state.scores?.[id],hasScore=Number.isFinite(score);row.setAttribute('aria-label','第 '+(index+1)+' 名，'+work.title+'，'+(hasScore?score.toFixed(1)+' 分':'未评分')+'，点击评分');
 const rank=document.createElement('span');rank.className='score-rank';rank.textContent=index+1;
 const image=new Image();image.className='score-cover';image.src=work.image;image.alt='';image.loading='lazy';image.onerror=()=>{image.style.visibility='hidden'};
 const title=document.createElement('span');title.className='score-title';title.textContent=work.title;
 const value=document.createElement('span');value.className='score-value'+(hasScore?'':' unscored');value.textContent=hasScore?score.toFixed(1):'未评分';
 row.append(rank,image,title,value);row.onclick=()=>openScorePicker(id);board.append(row)});
 $('#undo').disabled=!history.length;renderTrollMode();board.setAttribute('aria-label',state.trollMode?'作品评分榜，串子模式已倒置':'作品评分榜，按评分排序');
};
function openScorePicker(id){if(!byId.has(id))return;scoreSelected=id;$('#scoreTitle').textContent=byId.get(id).title;const value=state.scores?.[id];$('#workScore').value=Number.isFinite(value)?value.toFixed(1):'';$('#scoreError').textContent='';$('#removeScoredWork').hidden=!ranked().has(id);$('#scoreDialog').showModal();$('#workScore').focus();$('#workScore').select()}
function setWorkScore(id,value){
 if(!byId.has(id)||!Number.isFinite(value)||value<0||value>10||Math.abs(value*10-Math.round(value*10))>1e-8)throw Error('请输入 0–10 分，最多一位小数');
 snapshot();state.scores=state.scores||{};state.scores[id]=Math.round(value*10)/10;
 if(!ranked().has(id)){const tier=TIERS.find(t=>t.id==='B')||TIERS[Math.floor(TIERS.length/2)];state.rows[tier.id].push(id)}
 state.skippedIds=state.skippedIds.filter(x=>x!==id);queue=queue.filter(x=>x!==id);save();renderBoard();refill();
}
const openTierPicker=openPicker;
openPicker=function(id){if(state.boardStyle==='scores')openScorePicker(id);else openTierPicker(id)};
$('#boardStyle').onclick=()=>{state.boardStyle=state.boardStyle==='scores'?'tiers':'scores';save();renderBoard();refill()};
$('#closeScore').onclick=()=>$('#scoreDialog').close();$('#cancelScore').onclick=()=>$('#scoreDialog').close();
$('#scoreForm').addEventListener('submit',event=>{event.preventDefault();try{const raw=$('#workScore').value.trim();if(!raw)throw Error('请输入评分');setWorkScore(scoreSelected,Number(raw));$('#scoreDialog').close();notify('评分已保存，排名已更新')}catch(error){$('#scoreError').textContent=error.message}});
$('#removeScoredWork').onclick=()=>{place(scoreSelected,null);$('#scoreDialog').close()};
$('#board').addEventListener('dragover',event=>{if(state.boardStyle==='scores'&&dragging!==null){event.preventDefault();event.dataTransfer.dropEffect='move'}});
$('#board').addEventListener('drop',event=>{if(state.boardStyle!=='scores')return;event.preventDefault();const id=Number(event.dataTransfer.getData('text/plain'));dragging=null;if(byId.has(id))openScorePicker(id)});
const exportTierBoard=exportBoard;
function xmlText(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]))}
async function exportScoreBoard(){
 const ids=scoreOrder(),files=[],pageSize=100,width=1200,rowHeight=64,pages=Math.max(1,Math.ceil(ids.length/pageSize));
 for(let page=0;page<pages;page++){
  const list=ids.slice(page*pageSize,(page+1)*pageSize),canvas=document.createElement('canvas');canvas.width=width;canvas.height=180+Math.max(1,list.length)*rowHeight;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#121416';ctx.fillRect(0,0,width,canvas.height);ctx.fillStyle='#f0f3ec';ctx.font='bold 30px sans-serif';ctx.fillText('我的评分榜',40,62);
  ctx.fillStyle=state.trollMode?'#f4bc84':'#899387';ctx.font='16px sans-serif';ctx.fillText(state.trollMode?'串子模式 · 榜单已倒置':ids.length+' 部作品'+(pages>1?' · 第 '+(page+1)+' / '+pages+' 页':''),40,100);
  for(let index=0;index<list.length;index++){
   const id=list[index],work=byId.get(id),score=state.scores?.[id],y=132+index*rowHeight;
   ctx.fillStyle=index%2?'#202426':'#1b1e20';ctx.fillRect(40,y,1120,rowHeight-1);ctx.fillStyle='#dcf98b';ctx.font='22px sans-serif';ctx.fillText(String(page*pageSize+index+1),55,y+40,65);
   try{const cover=await loadImage(work.image);const cw=36,ch=52,scale=Math.max(cw/cover.width,ch/cover.height),sw=cw/scale,sh=ch/scale;ctx.drawImage(cover,(cover.width-sw)/2,(cover.height-sh)/2,sw,sh,130,y+6,cw,ch)}catch{}
   ctx.fillStyle='#f0f3ec';ctx.font='22px sans-serif';ctx.fillText(work.title,185,y+40,820);ctx.textAlign='right';ctx.fillStyle=Number.isFinite(score)?'#dcf98b':'#899387';ctx.font='24px sans-serif';ctx.fillText(Number.isFinite(score)?score.toFixed(1):'未评分',1140,y+40);ctx.textAlign='left';
  }
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('图片生成失败');files.push({blob,name:'我的评分榜'+(pages>1?'-'+(page+1):'')+'.png'});canvas.width=canvas.height=1;
 }
 deliverRankingImages(files);if(typeof recordBoardExport==='function')recordBoardExport('scores',ids);notify('评分榜图片已生成');
}
exportBoard=async function(){if(state.boardStyle!=='scores')return exportTierBoard();const button=$('#export');button.disabled=true;button.textContent='正在生成…';try{await exportScoreBoard()}catch{notify('图片生成失败，请重试')}finally{button.disabled=false;button.textContent='↓ 导出榜单'}};$('#export').onclick=exportBoard;
renderBoard();

const renderBaseCandidates=renderCandidates;renderCandidates=function(){renderBaseCandidates();const hint=document.querySelector(".pool-foot>span:last-child");if(hint)hint.textContent=state.boardStyle==='scores'?'悬停查看片名 · 点击封面评分':'悬停查看片名 · 点击封面选择档位';if(state.boardStyle==='scores'&&queue.length)$("#poolStatus").textContent='点击作品评分，按分数自动排名'};renderCandidates();
