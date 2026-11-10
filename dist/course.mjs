import {esc,request} from './customer-shared.mjs';

const root=document.querySelector('#course-app');
let current;
const supportHref='customer.html?from=course';
const returnToLesson=new URLSearchParams(location.search).get('lesson')==='light-01';

function shell(s){
  const ready=s.verified&&!s.paymentHold;
  const mode=s.mode==='sandbox'||s.sample===false?'Sandbox purchase':s.mode==='sample'?'Fictional sample':'Purchase demo';
  root.removeAttribute('role');root.removeAttribute('aria-live');
  root.innerHTML=`
    <div class="frame classroom" id="lesson">
      <div class="classroom-top"><div><span class="eyebrow">LIGHT & STORY / YOUR WORKSHOP</span><h1>Find your light</h1><p>A practical photography lesson to do at home, at your own pace.</p></div><a class="quiet-link" href="${supportHref}">Purchase & support <span aria-hidden="true">↗</span></a></div>
      <div class="classroom-layout">
        <aside class="course-rail" aria-label="Workshop navigation">
          <div class="rail-title"><span class="eyebrow">YOUR COURSE</span><strong>The Light & Story Workshop</strong></div>
          <div class="rail-unit"><span class="unit-number">01</span><span><strong>Find your light</strong><small>${ready?'Available now':'Awaiting access'}</small></span><span aria-hidden="true">→</span></div>
          <div class="rail-note"><span class="eyebrow">YOUR ACCESS</span><strong>${s.paymentHold?'Purchase under review':ready?'Lesson ready':'Access being checked'}</strong><p>${ready?'Your purchase and course access have been verified. We’ll check again when you open the lesson.':s.paymentHold?'Your purchase needs review before the lesson can open.':'Your purchase may be complete. We’re waiting for access to be verified; you do not need to buy it again.'}</p><a class="support-action" href="${supportHref}">Unable to access course</a></div>
          <p class="rail-meta">${esc(mode)} · Case ${esc(s.caseId)}</p>
        </aside>
        <div class="lesson-stage">
          <div class="lesson-cover"><img src="assets/course/shadow-still-life.webp" width="1600" height="1067" alt="Window light casts the shadow of a vase and flowers across a wall"><div class="cover-label"><span>LESSON 01</span><strong>Find your light</strong></div></div>
          <div class="lesson-panel"><div class="lesson-kicker"><span class="eyebrow">A PRACTICAL EXERCISE</span><span class="access-badge ${ready?'is-ready':'is-locked'}">${ready?'Ready to begin':'Access pending'}</span></div><h2>Photograph the familiar in a new light.</h2><p class="lesson-lede">You only need a familiar object, a window, and a little time to look closely.</p>
            <div class="lesson-action"><div><strong>${ready?'Your lesson is ready':'Full lesson not available yet'}</strong><span>${ready?'Open the lesson to see the complete exercise.':'Your private case has this workshop and purchase attached. Follow it without entering the order again.'}</span></div>${ready?'<button class="action" id="open-lesson" type="button">Open lesson <span aria-hidden="true">→</span></button>':`<a class="action" href="${supportHref}">Unable to access course <span aria-hidden="true">→</span></a>`}</div>
            <div id="lesson-result" aria-live="polite"></div>
          </div>
          <div class="lesson-bottom"><div><span class="eyebrow">ABOUT THIS WORKSHOP</span><p>One lesson on natural light, observation, and composition. Work through it whenever your access is active.</p></div><a class="quiet-link" href="${supportHref}">Purchase & support <span aria-hidden="true">↗</span></a></div>
        </div>
      </div>
    </div>`;
  root.querySelector('#open-lesson')?.addEventListener('click',openLesson);
}

function lessonView(lesson){
  const sentences=String(lesson.body||'').match(/[^.!?]+[.!?]+|[^.!?]+$/g)?.map(x=>x.trim()).filter(Boolean)||[];
  const steps=sentences.map((sentence,i)=>`<li><span class="exercise-number">${String(i+1).padStart(2,'0')}</span><p>${esc(sentence)}</p></li>`).join('');
  return `<section class="opened-lesson" aria-labelledby="opened-heading"><div class="opened-head"><span class="eyebrow">YOUR EXERCISE</span><h3 id="opened-heading" tabindex="-1">${esc(lesson.title)}</h3><p>Take your time. You can return to this exercise whenever your access is active.</p></div><ol class="exercise-steps">${steps}</ol><div class="opened-foot"><strong>Look at what changed.</strong><p>Compare your frames and notice which direction of light best tells the story you wanted to show.</p></div></section>`;
}

async function openLesson(){
  const button=root.querySelector('#open-lesson'),target=root.querySelector('#lesson-result');
  button.disabled=true;button.textContent='Opening your lesson…';
  try{
    const lesson=await request('/api/customer/lesson?caseId='+encodeURIComponent(current.caseId));
    target.innerHTML=lessonView(lesson);
    button.remove();
    root.querySelector('.lesson-action strong').textContent='Exercise open';
    root.querySelector('.lesson-action div>span').textContent='Your first lesson is below.';
    root.querySelector('.access-badge').textContent='Lesson open';
    target.querySelector('#opened-heading')?.focus();
    if(lesson.browserChallenge&&crypto.subtle){try{const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(lesson.body)))).map(x=>x.toString(16).padStart(2,'0')).join('');await request('/api/customer/browser-proof',{caseId:current.caseId,token:lesson.browserChallenge,digest});}catch{target.insertAdjacentHTML('beforeend','<p class="receipt-note">The lesson opened, but its separate browser receipt was not recorded.</p>');}}
  }catch(error){target.innerHTML=`<p class="error" role="alert">${esc(error.message)} <a href="customer.html">Check your private case</a> or try again.</p>`;button.disabled=false;button.textContent='Try opening the lesson';}
}

