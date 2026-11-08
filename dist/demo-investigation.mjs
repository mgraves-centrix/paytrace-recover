import {checks,crew,findings} from './core.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const sourceNames={payment:'Payment capture',order:'Saved order',event:'Event trail',store:'Course access'};

export function investigationView(state){
 const purchaseChecks=checks(state);
 const passed=purchaseChecks.filter(check=>check.ok).length;
 const specialists=findings(state);
 const ready=state.review?.mode==='scripted'&&state.review?.outcome==='ready'&&passed===purchaseChecks.length&&state.review.objections.every(objection=>objection.status==='resolved');
 const evidence=[
  {label:'Payment',value:state.capture?.status==='COMPLETED'?`Completed · $${(state.capture.amount/100).toFixed(2)} ${state.capture.currency}`:'Not confirmed',source:'Payment capture'},
  {label:'Purchase match',value:`${passed} of ${purchaseChecks.length} exact checks pass`,source:'Capture + saved order'},
  {label:'Course access',value:state.entitlement.active?'Active':'Still locked',source:'Current course record'},
  {label:'Event clue',value:state.fulfillment?.code==='ENROLLMENT_TIMEOUT'?'Enrollment timed out':'No timeout recorded',source:'Event trail'}
 ];
 return `<section class="investigation" aria-labelledby="investigation-title">
  <div class="investigation-heading"><div><span class="demo-label">THE EVIDENCE ROOM · SCRIPTED SAMPLE</span><h3 id="investigation-title">The records disagree. The specialists check why.</h3></div><span class="demo-sample-chip">NO LIVE MODEL CALL</span></div>
  <div class="investigation-evidence" aria-label="Four source records">${evidence.map(item=>`<div><span>${esc(item.label)}</span><strong>${esc(item.value)}</strong><small>${esc(item.source)}</small></div>`).join('')}</div>
  <div class="investigation-readout"><div><span class="demo-label">ASSESSMENT STRENGTH</span><strong>${ready?'Strongly supported':'On hold'}</strong><p>${ready?'The exact purchase checks pass and both objections are resolved. A single-course correction can be previewed.':'The sample evidence does not support a correction yet.'}</p></div><div><span class="demo-label">CAUSE CERTAINTY</span><strong>Limited</strong><p>The timeout is a clue. These records do not prove the root cause or that a real grant will succeed.</p></div></div>
  <div class="investigation-team"><div class="investigation-team-heading"><span class="demo-label">SPECIALIST REVIEW</span><p>Choose a specialist to see the records behind their finding.</p></div><div class="investigation-agents" aria-label="Scripted specialist findings">${specialists.map((finding,i)=>`<button type="button" class="investigation-agent" data-specialist="${i}" aria-pressed="${i===0?'true':'false'}"><span class="investigation-agent-number">0${i+1}</span><span><strong>${esc(crew[i].name)}</strong><small>${esc(crew[i].role)}</small></span></button>`).join('')}</div><div class="investigation-finding" id="investigation-finding" aria-live="polite"></div></div>
  <div class="investigation-challenge"><span class="demo-label">THE CHALLENGE ROUND</span><p><strong>Prism asks:</strong> Does the capture match this learner and course? Could a retry already have restored access?</p><ul>${(state.review?.objections||[]).map(item=>`<li><strong>${item.status==='resolved'?'Resolved':'Open'}:</strong> ${esc(item.resolution)}</li>`).join('')}</ul><p class="investigation-guardrail">Recommendation only. The merchant still reviews the exact preview; no access has changed.</p></div>
  <p class="investigation-disclosure">Assessment strength describes this scripted evidence, not a measured AI probability. The real model path belongs to an authorized connected case.</p>
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
  panel.innerHTML=`<span class="demo-label">${esc(crew[index].name)} · ${esc(crew[index].role)}</span><p>${esc(finding.summary)}</p><p><strong>Reads:</strong> ${finding.sources.map(source=>esc(sourceNames[source]||source)).join(' · ')}</p><p><strong>Cannot prove:</strong> ${esc(finding.unknown)}</p>`;
 }
 buttons.forEach((button,i)=>button.addEventListener('click',()=>select(i)));
 select(0);
}
