export const COLORS = [0xf45d76,0xffad66,0xf8da72,0x65dba6,0x65b9ff,0x929aff,0xcd91ef];
export const GLYPHS = ['│','▲','✦','◆','≈',':','◐'];
export const NAMES = ['빨강','주황','노랑','초록','파랑','남색','보라'];
export const STEP = 1000 / 60, WIDTH = 100, HEIGHT = 100, PLAYER_RADIUS = 1.5, BALL_RADIUS = 1.6;
export type Grade = 'Perfect'|'Great'|'Good'|'Miss';
export type End = 'dodge_collision'|'match_depleted'|'chart_complete';
export type Vec = {x:number;y:number};
export type TargetSpec = {id:number;at:number;spawn:number;approach:number};
export type Chart = {chartId:string;chartVersion:string;rulesetVersion:string;durationMs:number;bpm:number;timeSignature:string;audioOffsetMs:number;targets:TargetSpec[];colorTransitions:number[];dodgeCurve:number[][];maxScore:number};
export class Random {
  private state:number;
  constructor(seed:number){this.state=seed>>>0;}
  next(){let t=this.state+=0x6D2B79F5;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296;}
  int(n:number){return Math.floor(this.next()*n);}
}
export function grade(delta:number):Grade { const d=Math.abs(delta);return d<=60?'Perfect':d<=120?'Great':d<=200?'Good':'Miss'; }
export function multiplier(combo:number){return combo>=100?2:combo>=50?1.5:combo>=25?1.25:combo>=10?1.1:1;}
export class Score {
  life=60;combo=0;recovery=0;missStreak=0;match=0;maxCombo=0;maxRecovery=0;maxMiss=0;
  counts:Record<Grade,number>={Perfect:0,Great:0,Good:0,Miss:0};
  judge(g:Grade){
    this.counts[g]++;
    if(g==='Miss'){this.combo=0;this.recovery=0;this.missStreak++;this.life-=Math.min(20,4+4*this.missStreak);}
    else {this.missStreak=0;this.combo++;this.match+=Math.round(({Perfect:100,Great:70,Good:40})[g]*multiplier(this.combo));
      if(g==='Good')this.recovery=0;
      else {this.recovery++;const amount=this.recovery>=20?5:this.recovery>=10?4:this.recovery>=5?3:2;this.life+=amount*(g==='Perfect'?2:1);}}
    this.life=Math.max(0,Math.min(100,this.life));this.maxCombo=Math.max(this.maxCombo,this.combo);this.maxRecovery=Math.max(this.maxRecovery,this.recovery);this.maxMiss=Math.max(this.maxMiss,this.missStreak);
  }
  total(time:number){return Math.floor((time+1e-7)/1000)*100+this.match;}
}
export function validateChart(c:Chart){
  if(c.durationMs!==180000||c.bpm!==120||c.targets.length!==151)throw Error('Invalid chart metadata');
  let last=-1;const s=new Score();
  for(const t of c.targets){if(t.at<=last||t.at%125!==0||t.spawn!==t.at-t.approach||t.spawn<0||t.at+200>c.durationMs)throw Error('Invalid target timing');last=t.at;s.judge('Perfect');
    if(c.targets.filter(other=>other.spawn<=t.spawn&&other.at+200>=t.spawn).length>4)throw Error('Too many concurrent targets');}
  if(s.total(c.durationMs)!==c.maxScore||c.maxScore!==41575)throw Error('Invalid maximum score');
  return c;
}
export function direction(x:number,y:number):Vec{const d=Math.hypot(x,y);return d?{x:x/d,y:y/d}:{x:0,y:0};}
export function swept(a:Vec,b:Vec,c:Vec,d:Vec,r:number){const x=a.x-c.x,y=a.y-c.y,vx=b.x-a.x-d.x+c.x,vy=b.y-a.y-d.y+c.y;const len=vx*vx+vy*vy;const t=len?Math.max(0,Math.min(1,-(x*vx+y*vy)/len)):0;return (x+vx*t)**2+(y+vy*t)**2<=r*r+1e-9;}
export type Ball = Vec & {id:number;vx:number;vy:number;activeAt:number};
/** Split at every wall impact so collision tests never shortcut reflected paths. */
export function travel(ball:Ball,seconds:number,width=WIDTH,height=HEIGHT){
  const segments:{a:Vec;b:Vec;start:number;end:number}[]=[];let remaining=seconds,elapsed=0;
  while(remaining>1e-10){const tx=ball.vx>0?(width-BALL_RADIUS-ball.x)/ball.vx:ball.vx<0?(BALL_RADIUS-ball.x)/ball.vx:Infinity;const ty=ball.vy>0?(height-BALL_RADIUS-ball.y)/ball.vy:ball.vy<0?(BALL_RADIUS-ball.y)/ball.vy:Infinity;
    const dt=Math.max(0,Math.min(remaining,tx,ty));const a={x:ball.x,y:ball.y};ball.x+=ball.vx*dt;ball.y+=ball.vy*dt;segments.push({a,b:{x:ball.x,y:ball.y},start:elapsed/seconds,end:(elapsed+dt)/seconds});remaining-=dt;elapsed+=dt;
    if(tx<=dt+1e-10)ball.vx=-ball.vx;if(ty<=dt+1e-10)ball.vy=-ball.vy;
    if(dt===0&&tx===Infinity&&ty===Infinity)break;
  }return segments;
}
export type Zone={color:number;next:number;changed:number;from:number[];penalty:boolean};
function rgb(c:number){return [(c>>16)&255,(c>>8)&255,c&255];}
export class Zones {
  stage=1;current=0;zones:Zone[]=[];
  constructor(private rng:Random,private penaltyRng:Random){this.structure(0);}
  structure(time:number){this.stage=time>=45000?4:time>=30000?3:time>=15000?2:1;this.zones=Array.from({length:this.stage},()=>({color:this.rng.int(7),next:this.stage===4?50300:Infinity,changed:time,from:[0,0,0],penalty:false}));}
  resolve(p:Vec,move:Vec={x:0,y:0}){
    if(this.stage===1)return this.current=0;
    const oldRight=this.stage===3?this.current===1:this.current%2===1;
    const right=Math.abs(p.x-50)<=0.0625?(this.current>=0?oldRight:move.x>=0):p.x>50;
    if(this.stage===2)return this.current=right?1:0;
    const oldBottom=this.current>=2;
    const bottom=Math.abs(p.y-50)<=0.0625?(this.current>=0?oldBottom:move.y>=0):p.y>50;
    return this.current=bottom?(this.stage===3?2:right?3:2):right?1:0;
  }
  update(time:number){const stage=time>=45000?4:time>=30000?3:time>=15000?2:1;if(stage!==this.stage){this.structure(time);this.current=-1;}
    for(const z of this.zones)if(time+1e-7>=z.next){z.color=this.rng.int(7);z.changed=z.next;z.next+=5300;z.penalty=false;}}
  reroll(id:number,time:number){const z=this.zones[id];if(!z)return;const from=this.display(id,time);z.color=(z.color+1+this.penaltyRng.int(6))%7;z.from=from;z.changed=time;z.penalty=true;z.next=this.stage===4?time+5300:Infinity;}
  display(id:number,time:number){const z=this.zones[id],c=rgb(COLORS[z.color]);if(z.penalty&&time-z.changed<1000){const t=Math.max(0,(time-z.changed)/1000);return c.map((v,i)=>z.from[i]+(v-z.from[i])*t);}
    const opacity=this.stage<4?1:Math.min(1,Math.max(0,(z.next-time)/500),Math.max(0,(time-z.changed)/500));return c.map(v=>v*opacity);}
}
export type Target=TargetSpec & Vec & {color:number;locked:boolean;forbidden:boolean;lockedZoneId:number;judged:boolean};
export type Feedback={time:number;grade:Grade;reason:string;x:number;y:number};
export class Engine {
  tick=0;time=0;player:Vec={x:50,y:50};move:Vec={x:0,y:0};score=new Score();zones:Zones;balls:Ball[]=[];targets:Target[]=[];end:End|null=null;feedback:Feedback[]=[];cryUntil=0;
  private ballRng:Random;private matchRng:Random;private nextTarget=0;private nextBall=0;private taps:{id:number;time:number}[]=[];
  constructor(public chart:Chart,public seed:number){validateChart(chart);this.ballRng=new Random(seed^0x1234);this.matchRng=new Random(seed^0x2345);this.zones=new Zones(new Random(seed^0x3456),new Random(seed^0x4567));for(let i=0;i<3;i++)this.addBall(true);this.spawn();}
  difficulty(){const curve=this.chart.dodgeCurve;for(let i=1;i<curve.length;i++){const [t,c,s]=curve[i], [pt,pc,ps]=curve[i-1];if(this.time<=t){const f=(this.time-pt)/(t-pt);return {count:Math.floor(pc+(c-pc)*f+1e-8),speed:ps+(s-ps)*f};}}return {count:32,speed:65};}
  private addBall(initial=false){const r=this.ballRng;for(let attempt=0;attempt<500;attempt++){let x:number,y:number,angle:number;
    if(initial){x=BALL_RADIUS+r.next()*(WIDTH-2*BALL_RADIUS);y=BALL_RADIUS+r.next()*(HEIGHT-2*BALL_RADIUS);angle=r.next()*Math.PI*2;}
    else{const edge=r.int(4),pos=4+r.next()*92,a=(20+r.next()*50)*Math.PI/180*(r.int(2)?1:-1);x=edge===0?BALL_RADIUS:edge===1?WIDTH-BALL_RADIUS:pos;y=edge===2?BALL_RADIUS:edge===3?HEIGHT-BALL_RADIUS:pos;angle=(edge===0?0:edge===1?Math.PI:edge===2?Math.PI/2:-Math.PI/2)+a;}
    if(Math.hypot(x-this.player.x,y-this.player.y)<15||this.balls.some(b=>Math.hypot(x-b.x,y-b.y)<BALL_RADIUS*2))continue;
    const speed=this.difficulty().speed;this.balls.push({id:this.nextBall++,x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,activeAt:this.time+(initial?0:500)});return;}}
  tap(id:number,time=this.time){if(!this.end)this.taps.push({id,time});}
  private judge(t:Target,g:Grade,reason:string){if(t.judged)return;t.judged=true;this.score.judge(g);this.feedback.push({time:this.time,grade:g,reason,x:t.x,y:t.y});if(reason==='FORBIDDEN')this.cryUntil=this.time+480;if(this.score.life===0)this.end='match_depleted';}
  private spawn(){while(this.nextTarget<this.chart.targets.length&&this.chart.targets[this.nextTarget].spawn<=this.time+1e-7){const spec=this.chart.targets[this.nextTarget++];let p={x:22,y:22};const occupied=this.targets.filter(t=>!t.judged);let found=false;
    for(let i=0;i<80;i++){p={x:19+this.matchRng.next()*62,y:19+this.matchRng.next()*62};if(occupied.every(t=>Math.hypot(t.x-p.x,t.y-p.y)>=27)){found=true;break;}}
    if(!found){const candidates=[{x:20,y:20},{x:80,y:20},{x:20,y:80},{x:80,y:80},{x:50,y:50}];p=candidates.sort((a,b)=>Math.min(...occupied.map(t=>Math.hypot(t.x-b.x,t.y-b.y)))-Math.min(...occupied.map(t=>Math.hypot(t.x-a.x,t.y-a.y))))[0];}
    this.targets.push({...spec,...p,color:this.matchRng.int(7),locked:false,forbidden:false,lockedZoneId:-1,judged:false});}}
  step(){if(this.end)return;this.time=++this.tick*STEP;const penalties:number[]=[];
    for(const tap of this.taps){const t=this.targets.find(t=>t.id===tap.id&&!t.judged);if(!t)continue;const forbidden=t.locked&&t.forbidden;this.judge(t,forbidden?'Miss':grade(tap.time-t.at),forbidden?'FORBIDDEN':tap.time<t.at?'EARLY':'LATE');if(forbidden)penalties.push(t.lockedZoneId);if(this.end)break;}this.taps=[];
    for(const t of this.targets)if(!this.end&&!t.judged&&this.time>t.at+200+1e-7)this.judge(t,t.forbidden?'Perfect':'Miss',t.forbidden?'SAFE':'MISSED');
    if(this.end)return;
    const old={...this.player};const v=direction(this.move.x,this.move.y);this.player.x=Math.max(2,Math.min(WIDTH-2,this.player.x+v.x*90/60));this.player.y=Math.max(2,Math.min(HEIGHT-2,this.player.y+v.y*90/60));
    this.zones.update(this.time);for(const id of penalties)this.zones.reroll(id,this.time);this.zones.resolve(this.player,this.move);this.spawn();
    for(const t of this.targets)if(!t.judged&&!t.locked&&this.time+1e-7>=t.at-200){t.locked=true;t.lockedZoneId=this.zones.current;t.forbidden=t.color===this.zones.zones[t.lockedZoneId].color;}
    const diff=this.difficulty();if(this.balls.length<diff.count)this.addBall();
    for(const b of this.balls){if(b.activeAt>this.time)continue;if(b.activeAt>this.time-STEP&&b.activeAt>0&&Math.hypot(b.x-this.player.x,b.y-this.player.y)<15){b.activeAt=this.time+500;continue;}
      const factor=diff.speed/Math.hypot(b.vx,b.vy);b.vx*=factor;b.vy*=factor;
      for(const segment of travel(b,1/60)){const p=(t:number)=>({x:old.x+(this.player.x-old.x)*t,y:old.y+(this.player.y-old.y)*t});if(swept(p(segment.start),p(segment.end),segment.a,segment.b,PLAYER_RADIUS+BALL_RADIUS))this.end='dodge_collision';}}
    this.targets=this.targets.filter(t=>!t.judged||this.time-t.at<1000);this.feedback=this.feedback.filter(f=>this.time-f.time<700);
    if(!this.end&&this.time>=this.chart.durationMs-1e-7){this.time=this.chart.durationMs;this.end='chart_complete';}
  }
}
