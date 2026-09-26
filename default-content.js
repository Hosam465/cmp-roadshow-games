// Default game content (seeded into data/config.json on first run; edit it from the admin panel).
// Each question: { tag?, a: correct option index, fixed?: keep option order,
//                  en: { q, o: [...], e?: explanation }, ar: { q, o: [...], e? } }

const UNITS = {
  speakup: {
    icon: 'megaphone',
    en: { title: 'Speak Up', sub: 'Whistleblowing policy' },
    ar: { title: 'تحدّث', sub: 'سياسة الإبلاغ عن المخالفات' },
    games: ['speakup-wwyd', 'speakup-quiz']
  },
  fcc: {
    icon: 'shield',
    en: { title: 'FCC – AML', sub: 'Commercial concealment & AML' },
    ar: { title: 'مكافحة الجرائم المالية', sub: 'التستر التجاري ومكافحة غسل الأموال' },
    games: ['fcc-wwyd']
  },
  regulatory: {
    icon: 'scale',
    en: { title: 'Regulatory Advisory', sub: 'Regulatory compliance' },
    ar: { title: 'الاستشارات التنظيمية', sub: 'الالتزام التنظيمي' },
    games: ['reg-quiz']
  },
  puzzle: {
    icon: 'puzzle',
    en: { title: 'Puzzle Challenge', sub: 'Unscramble the message' },
    ar: { title: 'تحدي اللغز', sub: 'رتّب الحروف لتكشف الرسالة' },
    games: ['puzzle']
  }
};

const GAME_TYPES = {
  wwyd: { en: 'What Would You Do?', ar: 'ماذا ستفعل؟' },
  quiz: { en: 'Quick Quiz', ar: 'اختبار سريع' },
  puzzle: { en: 'Puzzle Challenge', ar: 'تحدي اللغز' }
};

const PUZZLE = {
  en: ['COMPLIANCE', 'IS', "EVERYONE'S", 'RESPONSIBILITY'],
  ar: ['الالتزام', 'مسؤولية', 'الجميع']
};