async function init(){
  try{current=await request('/api/customer/case');shell(current);if(returnToLesson&&current.verified&&!current.paymentHold)await openLesson();}
  catch{
    root.removeAttribute('role');root.removeAttribute('aria-live');
    document.querySelector('.site-head nav a[href="#lesson"]')?.setAttribute('href','#lesson-outline');
    const signInLink=document.querySelector('.site-head nav a[href="customer.html?from=course"]');
    if(signInLink){signInLink.href='#learner-sign-in';signInLink.textContent='Sign in';}
    root.innerHTML=`
      <div class="public-course" id="lesson">
        <section class="frame public-hero" aria-labelledby="studio-heading">
          <div class="public-intro"><p class="course-type">A photography workshop to take at home</p><h1 id="studio-heading">The Light &amp; Story Workshop</h1><p class="public-lede">Begin with something already in your home. Watch how window light falls across it, change your position, and make a few frames.</p><div class="hero-actions"><a class="action" href="#lesson-outline">Explore the lesson <span aria-hidden="true">↓</span></a><a class="quiet-link" href="#learner-sign-in">Already enrolled? Sign in <span aria-hidden="true">↗</span></a></div><p class="access-hint">Take a look around before you begin. The complete lesson opens with your private course link.</p></div>
          <figure class="public-photo"><img src="assets/course/photographer-room.jpg" width="1500" height="2100" alt="A photographer holding a camera in a light-filled room"><figcaption>Photography at home, with the light that’s there.</figcaption></figure>
        </section>
        <div class="frame course-facts" aria-label="Workshop details"><span>One focused lesson</span><span>At your own pace</span><span>Any camera will do</span></div>
        <section class="frame course-detail" id="lesson-outline" aria-labelledby="detail-heading"><div class="detail-intro"><p class="course-type">A glimpse of lesson one</p><h2 id="detail-heading">See what a window can do.</h2><p>Choose an object you pass every day and place it near a window. Before you take a picture, spend a moment looking at how the light falls across it.</p><ol class="practice-list"><li>Notice where the brightest light lands.</li><li>Move around the object and try a new angle.</li><li>Take two frames and compare the shadows.</li></ol><a class="quiet-link outline-sign-in" href="#learner-sign-in">Open the full lesson <span aria-hidden="true">→</span></a></div><div class="detail-lesson"><img src="assets/course/shadow-still-life.webp" width="1600" height="1067" loading="lazy" alt="The soft silhouette of flowers in warm window light"><div><span class="lesson-index">Lesson 01</span><h3>Find your light</h3><p>Work through a guided exercise in natural light and composition, then choose the frame that says the most with the least.</p><span class="lesson-state">The full exercise opens after sign-in</span></div></div></section>
        <section class="frame learner-entry" id="learner-sign-in" aria-labelledby="sign-in-heading"><div class="entry-intro"><p class="course-type">Ready to continue?</p><h2 id="sign-in-heading">Your lesson is waiting.</h2><p>Already have a private course link? Open it to pick up where you left off. If you need a new link, use the details on your receipt.</p><div class="entry-help"><strong>Can’t get into the lesson?</strong><p>Tell us what happened. PayTrace will help you check your purchase and follow up with the merchant.</p><a class="support-action" href="${supportHref}">Trouble accessing course <span aria-hidden="true">↗</span></a></div></div><form class="entry-form" id="course-sign-in"><span class="eyebrow">GET A PRIVATE COURSE LINK</span><label for="course-reference">Order or case reference</label><input id="course-reference" name="reference" required maxlength="150" autocomplete="off" aria-describedby="sign-in-note"><label for="course-email">Email used at checkout</label><input id="course-email" name="email" type="email" required maxlength="254" autocomplete="email"><button class="action" type="submit">Send my course link <span aria-hidden="true">→</span></button><p id="sign-in-note">We’ll check these details and email a link when delivery is available. If you don’t receive one, use “Trouble accessing course.”</p><p id="course-sign-in-status" role="status" aria-live="polite"></p></form></section>
      </div>`;
    root.querySelector('#course-sign-in')?.addEventListener('submit',requestCourseLink);
  }
}
async function requestCourseLink(event){
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button'),status=form.querySelector('#course-sign-in-status');
  button.disabled=true;button.textContent='Requesting your link…';status.textContent='';status.classList.remove('is-error');
  try{const result=await request('/api/customer/request-link',{reference:form.elements.reference.value.trim(),email:form.elements.email.value.trim()});status.textContent=result.message;}
  catch(error){status.textContent=error.message;status.classList.add('is-error');}
  finally{button.disabled=false;button.innerHTML='Send my course link <span aria-hidden="true">→</span>';}
}
await init();
