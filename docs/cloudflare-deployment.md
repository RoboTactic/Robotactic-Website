# إطلاق RoboTactic على Cloudflare

## القرار المناسب للكود الحالي

الواجهة React/Vite والـAPI المكتوب بـExpress يعملان على **Worker واحد مع Static Assets**. الطلبات تحت `/api` تصل إلى الخلفية، وبقية المسارات تعرض الواجهة مع دعم فتح روابط React مباشرة. مزود PostgreSQL الحالي هو **Neon**، ويتصل Worker بقاعدة البيانات عبر Hyperdrive. الصور ما زالت تستخدم Supabase Storage وفق التكامل الموجود. لا تحتاج خادم Node دائمًا لهذا المسار.

Hyperdrive يدير اتصالات PostgreSQL؛ لا يستضيف قاعدة PostgreSQL نفسها. D1 يستخدم SQLite، والتحول إليه يحتاج تعديل المخطط والاستعلامات وطبقة قاعدة البيانات؛ ليس بديلًا مباشرًا لملف SQL الحالي. لا توجد حاجة لهذه الهجرة من أجل الإطلاق.

## 1. الأدوات والحسابات

- استخدم Node.js بإصدار يدعمه `cf` المثبت: `22.23+` ضمن سلسلة 22، أو `24.22+` ضمن سلسلة 24، أو `26.12+` ضمن سلسلة 26. يُفضّل سلسلة LTS مدعومة.
- Workers Paid موصى به لتوفير هامش CPU للتحقق من كلمات المرور بـscrypt. فعّل `WORKERS_PAID_PLAN=true` فقط بعد تفعيل الخطة ليخصص الإعداد 1000ms؛ الخطة Free ترفض الحدود المخصصة، لذلك تستخدم المعاينة حدودها الافتراضية. نجح تسجيل الدخول الفعلي أثناء فحص المعاينة، لكن هذا لا يثبت تحمل الضغط على Free.
- مشروع Neon للإنتاج، مع نسخة احتياطية قبل ترقية قاعدة قائمة. راجع [تجهيز Neon](neon-deployment.md).
- حدّد رابط الموقع النهائي؛ يمكن البدء بعنوان `workers.dev` ثم إضافة النطاق.

من جذر المستودع:

```powershell
npm run ci:install
npx cf auth login
```

الـCLI وCloudflare Vite plugin حاليًا Beta؛ إصداراتهما مثبتة في `package-lock.json`. لا يلزم تثبيت Wrangler أو تحويل الخلفية إلى Next.js.

إدارة الاعتماديات هنا عبر **npm**، مع ثلاثة ملفات `package-lock.json` مستقلة في الجذر و`backend` و`frontend`؛ المشروع ليس npm workspace. الأمر `ci:install` يثبّت الأشجار الثلاثة من ملفات القفل مع `--include=dev`، حتى لو كانت بيئة البناء تضبط `NODE_ENV=production` أو تستبعد devDependencies افتراضيًا. لا يكفي `npm ci` في الجذر وحده.

الحزمة `@vitejs/plugin-react` موجودة في `frontend/package.json` وملف قفل npm للواجهة. خطأ `ERR_MODULE_NOT_FOUND` أثناء قراءة `frontend/vite.config.js` يتوافق مع عدم تثبيت اعتماديات الواجهة أو استبعاد أدوات البناء. لا تنقل الحزمة إلى اعتماديات الجذر لمعالجة هذا الخطأ. أُزيل ملف `frontend/pnpm-lock.yaml` القديم لأنه كان يصف إصدارات مختلفة عن npm؛ لا تستخدم pnpm لهذا المسار.

## 2. قاعدة البيانات

ضَع إعدادات اتصال الإدارة في `backend/.env` محليًا فقط، وفق `backend/.env.example`. فعّل `DATABASE_SSL=true` واستخدم شهادة CA عند الحاجة؛ لا تعطّل التحقق من الشهادة.

لقاعدة Neon الجديدة، راجع ملف `backend/database/neon-initialize.sql` ودليل Neon أولًا. الملف يضم المخطط والترحيلات والصلاحيات بمعاملة واحدة، ويرفض قاعدة غير فارغة. لا تطبّقه قبل الموافقة. لا يلزم تكرار schema أو migrations بعد تطبيقه. الأمر التالي لتحديث قواعد قائمة لاحقًا فقط، بعد مراجعة الترحيلات والموافقة على أثرها:

```powershell
npm --prefix backend run db:migrate
```

أنشئ أول Super Admin إن لم يكن لديك حساب صالح:

```powershell
npm --prefix backend run admin:create
```

هذه الأوامر تعمل محليًا باتصال إدارة؛ لا تُشغَّل تلقائيًا عند بناء الموقع. لا تشغّل seed في الإنتاج إلا إذا كنت تقصد إضافة بيانات تجريبية.

