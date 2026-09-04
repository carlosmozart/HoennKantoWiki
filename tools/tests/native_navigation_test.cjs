const {pathToFileURL}=require('node:url');
const path=require('node:path');
const assert=require('node:assert/strict');
(async()=>{
 const {handleBack}=await import(pathToFileURL(path.resolve('native/navigation.js')).href);
 const calls=[];
 const page={location:{hash:'#pokemon/5'},history:{back:()=>calls.push('back')},
  getComputedStyle:()=>({display:'none'}),document:{querySelector:()=>null,getElementById:()=>null}};
 const input={canGoBack:true,exit:()=>calls.push('exit')};
 handleBack(input,page);assert.deepEqual(calls,['back']);
 handleBack({...input,canGoBack:false},page);assert.equal(page.location.hash,'');
 handleBack(input,page);assert.equal(calls.at(-1),'exit');
 page.document.querySelector=()=>({close:()=>calls.push('dialog')});
 handleBack(input,page);assert.equal(calls.at(-1),'dialog');
 page.document.querySelector=()=>null;
 page.document.getElementById=id=>id==='training-modal'?{}:{click:()=>calls.push('training')};
 page.getComputedStyle=()=>({display:'flex'});
 handleBack(input,page);assert.equal(calls.at(-1),'training');
 console.log('Native Back: dialog, training, history, direct link and root exit passed.');
})().catch(e=>{console.error(e);process.exitCode=1;});
