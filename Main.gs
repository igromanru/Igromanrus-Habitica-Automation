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

const AUTO_BUY_ENCHANTED_ARMOIRE = true;
const BUY_ENCHANTED_ARMOIRE_OVER_X_GOLD = 1100;
const SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO = true;

const AUTO_BUY_GEMS = true;

const AUTO_ALLOCATE_STAT_POINTS = true;
const ALLOCATE_STAT_POINTS_TO = "int"; // str = Strength, con = Constitution, int = Intelligence, per = Perception

const AUTO_ACCUMULATE_DAMAGE = true;
const ACCUMULATE_UNTIL_ONE_HIT = true;
// const DAMAGE_TO_ACCUMULATE = 1000; // Not implemented

// Commands settings
const ENABLE_COMMANDS = true;
const COMMAND_SEND_PARTY_QUEST_PROGRESS = true;
const IGNORE_MEMBERS_WITHOUT_PROGRESS = true;

// Install settings
const TRIGGER_EACH_X_MINUTES = 30; // Must be 1, 5, 10, 15 or 30
const TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES = 5; // Must be 1, 5, 10, 15 or 30
const TRIGGER_PARTY_QUEST_PROGRESS_EACH_X_HOURS = 2;
// ------------------------------------------------------------
/**
 * Main entry, that should be executed each hour by a tigger
 */
function triggerSchedule() {
  const user = getUser();
  if (user) {
    if (user.preferences && user.preferences.sleep !== undefined) {
      CurrentSleepStatus = user.preferences.sleep;
    }

    const hoursDifference = getHoursDifferenceToDayStart(user);
    console.log('Hours difference to the next Day Start: ' + hoursDifference)

    if (user.party._id) {
      setPartyIdProperty(user.party._id);
      
      const party = getParty();
      if (party) {
        let quest = party.quest;
        console.log('Party Id: ' + party.id);

        if (quest.key) {
          console.log('Quest key: ' + quest.key);
          if (quest.active) {
            console.log('The quest is active');
          }
        } else {
          console.log('No active quest');
        }

        autoAcceptQuest(quest);
        // autoSleep(user, quest);
        autoAccumulateDamage(user, quest);
        autoCron(user);
        checkAndSendMyQuestProgress(user, quest);
        // checkAndSendPartyQuestProgress(party, quest);
      }
    } else {
      console.log('User is not in a party. Ignoring party request and party related functions.');
    }
    
    autoHealSelf(user);
    autoBuyEnchantedArmoire(user);
    autoBuyGems(user);
    autoAllocateStatPoints(user);

    setLastExecutionDateTime();
  }
}

/**
 * Install scheduled triggers
 */
function installTrigger() {
  uninstallTrigger();
  console.log("Creating triggers...");

  let triggers = []; 

  triggers.push(ScriptApp.newTrigger(triggerSchedule.name)
    .timeBased()
    .everyMinutes(TRIGGER_EACH_X_MINUTES)
    .create()
  );

  triggers.push(ScriptApp.newTrigger(scheduledCommandsCheck.name)
    .timeBased()
    .everyMinutes(TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES)
    .create()
  );
  
  triggers.push(ScriptApp.newTrigger(checkAndSendPartyQuestProgress.name)
    .timeBased()
    .everyHours(TRIGGER_PARTY_QUEST_PROGRESS_EACH_X_HOURS)
    .create()
  );

  for (const trigger of triggers) {
    if (trigger) {
      console.log("Trigger created for: " + trigger.getHandlerFunction());
    }
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
      switch (functionName) {
        case triggerSchedule.name:
        case scheduledCommandsCheck.name:
        case checkAndSendPartyQuestProgress.name:
          ScriptApp.deleteTrigger(trigger);
          console.log("Trigger deleted: " + functionName);
          break;
      }
    }
  }
}

function doGet(e) {
  var data = JSON.stringify(e.postData);
  console.log(data);
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var data = JSON.stringify(e.postData);
  console.log(data);
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}

function autoAcceptQuest(quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[UserId]) {
    console.log('autoAcceptQuest: Accepting inactive quests');
    acceptQuest();
  }
}

function checkAndSendMyQuestProgress(user, quest) {
  if (!AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY) {
    return;
  }

  if (CurrentSleepStatus) {
    console.log("checkAndSendMyQuestProgress: You're already sleeping in the tavern");
    return;
  }

  if (quest.key && quest.active && quest.members[UserId]) {
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
      console.log("autoAccumulateDamage: Skipping. You're already sleeping in the tavern");
      return;
    }

    const hoursDifference = getHoursDifferenceToDayStart(user);
    const bossQuest = quest.progress.hp > 0;
    // ToDo add logic for items collecting
    if ((hoursDifference < 1 || (hoursDifference >= 12 && isCronPending(user)))
      && (!quest.key || !quest.active || quest.progress === undefined || !bossQuest || user.party.quest.progress.up < quest.progress.hp)
      && !CurrentSleepStatus) {
      console.log('Toggling sleep to accumulate damage...');
      if (toggleSleep()) {
        console.log('Sleep state: ' + CurrentSleepStatus);

        let message = 'You were sent to sleep to accumulate damage ';
        if (!quest.key || !quest.active || quest.progress === undefined) {
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
    console.log("autoSleep: Skipping. You're already sleeping in the tavern");
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
    const enchantedArmoireCost = 100; // 1 Enchanted Armoire costs 100 Gold
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
        sendPMToSelf(pmMessage)
      }
    }
  }
}

