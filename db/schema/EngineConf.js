const {Schema} = require('mongoose');
const {EthAddress} = require('../tools');
const _ = require('lodash');

const Model = new Schema({
  _id: EthAddress, // contract
  stop: {type: Schema.Types.Number, required: true}, //
  updateAt: {type: Schema.Types.Number, required: true}
});

Model.static('getLastStop', async function(contract) {
  const res = await this.findOne({_id: contract});
  return _.get(res, ['stop']);
});

Model.static('saveLastStop', async function(contract, stopAt, updateAt) {
  const res = await this.updateOne({_id: contract}, {'$set': {stop: stopAt, updateAt}}, {upsert: true});
  return res.modifiedCount === 1;
});

module.exports = Model;
