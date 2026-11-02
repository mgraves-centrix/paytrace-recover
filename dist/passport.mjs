import {createApi} from './focus-api.mjs';
import {passportMarkup} from './recovery-passport-ui.mjs';
const api=createApi(),root=document.querySelector('#passport-app'),download=document.querySelector('#download');let current=null;
async function load(){root.textContent='Loading saved case evidence…';try{if(!window.COURSELATCH_RUNTIME?.backend)throw Error('Open the server-backed merchant workspace to view a saved passport.');const id=new URLSearchParams(location.search).get('caseId');if(!id)throw Error('Open a case in the merchant workspace, then choose its Recovery Passport.');current=await api('passport?caseId='+encodeURIComponent(id));if(current.caseId!==id)throw Error('The selected case changed. Reopen it in the merchant workspace.');root.innerHTML=passportMarkup(current);download.hidden=false;}catch(error){current=null;download.hidden=true;root.textContent=error.message||'The passport could not be loaded.';}}
document.querySelector('#refresh').onclick=load;
download.onclick=()=>{if(!current)return;const url=URL.createObjectURL(new Blob([JSON.stringify(current,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download=current.caseId+'-recovery-passport.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
await load();
