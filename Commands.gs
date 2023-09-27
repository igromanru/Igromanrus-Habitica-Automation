/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const COMMANDS_PREFIX = '!';
const COMMANDS_REGEX = /^\!(.*?)(?:$|\s)(.*)/g;

const HELP_COMMAND = 'help';
const QUEST_PROGRESS_COMMAND = 'quest';
const CAT_COMMAND = 'cat';
const MEMBERS_COMMAND = 'members';
const FACTS_COMMAND = 'facts';

const CatApiKey = ScriptProperties.getProperty('CAT_API_KEY');
const ApiNinjasKey = ScriptProperties.getProperty('API_NINJAS_KEY');

function scheduledCommandsCheck() {
  if (!ENABLE_COMMANDS) {
    return;
  }
  /* if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skipping, last script execution was too recent");
    return;
  }*/

  const lastCheckTime = getLastCommandCheckDateTime();
  const chatArray = Habitica.getPartyChat();
  if (Array.isArray(chatArray) && chatArray) {
    console.log(`scheduledCommandsCheck: Found ${chatArray.length} chat messages for the party`);
    let newMessageCount = 0;
    for (const chat of chatArray) {
      const chatTimestamp = new Date(chat.timestamp);
      // Evaluate only messages that were send after the last check
      if (chatTimestamp > lastCheckTime) {
        checkMessageForCommands(chat);
        newMessageCount++;
      }
    }
    console.log(`scheduledCommandsCheck: New user messages since last command check: ${newMessageCount}`);
  } else {
    console.log(`scheduledCommandsCheck Error: No chat messages found for the Party`);
  }

  setLastCommandCheckDateTime();
}

function checkMessageForCommands(chat) {
  // Filter for user messages
  if (ENABLE_COMMANDS && chat && (!chat.info || chat.type === undefined)) {
    if (typeof chat.text === 'string' && chat.text.trim().startsWith(COMMANDS_PREFIX)) {
      var matches = COMMANDS_REGEX.exec(chat.text.toLowerCase());
      if (matches && matches.length > 1) {
        const userName = chat.user;
        const command = matches[1];
        let params = '';
        if (matches.length > 2) {
          params = matches[2].trim();
        }
        console.log(`${arguments.callee.name}: Found command "${command}"`);
        switch (command) {
          case HELP_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            helpCommand();
            break;
          case QUEST_PROGRESS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            checkAndSendPartyQuestStatus(userName);
            break;
          case CAT_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            catCommand(userName);
            break;
          case FACTS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            factsCommand(userName);
            break;
          case MEMBERS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            sendPartyMembersInfomation(userName);
            break;
        }
      }
    }
  }
}

function helpCommand() {
  if (!helpCommand.runOnce) {
    let message = `### ${SCRIPT_NAME} - Commands  \n`;
    message += 'The command system allows users to trigger some script functions by sending chat messages with specific commands.  \n';
    message += `It may take about a minute for the commands to be processed.  \n\n`;
    message += `\n`;

    message += `**Following commands are available:**  \n`;
    message += `- ${COMMANDS_PREFIX + HELP_COMMAND} : Shows this message  \n`;
    message += `- ${COMMANDS_PREFIX + QUEST_PROGRESS_COMMAND} : Shows current Party Quest Status  \n`;
    message += `- ${COMMANDS_PREFIX + MEMBERS_COMMAND} : Shows infomation about current party members  \n`;
    message += `- ${COMMANDS_PREFIX + CAT_COMMAND} : Shows an image of a random cat from The Cat API  \n`;
    message += `- ${COMMANDS_PREFIX + FACTS_COMMAND} : Shows a random fan fact  \n`;

    message += `\n`;
    message += `**Emoji explanation:**  \n`;
    message += `🔝 = current level  \n`;
    message += `❤️ = full health  \n`;
    message += `💜 = damaged health  \n`;
    message += `🎯 = pending damage  \n`;
    message += `🔍 = collected items  \n`;
    message += `🕑 = Passed time since the last "first check-in of the day"  \n`;
    message += `😴 = Sleeping in the Tavern (damage paused)  \n`;
    message += `💀 = Character is about to die (health in minuse)  \n`;

    Habitica.sendMessageToParty(message);
    helpCommand.runOnce = true;
  }
}

