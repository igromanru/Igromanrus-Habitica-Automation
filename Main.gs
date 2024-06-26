/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */
// --------- Configurations -----------------------------------
const SCRIPT_NAME = DriveApp.getFileById(ScriptApp.getScriptId()).getName();

const AUTO_ACCEPT_QUESTS = true;

const AUTO_SEND_MY_QUEST_PROGRESS_TO_PARTY = false;
const START_SENDING_MY_QUEST_PROGRESS_X_HOURS_BEFORE_DAYSTART = 2;
const START_SENDING_MY_QUEST_PROGRESS_AFTER_X_DMG_COLLECTED = 100; // x hours OR x damage

const AUTO_CRON = true;
const AUTO_CRON_ON_TIME = true; // If true, cron at X hours after the day start, otherwise always to do damage
const CRON_X_HOURS_AFTER_DAYSTART = 1;

const AUTO_HEALTH_POSTION = true;
const AUTO_HEALTH_POSTION_IF_HP_UNDER = 15;

const AUTO_BUY_ENCHANTED_ARMOIRE = true;
const BUY_ENCHANTED_ARMOIRE_OVER_X_GOLD = 1000;
const SEND_PM_WITH_ENCHANTED_ARMOIRE_ITEM_INFO = true;

const AUTO_BUY_GEMS = true;

const AUTO_ALLOCATE_STAT_POINTS = true;
const ALLOCATE_STAT_POINTS_TO = "int"; // str = Strength, con = Constitution, int = Intelligence, per = Perception

const AUTO_WAKE_UP = true;

const AUTO_ACCUMULATE_DAMAGE = true;
const DAMAGE_TO_ACCUMULATE = 20;
const ACCUMULATE_UNTIL_ONE_HIT = false;
const ACCUMULATE_DAMAG_IGNORE_ITEM_QUESTS = false;

// Party
const WRITE_PARTY_STATUS_SPREADSHEET = true;
const PARTY_STATUS_SPREADSHEET_ID = '18eXR54GqhQIOk9dhPU1Rr4JLg8jSRay3FmY1lE9SlRM';
const CHECK_AND_MENTION_QUEST_NON_PARTICIPANTS = true;
const MENTION_QUEST_NON_PARTICIPANTS_AFTER_X_HOURS = 8;

// --- Auto Skill/Buff System ---
const AUTO_USE_SKILLS = true;
const TRIGGER_AUTO_USE_SKILL_ON_BOSS_DAMAGE = true;
// const USE_SKILLS_WHEN_MANA_OVER_X_PERCENT = 0.3; // 0.1 = 10%, 1.0 = 100%
// Healer features
const AUTO_USE_PROTECTIVE_AURA = true;
const USE_PROTECTIVE_AURA_WHEN_MAX_MANA = true;
const AUTO_HEAL_PARTY = true;  // Blessing
const HEAL_PARTY_WHEN_X_TO_HEAL = 20; // Should cast Blessing, if one of members has Health = (MaxHealth - X)
const AUTO_HEAL_YOURSELF = true; // Healing Light
// Rogue
const AUTO_USE_STEALTH = true;
// ------------------------------

// Commands settings
const ENABLE_COMMANDS = true;
// unused const COMMAND_PARTY_QUEST_STATUS = true;
// !quest command
const PARTY_QUEST_STATUS_SEND_AFTER_QUEST_STARTED = true;
const PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS = 0; // Limits the list to X members with most progress
const PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITHOUT_PROGRESS = true;
const PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITH_PENDING_CRON_OVER_X_DAYS = 0; // ignore if days > value
const PARTY_QUEST_STATUS_IGNORE_NOT_PARTICIPATING_MEMBERS = true;
const PARTY_QUEST_STATUS_PING_MEMBERS_AFTER_X_HOURS = 6;
// !inactive command
const PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_DAYS = 1;
const PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_HOURS = 8; // over x days AND x hours

// Cheats
const AUTO_COMPLETE_TASKS = false;
const START_TO_COMPLETE_TASKS_X_HOURS_AFTER_DAY_START = 6;
const ALLOW_AUTO_REGEN_MANA_FROM_HABIT = true;
const AUTO_REGEN_MANA_HABIT_NAME = "Regen Mana";

// --- Install settings ---
const TRIGGER_EACH_X_MINUTES = 30; // Must be 1, 5, 10, 15 or 30

