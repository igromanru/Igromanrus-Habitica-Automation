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

function resetSpreadsheetFilters(spreadsheet) {
  for (const sheet of spreadsheet.getSheets()) {
    const filter = sheet.getFilter();
    if (filter) {
      const range = filter.getRange();
      for (let i = range.getColumn(), maxCol = range.getLastColumn(); i <= maxCol; i++) {
        const filterCriteria = filter.getColumnFilterCriteria(i);
        if (filterCriteria) {
          filter.setColumnFilterCriteria(i, filterCriteria);
        }
      }
    }
  }
}

function writePartyStatusMembersOverviewSheet(party, partyMembers) {
  if (PartyStatusMembersOverviewSheet && party && Array.isArray(partyMembers)) {
    let headerRange = PartyStatusMembersOverviewSheet.getRange("A1:B2");
    const headerValues = [
        ['Party Leader:', party.leader.profile.name],
        ['Members count:', party.memberCount],
    ];
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
        let status = '';
        if (member.stats.hp <= 0) {
          status += '💀';
        }
        if (member.preferences.sleep === true) {
          status += '😴';
        }
        const memberData = [member.stats.class, member.profile.name, '@' + member.auth.local.username,
            health, mana, pendingDamage, collectedItems, status,
            /*Habitica.getTimeDifferenceToNowAsString(checkIn, 999999, " ") + ' ago'*/Habitica.dateToSpreadsheetDate(checkIn)
            ];
        console.log(JSON.stringify(memberData));
        members.push(memberData);
      }
    }
    for (let i = members.length; i < 30; i++) {
      members.push(["", "", "", "", "", "", "", "", ""]);
    }
    const membersRange = PartyStatusMembersOverviewSheet.getRange("A4:I33");
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
      
      let headerRange = PartyStatusQuestProgressSheet.getRange("A1:C2");
      const headerValues = [
          ['Quest Leader:', questLeader.profile.name, ""],
          ['Quest Started:', '=TEXT(ROUNDDOWN(NOW()-C2),0)&" days "&TEXT(NOW()-C2,"HH:mm")&" ago"', Habitica.dateToSpreadsheetDate(questStatus.timestamp)]
      ];
      console.log(`writePartyStatusQuestStatusSheet: ${JSON.stringify(headerValues)}`);
      headerRange.setValues(headerValues);

      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));
      for (const member of partyMembers) {
        if (member && member.party && member.party._id) {
          const pendingDamage = Math.round(Math.round(member.party.quest.progress.up * 10) / 10);
          const collectedItems = member.party.quest.progress.collectedItems;
          const checkIn = new Date(member.auth.timestamps.loggedin);
          const memberData = [member.profile.name, '@' + member.auth.local.username,
                    bossQuest ? pendingDamage : collectedItems,
                    Habitica.dateToSpreadsheetDate(checkIn),
                  ]   ;
          console.log(JSON.stringify(memberData));
          members.push(memberData);
        }
      }
      PartyStatusQuestProgressSheet.showSheet();
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
      const headerValues = [
          ['Quest Leader:', questLeader.profile.name, ""],
          ['Invited to the Quest:', '=TEXT(ROUNDDOWN(NOW()-C2),0)&" days "&TEXT(NOW()-C2,"HH:mm")&" ago"', Habitica.dateToSpreadsheetDate(questStatus.timestamp)]
      ];
      console.log(`writePartyStatusQuestParticipationsSheet: ${JSON.stringify(headerValues)}`);
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
              questStatus, Habitica.dateToSpreadsheetDate(checkIn)];
          console.log(JSON.stringify(memberData));
          members.push(memberData);
        }
      }
      PartyStatusQuestParticipantsSheet.showSheet();
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

function writePartyStatusMembersLogSheet(party, partyMembers) {
  if (party && Array.isArray(partyMembers)) {

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
      resetSpreadsheetFilters(PartyStatusSpreadsheet);
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

      const timestamp = Habitica.dateToSpreadsheetDate(questStatus.timestamp);
      const lastRow = PartyStatusQuestLogSheet.getLastRow();
      const lastColumn = PartyStatusQuestLogSheet.getLastColumn();
      let range = PartyStatusQuestLogSheet.getRange(2, 1, lastRow, lastColumn);
      let values = range.getValues();
      let workRow = [];
      let foundIndex = values.findLastIndex((row) => row[0] == questStatus.questKey);

      if (foundIndex >= 0) {
        workRow = values[foundIndex];
        if (workRow[INVITED_INDEX] && workRow[STARTED_INDEX] && workRow[FINISHED_INDEX]) {
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

      values[foundIndex] = workRow;
      range.setValues(values);
    } else {
      console.error(`updatePartyStatusQuestLogSheet: questStatus: ${JSON.stringify(questStatus)}\nquestKey: ${questStatus.questKey}`);
    }
  }
}

function updatePartyStatusQuestsContentSheet() {
  if (PartyStatusQuestsContentSheet) {
    const contentEntries = Habitica.getQuestContentEntries();
    if (Array.isArray(contentEntries) && contentEntries.length > 0) {
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
    } else {
      console.error(`updatePartyStatusQuestsContentSheet: ContentEntries are invalid: ${contentEntries} (type: ${typeof contentEntries})`);
    }
  } else {
    console.error(`updatePartyStatusQuestsContentSheet: Couldn't find the sheet`);
  }
}