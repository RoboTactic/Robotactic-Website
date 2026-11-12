/* RoboTactic organizing structure — the single place to update when the team changes.
   Every text is an [Arabic, English] pair (resolved with useLanguage().t). The Arabic list is
   the source of truth for role assignments. No photos, bios or contact details by design. */

export const ROLES = {
  director: ['الرئيس', 'Director'],
  coDirector: ['نائب الرئيس', 'Co-Director'],
  generalManager: ['المدير العام', 'General Manager'],
  viceGeneralManager: ['نائب المدير العام', 'Vice General Manager'],
  leader: ['القائد', 'Leader'],
  viceLeader: ['نائب القائد', 'Vice-Leader'],
  programLeader: ['قائد', 'Program Leader'],
  member: ['عضو الفريق', 'Team member'],
  supervisor: ['المشرف', 'Supervisor'],
  viceSupervisor: ['نائب المشرف', 'Vice Supervisor'],
  committeeMember: ['عضو', 'Member'],
};

/* Media & Marketing committees. Design and Media have no supervisor. */
const marketingCommittees = [
  {
    key: 'design',
    name: ['لجنة التصميم', 'Design'],
    supervisors: [],
    members: [
      ['هديل مسلم الطويرقي', 'Hadeel Muslim Al Twairqi'],
      ['خلود خالد الكريدمي', 'Khulud Khalid Alkraydmi'],
      ['تهاني ماجد الغامدي', 'Tahani Majed Alghamdi'],
      ['بيان عبدالله العتيبي', 'Bayan Abdullah Alotaibi'],
      ['جنى غازي العتيبي', 'Jana Ghazi Alotaibi'],
      ['يارا علي القرني', 'Yara Ali Alqarni'],
      ['مها ماجد صدام', 'Maha Majed Saddam'],
      ['رنيم هشام بامفلح', 'Raneem Hisham Bamufleh'],
    ],
  },
  {
    key: 'marketing',
    name: ['لجنة التسويق', 'Marketing'],
    supervisors: [['ليندا صالح المنهالي', 'Linda Saleh Alminhali']],
    members: [
      ['حنان عبدالحي محمد', 'Hanan Abdulhai Mohammed'],
      ['طيف حافظ الجهوري', 'Taif Hafiz Aljahwari'],
      ['نوره ياسر القحطاني', 'Noura Yaseer Alqatani'],
      ['بيان عطيه المالكي', 'Bayan Atiah Almalki'],
    ],
  },
  {
    key: 'media-monitoring',
    name: ['لجنة الرصد الإعلامي', 'Media Monitoring'],
    supervisors: [['ضياء صالح دبيس', 'Deyya Saleh Dobais']],
    members: [
      ['احمد انوار الحق رشيد', 'Ahmed Anwarulahq Rasheed'],
      ['يارا محمد الغامدي', 'Yara Mohammed Alghamdi'],
      ['دانة خالد الطاسان', 'Danah Khalid Altasan'],
      ['ليان خالد القرني', 'Layan Khalid Alqarni'],
    ],
  },
  {
    key: 'media',
    name: ['لجنة الإعلام', 'Media'],
    supervisors: [],
    members: [
      ['ايناس سالم العتيبي', 'Enas Salem Alotaibi'],
      ['الهام عاضه الحارثي', 'Elham Aaddh Alharthi'],
      ['غسق عدنان بخش', 'Ghasaq Bakhsh'],
      ['جوري عبدالله خلاف', 'Joury Abdullah Khallaf'],
      ['تولين محمود تعباني', 'Tuleen Mahmoud Tabaani'],
    ],
  },
  {
    key: 'unassigned',
    unassigned: true,
    name: ['أعضاء القسم', 'Department Members'],
    members: [
      ['رغد عوض المرامحي', 'Raghad Awad Almramihi'],
      ['ريفال خالد النفيسى', 'Refal Khalid Alnafisi'],
    ],
  },
];

/* Technical Department committees (in its members dialog). The Website Committee is also part of
   this department but keeps its own card on the page — see `websiteCommittee` below. */
