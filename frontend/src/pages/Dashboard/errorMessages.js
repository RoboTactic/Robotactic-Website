const t = (value, language) => value[language === 'ar' ? 0 : 1];
// Standard API failures in the interface language; 400 keeps the server's field detail.
const statusMessages = {
  401: ['انتهت الجلسة. سجّل الدخول مرة أخرى.', 'Your session has ended. Please sign in again.'],
  403: ['ليس لديك صلاحية لهذا الإجراء.', 'You do not have permission for this action.'],
  404: ['السجل غير موجود أو تم حذفه.', 'This record does not exist or was deleted.'],
  409: ['تعذّر الحفظ لتعارض مع سجل موجود.', 'This conflicts with an existing record.'],
  429: ['طلبات كثيرة خلال وقت قصير. انتظر قليلًا ثم حاول مرة أخرى.', 'Too many requests in a short time. Wait a moment and try again.'],
  503: ['الخدمة غير متاحة حاليًا. حاول لاحقًا.', 'The service is unavailable right now. Try again later.'],
};
export const messageForError = (error, language) => {
  const status = error?.status;
  if (statusMessages[status]) return t(statusMessages[status], language);
  if (status === 400 && error?.message) return language === 'ar' ? `تحقق من البيانات: ${error.message}` : error.message;
  // No status: raised in the browser, not by a request. A plain Error is a validation message
  // already written for the user (e.g. an invalid image); other errors (TypeError…) are faults
  // whose text is not meant for users.
  if (status == null) return error?.constructor === Error && error.message ? error.message : t(['تعذر إكمال الطلب.', 'The request could not be completed.'], language);
  // client.js reports an unreachable server as status 0.
  if (status === 0 || status >= 500) return t(['تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.', 'Could not reach the server. Check the connection and try again.'], language);
  return error?.message || t(['تعذر إكمال الطلب.', 'The request could not be completed.'], language);
};
