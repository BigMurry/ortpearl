const _ = require('lodash');
const {newLog} = require('../../lib/utils');

const logger = newLog('handlers:confirm');

const EVENT_SLICE_SIZE = 25;

async function bulkFetchReceipt(providers, txHashes) {
  const reqs = Object.keys(providers).map(chainId => {
    const provider = providers[chainId];
    const txs = _.uniq(txHashes[chainId]);
    return Promise.all(
      txs.map(txHash => provider.getTransactionReceipt(txHash))
    );
  });

  const receipts = await Promise.all(reqs);
  return _.flatten(receipts).reduce((ret, recp) => {
    ret[recp.transactionHash] = recp;
    return ret;
  }, {});
}

function mergeEvents(events) {
  return events.reduce((ret, {txHash, chainId}) => {
    if (!ret[chainId]) {
      ret[chainId] = [];
    }
    ret[chainId].push(txHash);
    return ret;
  }, {});
}

async function handler() {
  const {
    dbModels,
    providers,
    maxConfirmCount
  } = this;
  logger.debug('[cron] update events confirmations...');
  const {Event} = dbModels;

  let remain = true;
  let fromEventSeq = 1;
  const size = EVENT_SLICE_SIZE;

  while (remain) {
    const events = await Event.getNonFinalEvents(fromEventSeq, size);
    // get tx receipts
    const txReceiptMap = await bulkFetchReceipt(providers, mergeEvents(events));
    // update event confirms
    const updates = events.map(({_id, blockHash, txHash, chainId}) => {
      const {blockHash: rBlockHash, confirmations} = txReceiptMap[txHash];
      let count = confirmations;
      if (rBlockHash !== blockHash) { // block chain fork
        count = -1;
      }
      return {
        id: _id,
        count
      };
    });
    await Event.refreshEvents(updates, maxConfirmCount);
    fromEventSeq = _.get(_.last(events), ['seq']);
    if (events.length < size) {
      remain = false;
    }
  }
}

module.exports = handler;
