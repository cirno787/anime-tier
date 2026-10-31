const fs=require('fs'),vm=require('vm'),assert=require('assert');
class El{constructor(){this.children=[];this.value='';this.dataset={};this.style={setProperty(){}};this.classList={add(){},remove(){},toggle(){}};this.clientWidth=1000}append(...a){this.children.push(...a)}replaceChildren(...a){this.children=a}setAttribute(){}addEventListener(){}close(){this.open=false}showModal(){this.open=true}querySelector(){return null}querySelectorAll(){return []}focus(){}select(){}contains(){return false}}
function boot(saved,mobile=false){const els=new Map(),get=s=>{if(!els.has(s))els.set(s,new El());return els.get(s)};const c=vm.createContext({console,matchMedia:()=>({matches:mobile}),Image:class extends El{},ResizeObserver:class{observe(){}},document:{querySelector:get,querySelectorAll:()=>[],createElement:()=>new El(),addEventListener(){}},localStorage:{getItem:()=>saved||null,setItem(){}},setTimeout(){},clearTimeout(){},requestAnimationFrame(){}});vm.runInContext(['catalog.js','layout.js','app.js','tiers.js','troll.js','scores.js','compare.js'].map(f=>fs.readFileSync('site/'+f,'utf8')).join('\n'),c);return s=>vm.runInContext(s,c)}
for(const mobile of [false,true]){
 const run=boot(null,mobile),seen=new Set();let batches=0;
 while(run('queue.length')){for(const id of run('queue')){assert(!seen.has(id));seen.add(id)}run('markSkippedBatch();refill(true)');assert(++batches<600)}
 assert.equal(seen.size,run('CATALOG.length'));assert.equal(run('progressCounts().skipped'),seen.size);assert.equal(run('$("#candidates").children[0].children[0].textContent'),'全部作品已排名或跳过！');assert(run('$("#refresh").disabled'));
 const reloaded=boot(run('JSON.stringify(state)'),mobile);assert.equal(reloaded('queue.length'),0);
 run('$("#undo").onclick()');assert(run('queue.length')>0);assert.equal(run('queue.length'),mobile?5:10);
 run('place(queue[0],"S");markSkippedBatch();refill(true)');assert(!run('queue.some(id=>ranked().has(id)||state.skippedIds.includes(id))'));
}
const run=boot();run('markSkippedBatch();const passed=[...state.skippedIds];state.media="anime";refill(true);state.media="all";refill(true)');assert(!run('queue.some(id=>passed.includes(id))'));
run('state.refreshSound=false;applyBoardStyle("compare");const pair=[...comparison().pair];$("#refresh").onclick()');assert(run('pair.every(id=>state.skippedIds.includes(id))'));assert(!run('comparison().pair.some(id=>pair.includes(id))'));
run('$("#undo").onclick()');assert(!run('pair.some(id=>state.skippedIds.includes(id))'));
run('applyBoardStyle("compare",true,[9717,2582]);$("#refresh").onclick()');assert.equal(run('comparisonPool().length'),0);assert(run('$("#refresh").disabled'));
run('applyBoardStyle("compare",true,[9717]);state.skippedIds=state.skippedIds.filter(id=>id!==9717);renderBoard()');assert(!run('$("#refresh").disabled'));run('$("#refresh").onclick()');assert.equal(run('comparisonPool().length'),0);
console.log('PASS: exhaustive desktop/phone skips without repeats, completion notice, reload persistence, undo, rating exclusion, filters, comparison skips/undo and last single work.');

const search=boot();search('state.skippedIds=[9717];refill(true)');assert(!search('queue.includes(9717)'));
search('$("#search").value=byId.get(9717).title;refill(true)');assert(search('available().some(work=>work.id===9717)'));assert(search('queue.includes(9717)'));
search('$("#search").value="";refill(true)');assert(!search('queue.includes(9717)'));
search('$("#search").value=byId.get(9717).title;refill(true);place(9717,"S")');assert(!search('state.skippedIds.includes(9717)'));assert(search('ranked().has(9717)'));
search('state.skippedIds=[2582];applyBoardStyle("compare");$("#search").value=byId.get(2582).title;refill(true)');assert(search('comparisonPool().includes(2582)'));
search('$("#search").value="";refill(true)');assert(!search('comparisonPool().includes(2582)'));
console.log('PASS: explicit search finds skipped works for rating/comparison; clearing search excludes them again; rating removes the skip record.');
