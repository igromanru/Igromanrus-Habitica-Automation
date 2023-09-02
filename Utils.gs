/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const ScriptProperties = PropertiesService.getScriptProperties();

const UserId = ScriptProperties.getProperty('API_ID');
const ApiToken = ScriptProperties.getProperty('API_KEY');
const WebAppUrl = ScriptProperties.getProperty('WEB_APP_URL');

function test() {
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
  if(user === undefined || typeof user.lastCron === undefined) {
    return false;
  }

  const lastCronDate = new Date(user.lastCron);
  lastCronDate.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return lastCronDate < today;
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

function setLastCommandCheckDateTime() {
  ScriptProperties.setProperty("LAST_COMMAND_CHECK_TIME", new Date().toISOString());
}

function getLastCommandCheckDateTime() {
  const value = ScriptProperties.getProperty("LAST_COMMAND_CHECK_TIME");
  if (typeof value === 'string' && value) {
    return new Date(value);
  }
  return new Date(0);
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