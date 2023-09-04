/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const SCRIPT_NAME = "Igromanru's Habitica Automation";
const AUTHOR_ID = "06b046d4-160a-4a20-b527-b74385052f0e";

const ScriptProperties = PropertiesService.getScriptProperties();

const UserId = ScriptProperties.getProperty('API_ID');
const ApiToken = ScriptProperties.getProperty('API_KEY');
const WebAppUrl = ScriptProperties.getProperty('WEB_APP_URL');

function test() {
  console.log(arguments.callee.name);

  const date1 = new Date();
  date1.setHours(date1.getHours() - 26);
  date1.setMinutes(date1.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date1));

  const date2 = new Date();
  date2.setHours(date1.getHours() - 12);
  date2.setMinutes(date2.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date2));

  const date3 = new Date();
  date3.setMinutes(date3.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date3));

  const dayStartOffset = 1;
  const now = new Date();
  // now.setHours(dayStartOffset, 0, 0, 0);

  const hours = now.getHours();
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
 * Checks if last cron were executed before today
 */
function isCronPending(user) {
  if(!user || !user.lastCron) {
    return false;
  }

  const lastCronDate = new Date(user.lastCron);
  lastCronDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return lastCronDate < today;
}

function getTimeDifferenceToNowAsString(dateTime) {
  let result = ``;
  if (dateTime && dateTime instanceof Date) {
    const now = new Date();
    const timeDifference = Math.abs(now - dateTime);

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    
    if (days > 0) {
      result += `${days}d`;
    }
    if (hours > 0) {
      if (result) {
        result += ' ';
      }
      result += `${hours}h`;
    }
    if (minutes > 0) {
      if (result) {
        result += ' ';
      }
      result += `${minutes}min`;
    }
  }
  return result;
}

function getMemberFromArrayById(members, memberId) {
  if (members && members instanceof Array && memberId && typeof memberId === 'string') {
    for (const member of members) {
      if (member && member._id == memberId) {
        return member;
      }
    }
  }
  return undefined;
}

/**
 * Determines if the script was executed longer than 1min ago.
 * It should be used to work around Habitica's rate limit, which is 30 requests per minute
 */
function isLastExecutionOverAMinute() {
  const lastExec = getLastExecutionDateTime();
  const now = new Date();
  return now - lastExec > (60 * 1000);
}

function setLastExecutionDateTime() {
  ScriptProperties.setProperty("LAST_EXECUTION_TIME", new Date().toISOString());
}

function getLastExecutionDateTime() {
  const value = ScriptProperties.getProperty("LAST_EXECUTION_TIME");
  if (typeof value === 'string' && value) {
    return new Date(value);
  }
  return new Date(0);
}

function setLastCommandCheckDateTime(dateTime = new Date()) {
  ScriptProperties.setProperty("LAST_COMMAND_CHECK_TIME", dateTime.toISOString());
}

function getLastCommandCheckDateTime() {
  const value = ScriptProperties.getProperty("LAST_COMMAND_CHECK_TIME");
  if (typeof value === 'string' && value) {
    return new Date(value);
  }
  return new Date(0);
}

function setQuestInvitedTimestamp(dateTime = new Date()) {
  const value = dateTime.toISOString();
  console.log(`${arguments.callee.name}: ${value}`);
  ScriptProperties.setProperty("QUEST_INVITED_TIMESTAMP", value);
}

function getQuestInvitedTimestamp() {
  const value = ScriptProperties.getProperty("QUEST_INVITED_TIMESTAMP");
  console.log(`${arguments.callee.name}: ${value}`);
  if (typeof value === 'string' && value) {
    return new Date(value);
  }
  return undefined;
}

function deleteQuestInvitedTimestamp() {
  ScriptProperties.deleteProperty("QUEST_INVITED_TIMESTAMP");
}

function setQuestStartedTimestamp(dateTime = new Date()) {
  const value = dateTime.toISOString();
  console.log(`${arguments.callee.name}: ${value}`);
  ScriptProperties.setProperty("QUEST_STARTED_TIMESTAMP", value);
}

function getQuestStartedTimestamp() {
  const value = ScriptProperties.getProperty("QUEST_STARTED_TIMESTAMP");
  console.log(`${arguments.callee.name}: ${value}`);
  if (typeof value === 'string' && value) {
    return new Date(value);
  }
  return undefined;
}

function deleteQuestStartedTimestamp() {
  ScriptProperties.deleteProperty("QUEST_STARTED_TIMESTAMP");
}

function setObjectAsScriptProperty(propertyKey, pojo) {
  if (typeof propertyKey == 'string' && propertyKey && typeof pojo == 'object' && pojo) {
    ScriptProperties.setProperty(propertyKey, JSON.stringify(pojo));
  }
}

function getObjectFromScriptProperty(propertyKey) {
  if (typeof propertyKey == 'string' && propertyKey) {
    const json = ScriptProperties.getProperty(propertyKey);
    return JSON.parse(json);
  }
}

function popObjectFromScriptProperty(propertyKey) {
  const pojo = getObjectFromScriptProperty(propertyKey);
  if (pojo !== undefined && pojo) {
    ScriptProperties.deleteProperty(propertyKey);
    return pojo;
  }
  return undefined;
}

function setPartyIdProperty(partyId) {
  if (typeof partyId == 'string' && partyId) {
    ScriptProperties.setProperty("PARTY_ID", partyId);
  }
}

function getPartyIdProperty() {
  const value = ScriptProperties.getProperty("PARTY_ID");
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

/**
 * Adds WebHook content as object to the stack array property
 */
function pushWebHookContentStackProperty(content) {
  if (typeof content == 'string' && content) {
    const propertyKey = "LAST_WEBHOOK_CONTENT_STACK";
    const pojo = JSON.parse(content);
    if (pojo) {
      let propertyValue = ScriptProperties.getProperty(propertyKey);
      if (!propertyValue) {
        propertyValue = '[]';
      }
      const stack = JSON.parse(propertyValue);
      if (stack && stack instanceof Array) {
        stack.push(pojo);
        propertyValue = JSON.stringify(stack);
      }
      ScriptProperties.setProperty(propertyKey, propertyValue);
    }
  }
}

/**
 * Gets WebHook Content stack array and sets the property to an empty array
 */
function popWebHookContentStackProperty() {
  const propertyKey = "LAST_WEBHOOK_CONTENT_STACK";
  let propertyValue = ScriptProperties.getProperty(propertyKey);
  if (propertyValue) {
    const stack = JSON.parse(propertyValue);
    if (stack && stack instanceof Array) {
      ScriptProperties.setProperty(propertyKey, '[]');
      return stack;
    }
  }
  return [];
}