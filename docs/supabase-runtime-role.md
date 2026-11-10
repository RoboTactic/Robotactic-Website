# إعداد robotactic_app لـHyperdrive

> مرجع سابق لـSupabase. انتقل إعداد PostgreSQL الحالي إلى [دليل Neon](neon-deployment.md). ملفا إنشاء الدور والصلاحيات مشتركان؛ تسمح نسختهما الحالية لمسؤول CREATEROLE المنشئ بفحص الدور عبر SET ROLE باتجاه عضوية لا يمنح التطبيق أي دور إداري. تحقق العميل من TLS أصبح client_tls، ويعرض backend_tls الاتصال الداخلي بشكل منفصل.

الحالة: SQL مقترح للمراجعة، **لم يُطبّق على Supabase**. لا تشغّل ملفات الإنشاء أو الصلاحيات قبل الموافقة. لا تشغّل schema أو migrations أو seed لهذه المهمة؛ القاعدة موجودة.

## ما راجعناه

الصلاحيات مشتقة من استعلامات `backend/database` وتعريفات موارد Express. تمت تجربة ملفات SQL على PostgreSQL 18 مؤقت مع مخطط المشروع، وليس على قاعدة الإنتاج. حساب التشغيل مشترك للخلفية؛ صلاحيات موظفي الموقع تبقى مفروضة على الخادم في Express. PostgreSQL لا يتلقى هوية مستخدم HTTP في هذا التصميم.

| الجداول | المطلوب |
| --- | --- |
| admin_users، competitions، workshops، projects، announcements، competition_teams، speakers، workshop_speakers، event_team_members | SELECT وINSERT/UPDATE على الأعمدة المستخدمة فقط، وDELETE |
| admin_user_permissions، project_members | SELECT وINSERT على الأعمدة المطلوبة وDELETE؛ لا UPDATE |
| site_settings | SELECT وUPDATE فقط لـevent_start_at وupdated_at |
| about_page | SELECT وUPDATE على حقول المحرر وupdated_at؛ لا INSERT/DELETE |
| public_section_visibility | SELECT وINSERT/UPDATE على الأعمدة المطلوبة؛ لا DELETE |
| project_categories، timeline_events، sponsors، faqs | SELECT فقط |

لا وصول إضافي إلى contact_messages أو workshop_participants أو schema_migrations أو مخططات auth/storage. لا صلاحيات إدارة أو ملكية أو عضوية أدوار أو CREATE أو TRUNCATE أو REFERENCES أو TRIGGER أو GRANT OPTION. لا ALTER DEFAULT PRIVILEGES ولا منح شامل للجداول الحالية أو المستقبلية.

أعمدة IDENTITY لا تحتاج منحًا مستقلًا على تسلسلها لإجراء INSERT. إن كانت القاعدة الحالية تستخدم SERIAL بدلًا منها، يمنح SQL USAGE فقط للتسلسل المرتبط بجدول يحتاج INSERT؛ لا يمنح SELECT/UPDATE على التسلسلات. يجب فحص القاعدة الفعلية قبل الاعتماد.

## أولًا: قراءة حالة الإنتاج دون تغييرها

شغّل `backend/database/inspectRuntimeRole.sql` في SQL Editor للحصول على بيانات المخطط والأدوار والسياسات فقط، أو استخدم الاتصال الإداري المحلي المحفوظ في `backend/.env`:

```powershell
npm --prefix backend run db:role:audit
```

غياب الدور يُسجّل كملاحظة ويجعل الفحص ينتهي بخطأ مقصود، لا ينشئه. الأداة تبدأ معاملة READ ONLY وتنهيها بـROLLBACK، ولا تعرض بيانات الصفوف أو كلمات المرور أو رابط الاتصال. تتحقق من شهادة TLS؛ أضف شهادة CA موثوقة عند الحاجة ولا تعطّل التحقق.

الفحص المباشر من بيئة المراجعة تعذر: خادم Supabase المباشر يرجع AAAA فقط، ومحاولة IPv6 رجعت ENETUNREACH. جُرّب لاحقًا Session pooler الذي حدده المستخدم على المنفذ 5432: نجح الوصول عبر IPv4 والتحقق من شهادة الخادم باستخدام شهادة CA المحلية `backend/prod-ca-2021.crt`، ثم رفض الخادم المصادقة بالخطأ 28P01. لم تُنفَّذ استعلامات على القاعدة الحية ولم نؤكد حالة الدور مباشرة. يلزم تصحيح بيانات الاتصال محليًا وإعادة فحص القراءة. هذا بديل للفحص المحلي؛ يبقى اتصال Hyperdrive بالإنتاج عبر Direct connection وفق توثيق Cloudflare.

لأداة الفحص، اضبط `DATABASE_SSL_CA_PATH` في ملف البيئة المحلي على المسار المطلق لشهادة Supabase التي نُزّلت من لوحة المشروع. المسار المطلق يعمل سواء شُغّل الأمر من الجذر أو من backend. انسخ بيانات Session pooler من Connect، وتأكد من كلمة مرور PostgreSQL وترميز الأحرف الخاصة إذا استُخدم رابط اتصال. لا تستخدم كلمة مرور حساب لوحة Supabase بدل كلمة مرور قاعدة البيانات، ولا ترسل أيًا منهما في المحادثة. الفحص يظل معطّلًا إذا فشل التحقق من الشهادة أو المصادقة.

## ثانيًا: تطبيق المقترح بعد الموافقة فقط

