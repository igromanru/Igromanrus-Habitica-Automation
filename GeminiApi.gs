const GeminiApiKey = ScriptProperties.getProperty('GEMINI_API_KEY');
const GaminiProjectId = ScriptProperties.getProperty('GEMINI_PROJECT_ID');

const GeminiRegion = 'us-central1';
const GeminiModelid = 'gemini-pro';
// const GeminiTemperature = 0.5;

const GeminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GeminiModelid}:generateContent?key=${GeminiApiKey}`;

function testGenerateContent() {
  console.info(generateContent(`Write a motivation quote`));
}

function generateContent(prompt) {
  const requestBody = {
    "contents": [{
        "parts":[ { "text": prompt } ]
    }]
  };

  const params = {
    'method': 'post',
    'muteHttpExceptions': true,
    'contentType': 'application/json',
    'payload': JSON.stringify(requestBody)
  };

  const response = UrlFetchApp.fetch(GeminiUrl, params);
  const responseCode = response.getResponseCode();
  console.log(`generateContent: ResponseCode: ${responseCode}`);
  console.log(`generateContent: ContentText: ${response.getContentText()}`);
  if (responseCode == 200) {
    const pojo = JSON.parse(response.getContentText());
    if (pojo && pojo.candidates && Array.isArray(pojo.candidates)) {
      if (pojo.candidates[0] && pojo.candidates[0].content && Array.isArray(pojo.candidates[0].content.parts)) {
        let text = '';
        for (const part of pojo.candidates[0].content.parts) {
          text += part.text + '  \n';
        }
        return text;
      }
    }
  } else {
    return response.getContentText();
  }
  return undefined;
}