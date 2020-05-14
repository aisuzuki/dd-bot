# DeepL - Discord auto chat translator

Game players must not be separated because of language barriers.

## Usage

Deploy this app anywhere. 


### Set secret data
There's two way to set secret data:

1. Set environment variables.
```
export TOKEN='your token of discord bot'
export AUTH_KEY='authorization key of your DeepL API'
```

2. Set variables in JSON file.

Create a JSON file that contains access tokens: 

```
{
  "token": "your token of discord bot",
  "auth_key" : "authorization key of your DeepL API"
}
```

Install your bot into your discord server, and launch the app.

## Target language configuration

Add this line in topic of channel that you want to translate messages.

```
deepl-translate(JA)
```

Replace *JA* to preferred language.
