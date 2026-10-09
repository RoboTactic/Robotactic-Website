const { test } = require('node:test');
const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const { readHidden } = require('../utils/readHidden');
function terminal() {
  const input = new EventEmitter();
  input.isTTY = true;
  input.setRawMode = mode => { input.isRaw = mode; };
  input.setEncoding = () => {};
  input.resume = () => {};
  input.pause = () => {};
  let output = '';
  return { input, output: { write: text => { output += text; } }, written: () => output };
}
for (const ending of ['\r', '\n', '\r\n']) test('Pasted password plus '+JSON.stringify(ending)+' does not save Enter', async () => {
  const t = terminal(); const result = readHidden('Password: ', t.input, t.output);
  t.input.emit('data', 'runtime-only-sample' + ending);
  assert.equal(await result, 'runtime-only-sample');
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.listenerCount('data'), 0);
  assert.ok(!t.written().includes('runtime-only-sample'));
});
test('Split bracketed paste and arrow keys do not alter the password', async () => {
  const t = terminal(); const result = readHidden('', t.input, t.output);
  for (const chunk of ['\x1b[20', '0~runtime', '\x1b[201~', '\x1b[D', '\r']) t.input.emit('data', chunk);
  assert.equal(await result, 'runtime');
});
test('Backspace, Unicode and deliberate spaces are preserved correctly', async () => {
  const t = terminal(); const result = readHidden('', t.input, t.output);
  t.input.emit('data', 'ab😀\b c\r');
  assert.equal(await result, 'ab c');
});
test('Cancellation restores terminal mode without returning a password', async () => {
  const t = terminal(); const result = readHidden('', t.input, t.output);
  t.input.emit('data', 'x\x03');
  await assert.rejects(result, /cancelled/);
  assert.equal(t.input.isRaw, false);
  assert.equal(t.input.listenerCount('data'), 0);
});
