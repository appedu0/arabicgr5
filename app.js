const STORAGE_KEY = "arabicGr5Journey";
const TEACHER_WHATSAPP = "966541274900";
const STATIONS = [["🎯","إثارة الفضول"],["🧠","ماذا نعرف؟"],["🔍","شاهد واكتشف"],["📖","تأكد من فهمك"],["💬","ناقش الفكرة"],["🤝","تعاون وتحدَّ"],["✍️","طبّق في حياتك"],["🏆","تذكرة الخروج"],["🎮","تحدي 30 سؤالًا"]];
const TRANSITIONS = [
  "لنبدأ بصورة وسؤال يوقظان فضولك.",
  "أثارت الصورة فضولنا، فلنستدعِ ما نعرفه.",
  "تذكّرنا ما نعرفه، والآن دعنا نشاهد ونكتشف.",
  "شاهدنا واكتشفنا، فلنتأكد من فهم الفكرة.",
  "فهمنا الأحداث، والآن نناقش الفكرة الأعمق.",
  "اتضحت الأفكار، فلنعمل معًا ونحوّلها إلى حل.",
  "عملنا معًا، والآن أريد أن أرى ما تستطيع فعله بمفردك.",
  "قبل أن نغادر، أريد أن أعرف ماذا بقي في عقلك من درس اليوم.",
  "وصلت إلى التحدي الكبير: ثلاثون سؤالًا متنوعًا تفصل بينك وبين شارة الدرس!"
];

function parseSaved(value) { try { return value ? JSON.parse(value) : {}; } catch { return {}; } }
const state = Object.assign({name:"",stars:0,coins:0,view:"welcomeScreen",currentUnit:1,currentLesson:1,currentStation:0,activeLessonKey:"",challengeIndex:0,completedStations:[],completedLessons:[],priorAnswers:{},applications:{},challengeAnswers:{}}, parseSaved(localStorage.getItem(STORAGE_KEY)));
// الإصدار الجديد لا يعدّ الدرس مكتملًا إلا إذا أُجيب عن تحدي الأسئلة الثلاثين كاملًا.
state.completedLessons=state.completedLessons.filter(key=>Object.keys(state.challengeAnswers[key]||{}).length===30);
const screens = [...document.querySelectorAll(".screen")];
const $ = (id) => document.getElementById(id);

function save() { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function digits(value) { return String(value).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[d]); }
function unit() { return CURRICULUM.find(x => x.id === +state.currentUnit) || CURRICULUM[0]; }
function lesson() { return unit().lessons.find(x => x.id === +state.currentLesson) || unit().lessons[0]; }
function lessonKey(u=state.currentUnit,l=state.currentLesson) { return `u${u}-l${l}`; }
function stationKey(s,u=state.currentUnit,l=state.currentLesson) { return `${lessonKey(u,l)}-s${s}`; }

function showScreen(id, persist=true) {
  screens.forEach(x => x.classList.toggle("is-active", x.id === id));
  if (persist) { state.view=id; save(); }
  window.scrollTo({top:0,behavior:"smooth"});
}

function player() {
  $("displayName").textContent=state.name||"بطل العربية";
  $("starsCount").textContent=state.stars;
  $("coinsCount").textContent=state.coins;
  document.querySelectorAll(".header-player-name").forEach(x=>x.textContent=state.name||"بطل العربية");
  document.querySelectorAll(".header-stars").forEach(x=>x.textContent=state.stars);
  document.querySelectorAll(".header-coins").forEach(x=>x.textContent=state.coins);
}

function progressFor(u) {
  const total=u.lessons.length*9;
  const done=state.completedStations.filter(x=>x.startsWith(`u${u.id}-`)).length;
  return {done,total,percent:Math.round(done/total*100)};
}

