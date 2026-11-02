import {checks,crew,reviewIsCurrent} from './core.mjs';
import {proofIsCurrent} from './operations.mjs';
import {detectIncident} from './intelligence-lab.mjs';
import {mountMerchantPromise,refreshMerchantPromise} from './access-assurance-ui.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const time=value=>value&&Number.isFinite(Date.parse(value))?new Date(value).toLocaleString():'Not recorded';

export function disagreementModel(s){
 const review=s.review,current=!!review&&reviewIsCurrent(s),issues=review?.objections||[];
 const failed=checks(s).filter(item=>!item.ok).map(item=>item.label);
 return {mode:review?.mode||null,current,outcome:current?review.outcome:'unavailable',
  open:current?issues.filter(item=>item.status==='open'):[],
  answered:current?issues.filter(item=>item.status==='resolved'):[],
  failed:current?failed:[],
  exchanges:current?(review.exchange||[]).filter(item=>['Challenge','Evidence response','State response','Decision'].includes(item.kind)):[],
  snapshot:current?review.snapshot||{}:{},
  next:!review?'Run a current investigation to hear the four specialists.':!current?'The evidence changed. Run a new investigation before using earlier conclusions.':failed.length||issues.some(item=>item.status==='open')?'Resolve the mismatched records or open challenges. No access change is supported.':review.outcome==='verify-only'?'Verify existing access without another grant.':review.outcome==='ready'?'Preview the exact change; merchant approval is still required.':'Hold the correction and inspect the supporting records.'};
}

export function flightRecorderModel(s,support=null){
 const sample=s.capture?.source!=='paypal-sandbox',proof=proofIsCurrent(s);
 const steps=[
  {name:'Payment',state:s.capture?.status==='COMPLETED'?'complete':s.capture?'hold':'waiting',at:s.paidAt,detail:s.capture?.status==='COMPLETED'?(sample?'Sample payment record':'PayPal sandbox capture recorded'):'Completed capture not yet established'},
  {name:'Specialists',state:reviewIsCurrent(s)?s.review.mode==='model'?'complete':'sample':s.job?.pending&&s.job.kind==='investigate'?'running':'waiting',at:s.review?.at,detail:reviewIsCurrent(s)?s.review.mode==='model'?'Current AI review recorded':'Scripted review recorded':'Current review not recorded'},
  {name:'Preview',state:s.rehearsal?.passed?'complete':'waiting',at:s.rehearsal?.createdAt,detail:s.rehearsal?.passed?'Proposed change rehearsed; no write yet':'Exact change not previewed'},
  {name:'Approval',state:s.approval?'complete':'waiting',at:s.approval?.at,detail:s.approval?s.approval.mode==='policy'?'Merchant policy authorized exact preview':'Merchant approved exact preview':'No approval recorded'},
  {name:'Correction',state:s.writes===1||proof&&s.writes===0?'complete':s.job?.pending&&s.job.kind==='recover'?'running':'waiting',at:null,detail:s.writes===1?'One access write recorded':proof?sample?'Sample access found with zero writes':'Access restored with zero PayTrace writes':'No access write recorded'},
  {name:'Lesson proof',state:proof?'complete':s.proof?.passed?'stale':'waiting',at:s.proof?.at,detail:proof?sample?'Sample browser checks passed; no external lesson was fetched':'Current payment, entitlement, and protected lesson checks passed':s.proof?.passed?'Earlier proof is stale':'Current protected-lesson proof missing'},
  {name:'Customer',state:support?.confirmedAt&&proof&&!support.help?'complete':support?.help?'hold':'waiting',at:support?.confirmedAt,detail:support?.help?'Customer still needs help':support?.confirmedAt&&proof?'Customer separately confirmed access':'Customer confirmation not recorded'}
 ];
 return {sample,steps,renderRun:s.job?.runId?{id:s.job.runId,kind:s.job.kind,pending:!!s.job.pending}:null,events:(s.events||[]).slice(-12).map(item=>({at:item.at,what:item.what})),verified:proof};
}

export function incidentScope(cases,now=Date.now()){
 const incident=detectIncident(cases,now);
 if(!incident.active)return {...incident,rows:[]};
 const byId=new Map(cases.map(s=>[s.id,s]));
 return {...incident,rows:incident.caseIds.map(id=>{const s=byId.get(id);return {caseId:id,paidAt:s?.paidAt||null,source:s?.capture?.source||'unknown',payment:s?.capture?.status||'unknown',access:s?.entitlement?.active?'active':'missing',review:s?.review?.outcome||'not reviewed',writes:s?.writes||0};})};
}

function challengeMarkup(model){
 if(!model.current)return `<p class="ci-empty">${esc(model.next)}</p>`;
 const objections=[...model.open,...model.answered];
 const cards=objections.map(item=>`<details class="ci-challenge ${item.status==='open'?'open':'answered'}" ${item.status==='open'?'open':''}><summary><span>${item.status==='open'?'Needs evidence':'Answered'}</span><strong>${esc(item.question)}</strong></summary><p>${esc(item.resolution||'No resolution recorded.')}</p><small>Sources: ${esc((item.resolutionSources||item.sources||[]).join(', ')||'None recorded')}</small><div class="ci-sources">${(item.resolutionSources||item.sources||[]).map(key=>`<details><summary>Inspect ${esc(key)} record</summary><pre>${esc(JSON.stringify(model.snapshot[key]??null,null,2))}</pre></details>`).join('')}</div></details>`).join('');
 const exchanges=model.exchanges.map(item=>`<li><b>${esc(crew[item.agent]?.name||'Specialist')} · ${esc(item.kind)}</b><span>${esc(item.summary)}</span><small>${esc((item.sources||[]).join(', '))}</small></li>`).join('');
 return `<div class="ci-disagreement-summary"><strong>${model.open.length} open challenge${model.open.length===1?'':'s'} · ${model.answered.length} answered</strong><p>${esc(model.next)}</p>${model.failed.length?`<small>Exact checks needing attention: ${esc(model.failed.join(', '))}</small>`:''}</div><div class="ci-challenges">${cards||'<p>No recorded challenge questions.</p>'}</div><details class="ci-exchange"><summary>Read the specialist exchange</summary><ol>${exchanges||'<li>No exchange recorded.</li>'}</ol></details>`;
}

