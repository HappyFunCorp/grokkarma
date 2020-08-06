#! /usr/bin/env node

require('dotenv').config();

var eth = require('../routes/eth');

const REFRESH_WINDOW = 20 * 60 * 24 * 7;
const REPLENISH_AMOUNT = 100;

var fromAccount;
var blockNumber;

console.log(new Date().toUTCString());
console.log("ykarma", process.env.YKARMA_ADDRESS);
eth.web3.eth.getAccounts().then((ethAccounts) => {
  fromAccount = ethAccounts[0];
  eth.web3.eth.getBlockNumber((error, bn) => {
    console.log("blockNumber", bn);
    blockNumber = bn;
    doReplenish();
  });
});

async function doReplenish() {
  var method = eth.contract.methods.getCommunityCount();
  try {
    let result = await method.call();
    let communityCount = parseInt(result);
    console.log('getCommunityCount result', communityCount);
    for (var i = 1; i <= communityCount; i++) {
      let community = await eth.getCommunityFor(i);
      replenishCommunity(community);
    }
  } catch(error) {
    console.log('getCommunityCount error', error);
  }
}

async function replenishCommunity(community) {
  console.log('replenishing community', community.id);
  var method = eth.contract.methods.getAccountCount(community.id);
  try {
    let result = await method.call();
    for (var i = 0; i < result; i++) {
      getAccountWithinCommunity(community.id, i, (account) => {
        if (account.flags !== '0x0000000000000000000000000000000000000000000000000000000000000001') { // if not newly created by receipt
          replenishAccount(account);
        }
      });
    }
  } catch(error) {
    console.log('replenishCommunity getAccountCount error', error);
  }
}

async function getAccountWithinCommunity(communityId, idx, callback) {
  var method = eth.contract.methods.accountWithinCommunity(communityId, idx);
  try {
    let result = await method.call();
    var account = eth.getAccountFromResult(result);
    callback(account);
  } catch(error) {
    console.log('accountWithinCommunity error', error);
  }
}

async function replenishAccount(account) {
  var lastReplenished = eth.contract.methods.lastReplenished(account.id);
  try {
    let latest = await lastReplenished.call();
    if (latest > 0 && blockNumber - latest < REFRESH_WINDOW) {
      console.log("not replenishing account", account.id);
      return;
    }
    console.log("replenishing account", account.id);
    var replenish = eth.contract.methods.replenish(account.id);
    replenish.estimateGas({gas: eth.GAS}, function(estError, gasAmount) {
      var notify = true;
      if (estError) {
        console.log('estimation error', estError);
        return;
      }
      replenish.send({from:fromAccount, gas: gasAmount * 2}).on('error', (error) => {
        console.log('replenish error', error);
      })
      .on('confirmation', (number, receipt) => {
        if (notify) {
          notify = false;
          var metadata = account.metadata || {};
          var emailPrefs = metadata.emailPrefs || {};
          sendReplenishSlack(account);
          if (emailPrefs.wk !== 0) {
            sendReplenishEmail(account);
          }
        }
      });
    });
  } catch(error) {
    console.log('replenishAccount error', error);
  }
}

function sendReplenishEmail(account) {
  // Removed from fork
}

function sendReplenishSlack(account) {
  // Removed from fork
}

