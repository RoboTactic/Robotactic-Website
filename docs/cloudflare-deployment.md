# إطلاق RoboTactic على Cloudflare

## القرار المناسب للكود الحالي

الواجهة React/Vite والـAPI المكتوب بـExpress يعملان على **Worker واحد مع Static Assets**. الطلبات تحت `/api` تصل إلى الخلفية، وبقية المسارات تعرض الواجهة مع دعم فتح روابط React مباشرة. قاعدة PostgreSQL والصور تبقيان في Supabase، ويتصل Worker بقاعدة البيانات عبر Hyperdrive. لا تحتاج خادم Node دائمًا لهذا المسار.

Hyperdrive يدير اتصالات PostgreSQL؛ لا يستضيف قاعدة PostgreSQL نفسها. D1 يستخدم SQLite، والتحول إليه يحتاج تعديل المخطط والاستعلامات وطبقة قاعدة البيانات؛ ليس بديلًا مباشرًا لملف SQL الحالي. لا توجد حاجة لهذه الهجرة من أجل الإطلاق.

## 1. الأدوات والحسابات

- استخدم Node.js بإصدار يدعمه `cf` المثبت: `22.23+` ضمن سلسلة 22، أو `24.22+` ضمن سلسلة 24، أو `26.12+` ضمن سلسلة 26. يُفضّل سلسلة LTS مدعومة.
- حساب Cloudflare مع Workers Paid. الإعداد يخصص 1000ms CPU للطلب؛ تحقق كلمات المرور بـscrypt يحتاج هامشًا أعلى من حصة Free. راجع الاستخدام والفوترة بعد الإطلاق.
- مشروع Supabase للإنتاج، مع نسخة احتياطية قبل ترقية قاعدة قائمة.
- حدّد رابط الموقع النهائي؛ يمكن البدء بعنوان `workers.dev` ثم إضافة النطاق.

من جذر المستودع:

```powershell
npm ci
npm --prefix backend ci
npm --prefix frontend ci
npx cf auth login
```

الـCLI وCloudflare Vite plugin حاليًا Beta؛ إصداراتهما مثبتة في `package-lock.json`. لا يلزم تثبيت Wrangler أو تحويل الخلفية إلى Next.js.

## 2. قاعدة البيانات

ضَع إعدادات اتصال الإدارة في `backend/.env` محليًا فقط، وفق `backend/.env.example`. فعّل `DATABASE_SSL=true` واستخدم شهادة CA عند الحاجة؛ لا تعطّل التحقق من الشهادة.

لقاعدة جديدة فارغة فقط، شغّل `npm --prefix backend run schema` مرة واحدة. لقاعدة موجودة، تجاوز هذه الخطوة. ثم طبّق الترحيلات:

```powershell
npm --prefix backend run db:migrate
```

أنشئ أول Super Admin إن لم يكن لديك حساب صالح:

```powershell
npm --prefix backend run admin:create
```

هذه الأوامر تعمل محليًا باتصال إدارة؛ لا تُشغَّل تلقائيًا عند بناء الموقع. لا تشغّل seed في الإنتاج إلا إذا كنت تقصد إضافة بيانات تجريبية.

أنشئ حساب PostgreSQL منفصلًا باسم `robotactic_app`، دون صلاحيات إدارة أو ملكية الجداول. مثلًا، من جلسة `psql` آمنة متصلة بحساب مالك المخطط:

```sql
CREATE ROLE robotactic_app LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOBYPASSRLS;
\password robotactic_app
```

الأمر `\password` يطلب كلمة المرور تفاعليًا؛ استخدم قيمة عشوائية قوية واحفظها في مدير كلمات مرور. إذا كان الدور موجودًا، تجاوز إنشاؤه. نفّذ بعدها `backend/database/runtimePermissions.sql` بحساب مالك المخطط. يحدد الملف الجداول والعمليات اللازمة للتطبيق ويدعم الجداول المحمية بـRLS دون منح صلاحيات لزوار Supabase Data API. لا يمنح صلاحيات على مخطط Storage؛ رفع الصور يستعمل مفتاح Supabase الخلفي.

