const URL = require('url').URL;

const URL_SEPARATOR = ' ';
const OLD_URL_SEPARATOR = '||';

const ADDRESS_ZERO = '0x0000000000000000000000000000000000000000';
const BYTES_ZERO = '0x0000000000000000000000000000000000000000000000000000000000000000';

const isValidUrl = (string) => {
  try {
    new URL(string);
    return true;
  } catch (error) {
    log("error", error);
    return false;  
  }
}

function verifyURLs(urlsString) {
  var split = urlsString.split(",");
  for (var i = 0; i < split.length; i++) {
    if (!isValidUrl(split[i])) {
      log("invalid url", split[i]);
      return false;
    }
  }
  return true;
}

// TODO: real logging
function warn(a, b) {
  b ? console.warn(a,b) : console.warn(a);
}

function log(a, b) {
  if (process.env.NODE_ENV==="test" || (""+process.env.LOG_LEVEL).indexOf("LOG") >= 0) {
    b ? console.log(a,b) : console.log(a);
  }
}

function debug(a, b) {
  if (process.env.NODE_ENV==="test" || (""+process.env.LOG_LEVEL).indexOf("DEBUG") >= 0) {
    b ? console.log(a,b) : console.log(a);
  }
}

function getRewardInfoFrom(reward) {
  let metadata = reward.metadata ? reward.metadata : {'name':'n/a', 'description':'n/a'};
  return `${metadata.name} -- ${metadata.description ? metadata.description : ''} (id: ${reward.id}, cost: ${reward.cost})`;
}


module.exports = {
  verifyURLs: verifyURLs,
  log:        log,
  debug:      debug,
  warn:       warn,
  separator:  URL_SEPARATOR,
  oldSeparator: OLD_URL_SEPARATOR,
  ADDRESS_ZERO: ADDRESS_ZERO,
  BYTES_ZERO: BYTES_ZERO,
  getRewardInfoFrom: getRewardInfoFrom
};