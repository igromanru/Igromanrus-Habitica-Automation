/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const SCRIPT_NAME = "Igromanru's Habitica Automation";
const AUTHOR_ID = "06b046d4-160a-4a20-b527-b74385052f0e";

const ScriptProperties = PropertiesService.getScriptProperties();
const ScriptLock = LockService.getScriptLock();
const DefaultLockTime = 30 * 1000; // 30 seconds

const UserId = ScriptProperties.getProperty('API_ID');
const ApiToken = ScriptProperties.getProperty('API_KEY');
const WebAppUrl = "https://script.google.com/macros/s/AKfycbycV4sr005z_yjZL2wAGf8rXRk0Nv6LePYS7L1LyU6an6vxZH7ZeIv4a5O9nALIyWFB/exec";

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

function test2() {
  let obj = {
    test: 'hallo'
  };
  addRandomWebHookContentProperty(JSON.stringify(obj));
  obj.test = "there";
  addRandomWebHookContentProperty(JSON.stringify(obj));

  const objts = popAllRandomWebHookContentProperties();
  for (let qw of objts) {
    console.log(JSON.stringify(qw));
  }
}

/**
 * Probability is percentage as a float number from 0 to 1.0
 * 
 * 0.1 = 10%, 1.0 = 100%
 */
function getRandomBooleanWithProbability(probability) {
  if (probability < 0 || probability > 1.0) {
    throw new Error('Chance must be between 0 and 1.0');
  }
  return probability === 1 || Math.random() < probability;
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

function setSentToSleepByScript(value) {
  if (typeof value === 'boolean') {
    ScriptProperties.setProperty("SENT_TO_SLEEP_BY_SCRIPT", value);
  } else {
    console.error(`setSentToSleepByScript: Error value has wrong type: ${value}`);
  }
}

function isSentToSleepByScript() {
  const value = ScriptProperties.getProperty("SENT_TO_SLEEP_BY_SCRIPT");
  return value !== undefined && value.toLowerCase() === "true";
}

function deleteSentToSleepByScript() {
  ScriptProperties.deleteProperty("SENT_TO_SLEEP_BY_SCRIPT");
}

function setLastKnownQuestStatus(status, timestamp = new Date()) {
  if (status && timestamp) {
    const questStatus = {
      questStarted: status === 'questStarted',
      questFinished: status === 'questFinished',
      questInvited: status === 'questInvited',
      timestamp: timestamp.toISOString()
    };
    if (!questStatus.questStarted && !questStatus.questFinished && !questStatus.questInvited) {
      console.error(`setLastKnownQuestStatus: Error no valid status were set.\nstaus: "${status}", timestamp: "${timestamp}"`);
    } else {
      const json = JSON.stringify(questStatus);
      ScriptProperties.setProperty("LAST_KNOWN_QUEST_STATUS", json);
      console.log(`setLastKnownQuestStatus set: ${json}`);
    }
  } else {
    console.error(`setLastKnownQuestStatus: Error staus: "${status}", timestamp: "${timestamp}"`);
  }
}

function getLastKnownQuestStatus() {
  const json = ScriptProperties.getProperty("LAST_KNOWN_QUEST_STATUS");
  console.log(`getLastKnownQuestStatus value: ${json}`);
  if (json) {
    const pojo = JSON.parse(json);
    if (pojo && pojo.timestamp) {
      pojo.timestamp = new Date(pojo.timestamp);
      return pojo;
    }
  }
  return undefined;
}

function deleteLastKnownQuestStatus() {
  const key = "LAST_KNOWN_QUEST_STATUS";
  ScriptProperties.deleteProperty(key);
  console.log(`deleteLastKnownQuestStatus: ${key} deleted`);
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

function addRandomWebHookContentProperty(content) {
  if (typeof content == 'string' && content) {
    ScriptProperties.setProperty("RANDOM_WEBHOOK_CONTENT_" + Utilities.getUuid(), content);
  }
}

function popAllRandomWebHookContentProperties() {
  let webHookContents = [];
  if (ScriptLock.tryLock(DefaultLockTime)) {
    const properties = ScriptProperties.getProperties();
    for (const [key, value] of Object.entries(properties)) {
      if (key.startsWith("RANDOM_WEBHOOK_CONTENT_")) {
        webHookContents.push(JSON.parse(value));
        ScriptProperties.deleteProperty(key);
      }
    }
    ScriptLock.releaseLock();
  } else {
    console.error(`popAllRandomWebHookContentProperties: Failed to acquire the lock for ${DefaultLockTime}ms`);
  }
  return webHookContents;
}

/**
 * Adds WebHook content as object to the stack array property
 */
function pushWebHookContentStackProperty(content) {
  if (typeof content == 'string' && content) {
    const propertyKey = "LAST_WEBHOOK_CONTENT_STACK";
    const pojo = JSON.parse(content);
    if (pojo) {
      if (ScriptLock.tryLock(DefaultLockTime)) {
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
        ScriptLock.releaseLock();
      } else {
        console.error(`pushWebHookContentStackProperty: Failed to acquire the lock for ${DefaultLockTime}ms`);
      }
    }
  }
}

/**
 * Gets WebHook Content stack array and sets the property to an empty array
 */
function popWebHookContentStackProperty() {
  const propertyKey = "LAST_WEBHOOK_CONTENT_STACK";
  if (ScriptLock.tryLock(DefaultLockTime)) {
    let propertyValue = ScriptProperties.getProperty(propertyKey);
    if (propertyValue) {
      const stack = JSON.parse(propertyValue);
      if (stack && stack instanceof Array) {
        ScriptProperties.setProperty(propertyKey, '[]');
        ScriptLock.releaseLock();
        return stack;
      }
    }
    ScriptLock.releaseLock();
  }  else {
    console.error(`popWebHookContentStackProperty: Failed to acquire the lock for ${DefaultLockTime}ms`);
  }

  return [];
}

function setObjectAsScriptProperty(propertyKey, pojo) {
  if (typeof propertyKey == 'string' && propertyKey && typeof pojo == 'object' && pojo) {
    ScriptProperties.setProperty(propertyKey, JSON.stringify(pojo));
  }
}

function getObjectFromScriptProperty(propertyKey) {
  if (typeof propertyKey == 'string' && propertyKey) {
    const json = ScriptProperties.getProperty(propertyKey);
    if (json) {
      return JSON.parse(json);
    }
  }
  return undefined;
}

function popObjectFromScriptProperty(propertyKey) {
  const pojo = getObjectFromScriptProperty(propertyKey);
  if (pojo !== undefined && pojo) {
    ScriptProperties.deleteProperty(propertyKey);
    return pojo;
  }
  return undefined;
}

function setDateAsScriptProperty(propertyKey, dateTime) {
  if (typeof propertyKey == 'string' && propertyKey && dateTime && dateTime instanceof Date) {
    ScriptProperties.setProperty(propertyKey, dateTime.toISOString());
  }
}

function getDateFromScriptProperty(propertyKey) {
  if (typeof propertyKey == 'string' && propertyKey) {
    const isoDate = ScriptProperties.getProperty(propertyKey);
    if (isoDate) {
      return new Date(isoDate);
    }
  }
  return undefined;
}

function popDateFromScriptProperty(propertyKey) {
  const dateTime = getDateFromScriptProperty(propertyKey);
  if (dateTime !== undefined && dateTime) {
    ScriptProperties.deleteProperty(propertyKey);
    return dateTime;
  }
  return undefined;
}