const { Client, MessageEmbed } = require('discord.js');
const auth = require('./auth.json');
const franc = require('franc');
const axios = require('axios');

const APPNAME = 'translator';
const DEFAULT_LANG = 'EN';

const client = new Client();

client.once('ready', () => {
	console.log('Ready!');
});

client.on('message', message => {

  if (!message.channel.topic) return;
  if (message.author.username===APPNAME) return;

  const target_lang = message.channel.topic.trim().match(/deepl-translate\((.+)\)/)[1];
  if (!target_lang) return;

  axios.post('https://api.deepl.com/v2/translate?' +
    'auth_key=' + auth.auth_key +'&' + 
    'text=' + encodeURIComponent(message.content) + '&' +
    'target_lang=' + target_lang)
  .then(response => {
    if (response.data.translations.length === 1 &&
        response.data.translations[0].detected_source_language === target_lang) {
      axios.post('https://api.deepl.com/v2/translate?' +
        'auth_key=' + auth.auth_key +'&' + 
        'text=' + encodeURIComponent(message.content) + '&' +
        'target_lang=' + DEFAULT_LANG)
      .then(retry => {
        send(message, retry.data.translations);
      })
    } else {
      send(message, response.data.translations);
    }
  })
});

const send = (message, translations) => {
  const embed = new MessageEmbed()
    .setAuthor(message.author.username, message.author.displayAvatarURL())
    .setColor(0xff0000)
    // Set the main content of the embed
//    .setDescription(translations[0].detected_source_language + ': ' + translations[0].text + ' \n new line' );
    .setDescription(translations.map(t => (translations[0].text)).join('\n'));
    // Send the embed to the same channel as the message
  message.channel.send(embed);
}

// login to Discord with your app's token
client.login(auth.token);