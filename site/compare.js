const BOARD_STYLES={tiers:'档位排名',scores:'评分排名',compare:'对比排名'};
state.exportedBoards=state.exportedBoards&&typeof state.exportedBoards==='object'?state.exportedBoards:{};
state.watchedIds=Array.isArray(state.watchedIds)?state.watchedIds.filter(Number.isSafeInteger):[];
state.onlyWatched=!!state.onlyWatched;
if(!state.exportTrackingReady){state.legacyWatchedIds=[...ranked()].filter(id=>byId.has(id));state.exportTrackingReady=true}

function emptyComparison(){return {pair:[],seen:[],selectedIds:[],choices:0,winner:null,winnerSide:0,decisionDue:false,bestId:null,scope:''}}
function comparison(){if(!state.compare||!Array.isArray(state.compare.pair)||!Array.isArray(state.compare.seen)||!Array.isArray(state.compare.selectedIds))state.compare=emptyComparison();return state.compare}
function exportedSeenIds(target){return [...new Set(Object.entries(state.exportedBoards||{}).filter(([mode])=>mode!==target).flatMap(([,record])=>Array.isArray(record?.ids)?record.ids:[]))].filter(id=>byId.has(id))}
function recordBoardExport(mode,ids){state.exportedBoards=state.exportedBoards||{};state.exportedBoards[mode]={ids:[...new Set(ids)].filter(id=>byId.has(id)),at:Date.now()};save();syncWatchedFilter()}
const matchAllWorks=matches;
matches=function(work){return matchAllWorks(work)&&(!state.onlyWatched||state.watchedIds.includes(work.id))};
const availableUnrankedWorks=available;
available=function(){return state.onlyWatched?CATALOG.filter(matches):availableUnrankedWorks()};
function comparisonPool(){return CATALOG.filter(work=>work.media==='anime'&&matches(work)).map(work=>work.id)}
function drawOpponent(pool,exclude){let choices=pool.filter(id=>!exclude.includes(id)&&!comparison().seen.includes(id));if(!choices.length)choices=pool.filter(id=>!exclude.includes(id));return choices.length?choices[Math.floor(Math.random()*choices.length)]:null}
function ensureComparison(){
 let data=comparison();const scope=JSON.stringify([state.media,state.genres,state.onlyWatched?state.watchedIds:null,$('#search').value.trim()]);
 if(data.scope!==scope){state.compare=emptyComparison();data=state.compare;data.scope=scope}
 const pool=comparisonPool();
 if(data.bestId&&byId.has(data.bestId))return pool;
 if(pool.length<2){data.pair=[];return pool}
 if(data.pair.length!==2||data.pair.some(id=>!pool.includes(id))||data.pair[0]===data.pair[1]){const left=drawOpponent(pool,[]),right=drawOpponent(pool,[left]);data.pair=[left,right];data.seen=[...new Set([...data.seen,left,right])];save()}
 return pool;
}
function nextComparisonOpponent(){const data=comparison(),pool=comparisonPool(),winner=data.winner;const challenger=drawOpponent(pool,[winner]);if(challenger===null){data.pair=[];return}data.pair[data.winnerSide]=winner;data.pair[1-data.winnerSide]=challenger;data.seen=[...new Set([...data.seen,challenger])]}
function chooseComparison(side){const data=comparison();if(data.bestId||data.decisionDue||!data.pair[side])return;snapshot();data.winner=data.pair[side];data.winnerSide=side;data.selectedIds=[...new Set([...data.selectedIds,data.winner])];data.choices++;if(data.choices%10===0)data.decisionDue=true;else nextComparisonOpponent();save();renderBoard()}
let comparisonMotionVersion=0,comparisonAnimating=false,comparisonExitAnimation=null,comparisonEnterSide=null;
function reducedComparisonMotion(){return typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches}
function cancelComparisonMotion(){comparisonMotionVersion++;comparisonAnimating=false;if(comparisonExitAnimation){comparisonExitAnimation.cancel();comparisonExitAnimation=null}$('#board').setAttribute('aria-busy','false')}
async function animateComparisonChoice(side){
 const data=comparison();if(comparisonAnimating||data.bestId||data.decisionDue||!data.pair[side])return;
 const loser=$('#board').querySelector('.compare-card[data-side="'+(1-side)+'"]');
 if(!loser||typeof loser.animate!=='function'||reducedComparisonMotion()){chooseComparison(side);return}
 comparisonAnimating=true;const ticket=++comparisonMotionVersion,originalPair=[...data.pair],originalChoices=data.choices;
 $('#board').setAttribute('aria-busy','true');$('#board').querySelectorAll('.compare-card').forEach(card=>card.disabled=true);
 comparisonExitAnimation=loser.animate([{opacity:1,transform:'translateX(0) scale(1)'},{opacity:0,transform:'translateX('+(side===0?30:-30)+'px) scale(.94)'}],{duration:240,easing:'cubic-bezier(.4,0,.8,.3)',fill:'forwards'});
 try{await comparisonExitAnimation.finished}catch{}
 if(ticket!==comparisonMotionVersion)return;
 comparisonAnimating=false;
 if(state.boardStyle==='compare'&&comparison()===data&&data.choices===originalChoices&&data.pair.every((id,i)=>id===originalPair[i])){comparisonEnterSide=(data.choices+1)%10===0?null:1-side;chooseComparison(side)}
}
function continueComparison(){const data=comparison();if(!data.decisionDue)return;snapshot();data.decisionDue=false;nextComparisonOpponent();comparisonEnterSide=1-data.winnerSide;$('#bestQuestion').close();save();renderBoard()}
function confirmComparisonBest(){const data=comparison();if(!data.decisionDue||!byId.has(data.winner))return;snapshot();data.bestId=data.winner;data.decisionDue=false;$('#bestQuestion').close();save();renderBoard();notify('本次最佳已选出')}
function restartComparison(){snapshot();state.compare=emptyComparison();save();renderBoard()}
function compareCard(id,side){const work=byId.get(id),card=document.createElement('button');card.type='button';card.className='compare-card';card.dataset.side=side;card.setAttribute('aria-label','选择'+(side===0?'左侧':'右侧')+'：'+work.title);const image=new Image();image.src=work.image;image.alt=work.title;image.draggable=false;const name=document.createElement('span');name.textContent=work.title;card.append(image,name);card.onclick=()=>animateComparisonChoice(side);return card}
function renderComparisonBoard(){
 const pool=ensureComparison(),data=comparison(),board=$('#board');board.replaceChildren();board.setAttribute('aria-label','对比排名');
 if(data.bestId&&byId.has(data.bestId)){const result=document.createElement('div');result.className='compare-result';const label=document.createElement('span');label.className='compare-result-label';label.textContent='本次最佳';const image=new Image();image.src=byId.get(data.bestId).image;image.alt=byId.get(data.bestId).title;const title=document.createElement('h3');title.textContent=byId.get(data.bestId).title;const again=document.createElement('button');again.textContent='再比一次';again.className='primary';again.onclick=restartComparison;result.append(label,image,title,again);board.append(result)}
 else if(pool.length<2){const empty=document.createElement('div');empty.className='score-empty';empty.textContent='至少需要两部符合条件的番剧，请调整筛选';board.append(empty)}
 else{const pair=document.createElement('div');pair.className='compare-pair';const or=document.createElement('span');or.className='compare-or';or.textContent='还是';pair.append(compareCard(data.pair[0],0),or,compareCard(data.pair[1],1));const footer=document.createElement('div');footer.className='compare-progress';const count=document.createElement('span');count.textContent='已对比 '+data.choices+' 次';const again=document.createElement('button');again.type='button';again.textContent='重新开始';again.onclick=restartComparison;footer.append(count,again);board.append(pair,footer);const entrySide=comparisonEnterSide;comparisonEnterSide=null;const entry=entrySide===null?null:pair.querySelector('.compare-card[data-side="'+entrySide+'"]');if(entry&&typeof entry.animate==='function'&&!reducedComparisonMotion())entry.animate([{opacity:0,transform:'translateY(8px) scale(.98)'},{opacity:1,transform:'translateY(0) scale(1)'}],{duration:180,easing:'ease-out'})}
 $('#undo').disabled=!history.length;$('#export').disabled=!data.bestId;$('#refresh').disabled=pool.length<2||!!data.bestId;$('#poolStatus').textContent=data.bestId?'本次最佳已选出':'点击更喜欢的一部';
 if(data.decisionDue&&!$('#bestQuestion').open){$('#bestWorkName').textContent=byId.get(data.winner)?.title||'';$('#bestQuestion').showModal()}
}
let pendingBoardStyle=null,pendingWatchedIds=[];
function syncWatchedFilter(){const ids=exportedSeenIds(state.boardStyle),control=$('#watchedFilter');control.checked=state.onlyWatched;control.disabled=!ids.length&&!state.watchedIds.length;$('#watchedFilterRow').hidden=control.disabled}
renderStyleToggle=function(){$('#tierSettings').hidden=state.boardStyle!=='tiers';const button=$('#boardStyle');button.textContent=(BOARD_STYLES[state.boardStyle]||'档位排名')+' ▾';button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-pressed',String(state.boardStyle!=='tiers'));button.title='切换榜单样式';button.classList.toggle('active',state.boardStyle!=='tiers')};
function applyBoardStyle(mode,onlyWatched=false,ids=[]){state.boardStyle=mode;state.onlyWatched=onlyWatched;state.watchedIds=ids;if(mode==='compare')state.media='anime';pendingBoardStyle=null;state.legacyWatchedAsked=true;syncWorkFilters();save();renderFilters();renderBoard();refill(true)}
function requestBoardStyle(mode){if(!BOARD_STYLES[mode])return;$('#styleDialog').close();if(mode===state.boardStyle)return;let watched=exportedSeenIds(mode);const legacy=!watched.length&&!state.legacyWatchedAsked&&(state.legacyWatchedIds||[]).length;if(legacy)watched=state.legacyWatchedIds.filter(id=>byId.has(id));if(watched.length){pendingBoardStyle=mode;pendingWatchedIds=watched;$('#watchedDescription').textContent=legacy?'从现有榜单中，抽取已排名的作品。':'从其他已导出榜单中，抽取已排名的作品。';$('#watchedQuestion').showModal()}else applyBoardStyle(mode,false,[])}
$('#boardStyle').onclick=()=>{$('#styleDialog').querySelectorAll('[data-style]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.style===state.boardStyle)));$('#styleDialog').showModal()};
document.querySelectorAll('#styleDialog [data-style]').forEach(button=>button.onclick=()=>requestBoardStyle(button.dataset.style));
$('#closeStyle').onclick=()=>$('#styleDialog').close();
$('#onlyWatchedYes').onclick=()=>{const mode=pendingBoardStyle;if(!mode)return;$('#watchedQuestion').close();applyBoardStyle(mode,true,pendingWatchedIds)};
$('#onlyWatchedNo').onclick=()=>{const mode=pendingBoardStyle;if(!mode)return;$('#watchedQuestion').close();applyBoardStyle(mode,false,[])};
$('#cancelWatched').onclick=()=>{pendingBoardStyle=null;$('#watchedQuestion').close()};
$('#watchedQuestion').addEventListener('cancel',()=>{pendingBoardStyle=null});
$('#watchedFilter').onchange=event=>{state.onlyWatched=event.target.checked;if(state.onlyWatched){const ids=exportedSeenIds(state.boardStyle);if(ids.length)state.watchedIds=ids;}save();refill(true)};
$('#bestYes').onclick=confirmComparisonBest;$('#bestNo').onclick=continueComparison;
$('#bestQuestion').addEventListener('cancel',event=>{event.preventDefault();continueComparison()});
const renderExistingBoard=renderBoard;
renderBoard=function(){cancelComparisonMotion();const compare=state.boardStyle==='compare';$('#board').classList.toggle('compare-board',compare);$('#board').classList.toggle('score-board',state.boardStyle==='scores');$('#candidates').hidden=compare;$('.discovery').classList.toggle('compare-discovery',compare);$('#trollMode').disabled=compare;$('#export').disabled=false;renderStyleToggle();syncWatchedFilter();if(compare){$('#trollNotice').hidden=true;renderComparisonBoard()}else renderExistingBoard()};
const renderExistingCandidates=renderCandidates;
renderCandidates=function(){renderExistingCandidates();$('#candidates').hidden=state.boardStyle==='compare';if(state.boardStyle==='compare'){renderBoard();$('#refresh').disabled=comparisonPool().length<2||!!comparison().bestId;$('#poolStatus').textContent='点击更喜欢的一部'}syncWatchedFilter()};
const resetExistingBoard=$('#confirmReset').onclick;
$('#reset').onclick=()=>{const compare=state.boardStyle==='compare';$('#resetDialog h3').textContent=compare?'重新开始对比？':'重新开始排名？';$('#resetDialog p').textContent=compare?'清空本轮对比，其他榜单会保留。':'将清空榜单和跳过记录，所有作品回到候选库。可通过撤销恢复。';$('#resetDialog').showModal()};
$('#confirmReset').onclick=()=>{if(state.boardStyle==='compare'){restartComparison();$('#resetDialog').close()}else resetExistingBoard()};
// An export remains completed even when subsequent ranking edits are undone.
const undoExistingRanking=$('#undo').onclick;
$('#undo').onclick=()=>{const completed=state.exportedBoards||{};undoExistingRanking();state.exportedBoards=state.exportedBoards||{};for(const [mode,record] of Object.entries(completed))if(!state.exportedBoards[mode]||record.at>=state.exportedBoards[mode].at)state.exportedBoards[mode]=record;save();syncWatchedFilter()};
const clearExistingFilters=$('#clearFilters').onclick;
$('#clearFilters').onclick=()=>{state.onlyWatched=false;clearExistingFilters()};
const refreshExistingWorks=$('#refresh').onclick;
$('#refresh').onclick=()=>{if(state.boardStyle!=='compare'){refreshExistingWorks();return}if(comparison().bestId||comparison().decisionDue)return;snapshot();comparison().pair=[];if(state.refreshSound!==false){mortisVoice.pause();mortisVoice.currentTime=0;const playback=mortisVoice.play();if(playback)playback.catch(()=>{})}save();renderBoard()};
async function exportComparison(){const data=comparison(),id=data.bestId;if(!byId.has(id))return;const ids=[...new Set([...data.selectedIds,id])],work=byId.get(id),canvas=document.createElement('canvas');canvas.width=1000;canvas.height=800;const ctx=canvas.getContext('2d');ctx.fillStyle='#121416';ctx.fillRect(0,0,1000,800);ctx.textAlign='center';ctx.fillStyle='#dcf98b';ctx.font='bold 32px sans-serif';ctx.fillText('本次最佳',500,74);try{const image=await loadImage(work.image);const scale=Math.min(340/image.width,480/image.height),w=image.width*scale,h=image.height*scale;ctx.drawImage(image,500-w/2,125,w,h)}catch{}ctx.fillStyle='#f0f3ec';ctx.font='bold 30px sans-serif';ctx.fillText(work.title,500,685,900);ctx.fillStyle='#899387';ctx.font='18px sans-serif';ctx.fillText('对比排名 · 已对比 '+data.choices+' 次',500,740);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('导出失败');const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='对比排名-本次最佳.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);recordBoardExport('compare',ids);notify('最佳番剧已导出')}
const exportExistingBoard=exportBoard;
exportBoard=async function(){if(state.boardStyle!=='compare')return exportExistingBoard();const button=$('#export');button.disabled=true;try{await exportComparison()}catch{notify('导出失败，请重试')}finally{button.disabled=state.boardStyle==='compare'&&!comparison().bestId}};$('#export').onclick=exportBoard;
renderStyleToggle();renderBoard();refill();
