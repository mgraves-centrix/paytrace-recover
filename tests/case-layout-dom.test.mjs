import test from 'node:test';
import assert from 'node:assert/strict';
import {createCase,simulatePayment,investigate,rehearse,approve,applyRepair,verify} from '../dist/core.mjs';
import {arrangeCase,finishCaseLayout} from '../dist/focus-case-design.mjs';

// A small DOM fixture exercises the actual layout functions without a browser
// dependency. It checks that controls move into the focused and deep views.
class Element {
 constructor(tag='div',className=''){
  this.tagName=tag.toUpperCase();this.className=className;this.children=[];this.parent=null;this.attributes={};this.dataset={};this.textContent='';this.innerHTML='';this.inserted=[];
  this.classList={add:name=>{this.className=[...new Set([...this.className.split(' ').filter(Boolean),name])].join(' ');},contains:name=>this.className.split(' ').includes(name),toggle:()=>{}};
 }
 setAttribute(name,value){this.attributes[name]=value;}
 append(...nodes){for(const node of nodes){node.remove();node.parent=this;this.children.push(node);}}
 prepend(...nodes){for(const node of [...nodes].reverse()){node.remove();node.parent=this;this.children.unshift(node);}}
 before(...nodes){if(!this.parent)return;const parent=this.parent,index=parent.children.indexOf(this);for(const [offset,node] of nodes.entries()){node.remove();node.parent=parent;parent.children.splice(index+offset,0,node);}}
 after(...nodes){if(!this.parent)return;const parent=this.parent,index=parent.children.indexOf(this);for(const [offset,node] of nodes.entries()){node.remove();node.parent=parent;parent.children.splice(index+1+offset,0,node);}}
 remove(){if(this.parent){this.parent.children.splice(this.parent.children.indexOf(this),1);this.parent=null;}}
 get firstChild(){return this.children[0]||null;}
 get previousElementSibling(){if(!this.parent)return null;return this.parent.children[this.parent.children.indexOf(this)-1]||null;}
 get nextElementSibling(){if(!this.parent)return null;return this.parent.children[this.parent.children.indexOf(this)+1]||null;}
 matches(selector){return selector.split(',').some(part=>{const value=part.trim();if(value.startsWith('.'))return value.slice(1).split('.').every(name=>this.classList.contains(name));if(value.startsWith('#'))return this.id===value.slice(1);if(value.startsWith('[')){const match=value.match(/^\[([^=]+)="([^"]+)"\]$/);return match&&this.attributes[match[1]]===match[2];}const [tag,...names]=value.split('.');return this.tagName===tag.toUpperCase()&&names.every(name=>this.classList.contains(name));});}
 querySelectorAll(selector){
  if(selector.includes(' > ')){const parts=selector.split(' > '),start=parts[0]===':scope'?[this]:this.querySelectorAll(parts.shift());if(parts[0]===':scope')parts.shift();return parts.reduce((nodes,part)=>nodes.flatMap(node=>node.children.filter(child=>child.matches(part))),start);}
  const results=[];const walk=node=>{for(const child of node.children){if(child.matches(selector))results.push(child);walk(child);}};walk(this);return results;
 }
 querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
 insertAdjacentHTML(position,html){this.inserted.push({position,html});}
 addEventListener(){}
}

function fixture({preview=false}={}){
 const root=new Element(),shell=new Element('article','sheet'),head=new Element('header','sheet-head'),body=new Element('div','sheet-body');
 const reviewShell=new Element('div','review-shell'),stepper=new Element('div','stepper');stepper.append(new Element('span','active'),new Element('span'));reviewShell.append(stepper,shell);root.append(reviewShell);shell.append(head,body);
 const summary=new Element('section','summary'),decision=new Element('section','merchant-decision'),actionbar=new Element('div','actionbar');summary.append(new Element('p'));body.append(summary,decision);shell.append(actionbar);
 const source=new Element('section','source-status'),experience=new Element('section','case-experience'),progress=new Element('section','case-progress'),learner=new Element('section','learner-preview');experience.append(progress,learner);body.append(source,experience);
 const purchase=new Element('details','detail'),purchaseTitle=new Element('summary');purchaseTitle.textContent='Purchase evidence';purchase.append(purchaseTitle);body.append(purchase);
 if(preview){const title=new Element('h3'),diff=new Element('div','diff'),note=new Element('p','footnote');body.append(title,diff,note);}
 return {root,body,summary,decision,actionbar,progress,learner,source,purchase,stepper};
}

test('case layout keeps the decision action first and moves full records into inspection',()=>{
 const oldDocument=globalThis.document;globalThis.document={body:new Element('body'),createElement:tag=>new Element(tag)};
 try{
  const f=fixture(),s=simulatePayment(createCase());
  arrangeCase(f.root,s);finishCaseLayout(f.root,s,{backend:true});
  const rail=f.root.querySelector('.case-decision-column'),deep=f.root.querySelector('.case-deep-dive'),main=f.root.querySelector('.case-evidence-column');
  assert.ok(rail.children.includes(f.summary));assert.ok(rail.children.includes(f.actionbar));
  assert.ok(deep.children.includes(f.decision));assert.ok(main.children.some(child=>child.id==='case-customer-updates'));
  assert.equal(f.progress.parent,null);assert.equal(f.purchase.open,true);
  assert.match(f.summary.inserted[0].html,/Illustrative case · not connected/);
  assert.equal(main.children[0].className,'case-first-look');
  assert.equal(f.summary.parent,rail);
  assert.equal(rail.children.indexOf(f.actionbar),rail.children.indexOf(f.summary)+1);
  assert.equal(f.stepper.attributes['aria-label'].includes('step 1 of 2'),true);
 }finally{globalThis.document=oldDocument;}
});

test('verified layout presents a compact outcome while retaining the exact preview',()=>{
 const oldDocument=globalThis.document;globalThis.document={body:new Element('body'),createElement:tag=>new Element(tag)};
 try{
  const f=fixture({preview:true}),s=simulatePayment(createCase());investigate(s);rehearse(s);approve(s,s.rehearsal.id);applyRepair(s);verify(s);
  arrangeCase(f.root,s);finishCaseLayout(f.root,s);
  const rail=f.root.querySelector('.case-decision-column'),deep=f.root.querySelector('.case-deep-dive');
  assert.match(rail.inserted[0].html,/Access checked and available/);
  assert.ok(rail.querySelector('.case-change-preview'));
  assert.ok(deep.children.includes(f.decision));
 }finally{globalThis.document=oldDocument;}
});