لم يُطبَّق هذا الملف على قاعدة إنتاج أثناء التجهيز. بعد تنفيذه، اختبر القراءة وإنشاء/تحديث محتوى من لوحة الإدارة. إذا أضفت جداول أو فعّلت RLS على جداول أخرى لاحقًا، راجع منح الصلاحيات والسياسات المناسبة لها.

## 3. Hyperdrive

من لوحة Cloudflare أنشئ Hyperdrive configuration باسم واضح، وحدد PostgreSQL ومعلومات اتصال Supabase الخاصة بالدور `robotactic_app`. استخدم الاتصال المباشر بقاعدة البيانات وفق دليل Cloudflare/Supabase؛ Hyperdrive يتولى تجميع الاتصالات. فعّل TLS إلى المصدر ولا تستخدم حساب `postgres` الإداري للتطبيق.

**عطّل Query caching لهذا الاتصال.** تغييرات الحسابات والصلاحيات وإظهار الأقسام يجب أن تقرأ الحالة الحالية. Hyperdrive لا يُبطل نتائج SELECT المخزنة تلقائيًا بعد الكتابة. يبقى تجميع الاتصالات فعالًا مع تعطيل الكاش.

انسخ Configuration ID إلى `HYPERDRIVE_ID`. لا تضع كلمة مرور PostgreSQL أو رابط اتصالها في إعدادات الواجهة أو في Git. تحفظ معلومات المصدر داخل إعداد Hyperdrive.

## 4. متغيرات البناء والأسرار

انسخ `frontend/.env.example` إلى `frontend/.env` واضبط:

| المتغير | القيمة المطلوبة |
| --- | --- |
| `HYPERDRIVE_ID` | معرّف إعداد Hyperdrive الحقيقي، 32 خانة hexadecimal |
| `CORS_ORIGINS` | أصل الموقع كاملًا بـHTTPS، دون مسار أو شرطة نهائية؛ افصل أكثر من أصل بفاصلة |
| `SUPABASE_URL` | عنوان مشروع Supabase المستخدم لتخزين الصور |
| `VITE_API_BASE_URL` | `/api`؛ بناء Cloudflare يثبّت هذه القيمة حتى لو كانت إعدادات التطوير مختلفة |

أضف رابط `workers.dev` الفعلي إلى CORS إذا كنت ستستخدمه للدخول. عند إضافة نطاق مخصص، حدّث CORS وأعد البناء والنشر؛ القيم غير السرية هنا تدخل في إعداد النسخة أثناء البناء.

أنشئ ملفًا محليًا خاصًا باسم `frontend/worker.secrets.json` يحتوي مفتاحي `AUTH_TOKEN_SECRET` و`SUPABASE_SECRET_KEY` وقيمهما الفعلية. **لا ترفعه إلى Git أو ترسله في المحادثة.** تجاهله Git مسبقًا. استخدم سر جلسات عشوائيًا لا يقل عن 32 بايت ومفتاح Supabase الخادمي الموجود في إعدادات API Keys. يمكن الاحتفاظ بسر الجلسات الحالي إن كنت تريد استمرار الجلسات؛ تغييره يُنهي صلاحية الجلسات السابقة.

مفتاح Supabase الخلفي مخصص لرفع صور الموقع المعتمدة إلى bucket `robotactic-images`، ولا يوضع في أي متغير يبدأ بـ`VITE_`. لا تحتاج رفع ملفات المشاركين أو جمع بياناتهم لإطلاق الموقع.

## 5. الفحص والنشر

من جذر المستودع:

```powershell
npm test
npm run deploy:check
npm run test:worker
npm run deploy -- --secrets-file worker.secrets.json
```

