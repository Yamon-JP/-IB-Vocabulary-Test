// English B HL Listening voice control: stable US/GB English voices with desktop-safe fallback.
(() => {
  const install = () => {
    const module = window.EnglishBPaper2Listening;
    if (!module || module.voiceAccentExtensionInstalled) return false;
    module.voiceAccentExtensionInstalled = true;
    module.voiceCache = [];
    module.voiceListenerInstalled = false;
    module.activeVoice = null;
    module.activeVoiceTier = 'standard';

    module.ensureAccentStyles = function() {
      if (document.getElementById('engb-l-accent-styles')) return;
      const style = document.createElement('style');
      style.id = 'engb-l-accent-styles';
      style.textContent = `
        .engb-l-accent-control{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:12px 14px;border:1px solid #e4e7ec;border-radius:14px;background:#fff}
        .engb-l-accent-copy strong,.engb-l-accent-copy small{display:block}.engb-l-accent-copy small{margin-top:2px;color:#667085}
        .engb-l-accent-buttons{display:flex;gap:8px;flex-wrap:wrap}.engb-l-accent-buttons button{min-height:38px;padding:7px 12px;border:1px solid #d0d5dd;border-radius:10px;background:#fff;font-weight:800}.engb-l-accent-buttons button.active{border-color:#667085;box-shadow:0 0 0 2px rgba(102,112,133,.13);background:#f8fafc}
        .engb-l-voice-status{width:100%;font-size:.78rem;color:#667085}
        @media(max-width:600px){.engb-l-accent-control{align-items:flex-start}.engb-l-accent-buttons{width:100%}.engb-l-accent-buttons button{flex:1 1 0}}
      `;
      document.head.appendChild(style);
    };

    module.getAccent = function() {
      if (typeof App === 'undefined') return 'US';
      return App.state.englishBListeningAccent === 'GB' ? 'GB' : 'US';
    };

    module.getAccentLocale = function() {
      return this.getAccent() === 'GB' ? 'en-GB' : 'en-US';
    };

    module.isDesktopBrowser = function() {
      const ua = String(navigator.userAgent || '');
      return !/Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    };

    module.setAccent = function(accent) {
      const normalized = accent === 'GB' ? 'GB' : 'US';
      this.stopAudio();
      this.activeVoice = null;
      this.activeVoiceTier = 'standard';
      if (typeof App !== 'undefined') {
        App.state.englishBListeningAccent = normalized;
        App.saveState();
      }
      this.refreshVoiceCache();
      this.updateAccentUI();
    };

    module.installAccentControl = function() {
      this.ensureAccentStyles();
      if (document.getElementById('engb-l-accent-control')) {
        this.updateAccentUI();
        return;
      }
      const panel = document.getElementById('english-b-paper2-listening-panel');
      const instruction = panel?.querySelector('.engb-l-instruction');
      if (!panel || !instruction) return;
      const control = document.createElement('div');
      control.id = 'engb-l-accent-control';
      control.className = 'engb-l-accent-control';
      control.innerHTML = `
        <div class="engb-l-accent-copy">
          <strong>Pronunciation</strong>
          <small>Choose a stable standard accent for all Listening audio.</small>
        </div>
        <div class="engb-l-accent-buttons" role="group" aria-label="English pronunciation">
          <button type="button" id="engb-l-accent-us" onclick="EnglishBPaper2Listening.setAccent('US')">🇺🇸 US English</button>
          <button type="button" id="engb-l-accent-gb" onclick="EnglishBPaper2Listening.setAccent('GB')">🇬🇧 British English</button>
        </div>
        <div id="engb-l-voice-status" class="engb-l-voice-status">Loading stable English voices…</div>`;
      instruction.insertAdjacentElement('afterend', control);
      this.updateAccentUI();
    };

    module.refreshVoiceCache = function() {
      if (!('speechSynthesis' in window)) {
        this.voiceCache = [];
        return [];
      }
      this.voiceCache = window.speechSynthesis.getVoices();
      return this.voiceCache;
    };

    module.installVoiceListener = function() {
      if (this.voiceListenerInstalled || !('speechSynthesis' in window)) return;
      this.voiceListenerInstalled = true;
      const refresh = () => {
        this.refreshVoiceCache();
        this.activeVoice = null;
        this.activeVoiceTier = 'standard';
        this.updateAccentUI();
      };
      if (typeof window.speechSynthesis.addEventListener === 'function') {
        window.speechSynthesis.addEventListener('voiceschanged', refresh);
      } else {
        const previous = window.speechSynthesis.onvoiceschanged;
        window.speechSynthesis.onvoiceschanged = event => {
          if (typeof previous === 'function') previous.call(window.speechSynthesis, event);
          refresh();
        };
      }
      this.refreshVoiceCache();
    };

    module.isJapaneseVoice = function(voice) {
      const lang = String(voice?.lang || '').toLowerCase().replace('_','-');
      const name = String(voice?.name || '').toLowerCase();
      return lang.startsWith('ja') || /japanese|日本語|kyoko|otoya/.test(name);
    };

    module.isUsVoice = function(voice) {
      if (!voice || this.isJapaneseVoice(voice)) return false;
      const lang = String(voice.lang || '').toLowerCase().replace('_','-');
      const name = String(voice.name || '').toLowerCase();
      if (lang.startsWith('en-us')) return true;
      return /english\s*\(?(united states|u\.s\.|us)\)?|american english|us english|u\.s\. english/.test(name);
    };

    module.isGbVoice = function(voice) {
      if (!voice || this.isJapaneseVoice(voice)) return false;
      const lang = String(voice.lang || '').toLowerCase().replace('_','-');
      const name = String(voice.name || '').toLowerCase();
      if (lang.startsWith('en-gb')) return true;
      return /english\s*\(?(united kingdom|uk|great britain|britain)\)?|british english|uk english/.test(name);
    };

    module.isExpressiveVoice = function(voice) {
      const name = String(voice?.name || '').toLowerCase();
      return /natural|neural|online|expressive|emotion|emotional|premium|studio|journey|multilingual|wavenet/.test(name);
    };

    module.isUnsafeDesktopVoice = function(voice) {
      const name = String(voice?.name || '').toLowerCase();
      return /expressive|emotion|emotional|journey|multitalker|multi-talker|podcast|storytelling|character|whisper|singing|narrative/.test(name);
    };

    module.isTrustedDesktopVoice = function(voice) {
      if (!voice || this.isJapaneseVoice(voice) || this.isUnsafeDesktopVoice(voice)) return false;
      const name = String(voice.name || '').toLowerCase();
      if (/google (us|uk) english/.test(name)) return true;
      if (/microsoft (david|zira|mark|aria|jenny|guy|ava|andrew|brian|emma|roger|steffan|george|hazel|susan|ryan|sonia|libby)/.test(name)) return true;
      if (/\b(samantha|alex|daniel|karen|moira|tessa)\b/.test(name)) return true;
      return false;
    };

    module.rawAccentVoices = function(locale = this.getAccentLocale()) {
      const voices = this.voiceCache?.length ? this.voiceCache : this.refreshVoiceCache();
      return String(locale).toLowerCase().startsWith('en-gb')
        ? voices.filter(voice => this.isGbVoice(voice))
        : voices.filter(voice => this.isUsVoice(voice));
    };

    module.stableAccentVoices = function(locale = this.getAccentLocale()) {
      return this.rawAccentVoices(locale)
        .filter(voice => !this.isExpressiveVoice(voice))
        .sort((a, b) => this.stabilityScore(b) - this.stabilityScore(a));
    };

    module.desktopFallbackVoices = function(locale = this.getAccentLocale()) {
      if (!this.isDesktopBrowser()) return [];
      return this.rawAccentVoices(locale)
        .filter(voice => this.isTrustedDesktopVoice(voice))
        .sort((a, b) => this.desktopFallbackScore(b) - this.desktopFallbackScore(a));
    };

    module.candidateVoices = function(locale = this.getAccentLocale()) {
      const stable = this.stableAccentVoices(locale);
      if (stable.length) {
        this.activeVoiceTier = 'standard';
        return stable;
      }
      const fallback = this.desktopFallbackVoices(locale);
      if (fallback.length) this.activeVoiceTier = 'desktop fallback';
      return fallback;
    };

    module.availableVoices = function(locale = this.getAccentLocale()) {
      return this.candidateVoices(locale);
    };

    module.stabilityScore = function(voice) {
      const name = String(voice?.name || '').toLowerCase();
      let score = 0;
      if (voice?.localService === true) score += 100;
      if (name.includes('google us english') || name.includes('google uk english')) score += 50;
      if (/microsoft (david|zira|mark|hazel|george|susan)/.test(name)) score += 48;
      if (/\b(samantha|alex|daniel|karen|moira|tessa)\b/.test(name)) score += 46;
      if (name.includes('google')) score += 28;
      if (name.includes('microsoft')) score += 26;
      if (name.includes('apple')) score += 24;
      if (voice?.default) score += 5;
      return score;
    };

    module.desktopFallbackScore = function(voice) {
      const name = String(voice?.name || '').toLowerCase();
      let score = 0;
      if (/microsoft (david|zira|mark|george|hazel|susan)/.test(name)) score += 100;
      if (/google (us|uk) english/.test(name)) score += 95;
      if (/microsoft (aria|jenny|guy|ava|andrew|brian|emma|roger|steffan|ryan|sonia|libby)/.test(name)) score += 85;
      if (/\b(samantha|alex|daniel|karen|moira|tessa)\b/.test(name)) score += 80;
      if (voice?.localService === true) score += 20;
      return score;
    };

    module.preferredStableVoice = function(locale = this.getAccentLocale()) {
      return this.candidateVoices(locale)[0] || null;
    };

    module.preferredUsVoice = function() {
      return this.preferredStableVoice('en-US');
    };

    module.pickVoice = function() {
      return this.activeVoice || this.preferredStableVoice(this.getAccentLocale());
    };

    module.updateAccentUI = function() {
      const accent = this.getAccent();
      document.getElementById('engb-l-accent-us')?.classList.toggle('active', accent === 'US');
      document.getElementById('engb-l-accent-gb')?.classList.toggle('active', accent === 'GB');
      const status = document.getElementById('engb-l-voice-status');
      if (!status) return;
      if (!('speechSynthesis' in window)) {
        status.textContent = 'Speech synthesis is not supported by this browser.';
        return;
      }
      const locale = this.getAccentLocale();
      const voices = this.candidateVoices(locale);
      if (!voices.length) {
        status.textContent = `${locale}: no suitable standard reading voice is available. Emotional / character voices will not be used.`;
        return;
      }
      const preferred = this.activeVoice || voices[0];
      const tier = this.activeVoiceTier === 'desktop fallback' ? 'trusted desktop voice' : (preferred.localService === true ? 'local standard voice' : 'standard voice');
      status.textContent = `${accent === 'GB' ? 'British English' : 'US English'} · Using: ${preferred.name} (${preferred.lang}) · ${tier}`;
    };

    module.ensureAccentVoices = async function(locale) {
      for (let attempt = 0; attempt < 30; attempt += 1) {
        const voices = this.candidateVoices(locale);
        if (voices.length) return voices;
        await new Promise(resolve => window.setTimeout(resolve, 100));
        this.refreshVoiceCache();
      }
      return [];
    };

    module.speakSegment = function(segment, locale, voice, isLast) {
      return new Promise(resolve => {
        const utterance = new SpeechSynthesisUtterance(segment?.text || '');
        utterance.lang = locale;
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.voice = voice;
        utterance.onend = () => resolve({ ok: true });
        utterance.onerror = event => resolve({ ok: true, warning: event?.error || 'speech-error' });
        if (isLast) {
          const finish = result => {
            this.activeTextId = null;
            this.paused = false;
            resolve(result);
          };
          utterance.onend = () => finish({ ok: true });
          utterance.onerror = event => finish({ ok: true, warning: event?.error || 'speech-error' });
        }
        window.speechSynthesis.speak(utterance);
      });
    };

    module.playAudio = async function(textIndex) {
      const set = this.currentSet();
      const text = set?.texts?.[textIndex];
      if (!text) return;
      if (!('speechSynthesis' in window) || typeof SpeechSynthesisUtterance === 'undefined') {
        alert('Speech playback is not supported by this browser.');
        return;
      }

      const locale = this.getAccentLocale();
      const candidates = await this.ensureAccentVoices(locale);
      if (!candidates.length) {
        this.updateAccentUI();
        alert(`${locale}: no suitable standard reading voice is available on this device. Emotional / character voices will not be used.`);
        return;
      }

      this.stopAudio();
      this.activeTextId = text.id;
      this.playCounts[text.id] = (this.playCounts[text.id] || 0) + 1;
      this.refreshPlayCounts();

      const segments = Array.isArray(text.segments) ? text.segments : [];
      const voice = candidates[0];
      this.activeVoice = voice;
      this.updateAccentUI();

      for (let index = 0; index < segments.length; index += 1) {
        if (this.activeTextId !== text.id) return;
        await this.speakSegment(segments[index], locale, voice, index === segments.length - 1);
      }

      if (this.activeTextId === text.id) {
        this.activeTextId = null;
        this.paused = false;
      }
    };

    const originalInstallUI = module.installUI.bind(module);
    module.installUI = function() {
      originalInstallUI();
      this.installAccentControl();
    };

    const originalRender = module.render.bind(module);
    module.render = function() {
      originalRender();
      this.installAccentControl();
      this.updateAccentUI();
    };

    module.installVoiceListener();
    module.installAccentControl();
    module.updateAccentUI();
    return true;
  };

  const boot = (attempt = 0) => {
    if (install()) return;
    if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
  };
  boot();
})();