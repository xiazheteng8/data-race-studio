/* Load after the application scripts. No dependencies; CommonJS exports support Node tests. */
(function () {
  'use strict';
  const themes = [
    {id:'deep-space', name:'深空青柠', subtitle:'熟悉的夜色，鲜明的数据焦点', mood:'经典 · 深色', tokens:{bg:'#090d13',panel:'#10161f',sidebar:'#0d121a',surface:'#19222d',text:'#edf2f7',muted:'#a1afbf',line:'#344151',accent:'#b7f568',onAccent:'#18230f',soft:'#1c2b20',radius:'10px'},canvas:['#071b2b','#0b1422','#080d17']},
    {id:'ocean', name:'远海蓝潮', subtitle:'冷静的蓝灰，留给趋势更多空间', mood:'清透 · 深色', tokens:{bg:'#07131b',panel:'#0d202c',sidebar:'#091a25',surface:'#17303f',text:'#edfaff',muted:'#a0bbc9',line:'#345366',accent:'#7cdded',onAccent:'#082830',soft:'#15333e',radius:'12px'},canvas:['#082c3b','#0b202e','#071620']},
    {id:'forest', name:'松间听雨', subtitle:'低饱和松绿，适合长时间专注', mood:'自然 · 深色', tokens:{bg:'#0b1411',panel:'#12211a',sidebar:'#0d1a14',surface:'#20342a',text:'#eff8ef',muted:'#a6bcac',line:'#395245',accent:'#acd2a2',onAccent:'#172b18',soft:'#243d2c',radius:'6px'},canvas:['#132d22','#102219','#0a1712']},
    {id:'amber', name:'琥珀夜航', subtitle:'暖金与炭黑，让关键变化更醒目', mood:'温暖 · 深色', tokens:{bg:'#17120e',panel:'#241d17',sidebar:'#1b1510',surface:'#352b20',text:'#fcf3e5',muted:'#c7b49a',line:'#594735',accent:'#efc17b',onAccent:'#34220c',soft:'#3b2c1b',radius:'8px'},canvas:['#322313','#241c16','#17130f']},
    {id:'ink', name:'纸墨青山', subtitle:'暖纸底色，像翻阅一份数据手记', mood:'人文 · 浅色', tokens:{bg:'#f2efe7',panel:'#fcfaf4',sidebar:'#e7e4d9',surface:'#e9e6dc',text:'#26382f',muted:'#5c695f',line:'#c4c9ba',accent:'#35634b',onAccent:'#ffffff',soft:'#e0e9dc',radius:'4px'},canvas:['#20362b','#192b23','#13201a']},
    {id:'frost', name:'霜白晴空', subtitle:'明亮的工作台，利落的蓝色刻度', mood:'明亮 · 浅色', tokens:{bg:'#edf3f8',panel:'#ffffff',sidebar:'#e4edf5',surface:'#eaf1f7',text:'#20364b',muted:'#536b7f',line:'#bdcedc',accent:'#256697',onAccent:'#ffffff',soft:'#dcecf8',radius:'14px'},canvas:['#173751','#132b40','#0c1d2d']}
  ];
  themes.push({id:'festival',name:'春节贺岁',subtitle:'灯火迎春，数据见证新岁',mood:'春节 · 暖色',tokens:{bg:'#fff4e7',panel:'#fffaf2',sidebar:'#a20d1a',surface:'#fce8ce',text:'#68151b',muted:'#95665a',line:'#eac5a1',accent:'#c8212d',onAccent:'#fff8e6',soft:'#ffe1bd',radius:'18px'},canvas:['#75111d','#3b1429','#a62323']},{id:'caishen',name:'财神送福',subtitle:'红包纳福，金元宝添彩',mood:'财神 · 红金',tokens:{bg:'#2c0910',panel:'#48121b',sidebar:'#340a12',surface:'#641c25',text:'#fff1d0',muted:'#d8b18b',line:'#9b633b',accent:'#ffd17c',onAccent:'#58121a',soft:'#762332',radius:'18px'},canvas:['#640d18','#321124','#9f2024']});
  themes.forEach(t=>{Object.freeze(t.tokens);Object.freeze(t.canvas);Object.freeze(t)});
  Object.freeze(themes);
  const STORAGE_KEY = 'pulse-dashboard-theme';
  function getTheme(id) { return themes.find(t=>t.id===id)||themes[0]; }
  const api = {themes, getTheme, STORAGE_KEY};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (typeof window !== 'undefined') window.PulseThemes = api;
  if (typeof document === 'undefined') return;
  let current = themes[0];
  let dialog, trigger;
  function installCanvasTheme() {
    if (typeof drawChartBackground !== 'function' || drawChartBackground.pulseThemed) return;
    const original = drawChartBackground;
    function themedBackground(c,w,h) {
      if (!c || !(w>0 && h>0)) return original.apply(this,arguments);
      c.save();
      try {
        const gradient=c.createLinearGradient(0,0,w,h);
        current.canvas.forEach((color,i)=>gradient.addColorStop(i/(current.canvas.length-1),color));
        c.fillStyle=gradient;
        c.fillRect(0,0,w,h);
      } finally { c.restore(); }
    }
    themedBackground.pulseThemed=true;
    drawChartBackground=themedBackground;
  }
  function applyTheme(id, persist=true) {
    // Do not change the look of an in-progress export halfway through its frames.
    if (typeof recording !== 'undefined' && recording) {
      if (typeof toast === 'function') toast('请等待视频导出完成后切换主题');
      return current;
    }
    current=getTheme(id);
    const root=document.documentElement;
    root.setAttribute('data-theme',current.id);
    Object.entries(current.tokens).forEach(([key,value])=>root.style.setProperty('--theme-'+key,value));
    for (const [key,value] of Object.entries({bg:current.tokens.bg,panel:current.tokens.panel,line:current.tokens.line,muted:current.tokens.muted,green:current.tokens.accent})) root.style.setProperty('--'+key,value);
    root.style.setProperty('color-scheme',current.mood.includes('浅色')?'light':'dark');
    if (persist) { try { localStorage.setItem(STORAGE_KEY,current.id); } catch {} }
    installCanvasTheme();
    if (typeof mp4Cached !== 'undefined') mp4Cached=null;
    if (typeof screenDirty !== 'undefined') screenDirty=true;
    if (typeof update === 'function') update();
    if (typeof renderTemplates === 'function') renderTemplates();
    if (trigger) trigger.textContent='主题 · '+current.name;
    if (dialog) {
      dialog.querySelectorAll('[data-theme-choice]').forEach(card=>{
        const selected=card.dataset.themeChoice===current.id;
        card.setAttribute('aria-pressed',String(selected));
        card.querySelector('.theme-choice-state').textContent=selected?'当前使用':'使用主题';
      });
      dialog.querySelector('[role="status"]').textContent='当前主题：'+current.name+'。选择后立即应用，自动记住。';
    }
    return current;
  }
  api.applyTheme=applyTheme;
  function mountPicker() {
    const header=document.querySelector('main header .header-right');
    if (!header || document.querySelector('#themeOpen') || document.body.classList.contains('screen-document')) return;
    trigger=document.createElement('button');
    trigger.id='themeOpen';trigger.type='button';trigger.className='header-tool theme-open';
    trigger.setAttribute('aria-haspopup','dialog');trigger.setAttribute('aria-controls','themeDialog');
    trigger.textContent='主题 · '+current.name;
    header.prepend(trigger);
    dialog=document.createElement('dialog');dialog.id='themeDialog';
    dialog.setAttribute('aria-labelledby','themeDialogTitle');
    dialog.innerHTML='<div class="theme-dialog-head"><div><span class="eyebrow">外观设置</span><h2 id="themeDialogTitle">给数据，换一种气质。</h2></div><button type="button" class="theme-close" aria-label="关闭主题设置">×</button></div><p class="theme-intro">八种精心配色，覆盖看板、图表与导出画面。数据系列颜色保持不变。</p><div class="theme-grid"></div><p class="theme-status" role="status" aria-live="polite"></p>';
    const grid=dialog.querySelector('.theme-grid');
    themes.forEach((theme,index)=>{
      const card=document.createElement('button');card.type='button';card.className='theme-card';card.dataset.themeChoice=theme.id;
      card.setAttribute('aria-pressed',String(current.id===theme.id));
      for(const [key,value] of Object.entries(theme.tokens))card.style.setProperty('--preview-'+key,value);
      card.style.setProperty('--preview-canvas',theme.canvas[0]);
      card.innerHTML='<span class="theme-preview" aria-hidden="true"><span class="theme-preview-sidebar"></span><span class="theme-preview-main"><span class="theme-preview-metrics"><i></i><i></i><i></i></span><span class="theme-preview-chart"><i></i><i></i><i></i><i></i></span></span></span><span class="theme-card-meta"><small>'+String(index+1).padStart(2,'0')+' / '+theme.mood+'</small><strong>'+theme.name+'</strong><span>'+theme.subtitle+'</span></span><span class="theme-choice-state">'+(current.id===theme.id?'当前使用':'使用主题')+'</span>';
      card.addEventListener('click',()=>applyTheme(theme.id));grid.append(card);
    });
    document.body.append(dialog);
    const close=()=>{dialog.close();trigger.focus()};
    dialog.querySelector('.theme-close').addEventListener('click',close);
    dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)close()}});
    dialog.addEventListener('close',()=>trigger.focus());
    trigger.addEventListener('click',()=>{dialog.showModal();dialog.querySelector('[aria-pressed="true"]').focus()});
    dialog.querySelector('[role="status"]').textContent='当前主题：'+current.name+'。选择后立即应用，自动记住。';
  }
  let stored;
  try { stored=localStorage.getItem(STORAGE_KEY); } catch {}
  applyTheme(stored,false);
  window.addEventListener('storage',event=>{if(event.key===STORAGE_KEY || event.key===null)applyTheme(event.newValue,false)});
  if (document.readyState==='loading') document.addEventListener('DOMContentLoaded',mountPicker,{once:true});
  else mountPicker();
})();
