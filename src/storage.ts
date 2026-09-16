import type { Engine } from './core';
export type Settings={name:string;swapped:boolean;music:boolean;volume:number;sfx:number;vibration:boolean;reduced:boolean;offset:number};
export const defaults:Settings={name:'PLAYER',swapped:false,music:true,volume:.25,sfx:.4,vibration:false,reduced:false,offset:0};
export type RecordEntry={runId:string;playerId:string;name:string;total:number;dodge:number;match:number;survival:number;seed:number;result:string;counts:Record<string,number>;maxCombo:number;maxRecovery:number;maxMiss:number;chartId:string;chartVersion:string;rulesetVersion:string;createdAt:string};
export const key='dodge-match-v1';
export let storageUnavailable=false;
function read<T>(suffix:string,fallback:T):T{try{const value=localStorage.getItem(key+suffix);return value?JSON.parse(value):fallback;}catch{storageUnavailable=true;return fallback;}}
function write(suffix:string,value:unknown){try{localStorage.setItem(key+suffix,JSON.stringify(value));}catch{storageUnavailable=true;}}
export function settings():Settings{const s=read<Partial<Settings>>(':settings',{});return {...defaults,...s,name:typeof s.name==='string'?s.name.slice(0,16):'PLAYER'};}
export function saveSettings(s:Settings){write(':settings',s);}
export function records():RecordEntry[]{const result=read<unknown>(':records',[]);return Array.isArray(result)?result.filter(r=>typeof r?.total==='number'&&typeof r?.name==='string'&&r?.counts):[];}
export function recordRun(e:Engine,name:string){let playerId=read<string>(':player','');if(!playerId){playerId=crypto.randomUUID();write(':player',playerId);}const entry:RecordEntry={runId:crypto.randomUUID(),playerId,name:name.trim().slice(0,16)||'PLAYER',total:e.score.total(e.time),dodge:Math.floor(e.time/1000)*100,match:e.score.match,survival:e.time,seed:e.seed,result:e.end!,counts:{...e.score.counts},maxCombo:e.score.maxCombo,maxRecovery:e.score.maxRecovery,maxMiss:e.score.maxMiss,chartId:e.chart.chartId,chartVersion:e.chart.chartVersion,rulesetVersion:e.chart.rulesetVersion,createdAt:new Date().toISOString()};write(':records',[entry,...records()].slice(0,1000));return entry;}
export function ranked(entries=records()){return [...entries].sort((a,b)=>b.total-a.total||b.survival-a.survival||b.counts.Perfect-a.counts.Perfect||a.counts.Miss-b.counts.Miss||a.createdAt.localeCompare(b.createdAt)).slice(0,100);}
