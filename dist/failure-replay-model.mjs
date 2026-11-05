import {createCase,simulatePayment,investigate,checks} from './core.mjs';

export const replayOptions=[
 {id:'match',name:'Matching purchase',caption:'The safe preview path'},
 {id:'learner',name:'Wrong learner',caption:'The identity hold'},
 {id:'service',name:'Course service offline',caption:'The evidence hold'}
];

export function failureReplay(id){
 if(!replayOptions.some(option=>option.id===id))throw Error('Unknown replay');
 const caseState=simulatePayment(createCase('match','CL-REPLAY'));
 if(id==='learner')caseState.capture.userId='learner-other';
 if(id!=='service')investigate(caseState);
 const exact=checks(caseState),matched=exact.every(item=>item.ok);
 const common={fictional:true,payment:'Sample payment marked completed',writes:caseState.writes,approval:caseState.approval,caseId:caseState.id};
 if(id==='match')return {...common,tone:'ready',title:'Evidence supports a preview.',summary:'The sample payment matches the saved order, learner, course, amount, and currency. Access is missing.',facts:[['Payment evidence','Sample completed capture'],['Purchase match','All exact checks pass'],['Course access','Inactive in the sample record'],['Specialist review','Scripted example; a live case uses the configured model']],decision:'Preview one narrow access grant. Merchant approval and a fresh lesson check still follow.',stop:'No grant occurs in this replay.'};
 if(id==='learner')return {...common,tone:'hold',title:'Stop: this payment belongs to another learner.',summary:'The sample payment is marked completed, but it does not match this case’s learner.',facts:[['Payment evidence','Sample completed capture'],['Purchase match',matched?'Unexpected match':'Learner mismatch'],['Course access','Keep unchanged'],['Specialist review','Identity objection remains open']],decision:'Ask the merchant to resolve the learner identity. Do not grant access.',stop:'Zero access writes.'};
 return {...common,tone:'hold',title:'Stop: course access cannot be checked.',summary:'The sample payment matches, but the course service is unavailable in this simulated fault. Current access is unknown.',facts:[['Payment evidence','Sample completed capture'],['Purchase match','Exact payment fields match'],['Course access','Read unavailable'],['Specialist review','No current conclusion recorded']],decision:'Retry the read and investigate only when the service responds. Do not infer that access is missing.',stop:'Zero access writes; no approval is requested.'};
}
