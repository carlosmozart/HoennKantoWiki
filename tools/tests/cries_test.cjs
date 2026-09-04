const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
(async()=>{
 const {playPokemonCry}=await import(pathToFileURL(path.resolve('js/ui/cries.js')).href);
 const instances=[];
 let mode='fallback';
 global.Audio=class extends EventTarget {
   constructor(){super();instances.push(this);this.paused=false;}
   pause(){this.paused=true;}
   removeAttribute(){this.src='';}
   load(){}
   play(){
     if(mode==='denied')return Promise.reject(Object.assign(new Error('Gesture required'),{name:'NotAllowedError'}));
     if(mode==='fallback'&&instances.length===1) {
       queueMicrotask(()=>this.dispatchEvent(new Event('error')));
       return Promise.reject(new Error('Decoder failed'));
     }
     return Promise.resolve();
   }
 };
 const owner={};
 playPokemonCry(owner,5);
 await new Promise(setImmediate);
 assert.equal(instances.length,2,'error event and rejection must advance only once');
 assert.ok(instances[1].src.includes('/latest/5.ogg'));
 const previous=instances[1];
 mode='success';
 playPokemonCry(owner,25);
 await new Promise(setImmediate);
 assert.ok(previous.paused);
 assert.equal(previous.src,'');
 assert.ok(instances.at(-1).src.endsWith('/audio/cries/25.ogg'));
 mode='denied';
 const count=instances.length;
 playPokemonCry(owner,386);
 await new Promise(setImmediate);
 assert.equal(instances.length,count+1,'autoplay denial must not trigger network fallbacks');
 console.log('Cry fallback, cancellation and autoplay tests passed.');
})().catch(error=>{console.error(error);process.exitCode=1;});
