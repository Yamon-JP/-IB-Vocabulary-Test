// ESS HL Paper 2 Section B: final Japanese audit after all localization layers.
// Important ESS terms remain English-first with a Japanese gloss; ordinary English is translated.
(() => {
  const MAX_ATTEMPTS = 420;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essSectionBZeroBareEnglishInstalled
      || typeof Paper2.zeroBareEnglishEssSectionB !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B final Japanese audit could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBFinalJapaneseAuditInstalled) return;
    Paper2.essSectionBFinalJapaneseAuditInstalled = true;

    const phraseMap = [
      // Important ESS / HL terms: English first, Japanese gloss second.
      ['environmental impact assessment', 'environmental impact assessment (EIA)（環境影響評価）'],
      ['biogeochemical cycles', 'biogeochemical cycle（生物地球化学的循環）'],
      ['biogeochemical cycle', 'biogeochemical cycle（生物地球化学的循環）'],
      ['nutrient pool', 'nutrient pool（栄養塩プール）'], ['nutrient flux', 'nutrient flux（栄養塩フラックス）'],
      ['carbon sink', 'carbon sink（炭素吸収源）'], ['genetic bottleneck', 'genetic bottleneck（遺伝的ボトルネック）'],
      ['trophic effect', 'trophic effect（栄養段階への影響）'], ['resource scarcity', 'resource scarcity（資源希少性）'],
      ['biodiversity offset', 'biodiversity offset（生物多様性オフセット）'], ['acid drainage', 'acid drainage（酸性鉱山排水）'],
      ['doughnut economics', 'doughnut economics（ドーナツ経済学）'], ['public good', 'public good（公共財）'],
      ['economic valuation', 'economic valuation（経済的評価）'], ['ecosystem-service valuation', 'ecosystem-service valuation（生態系サービスの経済評価）'],
      ['intrinsic value', 'intrinsic value（内在的価値）'], ['instrumental value', 'instrumental value（道具的価値）'],
      ['moral standing', 'moral standing（道徳的地位）'], ['stewardship', 'stewardship（環境管理責任）'],
      ['deontology', 'deontology（義務論）'], ['utilitarianism', 'utilitarianism（功利主義）'],
      ['anthropocentrism', 'anthropocentrism（人間中心主義）'], ['biocentrism', 'biocentrism（生命中心主義）'],
      ['ecocentrism', 'ecocentrism（生態系中心主義）'], ['rights-based ethics', 'rights-based ethics（権利に基づく倫理）'],
      ['rights-based approach', 'rights-based approach（権利に基づく立場）'], ['rights-based', 'rights-based（権利に基づく立場）'],
      ['procedural justice', 'procedural justice（手続き的正義）'], ['distributional justice', 'distributional justice（分配的正義）'],

      // General phrases that must appear as Japanese only.
      ['rainwater harvesting', '雨水利用'], ['evapotranspiration', '蒸発散'], ['water-quality management', '水質管理'],
      ['drainage basin', '流域'], ['water-scarce', '水不足の'], ['variable-supply', '供給変動の大きい'],
      ['behavioural constraint', '行動上の制約'], ['behavioural constraints', '行動上の制約'],
      ['non-native organism', '外来生物'], ['non-native organisms', '外来生物'], ['biological control', '生物学的防除'],
      ['breeding stock', '繁殖個体群'], ['disease transmission', '疾病伝播'], ['community structure', '群集構造'],
      ['community incentive', '地域社会への誘因'], ['community incentives', '地域社会への誘因'],
      ['community consultation', '地域住民との協議'], ['rehabilitation bond', '復元保証金'],
      ['supply-chain standard', 'サプライチェーン基準'], ['supply-chain standards', 'サプライチェーン基準'],
      ['product longevity', '製品の長寿命化'], ['material efficiency', '資材効率'], ['careful site selection', '慎重な立地選定'],
      ['site selection', '立地選定'], ['mine-site impact', '採掘現場での影響'], ['mine-site impacts', '採掘現場での影響'],
      ['mine-site mitigation', '採掘現場での緩和策'], ['mine site', '採掘現場'], ['mine footprint', '採掘区域'],
      ['progressive rehabilitation', '段階的な環境復元'], ['cleanup liability', '浄化責任'], ['responsible sourcing', '責任ある調達'],
      ['lower-grade ore', '低品位鉱石'], ['lower-grade ores', '低品位鉱石'], ['remote habitat', '遠隔地の生息地'], ['remote habitats', '遠隔地の生息地'],
      ['water-stressed region', '水不足地域'], ['water-stressed regions', '水不足地域'], ['land clearance', '土地開墾'],
      ['primary extraction', '一次採掘'], ['collection rate', '回収率'], ['collection rates', '回収率'], ['technological constraint', '技術的制約'], ['technological constraints', '技術的制約'],
      ['hydrological change', '水文変化'], ['hydrological changes', '水文変化'], ['cultural value', '文化的価値'], ['cultural values', '文化的価値'],
      ['affected community', '影響を受ける地域社会'], ['affected communities', '影響を受ける地域社会'], ['financial responsibility', '財務上の責任'],
      ['full life cycle', 'ライフサイクル全体'], ['single site', '単一の場所'], ['intact ecosystem', '健全な生態系'], ['intact ecosystems', '健全な生態系'],
      ['low-carbon technology', '低炭素技術'], ['low-carbon technologies', '低炭素技術'], ['circular material use', '資材の循環利用'],
      ['final goods/services', '最終財・サービス'], ['final goods and services', '最終財・サービス'], ['future ecosystem-service flow', '将来の生態系サービスの供給'],
      ['future ecosystem-service flows', '将来の生態系サービスの供給'], ['conventional GDP', '従来型GDP'], ['indicator choice', '指標の選択'],
      ['policy priority', '政策上の優先事項'], ['policy priorities', '政策上の優先事項'], ['market activity', '市場活動'], ['pollution cleanup', '汚染の浄化'],
      ['ordinary market price', '通常の市場価格'], ['ordinary market prices', '通常の市場価格'], ['national account', '国民経済計算'], ['national accounts', '国民経済計算'],
      ['annual economic flow', '年間の経済フロー'], ['annual economic flows', '年間の経済フロー'], ['biophysical system', '生物物理学的システム'], ['biophysical systems', '生物物理学的システム'],
      ['non-market value', '非市場価値'], ['non-market values', '非市場価値'], ['irreversible ecological loss', '不可逆的な生態系の損失'],
      ['complex indicator', '複合指標'], ['complex indicators', '複合指標'], ['single number', '単一の数値'], ['long-term well-being', '長期的な福祉'],
      ['transparent method', '透明性のある方法'], ['transparent methods', '透明性のある方法'], ['regular reporting', '定期的な報告'],
      ['political incentive', '政治的誘因'], ['political incentives', '政治的誘因'], ['distributional conflict', '分配をめぐる対立'], ['distributional conflicts', '分配をめぐる対立'],
      ['environmental decision', '環境に関する意思決定'], ['environmental decisions', '環境に関する意思決定'], ['total economic benefit', '経済的便益の総量'],
      ['moral principle', '道徳原則'], ['moral principles', '道徳原則'], ['waste facility', '廃棄物処理施設'], ['health risk', '健康リスク'], ['health risks', '健康リスク'],
      ['overall benefit', '全体の便益'], ['net benefit', '純便益'], ['serious involuntary harm', '深刻な非自発的被害'], ['persistent pollution', '長期に残る汚染'],
      ['fair procedure', '公正な手続き'], ['fair procedures', '公正な手続き'], ['transparent reasoning', '透明性のある判断根拠'], ['decision process', '意思決定過程'],
      ['short-term agricultural yield', '短期的な農業収量'], ['biological activity', '生物活性'], ['agricultural input', '農業投入物'], ['agricultural inputs', '農業投入物'],
      ['soil degradation', '土壌劣化'], ['cover crops', '被覆作物'], ['organic amendments', '有機改良資材'], ['buffer strips', '緩衝帯'], ['manure management', '家畜ふん尿管理'],
      ['habitat retention', '生息地の維持'], ['functional biodiversity', '機能的な生物多様性'], ['farmer income', '農家所得'],
      ['high-input intensification', '高投入型集約化'], ['input-price vulnerability', '投入価格への脆弱性'], ['low-input', '低投入型'],
      ['agroecological approach', '生態学的農業アプローチ'], ['agroecological approaches', '生態学的農業アプローチ'], ['land requirement', '土地需要'], ['land requirements', '土地需要'],
      ['yield gap', '収量差'], ['yield gaps', '収量差'], ['precision agriculture', '精密農業'], ['improved crop variety', '改良作物品種'], ['improved crop varieties', '改良作物品種'],
      ['vulnerable population', '脆弱な人々'], ['vulnerable populations', '脆弱な人々'], ['extension service', '農業普及サービス'], ['extension services', '農業普及サービス'],
      ['damaging externality', '有害な外部性'], ['damaging externalities', '有害な外部性'], ['socioeconomic condition', '社会経済条件'], ['socioeconomic conditions', '社会経済条件'],
      ['farmer knowledge', '農家の知識'], ['market access', '市場へのアクセス'], ['food-access issue', '食料アクセスの問題'], ['food-access issues', '食料アクセスの問題'],
      ['agricultural system', '農業システム'], ['agricultural systems', '農業システム'], ['agricultural example', '農業の例'], ['agricultural examples', '農業の例'],
      ['management choice', '管理上の選択'], ['management choices', '管理上の選択'], ['ecosystem example', '生態系の例'], ['agricultural landscape', '農業景観'], ['agricultural landscapes', '農業景観'],
      ['landscape-scale planning', '景観規模の計画'], ['protected-area designation', '保護区指定'], ['buffer zone', '緩衝地帯'], ['buffer zones', '緩衝地帯'],
      ['invasive-species control', '侵略的外来種の管理'], ['harvest regulation', '採取規制'], ['captive breeding', '飼育下繁殖'], ['community-based management', '地域共同管理'],
      ['community-based conservation', '地域共同型保全'], ['containment', '封じ込め'], ['targeted control', '対象を絞った管理'],
      ['science-based harvest limit', '科学的根拠に基づく採取制限'], ['science-based harvest limits', '科学的根拠に基づく採取制限'],
      ['cost-benefit analysis', 'cost-benefit analysis（費用便益分析）'], ['direct human welfare', '直接的な人間の福祉'], ['aggregate gain', '全体としての利益'],
      ['competing rights', '競合する権利'], ['practical constraint', '実務上の制約'], ['practical constraints', '実務上の制約'],
      ['environmental consequence', '環境上の結果'], ['environmental consequences', '環境上の結果'], ['ethical dilemma', 'ethical dilemma（倫理的ジレンマ）'],
      ['moral responsibility', 'moral responsibility（道徳的責任）'], ['ethical disagreement', '倫理上の意見の相違'], ['explicit justification', '明示的な根拠説明'],
      ['early participation', '早期段階からの参加'], ['accessible information', '利用しやすい情報'], ['compensation mechanism', '補償の仕組み'], ['remedy mechanism', '救済の仕組み']
    ].sort((a, b) => b[0].length - a[0].length);

    const wordMap = new Map(Object.entries({
      systems:'システム', degraded:'劣化した', basin:'流域', basins:'流域', needs:'需要', simplification:'単純化', alone:'単独で', access:'利用',
      strategy:'対策', strategies:'対策', management:'管理', pressure:'圧力', pressures:'圧力', risk:'リスク', risks:'リスク', judgement:'判断',
      model:'モデル', models:'モデル', data:'データ', participation:'参加', value:'価値', values:'価値観', effective:'有効な', effectiveness:'有効性',
      conservation:'保全', landscape:'景観', landscapes:'景観', designation:'指定', recharge:'涵養', precipitation:'降水', behavioural:'行動上の',
      constraint:'制約', constraints:'制約', native:'在来の', nonnative:'外来の', organism:'生物', organisms:'生物', predation:'捕食',
      driver:'要因', drivers:'要因', community:'地域社会', communities:'地域社会', harm:'被害', harms:'被害', threatened:'絶滅の危機にある',
      control:'管理', controls:'管理', establishment:'定着', species:'種', levels:'段階', decline:'減少', bottlenecks:'ボトルネック',
      competition:'競争', transmission:'伝播', high:'高い', aggregate:'全体の', gain:'利益', approach:'アプローチ', approaches:'アプローチ',
      serious:'深刻な', practical:'実務上の', framework:'枠組み', frameworks:'枠組み', position:'立場', positions:'立場', standing:'地位',
      decision:'意思決定', decisions:'意思決定', conclusion:'結論', conclusions:'結論', present:'現在の', quality:'質', irreversible:'不可逆的な',
      transparent:'透明性のある', information:'情報', compensation:'補償', remedy:'救済', legitimate:'正当な', process:'過程', processes:'過程',
      conflict:'対立', conflicts:'対立', generation:'世代', generations:'世代', income:'所得', location:'場所', project:'事業', projects:'事業',
      overall:'全体の', positive:'正の', negative:'負の', direct:'直接的な', benefit:'便益', benefits:'便益', burden:'負担', burdens:'負担',
      affected:'影響を受ける', meaningful:'実質的な', total:'総量', minority:'少数者', minorities:'少数者', development:'開発',
      economic:'経済的な', environmental:'環境の', social:'社会的な', local:'地域の', public:'市民・公共の', regional:'地域の', national:'国内の',
      economy:'経済', investor:'投資家', investors:'投資家', government:'政府', governments:'政府', assumption:'前提', assumptions:'前提',
      comparability:'比較可能性', communication:'情報伝達', annual:'年間の', flow:'流れ', flows:'流れ', embedded:'組み込まれた', measurement:'測定',
      automatically:'自動的に', political:'政治的な', priority:'優先事項', priorities:'優先事項', extraction:'採掘', cleanup:'浄化', ordinary:'通常の',
      indicator:'指標', indicators:'指標', adjusted:'調整済み', monetary:'貨幣の', depletion:'枯渇', assets:'資産', goods:'財', services:'サービス',
      produced:'生産された', within:'内部で', direct:'直接の', measure:'指標', measures:'指標・対策', progress:'進歩', stocks:'資源量', stock:'資源量',
      mining:'採掘', mineral:'鉱物', minerals:'鉱物', finite:'有限の', scarcity:'希少性', circularity:'循環性', reuse:'再利用', recycling:'リサイクル', substitution:'代替',
      rehabilitation:'復元', permitting:'許認可', ore:'鉱石', method:'方法', methods:'方法', availability:'利用可能性', rising:'増加する', remote:'遠隔地の',
      roads:'道路', road:'道路', infrastructure:'インフラ', fragment:'分断する', footprint:'区域', metal:'金属', metals:'金属', processing:'処理',
      primary:'一次の', turnover:'更新', collection:'回収', contamination:'汚染混入', technological:'技術的な', mitigation:'緩和', toxic:'有害な',
      supply:'供給', technologies:'技術', technology:'技術', cultural:'文化的な', sourcing:'調達', unavoidable:'避けられない', whole:'全体の', sensitive:'影響を受けやすい',
      site:'場所', sites:'場所', mined:'採掘される', product:'製品', products:'製品', design:'設計', efficient:'効率的な', strict:'厳格な', safeguard:'保護措置', safeguards:'保護措置',
      lifecycle:'ライフサイクル', conventional:'従来型の', future:'将来の', market:'市場', price:'価格', prices:'価格', account:'計算', accounts:'計算',
      ecological:'生態学的な', biophysical:'生物物理学的な', practical:'実用的な', visible:'見えやすい', uncertainty:'不確実性', complex:'複雑な',
      replacing:'置き換える', multiple:'複数の', output:'生産量', outputs:'生産量', useful:'有用な', consistent:'一貫した', regular:'定期的な',
      better:'より良い', unchanged:'変わらない', moral:'道徳的な', principles:'原則', principle:'原則', facility:'施設', facilities:'施設', jobs:'雇用', job:'雇用',
      revenue:'収入', noise:'騒音', health:'健康', utilitarian:'功利主義的な', reject:'拒否する', involuntary:'非自発的な', positive:'正の',
      ecocentric:'生態系中心主義的な', purely:'純粋に', calculation:'計算', dimension:'側面', persistent:'長期に残る', original:'当初の', evidence:'根拠',
      consequences:'結果', consequence:'結果', rights:'権利', fair:'公正な', procedures:'手続き', disagreement:'意見の相違', protection:'保護',
      agricultural:'農業の', maximizing:'最大化する', structure:'構造', activity:'活動', inputs:'投入物', contributing:'つながる', organic:'有機の', amendments:'改良資材',
      precision:'精密な', budgeting:'収支管理', strips:'帯状区画', improved:'改善された', manure:'家畜ふん尿', retention:'維持', hypothetical:'仮想の',
      markets:'市場', farmland:'農地', monoculture:'単一栽培', agroecosystem:'農業生態系', functional:'機能的な', farmer:'農家', intensification:'集約化',
      input:'投入物', purchased:'購入した', agroecological:'生態学的農業の', labour:'労働力', transition:'移行', possible:'可能性のある', gap:'差',
      varieties:'品種', variety:'品種', vulnerable:'脆弱な', populations:'人々', extension:'普及', secure:'安定した', tenure:'保有権', damaging:'有害な',
      socioeconomic:'社会経済的な', scale:'規模', scales:'規模', longterm:'長期的な', shortterm:'短期的な', environmental:'環境の',
      affordable:'手頃な', nutritious:'栄養のある', method:'方法', farming:'農業', combination:'組み合わせ', combinations:'組み合わせ',
      analytical:'分析的な', balanced:'バランスの取れた', critical:'批判的な', reflection:'検討', descriptor:'評価基準の説明', markband:'評価帯'
    }));

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const protectGlossed = value => {
      const held = [];
      const text = value.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,12}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSFIN${held.length}@@`;
        held.push(match);
        return token;
      });
      return { text, held };
    };

    const findResidualEnglish = value => {
      const stripped = value.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,12}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, '');
      return [...new Set(stripped.match(/\b[A-Za-z][A-Za-z-]*\b/g) || [])]
        .filter(token => !['ESS', 'HL'].includes(token));
    };

    const finalAudit = (value, location = '') => {
      if (typeof value !== 'string' || !value.trim()) return value;
      let text = Paper2.zeroBareEnglishEssSectionB(value);
      const protectedState = protectGlossed(text);
      text = protectedState.text;
      phraseMap.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      text = text.replace(/\b[A-Za-z][A-Za-z-]*\b/g, token => wordMap.get(token) || wordMap.get(token.toLowerCase()) || token);
      protectedState.held.forEach((term, index) => { text = text.split(`@@ESSFIN${index}@@`).join(term); });
      text = text.replace(/\s+([、。])/g, '$1');

      const residual = findResidualEnglish(text);
      if (residual.length) {
        const id = Paper2.current?.id || 'unknown-question';
        console.warn(`[ESS Section B JP audit] ${id}${location ? ` ${location}` : ''}: residual English -> ${residual.join(', ')}`);
      }
      return text;
    };

    const priorApply = Paper2.applyEssSet8Structure?.bind(Paper2);
    if (priorApply) {
      Paper2.applyEssSet8Structure = function(question) {
        const hydrated = priorApply(question);
        if (!hydrated || hydrated.subject !== 'ESS HL' || hydrated.assessmentTarget !== 'ess2b') return hydrated;
        return {
          ...hydrated,
          markschemeJa: Array.isArray(hydrated.markschemeJa) ? hydrated.markschemeJa.map((text, i) => finalAudit(text, `markschemeJa:${i + 1}`)) : hydrated.markschemeJa,
          modelAnswerJa: finalAudit(hydrated.modelAnswerJa, 'modelAnswerJa'),
          parts: Array.isArray(hydrated.parts) ? hydrated.parts.map(part => ({
            ...part,
            markschemeJa: Array.isArray(part?.markschemeJa) ? part.markschemeJa.map((text, i) => finalAudit(text, `part-${part?.label || '?'}-markschemeJa:${i + 1}`)) : part?.markschemeJa,
            modelAnswerJa: finalAudit(part?.modelAnswerJa, `part-${part?.label || '?'}-modelAnswerJa`)
          })) : hydrated.parts,
          _essSectionBFinalJapaneseAudit: true
        };
      };
    }

    const priorRenderMarkPoint = Paper2.renderMarkPoint.bind(Paper2);
    Paper2.renderMarkPoint = function(point, index, japaneseText = '') {
      const cleaned = this.isEssSectionB?.() ? finalAudit(japaneseText, `render-mark-point:${index + 1}`) : japaneseText;
      return priorRenderMarkPoint(point, index, cleaned);
    };

    if (typeof Paper2.renderStructuredIndicativeContent === 'function') {
      const priorIndicative = Paper2.renderStructuredIndicativeContent.bind(Paper2);
      Paper2.renderStructuredIndicativeContent = function(markscheme, markschemeJa, config) {
        const cleaned = Array.isArray(markschemeJa) ? markschemeJa.map((text, i) => finalAudit(text, `indicative:${i + 1}`)) : markschemeJa;
        return priorIndicative(markscheme, cleaned, config);
      };
    }

    if (typeof Paper2.renderStructuredModelAnswers === 'function') {
      const priorModels = Paper2.renderStructuredModelAnswers.bind(Paper2);
      Paper2.renderStructuredModelAnswers = function(...args) {
        if (this.isStructuredEssSectionB?.() && Array.isArray(this.current?.parts)) {
          this.current = {
            ...this.current,
            modelAnswerJa: finalAudit(this.current.modelAnswerJa, 'render-modelAnswerJa'),
            parts: this.current.parts.map(part => ({
              ...part,
              modelAnswerJa: finalAudit(part?.modelAnswerJa, `render-part-${part?.label || '?'}-modelAnswerJa`)
            }))
          };
        }
        return priorModels(...args);
      };
    }

    if (typeof Paper2.getEssHlMarkbandDescriptors === 'function') {
      const priorBands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
      Paper2.getEssHlMarkbandDescriptors = function() {
        return priorBands().map(band => ({ ...band, textJa: finalAudit(band.textJa, `markband-${band.range}`) }));
      };
    }

    Paper2.finalAuditEssSectionBJapanese = finalAudit;
    Paper2.findResidualEssSectionBEnglish = findResidualEnglish;
  };

  install();
})();