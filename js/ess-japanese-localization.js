// ESS HL Paper 1 / Paper 2 Japanese localization layer.
// Keeps English assessment content unchanged and improves only Japanese support text.
// v3 uses the ESS Vocabulary DB as the canonical source for core bilingual terminology.
(() => {
  const VERSION = 3;
  const MAX_ATTEMPTS = 240;

  const install = (attempt = 0) => {
    const vocabularyReady = typeof Vocabulary !== 'undefined'
      && Array.isArray(Vocabulary.allWords)
      && Vocabulary.allWords.length > 0;
    if (
      typeof Paper2 === 'undefined'
      || typeof Paper2.setQuestions !== 'function'
      || typeof Paper2.renderMarkPoint !== 'function'
      || typeof Paper2.applyEssSet8Structure !== 'function'
      || !vocabularyReady
    ) {
      if (attempt < MAX_ATTEMPTS) {
        window.setTimeout(() => install(attempt + 1), 50);
      } else {
        console.warn('ESS Japanese localization could not find its Paper 2 or Vocabulary dependencies.');
      }
      return;
    }

    if (Paper2.essJapaneseLocalizationInstalledV3) return;
    Paper2.essJapaneseLocalizationInstalled = true;
    Paper2.essJapaneseLocalizationInstalledV3 = true;

    const technicalAliases = new Map([
      ['maximum sustainable yield', 'maximum sustainable yield (MSY)'],
      ['transit-oriented development', 'transit-oriented development (TOD)'],
      ['extended producer responsibility', 'extended producer responsibility (EPR)'],
      ['integrated pest management', 'integrated pest management (IPM)'],
      ['biochemical oxygen demand', 'biochemical oxygen demand (BOD)'],
      ['dissolved oxygen', 'dissolved oxygen (DO)'],
      ['marine protected area', 'marine protected area (MPA)'],
      ['total fertility rate', 'total fertility rate (TFR)'],
      ['demographic transition model', 'demographic transition model (DTM)'],
      ['nitrogen oxides', 'nitrogen oxides (NOx)'],
      ['volatile organic compounds', 'volatile organic compounds (VOCs)'],
      ['air quality index', 'air quality index (AQI)'],
      ['genuine progress indicator', 'genuine progress indicator (GPI)']
    ]);

    const manualImportantTerms = [
      ['environmental value systems', '環境価値体系'],
      ['environmental flow', '環境流量'],
      ['ecological efficiency', '生態学的効率'],
      ['ecological overshoot', '生態学的オーバーシュート'],
      ['density-dependent factors', '密度依存要因'],
      ['density-dependent factor', '密度依存要因'],
      ['reinforcing feedback', '正のフィードバック'],
      ['state variable', '状態変数'],
      ['climate resilience', '気候レジリエンス'],
      ['ecosystem-based management', '生態系に基づく管理'],
      ['intergenerational justice', '世代間正義'],
      ['environmental justice', '環境正義'],
      ['ecological connectivity', '生態学的連結性'],
      ['restoration ecology', '復元生態学'],
      ['adaptive management', '順応的管理'],
      ['managed retreat', '計画的撤退'],
      ['nature-based solutions', '自然を活用した解決策'],
      ['nature-based solution', '自然を活用した解決策'],
      ['coastal squeeze', '沿岸圧迫'],
      ['living shoreline', '自然を活用した沿岸保全'],
      ['living shorelines', '自然を活用した沿岸保全'],
      ['development setback', '開発後退距離'],
      ['development setbacks', '開発後退距離'],
      ['targeted seawall', '重点防潮堤'],
      ['targeted seawalls', '重点防潮堤'],
      ['hybrid pathway', '複合型適応経路'],
      ['adaptive governance', '順応的ガバナンス'],
      ['chlorophyll-a', 'クロロフィルa／葉緑素a'],
      ['CPUE proxy', '単位努力量当たり漁獲量の近似指標'],
      ['input', '入力'],
      ['output', '出力'],
      ['storage', '貯蔵'],
      ['flow', '流れ'],
      ['feedback', 'フィードバック'],
      ['boundary', '境界'],
      ['BOD', '生物化学的酸素要求量'],
      ['DO', '溶存酸素'],
      ['MSY', '最大持続可能収穫量'],
      ['MPA', '海洋保護区']
    ];

    const normalizeJapaneseGloss = value => String(value || '')
      .replace(/（[A-Za-z0-9 .+\/-]+）\s*$/, '')
      .trim();

    const canonicalTerms = new Map();
    Vocabulary.allWords
      .filter(word => word?.subject === 'ESS HL' && word?.priority === 'core' && word.word && word.japanese)
      .forEach(word => {
        const source = String(word.word).trim();
        const rawJapanese = String(word.japanese).trim();
        const japanese = normalizeJapaneseGloss(rawJapanese);
        if (source && japanese) canonicalTerms.set(source.toLowerCase(), [source, japanese, rawJapanese]);
      });

    manualImportantTerms.forEach(([source, japanese]) => {
      canonicalTerms.set(source.toLowerCase(), [source, japanese, japanese]);
    });

    const importantTerms = [...canonicalTerms.values()]
      .sort((a, b) => Math.max(b[0].length, b[1].length) - Math.max(a[0].length, a[1].length));

    const plainTerms = [
      ['affordableな', '手頃な'],
      ['affordable', '手頃な'],
      ['affordability', '負担可能性'],
      ['pilot area', '試験区域'],
      ['enhanced design', '強化設計'],
      ['enhanced safeguards', '強化された保護策'],
      ['Resource ', '資料 '],
      ['reserve', '保護区'],
      ['hypothetical example', '仮想例'],
      ['management outcome', '管理結果'],
      ['local conditions', '地域条件'],
      ['decision legitimacy', '意思決定の正当性'],
      ['power imbalance', '力関係の不均衡'],
      ['cost-free', '費用を伴わない'],
      ['lock-in', '固定化'],
      ['path dependency', '経路依存性']
    ];

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceEnglishTerm = (text, source, replacement) => {
      const escaped = escapeRegExp(source);
      const flags = /^[A-Z0-9]{2,5}$/.test(source) ? 'g' : 'gi';
      const pattern = new RegExp(`(^|[^A-Za-z])${escaped}(?=$|[^A-Za-z])`, flags);
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const formatTechnicalTerm = (source, japanese) =>
      `${technicalAliases.get(source.toLowerCase()) || technicalAliases.get(source) || source}（${japanese}）`;

    const localizeText = text => {
      if (typeof text !== 'string' || !text.trim()) return text;
      let result = text;
      const placeholders = [];

      importantTerms.forEach(([source, japanese, rawJapanese], index) => {
        const token = `@@ESSV3_${index}@@`;
        const formatted = formatTechnicalTerm(source, japanese);
        const legacyJapaneseFirst = `${japanese}（${source}）`;
        const candidates = [formatted, legacyJapaneseFirst, rawJapanese, japanese]
          .filter(Boolean)
          .filter((value, i, values) => values.indexOf(value) === i)
          .sort((a, b) => b.length - a.length);

        let changed = false;
        candidates.forEach(candidate => {
          if (!result.includes(candidate)) return;
          result = result.split(candidate).join(token);
          changed = true;
        });
        if (changed) placeholders[index] = formatted;
      });

      importantTerms.forEach(([source, japanese], index) => {
        const token = `@@ESSV3_${index}@@`;
        const alias = technicalAliases.get(source.toLowerCase()) || technicalAliases.get(source);
        let next = alias ? replaceEnglishTerm(result, alias, token) : result;
        next = replaceEnglishTerm(next, source, token);
        if (next !== result) placeholders[index] = formatTechnicalTerm(source, japanese);
        result = next;
      });

      plainTerms
        .sort((a, b) => b[0].length - a[0].length)
        .forEach(([source, translation]) => {
          result = replaceEnglishTerm(result, source, translation);
        });

      placeholders.forEach((translation, index) => {
        if (translation) result = result.split(`@@ESSV3_${index}@@`).join(translation);
      });

      return result
        .replace(/\s+([、。])/g, '$1')
        .replace(/([（(])\s+/g, '$1')
        .replace(/\s+([）)])/g, '$1');
    };

    const localizePart = part => {
      if (!part || typeof part !== 'object') return part;
      if (part._essJaLocalizedVersion === VERSION) return part;
      return {
        ...part,
        markschemeJa: Array.isArray(part.markschemeJa) ? part.markschemeJa.map(localizeText) : part.markschemeJa,
        modelAnswerJa: localizeText(part.modelAnswerJa),
        _essJaLocalizedVersion: VERSION
      };
    };

    const localizeQuestion = question => {
      if (!question || question.subject !== 'ESS HL') return question;
      if (question._essJaLocalizedVersion === VERSION) return question;
      return {
        ...question,
        markschemeJa: Array.isArray(question.markschemeJa) ? question.markschemeJa.map(localizeText) : question.markschemeJa,
        modelAnswerJa: localizeText(question.modelAnswerJa),
        parts: Array.isArray(question.parts) ? question.parts.map(localizePart) : question.parts,
        _essJaLocalizedVersion: VERSION
      };
    };

    Paper2.localizeEssJapaneseText = localizeText;
    Paper2.localizeEssJapaneseQuestion = localizeQuestion;
    Paper2.essJapaneseCoreTerms = importantTerms.map(([word, japanese]) => ({ word, japanese }));

    const originalApplyEssStructure = Paper2.applyEssSet8Structure.bind(Paper2);
    Paper2.applyEssSet8Structure = function(question) {
      const hydrated = originalApplyEssStructure(question);
      if (!hydrated || hydrated.subject !== 'ESS HL' || !Array.isArray(hydrated.parts)) return hydrated;
      return { ...hydrated, parts: hydrated.parts.map(localizePart) };
    };

    const originalSetQuestions = Paper2.setQuestions.bind(Paper2);
    Paper2.setQuestions = function(questions = []) {
      const localized = Array.isArray(questions) ? questions.map(localizeQuestion) : questions;
      return originalSetQuestions(localized);
    };

    const originalRenderMarkPoint = Paper2.renderMarkPoint.bind(Paper2);
    Paper2.renderMarkPoint = function(point, index, japaneseText = '') {
      const localizedJapanese = localizeText(japaneseText);
      const html = originalRenderMarkPoint(point, index, localizedJapanese);
      if (!localizedJapanese) return html;
      const label = typeof this.isEssSectionB === 'function' && this.isEssSectionB()
        ? '日本語解説：'
        : '日本語訳：';
      return html.replace('日本語：', label);
    };

    if (typeof Paper2.getEssHlMarkbandDescriptors === 'function') {
      const originalGetMarkbands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
      Paper2.getEssHlMarkbandDescriptors = function() {
        return originalGetMarkbands().map(band => ({ ...band, textJa: localizeText(band.textJa) }));
      };
    }

    if (typeof Paper2.renderStructuredIndicativeContent === 'function') {
      const originalRenderIndicative = Paper2.renderStructuredIndicativeContent.bind(Paper2);
      Paper2.renderStructuredIndicativeContent = function(...args) {
        return originalRenderIndicative(...args).replace(/日本語：/g, '日本語解説：');
      };
    }

    if (typeof Paper2.renderStructuredModelAnswers === 'function') {
      const originalRenderStructuredModels = Paper2.renderStructuredModelAnswers.bind(Paper2);
      Paper2.renderStructuredModelAnswers = function(...args) {
        return originalRenderStructuredModels(...args).replace(/日本語：/g, '日本語解説：');
      };
    }

    const installPaper1Support = (paper1Attempt = 0) => {
      const essPaper1Ready = typeof Paper1 !== 'undefined'
        && typeof Paper1.submitPaper1B === 'function'
        && typeof EssExam !== 'undefined'
        && Boolean(EssExam.originals?.paper1Patched);
      if (!essPaper1Ready) {
        if (paper1Attempt < 300) window.setTimeout(() => installPaper1Support(paper1Attempt + 1), 50);
        else console.warn('ESS Japanese localization could not attach to Paper 1.');
        return;
      }
      if (Paper1.essJapaneseLocalizationInstalledV3) return;
      Paper1.essJapaneseLocalizationInstalledV2 = true;
      Paper1.essJapaneseLocalizationInstalledV3 = true;
      Paper1.localizeEssJapaneseText = localizeText;
      Paper1.localizeEssJapaneseQuestion = localizeQuestion;

      if (Array.isArray(Paper1.essPaper1Questions)) {
        Paper1.essPaper1Questions = Paper1.essPaper1Questions.map(localizeQuestion);
      }

      const originalSubmitPaper1B = Paper1.submitPaper1B.bind(Paper1);
      Paper1.submitPaper1B = function(...args) {
        if (this.current?.subject === 'ESS HL') this.current = localizeQuestion(this.current);
        return originalSubmitPaper1B(...args);
      };
    };

    installPaper1Support();
  };

  install();
})();
