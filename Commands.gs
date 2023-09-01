/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const QUEST_PROGRESS_COMMAND = 'quest';

/**
 * Install scheduled command triggers
 */
function installCommandTrigger() {
  uninstallCommandTrigger();
  console.log("Creating command triggers...");

  const trigger = ScriptApp.newTrigger(scheduledCommandsCheck.name)
    .timeBased()
    .everyMinutes(TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES)
    .create();
  
  if (trigger) {
    console.log("Trigger created for: " + trigger.getHandlerFunction());
  }
}

/**
 * Uninstall scheduled command triggers
 */
function uninstallCommandTrigger() {
  const triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    console.log("Deleting command triggers...");

    for (const trigger of triggers) {
      const functionName = trigger.getHandlerFunction();
      if (functionName == scheduledCommandsCheck.name) {
        ScriptApp.deleteTrigger(trigger);
        console.log("Trigger deleted: " + functionName);
      }
    }
  }
}

function scheduledCommandsCheck() {
  if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skipping, last script execution was too recent");
    return;
  }

  const partyId = getPartyIdProperty();
  if (!partyId) {
    console.log("scheduledCommandsCheck: Skipping, the PARTY_ID property is not set");
    return;
  }

  const lastCheckTime = getLastCommandCheckDateTime();
  const chatArray = getGroupChat(partyId);
  if (chatArray instanceof Array && chatArray) {
    console.log(`scheduledCommandsCheck: Found ${chatArray.length} chat messages for the party ${partyId}`);
    let newMessageCount = 0;
    for (const chat of chatArray) {
      // Checking if it's an user message, skipping system messages, which have a type
      if (!chat.info || chat.info.type === undefined) {
        const chatTimestamp = new Date(chat.timestamp);
        // Evaluate only messages that were send after the last check
        if (chatTimestamp > lastCheckTime) {
          newMessageCount++;
          evaluateMessage(chat.text);
        }
      }
    }
    console.log(`scheduledCommandsCheck: New user messages since last command check: ${newMessageCount}`);
  } else {
    console.log(`scheduledCommandsCheck Error: No chat messages found for the Party with id: ${partyId}`);
  }

  setLastCommandCheckDateTime();
}

function evaluateMessage(chatMessage) {
  if (chatMessage && chatMessage.trim().startsWith("!")) {
    var commandRegEx = /\!(.*?)(?:$|\s)/g;
    var matches = commandRegEx.exec(chatMessage);
    if (matches && matches.length > 1) {
      // first group match
      const command = matches[1];
      console.log(`evaluateMessage: Found command "${command}"`);
      switch (command) {
        case QUEST_PROGRESS_COMMAND:
          console.log(`evaluateMessage: Executing command "${command}"`);
          scheduleCheckAndSendPartyQuestProgress();
          break;
      }
    }
  }
}

function scheduleCheckAndSendPartyQuestProgress() {
  const triggers = ScriptApp.getProjectTriggers();
  for (const trigger of triggers) {
    const functionName = trigger.getHandlerFunction();
    if (functionName == checkAndSendPartyQuestProgress.name) {
      ScriptApp.deleteTrigger(trigger);
    }
  }

  const trigger = ScriptApp.newTrigger(checkAndSendPartyQuestProgress.name)
    .timeBased()
    .after(2 * 60 * 1000) // 2min
    .create();

  if (trigger) {
    console.log("Trigger created for: " + trigger.getHandlerFunction());
  }
}

function checkAndSendPartyQuestProgress() {
  const party = getParty();
  if (party) {
    if (party.quest && party.quest.key) {
      const quest = party.quest;
      const bossQuest = quest.progress.hp > 0;
  
      const progressType = bossQuest ? 'Damage' : 'Items';
      let message = `**Party:** ${party.name}  \n`;
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
        message += `User | ${progressType} | Status  \n`;
        message += `---------- | ---------- | ----------  \n`;
        const addMemberInfoToMessage = (memberObj) => {
          const pendingDamage = Math.round(memberObj.party.quest.progress.up * 10) / 10;
          const progress = bossQuest ? pendingDamage : memberObj.party.quest.progress.collectedItems;
          const sleeping = memberObj.preferences.sleep ? 'Sleeping' : '';
          message += `${memberObj.profile.name} | ${progress} | ${sleeping}  \n`;
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
        message += `Waiting for members to participate:  \n`;
        message += `User | Status  \n`;
        message += `---------- | ----------  \n`;
        for (const [memberId, isParticipating] of partyMembers) {
          if (!isParticipating) {
            const member = getMemberById(memberId);
            if (member && member.party._id) {
              message += `${member.profile.name} | ${member.preferences.sleep ? 'Sleeping' : ''}  \n`;
            }
          }
        }
      }

      sendMessageToGroup(party.id, message);
    }
  }
}