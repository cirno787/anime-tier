function renderTrollMode(){const enabled=!!state.trollMode;$('#trollMode').setAttribute('aria-pressed',String(enabled));$('#trollMode').classList.toggle('active',enabled);$('#trollNotice').hidden=!enabled;$('#board').setAttribute('aria-label',enabled?'动漫分级榜，串子模式已倒置':'动漫分级榜')}
function setTrollMode(enabled){state.trollMode=!!enabled;save();renderBoard();renderTrollMode()}
$('#trollMode').onclick=()=>setTrollMode(!state.trollMode);$('#cancelTroll').onclick=()=>setTrollMode(false);renderTrollMode();if(state.trollMode)renderBoard();
