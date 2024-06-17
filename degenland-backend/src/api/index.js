const express = require('express');
const router = express.Router();

const Account = require("./account");
const Placement = require("./placement");
const Nft = require("./nft");
const NFTSwapOffer = require('./nftSwapOffer');
const Place = require("./place");
const Notification = require("./notification");
const PrivateMessage = require("./message");
const Stake = require("./stake");

router.use("/account", Account);
router.use("/placement", Placement);
router.use("/nft", Nft);
router.use("/nftswapoffer", NFTSwapOffer);
router.use("/place", Place);
router.use("/notification", Notification);
router.use("/message", PrivateMessage);
router.use("/stake", Stake);

module.exports = router;
