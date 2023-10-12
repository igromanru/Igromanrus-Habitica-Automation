function checkAndSendPartyQuestStatus(triggeredBy = '') {
  if (checkAndSendPartyQuestStatus.once === true) {
    return;
  }

  const party = Habitica.getParty();
  if (party && party.quest && party.quest.key) {
    const partyMembers = Habitica.getPartyMembers(true);
    if (partyMembers && partyMembers.length > 0) {
      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));

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
          const lastCheckin = new Date(member.auth.timestamps.loggedin);
          const timeDifference = getTimeDifferenceToNow(lastCheckin);
          if (timeDifference && timeDifference.days <= PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITH_PENDING_CRON_OVER_X_DAYS) {
            const differenceText = getTimeDifferenceToNowAsString(lastCheckin);
            const lastLogin = differenceText ? `🕑${differenceText}` : '';
            const mmemberName = `${member.profile.name} (\`${member.auth.local.username}\`)`;
            message += `- ${progress} | ${lastLogin} | ${mmemberName} ${getUserStatusAsEmojis(member)}  \n`;
            return true;
          }
          return false;
        };
        /*if (bossQuest) {
          membersWithProgress.sort((a, b) => b.party.quest.progress.up - a.party.quest.progress.up);
        } else {
          membersWithProgress.sort((a, b) => b.party.quest.progress.collectedItems - a.party.quest.progress.collectedItems);
        }*/
        
        let membersCount = PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS > 0 ? Math.min(PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS, membersWithProgress.length) : membersWithProgress.length;
        for (let i = 0; i < membersCount; i++) {
          const member = membersWithProgress[i];
          if (member) {
            if (!addMemberInfoToMessage(member)) {
              membersCount++;
            }
          }
        }
        message += `\n`;
        message += `The list contains:  \n`;
        if (PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITH_PENDING_CRON_OVER_X_DAYS > 0) {
          message += `- *Active members*  \n`;
        }
        if (PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS > 0) {
          message += `- *${PARTY_QUEST_STATUS_SEND_ONLY_TOP_X_MEMBERS} members*  \n`;
        }
        if (PARTY_QUEST_STATUS_IGNORE_MEMBERS_WITHOUT_PROGRESS) {
          message += `- *Only members with quest progress*  \n`;
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
        
        // partyMembers.sort((a, b) => new Date(b.auth.timestamps.loggedin) - new Date(a.auth.timestamps.loggedin));
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
      message += getTriggeredByMessage(triggeredBy);

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

      message += getTriggeredByMessage(triggeredBy);
      Habitica.sendMessageToParty(message);
    }
    sendPartyMembersInfomation.once = true;
  }
}

function sendInactivePartyMembers(triggeredBy = '') {
  if (!sendInactivePartyMembers.once) {
    const partyMembers = Habitica.getPartyMembers(true);
    if (partyMembers && partyMembers.length > 0) {
      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));
      let message = '';
      message += `**Party Members with last cron over ${PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_DAYS} day(s) and ${PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_HOURS} hour(s)**  \n`;

      const addMemberInfoToMessage = (member, timeDifference) => {
        const pendingDamage = Habitica.padLeft(Math.round(Math.round(member.party.quest.progress.up * 10) / 10), 3);
        const differenceText = timeDifferenceToString(timeDifference);
        const lastLogin = differenceText ? `🕑${differenceText}` : '';
        const status = getUserStatusAsEmojis(member);
        message += `- ${lastLogin} | 🎯${pendingDamage} | **${member.profile.name}** (\`${member.auth.local.username}\`) ${status}  \n`;
      };
      for (const member of partyMembers) {
          if (member && member.party._id) {
            const timeDifference = getTimeDifferenceToNow(new Date(member.auth.timestamps.loggedin));
            if (timeDifference && timeDifference.days >= PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_DAYS && timeDifference.hours >= PARTY_MEMBERS_WITH_LAST_CRON_OVER_X_HOURS) {
              addMemberInfoToMessage(member, timeDifference);
            }
          }
      }

      message += getTriggeredByMessage(triggeredBy);
      Habitica.sendMessageToParty(message);
    }
    sendInactivePartyMembers.once = true;
  }
}