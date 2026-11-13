import { summarize, gradeQuiz } from '/reading.mjs';
const $=id=>document.getElementById(id);
const sections=['setup','reader','quiz','report','history'];
let topic='Everyday life', reading, events=[],elapsed=0,started=null,paused=false,currentReport,previous='setup',busy=false,pendingReport=null;
const fmt=seconds=>`${Math.floor(seconds/60)}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;
function show(id){sections.forEach(s=>$(s).hidden=s!==id);$('history-button').disabled=id==='quiz';window.scrollTo(0,0);}
function elapsedNow(){return elapsed+(started===null?0:performance.now()-started);}
function setPaused(value){if(value && started!==null){elapsed+=performance.now()-started;started=null;}else if(!value && started===null){started=performance.now();}paused=value;$('pause').textContent=value?'Resume reading':'Pause reading';$('passage').hidden=value;$('pause-overlay').hidden=!value;}
setInterval(()=>{if(reading)$('timer').textContent=fmt(elapsedNow()/1000);},250);
document.addEventListener('visibilitychange',()=>{if(document.hidden && !$('reader').hidden)setPaused(true);});
const icons=['☀','♧','↗','❧','◇','⚙'];
async function init(){try{const res=await fetch('/api/config');if(!res.ok)throw Error();const config=await res.json();config.topics.forEach((name,i)=>{const b=document.createElement('button');b.type='button';b.className='topic';b.setAttribute('aria-pressed',name===topic);const icon=document.createElement('span');icon.textContent=icons[i];b.append(icon,document.createTextNode(name));b.onclick=()=>{topic=name;document.querySelectorAll('.topic').forEach(el=>el.setAttribute('aria-pressed',el===b));};$('topics').append(b);});$('mode-note').textContent=config.live?'An original reading, with an English meaning for every word.':'Sample mode is ready. Original reading generation is not enabled yet. Try a sample reading below.';if(!config.live){$('generate').disabled=true;$('generate').textContent='Live generation needs setup';}}catch{$('error').textContent='Could not connect to the app server. Please reload.';}}
async function generate(sample=false){if(busy)return;busy=true;$('error').textContent='';const wasDisabled=$('generate').disabled;$('generate').disabled=true;$('sample').disabled=true;const oldText=$('generate').textContent;if(!sample)$('generate').textContent='Creating your reading…';try{const response=await fetch('/api/reading',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic,language:$('language').value,level:$('level').value,sample})});if(response.status===429)throw Error('You’ve requested several readings. Please wait a minute and try again.');const data=await response.json().catch(()=>{throw Error('The reading service is unavailable. Please try again shortly.');});if(!response.ok)throw Error(data.error||'The reading could not be created. Please try again.');reading=data;pendingReport=null;events=[];elapsed=0;started=null;paused=false;$('lookup-count').textContent='0';$('timer').textContent='0:00';$('reading-title').textContent=reading.title;$('reading-meta').textContent=`${reading.language} / ${reading.level} / ${reading.topic} / ${reading.wordCount} words`;$('reading-mode').textContent=reading.sample?'A1 sample reading':'Original reading';$('gloss-word').textContent='Every word is a doorway.';$('gloss-meaning').textContent='Select a word in the reading to find its meaning here.';$('passage').replaceChildren();$('passage').lang={Spanish:'es',French:'fr',German:'de'}[reading.language];$('reading-title').lang=$('passage').lang;let index=0;reading.paragraphs.forEach(paragraph=>{const p=document.createElement('p');paragraph.forEach(token=>{const position=index++;const b=document.createElement('button');b.className='word';b.textContent=token.text;b.setAttribute('aria-label',`Meaning of ${token.text}`);b.onclick=()=>{if(paused)return;document.querySelectorAll('.selected').forEach(el=>el.classList.remove('selected'));b.classList.add('selected','looked');$('gloss-word').textContent=token.text;$('gloss-meaning').textContent=token.gloss;events.push({word:token.text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu,''),gloss:token.gloss,position,atSeconds:Math.round(elapsedNow()/1000)});$('lookup-count').textContent=new Set(events.map(e=>e.word.toLocaleLowerCase())).size;};p.append(b,document.createTextNode(' '));});$('passage').append(p);});show('reader');setPaused(document.hidden);}catch(error){$('error').textContent=error.message;}finally{busy=false;$('generate').disabled=wasDisabled;$('generate').textContent=oldText;$('sample').disabled=false;}}
$('setup-form').onsubmit=e=>{e.preventDefault();generate();};$('sample').onclick=()=>generate(true);$('pause').onclick=()=>setPaused(!paused);
function getHistory(){try{return JSON.parse(localStorage.getItem('leaf-history')||'[]');}catch{return [];}}
function renderReport(report){currentReport=report;show('report');renderQuizResults(report.quiz);$('report-subtitle').textContent=`${report.reading.title} · ${report.reading.language} · ${report.reading.level}${report.reading.sample?' · Sample':''}`;const s=report.stats;$('stats').replaceChildren();[[fmt(s.seconds),'Active reading time'],[s.wpm??'—','Words per minute'],[s.uniqueWords,'Distinct words looked up'],[`${s.glossedPercent}%`,'Text positions glossed']].forEach(([value,label])=>{const div=document.createElement('div');div.className='stat';const strong=document.createElement('strong');strong.textContent=value;const span=document.createElement('span');span.textContent=label;div.append(strong,span);$('stats').append(div);});$('word-list').replaceChildren();const grouped=new Map();for(const e of report.events){const key=e.word.toLocaleLowerCase();const entry=grouped.get(key)||{...e,count:0};entry.count++;grouped.set(key,entry);}for(const e of grouped.values()){const row=document.createElement('div');row.className='word-row';const word=document.createElement('strong');word.textContent=e.word;const meaning=document.createElement('span');meaning.textContent=e.gloss;const count=document.createElement('span');count.textContent=`${e.count}×`;row.append(word,meaning,count);$('word-list').append(row);}if(!grouped.size)$('word-list').textContent='You finished without looking up a word.';$('reflection').textContent=`You read ${s.wordCount} words and opened ${s.lookups} gloss${s.lookups===1?'':'es'} across ${s.uniqueWords} distinct word${s.uniqueWords===1?'':'s'}. ${s.uniqueWords?'Revisit your word collection, then try another reading to meet these words in a new context.':'Try another topic or level whenever you feel ready.'}`;}
function saveReport(report) {
 renderReport(report);
 try{localStorage.setItem('leaf-history',JSON.stringify([report,...getHistory()].slice(0,50)));$('save-note').textContent='Saved on this device. Download a copy to keep or share.';}
 catch{$('save-note').textContent='Browser storage is unavailable. Download a copy to keep this report.';}
}
function renderQuizResults(quiz) {
 const container=$('quiz-results');container.replaceChildren();container.hidden=!quiz;
 if(!quiz)return;
 const title=document.createElement('h2');title.textContent=`Comprehension quiz · ${quiz.correct}/${quiz.total} (${quiz.percent}%)`;container.append(title);
 quiz.results.forEach((result,index)=>{
  const item=document.createElement('div');item.className=`quiz-review ${result.correct?'correct':'incorrect'}`;
  const heading=document.createElement('h3');heading.textContent=`${index+1}. ${result.question}`;
  const answer=document.createElement('p');answer.textContent=`${result.correct?'Correct':'Not quite'} · Your answer: ${result.options[result.selectedIndex]}`;
  item.append(heading,answer);
  if(!result.correct){const correct=document.createElement('p');correct.textContent=`Correct answer: ${result.options[result.correctIndex]}`;item.append(correct);}
  const explanation=document.createElement('p');explanation.className='muted';explanation.textContent=result.explanation;item.append(explanation);container.append(item);
 });
}
$('finish').onclick=()=>{
 if(pendingReport)return;
 setPaused(true);
 pendingReport={id:crypto.randomUUID(),date:new Date().toISOString(),reading,events:[...events],stats:summarize(reading,events,elapsed)};
 $('quiz-subtitle').textContent=`${reading.title} · ${reading.language} · ${reading.level}`;
 $('quiz-questions').replaceChildren();$('quiz-error').textContent='';
 reading.quiz.forEach((question,index)=>{
  const fieldset=document.createElement('fieldset');fieldset.className='quiz-question';
  const legend=document.createElement('legend');legend.textContent=`${index+1}. ${question.question}`;fieldset.append(legend);
  question.options.forEach((option,optionIndex)=>{
   const label=document.createElement('label');label.className='quiz-option';
   const input=document.createElement('input');input.type='radio';input.name=`question-${index}`;input.value=optionIndex;input.required=true;
   label.append(input,document.createTextNode(option));fieldset.append(label);
  });$('quiz-questions').append(fieldset);
 });
 show('quiz');$('quiz-title').focus();
};
$('quiz-form').onsubmit=event=>{
 event.preventDefault();if(!pendingReport)return;
 try{
  const data=new FormData($('quiz-form'));
  const answers=pendingReport.reading.quiz.map((_,index)=>{const value=data.get(`question-${index}`);return value===null?null:Number(value);});
  const report={...pendingReport,quiz:gradeQuiz(pendingReport.reading.quiz,answers)};
  pendingReport=null;saveReport(report);
 }catch(error){$('quiz-error').textContent=error.message;}
};
$('back').onclick=()=>{setPaused(true);show('setup');};$('again').onclick=()=>show('setup');$('download').onclick=()=>{const blob=new Blob([JSON.stringify(currentReport,null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`leaf-reading-${currentReport.date.slice(0,10)}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};$('history-button').onclick=()=>{previous=sections.find(s=>!$(s).hidden)||'setup';if(previous==='reader')setPaused(true);show('history');$('history-list').replaceChildren();const reports=getHistory();if(!reports.length)$('history-list').textContent='Your completed readings will appear here.';reports.forEach(report=>{const b=document.createElement('button');b.className='history-item';const strong=document.createElement('strong');strong.textContent=report.reading.title;const span=document.createElement('span');span.textContent=`${new Date(report.date).toLocaleDateString()} · ${report.reading.language} ${report.reading.level} · ${fmt(report.stats.seconds)} · ${report.stats.uniqueWords} words looked up`;b.append(strong,span);b.onclick=()=>{renderReport(report);$('save-note').textContent='Saved on this browser and device.';};$('history-list').append(b);});};$('history-back').onclick=()=>show(previous);init();