const technicalCommittees = [
  {
    key: 'engineering',
    name: ['اللجنة الهندسية', 'Engineering Committee'],
    supervisors: [['المهدي محمد صيرفي', 'Almahdi Mohammed Sairafi']],
    members: [
      ['وسام محمد حلواني', 'Wesam Mohammed Halawani'],
      ['معتز عمرو الحجازي', 'Motaz Amro Alhejazi'],
      ['ليان عايض القرني', 'Layan Ayed Alqarni'],
      ['فاطمه سراج الزهراني', 'Fatima Siraj Alzahrani'],
      ['جنى فيصل النشيري', 'Jana Faisal Alnushayri'],
      ['جوري باسم مصلي', 'Jory Basim Musalli'],
      ['راشد ياسر الدوسري', 'Rashed Yasser Al Dosari'],
      ['ريوف حاتم الجعيد', 'Reoof Hatem Aljuaid'],
    ],
  },
  {
    key: 'advanced-competition',
    name: ['لجنة مسابقة المتقدمين', 'Advanced Competition'],
    supervisors: [['رنا ماهر المصباحي', 'Rana Maher Almisbahi']],
    members: [
      ['براءة ايمن احمد', 'Braah Aymen Ahmed'],
      ['ريتال جابر الجعيد', 'Retal Jaber Aljuaid'],
      ['عبدالاله علي بن حمد', 'Abdulelah Ali Binhimd'],
      ['عبدالرحمن صالح الحربي', 'Abdulrahman Saleh Alharbi'],
      ['دانة احمد الجدعاني', 'Danah Ahmed Algdaani'],
      ['هاشم اسامه سيت', 'Hashim Osama Sait'],
      ['محمد علي سلت', 'Mohammed Ali Salat'],
      ['ضي فهد الغامدي', 'Daee Fahad Alghamdi'],
    ],
  },
  {
    key: 'beginner-competition',
    name: ['لجنة مسابقة المبتدئين', 'Beginner Competition'],
    supervisors: [['كرم عصام مغربل', 'Karam Essam Mugharbel']],
    members: [
      ['فارس بكر فلاته', 'Faris Bakr Fallatah'],
      ['سلاف عادل الأحمدي', 'Solaf Adel Alahmadi'],
      ['صالح احمد اللهيب', 'Saleh Ahmed Allhieb'],
      ['نواف وائل خضري', 'Nawaf Wael Khudary'],
      ['ليان علي الشهري', 'Layan Ali Alshehri'],
      ['رهف عبد العزيز المغربي', 'Rahaf Abdulaziz Almghrabi'],
      ['لارا خالد التميمي', 'Lara Khalid Altamimi'],
      ['محمد ايمن السيد', 'Muhammed Ayman Alsayed'],
    ],
  },
  {
    key: 'unassigned',
    unassigned: true,
    name: ['أعضاء القسم', 'Department Members'],
    members: [
      ['ليان عبدالملك الزهراني', 'Layan Abdulmalik Alzhrani'],
      ['ايلاف احمد العمرو', 'Elaf Ahmed Alamro'],
      ['نواف حمد الحربي', 'Nawaf Hamad Alharbi'],
      ['فواز دخيل الدخيل', 'Fawaz Dakhil Aldakhil'],
      ['يارا سعيد العمر', 'Yara Saeed Alomar'],
    ],
  },
];

