/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

// --------- Configurations -----------------------------------
const AUTO_ACCEPT_QUESTS = true;

const AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY = false;
const START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART = 2;
const START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED = 100; // x hours OR x damage

const AUTO_CRON = true;
const AUTO_CRON_ON_TIME = false; // If true, cron at X hours after the day start, otherwise always to do damage
const CRON_X_HOURS_AFTER_DAYSTART = 1;

const AUTO_HEALTH_POSTION = true;
const AUTO_HEALTH_POSTION_IF_HP_UNDER = 20;

const AUTO_BUY_ENCHANTED_ARMOIRE = true;
const BUY_ENCHANTED_ARMOIRE_OVER_X_GOLD = 1100;
const SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO = true;

const AUTO_BUY_GEMS = true;

const AUTO_ALLOCATE_STAT_POINTS = true;
const ALLOCATE_STAT_POINTS_TO = "int"; // str = Strength, con = Constitution, int = Intelligence, per = Perception

const AUTO_SLEEP = true;

const AUTO_ACCUMULATE_DAMAGE = true;
const DAMAGE_TO_ACCUMULATE = 80;
const ACCUMULATE_UNTIL_ONE_HIT = false;

const AUTO_USE_SKILLS = true;
const USE_SKILLS_WHEN_MANA_OVER_X_PERCENT = 0.3; // 0.1 = 10%, 1.0 = 100%
// Healer features
const AUTO_HEAL_PARTY = true;  // Blessing
const AUTO_HEAL_YOURSELF = true; // Healing Light

// Commands settings
const ENABLE_COMMANDS = true;
// unused const COMMAND_PARTY_QUEST_STATUS = true;
const PARTY_QUEST_STATUS_SEND_AFTER_QUEST_STARTED = true;
const PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITHOUT_PROGRESS = true;
const PARTY_QUEST_STATUS_IGNORE_NOT_PARTICIPATING_MEMBERS = true;
const PARTY_QUEST_STATUS_PING_MEMBERS_AFTER_X_HOURS = 6;

// Cheats
const AUTO_COMPLETE_TASKS = false;
const START_TO_COMPLETE_TASKS_X_HOURS_AFTER_DAY_START = 10;

// --- Install settings ---
const TRIGGER_EACH_X_MINUTES = 30; // Must be 1, 5, 10, 15 or 30

const ENABLE_QUEST_ACTIVITY_WEBHOOK = true;
const QUEST_ACTIVITY_WEBHOOK_NAME = `${DriveApp.getFileById(ScriptApp.getScriptId()).getName()}-Quest-Activity`;
const ENABLE_WEEKLY_WEBHOOK_REFRESH_TRIGGER = true;
// Commands System
const ENABLE_COMMANDS_SYSTEM_WEBHOOK = true;
const COMMANDS_SYSTEM_WEBHOOK_NAME = `${DriveApp.getFileById(ScriptApp.getScriptId()).getName()}-Commands-System`;
const ENABLE_COMMANDS_SYSTEM_TRIGGER = false;
const TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES = 5; // Must be 1, 5, 10, 15 or 30
// Party Quest Status
const ENABLE_PARTY_QUEST_STATUS_TRIGGER = true;
const TRIGGER_PARTY_QUEST_STATUS_EACH_X_HOURS = 4; // Must be 1, 2, 4, 6, 8 or 12
// ------------------------------------------------------------
/**
 * Main entry, that should be executed by a tigger
 */
