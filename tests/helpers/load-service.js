const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function loadService(relativePath, fcl) {
  const absolutePath = path.resolve(__dirname, '..', '..', relativePath);
  const code = fs.readFileSync(absolutePath, 'utf8');

  const window = { FCL: fcl };
  const context = vm.createContext({
    window,
    console,
    Date,
    Math,
    Number,
    String,
    Object,
    Array,
    JSON,
    RegExp,
    setTimeout,
    clearTimeout,
  });

  vm.runInContext(code, context, { filename: absolutePath });
  return window.FCL;
}

module.exports = { loadService };
