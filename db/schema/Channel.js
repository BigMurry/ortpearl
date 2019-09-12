const {Schema} = require('mongoose');
const {EthAddress, ex} = require('../tools');

const STATUS = {
  OPEN: 1,
  CLOSE: -1
};

const Model = new Schema({
  _id: Schema.Types.String,
  contract: ex(EthAddress, {required: true}),
  eventName: {type: Schema.Types.String, required: true},
  topic: {type: Schema.Types.String, required: true},
  chainId: {type: Schema.Types.Number, required: true},
  eventSeq: {type: Schema.Types.Number, required: true},
  confirm: {type: Schema.Types.Number, required: true},

  status: {type: Schema.Types.Number, required: true} // channel status
});

Model.static('initChannels', async function(tasks) {
  await this.updateMany({status: STATUS.OPEN}, {'$set': {status: STATUS.CLOSE}});
  const acts = tasks.map(task => ({
    updateOne: {
      filter: {_id: task.name},
      update: {
        '$set': {
          contract: task.address,
          eventName: task.eventName,
          topic: task.topic,
          confirm: task.confirm || 1,
          chainId: task.chainId,
          status: STATUS.OPEN
        }
      },
      upsert: true
    }
  }));
  if (acts.length > 0) {
    await this.bulkWrite(acts, {ordered: false});
  }
  return tasks.map(t => t.name);
});

Model.static('stopChannels', async function(channels) {
  const acts = channels.map(channId => ({
    updateOne: {
      filter: {_id: channId},
      update: {
        '$set': {
          status: STATUS.CLOSE
        }
      }
    }
  }));
  if (acts.length > 0) {
    await this.bulkWrite(acts, {ordered: false});
  }
});

Model.static('getChannel', async function(channelId) {
  return this.findOne({_id: channelId, status: STATUS.OPEN});
});

Model.static('saveEventSeq', async function(channelId, eventSeq) {
  const res = await this.updateOne(
    {
      _id: channelId,
      '$or': [
        {eventSeq: {'$lt': eventSeq}},
        {eventSeq: {'$exists': 0}}
      ]},
    {'$set': {eventSeq}}
  );
  return res;
});

module.exports = Model;
