import test from 'node:test';
import assert from 'node:assert/strict';
import { messageForError } from './errorMessages.js';

// Same shape as client.js ApiError (client.js itself reads Vite's import.meta.env).
class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status; }
}
const network = ['تعذّر الاتصال بالخادم. تحقق من الاتصال وحاول مرة أخرى.', 'Could not reach the server. Check the connection and try again.'];
const generic = ['تعذر إكمال الطلب.', 'The request could not be completed.'];

test('an error without a status keeps its own validation message in both languages', () => {
  const invalidImage = new Error('Choose a JPEG, PNG, or WebP image up to 5 MB.');
  assert.equal(messageForError(invalidImage, 'en'), 'Choose a JPEG, PNG, or WebP image up to 5 MB.');
  const invalidImageAr = new Error('اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت.');
  assert.equal(messageForError(invalidImageAr, 'ar'), 'اختر صورة JPEG أو PNG أو WebP بحجم لا يتجاوز 5 ميغابايت.');
});

test('an unexpected browser fault without a status is not shown verbatim or as a network failure', () => {
  const fault = new TypeError("Cannot read properties of undefined (reading 'id')");
  assert.equal(messageForError(fault, 'en'), generic[1]);
  assert.equal(messageForError(fault, 'ar'), generic[0]);
  assert.equal(messageForError(new Error(''), 'en'), generic[1]);
});

test('status 0 (server unreachable) is a network failure in the active language', () => {
  const offline = new ApiError('تعذر الاتصال بالخادم. تحقق من اتصال الشبكة وحاول مجددًا.', 0);
  assert.equal(messageForError(offline, 'en'), network[1]);
  assert.equal(messageForError(offline, 'ar'), network[0]);
});

test('server errors use the network message, with 503 keeping its own wording', () => {
  assert.equal(messageForError(new ApiError('Internal error', 500), 'en'), network[1]);
  assert.equal(messageForError(new ApiError('Bad gateway', 502), 'ar'), network[0]);
  assert.equal(messageForError(new ApiError('Down', 503), 'en'), 'The service is unavailable right now. Try again later.');
});

test('known statuses and 400 details are unchanged', () => {
  assert.equal(messageForError(new ApiError('x', 401), 'en'), 'Your session has ended. Please sign in again.');
  assert.equal(messageForError(new ApiError('x', 409), 'ar'), 'تعذّر الحفظ لتعارض مع سجل موجود.');
  assert.equal(messageForError(new ApiError('name is required', 400), 'en'), 'name is required');
  assert.equal(messageForError(new ApiError('name is required', 400), 'ar'), 'تحقق من البيانات: name is required');
  assert.equal(messageForError(new ApiError('Gone', 410), 'en'), 'Gone');
});
