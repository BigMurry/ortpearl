const CRON = {
  FETCH_EVENTS_POA: '*/2 * * * * *', // 2s
  FETCH_EVENTS_MAINNET: '*/15 * * * * *', // 15s
  CHANNEL_HANDLER: '*/15 * * * * *', // 15s
  EVENT_CONFIRM: '*/45 * * * * *' // 45s
};

module.exports = {
  CRON
};
