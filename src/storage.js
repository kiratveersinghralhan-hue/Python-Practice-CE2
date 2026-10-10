const PREFIX='ce2arena_v1_';
export function read(key,fallback){try{const raw=localStorage.getItem(PREFIX+key);return raw===null?fallback:JSON.parse(raw)}catch{return fallback}}
export function write(key,value){try{localStorage.setItem(PREFIX+key,JSON.stringify(value));return true}catch{return false}}
export function remove(key){try{localStorage.removeItem(PREFIX+key)}catch{}}
export function saveResult(result){const items=read('history',[]);items.unshift(result);write('history',items.slice(0,200))}
export function leaderboard(){const best=new Map();for(const item of read('history',[])){if(item.mode!=='exam'||!item.nickname)continue;const key=item.nickname.trim().toLowerCase();if(!best.has(key)||item.correct>best.get(key).correct||item.correct===best.get(key).correct&&item.timeTaken<best.get(key).timeTaken)best.set(key,item)}return [...best.values()].sort((a,b)=>b.correct-a.correct||a.timeTaken-b.timeTaken).slice(0,50)}
