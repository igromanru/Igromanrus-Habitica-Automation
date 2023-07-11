const scriptProperties = PropertiesService.getScriptProperties();
const habId = scriptProperties.getProperty('API_ID');
const habToken = scriptProperties.getProperty('API_KEY');
const headers = {
  'x-api-user': habId,
  'x-api-key': habToken,
};
const baseUrl = 'https://habitica.com/api';
const partyAPI = baseUrl + '/v3/groups/party';
const userAPI = baseUrl + '/v3/user';
const groupsAPI = baseUrl + '/v3/groups';

function hourlySchedule() {
  console.log('Get user');
  const userResponse = UrlFetchApp.fetch(
    userAPI,
    {
      method: 'get',
      headers
    }
  );
  console.log('User response code: ' + userResponse.getResponseCode());

  console.log('Get party');
  const partyResponse = UrlFetchApp.fetch(
    partyAPI,
    {
      method: 'get',
      headers
    }
  );
  console.log('Party response code: ' + partyResponse.getResponseCode());

  if (userResponse.getResponseCode() == 200) {
    const user = JSON.parse(userResponse).data;
    // console.log('User: ' + JSON.stringify(user));

    if (partyResponse.getResponseCode() == 200) {
      const { data: { quest } } = JSON.parse(partyResponse);
      // console.log('Quest: ' + JSON.stringify(quest));
      console.log('Quest active: ' + quest.active);

      acceptQuest(quest);
      checkAndSendQuestProgress(quest, user);
    }
  }
}

function acceptQuest (quest) {
  if (quest.key && !quest.active && !quest.members[habId]) {
    console.log('Run quests accept');

    const response = UrlFetchApp.fetch(
      `${partyAPI}/quests/accept`,
      {
        method: 'post',
        headers
      }
    );

    console.log('Quests accept code: ' + response.getResponseCode());
    console.log(response.getContentText());
  }
}

function checkAndSendQuestProgress(quest, user) {
  if (quest.key && quest.active && quest.members[habId]) {
    const partyId = user.party._id;
    const dayStartOffset = user.preferences.dayStart;

    const bossHp = quest.progress.hp;
    const itemsToCollect = quest.progress.collect;

    const pendingDamage = Math.round(user.party.quest.progress.up * 10) / 10;
    const collectedItems = user.party.quest.progress.collectedItems;

    const now = new Date();
    const dayStart = new Date();
    dayStart.setHours(24 + dayStartOffset, 0, 0, 0);
    const timeDifference = dayStart - now;
    const hoursDifference = Math.round(timeDifference / (1000 * 60 * 60) * 10) / 10;

    var progressMessage = ''

    if (bossHp != undefined && bossHp > 0) {
      progressMessage = 'Pending damage: ' + pendingDamage
    } else if (itemsToCollect && Object.keys(itemsToCollect).length && collectedItems != undefined && collectedItems > 0) {
      progressMessage = 'Pending items: ' + collectedItems
    }

    if (progressMessage) {
      if (hoursDifference <= 0) {
        progressMessage += ' within the next hour'
      } else {
        progressMessage += ' in about ' + hoursDifference + ' hours'
      }
      progressMessage += '  \n\n*This is a script generated message*'
      console.log(progressMessage);
      if (hoursDifference <= 2 || pendingDamage >= 100)
      {
        const messageData = {
          message: progressMessage
        };
        const chatResponse = UrlFetchApp.fetch(
          `${groupsAPI}/${partyId}/chat`,
          {
            method: 'post',
            headers,
            contentType : 'application/json',
            payload : JSON.stringify(messageData)
          }
        );
        console.log('Chat send response code: ' + chatResponse.getResponseCode());
      }
    }
  }
}

/**
 * runCron()
 * 
 * Forces the user to cron if they haven't already cronned today.
 * Run this function just after the user's day start time.
 */
function runCron() {
  const api = 'https://habitica.com/api/v3/cron';

  console.log('Run cron');
  const response = UrlFetchApp.fetch(
    `${api}`,
    {
      method: 'post',
      headers
    }
  );

  console.log('Response code: ' + response.getResponseCode());
  console.log(response.getContentText());
}