const GAMES = {
  /* ───────────────────────── SPEAK UP · WHAT WOULD YOU DO ───────────────────────── */
  'speakup-wwyd': {
    unit: 'speakup', type: 'wwyd',
    questions: [
      {
        a: 1,
        en: {
          q: 'A colleague who is out of the office needs to finish an urgent transaction: "Just send me your password — one minute and nobody will know."',
          o: ["Send it, they're trusted", "Refuse, explain it's a violation, and report it", 'Send it and change it afterwards', "Refuse but don't report it"],
          e: 'Explicitly listed as misuse of powers granted to employees, such as exchanging passwords. Changing it later doesn\'t undo the breach — the access was used under your identity.'
        },
        ar: {
          q: 'زميلك خارج المكتب ويحتاج أن ينهي معاملة عاجلة. يطلب منك أن ترسل له كلمة المرور الخاصة بك، وسيكون الموضوع سراً بينكما.',
          o: ['أرسل كلمة المرور لزميلك', 'أرفض، وأوضّح أن مشاركة كلمة المرور تعتبر مخالفة، وأبلّغ عنها', 'أشارك معه كلمة المرور ثم أغيّر كلمة المرور الخاصة بي', 'أرفض بدون إبلاغ'],
          e: 'السياسة تصنّف "إساءة استخدام الصلاحيات الممنوحة من المنشأة المالية لمنسوبيها — مثل تبادل كلمات المرور" ضمن حالات الإبلاغ الصريحة. تغيير كلمة المرور لاحقاً لا يلغي المخالفة لأن الصلاحية استُخدمت باسمك.'
        }
      },
      {
        a: 1,
        en: {
          q: 'A colleague receives a lower performance rating than expected and believes their manager was unfair. They tell you: "This is plainly unjust — I\'ll raise it through the whistleblowing channel."',
          o: ['Encourage them; the channel is open to anyone who feels wronged', 'Explain the difference: the channel is for violations — appraisal grievances go to HR as part of the Performance Cycle', 'Advise them to stay quiet to avoid trouble with their manager', 'Advise them to add other accusations so it qualifies for the channel']
        },
        ar: {
          q: 'حصل زميلٌ على تقييم أقلّ من المتوقع في تقييمه السنوي، ويرى أن مديره لم يُنصفه وأن التقييم لا يعكس أداءه الفعلي. يقول لك: "هذا ظلمٌ واضح، وسأرفعه عبر قناة الإبلاغ عن المخالفات."',
          o: ['أُشجّعه، فالقناة مفتوحة لكل من يرى أنه تعرّض للظلم', 'أُوضّح له الفرق بين التظلم والإبلاغ عن المخالفات، فالتظلم جزء من دورة الأداء ويتبع للموارد البشرية', 'أنصحه بالسكوت تفادياً للمشكلات مع مديره', 'أنصحه بأن يُضيف إلى تظلّمه اتهاماتٍ أخرى ليُقبل عبر القناة']
        }
      },
      {
        a: 1,
        en: {
          q: "You notice something that looks irregular in a process, but you don't have any evidence and you're afraid you've misunderstood and might embarrass a colleague.",
          o: ['Stay silent until I have proof', 'Report in good faith with what I have', 'Confront the colleague', 'Ask coworkers first'],
          e: "Institutions must encourage staff not to hesitate due to uncertainty; a good-faith report that isn't substantiated brings no action against the reporter. Discussing it with coworkers breaches your confidentiality duty."
        },
        ar: {
          q: 'لاحظت شيئاً يبدو غير نظامي في إجراء ما، وليس لديك دليل قاطع، وتخاف أن يكون فهمك للموقف خاطئاً فتسبب إحراجاً لزميلك.',
          o: ['أسكت حتى أجد دليلاً قاطعاً', 'أبلّغ بحسن نية بالمعلومات المتوفرة', 'أواجه الزميل مباشرة', 'أستشير زملائي أولاً'],
          e: 'السياسة تلزم المنشأة بتشجيع منسوبيها على "عدم التردد في الإبلاغ بسبب عدم التأكد من صحة البلاغ أو إمكانية إثباته"، وتؤكد أنه إذا كان البلاغ بحسن نية ولم تثبت صحته، فلن يُتخذ أي إجراء ضد المبلّغ. ومناقشة الموضوع مع الزملاء تخالف واجب المحافظة على السرية.'
        }
      },
      {
        a: 1,
        en: {
          q: 'A colleague is upset with another over a personal dispute and asks you to report them, even though there\'s nothing solid: "Just let them give him a hard time."',
          o: ["Report — it won't hurt me", 'Refuse; a malicious report is itself a violation', 'Report anonymously', 'Agree but postpone'],
          e: 'Duties explicitly include avoiding malicious reports aimed at defaming, retaliating, or undermining confidence — and bearing responsibility for them. Protection is for good-faith reporting only.'
        },
        ar: {
          q: 'زميلك متضايق من زميل آخر بسبب خلاف شخصي، ويطلب منك أن تبلّغ عنه قائلاً: "حتى لو ما في شيء أكيد، خلّهم يتتبعونه."',
          o: ['أبلّغ، لعدم وجود أي ضرر عليّ', 'أرفض — البلاغ الكيدي مخالفة والمبلّغ يتحمل مسؤوليته', 'أبلّغ بشكل مجهول', 'أوافق وأؤجّل'],
          e: 'من واجبات المبلّغ صراحةً: "تجنب البلاغات الكيدية التي تهدف إلى تشويه سمعة الآخرين أو الانتقام منهم أو زعزعة الثقة بالمنشأة"، و"تحمّل مسؤولية الادعاءات الكيدية". الحماية في السياسة للمبلّغ بحسن نية فقط.'
        }
      }
    ]
  },

  /* ───────────────────────── SPEAK UP · QUICK QUIZ ───────────────────────── */
  'speakup-quiz': {
    unit: 'speakup', type: 'quiz',
    questions: [
      {
        a: 1,
        en: { q: 'Which authority issued the Whistleblowing Policy for Financial Institutions?', o: ['Ministry of Commerce', 'Saudi Central Bank (SAMA)', 'Capital Market Authority', 'The bank itself'] },
        ar: { q: 'من الجهة التي أصدرت سياسة الإبلاغ عن المخالفات لدى المؤسسات المالية؟', o: ['وزارة التجارة', 'البنك المركزي السعودي', 'هيئة السوق المالية', 'البنك نفسه'] }
      },
      {
        a: 0,
        en: { q: 'Must I be 100% certain of a violation before reporting?', o: ['No — reasonable, real information indicating suspicion is enough', 'Yes, with conclusive proof', 'Yes, with two witnesses', 'Only if the financial impact is large'] },
        ar: { q: 'هل يجب أن أكون متأكداً 100% من المخالفة قبل الإبلاغ؟', o: ['لا — السياسة تشجع على عدم التردد بسبب عدم التأكد، ويكفي وجود معلومات حقيقية ومعقولة تشير للاشتباه', 'نعم، مع دليل قاطع', 'نعم، مع شاهدين', 'فقط في حال كان الأثر المالي كبيراً'] }
      },
      {
        a: 1,
        en: { q: 'The independent unit that receives and processes reports reports to:', o: ['HR Department', 'Compliance Department', 'Operations Department', 'Legal Department'] },
        ar: { q: 'الوحدة الإدارية المستقلة المسؤولة عن استقبال البلاغات ومعالجتها تتبع إدارياً إلى:', o: ['إدارة الموارد البشرية', 'إدارة الالتزام', 'إدارة العمليات', 'الإدارة القانونية'] }
      },
      {
        a: 0, fixed: true, tag: 'tf',
        en: { q: "True or False: The whistleblower's identity and the report's information remain confidential throughout all stages of processing.", o: ['True', 'False'], e: 'The institution must reassure staff of confidentiality at every stage and may not disclose whistleblower information except to competent authorities such as investigative and judicial bodies.' },
        ar: { q: 'صح أم خطأ: هوية المبلّغ والمعلومات الواردة في البلاغ سرية في جميع مراحل معالجة البلاغ.', o: ['صح', 'خطأ'], e: 'السياسة تلزم المنشأة بالتوعية والطمأنة بشأن سرية هوية المبلّغ والمعلومات في كل مراحل المعالجة، ولا تفصح عن أي معلومات إلا للجهات المختصة كجهات التحقيق والقضاء.' }
      },
      {
        a: 2,
        en: { q: 'Which of the following is NOT a whistleblower duty?', o: ['Report as soon as possible', 'Attach available details and documents', 'Conduct the investigation themselves and gather evidence from the parties', 'Maintain confidentiality of the report'] },
        ar: { q: 'أي مما يلي ليس من واجبات المبلّغ؟', o: ['الإبلاغ بأسرع وقت ممكن', 'إرفاق المستندات والتفاصيل المتوفرة', 'إجراء التحقيق بنفسه وجمع الأدلة من الأطراف', 'المحافظة على سرية البلاغ'] }
      },
      {
        a: 1,
        en: { q: 'A colleague asks for your password. This is:', o: ['Acceptable between trusted colleagues', 'Misuse of granted powers and an explicitly listed reportable case', 'A violation only if harm results', 'A private matter between you'] },
        ar: { q: 'زميل طلب منك كلمة المرور الخاصة بك. هذا التصرف:', o: ['مقبول بين الزملاء الموثوقين', 'إساءة استخدام للصلاحيات وحالة إبلاغ منصوص عليها', 'مخالفة فقط لو ترتب عليها ضرر', 'شأن شخصي بينكما'] }
      },
      {
        a: 2,
        en: { q: 'Who is covered by "Financial Institution Employees" in the Policy?', o: ['Permanent employees only', 'Employees and contractors only', 'Board and committee members, executives, permanent and contract staff, consultants, and third-party workers', 'Executive management only'] },
        ar: { q: 'من يشملهم تعريف "منسوبي المؤسسة المالية" في سياسة الإبلاغ عن المخالفات؟', o: ['الموظفون الدائمون فقط', 'الموظفون والمتعاقدون فقط', 'أعضاء مجلس الإدارة ولجانه، والتنفيذيون، والموظفون الدائمون والمتعاقدون، والمستشارون، والعاملون عبر طرف ثالث', 'الإدارة التنفيذية فقط'] }
      },
      {
        a: 1, fixed: true, tag: 'tf',
        en: { q: 'True or False: If a report is minor or has limited impact, the institution may disregard it.', o: ['True', 'False'], e: 'Reports must be treated with the necessary seriousness regardless of nature, language, adequacy of information, impact, or importance.' },
        ar: { q: 'صح أم خطأ: إذا كان البلاغ بسيطاً أو أثره محدوداً، يجوز للمنشأة إهماله.', o: ['صح', 'خطأ'], e: 'تلتزم المنشأة بالتعامل مع البلاغ بالجدية اللازمة بغض النظر عن طبيعته أو لغته أو كفاية معلوماته أو أثره أو أهميته.' }
      },
      {
        a: 1,
        en: { q: 'A malicious report aimed at defaming a colleague:', o: ['Is covered by whistleblower protection', 'Breaches whistleblower duties, and the reporter bears responsibility', 'Is acceptable if partly true', 'Is simply ignored with no consequence'] },
        ar: { q: 'البلاغ الكيدي الذي يستهدف تشويه سمعة زميل:', o: ['مشمول بحماية المبلّغين', 'مخالفة لواجبات المبلّغ، ويتحمل صاحب البلاغ المسؤولية', 'مقبول إذا كان فيه جزء صحيح', 'يتم تجاهله بدون أي أثر'] }
      },
      {
        a: 3, fixed: true,
        en: { q: 'Which of the following must be reported under the Policy?', o: ['Conflict of interest', 'Misuse of company assets', 'Serious negligence that may harm the institution', 'All of the above'] },
        ar: { q: 'أي مما يلي يجب الإبلاغ عنه وفق السياسة؟', o: ['تعارض المصالح', 'إساءة استخدام أصول المنشأة', 'الإهمال الجسيم الذي قد يضر بالمنشأة', 'جميع ما سبق'] }
      }
    ]
  },

  /* ───────────────────────── FCC-AML · WHAT WOULD YOU DO ───────────────────────── */
  'fcc-wwyd': {
    unit: 'fcc', type: 'wwyd',
    questions: [
      {
        a: 1, tag: 'cc',
        en: { q: "AML Transaction Monitoring flagged cash turnover exceeding SAR 160,000 in a salon worker's personal account (declared salary SAR 3,500). Investigation revealed payments for commercial rents and business center fees for a women's salon. How is this case precisely classified?", o: ['Normal personal savings activity', 'Commercial Concealment (using a personal account for business expenses)', 'Mobile electronic fraud', 'Bank salary input error'] },
        ar: { q: 'رصد نظام مراقبة العمليات حركة مبالغ نقدية تتجاوز 160,000 ريال في حساب عاملة صالون (الراتب المعلن 3,500 ريال). أظهر التحقيق دفع إيجارات تجارية ورسوم مراكز أعمال لصالون نسائي. ما هو التصنيف القانوني/الرقابي الدقيق لهذه الحالة؟', o: ['نشاط ادخاري شخصي طبيعي', 'تستر تجاري (استخدام حساب شخصي لتمرير مصاريف نشاط تجاري)', 'عملية احتيال إلكتروني عبر الهواتف', 'خطأ في إدخال بيانات الراتب من البنك'] }
      },
      {
        a: 0, tag: 'cc',
        en: { q: 'Automated monitoring triggered an alert on a private driver receiving intensive cash deposits and immediately remitting funds abroad via digital wallets, claiming he was "collecting money for friends." What is the main violation here?', o: ['Unauthorized fund collection and Commercial Concealment', 'Non-payment of international transfer fees', 'Usage of an unapproved digital wallet', 'Exceeding the daily cash withdrawal limit'] },
        ar: { q: 'رصد النظام الآلي تنبيهاً لسائق خاص يتلقى إيداعات نقدية مكثفة ويقوم بتحويلها فوراً للخارج عبر المحافظ الرقمية بحجة "جمع أموال لأصدقائه". ما الانتهاك الرئيسي هنا؟', o: ['جمع أموال غير مصرح به وتستر تجاري', 'عدم دفع رسوم التحويل الدولي', 'استخدام محفظة رقمية غير معتمدة', 'تجاوز الحد اليومي للسحب النقدي'] }
      },
      {
        a: 1, tag: 'cc',
        en: { q: 'A CC Unit investigation into an establishment owned by a Saudi woman revealed full control over funds and bank operations exercised by an expatriate via power of attorney, with complete absence of the registered owner. How is this classified?', o: ['Approved family asset management', 'Nominal ownership and absolute Commercial Concealment', 'Officially documented investment partnership', 'Additional bank documentation'] },
        ar: { q: 'كشف تحقيق وحدة التستر التجاري في مؤسسة مملوكة لمواطنة عن إشراف وتصرف كامل في الأموال والعمليات البنكية من قبل مقيم بموجب وكالة شرعية، مع غياب تام للمالكة المسجلة. كيف تُصنف هذه الحالة؟', o: ['إدارة أصول عائلية معتمدة', 'ملكية صورية وتستر تجاري مطلق', 'شراكة استثمارية موثقة رسمياً', 'توثيق مصرفي إضافي'] }
      },
      {
        a: 1, tag: 'cc',
        en: { q: 'During EDD review, a customer (calligrapher) with high cash turnover submitted an unauthenticated employment letter claiming the funds were "salaries", whereas investigation proved they were operational expenses for a private business run for his own account. What is the appropriate classification/action?', o: ['Accept the letter and close the alert', 'Commercial Concealment with falsified data and justifications', 'Request a bank statement from another bank only', "Update the customer's job title"] },
        ar: { q: 'أثناء مراجعة العناية الواجبة المعززة (EDD)، قدّم عميل خطاط ذو تدفقات نقدية عالية خطاب عمل غير مصدق يدعي أن المبالغ "رواتب"، بينما أثبت التحقيق أنها مصاريف تشغيلية لنشاط خاص يدار لحسابه. ما الإجراء/التصنيف المناسب؟', o: ['قبول الخطاب وإغلاق التنبيه', 'تستر تجاري مع تقديم بيانات وتبريرات زائفة', 'طلب كشف حساب من بنك آخر فقط', 'تعديل المسمى الوظيفي للعميل'] }
      },
      {
        a: 1, tag: 'cc',
        en: { q: 'A customer signed an undertaking not to use his personal account for business purposes, yet monitoring systems detected continuous unidentified deposits used for operating a transportation business. What does this behavior represent?', o: ['Full compliance with the bank undertaking', 'Commercial Concealment and breach of personal account undertakings', 'Exempted business activity', 'Routine data update'] },
        ar: { q: 'وقّع عميل تعهداً بعدم استخدام حسابه الشخصي لأغراض تجارية، إلا أن أنظمة المراقبة رصدت إيداعات مجهولة مستمرة تُستخدم لإدارة نشاط نقل بضائع. ماذا يمثل هذا السلوك؟', o: ['التزام تام بالتعهد المصرفي', 'تستر تجاري ومخالفة تعهدات الحساب الشخصي', 'نشاط تجاري معفي من التراخيص', 'تحديث بيانات عادي'] }
      },
      {
        a: 0, tag: 'cc',
        en: { q: 'Monitoring systems detected repetitive mada card transactions for a business entity executed in cities far from the registered national address of both the entity and the owner (SAMA indicator). What is the primary indicator identified?', o: ['Commercial Concealment red flag (Geographic Discrepancy Indicator – SAMA)', 'Technical POS malfunction', 'Owner travelling on a personal business trip', 'Updating the entity\'s financial statements'] },
        ar: { q: 'رصدت أنظمة المراقبة استخداماً متكرراً لبطاقة مدى الخاصة بكيان تجاري في مدن بعيدة جداً عن العنوان الوطني المسجل لكل من المنشأة والمالك (مؤشر ساما). ما المؤشر الرئيسي المستفاد؟', o: ['مؤشر اشتباه تستر تجاري (مؤشر التباين الجغرافي – ساما)', 'خلل فني في أجهزة نقاط البيع', 'سفر المالك في رحلة عمل شخصية', 'تحديث القوائم المالية للمنشأة'] }
      },
      {
        a: 1, tag: 'aml',
        en: { q: 'A customer with a monthly salary of SAR 8,000 suddenly receives several large transfers from unrelated individuals, totaling SAR 250,000, and transfers most of the funds abroad within two days. What is the main AML red flag?', o: ['Normal salary activity', 'Rapid movement of funds inconsistent with the customer profile', 'Regular personal transfers', 'Normal international banking'] },
        ar: { q: 'عميل راتبه الشهري 8,000 ريال يتلقى فجأة عدة تحويلات كبيرة من أفراد لا تربطهم به علاقة، بإجمالي 250,000 ريال، ويحوّل معظمها إلى الخارج خلال يومين. ما مؤشر الاشتباه الرئيسي في مكافحة غسل الأموال؟', o: ['نشاط راتب طبيعي', 'حركة سريعة للأموال لا تتوافق مع ملف العميل', 'تحويلات شخصية اعتيادية', 'عمليات مصرفية دولية طبيعية'] }
      },
      {
        a: 0, tag: 'aml',
        en: { q: "A customer makes several cash deposits over a short period instead of making one large deposit. The activity does not match the customer's known income or occupation. What could this indicate?", o: ['Structuring of transactions', 'Normal savings behavior', 'Salary payments', 'Investment activity'] },
        ar: { q: 'يقوم عميل بعدة إيداعات نقدية خلال فترة قصيرة بدلاً من إيداع واحد كبير، ولا يتوافق النشاط مع دخله أو مهنته المعروفة. على ماذا قد يدل ذلك؟', o: ['تجزئة العمليات', 'سلوك ادخاري طبيعي', 'دفعات رواتب', 'نشاط استثماري'] }
      },
      {
        a: 1, tag: 'aml',
        en: { q: 'A previously dormant account suddenly starts receiving large transfers from multiple unrelated parties, followed by immediate outgoing transfers. What should this activity be considered?', o: ['Normal account reactivation', 'Potential suspicious activity requiring further review', 'Standard customer behavior', 'No AML concern'] },
        ar: { q: 'حساب كان خاملاً يبدأ فجأة باستقبال تحويلات كبيرة من عدة أطراف لا علاقة بينها، تليها تحويلات صادرة فورية. كيف يجب اعتبار هذا النشاط؟', o: ['إعادة تنشيط طبيعية للحساب', 'نشاط مشتبه به محتمل يستدعي مراجعة إضافية', 'سلوك عميل اعتيادي', 'لا توجد مخاوف تتعلق بغسل الأموال'] }
      },
      {
        a: 1, tag: 'aml',
        en: { q: 'A customer receives funds from several third parties and immediately transfers almost the same amounts to different beneficiaries without a clear economic purpose. Which AML indicator is most relevant?', o: ['Normal account management', 'Rapid pass-through movement of funds', 'Salary activity', 'Regular bill payments'] },
        ar: { q: 'يتلقى عميل أموالاً من عدة أطراف ثالثة ويحوّل فوراً مبالغ مماثلة تقريباً إلى مستفيدين مختلفين دون غرض اقتصادي واضح. ما المؤشر الأكثر صلة في مكافحة غسل الأموال؟', o: ['إدارة اعتيادية للحساب', 'مرور سريع للأموال عبر الحساب', 'نشاط رواتب', 'سداد فواتير منتظمة'] }
      },
      {
        a: 1, tag: 'aml',
        en: { q: 'A customer is asked about the source and purpose of unusually large transactions but provides inconsistent explanations and refuses to provide supporting documents. What is the appropriate AML concern?', o: ['No concern if the customer is existing', 'Potential suspicious activity requiring escalation', 'Close the account immediately', 'Ignore the transactions'] },
        ar: { q: 'عند سؤال عميل عن مصدر وغرض عمليات كبيرة وغير معتادة، يقدّم تفسيرات متناقضة ويرفض تقديم مستندات داعمة. ما المخاوف المناسبة؟', o: ['لا توجد مخاوف إذا كان العميل قائماً', 'نشاط مشتبه به محتمل يستدعي التصعيد', 'إغلاق الحساب فوراً', 'تجاهل العمليات'] }
      }
    ]
  },

  /* ───────────────────────── REGULATORY ADVISORY · QUICK QUIZ ───────────────────────── */
  'reg-quiz': {
    unit: 'regulatory', type: 'quiz',
    questions: [
      {
        a: 0,
        en: { q: "Compliance is the responsibility of each ________ of the bank and an integral part of the bank's business and operational activities.", o: ['Employee', 'Manager', 'Head of Department', 'Non-Executive Director'] },
        ar: { q: 'الالتزام مسؤولية كل ________ في البنك وجزء لا يتجزأ من أنشطة أعمال البنك وأنشطته التشغيلية.', o: ['موظف', 'مدير', 'رئيس القسم', 'مدير غير تنفيذي'] }
      },
      {
        a: 1,
        en: { q: '________ is responsible for providing advice, interpretation and guidance to implement regulatory developments.', o: ['Regulatory Affairs unit of Regulatory Compliance (RAU)', 'Local Compliance Officer of Regulatory Compliance (LCOs)', 'Business Line and/or Function', 'Operation & Resilience Risk of Risk Management (ORR)', 'Business Risk and Control Managers (BRCM) in each business and function'] },
        ar: { q: '________ يتحمل/تتحمل مسؤولية تقديم المشورة والتوضيحات والتوجيهات من أجل تنفيذ التطوير التنظيمي.', o: ['وحدة الشؤون التنظيمية التابعة لإدارة الالتزام التنظيمي', 'مسؤول الالتزام المحلي بإدارة الالتزام التنظيمي', 'وحدة الأعمال و/أو الوحدة الوظيفية', 'إدارة المخاطر المتعلقة بالتشغيل والمرونة', 'مديرو المخاطر المتعلقة بالأعمال والرقابة في كل وحدة عمل ووحدة وظيفية'] }
      },
      {
        a: 2,
        en: { q: '________ is responsible for implementing changes in order to comply with new or amended rules and regulations.', o: ['Regulatory Affairs unit of Regulatory Compliance (RAU)', 'Local Compliance Officer of Regulatory Compliance (LCOs)', 'Business Line and/or Function', 'Operation & Resilience Risk of Risk Management (ORR)', 'Business Risk and Control Managers (BRCM) in each business and function'] },
        ar: { q: '________ تتحمل مسؤولية تنفيذ التغييرات بهدف الالتزام بالقواعد واللوائح الجديدة أو المعدّلة.', o: ['وحدة الشؤون التنظيمية بإدارة الالتزام', 'مسؤول الالتزام المحلي بإدارة الالتزام', 'إدارات الأعمال و/أو الإدارات الوظيفية', 'إدارة المخاطر المتعلقة بالتشغيل والمرونة', 'مديرو المخاطر المتعلقة بالأعمال والرقابة في كل وحدة عمل ووحدة وظيفية'] }
      },
      {
        a: 0, fixed: true, tag: 'tf',
        en: { q: 'True or False: Not submitting due periodic reports or answers to ad hoc regulatory requests in a timely manner, as well as incomplete/incorrect responses, may lead to regulatory fines and penalties.', o: ['True', 'False'] },
        ar: { q: 'صح أم خطأ: قد يؤدي عدم تقديم التقارير الدورية المطلوبة، والاستجابة للطلبات التنظيمية في الوقت المناسب، وكذلك الاستجابات غير المكتملة/غير الصحيحة، إلى فرض غرامات وعقوبات تنظيمية.', o: ['صح', 'خطأ'] }
      },
      {
        a: 0,
        en: { q: '________ works as the main point of contact during the course of a Regulatory Engagement and maintains the record of such events.', o: ['Regulatory Affairs department', 'Operation & Resilience Risk of Risk Management (ORR)', 'Business Risk and Control Managers (BRCM) in each business and function', 'Business (RBWM and Wholesale)', 'Legal Affairs (Chief Legal Officer)'] },
        ar: { q: '________ تقوم بالعمل كنقطة اتصال رئيسية أثناء المشاركة التنظيمية والاحتفاظ بسجل لمثل هذه الأنشطة.', o: ['قسم الشؤون التنظيمية', 'إدارة المخاطر المتعلقة بالتشغيل والمرونة', 'مديرو المخاطر المتعلقة بالأعمال والرقابة في كل وحدة عمل ووحدة وظيفية', 'الأعمال (مصرفية الأفراد وإدارة الثروات ومصرفية الشركات)', 'الشؤون القانونية (الرئيس التنفيذي للشؤون القانونية)'] }
      },
      {
        a: 0,
        en: { q: 'As per the regulatory guidelines, obtaining SAMA non-objection before providing customer data to any governmental and non-governmental entities is ________.', o: ['A must', 'Optional', 'Not required', 'Not applicable'] },
        ar: { q: 'وفقاً للإرشادات التنظيمية، فإن الحصول على عدم ممانعة من البنك المركزي السعودي قبل تقديم بيانات العميل إلى أي جهات حكومية وغير حكومية هو ________.', o: ['مطلب حتمي', 'إجراء اختياري', 'غير مطلوب', 'غير منطبق'] }
      },
      {
        a: 0, fixed: true, tag: 'tf',
        en: { q: 'Is this a Conflict of Interest? "Outside business activities of an employee (not declared and disclosed to HR)"', o: ['True', 'False'] },
        ar: { q: 'هل يعد المثال التالي تضارباً في المصالح؟ "الأنشطة التجارية الخارجية للموظف (التي لم يعلن عنها أو يبلغ بها الموارد البشرية)"', o: ['عبارة صحيحة', 'عبارة خاطئة'] }
      },
      {
        a: 0, fixed: true, tag: 'tf',
        en: { q: 'Is this a Conflict of Interest? "Accepting trips and gifts from a customer/vendor (not disclosed to HR and Anti-Fraud)"', o: ['True', 'False'] },
        ar: { q: 'هل يعد المثال التالي تضارباً في المصالح؟ "قبول الرحلات والهدايا من العميل/المورِّد (دون الكشف عنها لإدارة الرشوة والفساد)"', o: ['عبارة صحيحة', 'عبارة خاطئة'] }
      },
      {
        a: 3,
        en: { q: 'All ________ must escalate issues related to Compliance, Conduct and Malpractice, or where an event could lead to a regulatory fine or investigation.', o: ['SAB Managers', 'SAB Heads of Department', 'SAB Non-Executive Directors', 'SAB Individuals'] },
        ar: { q: 'يجب على جميع ________ تصعيد المشكلات المتعلقة بالالتزام والسلوك وسوء الممارسة، أو التي قد يؤدي حدوثها إلى غرامة تنظيمية أو تحقيقات من جهات خارجية.', o: ['مدراء البنك السعودي الأول', 'رؤساء أقسام البنك السعودي الأول', 'أعضاء مجلس إدارة البنك السعودي الأول غير التنفيذيين', 'منسوبي البنك السعودي الأول'] }
      },
      {
        a: 1, fixed: true, tag: 'tf',
        en: { q: 'True or False: Only SAB Managers & Heads of Department are allowed to escalate issues related to Compliance, Conduct and Malpractice, or where an event could lead to a regulatory fine or investigation.', o: ['True', 'False'] },
        ar: { q: 'صح أم خطأ: يُسمح فقط لمدراء ورؤساء الأقسام في البنك السعودي الأول بتصعيد المشكلات المتعلقة بالالتزام والسلوك وسوء التصرف، أو التي قد يؤدي حدوثها إلى غرامة تنظيمية أو تحقيق.', o: ['عبارة صحيحة', 'عبارة خاطئة'] }
      }
    ]
  },

  puzzle: { unit: 'puzzle', type: 'puzzle' }
};

const TAGS = {
  cc: { en: 'Commercial Concealment', ar: 'التستر التجاري' },
  aml: { en: 'AML', ar: 'مكافحة غسل الأموال' },
  tf: { en: 'True or False', ar: 'صح أم خطأ' }
};

module.exports = { UNITS, GAMES, GAME_TYPES, PUZZLE, TAGS };
