/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

function test() {
  console.log(arguments.callee.name);

  const date1 = new Date();
  console.log(`Unix timestamp: ${date1.valueOf()}`);
  date1.setHours(date1.getHours() - 26);
  date1.setMinutes(date1.getMinutes() - 12);
  console.log(Habitica.getTimeDifferenceToNowAsString(date1));

  const date2 = new Date();
  date2.setHours(date1.getHours() - 12);
  date2.setMinutes(date2.getMinutes() - 12);
  console.log(Habitica.getTimeDifferenceToNowAsString(date2));

  const date3 = new Date();
  date3.setMinutes(date3.getMinutes() - 12);
  console.log(Habitica.getTimeDifferenceToNowAsString(date3));

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

function testAutoRegenMana() {
  const user = Habitica.getUser();
  autoRegenManaFromHabit(user, 5);
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


function testCheckMessageForBossDamage() {
  const chat = {
    "flagCount": 0,
    "flags": {},
    "_id": "512c3686-6062-45cf-acf2-a2852459d19b",
    "id": "512c3686-6062-45cf-acf2-a2852459d19b",
    "text": "`Sinkard attacca The Dread Yarnghetti e fa 3.8 danni. The Dread Yarnghetti attacca la squadra e fa 9.2 danni.`",
    "unformattedText": "Sinkard attacca The Dread Yarnghetti e fa 3.8 danni. The Dread Yarnghetti attacca la squadra e fa 9.2 danni.",
    "info": {
        "type": "boss_damage",
        "user": "Sinkard",
        "quest": "yarn",
        "userDamage": "3.8",
        "bossDamage": "9.2"
    },
    "timestamp": "2023-12-21T07:42:57.313Z",
    "likes": {},
    "uuid": "system",
    "groupId": "70d4d209-b406-4c68-94e8-04e6756d668b"
  };
  checkMessageForBossDamage(chat);
}

function testWritePartyStatusSpreadsheet() {
  writePartyStatusSpreadsheet(Habitica.getParty(), Habitica.getPartyMembers(true));
}

function testLogSystemMessageToPartyStatusSystemMessagesLogSheet() {
  const data = {
      "group": {
          "id": "70d4d209-b406-4c68-94e8-04e6756d668b",
          "name": "Habitual Legends"
      },
      "chat": {
          "flagCount": 0,
          "flags": {},
          "_id": "1ee14b99-9b51-431e-b216-d7a9e939d59f",
          "id": "1ee14b99-9b51-431e-b216-d7a9e939d59f",
          "text": "`Ruby Rose attacks Monstrous Moon for 10.3 damage. Monstrous Moon attacks party for 0.0 damage.`",
          "unformattedText": "Ruby Rose attacks Monstrous Moon for 10.3 damage. Monstrous Moon attacks party for 0.0 damage.",
          "info": {
              "type": "boss_damage",
              "user": "Ruby Rose",
              "quest": "moon3",
              "userDamage": "10.3",
              "bossDamage": "0.0"
          },
          "timestamp": "2024-01-30T15:17:06.852Z",
          "likes": {},
          "uuid": "system",
          "groupId": "70d4d209-b406-4c68-94e8-04e6756d668b"
      },
      "webhookType": "groupChatReceived",
      "user": {
          "_id": "06b046d4-160a-4a20-b527-b74385052f0e"
      }
  };
  const itemsData = {
      "group": {
          "id": "70d4d209-b406-4c68-94e8-04e6756d668b",
          "name": "Habitual Legends"
      },
      "chat": {
          "flagCount": 0,
          "flags": {},
          "_id": "3c78ba9d-28f5-4825-bc77-b7ae44a24e05",
          "id": "3c78ba9d-28f5-4825-bc77-b7ae44a24e05",
          "text": "`sunbruised found 12 Bars of Soap.`",
          "unformattedText": "sunbruised found 12 Bars of Soap.",
          "info": {
              "type": "user_found_items",
              "user": "sunbruised",
              "quest": "atom1",
              "items": {
                  "soapBars": 12
              }
          },
          "timestamp": "2024-02-02T18:48:33.745Z",
          "likes": {},
          "uuid": "system",
          "groupId": "70d4d209-b406-4c68-94e8-04e6756d668b"
      },
      "webhookType": "groupChatReceived",
      "user": {
          "_id": "06b046d4-160a-4a20-b527-b74385052f0e"
      }
  };
  logSystemMessageToPartyStatusSystemMessagesLogSheet(itemsData);
}