const { Client, MessageEmbed } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const APPNAME = 'translator';
const DEFAULT_LANG = 'EN';
const AUTH_FILE = './auth.json';

let auth_key = '';    // DeepL authorization key
let token = '';       // Discord bot token

const client = new Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {

  if (!message.channel.topic) return;
  if (message.author.username===APPNAME) return;

  const target_lang = message.channel.topic.trim().match(/deepl-translate\((.+)\)/)[1];
  if (!target_lang) return;

  post(message.content, target_lang)
  .then(response => {

    // if source text's language was same as target language, text was translated into default language.
    if (response.data.translations.length === 1 &&
        response.data.translations[0].detected_source_language === target_lang) {
      post(message.content, DEFAULT_LANG)
      .then(retry => {
        send(message, [ { lang: DEFAULT_LANG, translations: retry.data.translations } ]);
      })
    
    // if souce text's language was neither target language nor default language
    // add default language translation.
    } else if (
      response.data.translations[0].detected_source_language !== target_lang
      &&
      response.data.translations[0].detected_source_language !== DEFAULT_LANG) {
      post(message.content, DEFAULT_LANG)
      .then(retry => {
        send(message,
          [
            {
              lang: target_lang,
              translations: response.data.translations
            },
            {
              lang: DEFAULT_LANG,
              translations: retry.data.translations
            }
          ]);
      })
    
    // text was translated into target language.
    } else {
      send(message, [ { lang: target_lang, translations: response.data.translations } ]);
    }
  })
});

const post = (message, lang) => {
  return axios.post('https://api.deepl.com/v2/translate?' +
    'auth_key=' + auth_key +'&' + 
    'text=' + encodeURIComponent(message) + '&' +
    'target_lang=' + lang)
}

const send = (message, translations) => {
  const embed = new MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setColor(0xff0000)
    .setDescription(
      translations.map(t => {
        let text = '`' + t.lang + ':` ' + t.translations[0].text;
        if (t.translations.length > 1) {
          text += ' (';
          text += t.translations.slice(1).map(others => ( others.detected_source_language + ': ' + others.text )).join(', ');
          text += ')';
        }
        return text;
      })
      .join('\n'));
  message.channel.send(embed);
}

if (process.env.TOKEN && process.env.AUTH_KEY) {
  token = process.env.TOKEN;
  auth_key = process.env.AUTH_KEY;
} else if (fs.existsSync(AUTH_FILE)) {
  var auth = require(AUTH_FILE);
  token = auth.token;
  auth_key = auth.auth_key;
} else {
  console.log('Error.');
}

client.login(token);