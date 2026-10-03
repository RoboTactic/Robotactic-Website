// Fictional preview records only. No backend requests or persistent storage.
export const text = (ar, en) => [ar, en];
const f = (key, ar, en, type = 'text', options) => ({ key, label: text(ar, en), type, options });
const statuses = [text('مفتوح', 'Open'), text('قريباً', 'Soon'), text('مغلق', 'Closed'), text('مكتمل', 'Full')];
const published = [text('مسودة', 'Draft'), text('منشور', 'Published'), text('قيد المراجعة', 'In review'), text('منتهي', 'Expired')];
export const dashboardSections = {
  competitions: { title: text('إدارة المسابقات', 'Competition management'), singular: text('مسابقة', 'competition'), overline: 'CONTESTS', description: text('إدارة المسابقات والفرق والطلبات المسجلة', 'Manage competitions and registered teams'), fields: [f('title', 'اسم المسابقة', 'Competition name'), f('description', 'وصف المسابقة', 'Description', 'textarea'), f('start', 'تاريخ البداية', 'Start date', 'date'), f('end', 'تاريخ النهاية', 'End date', 'date'), f('capacity', 'الحد الأقصى للفرق', 'Maximum teams', 'number'), f('category', 'التصنيف', 'Category', 'select', [text('حربية', 'Combat'), text('محاكاة', 'Simulation'), text('استشعار', 'Sensing'), text('أخرى', 'Other')]), f('image', 'صورة الغلاف', 'Cover image', 'file')] },
  workshops: { title: text('إدارة ورش العمل', 'Workshop management'), singular: text('ورشة', 'workshop'), overline: 'WORKSHOPS', description: text('إدارة الورش والمدربين والمشاركين المسجلين', 'Manage workshops, instructors and participants'), fields: [f('title', 'اسم الورشة', 'Workshop name'), f('description', 'وصف الورشة', 'Description', 'textarea'), f('instructor', 'اسم المدرب', 'Instructor'), f('date', 'تاريخ الورشة', 'Workshop date', 'date'), f('time', 'وقت الورشة', 'Workshop time', 'time'), f('capacity', 'عدد المقاعد المتاحة', 'Available seats', 'number')] },
  projects: { title: text('معرض المشاريع', 'Project showroom'), singular: text('مشروع', 'project'), overline: 'PROJECTS', description: text('إدارة مشاريع الفرق المشاركة في المعرض', 'Manage team projects in the showroom'), fields: [f('title', 'اسم المشروع', 'Project name'), f('description', 'وصف المشروع', 'Description', 'textarea'), f('team', 'اسم الفريق', 'Team name'), f('leader', 'اسم قائد الفريق', 'Team leader'), f('url', 'رابط المشروع', 'Project URL', 'url'), f('video', 'رابط الفيديو', 'Video URL', 'url'), f('technologies', 'التقنيات المستخدمة', 'Technologies'), f('image', 'صورة المشروع', 'Project image', 'file')] },
  announcements: { title: text('المحتوى والإعلانات', 'Content and announcements'), singular: text('إعلان', 'announcement'), overline: 'CONTENT', description: text('إدارة الإعلانات ونشر المحتوى للمستخدمين', 'Manage announcements and published content'), fields: [f('title', 'عنوان الإعلان', 'Announcement title'), f('description', 'محتوى الإعلان', 'Content', 'textarea'), f('start', 'تاريخ النشر', 'Publish date', 'date'), f('end', 'تاريخ الانتهاء', 'Expiry date', 'date'), f('status', 'حالة النشر', 'Publication status', 'select', published), f('image', 'صورة الإعلان', 'Announcement image', 'file')] },
  permissions: { title: text('الصلاحيات وكلمات المرور', 'Permissions and passwords'), singular: text('منصب', 'role'), overline: 'PERMISSIONS', description: text('الدخول حسب المنصب فقط — بدون أسماء أو بيانات شخصية', 'Access by role, without personal accounts'), fields: [f('title', 'اسم المنصب بالإنجليزية', 'English role name'), f('arabicTitle', 'المسمّى بالعربية', 'Arabic role name'), f('permissions', 'الصلاحيات', 'Permissions', 'select', [text('كل الأقسام', 'All sections'), text('المسابقات', 'Competitions'), text('ورش العمل', 'Workshops')]), f('password', 'كلمة المرور', 'Password', 'password'), f('confirmPassword', 'تأكيد كلمة المرور', 'Confirm password', 'password'), f('status', 'حالة الحساب', 'Account status', 'select', [text('نشط', 'Active'), text('موقوف', 'Inactive')])] },
  teams: { title: text('الفرق المسجلة في المسابقات', 'Registered teams'), singular: text('فريق', 'team'), overline: 'CONTESTS', parent: 'competitions', fields: [f('title', 'اسم الفريق', 'Team name'), f('leader', 'اسم القائد', 'Team leader'), f('competition', 'المسابقة', 'Competition', 'competition'), f('email', 'البريد الإلكتروني للقائد', 'Leader email', 'email'), f('phone', 'رقم الجوال', 'Phone number', 'tel'), f('members', 'أعضاء الفريق', 'Team members', 'textarea')] },
  participants: { title: text('المشاركون المسجلون في الورش', 'Workshop participants'), singular: text('مشارك', 'participant'), overline: 'WORKSHOPS', parent: 'workshops', fields: [f('title', 'الاسم الكامل', 'Full name'), f('email', 'البريد الإلكتروني', 'Email', 'email'), f('workshop', 'الورشة', 'Workshop', 'workshop'), f('phone', 'رقم الجوال', 'Phone number', 'tel'), f('institution', 'الجهة التعليمية', 'Institution'), f('notes', 'ملاحظات', 'Notes', 'textarea')] },
};
const record = (id, title, status, values) => ({ id, title, status, ...values });
export const dashboardData = {
  competitions: [
    record('combat', text('تحدي الروبوتات الحربية', 'Combat robotics challenge'), statuses[0], {category: text('حربية', 'Combat'), start:'2026-01-01', end:'2026-01-04', capacity:32}),
    record('simulation', text('تحدي المحاكاة الذكية', 'Smart simulation challenge'), statuses[1], {category: text('محاكاة', 'Simulation'), start:'2026-02-10', end:'2026-02-12', capacity:15}),
    record('sensing', text('تحدي الاستشعار المتقدم', 'Advanced sensing challenge'), statuses[2], {category: text('استشعار', 'Sensing'), start:'2025-12-01', end:'2025-12-03', capacity:18}),
    record('control', text('تحدي التحكم الآلي', 'Automation challenge'), statuses[0], {category: text('أخرى', 'Other'), start:'2026-03-05', end:'2026-03-07', capacity:9}),
  ],
  workshops: [
    record('ai', text('ورشة الذكاء الاصطناعي', 'Artificial intelligence workshop'), statuses[0], {instructor:text('مدرب تجريبي ١', 'Demo instructor 1'), date:'2026-01-20', time:'09:00', capacity:40}),
    record('coding', text('ورشة البرمجة الأساسية', 'Programming basics workshop'), statuses[1], {instructor:text('مدرب تجريبي ٢', 'Demo instructor 2'), date:'2026-02-05', time:'10:00', capacity:12}),
    record('automation', text('ورشة التحكم الآلي', 'Automation workshop'), statuses[3], {instructor:text('مدرب تجريبي ٣', 'Demo instructor 3'), date:'2025-12-10', time:'13:00', capacity:0}),
    record('robotics', text('ورشة الروبوتات المتقدمة', 'Advanced robotics workshop'), statuses[0], {instructor:text('مدرب تجريبي ٤', 'Demo instructor 4'), date:'2026-03-01', time:'14:30', capacity:25}),
  ],
  projects: ['روبوت الحارس الذكي','مركبة الاستكشاف الآلي','نظام الرؤية الحاسوبية','الذراع الآلي متعدد المهام'].map((name,i)=>record('project-'+i,text(name,['Smart guard robot','Autonomous explorer','Computer vision system','Multi-purpose robotic arm'][i]),published[i%2?2:1],{team:text('فريق تجريبي '+(i+1),'Demo team '+(i+1)),leader:text('قائد تجريبي '+(i+1),'Demo leader '+(i+1)),date:'2026-01-10',description:text('مشروع تجريبي للعرض، جاهز لربط البيانات لاحقًا.','Sample project for preview, ready for future data integration.')})),
  announcements: ['افتتاح التسجيل في مسابقة الروبوتات الحربية','ورشة عمل جديدة في الذكاء الاصطناعي','نتائج تحدي المحاكاة لعام 2025','جدول فعاليات معرض المشاريع'].map((name,i)=>record('announcement-'+i,text(name,['Combat robotics registration opens','New AI workshop','2025 simulation results','Project showroom schedule'][i]),published[[1,0,3,1][i]],{start:'2026-01-01',end:'2026-02-01',description:text('هذا محتوى تجريبي لمعاينة الإعلان.','This is sample content for the announcement preview.')})),
  permissions: ['Competition Manager','Workshop Manager','Super Admin'].map((name,i)=>record('role-'+i,text(name,name),text('نشط','Active'),{arabicTitle:[text('مسؤول المسابقات','Competition manager'),text('مسؤول الورش','Workshop manager'),text('المشرف العام','Super administrator')][i],date:'2026-01-15'})),
  teams: Array.from({length:5},(_,i)=>record('team-'+i,text('فريق تجريبي '+(i+1),'Demo team '+(i+1)),null,{competition:['combat','simulation','combat','simulation','sensing'][i],leader:text('قائد تجريبي '+(i+1),'Demo leader '+(i+1)),date:'2026-09-08'})),
  participants: Array.from({length:4},(_,i)=>record('participant-'+i,text('مشارك تجريبي '+(i+1),'Demo participant '+(i+1)),null,{workshop:['ai','coding','coding','automation'][i],email:'—',phone:'—',institution:'—'})),
};

export function getDashboardSection(section) {
  return Object.hasOwn(dashboardSections, section) ? dashboardSections[section] : null;
}

export function filterDashboardRecords(section, { search = '', status = '', category = '', date = '', parentId } = {}) {
  const config = getDashboardSection(section);
  if (!config) return [];
  const query = search.trim().toLocaleLowerCase();
  return dashboardData[section].filter(item => {
    const matchesParent = !config.parent || !parentId || item[section === 'teams' ? 'competition' : 'workshop'] === parentId;
    const searchable = Object.values(item).flat().join(' ').toLocaleLowerCase();
    return matchesParent && (!status || item.status?.[1] === status)
      && (!category || item.category?.[1] === category) && (!date || item.date === date)
      && (!query || searchable.includes(query));
  });
}
