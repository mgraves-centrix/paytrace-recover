import {journeyAt} from './demo-journey-model.mjs';
import {crew,findings,COURSE} from './core.mjs';

const app=document.querySelector('#demo-app');
const stages=['Purchase','Missing access','Investigation','Preview','Approval','Grant','Verification','Confirmation'];
const requestedStep=Number(new URLSearchParams(location.search).get('step'));
let step=Number.isInteger(requestedStep)&&requestedStep>=0&&requestedStep<stages.length?requestedStep:0;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moments=[
 {lead:'A purchase is about to begin.',detail:'Maya chooses a $128 workshop. No payment or access claim exists yet.',signal:'Ready for checkout',note:'The story begins before any money moves.',story:'Maya is excited to start The Light & Story Workshop. She expects the first lesson to be waiting as soon as checkout finishes.'},
 {lead:'The payment is complete. The access is missing.',detail:'The sample purchase is complete, but the course record still says locked.',signal:'Mismatch detected',note:'A paid receipt alone cannot authorize a grant.',story:'Her receipt arrives, but the lesson still asks her to buy. From Maya’s side, the system has taken her money without keeping its promise. The merchant now has a specific problem to solve.'},
 {lead:'Four perspectives. One bounded recommendation.',detail:'The scripted specialists compare the purchase, learner, course, and current access.',signal:'Evidence reviewed',note:'These conclusions are sample data, not a live model response.',story:'The team does not start by flipping an access switch. Ledger checks the purchase, Relay traces the delivery gap, Patch looks for the smallest safe correction, and Prism challenges what might be missing.'},
 {lead:'See the exact change before it happens.',detail:'The preview changes only this purchased course for this learner. Payment and account details stay put.',signal:'Correction previewed',note:'No entitlement has been changed.',story:'The investigation narrows to one entitlement. The merchant can compare the locked state with the proposed active state before the app touches anything.'},
 {lead:'A human authorizes the specific preview.',detail:'The merchant approves the proposed correction. Approval by itself does not grant access.',signal:'Approval recorded',note:'A person accepts exactly the change they inspected. If the evidence or preview changes, that approval cannot silently cover a different fix.'},
 {lead:'One grant. The case is still open.',detail:'The sample entitlement changes once. Fresh payment, entitlement, and lesson checks still have to agree.',signal:'Access changed once',note:'A successful write is not a verified recovery.',story:'The correction is recorded once. Maya may be closer to her workshop, but the team holds the celebration: a write receipt does not prove the lesson actually opens.'},
 {lead:'The lesson opens in the sample check.',detail:'Simulated payment, entitlement, and protected lesson checks agree. Maya still needs to confirm on her side.',signal:'Technical proof passed',note:'Customer confirmation is a separate signal.',story:'The system checks the purchase again, reads the new entitlement, and opens the protected lesson. The technical story now agrees, while Maya’s real experience remains a separate question.'},
 {lead:'Access restored. Proof retained.',detail:'Maya confirms she can open the workshop. The sample ends with technical proof and her confirmation.',signal:'Sample recovery complete',note:'This is a fictional demonstration, not connected acceptance.',story:'Maya gets into the lesson she paid for and tells the merchant it works. The case closes with a traceable decision, one bounded correction, an opened lesson, and her own confirmation.'}
];

