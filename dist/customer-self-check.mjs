import {esc,when,request} from './customer-shared.mjs';

const latest=new Map();
export function mountCustomerSelfCheck(root,caseView){
 const aside=root.querySelector('aside');if(!aside)return;
 const prior=latest.get(caseView.caseId);
 const panel=document.createElement('section');panel.className='customer-card customer-self-check';
 panel.innerHTML=`<span class="customer-eyebrow">CHECK MY ACCESS</span><h2>Want a fresh answer?</h2><p>We can check the payment, course access, and purchased lesson again. This does not charge you or change your access.</p><button type="button" class="primary">Check my access now</button><div class="customer-self-result" role="status">${prior?`<strong>${esc(prior.detail)}</strong><small>Checked ${esc(when(prior.checkedAt))} · No access change made.</small>`:'<small>Your latest case updates remain above.</small>'}</div>`;
 aside.prepend(panel);
 panel.querySelector('button').onclick=async event=>{
  const button=event.currentTarget,status=panel.querySelector('.customer-self-result');button.disabled=true;status.textContent='Checking your purchase and access…';
  try{const result=await request('/api/customer/self-check',{caseId:caseView.caseId},45000);latest.set(caseView.caseId,result);status.innerHTML=`<strong>${esc(result.detail)}</strong><small>Checked ${esc(when(result.checkedAt))} · No access change made.</small>`;}
  catch(error){status.textContent=error.message;}
  finally{button.disabled=false;}
 };
}