/* Programs committees. `viceSupervisors` is optional. */
const programsCommittees = [
  {
    key: 'in-person-workshops',
    name: ['لجنة الورش الحضورية', 'In-Person Workshops'],
    supervisors: [['بدر فهد الجعيد', 'Badr Fahad Aljuaid']],
    members: [
      ['رغد عبدالكريم بن جحلان', 'Raghad Abdulkarim Bin Jahlan'],
      ['شهد منصور هزازي', 'Shahad Mansour Hazzazi'],
      ['جوري خالد الصبحي', 'Jury Khaled Alsubhi'],
      ['غلا فيصل زميم', 'Ghala Faisal Zameem'],
      ['ميرال سامر جاوي', 'Meral Samer Jawi'],
      ['شذى عمر باعربي', 'Shatha Omar Baarabi'],
      ['لارا خالد الحميدي', 'Lara Khaled Alhamidi'],
    ],
  },
  {
    key: 'hackathon',
    name: ['لجنة البرمجان', 'Hackathon'],
    supervisors: [['الهنوف فهد ابوعلي', 'Alhanouf Fahad AbuAli']],
    viceSupervisors: [['اصايل عبدالله اللحياني', 'Asayl Abdullah Allhyani']],
    members: [
      ['داليا خضر فروان', 'Dalia Khader Farwan'],
      ['شهد عبدالله الحربي', 'Shahad Abdullah Alharbi'],
      ['دانه عبدالله القحطاني', 'Dana Abdullah Alqahtani'],
      ['سيرين عبدالرحمن القرني', 'Seren Abdulrhman Alqarni'],
      ['اسماء عبدالرحمن العطاس', 'Asma Abdulrahman Alattas'],
      ['علي حسن الفار', 'Ali Hassan Alfar'],
      ['جنى زامل الشمراني', 'Jana Zamil Alshamrani'],
    ],
  },
  {
    key: 'entertainment',
    name: ['لجنة الترفيه', 'Entertainment'],
    supervisors: [['جود محمد العتيبي', 'Joud Mohammad Altaibi']],
    members: [
      ['رينا محمد ديان', 'Rina Mohammed Deyan'],
      ['جوري خالد العمودي', 'Jori Khalid Alamoudi'],
      ['غلا عبدالعزيز المطيري', 'Ghala Abdulaziz Al Mutairi'],
      ['عبدالله خليف الحربي', 'Abdullah Khulaif Alharbi'],
      ['جنا ناصر الظاهري', 'Jana Naser Aldhahery'],
    ],
  },
  {
    key: 'speakers',
    name: ['لجنة المتحدثين', 'Speakers'],
    supervisors: [['دانه اديب الدوسري', 'Danah Adeeb Aldawsari']],
    members: [
      ['تالا أحمد الغامدي', 'Tala Ahmed Alghamdi'],
      ['رنا ياسر طاهر', 'Rana Yaser Taher'],
      ['جنى علي الغامدي', 'Jana Ali Alghamdi'],
      ['ريتاج عبدالله العدواني', 'Retaj Abdullah Aladwani'],
    ],
  },
  {
    key: 'remote-workshops',
    name: ['لجنة الورش عن بعد', 'Remote Workshops'],
    supervisors: [['مياس طلال الحربي', 'Mayas Talal Alharbi']],
    members: [
      ['ميان عبدالله المزين', 'Mayan Abdullah Almuzayn'],
      ['عائشة عيدروس شهاب', 'Aishah Aidarus Shihab'],
      ['جمانة خالد النفيعي', 'Jumana Khaled Alnefaie'],
      ['ديما عبدالهادي الجهني', 'Deema Abdulhadi Aljehani'],
      ['دانه موسى المزروعي', 'Danah Moosa Almazroui'],
    ],
  },
  {
    key: 'unassigned',
    unassigned: true,
    name: ['أعضاء القسم', 'Department Members'],
    members: [
      ['طيف سعيد الجحدلي', 'Taif Saeed Aljahdali'],
      ['وريف عادل السفري', 'Wareef Adel Alsefri'],
    ],
  },
];

/* Human Resources committees — opened from the department card on the Team page.
   Each committee: its supervisors (usually one), then its members. Names are [Arabic, English]. */
