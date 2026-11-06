// Present the existing controls in a focused layout; authorization stays on the server.
export function arrangeCase(root,s){
 document.body.classList.toggle('focus-case-open',!!s);
 const sheet=root.querySelector('.sheet'),body=sheet?.querySelector('.sheet-body');if(!body||!s)return;
 sheet.classList.add('case-redesign');
 const head=sheet.querySelector('.sheet-head'),identity=document.createElement('div');identity.className='case-customer';
 const avatar=document.createElement('span');avatar.className='customer-monogram';avatar.textContent=(s.customerName||'?').slice(0,1).toUpperCase();
 const info=document.createElement('div'),label=document.createElement('span'),name=document.createElement('strong');label.textContent='CUSTOMER ACCESS';name.textContent=s.customerName;info.append(label,name);identity.append(avatar,info);head.prepend(identity);
 const layout=document.createElement('div');layout.className='case-layout';const main=document.createElement('div');main.className='case-evidence-column';main.id='case-evidence';const rail=document.createElement('aside');rail.className='case-decision-column';rail.id='case-decision';rail.setAttribute('aria-label','Next action and customer experience');
 const heading=document.createElement('div');heading.className='case-column-title';heading.innerHTML='<span class="eyebrow">CASE ESSENTIALS</span><h2>What matters for this decision.</h2><p>Check the purchase, decide the next step, and tell the customer when they will hear from you.</p>';
 main.append(heading);
 const summary=body.querySelector('.summary'),consent=body.querySelector('.consent'),actions=sheet.querySelector('.actionbar');
 if(summary)rail.append(summary);if(consent)rail.append(consent);if(actions)rail.append(actions);
 const experience=body.querySelector('.case-experience');
 if(experience){experience.querySelector('.case-progress')?.remove();const learner=experience.querySelector('.learner-preview');if(learner){const wrapper=document.createElement('details');wrapper.className='customer-preview-disclosure';const title=document.createElement('summary');title.textContent='Preview the customer’s experience';wrapper.append(title,learner);rail.append(wrapper);}}
 const sources=body.querySelector('.source-status')||body.querySelector('[aria-label="Case information sources"]');
 if(sources){const wrapper=document.createElement('details');wrapper.className='source-disclosure';const title=document.createElement('summary');title.textContent='Connection checks & freshness';wrapper.append(title,sources);main.append(wrapper);}
 while(body.firstChild)main.append(body.firstChild);
 layout.append(rail,main);
 const wayfinding=document.createElement('nav');wayfinding.className='case-wayfinding';wayfinding.setAttribute('aria-label','Case sections');wayfinding.innerHTML='<a href="#case-decision"><b>01</b> Decision</a><a href="#case-customer-updates"><b>02</b> Customer update</a><a href="#case-deep-evidence"><b>03</b> Full evidence</a>';
 const communication=document.createElement('section');communication.id='case-customer-updates';communication.className='case-communication-area';communication.innerHTML='<div class="case-communication-heading"><span class="eyebrow">02 / CUSTOMER UPDATE</span><h2>Keep the buyer in the loop.</h2><p>Set the next update and open the conversation when a reply is needed.</p></div>';
 body.append(wayfinding,layout,communication);
 // The compact progress stepper remains above the case; the longer journey lives in full evidence.
 for(const details of main.querySelectorAll(':scope > details.detail')){const title=details.querySelector('summary')?.textContent||'';if(title.startsWith('Purchase evidence')&&!s.review)details.open=true;}
}

