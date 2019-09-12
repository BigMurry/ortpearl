const {getAbi, getAddr, getInitBlock, getTopicId} = require('./abi');
const _ = require('lodash');

function reduceHandler(contract) {
  const handlers = {};
  return {
    watch(event, handler) {
      if (!handlers[event]) {
        handlers[event] = [];
      }
      handlers[event].push(handler);
    },
    reduce(logs) {
      const grpLogs = _.groupBy(logs, log => log.eventName);
      const logTypes = Object.keys(grpLogs);
      const handles = [];
      for (let i = 0; i < logTypes.length; ++i) {
        const eventName = logTypes[i];
        handles.push(handlers[eventName].map(h => h(grpLogs[eventName])));
      }
      return Promise.all(_.flattenDeep(handles));
    }
  };
}

function wrap(fn, ctx) {
  return (...args) => fn(ctx, ...args);
}

async function buildTasks(tasks, abis, baseCtx, namespace) {
  const taskKeys = Object.keys(tasks);
  const mergedTasks = {};
  const rawTasks = [];
  for (let i = 0; i < taskKeys.length; ++i) {
    let {handler, chainId, contract, event, prepare, confirm = 1} = tasks[taskKeys[i]];
    contract = _.toLower(contract);
    const abi = getAbi(abis, contract);
    const initBlock = getInitBlock(abis, contract, chainId);
    const eventTopic = getTopicId(abis, contract, event);
    const contractAddr = _.toLower(getAddr(abis, contract, chainId));
    if (!mergedTasks[contract]) {
      mergedTasks[contract] = {
        contract,
        abi,
        address: contractAddr,
        chainId,
        initialBlock: initBlock,
        handle: reduceHandler(contract),
        topics: []
      };
    }
    let ctx = baseCtx;
    if (prepare) {
      ctx = Object.assign(ctx, await prepare());
    }
    mergedTasks[contract].topics.push(eventTopic);
    mergedTasks[contract].handle.watch(event, wrap(handler, ctx));

    rawTasks.push({
      name: `${taskKeys[i]}#${namespace}`,
      contract,
      eventName: event,
      abi,
      address: contractAddr,
      chainId,
      confirm,
      initialBlock: initBlock,
      handle: wrap(handler, ctx),
      topic: eventTopic
    });
  }

  return {
    mergeTasks: Object.values(mergedTasks),
    rawTasks
  };
}

module.exports = buildTasks;
