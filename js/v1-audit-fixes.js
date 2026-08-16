(() => {
  const Fix = window.V1AuditFixes = {
    streakKey: 'ib_streak_v2', activeSubject: 'Biology SL', activeAssessment: {},
    subjects: ['English B HL','Biology SL','ESS HL','Math AI SL'], installed:false, englishPatched:false,
    today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;},
    shift(key,n){const p=String(key||'').split('-').map(Number),d=new Date(p[0],p[1]-1,p[2],12);d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;},
    streakData(){
      const today=this.today(), saved=Storage.load(this.streakKey)||{}, q={...(saved.qualifiedDates||{})};
      Object.entries(DailyChallenge.history?.completedDates||{}).forEach(([k,v])=>{if(v)q[k]=true;});
      const start=/^\d{4}-\d{2}-\d{2}$/.test(saved.startedDate||'')?saved.startedDate:(DailyChallenge.history?.startedDate||today);
      return {schemaVersion:2,startedDate:start>today?today:start,qualifiedDates:q};
    },
    syncQualification(){const h=this.streakData();if(Object.values(DailyChallenge.data?.claimed||{}).filter(Boolean).length>=2)h.qualifiedDates[this.today()]=true;Storage.save(this.streakKey,h);return h;},
    currentStreak(){const h=this.streakData(),t=this.today();let k=h.qualifiedDates[t]?t:this.shift(t,-1),n=0;while(k>=h.startedDate&&h.qualifiedDates[k]){n++;k=this.shift(k,-1);}return n;},
    bestStreak(){const h=this.streakData(),dates=Object.keys(h.qualifiedDates).filter(k=>h.qualifiedDates[k]).sort();let best=0,n=0,prev=null;dates.forEach(k=>{n=prev&&this.shift(prev,1)===k?n+1:1;best=Math.max(best,n);prev=k;});return best;},
    syncStreak(){
      this.syncQualification();
      const dates=Object.keys(this.streakData().qualifiedDates).sort();
      Streak.data={schemaVersion:2,lastStudyDate:dates.at(-1)||null,count:this.currentStreak()};
      Storage.save('ib_streak',Streak.data);Streak.render();
      if(typeof Achievements!=='undefined'&&typeof Progress!=='undefined')Achievements.check(Progress.data);
    },
    patchStreak(){
      if(Streak.__twoOfThreeMissionRule)return;
      const rec=DailyChallenge.recordQuestion.bind(DailyChallenge), hist=DailyChallenge.renderHistoryPanel.bind(DailyChallenge), self=this;
      DailyChallenge.recordQuestion=function(...a){const r=rec(...a);self.syncStreak();this.render();return r;};
      DailyChallenge.getCurrentMissionStreak=()=>self.currentStreak();DailyChallenge.getBestMissionStreak=()=>self.bestStreak();
      DailyChallenge.renderHistoryPanel=function(...a){const r=hist(...a),el=document.getElementById('daily-history-start-note');if(el)el.textContent=`${el.textContent} Streak counts days with at least 2 of 3 Daily Missions complete; calendar checkmarks show all 3 complete.`.trim();return r;};
      Streak.load=()=>self.syncStreak();Streak.updateStudyStatus=()=>self.syncStreak();Streak.render=function(){const el=document.getElementById('streak');if(el)el.textContent=String(Number(this.data?.count||0));};
      Streak.__twoOfThreeMissionRule=true;this.syncStreak();DailyChallenge.render();
    },
    patchEnglish(){
      if(this.englishPatched||typeof EnglishBPaper1==='undefined')return;
      const m=EnglishBPaper1, render=m.renderSelectedTask.bind(m), submit=m.submit.bind(m), save=m.saveSelfMark.bind(m);
      m.attemptSaved=false;
      m.renderSelectedTask=function(...a){this.attemptSaved=false;return render(...a);};
      m.submit=function(...a){this.attemptSaved=false;const r=submit(...a),s=document.getElementById('engb-p1-save-status'),b=s?.previousElementSibling;if(b?.tagName==='BUTTON')b.id='engb-p1-save-attempt';return r;};
      m.saveSelfMark=function(...a){
        const s=document.getElementById('engb-p1-save-status');if(this.attemptSaved){if(s)s.textContent='This attempt is already saved.';return;}
        const before=(Storage.load('ib_english_b_paper1_progress')?.attempts||[]).length,r=save(...a),after=(Storage.load('ib_english_b_paper1_progress')?.attempts||[]).length;
        if(after>before){this.attemptSaved=true;const b=document.getElementById('engb-p1-save-attempt')||s?.previousElementSibling;if(b?.tagName==='BUTTON'){b.disabled=true;b.textContent='Attempt Saved';}}
        return r;
      };
      this.englishPatched=true;
    },
    attempts(key){return Storage.load(key)?.attempts||[];},
    allAttempts(){return [...this.attempts('ib_paper1_progress'),...this.attempts('ib_paper2_progress'),...this.attempts('ib_english_b_paper1_progress'),...this.attempts('ib_english_b_paper2_reading_progress'),...this.attempts('ib_english_b_paper2_listening_progress')];},
    assessment(a){
      if(a.subject==='English B HL')return a.assessmentTarget;
      if(a.subject==='Biology SL')return ['paper1a','paper1b'].includes(a.section)?a.section:a.assessmentTarget;
      if(a.subject==='ESS HL')return a.assessmentTarget||(a.section==='esspaper1'?'ess-paper1':null);
      if(a.subject==='Math AI SL')return a.assessmentTarget==='math-paper2'?'math-paper2':(a.assessmentTarget==='math-paper1'||a.section==='paper1b'?'math-paper1':null);
      return null;
    },
    sections(subject){return ({
      'English B HL':[['english-b-paper1-writing','Paper 1 Writing'],['english-b-paper2-reading','Paper 2 Reading'],['english-b-paper2-listening','Paper 2 Listening']],
      'Biology SL':[['paper1a','Paper 1A'],['paper1b','Paper 1B'],['paper2a','Paper 2A'],['paper2b','Paper 2B']],
      'ESS HL':[['ess-paper1','Paper 1'],['ess2a','Paper 2A'],['ess2b','Paper 2B']],
      'Math AI SL':[['math-paper1','Paper 1'],['math-paper2','Paper 2']]
    })[subject]||[];},
    esc(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#039;');},
    ensureStyles(){if(document.getElementById('v1-audit-fixes-style'))return;const s=document.createElement('style');s.id='v1-audit-fixes-style';s.textContent='#home-page .home-stat-grid,#practice-page .practice-mini-stats{grid-template-columns:repeat(4,minmax(0,1fr))}#all-subject-final-progress{margin-top:14px}@media(max-width:700px){#home-page .home-stat-grid,#practice-page .practice-mini-stats{grid-template-columns:repeat(2,minmax(0,1fr))}}';document.head.appendChild(s);},
    updateStats(){
      const grids=[document.querySelector('#home-page .home-stat-grid'),document.querySelector('#practice-page .practice-mini-stats')];
      grids.forEach((g,i)=>{if(!g)return;const id=i?'practice-exam-attempts':'exam-attempts';if(!document.getElementById(id)){const d=document.createElement('div');if(!i)d.className='home-stat';d.innerHTML=`<span>Exam Attempts</span><strong id="${id}">0</strong>`;g.appendChild(d);}document.getElementById(id).textContent=String(this.allAttempts().length);});
      const h=document.querySelectorAll('#home-page .home-stat-grid .home-stat>span');if(h[0])h[0].textContent='Quiz Questions';if(h[1])h[1].textContent='Quiz Accuracy';if(h[2])h[2].textContent='Quiz XP';
      const p=document.querySelectorAll('#practice-page .practice-mini-stats>div>span');if(p[0])p[0].textContent='Quiz Questions';if(p[1])p[1].textContent='Quiz Accuracy';if(p[2])p[2].textContent='Quiz XP';
    },
    syncPracticeAchievements(){const p=document.getElementById('practice-achievements');if(!p||typeof App==='undefined')return;p.style.display=App.state?.practiceType==='vocabulary'?'block':'none';},
    panel(){let p=document.getElementById('all-subject-final-progress');if(p)return p;const page=document.getElementById('statistics-page');if(!page)return null;p=document.createElement('section');p.id='all-subject-final-progress';p.className='progress-panel paper2-progress-panel';const bio=document.getElementById('paper2-progress-panel');bio?bio.insertAdjacentElement('beforebegin',p):page.appendChild(p);return p;},
    renderProgress(){
      const p=this.panel();if(!p)return;const secs=this.sections(this.activeSubject);let id=this.activeAssessment[this.activeSubject];if(!secs.some(x=>x[0]===id))id=secs[0]?.[0];this.activeAssessment[this.activeSubject]=id;
      const arr=this.allAttempts().filter(a=>a.subject===this.activeSubject&&this.assessment(a)===id), valid=arr.filter(a=>Number(a.maxMarks)>0&&Number.isFinite(Number(a.score))),score=valid.reduce((s,a)=>s+Number(a.score),0),max=valid.reduce((s,a)=>s+Number(a.maxMarks),0),pct=max?Math.round(score/max*100):null,uniq=new Set(valid.map(a=>a.questionId||a.setId||a.attemptId)).size,recent=[...valid].sort((a,b)=>(Date.parse(b.createdAt)||0)-(Date.parse(a.createdAt)||0)).slice(0,5);
      p.innerHTML=`<div class="paper2-progress-heading"><div><p class="eyebrow">FINAL EXAM READINESS</p><h3>Final Exam Progress</h3><p class="muted">Exam attempts are tracked separately from Quiz Questions / Quiz Accuracy.</p></div><span>${this.allAttempts().length} total attempts</span></div><div class="final-exam-progress-tabs">${this.subjects.map(s=>`<button class="final-exam-progress-tab ${s===this.activeSubject?'active':''}" data-fix-subject="${this.esc(s)}">${this.esc(s)}</button>`).join('')}</div><div class="final-exam-progress-tabs">${secs.map(([k,l])=>`<button class="final-exam-progress-tab ${k===id?'active':''}" data-fix-section="${this.esc(k)}">${this.esc(l)}</button>`).join('')}</div><div class="paper2-progress-summary"><div class="paper2-progress-stat"><span>Attempts</span><strong>${valid.length}</strong></div><div class="paper2-progress-stat"><span>Marks</span><strong>${score} / ${max}</strong></div><div class="paper2-progress-stat"><span>Score</span><strong>${pct===null?'—':pct+'%'}</strong></div><div class="paper2-progress-stat"><span>Unique Practice</span><strong>${uniq}</strong></div></div><div class="paper2-progress-section"><div class="paper2-progress-section-heading"><h4>Recent Attempts</h4><span class="muted">Latest 5 saved</span></div>${recent.length?recent.map(a=>{const label=a.unit||a.chapter||(Array.isArray(a.chapters)?a.chapters.join(', '):'')||a.questionId||a.setId||'Practice attempt',ap=Number.isFinite(Number(a.percentage))?Number(a.percentage):(Number(a.maxMarks)?Math.round(Number(a.score)/Number(a.maxMarks)*100):0);return `<article class="paper2-recent-attempt"><div class="paper2-recent-main"><strong>${this.esc(label)}</strong><span>${this.esc(a.commandTerm||a.questionType||this.assessment(a)||'')}</span><small>${this.esc(new Date(a.createdAt||0).toLocaleString('ja-JP'))}</small></div><div class="paper2-recent-score"><strong>${Number(a.score)||0} / ${Number(a.maxMarks)||0}</strong><span>${ap}%</span></div></article>`;}).join(''):'<p class="muted paper2-progress-empty">No saved attempts for this section yet.</p>'}</div>`;
      p.querySelectorAll('[data-fix-subject]').forEach(b=>b.onclick=()=>{this.activeSubject=b.dataset.fixSubject;this.renderProgress();});p.querySelectorAll('[data-fix-section]').forEach(b=>b.onclick=()=>{this.activeAssessment[this.activeSubject]=b.dataset.fixSection;this.renderProgress();});
      const bio=document.getElementById('paper2-progress-panel');if(bio)bio.style.display=this.activeSubject==='Biology SL'?'block':'none';if(this.activeSubject==='Biology SL'&&typeof Paper2ProgressView!=='undefined'&&['paper1a','paper1b','paper2a','paper2b'].includes(id)&&Paper2ProgressView.activeAssessment!==id)Paper2ProgressView.setAssessment(id);
    },
    patchPages(){if(Pages.__v1AuditFix)return;const show=Pages.show.bind(Pages),self=this;Pages.show=function(page){const r=show(page);self.updateStats();self.syncPracticeAchievements();if(page==='statistics')self.renderProgress();return r;};Pages.__v1AuditFix=true;},
    install(){if(this.installed)return true;if(typeof Storage==='undefined'||typeof DailyChallenge==='undefined'||typeof Streak==='undefined'||typeof Pages==='undefined')return false;this.ensureStyles();this.patchStreak();this.patchPages();this.updateStats();this.syncPracticeAchievements();this.installed=true;return true;},
    boot(){let n=0;const t=setInterval(()=>{n++;const ok=this.install();this.patchEnglish();if(ok&&this.englishPatched){clearInterval(t);this.updateStats();this.renderProgress();}else if(n>=600){clearInterval(t);console.warn('v1 audit fixes did not fully initialize.');}},50);}
  };
  Fix.boot();
})();