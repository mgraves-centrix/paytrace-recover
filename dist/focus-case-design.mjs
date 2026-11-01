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
