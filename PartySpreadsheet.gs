/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const PartyStatusSpreadsheet = SpreadsheetApp.openById(PARTY_STATUS_SPREADSHEET_ID);
const PartyStatusMembersOverviewSheet = PartyStatusSpreadsheet.getSheetByName('Members Overview');
const PartyStatusQuestProgressSheet = PartyStatusSpreadsheet.getSheetByName('Quest Progress');
const PartyStatusQuestParticipantsSheet = PartyStatusSpreadsheet.getSheetByName('Quest Participants');
const PartyStatusQuestLogSheet = PartyStatusSpreadsheet.getSheetByName('Quest Log');
const PartyStatusMembersLogSheet = PartyStatusSpreadsheet.getSheetByName('Members Log');
const PartyStatusQuestsContentSheet = PartyStatusSpreadsheet.getSheetByName('Quests Content');
const PartyStatusSystemMessagesLogSheet = PartyStatusSpreadsheet.getSheetByName('System Messages Log');

function writePartyStatusMembersOverviewSheet(party, partyMembers) {
  if (PartyStatusMembersOverviewSheet && party && Array.isArray(partyMembers)) {
    let headerRange = PartyStatusMembersOverviewSheet.getRange("A1:B2");
    const headerValues = headerRange.getValues();
    headerValues[0][1] = party.leader.profile.name;
    headerValues[1][1] = party.memberCount;
    console.log(`writePartyStatusMembersOverviewSheet: ${JSON.stringify(headerValues)}`);
    headerRange.setValues(headerValues);
    /*headerRange = PartyStatusMembersOverviewSheet.getRange("A1:A2");
    headerRange.setFontWeight("bold");*/

    partyMembers.sort((a, b) => a.stats.class.localeCompare(b.stats.class));
    let members = [];
    for (const member of partyMembers) {
      if (member && member.party && member.party._id) {
        const pendingDamage = Math.round(Math.round(member.party.quest.progress.up * 10) / 10);
        const collectedItems = member.party.quest.progress.collectedItems;
        const health = Math.round(Math.round(member.stats.hp * 10) / 10);
        const mana = Math.round(Math.round(member.stats.mp * 10) / 10);
        const checkIn = new Date(member.auth.timestamps.loggedin);
        /*let status = '';
        if (member.stats.hp <= 0) {
          status += '💀';
        }
        if (member.preferences.sleep === true) {
          status += '😴';
        }*/
        let quests = "";
        for (const [questKey, questCount] of Object.entries(member.items.quests)) {
          // for (let i = 0; i < questCount; i++) {
          if (questCount > 0) {
            if (quests.length > 0) {
              quests += ",";
            }
            quests += questKey;
          }
        }
        const questKey = member.party.quest.key && !member.party.quest.RSVPNeeded ? member.party.quest.key : "";
        const memberData = [member.stats.class, member.profile.name, '@' + member.auth.local.username,
            health, mana, pendingDamage > 0 ? pendingDamage : "", collectedItems > 0 ? collectedItems : "", 
            Habitica.dateToSpreadsheetDateAsUtc(checkIn), ""/* empty space for the formula */,
            member.preferences.sleep === true, questKey,
            member._id, quests];
        console.log(JSON.stringify(memberData));
        members.push(memberData);
      }
    }
    for (let i = members.length; i < 30; i++) {
      members.push(["","","","","","","","","","","", "", ""]);
    }
    const membersRange = PartyStatusMembersOverviewSheet.getRange("A4:M33");
    membersRange.setValues(members);
  }
}

