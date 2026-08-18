(()=>{
const A=window.AdaptiveTraining={
  installed:false,
  recommendation:null,
  escape(value){
    return String(value??'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  },
  learned(){
    const values=App.getCourseCoverageItems?.('Biology SL')||App.state.biologyLearnedUnits||[];
    return [...new Set((Array.isArray(values)?values:[]).filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()))];
  },
  units(question){
    return [...new Set((Array.isArray(question?.requiredUnits)?question.requiredUnits:[])
      .filter(value=>typeof value==='string'&&value.trim()).map(value=>value.trim()))];
  },
  label(section){
    const labels={
      paper1a:'Paper 1A',
      paper1b:'Paper 1B',
      paper2a:'Paper 2 · Section A',
      paper2b:'Paper 2 · Section B'
    };
    return labels[section]||'Biology Practice';
  },
  catalog(){
    const out=[];
    const push=(questions,section)=>{
      (Array.isArray(questions)?questions:[]).forEach(question=>{
        if(question?.subject!=='Biology SL'||question?.assessmentTarget!==section||!question?.id)return;
        out.push({question,section});
      });
    };
    push(Paper1.paper1aQuestions,'paper1a');
    push(Paper1.paper1bQuestions,'paper1b');
    ['paper2a','paper2b'].forEach(section=>{
      push((Paper2.allQuestions||[]).filter(question=>question?.assessmentTarget===section),section);
    });
    return out;
  },
  attempts(){
    const p1=Paper1Progress.load().attempts.map(attempt=>({...attempt,_section:attempt?.section}));
    const p2=Paper2Progress.load().attempts.map(attempt=>({...attempt,_section:attempt?.assessmentTarget}));
    return [...p1,...p2];
  },
  mockScores(){
    const latest={paper1:null,paper2:null};
    const seen=new Set();
    const sources=[
      ['paper1',Paper1Progress.load().attempts],
      ['paper2',Paper2Progress.load().attempts]
    ];
    sources.forEach(([paper,items])=>{
      [...items]
        .filter(attempt=>attempt?.fullMock&&attempt?.sessionId&&Number(attempt.fullMockTotalMaxMarks)>0)
        .sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0))
        .forEach(attempt=>{
          const key=`${paper}:${attempt.sessionId}`;
          if(seen.has(key))return;
          seen.add(key);
          if(latest[paper]===null){
            latest[paper]=Math.round(Number(attempt.fullMockTotalScore)/Number(attempt.fullMockTotalMaxMarks)*100);
          }
        });
    });
    return latest;
  },
  buildCandidates(){
    const learned=new Set(this.learned());
    if(!learned.size)return[];
    const catalog=this.catalog().filter(item=>{
      const required=this.units(item.question);
      return required.length&&required.every(unit=>learned.has(unit));
    });
    const groups=new Map();
    catalog.forEach(item=>{
      this.units(item.question).forEach(unit=>{
        if(!learned.has(unit))return;
        const key=`${item.section}|${unit}`;
        if(!groups.has(key))groups.set(key,{section:item.section,unit,questionIds:new Set(),questions:[]});
        const group=groups.get(key);
        group.questionIds.add(item.question.id);
        group.questions.push(item.question);
      });
    });
    const attempts=this.attempts().filter(attempt=>!attempt?.fullMock);
    const mock=this.mockScores();
    return [...groups.values()].map(group=>{
      const matching=attempts
        .filter(attempt=>attempt?._section===group.section&&group.questionIds.has(attempt.questionId))
        .sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
      const recent=matching.slice(0,6);
      const score=recent.reduce((sum,attempt)=>sum+(Number(attempt.score)||0),0);
      const max=recent.reduce((sum,attempt)=>sum+(Number(attempt.maxMarks)||0),0);
      const accuracy=max?Math.round(score/max*100):null;
      const lastAt=matching.length?(Date.parse(matching[0].createdAt)||0):0;
      let tier=3;
      if(accuracy!==null&&accuracy<60)tier=0;
      else if(accuracy===null)tier=1;
      else if(accuracy<80)tier=2;
      const paper=group.section.startsWith('paper1')?'paper1':'paper2';
      return {
        ...group,
        attemptCount:matching.length,
        accuracy,
        lastAt,
        tier,
        paper,
        paperMockScore:mock[paper]
      };
    }).sort((a,b)=>{
      if(a.tier!==b.tier)return a.tier-b.tier;
      const aa=a.accuracy===null?101:a.accuracy;
      const ba=b.accuracy===null?101:b.accuracy;
      if(aa!==ba)return aa-ba;
      if(a.attemptCount!==b.attemptCount)return a.attemptCount-b.attemptCount;
      if(a.lastAt!==b.lastAt)return a.lastAt-b.lastAt;
      const am=a.paperMockScore===null?101:a.paperMockScore;
      const bm=b.paperMockScore===null?101:b.paperMockScore;
      if(am!==bm)return am-bm;
      return a.unit.localeCompare(b.unit,'en',{numeric:true});
    });
  },
  getRecommendation(){
    return this.buildCandidates()[0]||null;
  },
  reason(rec){
    if(!rec)return'';
    if(rec.tier===0)return'Recent performance is below 60%, so this is the highest-priority weakness.';
    if(rec.tier===1)return'This learned unit has no saved practice attempts yet, so it needs a baseline.';
    if(rec.tier===2)return'Recent performance is below 80%; another focused session should help.';
    return'No major weakness is recorded; this is the least-practised learned area currently available.';
  },
  priority(rec){
    if(!rec)return'';
    return rec.tier===0?'High':rec.tier===1?'Baseline':rec.tier===2?'Medium':'Review';
  },
  ensureUI(){
    if(!document.getElementById('adaptive-training-style')){
      const style=document.createElement('style');
      style.id='adaptive-training-style';
      style.textContent=`
        .adaptive-training-card{margin-top:18px;padding:20px;border:1px solid #d9e2ec;border-radius:18px;background:#fff}
        .adaptive-training-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}
        .adaptive-training-card h2{margin:4px 0 0}
        .adaptive-training-badge{flex:0 0 auto;padding:6px 10px;border-radius:999px;background:#eef4ff;font-size:.75rem;font-weight:850}
        .adaptive-training-target{margin-top:15px;padding:14px;border:1px solid #e4e7ec;border-radius:14px;background:#f8fafc}
        .adaptive-training-target strong,.adaptive-training-target span{display:block}
        .adaptive-training-target strong{margin-top:4px;font-size:1.05rem}
        .adaptive-training-meta{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}
        .adaptive-training-meta span{padding:5px 8px;border-radius:999px;background:#fff;border:1px solid #e4e7ec;font-size:.78rem;font-weight:750}
        .adaptive-training-reason{margin:10px 0 0;color:#475467;line-height:1.55}
        .adaptive-training-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}
        .adaptive-training-actions button{min-height:42px}
        @media(max-width:640px){.adaptive-training-head{flex-direction:column}.adaptive-training-badge{align-self:flex-start}}
      `;
      document.head.appendChild(style);
    }
    let card=document.getElementById('adaptive-training-card');
    if(!card){
      const home=document.getElementById('home-page');
      const dashboard=home?.querySelector('.home-dashboard');
      if(!home||!dashboard)return null;
      card=document.createElement('section');
      card.id='adaptive-training-card';
      card.className='adaptive-training-card';
      dashboard.insertAdjacentElement('afterend',card);
    }
    return card;
  },
  render(){
    const card=this.ensureUI();
    if(!card)return;
    const learned=this.learned();
    if(!learned.length){
      this.recommendation=null;
      card.innerHTML=`
        <div class="adaptive-training-head">
          <div><p class="eyebrow">ADAPTIVE TRAINING</p><h2>Recommended Training</h2></div>
          <span class="adaptive-training-badge">Biology SL</span>
        </div>
        <div class="adaptive-training-target">
          <span class="muted">Learned Units are not selected yet.</span>
          <strong>Select the Biology units already covered in class.</strong>
          <p class="adaptive-training-reason">Adaptive Training never recommends unlearned content.</p>
        </div>
        <div class="adaptive-training-actions"><button type="button" onclick="AdaptiveTraining.openSetup()">Open Biology Setup →</button></div>`;
      return;
    }
    const rec=this.getRecommendation();
    this.recommendation=rec;
    if(!rec){
      card.innerHTML=`
        <div class="adaptive-training-head">
          <div><p class="eyebrow">ADAPTIVE TRAINING</p><h2>Recommended Training</h2></div>
          <span class="adaptive-training-badge">Biology SL</span>
        </div>
        <div class="adaptive-training-target">
          <strong>No eligible Final Exam questions are available for the selected Learned Units yet.</strong>
          <p class="adaptive-training-reason">Normal practice remains available.</p>
        </div>`;
      return;
    }
    const performance=rec.accuracy===null
      ? 'No saved attempts yet'
      : `Recent performance: ${rec.accuracy}% · ${rec.attemptCount} attempt${rec.attemptCount===1?'':'s'}`;
    const mock=rec.paperMockScore===null?'':`<span>${this.escape(rec.paper==='paper1'?'Paper 1':'Paper 2')} Full Mock: ${rec.paperMockScore}%</span>`;
    card.innerHTML=`
      <div class="adaptive-training-head">
        <div><p class="eyebrow">ADAPTIVE TRAINING</p><h2>Recommended Training</h2></div>
        <span class="adaptive-training-badge">Priority: ${this.escape(this.priority(rec))}</span>
      </div>
      <div class="adaptive-training-target">
        <span class="muted">Biology SL · ${this.escape(this.label(rec.section))}</span>
        <strong>${this.escape(rec.unit)}</strong>
        <div class="adaptive-training-meta">
          <span>${this.escape(performance)}</span>
          <span>${rec.questions.length} eligible question${rec.questions.length===1?'':'s'}</span>
          ${mock}
        </div>
        <p class="adaptive-training-reason">${this.escape(this.reason(rec))}</p>
      </div>
      <div class="adaptive-training-actions">
        <button type="button" onclick="AdaptiveTraining.startRecommended()">Start Recommended Training →</button>
      </div>`;
  },
  resetExamModes(){
    const modules=[
      window.BiologyPaper1BMock,
      window.BiologyPaper1FullMock,
      window.BiologyPaper2FullMock
    ];
    modules.forEach(module=>{
      if(!module)return;
      if(module.active&&typeof module.stop==='function')module.stop();
      if('mode' in module)module.mode='practice';
      if(typeof module.sync==='function')module.sync();
    });
  },
  eligibleFor(rec,question){
    const learned=new Set(this.learned());
    const required=this.units(question);
    return question?.subject==='Biology SL'
      &&question?.assessmentTarget===rec.section
      &&required.length
      &&required.includes(rec.unit)
      &&required.every(unit=>learned.has(unit));
  },
  async startRecommended(){
    const rec=this.getRecommendation();
    if(!rec){
      this.render();
      return false;
    }
    this.recommendation=rec;
    this.resetExamModes();
    App.state.subject='Biology SL';
    App.state.practiceType=rec.section.startsWith('paper1')?'paper1':'paper2';
    App.state.practiceScope='all';
    App.state.selectedChapters=[];
    if(rec.section.startsWith('paper1'))App.state.paper1Section=rec.section;
    else App.state.paper2Section=rec.section;
    App.saveState();
    App.renderChapterSelector?.();
    App.applyPracticeScopeUI?.();
    App.applyPracticeTypeUI?.();

    if(rec.section.startsWith('paper1')){
      await App.ensurePaper1Module?.();
      await Paper1.init();
      const source=rec.section==='paper1b'?Paper1.paper1bQuestions:Paper1.paper1aQuestions;
      const pool=(source||[]).filter(question=>this.eligibleFor(rec,question));
      if(!pool.length){
        alert('No eligible Paper 1 questions are available for this recommendation.');
        return false;
      }
      Paper1.section=rec.section;
      Paper1.questions=pool;
      Paper1.current=Paper1.pickQuestion();
      Paper1.render();
    }else{
      const pool=(Paper2.allQuestions||[]).filter(question=>this.eligibleFor(rec,question));
      if(!pool.length){
        alert('No eligible Paper 2 questions are available for this recommendation.');
        return false;
      }
      Paper2.setQuestions(pool);
    }

    Pages.show('practice');
    App.updatePracticeHeader();
    const header=document.getElementById('selection-subject-practice');
    if(header)header.textContent=`Biology SL · ${this.label(rec.section)} · Adaptive: ${rec.unit}`;
    return true;
  },
  openSetup(){
    this.resetExamModes();
    App.state.subject='Biology SL';
    App.state.practiceType='paper1';
    App.state.paper1Section='paper1a';
    App.state.practiceScope='all';
    App.state.selectedChapters=[];
    App.saveState();
    App.renderChapterSelector?.();
    App.applyPracticeScopeUI?.();
    App.applyPracticeTypeUI?.();
    Pages.show('selection');
  },
  patchRefresh(){
    const wrap=progress=>{
      if(!progress||typeof progress.recordAttempt!=='function'||progress.__adaptiveTrainingWrapped)return;
      const original=progress.recordAttempt;
      progress.recordAttempt=function(...args){
        const saved=original.apply(this,args);
        if(saved)setTimeout(()=>A.render(),0);
        return saved;
      };
      progress.__adaptiveTrainingWrapped=true;
    };
    wrap(Paper1Progress);
    wrap(Paper2Progress);
    const originalShow=Pages.show;
    Pages.show=function(page,...args){
      const result=originalShow.call(this,page,...args);
      if(page==='home')setTimeout(()=>A.render(),0);
      return result;
    };
  },
  install(){
    if(this.installed)return true;
    if(typeof App==='undefined'||typeof Pages==='undefined'||typeof Paper1==='undefined'||typeof Paper2==='undefined'
      ||typeof Paper1Progress==='undefined'||typeof Paper2Progress==='undefined'
      ||typeof BiologyFinalTraining==='undefined'||!BiologyFinalTraining.paper1Loaded||!BiologyFinalTraining.paper2Loaded)return false;
    this.patchRefresh();
    this.installed=true;
    this.render();
    setTimeout(()=>this.render(),800);
    return true;
  },
  boot(){
    let attempts=0;
    const timer=setInterval(()=>{
      if(this.install()||++attempts>800){
        clearInterval(timer);
        if(!this.installed)console.warn('Adaptive Training could not initialize. Existing practice remains available.');
      }
    },50);
  }
};
A.boot();
})();