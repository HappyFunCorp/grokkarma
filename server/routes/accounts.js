const express = require('express');
const router = express.Router();
const util = require('./util');
const blockchain = require('./blockchain');

// GET set up 
router.get('/setup/:ykid', async function(req, res, next) {
  if (process.env.NODE_ENV === 'test') {
    util.warn("setting up test data", req.params.ykid);
    let account = await blockchain.getAccountFor(req.params.ykid);
    getSessionFromAccount(req, account);
    req.session.urls = [process.env.ADMIN_URL]; // so we can look at everything
    // util.debug("set up test data", req.session);
    return res.json({"success":true});
  } else {
    util.warn("setup called out of test mode");
  }
});


/* GET account details */
router.get('/account/:id', async function(req, res, next) {
  try {
    let account = await blockchain.getAccountFor(req.params.id);
    if (!isAdmin(req) && req.session.ykid !== id && req.session.ykcid != account.communityIds[0]) {
      util.warn('Unauthorized account request', req.session);
      return res.json({"success":false, "error": req.t("Not authorized")});
    }
    util.debug('account', account);
    res.json(account);
  } catch(error) {
    return res.json({"success":false, "error": error});
  }
});


/* GET account details */
router.get('/me', async function(req, res, next) {
  util.debug("me session", req.session);
  var account;
  try {
    if (req.session.ykid) {
      account = await blockchain.getAccountFor(req.session.ykid);
    } else {
      var url = req.session.urls ? req.session.urls[0] : null;
      url = getLongUrlFromShort(url);
      if (url.startsWith('error')) {
        return res.json({"success":false, "error": url});
      }
      account = await blockchain.getAccountForUrl(url);
    }
    
    // we've got the account, now hydrate it and mark as active if not already
    getSessionFromAccount(req, account);
    let community = await blockchain.getCommunityFor(req.session.ykcid); 
    account.community = community;
    await hydrateAccount(account);
    account.spendable = await blockchain.availableToSpend(account.id, '');
    if (!hasNeverLoggedIn(account)) {
      return res.json(account);
    }
    util.warn("Marking account active and replenishing");
    await blockchain.markAccountActive(account);
    await blockchain.replenishAccount(account.id);
    res.json(account);
  } catch(error) {
    util.warn("account me error", error);
    res.json({"success":false, "error":error});
  }
});

router.get('/full', function(req, res, next) {
  return getFull(req.session.ykid, req, res, next);
});

router.get('/full/:id', function(req, res, next) {
  if (!isAdmin(req)) {
    util.warn("Not authorized", req.params.id);
    return res.json({"success":false, "error": req.t("Not authorized")});
  }
  return getFull(req.params.id, req, res, next);
});

async function getFull(id, req, res, next) {
  try {
    let totals = await blockchain.trancheTotalsForId(id);
    // possibly eventually page these
    let given = await blockchain.tranchesGivenForId(id, totals[0]);
    let received = await blockchain.tranchesReceivedForId(id, totals[1]);
    var account = req.session.account;
    account.given = JSON.parse(given);
    account.received = JSON.parse(received);
    await hydrateAccount(account);
    console.log("hydrated", account);
    res.json(account);
  } catch(error) {
    util.warn("error getting full profile", error);
    res.json(req.session.account);
  }
}

/* GET account details */
router.get('/url/:url', async function(req, res, next) {
  var url = req.params.url;
  if (!req.session.urls.includes(url) && !isAdmin(req)) {
    util.warn("Not authorized", req.params.url);
    return res.json({"success":false, "error": req.t("Not authorized")});
  }
  url = getLongUrlFromShort(url);
  if (url.startsWith('error')) {
    return res.json({"success":false, "error": url});
  }
  try {
    let account = await blockchain.getAccountForUrl(url);
    res.json(account);
  } catch(error) {
    return res.json({"success":false, "error": error});
  }
});

/* PUT switchCommunity */
router.put('/switchCommunity', async function(req, res, next) {
  let idx = parseInt(req.body.index || 0);
  console.log("ykcid in", req.session.ykcid);
  //console.log("account", req.session.account);
  if (req.session.account && idx < req.session.account.communityIds.length) {
    req.session.ykcidx = idx;
    getSessionFromAccount(req, req.session.account);
    let community = await blockchain.getCommunityFor(req.session.ykcid); 
    console.log("ykcid out", community.id);
    req.session.account.community = community;
    res.json(req.session.account);
  } else {
    return res.json({"success":false, "error":"No session"});
  }
});


