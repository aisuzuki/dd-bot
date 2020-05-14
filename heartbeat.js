const express = require('express');
const app = express();

app.get('/heartbeat', (req, res) => res.send('alive'))

app.listen(process.env.PORT, () => console.log('/heartbeat is listening.'))