const hrCommittees = [
  {
    key: 'recruitment',
    name: ['لجنة الاستقطاب والتطوع', 'Recruitment & Volunteering'],
    supervisors: [['وسن محمد القحطاني', 'Wasan Mohammed Alqahtani']],
    members: [
      ['حلا سعد المطيري', 'Hala Saad Almutairi'],
      ['ريم موسى الامير', 'Reem Mousa Alamir'],
      ['ساره فايز الجهني', 'Sara Fayez Aljehani'],
    ],
  },
  {
    key: 'training',
    name: ['لجنة التدريب والتطوير', 'Training & Development'],
    supervisors: [['ليان احمد الغامدي', 'Layan Ahmed Alghamdi']],
    members: [
      ['رميز فهد عشري', 'Rameez Fahad Ashri'],
      ['رغد رشدي صقر', 'Raghad Rushdi Saqer'],
      ['نواف عمر الغامدي', 'Nawaf Omar Alghamdi'],
    ],
  },
  {
    key: 'scheduling',
    name: ['لجنة الجدولة والمناوبات والحضور', 'Scheduling, Shifts & Attendance'],
    supervisors: [['ليان محمد صيقل', 'Layan Mohammed Saigal']],
    members: [
      ['ليان فايق حناوي', 'Layan Faiq Hennawi'],
      ['ميار اسامه منصوري', 'Mayar Osama Mansouri'],
    ],
  },
  {
    key: 'screening',
    name: ['لجنة الفرز والمقابلات والتوزيع', 'Screening, Interviews & Placement'],
    supervisors: [['الاء علي آل عيد', 'Alaa Ali Al Eid']],
    members: [
      ['رانية عادل الزهراني', 'Raniah Adel Alzahrani'],
      ['مها سامر سلطان', 'Maha Samer Sultan'],
      ['رجاوي خالد الجلسي', 'Rajawi Khaled Aljalsi'],
      ['رزان احمد الطيب', 'Razan Ahmad Altayyeb'],
    ],
  },
  {
    key: 'recognition',
    name: ['لجنة التحفيز والتكريم', 'Motivation & Recognition'],
    supervisors: [['فهد بندر العوفي', 'Fahad Bandar AlOufi']],
    members: [
      ['ريفان عبدالعزيز الحذيفي', 'Refan Abdulaziz Alhuzaifi'],
      ['ريلام محمد كردي', 'Relam Mohammed Kurdi'],
      ['ريم علي الروقي', 'Reem Ali Alruqi'],
      ['نواف فهد ناصر الجعيد', 'Nawaf Fahad Nasser Aljuaid'],
    ],
  },
];

/* Public Relations committees. The last group has no supervisor: members not assigned to a committee. */
const prCommittees = [
  {
    key: 'sponsorships',
    name: ['لجنة الرعايات', 'Sponsorships'],
    supervisors: [['شهد عبداللطيف الصبحي', 'Shahad Abdullatif Alsubhi']],
    members: [
      ['مها حسين اليامي', 'Maha Hussain Alyami'],
      ['عمر محمد الغامدي', 'Omar Mohammed Alghamdi'],
      ['مهنا خالد السلمي', 'Muhanna Khaled Alsulami'],
      ['جمانه احمد عويضه', 'Jomana Ahmad Owaida'],
      ['احلام محمد حدادي', 'Ahlam Mohammed Haddadi'],
      ['فارس صديق نورالهي', 'Faris Saddiq Noor Elahi'],
      ['رهام صالح عثمان', 'Reham Saleh Othman'],
      ['لورا خالد الحريري', 'Laura Khaled Alhariri'],
    ],
  },
  {
    key: 'guests',
    name: ['لجنة الضيوف والدعوات', 'Guests & Invitations'],
    supervisors: [['ليان عمر البقمي', 'Layan Omar Albuqami']],
    members: [
      ['لين حامد الشطيري', 'Leen Hamed Alshatiri'],
      ['سعود عبدالله ال الحارث', 'Saud Abdullah Al Alhareth'],
      ['رحمت الله عبدالقهار مولاداد الرحماني', 'Rahmatullah AbdulQahar Mouladad Rahmani'],
      ['شروق حسن حكمي', 'Shroog Hasan Hakami'],
    ],
  },
  {
    key: 'permits',
    name: ['لجنة التصاريح', 'Permits'],
    supervisors: [['محمد احمد جستنيه', 'Mohammed Ahmad Justanieah']],
    members: [
      ['شادي محمد برناوي', 'Shadi Mohammed Brnawi'],
      ['غلا عادل الجحدلي', 'Ghala Adel Aljahdali'],
      ['أحمد علي أحمد الزبيدي', 'Ahmed Ali Ahmed Alzubaidi'],
    ],
  },
  {
    key: 'unassigned',
    unassigned: true,
    name: ['أعضاء القسم', 'Department Members'],
    members: [
      ['نعمه هادي مجرشي', 'Nimah Hadi Majrashi'],
      ['وعد محمد الجدعاني', 'Waad Mohammed Aljedaani'],
    ],
  },
];

