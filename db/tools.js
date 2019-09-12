const mongoose = require('mongoose');

const {Schema} = mongoose;
const {
  String
} = Schema.Types;

const EthAddress = {
  type: String,
  lowercase: true,
  trim: true,
  validate: {
    validator: (v) => {
      return /^0x[0-9a-fA-F]{40}$/.test(v);
    },
    message: props => `${props.value} is not a valid address`
  }
};

function ex(type, ext) {
  return Object.assign({}, type, ext);
}

module.exports = {
  EthAddress,
  ex
};