function renderUnits() {
  $("unitsGrid").innerHTML=CURRICULUM.map(u=>{
    const p=progressFor(u);
    return `<article class="unit-card"><div class="unit-cover"><img src="${u.cover}" alt="غلاف ${u.title}"><span class="unit-number">${digits(u.id)}</span></div><div class="unit-body"><p>${u.label}</p><h3>${u.title}</h3><span>٤ دروس • ٣٦ محطة • ${digits(p.percent)}٪ منجزة</span><button type="button" data-unit="${u.id}">${p.done?"تابع الوحدة":"اكتشف الوحدة"}</button></div></article>`;
  }).join("");
  document.querySelectorAll("[data-unit]").forEach(b=>b.onclick=()=>openUnit(+b.dataset.unit));
}

function openUnit(id) {
  state.currentUnit=id;
  const u=unit(), p=progressFor(u);
  $("unitHeroImage").src=u.cover; $("unitHeroImage").alt=`غلاف ${u.title}`;
  $("unitLabel").textContent=u.label; $("unitTitle").textContent=u.title;
  $("unitProgressLabel").textContent=p.done?`أكملت ${digits(p.done)} من ${digits(p.total)} محطة`:"ابدأ أول درس في رحلتك";
  $("unitPercent").textContent=`${digits(p.percent)}٪`; $("unitProgressBar").style.width=`${p.percent}%`;
  $("lessonsGrid").innerHTML=u.lessons.map((l,i)=>{
    const key=lessonKey(u.id,l.id), done=state.completedStations.filter(x=>x.startsWith(`${key}-`)).length, complete=state.completedLessons.includes(key);
    return `<article class="lesson-card ${complete?"completed":""}" data-number="${digits(i+1)}"><span class="lesson-type">${complete?"✓ مكتمل":l.type}</span><h4>${l.title}</h4><p>صفحة الكتاب ${digits(l.page)} • ${digits(done)} من ٩ محطات</p><button type="button" data-lesson="${l.id}">${done?"تابع الرحلة":"ابدأ الدرس"}</button></article>`;
  }).join("");
  document.querySelectorAll("[data-lesson]").forEach(b=>b.onclick=()=>openLesson(+b.dataset.lesson));
  showScreen("unitScreen");
}

function openLesson(id) {
  state.currentLesson=id;
  const nextKey=lessonKey(), switched=state.activeLessonKey!==nextKey;
  if(switched){state.currentStation=0;state.challengeIndex=0;state.activeLessonKey=nextKey;}
  state.currentStation=Math.min(Math.max(+state.currentStation||0,0),8);
  $("lessonUnitName").textContent=unit().title; $("lessonTitle").textContent=lesson().title;
  renderStation(); showScreen("lessonScreen");
}

function markStation(index) {
  const key=stationKey(index);
  if (!state.completedStations.includes(key)) {
    state.completedStations.push(key); state.stars+=2; state.coins+=5; player(); save(); toast("رائع! +٢ نجمة و +٥ عملات 🏅");
  }
}

function renderRail() {
  $("stationList").innerHTML=STATIONS.map(([icon,title],i)=>{
    const done=state.completedStations.includes(stationKey(i)), locked=i===8&&!state.completedStations.includes(stationKey(7));
    return `<button class="station-step ${i===state.currentStation?"is-active":""} ${done?"is-done":""} ${locked?"is-locked":""}" type="button" data-station="${i}" ${locked?"disabled title=\"أكمل تذكرة الخروج أولًا\"":""}><span>${done?"✓":locked?"🔒":icon}</span><b>${title}</b></button>`;
  }).join("");
  document.querySelectorAll("[data-station]").forEach(b=>b.onclick=()=>{state.currentStation=+b.dataset.station;save();renderStation();});
}

function quizMarkup(q,id) {
  return `<div class="activity-card quiz-card" id="${id}"><h3>${q[0]}</h3><div class="question-options">${q[1].map((x,i)=>`<button class="option-btn" type="button" data-answer="${i}">${x}</button>`).join("")}</div><p class="feedback"></p></div>`;
}

