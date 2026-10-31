function deliverRankingImages(files){
 if(!files.length)throw Error('没有可导出的图片');
 const mobile=matchMedia('(max-width:600px), (pointer:coarse)').matches;
 const download=file=>{const url=URL.createObjectURL(file.blob),a=document.createElement('a');a.href=url;a.download=file.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000)};
 if(!mobile){files.forEach(download);return}
 let dialog=document.querySelector('#imageExportDialog');
 if(!dialog){dialog=document.createElement('dialog');dialog.id='imageExportDialog';document.body.append(dialog)}
 if(dialog.releaseImages)dialog.releaseImages();
 dialog.replaceChildren();
 const heading=document.createElement('h3');heading.textContent='榜单图片';
 const hint=document.createElement('p');hint.textContent='长按图片保存到相册，也可以点击下载图片。';
 const image=document.createElement('img');image.alt='导出的榜单图片';
 const controls=document.createElement('div');controls.className='image-export-controls';
 const close=document.createElement('button');close.textContent='关闭';close.onclick=()=>dialog.close();
 const save=document.createElement('button');save.className='primary';save.textContent='下载图片';
 const urls=files.map(file=>URL.createObjectURL(file.blob));
 let selected=0;const show=index=>{selected=index;image.src=urls[index]};show(0);
 if(files.length>1){const pages=document.createElement('select');pages.setAttribute('aria-label','选择图片页码');files.forEach((file,index)=>{const option=document.createElement('option');option.value=index;option.textContent='第 '+(index+1)+' / '+files.length+' 张';pages.append(option)});pages.onchange=()=>show(Number(pages.value));controls.append(pages)}
 save.onclick=()=>download(files[selected]);controls.append(close,save);
 dialog.append(heading,hint,controls,image);
 dialog.releaseImages=()=>{urls.forEach(url=>URL.revokeObjectURL(url));image.removeAttribute('src');dialog.releaseImages=null};
 dialog.onclose=()=>dialog.releaseImages?.();
 if(!dialog.open)dialog.showModal();
}
