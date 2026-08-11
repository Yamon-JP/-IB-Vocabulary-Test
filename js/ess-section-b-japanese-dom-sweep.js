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
      ['indicative content', '参考内容']
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
      connection: '接続', connections: '接続', foundation: '基礎', foundations: '基礎', context: '文脈', descriptive: '記述的な', unsupported: '根拠のない'
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