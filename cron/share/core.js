const _ = require('lodash');

function topicMatch(topics) {
  return log => {
    if (!log || !log.topics) return false;
    return _.intersection(topics, log.topics).length > 0;
  };
}

async function getLogs(provider, contract, topics, blockNow, logConf) {
  const logs = await provider.getLogs(logConf);
  return logs.filter(topicMatch(topics)).map(log => {
    const evt = contract.interface.parseLog(log);
    return {
      txHash: log.transactionHash,
      logIdx: log.logIndex,
      blockNumber: log.blockNumber,
      blockHash: log.blockHash,
      contract: log.address,
      eventName: evt.name,
      topics: log.topics,
      confirm: Math.max(blockNow - log.blockNumber, 1),
      values: evt.values
    };
  });
}

module.exports = {
  getLogs
};
