// Temporary desktop diagnostics for English B HL Listening speech voices.
(() => {
  const install = () => {
    const module = window.EnglishBPaper2Listening;
    if (!module || !module.voiceAccentExtensionInstalled) return false;
    if (module.voiceDiagnosticsInstalled) return true;
    module.voiceDiagnosticsInstalled = true;

    const isDesktop = () => {
      if (typeof module.isDesktopBrowser === 'function') return module.isDesktopBrowser();
      return !/Android|iPhone|iPad|iPod|Mobile/i.test(String(navigator.userAgent || ''));
    };

    const escapeHtml = value => String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');

    module.getDiagnosticEnglishVoices = function() {
      if (!('speechSynthesis' in window)) return [];
      const voices = window.speechSynthesis.getVoices();
      return voices.filter(voice => {
        const lang = String(voice.lang || '').toLowerCase().replace('_', '-');
        const name = String(voice.name || '').toLowerCase();
        return lang.startsWith('en') || name.includes('english');
      });
    };

    module.installVoiceDiagnostics = function() {
      if (!isDesktop()) return;
      if (document.getElementById('engb-l-voice-diagnostics')) {
        this.updateVoiceDiagnostics();
        return;
      }
      const status = document.getElementById('engb-l-voice-status');
      if (!status) return;

      const details = document.createElement('details');
      details.id = 'engb-l-voice-diagnostics';
      details.style.width = '100%';
      details.style.marginTop = '6px';
      details.style.padding = '9px 10px';
      details.style.border = '1px dashed #cfd4dc';
      details.style.borderRadius = '10px';
      details.style.background = '#f8fafc';
      details.innerHTML = `
        <summary style="cursor:pointer;font-weight:800">Voice Diagnostics (PC)</summary>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:9px 0">
          <button type="button" onclick="EnglishBPaper2Listening.refreshVoiceDiagnostics()">Refresh voice list</button>
          <span id="engb-l-voice-diagnostics-count" class="muted"></span>
        </div>
        <div id="engb-l-voice-diagnostics-list" style="display:grid;gap:6px;font-size:.8rem;line-height:1.45"></div>`;
      status.insertAdjacentElement('afterend', details);
      this.updateVoiceDiagnostics();
    };

    module.updateVoiceDiagnostics = function() {
      if (!isDesktop()) return;
      const details = document.getElementById('engb-l-voice-diagnostics');
      const list = document.getElementById('engb-l-voice-diagnostics-list');
      const count = document.getElementById('engb-l-voice-diagnostics-count');
      if (!details || !list || !count) return;

      const allVoices = 'speechSynthesis' in window ? window.speechSynthesis.getVoices() : [];
      const voices = this.getDiagnosticEnglishVoices();
      count.textContent = `${voices.length} English voice${voices.length === 1 ? '' : 's'} / ${allVoices.length} total voices`;

      if (!voices.length) {
        list.innerHTML = '<div>No English voices are currently exposed by this browser.</div>';
        return;
      }

      list.innerHTML = voices.map((voice, index) => {
        const local = voice.localService === true ? 'local' : 'remote';
        const defaultLabel = voice.default === true ? 'default' : 'not default';
        const us = typeof this.isUsVoice === 'function' && this.isUsVoice(voice) ? 'US-match' : '';
        const gb = typeof this.isGbVoice === 'function' && this.isGbVoice(voice) ? 'GB-match' : '';
        const expressive = typeof this.isExpressiveVoice === 'function' && this.isExpressiveVoice(voice) ? 'filtered-as-expressive' : '';
        const trusted = typeof this.isTrustedDesktopVoice === 'function' && this.isTrustedDesktopVoice(voice) ? 'trusted-desktop' : '';
        const flags = [us, gb, expressive, trusted].filter(Boolean).join(' · ');
        return `<div style="padding:7px 8px;border:1px solid #e4e7ec;border-radius:8px;background:#fff"><strong>${index + 1}. ${escapeHtml(voice.name || '(unnamed voice)')}</strong><br><span>${escapeHtml(voice.lang || '(no lang)')} · ${local} · ${defaultLabel}${flags ? ` · ${escapeHtml(flags)}` : ''}</span></div>`;
      }).join('');
    };

    module.refreshVoiceDiagnostics = function() {
      if ('speechSynthesis' in window) window.speechSynthesis.getVoices();
      if (typeof this.refreshVoiceCache === 'function') this.refreshVoiceCache();
      this.updateVoiceDiagnostics();
      if (typeof this.updateAccentUI === 'function') this.updateAccentUI();
    };

    const originalInstallAccentControl = module.installAccentControl?.bind(module);
    if (originalInstallAccentControl) {
      module.installAccentControl = function() {
        originalInstallAccentControl();
        this.installVoiceDiagnostics();
      };
    }

    if ('speechSynthesis' in window && typeof window.speechSynthesis.addEventListener === 'function') {
      window.speechSynthesis.addEventListener('voiceschanged', () => {
        window.setTimeout(() => module.updateVoiceDiagnostics(), 0);
      });
    }

    module.installVoiceDiagnostics();
    window.setTimeout(() => module.updateVoiceDiagnostics(), 250);
    window.setTimeout(() => module.updateVoiceDiagnostics(), 1000);
    return true;
  };

  const boot = (attempt = 0) => {
    if (install()) return;
    if (attempt < 300) window.setTimeout(() => boot(attempt + 1), 50);
  };
  boot();
})();