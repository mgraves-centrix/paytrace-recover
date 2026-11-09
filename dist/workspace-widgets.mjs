import {createApi} from './focus-api.mjs';
import {workspaceOverview,workspaceCsv} from './workspace-model.mjs';
import {esc,when} from './customer-shared.mjs';
import {todayMarkup} from './today-view.mjs';

export function pulseMarkup(data,{busy=false,backend=true,operator=false}={}){
 return todayMarkup(data,{busy,backend,operator});
}

function downloadCsv(data){const url=URL.createObjectURL(new Blob([workspaceCsv(data)],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='paytrace-queue.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}

export function mountPulse(root,{cases,backend,busy,uncertain,operator,onSelect}){
 const heading=root.querySelector('.desk-heading');if(!heading||!root.querySelector('.overview'))return;
 const box=document.createElement('section');box.className='recovery-pulse surface';box.setAttribute('aria-label','Recovery pulse');heading.after(box);
 const api=createApi();let loading=false;
 async function load(){
  if(loading||busy||uncertain){box.innerHTML='<p role="status">Refresh the workspace before checking the recovery pulse.</p>';return;}
  loading=true;box.innerHTML='<p role="status">Checking the attention list…</p>';
  try{const data=backend?await api('workspace?source=sandbox'):workspaceOverview(cases);if(!box.isConnected)return;
   box.innerHTML=pulseMarkup(data,{backend,operator});
   box.querySelector('[data-pulse-refresh]')?.addEventListener('click',load);
   if(operator)box.querySelector('[data-pulse-export]').onclick=()=>{if(backend){const a=document.createElement('a');a.href='/api/workspace/export?source=sandbox';a.download='paytrace-queue.csv';a.click();}else downloadCsv(data);};
   box.querySelectorAll('[data-pulse-case]').forEach(b=>b.onclick=()=>onSelect(b.dataset.pulseCase));
  }catch(e){if(!box.isConnected)return;box.innerHTML=`<h2>Recovery pulse unavailable</h2><p role="status">${esc(e.message)}</p><button class="button" data-pulse-retry>Retry pulse</button>`;box.querySelector('button').onclick=load;}
  finally{loading=false;}
 }
 load();
}

export function mountPriority(root,s,{backend,busy,uncertain}){
 if(!backend||busy)return;
 const rail=root.querySelector('.case-decision-column');if(!rail)return;
 const box=document.createElement('section');box.className='case-priority-panel';rail.append(box);
 box.innerHTML='<span class="eyebrow">QUEUE PLANNING</span><h3>Set this case’s priority.</h3><p>Priority changes queue order. It never approves or changes access.</p><form><label for="case-priority">Case priority</label><select id="case-priority" disabled><option value="low">Low</option><option value="normal" selected>Normal</option><option value="high">High</option></select><div><button class="button" type="submit" disabled>Save priority</button><button class="button" type="button" data-priority-reload>Reload priority</button></div></form><p role="status">Loading priority…</p>';
 const api=createApi(),select=box.querySelector('select'),save=box.querySelector('[type=submit]'),reload=box.querySelector('[data-priority-reload]'),status=box.querySelector('[role=status]');let revision=null,pending=false;
 function controls(locked){select.disabled=locked||uncertain;save.disabled=locked||uncertain;reload.disabled=pending;}
 async function load(){if(pending)return;pending=true;controls(true);try{const data=await api('case/priority?caseId='+encodeURIComponent(s.id));if(!box.isConnected)return;revision=data.revision;select.value=data.priority;status.textContent=uncertain?'Refresh the case before editing its priority.':'Current priority: '+data.priority+'.';}catch(error){revision=null;status.textContent=error.message;}finally{pending=false;controls(revision===null);}}
 reload.onclick=load;
 box.querySelector('form').onsubmit=async event=>{event.preventDefault();if(pending||revision===null||uncertain)return;pending=true;controls(true);status.textContent='Saving priority…';try{const data=await api('case/priority',{caseId:s.id,priority:select.value,expectedRevision:revision});if(!box.isConnected)return;revision=data.revision;status.textContent='Priority saved. Refresh the recovery pulse to see the new order.';}catch(error){revision=null;status.textContent=error.message+' Reload priority before trying again.';}finally{pending=false;controls(revision===null);}};
 load();
}