/* Planning committees. A committee may have no supervisor or more than one. */
const planningCommittees = [
  {
    key: 'main-competitions',
    name: ['لجنة المسابقات الرئيسية', 'Main Competitions'],
    supervisors: [['حمزه عادل ابوعسكر', 'Hamzah Adel AbuAskar']],
    members: [
      ['تولين فواز مريعاني', 'Toleen Fawaz Mereani'],
      ['شادن حسين البارقي', 'Shaden Hussain Albargi'],
      ['يوسف رائد باعشن', 'Yousef Raed Baeshen'],
      ['لبنى محمد هديش', 'Lubna Mohmmed Hedeesh'],
    ],
  },
  {
    key: 'student-separation',
    name: ['لجنة الفصل بين الطلاب والطالبات', 'Male & Female Student Sections'],
    supervisors: [['تميم محمد المزروعي', 'Tamim Mohammed Almazrui']],
    members: [
      ['أميره مناحي البقمي', 'Amirah Manahi Albuqami'],
      ['ليان ابراهيم بهكلي', 'Layan Ibrahim Bahkali'],
      ['سعد فهد الغامدي', 'Saad Fahd Alghamdi'],
      ['وسن إبراهيم الحربي', 'Wasan Ibrahim Alharbi'],
      ['رغد نايف العساف', 'Raghad Naif Alassaf'],
    ],
  },
  {
    key: 'defense-exhibition',
    name: ['لجنة معرض المشاريع الدفاعية', 'Defense Projects Exhibition'],
    supervisors: [],
    members: [
      ['عبدالعزيز سعيد القحطاني', 'Abdulaziz Saeed Alqahtani'],
      ['منار عتقى الجهني', 'Manar Etga Aljehani'],
      ['حنان علي الجهني', 'Hanan Ali Aljehani'],
      ['شهد مديس المالكي', 'Shahad Mudays Almalki'],
      ['نهى محمد الصابوني', 'Nuha Mohammed Sabouni'],
    ],
  },
  {
    key: 'innovation-exhibition',
    name: ['لجنة معرض الابتكارات والاختراعات', 'Innovations & Inventions Exhibition'],
    supervisors: [
      ['بدر علي القحطاني', 'Bader Ali Alqahtani'],
      ['ريان مختار العريشي', 'Rayan Mukhtar Alarishi'],
    ],
    members: [
      ['لينا سعيد الغامدي', 'Leena Saeed Alghamdi'],
      ['ذكرى الغامدي', 'Thikra Alghamdi'],
      ['رغد خالد الزهراني', 'Raghad Khaled Alzahrani'],
      ['جمانة ابراهيم النهدي', 'Jumanah Ibrahim Alnahdi'],
      ['جود سليمان ميمني', 'Jood Sulaiman Maimani'],
    ],
  },
  {
    key: 'closing-ceremony',
    name: ['لجنة الحفل الختامي', 'Closing Ceremony'],
    supervisors: [['تولين محمود العطوي', 'Tulin Mahmoud Alatawe']],
    members: [
      ['ريماس محمد مصلوف', 'Remas Muhmmad Mslwf'],
      ['سارة القحطاني', 'Sara Alqahtani'],
      ['لين لواء بخاري', 'Leen Lewaa Bukhari'],
      ['انمار بندر باصمد', 'Anmar Bandar Basamad'],
    ],
  },
];

/* People in a department's committees (supervisors + members), and the number of real committees. */
export const supervisorsOf = (c) => c.supervisors ?? [];
/* Supervisors, then vice supervisors, each with its role — the highlighted rows at the top of a committee. */
export const committeeLeadsOf = (c) => [
  ...supervisorsOf(c).map((name) => ({ role: ROLES.supervisor, name })),
  ...(c.viceSupervisors ?? []).map((name) => ({ role: ROLES.viceSupervisor, name })),
];
export const committeeSize = (c) => committeeLeadsOf(c).length + c.members.length;
export const committeeHeadcount = (dept) => (dept.committees ?? []).reduce((n, c) => n + committeeSize(c), 0);
export const committeeCount = (dept) => (dept.committees ?? []).filter((c) => !c.unassigned).length;

/* Executive leadership, top tier first. */
export const leadershipTiers = [
  { key: 'director', members: [{ role: ROLES.director, name: ['راشد آل حوته', 'Rashed Al Hota'] }] },
  {
    key: 'co-directors',
    members: [
      { role: ROLES.coDirector, name: ['سديم الجهني', 'Sadeem Aljehani'] },
      { role: ROLES.coDirector, name: ['سارة الزهراني', 'Sarah Alzahrani'] },
    ],
  },
  {
    key: 'management',
    members: [
      { role: ROLES.generalManager, name: ['نواف الغامدي', 'Nawaf Alghamdi'] },
      { role: ROLES.viceGeneralManager, name: ['أسعد صدقه', 'Assad Sdaqh'] },
    ],
  },
];

