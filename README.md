# Igromanru's Habitica Automation - Scripts framework

## Dependencies
-  [Igromanru's Habitica Library](https://script.google.com/d/1zUBDNbi5fncQ3-mdKNE6SWucktAZhzvIy9Nho68xGWx317qwSx3E_L_v/edit?usp=sharing)


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
The current version is based around scheduled executions.  
1. Navigate into the Main.gs
2. In the drop down near the "Debug" button, select the  "installTriggers" function
3. Press "Run" and let the function install all the triggers
