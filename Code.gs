// --------- Configurations -----------------------------------
const AUTO_ACCEPT_QUESTS = true;

const AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY = true;
const START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART = 2;
const START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED = 100;

const AUTO_TAVERN_IF_NO_QUEST_AT_MY_DAYSTART = true;

const AUTO_CRON = true;
const CRON_X_HOURS_AFTER_DAYSTART = 1;

const AUTO_HEALTH_POSTION = true;
const AUTO_HEALTH_POSTION_IF_HP_UNDER = 20;
// ------------------------------------------------------------
function hourlySchedule() {
  console.log('Get user');
  const userResponse = UrlFetchApp.fetch(
    userAPI,
    {
      method: 'get',
      headers
    }
  );
  console.log('User response code: ' + userResponse.getResponseCode());

  if (userResponse.getResponseCode() == 200) {
    const user = JSON.parse(userResponse).data;
    // console.log('User: ' + JSON.stringify(user));

    const hoursDifference = getHoursDifferenceToDayStart(user);
    console.log('Hours difference to the next Day Start: ' + hoursDifference)

    if (user.party._id) {
      console.log('Get party');
      const partyResponse = UrlFetchApp.fetch(
        partyAPI,
        {
          method: 'get',
          headers
        }
      );
      console.log('Party response code: ' + partyResponse.getResponseCode());

      if (partyResponse.getResponseCode() == 200) {
        const { data: { quest } } = JSON.parse(partyResponse);
        // console.log('Quest: ' + JSON.stringify(quest));
        console.log('Quest active: ' + quest.active);

        acceptQuest(quest);
        checkAndSendQuestProgress(quest, user);
        autoSleep(quest, user);
        autoCron(user);
        
      }
    } else {
      console.log('User is not in a party. Ignoring party request and party related functions.');
    }
    
    autoHealSelf(user);
  }
}

function acceptQuest (quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[habId]) {
    console.log('Run quests accept');

    const response = UrlFetchApp.fetch(
      `${partyAPI}/quests/accept`,
      {
        method: 'post',
        headers
      }
    );

    console.log('Quests accept code: ' + response.getResponseCode());
    console.log(response.getContentText());
  }
}

function checkAndSendQuestProgress(quest, user) {
  if (!AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY) {
    return;
  }

  if (user.preferences.sleep) {
    console.log("checkAndSendQuestProgress: You're sleeping in the tavern");
    return;
  }

  if (quest.key && quest.active && quest.members[habId]) {
    const partyId = user.party._id;

    const bossHp = quest.progress.hp;
    const itemsToCollect = quest.progress.collect;

    const pendingDamage = Math.round(user.party.quest.progress.up * 10) / 10;
    const collectedItems = user.party.quest.progress.collectedItems;
    const hoursDifference = getHoursDifferenceToDayStart(user);

    var progressMessage = ''

    if (bossHp != undefined && bossHp > 0) {
      progressMessage = 'Pending damage: ' + pendingDamage
    } else if (itemsToCollect && Object.keys(itemsToCollect).length && collectedItems != undefined && collectedItems > 0) {
      progressMessage = 'Pending items: ' + collectedItems
    }

    if (progressMessage) {
      if (hoursDifference <= 0) {
        progressMessage += ' within the next hour'
      } else {
        progressMessage += ' in about ' + hoursDifference + ' hours'
      }
      progressMessage += '  \n\n*This is a script generated message*'
      console.log(progressMessage);
      if (hoursDifference <= START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART || pendingDamage >= START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED)
      {
        const messageData = {
          message: progressMessage
        };
        const chatResponse = UrlFetchApp.fetch(
          `${groupsAPI}/${partyId}/chat`,
          {
            method: 'post',
            headers,
            contentType : 'application/json',
            payload : JSON.stringify(messageData)
          }
        );
        console.log('Chat send response code: ' + chatResponse.getResponseCode());
      }
    }
  }
}

function autoSleep(quest, user) {
  if (!AUTO_TAVERN_IF_NO_QUEST_AT_MY_DAYSTART) {
    return;
  }

  if (user.preferences.sleep) {
    console.log("autoSleep: You're sleeping in the tavern already");
    return;
  }

  const hoursDifference = getHoursDifferenceToDayStart(user);
  if (((hoursDifference < 1 && hoursDifference > -1) || hoursDifference > 23)
      && (!quest.key || !quest.active) && !user.preferences.sleep
      && user.party.quest.progress.up >= 10) {
    console.log('No quest is running, toggling sleep...');
    const sleepState = toggleSleep();
    if (sleepState) {
      console.log('Sleep state: ' + sleepState);
      sendPM(habId, 'No quest is active, you were sent to sleep  \n*autoSleep script*');
    }
  }
}

function autoCron(user) {
  if (!AUTO_CRON) {
    return;
  }

  if (!user) {
    console.error('autoCron: Undefined user object');
    return;
  }
  const hoursDifference = getHoursDifferenceToDayStart(user);
  const before = 24.5 - CRON_X_HOURS_AFTER_DAYSTART;
  const after = 23.5 - CRON_X_HOURS_AFTER_DAYSTART;
  if (hoursDifference <= before && hoursDifference >= after) {
    runCron();
  }
}

function autoHealSelf(user) {
  if (AUTO_HEALTH_POSTION && user) {
    const healUnderHp = AUTO_HEALTH_POSTION_IF_HP_UNDER;
    const currentHp = user.stats.hp;

    if (currentHp <= healUnderHp) {
      console.error('autoHealSelf: Current HP is under' + healUnderHp + ' buying a health postion.');
      buyHealthPotion();
    }
  }
}