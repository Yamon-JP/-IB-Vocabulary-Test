// Final render-time Japanese guard for ESS HL Paper 2 Section B.
// Cleans the actual Japanese strings immediately before they are displayed.
(() => {
  const MAX_ATTEMPTS = 320;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essSectionBJapaneseFinalPassV2Installed
      || typeof Paper2.strictCleanEssSectionBJapaneseV2 !== 'function'
      || typeof Paper2.renderMarkPoint !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B Japanese render guard could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBJapaneseRenderGuardInstalled) return;
    Paper2.essSectionBJapaneseRenderGuardInstalled = true;

    const phrases = [
      ['riparian vegetation', '河岸植生'], ['riparian restoration', '河岸域の復元'], ['sediment transport', '土砂輸送'], ['sediment', '土砂'],
      ['ecosystem integrity', '生態系の健全性'], ['aquatic ecosystem', '水生生態系'], ['livelihood security', '生計の安定'], ['livelihood', '生計'],
      ['power imbalance', '力関係の不均衡'], ['systems analysis', 'システム分析'], ['system analysis', 'システム分析'], ['system boundary', 'システム境界'],
      ['natural ecosystem', '自然生態系'], ['fragmented landscape', '分断された景観'], ['isolated patch', '孤立した生息地区画'], ['protected fragment', '保護された生息地区画'],
      ['stepping-stone habitat', '飛び石状の生息地'], ['functioning habitat', '機能する生息地'], ['local community', '地域社会'], ['local participation', '地域住民の参加'],
      ['local people', '地域住民'], ['threat reduction', '脅威の削減'], ['effective enforcement', '実効的な法執行'], ['reliable data', '信頼できるデータ'],
      ['water supply', '水供給'], ['usable water supply', '利用可能な水供給'], ['usable water', '利用可能な水'], ['new supply', '新たな水供給'],
      ['water use', '水利用'], ['energy use', 'エネルギー使用'], ['human supply', '人間の水利用'], ['human need', '人間の需要'],
      ['short-term', '短期的な'], ['long-term', '長期的な'], ['short term', '短期'], ['long term', '長期'],
      ['long-term warming', '長期的な温暖化'], ['future climate change', '将来の気候変動'], ['current risk', '現在のリスク'], ['future exposure', '将来の曝露'],
      ['future production', '将来の生産'], ['future climate', '将来の気候'], ['future condition', '将来条件'], ['future conditions', '将来条件'],
      ['climate system', '気候システム'], ['climate policy', '気候政策'], ['climate impact', '気候変動の影響'], ['climate impacts', '気候変動の影響'],
      ['climate variability', '気候の変動性'], ['climate change', '気候変動'], ['sea-level rise', '海面上昇'], ['storm surge', '高潮'],
      ['extreme rainfall', '極端な降雨'], ['heat extreme', '極端な高温'], ['heat extremes', '極端な高温'], ['heat planning', '暑熱対策'],
      ['flood protection', '洪水対策'], ['coastal protection', '沿岸防護'], ['coastal development', '沿岸開発'], ['coastal city', '沿岸都市'], ['coastal cities', '沿岸都市'],
      ['social acceptance', '社会的受容'], ['social barrier', '社会的障壁'], ['social barriers', '社会的障壁'], ['social cost', '社会的費用'], ['social costs', '社会的費用'],
      ['environmental cost', '環境費用'], ['environmental costs', '環境費用'], ['economic cost', '経済的費用'], ['economic costs', '経済的費用'],
      ['environmental condition', '環境条件'], ['environmental conditions', '環境条件'], ['environmental impact', '環境への影響'], ['environmental impacts', '環境への影響'],
      ['human impact', '人間活動による影響'], ['human impacts', '人間活動による影響'], ['human activity', '人間活動'], ['human activities', '人間活動'],
      ['human welfare', '人間の福祉'], ['human well-being', '人間の福祉'], ['human pressure', '人間活動による圧力'], ['human pressures', '人間活動による圧力'],
      ['food production', '食料生産'], ['food supply', '食料供給'], ['crop production', '作物生産'], ['crop diversity', '作物多様性'], ['crop yield', '作物収量'],
      ['crop varieties', '作物品種'], ['resilient crops', '気候影響に強い作物'], ['farm size', '農場規模'], ['farm system', '農業システム'], ['farming system', '農業システム'],
      ['land management', '土地管理'], ['land conversion', '土地転換'], ['land availability', '利用可能な土地'], ['land use', '土地利用'], ['land-use', '土地利用'],
      ['water pollution', '水質汚染'], ['nutrient pollution', '栄養塩汚染'], ['air pollution', '大気汚染'], ['pollution control', '汚染対策'],
      ['habitat damage', '生息地への損傷'], ['habitat conversion', '生息地転換'], ['habitat loss', '生息地の喪失'], ['habitat area', '生息地面積'],
      ['habitat strip', '生息地帯'], ['habitat strips', '生息地帯'], ['habitat corridor', '生態学的回廊'], ['habitat corridors', '生態学的回廊'],
      ['population size', '個体群サイズ'], ['population data', '個体群データ'], ['population pressure', '人口圧力'], ['population growth', '人口増加'],
      ['population structure', '人口構成'], ['population number', '人口数'], ['population numbers', '人口数'], ['population share', '人口割合'],
      ['gene flow', 'gene flow（遺伝子流動）'], ['species richness', 'species richness（種の豊富さ）'], ['species abundance', '種の個体数'], ['species biology', '種の生物学的特性'],
      ['ecological process', '生態学的過程'], ['ecological processes', '生態学的過程'], ['ecological interaction', '生態学的相互作用'], ['ecological interactions', '生態学的相互作用'],
      ['ecological regulation', '生態系による調節'], ['ecological condition', '生態学的条件'], ['ecological conditions', '生態学的条件'], ['ecological value', '生態学的価値'],
      ['ecosystem function', '生態系機能'], ['ecosystem functions', '生態系機能'], ['ecosystem damage', '生態系への損傷'], ['ecosystem protection', '生態系保護'],
      ['resource use', '資源利用'], ['resource pressure', '資源への圧力'], ['resource demand', '資源需要'], ['resource management', '資源管理'], ['resource stock', '資源量'],
      ['resource stocks', '資源量'], ['resource flow', '資源の流れ'], ['resource flows', '資源の流れ'], ['resource security', '資源安全保障'],
      ['energy demand', 'エネルギー需要'], ['energy access', 'エネルギーへのアクセス'], ['energy mix', 'エネルギー構成'], ['energy source', 'エネルギー源'], ['energy sources', 'エネルギー源'],
      ['low-carbon source', '低炭素エネルギー源'], ['low-carbon sources', '低炭素エネルギー源'], ['low-carbon technology', '低炭素技術'], ['low-carbon technologies', '低炭素技術'],
      ['low-carbon alternative', '低炭素の代替手段'], ['low-carbon alternatives', '低炭素の代替手段'], ['fossil-fuel dependence', '化石燃料への依存'], ['fossil fuel dependence', '化石燃料への依存'],
      ['grid balancing', '電力系統の需給調整'], ['grid support', '電力網の支援'], ['grid storage', '系統用蓄電'], ['demand-side change', '需要側の変化'],
      ['demand reduction', '需要削減'], ['demand management', '需要管理'], ['demand growth', '需要増加'], ['total demand', '総需要'],
      ['market-based instrument', '市場を利用した経済的手段'], ['market-based instruments', '市場を利用した経済的手段'], ['economic instrument', '経済的手段'], ['economic instruments', '経済的手段'],
      ['price certainty', '価格の予測可能性'], ['quantity certainty', '排出量の予測可能性'], ['carbon price', 'carbon price（炭素価格）'], ['emission pricing', '排出への価格付け'],
      ['policy design', '政策設計'], ['policy interpretation', '政策上の解釈'], ['policy decision', '政策決定'], ['policy decisions', '政策決定'], ['policy measure', '政策手段'], ['policy measures', '政策手段'],
      ['policy target', '政策目標'], ['policy targets', '政策目標'], ['policy outcome', '政策の結果'], ['policy outcomes', '政策の結果'], ['policy tool', '政策手段'], ['policy tools', '政策手段'],
      ['decision making', '意思決定'], ['decision-making', '意思決定'], ['decision legitimacy', '意思決定の正当性'], ['decision process', '意思決定過程'],
      ['stakeholder value', '利害関係者の価値観'], ['stakeholder values', '利害関係者の価値観'], ['stakeholder group', '利害関係者集団'], ['stakeholder groups', '利害関係者集団'],
      ['stakeholder participation', '利害関係者の参加'], ['stakeholder management', '利害関係者との調整'], ['community participation', '地域住民の参加'], ['public participation', '市民参加'],
      ['international cooperation', '国際協力'], ['international agreement', '国際協定'], ['international agreements', '国際協定'], ['national regulation', '国内規制'], ['national regulations', '国内規制'],
      ['national law', '国内法'], ['international law', '国際法'], ['legal protection', '法的保護'], ['legal control', '法的規制'], ['legal controls', '法的規制'],
      ['legal duty', '法的義務'], ['legal duties', '法的義務'], ['legal obligation', '法的義務'], ['legal obligations', '法的義務'], ['legal framework', '法的枠組み'],
      ['monitoring system', 'モニタリング体制'], ['monitoring data', 'モニタリングデータ'], ['reliable monitoring', '信頼できるモニタリング'], ['long-term monitoring', '長期的モニタリング'],
      ['implementation cost', '導入費用'], ['implementation costs', '導入費用'], ['implementation', '実施'], ['enforcement capacity', '法執行能力'], ['management capacity', '管理能力'],
      ['governance capacity', 'ガバナンス能力'], ['institutional capacity', '制度的能力'], ['institutional support', '制度的支援'], ['political commitment', '政治的意思'],
      ['scientific data', '科学的データ'], ['scientific evidence', '科学的根拠'], ['scientific estimate', '科学的推定'], ['scientific estimates', '科学的推定'], ['scientific uncertainty', '科学的不確実性'],
      ['economic activity', '経済活動'], ['economic benefit', '経済的便益'], ['economic benefits', '経済的便益'], ['economic objective', '経済的目標'], ['economic objectives', '経済的目標'],
      ['social benefit', '社会的便益'], ['social benefits', '社会的便益'], ['social objective', '社会的目標'], ['social objectives', '社会的目標'], ['social impact', '社会への影響'], ['social impacts', '社会への影響'],
      ['distributional effect', '分配への影響'], ['distributional effects', '分配への影響'], ['distributional concern', '分配上の懸念'], ['distributional concerns', '分配上の懸念'],
      ['cost distribution', '費用負担の分配'], ['cost-benefit analysis', 'cost-benefit analysis（費用便益分析）'], ['cost effective', '費用対効果が高い'], ['cost-effective', '費用対効果が高い'],
      ['carbon storage', '炭素貯蔵'], ['carbon emission', '炭素排出'], ['carbon emissions', '炭素排出'], ['greenhouse-gas emission', '温室効果ガス排出'], ['greenhouse-gas emissions', '温室効果ガス排出'],
      ['greenhouse gas emission', '温室効果ガス排出'], ['greenhouse gas emissions', '温室効果ガス排出'], ['GHG emission', '温室効果ガス排出'], ['GHG emissions', '温室効果ガス排出'],
      ['emission reduction', '排出削減'], ['emission reductions', '排出削減'], ['emission limit', '排出上限'], ['emission limits', '排出上限'], ['emission standard', '排出基準'], ['emission standards', '排出基準'],
      ['risk reduction', 'リスク削減'], ['risk management', 'リスク管理'], ['risk system', 'リスクを生み出すシステム'], ['risk assessment', 'リスク評価'],
      ['balanced analysis', 'バランスの取れた分析'], ['critical reflection', '批判的検討'], ['best-fit markband', '最も適合する評価帯'], ['best-fit', '最も適合する'],
      ['markband', '評価帯'], ['markbands', '評価帯'], ['descriptor', '評価基準の説明'], ['descriptors', '評価基準の説明'], ['analytic marks', '項目別採点'], ['analytic mark', '項目別採点'],
      ['indicative content', '参考内容'], ['training rubric', '練習用評価基準'], ['training paraphrase', '練習用の言い換え'], ['self-mark', '自己採点'], ['structured essay', '構造化エッセイ']
    ].sort((a, b) => b[0].length - a[0].length);

    const words = new Map(Object.entries({
      access:'アクセス', action:'行動', actions:'行動', activity:'活動', activities:'活動', affordable:'負担可能な', ageing:'高齢化した', alternative:'代替手段', alternatives:'代替手段',
      analysis:'分析', argument:'議論', balance:'バランス', balanced:'バランスの取れた', barrier:'障壁', barriers:'障壁', benefit:'便益', benefits:'便益', capacity:'能力', choice:'選択', choices:'選択',
      clean:'低汚染の', cleaner:'より低汚染の', condition:'条件', conditions:'条件', conflict:'対立', conflicts:'対立', connected:'相互につながった', control:'管理', controls:'管理', conversion:'転換',
      current:'現在の', damage:'損傷', data:'データ', demand:'需要', design:'設計', direct:'直接的な', directly:'直接', effect:'影響', effects:'影響', effective:'実効的な', effectiveness:'有効性',
      efficient:'効率的な', environmental:'環境の', exposure:'曝露', fair:'公平な', fairness:'公平性', finance:'資金', future:'将来の', group:'集団', groups:'集団', harm:'損害', harms:'損害',
      high:'高い', impact:'影響', impacts:'影響', important:'重要な', increase:'増加', increases:'増加', increasing:'増加', industry:'産業', institution:'制度', institutions:'制度', integrated:'統合的な',
      interaction:'相互作用', interactions:'相互作用', local:'地域の', management:'管理', measure:'対策', measures:'対策', method:'方法', methods:'方法', model:'モデル', models:'モデル', need:'必要性', needs:'需要',
      objective:'目標', objectives:'目標', option:'選択肢', options:'選択肢', outcome:'結果', outcomes:'結果', participation:'参加', pressure:'圧力', pressures:'圧力', priority:'優先事項', priorities:'優先事項',
      problem:'問題', problems:'問題', process:'過程', processes:'過程', protection:'保護', reliable:'信頼できる', response:'対応', responses:'対応', result:'結果', results:'結果', risk:'リスク', risks:'リスク',
      rule:'規則', rules:'規則', scale:'規模', security:'安全保障', solution:'解決策', solutions:'解決策', source:'発生源', sources:'発生源', strategy:'戦略', strategies:'戦略', supply:'供給',
      support:'支援', system:'システム', systems:'システム', technology:'技術', technologies:'技術', tradeoff:'トレードオフ', tradeoffs:'トレードオフ', uncertainty:'不確実性', value:'価値', values:'価値',
      variable:'変動する', vulnerability:'脆弱性', weak:'弱い', welfare:'福祉', quality:'質', quantity:'量', upstream:'上流', downstream:'下流', monitoring:'モニタリング', governance:'ガバナンス',
      enforcement:'法執行', implementation:'実施', regulation:'規制', regulations:'規制', policy:'政策', policies:'政策', planning:'計画', infrastructure:'インフラ', maintenance:'維持管理', stakeholder:'利害関係者', stakeholders:'利害関係者',
      community:'地域社会', communities:'地域社会', conflict:'対立', legitimacy:'正当性', judgement:'判断', judgment:'判断', conclusion:'結論', conclusions:'結論', limitation:'限界', limitations:'限界',
      example:'具体例', examples:'具体例', hypothetical:'仮想の', context:'文脈', contexts:'文脈', relevant:'関連する', appropriate:'適切な', precise:'正確な', terminology:'専門用語', knowledge:'知識',
      reflection:'検討', descriptive:'記述的な', supported:'根拠に支えられた', unsupported:'根拠が不十分な', explicit:'明確な', overall:'全体的な', thorough:'十分な', sound:'十分な', limited:'限定的な',
      substantial:'十分な', broad:'幅広い', integrated:'統合された', critical:'批判的な', holistic:'総合的な', score:'得点', scoring:'採点', rubric:'評価基準', criterion:'評価項目', criteria:'評価項目'
    }));

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const protectGlossedTerms = value => {
      const held = [];
      const text = value.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,10}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSRG${held.length}@@`;
        held.push(match);
        return token;
      });
      return { text, held };
    };

    const renderClean = value => {
      if (typeof value !== 'string' || !value.trim()) return value;
      let text = Paper2.strictCleanEssSectionBJapaneseV2(value);
      const protectedState = protectGlossedTerms(text);
      text = protectedState.text;

      phrases.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      text = text.replace(/\b[A-Za-z][A-Za-z-]*\b/g, token => words.get(token.toLowerCase()) || token);

      protectedState.held.forEach((term, index) => {
        text = text.split(`@@ESSRG${index}@@`).join(term);
      });
      return text
        .replace(/\s+([、。])/g, '$1')
        .replace(/([（(])\s+/g, '$1')
        .replace(/\s+([）)])/g, '$1');
    };

    const originalApply = Paper2.applyEssSet8Structure.bind(Paper2);
    Paper2.applyEssSet8Structure = function(question) {
      const hydrated = originalApply(question);
      if (!hydrated || hydrated.subject !== 'ESS HL' || hydrated.assessmentTarget !== 'ess2b') return hydrated;
      return {
        ...hydrated,
        markschemeJa: Array.isArray(hydrated.markschemeJa) ? hydrated.markschemeJa.map(renderClean) : hydrated.markschemeJa,
        modelAnswerJa: renderClean(hydrated.modelAnswerJa),
        parts: Array.isArray(hydrated.parts) ? hydrated.parts.map(part => ({
          ...part,
          markschemeJa: Array.isArray(part?.markschemeJa) ? part.markschemeJa.map(renderClean) : part?.markschemeJa,
          modelAnswerJa: renderClean(part?.modelAnswerJa)
        })) : hydrated.parts,
        _essSectionBJapaneseRenderGuard: true
      };
    };

    const originalRenderMarkPoint = Paper2.renderMarkPoint.bind(Paper2);
    Paper2.renderMarkPoint = function(point, index, japaneseText = '') {
      const cleaned = this.isEssSectionB?.() ? renderClean(japaneseText) : japaneseText;
      return originalRenderMarkPoint(point, index, cleaned);
    };

    if (typeof Paper2.renderStructuredIndicativeContent === 'function') {
      const originalRenderIndicative = Paper2.renderStructuredIndicativeContent.bind(Paper2);
      Paper2.renderStructuredIndicativeContent = function(markscheme, markschemeJa, config) {
        const cleanedJa = Array.isArray(markschemeJa) ? markschemeJa.map(renderClean) : markschemeJa;
        return originalRenderIndicative(markscheme, cleanedJa, config)
          .replace('Use these ideas to judge relevance and depth. They are not one-mark checkboxes.', 'Use these ideas to judge relevance and depth. They are not one-mark checkboxes.')
          .replace('内容の関連性と深さを確認するための参考ポイントです。1項目＝1点ではありません。', '内容の関連性と深さを確認するための参考ポイントです。各項目がそのまま1点になるわけではありません。');
      };
    }

    if (typeof Paper2.renderStructuredModelAnswers === 'function') {
      const originalRenderModels = Paper2.renderStructuredModelAnswers.bind(Paper2);
      Paper2.renderStructuredModelAnswers = function(...args) {
        if (this.isStructuredEssSectionB?.() && Array.isArray(this.current?.parts)) {
          this.current = {
            ...this.current,
            modelAnswerJa: renderClean(this.current.modelAnswerJa),
            parts: this.current.parts.map(part => ({ ...part, modelAnswerJa: renderClean(part?.modelAnswerJa) }))
          };
        }
        return originalRenderModels(...args);
      };
    }

    if (typeof Paper2.getEssHlMarkbandDescriptors === 'function') {
      const originalBands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
      Paper2.getEssHlMarkbandDescriptors = function() {
        return originalBands().map(band => {
          const japanese = {
            '0': '設問に関連する到達が十分に示されておらず、下の評価帯には入りません。',
            '1–3': 'ESSまたはHLの視点に関する知識が限定的で、設問の文脈との関連が弱い。具体例がない、または十分に展開されておらず、分析は主に記述にとどまる。判断は不明確、または十分な根拠に支えられていない。',
            '4–6': '十分な知識を設問に関連づけ、専門用語を概ね適切に使用している。関連する具体例と、ある程度バランスの取れた分析があり、結論には一定の根拠が示されている。',
            '7–9': 'ESSとHLの視点に関する幅広い知識を十分に統合し、専門用語を正確に使用している。適切でよく説明された具体例、十分にバランスの取れた分析、明確で十分な根拠に支えられた判断、批判的検討が示されている。'
          }[band.range];
          return { ...band, textJa: japanese || renderClean(band.textJa) };
        });
      };
    }

    // Expose for diagnostics and any later Section B renderer.
    Paper2.renderCleanEssSectionBJapanese = renderClean;
  };

  install();
})();