const {Schema} = require('mongoose');
const md5 = require('md5');
const {EthAddress, ex} = require('../tools');
const {formatEventValues} = require('../../lib/utils');

const EVENT_STATUS = {
  INACTIVE: -1,
  PENDING: 0,
  FINAL: 1
};

const Model = new Schema({
  _id: Schema.Types.String, //
  seq: {type: Schema.Types.Number, required: true, index: true},
  blockNumber: {type: Schema.Types.Number, required: true},
  logIdx: {type: Schema.Types.Number, required: true},
  blockHash: {type: Schema.Types.String, required: true},
  txHash: {type: Schema.Types.String, required: true},
  contract: ex(EthAddress, {required: true}),
  baseTopic: {type: Schema.Types.String, required: true},
  topics: [{type: Schema.Types.String}],
  confirm: {type: Schema.Types.Number, required: true},
  eventName: {type: Schema.Types.String, required: true},
  chainId: {type: Schema.Types.Number, required: true},
  values: {},
  status: {type: Schema.Types.Number, required: true}
});

function eventId(blockHash, txHash, logIndex) {
  return md5(`${blockHash}#${txHash}#${logIndex}`);
}

Model.static('saveEvent', async function(event, chainId, maxConfirmCount) {
  const {
    logIdx,
    blockNumber,
    blockHash,
    txHash,
    topics,
    confirm,
    contract,
    eventName,
    values
  } = event;
  const seq = blockNumber * 1000000 + logIdx; // max logs in a block 1M
  const eventDoc = new this({
    _id: eventId(blockHash, txHash, logIdx),
    seq,
    blockNumber,
    blockHash,
    logIdx,
    baseTopic: topics[0],
    topics,
    txHash,
    confirm,
    contract,
    eventName,
    values,
    chainId,
    status: confirm >= maxConfirmCount ? EVENT_STATUS.FINAL : EVENT_STATUS.PENDING
  });
  const res = await eventDoc.save();
  return res;
});

Model.static('bulkSaveEvent', async function(evts, chainId, maxConfirmCount) {
  const acts = evts.map(({
    logIdx,
    blockNumber,
    blockHash,
    txHash,
    confirm,
    topics,
    contract,
    eventName,
    values
  }) => {
    return {
      'insertOne': {
        'document': {
          _id: eventId(blockHash, txHash, logIdx),
          seq: blockNumber * 1000000 + logIdx,
          blockNumber,
          blockHash,
          logIdx,
          baseTopic: topics[0],
          topics,
          txHash,
          confirm,
          contract,
          eventName,
          chainId,
          values: formatEventValues(values),
          status: confirm >= maxConfirmCount ? EVENT_STATUS.FINAL : EVENT_STATUS.PENDING
        }
      }
    };
  });

  if (acts.length > 0) {
    try {
      await this.bulkWrite(acts, {ordered: false});
    } catch (e) {
      console.log(e);
      return false;
    }
  }
  return true;
});

Model.static('getEventsFromSeq', async function(fromSeq, contract, topic, confirm, size) {
  // console.log(`
  //   fromSeq: ${fromSeq}
  //   contract: ${contract}
  //   topic: ${topic}
  //   confirm: ${confirm}
  //   size: ${size}
  // `);
  const res = await this.find({
    seq: {'$gt': fromSeq},
    status: {'$ne': EVENT_STATUS.INACTIVE},
    confirm: {'$gte': confirm},
    contract,
    baseTopic: topic
  })
    .sort({seq: 1})
    .limit(size);
  return res;
});

Model.static('refreshEvents', async function(updates, finalConfirmCount) {
  const acts = updates.map(({id, count}) => {
    let status = count >= finalConfirmCount ? EVENT_STATUS.FINAL : EVENT_STATUS.PENDING;
    if (count === -1) {
      status = EVENT_STATUS.INACTIVE;
    }
    return {updateOne: {
      filter: {_id: id, status: EVENT_STATUS.PENDING},
      update: {
        '$set': {
          status,
          confirm: count
        }
      }
    }};
  });

  if (acts.length > 0) {
    try {
      await this.bulkWrite(acts, {ordered: false});
    } catch (e) {
      console.log(e);
    }
  }
});

Model.static('getNonFinalEvents', async function(fromSeq, size) {
  const res = await this.find({seq: {'$gt': fromSeq}, status: EVENT_STATUS.PENDING})
    .sort({seq: 1})
    .limit(size);
  return res || [];
});

module.exports = Model;
