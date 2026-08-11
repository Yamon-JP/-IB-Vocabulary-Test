// ESS HL Paper 2 Japanese localization layer.
// Keeps English assessment content unchanged and improves only Japanese support text.
(() => {
  const VERSION = 1;
  const MAX_ATTEMPTS = 200;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || typeof Paper2.setQuestions !== 'function'
      || typeof Paper2.renderMarkPoint !== 'function'
      || typeof Paper2.applyEssSet8Structure !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) {
        window.setTimeout(() => install(attempt + 1), 50);
      } else {
        console.warn('ESS Japanese localization could not find the Paper 2 structured module.');
      }
      return;
    }

    if (Paper2.essJapaneseLocalizationInstalled) return;
    Paper2.essJapaneseLocalizationInstalled = true;

    const technicalTerms = [
      ['environmental value systems', '環境価値体系（environmental value systems）'],
      ['environmental value system', '環境価値体系（environmental value system）'],
      ['intergenerational justice', '世代間正義（intergenerational justice）'],
      ['environmental justice', '環境正義（environmental justice）'],
      ['ecosystem-based management', '生態系に基づく管理（ecosystem-based management）'],
      ['maximum sustainable yield', '最大持続可能漁獲量（MSY）'],
      ['transit-oriented development', '公共交通指向型開発（TOD）'],
      ['extended producer responsibility', '拡大生産者責任（EPR）'],
      ['enhanced greenhouse effect', '強化された温室効果（enhanced greenhouse effect）'],
      ['ecological footprint', 'エコロジカル・フットプリント（ecological footprint）'],
      ['ecological efficiency', '生態学的効率（ecological efficiency）'],
      ['ecological overshoot', '生態学的オーバーシュート（ecological overshoot）'],
      ['ecological deficit', '生態学的赤字（ecological deficit）'],
      ['carrying capacity', '環境収容力（carrying capacity）'],
      ['density-dependent factors', '密度依存要因（density-dependent factors）'],
      ['density-dependent factor', '密度依存要因（density-dependent factor）'],
      ['reinforcing feedback', '正のフィードバック（reinforcing feedback）'],
      ['negative feedback', '負のフィードバック（negative feedback）'],
      ['positive feedback', '正のフィードバック（positive feedback）'],
      ['state variable', '状態変数（state variable）'],
      ['trophic level', '栄養段階（trophic level）'],
      ['biogeochemical cycles', '生物地球化学的循環（biogeochemical cycles）'],
      ['biogeochemical cycle', '生物地球化学的循環（biogeochemical cycle）'],
      ['nutrient cycling', '栄養塩循環（nutrient cycling）'],
      ['natural capital', '自然資本（natural capital）'],
      ['natural income', '自然所得（natural income）'],
      ['ecosystem services', '生態系サービス（ecosystem services）'],
      ['ecosystem service', '生態系サービス（ecosystem service）'],
      ['sustainable yield', '持続可能な収穫量（sustainable yield）'],
      ['environmental flow', '環境流量（environmental flow）'],
      ['water security', '水の安全保障（water security）'],
      ['soil organic matter', '土壌有機物（soil organic matter）'],
      ['integrated pest management', '総合的病害虫管理（IPM）'],
      ['food security', '食料安全保障（food security）'],
      ['climate resilience', '気候レジリエンス（climate resilience）'],
      ['carbon budget', 'カーボンバジェット（carbon budget）'],
      ['carbon pricing', '炭素価格付け（carbon pricing）'],
      ['carbon price', '炭素価格（carbon price）'],
      ['carbon tax', '炭素税（carbon tax）'],
      ['cap-and-trade', '排出量取引制度（cap-and-trade）'],
      ['emissions trading', '排出量取引（emissions trading）'],
      ['negative externality', '負の外部性（negative externality）'],
      ['positive externality', '正の外部性（positive externality）'],
      ['Pigouvian tax', 'ピグー税（Pigouvian tax）'],
      ['Pigouvian charge', 'ピグー型課徴金（Pigouvian charge）'],
      ['social cost', '社会的費用（social cost）'],
      ['life-cycle impacts', 'ライフサイクル全体の影響（life-cycle impacts）'],
      ['life-cycle impact', 'ライフサイクル全体の影響（life-cycle impact）'],
      ['circular economy', '循環型経済（circular economy）'],
      ['resource security', '資源安全保障（resource security）'],
      ['resource scarcity', '資源希少性（resource scarcity）'],
      ['resource depletion', '資源枯渇（resource depletion）'],
      ['environmental economics', '環境経済学（environmental economics）'],
      ['environmental ethics', '環境倫理（environmental ethics）'],
      ['environmental law', '環境法（environmental law）'],
      ['precautionary principle', '予防原則（precautionary principle）'],
      ['polluter pays', '汚染者負担原則（polluter pays）'],
      ['transboundary pollution', '越境汚染（transboundary pollution）'],
      ['hard law', 'ハードロー（hard law）'],
      ['soft law', 'ソフトロー（soft law）'],
      ['urban metabolism', '都市代謝（urban metabolism）'],
      ['green infrastructure', 'グリーンインフラ（green infrastructure）'],
      ['photochemical smog', '光化学スモッグ（photochemical smog）'],
      ['temperature inversion', '気温逆転（temperature inversion）'],
      ['ground-level ozone', '対流圏オゾン（ground-level ozone）'],
      ['stratospheric ozone', '成層圏オゾン（stratospheric ozone）'],
      ['ozone depletion', 'オゾン層破壊（ozone depletion）'],
      ['biochemical oxygen demand', '生物化学的酸素要求量（BOD）'],
      ['dissolved oxygen', '溶存酸素（DO）'],
      ['eutrophication', '富栄養化（eutrophication）'],
      ['salinization', '塩類集積（salinization）'],
      ['agroforestry', 'アグロフォレストリー（agroforestry）'],
      ['aquaculture', '養殖（aquaculture）'],
      ['overfishing', '乱獲（overfishing）'],
      ['bycatch', '混獲（bycatch）'],
      ['marine protected area', '海洋保護区（MPA）'],
      ['stock assessment', '資源量評価（stock assessment）'],
      ['fishing effort', '漁獲努力量（fishing effort）'],
      ['habitat fragmentation', '生息地の分断（habitat fragmentation）'],
      ['ecological connectivity', '生態学的連結性（ecological connectivity）'],
      ['restoration ecology', '復元生態学（restoration ecology）'],
      ['adaptive management', '順応的管理（adaptive management）'],
      ['managed retreat', '計画的撤退（managed retreat）'],
      ['nature-based solutions', '自然を活用した解決策（nature-based solutions）'],
      ['nature-based solution', '自然を活用した解決策（nature-based solution）'],
      ['climate-change mitigation', '気候変動の緩和（mitigation）'],
      ['climate-change adaptation', '気候変動への適応（adaptation）'],
      ['mitigation', '緩和（mitigation）'],
      ['adaptation', '適応（adaptation）'],
      ['resilience', 'レジリエンス（resilience）'],
      ['vulnerability', '脆弱性（vulnerability）'],
      ['biocapacity', '生物生産力（biocapacity）'],
      ['ecocentric', '生態系中心主義（ecocentric）'],
      ['anthropocentric', '人間中心主義（anthropocentric）'],
      ['biocentric', '生命中心主義（biocentric）'],
      ['utilitarian', '功利主義的立場（utilitarian）'],
      ['deontological', '義務論的立場（deontological）'],
      ['rights-based', '権利に基づく立場（rights-based）'],
      ['intrinsic value', '内在的価値（intrinsic value）'],
      ['instrumental value', '道具的価値（instrumental value）'],
      ['stakeholder', '利害関係者（stakeholder）'],
      ['system', 'システム（system）'],
      ['feedback', 'フィードバック（feedback）'],
      ['biomass', 'バイオマス（biomass）']
    ];

    const plainTerms = [
      ['greenhouse-gas emissions', '温室効果ガス排出量'], ['greenhouse gas emissions', '温室効果ガス排出量'],
      ['GHG emissions', '温室効果ガス排出量'], ['GHG emission', '温室効果ガス排出'], ['GHG source', '温室効果ガスの発生源'],
      ['climate change', '気候変動'], ['climate impacts', '気候変動の影響'], ['climate impact', '気候変動の影響'], ['climate risk', '気候リスク'],
      ['cumulative warming', '累積的な温暖化'], ['warming', '温暖化'], ['radiative forcing', '放射強制力'],
      ['sea-level rise', '海面上昇'], ['storm surge', '高潮'], ['extreme rainfall', '極端な降雨'], ['extreme heat', '極端な高温'],
      ['hazard', 'ハザード'], ['exposure', '曝露'], ['adaptive capacity', '適応能力'], ['net zero', 'ネットゼロ'],
      ['emissions reduction', '排出削減量'], ['emission reduction', '排出削減'], ['emissions', '排出量'], ['emission', '排出'], ['abatement', '排出削減'],
      ['renewable energy', '再生可能エネルギー'], ['fossil fuel', '化石燃料'], ['nuclear energy', '原子力'],
      ['energy security', 'エネルギー安全保障'], ['energy transition', 'エネルギー転換'], ['energy efficiency', 'エネルギー効率'],
      ['energy demand', 'エネルギー需要'], ['energy', 'エネルギー'], ['grid storage', '系統用蓄電'], ['grid support', '電力網の支援'], ['grid', '電力網'],
      ['intermittency', '出力変動性'], ['capacity factor', '設備利用率'], ['electrification', '電化'], ['wind/solar', '風力・太陽光発電'],
      ['relative cost', '相対的な費用'], ['low cost', '低費用'], ['high cost', '高費用'], ['efficiency', '効率'],
      ['cost-benefit analysis', '費用便益分析'], ['costs and benefits', '費用と便益'], ['cost', '費用'], ['costs', '費用'],
      ['benefit', '利点'], ['benefits', '利点'], ['co-benefit', '副次的便益'], ['trade-off', 'トレードオフ'], ['trade-offs', 'トレードオフ'],
      ['distributional concern', '分配上の懸念'], ['distributional effect', '分配への影響'], ['policy design', '政策設計'], ['policy', '政策'],
      ['strategy', '戦略'], ['strategies', '戦略'], ['measure', '対策'], ['measures', '対策'], ['option', '選択肢'], ['options', '選択肢'],
      ['portfolio', '対策の組み合わせ'], ['technology', '技術'], ['technologies', '技術'], ['incentive', '誘因'], ['incentives', '誘因'],
      ['barrier', '障壁'], ['barriers', '障壁'], ['sector', '部門'], ['sectors', '部門'], ['monitoring', 'モニタリング'], ['enforcement', '執行'],
      ['compliance', '法令遵守'], ['governance', 'ガバナンス'], ['participation', '参加'], ['community', '地域社会'], ['future generation', '将来世代'],
      ['economic activity', '経済活動'], ['environmental impacts', '環境への影響'], ['environmental impact', '環境への影響'], ['impact', '影響'], ['impacts', '影響'],
      ['harm', '損害'], ['risk', 'リスク'], ['risks', 'リスク'], ['data', 'データ'], ['source', '発生源'], ['sources', '発生源'],
      ['input', '入力'], ['output', '出力'], ['boundary', '境界'], ['flow', '流れ'], ['flows', '流れ'],
      ['wetland restoration', '湿地の復元'], ['wetland', '湿地'], ['habitat restoration', '生息地の復元'], ['habitat protection', '生息地の保護'],
      ['habitat loss', '生息地の喪失'], ['habitat', '生息地'], ['biodiversity loss', '生物多様性の損失'], ['biodiversity', '生物多様性'],
      ['ecosystem integrity', '生態系の健全性'], ['ecosystem function', '生態系機能'], ['ecosystem', '生態系'],
      ['pollution control', '汚染対策'], ['water pollution', '水質汚染'], ['pollution', '汚染'], ['water quality', '水質'], ['water supply', '水供給'],
      ['water retention', '保水力'], ['water scarcity', '水不足'], ['runoff', '表面流出'], ['recharge', '涵養'], ['abstraction', '取水'], ['groundwater', '地下水'],
      ['flood', '洪水'], ['flooding', '洪水'], ['drought', '干ばつ'], ['drought-tolerant crop varieties', '耐乾性作物品種'], ['crop yield', '作物収量'],
      ['yield', '収量'], ['irrigation demand', '灌漑用水需要'], ['irrigation', '灌漑'], ['reservoir', '貯水池'], ['warning system', '警報システム'],
      ['soil fertility', '土壌肥沃度'], ['soil structure', '土壌構造'], ['soil conservation', '土壌保全'], ['topsoil', '表土'], ['erosion', '侵食'],
      ['ground cover', '地表被覆'], ['water-holding capacity', '保水能力'], ['microclimate', '微気候'], ['nutrient availability', '栄養塩の利用可能性'],
      ['nutrient retention', '栄養塩保持'], ['nutrient input', '栄養塩の流入'], ['nutrients', '栄養塩'], ['nutrient', '栄養塩'],
      ['cellular respiration', '細胞呼吸'], ['respiration', '呼吸'], ['heat', '熱'], ['primary consumer', '一次消費者'], ['secondary consumer', '二次消費者'],
      ['tertiary consumer', '三次消費者'], ['producer', '生産者'], ['decomposition', '分解'], ['organic matter', '有機物'],
      ['population growth', '個体群／人口の増加'], ['population size', '個体群サイズ／人口規模'], ['population momentum', '人口モメンタム'],
      ['total fertility rate', '合計特殊出生率'], ['replacement fertility', '人口置換水準の出生率'], ['dependency ratio', '従属人口指数'],
      ['demographic transition model', '人口転換モデル'], ['migration', '移住'], ['age structure', '年齢構成'],
      ['urbanization', '都市化'], ['urban planning', '都市計画'], ['compact city', 'コンパクトシティ'], ['public transport', '公共交通'],
      ['urban sprawl', '都市のスプロール化'], ['brownfield', '既開発地（brownfield）'], ['gentrification', 'ジェントリフィケーション'], ['displacement', '立ち退き・移転'],
      ['particulate matter', '粒子状物質'], ['nitrogen oxides', '窒素酸化物'], ['volatile organic compounds', '揮発性有機化合物'],
      ['air quality index', '大気質指数'], ['catalytic converter', '触媒コンバーター'], ['scrubber', 'スクラバー'],
      ['chlorine radical', '塩素ラジカル'], ['photolysis', '光分解'], ['phase-out', '段階的廃止'], ['long-lived', '寿命が長い'],
      ['gradual recovery', '段階的な回復'], ['ozone recovery', 'オゾン層の回復'], ['spring ozone', '春季のオゾン量'],
      ['critical minerals', '重要鉱物'], ['critical mineral', '重要鉱物'], ['mining', '採掘'], ['tailings', '鉱山廃さい'], ['acid drainage', '酸性鉱山排水'],
      ['recycling', 'リサイクル'], ['reuse', '再利用'], ['substitution', '代替'], ['rehabilitation', '環境修復'], ['supply chain', 'サプライチェーン'],
      ['Green GDP', 'グリーンGDP'], ['genuine progress indicator', '真正進歩指標（GPI）'], ['natural capital accounting', '自然資本会計'],
      ['economic valuation', '経済評価'], ['monetary valuation', '貨幣評価'], ['public good', '公共財'], ['unpriced external cost', '価格に反映されていない外部費用'],
      ['external cost', '外部費用'], ['internalize', '内部化'], ['operator', '事業者'], ['damage valuation', '損害の貨幣評価'],
      ['take-back', '回収'], ['reporting', '報告'], ['repair target', '修理目標'], ['repairable', '修理しやすい'], ['durable', '耐久性の高い'],
      ['recyclable', 'リサイクル可能な'], ['design', '設計'], ['formal collection', '正規回収率'], ['informal processing', '非正規処理'],
      ['illegal disposal', '不法投棄'], ['toxic waste', '有害廃棄物'], ['waste externality', '廃棄物による外部性'], ['waste', '廃棄物'],
      ['city-wide benefit', '都市全体の便益'], ['local harm', '地域への損害'], ['local burden', '地域への負担'], ['burden', '負担'],
      ['stewardship', '環境に対する管理責任'], ['ethical perspective', '倫理的観点'], ['ethical framework', '倫理的枠組み'], ['ethical', '倫理的'],
      ['rights', '権利'], ['justice', '正義'], ['implementation cost', '導入費用'], ['labour', '労働力'], ['market effect', '市場への影響'],
      ['production', '生産'], ['resource', '資源'], ['resources', '資源'], ['regeneration', '再生'], ['annual outflow', '年間流出量'],
      ['natural increment', '自然増加量'], ['net stock change', '純資源量変化'], ['annual removal', '年間除去量'], ['harvest', '収穫・採取量'],
      ['long-term', '長期的な'], ['short-term', '短期的な'], ['high-input', '高投入型の'], ['low-input', '低投入型の'], ['monoculture', '単一栽培'],
      ['polyculture', '複数作物栽培'], ['crop rotation', '輪作'], ['cover crop', '被覆作物'], ['reduced tillage', '減耕起'], ['organic amendments', '有機質資材'],
      ['precision agriculture', '精密農業'], ['fertilizer', '肥料'], ['pesticide', '農薬'], ['farmer', '農家'], ['livelihood', '生計'], ['affordability', '負担可能性'],
      ['equity', '公平性'], ['inequality', '不平等'], ['threshold', '閾値'], ['uncertainty', '不確実性'], ['context dependent', '状況に依存する'],
      ['limitation', '限界'], ['limitations', '限界'], ['mechanism', '仕組み'], ['pattern', '傾向'], ['index', '指数'], ['baseline', '基準値'],
      ['stable', '安定した'], ['diversified', '多様化された'], ['multiple', '複数の'], ['bill', '料金']
    ];

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replaceTerm = (text, source, replacement) => {
      const escaped = escapeRegExp(source);
      const pattern = new RegExp(`(^|[^A-Za-z])${escaped}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const sortedTechnical = [...technicalTerms].sort((a, b) => b[0].length - a[0].length);
    const sortedPlain = [...plainTerms].sort((a, b) => b[0].length - a[0].length);

    const localizeText = text => {
      if (typeof text !== 'string' || !text.trim()) return text;
      let result = text;
      const placeholders = [];

      sortedTechnical.forEach(([source, translation], index) => {
        const token = `@@ESSJP${index}@@`;
        const next = replaceTerm(result, source, token);
        if (next !== result) placeholders[index] = translation;
        result = next;
      });

      sortedPlain.forEach(([source, translation]) => {
        result = replaceTerm(result, source, translation);
      });

      placeholders.forEach((translation, index) => {
        if (translation) result = result.split(`@@ESSJP${index}@@`).join(translation);
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
      const html = originalRenderMarkPoint(point, index, japaneseText);
      if (!japaneseText) return html;
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
  };

  install();
})();