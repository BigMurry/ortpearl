const traverse = require('traverse');
const ethers = require('ethers');
const debug = require('debug');

function formatEventValues(values) {
  const trimValues = Object.keys(values).reduce((ret, k) => {
    if (!/^\d+$/.test(k) && k !== 'length') {
      ret[k] = values[k];
    }
    return ret;
  }, {});
  const ret = traverse(trimValues).map(function(v) {
    if (v instanceof ethers.utils.BigNumber) {
      this.update(v.toString());
    }
  });
  return ret;
}

function newLog(prefix) {
  const base = 'watchEngine';
  return {
    debug: debug(`${base}:debug:${prefix}`),
    info: debug(`${base}:info:${prefix}`),
    error: debug(`${base}:error:${prefix}`)
  };
}

module.exports = {
  formatEventValues,
  newLog
};
