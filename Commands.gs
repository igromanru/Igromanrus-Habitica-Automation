const QUEST_PROGRESS_COMMAND = 'quest';

function scheduledCommandsCheck() {
  if (!isLastExecutionOverAMinute()) {
    console.log("scheduledCommandsCheck: Skip, last script execution was too recent");
    return;
  }

  const party = getParty();
}