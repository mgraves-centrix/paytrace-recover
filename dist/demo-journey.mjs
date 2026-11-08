import {journeyAt,journeyChapters} from './demo-journey-model.mjs';
import {crew,findings,COURSE} from './core.mjs';
import {investigationView,mountInvestigation} from './demo-investigation.mjs';

const app=document.querySelector('#demo-app');
const stages=['Purchase','Missing access','Investigation','Preview','Approval','Grant','Verification','Confirmation'];
const requestedStep=Number(new URLSearchParams(location.search).get('step'));
let step=Number.isInteger(requestedStep)&&requestedStep>=0&&requestedStep<stages.length?requestedStep:0;
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const moments=[
 {lead:'A purchase is about to begin.',detail:'Maya chooses a $128 workshop. No payment or access claim exists yet.',signal:'Ready for checkout',note:'The story begins before any money moves.',story:'Maya chooses The Light & Story Workshop. She expects the first lesson to open as soon as checkout ends.'},
 {lead:'The payment is complete. The access is missing.',detail:'The sample purchase is complete, but the course record still says locked.',signal:'Mismatch detected',note:'A paid receipt alone cannot authorize a grant.',story:'The receipt lands. The lesson still asks her to buy. To Maya, a completed payment has become a broken promise.'},
 {lead:'Four perspectives. One bounded recommendation.',detail:'The scripted specialists compare the purchase, learner, course, and current access.',signal:'Evidence reviewed',note:'These conclusions are sample data, not a live model response.',story:'Four scripted specialists compare what Maya bought with the access she has. Each names the evidence—and what it cannot prove.'},
 {lead:'See the exact change before it happens.',detail:'The preview changes only this purchased course for this learner. Payment and account details stay put.',signal:'Correction previewed',note:'No entitlement has been changed.',story:'The proposed fix names one learner, one course, and one access state. The merchant sees the before and after before anything changes.'},
 {lead:'A human authorizes the specific preview.',detail:'The merchant approves the proposed correction. Approval by itself does not grant access.',signal:'Approval recorded',note:'If the evidence or preview changes, this approval cannot silently cover a different fix.',story:'The merchant approves that exact preview. Approval narrows the next action; it does not itself unlock the lesson.'},
 {lead:'One grant. The case is still open.',detail:'The sample entitlement changes once. Fresh payment, entitlement, and lesson checks still have to agree.',signal:'Access changed once',note:'A successful write is not a verified recovery.',story:'One access grant is recorded. Maya still needs to get through the lesson door before anyone can call this resolved.'},
 {lead:'The lesson opens in the sample check.',detail:'Simulated payment, entitlement, and protected lesson checks agree. Maya still needs to confirm on her side.',signal:'Technical proof passed',note:'Customer confirmation is a separate signal.',story:'The purchase, entitlement, and protected lesson now agree. The technical check passes; Maya’s own confirmation is still missing.'},
 {lead:'Access restored. Proof retained.',detail:'Maya confirms she can open the workshop. The sample ends with technical proof and her confirmation.',signal:'Sample recovery complete',note:'This is a fictional demonstration, not connected acceptance.',story:'Maya opens the lesson and confirms it works. The story closes with one approved correction, one grant, independent proof, and her reply.'}
];
const merchantQuestions=[
 'What access should this purchase promise?',
 'Did the right buyer pay for the right course?',
 'What does each source know, and what is still uncertain?',
 'Is this the smallest correction for this exact learner?',
 'Has the merchant approved the exact preview?',
 'Was only one bounded access change recorded?',
 'Can the protected lesson actually open now?',
 'Did Maya confirm the result herself?'
];

