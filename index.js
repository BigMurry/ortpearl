const startCronJobs = require('./cron');
const {getModel} = require('./db');
const createTasks = require('./lib/task');
const abiHelper = require('./lib/abi');
const {newLog} = require('./lib/utils');

const defaultLoggerFactory = newLog('ortpearl');

async function create(conf) {
  const {
    loggerFactory = defaultLoggerFactory,
    tasks,
    abis,
    taskCtx,
    taskNamespace,
    maxConfirmCount,
    nodes,
    mongoUrl,
    engineDbName
  } = conf;

  const logger = loggerFactory('engine');
  // create tasks
  const {mergeTasks, rawTasks} = await createTasks(
    tasks,
    abis,
    taskCtx,
    taskNamespace
  );

  // init db models
  const dbModels = await getModel(mongoUrl, engineDbName);
  logger.debug('init db models done.');

  // init channels
  const channelIds = await dbModels.Channel.initChannels(rawTasks);
  const channels = channelIds.map((channelId, idx) => ({channelId, task: rawTasks[idx]}));
  logger.debug('init channels done.');

  const stopCronJobs = await startCronJobs({
    maxConfirmCount,
    logger,
    mergeTasks,
    channels,
    dbModels,
    nodes
  });
  logger.debug('cron jobs done.');
  return () => {
    stopCronJobs();
  };
}

module.exports = {
  startEngine: create,
  abiHelper
};
