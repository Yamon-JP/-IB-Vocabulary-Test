const Achievements = {
  data: {
    firstPractice: false,
    xp10: false,
    xp100: false,
    questions100: false,
    streak3: false,
    streak7: false,
    streak30: false,
    accuracy10: false,
    accuracy50: false,
    accuracy100: false,
    accuracy200: false
  },

  definitions: {
    firstPractice: { title: 'First Practice', description: 'Complete your first practice question' },
    xp10: { title: '10 XP Master', description: 'Earn your first 10 XP' },
    xp100: { title: '100 XP Learner', description: 'Reach 100 XP' },
    questions100: { title: '100 Questions', description: 'Complete 100 practice questions' },
    streak3: { title: '🔥 First Streak', description: 'Study for 3 consecutive days' },
    streak7: { title: '🔥 Weekly Warrior', description: 'Study for 7 consecutive days' },
    streak30: { title: '🔥 Monthly Master', description: 'Study for 30 consecutive days' },
    accuracy10: { title: '🎯 Sharp Learner', description: '10 correct answers in a row' },
    accuracy50: { title: '🎯 Precision Student', description: '50 correct answers in a row' },
    accuracy100: { title: '🎯 IB Accuracy Master', description: '100 correct answers in a row' },
    accuracy200: { title: '👑 Perfect Streak', description: '200 correct answers in a row' }
  },

  newlyUnlocked: [],

  load() {
    const saved = Storage.load('ib_achievements');
    if (saved) this.data = { ...this.data, ...saved };
    this.render();
  },

  check(progress) {
    const before = { ...this.data };
    this.data.firstPractice ||= progress.questions > 0;
    this.data.xp10 ||= progress.xp >= 10;
    this.data.xp100 ||= progress.xp >= 100;
    this.data.questions100 ||= progress.questions >= 100;

    const streak = typeof Streak !== 'undefined' ? Streak.data.count : 0;
    this.data.streak3 ||= streak >= 3;
    this.data.streak7 ||= streak >= 7;
    this.data.streak30 ||= streak >= 30;

    const correctStreak = progress.correctStreak || 0;
    this.data.accuracy10 ||= correctStreak >= 10;
    this.data.accuracy50 ||= correctStreak >= 50;
    this.data.accuracy100 ||= correctStreak >= 100;
    this.data.accuracy200 ||= correctStreak >= 200;

    this.newlyUnlocked = Object.keys(this.data).filter(key => this.data[key] && !before[key]);
    Storage.save('ib_achievements', this.data);
    this.render();
    this.showNotification();
  },

  showNotification() {
    if (!this.newlyUnlocked.length) return;
    const names = this.newlyUnlocked.map(key => this.definitions[key]?.title).join(', ');
    let toast = document.getElementById('achievement-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'achievement-toast';
      toast.style.position='fixed'; toast.style.top='20px'; toast.style.right='20px';
      toast.style.padding='15px'; toast.style.borderRadius='8px';
      toast.style.background='#222'; toast.style.color='#fff'; toast.style.zIndex='9999';
      document.body.appendChild(toast);
    }
    toast.innerHTML=`🏆 Achievement Unlocked!<br>${names}`;
    toast.style.display='block';
    setTimeout(()=>toast.style.display='none',3000);
    this.newlyUnlocked=[];
  },

  render() {
    const area=document.getElementById('achievement-list');
    if(!area)return;
    area.innerHTML=Object.entries(this.definitions).map(([key,item])=>{
      const unlocked=this.data[key];
      return `<article class="achievement-card ${unlocked?'unlocked':'locked'}"><h3>${unlocked?'🏆':'🔒'} ${item.title}</h3><p>${item.description}</p><small>${unlocked?'Unlocked':'Locked'}</small></article>`;
    }).join('');
  }
};

document.addEventListener('DOMContentLoaded',()=>{if(typeof Achievements!=='undefined')Achievements.load();});
