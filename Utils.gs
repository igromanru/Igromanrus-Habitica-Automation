/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */
const scriptProperties = PropertiesService.getScriptProperties();
const habId = scriptProperties.getProperty('API_ID');
const habToken = scriptProperties.getProperty('API_KEY');
const headers = {
  'x-api-user': habId,
  'x-api-key': habToken,
};
const baseUrl = 'https://habitica.com/api';
const partyAPI = baseUrl + '/v3/groups/party';
const userAPI = baseUrl + '/v3/user';
const groupsAPI = baseUrl + '/v3/groups';
const membersAPI = baseUrl + '/v3/members';

var CurrentSleepStatus = false;

function test() {
  const dayStartOffset = 1;
  const now = new Date();
  // now.setHours(dayStartOffset, 0, 0, 0);

  var hours = now.getHours();

  const nextDayStart = new Date();
  if (hours >= dayStartOffset) {
    nextDayStart.setHours(24 + dayStartOffset, 0, 0, 0);
  } else {
    nextDayStart.setHours(dayStartOffset, 0, 0, 0);
  }
  const timeDifference = nextDayStart - now;
  const hoursDifferenceToDayStart = Math.round(timeDifference / (1000 * 60 * 60) * 10) / 10;

  console.log(hoursDifferenceToDayStart);
}

function test2() {
  const floatingNumber = 15.0;
  const testObj1 = {
    progress: {
      hp: 13.37
    }
  }
  const testObj2 = {
    progress: {
      items: 5
    }
  }
  if (floatingNumber >= testObj1.progress.hp) {
    console.log(`${floatingNumber} is bigger equal to ${testObj1.progress.hp}`);
  }
  if (floatingNumber >= testObj2.progress.hp) {
    console.log(`${floatingNumber} is bigger equal to ${testObj2.progress.hp}`);
  }
  console.log(typeof testObj2.progress.hp);
  if (testObj1.progress.items >= testObj2.progress.hp) {
    console.log(`${testObj1.progress.items} is bigger equal to ${testObj2.progress.hp}`);
  }
  if (testObj1.lol != undefined && testObj1.lol.items >= testObj2.lol.hp) {
    console.log(`${testObj1.progress.items} is bigger equal to ${testObj2.progress.hp}`);
  }
}

/**
 * Hours left till the next day starts
 * 
 * Returns -1, if failed
 */
function getHoursDifferenceToDayStart(user) {
  if (!user) {
    console.error('Failed to get get hours difference to day start.\nUser object is undefined');
    return -1;
  }
  const dayStartOffset = user.preferences.dayStart;
  const now = new Date();
  var hours = now.getHours();

  const nextDayStart = new Date();
  if (hours >= dayStartOffset) {
    nextDayStart.setHours(24 + dayStartOffset, 0, 0, 0);
  } else {
    nextDayStart.setHours(dayStartOffset, 0, 0, 0);
  }
  const timeDifference = nextDayStart - now;
  const hoursDifferenceToDayStart = Math.round(timeDifference / (1000 * 60 * 60) * 10) / 10;

  return hoursDifferenceToDayStart;
}

/**
 * Send a private message to a user
 */
function sendPM(targetUserId, textMessage) {
  if (targetUserId && textMessage) {
    console.log('sendPM: targetUserId: ' + targetUserId + '  \ntextMessage: ' + textMessage);
    const requestBody = {
      message: textMessage,
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
    console.log('Send PM response code: ' + response.getResponseCode());
  }
}

function sendMessageToGroup(partyId, messageText) {
  const messageData = {
    message: messageText
  };
  const response = UrlFetchApp.fetch(
    `${groupsAPI}/${partyId}/chat`,
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
    CurrentSleepStatus = responseData.data;
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

/**
 * Checks if last cron were executed before today
 */
function isCronPending(user) {
  if(user === undefined || typeof user.lastCron === undefined) {
    return false;
  }

  const lastCronDate = new Date(user.lastCron);
  lastCronDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return lastCronDate < today;
}