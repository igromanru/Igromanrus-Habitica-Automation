/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */
const scriptProperties = PropertiesService.getScriptProperties();
const userId = scriptProperties.getProperty('API_ID');
const apiToken = scriptProperties.getProperty('API_KEY');
const headers = {
  'x-api-user': userId,
  'x-api-key': apiToken,
};
const baseUrl = 'https://habitica.com/api';
const partyAPI = baseUrl + '/v3/groups/party';
const userAPI = baseUrl + '/v3/user';
const groupsAPI = baseUrl + '/v3/groups';
const membersAPI = baseUrl + '/v3/members';

var CurrentSleepStatus = false;

function getUser() {
  const response = UrlFetchApp.fetch(
    userAPI,
    {
      method: 'get',
      headers
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    return JSON.parse(response);
  } else {
    const errorData = JSON.parse(response);
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
  }
  
  return undefined;
}

function getParty() {
  const response = UrlFetchApp.fetch(
    partyAPI,
    {
      method: 'get',
      headers
    }
  );

  const responseCode = response.getResponseCode();
  if (responseCode == 200) {
    return JSON.parse(response);
  } else {
    const errorData = JSON.parse(response);
    console.log('Error code: ' + errorData.error);
    console.log('Error message: ' + errorData.message);
  }
  
  return undefined;
}

function getMemberById(id) {
  if (id) {
    const response = UrlFetchApp.fetch(
      `${membersAPI}/${id}`,
      {
        method: 'get',
        headers
      }
    );

    const responseCode = response.getResponseCode();
    if (responseCode == 200) {
      return JSON.parse(response);
    } else {
      const errorData = JSON.parse(response);
      console.log('Error code: ' + errorData.error);
      console.log('Error message: ' + errorData.message);
    }
  }
  
  return undefined;
}

/**
 * Send a private message to a user
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
        headers,
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

function sendPMToSelf(messageText) {
  return sendPM(userId, messageText);
}

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
        headers,
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
 */
function buyHealthPotion() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/buy-health-potion`,
    {
      method: 'post',
      headers
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
 */
function toggleSleep() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/sleep`,
    {
      method: 'post',
      headers
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
 */
function buyEnchantedArmoire() {
  const response = UrlFetchApp.fetch(
    `${userAPI}/buy-armoire`,
    {
      method: 'post',
      headers
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
      headers
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
          headers
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
          headers,
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