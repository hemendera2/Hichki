/* Hichki zero-cost music adapter: local/user-owned audio + legitimate stream URLs. No downloading or hosting of copyrighted catalogues. */
(() => {
  'use strict';
  const audio = document.createElement('audio'); audio.preload='metadata'; audio.playsInline=true;
  const state={track:null,playing:false,objectUrl:null};
  const emit=(type,detail={})=>window.dispatchEvent(new CustomEvent(`hichki:music-${type}`,{detail}));
  const revoke=()=>{if(state.objectUrl){URL.revokeObjectURL(state.objectUrl);state.objectUrl=null}};
  const setTrack=track=>{revoke();state.track={title:String(track?.title||'Untitled'),artist:String(track?.artist||'Unknown'),album:String(track?.album||''),url:String(track?.url||''),cover:String(track?.cover||'')};audio.src=state.track.url;audio.currentTime=0;updateMediaSession();emit('track',state.track)};
  const loadFile=file=>{if(!file||!file.type.startsWith('audio/'))throw Error('audio_file_required');revoke();state.objectUrl=URL.createObjectURL(file);setTrack({title:file.name.replace(/\.[^.]+$/,''),artist:'Local audio',url:state.objectUrl})};
  const play=async()=>{await audio.play();state.playing=true;emit('play',state.track)};
  const pause=()=>{audio.pause();state.playing=false;emit('pause',state.track)};
  const toggle=()=>state.playing?pause():play();
  const seek=seconds=>{audio.currentTime=Math.max(0,Math.min(audio.duration||0,Number(seconds)||0));emit('seek',{time:audio.currentTime,duration:audio.duration||0})};
  const updateMediaSession=()=>{if(!('mediaSession'in navigator)||!state.track)return;try{navigator.mediaSession.metadata=new MediaMetadata({title:state.track.title,artist:state.track.artist,album:state.track.album,artwork:state.track.cover?[{src:state.track.cover}]:[]});for(const [action,handler]of [['play',play],['pause',pause],['seekbackward',()=>seek(Math.max(0,audio.currentTime-10))],['seekforward',()=>seek(Math.min(audio.duration||0,audio.currentTime+10))]])try{navigator.mediaSession.setActionHandler(action,handler)}catch{}}catch{}};
  audio.addEventListener('ended',()=>{state.playing=false;emit('ended',state.track)});audio.addEventListener('timeupdate',()=>emit('progress',{time:audio.currentTime,duration:audio.duration||0}));
  window.HichkiMusic={audio,setTrack,loadFile,play,pause,toggle,seek,get state(){return state}};
})();
