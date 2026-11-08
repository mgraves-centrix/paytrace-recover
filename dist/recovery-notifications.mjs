const labels={
 'customer-response':'Customer reply',
 'payment-review':'Payment changed',
 'verification-failed':'Verification failed',
 'customer-update-due':'Promised update due',
 'approval-needed':'Approval needed',
 overdue:'Paid access overdue',
 escalation:'Manager escalation',
 'reminder-due':'Internal reminder due',
 'follow-up':'Scheduled follow-up'
};

const nextSteps={
 'customer-response':'Read and answer the customer.',
 'payment-review':'Check the latest payment before any access change.',
 'verification-failed':'Inspect the failed check and refresh evidence.',
 'customer-update-due':'Post the promised progress update.',
 'approval-needed':'Inspect the exact preview before deciding.',
 overdue:'Check payment and course access.',
 escalation:'Assign a manager to review the case.',
 'reminder-due':'Review the case and your reminder.',
 'follow-up':'Check the case and follow-up history.'
};

const priority=['customer-response','payment-review','verification-failed','customer-update-due','approval-needed','escalation','overdue','reminder-due','follow-up'];

export function notificationCaseHref(caseId){return 'focus.html?caseId='+encodeURIComponent(caseId);}
export function notificationLabel(kind){return labels[kind]||String(kind).replaceAll('-',' ');}
export function notificationNextStep(kind){return nextSteps[kind]||'Open the case to review its current state.';}
export function notificationGroups(items){
 const groups=new Map();
 for(const item of items){if(!groups.has(item.kind))groups.set(item.kind,[]);groups.get(item.kind).push(item);}
 return [...groups].sort(([a],[b])=>{
  const left=priority.indexOf(a),right=priority.indexOf(b);
  return (left<0?priority.length:left)-(right<0?priority.length:right);
 }).map(([kind,alerts])=>({kind,alerts,caseCount:new Set(alerts.map(alert=>alert.caseId)).size,unread:alerts.filter(alert=>!alert.readAt).length}));
}