/* PUT add URL */
// TODO: connect to Twitter to verify the twitter_id and handle match
// Low priority since the on-chain contract ensures you can't spoof a handle that has ever been sent any YK,
// and if one of those _is_ spoofed, that just means they they get the ability to hijack the spoofer's YK account
router.put('/addUrl', async function(req, res, next) {
  var url = getLongUrlFromShort(req.body.url);
  util.debug("adding url", url);
  if (url.startsWith('error')) {
    return res.json({"success":false, "error": url});
  }

  if (req.session.ykid) {
    util.debug("adding url to existing account");
    await blockchain.addUrlToExistingAccount(req.session.ykid, url);
  } else {
    // Are we not logged in as a YK user but hoping to add this current URL as a YK user?
    let existing = req.session.urls ? req.session.urls[0] : null;
    var longExisting = getLongUrlFromShort(existing);
    if (longExisting.startsWith('error')) {
      return res.json({"success":false, "error": req.t("existing") + " " + longExisting});
    }
    try {
      let account = await blockchain.getAccountForUrl(url);
      getSessionFromAccount(req, account);
      await blockchain.addUrlToExistingAccount(account.id, url);
    } catch(error) {
      return res.json({"success":false, "error": error});
    }
  }

  req.session.urls.push(req.body.url)
  res.json({"success":req.body.url});

});

/* PUT remove URL */
router.put('/removeUrl', async function(req, res, next) {
  var url = req.body.url || "error";
  url = getLongUrlFromShort(url);
  if (url.startsWith("error")) {
    return res.json({"success":false, "error": req.t("Invalid URL")});
  }
  
  await blockchain.removeUrlFromExistingAccount(req.session.ykid, url);
  const index = req.session.urls.indexOf(url);
  if (index) {
    req.session.urls.splice(index, 1);
  }
  res.json({"success":true});
});


/* PUT edit account */
router.put('/update', async function(req, res, next) {
  var account = req.body.account;
  util.log("updating account", account);
  if (account.id === 0) {
    return res.json({"success":false, "error": 'Account ID not set'});
  }
  if (!isAdmin(req) && req.session.ykid !== account.id) {
    return res.json({"success":false, "error": req.t("Not authorized")});
  }
  //console.log("About to edit", account);
  let response = await blockchain.editAccount(
    account.id,
    account.userAddress,
    JSON.stringify(account.metadata),
    account.flags || util.BYTES_ZERO
  );
  return res.json({"success":true});
});


/* POST create account. */
router.post('/create', async function(req, res, next) {
  if (!isAdmin(req)) {
    return res.json({"success":false, "error": "Admin only"});
  }

  // check to see if the account exists, if so, do nothing
  url = getLongUrlFromShort(req.body.url);
  if (url.startsWith('error')) {
    return res.json({"success":false, "error": url});
  }
  let account = await blockchain.getAccountForUrl(url);
  if (account.id > 0) {
    return res.json( { "success":true, "info": "Account already exists"});
  }
  await blockchain.addNewAccount(req.body.communityId, url);
  res.json( { "success":true, "info": "Account created" } );
});


/* POST mark account active. */
router.post('/markActive', async function(req, res, next) {
  if (!isAdmin(req)) {
    return res.json({"success":false, "error": "Admin only"});
  }
  try {
    let account = await blockchain.getAccountForUrl(req.body.url);
    if (!account.id) {
      return res.json({"success":false, "error": "Account not found"});
    }
    await blockchain.markAccountActive(account);
    return res.json({"success":true});
  } catch(error) {
    return res.json({"success":false, "error": error});
  }
});

/* POST replenish account. */
/* Note that replenish limits are enforced at the blockchain level. */
router.post('/replenish', async function(req, res, next) {
  if (!isAdmin(req)) {
    return res.json({"success":false, "error": "Admin only"});
  }
  try {
    var id = req.body.id;
    if (!id) {
      util.log("getting id from url");
      let account = await blockchain.getAccountForUrl(req.body.url);
      id = account.id;
    }
    let replenishStatus = await blockchain.replenishStatus(id);
    if (replenishStatus.shouldReplenish) {
      util.log("replenishing", req.body);
      await blockchain.replenishAccount(id);
      await blockchain.recalculateBalances(id);
      util.log("replenished", id);
    }
    return res.json( { "success":true, "replenish": replenishStatus, "id":id } );
  } catch(error) {
    return res.json({"success":false, "error": error});
  }
});


/* DELETE remove account. */
router.delete('/destroy/:id', async function(req, res, next) {
  if (!isAdmin(req)) {
    return res.json({"success":false, "error": "Admin only"});
  }
  if (req.params.id === 0) {
    return res.json({"success":false, "error": 'Account not saved'});
  }
  await blockchain.deleteAccount(req.params.id);
});


