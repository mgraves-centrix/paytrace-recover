// Read-only release preflight. Prints no provider credentials or customer records.
const input=process.argv[2]||process.env.PAYTRACE_URL;
const requireConnected=process.argv.includes('--require-connected');
if(!input)throw Error('Pass the hosted HTTPS URL or set PAYTRACE_URL.');
const base=new URL(input);
if((base.protocol!=='https:'&&!(base.protocol==='http:'&&['localhost','127.0.0.1'].includes(base.hostname)))||base.username||base.password||base.search||base.hash)throw Error('Use an HTTPS site origin or local HTTP, without credentials, query, or fragment.');

let passed=true;
async function get(path){
 try{
  const response=await fetch(new URL(path,base),{redirect:'error',signal:AbortSignal.timeout(20000)});
  console.log(`${path}: HTTP ${response.status}`);
  if(!response.ok)passed=false;
  return response.ok?response:null;
 }catch(error){console.log(`${path}: unavailable (${error.name==='TimeoutError'?'timeout':'request failed'})`);passed=false;return null;}
}

const paths=['/health','/judge.html','/failure-replay.html','/focus.html','/store-demo.html','/connection-studio.html','/passport.html','/recovery.html','/account.html','/customer.html','/runtime.js'];
const responses=await Promise.all(paths.map(get));
const runtime=responses.at(-1);
if(runtime){
 const source=await runtime.text();
 for(const name of ['backend','paypal','courseAccess','ai','workflows']){
  const match=source.match(new RegExp(`"${name}"\\s*:\\s*(true|false)`));
  const enabled=match?.[1]==='true';
  console.log(`${name}: ${match?enabled?'configured':'not configured':'unknown'}`);
  if(!match||requireConnected&&!enabled)passed=false;
 }
}
if(!passed){console.error('Hosted preflight failed. Do not present this host as a connected recovery demo.');process.exitCode=1;}