مسار ملف الأسرار في الأمر الأخير محسوب من `frontend` لأن أمر النشر يعمل داخله. `deploy:check` يبني ويفحص دون رفع. يسمح بمعرّف مؤقت لاختبار البناء، لكن النشر الفعلي يرفض غياب معرّف Hyperdrive الحقيقي وأصول HTTPS الصالحة.

توجد ملاحظة في إصدار `cf` المثبت على Windows: خرج dry-run يعرض فواصل `\` لبعض مسارات الملفات الثابتة. اختبارات المحاكي تؤكد سلامة الملفات والمسارات محليًا، لكنها لا تؤكد رفع الملفات إلى Cloudflare. **نفّذ نشر الإنتاج من بيئة Linux، مثل Workers Builds أو CI، ثم افحص الصور وملفات JS/CSS على الرابط المنشور.** لا يعتمد الإطلاق على فحص dry-run وحده.

للنشر من Workers Builds، اربط مستودع GitHub من حسابك واجعل جذر المشروع جذر المستودع. إعدادات البناء:

- إصدار Node: إصدار مدعوم كما ذُكر أعلاه.
- Build command: `npm ci && npm --prefix backend ci && npm --prefix frontend ci && npm run build`.
- Deploy command: `npm run deploy -- --prebuilt`.
- Build variables: `HYPERDRIVE_ID`, `CORS_ORIGINS`, `SUPABASE_URL`، وتحتاجها مرحلة النشر أيضًا لفحص الإعدادات.
- Runtime secrets: `AUTH_TOKEN_SECRET`, `SUPABASE_SECRET_KEY` في إعدادات Worker؛ لا تضعها في متغيرات Vite أو Git.

إنشاء Worker لأول مرة دون أسرار يجعله يعرض خطأ API آمنًا حتى تضيف الأسرار وتعيد نشره. اربط الأسرار قبل فتح الموقع للجمهور. احتفظ باسم Worker `robotactic` أو عدّله في ملف إعداد Cloudflare قبل أول نشر.

## 6. التحقق بعد النشر

1. افتح `/api/health` وتحقق من HTTP 200. هذا يفحص مسار التطبيق؛ لا ينفذ استعلام قاعدة بيانات.
2. افتح `/api/public/section-visibility` وتحقق من نجاح القراءة؛ هذا يختبر اتصال PostgreSQL الفعلي.
3. افتح الموقع ورابطًا داخليًا مباشرة، وافحص تحميل الشعار والصور والخطوط وملفات JS/CSS.
4. سجّل الدخول بلوحة الإدارة. اختبر حسابًا بصلاحيات محدودة، وحفظ محتوى، وإخفاء قسم ثم إعادة فتحه، ورفع صورة معتمدة. لا تنشئ حسابات مشاركين.
5. راجع العربية والإنجليزية، لوحة المفاتيح، وأحجام 320 و375 و390 بكسل على النسخة المنشورة.
6. أضف النطاق من Worker Settings → Domains & Routes، ثم حدّث CORS وأعد النشر. لا تفعّل Cache Everything على `/api/*`.

تحديد المعدّل عبر bindings يعمل لكل موقع Cloudflare، وليس عدادًا عالميًا صارمًا. تبقى قيود Express الإضافية أيضًا. سجلات API لا تتضمن كلمات المرور أو بيانات الاتصال، والطلبات لا تسجل query strings في إعداد الرصد.

لم يُنشر الموقع ولم يُختبر الاتصال بقاعدة إنتاج ضمن تجهيز الملفات. نجح بناء dry-run واختبار محاكي Workers واختبارات الخلفية. يوجد فشل سابق في `frontend/src/data/team.test.js` بسبب اختلاف أسماء بيانات الفريق عن توقعات الاختبار؛ لم تُعدّل تلك الأسماء ضمن تجهيز النشر.

## المراجع

- [Express على Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/)
- [ربط Supabase بـHyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/)
- [سلوك كاش Hyperdrive](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/)
- [D1 وSQLite](https://developers.cloudflare.com/d1/)
- [حدود Workers](https://developers.cloudflare.com/workers/platform/limits/)