function flightMarkup(model,open=false){
 const steps=model.steps.map((step,index)=>`<li class="${esc(step.state)}"><span class="ci-step-number">${index+1}</span><div><strong>${esc(step.name)}</strong><small>${esc(step.detail)}</small>${step.at?`<time>${esc(time(step.at))}</time>`:''}</div></li>`).join('');
 const completed=model.steps.filter(step=>step.state==='complete'||step.state==='sample').length;
 return `<details class="ci-flight" aria-label="Recovery flight recorder" ${open?'open':''}><summary><span><span class="eyebrow">RECOVERY FLIGHT RECORDER</span><strong>Payment to proof</strong><small>${completed} of 7 stages recorded · ${model.sample?'sample case':'PayPal sandbox case'}</small></span><span aria-hidden="true">+</span></summary><div class="ci-flight-body"><p>A recorded access write is not a verified outcome. ${model.sample?'Sample stages are illustrative.':'Stages reflect saved case records.'}</p><ol class="ci-flight-steps">${steps}</ol>${model.renderRun?`<p class="ci-render">Render ${esc(model.renderRun.kind)} run ${model.renderRun.pending?'in progress':'recorded'} · ID ${esc(model.renderRun.id)}. Task acceptance alone does not prove completion.</p>`:'<p class="ci-render">No Render task run is recorded for this case.</p>'}<details class="ci-event-log"><summary>Inspect saved case activity · ${model.events.length} entries</summary><ol>${model.events.map(event=>`<li><time>${esc(time(event.at))}</time><span>${esc(event.what)}</span></li>`).join('')||'<li>No case events recorded.</li>'}</ol></details></div></details>`;
}

function incidentMarkup(scope,selected=null){
 const rows=scope.rows.map(row=>`<li ${row.caseId===selected?'class="selected"':''}><button type="button" data-case="${esc(row.caseId)}"><strong>${esc(row.caseId)}</strong><span>Paid ${esc(time(row.paidAt))}</span><small>${esc(row.review)} · ${row.writes} access write${row.writes===1?'':'s'}</small></button></li>`).join('');
 return `<div class="ci-incident-head"><span class="eyebrow">POSSIBLE SHARED INCIDENT</span><h2>${scope.count} recorded payments, one course, missing access.</h2><p>These saved completed PayPal sandbox captures fall within a 30-minute window. This pattern is a signal, not a root-cause diagnosis. Automatic grants are paused; each purchase still needs fresh exact checks and its own authorization.</p><small>Window: ${esc(time(scope.from))} – ${esc(time(scope.to))}</small></div><ul class="ci-incident-cases">${rows}</ul>`;
}

export function mountCaseIntelligence(root,s,{cases=[],backend=false}={}){
 const scope=incidentScope(cases);
 if(!s){if(!scope.active)return;const old=root.querySelector('.merchant-incident');const panel=document.createElement('section');panel.className='ci-incident';panel.setAttribute('aria-label','Shared incident scope');panel.innerHTML=incidentMarkup(scope);if(old)old.replaceWith(panel);else root.querySelector('.desk-heading')?.after(panel);return;}
 const main=root.querySelector('.case-evidence-column'),heading=main?.querySelector('.case-column-title');if(!main||!heading)return;
 mountMerchantPromise(root,s);
 const flight=document.createElement('div');flight.className='ci-flight-mount';flight.innerHTML=flightMarkup(flightRecorderModel(s));heading.after(flight);
 const disagreement=disagreementModel(s),panel=document.createElement('details');panel.className='ci-disagreement'+(disagreement.open.length?' has-open':'');panel.setAttribute('aria-label','Specialist challenges and disagreements');if(disagreement.open.length)panel.open=true;panel.innerHTML=`<summary><span><span class="eyebrow">AGENT CHALLENGE ROOM</span><strong>${disagreement.open.length?'Resolve the open challenge before acting':'Inspect specialist challenges'}</strong><small>${disagreement.mode==='model'?'AI-assisted review':disagreement.mode==='scripted'?'Scripted demo review':'Awaiting review'} · ${disagreement.open.length} open</small></span><span aria-hidden="true">+</span></summary><div class="ci-disagreement-body"><p>A cited source identifies a saved record; it does not prove every conclusion.</p>${challengeMarkup(disagreement)}</div>`;flight.after(panel);
 if(scope.active&&scope.caseIds.includes(s.id)){const incident=document.createElement('details');incident.className='ci-incident ci-incident-case';incident.innerHTML=`<summary>Possible shared incident · ${scope.count} purchases</summary>${incidentMarkup(scope,s.id)}`;panel.after(incident);}
}

export function refreshFlightRecorder(root,s,support){const mount=root.querySelector('.ci-flight-mount');if(mount)mount.innerHTML=flightMarkup(flightRecorderModel(s,support),!!mount.querySelector('.ci-flight')?.open);refreshMerchantPromise(root,support);}
