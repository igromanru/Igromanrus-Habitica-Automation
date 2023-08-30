/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */
// --------- Configurations -----------------------------------
const AUTO_ACCEPT_QUESTS = true;

const AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY = false;
const START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART = 2;
const START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED = 100; // x hours OR x damage

const AUTO_TAVERN_IF_NO_QUEST_AT_CRON = true;

const AUTO_CRON = true;
const CRON_X_HOURS_AFTER_DAYSTART = 1;

const AUTO_HEALTH_POSTION = true;
const AUTO_HEALTH_POSTION_IF_HP_UNDER = 20;

const AUTO_BUY_ENCHANTED_ARMOIRE = false;
const BUY_ENCHANTED_ARMOIRE_OVER_X_GOLD = 1100;
const SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO = true;

const AUTO_ALLOCATE_STAT_POINTS = true;
const ALLOCATE_STAT_POINTS_TO = "int"; // str = Strength, con = Constitution, int = Intelligence, per = Perception

const AUTO_ACCUMULATE_DAMAGE = true;
const ACCUMULATE_UNTIL_ONE_HIT = true;
// const DAMAGE_TO_ACCUMULATE = 1000; // Not implemented

// Install settings
const TRIGGER_EACH_X_MINUTES = 30;
// ------------------------------------------------------------
/**
 * Main entry, that should be executed each hour by a tigger
 */
function triggerSchedule() {
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

    if (user && user.preferences && user.preferences.sleep != undefined) {
      CurrentSleepStatus = user.preferences.sleep;
    }

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

        if (quest.key) {
          console.log('Quest key: ' + quest.key);
          if (quest.active) {
            console.log('The quest is active');
          }
        } else {
          console.log('No active quest');
        }

        acceptQuest(quest);
        checkAndSendQuestProgress(user, quest);
        // autoSleep(user, quest);
        autoAccumulateDamage(user, quest);
        autoCron(user);
      }
    } else {
      console.log('User is not in a party. Ignoring party request and party related functions.');
    }
    
    autoHealSelf(user);
    autoBuyEnchantedArmoire(user);
    autoAllocateStatPoints(user);
  }
}

/**
 * Install scheduled triggers
 */
function installTrigger() {
  uninstallTrigger();
  console.log("Creating triggers...");

  const trigger = ScriptApp.newTrigger(triggerSchedule.name)
    .timeBased()
    .everyMinutes(TRIGGER_EACH_X_MINUTES)
    .create();
  
  if (trigger) {
    console.log("Trigger created for: " + trigger.getHandlerFunction());
  }
}

/**
 * Uninstall scheduled triggers
 */
function uninstallTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    console.log("Deleting triggers");

    for (const trigger of triggers) {
      const functionName = trigger.getHandlerFunction();
      if (functionName == triggerSchedule.name) {
        ScriptApp.deleteTrigger(trigger);
        console.log("Trigger deleted: " + functionName);
      }
    }
  }
}

function acceptQuest (quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[userId]) {
    console.log('Run quests accept');

    const response = UrlFetchApp.fetch(
      `${partyAPI}/quests/accept`,
      {
        method: 'post',
        headers
      }
    );

    console.log('Quests accept code: ' + response.getResponseCode());
    // console.log(response.getContentText());
  }
}

function checkAndSendQuestProgress(user, quest) {
  if (!AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY) {
    return;
  }

  if (CurrentSleepStatus) {
    console.log("checkAndSendQuestProgress: You're sleeping in the tavern");
    return;
  }

  if (quest.key && quest.active && quest.members[userId]) {
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
      if (hoursDifference <= 0.1) {
        progressMessage += ' with the next cron'
        if (AUTO_CRON) {
          progressMessage += `  \n\nNext automated cron will be in about ${CRON_X_HOURS_AFTER_DAYSTART} hour(s)`
        }
      } else {
        progressMessage += ' in about ' + hoursDifference + ' hour(s)'
      }
      progressMessage += '  \n\n*This is a script generated message*'
      if (hoursDifference <= START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART || pendingDamage >= START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED)
      {
        console.log(progressMessage);
        sendMessageToGroup(partyId, progressMessage);
      }
    }
  }
}

