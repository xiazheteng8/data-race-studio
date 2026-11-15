let mp4LibraryPromise,mp4Cached=null;
async function mp4WithTimeout(work,ms=15000){let timer;try{return await Promise.race([work,new Promise((_,reject)=>{timer=setTimeout(()=>reject(Error('原生编码超时')),ms)})])}finally{clearTimeout(timer)}}
async function encodeMP4(button,entranceMode=null,trackKind=null,includeModules=false){
 if(recording){toast('请等待当前视频生成完成');return}
 const mode=entranceMode||chartMode,seconds=entranceMode?4.5:Number($('#duration').value),portrait=!entranceMode&&$('#ratio').value==='portrait',resolution=Number($('#mp4Resolution').value),{width,height}=mp4ExportSize(resolution,portrait),allRanked=rankAwards(values(1)),awardOptions=getAwardOptions(),ranked=selectAwardEntries(allRanked,awardOptions);
 const nativeFPS=includeModules?30:24,outputWidth=trackKind?Math.max(2,Math.round(width/2)*2):width,outputHeight=trackKind?Math.max(2,Math.round(width*.29/2)*2):height;
 const key=JSON.stringify([data,$('#datasetTitle').textContent,mode,seconds,portrait,topCount(),!!entranceMode,$('#mp4Engine')?.value,resolution,awardOptions,includeModules,trackKind,window.MusicStudio?.cacheKey(),document.documentElement.dataset.theme,'podium-metrics-optional-v6']);
 if(mp4Cached?.key===key){return {name:mp4Cached.name,blob:mp4Cached.blob}}
 const originalLabel=button.textContent,oldPos=pos,oldPlaying=playing;
 const controls=[...document.querySelectorAll('#exportMusic,#customMusic,#import,#sample,#file,#confirmSheet,#top,#chartMode,#duration,#ratio,#mp4Engine,#mp4Modules,#mp4Resolution,#galleryMP4Resolution,#awardTop,#awardOrder,#awardEffect,#play,#reset,#seek,#export,#python,.export-video,.export-mp4')].map(el=>[el,el.disabled]);
 recording=true;playing=false;$('#play').textContent='▶';controls.forEach(([el])=>el.disabled=true);let output;
 try{
  const forceSoftware=location.protocol==='file:'||$('#mp4Engine')?.value==='software';
  const render=(c,w,h,i,frames,fps)=>{const plan=mp4FramePlan(seconds,ranked.length,fps),outro=i>=plan.main,progress=Math.min(1,i/Math.max(1,plan.main-1));if(trackKind){drawMP4StandaloneMetric(c,w,h,entranceMode?1:progress,trackKind==='total'?0:1);return}if(entranceMode){const t=Math.max(0,Math.min(1,(i/fps-.35)/2.3));drawMP4DashboardFrame(c,w,h,1,mode,outro?1:1-(1-t)**3,includeModules)}else{pos=progress;drawMP4DashboardFrame(c,w,h,progress,mode,1,includeModules);if(i%6===0)update()}if(outro)drawAwardSequence(c,w,h,allRanked,ranked,(i-plan.main)/fps,awardOptions)};
  let blob;
  if(!forceSoftware&&window.VideoEncoder&&window.VideoFrame){
   try{
    const M=window.Mediabunny;if(!M)throw Error('原生编码组件未加载');
    const canvasOut=document.createElement('canvas');canvasOut.width=outputWidth;canvasOut.height=outputHeight;const c=canvasOut.getContext('2d',{alpha:false});
    output=new M.Output({format:new M.Mp4OutputFormat({fastStart:'in-memory'}),target:new M.BufferTarget()});
    const source=new M.CanvasSource(canvasOut,{codec:'avc',quality:new M.Quality({bitrate:({720:6000000,1080:12000000,1440:24000000,2160:45000000})[resolution]}),keyFrameInterval:2});
    output.addVideoTrack(source,{frameRate:nativeFPS});output.setMetadataTags({title:$('#datasetTitle').textContent});await mp4WithTimeout(output.start());
    const frames=mp4FramePlan(seconds,ranked.length,nativeFPS).total;
    for(let i=0;i<frames;i++){render(c,outputWidth,outputHeight,i,frames,nativeFPS);await mp4WithTimeout(source.add(i/nativeFPS,1/nativeFPS));if(i%5===0){button.textContent=`生成 MP4 ${Math.round(i/(frames-1)*100)}%`;await new Promise(r=>setTimeout(r,0))}}
    await mp4WithTimeout(output.finalize());blob=new Blob([output.target.buffer],{type:'video/mp4'});
   }catch(nativeError){if(output&&output.state!=='finalized'&&output.state!=='canceled')await mp4WithTimeout(output.cancel(),3000).catch(()=>{});output=null;button.textContent='切换兼容编码…';}
  }
  if(!blob){
   if(!window.HME)throw Error('兼容编码组件未加载，请完整解压并保留 h264-encoder.js');
   button.textContent='正在启动离线兼容编码…';
   const encoder=await HME.createH264MP4Encoder();
   try{
    const sw=outputWidth,sh=outputHeight,fps=24;
    encoder.width=sw;encoder.height=sh;encoder.frameRate=fps;encoder.speed=10;encoder.quantizationParameter=24;encoder.groupOfPictures=fps*2;encoder.outputFilename='offline-'+Date.now()+'.mp4';encoder.initialize();
    const canvasOut=document.createElement('canvas');canvasOut.width=sw;canvasOut.height=sh;const c=canvasOut.getContext('2d',{alpha:false,willReadFrequently:true}),frames=mp4FramePlan(seconds,ranked.length,fps).total;
    for(let i=0;i<frames;i++){render(c,sw,sh,i,frames,fps);encoder.addFrameRgba(c.getImageData(0,0,sw,sh).data);if(i%3===0){button.textContent=`兼容编码 ${Math.round(i/(frames-1)*100)}%`;await new Promise(r=>setTimeout(r,0))}}
    encoder.finalize();const bytes=encoder.FS.readFile(encoder.outputFilename);blob=new Blob([bytes],{type:'video/mp4'});encoder.FS.unlink(encoder.outputFilename);
   }finally{encoder.delete()}
  }
  if(!trackKind&&window.MusicStudio&&window.MusicStudio.getSelection()!=='none'){button.textContent='正在合成背景音乐…';blob=await window.MusicStudio.mix(blob,mp4FramePlan(seconds,ranked.length,output?nativeFPS:24).total/(output?nativeFPS:24));}
  if(blob.size<1000)throw Error('编码输出为空，请重试');
  const filename=trackKind?(trackKind==='total'?'当前总量':'领先品牌')+'.mp4':exportName(mode,'mp4');mp4Cached={key,blob,name:filename};return {name:filename,blob};
 }catch(e){if(output&&output.state!=='finalized'&&output.state!=='canceled')await mp4WithTimeout(output.cancel(),3000).catch(()=>{});toast(`MP4 生成失败（${width}×${height}）：${e.message}。高分辨率需要更多内存，可降低分辨率后重试。`);throw e}
 finally{recording=false;pos=oldPos;playing=oldPlaying;$('#play').textContent=playing?'Ⅱ':'▶';controls.forEach(([el,disabled])=>el.disabled=disabled);button.textContent=originalLabel;update()}
}
const engineBox=document.createElement('label');engineBox.className='engine-picker';engineBox.innerHTML='MP4 编码<select id="mp4Engine"><option value="auto">自动：优先快速，失败后兼容</option><option value="software">兼容编码：软件处理，速度较慢</option></select>';$('#python').after(engineBox);
const resolutionBox=document.createElement('label');resolutionBox.className='engine-picker';resolutionBox.innerHTML='MP4 分辨率<select id="mp4Resolution"><option value="720">720p · 1280×720</option><option value="1080" selected>1080p · 1920×1080（默认）</option><option value="1440">2K · 2560×1440</option><option value="2160">4K · 3840×2160</option></select>';engineBox.before(resolutionBox);
const outroHelp=document.createElement('small');outroHelp.textContent='MP4 与大屏共享庆祝设置：独立 TOP、展示顺序、奖杯与庆祝效果，最后停留领奖台。高分辨率更耗时。';engineBox.after(outroHelp);
$('#python').onclick=()=>generateMP4($('#python'),null,true);
$('#python').textContent='↓ 下载内嵌模块视频';
$('#python').title='下载已内嵌当前总量、领先品牌两个动态模块的 MP4';
document.querySelectorAll('.chart-downloads').forEach((box,i)=>{const button=document.createElement('button');button.className='export-mp4';button.textContent='↓ MP4 动画';button.onclick=()=>generateMP4(button,modes[i][0]);box.insertBefore(button,box.querySelector('small'));box.querySelector('.export-video')?.remove()});