// Keep the decision, three purchase facts, and customer update in the first
// reading path. The detailed instruments remain available without dominating it.
export function finishCaseLayout(root,s){
 const sheet=root.querySelector('.case-redesign'),main=sheet?.querySelector('.case-evidence-column'),layout=sheet?.querySelector('.case-layout'),communication=sheet?.querySelector('.case-communication-area');
 if(!main||!layout||!communication||!s)return;
 const exact=!!s.capture&&s.capture.status==='COMPLETED'&&s.capture.orderId===s.order.id&&s.capture.userId===s.order.userId&&s.capture.courseId===s.order.courseId&&s.capture.amount===s.order.amount&&s.capture.currency===s.order.currency;
 const access=!!s.entitlement?.active&&s.entitlement.userId===s.order.userId&&s.entitlement.courseId===s.order.courseId&&s.entitlement.captureId===s.capture?.id;
 const facts=document.createElement('section');facts.className='case-first-look';facts.setAttribute('aria-label','Three purchase facts');
 const source=s.capture?.source==='paypal-sandbox'?'PayPal sandbox':s.capture?'Sample record':'No capture';
 const items=[['Payment',s.capture?.status==='COMPLETED'?'Completed':'Not confirmed',source],['Purchase match',exact?'Exact fields agree':'Needs review','Order, learner, course, amount, currency'],['Purchased access',access?'Matching entitlement':'Missing or unconfirmed',s.proof?.passed?'Lesson proof recorded':'Protected lesson not yet proven']];
 for(const [label,value,detail] of items){const card=document.createElement('div');for(const [tag,className,content] of [['span','case-first-look-label',label],['strong','',value],['small','',detail]]){const node=document.createElement(tag);if(className)node.className=className;node.textContent=content;card.append(node);}facts.append(card);}
 const heading=main.querySelector('.case-column-title');
 if(heading){layout.before(heading,facts);}else layout.before(facts);
 const preview=main.querySelector('.diff');
 if(preview){const wrap=document.createElement('section');wrap.className='case-change-preview';wrap.setAttribute('aria-label','Exact correction preview');const heading=preview.previousElementSibling,note=preview.nextElementSibling;if(heading?.tagName==='H3')wrap.append(heading);wrap.append(preview);if(note?.classList.contains('footnote'))wrap.append(note);layout.querySelector('.case-decision-column').append(wrap);}
 const deep=document.createElement('details');deep.className='case-deep-dive';deep.id='case-deep-evidence';const title=document.createElement('summary');title.innerHTML='<span><strong>Inspect full evidence and audit</strong><small>Agent findings, source records, workflow, verification, and timeline</small></span><span aria-hidden="true">+</span>';deep.append(title);
 const handoff=sheet.querySelector('.clarity-handoff');if(handoff)deep.append(handoff);
 const chapter=sheet.querySelector('.sheet-body > .case-chapter');if(chapter)deep.append(chapter);
 const freshness=sheet.querySelector('.freshness-band');if(freshness)deep.append(freshness);
 const automation=sheet.querySelector('.sheet-body > .automation-card');if(automation)deep.append(automation);
 for(const child of [...main.children])if(!child.matches('.case-column-title,.case-first-look,.case-change-preview'))deep.append(child);
 const rail=layout.querySelector('.case-decision-column');
 for(const child of [...rail.children])if(child.matches('.story-brief-panel,.customer-preview-disclosure,.case-priority-panel,.exact-approval'))deep.append(child);
 for(const selector of ['.summary','.merchant-decision','.case-change-preview','.consent','.actionbar']){const child=rail.querySelector(':scope > '+selector);if(child)rail.append(child);}
 const decision=rail.querySelector(':scope > .merchant-decision');
 if(decision&&rail.querySelector(':scope > .summary')){
  // The summary already names the next step; keep this card about supporting facts.
  const eyebrow=decision.querySelector(':scope > .eyebrow'),heading=decision.querySelector(':scope > h2');
  if(eyebrow)eyebrow.textContent='SUPPORTING EVIDENCE';
  if(heading)heading.textContent='Why this step';
  decision.querySelector(':scope > p')?.remove();
 }
 if(preview)decision?.querySelector('.decision-change')?.remove();
 // Before a correction exists, the read-only next step can lead; once a
 // preview exists, supporting evidence remains ahead of consent and approval.
 if(!preview&&decision)rail.append(decision);
 const stepper=root.querySelector('.review-shell > .stepper');
 if(stepper){const steps=[...stepper.querySelectorAll(':scope > span')],active=steps.findIndex(step=>step.classList.contains('active'));if(active>=0){stepper.dataset.currentStep=`${active+1} of ${steps.length}`;stepper.setAttribute('aria-label',`Case progress: step ${active+1} of ${steps.length}, ${steps[active].textContent.trim()}`);}}
 main.append(communication);
 layout.after(deep);
 root.querySelector('.case-wayfinding a[href="#case-deep-evidence"]')?.addEventListener('click',()=>{deep.open=true;});
}
