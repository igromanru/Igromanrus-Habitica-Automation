/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const QUEST_PROGRESS_COMMAND = 'quest';

function scheduledCommandsCheck() {
  if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skipping, last script execution was too recent");
    return;
  }

  const partyId = getPartyIdProperty();
  if (!partyId) {
    console.log("scheduledCommandsCheck: Skipping, the PARTY_ID property is not set");
    return;
  }

  const lastCheckTime = getLastCommandCheckDateTime();
  const chatArray = getGroupChat(partyId);
  if (chatArray instanceof Array && chatArray) {
    console.log(`scheduledCommandsCheck: Found ${chatArray.length} chat messages for the party ${partyId}`);
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
    console.log(`scheduledCommandsCheck Error: No chat messages found for the Party with id: ${partyId}`);
  }

  setLastCommandCheckDateTime();
}

function evaluateMessage(chatMessage) {
  if (chatMessage && chatMessage.trim().startsWith("!")) {
    var commandRegEx = /\!(.*?)(?:$|\s)/g;
    var matches = commandRegEx.exec(chatMessage);
    if (matches && matches.length > 1) {
      // first group match
      const command = matches[1];
      console.log(`evaluateMessage: Found command "${command}"`);
      switch (command) {
        case QUEST_PROGRESS_COMMAND:
          console.log(`evaluateMessage: Executing command "${command}"`);
          scheduleCheckAndSendPartyQuestProgress();
          break;
      }
    }
  }
}