const ENABLE_QUEST_ACTIVITY_WEBHOOK = true;
const QUEST_ACTIVITY_WEBHOOK_NAME = `${SCRIPT_NAME}-Quest-Activity`;
const ENABLE_PARTY_CHAT_WEBHOOK = true;
const PARTY_CHAT_WEBHOOK_NAME = `${SCRIPT_NAME}-Party-Chat`;
const ENABLE_WEBHOOK_REFRESH_TRIGGER = true;
const WEBHOOK_REFRESH_TRIGGER_EACH_X_HOURS = 12; // Must be 1, 2, 4, 6, 8 or 12
// Commands System
const ENABLE_COMMANDS_SYSTEM_TRIGGER = false;
const TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES = 5; // Must be 1, 5, 10, 15 or 30
// Party Quest Status
const ENABLE_PARTY_QUEST_STATUS_TRIGGER = false;
const TRIGGER_PARTY_QUEST_STATUS_EACH_X_HOURS = 4; // Must be 1, 2, 4, 6, 8 or 12
const ENABLE_PARTY_QUEST_ACCEPTED_CHECK_TRIGGER = true;
const TRIGGER_PARTY_QUEST_ACCEPTED_CHECK_EACH_X_HOURS = 2; // Must be 1, 2, 4, 6, 8 or 12
// Party Quest Progress (short variant)
const ENABLE_PARTY_PROGRESS_TRIGGER = true;
const TRIGGER_PARTY_PROGRESS_EACH_X_HOURS = 4; // Must be 1, 2, 4, 6, 8 or 12
// Party Status Spreadsheet
const ENABLE_PARTY_STATUS_SPREADSHEET_TRIGGER = true;
const TRIGGER_PARTY_STATUS_SPREADSHEET_UPDATE_EACH_X_MINUTES = 15; // Must be 1, 5, 10, 15 or 30
const ENABLE_PARTY_STATUS_SPREADSHEET_QUESTS_CONTENT_UPDATE_TRIGGER = true;

// ------------------------------------------------------------
/**
 * Main entry, that should be executed by a tigger
 */
function triggerSchedule() {
  const user = Habitica.getUser();
  if (user) {
    console.info(`User: ${user.profile.name} (@${user.auth.local.username})\nHealth: ${Math.round(user.stats.hp)}`);
    const hoursDifference = Habitica.getHoursDifferenceToDayStart(user);
    console.info('Hours difference to the next Day Start: ' + hoursDifference)
    if (user.lastCron) {
      console.info('Last cron: ' + new Date(user.lastCron).toString());
      console.info('Is Cron Pending: ' + Habitica.isCronPending(user));
    }

    let partyMembers = [];
    if (user.party._id) {
      setPartyIdProperty(user.party._id);

      const party = Habitica.getParty();
      if (party) {
        let quest = party.quest;
        console.info('Party Id: ' + party.id);

        partyMembers = Habitica.getPartyMembers(true);
        console.info(`Getting members info (Count: ${partyMembers.length})`);
        checkAndAddToPartyStatusMembersLogSheet(partyMembers);
        setPartyMembersCache(partyMembers);
        /*if (AUTO_USE_SKILLS) { // For now only get party members for autoUseSkills
          partyMembers = Habitica.getPartyMembers(true);
          console.info(`Getting members info (Count: ${partyMembers.length})`);
        }*/

        if (quest.key) {
          console.info('Quest key: ' + quest.key);
          if (quest.active) {
            console.info('The quest is active');
          }
        } else {
          console.info('No active quest');
        }

        autoAcceptQuest(quest);
        autoWakeUp(user, quest);
        autoAccumulateDamage(user, quest);
        autoCron(user, quest);
        checkAndSendMyQuestProgress(user, quest);
        checkAndMentionQuestNonParticipants(party, partyMembers);
      }
    } else {
      console.info('User is not in a party. Ignoring party request and party related functions.');
    }
    
    autoCompleteTasks(user);
    autoUseSkills(user, partyMembers);
    autoBuyHealthPotions(user);
    autoBuyEnchantedArmoire(user);
    autoBuyGems(user);
    autoAllocateStatPoints(user);
  } else {
    throw new Error(`Couldn't get user data`); 
  }

  if (ENABLE_PARTY_CHAT_WEBHOOK || ENABLE_QUEST_ACTIVITY_WEBHOOK) {
    evaluateWebHookContentQueue();
  }
}

function install() {
  installTriggers();
  createWebhooks();
}

function uninstall() {
  uninstallTriggers();
  deleteWebhooks();
}

/**
 * Install scheduled triggers
 */
