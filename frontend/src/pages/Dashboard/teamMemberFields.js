const field = (name, ar, en, type = 'text', required = false) => ({ name, label: [ar, en], type, required });
const status = { ...field('status', 'حالة النشر', 'Publication status', 'select', true), options: [['draft','مسودة','Draft'], ['published','منشور','Published'], ['hidden','مخفي','Hidden']] };
const order = field('display_order','ترتيب العرض','Display order','number',true);


export const teamMemberFields = [field('name_ar','الاسم بالعربية','Arabic name','text',true), field('name_en','الاسم بالإنجليزية','English name','text',true), field('role_ar','الدور بالعربية','Arabic role','text',true), field('role_en','الدور بالإنجليزية','English role','text',true), field('bio_ar','نبذة بالعربية','Arabic biography','textarea'), field('bio_en','نبذة بالإنجليزية','English biography','textarea'), field('image_url','رابط صورة العضو','Member image URL','url'), field('public_email','بريد التواصل المنشور','Public contact email','email'), field('contact_url','رابط التواصل','Contact URL','url'), field('linkedin_url','رابط LinkedIn','LinkedIn URL','url'), field('x_url','رابط X','X URL','url'), order, status];
