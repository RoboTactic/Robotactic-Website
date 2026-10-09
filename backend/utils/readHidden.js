const { stdin, stdout } = require('node:process');

// Parse keys individually: pasted text and Enter can arrive in the same chunk.
function readHidden(prompt, input = stdin, output = stdout) {
  return new Promise((resolve, reject) => {
    if (!input.isTTY || typeof input.setRawMode !== 'function') return reject(new Error('Run this command in an interactive terminal.'));
    let value = '';
    let escape = '';
    const wasRaw = Boolean(input.isRaw);
    input.setEncoding('utf8');
    input.setRawMode(true);
    function finish(error) {
      input.off('data', onData);
      input.setRawMode(wasRaw);
      input.pause();
      output.write('\n');
      if (error) reject(error); else resolve(value);
    }
    function onData(chunk) {
      for (const character of chunk) {
        // Discard terminal escape sequences, including bracketed-paste markers.
        if (escape) {
          escape += character;
          if (escape.length === 2 && character !== '[' && character !== 'O') escape = '';
          else if (escape.length > 2 && /[\x40-\x7e]/.test(character)) escape = '';
          continue;
        }
        if (character === '\x1b') { escape = character; continue; }
        if (character === '\x03') return finish(new Error('Password entry cancelled.'));
        if (character === '\r' || character === '\n') return finish();
        if (character === '\x7f' || character === '\b') {
          if (value) { value = Array.from(value).slice(0, -1).join(''); output.write('\b \b'); }
        } else if (character >= ' ' && character !== '\x7f') {
          value += character;
          output.write('*');
        }
      }
    }
    input.on('data', onData);
    output.write(prompt);
    input.resume();
  });
}
module.exports = { readHidden };