function clean(value){return String(value).replace(/[٠-٩]/g,d=>String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[ًٌٍَُِّْـ]/g,"").replace(/[؟?!،,.؛:«»]/g,"").replace(/[أإآ]/g,"ا").trim().toLowerCase();}
function safeText(value){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));}
function choice(question,correct,wrong,shift=0,type="mcq",label="اختياري"){
  const options=[correct,...wrong.slice(0,2)];
  for(let i=0;i<shift%3;i++)options.push(options.shift());
  return {type,label,q:question,options,answer:options.indexOf(correct)};
}
function blankIdea(idea){
  const words=idea.replace(/[.،؟]/g,"").split(/\s+/);const answer=words.pop();
  return {q:`أكمل: ${words.join(" ")} ____`,answers:[answer]};
}
function buildExercises(l,u){
  const otherUnits=CURRICULUM.filter(x=>x.id!==u.id).map(x=>x.title);
  const otherLessons=u.lessons.filter(x=>x.id!==l.id).map(x=>x.title);
  const mcq=[
    choice(l.check[0],l.check[1][l.check[2]],l.check[1].filter((_,i)=>i!==l.check[2]),l.id),
    choice(l.exit[0],l.exit[1][l.exit[2]],l.exit[1].filter((_,i)=>i!==l.exit[2]),l.id+1),
    choice("إلى أي وحدة ينتمي هذا الدرس؟",u.title,otherUnits,l.id+2),
    choice("اختر عنوان الدرس الحالي.",l.title,otherLessons,l.id),
    choice("ما نوع هذا الدرس؟",l.type,["إملاء فقط","حساب ذهني"],l.id+1),
    choice("ما صفحة بداية الدرس في الكتاب؟",String(l.page),[String(l.page+2),String(Math.max(1,l.page-2))],l.id+2),
    choice("أي فكرة ترتبط بالدرس؟",l.ideas[0],["إهمال الفكرة الرئيسة.","رفض التعلم من المواقف."],l.id),
    choice("اختر هدفًا صحيحًا من أهداف الدرس.",l.ideas[1]||l.ideas[0],["حفظ الأرقام فقط.","الابتعاد عن القراءة."],l.id+1)
  ];
  const tf=[
    {type:"tf",label:"صح أم خطأ",q:`عنوان الدرس هو «${l.title}».`,answer:true},
    {type:"tf",label:"صح أم خطأ",q:`ينتمي الدرس إلى وحدة «${u.title}».`,answer:true},
    {type:"tf",label:"صح أم خطأ",q:`نوع الدرس: ${l.type}.`,answer:true},
    {type:"tf",label:"صح أم خطأ",q:l.ideas[0],answer:true},
    {type:"tf",label:"صح أم خطأ",q:l.ideas[1]||l.ideas[0],answer:true},
    {type:"tf",label:"صح أم خطأ",q:`لا توجد أي صلة بين درس «${l.title}» والفكرة: ${l.ideas[0]}`,answer:false}
  ];
  const b0=blankIdea(l.ideas[0]),b1=blankIdea(l.ideas[1]||l.ideas[0]);
  const fill=[
    {type:"fill",label:"أكمل",q:"اكتب عنوان الدرس.",answers:[l.title]},
    {type:"fill",label:"أكمل",q:"اكتب اسم الوحدة.",answers:[u.title]},
    {type:"fill",label:"أكمل",q:"اكتب رقم صفحة بداية الدرس.",answers:[String(l.page),digits(l.page)]},
    {type:"fill",label:"أكمل",q:b0.q,answers:b0.answers},
    {type:"fill",label:"أكمل",q:b1.q,answers:b1.answers},
    {type:"fill",label:"أكمل",q:"اكتب نوع الدرس كما يظهر في بطاقة الدرس.",answers:[l.type]}
  ];
  const dragIdeas=[l.ideas[0],l.ideas[1]||l.ideas[0],l.ideas[2]||l.ideas[0]];
  const drag=dragIdeas.map((answer,i)=>choice(`اسحب الفكرة التي تنتمي إلى درس «${l.title}».`,answer,["فكرة بعيدة عن موضوع الدرس.","إهمال القراءة والعمل."],i+l.id,"drag","سحب وإدراج"));
  drag.push(choice("اسحب بطاقة الوحدة الصحيحة إلى الصندوق.",u.title,otherUnits,l.id,"drag","سحب وإدراج"));
  drag.push(choice("اسحب نوع الدرس الصحيح.",l.type,["هندسة","تجربة علمية"],l.id+1,"drag","سحب وإدراج"));
  const write=[
    {type:"write",label:"كتابة تفاعلية",q:l.prior},
    {type:"write",label:"كتابة تفاعلية",q:l.discussion},
    {type:"write",label:"كتابة تفاعلية",q:l.application},
    {type:"write",label:"لخّص",q:`لخّص درس «${l.title}» في جملة مفيدة.`},
    {type:"write",label:"عبّر",q:"اكتب قيمة تعلمتها، ثم اذكر كيف ستطبقها."}
  ];
  return [...mcq,...tf,...fill,...drag,...write];
}

