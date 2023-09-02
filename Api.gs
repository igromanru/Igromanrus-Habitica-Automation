/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const Headers = {
  'x-api-user': UserId,
  'x-api-key': ApiToken,
  "x-client": AUTHOR_ID + ' - ' + SCRIPT_NAME
};
const baseUrl = 'https://habitica.com/api';
const partyAPI = baseUrl + '/v3/groups/party';
const userAPI = baseUrl + '/v3/user';
const groupsAPI = baseUrl + '/v3/groups';
const membersAPI = baseUrl + '/v3/members';

var CurrentSleepStatus = false;

/**
 * Returns user object of the current API user
 * 
 * https://habitica.com/apidoc/#api-User-UserGet
 */
function getUser() {
  const response = UrlFetchApp.fetch(
    userAPI,
    {
      method: 'get',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    const pojo = JSON.parse(response);
    if (pojo.success && pojo.data) {
      return pojo.data;
    }
  } else {
    const errorData = JSON.parse(response);
    console.error('Error code: ' + errorData.error);
    console.error('Error message: ' + errorData.message);
  }
  
  return undefined;
}

/**
 * Returns party object for the current API user
 */
function getParty() {
  const response = UrlFetchApp.fetch(
    partyAPI,
    {
      method: 'get',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    const pojo = JSON.parse(response.getContentText());
    if (pojo.success && pojo.data && typeof pojo.data === 'object') {
      return pojo.data;
    }
  } else {
    const errorData = JSON.parse(response);
    console.error('Error code: ' + errorData.error);
    console.error('Error message: ' + errorData.message);
  }
  
  return undefined;
}

/**
 * Get all members for the party
 * It allows to get more detailed infomation about members
 * 
 * Returns an array of members or an empty array.
 * 
 * @See: https://habitica-api.igromanru.com/#/party/get_v3_groups_party_members
 */
function getPartyMembers(includeAllPublicFields = false, includeTasks = false, limit = 30, lastId = '') {
  const lastIdParam = lastId ? `&lastId=${lastId}` : '';
  const response = UrlFetchApp.fetch(
    `${partyAPI}/members?includeTasks=${includeTasks}&includeAllPublicFields=${includeAllPublicFields}&limit=${limit}${lastIdParam}`,
    {
      method: 'get',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    const pojo = JSON.parse(response.getContentText());
    if (pojo.success && pojo.data && pojo.data instanceof Array) {
      return pojo.data;
    }
  } else {
    const errorData = JSON.parse(response);
    console.error('Error code: ' + errorData.error);
    console.error('Error message: ' + errorData.message);
  }

  return [];
}

/**
 * Get all members for a group
 * It allows to get more detailed infomation about members
 * 
 * Returns an array of members or an empty array.
 * 
 * @See: https://habitica.com/apidoc/#api-Member-GetMembersForGroup
 */
function getGroupMembers(groupId, includeAllPublicFields = false, includeTasks = false, limit = 30, lastId = '') {
  if (groupId) {
    const lastIdParam = lastId ? `&lastId=${lastId}` : '';
    const response = UrlFetchApp.fetch(
      `${groupsAPI}/${groupId}/members?includeTasks=${includeTasks}&includeAllPublicFields=${includeAllPublicFields}&limit=${limit}${lastIdParam}`,
      {
        method: 'get',
        headers: Headers
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode == 200) {
      const pojo = JSON.parse(response.getContentText());
      if (pojo.success && pojo.data && pojo.data instanceof Array) {
        return pojo.data;
      }
    } else {
      const errorData = JSON.parse(response);
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }
  }

  return [];
}

/**
 * Returns member object of for a specific member
 * 
 * https://habitica.com/apidoc/#api-Member-GetMember
 */
function getMemberById(memberId) {
  if (memberId) {
    const response = UrlFetchApp.fetch(
      `${membersAPI}/${memberId}`,
      {
        method: 'get',
        headers: Headers
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode == 200) {
      const pojo = JSON.parse(response.getContentText());
      if (pojo.success && pojo.data && typeof pojo.data === 'object') {
        return pojo.data;
      }
    } else {
      const errorData = JSON.parse(response);
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }
  }
  
  return undefined;
}

/**
 * Returns array of chat objects
 * 
 * https://habitica.com/apidoc/#api-Chat-GetChat
 */
function getGroupChat(groupId) {
  if (groupId) {
     const response = UrlFetchApp.fetch(
      `${groupsAPI}/${groupId}/chat`,
      {
        method: 'get',
        headers: Headers
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode == 200) {
      const pojo = JSON.parse(response);
      if (pojo.success && pojo.data && pojo.data instanceof Array) {
        return pojo.data;
      }
    } else {
      const errorData = JSON.parse(response);
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }
  }

  return [];
}

/**
 * Send a private message to a user
 * 
 * https://habitica.com/apidoc/#api-Member-SendPrivateMessage
 */
function sendPM(targetUserId, messageText) {
  if (targetUserId && messageText) {
    console.log('sendPM: targetUserId: ' + targetUserId + '  \nmessageText: ' + messageText);
    const requestBody = {
      message: messageText,
      toUserId: targetUserId
    };
    const response = UrlFetchApp.fetch(
      `${membersAPI}/send-private-message`,
      {
        method: 'post',
        headers: Headers,
        contentType : 'application/json',
        payload : JSON.stringify(requestBody)
      }
    );

    const responseCode = response.getResponseCode();
    console.log('Send PM response code: ' + responseCode);

    if (responseCode != 200) {
      const errorData = JSON.parse(response).data;
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }

    return responseCode == 200;
  }
  return false;
}

/**
 * sendPM, but uses the Id of the API user as target
 */
function sendPMToSelf(messageText) {
  return sendPM(UserId, messageText);
}

/**
 * Send a message to a group (party)
 * 
 * https://habitica.com/apidoc/#api-Chat-PostChat
 */
function sendMessageToGroup(targetGroupId, messageText) {
  if (targetGroupId && messageText) {
    console.log('sendMessageToGroup: targetGroupId: ' + targetGroupId + '  \nmessageText: ' + messageText);
    const messageData = {
      message: messageText
    };
    const response = UrlFetchApp.fetch(
      `${groupsAPI}/${targetGroupId}/chat`,
      {
        method: 'post',
        headers: Headers,
        contentType : 'application/json',
        payload : JSON.stringify(messageData)
      }
    );

    const responseCode = response.getResponseCode();
    console.log('Group Chat send response code: ' + responseCode);

    if (responseCode != 200) {
      const errorData = JSON.parse(response).data;
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }

    return responseCode == 200;
  }

  return false;
}

/**
 * Sends the request to buy a Health Postion
 * 
 * Returns false if failed, otherwise true
 * https://habitica.com/apidoc/#api-User-UserBuyPotion
 */
function buyHealthPotion() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/buy-health-potion`,
    {
      method: 'post',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Buy Health Potion response code: ' + responseCode);

  if (responseCode != 200) {
    const errorData = JSON.parse(response).data;
    console.error('Error code: ' + errorData.error);
    console.error('Error message: ' + errorData.message);
  }

  return responseCode == 200;
}

/**
 * Toggle sleep state (Tavern)
 * 
 * Returns true if sleeping, else false
 * https://habitica.com/apidoc/#api-User-UserSleep
 */
function toggleSleep() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/sleep`,
    {
      method: 'post',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Toggle sleep response code: ' + responseCode);
  const responseData = JSON.parse(response).data;

  if (responseCode != 200) {
    console.error('Error code: ' + responseData.error);
    console.error('Error message: ' + responseData.message);
  }

  if (responseCode == 200) {
    CurrentSleepStatus = responseData;
  }
  return CurrentSleepStatus;
}

/**
 * Buy an Enchanted Armoire item
 * 
 * https://habitica.com/apidoc/#api-User-UserBuyArmoire
 */
function buyEnchantedArmoire() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/buy-armoire`,
    {
      method: 'post',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Buy Enchanted Armoire response code: ' + responseCode);

  if (responseCode == 200) {
    const responseJson = JSON.parse(response);
    console.log(`Armoire json: ` + JSON.stringify(responseJson.data.armoire));
    console.log('Message:' + responseJson.message);
    return responseJson;
  } else {
    const errorData = JSON.parse(response);
    console.error('Error code: ' + errorData.error);
    console.error('Error message: ' + errorData.message);
  }

  return undefined;
}

/**
 * Wrapper for the function buyGemPurchasableItem to buy Gems
 * 
 * Returns true, if successful, otherwise false
 */
function buyGems(amount = 1) {
  console.log(`Buying ${amount} gems`);
  return buyGemPurchasableItem("gems", "gem", amount);
}

/**
 * Purchase Gem or Gem-purchasable item
 * 
 * Returns true, if successful, otherwise false
 * https://habitica.com/apidoc/#api-User-UserPurchase
 */
function buyGemPurchasableItem(type, key, amount = 1) {
  if ((type === "gems" && key === "gem") || type === "eggs" || type === "hatchingPotions"
      || type === "premiumHatchingPotions" || type === "food" || type === "quests" || type === "gear" || type === "pets") {

    const requestBody = {
      quantity: amount
    };
    const response = UrlFetchApp.fetch(
      `${userAPI}/purchase/${type}/${key}`,
      {
        method: 'post',
        headers: Headers,
        contentType: 'application/json',
        payload: JSON.stringify(requestBody)
      }
    );

    const responseCode = response.getResponseCode();
    console.log(`Buy Gem Purchasable Item (type: ${type}, key: ${key}, amount: ${amount}) response code: ${responseCode}`);

    if (responseCode == 200) {
      const responseJson = JSON.parse(response.getContentText());
      return responseJson.success;
    } else {
      const errorData = JSON.parse(response);
      console.error('Error code: ' + errorData.error);
      console.error('Error message: ' + errorData.message);
    }
  } else {
    console.error(`buyPurchasableItem: type (${type}) or key (${key}) are invalid`);
  }

  return false;
}

function acceptQuest (quest) {
  const response = UrlFetchApp.fetch(
    `${partyAPI}/quests/accept`,
    {
      method: 'post',
      headers: Headers
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Quests accept code: ' + responseCode);

  return responseCode == 200;
}

/**
 * Forces the user to cron if they haven't already cronned today.
 * 
 * Run this function just after the user's day start time.
 */
function runCron() {
  const api = `${baseUrl}/v3/cron`;

  console.log('Run cron');
  const response = UrlFetchApp.fetch(
    `${api}`,
    {
      method: 'post',
      headers: Headers
    }
  );

  console.log('runCron Response code: ' + response.getResponseCode());
}

/**
 * Allocate a single Stat Point to a specific Stat
 * 
 * Possible parameter values: 
 *  str = Strength
 *  con = Constitution
 *  int = Intelligence
 *  per = Perception
 */
function allocateStatPoint(stat) {
  if (stat) {
    if (stat == "str" || stat == "con" || stat == "int" || stat == "per") {
      const response = UrlFetchApp.fetch(
        `${userAPI}/allocate?stat=${stat}`,
        {
          method: 'post',
          headers: Headers
        }
      );
      const responseCode = response.getResponseCode();
      console.log(`Allocate Stat Point (${stat}) response code: ${responseCode}`);

      if (responseCode == 200) {
        console.log('Stat Point successfully allocated');
      } else {
        const errorData = JSON.parse(response);
        console.error('Error code: ' + errorData.error);
        console.error('Error message: ' + errorData.message);
      }
    } else {
      console.log(`allocateStatPoint Error: Stat "${stat}" is not a valid parameter`)
    }
  }
}

/**
 * Allocate multiple Stat Points to a specific Stat
 * 
 * Possible parameter values: 
 *  str = Strength
 *  con = Constitution
 *  int = Intelligence
 *  per = Perception
 */
function allocateStatPoints(stat, amount) {
  if (stat && amount) {
    if (stat == "str" || stat == "con" || stat == "int" || stat == "per") {
      const response = UrlFetchApp.fetch(
        `${userAPI}/allocate-bulk`,
        {
          method: 'post',
          headers: Headers,
          contentType: "application/json",
          payload: JSON.stringify({
            stats: {
              [stat]: amount
            }
          })
        }
      );
      const responseCode = response.getResponseCode();
      console.log(`Allocate ${amount} Stat Points (${stat}) response code: ${responseCode}`);

      if (responseCode == 200) {
        console.log('Stat Point successfully allocated');
      } else {
        const errorData = JSON.parse(response);
        console.error('Error code: ' + errorData.error);
        console.error('Error message: ' + errorData.message);
      }
    } else {
      console.log(`allocateStatPoints Error: Stat "${stat}" is not a valid parameter`)
    }
  }
}