function writePartyStatusQuestProgressSheet(party, partyMembers) {
  if (PartyStatusQuestProgressSheet && party && Array.isArray(partyMembers)) {
    const quest = party.quest;
    let members = [];
    if (quest && quest.key && quest.active) {
      const questLeader = Habitica.getMemberFromArrayById(partyMembers, party.quest.leader);
      const bossQuest = quest.progress.hp > 0;
      const questStatus = getLastKnownQuestStatus();
      
      PartyStatusQuestProgressSheet.getRange("B1").setValue(questLeader.profile.name);
      PartyStatusQuestProgressSheet.getRange("C2").setValue(Habitica.dateToSpreadsheetDateAsUtc(questStatus.timestamp));
      let accumulatedProgress = 0;

      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));
      for (const member of partyMembers) {
        if (member && member.party && member.party.quest && member.party.quest.key) {
          const pendingDamage = Math.round(Math.round(member.party.quest.progress.up * 10) / 10);
          const collectedItems = member.party.quest.progress.collectedItems;
          const checkIn = new Date(member.auth.timestamps.loggedin);
          const progress = bossQuest ? pendingDamage : collectedItems;
          
          const memberData = [member.profile.name, '@' + member.auth.local.username,
                    progress,
                    Habitica.dateToSpreadsheetDateAsUtc(checkIn),
                  ]   ;
          accumulatedProgress += progress;
          console.log(JSON.stringify(memberData));
          members.push(memberData);
        }
      }
      PartyStatusQuestProgressSheet.getRange("B3").setValue(accumulatedProgress);

      PartyStatusQuestProgressSheet.showSheet();
      PartyStatusQuestProgressSheet.activate();
    } else {
      PartyStatusQuestProgressSheet.hideSheet();
    }
    for (let i = members.length; i < 30; i++) {
      members.push(["", "", "", ""]);
    }
    const membersRange = PartyStatusQuestProgressSheet.getRange("A5:D34");
    membersRange.setValues(members);
  }
}

function writePartyStatusQuestParticipantsSheet(party, partyMembers) {
  if (PartyStatusQuestParticipantsSheet && party && Array.isArray(partyMembers)) {
    const quest = party.quest;
    let members = [];
    if (quest && quest.key && !quest.active) {
      const questLeader = Habitica.getMemberFromArrayById(partyMembers, party.quest.leader);
      const questStatus = getLastKnownQuestStatus();
      
      let headerRange = PartyStatusQuestParticipantsSheet.getRange("A1:C2");
      const headerValues = headerRange.getValues();
      headerValues[0][1] = questLeader.profile.name;
      headerValues[1][1] = "=DURATION_UNTIL_NOW(C2)";
      headerValues[1][2] = Habitica.dateToSpreadsheetDateAsUtc(questStatus.timestamp);
      console.log(`writePartyStatusQuestParticipationsSheet: Header values: ${JSON.stringify(headerValues)}`);
      headerRange.setValues(headerValues);

      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));
      for (const member of partyMembers) {
        if (member && member.party && member.party._id && member.party.quest) {
          const checkIn = new Date(member.auth.timestamps.loggedin);
          let questStatus = '';
          if (!member.party.quest.key) {
            questStatus = 'Declined';
          } else if (member.party.quest.RSVPNeeded === true) {
            questStatus = 'Pending';
          } else {
            questStatus = 'Accepted';
          }
          const memberData = [ member.profile.name, '@' + member.auth.local.username,
              questStatus, Habitica.dateToSpreadsheetDateAsUtc(checkIn)];
          console.log(JSON.stringify(memberData));
          members.push(memberData);
        }
      }
      PartyStatusQuestParticipantsSheet.showSheet();
      PartyStatusQuestProgressSheet.activate();
    } else {
      PartyStatusQuestParticipantsSheet.hideSheet();
    }
    for (let i = members.length; i < 30; i++) {
      members.push(["", "", "", ""]);
    }
    const membersRange = PartyStatusQuestParticipantsSheet.getRange("A4:D33");
    membersRange.setValues(members);
  }
}

function writePartyStatusSpreadsheet() {
  const party = Habitica.getParty();
  if (party) {
    const partyMembers = Habitica.getPartyMembers(true);
    if (party && Array.isArray(partyMembers)) {
      writePartyStatusMembersOverviewSheet(party, partyMembers);
      writePartyStatusQuestProgressSheet(party, partyMembers);
      writePartyStatusQuestParticipantsSheet(party, partyMembers);
      Habitica.resetAllSpreadsheetFilters(PartyStatusSpreadsheet);
      PartyStatusSpreadsheet.moveActiveSheet(1);
    }
  }
}