function triggerSchedule() {
  const user = Habitica.getUser();
  if (user) {
    console.log(`User: ${user.profile.name} (@${user.auth.local.username})\nHealth: ${Math.round(user.stats.hp)}`);
    const hoursDifference = getHoursDifferenceToDayStart(user);
    console.log('Hours difference to the next Day Start: ' + hoursDifference)

    let partyMembers = [];
    if (user.party._id) {
      setPartyIdProperty(user.party._id);

      const party = Habitica.getParty();
      if (party) {
        if (AUTO_USE_SKILLS) { // For now only get party members for autoUseSkills
          partyMembers = Habitica.getPartyMembers(true);
        }

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
        autoSleep(user, quest);
        autoAccumulateDamage(user, quest);
        autoCron(user, quest);
        checkAndSendMyQuestProgress(user, quest);
      }
    } else {
      console.log('User is not in a party. Ignoring party request and party related functions.');
    }
    
    autoCompleteTasks(user);
    autoUseSkills(user, partyMembers);
    autoBuyHealthPotions(user);
    autoBuyEnchantedArmoire(user);
    autoBuyGems(user);
    autoAllocateStatPoints(user);

    setLastExecutionDateTime();
  } else {
    throw new Error(`Couldn't get user data`); 
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
    triggers.push(ScriptApp.newTrigger(checkAndSendPartyQuestStatus.name)
      .timeBased()
      .everyHours(TRIGGER_PARTY_QUEST_STATUS_EACH_X_HOURS)
      .create()
    );
  }

  if (ENABLE_WEEKLY_WEBHOOK_REFRESH_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(createWebhooks.name)
      .timeBased()
      .everyDays(6)
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
        case checkAndSendPartyQuestStatus.name:
        case createWebhooks.name:
          ScriptApp.deleteTrigger(trigger);
          console.log("Trigger deleted: " + functionName);
          break;
      }
    }
  }
}

function autoAcceptQuest(quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[UserId]) {
    console.log(`autoAcceptQuest: Accepting inactive quest: "${quest.key}"`);
    if (Habitica.acceptQuest()) {
      console.log(`autoAcceptQuest: Quest accepted`);
    }
  }
}

function checkAndSendMyQuestProgress(user, quest) {
  if (!AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY || !user || !quest) {
    return;
  }

  if (user.preferences.sleep === true) {
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
        Habitica.sendMessageToParty(progressMessage);
      }
    }
  }
}

function autoSleep(user, quest) {
  if (AUTO_SLEEP && user && quest) {
    // Check if user were sent to sleep by the script and "wake" him up after cron is done
    if (isSentToSleepByScript(user) && !Habitica.isCronPending(user)) {
      console.log(`${arguments.callee.name}: You were sent to sleep by the script before, waking up`);
      setSentToSleepByScript(Habitica.setSleep(user, false));
    }
    /* Old logic, obsolete with autoAccumulateDamage
    if (user.preferences.sleep) {
      console.log(`${arguments.callee.name}: Skipping. You're already sleeping in the tavern`);
      return;
    }
    const hoursDifference = getHoursDifferenceToDayStart(user);
    if ((hoursDifference < 1 || (hoursDifference >= 12 && Habitica.isCronPending(user)))
        && (!quest.key || !quest.active) && !user.preferences.sleep
        && user.party.quest.progress.up >= 10) {
      console.log('No quest is running, toggling sleep...');
      const sleepState = toggleSleep();
      if (sleepState) {
        console.log('Sleep state: ' + sleepState);
        sendPMToSelf(`No quest is active, you were sent to sleep  \n*${arguments.callee.name} script*`);
      }
    }*/
  }
}

