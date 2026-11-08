import {checks,crew,findings,reviewIsCurrent} from './core.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names={payment:'Payment capture',order:'Saved order',event:'Event trail',store:'Course access'};

export function caseAgentSummary(s){
 if(!s.review)return `<section class="case-agent-summary is-pending" aria-labelledby="case-agent-title"><div class="case-agent-heading"><div><span class="eyebrow">SPECIALIST REVIEW</span><h2 id="case-agent-title">Four perspectives, once evidence is checked</h2><p>No agent finding or confidence is recorded for this case yet. Review the current payment and access evidence to begin.</p></div><span class="case-agent-state">Awaiting review</span></div><div class="case-agent-pending">${crew.map(member=>`<span><strong>${esc(member.name)}</strong><small>${esc(member.role)}</small></span>`).join('')}</div></section>`;
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
 return `<section class="case-agent-summary" aria-labelledby="case-agent-title">
  <div class="case-agent-heading"><div><span class="eyebrow">${model?'SAVED MODEL REVIEW':'SCRIPTED SAMPLE REVIEW'}</span><h2 id="case-agent-title">Four perspectives on this case</h2><p>Each finding names its source and limit. Evidence support is a qualitative reading of saved checks, not a model probability.</p></div><span class="case-agent-state ${current?'':'stale'}">${current?'Current review':'Earlier review · refresh required'}</span></div>
  ${items.length?`<div class="case-agent-list">${items.map((item,i)=>{const index=Number.isInteger(item.agent)?item.agent:i;const member=crew[index];return `<details class="case-agent-item"><summary><span class="case-agent-icon" aria-hidden="true">${esc(member?.name?.slice(0,1)||'?')}</span><span class="case-agent-name"><strong>${esc(member?.name||'Specialist')}</strong><small>${esc(member?.role||'Case analyst')}</small></span><span class="case-agent-support">Evidence support · ${esc(current?support[index]:'Stale')}</span></summary><div class="case-agent-body"><p>${esc(item.summary)}</p><dl><div><dt>Sources used</dt><dd>${(item.sources||[]).map(source=>esc(names[source]||source)).join(' · ')||'No cited source'}</dd></div><div><dt>Cannot prove</dt><dd>${esc(item.unknown||'The records do not establish every cause.')}</dd></div></dl></div></details>`}).join('')}</div>`:'<p class="case-agent-unavailable">The saved model findings are unavailable. Run a fresh review before using them for a decision.</p>'}
 </section>`;
}
