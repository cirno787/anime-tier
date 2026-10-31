const fs=require('fs'),vm=require('vm'),assert=require('assert');
(async()=>{
 const source=fs.readFileSync('site/scores.js','utf8');const start=source.indexOf('async function exportScoreBoard(){'),end=source.indexOf('exportBoard=async function',start);
 const ids=Array.from({length:201},(_,i)=>i+1),files=[],records=[],sizes=[];const ctx={fillRect(){},fillText(){},drawImage(){}};
 const c=vm.createContext({state:{scores:{1:9.7}},scoreOrder:()=>ids,byId:new Map(ids.map(id=>[id,{title:'作品'+id,image:'cover.jpg'}])),document:{createElement(){const canvas={getContext:()=>ctx,toBlob(fn,type){assert.equal(type,'image/png');sizes.push([canvas.width,canvas.height]);fn(new Blob(['test'],{type}))}};return canvas}},loadImage:async()=>({width:200,height:280}),deliverRankingImages:items=>files.push(...items),recordBoardExport:(mode,list)=>records.push({mode,list}),notify(){}});
 vm.runInContext(source.slice(start,end),c);await vm.runInContext('exportScoreBoard()',c);
 assert.equal(files.length,3);assert(files.every(f=>f.blob.type==='image/png'&&f.name.endsWith('.png')));assert(sizes.every(([w,h])=>w===1200&&h<=6580));assert.equal(records.length,1);assert.equal(records[0].list.length,201);
 console.log('PASS: score export produces PNG pages, bounds canvas size, preserves all 201 IDs and export history.');
})().catch(e=>{console.error(e);process.exit(1)});
