/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

function test() {
  console.log(arguments.callee.name);

  const date1 = new Date();
  date1.setHours(date1.getHours() - 26);
  date1.setMinutes(date1.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date1));

  const date2 = new Date();
  date2.setHours(date1.getHours() - 12);
  date2.setMinutes(date2.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date2));

  const date3 = new Date();
  date3.setMinutes(date3.getMinutes() - 12);
  console.log(getTimeDifferenceToNowAsString(date3));

  const dayStartOffset = 1;
  const now = new Date();
  // now.setHours(dayStartOffset, 0, 0, 0);

  const hours = now.getHours();
  const nextDayStart = new Date();
  if (hours >= dayStartOffset) {
    nextDayStart.setHours(24 + dayStartOffset, 0, 0, 0);
  } else {
    nextDayStart.setHours(dayStartOffset, 0, 0, 0);
  }
  const timeDifference = nextDayStart - now;
  const hoursDifferenceToDayStart = Math.round(timeDifference / (1000 * 60 * 60) * 10) / 10;

  console.log(hoursDifferenceToDayStart);
}

function test2() {
  const bossQuest = true;
  const questProgress = 85;
  const quest = {
    progress: {
      hp: 100
    }
  };
  console.log('Is boss quest: ' + bossQuest);
  console.log('Damage accumulated: ' + !ACCUMULATE_UNTIL_ONE_HIT && questProgress < DAMAGE_TO_ACCUMULATE);
  console.log('Not one hit: ' + questProgress < quest.progress.hp);
  console.log('Send to sleep: ' + bossQuest && ((!ACCUMULATE_UNTIL_ONE_HIT && questProgress < DAMAGE_TO_ACCUMULATE) || questProgress >= quest.progress.hp));
}

function testPadLeft() {
  const value1 = 12;
  console.log(`Original value: ${value1}, padded: ${padLeft(value1, 4, "/\\")}`);
}

function testFetchLimit() {
  const user = Habitica.getUser();
  const party = Habitica.getParty();
  const members = Habitica.getPartyMembers();
  if (members && members.length > 0) {
    console.log(`${members.length} members found`);
    for (let i = 0; i < members.length; i++) {
      console.log(`Getting member index: ${i}`);
      const member = Habitica.getMemberById(members[i]._id);
      if (member) {
        console.log(`Member: ${member.profile.name}`);
      }
    }
  }
  const chats = Habitica.getPartyChat();
  console.log(`Found ${chats.length} party chats`);
}

function testLibrary() {
  // console.log(JSON.stringify(Habitica.getRequestHeaders()));
  /*const triggers = Habitica.getTriggers();
  for (const trigger of triggers) {
    console.log(trigger.getHandlerFunction());
  }*/

  const properties = Habitica.getScriptProperties();
  console.log(JSON.stringify(properties));
}

function testGetUserStats() {
  console.time('getUser');
  const user = Habitica.getUser();
  console.timeEnd('getUser');

  const timeHandler = 'getUserStats';
  console.time(timeHandler);
  const userStats = Habitica.getUserStats(user);
  console.timeEnd(timeHandler);
  console.log(JSON.stringify(userStats));
}