/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const PartyStatusSpreadsheet = SpreadsheetApp.openById(PARTY_STATUS_SPREADSHEET_ID);
const PartyStatusMembersOverviewSheet = PartyStatusSpreadsheet.getSheetByName('Members Overview');
const PartyStatusQuestProgressSheet = PartyStatusSpreadsheet.getSheetByName('Quest Progress');
const PartyStatusQuestLogSheet = PartyStatusSpreadsheet.getSheetByName('Quest Log');
const PartyStatusMembersLogSheet = PartyStatusSpreadsheet.getSheetByName('Members Log');

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
  if (party && Array.isArray(partyMembers)) {
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
            Habitica.getTimeDifferenceToNowAsString(checkIn, 999999, " ") + ' ago',
            health, mana, pendingDamage, collectedItems, status];
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
  if (party && Array.isArray(partyMembers)) {
    const quest = party.quest;
    let members = [];
    if (quest && quest.key && quest.active) {
      const questLeader = Habitica.getMemberFromArrayById(partyMembers, party.quest.leader);
      const bossQuest = quest.progress.hp > 0;
      const questStatus = getLastKnownQuestStatus();
      
      let headerRange = PartyStatusQuestProgressSheet.getRange("A1:B2");
      const headerValues = [
          ['Quest Leader:', questLeader.profile.name],
          ['Quest Started:', Habitica.getTimeDifferenceToNowAsString(questStatus.timestamp, 999999, " ") + ' ago']
      ];
      console.log(`writePartyStatusQuestStatusSheet: ${JSON.stringify(headerValues)}`);
      headerRange.setValues(headerValues);

      partyMembers.sort((a, b) => new Date(a.auth.timestamps.loggedin) - new Date(b.auth.timestamps.loggedin));
      for (const member of partyMembers) {
        if (member && member.party && member.party._id) {
          const pendingDamage = Math.round(Math.round(member.party.quest.progress.up * 10) / 10);
          const collectedItems = member.party.quest.progress.collectedItems;
          const checkIn = new Date(member.auth.timestamps.loggedin);
          const memberData = [ member.profile.name, '@' + member.auth.local.username,
              Habitica.getTimeDifferenceToNowAsString(checkIn, 999999, " ") + ' ago',
              bossQuest ? pendingDamage : collectedItems];
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

function writePartyStatusQuestLogSheet(party, partyMembers) {
  if (party && Array.isArray(partyMembers)) {

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
      writePartyStatusQuestLogSheet(party, partyMembers);
      writePartyStatusMembersLogSheet(party, partyMembers);
      resetSpreadsheetFilters(PartyStatusSpreadsheet);
    }
  }
}