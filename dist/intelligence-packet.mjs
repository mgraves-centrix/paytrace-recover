export function packetMatchesSelection({viewActive,activeCase,request,latestRequest,packet}){
 return !!viewActive&&!!activeCase&&!!packet&&request===latestRequest&&packet.caseId===activeCase;
}