function challengeMarkup(l,u){
  const bank=buildExercises(l,u), key=lessonKey(), answers=state.challengeAnswers[key]||{}, index=Math.min(Math.max(+state.challengeIndex||0,0),29), ex=bank[index];
  state.challengeIndex=index;
  const answered=Object.keys(answers).length, score=Object.values(answers).filter(x=>x.correct).length;
  if(state.completedLessons.includes(key))return `<div class="challenge-result"><span>🏆</span><h3>أنهيت تحدي الثلاثين سؤالًا!</h3><p>نتيجتك: <b>${digits(score)} / ٣٠</b></p><div class="challenge-meter"><i style="width:${score/30*100}%"></i></div>${whatsApp(l,u)}</div>`;
  let body="";const saved=answers[index];
  if(ex.type==="mcq"||ex.type==="tf"){
    const options=ex.type==="tf"?["صح","خطأ"]:ex.options;
    body=`<div class="exercise-options">${options.map((x,i)=>`<button class="exercise-option ${saved&&String(saved.value)===String(i)?(saved.correct?"correct":"wrong"):""}" type="button" data-exercise-value="${i}">${x}</button>`).join("")}</div>`;
  }else if(ex.type==="fill"){
    body=`<div class="fill-row"><input id="fillAnswer" value="${safeText(saved?.value||"")}" placeholder="اكتب الإجابة هنا"><button id="checkFill" type="button">تحقق</button></div>`;
  }else if(ex.type==="drag"){
    body=`<div class="drag-options">${ex.options.map((x,i)=>`<button draggable="true" class="drag-chip" type="button" data-drag-value="${i}">${x}</button>`).join("")}</div><div class="drop-zone ${saved?(saved.correct?"correct":"wrong"):""}" id="dropZone">${saved?safeText(ex.options[saved.value]):"اسحب الإجابة الصحيحة إلى هنا"}</div><small>يمكنك أيضًا الضغط على البطاقة بدل السحب.</small>`;
  }else{
    body=`<textarea class="reflection-input" id="writeAnswer" rows="5" placeholder="اكتب إجابتك…">${safeText(saved?.value||"")}</textarea><button class="save-note" id="saveExerciseWriting" type="button">اعتمد إجابتي</button>`;
  }
  const dots=bank.map((_,i)=>`<button class="question-dot ${answers[i]?"answered":""} ${i===index?"active":""}" type="button" data-question-index="${i}">${digits(i+1)}</button>`).join("");
  return `<div class="challenge-shell"><div class="challenge-head"><div><span class="exercise-type">${ex.label}</span><b>السؤال ${digits(index+1)} من ٣٠</b></div><span>${digits(answered)} مجاب • ${digits(score)} صحيح</span></div><div class="challenge-meter"><i style="width:${answered/30*100}%"></i></div><div class="question-dots">${dots}</div><div class="exercise-card"><h3>${ex.q}</h3>${body}<p class="exercise-feedback">${saved?(saved.correct?"إجابة موفقة ⭐":"راجع الفكرة وحاول مرة أخرى."):""}</p></div><div class="challenge-nav"><button type="button" data-challenge-move="prev" ${index===0?"disabled":""}>السابق</button><button type="button" data-challenge-move="${index===29?"finish":"next"}">${index===29?"اعرض النتيجة":"التالي"}</button></div></div>`;
}