function render(){
 const {state:s,chapter,verified,confirmed}=journeyAt(step);
 document.body.dataset.demoStep=String(step);
 const moment=moments[step],payment=Boolean(s.capture),access=s.writes===1;
 const buyerText=step===0?'I’m ready to buy the workshop.':step<5?'I paid, but the workshop still says I’m locked out.':step===5?'I see an update. Can I open the lesson yet?':step===6?'The lesson opens now. I’m checking it on my device.':'I can open the workshop. Thank you!';
 const rail=stages.map((name,i)=>`<li><button type="button" data-step="${i}" class="${i===step?'current':i<step?'complete':''}" ${i===step?'aria-current="step"':''}><span class="demo-rail-number">${i<step?'✓':i+1}</span><span><strong>${esc(name)}</strong><small>${esc(journeyChapters[i].actor)}</small></span></button></li>`).join('');
 const mobileOptions=stages.map((name,i)=>`<option value="${i}" ${i===step?'selected':''}>${i+1}. ${esc(name)}</option>`).join('');
 app.innerHTML=`
  <div class="demo-progress"><div><span class="demo-kicker">SAMPLE CASE / MAYA</span><strong>Moment ${step+1} of ${stages.length}</strong><span>${esc(chapter.actor)} in focus</span></div><div class="demo-meter" role="progressbar" aria-label="Walkthrough progress" aria-valuemin="1" aria-valuemax="8" aria-valuenow="${step+1}"><i style="width:${(step+1)/8*100}%"></i></div></div>
  <div class="demo-workbench chapter-${step}">
   <nav class="demo-rail" aria-label="Recovery journey"><span class="demo-rail-heading">THE JOURNEY</span><ol>${rail}</ol><p>One fictional buyer. One traceable outcome.</p></nav>
   <div class="demo-workbench-main">
    <label class="demo-mobile-steps">Jump to a moment <select id="demo-step-select">${mobileOptions}</select></label>
    <div class="demo-layout">
   <section class="demo-stage" aria-labelledby="moment-title">
    <div class="demo-stage-top"><span class="demo-label">${esc(stages[step])} / ${esc(moment.signal)}</span><span class="demo-case-id">CL-SAMPLE-JOURNEY</span></div>
    <h2 id="moment-title" tabindex="-1">${esc(moment.lead)}</h2>
    <div class="demo-story"><span class="demo-label">MAYA’S STORY · CHAPTER ${step+1}</span><p>${esc(moment.story)}</p></div>
    <div class="demo-app-frame">
     <div class="demo-app-body">
      ${step===2?investigationView(s):`<div class="demo-evidence-head"><span class="demo-label">CURRENT EVIDENCE</span><span class="demo-sample-chip">SAMPLE RECORD</span><p>${esc(moment.detail)}</p></div>
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
    <div class="demo-facts" aria-label="Current sample evidence"><div><span>Purchase checks</span><strong>${payment?'6 / 6 shown':'Awaiting purchase'}</strong></div><div><span>Access grants</span><strong>${s.writes} recorded</strong></div><div><span>Customer confirmation</span><strong>${confirmed?'Received':'Pending'}</strong></div></div>`}
    ${step>=3?`<div class="demo-delta"><span>EXACT CORRECTION</span><div><strong>Before <em>Purchased course locked</em></strong><b aria-hidden="true">→</b><strong>After <em>Purchased course active</em></strong></div><small>${step<5?'Preview only. No real or sample grant has been applied yet.':step===5?'One sample grant applied; verification pending.':'One sample grant applied; independent checks passed.'}</small></div>`:''}
    ${step===7?`<div class="demo-finish"><span aria-hidden="true">✓</span><div><strong>Complete in this fictional sample</strong><p>Purchase matched · one approved correction · lesson opened · customer confirmed</p></div></div>`:''}
     </div>
    </div>
   </section>
   <aside class="demo-side" aria-label="Buyer and merchant context"><div class="demo-perspective"><span class="demo-avatar" aria-hidden="true">M</span><span class="demo-label">BUYER PERSPECTIVE</span><h3>What Maya sees</h3><blockquote>“${esc(buyerText)}”</blockquote><span class="demo-buyer">Maya · The Light & Story Workshop</span></div><div class="demo-question"><span class="demo-label">MERCHANT QUESTION</span><p>${esc(merchantQuestions[step])}</p></div><div class="demo-control"><span class="demo-label">MERCHANT CONTROL</span><h3>The four gates to completion.</h3><ol><li class="${step>=4?'done':''}">Exact preview approved</li><li class="${access?'done':''}">One access grant recorded</li><li class="${verified?'done':''}">Independent lesson check passed</li><li class="${confirmed?'done':''}">Buyer confirmed the result</li></ol></div>${step===2?'':`<details class="demo-deep"><summary>Inspect the sample evidence</summary><p>The purchase is for <strong>${esc(COURSE.name)}</strong> at $128.00 USD. The flow uses one fictional learner and one fictional course.</p>${step>=2?`<h4>Four scripted specialists</h4>${findings(s).map((finding,i)=>`<article><strong>${esc(crew[i].name)} · ${esc(crew[i].role)}</strong><p>${esc(finding.summary)}</p><small>Unknown: ${esc(finding.unknown)}</small></article>`).join('')}`:'<p>The specialist review appears at moment three.</p>'}</details>`}<p class="demo-boundary"><strong>Fictional sample.</strong> This walkthrough makes no PayPal call, real grant, model consultation, or customer contact. Connected acceptance is tracked separately.</p></aside>
    </div>
    <div class="demo-action-dock"><span><strong>Moment ${step+1} of ${stages.length}</strong><small>${esc(moment.note)}</small></span><div class="demo-actions"><button type="button" id="previous" ${step===0?'disabled':''}>Back</button><button type="button" id="next" class="primary" aria-label="${esc(chapter.next)}"><span class="demo-next-long">${esc(chapter.next)}</span><span class="demo-next-short" aria-hidden="true">Next</span> <span aria-hidden="true">→</span></button></div></div>
   </div>
  </div>`;
 app.querySelector('#previous').onclick=()=>move(step-1);
 app.querySelector('#next').onclick=()=>move(step===7?0:step+1);
 app.querySelectorAll('[data-step]').forEach(button=>button.onclick=()=>move(Number(button.dataset.step)));
 app.querySelector('#demo-step-select').onchange=event=>move(Number(event.target.value));
 if(step===2)mountInvestigation(app,s);
}
function move(nextStep){
 if(nextStep<0||nextStep>=stages.length)return;
 step=nextStep;
 const url=new URL(location.href);url.searchParams.set('step',String(step));history.replaceState(null,'',url);
 render();app.querySelector('.demo-stage').scrollIntoView({block:'start'});app.querySelector('#moment-title').focus({preventScroll:true});
}
render();
