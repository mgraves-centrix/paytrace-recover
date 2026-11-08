export function activityKind(text=''){
 const value=String(text).toLowerCase();
 if(/message|customer|email|reminder|reply/.test(value))return 'customer';
 if(/approval|approved|rehears|preview/.test(value))return 'decision';
 if(/verification|verified|lesson|access grant|repaired|repair/.test(value))return 'access';
 if(/payment|capture|checkout|purchase/.test(value))return 'payment';
 if(/review|investigat|evidence|objection|specialist|challenge/.test(value))return 'review';
 return 'other';
}

let activityQuery='',activityFilter='all';
export function mountActivityTools(root){
 const page=root.querySelector('.activity-page'),feed=page?.querySelector('.activity-feed');if(!feed)return;
 const rows=[...feed.querySelectorAll('.activity-event')];
 const caseIds=new Set(rows.map(row=>row.dataset.case).filter(Boolean));
 const overview=document.createElement('section');overview.className='activity-overview';
 overview.innerHTML='<div class="activity-overview-copy"><span class="eyebrow">THE RECOVERY RECORD</span><h2>Every decision leaves a trace.</h2><p>Trace payment, investigation, approval, and access checks. Open any event to inspect its case.</p><span class="activity-honesty">Recorded workspace events only · sample events remain labeled</span></div><div class="activity-overview-stats"><div><strong data-activity-total></strong><span>Recorded events</span></div><div><strong data-activity-cases></strong><span>Cases in this view</span></div></div>';
 overview.querySelector('[data-activity-total]').textContent=rows.length;
 overview.querySelector('[data-activity-cases]').textContent=caseIds.size;
 page.before(overview);
 page.querySelector('.section-head h2').textContent='Event history';
 const labels={payment:'Payment',review:'Investigation',decision:'Decision',access:'Access check',customer:'Customer',other:'Case update'};
 for(const row of rows){const badge=document.createElement('span');badge.className='activity-kind';badge.textContent=labels[row.dataset.activityKind]||labels.other;row.insertBefore(badge,row.lastElementChild);}
 const tools=document.createElement('div');tools.className='activity-tools';
 tools.innerHTML='<label>Find an event<input type="search" placeholder="Customer, case, or event" aria-label="Search activity"></label><label>Type<select aria-label="Filter activity"><option value="all">All activity</option><option value="payment">Payment</option><option value="review">Investigation</option><option value="decision">Decision</option><option value="access">Access & verification</option><option value="customer">Customer</option><option value="other">Other</option></select></label><span class="activity-results" role="status"></span>';
 feed.before(tools);const empty=document.createElement('p');empty.className='activity-empty';empty.textContent='No events match these filters. Clear the search or choose All activity.';empty.hidden=true;feed.after(empty);
 const search=tools.querySelector('input'),filter=tools.querySelector('select'),count=tools.querySelector('[role=status]');search.value=activityQuery;filter.value=activityFilter;
 const draw=()=>{const query=search.value.trim().toLowerCase();let visible=0;for(const row of rows){row.hidden=!!((filter.value!=='all'&&row.dataset.activityKind!==filter.value)||(query&&!row.textContent.toLowerCase().includes(query)));if(!row.hidden)visible++;}count.textContent=`${visible} of ${rows.length} events shown`;empty.hidden=visible>0||rows.length===0;};
 search.addEventListener('input',()=>{activityQuery=search.value;draw();});filter.addEventListener('change',()=>{activityFilter=filter.value;draw();});draw();
}
