/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const AUTHOR_ID = "06b046d4-160a-4a20-b527-b74385052f0e";

const ScriptProperties = PropertiesService.getScriptProperties();
const ScriptLock = LockService.getScriptLock();
const DefaultLockTime = 30 * 1000; // 30 seconds

const UserId = ScriptProperties.getProperty('API_ID');
const ApiToken = ScriptProperties.getProperty('API_KEY');
const WebAppUrl = ScriptProperties.getProperty('WEB_APP_URL');

// Initiliaze the Habitica Librariy, with API credentials and script properties
Habitica.initialize(UserId, ApiToken, ScriptProperties);

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
    } else if(Math.round(user.stats.hp) < user.stats.maxHealth) {
      result = '💜';
    }
  } else {
    console.error(`getUserHealthAsEmoji error: Invalid user parameter`);
  }
  return result; 
}

function getTriggeredByMessage(triggeredBy) {
  console.log(`Triggered by: ${JSON.stringify(triggeredBy)}`);
  if (typeof triggeredBy === 'string' && triggeredBy) {
    return '`The command was triggered by ' + triggeredBy +'`  \n';
  }
  return '';
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

function setLastKnownQuestStatus(data, timestamp = new Date()) {
  if (data.type && data.quest && Habitica.isDate(timestamp)) {
    const questStatus = {
      questStarted: data.type === 'questStarted',
      questFinished: data.type === 'questFinished',
      questInvited: data.type === 'questInvited',
      questKey: data.quest.key,
      questOwner: data.user ? data.user._id : "",
      timestamp: timestamp.toISOString()
    };
    if (!questStatus.questStarted && !questStatus.questFinished && !questStatus.questInvited) {
      console.error(`setLastKnownQuestStatus: Error no valid status were set.\npayload: "${JSON.stringify(data)}", timestamp: "${timestamp}"`);
    } else {
      const json = JSON.stringify(questStatus);
      ScriptProperties.setProperty("LAST_KNOWN_QUEST_STATUS", json);
      console.log(`setLastKnownQuestStatus set: ${json}`);
    }
  } else {
    console.error(`setLastKnownQuestStatus: Error payload: ${JSON.stringify(data)}, timestamp: "${timestamp}"`);
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

function setPartyMembersCache(partyMembers) {
  if (Array.isArray(partyMembers) && partyMembers.length > 0) {
    const partyMembersCache = {
      timestamp: new Date().toISOString(),
      members: []
    };
    for (const member of partyMembers) {
      partyMembersCache.members.push({
        id: member._id,
        username: member.auth.local.username,
        displayName: member.profile.name
      });
    }
    ScriptProperties.setProperty("PARTY_MEMBERS_CACHE", JSON.stringify(partyMembersCache));
  } else {
    console.error(`setPartyMembersCache: Invalid partyMembers array. Type: ${typeof partyMembers}`);
  }
}

function getPartyMembersCache() {
  const json = ScriptProperties.getProperty("PARTY_MEMBERS_CACHE");
  console.log(`getPartyMembersCache value: ${json}`);
  if (json) {
    const pojo = JSON.parse(json);
    if (pojo && pojo.timestamp) {
      pojo.timestamp = new Date(pojo.timestamp);
      return pojo;
    }
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