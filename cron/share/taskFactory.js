const CronJob = require('cron').CronJob;

function taskFactory(taskName, {handler, interval, autoStart, logger}) {
  let task;

  function getHandler(handler) {
    return async function _handler() {
      if (this.pendingLock) return;
      this.pendingLock = true;
      try {
        await handler.call(this);
      } catch (e) {
        logger.error(`task: ${taskName} handler raised exception: ${e.message}`);
        logger.error(e.stack);
      }
      this.pendingLock = false;
    };
  }

  return function setup(context) {
    if (task) {
      task.stop();
    }
    task = new CronJob(
      interval,
      getHandler(handler),
      null,
      autoStart,
      null,
      context
    );
    context.pendingLock = false;
    return task;
  };
}

module.exports = taskFactory;
