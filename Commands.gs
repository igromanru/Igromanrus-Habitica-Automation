/**
 * Author: Igromanru
 * Source: https://github.com/igromanru/Igromanrus-Habitica-Automation
 */

const COMMANDS_PREFIX = '!';

const HELP_COMMAND = 'help';
const QUEST_PROGRESS_COMMAND = 'quest';
const CAT_COMMAND = 'cat';
const MEMBERS_COMMAND = 'members';
const INACTIVE_COMMAND = 'inactive';
const FACTS_COMMAND = 'facts';
const PROMPT_COMMAND = 'prompt';

const CatApiKey = ScriptProperties.getProperty('CAT_API_KEY');
const ApiNinjasKey = ScriptProperties.getProperty('API_NINJAS_KEY');

function scheduledCommandsCheck() {
  if (!ENABLE_COMMANDS) {
    return;
  }
  /* if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skipping, last script execution was too recent");
    return;
  }*/

  const lastCheckTime = getLastCommandCheckDateTime();
  const chatArray = Habitica.getPartyChat();
  if (Array.isArray(chatArray) && chatArray) {
    console.log(`scheduledCommandsCheck: Found ${chatArray.length} chat messages for the party`);
    let newMessageCount = 0;
    for (const chat of chatArray) {
      const chatTimestamp = new Date(chat.timestamp);
      // Evaluate only messages that were send after the last check
      if (chatTimestamp > lastCheckTime) {
        checkMessageForCommands(chat);
        newMessageCount++;
      }
    }
    console.log(`scheduledCommandsCheck: New user messages since last command check: ${newMessageCount}`);
  } else {
    console.log(`scheduledCommandsCheck Error: No chat messages found for the Party`);
  }

  setLastCommandCheckDateTime();
}

function checkMessageForCommands(chat) {
  // Filter for user messages
  if (ENABLE_COMMANDS && chat && (!chat.info || chat.type === undefined)) {
    if (typeof chat.text === 'string' && chat.text.trim().startsWith(COMMANDS_PREFIX)) {
      var matches = /^\!(.*?)(?:$|\s)(.*)/g.exec(chat.text.toLowerCase());
      if (matches && matches.length > 1) {
        const userName = chat.user;
        const command = matches[1];
        let params = '';
        if (matches.length > 2) {
          params = matches[2].trim();
        }
        console.log(`${arguments.callee.name}: Found command "${command}"`);
        switch (command) {
          case HELP_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            helpCommand();
            break;
          case QUEST_PROGRESS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            checkAndSendPartyQuestStatus(userName);
            break;
          case CAT_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            catCommand(userName);
            break;
          case FACTS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            factsCommand(userName);
            break;
          case MEMBERS_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            sendPartyMembersInfomation(userName);
            break;
          case INACTIVE_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            sendInactivePartyMembers(userName);
            break;
          case PROMPT_COMMAND:
            console.log(`${arguments.callee.name}: Executing command "${command}"`);
            promptCommand(params, userName);
            break;
        }
      }
    }
  }
}

function helpCommand() {
  if (!helpCommand.runOnce) {
    let message = `### ${SCRIPT_NAME} - Commands  \n`;
    message += 'The command system allows users to trigger some script functions by sending chat messages with specific commands.  \n';
    message += `It may take about a minute for the commands to be processed.  \n\n`;
    message += `\n`;

    message += `**Following commands are available:**  \n`;
    message += `- ${COMMANDS_PREFIX + HELP_COMMAND} : Shows this message  \n`;
    message += `- ${COMMANDS_PREFIX + QUEST_PROGRESS_COMMAND} : Shows current Party Quest Status  \n`;
    message += `- ${COMMANDS_PREFIX + MEMBERS_COMMAND} : Shows infomation about current party members  \n`;
    message += `- ${COMMANDS_PREFIX + INACTIVE_COMMAND} : Shows inactive members  \n`;
    message += `- ${COMMANDS_PREFIX + CAT_COMMAND} : Shows an image of a random cat from The Cat API  \n`;
    message += `- ${COMMANDS_PREFIX + FACTS_COMMAND} : Shows a random fan fact  \n`;

    message += `\n`;
    message += `**Emoji explanation:**  \n`;
    message += `🔝 = current level  \n`;
    message += `❤️ = full health  \n`;
    message += `💜 = damaged health  \n`;
    message += `🎯 = pending damage  \n`;
    message += `🔍 = collected items  \n`;
    message += `🕑 = Passed time since the last "first check-in of the day"  \n`;
    message += `😴 = Sleeping in the Tavern (damage paused)  \n`;
    message += `💀 = Character is about to die (health in minuse)  \n`;

    Habitica.sendMessageToParty(message);
    helpCommand.runOnce = true;
  }
}

function catCommand(triggeredBy = '') {
  if (!catCommand.runOnce) {
    const response = UrlFetchApp.fetch(`https://api.thecatapi.com/v1/images/search?size=med&mime_types=jpg,png`, {
      method: 'GET',
      headers: {
        'x-api-user': CatApiKey
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() == 200) {
      const cats = JSON.parse(response.getContentText());
      if (Array.isArray(cats) && cats.length > 0) {
        const cat = cats[0];
        if (cat) {
          if (triggeredBy) {
            triggeredBy = ` "Triggered by ${triggeredBy}"`;
          }
          let message = `![cat](${cat.url}${triggeredBy})  \n`;

          Habitica.sendMessageToParty(message);
          catCommand.runOnce = true;
        }
      }
    }
  }
}

function factsCommand(triggeredBy = '') {
  if (!factsCommand.runOnce) {
    const response = UrlFetchApp.fetch(`https://api.api-ninjas.com/v1/facts?limit=1`, {
      method: 'GET',
      headers: {
        'X-Api-Key': ApiNinjasKey
      },
      muteHttpExceptions: true
    });
    if (response.getResponseCode() == 200) {
      const facts = JSON.parse(response.getContentText());
      if (Array.isArray(facts) && facts.length > 0) {
        const fact = facts[0];
        if (fact) {
          let message = `Fan fact:  \n >${fact.fact}  \n`;
          if (typeof triggeredBy === 'string' && triggeredBy) {
            message += '\n`The command was triggered by ' + triggeredBy +'`  \n';
          }

          Habitica.sendMessageToParty(message);
          factsCommand.runOnce = true;
        }
      }
    }
  }
}

function promptCommand(prompt, triggeredBy = '') {
  if (typeof prompt === 'string' && prompt.trim() != '') {
    let message = '**Gemini Pro Response**  \n';
    message += generateContent(prompt);
    if (typeof triggeredBy === 'string' && triggeredBy) {
      message += '\n`The command was triggered by ' + triggeredBy +'`  \n';
    }
    Habitica.sendMessageToParty(message);
  }
}