function catCommand(triggeredBy = '') {
  if (!catCommand.runOnce) {
    const response = UrlFetchApp.fetch(`https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png`, {
      method: 'GET',
      headers: {
        'x-api-user': CatApiKey
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() == 200) {
      const cats = JSON.parse(response.getContentText());
      if (Array.isArray(cats) && cats.length > 0) {
        const cat = cats[0];
        if (cat) {
          if (triggeredBy) {
            triggeredBy = ` "Triggered by ${triggeredBy}"`;
          }
          let message = `![cat](${cat.url}${triggeredBy})  \n`;

          Habitica.sendMessageToParty(message);
          catCommand.runOnce = true;
        }
      }
    }
  }
}

function factsCommand(triggeredBy = '') {
  if (!factsCommand.runOnce) {
    const response = UrlFetchApp.fetch(`https://api.api-ninjas.com/v1/facts?limit=1`, {
      method: 'GET',
      headers: {
        'X-Api-Key': ApiNinjasKey
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() == 200) {
      const facts = JSON.parse(response.getContentText());
      if (Array.isArray(facts) && facts.length > 0) {
        const fact = facts[0];
        if (fact) {
          let message = `Fan fact:  \n >${fact.fact}  \n`;
          if (typeof triggeredBy === 'string' && triggeredBy) {
            message += '\n`The command was triggered by ' + triggeredBy +'`  \n';
          }

          Habitica.sendMessageToParty(message);
          factsCommand.runOnce = true;
        }
      }
    }
  }
}

function checkAndSendPartyQuestStatus(triggeredBy = '') {
  if (checkAndSendPartyQuestStatus.once === true) {
    return;
  }

  const party = Habitica.getParty();
  if (party && party.quest && party.quest.key) {
    const partyMembers = Habitica.getPartyMembers(true);
    if (partyMembers && partyMembers.length > 0) {
      const quest = party.quest;
      const questLeader = Habitica.getMemberFromArrayById(partyMembers, party.quest.leader);
      const bossQuest = quest.progress.hp > 0;
      const questStatus = getLastKnownQuestStatus();
  
      let message = ``;
      //message += `### ${SCRIPT_NAME} - Party Quest Status  \n`;
      message += `**Party Quest Status**  \n`;
      // message += `**Party:** ${party.name}  \n`;
      message += `**Party Leader:** ${party.leader.profile.name}  \n`;
      // message += `**Members count:** ${party.memberCount}  \n`;
      if (questLeader) {
        message += `**Quest Leader:** ${questLeader.profile.name}  \n`;
      }

      if (quest.active) {
        if (questStatus && questStatus.questStarted === true) {
          message += `**Quest started:** ${getTimeDifferenceToNowAsString(questStatus.timestamp)} ago  \n`;
        }
        message += `\n`;

        const membersWithProgress = new Array();
        const membersWithoutProgress = new Array();
        for (const member of partyMembers) {
          if (member && member.party._id && member.party.quest.key) {
            if (member.party.quest.progress.up > 0 || member.party.quest.progress.collectedItems > 0) {
              membersWithProgress.push(member);
            } else if(!PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITHOUT_PROGRESS) {
              membersWithoutProgress.push(member);
            }
          }
        }

        const addMemberInfoToMessage = (member) => {
          const pendingDamage = Habitica.padLeft(Math.round(Math.round(member.party.quest.progress.up * 10) / 10), 3);
          const collectedItems = Habitica.padLeft(member.party.quest.progress.collectedItems, 3);
          const progress = bossQuest ? `🎯${pendingDamage}` : `🔍${collectedItems}`;
          const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
          const lastLogin = differenceText ? `🕑${differenceText}` : '';
          const mmemberName = `${member.profile.name} (\`${member.auth.local.username}\`)`;
          message += `- ${progress} | ${lastLogin} | ${mmemberName} ${getUserStatusAsEmojis(member)}  \n`;
        };
        if (bossQuest) {
          membersWithProgress.sort((a, b) => b.party.quest.progress.up - a.party.quest.progress.up);
        } else {
          membersWithProgress.sort((a, b) => b.party.quest.progress.collectedItems - a.party.quest.progress.collectedItems);
        }
        const membersCount = PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS > 0 ? Math.min(PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS, membersWithProgress.length) : membersWithProgress.length;
        for (let i = 0; i < membersCount; i++) {
          const member = membersWithProgress[i];
          if (member) {
            addMemberInfoToMessage(member);
          }
        }
        message += `\n`;
        if (PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS > 0) {
          message += `*The list contains only ${PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS} members with most progress*  \n`;
        }
        if (PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITHOUT_PROGRESS) {
          message += `*The list doesn't contain members who have no quest progress*  \n`;
        } else {
          for (const member of membersWithoutProgress) {
            addMemberInfoToMessage(member);
          }
        }
      } else {
        let questInvitedTime = undefined;
        if (questStatus && questStatus.questInvited === true) {
          questInvitedTime = questStatus.timestamp;
          message += `**Invited to the Quest:** ${getTimeDifferenceToNowAsString(questInvitedTime)} ago  \n`;
        }
        message += `\n`;
        message += `Members who haven't accepted the quest yet:  \n`;
        
        partyMembers.sort((a, b) => new Date(b.auth.timestamps.loggedin) - new Date(a.auth.timestamps.loggedin));
        for (const member of partyMembers) {
          if (member && member.party._id && member.party.quest.key && member.party.quest.RSVPNeeded === true) {
            let memberName = `**${member.profile.name}**`;
            const pingMembersAfterHoursAsMs = PARTY_QUEST_STATUS_PING_MEMBERS_AFTER_X_HOURS * 60 * 60 * 1000;
            if (questInvitedTime && questInvitedTime instanceof Date && ((new Date() - questInvitedTime) >= pingMembersAfterHoursAsMs)) {
              memberName += ` (@${member.auth.local.username})`;
            } else {
              memberName += ` (\`${member.auth.local.username}\`)`;
            }
            const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
            const lastLogin = differenceText ? `🕑${differenceText}` : '';
            message += `- ${lastLogin} | ${memberName} ${getUserStatusAsEmojis(member)}  \n`;
          }
        }
      }
      message += `\n`; // end the list

      console.log(`Triggered by: ${JSON.stringify(triggeredBy)}`);
      if (typeof triggeredBy === 'string' && triggeredBy) {
        message += '`The command was triggered by ' + triggeredBy +'`  \n';
      }
      if (Habitica.sendMessageToParty(message)) {
        checkAndSendPartyQuestStatus.once = true;
      }
    } else {
      console.error(`${arguments.callee.name}: Couldn't get party members`);
    }
  }
}

function sendPartyMembersInfomation(triggeredBy = '') {
  if (!sendPartyMembersInfomation.once) {
    const party = Habitica.getParty();
    if (party) {
      let message = ''; 
      if (party.memberCount < 29) {
        //message += `### ${SCRIPT_NAME} - Party Members  \n`;
        message += `**Party Members Overview**  \n`;
      }
      if (party.memberCount < 28) {
        message += `**Party Leader:** ${party.leader.profile.name}  \n`;
      }
      message += `**Members count:** ${party.memberCount}  \n`;
      message += `\n`;
      
      const partyMembers = Habitica.getPartyMembers(true);
      if (partyMembers && partyMembers.length > 0) {
        const withoutClass = new Array();
        const warriors = new Array();
        const mages = new Array();
        const healers = new Array();
        const rogues = new Array();

        partyMembers.sort((a, b) => a.profile.name.localeCompare(b.profile.name));
        for (const member of partyMembers) {
          if (member && member.party._id) {
            if (member.flags && member.flags.classSelected === true && !member.preferences.disableClasses) {
              switch (member.stats["class"]) {
                case "warrior":
                  warriors.push(member);
                  break;
                case "wizard":
                  mages.push(member);
                  break;
                case "healer":
                  healers.push(member);
                  break;
                case "rogue":
                  rogues.push(member);
                  break;
              }
            } else {
              withoutClass.push(member);
            }
          }
        }

        const addMemberInfoToMessage = (member) => {
          const health = Habitica.padLeft(Math.round(Math.round(member.stats.hp * 10) / 10), 2);
          const pendingDamage = Habitica.padLeft(Math.round(Math.round(member.party.quest.progress.up * 10) / 10), 3);
          const collectedItems = Habitica.padLeft(member.party.quest.progress.collectedItems, 3);
          const differenceText = getTimeDifferenceToNowAsString(new Date(member.auth.timestamps.loggedin));
          const lastLogin = differenceText ? `🕑${differenceText}` : '';
          let status = '';
          if (member.preferences.sleep === true) {
            status += '😴';
          }

          // message += `- ${member.profile.name} (${member.auth.local.username}) | 🔝${member.stats.lvl} | ❤️${health} | ⚔${pendingDamage} | 🔍${member.party.quest.progress.collectedItems} | 🕑${lastLogin} | ${sleeping}  \n`;
          message += `- ${getUserHealthAsEmoji(member)}${health} | 🎯${pendingDamage} | 🔍${collectedItems} | ${lastLogin} | **${member.profile.name}** (\`${member.auth.local.username}\`) ${status}  \n`;
        };
        const addClassToMessage = (className, members) => {
          if (members && members.length > 0) {
            message += `**${className} (${members.length})**  \n`;
            for (const member of members) {
              addMemberInfoToMessage(member);
            }
            message += `\n`;
          }
        }
        addClassToMessage("Warrior", warriors);
        addClassToMessage("Mage", mages);
        addClassToMessage("Healer", healers);
        addClassToMessage("Rogue", rogues);
        addClassToMessage("Without Class", withoutClass);
      } else {
        const errorMessage = `Error: couldn't get members infomation`;
        message += `${errorMessage}  \n`;
        console.error(errorMessage);
      }

      console.log(`Triggered by: ${JSON.stringify(triggeredBy)}`);
      if (typeof triggeredBy === 'string' && triggeredBy) {
        message += '`The command was triggered by ' + triggeredBy +'`  \n';
      }
      Habitica.sendMessageToParty(message);
    }
    sendPartyMembersInfomation.once = true;
  }
}