حساب التشغيل المقترح هو `robotactic_app`، دون صلاحيات إدارة أو ملكية أو عضوية في أدوار أخرى. اتبع [دليل Neon والدور المحدود](neon-deployment.md). الإنشاء يكون بحالة NOLOGIN وكلمة مرور غير معيّنة؛ تعيين كلمة المرور عبر طلب `psql` المخفي وتفعيل LOGIN يأتيان بعد مراجعة الصلاحيات.

بعد موافقة المستخدم، طُبّقت التهيئة على Neon الجديدة وأُنشئ الدور المحدود وأول Super Admin بكلمات مرور عشوائية محفوظة محليًا خارج Git. نجح تدقيق الصلاحيات وتسجيل الدخول الحقيقي للدور وربط Hyperdrive. تمنع تعليمات المستخدم اللاحقة أي كتابة إضافية على قواعد البيانات خلال فحص المعاينة. لا يمنح SQL وصولًا إلى مخطط Storage؛ رفع الصور يحتاج مفتاح Supabase الخلفي، وهو غير متوفر في النسخة التجريبية. تبقى تفاصيل فحص Supabase السابق في دليله التاريخي.

## 3. Hyperdrive

من لوحة Cloudflare أنشئ Hyperdrive configuration باسم واضح، وحدد PostgreSQL ومعلومات اتصال Neon الخاصة بالدور `robotactic_app`. استخدم الاتصال المباشر غير pooled وفق دليل Cloudflare/Neon؛ Hyperdrive يتولى تجميع الاتصالات. فعّل TLS إلى المصدر ولا تستخدم حساب مالك القاعدة الإداري للتطبيق.

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
npm run ci:check
```

بعد نجاح الفحوصات والموافقة على النشر، يمكن نشر نفس الحزمة محليًا بالأمر التالي، مع مراعاة قيد Linux المذكور أدناه:

```powershell
npm run deploy -- --prebuilt --secrets-file worker.secrets.json
```

مسار ملف الأسرار محسوب من `frontend` لأن أمر النشر يعمل داخله. `deploy:check` يبني ويفحص دون رفع. يسمح بمعرّف مؤقت لاختبار البناء، لكن النشر الفعلي يرفض غياب معرّف Hyperdrive الحقيقي وأصول HTTPS الصالحة.

`ci:check` يشغّل اختبارات الخلفية وفحص أنواع إعداد Cloudflare، ثم يبني مرة واحدة، ويختبر الحزمة بمحاكي Workers، ويفحص نفس الناتج باستخدام `deploy:check -- --prebuilt` دون رفع أو اتصال بقاعدة الإنتاج، ويشغّل جميع اختبارات الواجهة. ملف `.github/workflows/cloudflare-check.yml` يشغّل المسار نفسه على Ubuntu لطلبات الدمج والدفع إلى `master` أو التشغيل اليدوي، دون أسرار أو خطوة نشر. نجح المسار محليًا على Windows وعلى Ubuntu 24.04 عبر WSL. عُدّل اختبار الفريق ليتحقق من البنية بدل تثبيت أسماء أشخاص متغيرة، دون تغيير بيانات الفريق. لم تُرفع هذه التعديلات إلى GitHub بعد.

توجد ملاحظة في إصدار `cf` المثبت على Windows: خرج dry-run يعرض فواصل `\` لبعض مسارات الملفات الثابتة. اختبارات المحاكي تؤكد سلامة الملفات والمسارات محليًا، لكنها لا تؤكد رفع الملفات إلى Cloudflare. **نفّذ نشر الإنتاج من بيئة Linux، مثل Workers Builds أو CI، ثم افحص الصور وملفات JS/CSS على الرابط المنشور.** لا يعتمد الإطلاق على فحص dry-run وحده.

للنشر من Workers Builds، راجع **Settings → Build** في Worker الصحيح. هذه هي القيم المطلوبة؛ وجودها في هذا الدليل لا يغيّر إعدادات لوحة Cloudflare تلقائيًا:

| الإعداد | القيمة |
| --- | --- |
| Repository | `RoboTactic/Robotactic-Website` |
| Production branch | `master` |
| Root directory | `/` (جذر المستودع، وليس `frontend`) |
| Node version | `26.13.0` كما في `.node-version`، أو إصدار يحقق `engines` |
| Build command | `npm run ci:install && npm run ci:check` |
| Deploy command أثناء المراجعة | `npm run deploy:check -- --prebuilt` (فحص فقط) |
| Deploy command بعد نجاح الاختبارات والموافقة | `npm run deploy -- --prebuilt` |

الفحص الفعلي بعد النشر: Worker الجديد `robotactic` لا يملك Git build trigger بعد. بقي `robotactic-website` موجودًا دون تعديل؛ إعداد بنائه الحالي هو Root `/` وBuild command فارغ وDeploy command `npx wrangler deploy` لفرع `master`. لذلك لا يُعتمد عليه لإعادة إنتاج المعاينة. قبل تفعيل النشر الآلي، ارفع التعديلات المراجعة إلى GitHub واربط المستودع بـ`robotactic` بالقيم أعلاه، وأوقف النشر الآلي القديم أو اجعله فحصًا فقط لتجنب نشر متعارض. لم تُغيّر هذه الإعدادات تلقائيًا أثناء نشر المعاينة.

إذا كان هناك Preview command افتراضي يستخدم Wrangler، عطّل نشر الفروع خلال المراجعة أو اجعل أمره `npm run deploy:check -- --prebuilt` أيضًا. لا تترك `npx wrangler deploy` أو `npx wrangler preview` في إعدادات هذا المشروع. بعد تعديل الأوامر امسح Build cache مرة واحدة وأعد البناء من آخر commit يحمل هذه التعديلات.

أوامر الجذر تفوّض التنفيذ باستخدام `npm --prefix frontend`، لذلك يعمل `cf` من `frontend` ويقرأ `frontend/cloudflare.config.ts` مع `--mode cloudflare`. الواجهة تستخدم `frontend/vite.config.js`، والخلفية تدخل الحزمة عبر `backend/worker.mjs`. لا تضف إعداد Wrangler أو إعداد Cloudflare آخر إلى الجذر، ولا تستخدم اكتشاف Vite التلقائي بديلًا عن هذه الأوامر. نجاح `npm run build` يُنتج `frontend/.cloudflare/output/v0/`؛ يحتفظ `--prebuilt` بنفس وضع البناء ولا يعيد بناء نسخة مختلفة.

إعدادات إضافية:

- Build variables: `HYPERDRIVE_ID`, `CORS_ORIGINS`, `SUPABASE_URL`، وتحتاجها مرحلة النشر أيضًا لفحص الإعدادات. `WORKERS_PAID_PLAN` يفعّل حد CPU المخصص للخطة المدفوعة؛ `ENABLE_IMAGE_UPLOADS` يفعّل اشتراط سر تخزين الصور. كلاهما `false` افتراضيًا في المعاينة.
- Runtime secrets: `AUTH_TOKEN_SECRET` مطلوب دائمًا، و`SUPABASE_SECRET_KEY` مطلوب عند `ENABLE_IMAGE_UPLOADS=true`. أضفهما إلى إعدادات Worker؛ لا تضعهما في متغيرات Vite أو Git. عند غياب إعداد التخزين يرفض API رفع الصور برسالة آمنة.
- مصادقة CI: تأكد من توفر `CLOUDFLARE_API_TOKEN` بصلاحيات النشر المطلوبة و`CLOUDFLARE_ACCOUNT_ID` للحساب الصحيح. استخدم أسرار البناء الآمنة عند الحاجة؛ لا تضع قيمة التوكن في الكود. أسرار تشغيل Worker تختلف عن أسرار عملية البناء.

إنشاء Worker لأول مرة دون أسرار يجعله يعرض خطأ API آمنًا حتى تضيف الأسرار وتعيد نشره. اربط الأسرار قبل فتح الموقع للجمهور. احتفظ باسم Worker `robotactic` أو عدّله في ملف إعداد Cloudflare قبل أول نشر.

### الفرق بين `robotactic-website` و`robotactic`

اسم التطبيق الحالي في لوحة Cloudflare هو `robotactic-website`، بينما اسم Worker في الكود وناتج البناء هو `robotactic`. اسم مستودع GitHub لا يحدد اسم Worker. لا تعتمد على تجاوز الاسم تلقائيًا من Workers Builds، ولا توافق على تعديل آلي يحوّل المشروع إلى Wrangler.

المسار المقترح الآمن: احتفظ بالتطبيق الحالي، وأنشئ أو استخدم Worker منفصلًا باسم `robotactic`، واربطه بنفس المستودع وفرع `master` بالأوامر السابقة. أبقِ أمر النشر على الفحص فقط أثناء المراجعة، ولا تربط الدومين الأساسي. أضف أسرار التشغيل وإعدادات Hyperdrive إلى Worker المستهدف؛ لا تفترض أنها تنتقل من التطبيق القديم. بعد نجاح CI والموافقة، اختبر أول نشر على `workers.dev` قبل ربط الدومين.

البديل هو اعتماد `robotactic-website` اسمًا نهائيًا وتحديث اسم Worker في `frontend/cloudflare.config.ts` وإعادة الاختبارات وإعدادات الروابط والأسرار ذات الصلة. هذا قرار منفصل؛ لم يُغيَّر اسم Worker ضمن الإصلاح. لا تحذف التطبيق الحالي أو أي بيانات Supabase لأي من الخيارين.

## 6. التحقق بعد النشر

1. افتح `/api/health` وتحقق من HTTP 200. هذا يفحص مسار التطبيق؛ لا ينفذ استعلام قاعدة بيانات.
2. افتح `/api/public/section-visibility` وتحقق من نجاح القراءة؛ هذا يختبر اتصال PostgreSQL الفعلي.
3. افتح الموقع ورابطًا داخليًا مباشرة، وافحص تحميل الشعار والصور والخطوط وملفات JS/CSS.
4. سجّل الدخول بلوحة الإدارة وافحص القراءة والصلاحيات. اختبارات حفظ المحتوى أو تغيير الإظهار أو رفع الصور تحتاج موافقة مستقلة على الكتابة؛ لم تُنفّذ في هذه المعاينة وفق طلب المستخدم. لا تنشئ حسابات مشاركين.
5. راجع العربية والإنجليزية، لوحة المفاتيح، وأحجام 320 و375 و390 بكسل على النسخة المنشورة.
6. بعد اكتمال الاختبارات والموافقة الصريحة على ربط الدومين الأساسي، أضف النطاق من Worker Settings → Domains & Routes، ثم حدّث CORS وأعد النشر. لا تفعّل Cache Everything على `/api/*`.

تحديد المعدّل عبر bindings يعمل لكل موقع Cloudflare، وليس عدادًا عالميًا صارمًا. تبقى قيود Express الإضافية أيضًا. سجلات API لا تتضمن كلمات المرور أو بيانات الاتصال، والطلبات لا تسجل query strings في إعداد الرصد.

طابقت ملفات الواجهة المنشورة الثلاثة عشر (HTML وJS وCSS والخطوط والصور والتراخيص) ناتج Linux ببصمات SHA-256. ملفات الأسرار وإعدادات البيئة المحلية وتقارير الفحص تحت `.cloudflare` متجاهلة بواسطة Git. بيانات أول مسؤول متاحة للمستخدم محليًا في `backend/initial-admin.secrets.json`؛ لا تنشر هذا الملف أو ترفعه إلى GitHub.

نُشرت المعاينة في 2026-11-11 من Ubuntu 24.04 عبر `cf` على https://robotactic.robotactic-sa.workers.dev، بالإصدار `15003d7b-9fd3-471b-b501-dc4f8d1e2921`. نجحت اختبارات الخلفية الـ23، ومحاكي Worker الاثنان، والواجهة الـ35، وفحص الأنواع والبناء وdry-run على Windows وLinux. نجحت أيضًا 7 اختبارات محلية لدور PostgreSQL و34 فحص HTTP على المعاينة، تشمل الأصول وقراءة Neon وتسجيل الدخول والكوكي الآمن ورفض الوصول غير المصرح. رفع الصور غير مفعّل، ولم تُختبر الكتابة. تعذّر الفحص البصري للمتصفح لأن خدمة المتصفح غير متاحة؛ ما زال فحص 320/375/390 والعربية والإنجليزية بصريًا مطلوبًا. لم يُربط الدومين الأساسي ولم يُحذف التطبيق `robotactic-website`.

حُدّثت اعتماديات الخلفية غير المباشرة ضمن نطاقات Express القائمة: `body-parser` من `2.3.0` إلى `2.4.0` و`qs` من `6.16.0` إلى `6.17.1`. فحص `npm --prefix backend audit --omit=dev` بعد التحديث لا يُبلغ عن ثغرات إنتاج معروفة وقت المراجعة. يبقى فحص الاعتماديات الكامل يُبلغ عن ثغرات في شجرة أدوات التطوير القديمة المرتبطة بـnodemon؛ لم تُجرَ ترقية واسعة لها ضمن إصلاح النشر.

## المراجع

- [Express على Workers](https://developers.cloudflare.com/workers/tutorials/deploy-an-express-app/)
- [ربط Supabase بـHyperdrive](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/)
- [سلوك كاش Hyperdrive](https://developers.cloudflare.com/hyperdrive/concepts/query-caching/)
- [D1 وSQLite](https://developers.cloudflare.com/d1/)
- [حدود Workers](https://developers.cloudflare.com/workers/platform/limits/)
- [إعداد Workers Builds والأوامر المخصصة](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)
- [استخدام cf في CI](https://developers.cloudflare.com/cf/ci/)
- [تشخيص اختلاف اسم Worker في Workers Builds](https://developers.cloudflare.com/workers/ci-cd/builds/troubleshoot/)
- [تنبيه body-parser الأمني](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828)
- [تنبيه qs الأمني](https://github.com/ljharb/qs/security/advisories/GHSA-6pq8-jhm2-2vcw)