/* POST give coins */
router.post('/give', async function(req, res, next) {
  vals = {...req.body, ykid:req.session.ykid, ykcid:req.session.ykcid};
  return doGive(vals, req, res, next);
});


/* POST transfer coins */
router.post('/transfer', async function(req, res, next) {
  if (!isAdmin(req)) {
    return res.json({"success":false, "error": "Admin only"});
  }
  return doGive(req.body, req, res, next);
});

async function doGive(vals, req, res, next) {
  //check values
  var recipientUrl = getLongUrlFromShort(vals.recipient);
  if (recipientUrl.startsWith('error')) {
    return res.json({"success":false, "error": recipientUrl});
  }
  if (parseInt(vals.amount) === 0) {
    return res.json({"success":false, "error": "recipientUrl"});
  }
  
  try {
    //check community values
    let community = await blockchain.getCommunityFor(vals.ykcid); 
    if (isStrictCommunity(community)) {
      if (recipientUrl.startsWith("https://twitter.com/")) {
        return res.json({"success":false, "error": req.t('Closed community, can only give to') +` @${community.domain}` });
      }
      if (recipientUrl.startsWith("mailto:") && recipientUrl.indexOf("@"+community.domain) <= 0) {
        return res.json({"success":false, "error": req.t('Closed community, can only give to') +` @${community.domain}` });
      }
    }
    // perform the txn
    await blockchain.give(vals.ykid, vals.ykcid, recipientUrl,vals.amount, vals.message);
    util.log(`${vals.amount} karma sent to`, recipientUrl);
    return res.json( { "success":true } );
  } catch(error) {
    return res.json({"success":false, "error": error});
  }
}


/* POST set token */
router.post('/token/set', function(req, res, next) {
  util.debug("token set", req.body);
  if (!req.body.token) {
    req.session.uid = null;
    req.session.name = null;
    req.session.urls = [];
    req.session.ykid = null;
    req.session.ykcid = null;
    req.session.ykcidx = null;
    req.session.account = null;
    return res.json({"success":true});
  }
  // handle new API token
  util.debug("post token session", req.session);
  res.json({"success":true});
});


function isAdmin(req) {
  return req.session.urls && req.session.urls.includes(process.env.ADMIN_URL);
}

function hydrateAccount(account) {
  if (account.given.length===0 && account.received.length===0) {
    return new Promise(async function(resolve, reject) { resolve(); });
  }
  var promises = [];
  for (var i = 0; i < account.given.length; i++) {
    var given = account.given[i];
    promises.push(hydrateTranche(given, true));
  }
  account.spendable = 0;
  for (var j = 0; j < account.received.length; j++) {
    var received = account.received[j];
    account.spendable += received.available;
    promises.push(hydrateTranche(received, false));
  }
  return Promise.all(promises);
}

function hydrateTranche(tranche, given) {
  return new Promise(async function(resolve, reject) {
    if (process.env.NODE_ENV==="test") {
      resolve();
    }
    let id = given ? tranche.receiver : tranche.sender;
    util.log("hydrating tranche for", id);
    let key = `account-${id}`;
    let account = await blockchain.getAccountFor(id);
    tranche.details = { name: account.metadata.name, urls: account.urls };
    resolve();
  });
}

// Utility functions

function getSessionFromAccount(req, account) {
  req.session.ykid = account.id;
  req.session.ykcid = account.communityIds[req.session.ykcidx || 0];
  req.session.name = account.metadata.name;
  req.session.account = account;
  req.session.urls = account.urls.split(util.separator);
}

function getLongUrlFromShort(shortUrl) {
  var url = shortUrl;
  if (!url || url.length === 0) {
    return 'error No URL';
  }
  url = url.toLowerCase();
  if (url.indexOf("@") > 0) {
    if (!url.startsWith("mailto:")) {
      url = "mailto:" + url;
    }
    // should maybe be on-chain: do some basic URL validation, fixing the "+" Gmail/GSuite hack
    if (url.indexOf('+') > 0) {
      return 'error Bad Email';
    }
  } else {
    if (url.startsWith("@")) {
      url = url.substring(1);
    }
    if (!url.startsWith("https:")) {
      url = "https://twitter.com/" + url;
    }
  }
  if (!util.verifyURLs(url)) {
    return 'error Bad URL';
  }
  return url;
}

function hasNeverLoggedIn(account) {
  let noSlackUrl = (account.urls || '').indexOf("slack:") >= 0;
  let noWebLogin = account.flags === '0x0000000000000000000000000000000000000000000000000000000000000001';
  return account.id === 0 || (noWebLogin && noSlackUrl);
}

function isStrictCommunity(community) {
  return community.flags === '0x0000000000000000000000000000000000000000000000000000000000000001';
}

module.exports = router;
