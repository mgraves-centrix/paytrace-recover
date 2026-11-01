const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
let last=null;
function showAi(panel,report){
 if(!report)return;
 const mode=panel.querySelector('.detective-results>.fine');
 if(mode)mode.textContent=`Checked ${new Date(report.checkedAt).toLocaleString()} · ${report.results.length} cases · ${report.mode==='AI-assisted read-only'?'AI-assisted perspectives; fixed evidence status':'fixed evidence rules; no model diagnosis'}`;
 if(report.notice)panel.querySelector('.detective-results')?.insertAdjacentHTML('afterbegin',`<p class="detective-error">${esc(report.notice)}</p>`);
 panel.querySelectorAll('.detective-hypotheses article').forEach((card,index)=>{const ai=report.hypotheses[index]?.aiPerspective;if(!ai)return;const note=document.createElement('p');note.className='detective-ai';note.textContent=`AI perspective: ${ai.explanation} Unknown: ${ai.unknown} Cited cases: ${ai.caseIds.join(', ')||'none'}.`;card.querySelector('small')?.before(note);});
}
export function mountIncidentDetective(root,incident,api){
 const card=root.querySelector('.lab-card.incident');if(!card||!incident.active)return;
 const panel=document.createElement('div');panel.className='incident-detective';
 const same=last?.ids===incident.caseIds.join('|');
 if(!same)last=null;
 const show=()=>{const report=last?.report;panel.innerHTML=`<div class="detective-head"><span class="eyebrow">INCIDENT DETECTIVE · READ ONLY</span><h3>Four specialists. Competing explanations.</h3><p>Fresh PayPal, entitlement, and protected-lesson reads test the pattern. Results cannot approve a batch correction or prove a root cause.</p><button type="button" class="button primary" ${last?.busy?'disabled':''}>${last?.busy?'Checking sources…':'Run fresh incident checks'}</button></div><div class="detective-results" role="status">${last?.error?`<p class="detective-error">${esc(last.error)}</p>`:''}${report?`<p class="fine">Checked ${esc(new Date(report.checkedAt).toLocaleString())} · ${report.results.length} cases · fixed evidence rules, not a model diagnosis</p><div class="detective-probes">${report.results.map(item=>`<span><b>${esc(item.caseId)}</b>${esc(item.state.replaceAll('-',' '))}</span>`).join('')}</div><div class="detective-hypotheses">${report.hypotheses.map(h=>`<article class="${esc(h.status)}"><div><strong>${esc(h.agent)} · ${esc(h.title)}</strong><span>${esc(h.status.replaceAll('-',' '))}</span></div><p>${esc(h.evidence)}</p><small>Next check: ${esc(h.next)}</small></article>`).join('')}</div>`:'<p class="fine">No fresh incident probe has run in this session. The cluster above is based on saved records.</p>'}</div>`;showAi(panel,report);panel.querySelector('button').onclick=async()=>{last={ids:incident.caseIds.join('|'),busy:true,report:last?.report||null};show();try{last={ids:incident.caseIds.join('|'),report:await api('intelligence/incident/probe',{},90000),busy:false};}catch(error){last={ids:incident.caseIds.join('|'),error:error.message,busy:false};}show();};};
 show();card.append(panel);
}
