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
  console.log('Buying a Health Potion');

  const result = fetchPost(`${userAPI}/buy-health-potion`);
  if (result !== undefined && result) {
    return result.success === true;
  }

  return false;
}

/**
 * Toggle sleep state (Tavern)
 * 
 * Returns true if sleeping, else false
 * https://habitica.com/apidoc/#api-User-UserSleep
 */
function toggleSleep() {
  console.log('Toggling sleep');

  const result = fetchPost(`${userAPI}/sleep`);
  if (result !== undefined && result && typeof result.data === 'boolean') {
    CurrentSleepStatus = result.data;
  }

  return CurrentSleepStatus;
}

/**
 * Buy an Enchanted Armoire item
 * 
 * https://habitica.com/apidoc/#api-User-UserBuyArmoire
 */
function buyEnchantedArmoire() {
  console.log('Buying Enchanted Armoire');

  const result = fetchPost(`${userAPI}/buy-armoire`);
  if (result !== undefined && result) {
    console.log(`Armoire json: ` + JSON.stringify(result.data.armoire));
    console.log('Message:' + result.message);
    return result;
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
    console.log(`Buying Gem Purchasable Item (type: ${type}, key: ${key}, amount: ${amount})`);
    const requestBody = {
      quantity: amount
    };
    const result = fetchPost(`${userAPI}/purchase/${type}/${key}`, requestBody);
    if (result !== undefined && result) {
      return result.success === true;
    }
  } else {
    console.error(`buyPurchasableItem: type (${type}) or key (${key}) are invalid`);
  }

  return false;
}

function acceptQuest (quest) {
  if (quest) {
    const result = fetchPost(`${partyAPI}/quests/accept`);
    return result !== undefined && result && result.success === true;
  }
  return false;
}

/**
 * Forces the user to cron if they haven't already cronned today.
 * 
 * Run this function just after the user's day start time.
 */
function runCron() {
  console.log('Running cron');
  const result = fetchPost(`${baseUrl}/v3/cron`);
  if (result !== undefined && result && result.success === true) {
    console.log('Cron was successful');
  }
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
      console.log(`Allocating single Stat Point (${stat})`);

      const result = fetchPost(`${userAPI}/allocate?stat=${stat}`);
      if (result !== undefined && result && result.success === true) {
        console.log('Stat Point successfully allocated');
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
      console.log(`Allocating ${amount} Stat Points to the Stat "${stat}"`);

      const payload = {
        stats: {
          [stat]: amount
        }
      };
      const result = fetchPost(`${userAPI}/allocate-bulk`, payload);
      if (result !== undefined && result && result.success === true) {
        console.log('Stat Point successfully allocated');
      }
    } else {
      console.log(`allocateStatPoints Error: Stat "${stat}" is not a valid parameter`)
    }
  }
}

function fetchGet(url) {
  return smartFetch(url, 'GET');
}

function fetchPost(url, requestBody = undefined, contentType = 'application/json') {
  let params = {};
  if (requestBody !== undefined && requestBody) {
    params = {
      'contentType': contentType,
      'payload': JSON.stringify(requestBody)
    };
  }
  return smartFetch(url, 'POST', params);
}

function smartFetch(url, method = 'GET', params = {}) {
  params = Object.assign({
    'method': method,
    'headers': Headers,
    'muteHttpExceptions': true
  }, params);

  for (let i = 0; i < 3; i++) {
    const response = UrlFetchApp.fetch(url, params);
    const responseCode = response.getResponseCode();
    const headers = response.getHeaders();
    const contentText = response.getContentText();

    if (responseCode < 500) {
      const pojo = JSON.parse(contentText);
      if (pojo !== undefined && typeof pojo === 'object') {
        if (pojo.success === true) {
          return pojo;
        } else if(pojo.error === 'TooManyRequests') {
          const remainingRateLimit = headers['x-ratelimit-remaining'];
          const rateLimitResetTime = headers['x-ratelimit-reset'];
          if (remainingRateLimit <= 0 && rateLimitResetTime) {
            const resetDateTime = new Date(rateLimitResetTime);
            if (resetDateTime) {
              const resetInMs =  resetDateTime - (new Date());
              if (resetInMs > 0) {
                Utilities.sleep(resetInMs + 100);
                continue;
              }
            }
          }
        }
      }
    }

    console.error(`Request: ${url}\nResponse code: ${responseCode}\nContent: ${contentText}`);
    return undefined;
  }
}