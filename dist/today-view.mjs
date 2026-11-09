const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function reasonFor(group,row){
 const pattern=group.id==='verified'?/Verify/:group.id==='progress'?/Workflow|Source/:/Customer|Follow-up|Preview awaits|Payment change|Verify|Sandbox checkout complete|Purchased access is overdue|evidence|investigat/i;
 return (row.reasons||[]).find(reason=>pattern.test(reason))||row.reasons?.[0]||row.nextStep;
}

export function todayGroups(data){
 const rows=data.rows||[];
 const needs=rows.filter(row=>row.actionable&&(!row.workflowPending||row.reasons.some(reason=>/Customer|Follow-up/.test(reason))));
 const progress=rows.filter(row=>!needs.includes(row)&&row.workflowPending);
 const verified=rows.filter(row=>!needs.includes(row)&&row.verified);
 return [
  {id:'decision',label:'Needs your attention',detail:'Cases with a decision or follow-up',rows:needs},
  {id:'progress',label:'In progress',detail:'System work underway',rows:progress},
  {id:'verified',label:'Verified access',detail:'Current lesson proof',rows:verified}
 ];
}

function caseButton(row,group,busy,compact=false,rank=0){
 return `<button type="button" class="today-case${compact?' compact':''}${rank===1?' lead':''}" data-pulse-case="${esc(row.caseId)}" ${busy?'disabled':''}>${rank?`<span class="today-case-rank" aria-hidden="true">${String(rank).padStart(2,'0')}</span>`:''}<span class="today-case-main"><span class="today-case-name"><strong>${esc(row.customerName)}</strong>${row.origin?`<span class="case-origin-tag case-origin-tag-${esc(row.origin.kind)}">${esc(row.origin.label)}</span>`:''}</span><small>${esc(reasonFor(group,row))}</small></span><span class="today-case-action">Open case <span aria-hidden="true">↗</span></span></button>`;
}

function sideList(group,busy){
 return `<div class="today-snapshot-row"><div class="today-snapshot-heading"><strong>${group.label}</strong><span>${group.rows.length} ${group.rows.length===1?'case':'cases'}</span></div>${group.rows.length?group.rows.slice(0,2).map(row=>caseButton(row,group,busy,true)).join(''):`<p>${group.id==='progress'?'No system work running.':'No current lesson proof yet.'}</p>`}${group.rows.length>2?`<small>${group.rows.length-2} more in the full queue below</small>`:''}</div>`;
}

