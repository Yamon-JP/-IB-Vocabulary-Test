// ESS HL Paper 2 Section B structured-marking extension.
// Applied only when a question explicitly opts in via structuredMarking.
(() => {
  const originalRenderSelfMarkPanel = Paper2.renderSelfMarkPanel.bind(Paper2);
  const originalUpdateSelfMarkScore = Paper2.updateSelfMarkScore.bind(Paper2);
  const originalSaveSelfMarkAttempt = Paper2.saveSelfMarkAttempt.bind(Paper2);
  const originalSubmit = Paper2.submit.bind(Paper2);
  const originalSetQuestions = Paper2.setQuestions.bind(Paper2);

  Paper2.essSet8StructuredDefinitions = {
    'ESS-P2B-MS8-A': {
      commandTerm: 'Structured essay',
      question: 'Answer all three parts. Use relevant ESS examples where appropriate.',
      structuredMarking: {
        mode: 'analytic-plus-markband',
        analyticMarks: 11,
        markbandMarks: 9,
        markbandPart: 'c',
        analyticGroups: [
          { label: 'a', title: 'Part (a) · Foundations', titleJa: 'パート(a)・基礎理解', start: 0, count: 4 },
          { label: 'b', title: 'Part (b) · Application and analysis', titleJa: 'パート(b)・応用と分析', start: 4, count: 7 }
        ]
      },
      parts: [
        {
          label: 'a', marks: 4,
          question: 'Explain why increasing food security cannot be judged by crop yield alone. Refer to soil fertility and environmental impacts.',
          modelAnswer: 'Food security means reliable access to sufficient, safe and nutritious food, so a temporary increase in yield is not enough if it damages the natural capital needed for future production. Soil fertility depends on factors such as nutrient availability, organic matter, soil structure and biological activity. Intensive fertilizer, pesticide use or poor land management may raise short-term yield but can increase erosion, salinization, water pollution and biodiversity loss. Long-term food security therefore depends on both production and the condition of soils, water and agroecosystems.',
          modelAnswerJa: 'food securityは十分で安全・栄養のあるfoodへ安定してアクセスできることなので、将来の生産を支えるnatural capitalを損なうshort-term yieldの増加だけでは判断できません。soil fertilityはnutrient availability、organic matter、soil structure、biological activityなどに左右されます。過剰なfertilizer・pesticideや不適切なland managementは一時的にyieldを上げても、erosion、salinization、water pollution、biodiversity lossを強める可能性があります。'
        },
        {
          label: 'b', marks: 7,
          question: 'Analyse how soil-conservation, nutrient-management and biodiversity-supporting strategies can maintain long-term agricultural productivity.',
          modelAnswer: 'Soil-conservation measures such as cover crops, reduced tillage and organic amendments can reduce erosion while improving soil organic matter, infiltration and water retention. Precision fertilizer application and nutrient budgeting can maintain crop nutrition while limiting nitrate and phosphate losses; riparian buffers can intercept runoff before it reaches water bodies. Crop rotation, polyculture, agroforestry and integrated pest management can support pollinators, natural pest control and resilience. The strongest combination depends on local climate, soil type, farm size, farmer knowledge and access to technology and markets.',
          modelAnswerJa: 'cover crop、reduced tillage、organic amendmentはerosionを減らしながらsoil organic matter、infiltration、water retentionを改善できます。precision fertilizer applicationやnutrient budgetingは作物に必要なnutrientを供給しつつnitrate・phosphateの流出を減らし、riparian bufferはwater bodyへのrunoffを抑えます。crop rotation、polyculture、agroforestry、integrated pest managementはpollinator、natural pest control、resilienceを支えます。最適な組み合わせはclimate、soil type、farm size、knowledge、technology/market accessに依存します。'
        },
        {
          label: 'c', marks: 9,
          question: 'Evaluate strategies for increasing food security while maintaining soil fertility and reducing water pollution and biodiversity loss in agricultural systems.'
        }
      ]
    },
    'ESS-P2B-MS8-B': {
      commandTerm: 'Structured essay',
      question: 'Answer all three parts. Use relevant ESS examples where appropriate.',
      structuredMarking: {
        mode: 'analytic-plus-markband',
        analyticMarks: 11,
        markbandMarks: 9,
        markbandPart: 'c',
        analyticGroups: [
          { label: 'a', title: 'Part (a) · Foundations', titleJa: 'パート(a)・基礎理解', start: 0, count: 4 },
          { label: 'b', title: 'Part (b) · Application and analysis', titleJa: 'パート(b)・応用と分析', start: 4, count: 7 }
        ]
      },
      parts: [
        {
          label: 'a', marks: 4,
          question: 'Explain how hazard, exposure and vulnerability combine to create climate risk in coastal cities, and distinguish mitigation from adaptation.',
          modelAnswer: 'Climate risk increases when a serious hazard, such as sea-level rise, storm surge, extreme rainfall or heat, affects exposed people and infrastructure that are vulnerable to damage. Rapid coastal development can raise exposure by placing more homes and services in hazard-prone areas. Mitigation reduces the causes of future climate change by lowering greenhouse-gas emissions or increasing removals, whereas adaptation reduces harm from climate impacts by lowering exposure or vulnerability and increasing adaptive capacity.',
          modelAnswerJa: 'climate riskはsea-level rise、storm surge、extreme rainfall、heatなどのhazardが、exposedなpeople/infrastructureと高いvulnerabilityに重なるほど大きくなります。coastal developmentがhazard-prone areaへ広がるとexposureも増えます。mitigationはGHG emission削減やremoval増加によってfuture climate changeの原因を弱め、adaptationはexposure・vulnerabilityを下げadaptive capacityを高めることでimpactを減らします。'
        },
        {
          label: 'b', marks: 7,
          question: 'Analyse how one urban mitigation strategy, one engineered adaptation strategy and one nature-based or planning strategy could reduce climate risk.',
          modelAnswer: 'Low-carbon electricity, efficient buildings and public transport can reduce urban emissions and therefore contribute to limiting long-term warming. Engineered adaptation such as drainage upgrades, flood barriers or raised critical infrastructure can reduce damage during flooding and storm surges. Nature-based or planning measures such as mangrove restoration, wetlands, zoning and managed retreat can reduce wave energy or prevent new exposure. These measures work on different parts of the risk system, so combining them is more robust than relying on a single defence, although finance, land availability, maintenance and social acceptance can limit implementation.',
          modelAnswerJa: 'low-carbon electricity、efficient building、public transportはurban emissionを減らしlong-term warmingの抑制に貢献します。drainage upgrade、flood barrier、critical infrastructureの嵩上げなどengineered adaptationはflood/storm surge時のdamageを減らせます。mangrove/wetland restoration、zoning、managed retreatなどnature-based/planning measureはwave energyやfuture exposureを下げます。risk systemの異なる部分へ作用するため組み合わせが有効ですが、finance、land、maintenance、social acceptanceが制約になります。'
        },
        {
          label: 'c', marks: 9,
          question: 'Discuss the extent to which combining climate-change mitigation and adaptation can reduce risk in rapidly growing coastal cities.'
        }
      ]
    },
    'ESS-P2B-MS8-C': {
      commandTerm: 'Structured essay',
      question: 'Answer all three parts. Use relevant ESS examples where appropriate.',
      structuredMarking: {
        mode: 'analytic-plus-markband',
        analyticMarks: 11,
        markbandMarks: 9,
        markbandPart: 'c',
        analyticGroups: [
          { label: 'a', title: 'Part (a) · Foundations', titleJa: 'パート(a)・基礎理解', start: 0, count: 4 },
          { label: 'b', title: 'Part (b) · Application and analysis', titleJa: 'パート(b)・応用と分析', start: 4, count: 7 }
        ]
      },
      parts: [
        {
          label: 'a', marks: 4,
          question: 'Explain the difference between protecting intact ecosystems and restoring degraded ecosystems, with reference to biodiversity and ecosystem services.',
          modelAnswer: 'Protection prevents or limits degradation of ecosystems that still retain their species, genetic diversity, interactions, soils, hydrology and ecological processes. Restoration acts after degradation and attempts to recover habitat, ecosystem function or biodiversity through measures such as reforestation, wetland restoration or assisted regeneration. Intact ecosystems can provide provisioning, regulating, cultural and supporting services, and some of these functions may be difficult or slow to recreate once ecological thresholds have been crossed.',
          modelAnswerJa: 'protectionはspecies、genetic diversity、interaction、soil、hydrology、ecological processが残るecosystemのdegradationを防ぐ方法です。restorationはdegradation後にreforestation、wetland restoration、assisted regenerationなどでhabitat・function・biodiversityを回復させます。intact ecosystemはprovisioning、regulating、cultural、supporting serviceを提供し、thresholdを越えた後には完全な再現が難しい場合があります。'
        },
        {
          label: 'b', marks: 7,
          question: 'Analyse how protection, restoration and monitoring can maintain or recover habitat connectivity, ecological processes and ecosystem services.',
          modelAnswer: 'Protected areas and land-use controls can prevent direct habitat conversion, while corridors and landscape planning can maintain connectivity and gene flow. Restoration can enlarge habitat, reconnect fragmented populations, remove invasive species and recover processes such as water regulation or carbon storage. Monitoring is needed to compare biodiversity and ecosystem function over time and to support adaptive management if recovery is weak or threats change. Effectiveness varies among ecosystems because fragmentation, legacy effects, climate change and the degree of degradation influence whether passive regeneration is sufficient or active restoration is required.',
          modelAnswerJa: 'protected areaやland-use controlはdirect habitat conversionを防ぎ、corridorとlandscape planningはconnectivityとgene flowを維持できます。restorationはhabitat areaを増やしfragmented populationを再接続し、invasive species除去やwater regulation/carbon storage等のprocess回復を支えます。monitoringによりbiodiversityとecosystem functionを時間的に比較し、必要ならadaptive managementへつなげます。fragmentation、legacy effect、climate change、degradationの程度によりpassive regenerationかactive restorationかが変わります。'
        },
        {
          label: 'c', marks: 9,
          question: 'Evaluate the extent to which protecting intact ecosystems is more effective than restoring degraded ecosystems for conserving biodiversity and ecosystem services.'
        }
      ]
    }
  };

  Paper2.applyEssSet8Structure = function(question) {
    const definition = this.essSet8StructuredDefinitions?.[question?.id];
    if (!definition) return question;
    return {
      ...question,
      ...definition,
      structuredMarking: { ...definition.structuredMarking },
      parts: definition.parts.map(part => ({ ...part }))
    };
  };

  Paper2.isStructuredEssSectionB = function(question = this.current) {
    const config = question?.structuredMarking;
    return this.isEssSectionB(question)
      && Array.isArray(question?.parts)
      && question.parts.length > 0
      && config?.mode === 'analytic-plus-markband'
      && Number(config?.analyticMarks) > 0
      && Number(config?.markbandMarks) > 0;
  };

  Paper2.setQuestions = function(questions = []) {
    const hydrated = Array.isArray(questions)
      ? questions.map(question => this.applyEssSet8Structure(question))
      : [];
    const result = originalSetQuestions(hydrated);
    if (this.isStructuredEssSectionB()) {
      this.ensureEssayStyles();
      const answer = document.getElementById('paper2-answer');
      if (answer) answer.classList.add('paper2-answer-essay');
    }
    return result;
  };

  Paper2.getStructuredMarking = function(question = this.current) {
    if (!this.isStructuredEssSectionB(question)) return null;
    const config = question.structuredMarking || {};
    const analyticMarks = Number(config.analyticMarks) || 11;
    const markbandMarks = Number(config.markbandMarks) || 9;
    const groups = (Array.isArray(config.analyticGroups) ? config.analyticGroups : [])
      .map(group => ({
        label: String(group?.label || '').trim(),
        title: String(group?.title || '').trim(),
        titleJa: String(group?.titleJa || '').trim(),
        start: Number(group?.start),
        count: Number(group?.count)
      }))
      .filter(group => Number.isInteger(group.start) && Number.isInteger(group.count) && group.start >= 0 && group.count > 0);
    return {
      analyticMarks,
      markbandMarks,
      markbandPart: String(config.markbandPart || 'c'),
      groups: groups.length ? groups : [
        { label: 'a', title: 'Part (a)', titleJa: 'パート(a)', start: 0, count: Math.min(4, analyticMarks) },
        { label: 'b', title: 'Part (b)', titleJa: 'パート(b)', start: Math.min(4, analyticMarks), count: Math.max(0, analyticMarks - 4) }
      ]
    };
  };

  Paper2.getEssHlMarkbandDescriptors = function() {
    return [
      {
        range: '0', min: 0, max: 0,
        text: 'The response does not show enough relevant achievement to enter the markbands below.',
        textJa: '下のmarkbandに入るだけの関連する到達が示されていない。'
      },
      {
        range: '1–3', min: 1, max: 3,
        text: 'Limited ESS or HL-lens knowledge; weak links to the question context; examples are absent or underdeveloped; analysis is mainly descriptive and judgement is unclear or unsupported.',
        textJa: 'ESSまたはHL lensの知識が限定的で、設問の文脈との接続が弱い。例が不足し、分析は主に記述的で、judgementの根拠も弱い。'
      },
      {
        range: '4–6', min: 4, max: 6,
        text: 'Sound knowledge is linked to the question; terminology is mostly appropriate; relevant examples and some balanced analysis are used; conclusions have some supporting evidence or argument.',
        textJa: '十分な知識を設問へ関連づけ、概ね適切な用語・関連例・ある程度balancedな分析を使う。結論には一定の根拠がある。'
      },
      {
        range: '7–9', min: 7, max: 9,
        text: 'Broad, well-integrated ESS and HL-lens knowledge; precise terminology and strong relevant examples; thorough balanced analysis; an explicit, well-supported judgement with critical reflection.',
        textJa: 'ESSとHL lensの幅広い知識を統合し、正確な用語と有効な例を使う。分析は十分にbalancedで、根拠ある明確なjudgementとcritical reflectionを示す。'
      }
    ];
  };

  Paper2.renderStructuredAnalyticMarkscheme = function(markscheme, markschemeJa, config) {
    const groups = config.groups || [];
    const html = groups.map(group => {
      const start = Math.max(0, group.start);
      const end = Math.min(start + group.count, config.analyticMarks, markscheme.length);
      if (end <= start) return '';
      const points = [];
      for (let index = start; index < end; index += 1) {
        points.push(this.renderMarkPoint(markscheme[index], index, markschemeJa[index] || ''));
      }
      const title = group.title || `Part (${group.label || '?'})`;
      const japaneseTitle = group.titleJa
        ? `<small lang="ja">${this.escapeHtml(group.titleJa)}</small>`
        : '';
      return `
        <section class="paper2-rubric-group paper2-structured-analytic-group">
          <div class="paper2-rubric-group-heading">
            <div><strong>${this.escapeHtml(title)}</strong>${japaneseTitle}</div>
            <span>${points.length} marks</span>
          </div>
          <ol class="paper2-markscheme-list paper2-self-mark-list" start="${start + 1}">${points.join('')}</ol>
        </section>`;
    }).filter(Boolean).join('');
    return html ? `<div class="paper2-essay-rubric paper2-structured-analytic">${html}</div>` : '';
  };

  Paper2.renderStructuredIndicativeContent = function(markscheme, markschemeJa, config) {
    const start = config.analyticMarks;
    const points = markscheme.slice(start);
    if (!points.length) return '';
    const items = points.map((point, offset) => {
      const japanese = markschemeJa[start + offset]
        ? `<span class="paper2-markscheme-ja" lang="ja">日本語：${this.escapeHtml(markschemeJa[start + offset])}</span>`
        : '';
      return `<li><span>${this.escapeHtml(point)}</span>${japanese}</li>`;
    }).join('');
    return `
      <section class="paper2-structured-indicative">
        <div class="paper2-rubric-group-heading">
          <div>
            <strong>Part (${this.escapeHtml(config.markbandPart)}) · Indicative content</strong>
            <small>Use these ideas to judge relevance and depth. They are not one-mark checkboxes.</small>
            <small lang="ja">内容の関連性と深さを確認するための参考ポイントです。1項目＝1点ではありません。</small>
          </div>
          <span>${config.markbandMarks}-mark band</span>
        </div>
        <ul class="paper2-indicative-list">${items}</ul>
      </section>`;
  };

  Paper2.renderStructuredMarkband = function(config) {
    const bands = this.getEssHlMarkbandDescriptors();
    const cards = bands.map(band => `
      <div class="paper2-markband-card">
        <strong>${this.escapeHtml(band.range)} marks</strong>
        <p>${this.escapeHtml(band.text)}</p>
        <p lang="ja">${this.escapeHtml(band.textJa)}</p>
      </div>`).join('');
    const options = ['<option value="">Choose 0–9</option>']
      .concat(Array.from({ length: config.markbandMarks + 1 }, (_, score) => `<option value="${score}">${score}</option>`))
      .join('');
    return `
      <section class="paper2-markband-panel">
        <div class="paper2-markband-heading">
          <div>
            <strong>Part (${this.escapeHtml(config.markbandPart)}) · Best-fit markband</strong>
            <small>Select one holistic score after comparing the whole final response with the descriptors.</small>
            <small lang="ja">最終パート全体をdescriptorと比較し、best-fitで0〜9点を1つ選びます。</small>
          </div>
          <label class="paper2-markband-score-label">Score
            <select id="paper2-markband-score" onchange="Paper2.updateSelfMarkScore()">${options}</select>
          </label>
        </div>
        <div class="paper2-markband-grid">${cards}</div>
        <p class="paper2-markband-note">Training paraphrase aligned to the current ESS HL assessment guide. Within a band, use the lower, middle or upper mark according to how consistently the response meets that band.</p>
      </section>`;
  };

  Paper2.renderStructuredModelAnswers = function() {
    const parts = Array.isArray(this.current?.parts) ? this.current.parts : [];
    const html = parts.map((part, index) => {
      const label = part?.label || String.fromCharCode(97 + index);
      const english = part?.modelAnswer || (label === 'c' ? this.current?.modelAnswer : '');
      const japanese = part?.modelAnswerJa || (label === 'c' ? this.current?.modelAnswerJa : '');
      if (!english && !japanese) return '';
      return `
        <section class="paper2-part-model-answer">
          <h5>Part (${this.escapeHtml(label)}) · ${Number(part?.marks) || 0} marks</h5>
          ${english ? `<p>${this.escapeHtml(english)}</p>` : ''}
          ${japanese ? `<p class="paper2-model-answer-ja" lang="ja">日本語：${this.escapeHtml(japanese)}</p>` : ''}
        </section>`;
    }).filter(Boolean).join('');
    return html
      ? `<div class="paper2-model-answer paper2-structured-model-answer"><h4>Model Answers</h4>${html}</div>`
      : '';
  };

  Paper2.renderSelfMarkPanel = function(maxMarks) {
    if (!this.isStructuredEssSectionB()) return originalRenderSelfMarkPanel(maxMarks);
    const config = this.getStructuredMarking();
    return `
      <div class="paper2-self-mark-panel">
        <div class="paper2-self-mark-heading">
          <div>
            <strong>Structured essay self-mark</strong>
            <small>Parts (a) and (b): ${config.analyticMarks} analytic marks. Part (${this.escapeHtml(config.markbandPart)}): ${config.markbandMarks}-mark best-fit markband.</small>
            <small lang="ja">(a)(b)は合計${config.analyticMarks}点を項目別採点、(${this.escapeHtml(config.markbandPart)})は${config.markbandMarks}点のbest-fit markbandで評価します。</small>
          </div>
          <span id="paper2-self-score">0 / ${this.escapeHtml(maxMarks)}</span>
        </div>
        <div class="paper2-self-mark-breakdown" id="paper2-self-breakdown">Analytic 0 / ${config.analyticMarks} · Markband — / ${config.markbandMarks}</div>
        <div class="paper2-self-mark-save">
          <button type="button" id="paper2-save-score" onclick="Paper2.saveSelfMarkAttempt()">Save Score</button>
          <small id="paper2-save-status">Choose a Part (${this.escapeHtml(config.markbandPart)}) score before saving.</small>
        </div>
      </div>`;
  };

  Paper2.updateSelfMarkScore = function() {
    if (!this.isStructuredEssSectionB()) {
      originalUpdateSelfMarkScore();
      return;
    }
    const config = this.getStructuredMarking();
    const analyticSelected = [...document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]:checked')]
      .filter(input => Number(input.dataset.paper2MarkPoint) < config.analyticMarks)
      .length;
    const select = document.getElementById('paper2-markband-score');
    const hasBandScore = Boolean(select && select.value !== '');
    const bandScore = hasBandScore ? Number(select.value) : 0;
    const maxMarks = Number(this.current?.marks) || (config.analyticMarks + config.markbandMarks);
    const score = Math.min(analyticSelected + bandScore, maxMarks);
    const scoreElement = document.getElementById('paper2-self-score');
    const breakdown = document.getElementById('paper2-self-breakdown');
    if (scoreElement) scoreElement.textContent = `${score} / ${maxMarks}`;
    if (breakdown) breakdown.textContent = `Analytic ${analyticSelected} / ${config.analyticMarks} · Markband ${hasBandScore ? bandScore : '—'} / ${config.markbandMarks}`;
  };

  Paper2.saveSelfMarkAttempt = function() {
    if (!this.isStructuredEssSectionB()) {
      originalSaveSelfMarkAttempt();
      return;
    }
    if (!this.current || this.attemptSaved) return;

    this.ensureEssayStyles();
    const config = this.getStructuredMarking();
    const maxMarks = Number(this.current.marks) || (config.analyticMarks + config.markbandMarks);
    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const checkedIndexes = new Set(
      [...document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]:checked')]
        .map(input => Number(input.dataset.paper2MarkPoint))
        .filter(index => Number.isInteger(index) && index >= 0 && index < config.analyticMarks)
    );
    const select = document.getElementById('paper2-markband-score');
    const status = document.getElementById('paper2-save-status');
    if (!select || select.value === '') {
      if (status) status.textContent = `Choose a Part (${config.markbandPart}) markband score before saving.`;
      return;
    }

    const criteria = markscheme.slice(0, config.analyticMarks).map((_, index) => ({
      criterionId: `${this.current.id || 'paper2'}:analytic:${index + 1}`,
      index: index + 1,
      markValue: 1,
      awarded: checkedIndexes.has(index)
    }));
    const analyticScore = criteria.reduce((sum, criterion) => sum + (criterion.awarded ? 1 : 0), 0);
    const markbandScore = Math.max(0, Math.min(config.markbandMarks, Number(select.value) || 0));
    const score = Math.min(analyticScore + markbandScore, maxMarks);
    const band = this.getEssHlMarkbandDescriptors().find(item => markbandScore >= item.min && markbandScore <= item.max) || null;

    const attempt = {
      attemptId: `${this.current.id || 'paper2'}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      schemaVersion: Paper2Progress.schemaVersion,
      questionId: this.current.id || null,
      subject: this.current.subject || null,
      assessmentTarget: this.current.assessmentTarget || null,
      chapter: this.current.chapter || this.current.topic || null,
      unit: this.current.unit || null,
      commandTerm: this.current.commandTerm || null,
      difficulty: this.current.difficulty || null,
      questionType: 'structured-essay',
      mockSet: this.current.mockSet || null,
      option: this.current.option || null,
      score,
      maxMarks,
      percentage: maxMarks ? Math.round((score / maxMarks) * 100) : 0,
      evaluator: {
        type: 'analytic-plus-markband',
        version: 2
      },
      criteria,
      analyticScore,
      analyticMaxMarks: config.analyticMarks,
      markband: {
        part: config.markbandPart,
        score: markbandScore,
        maxMarks: config.markbandMarks,
        range: band?.range || null
      },
      createdAt: new Date().toISOString()
    };

    if (!Paper2Progress.recordAttempt(attempt)) return;
    this.attemptSaved = true;
    document.querySelectorAll('#paper2-feedback input[data-paper2-mark-point]').forEach(input => { input.disabled = true; });
    select.disabled = true;
    const saveButton = document.getElementById('paper2-save-score');
    if (saveButton) {
      saveButton.disabled = true;
      saveButton.textContent = 'Score Saved';
    }
    if (status) status.textContent = `${score} / ${maxMarks} saved · Analytic ${analyticScore}/${config.analyticMarks} + Markband ${markbandScore}/${config.markbandMarks}.`;
  };

  Paper2.submit = function() {
    if (!this.isStructuredEssSectionB()) {
      originalSubmit();
      return;
    }
    if (!this.current || this.attemptSaved) return;
    const feedback = document.getElementById('paper2-feedback');
    const answer = document.getElementById('paper2-answer');
    if (!feedback || !answer) return;
    if (!answer.value.trim()) {
      feedback.innerHTML = '<div class="paper2-feedback-card"><strong>Write an answer first.</strong><p>Attempt all parts before revealing the markscheme.</p></div>';
      return;
    }

    this.ensureEssayStyles();
    const markscheme = Array.isArray(this.current.markscheme) ? this.current.markscheme : [];
    const markschemeJa = Array.isArray(this.current.markschemeJa) ? this.current.markschemeJa : [];
    const config = this.getStructuredMarking();
    const maxMarks = Number(this.current.marks) || (config.analyticMarks + config.markbandMarks);
    const analyticHtml = this.renderStructuredAnalyticMarkscheme(markscheme, markschemeJa, config);
    const indicativeHtml = this.renderStructuredIndicativeContent(markscheme, markschemeJa, config);
    const markbandHtml = this.renderStructuredMarkband(config);
    const selfMarkPanel = this.renderSelfMarkPanel(maxMarks);
    const modelAnswers = this.renderStructuredModelAnswers();

    this.attemptSaved = false;
    feedback.innerHTML = `
      <div class="paper2-feedback-card paper2-structured-feedback">
        <div class="paper2-feedback-heading">
          <strong>Self-mark the structured essay</strong>
          <span>${this.escapeHtml(maxMarks)} marks</span>
        </div>
        <p>Parts (a) and (b) use an analytic markscheme. Part (${this.escapeHtml(config.markbandPart)}) is judged holistically using the ${config.markbandMarks}-mark best-fit markband.</p>
        <p lang="ja">(a)(b)はmarkschemeの各点で採点し、(${this.escapeHtml(config.markbandPart)})は${config.markbandMarks}点のmarkbandをbest-fitで評価します。</p>
        <h4>Parts (a) and (b) · Analytic markscheme</h4>
        ${analyticHtml}
        ${indicativeHtml}
        ${markbandHtml}
        ${selfMarkPanel}
        ${modelAnswers}
      </div>`;
    this.updateSelfMarkScore();
  };

  const originalEnsureEssayStyles = Paper2.ensureEssayStyles.bind(Paper2);
  Paper2.ensureEssayStyles = function() {
    originalEnsureEssayStyles();
    if (document.getElementById('paper2-structured-marking-styles')) return;
    const style = document.createElement('style');
    style.id = 'paper2-structured-marking-styles';
    style.textContent = `
      .paper2-structured-indicative, .paper2-markband-panel {
        margin-top: 14px;
        overflow: hidden;
        border: 1px solid #e4e7ec;
        border-radius: 14px;
        background: #fbfcfe;
      }
      .paper2-indicative-list { margin: 0; padding: 10px 18px 12px 34px; }
      .paper2-indicative-list li { padding: 6px 0; }
      .paper2-indicative-list .paper2-markscheme-ja { display: block; margin-top: 3px; }
      .paper2-markband-heading {
        display: flex;
        justify-content: space-between;
        gap: 14px;
        padding: 12px;
        border-bottom: 1px solid #e4e7ec;
        background: #f8fafc;
      }
      .paper2-markband-heading strong, .paper2-markband-heading small { display: block; }
      .paper2-markband-heading small { margin-top: 3px; color: #667085; }
      .paper2-markband-score-label { display: grid; gap: 4px; min-width: 112px; font-size: .78rem; font-weight: 800; }
      #paper2-markband-score { min-height: 38px; padding: 6px 8px; border: 1px solid #cfd4dc; border-radius: 9px; background: #fff; }
      .paper2-markband-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; padding: 12px; }
      .paper2-markband-card { padding: 10px; border: 1px solid #e4e7ec; border-radius: 11px; background: #fff; }
      .paper2-markband-card strong { display: block; margin-bottom: 5px; }
      .paper2-markband-card p { margin: 4px 0; font-size: .82rem; line-height: 1.45; }
      .paper2-markband-card p[lang="ja"] { color: #667085; }
      .paper2-markband-note { margin: 0; padding: 0 12px 12px; color: #667085; font-size: .76rem; }
      .paper2-self-mark-breakdown { margin: 8px 0 2px; font-size: .82rem; font-weight: 800; color: #475467; }
      .paper2-structured-model-answer { margin-top: 16px; }
      .paper2-part-model-answer { padding: 10px 0; border-top: 1px solid #e4e7ec; }
      .paper2-part-model-answer:first-of-type { border-top: 0; }
      .paper2-part-model-answer h5 { margin: 0 0 6px; }
      .paper2-part-model-answer p { margin: 5px 0; }
      @media (max-width: 600px) {
        .paper2-markband-heading { flex-direction: column; }
        .paper2-markband-grid { grid-template-columns: 1fr; }
        .paper2-markband-score-label { min-width: 0; }
      }
    `;
    document.head.appendChild(style);
  };
})();
