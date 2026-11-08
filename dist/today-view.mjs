const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function reasonFor(group,row){
 const pattern=group.id==='verified'?/Verify/:group.id==='progress'?/Workflow|Source/:/Customer|Follow-up|Preview awaits|Payment change|Verify|Purchased access is overdue|evidence|investigat/i;
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

function caseButton(row,group,busy,compact=false){
 return `<button type="button" class="today-case${compact?' compact':''}" data-pulse-case="${esc(row.caseId)}" ${busy?'disabled':''}><span class="today-case-main"><strong>${esc(row.customerName)}</strong><small>${esc(reasonFor(group,row))}</small></span><span class="today-case-action">Open case <span aria-hidden="true">↗</span></span></button>`;
}

function sideList(group,busy){
 return `<div class="today-snapshot-row"><div class="today-snapshot-heading"><strong>${group.label}</strong><span>${group.rows.length} ${group.rows.length===1?'case':'cases'}</span></div>${group.rows.length?group.rows.slice(0,2).map(row=>caseButton(row,group,busy,true)).join(''):`<p>${group.id==='progress'?'No system work running.':'No current lesson proof yet.'}</p>`}${group.rows.length>2?`<small>${group.rows.length-2} more in the full queue below</small>`:''}</div>`;
}

export function todayMarkup(data,{backend=true,operator=false,busy=false}={}){
 const groups=todayGroups(data),counts=data.counts;
 const [decision,progress,verified]=groups;
 const result=backend&&data.connectedResult;
 const spotlight=result?`<section class="today-result connected" aria-label="Connected recovery result"><div><span class="eyebrow">CONNECTED SANDBOX RESULT · ${esc(result.checksPassed)}/${esc(result.checksTotal)} CHECKS</span><h3>A paid learner regained access.</h3><p>Payment, model review, approval, recovery, and lesson proof are recorded for ${esc(result.customerName)}.</p><small>Technical access verified ${esc(new Date(result.verifiedAt).toLocaleString())}. Customer confirmation is separate.</small></div><button type="button" class="button primary" data-pulse-case="${esc(result.caseId)}" ${busy?'disabled':''}>Inspect verified case</button></section>`:`<details class="today-result pending" aria-label="Connected recovery status"><summary><strong>No connected recovery verified</strong><span>View what a connected result requires</span></summary><p>${backend?'Complete a PayPal sandbox checkout, model review, approved correction, workflow run, and lesson check to record a connected result.':'This browser preview uses sample records. Connected proof appears only after a completed sandbox recovery.'}</p></details>`;
 const sample=result?'':`<section class="sample-success" aria-label="Fictional completed sample"><div><span class="eyebrow">FICTIONAL COMPLETED SAMPLE · NO PROVIDER CALLS</span><h3>Inspect a sample outcome</h3><p>Follow Maya from a sample purchase through approval, one access grant, lesson proof, and her separate confirmation. This does not count as a connected result.</p></div><a class="button" href="demo.html?step=7">Open completed sample</a></section>`;
 const lanes=groups.map(group=>`<div class="today-lane ${group.id}"><strong class="today-count">${group.rows.length}</strong><span><b>${group.label}</b><small>${group.detail}</small></span></div>`).join('');
 const queue=decision.rows.length?decision.rows.slice(0,5).map(row=>caseButton(row,decision,busy)).join(''):`<p class="today-queue-empty">Nothing needs your attention right now. Check the activity and full queue below for recent work.</p>`;
 const metrics=[['Promised updates due',counts.updatesDue||0],['Follow-ups due',counts.followupsDue],['Customers waiting',counts.customerWaiting],['Verify next',counts.verificationNeeded],['Access overdue',counts.overdueAccess]].map(([label,value])=>`<div><strong>${esc(value||0)}</strong><span>${label}</span></div>`).join('');
 return `<div class="today-head"><div><span class="eyebrow">WORKSPACE DASHBOARD</span><h2>Recovery overview</h2><p>${backend?'Current workspace records':'Sample browser records'} · ${esc(new Date(data.checkedAt).toLocaleString())}</p></div></div>
 <div class="today-lanes" role="group" aria-label="Recovery status at a glance">${lanes}</div>
 <div class="today-dashboard-grid"><section class="today-queue" aria-labelledby="today-queue-title"><div class="today-panel-head"><div><span class="eyebrow">PRIORITY QUEUE</span><h3 id="today-queue-title">What needs you next</h3></div><span class="today-panel-count">${decision.rows.length} ${decision.rows.length===1?'case':'cases'}</span></div><div class="today-queue-list">${queue}</div>${decision.rows.length>5?`<p class="today-queue-more">${decision.rows.length-5} more in the full queue below.</p>`:''}</section>
 <aside class="today-snapshot" aria-label="Other recovery activity"><div class="today-panel-head"><div><span class="eyebrow">LIVE STATUS</span><h3>Beyond the queue</h3></div></div>${sideList(progress,busy)}${sideList(verified,busy)}<div class="today-snapshot-flags"><span><b>${esc(counts.updatesDue||0)}</b> updates due</span><span><b>${esc(counts.sourceIssues||0)}</b> source issues</span></div></aside></div>
 <div class="today-secondary">${spotlight}${sample}</div><details class="today-details"><summary>Explore full queue health</summary><div class="pulse-metrics">${metrics}</div><p>${esc(counts.verified||0)} of ${esc(counts.total||0)} outcomes verified · ${esc(counts.sourceIssues||0)} source issues · ${esc(counts.workflowIssues||0)} workflow issues</p>${operator?`<button class="button" data-pulse-export ${busy?'disabled':''}>Export queue CSV</button>`:''}</details><p class="pulse-footnote">Each case appears in one status group. This view never approves a correction or sends a customer message.</p>`;
}
