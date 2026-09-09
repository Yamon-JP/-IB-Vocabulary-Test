// ESS HL Paper 2 Section B Japanese editorial audit.
// Keeps English assessment content and marking logic unchanged.
(() => {
  const MAX_ATTEMPTS = 240;

  const install = (attempt = 0) => {
    if (
      typeof Paper2 === 'undefined'
      || !Paper2.essJapaneseLocalizationInstalled
      || typeof Paper2.applyEssSet8Structure !== 'function'
      || typeof Paper2.getEssHlMarkbandDescriptors !== 'function'
    ) {
      if (attempt < MAX_ATTEMPTS) window.setTimeout(() => install(attempt + 1), 50);
      else console.warn('ESS Section B Japanese audit could not find its dependencies.');
      return;
    }
    if (Paper2.essSectionBJapaneseAuditInstalled) return;
    Paper2.essSectionBJapaneseAuditInstalled = true;

    const partOverrides = {
      'ESS-P2B-MS1-A': {
        a: '河川流域は、input（入力）、output（出力）、storage（貯蔵）、flow（流れ）、feedback（フィードバック）、boundary（境界）をもつsystem（システム）として捉えられます。sustainability（持続可能性）とは、将来にわたってnatural capital（自然資本）とecosystem services（生態系サービス）を維持することです。またenvironmental value systems (EVS)（環境価値体系）は、利害関係者が何を問題とみなし、どの解決策を受け入れるかに影響します。',
        b: '人間活動による圧力は相互につながったflow（流れ）やstorage（貯蔵）を変化させるため、上流での行動が下流へ影響することがあります。河岸植生の復元、abstraction（取水）の制限、汚染対策などはsystem（システム）のfeedback（フィードバック）を変えられます。一方、農家、保全団体、都市住民では価値観や優先順位が異なるため、支持する管理策も異なります。'
      },
      'ESS-P2B-MS1-B': {
        a: 'species diversity（種多様性）は、species richness（種の豊富さ）と相対的な個体数の両方を含みます。habitat fragmentation（生息地の分断）は連続した生息地を小さく孤立した区画に分け、個体群サイズ、gene flow（遺伝子流動）、再定着を減少させ、edge effect（エッジ効果）や絶滅リスクを高める可能性があります。',
        b: '法的な保護だけでは土地の直接転換は防げても、孤立した生息地にはedge effect（エッジ効果）、invasive species（侵略的外来種）、狩猟、汚染、気候変動などの圧力が残ります。corridor（生態学的回廊）の整備、生息地の復元、脅威の管理、実効的な法執行、地域住民の参加を組み合わせることで、ecological connectivity（生態学的連結性）を高め、保護区の外側からの圧力も減らせます。'
      },
      'ESS-P2B-MS1-C': {
        a: 'water security（水の安全保障）とは、人々が十分で安全な水を安定して利用できると同時に、生態系が必要とする水も確保されている状態です。供給側の対策は利用可能な水量を増やし、demand management（需要管理）は水使用量を減らします。environmental flow（環境流量）は、水生生態系の機能を維持するために必要な流量を確保する考え方です。',
        b: '過剰なabstraction（取水）は河川流量、groundwater（地下水）、湿地を減少させ、汚染は利用可能な水の割合を低下させます。需要削減、排水処理、environmental flow（環境流量）の確保、湿地の復元、必要に応じた新たな水供給を組み合わせることが有効です。ただし気候の変動性や利用者間の競合があるため、流域全体でadaptive management（順応的管理）を行う必要があります。'
      },
      'ESS-P2B-MS2-A': {
        a: 'gross primary productivity (GPP)（総一次生産量）は生産者が固定した総エネルギー、net primary productivity (NPP)（純一次生産量）は呼吸による損失を差し引いた後にbiomass（バイオマス）として残るエネルギーです。エネルギーはtrophic level（栄養段階）を移るごとに熱として散逸し、ecological efficiency（生態学的効率）によって伝達量が制限されます。一方、栄養塩は生物・非生物の貯蔵庫の間を循環します。',
        b: 'respiration（呼吸）、食べられないbiomass（バイオマス）、排出物によって、より高いtrophic level（栄養段階）へ届くエネルギーは減少します。decomposition（分解）と無機化によって制限栄養塩が生産者へ戻るため、有機物や分解者が維持されれば生産性と撹乱後の回復を支えられます。ただし肥料の流出などの人為的影響はnutrient cycling（栄養塩循環）を不安定にする可能性があります。'
      },
      'ESS-P2B-MS2-B': {
        a: 'overexploitation（過剰利用）は生物資源の回復速度を上回って採取すること、invasive species（侵略的外来種）は本来その地域にいない生物が広がって害を与えること、illegal wildlife trade（違法野生生物取引）は法的規制を無視して保護対象の生物を捕獲・取引することです。いずれも個体群サイズ、遺伝的多様性、生態系機能を低下させる可能性があります。',
        b: 'overexploitation（過剰利用）には採取量の制限や地域共同管理、invasive species（侵略的外来種）にはbiosecurity（バイオセキュリティ）と早期発見、illegal wildlife trade（違法野生生物取引）にはCITES、税関での取締り、密猟対策、需要削減が有効です。これらを生息地保護、地域への経済的誘因、信頼できるデータ、国際協力と組み合わせることで効果が高まります。'
      },
      'ESS-P2B-MS2-C': {
        a: '人為的な温室効果ガス排出はradiative forcing（放射強制力）を高め、enhanced greenhouse effect（強化された温室効果）を強めます。mitigation（緩和）は将来の排出を減らしたり吸収を増やしたりしてcarbon budget（カーボンバジェット）を守る対策です。adaptation（適応）は、すぐには避けられない気候影響に対するvulnerability（脆弱性）を下げます。',
        b: '迅速なmitigation（緩和）は累積的な温暖化を抑え、reinforcing feedback（正のフィードバック）が強まる可能性を低下させます。一方、洪水対策や暑熱対策などのadaptation（適応）は現在のリスクを減らします。nature-based solutions（自然を活用した解決策）は炭素貯蔵と災害防護の両方に役立つ場合がありますが、設計が不適切だとmaladaptation（不適応）や将来の排出固定化を招くため、統合的な計画が必要です。'
      },
      'ESS-P2B-MS3-A': {
        a: 'erosion（土壌侵食）はtopsoil（表土）が失われ移動すること、salinization（塩類集積）は土壌に可溶性塩類が蓄積して植物の生育を妨げることです。soil organic matter（土壌有機物）は土壌構造、空隙率、保水性、nutrient cycling（栄養塩循環）、soil fertility（土壌肥沃度）を改善し、生産性と回復力の高い土壌を支えます。',
        b: '被覆作物、等高線農法、reduced tillage（減耕起）は表面流出と土壌流失を抑えます。効率的な灌漑と排水は塩類の蓄積を抑え、堆肥、作物残さの保持、輪作、agroforestry（アグロフォレストリー）はsoil organic matter（土壌有機物）を回復させます。これらを組み合わせることで浸透、栄養塩保持、水質、干ばつへのresilience（レジリエンス）を同時に改善できます。'
      },
      'ESS-P2B-MS3-B': {
        a: 'food security（食料安全保障）とは、十分で安全かつ栄養のある食料を、物理的・経済的に安定して入手できる状態です。sustainable agriculture（持続可能な農業）は生産と農家の生計を維持しながら、土壌、水、biodiversity（生物多様性）を守ります。農業システムによって投入量、作物多様性、灌漑、管理方法が異なるため、環境への圧力も変わります。',
        b: '輪作、被覆作物、有機物の利用はsoil fertility（土壌肥沃度）と保水性を改善します。効率的な灌漑は河川や帯水層への圧力を下げます。polyculture（複数作物栽培）、生息地帯、integrated pest management (IPM)（総合的病害虫管理）は農薬への依存を減らし、生態系による害虫抑制を支えます。組み合わせることで収量を安定させられますが、地域の条件に合った知識と資源が必要です。'
      },
      'ESS-P2B-MS3-C': {
        a: 'capture fisheries（漁獲漁業）は野生の魚類資源を採取するため、漁獲圧が高すぎるとoverfishing（乱獲）、bycatch（混獲）、生息地への損傷を引き起こします。aquaculture（養殖）は水生生物を育てて食料供給を増やせますが、栄養塩汚染、疾病、養殖個体の逃亡、飼料需要、生息地転換などの問題を生む可能性があります。',
        b: '漁獲枠、漁獲努力量の制限、季節的な禁漁は産卵資源を保護できます。marine protected area (MPA)（海洋保護区）や選択的漁具は生息地への損傷とbycatch（混獲）を減らせます。排水処理、飼料効率の改善、循環式または多栄養段階型のaquaculture（養殖）は環境負荷を下げられます。ただし漁業と養殖の間で圧力が移る可能性があるため、継続的なmonitoring（モニタリング）が必要です。'
      },
      'ESS-P2B-MS4-A': {
        a: 'renewable resource（再生可能資源）は利用量が再生量を超えなければ人間の時間尺度で再生できます。non-renewable resource（非再生可能資源）は有限のstock（資源量）として存在し、replenishable resource（補充可能資源）はゆっくり回復します。natural capital（自然資本）はnatural income（自然所得）やecosystem services（生態系サービス）を生み出す資源のstock（蓄え）です。',
        b: 'renewable resource（再生可能資源）では採取量の上限やadaptive management（順応的管理）によって利用量を再生量以下に保つことが重要です。non-renewable resource（非再生可能資源）では効率化、再利用、リサイクル、製品寿命の延長、代替によって枯渇を遅らせられます。natural capital（自然資本）を保護すればecosystem services（生態系サービス）も維持できますが、rebound effect（リバウンド効果）や影響の別地域への移転によって効果が弱まる場合があります。'
      },
      'ESS-P2B-MS4-B': {
        a: 'energy security（エネルギー安全保障）とは、信頼でき手頃な価格のエネルギーを安定して利用できる状態です。energy transition（エネルギー転換）はエネルギー構成とそれを支えるインフラを変化させます。風力・太陽光は出力が変動するためintermittency（出力変動性）と需給調整が必要であり、運用時の排出が少なくても資材、土地、インフラに伴うlife-cycle impacts（ライフサイクル全体の影響）は残ります。',
        b: '出力が変動する電源と安定供給できる低炭素電源を組み合わせることで化石燃料への依存を減らし、蓄電、系統連系、需要管理によって供給の信頼性を高められます。省エネルギーや電化も需要を減らしますが、土地利用、資材、ダムの影響、放射性廃棄物、費用、公正な移行といったtrade-off（トレードオフ）を管理する必要があります。'
      },
      'ESS-P2B-MS4-C': {
        a: '温室効果ガス排出による気候被害を排出者がすべて負担しない場合、それはnegative externality（負の外部性）です。carbon tax（炭素税）は排出に価格をつけ、emissions trading（排出量取引）は排出上限を設定して排出枠の取引を認めます。補助金は低炭素技術や行動の相対的な費用を下げます。',
        b: '排出に価格をつけることで生産、消費、投資の誘因を変えられます。税は価格の予測可能性を高め、排出上限制度は排出量の確実性を高め、補助金は低炭素技術の普及を加速できます。ただし価格や上限が弱い、対象範囲が狭い、排出枠の無償配分が多い、低所得層への負担が大きい、carbon leakage（炭素リーケージ）が起こる、代替手段がない、といった場合には排出削減効果が弱まります。'
      },
      'ESS-P2B-MS5-A': {
        a: 'population growth（人口増加）は出生、死亡、純移動によって決まります。年齢構成によっては出生率が低下した後もpopulation momentum（人口モメンタム）によって人口増加が続くことがあります。環境への圧力は人口規模だけでなく、1人当たりの資源消費量にも左右されます。',
        b: '若年人口が多い社会では将来の住宅、食料、水、エネルギー需要が増える可能性があります。一方、人口増加が遅い高所得社会でも1人当たり消費が大きければ環境への圧力は高くなります。migration（移住）は需要の場所を変え、効率化、技術、compact city（コンパクトシティ）のような都市形態は同じ人口規模でも環境負荷を変化させます。'
      },
      'ESS-P2B-MS5-B': {
        a: 'urbanization（都市化）は都市に住む人口の割合が増えることです。urban metabolism（都市代謝）は都市に入るエネルギー、水、物質と、都市から出る廃棄物の流れを表します。compact city（コンパクトシティ）やtransit-oriented development (TOD)（公共交通指向型開発）は住宅、職場、サービスを公共交通にアクセスしやすい場所へ集めます。resilience（レジリエンス）はショックに耐え、回復する能力です。',
        b: '移動距離を短くし、信頼性の高い公共交通を整備すれば、自動車依存、土地転換、交通エネルギーを減らせます。green infrastructure（グリーンインフラ）は冷却、雨水浸透、洪水調節、生息地の提供に役立ちます。ただし住宅、公共サービス、緑地が不十分なまま高密度化すると、渋滞、暑熱、不平等を悪化させる可能性があります。'
      },
      'ESS-P2B-MS5-C': {
        a: 'primary pollutant（一次汚染物質）は発生源から直接排出され、secondary pollutant（二次汚染物質）は大気中の反応で形成されます。ground-level ozone（対流圏オゾン）はnitrogen oxides (NOx)（窒素酸化物）とvolatile organic compounds (VOCs)（揮発性有機化合物）が日光の下で反応して形成されます。temperature inversion（気温逆転）が起こると大気の鉛直混合が弱まり、汚染物質が地表付近に蓄積しやすくなります。',
        b: '公共交通や徒歩・自転車利用は自動車利用量を減らせます。排出基準、catalytic converter（触媒コンバーター）、電気自動車は排気汚染を減らし、scrubber（スクラバー）や工場排出規制は固定発生源を管理します。都市計画では住宅や学校などを主要発生源から離せますが、電化や規制によって環境負荷や費用が別の場所へ移る可能性にも注意が必要です。'
      },
      'ESS-P2B-MS6-A': {
        a: '淡水のbiodiversity（生物多様性）には遺伝的多様性、種多様性、生態系多様性が含まれ、resilience（レジリエンス）にも寄与します。environmental flow（環境流量）は生態系に必要な水文条件を維持します。point-source pollution（点源汚染）は発生源を特定できる汚染、non-point-source pollution（非点源汚染）は流域内に広く分散した汚染です。',
        b: 'environmental flow（環境流量）の設定、ダム運用の変更、abstraction（取水）制限によって水文環境を回復できます。排水処理、栄養塩管理、河岸緩衝帯によって水質を改善し、湿地や河岸の復元によって生息地を再接続できます。流域では上流の対策が下流の生物にも影響するため、統合的な管理によって相乗的な生態学的効果を得られます。'
      },
      'ESS-P2B-MS6-B': {
        a: 'fish stock（魚類資源）は管理対象となる魚類個体群、fishing effort（漁獲努力量）は漁獲圧の大きさを表します。overfishing（乱獲）は漁獲量が資源の持続的な回復量を上回る状態です。maximum sustainable yield (MSY)（最大持続可能漁獲量）は高い水準の持続可能な漁獲量を推定しますが、加入量、環境条件、stock assessment（資源量評価）の不確実性に左右されます。',
        b: '漁獲枠、漁獲努力量の制限、adaptive harvest rules（順応的な漁獲規則）は漁獲量を制御できます。保護区、生息地保護、選択的漁具は生態系への損傷を減らします。共同のstock assessment（資源量評価）、monitoring（モニタリング）、co-management（共同管理）は複数の国・地域の意思決定をそろえるのに役立ちます。資源の移動や環境条件の変化に対応するにはadaptive management（順応的管理）が重要です。'
      },
      'ESS-P2B-MS6-C': {
        a: '国内のenvironmental law（環境法）は各国の管轄内で機能し、国際環境法は国家間の義務を調整します。hard law（ハードロー）はsoft law（ソフトロー）より法的拘束力が強い仕組みです。transboundary pollution（越境汚染）では発生源、影響、監視、法執行が異なる国・地域にまたがるため、管理が難しくなります。',
        b: '国内の許認可、基準、制裁によって発生源を管理し、国際協定や共通基準によって国境を越えた対策をそろえられます。共同monitoring（モニタリング）と透明な報告は違反の発見に役立ち、liability（法的責任）は浄化費用を汚染者へ負担させる仕組みになります。市民参加や司法へのアクセスは説明責任を高めます。'
      },
      'ESS-P2B-MS7-A': {
        a: 'critical minerals（重要鉱物）は有限資源であり、戦略的重要性が高く供給制約があるためresource security（資源安全保障）の問題につながります。採掘は生息地の消失やhabitat fragmentation（生息地の分断）、水文環境の変化を引き起こし、土砂、金属、acid drainage（酸性鉱山排水）、処理廃棄物を水系へ流出させる可能性があります。',
        b: '製品寿命の延長、資材効率の向上、再利用、リサイクル、代替によって新規採掘への需要を減らせます。立地選定、tailings（鉱山廃さい）の管理、水処理、環境修復、environmental impact assessment (EIA)（環境影響評価）、monitoring（モニタリング）、地域住民の参加によって避けられない採掘影響を減らせます。ただし需要が急増する時期には、リサイクルだけで新規採掘をなくすことはできません。'
      },
      'ESS-P2B-MS7-B': {
        a: 'gross domestic product (GDP)（国内総生産）は最終財・サービスの市場価値を示しますが、sustainability（持続可能性）を直接測る指標ではありません。natural capital（自然資本）はnatural income（自然所得）やecosystem services（生態系サービス）を生み出す環境資産のstock（蓄え）です。Green GDP（グリーンGDP）、genuine progress indicator (GPI)（真正進歩指標）、natural capital accounting（自然資本会計）は環境費用や資産量の変化を経済評価へ組み込もうとします。',
        b: '資源採掘や汚染の浄化活動はGDPを増やす一方で、森林や湿地などのnatural capital（自然資本）を減らすことがあります。また市場価格には非市場型のecosystem services（生態系サービス）やexternality（外部性）が十分反映されない場合があります。natural capital accounting（自然資本会計）や調整済み指標は資産の減少や社会・生態学的な結果を可視化できますが、economic valuation（経済評価）には不確実性があります。'
      },
      'ESS-P2B-MS7-C': {
        a: 'environmental justice（環境正義）は環境上の便益と負担が公平に分配され、意思決定への参加機会が確保されているかを扱います。intergenerational justice（世代間正義）は将来世代への責任を扱います。utilitarian（功利主義）、rights-based（権利に基づく立場）、anthropocentric（人間中心主義）、biocentric（生命中心主義）、ecocentric（生態系中心主義）では、何に道徳的価値を置くかが異なります。',
        b: 'ある政策が社会全体の便益を最大化しても、特定の弱い立場の集団へ被害を集中させる場合、utilitarian（功利主義）とrights-based（権利に基づく立場）では結論が異なる可能性があります。ecocentric（生態系中心主義）は人間への直接的利益を超えてecosystem integrity（生態系の健全性）を重視します。また包括的な参加は、当事者の認識、公正な手続き、政策の正当性を高めます。'
      },
      'ESS-P2B-MS8-A': {
        a: 'food security（食料安全保障）とは、十分で安全かつ栄養のある食料へ安定してアクセスできることです。そのため、一時的に収量が増えても、将来の生産を支えるnatural capital（自然資本）を損なうなら十分とはいえません。soil fertility（土壌肥沃度）は栄養塩の利用可能性、soil organic matter（土壌有機物）、土壌構造、生物活動などに左右されます。過剰な肥料・農薬や不適切な土地管理は短期的な収量を上げても、erosion（土壌侵食）、salinization（塩類集積）、水質汚染、biodiversity loss（生物多様性の損失）を強める可能性があります。',
        b: '被覆作物、reduced tillage（減耕起）、有機質資材はerosion（土壌侵食）を抑えながらsoil organic matter（土壌有機物）、浸透、保水性を改善できます。精密な施肥と栄養塩収支管理は作物に必要な栄養を確保しつつ硝酸塩・リン酸塩の流出を減らし、河岸緩衝帯は表面流出を水域へ到達する前に捕捉します。輪作、polyculture（複数作物栽培）、agroforestry（アグロフォレストリー）、integrated pest management (IPM)（総合的病害虫管理）は送粉者や天敵による害虫抑制、resilience（レジリエンス）を支えます。'
      },
      'ESS-P2B-MS8-B': {
        a: 'climate risk（気候リスク）は、sea-level rise（海面上昇）、storm surge（高潮）、極端な降雨、暑熱などのhazard（ハザード）が、exposure（曝露）した人々やインフラと高いvulnerability（脆弱性）に重なるほど大きくなります。沿岸開発が危険地域へ広がるとexposure（曝露）も増えます。mitigation（緩和）は温室効果ガス排出削減や吸収量増加によって将来の気候変動の原因を弱め、adaptation（適応）はexposure（曝露）とvulnerability（脆弱性）を下げ、adaptive capacity（適応能力）を高めることで被害を減らします。',
        b: '低炭素電力、省エネルギー建築、公共交通は都市の温室効果ガス排出を減らし、長期的な温暖化の抑制に寄与します。排水設備の強化、防潮壁、重要インフラの嵩上げなどの工学的adaptation（適応）は洪水やstorm surge（高潮）の被害を減らせます。マングローブ・湿地の復元、土地利用規制、managed retreat（計画的撤退）などのnature-based solutions（自然を活用した解決策）や都市計画は波のエネルギーや将来のexposure（曝露）を低下させます。これらを組み合わせることで単一対策への依存を減らせます。'
      },
      'ESS-P2B-MS8-C': {
        a: '保護は、種、遺伝的多様性、生物間相互作用、土壌、水文、生態学的過程が残っている生態系の劣化を防ぎます。restoration ecology（復元生態学）は劣化後に森林再生、湿地復元、補助的な自然再生などを行い、生息地、生態系機能、biodiversity（生物多様性）の回復を目指します。健全な生態系は供給、調整、文化的、基盤的なecosystem services（生態系サービス）を提供し、ecological threshold（生態学的閾値）を超えると一部の機能は再現が難しくなる場合があります。',
        b: 'protected area（保護区）と土地利用規制は生息地の直接転換を防ぎ、corridor（生態学的回廊）や景観計画はecological connectivity（生態学的連結性）とgene flow（遺伝子流動）を維持します。復元によって生息地を拡大し、分断された個体群を再接続し、invasive species（侵略的外来種）を除去し、水量調節や炭素貯蔵などの機能を回復できます。monitoring（モニタリング）によってbiodiversity（生物多様性）と生態系機能の変化を追跡し、回復が弱い場合にはadaptive management（順応的管理）へつなげます。'
      }
    };

    const keyTerms = [
      ['balanced analysis', 'balanced analysis（バランスの取れた分析）'],
      ['critical reflection', 'critical reflection（批判的検討）'],
      ['environmental value systems', 'environmental value systems (EVS)（環境価値体系）'],
      ['gross primary productivity', 'gross primary productivity (GPP)（総一次生産量）'],
      ['net primary productivity', 'net primary productivity (NPP)（純一次生産量）'],
      ['gross domestic product', 'gross domestic product (GDP)（国内総生産）'],
      ['environmental impact assessment', 'environmental impact assessment (EIA)（環境影響評価）'],
      ['species richness', 'species richness（種の豊富さ）'],
      ['gene flow', 'gene flow（遺伝子流動）'],
      ['edge effect', 'edge effect（エッジ効果）'],
      ['sustainable agriculture', 'sustainable agriculture（持続可能な農業）'],
      ['capture fisheries', 'capture fisheries（漁獲漁業）'],
      ['rebound effect', 'rebound effect（リバウンド効果）'],
      ['carbon leakage', 'carbon leakage（炭素リーケージ）'],
      ['primary pollutant', 'primary pollutant（一次汚染物質）'],
      ['secondary pollutant', 'secondary pollutant（二次汚染物質）'],
      ['point-source pollution', 'point-source pollution（点源汚染）'],
      ['non-point-source pollution', 'non-point-source pollution（非点源汚染）'],
      ['fish stock', 'fish stock（魚類資源）'],
      ['adaptive harvest rules', 'adaptive harvest rules（順応的な漁獲規則）'],
      ['co-management', 'co-management（共同管理）'],
      ['liability', 'liability（法的責任）'],
      ['ecological threshold', 'ecological threshold（生態学的閾値）'],
      ['corridor', 'corridor（生態学的回廊）'],
      ['externality', 'externality（外部性）'],
      ['stock', 'stock（蓄え）'],
      ['monitoring', 'monitoring（モニタリング）']
    ].sort((a, b) => b[0].length - a[0].length);

    const plainReplacements = [
      ['well-supported judgement', '十分な根拠に支えられた判断'], ['explicit judgement', '明確な判断'], ['judgement', '判断'],
      ['HL lens', 'HLの視点'], ['markband', '評価帯'], ['descriptor', '評価基準'], ['terminology', '専門用語'],
      ['relevant examples', '関連する具体例'], ['relevant example', '関連する具体例'], ['supporting evidence', '裏付けとなる根拠'],
      ['underdeveloped', '十分に展開されていない'], ['descriptive', '記述中心の'], ['context', '文脈'], ['knowledge', '知識'],
      ['reliability', '信頼性'], ['upstream', '上流'], ['downstream', '下流'], ['action', '行動'], ['actions', '行動'],
      ['solution', '解決策'], ['solutions', '解決策'], ['problem', '問題'], ['problems', '問題'], ['priority', '優先事項'], ['priorities', '優先事項'],
      ['richness', '種の豊富さ'], ['relative abundance', '相対的な個体数'], ['isolated', '孤立した'], ['patch', '生息地区画'], ['patches', '生息地区画'],
      ['recolonization', '再定着'], ['extinction risk', '絶滅リスク'], ['direct conversion', '直接的な土地転換'], ['threat control', '脅威の管理'],
      ['legal protection', '法的保護'], ['community participation', '地域住民の参加'], ['access', 'アクセス'], ['environmental need', '生態系が必要とする水量'],
      ['supply-side measure', '供給側の対策'], ['supply-side measures', '供給側の対策'], ['demand management', '需要管理'], ['usable water', '利用可能な水'],
      ['demand reduction', '需要削減'], ['wastewater treatment', '排水処理'], ['basin-scale', '流域全体の'], ['basin scale', '流域全体の'], ['allocation', '配分'],
      ['human pressure', '人間活動による圧力'], ['human pressures', '人間活動による圧力'], ['natural recovery', '自然回復'], ['resource removal', '資源の採取'],
      ['non-native organism', '外来生物'], ['wildlife', '野生生物'], ['legal control', '法的規制'], ['population size', '個体群サイズ'], ['genetic diversity', '遺伝的多様性'],
      ['community management', '地域共同管理'], ['early detection', '早期発見'], ['customs enforcement', '税関での取締り'], ['anti-poaching', '密猟対策'], ['demand reduction', '需要削減'],
      ['international cooperation', '国際協力'], ['reliable data', '信頼できるデータ'], ['local incentive', '地域への誘因'], ['future emission', '将来の排出'],
      ['current risk', '現在のリスク'], ['rapid mitigation', '迅速なmitigation（緩和）'], ['cumulative warming', '累積的な温暖化'], ['emission lock-in', '将来の排出固定化'],
      ['productive', '生産性の高い'], ['resilient', '回復力の高い'], ['plant growth', '植物の生育'], ['soluble salt', '可溶性塩類'], ['salt accumulation', '塩類の蓄積'],
      ['contour farming', '等高線農法'], ['efficient irrigation', '効率的な灌漑'], ['drainage', '排水'], ['compost', '堆肥'], ['residue retention', '作物残さの保持'],
      ['food supply', '食料供給'], ['aquatic organism', '水生生物'], ['feed demand', '飼料需要'], ['habitat conversion', '生息地転換'], ['spawning stock', '産卵資源'],
      ['seasonal closure', '季節的な禁漁'], ['selective gear', '選択的漁具'], ['feed conversion', '飼料効率'], ['recirculating', '循環式'], ['multi-trophic', '多栄養段階型'],
      ['human timescale', '人間の時間尺度'], ['finite stock', '有限の資源量'], ['replenishable resource', '補充可能資源'], ['non-renewable resource', '非再生可能資源'], ['renewable resource', '再生可能資源'],
      ['harvest limit', '採取量の上限'], ['product life', '製品寿命'], ['impact shifting', '影響の別地域への移転'], ['energy mix', 'エネルギー構成'], ['supporting infrastructure', '関連インフラ'],
      ['variable output', '変動する出力'], ['balancing need', '需給調整の必要性'], ['operational emission', '運用時の排出'], ['material', '資材'], ['materials', '資材'], ['land use', '土地利用'],
      ['firm low-carbon source', '安定供給可能な低炭素電源'], ['low-carbon source', '低炭素電源'], ['demand-side change', '需要側の変化'], ['storage', '蓄電'], ['interconnection', '系統連系'],
      ['hydropower impact', '水力発電による影響'], ['nuclear waste', '放射性廃棄物'], ['just transition', '公正な移行'], ['emitter', '排出者'], ['permit trading', '排出枠取引'],
      ['subsidy', '補助金'], ['subsidies', '補助金'], ['price certainty', '価格の予測可能性'], ['quantity certainty', '排出量の確実性'], ['deployment', '普及'], ['narrow coverage', '狭い対象範囲'],
      ['free permits', '無償排出枠'], ['regressive costs', '低所得層に相対的に重い負担'], ['leakage', '域外への排出移転'], ['alternatives', '代替手段'], ['absolute reduction', '絶対量の削減'],
      ['birth', '出生'], ['births', '出生'], ['death', '死亡'], ['deaths', '死亡'], ['net migration', '純移動'], ['fertility', '出生率'], ['age structure', '年齢構成'],
      ['per-capita resource use', '1人当たり資源消費'], ['per-capita resource consumption', '1人当たり資源消費'], ['environmental pressure', '環境への圧力'], ['youthful population', '若年人口の多い社会'],
      ['high-income population', '高所得社会の人口'], ['consumption', '消費'], ['urban form', '都市形態'], ['travel distance', '移動距離'], ['car dependence', '自動車依存'], ['land conversion', '土地転換'],
      ['cooling', '冷却'], ['infiltration', '浸透'], ['flood regulation', '洪水調節'], ['green space', '緑地'], ['congestion', '渋滞'], ['primary pollutant', '一次汚染物質'], ['secondary pollutant', '二次汚染物質'],
      ['direct emission', '直接排出'], ['sunlight-driven reaction', '日光による化学反応'], ['vertical mixing', '鉛直混合'], ['pollutant', '汚染物質'], ['surface', '地表付近'], ['active travel', '徒歩・自転車利用'],
      ['vehicle activity', '自動車利用量'], ['emission standard', '排出基準'], ['tailpipe pollution', '排気汚染'], ['stationary source', '固定発生源'], ['sensitive land use', '影響を受けやすい土地利用'],
      ['freshwater biodiversity', '淡水のbiodiversity（生物多様性）'], ['genetic', '遺伝的'], ['species', '種'], ['ecosystem diversity', '生態系多様性'], ['hydrological condition', '水文条件'], ['identifiable discharge', '特定可能な排出'],
      ['diffuse source', '分散した発生源'], ['catchment', '流域'], ['dam re-operation', 'ダム運用の変更'], ['nutrient control', '栄養塩管理'], ['riparian buffer', '河岸緩衝帯'], ['catchment connectivity', '流域内のつながり'],
      ['harvest pressure', '漁獲圧'], ['sustainable recovery', '持続的な回復'], ['sustainable catch', '持続可能な漁獲量'], ['recruitment', '加入量'], ['environment condition', '環境条件'], ['quota', '漁獲枠'],
      ['effort limit', '漁獲努力量の制限'], ['protected area', '保護区'], ['jurisdiction', '管轄'], ['decision', '意思決定'], ['national law', '国内法'], ['international law', '国際法'], ['obligation', '義務'],
      ['legal duty', '法的義務'], ['national permit', '国内の許認可'], ['standard', '基準'], ['sanction', '制裁'], ['treaty', '国際協定'], ['coordinated standard', '共通基準'], ['transparent reporting', '透明な報告'],
      ['non-compliance', '違反'], ['cleanup cost', '浄化費用'], ['accountability', '説明責任'], ['strategic importance', '戦略的重要性'], ['supply constraint', '供給制約'], ['habitat removal', '生息地の消失'],
      ['processing waste', '処理廃棄物'], ['virgin demand', '新規資源への需要'], ['careful siting', '慎重な立地選定'], ['tailings management', '鉱山廃さいの管理'], ['water treatment', '水処理'], ['rapid demand growth', '急速な需要増加'],
      ['final goods', '最終財'], ['monetary value', '市場価値'], ['environmental asset', '環境資産'], ['environmental cost', '環境費用'], ['stock change', '資産量の変化'], ['pollution cleanup', '汚染の浄化'],
      ['natural asset', '自然資産'], ['non-market', '非市場型の'], ['adjusted indicator', '調整済み指標'], ['social outcome', '社会的な結果'], ['ecological outcome', '生態学的な結果'], ['fair distribution', '公平な分配'],
      ['meaningful participation', '実質的な参加'], ['future people', '将来世代'], ['moral importance', '道徳的価値'], ['total benefit', '社会全体の便益'], ['vulnerable group', '弱い立場の集団'], ['human welfare', '人間の福祉'],
      ['inclusive participation', '包括的な参加'], ['recognition', '当事者の認識'], ['legitimacy', '政策の正当性'], ['procedural justice', '手続き的正義'], ['short-term yield', '短期的な収量'], ['land management', '土地管理'],
      ['precision fertilizer application', '精密な施肥'], ['nutrient budgeting', '栄養塩収支管理'], ['water body', '水域'], ['pollinator', '送粉者'], ['natural pest control', '天敵による害虫抑制'], ['farm size', '農場規模'],
      ['market access', '市場へのアクセス'], ['climate risk', '気候リスク'], ['people', '人々'], ['infrastructure', 'インフラ'], ['hazard-prone area', '危険地域'], ['low-carbon electricity', '低炭素電力'], ['efficient building', '省エネルギー建築'],
      ['drainage upgrade', '排水設備の強化'], ['flood barrier', '防潮壁'], ['critical infrastructure', '重要インフラ'], ['wave energy', '波のエネルギー'], ['finance', '資金'], ['land availability', '利用可能な土地'], ['maintenance', '維持管理'], ['social acceptance', '社会的受容'],
      ['protection', '保護'], ['degradation', '劣化'], ['interaction', '生物間相互作用'], ['ecological process', '生態学的過程'], ['reforestation', '森林再生'], ['assisted regeneration', '補助的な自然再生'], ['provisioning', '供給'], ['regulating', '調整'], ['cultural', '文化的'], ['supporting', '基盤的'],
      ['land-use control', '土地利用規制'], ['landscape planning', '景観計画'], ['fragmented population', '分断された個体群'], ['water regulation', '水量調節'], ['carbon storage', '炭素貯蔵'], ['legacy effect', '過去の影響'], ['passive regeneration', '自然回復'], ['active restoration', '積極的復元']
    ].sort((a, b) => b[0].length - a[0].length);

    const escapeRegExp = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const replacePhrase = (text, source, replacement) => {
      const pattern = new RegExp(`(^|[^A-Za-z])${escapeRegExp(source)}(?=$|[^A-Za-z])`, 'gi');
      return text.replace(pattern, (match, prefix) => `${prefix}${replacement}`);
    };

    const cleanJapanese = value => {
      if (typeof value !== 'string' || !value.trim()) return value;
      let text = value;
      const protectedTerms = [];
      text = text.replace(/[A-Za-z][A-Za-z0-9-]*(?:\s+[A-Za-z][A-Za-z0-9-]*){0,6}(?:\s+\([A-Z0-9]+\))?（[^）]+）/g, match => {
        const token = `@@ESSAUDIT${protectedTerms.length}@@`;
        protectedTerms.push(match);
        return token;
      });
      keyTerms.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      plainReplacements.forEach(([source, replacement]) => { text = replacePhrase(text, source, replacement); });
      protectedTerms.forEach((term, index) => { text = text.split(`@@ESSAUDIT${index}@@`).join(term); });
      return text
        .replace(/\s+([、。])/g, '$1')
        .replace(/([（(])\s+/g, '$1')
        .replace(/\s+([）)])/g, '$1');
    };

    const originalApply = Paper2.applyEssSet8Structure.bind(Paper2);
    Paper2.applyEssSet8Structure = function(question) {
      const hydrated = originalApply(question);
      if (!hydrated || hydrated.subject !== 'ESS HL' || hydrated.assessmentTarget !== 'ess2b') return hydrated;
      const overrides = partOverrides[hydrated.id] || {};
      return {
        ...hydrated,
        markschemeJa: Array.isArray(hydrated.markschemeJa) ? hydrated.markschemeJa.map(cleanJapanese) : hydrated.markschemeJa,
        modelAnswerJa: cleanJapanese(hydrated.modelAnswerJa),
        parts: Array.isArray(hydrated.parts) ? hydrated.parts.map(part => {
          const label = String(part?.label || '').toLowerCase();
          return {
            ...part,
            markschemeJa: Array.isArray(part?.markschemeJa) ? part.markschemeJa.map(cleanJapanese) : part?.markschemeJa,
            modelAnswerJa: overrides[label] || cleanJapanese(part?.modelAnswerJa)
          };
        }) : hydrated.parts,
        _essSectionBJapaneseAudit: true
      };
    };

    const originalBands = Paper2.getEssHlMarkbandDescriptors.bind(Paper2);
    Paper2.getEssHlMarkbandDescriptors = function() {
      return originalBands().map(band => {
        const translations = {
          '0': '以下の評価帯に入るだけの、設問に関連した到達が示されていません。',
          '1–3': 'ESSまたはHLの視点に関する知識が限定的で、設問の文脈との関連が弱い。具体例がない、または十分に展開されておらず、分析は主に記述にとどまる。判断が不明確、または十分な根拠に支えられていない。',
          '4–6': '十分な知識を設問に関連づけ、専門用語を概ね適切に使用している。関連する具体例とある程度balanced analysis（バランスの取れた分析）があり、結論には一定の根拠が示されている。',
          '7–9': 'ESSとHLの視点に関する幅広い知識を十分に統合し、専門用語を正確に使用している。適切でよく説明された具体例、十分なbalanced analysis（バランスの取れた分析）、明確で十分な根拠に支えられた判断、critical reflection（批判的検討）が示されている。'
        };
        return { ...band, textJa: translations[band.range] || cleanJapanese(band.textJa) };
      });
    };

    Paper2.cleanEssSectionBJapanese = cleanJapanese;
  };

  install();
})();
