const _ = require('lodash');
const sleep = require('then-sleep');
const {newLog} = require('../../lib/utils');
const DEFAULT_RETRY = 5;
const DEFAULT_DELAY = 1000; // ms
const DEFAULT_EVENT_SIZE = 100;

const logger = newLog('handlers:channel');

function retry(fn, times, delay) {
  return async (...args) => {
    let tried = 0;
    let ok = false;
    while (tried <= times) {
      try {
        ok = await fn(...args);
        if (ok) {
          break;
        }
      } catch (e) {
        ok = false;
        console.log(e.stack);
      }
      logger.info(`handler failed, retry in ${delay}ms...`);
      ++tried;
      await sleep(delay);
    }
    if (!ok) {
      logger.info(`retry out and handler execute failed.`);
    }
    return ok;
  };
}

async function handler() {
  // get chanenl event seqence number
  const {
    dbModels,
    channelId,
    task: {
      handle,
      address,
      eventName,
      topic,
      confirm,
      retryDelay = DEFAULT_DELAY,
      retryTimes = DEFAULT_RETRY,
      size = DEFAULT_EVENT_SIZE
    }
  } = this;
  logger.debug(`[cron] ${address}:${eventName}`);
  const {Channel, Event} = dbModels;
  const channel = await Channel.getChannel(channelId);
  let fromSeq = channel.eventSeq || 0;
  const retryHandler = retry(handle, retryTimes, retryDelay);
  let remain = true;

  while (remain) {
    // get new events
    const events = await Event.getEventsFromSeq(fromSeq, address, topic, confirm, size);
    if (!events || events.length === 0) {
      remain = false;
      break;
    }

    // handle events
    const ok = await retryHandler(events);
    if (!ok) {
      break;
    }
    const lastEvt = _.last(events);
    await Channel.saveEventSeq(channel._id, lastEvt.seq);
    fromSeq = lastEvt.seq;

    remain = events.length === size;
  }
}

module.exports = handler;
