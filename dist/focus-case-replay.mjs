import {checks,crew,findings,reviewIsCurrent} from './core.mjs';
import {proofIsCurrent} from './operations.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames={payment:'Payment capture',order:'Saved order',event:'Event trail',store:'Course access'};

// Confidence here describes support from saved evidence, never a model probability.
export function replayAgents(s){
 if(!s.review)return [];
 const current=reviewIsCurrent(s),snapshot=s.review.snapshot||{};
 const entries=s.review.mode==='model'?(s.analysis?.mode==='model'&&Array.isArray(s.analysis.findings)?s.analysis.findings:[]):findings(s);
 return entries.map((item,index)=>{
  const agent=Number.isInteger(item.agent)?item.agent:index;
  const sources=(item.sources||[]).filter(source=>Object.hasOwn(snapshot,source));
  const complete=sources.length>0&&sources.length===(item.sources||[]).length&&sources.every(source=>snapshot[source]!=null);
  const confidence=!current?'Out of date':s.evidenceAvailable===false||!complete?'Limited':checks(s).some(check=>!check.ok)?'Needs review':agent===1||agent===2?'Moderate':'Strong';
  const reason=!current?'The evidence changed after this review.':s.evidenceAvailable===false?'A required payment record is unavailable.':!complete?'A cited source is unavailable in the saved snapshot.':confidence==='Needs review'?'A required purchase check did not pass.':confidence==='Moderate'?'The sources support this finding but do not prove the cause or future outcome.':'Current cited records and purchase checks support this finding.';
  return {agent,name:crew[agent]?.name||'Specialist',role:crew[agent]?.role||'Case analyst',summary:item.summary,unknown:item.unknown,sources,confidence,reason};
 });
}

export function caseReplayMarkup(s,{uncertain=false}={}){
 const connected=s.capture?.source==='paypal-sandbox';
 const purchase=s.capture?.status==='COMPLETED'&&s.evidenceAvailable!==false;
 const current=!!s.review&&reviewIsCurrent(s)&&!uncertain;
 const agents=replayAgents(s);
 const approved=!!s.approval&&s.approval.planId===s.rehearsal?.id;
 const verified=!uncertain&&proofIsCurrent(s)&&s.evidenceAvailable!==false;
 const steps=[
  ['01','Purchase',purchase?'Recorded':'Awaiting evidence',purchase?connected?'Completed sandbox capture is saved with this case.':'A sample payment record is saved with this case.':'A completed, readable capture is needed before a correction.',purchase?'done':'waiting'],
  ['02','Investigation',current?'Reviewed':s.agentRun?.status==='running'?'Working':s.review?'Refresh needed':'Not started',current?'Four specialists reviewed the saved evidence.':s.agentRun?.status==='running'?'The specialists are working; refresh for recorded findings.':s.review?'The review is out of date. Run it again.':'Start a current evidence review.',current?'done':s.agentRun?.status==='running'?'working':'waiting'],
  ['03','Merchant decision',approved?'Authorized':s.rehearsal?'Preview ready':'Pending',approved?'The exact access change was authorized.':s.rehearsal?'Inspect the exact preview before approval.':'No access change is authorized yet.',approved?'done':'waiting'],
  ['04','Outcome',verified?'Verified':s.writes?'Checking':'Not verified',verified?'A fresh payment, entitlement, and protected lesson check passed.':s.writes?'An access write is recorded; fresh verification is still required.':'Access is not yet proven to work.',verified?'done':s.writes?'working':'waiting']
 ];
 const agentList=agents.length?`<ol class="case-replay-agents">${agents.map(item=>`<li><div><strong>${esc(item.name)}</strong><span>${esc(item.role)}</span></div><p>${esc(item.summary)}</p><div class="case-replay-agent-foot"><span class="case-replay-confidence">Evidence confidence: <strong>${esc(item.confidence)}</strong></span><span>${esc(item.reason)}</span></div><small>Used: ${item.sources.map(source=>esc(sourceNames[source]||source)).join(' · ')||'No saved source available'} · Limit: ${esc(item.unknown||'This finding does not establish every cause.')}</small></li>`).join('')}</ol>`:`<p class="case-replay-empty">${s.review?.mode==='model'?'Saved model findings are unavailable. Run a fresh investigation.':s.agentRun?.status==='running'?'The agents are working. Their saved findings will appear after the review completes.':'Run the investigation to see each specialist’s evidence and limitations.'}</p>`;
 return `<section class="case-replay" aria-labelledby="case-replay-heading"><div class="case-replay-head"><div><span class="eyebrow">CASE REPLAY · ${connected?'PAYPAL SANDBOX':'ILLUSTRATIVE SAMPLE'}</span><h2 id="case-replay-heading">From paid to proof</h2><p>Follow the recorded decisions for this purchase. Each stage distinguishes saved evidence from a proposed or verified outcome.</p></div><a href="#case-deep-evidence" data-open-case-evidence>Full case record ↗</a></div><ol class="case-replay-steps">${steps.map(([number,label,state,detail,tone])=>`<li class="${tone}"><span class="case-replay-number">${number}</span><div><strong>${esc(label)}</strong><span class="case-replay-state">${esc(state)}</span><small>${esc(detail)}</small></div></li>`).join('')}</ol><details class="case-replay-investigation"><summary>How the four specialists reached their view <span>${current?'Review recorded':s.agentRun?.status==='running'?'In progress':'Inspect findings'}</span></summary><p class="case-replay-method">Evidence confidence is a qualitative reading of cited records and required checks, not a model probability. A finding never authorizes an access grant.</p>${agentList}<a href="#case-deep-evidence" data-open-case-evidence>Inspect cited source records and audit ↗</a></details></section>`;
}