function whatsApp(l,u) {
  const answers=state.challengeAnswers[lessonKey()]||{}, score=Object.values(answers).filter(x=>x.correct).length;
  const msg=`السلام عليكم أستاذ أحمد حسن، أنا الطالب/ة ${state.name}، أتممت مشاهدة وحل درس «${l.title}» من وحدة «${u.title}» على المنصة، وأجبت عن تحدي الثلاثين سؤالًا وحصلت على ${score} من 30. رصيدي الآن ${state.stars} نجمة. شكرًا لك.`;
  return `<a class="whatsapp-complete" href="https://wa.me/${TEACHER_WHATSAPP}?text=${encodeURIComponent(msg)}" target="_blank" rel="noopener">أرسل إنجازي للمعلم عبر واتساب</a>`;
}

function content(i,l,u) {
  if(i===0)return `<div class="activity-card curiosity-card"><img src="${u.cover}" alt="مشهد يمهّد لدرس ${l.title}"><div><h3>لغز البداية</h3><p>${l.curiosity}</p><button class="reveal-btn" id="revealPrompt" type="button">فكّر ثم اكشف المفتاح</button><p class="hidden-hint" id="promptHint">اربط اللغز بعنوان الدرس: <b>${l.title}</b></p></div></div>`;
  if(i===1)return `<div class="activity-card"><h3>استدعِ خبرتك السابقة</h3><p>${l.prior}</p><textarea class="reflection-input" id="priorAnswer" rows="4" placeholder="دوّن أفكارك هنا…">${safeText(state.priorAnswers[lessonKey()]||"")}</textarea><button class="save-note" id="savePrior" type="button">احفظ فكرتي</button></div>`;
  if(i===2)return `<div class="video-frame"><iframe src="https://www.youtube.com/embed/${l.video}" title="شرح درس ${l.title}" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe></div>${l.resources.length?`<div class="resource-links">${l.resources.map(r=>`<a href="https://youtu.be/${r[1]}" target="_blank" rel="noopener">▶ ${r[0]}</a>`).join("")}</div>`:""}`;
  if(i===3)return quizMarkup(l.check,"checkQuiz");
  if(i===4)return `<div class="activity-card"><h3>الأفكار الرئيسة</h3><ul class="ideas-list">${l.ideas.map(x=>`<li>${x}</li>`).join("")}</ul></div><div class="activity-card discussion-card"><h3>سؤال المناقشة</h3><p>${l.discussion}</p></div>`;
  if(i===5)return `<div class="activity-card"><h3>مهمة الفريق</h3><ol class="group-steps">${l.group.map(x=>`<li>${x}</li>`).join("")}</ol><p class="team-badge">🤝 نجاحكم في الاستماع لبعضكم جزء من التحدي.</p></div>`;
  if(i===6)return `<div class="activity-card"><h3>استخدم ما تعلمته</h3><p>${l.application}</p><textarea class="reflection-input" id="applicationAnswer" rows="5" placeholder="اكتب تطبيقك هنا…">${safeText(state.applications[lessonKey()]||"")}</textarea><button class="save-note" id="saveApplication" type="button">احفظ تطبيقي</button></div>`;
  if(i===7)return `${quizMarkup(l.exit,"exitQuiz")}<div class="completion-burst"><strong>تذكرة العبور إلى التحدي</strong><p>أجب إجابة صحيحة لتفتح محطة الثلاثين سؤالًا.</p></div>`;
  return challengeMarkup(l,u);
}

