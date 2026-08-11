// Final ESS HL Paper 2 Section B Japanese cleanup pass.
// Runs after the editorial audit and removes residual unglossed English from Japanese support text.
(() => {
  const MAX_ATTEMPTS = 260;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essSectionBJapaneseAuditInstalled
      || typeof Paper2.applyEssSet8Structure !== 'function'
      || typeof Paper2.cleanEssSectionBJapanese !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B final Japanese cleanup could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBJapaneseFinalPassInstalled) return;
    Paper2.essSectionBJapaneseFinalPassInstalled = true;

    const keyTerms = [
      ['environmental value systems (EVS)', 'environmental value systems (EVS)（環境価値体系）'],
      ['environmental value systems', 'environmental value systems (EVS)（環境価値体系）'],
      ['systems thinking', 'systems thinking（システム思考）'],
      ['sustainability', 'sustainability（持続可能性）'],
      ['natural capital', 'natural capital（自然資本）'],
      ['natural income', 'natural income（自然所得）'],
      ['ecosystem services', 'ecosystem services（生態系サービス）'],
      ['ecosystem service', 'ecosystem services（生態系サービス）'],
      ['ecological footprint', 'ecological footprint（エコロジカル・フットプリント）'],
      ['carrying capacity', 'carrying capacity（環境収容力）'],
      ['resilience', 'resilience（レジリエンス）'],
      ['habitat fragmentation', 'habitat fragmentation（生息地の分断）'],
      ['species diversity', 'species diversity（種多様性）'],
      ['species richness', 'species richness（種の豊富さ）'],
      ['genetic diversity', 'genetic diversity（遺伝的多様性）'],
      ['gene flow', 'gene flow（遺伝子流動）'],
      ['edge effect', 'edge effect（エッジ効果）'],
      ['ecological connectivity', 'ecological connectivity（生態学的連結性）'],
      ['population connectivity', 'population connectivity（個体群の連結性）'],
      ['in situ', 'in situ（生息域内保全）'],
      ['ex situ', 'ex situ（生息域外保全）'],
      ['viable population', 'viable population（存続可能な個体群）'],
      ['limiting factor', 'limiting factor（制限要因）'],
      ['water security', 'water security（水の安全保障）'],
      ['environmental flows', 'environmental flow（環境流量）'],
      ['environmental flow', 'environmental flow（環境流量）'],
      ['adaptive management', 'adaptive management（順応的管理）'],
      ['gross primary productivity (GPP)', 'gross primary productivity (GPP)（総一次生産量）'],
      ['net primary productivity (NPP)', 'net primary productivity (NPP)（純一次生産量）'],
      ['ecological efficiency', 'ecological efficiency（生態学的効率）'],
      ['trophic level', 'trophic level（栄養段階）'],
      ['biomass', 'biomass（バイオマス）'],
      ['nutrient cycling', 'nutrient cycling（栄養塩循環）'],
      ['overexploitation', 'overexploitation（過剰利用）'],
      ['invasive species', 'invasive species（侵略的外来種）'],
      ['illegal wildlife trade', 'illegal wildlife trade（違法野生生物取引）'],
      ['biosecurity', 'biosecurity（バイオセキュリティ）'],
      ['enhanced greenhouse effect', 'enhanced greenhouse effect（強化された温室効果）'],
      ['radiative forcing', 'radiative forcing（放射強制力）'],
      ['carbon budget', 'carbon budget（カーボンバジェット）'],
      ['mitigation', 'mitigation（緩和）'],
      ['adaptation', 'adaptation（適応）'],
      ['vulnerability', 'vulnerability（脆弱性）'],
      ['reinforcing feedback', 'reinforcing feedback（正のフィードバック）'],
      ['nature-based solutions', 'nature-based solutions（自然を活用した解決策）'],
      ['maladaptation', 'maladaptation（不適応）'],
      ['erosion', 'erosion（土壌侵食）'],
      ['salinization', 'salinization（塩類集積）'],
      ['topsoil', 'topsoil（表土）'],
      ['soil organic matter', 'soil organic matter（土壌有機物）'],
      ['soil fertility', 'soil fertility（土壌肥沃度）'],
      ['reduced tillage', 'reduced tillage（減耕起）'],
      ['agroforestry', 'agroforestry（アグロフォレストリー）'],
      ['food security', 'food security（食料安全保障）'],
      ['sustainable agriculture', 'sustainable agriculture（持続可能な農業）'],
      ['polyculture', 'polyculture（複数作物栽培）'],
      ['integrated pest management', 'integrated pest management (IPM)（総合的病害虫管理）'],
      ['capture fisheries', 'capture fisheries（漁獲漁業）'],
      ['capture fishery', 'capture fisheries（漁獲漁業）'],
      ['overfishing', 'overfishing（乱獲）'],
      ['bycatch', 'bycatch（混獲）'],
      ['aquaculture', 'aquaculture（養殖）'],
      ['marine protected area', 'marine protected area (MPA)（海洋保護区）'],
      ['renewable resource', 'renewable resource（再生可能資源）'],
      ['non-renewable resource', 'non-renewable resource（非再生可能資源）'],
      ['replenishable resource', 'replenishable resource（補充可能資源）'],
      ['sustainable yield', 'sustainable yield（持続可能な収穫量）'],
      ['maximum sustainable yield', 'maximum sustainable yield (MSY)（最大持続可能漁獲量）'],
      ['energy security', 'energy security（エネルギー安全保障）'],
      ['energy transition', 'energy transition（エネルギー転換）'],
      ['intermittency', 'intermittency（出力変動性）'],
      ['life-cycle impact', 'life-cycle impact（ライフサイクル全体の影響）'],
      ['negative externality', 'negative externality（負の外部性）'],
      ['carbon tax', 'carbon tax（炭素税）'],
      ['emissions trading', 'emissions trading（排出量取引）'],
      ['carbon pricing', 'carbon pricing（炭素価格付け）'],
      ['urbanization', 'urbanization（都市化）'],
      ['urban metabolism', 'urban metabolism（都市代謝）'],
      ['transit-oriented development', 'transit-oriented development (TOD)（公共交通指向型開発）'],
      ['green infrastructure', 'green infrastructure（グリーンインフラ）'],
      ['photochemical smog', 'photochemical smog（光化学スモッグ）'],
      ['temperature inversion', 'temperature inversion（気温逆転）'],
      ['ground-level ozone', 'ground-level ozone（対流圏オゾン）'],
      ['environmental law', 'environmental law（環境法）'],
      ['transboundary pollution', 'transboundary pollution（越境汚染）'],
      ['hard law', 'hard law（ハードロー）'],
      ['soft law', 'soft law（ソフトロー）'],
      ['critical minerals', 'critical minerals（重要鉱物）'],
      ['critical mineral', 'critical mineral（重要鉱物）'],
      ['natural capital accounting', 'natural capital accounting（自然資本会計）'],
      ['genuine progress indicator', 'genuine progress indicator (GPI)（真正進歩指標）'],
      ['environmental justice', 'environmental justice（環境正義）'],
      ['intergenerational justice', 'intergenerational justice（世代間正義）'],
      ['ecocentric', 'ecocentric（生態系中心主義）'],
      ['anthropocentric', 'anthropocentric（人間中心主義）'],
      ['biocentric', 'biocentric（生命中心主義）'],
      ['utilitarian', 'utilitarian（功利主義的立場）'],
      ['rights-based', 'rights-based（権利に基づく立場）'],
      ['extended producer responsibility', 'extended producer responsibility (EPR)（拡大生産者責任）'],
      ['circular economy', 'circular economy（循環型経済）'],
      ['input', 'input（入力）'], ['output', 'output（出力）'], ['storage', 'storage（貯蔵）'],
      ['flow', 'flow（流れ）'], ['feedback', 'feedback（フィードバック）'], ['boundary', 'boundary（境界）'], ['system', 'system（システム）']
    ];

    const acronyms = [
      ['CITES', 'CITES（ワシントン条約）'], ['GDP', 'GDP（国内総生産）'], ['GHG', 'GHG（温室効果ガス）'],
      ['EIA', 'EIA（環境影響評価）'], ['ESS', 'ESS（環境システムと社会）'], ['HL', 'HL（上級レベル）'],
      ['GPP', 'GPP（総一次生産量）'], ['NPP', 'NPP（純一次生産量）'], ['MSY', 'MSY（最大持続可能漁獲量）'],
      ['MPA', 'MPA（海洋保護区）'], ['BOD', 'BOD（生物化学的酸素要求量）'], ['IPM', 'IPM（総合的病害虫管理）'],
      ['EVS', 'EVS（環境価値体系）'], ['TOD', 'TOD（公共交通指向型開発）'], ['EPR', 'EPR（拡大生産者責任）']
    ];

    const plainPhrases = [
      ['degraded river basin', '劣化した河川流域'], ['river basin', '河川流域'], ['management response', '管理策'],
      ['stakeholder values', '利害関係者の価値観'], ['stakeholder value', '利害関係者の価値観'], ['management preferences', '管理上の選好'], ['management preference', '管理上の選好'],
      ['hypothetical example', '仮想例'], ['management outcomes', '管理の結果'], ['management outcome', '管理の結果'], ['human pressure', '人間活動による圧力'],
      ['ecosystem function', '生態系機能'], ['vegetation restoration', '植生復元'], ['nutrient loss', '栄養塩の損失'], ['water quality', '水質'],
      ['downstream consequences', '下流への影響'], ['downstream consequence', '下流への影響'], ['human needs', '人間の需要'], ['time lag', '時間的遅れ'],
      ['unintended consequences', '意図しない結果'], ['unintended consequence', '意図しない結果'], ['conflict resolution', '対立解決'], ['decision legitimacy', '意思決定の正当性'],
      ['environmental objective', '環境上の目標'], ['social objective', '社会的な目標'], ['economic objective', '経済的な目標'], ['balanced argument', 'バランスの取れた議論'],
      ['credible monitoring', '信頼できるモニタリング'], ['stakeholder participation', '利害関係者の参加'], ['enforceable rules', '実効性のある規則'], ['enforceable rule', '実効性のある規則'],
      ['effective institutions', '実効的な制度'], ['effective institution', '実効的な制度'], ['to what extent', 'どの程度'], ['habitat protection', '生息地保護'],
      ['protected areas', '保護区'], ['protected area', '保護区'], ['reserve design', '保護区設計'], ['community-based conservation', '地域共同型保全'],
      ['local extinction risk', '局所絶滅リスク'], ['disease spread', '疾病拡大'], ['edge exposure', 'エッジへの曝露'], ['human-wildlife conflict', '人間と野生生物の軋轢'],
      ['necessary condition', '必要条件'], ['sufficient condition', '十分条件'], ['conservation strategy', '保全戦略'], ['aquatic ecosystem integrity', '水生生態系の健全性'],
      ['basin-scale governance', '流域規模のガバナンス'], ['pricing safeguard', '価格設定上の保護措置'], ['pollution enforcement', '汚染規制の執行'], ['adaptive allocation', '順応的な水配分'],
      ['rainfall variability', '降水の変動性'], ['future demand', '将来需要'], ['ecological threshold', '生態学的な閾値'], ['technology cost', '技術費用'],
      ['strategy combination', '対策の組み合わせ'], ['functioning decomposer community', '機能している分解者群集'], ['soil organic matter retention', '土壌有機物の保持'],
      ['disturbance regime', '撹乱体制'], ['reliable population data', '信頼できる個体群データ'], ['international cooperation', '国際協力'], ['local benefit', '地域の便益'],
      ['adaptive quota', '順応的な漁獲枠'], ['long-term funding', '長期的な資金'], ['action scale', '対策の規模'], ['international trade agreement', '国際貿易協定'],
      ['effective climate policy', '実効的な気候政策'], ['credible target', '信頼できる目標'], ['public legitimacy', '社会的正当性'], ['vulnerable group', '脆弱な集団'],
      ['climate sensitivity', '気候感度'], ['regional impact', '地域的影響'], ['adaptation capacity', '適応能力'], ['severe degradation', '深刻な劣化'],
      ['slow recovery', '遅い回復'], ['major soil loss', '大規模な土壌喪失'], ['farmer participation', '農家の参加'], ['secure land tenure', '安定した土地保有権'],
      ['knowledge access', '知識へのアクセス'], ['resource access', '資源へのアクセス'], ['supportive policy', '支援的な政策'], ['appropriate technology', '適切な技術'],
      ['social priority', '社会的な優先事項'], ['aquatic food supply', '水産食料供給'], ['reliable stock assessment', '信頼できる資源量評価'], ['pollution monitoring', '汚染モニタリング'],
      ['transparent data', '透明性のあるデータ'], ['ecological limit', '生態学的な限界'], ['human well-being', '人間の福祉'], ['clear resource right', '明確な資源利用権'],
      ['theoretical maximum use', '理論上の最大利用量'], ['improved resource management', '改善された資源管理'], ['resource depletion', '資源枯渇'],
      ['short-term economic output', '短期的な経済生産'], ['short-term', '短期的な'], ['long-term', '長期的な'], ['local livelihood', '地域住民の生計'],
      ['land-use opportunity cost', '土地利用の機会費用'], ['access right', '利用権'], ['local support', '地域の支持'], ['scale-dependent', '規模に依存する'], ['species-specific', '種ごとの'],
      ['reliable access', '安定した利用'], ['supply-side measure', '供給側の対策'], ['demand management', '需要管理'], ['managed aquifer recharge', '管理された帯水層涵養'],
      ['water table', '地下水位'], ['baseflow', '基底流'], ['leakage control', '漏水対策'], ['efficient irrigation', '効率的な灌漑'], ['affordability', '負担可能性'],
      ['pollution control', '汚染対策'], ['wastewater treatment', '排水処理'], ['riparian buffer', '河岸緩衝帯'], ['wetland restoration', '湿地の復元'],
      ['natural storage restoration', '自然の貯留機能の回復'], ['integrated portfolio', '統合的な対策の組み合わせ'], ['equity safeguard', '公平性への保護措置'],
      ['energy flow', 'エネルギーの流れ'], ['ecosystem structure', '生態系構造'], ['plant respiration', '植物の呼吸'], ['uneaten material', '食べられない物質'], ['limiting nutrient', '制限栄養塩'],
      ['primary productivity', '一次生産性'], ['human input', '人為的な投入'], ['species biology', '種の生物学的特性'], ['governance capacity', 'ガバナンス能力'],
      ['science-based harvest limit', '科学的根拠に基づく採取制限'], ['seasonal closure', '季節的な禁漁'], ['rights-based management', '権利に基づく管理'], ['community management', '地域共同管理'],
      ['early detection', '早期発見'], ['customs enforcement', '税関での取締り'], ['anti-poaching', '密猟対策'], ['demand reduction', '需要削減'], ['immediate extinction', '目前の絶滅'],
      ['historical emission', '歴史的な排出'], ['adaptation finance', '適応資金'], ['justice issue', '公平性の問題'], ['future impact', '将来の影響'],
      ['degradation process', '劣化の過程'], ['ground cover', '地表被覆'], ['contour farming', '等高線農法'], ['water balance', '水収支'], ['salt accumulation', '塩類蓄積'],
      ['water-holding capacity', '保水能力'], ['aggregate stability', '団粒構造の安定性'], ['nutrient retention', '栄養塩保持'], ['drought resilience', '干ばつへのレジリエンス'],
      ['site-specific', '地域条件に応じた'], ['crop rotation', '輪作'], ['cover crop', '被覆作物'], ['yield stability', '収量の安定性'], ['crop choice', '作物選択'],
      ['high-input monoculture', '高投入型単一栽培'], ['external capital', '外部資本'], ['transition time', '移行期間'], ['political stability', '政治的安定'], ['farmer livelihood', '農家の生計'],
      ['food access', '食料へのアクセス'], ['stock assessment', '資源量評価'], ['effort control', '漁獲努力量の制限'], ['spawning ground', '産卵場'], ['selective gear', '選択的漁具'],
      ['effort displacement', '漁獲努力の移転'], ['wild catch', '天然漁獲量'], ['nutrient release', '栄養塩の排出'], ['fishmeal use', '魚粉利用'], ['coastal habitat conversion', '沿岸生息地の転換'],
      ['recirculating system', '循環式養殖システム'], ['feed conversion', '飼料効率'], ['integrated multi-trophic aquaculture', '統合多栄養段階養殖'], ['oxygen depletion', '酸素欠乏'],
      ['pollution standard', '汚染基準'], ['lower-impact aquaculture', '環境負荷の低い養殖'], ['short-term output', '短期的な生産量']
    ];

    const plainWords = [
      ['management', '管理'], ['response', '対策'], ['stakeholder', '利害関係者'], ['preference', '選好'], ['recreation', 'レクリエーション'],
      ['example', '例'], ['outcome', '結果'], ['pressure', '圧力'], ['stores', '貯蔵'], ['store', '貯蔵'], ['function', '機能'], ['quality', '質'],
      ['downstream', '下流'], ['upstream', '上流'], ['needs', '需要'], ['delays', '遅れ'], ['delay', '遅れ'], ['data', 'データ'], ['simplification', '単純化'],
      ['participation', '参加'], ['conflict', '対立'], ['legitimacy', '正当性'], ['environmental', '環境上の'], ['social', '社会的な'], ['economic', '経済的な'],
      ['objective', '目標'], ['balanced', 'バランスの取れた'], ['argument', '議論'], ['credible', '信頼できる'], ['effective', '実効的な'], ['institution', '制度'],
      ['implementation', '実施'], ['judgement', '判断'], ['habitat', '生息地'], ['patch', '区画'], ['conservation', '保全'], ['ecological', '生態学的な'], ['understanding', '理解'],
      ['fragmented', '分断された'], ['reserve', '保護区'], ['design', '設計'], ['harvest', '採取'], ['regulation', '規制'], ['restoration', '復元'], ['captive', '飼育下の'],
      ['breeding', '繁殖'], ['community', '地域社会'], ['local', '地域の'], ['extinction', '絶滅'], ['risk', 'リスク'], ['disease', '疾病'], ['exposure', '曝露'],
      ['livelihood', '生計'], ['opportunity', '機会'], ['access', 'アクセス'], ['strategy', '戦略'], ['supply', '供給'], ['reservoir', '貯水池'], ['desalination', '海水淡水化'],
      ['cost', '費用'], ['metering', '使用量計測'], ['pricing', '価格設定'], ['pollution', '汚染'], ['monitoring', 'モニタリング'], ['equity', '公平性'], ['sustainable', '持続可能な'],
      ['energy', 'エネルギー'], ['structure', '構造'], ['respiration', '呼吸'], ['waste', '廃棄物'], ['carbon', '炭素'], ['nitrogen', '窒素'], ['phosphorus', 'リン'],
      ['matter', '物質'], ['organism', '生物'], ['soil', '土壌'], ['water', '水'], ['atmosphere', '大気'], ['decomposition', '分解'], ['producer', '生産者'], ['productivity', '生産性'],
      ['recovery', '回復'], ['fertilizer', '肥料'], ['temperature', '温度'], ['light', '光'], ['disturbance', '撹乱'], ['threshold', '閾値'], ['diversity', '多様性'],
      ['scale', '規模'], ['tool', '手段'], ['limit', '制限'], ['closure', '閉鎖'], ['enforcement', '法執行'], ['compliance', '遵守'], ['prevention', '予防'], ['eradication', '根絶'],
      ['traceability', '追跡可能性'], ['trade', '取引'], ['corruption', '汚職'], ['poverty', '貧困'], ['wild', '野生下'], ['threat', '脅威'], ['biology', '生物学的特性'],
      ['rapid', '迅速な'], ['cumulative', '累積的な'], ['remaining', '残された'], ['warming', '温暖化'], ['renewable', '再生可能な'], ['electricity', '電力'], ['efficiency', '効率'],
      ['electrification', '電化'], ['methane', 'メタン'], ['infrastructure', 'インフラ'], ['politics', '政治'], ['distribution', '分配'], ['current', '現在の'], ['inertia', '慣性'],
      ['heat', '高温'], ['flood', '洪水'], ['finance', '資金'], ['group', '集団'], ['process', '過程'], ['runoff', '表面流出'], ['infiltration', '浸透'], ['retention', '保持'],
      ['drainage', '排水'], ['leaching', '洗脱'], ['compost', '堆肥'], ['residue', '作物残さ'], ['terracing', '段々畑化'], ['amendment', '改良資材'], ['farmer', '農家'], ['incentive', '誘因'],
      ['production', '生産'], ['crop', '作物'], ['yield', '収量'], ['irrigation', '灌漑'], ['river', '河川'], ['aquifer', '帯水層'], ['pesticide', '農薬'], ['labour', '労働力'], ['knowledge', '知識'],
      ['political', '政治的な'], ['capture', '漁獲'], ['fishery', '漁業'], ['quota', '漁獲枠'], ['population', '個体群'], ['condition', '条件'], ['adaptive', '順応的な'], ['spawning', '産卵'],
      ['gear', '漁具'], ['capital', '資本'], ['transparent', '透明性のある'], ['output', '生産量'], ['resource', '資源'], ['depletion', '枯渇'], ['well-being', '福祉'], ['improved', '改善された']
    ];

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const protectFormattedTerms = text => {
      const protectedTerms = [];
      const protectedText = text.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,8}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSFINAL${protectedTerms.length}@@`;
        protectedTerms.push(match);
        return token;
      });
      return { protectedText, protectedTerms };
    };

    const strictClean = value => {
      if (typeof value !== 'string' || !value.trim()) return value;
      let text = Paper2.cleanEssSectionBJapanese(value);
      const protectedBundle = protectFormattedTerms(text);
      text = protectedBundle.protectedText;

      [...keyTerms].sort((a, b) => b[0].length - a[0].length).forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      [...acronyms].sort((a, b) => b[0].length - a[0].length).forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      [...plainPhrases].sort((a, b) => b[0].length - a[0].length).forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      [...plainWords].sort((a, b) => b[0].length - a[0].length).forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });

      protectedBundle.protectedTerms.forEach((term, index) => { text = text.split(`@@ESSFINAL${index}@@`).join(term); });
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
        markschemeJa: Array.isArray(hydrated.markschemeJa) ? hydrated.markschemeJa.map(strictClean) : hydrated.markschemeJa,
        modelAnswerJa: strictClean(hydrated.modelAnswerJa),
        parts: Array.isArray(hydrated.parts) ? hydrated.parts.map(part => ({
          ...part,
          markschemeJa: Array.isArray(part?.markschemeJa) ? part.markschemeJa.map(strictClean) : part?.markschemeJa,
          modelAnswerJa: strictClean(part?.modelAnswerJa)
        })) : hydrated.parts,
        _essSectionBJapaneseFinalPass: true
      };
    };

    const originalBands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
    Paper2.getEssHlMarkbandDescriptors = function() {
      return originalBands().map(band => ({ ...band, textJa: strictClean(band.textJa) }));
    };

    Paper2.strictCleanEssSectionBJapanese = strictClean;
  };

  install();
})();