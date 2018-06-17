pragma solidity 0.4.23;
pragma experimental ABIEncoderV2;

import "./arachnid/strings.sol";
import "./zeppelin/ownership/Ownable.sol";
import "./YKStructs.sol";

//TODO SafeMath
contract YKTranches is Ownable, YKStructs {
  using strings for *;
  mapping(uint256 => Giving) giving;
  mapping(uint256 => Spending) spending;
  uint256 EXPIRY_WINDOW = 691200;
  uint256 REFRESH_WINDOW = 40320;
  uint256 GIVING_AMOUNT = 100;

  function availableToGive(uint256 _id) public returns (uint256) {
    uint256 total = 0;
    recalculateGivingTranches(_id);
    for (uint256 i=0 ; i<giving[_id].amounts.length; i++) {
      total += giving[_id].amounts[i];
    }
    return total;
  }
  
  function give(uint256 _amount, uint256 _sender, uint256 _recipient, string _tags) public {
    require (_recipient > 0);
    uint256 accumulated;
    Giving storage available = giving[_sender];
    for (uint256 i=0; i < available.amounts.length; i++) {
      if (accumulated + available.amounts[i] >= _amount) {
        available.amounts[i] = available.amounts[i] - accumulated - _amount;
        accumulated = _amount;
        break;
      } else {
        accumulated = accumulated + available.amounts[i];
        available.amounts[i] = 0;
      }
    }
    Spending storage receiver = spending[_recipient];
    receiver.amounts.push(accumulated);
    receiver.tags.push(_tags);
  }
  
  function availableToSpend(uint256 _id, string _tag) public view returns (uint256) {
    uint256 total = 0;
    Spending storage available = spending[_id];
    for (uint256 i=0; i < available.amounts.length; i++) {
      if (tagsIncludesTag(available.tags[i], _tag)) {
        total += available.amounts[i];
      }
    }
    return total;
  }
  
  function spend(uint256 _amount, uint256 _spender, string _tag) public onlyOwner {
    uint256 accumulated;
    Spending storage available = spending[_spender];
    for (uint i = 0; i < available.amounts.length; i++) {
      if (!tagsIncludesTag(available.tags[i], _tag)) {
        continue;
      }
      if (accumulated + available.amounts[i] >= _amount) {
        available.amounts[i] = available.amounts[i] - (_amount - accumulated);
        accumulated = _amount;
        break;
      } else {
        accumulated = accumulated + available.amounts[i];
        available.amounts[i] = 0;
      }
    }
  }
  
  function replenish(uint256 _accountId) public onlyOwner {
    Giving storage recipient = giving[_accountId];
    recipient.blocks.push(block.number);
    recipient.amounts.push(100);
  }
  
  function recalculateGivingTranches(uint256 _id) public onlyOwner {
    Giving storage available = giving[_id];
    if (available.amounts.length == 0) {
      return;
    }
    uint256 cutoffBlock = block.number - EXPIRY_WINDOW;
    for (uint256 i=0; i < available.blocks.length; i++ ) {
      if (available.blocks[i] < cutoffBlock) {
        available.amounts[i] = 0;
      }
    }
    // catch up on any replenish calls we might have missed, basically
    uint256 lastBlock = available.blocks[available.blocks.length - 1];
    while (block.number - lastBlock > REFRESH_WINDOW) {
      available.blocks.push(lastBlock + REFRESH_WINDOW);
      available.amounts.push(GIVING_AMOUNT);
      lastBlock = lastBlock + REFRESH_WINDOW;
    }
    uint256 tranchesToDelete = 0;
    for (uint256 j=0; j < available.amounts.length; j++) {
      if (available.amounts[j] == 0) {
        tranchesToDelete++;
      } else {
        break;
      }
    }
    for (uint256 k=0; k < tranchesToDelete; k++){
        available.amounts[k] = available.amounts[k+tranchesToDelete];
        delete available.amounts[available.amounts.length-1];
        available.blocks[k] = available.blocks[k+tranchesToDelete];
        delete available.blocks[available.blocks.length-1];
    }
  }

  function tagsIncludesTag(string _tags, string _tag) public pure returns (bool) {
    strings.slice memory s1 = _tags.toSlice();
    strings.slice memory s2 = s1.find(_tag.toSlice());
    return !s2.empty();
  }
}
