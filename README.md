# ortpearl
ethereum event watch engine, just like Oriental  Pearl TV Tower, high and beautiful

# How to use
```javascript
const {startEngine} = require('ortpearl');

// abis of the contract for the watcher to watch
const abis = {
  contractName: {
    'usdt': {
      'abi': [
        'event Transfer(address indexed from, address indexed to, uint value)',
        'event Approval(address indexed owner, address indexed spender, uint value)'
      ],
      'networks': {
        '1': { // mainnet
          'block': 4634748, // initial block number
          'address': '0xdac17f958d2ee523a2206206994597c13d831ec7'
        },
        '3': { // ropsten
          'block': 6414181,
          'address': '0x7A434FBdAca6D9Bee580FE2c285c9859BC63FB67'
        }
      }
    }
};

// nodes
const nodes: {
  1: process.env.ETH_MAINNET_NODE,
  3: process.env.ETH_ROPSTEN_NODE,
  5: process.env.ETH_GOERLI_NODE,
};

// tasks
// when the task event is fetched and match the confirm/chainId, this handler will trigger
async function handler(ctx, events) {
  const {foo} = ctx; // the towerConfig.taskCtx will passed into here
  console.log(foo); // bar
  console.log(events);
  /*
   events = [{
     _id: Schema.Types.String, //
    seq: {type: Schema.Types.Number, required: true, index: true},
    blockNumber: {type: Schema.Types.Number, required: true},
    logIdx: {type: Schema.Types.Number, required: true},
    blockHash: {type: Schema.Types.String, required: true},
    txHash: {type: Schema.Types.String, required: true},
    contract: EthAddress,
    baseTopic: {type: Schema.Types.String, required: true},
    topics: [{type: Schema.Types.String}],
    confirm: {type: Schema.Types.Number, required: true},
    eventName: {type: Schema.Types.String, required: true},
    chainId: {type: Schema.Types.Number, required: true},
    values: {},
    status: {type: Schema.Types.Number, required: true}
 }];
  */
  return true; // false the engine will retry dispatch this event again
}

const tasks = {
  transferEvent: {
    handler,
    contract: 'usdt', // same as contract name in abi configure
    confirm: 5, // confirm count
    chainId: 3, // chain id of the watch task
    event: 'Transfer' // event name, should be equal with the event name in abi
  }
};

// tower config
const towerConfig = {
  tasks,
  abis,
  taskCtx: { // task ctx object, will passed to handler
    foo: 'bar'
  },
  taskNamespace: 'my-watchtower',
  maxConfirmCount: FINAL_EVENT_CONFIRM_COUNT,
  nodes,
  mongoUrl: DB_URL,
  engineDbName: ORTPEARL_DB_NAME
};

const stopEngine = await startEngine(towerConfig);
```
# Todos
- [ ] add consensus protocol to support cluster mode
