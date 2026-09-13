(()=>{
const A=window.AdaptiveTraining={
  installed:false,
  recommendation:null,
  subjects:['English B HL','Biology SL','ESS HL','Math AI SL'],

  escape(value){
    return String(value??'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;')
      .replace(/"/g,'&quot;')
      .replace(/'/g,'&#039;');
  },

  learned(subject){
    if(subject==='English B HL')return[];
    const values=App.getCourseCoverageItems?.(subject)||[];
    return [...new Set((Array.isArray(values)?values:[])
      .filter(value=>typeof value==='string'&&value.trim())
      .map(value=>value.trim()))];
  },

  units(question){
    return [...new Set((Array.isArray(question?.requiredUnits)?question.requiredUnits:[])
      .filter(value=>typeof value==='string'&&value.trim())
      .map(value=>value.trim()))];
  },

  assessmentLabel(subject,assessment){
    if(typeof FinalExamProgressV2!=='undefined'&&typeof FinalExamProgressV2.assessmentLabel==='function'){
      return FinalExamProgressV2.assessmentLabel(subject,assessment);
    }
    return assessment||'Final Exam Practice';
  },

  assessmentForQuestion(question){
    if(!question)return null;
    if(question.subject==='Biology SL'){
      if(['paper1a','paper1b','paper2a','paper2b'].includes(question.assessmentTarget))return question.assessmentTarget;
    }
    if(question.subject==='ESS HL'){
      if(['ess-paper1','ess2a','ess2b'].includes(question.assessmentTarget))return question.assessmentTarget;
    }
    if(question.subject==='Math AI SL'){
      if(['math-paper1','math-paper2'].includes(question.assessmentTarget))return question.assessmentTarget;
    }
    return question.assessmentTarget||null;
  },

  catalog(){
    const out=[];
    const seen=new Set();
    const push=questions=>{
      (Array.isArray(questions)?questions:[]).forEach(question=>{
        const subject=question?.subject;
        if(!['Biology SL','ESS HL','Math AI SL'].includes(subject)||!question?.id)return;
        const assessment=this.assessmentForQuestion(question);
        if(!assessment)return;
        const key=`${subject}|${assessment}|${question.id}`;
        if(seen.has(key))return;
        seen.add(key);
        out.push({question,subject,assessment});
      });
    };
    if(typeof Paper1!=='undefined'){
      push(Paper1.paper1aQuestions);
      push(Paper1.paper1bQuestions);
      push(Paper1.essPaper1Questions);
    }
    if(typeof Paper2!=='undefined')push(Paper2.allQuestions);
    return out;
  },

  attempts(subject){
    if(typeof FinalExamProgressV2==='undefined'||typeof FinalExamProgressV2.normalAttempts!=='function')return[];
    return FinalExamProgressV2.normalAttempts(subject);
  },

  tier(accuracy){
    if(accuracy===null)return 2;
    if(accuracy<60)return 0;
    if(accuracy<80)return 1;
    return 3;
  },

  improvement(rec){
    if(rec?.improvement?.status)return rec.improvement;
    return {status:'baseline',label:'Building baseline',delta:null,icon:'•'};
  },

  buildGeneralCandidates(){
    const catalog=this.catalog();
    const groups=new Map();
    catalog.forEach(item=>{
      const learned=new Set(this.learned(item.subject));
      if(!learned.size)return;
      const required=this.units(item.question);
      if(!required.length||!required.every(unit=>learned.has(unit)))return;
      required.forEach(unit=>{
        if(!learned.has(unit))return;
        const key=`${item.subject}|${item.assessment}|${unit}`;
        if(!groups.has(key))groups.set(key,{
          subject:item.subject,
          assessment:item.assessment,
          area:unit,
          unit,
          questionIds:new Set(),
          questions:[]
        });
        const group=groups.get(key);
        group.questionIds.add(item.question.id);
        group.questions.push(item.question);
      });
    });

    return [...groups.values()].map(group=>{
      const matching=this.attempts(group.subject)
        .filter(attempt=>FinalExamProgressV2.assessment(attempt)===group.assessment&&group.questionIds.has(attempt.questionId))
        .sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0));
      const recent=matching.slice(0,6);
      const score=recent.reduce((sum,attempt)=>sum+(Number(attempt.score)||0),0);
      const max=recent.reduce((sum,attempt)=>sum+(Number(attempt.maxMarks)||0),0);
      const accuracy=max?Math.round(score/max*100):null;
      const improvement=typeof FinalExamProgressV2.improvementFromAttempts==='function'
        ?FinalExamProgressV2.improvementFromAttempts(matching)
        :{status:'baseline',label:'Building baseline',delta:null,icon:'•'};
      return {
        ...group,
        label:`${this.assessmentLabel(group.subject,group.assessment)} · ${group.unit}`,
        accuracy,
        percentage:accuracy,
        attemptCount:matching.length,
        attempts:matching.length,
        lastAt:matching.length?(Date.parse(matching[0].createdAt)||0):0,
        tier:this.tier(accuracy),
        improvement,
        source:'final-exam',
        kind:'question-pool'
      };
    });
  },

  buildEnglishCandidates(){
    if(typeof FinalExamProgressV2==='undefined'||typeof FinalExamProgressV2.englishWeakAreas!=='function')return[];
    return FinalExamProgressV2.englishWeakAreas().map(weak=>({
      ...weak,
      accuracy:weak.percentage,
      attemptCount:weak.attempts,
      lastAt:0,
      tier:this.tier(weak.percentage),
      source:'final-exam',
      kind:'english-mode'
    }));
  },

  buildCandidates(){
    const candidates=[...this.buildGeneralCandidates(),...this.buildEnglishCandidates()];
    return candidates.sort((a,b)=>{
      if(a.tier!==b.tier)return a.tier-b.tier;
      const aa=a.accuracy===null?101:a.accuracy;
      const ba=b.accuracy===null?101:b.accuracy;
      if(aa!==ba)return aa-ba;
      if(a.attemptCount!==b.attemptCount)return a.attemptCount-b.attemptCount;
      if(a.lastAt!==b.lastAt)return a.lastAt-b.lastAt;
      return String(a.label||'').localeCompare(String(b.label||''),'en',{numeric:true});
    });
  },

  getRecommendations(subject=null,limit=3){
    const max=Math.max(1,Number(limit)||3);
    return this.buildCandidates()
      .filter(candidate=>!subject||candidate.subject===subject)
      .slice(0,max);
  },

  getRecommendation(){
    return this.getRecommendations(null,1)[0]||null;
  },

  reason(rec){
    if(!rec)return'';
    if(rec.tier===0)return'Recent Final Exam performance is below 60%, so this is the highest-priority weakness.';
    if(rec.tier===1)return'Recent Final Exam performance is below 80%, so another focused session should help.';
    if(rec.tier===2)return'This learned area has no saved Final Exam practice yet, so it needs a baseline.';
    return'No major Final Exam weakness is recorded; this is the best available review target.';
  },

  priority(rec){
    if(!rec)return'';
    return rec.tier===0?'High':rec.tier===1?'Medium':rec.tier===2?'Baseline':'Review';
  },

  performance(rec){
    if(!rec)return'';
    if(rec.accuracy===null)return'No saved attempts yet';
    const count=Number(rec.attemptCount||rec.attempts||0);
    return `${rec.accuracy}% · ${count} recent attempt${count===1?'':'s'}`;
  },

  ensurePracticeWeakStyles(){
    if(document.getElementById('adaptive-practice-weak-style'))return;
    const style=document.createElement('style');
    style.id='adaptive-practice-weak-style';
    style.textContent=`
      .adaptive-practice-weak-panel{margin:14px 0 18px;padding:14px;border:1px solid #e4e7ec;border-radius:14px;background:#f8fafc}
      .adaptive-practice-weak-heading{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;margin-bottom:10px}
      .adaptive-practice-weak-heading strong{display:block;font-size:1rem}
      .adaptive-practice-weak-heading small{display:block;margin-top:3px;color:#667085}
      .adaptive-practice-weak-list{display:grid;gap:8px}
      .adaptive-practice-weak-row{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:10px;border:1px solid #e4e7ec;border-radius:11px;background:#fff}
      .adaptive-practice-weak-copy strong,.adaptive-practice-weak-copy small{display:block}
      .adaptive-practice-weak-copy strong{font-size:.92rem}
      .adaptive-practice-weak-copy small{margin-top:3px;color:#667085;font-size:.76rem}
      .adaptive-practice-weak-trend[data-status="up"]{color:#027a48!important;font-weight:800}
      .adaptive-practice-weak-trend[data-status="down"]{color:#b42318!important;font-weight:800}
      .adaptive-practice-weak-trend[data-status="stable"]{color:#475467!important;font-weight:800}
      .adaptive-practice-weak-metric{text-align:right;white-space:nowrap}
      .adaptive-practice-weak-metric strong,.adaptive-practice-weak-metric small{display:block}
      .adaptive-practice-weak-metric small{margin-top:2px;color:#667085;font-size:.72rem}
      .adaptive-practice-weak-button{min-height:36px;padding:7px 11px;border:1px solid #cfd6df;border-radius:9px;background:#fff;font-weight:800;cursor:pointer}
      .adaptive-practice-weak-button:hover{border-color:#98a2b3}
      .adaptive-practice-weak-button:disabled{opacity:.55;cursor:default}
      .adaptive-practice-weak-empty{margin:0;color:#667085;font-size:.86rem;line-height:1.5}
      @media(max-width:600px){.adaptive-practice-weak-row{grid-template-columns:1fr auto}.adaptive-practice-weak-copy{grid-column:1/-1}.adaptive-practice-weak-metric{text-align:left}}
    `;
    document.head.appendChild(style);
  },

  ensurePracticeWeakPanel(){
    this.ensurePracticeWeakStyles();
    let panel=document.getElementById('adaptive-practice-weak-panel');
    if(panel)return panel;
    const selection=document.querySelector('#selection-page .selection-panel');
    const heading=selection?.querySelector('.selection-heading');
    if(!selection||!heading)return null;
    panel=document.createElement('section');
    panel.id='adaptive-practice-weak-panel';
    panel.className='adaptive-practice-weak-panel';
    heading.insertAdjacentElement('afterend',panel);
    return panel;
  },

  renderPracticeWeakAreas(){
    const panel=this.ensurePracticeWeakPanel();
    if(!panel)return;
    const subject=App?.state?.subject||null;
    if(!subject||!this.subjects.includes(subject)){
      panel.hidden=true;
      panel.innerHTML='';
      return;
    }
    panel.hidden=false;
    const targets=this.getRecommendations(subject,3);
    const heading=`<div class="adaptive-practice-weak-heading"><div><strong>Weakest Areas</strong><small>${this.escape(subject)} · Final Exam history first</small></div><small>Top ${targets.length||0} / 3</small></div>`;
    if(!targets.length){
      const note=subject==='English B HL'
        ?'No saved Final Exam weakness yet. Complete scored Writing, Reading or Listening practice to build this list.'
        :'No adaptive weak areas are available yet. Complete scored Final Exam practice and confirm Learned Content / Course Coverage.';
      panel.innerHTML=`${heading}<p class="adaptive-practice-weak-empty">${this.escape(note)}</p>`;
      return;
    }
    panel.innerHTML=`${heading}<div class="adaptive-practice-weak-list">${targets.map((target,index)=>{
      const accuracy=target.accuracy===null?'Baseline':`${target.accuracy}%`;
      const attempts=Number(target.attemptCount??target.attempts??0);
      const trend=this.improvement(target);
      return `<div class="adaptive-practice-weak-row">
        <div class="adaptive-practice-weak-copy">
          <strong>${this.escape(target.label||target.area||'Adaptive practice')}</strong>
          <small>${this.escape(`${this.priority(target)} priority · ${attempts} saved attempt${attempts===1?'':'s'}`)}</small>
          <small class="adaptive-practice-weak-trend" data-status="${this.escape(trend.status||'baseline')}">${this.escape(`${trend.icon||'•'} ${trend.label||'Building baseline'}`)}</small>
        </div>
        <div class="adaptive-practice-weak-metric"><strong>${this.escape(accuracy)}</strong><small>Recent</small></div>
        <button type="button" class="adaptive-practice-weak-button" data-adaptive-practice-review="${index}">Practice</button>
      </div>`;
    }).join('')}</div>`;
    panel.querySelectorAll('[data-adaptive-practice-review]').forEach(button=>{
      const target=targets[Number(button.dataset.adaptivePracticeReview)];
      if(!target)return;
      button.addEventListener('click',async()=>{
        button.disabled=true;
        try{
          await this.startRecommended(target);
        }finally{
          button.disabled=false;
        }
      });
    });
  },

  removeLegacyCard(){
    document.getElementById('adaptive-training-card')?.remove();
    document.getElementById('adaptive-training-style')?.remove();
  },

  render(){
    this.removeLegacyCard();
    this.recommendation=this.getRecommendation();
    this.renderPracticeWeakAreas();
    if(typeof HomeUIV2!=='undefined'&&typeof HomeUIV2.updateFocus==='function'){
      window.setTimeout(()=>HomeUIV2.updateFocus(),0);
    }
    return this.recommendation;
  },

  resetExamModes(){
    const modules=[
      window.BiologyPaper1BMock,
      window.BiologyPaper1FullMock,
      window.BiologyPaper2FullMock,
      window.EssPaper1FullMock,
      window.EssPaper2FullMock,
      window.MathAISLFullMock
    ];
    modules.forEach(module=>{
      if(!module)return;
      if(module.active&&typeof module.stop==='function')module.stop();
      if('mode' in module)module.mode='practice';
      if(typeof module.sync==='function')module.sync();
    });
  },

  practiceType(assessment){
    return ['paper1a','paper1b','ess-paper1','math-paper1','english-b-paper1-writing'].includes(assessment)
      ?'paper1':'paper2';
  },

  paper1Section(rec){
    if(rec.subject==='Biology SL')return rec.assessment==='paper1b'?'paper1b':'paper1a';
    if(rec.subject==='ESS HL')return'esspaper1';
    if(rec.subject==='Math AI SL')return'paper1b';
    return'paper1a';
  },

  paper2Section(rec){
    if(rec.subject==='Biology SL')return rec.assessment==='paper2b'?'paper2b':'paper2a';
    if(rec.subject==='ESS HL')return rec.assessment==='ess2b'?'ess2b':'ess2a';
    if(rec.subject==='Math AI SL')return'math-paper2';
    return'paper2a';
  },

  eligibleFor(rec,question){
    if(!rec||!question||question.subject!==rec.subject)return false;
    if(this.assessmentForQuestion(question)!==rec.assessment)return false;
    const learned=new Set(this.learned(rec.subject));
    const required=this.units(question);
    return learned.size>0
      &&required.length>0
      &&required.includes(rec.area)
      &&required.every(unit=>learned.has(unit));
  },

  async startEnglish(rec){
    App.selectSubject('English B HL');
    App.state.practiceScope='all';
    App.state.selectedChapters=[];
    if(rec.assessment==='english-b-paper1-writing'){
      App.state.practiceType='paper1';
    }else{
      App.state.practiceType='paper2';
      App.state.englishBPaper2Mode=rec.assessment==='english-b-paper2-listening'?'listening':'reading';
    }
    App.saveState();
    App.renderChapterSelector?.();
    App.applyPracticeScopeUI?.();
    App.applyPracticeTypeUI?.();
    await App.startPractice?.();
    const header=document.getElementById('selection-subject-practice');
    if(header)header.textContent=`English B HL · Adaptive: ${rec.label}`;
    return true;
  },

  async startQuestionPool(rec){
    App.selectSubject(rec.subject);
    App.state.practiceType=this.practiceType(rec.assessment);
    App.state.practiceScope='all';
    App.state.selectedChapters=[];
    if(App.state.practiceType==='paper1')App.state.paper1Section=this.paper1Section(rec);
    else App.state.paper2Section=this.paper2Section(rec);
    App.saveState();
    App.renderChapterSelector?.();
    App.applyPracticeScopeUI?.();
    App.applyPracticeTypeUI?.();

    if(App.state.practiceType==='paper1'){
      await App.ensurePaper1Module?.();
      await Paper1.init?.();
      const source=rec.subject==='ESS HL'
        ?Paper1.essPaper1Questions
        :rec.subject==='Biology SL'&&rec.assessment==='paper1a'
          ?Paper1.paper1aQuestions
          :Paper1.paper1bQuestions;
      const pool=(Array.isArray(source)?source:[]).filter(question=>this.eligibleFor(rec,question));
      if(!pool.length){
        alert('No eligible Paper 1 questions are available for this recommendation.');
        return false;
      }
      Paper1.section=this.paper1Section(rec);
      Paper1.questions=pool;
      Paper1.current=Paper1.pickQuestion();
      Paper1.render();
    }else{
      const pool=(Array.isArray(Paper2.allQuestions)?Paper2.allQuestions:[]).filter(question=>this.eligibleFor(rec,question));
      if(!pool.length){
        alert('No eligible Paper 2 questions are available for this recommendation.');
        return false;
      }
      Paper2.setQuestions(pool);
    }

    Pages.show('practice');
    App.updatePracticeHeader?.();
    const header=document.getElementById('selection-subject-practice');
    if(header)header.textContent=`${rec.subject} · ${this.assessmentLabel(rec.subject,rec.assessment)} · Adaptive: ${rec.area}`;
    return true;
  },

  async startRecommended(rec=null){
    const target=rec||this.getRecommendation();
    if(!target){
      this.render();
      return false;
    }
    this.recommendation=target;
    this.resetExamModes();
    if(target.subject==='English B HL')return this.startEnglish(target);
    return this.startQuestionPool(target);
  },

  openSetup(rec=null){
    const target=rec||this.getRecommendation();
    const subject=target?.subject||'Biology SL';
    this.resetExamModes();
    App.selectSubject(subject);
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
    wrap(typeof Paper1Progress!=='undefined'?Paper1Progress:null);
    wrap(typeof Paper2Progress!=='undefined'?Paper2Progress:null);

    if(typeof CourseCoverage!=='undefined'&&typeof CourseCoverage.setSelected==='function'&&!CourseCoverage.__adaptiveTrainingWrapped){
      const originalSet=CourseCoverage.setSelected;
      CourseCoverage.setSelected=function(...args){
        const result=originalSet.apply(this,args);
        setTimeout(()=>A.render(),0);
        return result;
      };
      CourseCoverage.__adaptiveTrainingWrapped=true;
    }

    if(!Pages.__adaptiveTrainingWrapped){
      const originalShow=Pages.show;
      Pages.show=function(page,...args){
        const result=originalShow.call(this,page,...args);
        if(page==='home')setTimeout(()=>A.render(),0);
        if(page==='selection')setTimeout(()=>A.renderPracticeWeakAreas(),0);
        return result;
      };
      Pages.__adaptiveTrainingWrapped=true;
    }

    window.addEventListener('storage',()=>A.render());
  },

  install(){
    if(this.installed)return true;
    if(typeof App==='undefined'||typeof Pages==='undefined'||typeof Paper1==='undefined'||typeof Paper2==='undefined'
      ||typeof FinalExamProgressV2==='undefined'||typeof CourseCoverage==='undefined')return false;
    this.patchRefresh();
    this.installed=true;
    this.render();
    setTimeout(()=>this.render(),800);
    setTimeout(()=>this.render(),2500);
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