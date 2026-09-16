import type { Settings } from './storage';
/** A deliberately simple 120 BPM test click, independent of judgement time. */
export class AudioBus {
 ctx:AudioContext|null=null;lastBeat=-1;
 unlock(){this.ctx??=new AudioContext();void this.ctx.resume();}
 tone(freq:number,volume:number,length=.045){if(!this.ctx||this.ctx.state!=='running'||!volume)return;const o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;o.frequency.value=freq;g.gain.setValueAtTime(volume*.15,now);g.gain.exponentialRampToValueAtTime(.0001,now+length);o.connect(g);g.connect(this.ctx.destination);o.start();o.stop(now+length);}
 update(time:number,s:Settings){const beat=Math.floor((time+s.offset)/500);if(beat!==this.lastBeat){this.lastBeat=beat;if(s.music)this.tone(beat%4===0?880:440,s.volume);}}
}
