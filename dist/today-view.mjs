const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reasonFor=(group,row)=>row.reasons.find(reason=>group.id==='customer'?/Customer|Follow-up/.test(reason):group.id==='verification'?/Verify/.test(reason):/Preview awaits|Payment change|Source check|Workflow needs|Purchased access is overdue|evidence|investigat/i.test(reason))||row.reasons[0]||row.nextStep;

export function todayGroups(data){
 const rows=data.rows||[];
 const waiting=rows.filter(r=>r.reasons.some(reason=>/Customer replied|Customer still needs help|Follow-up is due|Customer update/.test(reason)));
 const verifying=rows.filter(r=>r.reasons.includes('Verify access without another grant'));
 const decisions=rows.filter(r=>r.actionable&&(r.reasons.some(reason=>/Preview awaits|Payment change|Source check|Workflow needs|Purchased access is overdue|evidence|investigat/i.test(reason))||(!waiting.includes(r)&&!verifying.includes(r))));
 return [
  {id:'decision',label:'Decisions to make',detail:'Review evidence or approve an exact preview',rows:decisions},
  {id:'customer',label:'Customers waiting',detail:'Reply or deliver the next promised update',rows:waiting},
  {id:'verification',label:'Outcomes to verify',detail:'Check payment, entitlement, and lesson',rows:verifying}
 ];
}

export function todayMarkup(data,{backend=true,operator=false,busy=false}={}){
 const groups=todayGroups(data),c=data.counts;
 return `<div class="today-head"><div><span class="eyebrow">TODAY IN RECOVERY</span><h2>Three things to keep moving.</h2><p>${backend?'Current workspace records':'Sample browser records'} · ${esc(new Date(data.checkedAt).toLocaleString())}</p></div><button class="button" data-pulse-refresh ${busy?'disabled':''}>Refresh</button></div><div class="today-lanes">${groups.map(group=>`<section class="today-lane ${group.id}"><div class="today-lane-head"><span class="today-count">${group.rows.length}</span><div><h3>${group.label}</h3><p>${group.detail}</p></div></div>${group.rows.length?group.rows.slice(0,3).map(row=>`<button class="today-case" data-pulse-case="${esc(row.caseId)}" ${busy?'disabled':''}><span><strong>${esc(row.customerName)}</strong><small>${esc(reasonFor(group,row))}</small></span><span aria-hidden="true">→</span></button>`).join(''):'<p class="today-empty">All clear here.</p>'}${group.rows.length>3?`<small class="today-more">${group.rows.length-3} more in the recovery queue</small>`:''}</section>`).join('')}</div><details class="today-details"><summary>Explore full queue health</summary><div class="pulse-metrics">${[['Promised updates due',c.updatesDue||0],['Follow-ups due',c.followupsDue],['Customers waiting',c.customerWaiting],['Verify next',c.verificationNeeded],['Access overdue',c.overdueAccess]].map(([label,value])=>`<div><strong>${value}</strong><span>${label}</span></div>`).join('')}</div><p>${c.verified} of ${c.total} outcomes verified · ${c.sourceIssues} source issues · ${c.workflowIssues} workflow issues</p>${operator?`<button class="button" data-pulse-export ${busy?'disabled':''}>Export queue CSV</button>`:''}</details><p class="pulse-footnote">A case may appear in more than one group. This view never approves a correction or sends a customer message.</p>`;
}
