const webPush = require('web-push');

const vapidKeys = {
  publicKey: 'BPxHa6Obs0YA_buOQPCK2VRp1X8s2qDJcLu672e99W6XWRD56TX--2mn-OMoLzIAB8nQvRq-FjAOk1-H4lgs2bA',
  privateKey: 'XpYrStm8pG9_EdITS1waKv-bnOrJk5EVYbEXpFto-64'
};

webPush.setVapidDetails(
  'mailto:your-email@example.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

module.exports = webPush;
