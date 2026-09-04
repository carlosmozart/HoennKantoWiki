// One playback at a time; an error event and a rejected play() share one fallback.
export function playPokemonCry(owner, id, cries = {}) {
    owner._cryPlayback?.stop();
    const base='https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon';
    const sources=[new URL('../../audio/cries/'+id+'.ogg',import.meta.url).href,
        cries.latest || base+'/latest/'+id+'.ogg', cries.legacy || base+'/legacy/'+id+'.ogg'];
    let stopped=false, current=null;
    const stop=()=>{stopped=true;if(current){current.pause();current.removeAttribute('src');current.load();}};
    owner._cryPlayback={stop};
    const attempt=index=>{
        if(stopped || index>=sources.length)return;
        const audio=new Audio();current=audio;
        let failed=false;
        const fallback=error=>{
            if(failed||stopped)return;
            failed=true;
            audio.pause();
            // Autoplay denial needs a user gesture, not another network request.
            if(error?.name!=='NotAllowedError'&&error?.name!=='AbortError')attempt(index+1);
        };
        audio.addEventListener('error',fallback,{once:true});
        audio.src=sources[index];
        audio.play().catch(fallback);
    };
    attempt(0);
}