function actions(i){
  if(i===8)return `<div class="station-actions"><button class="prev-station" type="button" data-move="prev">تذكرة الخروج</button></div>`;
  if(i===7)return `<div class="station-actions"><button class="prev-station" type="button" data-move="prev">المحطة السابقة</button><button class="next-station" id="exitNext" type="button" data-move="next" ${state.completedStations.includes(stationKey(7))?"":"disabled"}>افتح تحدي ٣٠ سؤالًا ←</button></div>`;
  return `<div class="station-actions">${i?`<button class="prev-station" type="button" data-move="prev">المحطة السابقة</button>`:`<span></span>`}<button class="next-station" type="button" data-move="next">أكملت المحطة • تابع ←</button></div>`;
}

function renderStation(){
  const l=lesson(),u=unit(),i=state.currentStation,m=STATIONS[i];
  $("lessonProgressText").textContent=`${digits(i+1)} من ٩`; renderRail();
  $("stationStage").innerHTML=`<div class="station-topline"><div class="station-kicker"><span class="station-icon">${m[0]}</span><span>المحطة ${digits(i+1)} • ${m[1]}</span></div><span class="page-ref">الكتاب: ص ${digits(l.page)}</span></div><h2>${l.title}</h2><p class="transition-line">${TRANSITIONS[i]}</p>${content(i,l,u)}${actions(i)}`;
  bindStation(i,l,u);
}

function bindQuiz(id,q,onCorrect){
  const box=$(id); if(!box)return;
  box.querySelectorAll("[data-answer]").forEach(b=>b.onclick=()=>{
    box.querySelectorAll("[data-answer]").forEach(x=>x.classList.remove("correct","wrong"));
    const ok=+b.dataset.answer===q[2]; b.classList.add(ok?"correct":"wrong");
    box.querySelector(".feedback").textContent=ok?"إجابة موفقة! لقد التقطت الفكرة. ⭐":"اقتربت! أعد التفكير واختر الإجابة الأدق.";
    if(ok)onCorrect();
  });
}

function bindChallenge(l,u){
  const bank=buildExercises(l,u), key=lessonKey(), index=state.challengeIndex, ex=bank[index];
  if(!state.challengeAnswers[key])state.challengeAnswers[key]={};
  const grade=(value,correct)=>{state.challengeAnswers[key][index]={value,correct};save();renderStation();};
  document.querySelectorAll("[data-question-index]").forEach(b=>b.onclick=()=>{state.challengeIndex=+b.dataset.questionIndex;save();renderStation();});
  document.querySelectorAll("[data-exercise-value]").forEach(b=>b.onclick=()=>{const value=+b.dataset.exerciseValue;const correct=ex.type==="tf"?value===(ex.answer?0:1):value===ex.answer;grade(value,correct);});
  if($("checkFill"))$("checkFill").onclick=()=>{const value=$("fillAnswer").value.trim();if(!value)return toast("اكتب الإجابة أولًا.");grade(value,ex.answers.some(a=>clean(a)===clean(value)));};
  if($("saveExerciseWriting"))$("saveExerciseWriting").onclick=()=>{const value=$("writeAnswer").value.trim();if(value.length<5)return toast("اكتب إجابة أوضح من خمس حروف على الأقل.");grade(value,true);};
  document.querySelectorAll("[data-drag-value]").forEach(b=>{
    b.onclick=()=>grade(+b.dataset.dragValue,+b.dataset.dragValue===ex.answer);
    b.ondragstart=e=>e.dataTransfer.setData("text/plain",b.dataset.dragValue);
  });
  if($("dropZone")){
    $("dropZone").ondragover=e=>e.preventDefault();
    $("dropZone").ondrop=e=>{e.preventDefault();const value=+e.dataTransfer.getData("text/plain");grade(value,value===ex.answer);};
  }
  document.querySelectorAll("[data-challenge-move]").forEach(b=>b.onclick=()=>{
    const answers=state.challengeAnswers[key];
    if(b.dataset.challengeMove==="prev")state.challengeIndex=Math.max(0,index-1);
    else if(b.dataset.challengeMove==="next"){
      if(!answers[index])return toast("أجب عن السؤال قبل الانتقال.");
      state.challengeIndex=Math.min(29,index+1);
    }else{
      if(Object.keys(answers).length<30)return toast(`بقي ${30-Object.keys(answers).length} سؤالًا دون إجابة.`);
      markStation(8);completeLesson(l,u);return;
    }
    save();renderStation();
  });
}