export function todayMarkup(data,{backend=true,operator=false,busy=false}={}){
 const groups=todayGroups(data),counts=data.counts;
 const [decision,progress,verified]=groups;
 const result=backend&&data.connectedResult;
 const spotlight=result?`<section class="today-result connected" aria-label="Connected recovery result"><div><span class="eyebrow">CONNECTED SANDBOX RESULT · ${esc(result.checksPassed)}/${esc(result.checksTotal)} CHECKS</span><h3>A paid learner regained access.</h3><p>Payment, model review, approval, recovery, and lesson proof are recorded for ${esc(result.customerName)}.</p><small>Technical access verified ${esc(new Date(result.verifiedAt).toLocaleString())}. Customer confirmation is separate.</small></div><button type="button" class="button primary" data-pulse-case="${esc(result.caseId)}" ${busy?'disabled':''}>Inspect verified case</button></section>`:`<details class="today-result pending" aria-label="Connected recovery status"><summary><strong>Full end-to-end proof pending</strong><span>View what a connected result requires</span></summary><p>${backend?'A full connected run needs a PayPal sandbox checkout, model review, approved correction, workflow run, and lesson check. A technical recovery can still be complete before every demo check is documented.':'This browser preview uses sample records. Connected proof appears only after a completed sandbox recovery.'}</p></details>`;
 const testProgress=`<section class="sandbox-test-progress" aria-label="Sandbox test progress"><span class="eyebrow">SANDBOX TEST PROGRESS</span><h3>Know what finished.</h3><div class="sandbox-test-stats"><div><strong>${esc(counts.checkoutComplete||0)}</strong><span>Checkouts completed</span></div><div><strong>${esc(counts.recoveriesCompleted||0)}</strong><span>Recoveries verified at least once</span></div><div><strong>${esc(counts.verified||0)}</strong><span>Current lesson proofs</span></div></div><p>A captured payment finishes checkout. A recovery finishes only after the protected lesson check passes. Older proof stays in history and may need a fresh recheck.</p></section>`;
 const lanes=groups.map((group,index)=>`<div class="today-lane ${group.id}"><span class="today-lane-step" aria-hidden="true">0${index+1}</span><strong class="today-count">${index===2?esc(counts.recoveriesCompleted||0):group.rows.length}</strong><span><b>${index===2?'Recoveries completed':group.label}</b><small>${index===2?'Lesson proof passed at least once':group.detail}</small></span></div>`).join('');
 const queue=decision.rows.length?decision.rows.slice(0,5).map((row,index)=>caseButton(row,decision,busy,false,index+1)).join(''):`<p class="today-queue-empty">Nothing needs your attention right now. Check the activity and full queue below for recent work.</p>`;
 const metrics=[['Promised updates due',counts.updatesDue||0],['Follow-ups due',counts.followupsDue],['Customers waiting',counts.customerWaiting],['Verify next',counts.verificationNeeded],['Access overdue',counts.overdueAccess]].map(([label,value])=>`<div><strong>${esc(value||0)}</strong><span>${label}</span></div>`).join('');
  return `<div class="today-head"><div class="today-head-copy"><span class="eyebrow">RECOVERY HEADQUARTERS · CURRENT WORKSPACE</span><h2>${decision.rows.length?`${decision.rows.length} ${decision.rows.length===1?'case needs':'cases need'} your next step.`:'Ready for a sandbox purchase.'}</h2><p>Decisions, work in progress, and access proof.</p><div class="today-demo-entry"><a href="store-demo.html">Run a PayPal sandbox test <span aria-hidden="true">→</span></a><span>Complete a test checkout to create a case · no live charge</span></div><small>Workspace checked ${esc(new Date(data.checkedAt).toLocaleString())}</small></div><div class="today-head-mark" aria-hidden="true"><span></span><span></span><span></span></div></div>
 <div class="today-lanes" role="group" aria-label="Recovery status at a glance">${lanes}</div>
 <div class="today-dashboard-grid"><section class="today-queue" aria-labelledby="today-queue-title"><div class="today-panel-head"><div><span class="eyebrow">YOUR WORKLIST</span><h3 id="today-queue-title">What needs you next</h3></div><span class="today-panel-count">${decision.rows.length} ${decision.rows.length===1?'case':'cases'}</span></div><div class="today-queue-list">${queue}</div>${decision.rows.length>5?`<p class="today-queue-more">${decision.rows.length-5} more in the full queue below.</p>`:''}</section>
 <div class="today-hq-side"><aside class="today-snapshot" aria-label="Other recovery activity"><div class="today-panel-head"><div><span class="eyebrow">OPERATIONS MONITOR</span><h3>Beyond the worklist</h3></div></div>${progress.rows.length||verified.rows.length?`${progress.rows.length?sideList(progress,busy):''}${verified.rows.length?sideList(verified,busy):''}`:'<p class="today-snapshot-quiet">No active runs or verified lesson proof. Start with the worklist.</p>'}<div class="today-snapshot-flags"><span><b>${esc(counts.updatesDue||0)}</b> updates due</span><span><b>${esc(counts.sourceIssues||0)}</b> source issues</span></div></aside><div class="today-secondary">${testProgress}${spotlight}</div></div></div>
 <details class="today-details"><summary>Explore full queue health</summary><div class="pulse-metrics">${metrics}</div><p>${esc(counts.verified||0)} of ${esc(counts.total||0)} outcomes verified · ${esc(counts.sourceIssues||0)} source issues · ${esc(counts.workflowIssues||0)} workflow issues</p>${operator?`<button class="button" data-pulse-export ${busy?'disabled':''}>Export queue CSV</button>`:''}</details><p class="pulse-footnote">Each case appears in one status group. This view never approves a correction or sends a customer message.</p>`;
}