function updatePartyStatusQuestLogSheet() {
  if (PartyStatusQuestLogSheet) {
    const questStatus = getLastKnownQuestStatus();
    if (questStatus && questStatus.questKey && Habitica.isDate(questStatus.timestamp)) {
      const KEY_INDEX = 0;
      const INVITED_INDEX = 1;
      const STARTED_INDEX = 2;
      const FINISHED_INDEX = 3;
      const OWNER_INDEX = 4;
      const PARTICIPANTS_INDEX = 7;
      const NON_PARTICIPANTS_INDEX = 8;

      const timestamp = Habitica.dateToSpreadsheetDateAsUtc(questStatus.timestamp);
      const lastRow = PartyStatusQuestLogSheet.getLastRow();
      const lastColumn = 5;
      const range = PartyStatusQuestLogSheet.getRange(2, 1, lastRow, lastColumn);
      const values = range.getValues();
      let workRow = ["", "", "", "", ""];
      let foundIndex = values.findLastIndex((row) => row[KEY_INDEX] == questStatus.questKey);

      if (foundIndex >= 0) {
        workRow = values[foundIndex];
        if ((questStatus.questOwner && workRow[OWNER_INDEX] != questStatus.questOwner)
            || (workRow[INVITED_INDEX] && workRow[INVITED_INDEX] != timestamp
            && workRow[STARTED_INDEX] && workRow[STARTED_INDEX] != timestamp
            && workRow[FINISHED_INDEX] && workRow[FINISHED_INDEX] != timestamp)
            ) {
          foundIndex = -1;
        } else {
          if (questStatus.questInvited && !workRow[INVITED_INDEX]) {
            workRow[INVITED_INDEX] = timestamp;
          } 
          if(questStatus.questStarted && !workRow[STARTED_INDEX]) {
            workRow[STARTED_INDEX] = timestamp;
          }
          if(questStatus.questFinished && !workRow[FINISHED_INDEX]) {
            workRow[FINISHED_INDEX] = timestamp;
          }
        }
      }

      if (foundIndex < 0) {
        // Check for past quests and mark them as "canceled"
        for (const row of values) {
          if (row[KEY_INDEX]) {
            if(!row[STARTED_INDEX]) {
              row[STARTED_INDEX] = 'canceled';
            }
            if(!row[FINISHED_INDEX]) {
              row[FINISHED_INDEX] = 'canceled';
            }
          }
        }

        foundIndex = values.length - 1;
        workRow = values[foundIndex];
        workRow[KEY_INDEX] = questStatus.questKey;
        if (questStatus.questInvited) {
          workRow[INVITED_INDEX] = timestamp;
        } else if(questStatus.questStarted) {
          workRow[STARTED_INDEX] = timestamp;
        } else if(questStatus.questFinished) {
          workRow[FINISHED_INDEX] = timestamp;
        }
      }
      if (workRow[FINISHED_INDEX] && !workRow[STARTED_INDEX]) {
        workRow[STARTED_INDEX] = "unknown";
      }
      if (workRow[STARTED_INDEX] && !workRow[INVITED_INDEX]) {
        workRow[INVITED_INDEX] = "unknown";
      }
      if(questStatus.questOwner /*&& !workRow[OWNER_INDEX]*/) {
        workRow[OWNER_INDEX] = questStatus.questOwner;
      }

      if(questStatus.questStarted) {
        const participantsRange = PartyStatusQuestLogSheet.getRange(foundIndex + 2, PARTICIPANTS_INDEX + 1, 1, 1);
        if (!participantsRange.getValue()) {
          const partyMembers = Habitica.getPartyMembers(true);
          if (Array.isArray(partyMembers)) {
            let participants = "";
            let nonParticipants = "";
            for (const member of partyMembers) {
              if (member.party) {
                if (member.party.quest && member.party.quest.key) {
                  if (participants.length > 0) {
                    participants += ",";
                  }
                  participants += member._id;
                } else {
                  if (nonParticipants.length > 0) {
                    nonParticipants += ",";
                  }
                  nonParticipants += member._id;
                }
              }
            }
            if (participants.length > 0) {
              participantsRange.setValue(participants);
            }
            if (nonParticipants.length > 0) {
              const nonParticipantsRange = PartyStatusQuestLogSheet.getRange(foundIndex + 2, NON_PARTICIPANTS_INDEX + 1, 1, 1);
              nonParticipantsRange.setValue(nonParticipants);
            }
          }
        }
      }

      values[foundIndex] = workRow;
      range.setValues(values);
      console.log(`updatePartyStatusQuestLogSheet: Row index: ${foundIndex}\nValues: ${JSON.stringify(workRow)}`);
      Habitica.resetSheetFilter(PartyStatusQuestLogSheet);
    } else {
      console.error(`updatePartyStatusQuestLogSheet: questStatus: ${JSON.stringify(questStatus)}\nquestKey: ${questStatus.questKey}`);
    }
  }
}

