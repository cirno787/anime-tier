function tierLayout(count,availableWidth,maxSingleHeight,gap=4,maxCardWidth=74){
 const rows=count>10?2:1,columns=rows===2?Math.ceil(count/2):10;
 gap=Math.min(gap,availableWidth/(columns*4));
 const fit=(availableWidth-(columns-1)*gap)/columns;
 const target=rows===1?maxCardWidth:Math.min(maxCardWidth/2,(maxSingleHeight-gap)/2/1.36)*Math.min(1,20/count);
 const width=Math.max(.1,Math.min(target,fit)),height=Math.min(width*1.36,maxSingleHeight);
 return {rows,columns,width,height,gap};
}
