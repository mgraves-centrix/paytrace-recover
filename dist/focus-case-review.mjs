import {checks,crew,findings,reviewIsCurrent} from './core.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={payment:'Payment capture',order:'Saved order',event:'Event trail',store:'Course access'};
const stageName=step=>step==='evidence'?'Gathering current records':step==='challenge'?'Challenging the proposal':step==='decision'?'Checking objections':step?.startsWith('response-')?'Answering an objection':'Reviewing evidence';
const runStep=(run,index)=>run.completed?.includes(index===3?'decision':`finding-${index}`)?'Recorded':run.agent===index&&run.status==='running'?'Working':run.status==='failed'?'Stopped':'Waiting';
const headline=(title,description,status,tone='')=>`<div class="case-agent-heading"><div><span class="eyebrow">INVESTIGATION</span><h2 id="case-agent-title">${esc(title)}</h2><p>${esc(description)}</p></div><span class="case-agent-state ${tone}">${esc(status)}</span></div>`;

export function caseAgentSummary(s){
 const run=s.agentRun;
 if(run?.status==='running'||(!run&&s.job?.pending)){
  const queued=!run;
  return `<section class="case-agent-summary is-running" aria-labelledby="case-agent-title" aria-live="polite">${headline(queued?'Workflow queued':run.agent==null?stageName(run.step):`${crew[run.agent]?.name||'Specialist'} is reviewing the case`,queued?'The investigation has been dispatched. Refresh to retrieve its next recorded stage.':`${stageName(run.step)}. No access change is being made.`,queued?'Queued':run.mode==='model'?'AI model running':'Sample review running','running')}<ol class="case-agent-progress">${crew.map((member,i)=>`<li class="${run&&!queued?runStep(run,i).toLowerCase():'waiting'}"><span class="case-agent-icon" aria-hidden="true">${esc(member.name[0])}</span><span><strong>${esc(member.name)}</strong><small>${esc(member.role)}</small></span><b>${queued?'Waiting':esc(runStep(run,i))}</b></li>`).join('')}</ol><p class="case-agent-note">Progress reflects saved workflow stages, not an estimated completion percentage.</p></section>`;
 }
 if(run?.status==='failed'||s.phase==='review-failed')return `<section class="case-agent-summary is-failed" aria-labelledby="case-agent-title">${headline('Investigation stopped','No complete recommendation was recorded. The purchase remains open; retry after checking the connection.','Needs retry','stale')}</section>`;
 if(!s.review)return `<section class="case-agent-summary is-pending" aria-labelledby="case-agent-title">${headline('No investigation recorded','Review purchase evidence to start the four specialists. Their findings will appear here with sources and limits.','Not started')}<div class="case-agent-pending">${crew.map(member=>`<span><strong>${esc(member.name)}</strong><small>${esc(member.role)}</small></span>`).join('')}</div></section>`;
 const current=reviewIsCurrent(s),model=s.review.mode==='model';
 const items=model?(s.analysis?.mode==='model'&&Array.isArray(s.analysis.findings)?s.analysis.findings:[]):findings(s);
 const exact=checks(s).every(item=>item.ok)&&s.evidenceAvailable!==false;
 const open=s.review.objections?.some(item=>item.status==='open');
 const support=[
  exact&&current?'Strong match':'Needs evidence',
  s.fulfillment?.code?'Signal only':'Limited record',
  current&&s.review.outcome==='ready'?'Conditional':'On hold',
  current&&!open&&s.review.outcome==='ready'?'Checks answered':'Open question'
 ];
 const title=model?'AI investigation recorded':'Sample investigation recorded';
 const description=model?'Four model findings are saved for this case. Inspect each source and limitation before deciding.':'These four findings are scripted from sample records. They demonstrate the decision path, not a live AI call.';
 return `<section class="case-agent-summary is-complete" aria-labelledby="case-agent-title">${headline(title,description,current?'Review complete':'Review out of date',current?'complete':'stale')}
  ${items.length?`<div class="case-agent-list">${items.map((item,i)=>{const index=Number.isInteger(item.agent)?item.agent:i;const member=crew[index];return `<details class="case-agent-item"><summary><span class="case-agent-icon" aria-hidden="true">${esc(member?.name?.slice(0,1)||'?')}</span><span class="case-agent-result"><span class="case-agent-name"><strong>${esc(member?.name||'Specialist')}</strong><small>${esc(member?.role||'Case analyst')}</small></span><span class="case-agent-finding">${esc(item.summary)}</span><span class="case-agent-sources">Used: ${(item.sources||[]).map(source=>esc(names[source]||source)).join(' · ')||'No cited source'}</span></span><span class="case-agent-support">${esc(current?support[index]:'Stale')}</span></summary><div class="case-agent-body"><strong>Limit of this finding</strong><p>${esc(item.unknown||'The records do not establish every cause.')}</p></div></details>`}).join('')}</div>`:'<p class="case-agent-unavailable">The saved model findings are unavailable. Run a fresh review before using them for a decision.</p>'}
  <p class="case-agent-note">Evidence support describes the saved checks; it is not a model confidence score or a probability.</p>
 </section>`;
}
