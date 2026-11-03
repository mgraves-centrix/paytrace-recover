import {failureReplay,replayOptions} from './failure-replay-model.mjs';

const tabs=document.querySelector('#replay-tabs'),output=document.querySelector('#replay-output');
function render(id){
 const view=failureReplay(id);
 tabs.replaceChildren(...replayOptions.map(option=>{const button=document.createElement('button');button.type='button';button.className='replay-tab';button.setAttribute('aria-pressed',String(option.id===id));button.innerHTML=`<strong>${option.name}</strong><small>${option.caption}</small>`;button.onclick=()=>render(option.id);return button;}));
 output.className='replay-output '+view.tone;
 output.innerHTML='<div class="replay-result"><div><span class="eyebrow">FICTIONAL REPLAY · NO PROVIDER REQUESTS</span><h2></h2><p></p></div><span class="replay-status"></span></div><div class="replay-facts"></div><div class="replay-decision"><span class="eyebrow">SAFE NEXT STEP</span><strong></strong><p></p></div>';
 output.querySelector('h2').textContent=view.title;
 output.querySelector('.replay-result p').textContent=view.summary;
 output.querySelector('.replay-status').textContent=view.tone==='ready'?'Preview possible':'Repair held';
 const facts=output.querySelector('.replay-facts');for(const [label,value] of view.facts){const item=document.createElement('div');const heading=document.createElement('strong');const detail=document.createElement('span');heading.textContent=label;detail.textContent=value;item.append(heading,detail);facts.append(item);}
 output.querySelector('.replay-decision strong').textContent=view.decision;
 output.querySelector('.replay-decision p').textContent=view.stop;
}
render('match');
