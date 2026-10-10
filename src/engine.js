export const EXAM_SIZE=60, EXAM_SECONDS=45*60, MARKS_PER_QUESTION=.25;
export const EXAM_DIFFICULTY={easy:18,medium:30,hard:12};
export function shuffle(items, random=Math.random){const result=[...items];for(let i=result.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]]}return result}
export function createQuiz(bank,{count=10,topic='all',difficulty='all',random=Math.random}={}){const pool=bank.filter(q=>(topic==='all'||q.topic===topic)&&(difficulty==='all'||q.difficulty===difficulty));if(pool.length<count)throw Error(`Only ${pool.length} questions available (need ${count}).`);return shuffle(pool,random).slice(0,count).map(q=>({id:q.id,options:shuffle(q.options.map((text,index)=>({text,originalIndex:index})),random)}))}
export function scoreQuiz(bank,quiz,answers){const lookup=new Map(bank.map(q=>[q.id,q]));let correct=0,incorrect=0,unanswered=0;const details=quiz.map((item,i)=>{const q=lookup.get(item.id);const selected=answers[i]??null;const chosen=selected===null?null:item.options[selected];const ok=chosen!==null&&chosen!==undefined&&chosen.originalIndex===q.correct;if(ok)correct++;else if(chosen==null)unanswered++;else incorrect++;return {question:q,options:item.options,selected,correctOption:item.options.findIndex(x=>x.originalIndex===q.correct),isCorrect:ok}});return {correct,incorrect,unanswered,marks:Number((correct*MARKS_PER_QUESTION).toFixed(2)),percent:Math.round(correct/quiz.length*100),details}}
export function secondsLeft(deadline,now=Date.now()){return Math.max(0,Math.ceil((deadline-now)/1000))}
export function formatTime(s){return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`}

export function createBalancedExam(bank,{random=Math.random}={}){
 const selections=[];
 for(const [difficulty,count] of Object.entries(EXAM_DIFFICULTY)){
  const group=bank.filter(q=>q.difficulty===difficulty);
  if(group.length<count)throw Error(`Need ${count} ${difficulty} questions; found ${group.length}.`);
  selections.push(...shuffle(group,random).slice(0,count));
 }
 return shuffle(selections,random).map(q=>({id:q.id,options:shuffle(q.options.map((text,index)=>({text,originalIndex:index})),random)}));
}
