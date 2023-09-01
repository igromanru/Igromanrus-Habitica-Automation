/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const HEADERS = {
  "x-client" : "06b046d4-160a-4a20-b527-b74385052f0e-Igromanrus_Habitica_Automation",
  'x-api-user': UserId,
  'x-api-key': ApiToken,
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
      HEADERS
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
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
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
      HEADERS
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    const pojo = JSON.parse(response);
    if (pojo.success && pojo.data && typeof pojo.data === 'object') {
      return pojo.data;
    }
  } else {
    const errorData = JSON.parse(response);
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
  }
  
  return undefined;
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
        HEADERS
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode == 200) {
      const pojo = JSON.parse(response);
      if (pojo.success && pojo.data && typeof pojo.data === 'object') {
        return pojo.data;
      }
    } else {
      const errorData = JSON.parse(response);
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
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
        HEADERS
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
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
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
        HEADERS,
        contentType : 'application/json',
        payload : JSON.stringify(requestBody)
      }
    );

    const responseCode = response.getResponseCode();
    console.log('Send PM response code: ' + responseCode);

    if (responseCode != 200) {
      const errorData = JSON.parse(response).data;
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
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
        HEADERS,
        contentType : 'application/json',
        payload : JSON.stringify(messageData)
      }
    );

    const responseCode = response.getResponseCode();
    console.log('Group Chat send response code: ' + responseCode);

    if (responseCode != 200) {
      const errorData = JSON.parse(response).data;
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
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
      HEADERS
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Buy Health Potion response code: ' + responseCode);

  if (responseCode != 200) {
    const errorData = JSON.parse(response).data;
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
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
      HEADERS
    }
  );

  const responseCode = response.getResponseCode();
  console.log('Toggle sleep response code: ' + responseCode);
  const responseData = JSON.parse(response).data;

  if (responseCode != 200) {
    console.log('Error code: ' + responseData.error);
    console.log('Error message: ' + responseData.message);
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
      HEADERS
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
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
  }

  return undefined;
}

/**
 * Purchase Gem or Gem-purchasable item
 * 
 * https://habitica.com/apidoc/#api-User-UserPurchase
 */
function buyGemPurchasableItem(type, key, count = 1) {
  if ((type === "gems" && key === "gem") || type === "eggs" || type === "hatchingPotions"
      || type === "premiumHatchingPotions" || type === "food" || type === "quests" || type === "gear" || type === "pets") {

    const requestBody = {
      quantity: count
    };
    const response = UrlFetchApp.fetch(
      `${userAPI}/purchase/${type}/${key}`,
      {
        method: 'post',
        HEADERS,
        contentType: 'application/json',
        payload: JSON.stringify(requestBody)
      }
    );

    const responseCode = response.getResponseCode();
    console.log(`Buy Purchasable Item (type: ${type}, key: ${key}) response code: ${responseCode}`);

    if (responseCode == 200) {
      const responseJson = JSON.parse(response);
      // ToDo: Find out the result and edit
      // console.log(`Armoire json: ` + JSON.stringify(responseJson.data.armoire));
      // console.log('Message:' + responseJson.message);
      return responseJson;
    } else {
      const errorData = JSON.parse(response);
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
    }
  } else {
    console.error(`buyPurchasableItem: type (${type}) or key (${key}) are invalid`);
  }

  return undefined;
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
      HEADERS
    }
  );

  console.log('runCron Response code: ' + response.getResponseCode());
  // console.log(response.getContentText());
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
          HEADERS
        }
      );
      const responseCode = response.getResponseCode();
      console.log(`Allocate Stat Point (${stat}) response code: ${responseCode}`);

      if (responseCode == 200) {
        console.log('Stat Point successfully allocated');
      } else {
        const errorData = JSON.parse(response);
        console.log('Error code: ' + errorData.error);
        console.log('Error message: ' + errorData.message);
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
          HEADERS,
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
        console.log('Error code: ' + errorData.error);
        console.log('Error message: ' + errorData.message);
      }
    } else {
      console.log(`allocateStatPoints Error: Stat "${stat}" is not a valid parameter`)
    }
  }
}