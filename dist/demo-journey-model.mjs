import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from './core.mjs';
import {proofIsCurrent} from './operations.mjs';

export const journeyChapters=[
 {title:'A buyer chooses the workshop',actor:'Customer',next:'Complete sample purchase'},
 {title:'Payment recorded. Access is missing.',actor:'PayTrace',next:'Consult the specialists'},
 {title:'Four specialists review the evidence.',actor:'Scripted sample review',next:'Preview the smallest correction'},
 {title:'The exact correction is previewed.',actor:'Merchant',next:'Approve this sample preview'},
 {title:'Merchant approval is recorded.',actor:'PayTrace',next:'Apply one sample access grant'},
 {title:'Access changed once. Proof is pending.',actor:'PayTrace',next:'Verify the purchased lesson'},
 {title:'Payment, access, and lesson agree.',actor:'Customer',next:'Confirm that it works'},
 {title:'The customer confirms the outcome.',actor:'Complete',next:'Restart the walkthrough'}
];

export function journeyAt(step){
 if(!Number.isInteger(step)||step<0||step>=journeyChapters.length)throw Error('Unknown walkthrough step.');
 const s=createCase('match','CL-SAMPLE-JOURNEY');
 if(step>=1)simulatePayment(s);
 if(step>=2)investigate(s);
 if(step>=3)rehearse(s);
 if(step>=4)approve(s,s.rehearsal.id);
 if(step>=5)applyRepair(s);
 if(step>=6)verify(s);
 return {step,state:s,confirmed:step===7,verified:proofIsCurrent(s),chapter:journeyChapters[step]};
}
