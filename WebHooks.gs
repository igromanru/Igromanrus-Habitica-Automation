/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */
// --------------------------------------------
// -------- WebHooks related functions -------- 
// --------------------------------------------
function createWebhooks() {
  deleteWebhooks();
  console.log("Creating WebHooks...");

  if (ENABLE_PARTY_CHAT_WEBHOOK) {
    const partyId = getPartyIdProperty();
    if (partyId) {
      const options = {
        groupId: partyId
      };
      Habitica.createWebHook(WebAppUrl, PARTY_CHAT_WEBHOOK_NAME, 'groupChatReceived', options);
    } else {
      console.error(`Can't create Party Chat WebHook, the PARTY_ID property isn't yet set!`);
    }
  }
  if (ENABLE_QUEST_ACTIVITY_WEBHOOK) {
    const options = {
      questStarted: true,
      questFinished: true,
      questInvited: true
    };
    Habitica.createWebHook(WebAppUrl, QUEST_ACTIVITY_WEBHOOK_NAME, 'questActivity', options);
  }
}

function deleteWebhooks() {
  console.log("Deleting WebHooks...");

  const webHooks = Habitica.getWebHooks();
  if (webHooks && webHooks.length > 0) {
    for (const webHook of webHooks) {
      if (webHook && webHook.id) {
        switch (webHook.label) {
          case PARTY_CHAT_WEBHOOK_NAME:
          case QUEST_ACTIVITY_WEBHOOK_NAME:
            console.log(`Deleting WebHook: ${webHook.label}`);
            Habitica.deleteWebHook(webHook.id);
            break;
        }
      }
    }
  } else {
    console.log(`No WebHooks found`);
  }
}

/**
 * WebApi GET entry
 * 
 * See: https://developers.google.com/apps-script/guides/web
 */
function doGet(e) {
  const currentApp = DriveApp.getFileById(ScriptApp.getScriptId());
  return ContentService.createTextOutput(currentApp.getName());
}

/**
 * WebApi POST entry
 * 
 * See: https://developers.google.com/apps-script/guides/web
 */
function doPost(e) {
  if (e && e.postData && e.postData.contents) {
    Habitica.pushWebHookContentQueueProperty(e.postData.contents);
    Habitica.executeAsTriggerAsap(evaluateWebHookContentQueue.name);
  }
}

function evaluateWebHookContentQueue() {
  Habitica.deleteTriggerByFunction(evaluateWebHookContentQueue.name);

  const webHookContents = Habitica.popAllWebHookContentQueueProperties();
  if (webHookContents && Array.isArray(webHookContents)) {
    console.log(`${arguments.callee.name}: ${webHookContents.length} object(s) in the queue`);
    for (let i = 0; i < webHookContents.length; i++) {
      const pojo = webHookContents[i];
      if (pojo && pojo.data && pojo.data.webhookType) {
        const data = pojo.data;
        console.log(`${arguments.callee.name}: #${i} webhookType: ${data.webhookType}`);
        if (data.webhookType === 'groupChatReceived') {
          if (data.chat) {
            let log = '';
            if (data.chat.info && data.chat.info.type) {
              log += `System: ${JSON.stringify(data.chat.info)}\n`;
            } else {
              log += `User: ${data.chat.user}(@${data.chat.username})\n`;
            }
            log += `Message: ${data.chat.text}`;
            console.log(log);
            checkMessageForCommands(data.chat);
            checkMessageForBossDamage(data.chat);
          }
        } else if (data.webhookType === 'questActivity') {
          setLastKnownQuestStatus(data, pojo.timestamp);
          updatePartyStatusQuestLogSheet();
          if (data.type === 'questStarted') {
            if (PARTY_QUEST_STATUS_SEND_AFTER_QUEST_STARTED) {
              checkAndSendPartyQuestStatus('started quest');
            }
          } else if (data.type === 'questFinished') {
          }
        } else {
          const json = JSON.stringify(data);
          console.log(json);
          MailApp.sendEmail(Session.getEffectiveUser().getEmail(), `${DriveApp.getFileById(ScriptApp.getScriptId()).getName()} - WebHook Type: ${data.webhookType}`,
           `${json}`);
        }
      }
    }
  } else {
    console.error(`${arguments.callee.name}: WebHook Content Queue doesn't exist`);
  }
}