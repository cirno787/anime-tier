const fs=require('fs'),vm=require('vm'),assert=require('assert');
const handlers={},mobile={matches:true},portrait={matches:true,addEventListener(_,fn){this.change=fn}};
let refreshes=0,refills=0,dialog=false,disabled=false;
const context=vm.createContext({Date,matchMedia:q=>q.includes('portrait')?portrait:mobile,refill:()=>refills++,document:{createElement:()=>({}),querySelector:()=>dialog,addEventListener:(name,fn)=>handlers[name]=fn},$:selector=>selector==='#refresh'?{get disabled(){return disabled},click(){refreshes++}}:{prepend(){}}});
vm.runInContext(fs.readFileSync('site/mobile.js','utf8'),context);
function event(x,y,time,extra={}){return{clientX:x,clientY:y,timeStamp:time,pointerId:1,pointerType:'touch',isPrimary:true,target:{closest:()=>true},preventDefault(){this.prevented=true},stopImmediatePropagation(){this.stopped=true},...extra}}
handlers.pointerdown(event(100,100,0));handlers.pointerup(event(165,105,200));assert.equal(refreshes,1);
const click=event(0,0,0);handlers.click(click);assert(click.stopped);
handlers.pointerdown(event(100,100,0));handlers.pointerup(event(35,105,200));assert.equal(refreshes,2);
for(const end of [[105,180,200],[110,105,200],[180,105,1500]]){handlers.pointerdown(event(100,100,0));handlers.pointerup(event(...end));}assert.equal(refreshes,2);
handlers.pointerdown(event(100,100,0,{pointerType:'mouse'}));handlers.pointerup(event(180,100,200));assert.equal(refreshes,2);
handlers.pointerdown(event(100,100,0));handlers.pointercancel();handlers.pointerup(event(180,100,200));assert.equal(refreshes,2);
disabled=true;handlers.pointerdown(event(100,100,0));handlers.pointerup(event(180,100,200));assert.equal(refreshes,2);
disabled=false;dialog=true;handlers.pointerdown(event(100,100,0));handlers.pointerup(event(180,100,200));assert.equal(refreshes,2);
portrait.change();assert.equal(refills,1);
console.log('PASS: left/right touch refresh, accidental click suppression, vertical scroll/tap/slow gesture ignored, mouse/cancel/disabled/dialog guards, orientation refill.');
