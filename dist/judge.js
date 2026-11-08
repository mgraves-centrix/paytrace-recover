const flags=window.COURSELATCH_RUNTIME||{};
const checks=[
 ['Workspace',flags.backend?'Node backend configured':'Browser simulation'],
 ['Merchant identity',flags.authRequired?'Verified sign-in required':'Demo workspace'],
 ['PayPal sandbox',flags.paypal?'Configured · inspect a capture':'Not configured'],
 ['Course access',flags.courseAccess?'Separate service configured':'Built-in demo service'],
 ['AI specialists',flags.ai?'Model configured · inspect a review':'Scripted sample only'],
 ['Render Workflows',flags.workflows?'Configured · inspect a run':'Optional · not configured']
];
const list=document.querySelector('#judge-readiness-list');
if(list){list.replaceChildren();for(const [name,status] of checks){const item=document.createElement('div'),title=document.createElement('strong'),detail=document.createElement('span');title.textContent=name;detail.textContent=status;item.append(title,detail);list.append(item);}}