function autoAccumulateDamage(user, quest) {
  if (AUTO_ACCUMULATE_DAMAGE && user && quest) {
    if (user.preferences.sleep === true) {
      console.log(`${arguments.callee.name}: Skipping. You're already sleeping in the tavern`);
      return;
    }

    const hoursDifference = getHoursDifferenceToDayStart(user);
    const bossQuest = quest.progress.hp > 0;
    const myQuestProgress = user.party.quest.progress.up;
    // ToDo add logic for items collecting
    if ((hoursDifference <= 0.5 || (hoursDifference >= 12 && Habitica.isCronPending(user)))
      && (!quest.key || !quest.active || quest.progress === undefined
          || (bossQuest && (myQuestProgress < DAMAGE_TO_ACCUMULATE || (ACCUMULATE_UNTIL_ONE_HIT && myQuestProgress < quest.progress.hp)))
        )) {
      console.log(`hoursDifference: ${hoursDifference}`);
      console.log(`isCronPending: ${Habitica.isCronPending(user)}`);
      console.log(`quest.key: ${quest.key}`);
      console.log(`quest.active: ${quest.active}`);
      console.log(`quest.progress: ${quest.progress}`);
      console.log(`My quest progress: ${myQuestProgress}`);
      console.log(`DAMAGE_TO_ACCUMULATE: ${DAMAGE_TO_ACCUMULATE}`);
      console.log(`Boss HP: ${quest.progress.hp}`);
      console.log(`Progress check evaluation: ${(bossQuest && (myQuestProgress < DAMAGE_TO_ACCUMULATE || (ACCUMULATE_UNTIL_ONE_HIT && myQuestProgress < quest.progress.hp)))}`);

      console.log('Toggling sleep to accumulate damage...');
      if (Habitica.setSleep(user, true)) {
        console.log('Sleep state: ' + user.preferences.sleep);
        setSentToSleepByScript(true);

        let message = 'You were sent to sleep to accumulate damage ';
        if (!quest.key || !quest.active || quest.progress === undefined) {
          message += 'because no quest is active.  \n';
        } else {
          message += ` \nCurrent damage: ${myQuestProgress}  \nBosses HP: ${quest.progress.hp}  \n`;
        }
        message += `*${arguments.callee.name} script*`;
        Habitica.sendPrivateMessageToSelf(message);
      }
    }
  }
}

function autoCron(user, quest) {
  if (AUTO_CRON && user && Habitica.isCronPending(user)) {
    if (AUTO_CRON_ON_TIME) {
      const hoursDifference = getHoursDifferenceToDayStart(user);
      const before = 24.5 - CRON_X_HOURS_AFTER_DAYSTART;
      const after = 23.5 - CRON_X_HOURS_AFTER_DAYSTART;
      if (hoursDifference <= before && hoursDifference >= after) {
        Habitica.runCron();
      }
    } else if(quest && quest.key && quest.active) {
      if (user.party.quest.progress.up >= 5 || user.party.quest.progress.collectedItems > 0) {
        Habitica.runCron();
      }
    }
  }
}

function autoBuyHealthPotions(user) {
  if (AUTO_HEALTH_POSTION && user) {
    const postionHealPower = 15;
    const healUnderHp = AUTO_HEALTH_POSTION_IF_HP_UNDER;
    const currentHp = user.stats.hp;

    if (healUnderHp > 0 && currentHp <= healUnderHp) {
      const potionsToBuy = Math.max(Math.round((healUnderHp - currentHp) / postionHealPower), 1);
      console.log(`${arguments.callee.name}: Current HP (${currentHp}) is or under ${healUnderHp}, buying ${potionsToBuy} amount of health postions.`);
      for (let i = 0; i < potionsToBuy; i++) {
        const response = Habitica.buyHealthPotion();
        if (response !== undefined) {
          console.info(`Health Postion: ${response.message}\nPrevios Health: ${currentHp}\nNew Health: ${response.data.hp}`);
          if (response.data.hp !== undefined) {
            user.stats.hp = response.data.hp;
          }
        }
      }
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
        const responseJson = Habitica.buyEnchantedArmoire();
        if (responseJson) {
          pmMessage += `${JSON.stringify(responseJson.data.armoire)}  \n`;
          boughtCount++;
        } else {
          break;
        }
      }
      if (SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO) {
        pmMessage += `**Successfully bought: ${boughtCount} out of ${toBuyCount}**`;
        Habitica.sendPrivateMessageToSelf(pmMessage)
      }
    }
  }
}

