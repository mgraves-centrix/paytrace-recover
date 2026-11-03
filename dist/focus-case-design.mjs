// Present the existing controls in a focused layout; authorization stays on the server.
export function arrangeCase(root,s){
 const sheet=root.querySelector('.sheet'),body=sheet?.querySelector('.sheet-body');if(!body||!s)return;
 sheet.classList.add('case-redesign');
 const head=sheet.querySelector('.sheet-head'),identity=document.createElement('div');identity.className='case-customer';
 const avatar=document.createElement('span');avatar.className='customer-monogram';avatar.textContent=(s.customerName||'?').slice(0,1).toUpperCase();
 const info=document.createElement('div'),label=document.createElement('span'),name=document.createElement('strong');label.textContent='CUSTOMER ACCESS';name.textContent=s.customerName;info.append(label,name);identity.append(avatar,info);head.prepend(identity);
 const layout=document.createElement('div');layout.className='case-layout';const main=document.createElement('div');main.className='case-evidence-column';main.id='case-evidence';const rail=document.createElement('aside');rail.className='case-decision-column';rail.id='case-decision';rail.setAttribute('aria-label','Next action and customer experience');
 const heading=document.createElement('div');heading.className='case-column-title';heading.innerHTML='<span class="eyebrow">THE INVESTIGATION</span><h2>Evidence you can act on.</h2><p>Review the purchase, understand the recommendation, and keep the customer informed.</p>';
 main.append(heading);
 const summary=body.querySelector('.summary'),consent=body.querySelector('.consent'),actions=sheet.querySelector('.actionbar');
 if(summary)rail.append(summary);if(consent)rail.append(consent);if(actions)rail.append(actions);
 const experience=body.querySelector('.case-experience');
 if(experience){experience.querySelector('.case-progress')?.remove();const learner=experience.querySelector('.learner-preview');if(learner){const wrapper=document.createElement('details');wrapper.className='customer-preview-disclosure';const title=document.createElement('summary');title.textContent='Preview the customer’s experience';wrapper.append(title,learner);rail.append(wrapper);}}
 const sources=body.querySelector('.source-status')||body.querySelector('[aria-label="Case information sources"]');
 if(sources){const wrapper=document.createElement('details');wrapper.className='source-disclosure';const title=document.createElement('summary');title.textContent='Connection checks & freshness';wrapper.append(title,sources);main.append(wrapper);}
 while(body.firstChild)main.append(body.firstChild);
 layout.append(main,rail);
 const wayfinding=document.createElement('nav');wayfinding.className='case-wayfinding';wayfinding.setAttribute('aria-label','Case sections');wayfinding.innerHTML='<a href="#case-decision"><b>01</b> Decision</a><a href="#case-evidence"><b>02</b> Evidence</a><a href="#case-customer-updates"><b>03</b> Customer update</a>';
 const communication=document.createElement('section');communication.id='case-customer-updates';communication.className='case-communication-area';communication.innerHTML='<div class="case-communication-heading"><span class="eyebrow">03 / CUSTOMER UPDATE</span><h2>Keep the buyer in the loop.</h2><p>Set the next update, review the conversation, and share only what the evidence supports.</p></div>';
 body.append(wayfinding,layout,communication);
 const journey=main.querySelector('.access-journey');if(journey)head.append(journey);
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
 main.querySelector('.case-column-title')?.after(facts);
 const deep=document.createElement('details');deep.className='case-deep-dive';const title=document.createElement('summary');title.innerHTML='<span><strong>Explore full evidence and reports</strong><small>Source records, agent challenges, diagnosis map, proof, and timeline</small></span><span aria-hidden="true">+</span>';deep.append(title);
 const selectors=['.ci-flight-mount','.ci-disagreement','.breakpoint-map','.agent-workbench','.source-disclosure','.detail','.case-experience','.story-outcome-panel','.communication-timeline'];
 for(const child of [...main.children])if(selectors.some(selector=>child.matches(selector)))deep.append(child);
 main.append(deep);
 layout.after(communication);
}
