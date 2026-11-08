import {checks,fingerprint,reviewIsCurrent} from './core.mjs';
import {proofIsCurrent} from './operations.mjs';
import {caseAgentSummary} from './focus-case-review.mjs';
import {caseOrigin} from './focus-model.mjs';

const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function recoveryReadiness(s,{uncertain=false,backend=false}={}){
 const purchase=checks(s).slice(0,5).every(item=>item.ok)&&s.evidenceAvailable!==false&&s.sources?.payment?.status!=='unavailable';
 const access=s.sources?.access?.status!=='unavailable'&&(!backend||s.sources?.access?.status==='available')&&!s.entitlement?.active;
 const review=reviewIsCurrent(s)&&(!backend||s.review?.mode==='model');
 const objections=review&&s.review?.outcome==='ready'&&!s.review?.objections?.some(item=>item.status==='open');
 const preview=!!s.rehearsal&&s.rehearsal.passed===true&&s.rehearsal.fingerprint===fingerprint(s);
 const approval=preview&&s.approval?.planId===s.rehearsal.id&&s.approval.fingerprint===s.rehearsal.fingerprint;
 return [
  {label:'Payment matches this purchase',ok:purchase,detail:purchase?'Completed capture and exact purchase fields agree':'Confirm the completed capture and purchase fields'},
  {label:'Missing access confirmed',ok:access,detail:access?'Course access is inactive':'Refresh the course access record'},
  {label:s.review?.mode==='model'||backend?'AI review supports a correction':'Specialist review supports a preview',ok:objections,detail:review?objections?'No open objection':'Resolve the review objection before a grant':backend?'Run a current model review':'Run the sample specialist review'},
  {label:'Exact correction previewed',ok:preview,detail:preview?'One purchase-bound access change':'Preview the customer, course, and change'},
  {label:'Merchant authorization recorded',ok:approval,detail:approval?s.approval?.mode==='policy'?'Authorized by the enabled merchant policy':'Approved for this exact preview':'Approve this preview or use an enabled merchant policy'}
 ].map(item=>({...item,ok:item.ok&&!uncertain,detail:uncertain?'Refresh current status before relying on this check':item.detail}));
}

export function readinessMarkup(s,options={}){
 const steps=recoveryReadiness(s,options),passed=steps.filter(item=>item.ok).length,source=s.capture?.source==='paypal-sandbox'?'PayPal sandbox':s.capture?'Sample payment':'Payment not confirmed';
 const sample=options.backend&&source==='Sample payment';
 return `<section class="case-readiness" aria-label="Recovery readiness"><div class="case-readiness-head"><span class="eyebrow">DECISION CHECKLIST · ${esc(source)}</span><strong>${options.uncertain?'Refresh current status':sample?'Illustrative case · not connected':passed===steps.length?'Authorization recorded · final checks remain':`${passed} of ${steps.length} checks ready`}</strong>${sample?'<small>Sample records show the decision path. A PayPal sandbox case is needed for connected proof.</small>':passed===steps.length?'<small>The server rereads payment and access before any grant.</small>':''}</div><ol>${steps.map(item=>`<li class="${item.ok?'ready':'waiting'}"><span aria-hidden="true">${item.ok?'✓':'·'}</span><div><strong>${esc(item.label)}</strong><small>${esc(item.detail)}</small></div></li>`).join('')}</ol><a href="#case-deep-evidence" data-open-case-evidence>Inspect the supporting records ↗</a></section>`;
}

export function outcomeSummaryMarkup(s,{uncertain=false}={}){
 if(uncertain||!proofIsCurrent(s)||s.evidenceAvailable===false||Object.values(s.sources||{}).some(source=>source?.status==='unavailable'))return '';
 const source=s.capture?.source==='paypal-sandbox'?'PayPal sandbox':'Sample payment',change=s.writes===0?'No access change needed':s.writes===1?'One approved access grant recorded':`${s.writes} access writes recorded`;
 const checked=s.proof?.at&&Number.isFinite(Date.parse(s.proof.at))?new Date(s.proof.at).toLocaleString():'time unavailable';
 return `<section class="case-outcome-summary" aria-label="Verified recovery summary"><span class="eyebrow">TECHNICAL OUTCOME · ${esc(source)}</span><h3>Access checked and available</h3><p>The saved payment, purchased entitlement, and protected lesson check agree.</p><dl><div><dt>Original issue</dt><dd>${s.writes===0?'Reported access problem; the course service restored access before a PayTrace grant.':'Paid purchase; digital access was missing.'}</dd></div><div><dt>Correction</dt><dd>${esc(change)}</dd></div><div><dt>Lesson proof</dt><dd>Protected lesson opened in the technical check · ${esc(checked)}</dd></div><div><dt>Customer</dt><dd>Ask the buyer to open it on their device; confirmation is separate.</dd></div></dl><a href="#case-customer-updates">See the customer update ↗</a></section>`;
}