function autoBuyGems(user) {
  if (AUTO_BUY_GEMS && user && user.purchased && user.purchased.plan && user.purchased.plan.dateTerminated === null) {
    const gemCost = 20; // 1 gem costs 20 Gold
    const defaultGemCap = 25;
    const currentGold = user.stats.gp;
    const plan = user.purchased.plan;

    const gemsToBuy = Math.min(defaultGemCap + plan.consecutive.gemCapExtra - plan.gemsBought, Math.floor(currentGold / gemCost));
    if (gemsToBuy > 0) {
      Habitica.buyGems(gemsToBuy);
    }
  }
}

function autoAllocateStatPoints(user) {
  if (AUTO_ALLOCATE_STAT_POINTS && user) {
    const pointsToAllocate = user.stats.points;
    const userLvl = user.stats.lvl;

    if (pointsToAllocate > 0 && userLvl >= 10 && !user.preferences.disableClasses) {
      console.log(`${arguments.callee.name}: Allocating ${pointsToAllocate} stat points into "${ALLOCATE_STAT_POINTS_TO}"`);
      Habitica.allocateStatPoints(ALLOCATE_STAT_POINTS_TO, pointsToAllocate);
    }
  }
}

function autoUseSkills(user, members = []) {
  if (AUTO_USE_SKILLS) {
    if (user && user.flags) {
      if (user.flags.classSelected === true && !user.preferences.disableClasses) {
        let userClass = undefined;
        switch (user.stats["class"]) {
          case "warrior":
            userClass = new Warrior(user, members);
            break;
          case "wizard":
            userClass = new Mage(user, members);
            break;
          case "healer":
            userClass = new Healer(user, members);
            break;
          case "rogue":
            userClass = new Rogue(user, members);
            break;
        }
        if (userClass && userClass instanceof ClassBase) {
          userClass.autoCastSkills();
        }
      }
    } else {
      console.error(`${arguments.callee.name} error: Invalid user paramter`);
    }
  }
}

function autoCompleteTasks(user) {
  if (AUTO_COMPLETE_TASKS && user) {
    const hoursDifference = getHoursDifferenceToDayStart(user);
    const activeHoursPerDay = 24 - START_TO_COMPLETE_TASKS_X_HOURS_AFTER_DAY_START;
    if (hoursDifference > activeHoursPerDay) {
      console.log(`${arguments.callee.name}: Skipping, hours till next day start: ${hoursDifference}, active hours per habitica day ${activeHoursPerDay}`);
      return;
    }

    const tasks = Habitica.getUserTasks();
    if (Array.isArray(tasks) && tasks.length > 0) {
      const habits = new Array();
      const dueDailies = new Array();
      for (const task of tasks) {
        if (task) {
          if (task.type === 'habit') {
            habits.push(task);
          } else if (task.type === 'daily' && task.isDue === true && !task.completed) {
            dueDailies.push(task);
          }
        }
      }
      // Habits
        // ToDo: implement some logic to score habits automatically
      // Tasks
      if (dueDailies.length > 0) {
        let dayliesPerHour = dueDailies.length / Math.round(hoursDifference);
        console.log(`${arguments.callee.name}: Daylies per hour ${dayliesPerHour}`);
        if (dayliesPerHour < 1) {
          dayliesPerHour = +Habitica.getRandomBooleanWithProbability(dayliesPerHour);
        }
        dayliesPerHour = Math.floor(dayliesPerHour);
        console.log(`${arguments.callee.name}: ${dueDailies.length} dailies due for today`);
        console.log(`${arguments.callee.name}: Completing ${dayliesPerHour} dalies`);
        let dailiesCompleted = 0;
        for (let i = 0; i < dayliesPerHour; i++) {
          if (i >= dueDailies.length) {
            break;
          }
          const daily = dueDailies[i];
          if (Habitica.scoreTask(daily.id)) {
            console.log(`${arguments.callee.name}: Daily completed: ${daily.text}`);
            dailiesCompleted++;
          } else {
            console.error(`${arguments.callee.name}: Failed to complete the daily: ${daily.text}`);
          }
        }
        console.log(`${arguments.callee.name}: Completed ${dailiesCompleted} dalies`);
      }
    }
  }
}