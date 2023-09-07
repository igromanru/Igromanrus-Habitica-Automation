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
  
    if (ENABLE_COMMANDS_SYSTEM_WEBHOOK) {
      const partyId = getPartyIdProperty();
      if (partyId) {
        const options = {
          groupId: partyId
        };
        createWebHook(WebAppUrl, COMMANDS_SYSTEM_WEBHOOK_NAME, 'groupChatReceived', options);
      } else {
        console.error(`Can't create Commands System WebHook, the PARTY_ID property isn't yet set!`);
      }
    }
    if (ENABLE_QUEST_ACTIVITY_WEBHOOK) {
      const options = {
        questStarted: true,
        questFinished: true,
        questInvited: true
      };
      createWebHook(WebAppUrl, QUEST_ACTIVITY_WEBHOOK_NAME, 'questActivity', options);
    }
  }
  
  function deleteWebhooks() {
    console.log("Deleting WebHooks...");
  
    const webHooks = getWebHooks();
    if (webHooks && webHooks.length > 0) {
      for (const webHook of webHooks) {
        if (webHook && webHook.id) {
          switch (webHook.label) {
            case COMMANDS_SYSTEM_WEBHOOK_NAME:
            case QUEST_ACTIVITY_WEBHOOK_NAME:
              console.log(`Deleting WebHook: ${webHook.label}`);
              deleteWebHook(webHook.id);
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
    var data = JSON.stringify(e.postData);
    return ContentService.createTextOutput(data).setMimeType(ContentService.MimeType.JSON);
  }
  
  /**
   * WebApi POST entry
   * 
   * See: https://developers.google.com/apps-script/guides/web
   */
  function doPost(e) {
    addRandomWebHookContentProperty(e.postData.contents);
  
    const triggers = ScriptApp.getProjectTriggers();
    let triggerExists = false;
    for (const trigger of triggers) {
      if (trigger.getHandlerFunction() === evaluateWebHookContentProperties.name) {
        triggerExists = true;
        break;
      }
    }
    if (!triggerExists) {
      ScriptApp.newTrigger(evaluateWebHookContentProperties.name)
        .timeBased()
        .after(1)
        .create();
    }
  }
  
  function evaluateWebHookContentProperties() {
    ScriptApp.getProjectTriggers().forEach(trigger => {
      if (trigger.getHandlerFunction() === evaluateWebHookContentProperties.name) {
        ScriptApp.deleteTrigger(trigger);
      }
    });
  
    const webHookContents = popAllRandomWebHookContentProperties();
    if (webHookContents && webHookContents instanceof Array) {
      console.log(`${arguments.callee.name}: ${webHookContents.length} object(s) in the stack`);
      for (let i = 0; i < webHookContents.length; i++) {
        const pojo = webHookContents[i];
        if (pojo && pojo.webhookType) {
          console.log(`${arguments.callee.name}: #${i} webhookType: ${pojo.webhookType}`);
          if (pojo.webhookType === 'groupChatReceived') {
            if (pojo.chat) {
              console.log(`Chat text: ${pojo.chat.text}`);
              evaluateMessage(pojo.chat);
            }
          } else if (pojo.webhookType === 'questActivity') {
            setLastKnownQuestStatus(pojo.type);
          } else {
            const json = JSON.stringify(pojo);
            console.log(json);
            MailApp.sendEmail(Session.getEffectiveUser().getEmail(), `${DriveApp.getFileById(ScriptApp.getScriptId()).getName()} - WebHook Type: ${pojo.webhookType}`,
             `${json}`);
          }
        }
      }
    } else {
      console.error(`${arguments.callee.name}: WebHook Content Stack doesn't exist`);
    }
  }
  
  function addRandomWebHookContentProperty(content) {
    if (typeof content == 'string' && content) {
      ScriptProperties.setProperty("RANDOM_WEBHOOK_CONTENT_" + Utilities.getUuid(), content);
    }
  }
  
  function popAllRandomWebHookContentProperties() {
    let webHookContents = [];
    if (ScriptLock.tryLock(DefaultLockTime)) {
      const properties = ScriptProperties.getProperties();
      for (const [key, value] of Object.entries(properties)) {
        if (key.startsWith("RANDOM_WEBHOOK_CONTENT_")) {
          webHookContents.push(JSON.parse(value));
          ScriptProperties.deleteProperty(key);
        }
      }
      ScriptLock.releaseLock();
    } else {
      console.error(`popAllRandomWebHookContentProperties: Failed to acquire the lock for ${DefaultLockTime}ms`);
    }
    return webHookContents;
  }