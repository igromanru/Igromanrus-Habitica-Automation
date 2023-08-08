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

function test() {
  const dayStartOffset = 1;
  const now = new Date();
  now.setHours(dayStartOffset, 0, 0, 0);

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
    console.log('sendPM: targetUserId: ' + targetUserId + ' textMessage: ' + textMessage);
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
    const errorData = JSON.parse(userResponse).data;
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
  const responseData = JSON.parse(userResponse).data;

  if (responseCode != 200) {
    console.log('Error code: ' + responseData.error);
    console.log('Error message: ' + responseData.message);
  }

  return responseCode == 200 && responseData.data;
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
  console.log(response.getContentText());
}