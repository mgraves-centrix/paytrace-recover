const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function reasonFor(group,row){
 const pattern=group.id==='verified'?/Verify/:group.id==='progress'?/Workflow|Source/:/Customer|Follow-up|Preview awaits|Payment change|Verify|Purchased access is overdue|evidence|investigat/i;
 return row.reasons.find(reason=>pattern.test(reason))||row.reasons[0]||row.nextStep;
}

export function todayGroups(data){
 const rows=data.rows||[];
 const needs=rows.filter(row=>row.actionable&&(!row.workflowPending||row.reasons.some(reason=>/Customer|Follow-up/.test(reason))));
 const progress=rows.filter(row=>!needs.includes(row)&&row.workflowPending);
 const verified=rows.filter(row=>!needs.includes(row)&&row.verified);
 return [
  {id:'decision',label:'Needs your attention',detail:'Decide, reply, or verify the next step',rows:needs},
  {id:'progress',label:'In progress',detail:'A system is working; check the result',rows:progress},
  {id:'verified',label:'Verified access',detail:'Current proof that the lesson opens',rows:verified}
 ];
}

function emptyFor(group){
 return group.id==='verified'?'No current lesson proof yet.':group.id==='progress'?'No system work in progress.':'Nothing needs your attention.';
}

export function todayMarkup(data,{backend=true,operator=false,busy=false}={}){
 const groups=todayGroups(data),counts=data.counts;
 const result=backend&&data.connectedResult;
 const spotlight=result?`<section class="today-result connected" aria-label="Connected recovery result"><div><span class="eyebrow">CONNECTED SANDBOX RESULT · ${esc(result.checksPassed)}/${esc(result.checksTotal)} CHECKS</span><h3>A paid learner regained access.</h3><p>PayPal sandbox payment, model review, merchant approval, Render recovery, and protected lesson proof are recorded for ${esc(result.customerName)}.</p><small>Technical access verified ${esc(new Date(result.verifiedAt).toLocaleString())}. Customer confirmation is separate.</small></div><button class="button primary" data-pulse-case="${esc(result.caseId)}" ${busy?'disabled':''}>Inspect the verified case →</button></section>`:`<section class="today-result pending" aria-label="Connected recovery status"><div><span class="eyebrow">CONNECTED RESULT · NOT YET RECORDED</span><h3>The recovery story is ready for its first connected case.</h3><p>${backend?'The cases below include demo records. Complete a PayPal sandbox checkout, model review, approved correction, Render run, and lesson check to show a connected result here.':'This browser preview uses sample records. Connected proof appears only in a server workspace after a completed sandbox recovery.'}</p></div></section>`;
 const lanes=groups.map(group=>{
  const cases=group.rows.length?group.rows.slice(0,3).map(row=>`<button class="today-case" data-pulse-case="${esc(row.caseId)}" ${busy?'disabled':''}><span><strong>${esc(row.customerName)}</strong><small>${esc(reasonFor(group,row))}</small></span><span aria-hidden="true">→</span></button>`).join(''):`<p class="today-empty">${emptyFor(group)}</p>`;
  return `<section class="today-lane ${group.id}"><div class="today-lane-head"><span class="today-count">${group.rows.length}</span><div><h3>${group.label}</h3><p>${group.detail}</p></div></div>${cases}${group.rows.length>3?`<small class="today-more">${group.rows.length-3} more in the recovery queue</small>`:''}</section>`;
 }).join('');
 const metrics=[['Promised updates due',counts.updatesDue||0],['Follow-ups due',counts.followupsDue],['Customers waiting',counts.customerWaiting],['Verify next',counts.verificationNeeded],['Access overdue',counts.overdueAccess]].map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('');
 return `${spotlight}<div class="today-head"><div><span class="eyebrow">RECOVERY AT A GLANCE</span><h2>Know what needs you next.</h2><p>${backend?'Current workspace records':'Sample browser records'} · ${esc(new Date(data.checkedAt).toLocaleString())}</p></div><button class="button" data-pulse-refresh ${busy?'disabled':''}>Refresh</button></div><div class="today-lanes">${lanes}</div><details class="today-details"><summary>Explore full queue health</summary><div class="pulse-metrics">${metrics}</div><p>${counts.verified} of ${counts.total} outcomes verified · ${counts.sourceIssues} source issues · ${counts.workflowIssues} workflow issues</p>${operator?`<button class="button" data-pulse-export ${busy?'disabled':''}>Export queue CSV</button>`:''}</details><p class="pulse-footnote">Each case appears in one group. This view never approves a correction or sends a customer message.</p>`;
}