1. راجع نتائج الفحص الحي، خصوصًا الجداول والأعمدة وRLS والمنح إلى PUBLIC.
2. نفّذ `backend/database/createRuntimeRole.sql` بحساب إدارة. ينشئ الدور **NOLOGIN وPASSWORD NULL**؛ يتوقف إذا كان موجودًا، ولا يعيد تهيئته.
3. نفّذ `backend/database/runtimePermissions.sql` كمالك الجداول. الملف معاملة واحدة؛ أي خطأ يلغي منح الصلاحيات داخلها. لا يكتب بيانات ولا يغير ملكية الجداول أو حالة تفعيل RLS أو سياسات الآخرين. يضيف سياسات لكل عملية مطلوبة للدور وحده على الجداول التي فُعّل فيها RLS. يتوقف عند تعارض سياسة بالاسم نفسه بدل حذفها.
4. افحص الصلاحيات بينما ما زال NOLOGIN:

```powershell
npm --prefix backend run db:role:audit -- --verify
```

فحص `--verify` يفحص الأذونات الفعلية والأعمدة والعضويات والملكية وسياسات RLS والوصول الزائد، ثم يستخدم `SET LOCAL ROLE` وقراءات LIMIT 0 وEXPLAIN **دون ANALYZE** للتحقق من تخطيط استعلامات الكتابة دون تنفيذها أو استهلاك أرقام التسلسلات. يحتاج حساب الإدارة أن يكون مخوّلًا لتغيير الدور داخل الجلسة؛ لا تمنح runtime عضوية في حساب الإدارة لتجاوز فشل الاختبار.

## كلمة المرور وتفعيل الاتصال

في جلسة psql موثوقة عبر TLS مع تحقق الشهادة، وبعد الموافقة:

```text
SET password_encryption = 'scram-sha-256';
\password robotactic_app
ALTER ROLE robotactic_app LOGIN;
```

ولّد كلمة عشوائية طويلة وفريدة في مدير كلمات مرور وأدخلها في طلب `\password` المخفي. هذا أمر psql وليس SQL قابلًا للصق في SQL Editor. لا تكتب كلمة المرور في ALTER ROLE نصي أو أوامر الطرفية أو سجل المحادثة أو ملف يتتبعه Git. psql يرسل مُتحقق كلمة المرور المشفّر بدل النص الصريح.

أدخل بيانات الدور في إعداد Hyperdrive الآمن مع Direct connection وTLS وQuery caching معطّلًا. لا تستخدم postgres أو مفتاح Supabase الخادمي بدل كلمة مرور PostgreSQL.

لاختبار تسجيل الدخول الحقيقي، احفظ مؤقتًا `RUNTIME_DATABASE_URL` لهذا الدور في `backend/.env` المحلي المتجاهل في Git، أو في بيئة عملية آمنة، ثم:

```powershell
npm --prefix backend run db:role:audit -- --verify --runtime
```

لا يُعد الاختبار كاملًا إلا إذا كان `verified` و`passwordLoginVerified` كلاهما true عبر TLS. فحص SET ROLE بحساب الإدارة وحده لا يثبت كلمة المرور أو اتصال Hyperdrive. احذف متغير الاختبار من الملف بعد الانتهاء، واحتفظ بكلمة المرور في مدير كلمات المرور وHyperdrive.

## شروط الاعتماد والاختبارات

- لا تغييرات على الإنتاج قبل الموافقة الصريحة على الملفين.
- يجب أن تكون findings فارغة. grants إلى PUBLIC قد تمنح الدور صلاحيات حتى مع NOINHERIT؛ PostgreSQL لا يدعم استثناء دور واحد من PUBLIC. لا نزيل منحًا مشتركًا أو نغير سياسات الآخرين تلقائيًا؛ يلزم مراجعة أثره وموافقة مستقلة.
- وظائف SECURITY DEFINER المتاحة للدور أو ملكية أي كائن أو عضوية دور أخرى تحتاج مراجعة قبل الاعتماد. صلاحية TEMP المشتركة الافتراضية تظهر في التقرير، وهي ليست منح CREATE على المخططات الدائمة؛ تغييرها يمس أدوارًا أخرى.
- جرّب اتصال Hyperdrive وقراءة API فعلية بعد اعتماد الدور. لا يُثبت فحص SQL المحلي أن الربط السحابي يعمل. أي اختبار كتابة على الإنتاج يحتاج إذنًا منفصلًا؛ لا ينفذه فحص الأذونات.

اختبار معزول، لا يقرأ .env ولا DATABASE_URL، ينشئ PostgreSQL مؤقتًا على 127.0.0.1 بكلمة عشوائية، ويوقفه ويحذفه بعد الاختبار:

```powershell
# عند اختلاف المسار: اضبط PG_TEST_BIN إلى مجلد bin الخاص بـPostgreSQL المحلي.
npm run test:db-role
```

نجح الاختبار المعزول على PostgreSQL 18.6: ستة اختبارات إجمالًا، بالإضافة إلى نجاح اختبارات الخلفية العشرين. يشمل مخطط المشروع، وSQL الفحص للقراءة فقط، وRLS، والصلاحيات الزائدة، وPUBLIC، والعضويات، وSERIAL/IDENTITY، ويحفظ بيانات الصفوف والتسلسلات أثناء تدقيق READ ONLY. اختبارات الكتابة تحدث في القاعدة المؤقتة فقط. لم يُتحقق بعد من كلمة مرور الدور أو صلاحياته على Supabase الفعلية.

المراجع: [أدوار PostgreSQL](https://www.postgresql.org/docs/current/sql-createrole.html)، [RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)، [psql وكلمة المرور](https://www.postgresql.org/docs/current/app-psql.html)، [منح PUBLIC في Supabase](https://supabase.com/kb/troubleshooting/custom-role-inherits-privileges-that-were-not-explicitly-granted-ddaa1c)، [Hyperdrive مع Supabase](https://developers.cloudflare.com/hyperdrive/examples/connect-to-postgres/postgres-database-providers/supabase/).
