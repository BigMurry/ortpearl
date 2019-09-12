const {test} = require('tap');
const {formatEventValues} = require('../lib/utils');
const ethers = require('ethers');

test('ethers.bignumber', t => {
  t.plan(2);
  const obj = {
    '1': '0xB193087ECEfe0b530d63375503e2D9e15593e441',
    '2': [
      '0xB193087ECEfe0b530d63375503e2D9e15593e441',
      ethers.utils.bigNumberify(100),
      ethers.utils.bigNumberify(200)
    ],
    '3': ethers.utils.bigNumberify(300),
    address: '0xB193087ECEfe0b530d63375503e2D9e15593e441',
    comp: {
      addr: '0xB193087ECEfe0b530d63375503e2D9e15593e441',
      value1: ethers.utils.bigNumberify(100),
      value2: ethers.utils.bigNumberify(200)
    },
    big: ethers.utils.bigNumberify(300)
  };

  const rObj = formatEventValues(obj);
  console.log(rObj);
  t.equal(Object.keys(rObj).length, 3);
  t.equal(rObj[1], undefined);
});