// Present the existing controls in a focused layout; authorization stays on the server.
export function arrangeCase(root,s){
 document.body.classList.toggle('focus-case-open',!!s);
 const sheet=root.querySelector('.sheet'),body=sheet?.querySelector('.sheet-body');if(!body||!s)return;
 sheet.classList.add('case-redesign');
 const head=sheet.querySelector('.sheet-head'),identity=document.createElement('div');identity.className='case-customer';
 const avatar=document.createElement('span');avatar.className='customer-monogram';avatar.textContent=(s.customerName||'?').slice(0,1).toUpperCase();
 const info=document.createElement('div'),label=document.createElement('span'),name=document.createElement('strong');label.textContent='CUSTOMER ACCESS';name.textContent=s.customerName;info.append(label,name);identity.append(avatar,info);head.prepend(identity);
 const origin=caseOrigin(s,{backend:globalThis.window?.COURSELATCH_RUNTIME?.backend===true});
 const originBand=document.createElement('div');originBand.className=`case-origin case-origin-${origin.kind}`;originBand.setAttribute('aria-label','Case origin');
 const originName=document.createElement('strong'),originDetail=document.createElement('span');originName.textContent=origin.label;originDetail.textContent=origin.detail;originBand.append(originName,originDetail);
 head.querySelector('.case-meta')?.after(originBand);
 const layout=document.createElement('div');layout.className='case-layout';const main=document.createElement('div');main.className='case-evidence-column';main.id='case-evidence';const rail=document.createElement('aside');rail.className='case-decision-column';rail.id='case-decision';rail.setAttribute('aria-label','Next action and customer experience');
 const heading=document.createElement('div');heading.className='case-column-title';heading.innerHTML='<span class="eyebrow">PURCHASE EVIDENCE</span><h2>The facts behind the next step</h2>';
 main.append(heading);
 const summary=body.querySelector('.summary'),consent=body.querySelector('.consent'),actions=sheet.querySelector('.actionbar');
 if(summary)rail.append(summary);if(consent)rail.append(consent);if(actions)rail.append(actions);
 const experience=body.querySelector('.case-experience');
 if(experience){experience.querySelector('.case-progress')?.remove();const learner=experience.querySelector('.learner-preview');if(learner){const wrapper=document.createElement('details');wrapper.className='customer-preview-disclosure';const title=document.createElement('summary');title.textContent='Preview the customer’s experience';wrapper.append(title,learner);rail.append(wrapper);}}
 const sources=body.querySelector('.source-status')||body.querySelector('[aria-label="Case information sources"]');
 if(sources){const wrapper=document.createElement('details');wrapper.className='source-disclosure';const title=document.createElement('summary');title.textContent='Connection checks & freshness';wrapper.append(title,sources);main.append(wrapper);}
 while(body.firstChild)main.append(body.firstChild);
 layout.append(rail,main);
 const wayfinding=document.createElement('nav');wayfinding.className='case-wayfinding';wayfinding.setAttribute('aria-label','Jump to case sections');wayfinding.innerHTML='<a href="#case-decision"><b>01</b> Next action</a><a href="#case-evidence"><b>02</b> Evidence & agents</a><a href="#case-customer-updates"><b>03</b> Conversation</a><a href="#case-deep-evidence"><b>04</b> Full record</a>';
 const communication=document.createElement('section');communication.id='case-customer-updates';communication.className='case-communication-area';communication.innerHTML='<div class="case-communication-heading"><span class="eyebrow">CUSTOMER CONVERSATION</span><h2>Keep the buyer informed.</h2><p>Review the latest reply, set a progress update, or send a message.</p></div>';
 const customerCard=document.createElement('section');customerCard.className='case-customer-card';customerCard.setAttribute('aria-label','Customer conversation status');
 const customerLabel=document.createElement('span');customerLabel.className='eyebrow';customerLabel.textContent='CUSTOMER CONVERSATION';
 const customerStatus=document.createElement('strong');customerStatus.className='case-customer-status';customerStatus.textContent='Checking for customer updates…';
 const customerDetail=document.createElement('p');customerDetail.className='case-customer-detail';customerDetail.textContent='Messages and the next update are recorded with this case.';
 const customerLink=document.createElement('a');customerLink.href='#case-customer-updates';customerLink.className='case-customer-link';customerLink.textContent='Open conversation ↗';
 customerCard.append(customerLabel,customerStatus,customerDetail,customerLink);rail.append(customerCard);
 customerLink.addEventListener('click',()=>{const thread=root.querySelector('.case-conversation-disclosure');if(thread)thread.open=true;});
 body.append(wayfinding,layout,communication);
 // The compact progress stepper remains above the case; the longer journey lives in full evidence.
 for(const details of main.querySelectorAll(':scope > details.detail')){const title=details.querySelector('summary')?.textContent||'';if(title.startsWith('Purchase evidence')&&!s.review)details.open=true;}
}

