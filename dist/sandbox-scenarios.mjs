export const SANDBOX_SCENARIOS=Object.freeze([
 {id:'missing-access',label:'Paid, access missing',detail:'The payment matches, but the purchased lesson is still locked.'},
 {id:'wrong-account',label:'Buyer in the wrong account',detail:'The payment matches, but the signed-in learner account differs from the purchaser.'},
 {id:'expired-access',label:'Access term expired',detail:'The payment matches, but the recorded access term has ended.'}
]);

export function sandboxScenario(id){return SANDBOX_SCENARIOS.find(item=>item.id===id)||null;}
