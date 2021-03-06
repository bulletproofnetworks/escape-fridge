const express = require('express');

const api = require('../api/leaderboard');

const router = express.Router();

router.get('/', (req, res /* , next */) => {
  const { email } = req.cookies;

  if (!email) {
    res.render('error', { message: 'User not logged in', error: {} });
    return;
  }

  req.app.locals.email = email;

  api.getLeaderboardByEmail(email)
    .then((leaderboard) => {
      console.error(leaderboard);
      res.render('challenge', { leaderboard });
    });
});

module.exports = router;
