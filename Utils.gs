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
const WebAppUrl = ScriptProperties.getProperty('WEB_APP_URL');

// Initiliaze the Habitica Librariy, with API credentials and script properties
Habitica.initialize(UserId, ApiToken, ScriptProperties);

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

function getTimeDifferenceToNowAsString(dateTime, highlightAfterXDays = 10) {
  let result = ``;
  if (dateTime && dateTime instanceof Date) {
    const now = new Date();
    const timeDifference = Math.abs(now - dateTime);

    const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

    result += `${Habitica.padLeft(days, 2)}d${Habitica.padLeft(hours, 2)}h${Habitica.padLeft(minutes, 2)}m`;
    if (days >= highlightAfterXDays) {
      result = `**${result}**`;
    }
  }
  return result;
}

function getMemberFromArrayById(members, memberId) {
  if (members && Array.isArray(members) && memberId && typeof memberId === 'string') {
    for (const member of members) {
      if (member && member._id == memberId) {
        return member;
      }
    }
  }
  return undefined;
}

function getUserStatusAsEmojis(user) {
  let result = '';
  if (user && user.preferences && user.stats) {
    if (user.stats.hp <= 0) {
      result += '💀';
    }
    if (user.preferences.sleep === true) {
      result += '😴';
    }
  } else {
    console.error(`getUserStatusAsEmojis error: Invalid user parameter`);
  }
  return result;
}

function getUserHealthAsEmoji(user) {
  let result = '❤️';
  if (user && user.stats && user.stats.maxHealth > 0) {
    if (user.stats.hp <= 0) {
      result = '💀';
    } else if(user.stats.hp < user.stats.maxHealth) {
      result = '💔';
    }
  } else {
    console.error(`getUserHealthAsEmoji error: Invalid user parameter`);
  }
  return result; 
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

function isSentToSleepByScript(user) {
  if (user && user.preferences) {
    if (user.preferences.sleep === true) {
      const value = ScriptProperties.getProperty("SENT_TO_SLEEP_BY_SCRIPT");
      return typeof value === 'string' && value.toLowerCase() === "true";
    } else {
      deleteSentToSleepByScript();
    }
  } else {
    console.error(`isSentToSleepByScript: No valid user object passed as parameter`);
  }
  return false;
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