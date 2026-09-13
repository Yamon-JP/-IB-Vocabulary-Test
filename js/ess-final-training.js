// Additive ESS HL Final Exam Training loader.
// Existing ESS exam logic remains untouched; extra questions are merged by unique id.
(() => {
  const EssFinalTraining = window.EssFinalTraining = {
    loaded: false,
    structureInstalled: false,
    running: false,

    async fetchArray(url) {
      try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`Could not load ${url}`);
        const data = await response.json();
        return Array.isArray(data) ? data : [];
      } catch (error) {
        console.warn('ESS Final Training extra data could not be loaded.', error);
        return [];
      }
    },

    mergeUnique(existing = [], additions = [], normalize = item => item) {
      const merged = Array.isArray(existing) ? [...existing] : [];
      const ids = new Set(merged.map(item => item?.id).filter(Boolean));
      (Array.isArray(additions) ? additions : []).forEach(rawItem => {
        const item = normalize(rawItem);
        if (!item || !item.id || ids.has(item.id)) return;
        ids.add(item.id);
        merged.push(item);
      });
      return merged;
    },

    installSectionBStructure() {
      if (this.structureInstalled) return true;
      if (typeof Paper2 === 'undefined' || !Paper2.essSet8StructuredDefinitions) return false;

      const groups = [
        { label: 'a', title: 'Part (a) · Foundations', titleJa: 'パート(a)・基礎理解', start: 0, count: 4 },
        { label: 'b', title: 'Part (b) · Application and analysis', titleJa: 'パート(b)・応用と分析', start: 4, count: 7 }
      ];
      const make = item => ({
        commandTerm: 'Structured essay',
        question: 'Answer all three parts. Use relevant ESS examples where appropriate.',
        structuredMarking: {
          mode: 'analytic-plus-markband',
          analyticMarks: 11,
          markbandMarks: 9,
          markbandPart: 'c',
          analyticGroups: groups.map(group => ({ ...group }))
        },
        parts: [
          { label: 'a', marks: 4, ...item.a },
          { label: 'b', marks: 7, ...item.b },
          { label: 'c', marks: 9, question: item.cQuestion }
        ]
      });

      const records = [
        {
          id: 'ESS-P2B-MS9-A',
          a: {
            question: 'Explain ecological succession, distinguish primary from secondary succession, and explain how resilience relates to recovery after disturbance.',
            modelAnswer: 'Ecological succession is directional change in community composition and ecosystem structure through time. Primary succession begins where soil or a developed biological community is absent, whereas secondary succession begins after disturbance where soil, seed banks or surviving organisms remain. Resilience is the capacity of a system to resist or recover from disturbance while maintaining or regaining important structure and functions.',
            modelAnswerJa: '生態遷移は、時間とともに群集構成や生態系構造が方向性をもって変化する過程です。一次遷移は土壌や発達した生物群集が存在しない場所から始まり、二次遷移は土壌・seed bank・生存個体などが残る攪乱後の環境から始まります。resilienceは、攪乱に耐えたり回復したりしながら重要な構造・機能を維持または回復する能力です。'
          },
          b: {
            question: 'Analyse how climate, biome characteristics, disturbance history and biotic processes interact to influence the rate and pathway of ecosystem recovery.',
            modelAnswer: 'Temperature and precipitation influence productivity, decomposition and soil moisture, while biome characteristics affect the regional species pool and typical rates of biomass accumulation. Recovery is often faster after secondary disturbance because soil, propagules and surviving organisms remain. Connectivity, invasive species, repeated fire or grazing and feedbacks such as vegetation–soil moisture interactions can redirect succession or stabilize a degraded state. Recovery therefore emerges from interacting abiotic and biotic controls rather than a fixed sequence.',
            modelAnswerJa: '気温と降水量は生産性、分解、土壌水分に影響し、バイオーム特性は地域の種プールやバイオマス蓄積速度を左右します。二次攪乱後は土壌や繁殖体、生存個体が残るため回復が速い場合があります。生息地連結性、外来種、反復火災・放牧、植生―土壌水分などのfeedbackは遷移経路を変えたり、劣化状態を安定化させたりします。したがって回復は固定的な順序ではなく、非生物・生物要因の相互作用から生じます。'
          },
          cQuestion: 'Evaluate the extent to which climate, biome characteristics and ecological succession determine the recovery of ecosystems after large-scale disturbance.'
        },
        {
          id: 'ESS-P2B-MS9-B',
          a: {
            question: 'Explain the protective role of stratospheric ozone and how ozone-depleting substances can reduce ozone concentration.',
            modelAnswer: 'Stratospheric ozone absorbs much of the Sun’s harmful ultraviolet radiation. Compounds such as CFCs and halons can reach the stratosphere, where ultraviolet radiation releases reactive chlorine or bromine radicals. These radicals participate in catalytic reaction cycles that destroy ozone molecules while the radicals are regenerated, allowing one radical to destroy many ozone molecules.',
            modelAnswerJa: '成層圏オゾンは太陽からの有害な紫外線の多くを吸収します。CFCやハロンなどは成層圏へ到達し、紫外線によって反応性の高い塩素・臭素ラジカルを放出します。これらのラジカルは触媒反応でオゾンを分解しながら再生されるため、1つのラジカルが多数のオゾン分子を破壊できます。'
          },
          b: {
            question: 'Analyse how international law, scientific monitoring, technological substitution and financial support can interact to reduce ozone depletion.',
            modelAnswer: 'International agreements can create common phase-out schedules and trade or reporting rules for ozone-depleting substances. Scientific monitoring identifies trends and supports adjustment of controls as evidence changes. Technological substitutes make compliance more feasible by replacing controlled chemicals, while finance and capacity-building can help lower-income states adopt alternatives and enforce controls. These mechanisms reinforce one another when targets are measurable and compliance is transparent.',
            modelAnswerJa: '国際協定はオゾン層破壊物質の共通の段階的廃止スケジュールや貿易・報告ルールを設定できます。科学的モニタリングは変化を把握し、証拠に応じた規制強化を支えます。代替技術は規制物質を置き換えて遵守を現実的にし、資金・能力構築は低所得国での代替導入と執行を支援します。測定可能な目標と透明な遵守制度があると、これらは相互に強化されます。'
          },
          cQuestion: 'Evaluate the effectiveness of international environmental law in addressing stratospheric ozone depletion, and assess what this case suggests about the conditions needed for successful global environmental governance.'
        },
        {
          id: 'ESS-P2B-MS9-C',
          a: {
            question: 'Explain the waste-management hierarchy and why unpriced environmental externalities can cause market failure in solid-waste management.',
            modelAnswer: 'The waste hierarchy generally prioritizes prevention and reduction, followed by reuse, recycling or material recovery, then energy recovery and finally disposal. Market failure can occur when prices paid by consumers or producers do not include external costs such as pollution, greenhouse-gas emissions, land use or health impacts. Disposal may therefore appear cheaper to private decision-makers than it is to society.',
            modelAnswerJa: '廃棄物ヒエラルキーでは一般に、発生抑制・削減を最優先し、再使用、リサイクル・資源回収、エネルギー回収、最終処分の順に優先度が下がります。汚染、温室効果ガス排出、土地利用、健康被害などの外部費用が価格に含まれないとmarket failureが起こり、社会全体では高コストでも私的には処分が安く見えることがあります。'
          },
          b: {
            question: 'Analyse how market-based instruments, regulation, infrastructure and environmental justice considerations can interact in an urban solid-waste strategy.',
            modelAnswer: 'Landfill taxes, pay-as-you-throw charges, deposit-refund systems and producer-responsibility fees can change incentives for households and firms. Regulation can set collection, product or disposal standards and deter illegal dumping. Reliable collection, sorting and recycling infrastructure is required for households and firms to respond to incentives. Environmental-justice analysis asks whether charges, facility locations and service access distribute costs and benefits fairly, including effects on low-income households and informal waste workers.',
            modelAnswerJa: '埋立税、従量制料金、デポジット返金、生産者責任料金は家庭や企業のインセンティブを変えます。規制は収集・製品・処分の基準を設定し、不法投棄を抑止できます。インセンティブに対応するには、信頼できる収集・分別・リサイクルインフラが必要です。environmental justiceでは、料金、施設立地、サービスへのアクセスによる費用と便益が公平に配分されているか、低所得世帯やインフォーマル労働者への影響も検討します。'
          },
          cQuestion: 'Evaluate the claim that market-based instruments alone are sufficient to achieve sustainable solid-waste management in a rapidly growing city.'
        }
      ];

      records.forEach(item => {
        Paper2.essSet8StructuredDefinitions[item.id] = make(item);
      });
      this.structureInstalled = true;
      return true;
    },

    async extend() {
      if (this.loaded) return true;
      if (
        typeof EssExam === 'undefined'
        || !EssExam.dataLoaded
        || typeof Paper1 === 'undefined'
        || typeof Paper2 === 'undefined'
      ) return false;

      const [paper1Extra, sectionAExtra, sectionABalancePack2, sectionBExtra] = await Promise.all([
        this.fetchArray('data/paper1/ess-paper1-final-extra.json?v=2'),
        this.fetchArray('data/paper2/ess-section-a-final-extra.json?v=2'),
        this.fetchArray('data/paper2/ess-section-a-balance-pack-2.json?v=1'),
        this.fetchArray('data/paper2/ess-section-b-set-9.json?v=2')
      ]);

      EssExam.paper1Questions = this.mergeUnique(
        EssExam.paper1Questions,
        paper1Extra.filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess-paper1'
        )
      );

      const normalizePaper2 = question =>
        typeof EssExam.normalizeEssPaper2Question === 'function'
          ? EssExam.normalizeEssPaper2Question(question)
          : question;

      EssExam.paper2SectionAQuestions = this.mergeUnique(
        EssExam.paper2SectionAQuestions,
        [...sectionAExtra, ...sectionABalancePack2].filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2a'
        ),
        normalizePaper2
      );

      EssExam.paper2SectionBQuestions = this.mergeUnique(
        EssExam.paper2SectionBQuestions,
        sectionBExtra.filter(question =>
          question?.subject === 'ESS HL' && question?.assessmentTarget === 'ess2b'
        ),
        normalizePaper2
      );

      if (typeof EssExam.attachData === 'function') EssExam.attachData();

      this.loaded = true;
      if (typeof CourseCoverage !== 'undefined' && typeof CourseCoverage.render === 'function') {
        CourseCoverage.render();
      }
      return true;
    },

    start() {
      if (this.running || (this.loaded && this.structureInstalled)) return;
      this.running = true;
      let attempts = 0;

      const tryExtend = async () => {
        attempts += 1;
        await this.extend();
        this.installSectionBStructure();
        if ((this.loaded && this.structureInstalled) || attempts >= 300) {
          window.clearInterval(timer);
          this.running = false;
        }
      };

      const timer = window.setInterval(tryExtend, 50);
      tryExtend();
    }
  };

  EssFinalTraining.start();
})();
