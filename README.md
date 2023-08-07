# My Google Apps Script for Habitica automation

## Setup
To be able to use the script as it is, you have to add your User Id and API Key as Script Properties API_ID and API_KEY.  
Also you have to add a time based trigger.  

### Provide API login credentials
1. In your Google Apps Script project navigate into the "Project Settings" page
2. Scroll down to "Script Properties"
3. Press "Edit script properties"
4. Add two script properties names `API_ID` and `API_KEY`
   The value of API_ID is your User Id and the value of API_KEY is your API Key/Token.
5. Save script properties
![hourlySchedule trigger](/Resources/images/Script_Properties.png)

### Setup triggers
The current version is based around hourly execution of one function.  
1. Navigate into the "Triggers" page
2. Press "Add Trigger"
3. Under "Choose which function to run" select "hourlySchedule"  
   Under "Select type of time based trigger" choose "Hour timer"  
   Under "Select hour interval" select "Every hour"
![hourlySchedule trigger](/Resources/images/hourlySchedule_trigger.png)
1. Save 