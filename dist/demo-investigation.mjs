import {checks,crew,findings} from './core.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames={payment:'Payment capture',order:'Saved order',event:'Event trail',store:'Course access'};

export function investigationView(state){
 const purchaseChecks=checks(state);
 const passed=purchaseChecks.filter(check=>check.ok).length;
 const specialists=findings(state);
 const ready=state.review?.mode==='scripted'&&state.review?.outcome==='ready'&&passed===purchaseChecks.length&&state.review.objections.every(objection=>objection.status==='resolved');
 const evidence=[
  {label:'Payment capture',value:state.capture?.status==='COMPLETED'?`Completed · $${(state.capture.amount/100).toFixed(2)} ${state.capture.currency}`:'Not confirmed',detail:'Sandbox sample record'},
  {label:'Purchase identity',value:`${passed} of ${purchaseChecks.length} exact checks pass`,detail:'Capture matched to saved order'},
  {label:'Course access',value:state.entitlement.active?'Active':'Still locked',detail:'Current course record'},
  {label:'Event trail',value:state.fulfillment?.code==='ENROLLMENT_TIMEOUT'?'Enrollment timed out':'No timeout recorded',detail:'A clue, not a proven cause'}
 ];
 const assessments=[
  {label:ready?'High for payment match':'Low',basis:ready?'Completed capture and exact order match':'Payment or purchase checks need review'},
  {label:'Low for root cause',basis:'Timeout and current access state do not prove the cause'},
  {label:ready?'Conditional':'Low',basis:ready?'One-course change can be previewed; no write yet':'No correction until evidence matches'},
  {label:ready?'High for safety checks':'Low',basis:ready?'Identity and duplicate-access objections resolved':'At least one objection remains open'}
 ];
 return `<section class="investigation" aria-labelledby="investigation-title">
  <div class="investigation-heading"><div><span class="demo-label">CASE REVIEW · SCRIPTED SAMPLE</span><h3 id="investigation-title">Why payment did not become access</h3><p>Four specialists read the same case from different angles. Their assessment is <strong>${ready?'supported for a preview':'on hold'}</strong>; the root cause remains unproven.</p></div><span class="demo-sample-chip">NO LIVE MODEL CALL</span></div>
  <div class="investigation-summary"><div><span class="demo-label">RECOMMENDATION</span><strong>${ready?'Preview one access correction':'Do not change access'}</strong><p>${ready?'The merchant must approve the exact learner and course before a single grant.':'Resolve the evidence gap before proposing a correction.'}</p></div><div><span class="demo-label">ASSESSMENT STRENGTH</span><strong>${ready?'Strongly supported':'On hold'}</strong><p>Evidence support for this scripted recommendation, not a measured AI probability.</p></div><div><span class="demo-label">CAUSE CERTAINTY</span><strong>Limited</strong><p>The timeout is a clue; it does not establish the root cause.</p></div></div>
  <div class="investigation-section-head"><div><span class="demo-label">EVIDENCE USED</span><h4>Four records behind the decision</h4></div><span>${passed} / ${purchaseChecks.length} purchase checks passed</span></div>
  <div class="investigation-evidence" aria-label="Evidence used by the specialists">${evidence.map(item=>`<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.detail)}</small></div>`).join('')}</div>
  <div class="investigation-section-head"><div><span class="demo-label">SPECIALIST ASSESSMENTS</span><h4>What each agent thinks</h4></div><span>Choose one for sources and limits</span></div>
  <div class="investigation-agents" aria-label="Scripted specialist findings">${specialists.map((finding,i)=>`<button type="button" class="investigation-agent" data-specialist="${i}" aria-pressed="${i===0?'true':'false'}" aria-controls="investigation-finding"><span class="investigation-agent-top"><span class="investigation-agent-number">0${i+1}</span><span><strong>${esc(crew[i].name)}</strong><small>${esc(crew[i].role)}</small></span></span><span class="investigation-agent-assessment">Confidence · ${esc(assessments[i].label)}</span><span class="investigation-agent-basis">${esc(assessments[i].basis)}</span><span class="investigation-agent-more">View evidence <span aria-hidden="true">→</span></span></button>`).join('')}</div>
  <div class="investigation-finding" id="investigation-finding" aria-live="polite"></div>
  <details class="investigation-challenge"><summary>Review the two safety objections</summary><p>Prism checks that the completed payment belongs to this purchase and that a retry did not already restore access.</p><ul>${(state.review?.objections||[]).map(item=>`<li><strong>${item.status==='resolved'?'Resolved':'Open'}:</strong> ${esc(item.resolution)}</li>`).join('')}</ul></details>
  <p class="investigation-disclosure">These are scripted sample assessments, not measured model probabilities; no access has changed. The merchant reviews the exact preview next.</p>
 </section>`;
}

export function mountInvestigation(root,state){
 const specialists=findings(state);
 const buttons=[...root.querySelectorAll('[data-specialist]')];
 const panel=root.querySelector('#investigation-finding');
 function select(index){
  const finding=specialists[index];
  if(!finding)return;
  buttons.forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)));
  panel.innerHTML=`<span class="demo-label">${esc(crew[index].name)} · ${esc(crew[index].role)}</span><p>${esc(finding.summary)}</p><dl><div><dt>Evidence used</dt><dd>${finding.sources.map(source=>esc(sourceNames[source]||source)).join(' · ')}</dd></div><div><dt>Cannot prove</dt><dd>${esc(finding.unknown)}</dd></div></dl>`;
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
 select(0);
}
