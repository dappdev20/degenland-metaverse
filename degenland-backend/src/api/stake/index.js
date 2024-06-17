const express = require('express');
const router = express.Router();
const stake = require("./controller");

router.get('/load_staked_nfts', stake.loadStakedNfts);
router.get('/get_listed_nfts', stake.getListedNfts);

router.post('/stake_new_nfts', stake.stakeNewNfts);
router.post('/claim_request', stake.claimRequest);
router.post('/approve_swap_offer', stake.approveSwapOffer);
router.post('/delete_collection', stake.deleteCollection);

module.exports = router;
