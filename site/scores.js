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
function exportScoreBoard(){
 const ids=scoreOrder(),width=1400,rowHeight=58,height=180+Math.max(ids.length,1)*rowHeight;
 let svg='<svg xmlns="http://www.w3.org/2000/svg" width="'+width+'" height="'+height+'" viewBox="0 0 '+width+' '+height+'"><rect width="100%" height="100%" fill="#121416"/><g font-family="sans-serif"><text x="40" y="65" fill="#f0f3ec" font-size="30" font-weight="700">我的评分榜</text>';
 if(state.trollMode)svg+='<text x="40" y="105" fill="#f4bc84" font-size="18">串子模式 · 榜单已倒置</text>';
 ids.forEach((id,index)=>{const score=state.scores?.[id],y=132+index*rowHeight;svg+='<rect x="40" y="'+y+'" width="1320" height="57" fill="'+(index%2?'#202426':'#1b1e20')+'"/><text x="65" y="'+(y+36)+'" fill="#dcf98b" font-size="22">'+(index+1)+'</text><svg x="140" y="'+y+'" width="1060" height="57"><text x="0" y="36" fill="#f0f3ec" font-size="22">'+xmlText(byId.get(id).title)+'</text></svg><text x="1335" y="'+(y+36)+'" text-anchor="end" fill="'+(Number.isFinite(score)?'#dcf98b':'#899387')+'" font-size="24">'+(Number.isFinite(score)?score.toFixed(1):'未评分')+'</text>'});
 svg+='</g></svg>';const blob=new Blob([svg],{type:'image/svg+xml;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='我的评分榜.svg';a.click();if(typeof recordBoardExport==='function')recordBoardExport('scores',ids);setTimeout(()=>URL.revokeObjectURL(url),10000);notify('评分榜已导出');
}
exportBoard=function(){if(state.boardStyle==='scores')exportScoreBoard();else return exportTierBoard()};$('#export').onclick=exportBoard;
renderBoard();

const renderBaseCandidates=renderCandidates;renderCandidates=function(){renderBaseCandidates();const hint=document.querySelector(".pool-foot>span:last-child");if(hint)hint.textContent=state.boardStyle==='scores'?'悬停查看片名 · 点击封面评分':'悬停查看片名 · 点击封面选择档位';if(state.boardStyle==='scores'&&queue.length)$("#poolStatus").textContent='点击作品评分，按分数自动排名'};renderCandidates();