function autoBuyGems(user) {
  if (AUTO_BUY_GEMS && user && user.purchased && user.purchased.plan) {
    const gemCost = 20; // 1 gem costs 20 Gold
    const defaultGemCap = 25;
    const currentGold = user.stats.gp;
    const plan = user.purchased.plan;

    const gemsToBuy = Math.min(defaultGemCap + plan.consecutive.gemCapExtra - plan.gemsBought, Math.floor(currentGold / gemCost));
    if (gemsToBuy > 0) {
      buyGems(gemsToBuy);
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

function scheduleCheckAndSendPartyQuestProgress() {
  /*const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    const functionName = trigger.getHandlerFunction();
    if (functionName == checkAndSendPartyQuestProgress.name) {
      ScriptApp.deleteTrigger(trigger);
    }
  }*/

  const trigger = ScriptApp.newTrigger(checkAndSendPartyQuestProgress.name)
    .timeBased()
    .after(1.5 * 60 * 1000) // 1.5 min
    .create();

  if (trigger) {
    console.log("Chained trigger created for: " + trigger.getHandlerFunction());
  }
}

function checkAndSendPartyQuestProgress() {
  const party = getParty();
  if (party) {
    if (party.quest && party.quest.key) {
      const quest = party.quest;
      const bossQuest = quest.progress.hp > 0;
  
      let message = `### Party Quest Status  \n`;
      message += `**Party:** ${party.name}  \n`;
      message += `**Leader:** ${party.leader.profile.name}  \n`;
      message += `**Quest status:** ${quest.active ? 'Active' : 'Waiting for participants'}  \n\n`;

      const partyMembers = Object.entries(quest.members);
      if (quest.active) {
        const membersWithProgress = new Array();
        const membersWithoutProgress = new Array();
        for (const [memberId, isParticipating] of partyMembers) {
          if (isParticipating === true) {
            const member = getMemberById(memberId);
            if (member && member.party._id && member.party.quest.key) {
              if (member.party.quest.progress.up > 0 || member.party.quest.progress.collectedItems > 0) {
                membersWithProgress.push(member);
              } else if(!IGNORE_MEMBERS_WITHOUT_PROGRESS) {
                membersWithoutProgress.push(member);
              }
            }
          }
        }

        const progressType = bossQuest ? 'Damage' : 'Items';
        message += `User | ${progressType} | Last Login | Status  \n`;
        message += `--- | --- | --- | ---  \n`;
        const addMemberInfoToMessage = (memberObj) => {
          const pendingDamage = Math.round(memberObj.party.quest.progress.up * 10) / 10;
          const progress = bossQuest ? pendingDamage : memberObj.party.quest.progress.collectedItems;
          const differenceText = getTimeDifferenceToNowAsString(new Date(memberObj.auth.timestamps.loggedin));
          const lastLogin = differenceText ? `${differenceText} ago` : '';
          const sleeping = memberObj.preferences.sleep ? 'Sleeping' : '';
          message += `${memberObj.profile.name} &ensp; | ${progress} &ensp; | ${lastLogin} &ensp; | ${sleeping}  \n`;
        };
        if (bossQuest) {
          membersWithProgress.sort((a, b) => b.party.quest.progress.up - a.party.quest.progress.up);
        } else {
          membersWithProgress.sort((a, b) => b.party.quest.progress.collectedItems - a.party.quest.progress.collectedItems);
        }
        for (const memberEntry of membersWithProgress) {
          addMemberInfoToMessage(memberEntry);
        }
        if (IGNORE_MEMBERS_WITHOUT_PROGRESS) {
          message += `*The list doesn't contain users who have no quest progress*  \n`;
        } else {
          for (const memberEntry of membersWithoutProgress) {
            addMemberInfoToMessage(memberEntry);
          }
        }
      } else {
        message += `Members who haven't accepted the quest yet:  \n`;
        message += `User | Last Login | Status  \n`;
        message += `--- | --- | ---  \n`;
        for (const [memberId, isParticipating] of partyMembers) {
          if (!isParticipating) {
            const member = getMemberById(memberId);
            if (member && member.party._id) {
              const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
              const lastLogin = differenceText ? `${differenceText} ago` : '';
              message += `${member.profile.name} &ensp; | ${lastLogin} &ensp; | ${member.preferences.sleep ? 'Sleeping' : ''}  \n`;
            }
          }
        }
      }

      sendMessageToGroup(party.id, message);
    }
  }
}