// ESS HL Paper 2 Section B: post-render DOM sweep for mixed Japanese/English support text.
// Runs last and cleans Japanese-bearing text nodes regardless of whether they came from data or hard-coded UI strings.
(() => {
  const MAX_ATTEMPTS = 460;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essSectionBFinalJapaneseAuditInstalled
      || typeof Paper2.finalAuditEssSectionBJapanese !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B Japanese DOM sweep could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBJapaneseDomSweepInstalled) return;
    Paper2.essSectionBJapaneseDomSweepInstalled = true;

    const phraseMap = [
      // Course / assessment language that may appear inside Japanese UI text.
      ['HL lens', 'HL lens（HLの視点）'],
      ['HL-lens', 'HL lens（HLの視点）'],
      ['best-fit markband', '最も適合する評価帯'],
      ['best-fit', '最も適合する'],
      ['analytic markscheme', '項目別採点基準'],
      ['markscheme', '採点基準'],
      ['mark band', '評価帯'],
      ['markband', '評価帯'],
      ['descriptor', '評価基準の説明'],
      ['balanced analysis', 'バランスの取れた分析'],
      ['critical reflection', '批判的検討'],
      ['structured essay', '構造化エッセイ'],
      ['self-mark', '自己採点'],
      ['judgement', '判断'],
      ['trade-off', 'トレードオフ'],
      ['trade-offs', 'トレードオフ'],
      ['model answer', '模範解答'],
      ['indicative content', '参考内容'],

      // Remaining Set 8 / structured-answer phrases.
      ['climate risk', 'climate risk（気候リスク）'],
      ['adaptive capacity', 'adaptive capacity（適応能力）'],
      ['hazard-prone area', '災害リスクの高い地域'],
      ['hazard-prone areas', '災害リスクの高い地域'],
      ['sea-level rise', '海面上昇'],
      ['storm surge', '高潮'],
      ['extreme rainfall', '極端な降雨'],
      ['long-term warming', '長期的な温暖化'],
      ['future climate change', '将来の気候変動'],
      ['low-carbon electricity', '低炭素電力'],
      ['efficient building', '省エネルギー建築'],
      ['efficient buildings', '省エネルギー建築'],
      ['public transport', '公共交通'],
      ['drainage upgrade', '排水設備の強化'],
      ['drainage upgrades', '排水設備の強化'],
      ['flood barrier', '防潮・洪水防護施設'],
      ['flood barriers', '防潮・洪水防護施設'],
      ['critical infrastructure', '重要インフラ'],
      ['wave energy', '波のエネルギー'],
      ['social acceptance', '社会的受容'],
      ['engineered adaptation', '工学的な適応策'],
      ['nature-based planning measure', '自然を活用した計画的対策'],
      ['planning measure', '計画的対策'],
      ['planning measures', '計画的対策'],
      ['intact ecosystem', '健全な生態系'],
      ['intact ecosystems', '健全な生態系'],
      ['degraded ecosystem', '劣化した生態系'],
      ['degraded ecosystems', '劣化した生態系'],
      ['provisioning service', 'provisioning service（供給サービス）'],
      ['provisioning services', 'provisioning services（供給サービス）'],
      ['regulating service', 'regulating service（調整サービス）'],
      ['regulating services', 'regulating services（調整サービス）'],
      ['cultural service', 'cultural service（文化的サービス）'],
      ['cultural services', 'cultural services（文化的サービス）'],
      ['supporting service', 'supporting service（基盤サービス）'],
      ['supporting services', 'supporting services（基盤サービス）'],
      ['assisted regeneration', '人為的に支援した自然再生'],
      ['passive regeneration', '自然回復に任せる再生'],
      ['active restoration', '積極的な生態系復元'],
      ['direct habitat conversion', '直接的な生息地転換'],
      ['landscape planning', '景観規模の計画'],
      ['legacy effect', '過去の影響'],
      ['legacy effects', '過去の影響'],
      ['natural pest control', '自然の害虫抑制'],
      ['market access', '市場へのアクセス'],
      ['technology access', '技術へのアクセス'],
      ['water retention', '保水'],
      ['soil structure', '土壌構造'],
      ['biological activity', '生物活性'],
      ['water body', '水域'],
      ['water bodies', '水域'],
      ['crop productivity', '作物生産性'],
      ['future production', '将来の生産']
    ].sort((a, b) => b[0].length - a[0].length);

    const wordMap = new Map(Object.entries({
      lens: '視点', lenses: '視点', markscheme: '採点基準', markschemes: '採点基準', markband: '評価帯', markbands: '評価帯',
      descriptor: '評価基準の説明', descriptors: '評価基準の説明', judgement: '判断', judgment: '判断', balanced: 'バランスの取れた',
      analytic: '項目別', analytical: '分析的な', holistic: '総合的な', relevance: '関連性', depth: '深さ', checkbox: 'チェック項目', checkboxes: 'チェック項目',
      score: '得点', scoring: '採点', training: '練習用', paraphrase: '言い換え', aligned: '準拠した', current: '現行の', assessment: '評価', guide: 'ガイド',
      band: '評価帯', bands: '評価帯', lower: '下位', middle: '中位', upper: '上位', consistently: '一貫して', response: '解答', responses: '解答', meets: '満たす',
      part: 'パート', parts: 'パート', marks: '点', mark: '点', structured: '構造化された', essay: 'エッセイ', model: '模範', answer: '解答', answers: '解答',
      indicative: '参考', content: '内容', use: '使用', uses: '使用', ideas: '考え', judge: '判断する', whole: '全体', final: '最終', compare: '比較する', comparing: '比較する',
      select: '選択する', choose: '選択する', selected: '選択された', save: '保存', saving: '保存', before: '前に', after: '後に', overall: '全体の',
      clear: '明確な', explicit: '明示的な', supported: '根拠のある', relevant: '関連する', appropriate: '適切な', example: '例', examples: '例',
      limited: '限定的な', sound: '十分な', broad: '幅広い', integrated: '統合された', precise: '正確な', strong: '十分な', thorough: '十分な', weak: '弱い',
      knowledge: '知識', terminology: '用語', application: '応用', analysis: '分析', evaluation: '評価', perspectives: '視点', synthesis: '統合', justified: '根拠のある',
      connection: '接続', connections: '接続', foundation: '基礎', foundations: '基礎', context: '文脈', descriptive: '記述的な', unsupported: '根拠のない',

      hazard: 'hazard（ハザード）', hazards: 'hazard（ハザード）', exposed: '曝露している', exposure: 'exposure（曝露）', people: '人々', person: '人',
      infrastructure: 'インフラ', damage: '被害', damages: '被害', mitigation: 'mitigation（緩和）', adaptation: 'adaptation（適応）',
      emission: '排出', emissions: '排出', removal: '除去', removals: '除去', impact: '影響', impacts: '影響', building: '建築物', buildings: '建築物',
      engineered: '工学的な', wave: '波', zoning: '用途地域規制', maintenance: '維持管理', acceptance: '受容', finance: '資金', availability: '利用可能性',
      protection: '保護', protects: '保護する', protecting: '保護する', restoration: '復元', restoring: '復元する', degradation: '劣化',
      reforestation: '再植林', assisted: '支援された', regeneration: '再生', intact: '健全な', provisioning: '供給の', regulating: '調整の', cultural: '文化的な', supporting: '基盤的な',
      service: 'サービス', services: 'サービス', threshold: '閾値', thresholds: '閾値', direct: '直接的な', fragmented: '分断された', legacy: '過去の影響', passive: '自然回復型の', active: '積極的な',
      pollinator: '送粉者', pollinators: '送粉者', pest: '害虫', pests: '害虫', control: '管理', controls: '管理', technology: '技術', technologies: '技術', market: '市場', markets: '市場',
      climate: '気候', soil: '土壌', water: '水', body: '水域', bodies: '水域', crop: '作物', crops: '作物', productivity: '生産性', retention: '保持', biological: '生物学的な', activity: '活動',
      local: '地域の', farm: '農場', size: '規模', knowledge: '知識', future: '将来の', production: '生産', risk: 'リスク', risks: 'リスク', area: '地域', areas: '地域'
    }));

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const protectGlossed = value => {
      const held = [];
      const text = value.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,12}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSDOM${held.length}@@`;
        held.push(match);
        return token;
      });
      return { text, held };
    };

    const cleanMixedJapanese = (value, location = 'dom') => {
      if (typeof value !== 'string' || !/[ぁ-んァ-ヶ一-龯々]/.test(value)) return value;
      let text = Paper2.finalAuditEssSectionBJapanese(value, location);
      const protectedState = protectGlossed(text);
      text = protectedState.text;
      phraseMap.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      text = text.replace(/\b[A-Za-z][A-Za-z-]*\b/g, token => wordMap.get(token) || wordMap.get(token.toLowerCase()) || token);
      protectedState.held.forEach((term, index) => { text = text.split(`@@ESSDOM${index}@@`).join(term); });
      return text.replace(/\s+([、。])/g, '$1');
    };

    const sweepFeedback = () => {
      if (!Paper2.isStructuredEssSectionB?.()) return;
      const root = document.getElementById('paper2-feedback');
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      const nodes = [];
      while (walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach((node, index) => {
        const original = node.nodeValue || '';
        if (!/[ぁ-んァ-ヶ一-龯々]/.test(original)) return;
        const cleaned = cleanMixedJapanese(original, `dom-text:${index + 1}`);
        if (cleaned !== original) node.nodeValue = cleaned;
      });
    };

    const priorSubmit = Paper2.submit.bind(Paper2);
    Paper2.submit = function(...args) {
      const result = priorSubmit(...args);
      sweepFeedback();
      return result;
    };

    const priorRender = Paper2.render.bind(Paper2);
    Paper2.render = function(...args) {
      const result = priorRender(...args);
      if (this.isStructuredEssSectionB?.()) window.setTimeout(sweepFeedback, 0);
      return result;
    };

    Paper2.sweepEssSectionBJapaneseDom = sweepFeedback;
    Paper2.cleanMixedEssSectionBJapaneseDomText = cleanMixedJapanese;
  };

  install();
})();