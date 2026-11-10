import {esc,request} from './customer-shared.mjs';

const root=document.querySelector('#course-app');
let current;

function shell(s){
  const ready=s.verified&&!s.paymentHold;
  const mode=s.mode==='sandbox'||s.sample===false?'PAYPAL SANDBOX':s.mode==='sample'?'FICTIONAL SAMPLE':'PURCHASE DEMO';
  root.removeAttribute('role');
  root.innerHTML=`
    <section class="hero" id="overview"><div class="frame hero-inner">
      <div class="hero-copy"><span class="eyebrow">LIGHT & STORY / ${mode}</span><h1>See the light.<br><em>Tell the story.</em></h1><p>Make images that feel like yours. Begin with one ordinary scene and learn to see it differently.</p><a class="hero-link" href="#lesson">Explore your first lesson <span aria-hidden="true">↘</span></a></div>
      <div class="hero-visual"><img src="course-art.svg" width="680" height="610" alt="A sunlit still life with a camera, vase, and flowers beside a window"><div class="visual-label"><span>THE LIGHT & STORY WORKSHOP</span><strong>Notice the moment.</strong></div></div>
    </div></section>
    <div class="frame course-frame">
      <section class="access-path" aria-label="Your access journey"><div class="path-intro"><span class="eyebrow">YOUR PATH TO THE LESSON</span><strong>${ready?'Your workshop is ready.':'One step remains.'}</strong></div><ol><li class="${s.paymentHold?'current':'done'}"><span class="path-number">01</span><span><strong>Purchase</strong><small>${s.paymentHold?'Needs review':'Recorded'}</small></span></li><li class="${ready?'done':'current'}"><span class="path-number">02</span><span><strong>Access check</strong><small>${ready?'Verified':'In progress'}</small></span></li><li class="${ready?'current':'waiting'}"><span class="path-number">03</span><span><strong>First lesson</strong><small>${ready?'Ready to open':'Locked for now'}</small></span></li></ol></section>
      <div class="content"><section id="lesson" aria-labelledby="lesson-heading"><div class="section-heading"><div><span class="eyebrow">CHAPTER 01 / BEGIN HERE</span><h2 id="lesson-heading">The light you already have</h2></div><span class="pill ${ready?'ready':'locked'}">${ready?'Lesson ready':'Lesson locked'}</span></div>
        <article class="lesson-card"><div class="lesson-preview"><span class="preview-tag">Your first visual exercise</span><div class="preview-composition" aria-hidden="true"><span class="sun"></span><span class="vase"></span><span class="shadow"></span></div><span class="preview-caption">Find your light.</span></div><div class="lesson-body"><span class="eyebrow">YOUR FIRST EXERCISE</span><h3>Start with what’s around you.</h3><p>One window. One familiar object. A new way to frame the story in front of you.</p><div class="state ${ready?'ready':''}" role="status"><strong>${ready?'Access verified — you can begin.':'Access is being checked.'}</strong><span>${ready?'Open the protected lesson below. We will check your access again before showing it.':'Your purchase may be complete, but the lesson has not opened yet. You do not need to pay again.'}</span></div>${ready?'<button class="action" id="open-lesson" type="button">Open lesson <span aria-hidden="true">→</span></button>':'<a class="action" href="customer.html">Follow your purchase <span aria-hidden="true">→</span></a>'}<div id="lesson-result" aria-live="polite"></div></div></article>
      </section><aside class="course-aside" aria-label="Workshop and purchase details"><section class="side-card"><span class="eyebrow">THE WORKSHOP</span><h2>Small scenes.<br>Stronger stories.</h2><p>Three focused chapters move from noticing light to making a photograph feel intentional.</p><ol class="chapter-list"><li><span>01</span> Find your light</li><li><span>02</span> Shape the frame</li><li><span>03</span> Make the story yours</li></ol></section><section class="support-card"><span class="eyebrow">YOUR PURCHASE</span><strong>${ready?'Ready to begin':'We’re checking access'}</strong><p>${esc(s.next)}. For details or help, open your private case.</p><a href="customer.html">View your private case <span aria-hidden="true">→</span></a><p class="meta">Case ${esc(s.caseId)} · ${esc(s.amount)}</p></section></aside></div>
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
