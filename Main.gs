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

const AUTO_ACCUMULATE_DAMAGE = false;
const ACCUMULATE_UNTIL_ONE_HIT = false;
const DAMAGE_TO_ACCUMULATE = 100; // Not implemented

// Commands settings
const ENABLE_COMMANDS = true;
const COMMAND_SEND_PARTY_QUEST_PROGRESS = true;
const PARTY_QUEST_PROGRESS_IGNORE_MEMBERS_WITHOUT_PROGRESS = true;
const PARTY_QUEST_PROGRESS_IGNORE_NOT_PARTICIPATING_MEMBERS = true;

// --- Install settings ---
const TRIGGER_EACH_X_MINUTES = 30; // Must be 1, 5, 10, 15 or 30
// Commands System
const ENABLE_COMMANDS_SYSTEM_WEBHOOK = true;
const COMMANDS_SYSTEM_WEBHOOK_NAME = `${DriveApp.getFileById(ScriptApp.getScriptId()).getName()}-Commands-System`;
const ENABLE_COMMANDS_SYSTEM_TRIGGER = false;
const TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES = 5; // Must be 1, 5, 10, 15 or 30
// Party Quest Status
const ENABLE_PARTY_QUEST_STATUS_TRIGGER = true;
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
function installTriggers() {
  uninstallTriggers();
  console.log("Creating triggers...");

  let triggers = []; 

  triggers.push(ScriptApp.newTrigger(triggerSchedule.name)
    .timeBased()
    .everyMinutes(TRIGGER_EACH_X_MINUTES)
    .create()
  );

  if (ENABLE_COMMANDS_SYSTEM_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(scheduledCommandsCheck.name)
      .timeBased()
      .everyMinutes(TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES)
      .create()
    );
  }
  
  if (ENABLE_PARTY_QUEST_STATUS_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(checkAndSendPartyQuestProgress.name)
      .timeBased()
      .everyHours(TRIGGER_PARTY_QUEST_PROGRESS_EACH_X_HOURS)
      .create()
    );
  }

  for (const trigger of triggers) {
    if (trigger) {
      console.log("Trigger created for: " + trigger.getHandlerFunction());
    }
  }
}

/**
 * Uninstall scheduled triggers
 */
function uninstallTriggers() {
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

function createWebhooks() {
  deleteWebhooks();
  console.log("Creating WebHooks...");

  if (ENABLE_COMMANDS_SYSTEM_WEBHOOK) {
    const partyId = getPartyIdProperty();
    if (partyId) {
      const options = {
        "groupId": partyId
      };
      createWebHook(WebAppUrl, COMMANDS_SYSTEM_WEBHOOK_NAME, 'groupChatReceived', options);
    } else {
      console.error(`Can't create Commands System WebHook, the PARTY_ID property isn't yet set!`);
    }
  }
}

function deleteWebhooks() {
  console.log("Deleting WebHooks...");

  const webHooks = getWebHooks();
  if (webHooks && webHooks.length > 0) {
    for (const webHook of webHooks) {
      if (webHook && webHook.id) {
        switch (webHook.label) {
          case COMMANDS_SYSTEM_WEBHOOK_NAME:
            console.log(`Deleting WebHook: ${webHook.label}`);
            deleteWebHook(webHook.id);
            break;
        }
      }
    }
  } else {
    console.log(`No WebHooks found`);
  }
}

function doGet(e) {
  var data = JSON.stringify(e.postData);
  return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  pushWebHookContentStackProperty(e.postData.contents);

  ScriptApp.newTrigger(evaluateWebHookContentStack.name)
    .timeBased()
    .after(1)
    .create();
}

function evaluateWebHookContentStack() {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === evaluateWebHookContentStack.name) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  const contentStack = popWebHookContentStackProperty();
  if (contentStack && contentStack instanceof Array) {
    console.log(`${arguments.callee.name}: ${contentStack.length} objects in the stack`);
    for (const pojo of contentStack) {
      if (pojo && pojo.chat !== undefined) {
        // Checking if it's an user message, skipping system messages, which have a type
        if (!pojo.chat.info || pojo.chat.info.type === undefined) {
          evaluateMessage(pojo.chat.text);
        }
      }
    }
  } else {
    console.error(`${arguments.callee.name}: WebHook Content Stack doesn't exist`);
  }
}

function autoAcceptQuest(quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[UserId]) {
    console.log(`${arguments.callee.name}: Accepting inactive quests`);
    acceptQuest();
  }
}

function checkAndSendMyQuestProgress(user, quest) {
  if (!AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY) {
    return;
  }

  if (CurrentSleepStatus) {
    console.log(`${arguments.callee.name}: You're already sleeping in the tavern`);
    return;
  }

  if (quest.key && quest.active && quest.members[UserId]) {
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
        sendMessageToParty(progressMessage);
      }
    }
  }
}