// Keep the decision, three purchase facts, and customer update in the first
// reading path. The detailed instruments remain available without dominating it.
export function finishCaseLayout(root,s,{uncertain=false,backend=false}={}){
 const sheet=root.querySelector('.case-redesign'),main=sheet?.querySelector('.case-evidence-column'),layout=sheet?.querySelector('.case-layout'),communication=sheet?.querySelector('.case-communication-area');
 if(!main||!layout||!communication||!s)return;
 const exact=!!s.capture&&s.capture.status==='COMPLETED'&&s.capture.orderId===s.order.id&&s.capture.userId===s.order.userId&&s.capture.courseId===s.order.courseId&&s.capture.amount===s.order.amount&&s.capture.currency===s.order.currency;
 const access=!!s.entitlement?.active&&s.entitlement.userId===s.order.userId&&s.entitlement.courseId===s.order.courseId&&s.entitlement.captureId===s.capture?.id;
 const facts=document.createElement('section');facts.className='case-first-look';facts.setAttribute('aria-label','Three purchase facts');
 const source=s.capture?.source==='paypal-sandbox'?'PayPal sandbox':s.capture?'Sample record':'No capture';
 const items=[['Payment',s.capture?.status==='COMPLETED'?'Completed':'Not confirmed',source],['Purchase match',exact?'Exact fields agree':'Needs review','Order, learner, course, amount, currency'],['Purchased access',access?'Matching entitlement':'Missing or unconfirmed',s.proof?.passed?'Lesson proof recorded':'Protected lesson not yet proven']];
 for(const [label,value,detail] of items){const card=document.createElement('div');for(const [tag,className,content] of [['span','case-first-look-label',label],['strong','',value],['small','',detail]]){const node=document.createElement(tag);if(className)node.className=className;node.textContent=content;card.append(node);}facts.append(card);}
 const heading=main.querySelector('.case-column-title');
 main.prepend(facts);
 if(heading)main.prepend(heading);
 const agents=caseAgentSummary(s);
 if(agents)facts.insertAdjacentHTML('afterend',agents);
 const preview=main.querySelector('.diff');
 if(preview){const wrap=document.createElement('section');wrap.className='case-change-preview';wrap.setAttribute('aria-label','Exact correction preview');const heading=preview.previousElementSibling,note=preview.nextElementSibling;if(heading?.tagName==='H3')wrap.append(heading);wrap.append(preview);if(note?.classList.contains('footnote'))wrap.append(note);layout.querySelector('.case-decision-column').append(wrap);}
 const deep=document.createElement('details');deep.className='case-deep-dive';deep.id='case-deep-evidence';const title=document.createElement('summary');title.innerHTML='<span><strong>Inspect full evidence and audit</strong><small>Agent findings, source records, workflow, verification, and timeline</small></span><span aria-hidden="true">+</span>';deep.append(title);
 const handoff=sheet.querySelector('.clarity-handoff');if(handoff)deep.append(handoff);
 const chapter=sheet.querySelector('.sheet-body > .case-chapter');if(chapter)deep.append(chapter);
 const freshness=sheet.querySelector('.freshness-band');if(freshness)deep.append(freshness);
 const automation=sheet.querySelector('.sheet-body > .automation-card');if(automation)deep.append(automation);
 for(const child of [...main.children])if(!child.matches('.case-column-title,.case-first-look,.case-agent-summary,.case-change-preview'))deep.append(child);
 const rail=layout.querySelector('.case-decision-column');
 for(const child of [...rail.children])if(child.matches('.story-brief-panel,.customer-preview-disclosure,.case-priority-panel,.exact-approval'))deep.append(child);
 for(const selector of ['.summary','.merchant-decision','.case-change-preview','.consent','.actionbar']){const child=rail.querySelector(':scope > '+selector);if(child)rail.append(child);}
 const decision=rail.querySelector(':scope > .merchant-decision');
 if(!s.review)rail.querySelector(':scope > .summary > p')?.remove();
 // Keep the full recommendation and its objections together for inspection.
 // The primary column only needs the readiness result and next action.
 if(decision)deep.append(decision);
 const outcome=outcomeSummaryMarkup(s,{uncertain});
 const summary=rail.querySelector(':scope > .summary');
 if(outcome)rail.insertAdjacentHTML('afterbegin',outcome);
 else{
  const steps=recoveryReadiness(s,{uncertain,backend}),passed=steps.filter(item=>item.ok).length;
  const count=uncertain?'Refresh current status':`${passed} of ${steps.length} decision checks ready`;
  if(summary)summary.insertAdjacentHTML('afterend',`<div class="case-gate-summary"><span>${esc(count)}</span><a href="#case-deep-evidence" data-open-case-evidence>Inspect checks ↗</a></div>`);
  deep.insertAdjacentHTML('beforeend',readinessMarkup(s,{uncertain,backend}));
 }
 // Turn the long technical appendix into four browsable dossiers. Move the
 // existing controls and records rather than recreating their behavior.
 const dossier=document.createElement('div');dossier.className='case-record-intro';
 dossier.innerHTML='<span class="eyebrow">CASE RECORD</span><h2>Follow the proof from payment to outcome.</h2><p>Open a section to inspect the saved records, agent reasoning, and audit trail. A recommendation never replaces merchant approval or a fresh access check.</p>';
 title.after(dossier);
 const groups=[
  ['01','Evidence & decision gates','Payment, purchase match, access, and source freshness',false,'.case-readiness,.source-disclosure,.detail,.breakpoint-map,.freshness-band,.access-journey'],
  ['02','AI investigation','Specialist findings, challenges, and recommendation',false,'.clarity-specialists,.ci-disagreement,.agent-workbench,.story-brief-panel:not(.story-outcome-panel),.merchant-decision'],
  ['03','Recovery & verification','Workflow stages, technical proof, and measured outcome',false,'.automation-card,.access-promise,.ci-flight-mount,.case-experience,.story-outcome-panel'],
  ['04','Audit & customer context','Case history, priority, customer view, and next update',false,'.communication-timeline,.case-priority-panel,.customer-preview-disclosure,.clarity-handoff,.case-chapter']
 ];
 const groupNodes=[];
 for(const [number,label,description,open,selectors] of groups){
  const group=document.createElement('details');group.className='case-record-group';group.open=open;
  const heading=document.createElement('summary');heading.innerHTML=`<span class="case-record-number">${number}</span><span class="case-record-label"><strong>${label}</strong><small>${description}</small></span><span class="case-record-chevron" aria-hidden="true"></span>`;
  group.append(heading);
  for(const selector of selectors.split(','))for(const child of [...deep.children])if(child!==title&&child!==dossier&&child.matches(selector))group.append(child);
  if(group.children.length>1){deep.append(group);groupNodes.push([group,selectors]);}
 }
 // The activity stream and chapter can mount after the first render. Keep
 // late records in their named section without disturbing an open dossier.
 if(typeof MutationObserver!=='undefined'){
  const observer=new MutationObserver(()=>{
   if(!deep.isConnected){observer.disconnect();return;}
   for(const child of [...deep.children])if(child!==title&&child!==dossier&&!child.classList.contains('case-record-group')){
    const match=groupNodes.find(([,selectors])=>child.matches(selectors));
    if(match){if(child.matches('.communication-timeline'))match[0].querySelector('summary').after(child);else match[0].append(child);}
   }
  });observer.observe(deep,{childList:true});
 }
 // Before any correction is previewed, the safe next action belongs directly
 // below the decision so it remains visible without scrolling.
 if(!s.rehearsal&&summary){const action=rail.querySelector(':scope > .actionbar');if(action)summary.after(action);}
 const customerCard=rail.querySelector(':scope > .case-customer-card');if(customerCard)rail.append(customerCard);
 const stepper=root.querySelector('.review-shell > .stepper');
 if(stepper){const steps=[...stepper.querySelectorAll(':scope > span')],active=steps.findIndex(step=>step.classList.contains('active'));if(active>=0){stepper.dataset.currentStep=`${active+1} of ${steps.length}`;stepper.setAttribute('aria-label',`Case progress: step ${active+1} of ${steps.length}, ${steps[active].textContent.trim()}`);steps.forEach((step,index)=>{if(index===active)step.setAttribute('aria-current','step');else step.removeAttribute?.('aria-current');step.classList.toggle('completed',index<active);});}}
 layout.after(communication);
 communication.after(deep);
 const sectionLinks=[...root.querySelectorAll('.case-wayfinding a')];
 if(sectionLinks.length){const target=sectionLinks.find(link=>link.hash===window.location.hash)||sectionLinks[0];sectionLinks.forEach(link=>{if(link===target)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');link.addEventListener('click',()=>{sectionLinks.forEach(item=>item.removeAttribute('aria-current'));link.setAttribute('aria-current','location');});});}
 root.querySelector('.case-wayfinding a[href="#case-deep-evidence"]')?.addEventListener('click',()=>{deep.open=true;});
 root.querySelectorAll('[data-open-case-evidence]').forEach(link=>link.addEventListener('click',()=>{deep.open=true;const first=deep.querySelector('.case-record-group');if(first)first.open=true;}));
}