function installTriggers() {
  uninstallTriggers();
  console.info("Creating triggers...");

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

  if (ENABLE_PARTY_PROGRESS_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(checkAndSendPartyProgress.name)
      .timeBased()
      .everyHours(TRIGGER_PARTY_PROGRESS_EACH_X_HOURS)
      .create()
    );
  }

  if (ENABLE_PARTY_STATUS_SPREADSHEET_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(writePartyStatusSpreadsheet.name)
      .timeBased()
      .everyMinutes(TRIGGER_PARTY_STATUS_SPREADSHEET_UPDATE_EACH_X_MINUTES)
      .create()
    );
  }

  if (ENABLE_PARTY_STATUS_SPREADSHEET_QUESTS_CONTENT_UPDATE_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(updatePartyStatusQuestsContentSheet.name)
      .timeBased()
      .onMonthDay(1)
      .create()
    );
  }

  if (ENABLE_WEBHOOK_REFRESH_TRIGGER) {
    triggers.push(ScriptApp.newTrigger(createWebhooks.name)
      .timeBased()
      .everyHours(WEBHOOK_REFRESH_TRIGGER_EACH_X_HOURS)
      .create()
    );
  }

  for (const trigger of triggers) {
    if (trigger) {
      console.info("Trigger created for: " + trigger.getHandlerFunction());
    }
  }
}

/**
 * Uninstall scheduled triggers
 */
function uninstallTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    console.info("Deleting triggers");

    for (const trigger of triggers) {
      const functionName = trigger.getHandlerFunction();
      switch (functionName) {
        case triggerSchedule.name:
        case scheduledCommandsCheck.name:
        case checkAndSendPartyQuestStatus.name:
        case checkAndSendPartyProgress.name:
        case writePartyStatusSpreadsheet.name:
        case updatePartyStatusQuestsContentSheet.name:
        case createWebhooks.name:
          ScriptApp.deleteTrigger(trigger);
          console.info("Trigger deleted: " + functionName);
          break;
      }
    }
  }
}