function bindStation(i,l,u){
  document.querySelectorAll("[data-move]").forEach(b=>b.onclick=()=>{if(b.dataset.move==="next"){markStation(i);state.currentStation=Math.min(8,i+1);}else state.currentStation=Math.max(0,i-1);save();renderStation();});
  if(i===0)$("revealPrompt").onclick=()=>$("promptHint").classList.add("show");
  if(i===1)$("savePrior").onclick=()=>{const v=$("priorAnswer").value.trim();if(!v)return toast("اكتب فكرة قصيرة أولًا.");state.priorAnswers[lessonKey()]=v;markStation(i);save();toast("حُفظت فكرتك الأولى 🧠");};
  if(i===3)bindQuiz("checkQuiz",l.check,()=>markStation(i));
  if(i===6)$("saveApplication").onclick=()=>{const v=$("applicationAnswer").value.trim();if(!v)return toast("اكتب تطبيقًا قصيرًا أولًا.");state.applications[lessonKey()]=v;markStation(i);save();toast("تم حفظ تطبيقك ✍️");};
  if(i===7)bindQuiz("exitQuiz",l.exit,()=>{markStation(i);if($("exitNext"))$("exitNext").disabled=false;});
  if(i===8)bindChallenge(l,u);
}

function completeLesson(l,u){
  const key=lessonKey();if(!state.completedLessons.includes(key)){state.completedLessons.push(key);state.stars+=10;state.coins+=20;}save();player();renderStation();toast("حصلت على شارة الدرس و١٠ نجوم! 🏆");
}

function toast(message){$("toast").textContent=message;$("toast").classList.add("show");setTimeout(()=>$("toast").classList.remove("show"),2200);}

$("studentForm").onsubmit=e=>{e.preventDefault();const name=$("studentName").value.trim();if(!name)return;state.name=name;player();renderUnits();showScreen("unitsScreen");toast(`انطلقت الرحلة يا ${name}! ⭐`);};
$("backToUnits").onclick=()=>{renderUnits();showScreen("unitsScreen");};
$("backToUnit").onclick=()=>openUnit(state.currentUnit);
const teacherOpen=()=>$("teacherDialog").showModal();
$("teacherOpen").onclick=teacherOpen;$("teacherOpenUnits").onclick=teacherOpen;$("teacherClose").onclick=()=>$("teacherDialog").close();
$("teacherDialog").onclick=e=>{if(e.target===$("teacherDialog"))$("teacherDialog").close();};

window.platformDiagnostics={units:CURRICULUM.length,lessons:CURRICULUM.reduce((n,u)=>n+u.lessons.length,0),exerciseCounts:CURRICULUM.flatMap(u=>u.lessons.map(l=>buildExercises(l,u).length))};
player();renderUnits();
if(state.name){$("studentName").value=state.name;if(state.view==="lessonScreen")openLesson(state.currentLesson);else if(state.view==="unitScreen")openUnit(state.currentUnit);else showScreen(state.view==="unitsScreen"?"unitsScreen":"welcomeScreen",false);}else showScreen("welcomeScreen",false);
