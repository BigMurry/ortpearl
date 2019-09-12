const ethers = require('ethers');
const _ = require('lodash');

function getContractInstance(abis, providerOrSigner, name, network) {
  const abi = _.get(abis, [name, 'abi']);
  const addr = _.get(abis, [name, 'networks', network, 'address']);
  if (!abi || !addr) {
    throw new Error('abi or address not found.');
  }
  return new ethers.Contract(addr, abi, providerOrSigner);
}

function getTopicId(abis, contract, eventName) {
  const abi = _.get(abis, [contract, 'abi']);
  const inter = new ethers.utils.Interface(abi);
  const evt = inter.events[eventName];
  return _.get(evt, ['topic']);
}

function getAbi(abis, name) {
  return _.get(abis, [name, 'abi']);
}

function getAddr(abis, name, network) {
  return _.get(abis, [name, 'networks', network, 'address']);
}

function getInitBlock(abis, name, network) {
  return _.get(abis, [name, 'networks', network, 'block']);
}

module.exports = {
  getContractInstance,
  getAddr,
  getInitBlock,
  getAbi,
  getTopicId
};