function updatePartyStatusQuestsContentSheet() {
  if (PartyStatusQuestsContentSheet) {
    const contentEntries = Habitica.getQuestContentEntries();
    if (Array.isArray(contentEntries) && contentEntries.length > 0) {
      contentEntries.sort((a,b) => a[0] < b[0] ? -1 : 1);

      const lastRow = PartyStatusQuestsContentSheet.getLastRow();
      const lastColumn = PartyStatusQuestsContentSheet.getLastColumn();
      const range = PartyStatusQuestsContentSheet.getRange(2, 1, Math.max(lastRow, contentEntries.length), lastColumn);
      const values = range.getValues();

      const KEY_INDEX = 0;
      const QUEST_NAME_INDEX = 1;
      const BOSS_INDEX = 2;
      const BOSS_HP_INDEX = 3;
      const COLLECT_1_INDEX = 4;
      const COLLECT_1_COUNT_INDEX = 5;
      const COLLECT_2_INDEX = 6;
      const COLLECT_2_COUNT_INDEX = 7;
      const COLLECT_3_INDEX = 8;
      const COLLECT_3_COUNT_INDEX = 9;

      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        row.fill("");
        if (i < contentEntries.length) {
          const key = contentEntries[i][0];
          const data = contentEntries[i][1];
          if (key && data) {
            row[KEY_INDEX] = key;
            row[QUEST_NAME_INDEX] = data.text;
            if (data.boss) {
              row[BOSS_INDEX] = data.boss.name;
              row[BOSS_HP_INDEX] = data.boss.hp;
            }
            if (data.collect) {
              const collectEntries = Object.entries(data.collect);
              if (collectEntries.length > 0) {
                row[COLLECT_1_INDEX] = collectEntries[0][1].text;
                row[COLLECT_1_COUNT_INDEX] = collectEntries[0][1].count;
              }
              if (collectEntries.length > 1) {
                row[COLLECT_2_INDEX] = collectEntries[1][1].text;
                row[COLLECT_2_COUNT_INDEX] = collectEntries[1][1].count;
              }
              if (collectEntries.length > 2) {
                row[COLLECT_3_INDEX] = collectEntries[2][1].text;
                row[COLLECT_3_COUNT_INDEX] = collectEntries[2][1].count;
              }
            }
          }
        }
      }
      range.setValues(values);
      Habitica.resetSheetFilter(PartyStatusQuestsContentSheet);
    } else {
      console.error(`updatePartyStatusQuestsContentSheet: ContentEntries are invalid: ${contentEntries} (type: ${typeof contentEntries})`);
    }
  } else {
    console.error(`updatePartyStatusQuestsContentSheet: Couldn't find the sheet`);
  }
}

function checkAndAddToPartyStatusMembersLogSheet(partyMembers) {
  if (PartyStatusMembersLogSheet && Array.isArray(partyMembers) && partyMembers.length > 0) {
    const membersCache = getPartyMembersCache();
    if (membersCache && membersCache.members.length > 0) {
      const changedMembers = []; // [[member object, new member = true, missing member = false]]
      for (const partyMember of partyMembers) {
        if (membersCache.members.findIndex((member) => member.id === partyMember._id) < 0) {
          changedMembers.push([{
            id: partyMember._id,
            username: partyMember.auth.local.username,
            displayName: partyMember.profile.name
          }, true]);
        }
      }
      for (const cachedMember of membersCache.members) {
        if (partyMembers.findIndex((member) => member._id === cachedMember.id) < 0) {
          changedMembers.push([cachedMember, false]);
        }
      }
      /*changedMembers.push([{
            id: "123",
            username: "test",
            displayName: "Tester"
          }, true]);*/
      if (changedMembers.length > 0) {
        const lastRow = PartyStatusMembersLogSheet.getLastRow();
        const lastColumn = PartyStatusMembersLogSheet.getLastColumn();
        let rangeLength = Math.max(lastRow, changedMembers.length);
        let range = PartyStatusMembersLogSheet.getRange(2, 1, rangeLength, lastColumn);
        const values = range.getValues();
        const nowAsSheetDate = Habitica.dateToSpreadsheetDateAsUtc(new Date());

        const USERNAME_INDEX = 0;
        const DISPLAY_NAME_INDEX = 1;
        const JOIN_DATE_INDEX = 2;
        const LEFT_DATE_INDEX = 3;
        const USER_ID_INDEX = 4;

        for (const [member, isNew] of changedMembers) {
          let foundAt = values.length > 1 ? values.findLastIndex((row) => row[USER_ID_INDEX] == member.id) : -1;
          if (foundAt < 0 || (values[foundAt][JOIN_DATE_INDEX] && values[foundAt][LEFT_DATE_INDEX])) {
            foundAt = values.length - 1;
            values.push(Array(lastColumn));
            rangeLength++;
          }
          const row = values[foundAt];
          row[USER_ID_INDEX] = member.id;
          row[USERNAME_INDEX] = member.username;
          row[DISPLAY_NAME_INDEX] = member.displayName;
          if (isNew) {
            if (!row[JOIN_DATE_INDEX]) {
              row[JOIN_DATE_INDEX] = nowAsSheetDate;
            }
          } else if (!row[LEFT_DATE_INDEX]) {
            if (!row[JOIN_DATE_INDEX]) {
              row[JOIN_DATE_INDEX] = "unknown";
            }
            row[LEFT_DATE_INDEX] = nowAsSheetDate;
          }
        }
        range = PartyStatusMembersLogSheet.getRange(2, 1, rangeLength, lastColumn);
        range.setValues(values);
        Habitica.resetSheetFilter(PartyStatusMembersLogSheet);
      }
    }
  }
}

