import test from 'node:test';
import assert from 'node:assert/strict';
import {packetMatchesSelection} from '../dist/intelligence-packet.mjs';

test('only the latest packet for the active case can be shown or downloaded',()=>{
 const a={caseId:'CL-A'},b={caseId:'CL-B'};
 assert.equal(packetMatchesSelection({viewActive:true,activeCase:'CL-B',request:2,latestRequest:2,packet:b}),true);
 assert.equal(packetMatchesSelection({viewActive:true,activeCase:'CL-B',request:1,latestRequest:2,packet:a}),false);
 assert.equal(packetMatchesSelection({viewActive:true,activeCase:'CL-B',request:1,latestRequest:1,packet:a}),false);
 assert.equal(packetMatchesSelection({viewActive:false,activeCase:'CL-B',request:2,latestRequest:2,packet:b}),false);
});