document.querySelectorAll('.chart-downloads small').forEach(el=>el.textContent='PNG：1080p；MP4 沿用清晰度与收尾设置，最后停留领奖台。');

$('#export').before($('.mode-picker'),resolutionBox,engineBox);
resolutionBox.classList.add('resolution-picker');
$('#export').textContent='▷ 生成 MP4 视频';
$('#export').onclick=()=>generateMP4($('#export'));
const galleryResolution=document.createElement('label');galleryResolution.className='gallery-resolution';galleryResolution.innerHTML='MP4 清晰度<select id="galleryMP4Resolution" aria-label="图表展示页 MP4 分辨率">'+$('#mp4Resolution').innerHTML+'</select>';$('.gallery-actions').prepend(galleryResolution);
function syncMP4ResolutionUI(){$('#galleryMP4Resolution').value=$('#mp4Resolution').value}
$('#mp4Resolution').addEventListener('change',syncMP4ResolutionUI);$('#galleryMP4Resolution').onchange=()=>{$('#mp4Resolution').value=$('#galleryMP4Resolution').value;$('#mp4Resolution').dispatchEvent(new Event('change'))};syncMP4ResolutionUI();
const embeddedRow=document.createElement('div');embeddedRow.className='embedded-export-row';$('#python').before(embeddedRow);embeddedRow.append($('#python'));const embeddedHelp=document.createElement('span');embeddedHelp.className='embedded-video-help';embeddedHelp.innerHTML='<button type="button" class="embedded-help-button" aria-label="内嵌模块视频说明" aria-describedby="embeddedVideoTip" aria-expanded="false">?</button><span role="tooltip" id="embeddedVideoTip">直接下载一个 MP4，画面内已添加“当前总量”和“领先品牌”两个动态模块，数值随时间更新，并按横竖屏自动布局。配乐、清晰度和庆祝设置与当前导出设置共用；领奖台不叠加模块。“生成 MP4 视频”保留原有剪辑素材导出流程。</span>';embeddedRow.append(embeddedHelp);const helpButton=embeddedHelp.querySelector('button');helpButton.onclick=()=>{const opened=embeddedHelp.classList.toggle('is-open');helpButton.setAttribute('aria-expanded',String(opened))};helpButton.onkeydown=e=>{if(e.key==='Escape'){embeddedHelp.classList.remove('is-open');helpButton.setAttribute('aria-expanded','false')}};