function logSystemMessageToPartyStatusSystemMessagesLogSheet(data) {
  if (data && data.chat && data.chat.uuid == "system" && data.chat.info && PartyStatusSystemMessagesLogSheet) {
    const chat = data.chat;
    const lastRow = PartyStatusSystemMessagesLogSheet.getLastRow();
    const newRowIndex = lastRow + 1;

    let columnCount = 0;
    const MSG_ID_INDEX = columnCount++;
    const TIMESTAMP_INDEX = columnCount++;
    const USER_INDEX = columnCount++;
    const TEXT_INDEX = columnCount++;
    const TYPE_INDEX = columnCount++;
    const QUEST_INDEX = columnCount++;
    const USER_DAMAGE_INDEX = columnCount++;
    const BOSS_DAMAGE_INDEX = columnCount++;
    const CLASS_INDEX = columnCount++;
    const SPELL_INDEX = columnCount++;
    const TARGET_INDEX = columnCount++;
    const CAST_TIMES_INDEX = columnCount++;
    const ITEMS_INDEX = columnCount++;

    const newRowRange = PartyStatusSystemMessagesLogSheet.getRange(newRowIndex, 1, 1, columnCount);
    const newRow = new Array(columnCount).fill("");
    if (chat) {
      newRow[MSG_ID_INDEX] = chat._id;
      newRow[TIMESTAMP_INDEX] = Habitica.dateToSpreadsheetDateAsUtc(new Date(chat.timestamp));
      newRow[TEXT_INDEX] = chat.unformattedText;
      if (chat.info) {
        newRow[TYPE_INDEX] = chat.info.type;
        newRow[USER_INDEX] = chat.info.user;
        if (chat.info.quest) {
          newRow[QUEST_INDEX] = chat.info.quest;
        }
        if (chat.info.userDamage) {
          newRow[USER_DAMAGE_INDEX] = parseFloat(chat.info.userDamage);
        }
        if (chat.info.bossDamage) {
          newRow[BOSS_DAMAGE_INDEX] = parseFloat(chat.info.bossDamage);
        }
        if (chat.info.class) {
          newRow[CLASS_INDEX] = chat.info.class;
        }
        if (chat.info.spell) {
          newRow[SPELL_INDEX] = chat.info.spell;
        }
        if (chat.info.target) {
          newRow[TARGET_INDEX] = chat.info.target;
        }
        if (chat.info.times) {
          newRow[CAST_TIMES_INDEX] = chat.info.times;
        }
        if (chat.info.items) {
          let items = "";
          for (const [itemKey, amount] of Object.entries(chat.info.items)) {
            if (amount > 0) {
              if (items.length > 0) {
                items += ",";
              }
              items += itemKey + ":" + amount;
            }
          }
          newRow[ITEMS_INDEX] = items;
        }
      }
    }
    newRowRange.setValues([newRow]);
    Habitica.resetSheetFilter(PartyStatusSystemMessagesLogSheet);
    console.log(`logSystemMessageToPartyStatusSystemMessagesLogSheet: New row index: ${newRowIndex}\ndata: ${JSON.stringify(newRow)}`);
  }
}