function autoAccumulateDamage(user, quest) {
  if (AUTO_ACCUMULATE_DAMAGE && user && quest) {
    if (CurrentSleepStatus) {
      console.log("autoAccumulateDamage: You're sleeping in the tavern");
      return;
    }

    const hoursDifference = getHoursDifferenceToDayStart(user);
    if ((hoursDifference < 1 || (hoursDifference >= 12 && isCronPending(user)))
      && (!quest.key || !quest.active || quest.progress === undefined || user.party.quest.progress.up < quest.progress.hp)
      && !CurrentSleepStatus) {
      console.log('Toggling sleep to accumulate damage...');
      if (toggleSleep()) {
        console.log('Sleep state: ' + CurrentSleepStatus);

        let message = 'You were sent to sleep to accumulate damage ';
        if (!quest.key || !quest.active || quest.progress !== undefined) {
          message += 'because no quest is active.  \n';
        } else {
          message += ` \nCurrent damage: ${user.party.quest.progress.up}  \nBosses HP: ${quest.progress.hp}  \n`;
        }
        message += '*autoAccumulateDamage script*';
        sendPMToSelf(message);
      }
    }
  }
}

function autoSleep(user, quest) {
  if (!AUTO_TAVERN_IF_NO_QUEST_AT_CRON) {
    return;
  }

  if (CurrentSleepStatus) {
    console.log("autoSleep: You're sleeping in the tavern already");
    return;
  }

  const hoursDifference = getHoursDifferenceToDayStart(user);
  if ((hoursDifference < 1 || (hoursDifference >= 12 && isCronPending(user)))
      && (!quest.key || !quest.active) && !CurrentSleepStatus
      && user.party.quest.progress.up >= 10) {
    console.log('No quest is running, toggling sleep...');
    const sleepState = toggleSleep();
    if (sleepState) {
      console.log('Sleep state: ' + sleepState);
      sendPMToSelf('No quest is active, you were sent to sleep  \n*autoSleep script*');
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

    if (healUnderHp > 0 && currentHp <= healUnderHp) {
      console.log('autoHealSelf: Current HP is or under' + healUnderHp + ', buying a health postion.');
      buyHealthPotion();
    }
  }
}

function autoBuyEnchantedArmoire(user) {
  if (AUTO_BUY_ENCHANTED_ARMOIRE && user) {
    const enchantedArmoireCost = 100;
    const buyOverOrEqual = BUY_ENCHANTED_ARMOIRE_OVER_X_GOLD;
    const currentGold = user.stats.gp;

    const toBuyCount = Math.floor((currentGold - (buyOverOrEqual - enchantedArmoireCost)) / enchantedArmoireCost);
    if (toBuyCount > 0) {
      console.log(`autoBuyEnchantedArmoire: Current Gold (${currentGold}) is or over ${buyOverOrEqual}, buying Enchanted Armoire ${toBuyCount} times.`);

      var pmMessage = '**Bought Enchanted Armoire:**  \n';
      var boughtCount = 0;
      for (var i = 0; i < toBuyCount; i++) {
        const responseJson = buyEnchantedArmoire();
        if (responseJson) {
          pmMessage += `${JSON.stringify(responseJson.data.armoire)}  \n`;
          boughtCount++;
        } else {
          break;
        }
      }
      if (SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO) {
        pmMessage += `**Successfully bought: ${boughtCount} out of ${toBuyCount}**`;
        // console.log('Sending PM: ' + pmMessage);
        sendPMToSelf(pmMessage)
      }
    }
  }
}

function autoAllocateStatPoints(user) {
  if (AUTO_ALLOCATE_STAT_POINTS && user) {
    const pointsToAllocate = user.stats.points;
    const userLvl = user.stats.lvl;

    if (pointsToAllocate > 0 && userLvl >= 10 && !user.preferences.disableClasses) {
      console.log(`autoAllocateStatPoints: Allocating ${pointsToAllocate} stat points into "${ALLOCATE_STAT_POINTS_TO}"`);
      allocateStatPoints(ALLOCATE_STAT_POINTS_TO, pointsToAllocate);
    }
  }
}