/* `icon` names come from components/Icon/icons.js.
   `leadRoles` (optional) overrides the [leader, viceLeader] titles — Programs has two equal Program Leaders. */
export const departments = [
  { key: 'ambassadors', icon: 'globe', name: ['قسم السفراء', 'Ambassadors Department'], leader: ['عبدالعزيز الزهراني', 'Abdulaziz Alzahrani'], viceLeader: ['حلا عسيري', 'Hala Asiri'] },
  { key: 'media-marketing', icon: 'megaphone', name: ['قسم التسويق', 'Media & Marketing'], leader: ['أسماء وهيب', 'Asmaa Waheeb'], viceLeader: ['رزان السلمي', 'Razan Alsulami'], committees: marketingCommittees },
  { key: 'planning', icon: 'route', name: ['قسم التخطيط', 'Planning Department'], leader: ['زينب عبدالحليم', 'Zainab Abdulhalim'], viceLeader: ['جوري الغامدي', 'Juri Alghamdi'], committees: planningCommittees },
  { key: 'programs', icon: 'calendar', name: ['قسم البرامج', 'Programs Department'], leader: ['عبدالله السلمي', 'Abdullah Alsulami'], viceLeader: ['موضي القرعاوي', 'Moudi Algarawi'], leadRoles: [ROLES.programLeader, ROLES.programLeader], committees: programsCommittees },
  { key: 'human-resources', icon: 'users', name: ['قسم الموارد البشرية', 'Human Resources'], leader: ['رنده بخاري', 'Randa Bukhari'], viceLeader: ['تالا جبريل', 'Tala Jabril'], committees: hrCommittees },
  { key: 'technical', icon: 'chip', name: ['القسم التقني', 'Technical Department'], leader: ['ريماس محمود', 'Rimas Mahmoud'], viceLeader: ['ليان المتعب', 'Layan Al Meteb'], committees: technicalCommittees },
  { key: 'public-relations', icon: 'chat', name: ['قسم العلاقات العامة', 'Public Relations'], leader: ['عبدالرحمن رجب', 'Abdulrahman Rajab'], viceLeader: ['وليد زكي', 'Waleed Zaki'], committees: prCommittees },
];

/* Website committee: a branch of the Technical Department, not a separate department. */
export const websiteCommittee = {
  department: 'technical',
  name: ['لجنة الموقع', 'Website Committee'],
  branches: [
    { key: 'backend', name: ['الباك إند', 'Back-end'], lead: ['عبد الله السيروان', 'Abdullah Alseyrawan'], members: [['صالح باحكيم', 'Saleh Bahakim']] },
    { key: 'frontend', name: ['الفرونت إند', 'Front-end'], lead: ['ليان الحربي', 'Layan Alharbi'], members: [['معتز السيد', 'Motaz Alsayed'], ['شيماء وهيب', 'Shaima Waheeb']] },
  ],
};

/* The two titles shown on a department card. */
export const leadRolesOf = (d) => d.leadRoles ?? [ROLES.leader, ROLES.viceLeader];

/* Every person once, with their role — used by tests and anything that needs a flat list. */
export const allMembers = () => [
  ...leadershipTiers.flatMap((tier) => tier.members),
  ...departments.flatMap((d) => [
    { role: leadRolesOf(d)[0], name: d.leader, department: d.key },
    { role: leadRolesOf(d)[1], name: d.viceLeader, department: d.key },
    ...(d.committees ?? []).flatMap((c) => [
      ...committeeLeadsOf(c).map((lead) => ({ ...lead, department: d.key, committee: c.name })),
      ...c.members.map((name) => ({ role: ROLES.committeeMember, name, department: d.key, committee: c.name })),
    ]),
  ]),
  ...websiteCommittee.branches.flatMap((branch) => [
    { role: ROLES.leader, name: branch.lead, department: websiteCommittee.department, committee: websiteCommittee.name, branch: branch.key },
    ...branch.members.map((name) => ({ role: ROLES.member, name, department: websiteCommittee.department, committee: websiteCommittee.name, branch: branch.key })),
  ]),
];
