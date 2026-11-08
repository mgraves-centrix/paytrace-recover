import {journeyAt} from './demo-journey-model.mjs';
import {crew,findings,COURSE} from './core.mjs';
const app=document.querySelector('#demo-app');
let step=0;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const stages=['Purchase','Missing access','Investigation','Preview','Approval','Grant','Verification','Confirmation'];
const copy=[
 'Maya chooses The Light & Story Workshop. Checkout has not happened yet.',
 'Her sample payment is complete, but the workshop is still locked. Payment and access tell different stories.',
 'Ledger, Relay, Patch and Prism compare the records. Their scripted findings explain the proposed correction and its limits.',
 'The preview shows one purchased entitlement becoming active. The payment and learner account stay unchanged. No write has happened.',
 'The merchant approves that exact preview. Approval alone does not change access.',
 'One sample access change is recorded. The case stays open until the payment, entitlement and lesson checks agree.',
 'The simulated checks agree and the lesson opens. Maya’s own experience still needs her confirmation.',
 'Maya confirms that her purchase works. Technical proof and customer confirmation are now both recorded in this sample.'
];
const buyer=[
 'I’m ready to purchase the workshop.',
 'I paid, but I can’t open my course.',
 'My request is being reviewed. I’m waiting for an update.',
 'The merchant is reviewing the proposed fix.',
 'The fix is approved. I’m waiting for the access change.',
 'There’s an update, but the lesson still needs checking.',
 'The lesson opens now. I’m trying it on my device.',
 'I can access my purchase. Thank you!'
];
function render(focus=false){
 const {state:s,chapter,verified,confirmed}=journeyAt(step);
 app.innerHTML=`<nav class="demo-step-list" aria-label="Walkthrough steps">${stages.map((name,i)=>`<button type="button" data-step="${i}" class="${i===step?'current':''}" aria-label="Show step ${i+1}: ${esc(name)}" ${i===step?'aria-current="step"':''}><span>${i<step?'✓':i+1}</span>${esc(name)}</button>`).join('')}</nav><div class="demo-progress"><span role="status">STEP ${step+1} OF 8 · ${esc(chapter.actor)}</span><progress max="8" value="${step+1}" aria-label="Walkthrough progress">${step+1} of 8</progress></div><div class="demo-layout"><section class="demo-stage"><span class="eyebrow">${esc(stages[step])}</span><h2 id="step-title" tabindex="-1">${esc(chapter.title)}</h2><p>${esc(copy[step])}</p><div class="demo-purchase"><img src="assets/paypal-mark.svg" alt="" width="28" height="28"><div><strong>${esc(COURSE.name)}</strong><small>Maya · $128.00 USD · Sample purchase</small></div><span class="demo-state ${s.capture?'on':''}">${s.capture?'Payment recorded':'Checkout pending'}</span></div><div class="demo-evidence"><div><strong>${s.capture?'Recorded':'Pending'}</strong><span>sample payment</span></div><div><strong>${s.writes}</strong><span>sample access grants</span></div><div><strong>${verified?'Passed':'Pending'}</strong><span>lesson proof</span></div><div><strong>${confirmed?'Yes':'Not yet'}</strong><span>customer confirmation</span></div></div>${step>=3?`<div class="demo-preview"><small>${step<5?'PREVIEW ONLY':'RECORDED SAMPLE CHANGE'}</small><span>Course locked → Purchased course active</span></div>`:''}${step>=2?`<details class="demo-agent"><summary>Inspect the four specialist findings</summary>${findings(s).map((finding,i)=>`<article><strong>${esc(crew[i].name)} · ${esc(crew[i].role)}</strong><p>${esc(finding.summary)}</p><small>Limit: ${esc(finding.unknown)}</small></article>`).join('')}</details>`:''}<div class="demo-actions"><button type="button" id="previous" ${step===0?'disabled':''}>← Back</button><button type="button" id="next" class="primary">${esc(chapter.next)} ${step===7?'↺':'→'}</button></div></section><aside class="demo-side"><span class="eyebrow">THE BUYER’S SIDE</span><h3>What Maya sees</h3><div class="demo-message"><span class="demo-avatar" aria-hidden="true">M</span><p>${esc(buyer[step])}</p></div><h3>Recorded in this sample</h3><ul><li>${step>=4?'✓':'○'} Exact preview approval</li><li>${step>=5?'✓':'○'} One access grant</li><li>${verified?'✓':'○'} Lesson verification</li><li>${confirmed?'✓':'○'} Customer confirmation</li></ul>${step===7?'<div class="demo-finish"><strong>Sample complete</strong><p>Inspect a separate case in the working app. The sample’s state does not transfer.</p><a href="focus.html">Open merchant workspace →</a></div>':'<p class="demo-note">Use Back or select a step to revisit the story.</p>'}</aside></div>`;
 app.querySelector('#previous').onclick=()=>{step--;render(true);};
 app.querySelector('#next').onclick=()=>{step=step===7?0:step+1;render(true);};
 app.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>{step=Number(button.dataset.step);render(true);});
 if(focus)app.querySelector('#step-title').focus({preventScroll:true});
}
render();
