const ethers = require('ethers');
const _ = require('lodash');
const taskFactory = require('./share/taskFactory');
const eventHandler = require('./handlers/eventHandler');
const channelHandler = require('./handlers/channelHandler');
const confirmHandler = require('./handlers/confirmHandler');
const {CRON} = require('./share/conf');

const eventIntervals = {
  1: CRON.FETCH_EVENTS_MAINNET,
  3: CRON.FETCH_EVENTS_MAINNET,
  5: CRON.FETCH_EVENTS_MAINNET,
  101: CRON.FETCH_EVENTS_POA
};

async function setup({
  nodes,
  dbModels,
  channels,
  logger,
  mergeTasks,
  maxConfirmCount
}) {
  const providers = Object.keys(nodes).reduce((ret, chainId) => {
    ret[chainId] = new ethers.providers.JsonRpcProvider(nodes[chainId]);
    return ret;
  }, {});

  // start event jobs
  const eventJobs = mergeTasks.map(task => {
    const provider = providers[task.chainId];
    const contract = new ethers.Contract(task.address, task.abi, provider);
    const ctx = {
      logger,
      dbModels,
      maxConfirmCount,
      contract,
      task,
      provider
    };
    return taskFactory(`evt#${task.address}`, {
      handler: eventHandler,
      autoStart: true,
      interval: eventIntervals[task.chainId],
      logger: ctx.logger
    })(ctx);
  });
  logger.debug(`create ${mergeTasks.length} event jobs done.`);

  // start channel jobs
  const channJobs = channels.map(({channelId, task}) => {
    const ctx = {
      logger,
      dbModels,
      channelId,
      task
    };
    return taskFactory(`channel#${channelId}`, {
      handler: channelHandler,
      autoStart: true,
      interval: CRON.CHANNEL_HANDLER,
      logger: ctx.logger
    })(ctx);
  });
  logger.debug(`create ${channels.length} channels jobs done.`);

  // event confirm job
  const confirmJob = taskFactory(`confirmjob`, {
    handler: confirmHandler,
    autoStart: true,
    interval: CRON.EVENT_CONFIRM,
    logger
  })({logger, dbModels, providers, maxConfirmCount});
  logger.debug('create confirm jobs done.');

  return () => {
    _.concat(eventJobs, channJobs, confirmJob).forEach(job => job.stop());
  };
}

module.exports = setup;
