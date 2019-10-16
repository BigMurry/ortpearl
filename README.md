# ortpearl
ethereum event watch engine, just like Oriental  Pearl TV Tower, high and beautiful

# How to use
```javascript
const {startEngine} = require('ortpearl');
const requireDir = require('require-dir');
const abis = require('./abi');
const tasks = requireDir('./tasks');
const {nodes, mongoUrl} = require('./conf');

const stopEngine = await startEngine({
  tasks,
  abis,
  taskCtx: {},
  taskNamespace: 'my-tower',
  maxConfirmCount: 50,
  nodes,
  mongoUrl,
  engineDbName: 'my-tower'
});
```
