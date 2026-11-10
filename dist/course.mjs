import {esc,request} from './customer-shared.mjs';

const root=document.querySelector('#course-app');
let current;

function shell(s){
  const ready=s.verified&&!s.paymentHold;
  const mode=s.mode==='sandbox'||s.sample===false?'PAYPAL SANDBOX':s.mode==='sample'?'FICTIONAL SAMPLE':'PURCHASE DEMO';
  root.removeAttribute('role');
  root.innerHTML=`
    <section class="hero" id="overview"><div class="frame hero-inner">
      <div class="hero-copy"><span class="eyebrow">PHOTOGRAPHY WORKSHOP</span><h1>Look closer.<br>Make it yours.</h1><p>A practical first step in making photographs with more intention. Start with the light already around you.</p><a class="hero-link" href="#lesson">Go to your lesson <span aria-hidden="true">↘</span></a></div>
      <figure class="hero-visual"><img src="assets/course/ceramic-still-life.webp" width="1600" height="2400" alt="Two ceramic vases in soft afternoon window light"><figcaption>THE LIGHT & STORY WORKSHOP</figcaption></figure>
    </div></section>
    <div class="frame course-frame"><div class="course-intro"><div><span class="eyebrow">YOUR CLASSROOM · ${mode}</span><h2>Welcome to Light & Story.</h2></div><p>Your purchase and lesson access are checked separately. Your first exercise is below.</p></div>
      <section class="access-path" aria-label="Your access journey"><div class="path-heading"><span class="eyebrow">ACCESS STATUS</span><strong>${ready?'Your lesson is ready.':s.paymentHold?'Your purchase needs review.':'We’re checking your access.'}</strong></div><ol><li class="${s.paymentHold?'current':'done'}"><span class="path-number">01</span><span><strong>Purchase</strong><small>${s.paymentHold?'Needs review':'Recorded'}</small></span></li><li class="${ready?'done':'current'}"><span class="path-number">02</span><span><strong>Access</strong><small>${ready?'Verified':'Under review'}</small></span></li><li class="${ready?'current':'waiting'}"><span class="path-number">03</span><span><strong>Lesson</strong><small>${ready?'Ready to open':'Not open yet'}</small></span></li></ol></section>
      <div class="content"><aside class="course-aside" aria-label="Course contents"><span class="eyebrow">COURSE CONTENTS</span><h2>The Light & Story Workshop</h2><p>Begin with one exercise in observing light, framing a familiar object, and noticing what changes.</p><div class="contents-row"><span>01</span><div><strong>Find your light</strong><small>${ready?'Ready to open':'Access pending'}</small></div></div><div class="support-card"><span class="eyebrow">NEED HELP?</span><p>${esc(s.next)}. You can follow the case or ask the merchant a question from your private page.</p><a href="customer.html">View your purchase <span aria-hidden="true">→</span></a><p class="meta">Case ${esc(s.caseId)} · ${esc(s.amount)}</p></div></aside>
      <section id="lesson" aria-labelledby="lesson-heading"><div class="section-heading"><div><span class="eyebrow">LESSON 01</span><h2 id="lesson-heading">Find your light</h2></div><span class="pill ${ready?'ready':'locked'}">${ready?'Ready to open':'Access pending'}</span></div>
        <article class="lesson-card"><img class="lesson-photo" src="assets/course/shadow-still-life.webp" width="1600" height="1067" alt="Warm window light casts the shadow of flowers and a vase on a wall"><div class="lesson-body"><span class="eyebrow">YOUR FIRST EXERCISE</span><h3>Start with what’s around you.</h3><p>One window. One familiar object. A new way to frame the story in front of you.</p><div class="state ${ready?'ready':''}" role="status"><strong>${ready?'Access verified — you can begin.':'This lesson is not open yet.'}</strong><span>${ready?'We’ll check your access again when you open the lesson.':'Your purchase may be complete, but access has not been verified. You do not need to pay again.'}</span></div>${ready?'<button class="action" id="open-lesson" type="button">Open lesson <span aria-hidden="true">→</span></button>':'<a class="action" href="customer.html">Check purchase progress <span aria-hidden="true">→</span></a>'}<div id="lesson-result" aria-live="polite"></div></div></article>
      </section></div>
    </div>`;
  root.querySelector('#open-lesson')?.addEventListener('click',openLesson);
}

async function openLesson(){
  const button=root.querySelector('#open-lesson'),target=root.querySelector('#lesson-result');
  button.disabled=true;button.textContent='Opening your lesson…';
  try{
    const lesson=await request('/api/customer/lesson?caseId='+encodeURIComponent(current.caseId));
    target.innerHTML=`<div class="lesson-content"><span class="eyebrow">YOUR LESSON IS OPEN</span><h4>${esc(lesson.title)}</h4><p>${esc(lesson.body)}</p><p class="meta">Protected lesson content opened for this private learner session.</p></div>`;
    button.textContent='Lesson open';
    if(lesson.browserChallenge&&crypto.subtle){try{const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(lesson.body)))).map(x=>x.toString(16).padStart(2,'0')).join('');await request('/api/customer/browser-proof',{caseId:current.caseId,token:lesson.browserChallenge,digest});}catch{target.insertAdjacentHTML('beforeend','<p class="meta">The lesson opened, but the separate browser receipt was not recorded.</p>');}}
  }catch(error){target.innerHTML=`<p class="error" role="alert">${esc(error.message)} <a href="customer.html">Check your private case</a> or try again.</p>`;button.disabled=false;button.textContent='Try opening the lesson';}
}

async function init(){try{current=await request('/api/customer/case');shell(current);}catch{root.removeAttribute('role');root.innerHTML='<div class="frame private-entry"><span class="eyebrow">LIGHT & STORY / PRIVATE LEARNER SPACE</span><h1>Your lesson is waiting for you.</h1><p>Open the private case link your merchant shared to see your purchase and lesson access here.</p><a class="action" href="customer.html">Find your purchase <span aria-hidden="true">→</span></a></div>';}}
await init();
