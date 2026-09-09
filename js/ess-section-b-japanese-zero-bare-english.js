// ESS HL Paper 2 Section B: final bare-English cleanup for Japanese support text.
(() => {
  const MAX_ATTEMPTS = 360;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essSectionBJapaneseRenderGuardInstalled
      || typeof Paper2.renderCleanEssSectionBJapanese !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B zero-bare-English layer could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBZeroBareEnglishInstalled) return;
    Paper2.essSectionBZeroBareEnglishInstalled = true;

    const phraseMap = [
      ['higher trophic level', 'より高いtrophic level（栄養段階）'],
      ['higher trophic levels', 'より高いtrophic level（栄養段階）'],
      ['riparian vegetation', '河岸植生'], ['mangrove restoration', 'マングローブの復元'],
      ['co-benefit', '副次的便益'], ['co-benefits', '副次的便益'], ['vulnerable community', '脆弱な地域社会'], ['vulnerable communities', '脆弱な地域社会'],
      ['relative abundance', '相対的な個体数'], ['continuous habitat', '連続した生息地'], ['isolated habitat', '孤立した生息地'],
      ['protected habitat', '保護された生息地'], ['protected habitats', '保護された生息地'], ['habitat patch', '生息地区画'], ['habitat patches', '生息地区画'],
      ['population movement', '個体群の移動'], ['species movement', '種の移動'], ['local extinction', '局所絶滅'], ['extinction risk', '絶滅リスク'],
      ['water body', '水域'], ['water bodies', '水域'], ['river flow', '河川流量'], ['ground water', '地下水'], ['groundwater', '地下水'],
      ['wastewater reuse', '排水の再利用'], ['managed aquifer recharge', '管理された帯水層涵養'], ['natural storage', '自然の貯留機能'],
      ['carbon removal', '炭素除去'], ['carbon removals', '炭素除去'], ['emission lock-in', '排出の固定化'],
      ['ecological threshold', '生態学的な閾値'], ['ecological thresholds', '生態学的な閾値'], ['climate condition', '気候条件'], ['climate conditions', '気候条件'],
      ['operational emission', '運用時の排出'], ['operational emissions', '運用時の排出'], ['material demand', '資材需要'], ['material use', '資材利用'],
      ['just transition', '公正な移行'], ['low-income household', '低所得世帯'], ['low-income households', '低所得世帯'],
      ['natural asset', '自然資産'], ['natural assets', '自然資産'], ['non-market ecosystem service', '非市場型のecosystem services（生態系サービス）'],
      ['non-market ecosystem services', '非市場型のecosystem services（生態系サービス）'], ['external cost', '外部費用'], ['external costs', '外部費用'],
      ['adjusted indicator', '調整済み指標'], ['adjusted indicators', '調整済み指標'], ['environmental wealth', '環境資産'],
      ['ethical framework', '倫理的枠組み'], ['ethical frameworks', '倫理的枠組み'], ['moral importance', '道徳的価値'],
      ['procedural justice', '手続き的正義'], ['meaningful participation', '実質的な参加'], ['fair distribution', '公平な分配'],
      ['point source', '点源'], ['point sources', '点源'], ['non-point source', '非点源'], ['non-point sources', '非点源'], ['diffuse source', '分散した発生源'],
      ['stock estimate', '資源量推定'], ['stock estimates', '資源量推定'], ['fish stock', '魚類資源'], ['fish stocks', '魚類資源'], ['fishing effort', 'fishing effort（漁獲努力量）'],
      ['cleanup cost', '浄化費用'], ['cleanup costs', '浄化費用'], ['public accountability', '公的な説明責任'],
      ['critical mineral demand', '重要鉱物への需要'], ['supply constraint', '供給制約'], ['supply constraints', '供給制約'], ['strategic importance', '戦略的重要性'],
      ['virgin material', '新規採掘資源'], ['virgin materials', '新規採掘資源'], ['virgin demand', '新規資源への需要'],
      ['tailings management', '鉱山廃さいの管理'], ['processing waste', '処理廃棄物'], ['processing wastes', '処理廃棄物'],
      ['environmental asset', '環境資産'], ['environmental assets', '環境資産'], ['final goods', '最終財'], ['monetary value', '貨幣価値'],
      ['future people', '将来世代'], ['total benefit', '社会全体の便益'], ['inclusive participation', '包括的な参加'],
      ['resource right', '資源利用権'], ['resource rights', '資源利用権'], ['rebound effect', 'リバウンド効果'], ['rebound effects', 'リバウンド効果'],
      ['impact shifting', '環境負荷の移転'], ['short-term cost', '短期的な費用'], ['short-term costs', '短期的な費用'],
      ['firm low-carbon source', '安定供給可能な低炭素エネルギー源'], ['firm low-carbon sources', '安定供給可能な低炭素エネルギー源'],
      ['variable low-carbon source', '変動型の低炭素エネルギー源'], ['variable low-carbon sources', '変動型の低炭素エネルギー源'],
      ['quantity certainty', '排出量の確実性'], ['price certainty', '価格の確実性'], ['free permit', '無償排出枠'], ['free permits', '無償排出枠'],
      ['regressive cost', '低所得層ほど負担が重くなる費用'], ['regressive costs', '低所得層ほど負担が重くなる費用'], ['carbon leakage', '炭素リーケージ'], ['leakage', 'リーケージ'],
      ['population momentum', 'population momentum（人口モメンタム）'], ['per capita', '1人当たり'], ['per-capita', '1人当たり'],
      ['high-income population', '高所得人口'], ['high-income populations', '高所得人口'], ['age structure', 'age structure（年齢構成）'],
      ['compact urban form', 'コンパクトな都市形態'], ['active travel', '徒歩・自転車利用'], ['vehicle activity', '自動車利用量'],
      ['tailpipe pollution', '排気汚染'], ['stationary source', '固定発生源'], ['stationary sources', '固定発生源'],
      ['environmental burden', '環境負担'], ['environmental burdens', '環境負担'], ['city-wide benefit', '都市全体の便益'], ['local burden', '地域への負担'],
      ['brownfield alternative', '既開発地を利用する代替案'], ['producer duty', '生産者の義務'], ['producer duties', '生産者の義務'], ['end-of-life cost', '廃棄段階の費用'],
      ['end-of-life costs', '廃棄段階の費用'], ['waste externality', '廃棄物による外部性'], ['informal processing', '非正規処理'], ['illegal disposal', '不法投棄'],
      ['toxic waste', '有害廃棄物'], ['toxic wastes', '有害廃棄物'], ['future generation', '将来世代'], ['future generations', '将来世代'],
      ['balanced analysis', 'バランスの取れた分析'], ['critical reflection', '批判的検討'], ['best-fit markband', '最も適合する評価帯'],
      ['best-fit', '最も適合する'], ['mark band', '評価帯'], ['markband', '評価帯'], ['markbands', '評価帯'], ['descriptor', '評価基準の説明'], ['descriptors', '評価基準の説明']
    ].sort((a, b) => b[0].length - a[0].length);

    const wordMap = new Map(Object.entries({
      store:'貯蔵', stores:'貯蔵', habitat:'生息地', habitats:'生息地', patch:'生息地区画', patches:'生息地区画', movement:'移動', movements:'移動', recolonization:'再定着',
      foundation:'基盤', foundations:'基盤', corridor:'生態学的回廊', corridors:'生態学的回廊', recreation:'レクリエーション', livelihood:'生計', livelihoods:'生計',
      sediment:'土砂', sediments:'土砂', nutrient:'栄養塩', nutrients:'栄養塩', ecosystem:'生態系', ecosystems:'生態系', ecological:'生態学的な', aquatic:'水生の',
      usable:'利用可能な', reservoir:'貯水池', reservoirs:'貯水池', desalination:'海水淡水化', dam:'ダム', dams:'ダム', groundwater:'地下水', baseflow:'基底流',
      metering:'使用量計測', affordability:'負担可能性', portfolio:'対策の組み合わせ', portfolios:'対策の組み合わせ', storage:'貯蔵', flow:'流れ', flows:'流れ',
      input:'入力', inputs:'入力', output:'出力', outputs:'出力', boundary:'境界', boundaries:'境界', feedback:'フィードバック', feedbacks:'フィードバック',
      interaction:'相互作用', interactions:'相互作用', legitimacy:'正当性', priority:'優先事項', priorities:'優先事項', power:'力関係', imbalance:'不均衡',
      abstaction:'取水', abstraction:'取水', restoration:'復元', regulation:'規制', response:'対応', responses:'対応', preference:'選好', preferences:'選好',
      hypothetical:'仮想の', causal:'因果的な', chain:'連鎖', chains:'連鎖', spatial:'空間的な', connectivity:'連結性', indirect:'間接的な', delay:'遅れ', delays:'遅れ',
      unintended:'意図しない', consequence:'結果', consequences:'結果', resolution:'解決', institution:'制度', institutions:'制度', resource:'資源', resources:'資源',
      fragmentation:'分断', isolated:'孤立した', abundance:'個体数', evenness:'均等度', viable:'存続可能な', reserve:'保護区', invasive:'侵略的な', captive:'飼育下の', breeding:'繁殖',
      disease:'疾病', hunting:'狩猟', representation:'代表性', enforcement:'法執行', functioning:'機能する', necessary:'必要な', sufficient:'十分な', specific:'特有の',
      reliable:'信頼できる', safe:'安全な', environmental:'環境の', supply:'供給', demand:'需要', treatment:'処理', carefully:'慎重に', chosen:'選択された', variability:'変動性',
      productivity:'生産性', respiration:'呼吸', uneaten:'食べられない', mineralization:'無機化', limiting:'制限となる', decomposer:'分解者', decomposers:'分解者', fertilizer:'肥料',
      overexploitation:'過剰利用', illegal:'違法な', wildlife:'野生生物', trade:'取引', harvest:'採取', customs:'税関', poaching:'密猟', international:'国際的な', cooperation:'協力',
      cumulative:'累積的な', rapid:'迅速な', warming:'温暖化', current:'現在の', flood:'洪水', protection:'保護', carbon:'炭素', maladaptation:'不適応',
      soluble:'可溶性の', salt:'塩類', salts:'塩類', porosity:'空隙率', productive:'生産性の高い', resilient:'回復力の高い', contour:'等高線の', farming:'農法',
      drainage:'排水', compost:'堆肥', residue:'作物残さ', residues:'作物残さ', rotation:'輪作', rotations:'輪作', retention:'保持', drought:'干ばつ',
      nutritious:'栄養のある', physical:'物理的な', economic:'経済的な', reliable:'安定した', intensity:'投入強度', pesticide:'農薬', dependence:'依存', context:'状況',
      fishery:'漁業', fisheries:'漁業', wild:'天然の', excessive:'過剰な', effort:'漁獲努力', disease:'疾病', escapee:'逃亡個体', escapees:'逃亡個体', feed:'飼料',
      quota:'漁獲枠', quotas:'漁獲枠', seasonal:'季節的な', closure:'禁漁', closures:'禁漁', selective:'選択的な', gear:'漁具', waste:'廃棄物', recirculating:'循環式の',
      renewable:'再生可能な', nonrenewable:'非再生可能な', replenishable:'補充可能な', finite:'有限の', stock:'資源量', stocks:'資源量', regeneration:'再生', substitution:'代替',
      rebound:'リバウンド', shifting:'移転', operational:'運用時の', material:'資材', materials:'資材', land:'土地', firm:'安定供給可能な', variable:'変動型の',
      hydropower:'水力発電', nuclear:'原子力', subsidy:'補助金', subsidies:'補助金', tax:'税', taxes:'税', cap:'上限', caps:'上限', permit:'排出枠', permits:'排出枠',
      pricing:'価格付け', leakage:'リーケージ', deployment:'導入', consumption:'消費', investment:'投資', demographic:'人口動態の', youthful:'若年人口の多い', ageing:'高齢化した',
      migration:'移住', compact:'コンパクトな', urbanization:'都市化', metabolism:'都市代謝', transit:'公共交通', accessible:'利用しやすい', shock:'ショック', shocks:'ショック',
      density:'人口密度', congestion:'渋滞', gentrification:'ジェントリフィケーション', displacement:'立ち退き・移転', pollutant:'汚染物質', pollutants:'汚染物質', primary:'一次の', secondary:'二次の',
      atmosphere:'大気', sunlight:'日光', vertical:'鉛直の', mixing:'混合', surface:'地表', transport:'交通', vehicle:'自動車', stationary:'固定の', sensitive:'影響を受けやすい',
      freshwater:'淡水の', genetic:'遺伝的な', hydrological:'水文の', identifiable:'特定可能な', discharge:'排出', diffuse:'分散した', catchment:'流域', hydrology:'水文学的条件',
      spawning:'産卵', recruitment:'加入量', quota:'漁獲枠', jurisdiction:'管轄', jurisdictions:'管轄', national:'国内の', state:'国家', states:'国家', obligation:'義務', obligations:'義務',
      liability:'法的責任', transparent:'透明性のある', accountability:'説明責任', strategic:'戦略的な', mining:'採掘', tailings:'鉱山廃さい', acid:'酸性の', processing:'処理', virgin:'新規採掘の',
      GDP:'GDP（国内総生産）', monetary:'貨幣の', valuation:'評価', externality:'外部性', externalities:'外部性', utilitarian:'功利主義的な', rights:'権利', ethical:'倫理的な', moral:'道徳的な',
      recognition:'当事者の認識', legitimacy:'正当性', justice:'正義', producer:'生産者', producers:'生産者', takeback:'回収', reporting:'報告', repair:'修理', recyclable:'リサイクル可能な', durable:'耐久性の高い'
    }));

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const protectGlossed = value => {
      const held = [];
      const text = value.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,10}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSZERO${held.length}@@`;
        held.push(match);
        return token;
      });
      return { text, held };
    };

    const zeroBareEnglish = value => {
      if (typeof value !== 'string' || !value.trim()) return value;
      let text = Paper2.renderCleanEssSectionBJapanese(value);
      const protectedState = protectGlossed(text);
      text = protectedState.text;
      phraseMap.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      text = text.replace(/\b[A-Za-z][A-Za-z-]*\b/g, token => wordMap.get(token) || wordMap.get(token.toLowerCase()) || token);
      protectedState.held.forEach((term, index) => { text = text.split(`@@ESSZERO${index}@@`).join(term); });
      return text.replace(/\s+([、。])/g, '$1');
    };

    const priorRenderMarkPoint = Paper2.renderMarkPoint.bind(Paper2);
    Paper2.renderMarkPoint = function(point, index, japaneseText = '') {
      const cleaned = this.isEssSectionB?.() ? zeroBareEnglish(japaneseText) : japaneseText;
      return priorRenderMarkPoint(point, index, cleaned);
    };

    if (typeof Paper2.renderStructuredIndicativeContent === 'function') {
      const priorIndicative = Paper2.renderStructuredIndicativeContent.bind(Paper2);
      Paper2.renderStructuredIndicativeContent = function(markscheme, markschemeJa, config) {
        return priorIndicative(markscheme, Array.isArray(markschemeJa) ? markschemeJa.map(zeroBareEnglish) : markschemeJa, config);
      };
    }

    if (typeof Paper2.renderStructuredModelAnswers === 'function') {
      const priorModels = Paper2.renderStructuredModelAnswers.bind(Paper2);
      Paper2.renderStructuredModelAnswers = function(...args) {
        if (this.isStructuredEssSectionB?.() && Array.isArray(this.current?.parts)) {
          this.current = {
            ...this.current,
            modelAnswerJa: zeroBareEnglish(this.current.modelAnswerJa),
            parts: this.current.parts.map(part => ({ ...part, modelAnswerJa: zeroBareEnglish(part?.modelAnswerJa) }))
          };
        }
        return priorModels(...args);
      };
    }

    if (typeof Paper2.renderStructuredMarkband === 'function') {
      const priorMarkband = Paper2.renderStructuredMarkband.bind(Paper2);
      Paper2.renderStructuredMarkband = function(...args) {
        return priorMarkband(...args)
          .replace('最終パート全体をdescriptorと比較し、best-fitで0〜9点を1つ選びます。', '最終パート全体を評価基準の説明と比較し、最も適合する0〜9点を1つ選びます。')
          .replace(/best-fit markband/g, '最も適合する評価帯')
          .replace(/descriptor/g, '評価基準の説明');
      };
    }

    if (typeof Paper2.renderSelfMarkPanel === 'function') {
      const priorSelfMark = Paper2.renderSelfMarkPanel.bind(Paper2);
      Paper2.renderSelfMarkPanel = function(maxMarks) {
        const html = priorSelfMark(maxMarks);
        if (!this.isStructuredEssSectionB?.()) return html;
        return html
          .replace(/best-fit markband/g, '最も適合する評価帯')
          .replace(/Analytic/g, '項目別採点')
          .replace(/Markband/g, '評価帯');
      };
    }

    if (typeof Paper2.getEssHlMarkbandDescriptors === 'function') {
      const priorBands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
      Paper2.getEssHlMarkbandDescriptors = function() {
        return priorBands().map(band => ({
          ...band,
          textJa: zeroBareEnglish(band.textJa)
            .replace(/ESS/g, 'ESS（環境システムと社会）')
            .replace(/HL/g, 'HL（上級レベル）')
        }));
      };
    }

    Paper2.zeroBareEnglishEssSectionB = zeroBareEnglish;
  };

  install();
})();