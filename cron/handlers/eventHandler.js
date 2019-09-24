const {getLogs} = require('../share/core');

const MAX_BLOCK = 100;
const DEFAULT_CONFIRM_BLOCKS = 5;

async function handler() {
  const {
    logger,
    maxConfirmCount,
    dbModels,
    provider,
    contract,
    task: {
      address,
      chainId,
      initialBlock,
      // handle,
      topics
    }
  } = this;
  const {EngineConf, Event} = dbModels;

  // get last stop point
  const [lastStop, blockNow] = await Promise.all([
    EngineConf.getLastStop(address),
    provider.getBlockNumber()
  ]);

  const maxBlock = blockNow - DEFAULT_CONFIRM_BLOCKS;

  let fromBlock = lastStop || initialBlock;
  let totalEvents = 0;
  while (fromBlock <= maxBlock) {
    let toBlock = Math.min(fromBlock + MAX_BLOCK - 1, maxBlock);

    // getLogs
    const logs = await getLogs(provider, contract, topics, blockNow, {
      address,
      fromBlock,
      toBlock
    });

    if (logs.length > 0) {
      // store logs in DB
      // console.log(logs);
      await Event.bulkSaveEvent(logs, chainId, maxConfirmCount);

      // // handle events
      // try {
      //   await handle.reduce(logs);
      // } catch (e) {
      //   console.log(e);
      //   console.log(e.stack);
      // }
      //
      // // mark as handled
      // await Event.markAsHandled(logs);
    }

    fromBlock = toBlock + 1;

    // save last stop
    await EngineConf.saveLastStop(address, fromBlock, blockNow);
    totalEvents += logs.length;
  }
  logger.debug(`fetched ${totalEvents} events: ${address}@${chainId}`);
}

module.exports = handler;
