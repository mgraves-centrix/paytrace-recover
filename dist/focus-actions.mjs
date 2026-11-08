import {esc,when,request} from './customer-shared.mjs';
import {proofIsCurrent} from './operations.mjs';

export function waitingOn(s){
 if(s.job?.pending)return 'workflow';
 if(s.phase==='rehearsed')return 'approval';
 if(s.writes&&!proofIsCurrent(s))return 'verification';
 if(!s.capture||s.capture.status!=='COMPLETED')return 'payment';
 if(['blocked','needs-evidence','stale'].includes(s.phase))return 'evidence';
 if(proofIsCurrent(s))return 'customer';
 return 'merchant';
}

export function mountWaiting(root,cases,onSelect){
 const overview=root.querySelector('.overview');if(!overview)return;
 const panel=document.createElement('details');panel.className='waiting-panel surface';overview.after(panel);
 let filter='all';const types=[['all','All open'],['approval','Your approval'],['verification','Verification'],['evidence','Evidence'],['payment','Payment'],['customer','Customer'],['workflow','Workflow']];
 function draw(){const rows=cases.filter(s=>!proofIsCurrent(s)||filter==='customer').filter(s=>filter==='all'||waitingOn(s)===filter);panel.innerHTML=`<summary class="section-head"><span>Filter cases by next action</span><span class="subtle">Approval · verification · evidence · payment</span></summary><div class="waiting-filters">${types.map(([id,label])=>`<button data-waiting="${id}" aria-pressed="${id===filter}">${label}</button>`).join('')}</div><div class="waiting-list">${rows.slice(0,6).map(s=>`<button data-waiting-case="${esc(s.id)}"><strong>${esc(s.customerName)}</strong><span>${esc(waitingOn(s))}</span><small>${esc(s.id)} →</small></button>`).join('')||'<p>No cases in this view.</p>'}</div>`;panel.querySelectorAll('[data-waiting]').forEach(b=>b.onclick=()=>{filter=b.dataset.waiting;draw();});panel.querySelectorAll('[data-waiting-case]').forEach(b=>b.onclick=()=>onSelect(b.dataset.waitingCase));}draw();
}

export function mountFreshness(root,s){const head=root.querySelector('.sheet-head');if(!head)return;const sources=Object.entries(s.sources||{});const band=document.createElement('div');band.className='freshness-band';band.innerHTML=`<strong>Evidence freshness</strong>${sources.length?sources.map(([name,source])=>`<span class="${source.status==='available'?'fresh':'stale'}">${esc(name)} · ${source.status==='available'?'checked':'unavailable'}${source.checkedAt?' '+esc(when(source.checkedAt)):''}</span>`).join(''):'<span class="stale">No live source check recorded</span>'}<small>A completed check shows when records were read; it does not guarantee they are unchanged.</small>`;head.append(band);}

export function mountApprovalDetails(root,s){if(!s.rehearsal)return;const rail=root.querySelector('.case-decision-column');if(!rail)return;const card=document.createElement('section');card.className='exact-approval';card.innerHTML=`<span class="eyebrow">CHANGE UNDER REVIEW</span><h3>Check the exact grant.</h3><dl><dt>Customer</dt><dd>${esc(s.customerName)}</dd><dt>Purchase</dt><dd>${esc(s.order.id)}</dd><dt>Course</dt><dd>The Light &amp; Story Workshop</dd><dt>Before</dt><dd>${s.rehearsal.before.active?'Access already active':'Access locked'}</dd><dt>Proposed after</dt><dd>${s.rehearsal.after.active?'Access active':'Access locked'}</dd><dt>Payment</dt><dd>Existing capture · no new charge</dd></dl><p>${s.approval?'Merchant approval recorded.':'Approval applies only to this evidence version.'}</p>`;rail.prepend(card);}

export function mountScenarios(root){const desk=root.querySelector('.desk-heading');if(!desk)return;const box=document.createElement('details');box.className='scenario-launcher';box.innerHTML=`<summary>Explore simulated outcomes <span>Three browser-only examples</span></summary><p>These stories do not change customer records.</p><div><a href="story.html?scenario=match">Recovered access</a><a href="story.html?scenario=conflict">Payment mismatch</a><a href="story.html?scenario=read-error">Verification fails</a></div>`;desk.after(box);}