function autoAccumulateDamage(user, quest) {
  if (AUTO_ACCUMULATE_DAMAGE && user && quest) {
    if (CurrentSleepStatus) {
      console.log(`${arguments.callee.name}: Skipping. You're already sleeping in the tavern`);
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
        message += `*${arguments.callee.name} script*`;
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
    console.log(`${arguments.callee.name}: Skipping. You're already sleeping in the tavern`);
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
      sendPMToSelf(`No quest is active, you were sent to sleep  \n*${arguments.callee.name} script*`);
    }
  }
}

function autoCron(user) {
  if (!AUTO_CRON) {
    return;
  }

  if (!user) {
    console.error(`${arguments.callee.name}: Undefined user object`);
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
      console.log(`${arguments.callee.name}: Current HP is or under ${healUnderHp}, buying a health postion.`);
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
      console.log(`${arguments.callee.name}: Current Gold (${currentGold}) is or over ${buyOverOrEqual}, buying Enchanted Armoire ${toBuyCount} times.`);

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
      console.log(`${arguments.callee.name}: Allocating ${pointsToAllocate} stat points into "${ALLOCATE_STAT_POINTS_TO}"`);
      allocateStatPoints(ALLOCATE_STAT_POINTS_TO, pointsToAllocate);
    }
  }
}

function checkAndSendPartyQuestProgress() {
  const party = getParty();
  if (party && party.quest && party.quest.key) {
    const partyMembers = getPartyMembers(true);
    if (partyMembers && partyMembers.length) {
      const quest = party.quest;
      const questLeader = getMemberFromArrayById(partyMembers, party.quest.leader);
      const bossQuest = quest.progress.hp > 0;
  
      let message = `### ${SCRIPT_NAME} - Party Quest Status  \n`;
      // message += `**Party:** ${party.name}  \n`;
      message += `**Party Leader:** ${party.leader.profile.name}  \n`;
      if (questLeader) {
        message += `**Quest Leader:** ${questLeader.profile.name}  \n`;
      }
      message += `**Quest status:** ${quest.active ? 'Active' : 'Waiting for participants'}  \n\n`;

      if (quest.active) {
        const membersWithProgress = new Array();
        const membersWithoutProgress = new Array();
        for (const member of partyMembers) {
          if (member && member.party._id && member.party.quest.key) {
            if (member.party.quest.progress.up > 0 || member.party.quest.progress.collectedItems > 0) {
              membersWithProgress.push(member);
            } else if(!PARTY_QUEST_PROGRESS_IGNORE_MEMBERS_WITHOUT_PROGRESS) {
              membersWithoutProgress.push(member);
            }
          }
        }

        const progressType = bossQuest ? 'Damage' : 'Items';
        message += `User | ${progressType} | Last "Day Start" | Status  \n`;
        // message += `--- | --- | --- | ---  \n`;

        const addMemberInfoToMessage = (member) => {
          const pendingDamage = Math.round(member.party.quest.progress.up * 10) / 10;
          const progress = bossQuest ? pendingDamage : member.party.quest.progress.collectedItems;
          const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
          const lastLogin = differenceText ? `${differenceText} ago` : '';
          const sleeping = member.preferences.sleep ? 'Sleeping' : '';
          // message += `${member.profile.name} &ensp; | ${progress} &ensp; | ${lastLogin} &ensp; | ${sleeping}  \n`;
          message += `- ${member.profile.name} | ${progress} | ${lastLogin} | ${sleeping}  \n`;
        };
        if (bossQuest) {
          membersWithProgress.sort((a, b) => b.party.quest.progress.up - a.party.quest.progress.up);
        } else {
          membersWithProgress.sort((a, b) => b.party.quest.progress.collectedItems - a.party.quest.progress.collectedItems);
        }
        for (const member of membersWithProgress) {
          addMemberInfoToMessage(member);
        }
        if (PARTY_QUEST_PROGRESS_IGNORE_MEMBERS_WITHOUT_PROGRESS) {
          message += `\n*The list doesn't contain users who have no quest progress*  \n`;
        } else {
          for (const member of membersWithoutProgress) {
            addMemberInfoToMessage(member);
          }
        }
      } else {
        message += `Members who haven't accepted the quest yet:  \n`;
        message += `User | Last "Day Start" | Status  \n`;
        // message += `--- | --- | ---  \n`;
        for (const member of partyMembers) {
          if (member && member.party._id && member.party.quest.key && member.party.quest.RSVPNeeded === true) {
            const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
            const lastLogin = differenceText ? `${differenceText} ago` : '';
            // message += `${member.profile.name} &ensp; | ${lastLogin} &ensp; | ${member.preferences.sleep ? 'Sleeping' : ''}  \n`;
            message += `- ${member.profile.name} | ${lastLogin} | ${member.preferences.sleep ? 'Sleeping' : ''}  \n`;
          }
        }
      }
      sendMessageToParty(message);
    } else {
      console.error(`${arguments.callee.name}: Couldn't get party members`);
    }
  }
}