function autoAcceptQuest(quest) {
  if (AUTO_ACCEPT_QUESTS && quest.key && !quest.active && !quest.members[UserId]) {
    console.info(`autoAcceptQuest: Accepting inactive quest: "${quest.key}"`);
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
    console.info(`${arguments.callee.name}: You're already sleeping in the tavern`);
    return;
  }

  if (quest.key && quest.active && quest.members[UserId]) {
    const bossHp = quest.progress.hp;
    const itemsToCollect = quest.progress.collect;

    const pendingDamage = Math.round(user.party.quest.progress.up * 10) / 10;
    const collectedItems = user.party.quest.progress.collectedItems;
    const hoursDifference = Habitica.getHoursDifferenceToDayStart(user);

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

function autoWakeUp(user, quest) {
  if (AUTO_WAKE_UP && user && quest) {
    if (isSentToSleepByScript(user) && !Habitica.isCronPending(user)) {
      console.info(`${arguments.callee.name}: You were sent to sleep by the script before, waking up`);
      setSentToSleepByScript(Habitica.setSleep(user, false));
    }
  }
}

function autoAccumulateDamage(user, quest) {
  if (AUTO_ACCUMULATE_DAMAGE && user && quest) {
    if (user.preferences.sleep === true) {
      console.info(`${arguments.callee.name}: Skipping. You're already sleeping in the tavern`);
      return;
    }

    const hoursDifference = Habitica.getHoursDifferenceToDayStart(user);
    const bossQuest = quest.progress.hp > 0;
    const myQuestProgress = user.party.quest.progress.up;
    // ToDo add logic for items collecting
    if ((hoursDifference <= 0.5 || (hoursDifference >= 12 && Habitica.isCronPending(user)))
      && (!quest.key || !quest.active || quest.progress === undefined
          || (bossQuest && (myQuestProgress < DAMAGE_TO_ACCUMULATE || (ACCUMULATE_UNTIL_ONE_HIT && myQuestProgress < quest.progress.hp)) || (!bossQuest && ACCUMULATE_DAMAG_IGNORE_ITEM_QUESTS))
        )) {
      console.log(`hoursDifference: ${hoursDifference}`);
      console.log(`isCronPending: ${Habitica.isCronPending(user)}`);
      console.log(`quest.key: ${quest.key}`);
      console.log(`quest.active: ${quest.active}`);
      console.log(`quest.progress: ${quest.progress}`);
      console.log(`My quest progress: ${myQuestProgress}`);
      console.log(`DAMAGE_TO_ACCUMULATE: ${DAMAGE_TO_ACCUMULATE}`);
      console.log(`Boss HP: ${quest.progress.hp}`);
      console.log(`Progress check evaluation: ${(bossQuest && (myQuestProgress < DAMAGE_TO_ACCUMULATE || (ACCUMULATE_UNTIL_ONE_HIT && myQuestProgress < quest.progress.hp)) || (!bossQuest && ACCUMULATE_DAMAG_IGNORE_ITEM_QUESTS))}`);
      console.log(`ACCUMULATE_DAMAG_IGNORE_ITEM_QUESTS: ${ACCUMULATE_DAMAG_IGNORE_ITEM_QUESTS}`);

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
      const hoursDifference = Habitica.getHoursDifferenceToDayStart(user);
      const after = 24.5 - CRON_X_HOURS_AFTER_DAYSTART;
      if (hoursDifference < after) {
        return Habitica.runCron();
      }
    }
    if(!user.preferences.sleep && quest && quest.key && quest.active) {
      if (user.party.quest.progress.up >= 5 || user.party.quest.progress.collectedItems > 0) {
        return Habitica.runCron();
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
      console.info(`${arguments.callee.name}: Current HP (${currentHp}) is or under ${healUnderHp}, buying ${potionsToBuy} amount of health postions.`);
      for (let i = 0; i < potionsToBuy; i++) {
        const response = Habitica.buyHealthPotion();
        if (response !== undefined) {
          console.info(`Health Postion: ${response.message}\nPrevios Health: ${currentHp}\nNew Health: ${response.data.hp}`);
          Habitica.updateUserStats(user, response.data);
        }
      }
    }
  }
}

function autoBuyEnchantedArmoire(user) {
  if (AUTO_BUY_ENCHANTED_ARMOIRE && user && user.flags && !user.flags.armoireEmpty) {
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

function checkMessageForBossDamage(chat) {
  if (AUTO_USE_SKILLS && TRIGGER_AUTO_USE_SKILL_ON_BOSS_DAMAGE) {
    if (chat && chat.info && chat.info.type === 'boss_damage' && chat.info.bossDamage) {
      console.log(`checkMessageForBossDamage chat pojo: ${JSON.stringify(chat)}`)
      const bossDamage = parseFloat(chat.info.bossDamage);
      if (bossDamage >= 2) {
        const user = Habitica.getUser();
        if (user) {
          const members = Habitica.getPartyMembers(true);
          autoUseSkills(user, members);
        } else {
          console.error(`checkMessageForBossDamage: Couldn't get the current user`);
        }
      }
    }/* else {
      console.error(`checkMessageForBossDamage: Called with wrong parameter: chat: ${chat}, info: ${chat.info}, info.type: ${chat.info.type}, info.bossDamage: ${chat.info.bossDamage}`);
    }*/
  }
}

function autoUseSkills(user, members = []) {
  if (AUTO_USE_SKILLS) {
    if (user && user.flags) {
      if (user.flags.classSelected === true && !user.preferences.disableClasses) {
        let userClass = undefined;
        const classType = user.stats.class;
        console.info(`autoUseSkills: Class: ${classType}`);
        switch (classType) {
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
      console.error(`autoUseSkills error: Invalid user paramter`);
    }
  }
}

function autoCompleteTasks(user) {
  if (AUTO_COMPLETE_TASKS && user) {
    const hoursDifference = Habitica.getHoursDifferenceToDayStart(user);
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
          const data = Habitica.scoreTask(daily.id);
          if (data) {
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

function autoRegenManaFromHabit(user, amountToRegen = 10) {
  if (ALLOW_AUTO_REGEN_MANA_FROM_HABIT && user && user.stats && amountToRegen > 0
      && typeof AUTO_REGEN_MANA_HABIT_NAME === 'string'
      && AUTO_REGEN_MANA_HABIT_NAME.trim() !== '') {
    const regenManaHabitIdProperty = 'AUTO_REGEN_MANA_HABIT_ID';
    let regenManaHabitId = ScriptProperties.getProperty(regenManaHabitIdProperty);
    if (!regenManaHabitId || !(typeof regenManaHabitId === 'string' && regenManaHabitId.trim() !== '')) {
      const tasks = Habitica.getUserTasks();
      if (tasks && Array.isArray(tasks)) {
        for (const task of tasks) {
          if (task && task.id && typeof task.text === 'string' && task.text.trim() === AUTO_REGEN_MANA_HABIT_NAME.trim()) {
            regenManaHabitId = task.id;
            ScriptProperties.setProperty(regenManaHabitIdProperty, regenManaHabitId);
            break;
          }
        }
      }
    }
    if (typeof regenManaHabitId === 'string' && regenManaHabitId.trim() !== '') {
      let currentMana = user.stats.mp;
      const targetMana = currentMana + amountToRegen;
      while (currentMana < targetMana) {
        const data = Habitica.scoreTask(regenManaHabitId);
        if (data && data.mp > 0) {
          console.log(`autoRegenManaFromHabit: Scored successfully the task: ${regenManaHabitId}\nNew mana value: ${data.mp}`);
          Habitica.updateUserStats(user, data);
        } else {
          console.error(`autoRegenManaFromHabit: scoreTask failed`);
          break;
        }
      }
    }
  }
}