export function mountConnectionTests(root){const cards=root.querySelectorAll('.connection-card[data-connection-kind]');cards.forEach(card=>{const kind=card.dataset.connectionKind;const btn=document.createElement('button');btn.className='button connection-test';btn.type='button';btn.textContent='Test '+(kind==='ai'?'AI':kind==='paypal'?'PayPal sandbox':kind==='access'?'course access':'Render')+' connection';const result=document.createElement('p');result.className='connection-test-result';result.setAttribute('role','status');card.querySelector('.connection-card-actions').append(btn,result);btn.onclick=async()=>{btn.disabled=true;result.textContent=kind==='access'?'Reading a new test entitlement…':'Checking provider credentials…';try{const d=await request('/api/connection-check?kind='+kind);result.dataset.state=d.state;result.textContent=(d.state==='connected'?'Connection check passed. ':d.state==='not-configured'?'Setup needed. ':d.state==='unavailable'?'Provider unavailable. ':'Connection check failed. ')+d.detail+' · Checked '+when(d.checkedAt);}catch(e){result.dataset.state='unavailable';result.textContent=e.message;}finally{btn.disabled=false;}};});
 const grid=root.querySelector('.connection-grid');if(!grid)return;const email=document.createElement('section');email.className='surface connection-card';email.dataset.connectionKind='email';email.innerHTML='<div class="connection-card-top"><span class="connection-card-symbol" aria-hidden="true">@</span><span class="eyebrow">05 / SERVICE</span><span class="connection-state configured">Check available</span></div><h3>Email notifications</h3><p>Check configured email credentials without sending a message.</p><div class="connection-card-actions"><button class="button connection-test" type="button">Test email connection</button><p class="connection-test-result" role="status"></p></div>';grid.append(email);email.querySelector('button').onclick=async e=>{const button=e.currentTarget,result=email.querySelector('[role=status]');button.disabled=true;result.textContent='Checking provider credentials…';try{const d=await request('/api/connection-check?kind=email');result.dataset.state=d.state;result.textContent=(d.state==='connected'?'Connection check passed. ':d.state==='not-configured'?'Setup needed. ':d.state==='unavailable'?'Provider unavailable. ':'Connection check failed. ')+d.detail+' · Checked '+when(d.checkedAt);}catch(error){result.dataset.state='unavailable';result.textContent=error.message;}finally{button.disabled=false;}};
}

export function mountReminderPanel(root,s,onSaved){const panel=root.querySelector('.support-panel');if(!panel)return;const form=document.createElement('form');form.className='reminder-form';form.innerHTML=`<span class="eyebrow">FOLLOW-UP REMINDER</span><h3>Keep this case on your radar.</h3><p>Choose when you want to review it again. This is an internal reminder; no customer message is sent.</p><label>Follow up at<input type="datetime-local" required></label><label>Private note<input type="text" maxlength="180" placeholder="What should you check? (optional)"></label><div><button class="button primary" type="submit">Save reminder</button><button class="button" type="button" data-reminder-clear>Clear reminder</button></div><p role="status"></p>`;panel.append(form);const due=form.querySelector('[type=datetime-local]'),note=form.querySelector('[type=text]'),status=form.querySelector('[role=status]');const existing=s.reminder;if(existing){due.value=new Date(Date.parse(existing.dueAt)-new Date().getTimezoneOffset()*60000).toISOString().slice(0,16);note.value=existing.note;status.textContent='Scheduled for '+when(existing.dueAt);}
 async function save(dueAt){status.textContent='Saving…';try{const response=await request('/api/support/reminder',{caseId:s.caseId,dueAt,note:note.value});status.textContent=response.reminder?'Reminder saved for '+when(response.reminder.dueAt):'Reminder cleared.';onSaved?.();}catch(e){status.textContent=e.message;}}
 form.onsubmit=e=>{e.preventDefault();const date=new Date(due.value);if(!Number.isFinite(date.valueOf())){status.textContent='Choose a valid time.';return;}save(date.toISOString());};form.querySelector('[data-reminder-clear]').onclick=()=>save(null);
}

export function mountReminders(root,onSelect){
 const overview=root.querySelector('.overview');if(!overview)return;
 const panel=document.createElement('section');panel.className='reminders-board surface is-empty';overview.after(panel);
 const compact=message=>{panel.classList.add('is-empty');panel.innerHTML=`<div><h2>Follow-up reminders</h2><p role="status">${esc(message)}</p></div>`;};
 compact('Checking reminders…');
 request('/api/support/reminders').then(d=>{
  if(!panel.isConnected)return;
  const overdue=d.items.filter(x=>x.overdue),upcoming=d.items.filter(x=>!x.overdue);
  if(!d.items.length){compact('None scheduled. Add a reminder inside a case.');return;}
  panel.classList.remove('is-empty');
  panel.innerHTML=`<div class="reminder-heading"><div><h2>Follow-up reminders</h2><p>${overdue.length} due now · ${upcoming.length} upcoming</p></div></div><div class="reminder-list">${[...overdue,...upcoming].slice(0,8).map(item=>`<button type="button" data-reminder-case="${esc(item.caseId)}"><strong>${esc(item.customerName)}</strong><span>${item.overdue?'Due now':'Due '+esc(when(item.dueAt))}</span><small>${esc(item.note||'Open case')}</small></button>`).join('')}</div>`;
  panel.querySelectorAll('[data-reminder-case]').forEach(b=>b.onclick=()=>onSelect(b.dataset.reminderCase));
 }).catch(()=>{if(panel.isConnected)compact('Reminders unavailable. Refresh the workspace to retry.');});
}