let mp4BatchBusy=false;
async function generateMP4(button,entranceMode=null,includeModules=false){if(mp4BatchBusy||recording){toast('请等待当前视频生成完成');return}mp4BatchBusy=true;const label=button.textContent;try{const main=await encodeMP4(button,entranceMode,null,includeModules);if(!main)return;if(includeModules){saveBlob(main.name,main.blob);toast('MP4 已下载 · 已添加动态模块')}else{button.textContent='生成独立模块 1/2…';const total=await encodeMP4(button,entranceMode,'total');button.textContent='生成独立模块 2/2…';const leader=await encodeMP4(button,entranceMode,'leader');const files={};for(const item of [main,total,leader])files[item.name]=new Uint8Array(await item.blob.arrayBuffer());files['剪辑说明.txt']=new TextEncoder().encode('主视频未叠加模块。当前总量.mp4、领先品牌.mp4 与主视频从第 0 帧同步，帧率及总时长一致；模块采用正常背景紧贴卡片，可在剪辑软件中自行缩放和摆放。主视频收尾期间，独立模块保持最终数据。');const zipped=fflate.zipSync(files,{level:0});saveBlob(main.name.replace(/\.mp4$/i,'-剪辑素材.zip'),new Blob([zipped],{type:'application/zip'}));toast('剪辑素材已下载：主视频 + 当前总量 + 领先品牌')}}catch(e){toast('视频素材生成失败：'+e.message)}finally{mp4BatchBusy=false;button.textContent=label}}
