const _ = require('lodash');
const sleep = require('then-sleep');
const DEFAULT_RETRY = 5;
const DEFAULT_DELAY = 1000; // ms
const DEFAULT_EVENT_SIZE = 100;

function retry(fn, times, delay) {
  return async (...args) => {
    let tried = 0;
    let ok = false;
    let err;
    while (tried <= times) {
      try {
        ok = await fn(...args);
        if (ok) {
          break;
        }
      } catch (e) {
        ok = false;
        err = e;
      }
      ++tried;
      await sleep(delay);
    }
    return {ok, err};
  };
}

async function handler() {
  // get chanenl event seqence number
  const {
    dbModels,
    channelId,
    logger,
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
  const {Channel, Event} = dbModels;
  const channel = await Channel.getChannel(channelId);
  let fromSeq = channel.eventSeq || 0;
  const retryHandler = retry(handle, retryTimes, retryDelay);
  let remain = true;
  let totalEvents = 0;

  while (remain) {
    // get new events
    const events = await Event.getEventsFromSeq(fromSeq, address, topic, confirm, size);
    if (!events || events.length === 0) {
      remain = false;
      break;
    }

    // handle events
    const {ok, err} = await retryHandler(events);
    if (!ok) {
      logger.error(`handler retry out.`);
      logger.error(err);
      break;
    }
    const lastEvt = _.last(events);
    await Channel.saveEventSeq(channel._id, lastEvt.seq);
    fromSeq = lastEvt.seq;

    remain = events.length === size;
    totalEvents += events.length;
  }
  logger.debug(`push ${totalEvents} ${eventName} events.`);
}

module.exports = handler;
