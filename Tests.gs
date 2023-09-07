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
  
  function testFetchLimit() {
    const user = getUser();
    const party = getParty();
    const members = getPartyMembers();
    if (members && members.length > 0) {
      console.log(`${members.length} members found`);
      for (let i = 0; i < members.length; i++) {
        console.log(`Getting member index: ${i}`);
        const member = getMemberById(members[i]._id);
        if (member) {
          console.log(`Member: ${member.profile.name}`);
        }
      }
    }
    const chats = getPartyChat();
    console.log(`Found ${chats.length} party chats`);
  }