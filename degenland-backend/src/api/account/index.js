const express = require('express');
const router = express.Router();
const account = require("./controller");

router.post('/create_new_player', account.createNewPlayer);
router.get('/get_player', account.getPlayerInfo);
router.get('/get_allplayer', account.getAllPlayerInfo);
router.get('/get_friendlist', account.getFriendList);
router.get('/calculate_level', account.calculateLevel);
router.get('/update_player_info', account.updatePlayerInfo);

router.post('/upload_avatar', account.uploadAvatar);
router.post('/set_friend', account.setFriend);
router.post('/set_nft_count', account.setNftCount);

module.exports = router;
