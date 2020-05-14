const { Client, MessageEmbed } = require('discord.js');
const axios = require('axios');
const fs = require('fs');

const DEFAULT_LANG = 'EN';
const AUTH_FILE = './auth.json';

let auth_key = '';    // DeepL authorization key
let token = '';       // Discord bot token

const client = new Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {

  if (message.author.bot) return;
  if (!message.channel.topic) return;
  const translationConfig = message.channel.topic.trim().match(/deepl-translate\((.+)\)/);
  if (!translationConfig) return;

  const target_lang = translationConfig[1];
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
    .setAuthor(message.author.username, message.author.avatarURL())
    .setColor(0xff0000)
    .setDescription(
      translations.map(t => {
        let text = '`' + t.lang + ':` ' + t.translations[0].text;
        if (t.translations.length > 1) {
          text += ' (';
          text += t.translations.slice(1).map(others =>
            (others.detected_source_language + ': ' + others.text ))
            .join(', ');
          text += ')';
        }
        return text;
      })
      .join('\n'));
  message.channel.send(embed);
}

if (process.env.TOKEN && process.env.AUTH_KEY) {
  console.log('auth: using environment variables.');
  token = process.env.TOKEN;
  auth_key = process.env.AUTH_KEY;
} else if (fs.existsSync(AUTH_FILE)) {
  console.log('auth: using auth file.');
  var auth = require(AUTH_FILE);
  token = auth.token;
  auth_key = auth.auth_key;
} else {
  console.log('auth: not found.');
  process.exit(1);
}

if (process.env.KEEP_ALIVE_ENDPOINT) {
  require('./heartbeat');
}

client.login(token);