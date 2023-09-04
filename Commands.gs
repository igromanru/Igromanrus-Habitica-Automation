/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const COMMANDS_PREFIX = '!';
const COMMANDS_REGEX = /\!(.*?)(?:$|\s)/g;

const HELP_COMMAND = 'help';
const QUEST_PROGRESS_COMMAND = 'quest';
const CAT_COMMAND = 'cat';

function scheduledCommandsCheck() {
  /* if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skipping, last script execution was too recent");
    return;
  }*/

  const lastCheckTime = getLastCommandCheckDateTime();
  const chatArray = getPartyChat();
  if (chatArray instanceof Array && chatArray) {
    console.log(`scheduledCommandsCheck: Found ${chatArray.length} chat messages for the party`);
    let newMessageCount = 0;
    for (const chat of chatArray) {
      // Checking if it's an user message, skipping system messages, which have a type
      if (!chat.info || chat.info.type === undefined) {
        const chatTimestamp = new Date(chat.timestamp);
        // Evaluate only messages that were send after the last check
        if (chatTimestamp > lastCheckTime) {
          newMessageCount++;
          evaluateMessage(chat.text);
        }
      }
    }
    console.log(`scheduledCommandsCheck: New user messages since last command check: ${newMessageCount}`);
  } else {
    console.log(`scheduledCommandsCheck Error: No chat messages found for the Party`);
  }

  setLastCommandCheckDateTime();
}

function evaluateMessage(chatMessage) {
  if (chatMessage && chatMessage.trim().startsWith(COMMANDS_PREFIX)) {
    var matches = COMMANDS_REGEX.exec(chatMessage);
    if (matches && matches.length > 1) {
      // first group match
      const command = matches[1];
      console.log(`${arguments.callee.name}: Found command "${command}"`);
      switch (command) {
        case HELP_COMMAND:
          console.log(`${arguments.callee.name}: Executing command "${command}"`);
          helpCommand();
          break;
        case QUEST_PROGRESS_COMMAND:
          console.log(`${arguments.callee.name}: Executing command "${command}"`);
          checkAndSendPartyQuestProgress();
          break;
        case CAT_COMMAND:
          console.log(`${arguments.callee.name}: Executing command "${command}"`);
          catCommand();
          break;
      }
    }
  }
}

function helpCommand() {
  if (!helpCommand.runOnce) {
    let message = `### ${SCRIPT_NAME} - Commands  \n`;
    message += 'The command system allows users to trigger some script functions by sending chat messages with specific commands.  \n';
    // message += `Currently, the check takes place every ${TRIGGER_COMMANDS_CHECK_EACH_X_MINUTES} minutes, for new commands in chat.  \n\n`;

    message += `**Following commands are available:**  \n`;
    message += `- ${COMMANDS_PREFIX + HELP_COMMAND} : Prints this message  \n`;
    message += `- ${COMMANDS_PREFIX + QUEST_PROGRESS_COMMAND} : Prints current Party Quest Status  \n`;
    message += `- ${COMMANDS_PREFIX + CAT_COMMAND} : Prints an image of a random cat  \n`;

    sendMessageToParty(message);
    helpCommand.runOnce = true;
  }
}

function catCommand() {
  if (!catCommand.runOnce) {
    const response = UrlFetchApp.fetch(`https://api.thecatapi.com/v1/images/search?size=small&mime_types=jpg,png`, {
      'method': 'GET',
      'headers': {
        'x-api-user': ScriptProperties.getProperty('CAT_API_KEY')
      },
      'muteHttpExceptions': true
    });
    if (response.getResponseCode() == 200) {
      const cats = JSON.parse(response.getContentText());
      if (cats instanceof Array && cats.length > 0) {
        const cat = cats[0];
        if (cat) {
          let message = `![cat](${cat.url})`;

          sendMessageToParty(message);
          catCommand.runOnce = true;
        }
      }
    }
  }
}