function render(){
 const {state:s,chapter,verified,confirmed}=journeyAt(step);
 const moment=moments[step],payment=Boolean(s.capture),access=s.writes===1;
 const buyerText=step===0?'I’m ready to buy the workshop.':step<5?'I paid, but the workshop still says I’m locked out.':step===5?'I see an update. Can I open the lesson yet?':step===6?'The lesson opens now. I’m checking it on my device.':'I can open the workshop. Thank you!';
 app.innerHTML=`
  <div class="demo-progress"><div><span class="demo-kicker">SAMPLE CASE / MAYA</span><strong>Moment ${step+1} of ${stages.length}</strong><span>${esc(chapter.actor)} in focus</span></div><div class="demo-meter" role="progressbar" aria-label="Walkthrough progress" aria-valuemin="1" aria-valuemax="8" aria-valuenow="${step+1}"><i style="width:${(step+1)/8*100}%"></i></div></div>
  <div class="demo-layout">
   <section class="demo-stage" aria-labelledby="moment-title">
    <div class="demo-stage-top"><span class="demo-label">${esc(stages[step])} / ${esc(moment.signal)}</span><span class="demo-case-id">CL-SAMPLE-JOURNEY</span></div>
    <h2 id="moment-title" tabindex="-1">${esc(moment.lead)}</h2><p class="demo-lead">${esc(moment.detail)}</p>
    <div class="demo-actions"><button type="button" id="previous" ${step===0?'disabled':''}>Back</button><button type="button" id="next" class="primary">${esc(chapter.next)} <span aria-hidden="true">→</span></button></div>
    <div class="demo-signal-board" aria-label="Sample payment to lesson status">
     <div class="demo-signal-intro"><span>RECOVERY SIGNAL</span><strong>${esc(moment.signal)}</strong><small>${esc(moment.note)}</small></div>
     <div class="demo-signal-flow">
      <div class="demo-signal ${payment?'is-on':''}"><span class="demo-signal-icon" aria-hidden="true">$</span><div><strong>Payment</strong><small>${payment?'Completed · $128.00':'Not started'}</small></div></div>
      <span class="demo-connector ${access?'is-on':''}" aria-hidden="true"></span>
      <div class="demo-signal ${access?'is-on':step>=1?'is-alert':''}"><span class="demo-signal-icon" aria-hidden="true">${access?'✓':'!'}</span><div><strong>Course access</strong><small>${access?'Grant recorded':step===0?'Not purchased':'Still locked'}</small></div></div>
      <span class="demo-connector ${verified?'is-on':''}" aria-hidden="true"></span>
      <div class="demo-signal ${verified?'is-on':''}"><span class="demo-signal-icon" aria-hidden="true">${verified?'✓':'·'}</span><div><strong>Lesson proof</strong><small>${verified?'Protected lesson opened':'Not yet verified'}</small></div></div>
     </div>
    </div>
    <div class="demo-story"><span class="demo-label">THE STORY AT THIS MOMENT</span><p>${esc(moment.story)}</p></div>
    <div class="demo-facts" aria-label="Current sample evidence"><div><span>Purchase checks</span><strong>${payment?'6 / 6 shown':'Awaiting purchase'}</strong></div><div><span>Access grants</span><strong>${s.writes} recorded</strong></div><div><span>Customer confirmation</span><strong>${confirmed?'Received':'Pending'}</strong></div></div>
    ${step>=3?`<div class="demo-delta"><span>EXACT CORRECTION</span><div><strong>Before <em>Purchased course locked</em></strong><b aria-hidden="true">→</b><strong>After <em>Purchased course active</em></strong></div><small>${step<5?'Preview only. No real or sample grant has been applied yet.':step===5?'One sample grant applied; verification pending.':'One sample grant applied; independent checks passed.'}</small></div>`:''}
    ${step===7?`<div class="demo-finish"><span aria-hidden="true">✓</span><div><strong>Complete in this fictional sample</strong><p>Purchase matched · one approved correction · lesson opened · customer confirmed</p></div></div>`:''}
   </section>
   <aside class="demo-side" aria-label="Buyer and merchant context"><div class="demo-perspective"><span class="demo-label">BUYER PERSPECTIVE</span><h3>What Maya sees</h3><blockquote>“${esc(buyerText)}”</blockquote><span class="demo-buyer">Maya · The Light & Story Workshop</span></div><div class="demo-control"><span class="demo-label">MERCHANT CONTROL</span><h3>The four gates to completion.</h3><ol><li class="${step>=4?'done':''}">Exact preview approved</li><li class="${access?'done':''}">One access grant recorded</li><li class="${verified?'done':''}">Independent lesson check passed</li><li class="${confirmed?'done':''}">Buyer confirmed the result</li></ol></div><details class="demo-deep"><summary>Inspect the sample evidence</summary><p>The purchase is for <strong>${esc(COURSE.name)}</strong> at $128.00 USD. The flow uses one fictional learner and one fictional course.</p>${step>=2?`<h4>Four scripted specialists</h4>${findings(s).map((finding,i)=>`<article><strong>${esc(crew[i].name)} · ${esc(crew[i].role)}</strong><p>${esc(finding.summary)}</p><small>Unknown: ${esc(finding.unknown)}</small></article>`).join('')}`:'<p>The specialist review appears at moment three.</p>'}</details><p class="demo-boundary"><strong>Fictional sample.</strong> This walkthrough makes no PayPal call, real grant, model consultation, or customer contact. Connected acceptance is tracked separately.</p></aside>
  </div>
  <nav class="demo-step-list" aria-label="Walkthrough moments">${stages.map((name,i)=>`<button type="button" data-step="${i}" class="${i===step?'current':i<step?'complete':''}" aria-label="Show moment ${i+1}: ${esc(name)}" ${i===step?'aria-current="step"':''}><span>${i<step?'✓':i+1}</span><strong>${esc(name)}</strong></button>`).join('')}</nav>`;
 app.querySelector('#previous').onclick=()=>move(step-1);
 app.querySelector('#next').onclick=()=>move(step===7?0:step+1);
 app.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>move(Number(button.dataset.step)));
}
function move(nextStep){
 if(nextStep<0||nextStep>=stages.length)return;
 step=nextStep;
 const url=new URL(location.href);url.searchParams.set('step',String(step));history.replaceState(null,'',url);
 render();app.querySelector('#moment-title').focus({preventScroll:true});
}
render();
