const express = require('express');
const app = express();
//const http = require('http');
const https = require("https");
const fs = require("fs");
const cors = require('cors');
const { Server } = require('socket.io');

const api = require("./api");
const env = require("./config/env");

//socket
const Init = require('./socket_io/onInit');

//db
const db = require('./config/db');
const Place = require('./models/Place');
const Placement = require('./models/Placement');
const Building = require('./models/Building');
const Account = require('./models/Account');
const Notification = require('./models/Notification');
const PrivateMessage = require('./models/PrivateMessage');
const OfferList = require('./models/OfferList');

const fileUpload = require('express-fileupload');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const _ = require('lodash');
const path = require("path");

// enable files upload
app.use(fileUpload({
  createParentPath: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(cors());
app.use("/api", api);
app.use(express.static(path.resolve('uploads')));

app.use('/images', express.static('uploads'));

// DB connect
db.mongoose
  .connect(db.url, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log("Connected to the database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });


//const server = http.createServer(app);

const httpsPort = 3300;
const privateKey = fs.readFileSync("/etc/letsencrypt/live/pengupals.tech/privkey.pem");
const certificate = fs.readFileSync("/etc/letsencrypt/live/pengupals.tech/fullchain.pem");

const credentials = {
  key: privateKey,
  cert: certificate,
}

const server = https.createServer(credentials, app);

const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

// Add this
// Listen for when the client connects via socket.io-client
io.on("connection", async (socket) => {
  console.log("a user connected: ", socket.id);

  /**
   * db init
   */
  Init.onInit(io, socket);

  // Invite friend
  socket.on("inviteToFriend", async (fromId, toId, toPlayerId) => {
    let fromIdInfo = await Account.findOne({ accountId: fromId });

    if (fromIdInfo) {
      let playerInfo = {
        accountId: fromId,
        playerId: fromIdInfo.playerId,
        playerLvl: fromIdInfo.level,
        lvlProcess: (fromIdInfo.currentLevelScore / fromIdInfo.targetLevelScore) * 100,
        friendFlag: false,
        aliveFlag: true,
        avatarUrl: fromIdInfo.avatarUrl,
        degenlandNftCount: fromIdInfo.degenlandCount,
        tycoonNftCount: fromIdInfo.tycoonCount,
        mogulNftCount: fromIdInfo.mogulCount,
        investorNftCount: fromIdInfo.investorCount
      };

      let InviteInfo = new Notification({
        accountId: toId,
        playerId: toPlayerId,
        alertType: 'invite friend',
        playerInfo: playerInfo,
      });
      await InviteInfo.save();

      //      socket.broadcast.emit('inviteSuccess', InviteInfo, InviteInfo._id);
      let toIdInfo = await Account.findOne({ accountId: toId });
      io.to(toIdInfo.socketId).emit('inviteSuccess', InviteInfo, InviteInfo._id);
    }
  });

  //Accept invitation
  socket.on("setAccept", async (id1, id2) => {
    const toAccountId = id1;
    const fromAccountId = id2;

    await Notification.updateMany(
      { alertType: 'invite friend', accountId: toAccountId, 'playerInfo.accountId': fromAccountId, state: 'unread' },
      { state: 'accepted' }
    );

    socket.emit("clearAcceptedNotification", toAccountId);

    let fromIdInfo = await Account.findOne({ accountId: fromAccountId });
    io.to(fromIdInfo.socketId).emit("alertAccepted", fromAccountId);
  });

  //Decline invitation
  socket.on("setDecline", async (id1, id2) => {
    const toAccountId = id1;
    const fromAccountId = id2;

    await Notification.updateMany(
      { alertType: 'invite friend', accountId: toAccountId, 'playerInfo.accountId': fromAccountId, state: 'unread' },
      { state: 'declined' }
    );

    socket.emit("clearDeclinedNotification", toAccountId);

    let fromIdInfo = await Account.findOne({ accountId: fromAccountId });
    io.to(fromIdInfo.socketId).emit("alertDeclined", fromAccountId);
  });

  //Send private message
  socket.on("sendPrivateMsg", async (fromId, toId, toPlayerId, val) => {
    let fromIdInfo = await Account.findOne({ accountId: fromId });

    if (fromIdInfo) {
      let playerInfo = {
        accountId: fromId,
        playerId: fromIdInfo.playerId,
        playerLvl: fromIdInfo.level,
        lvlProcess: (fromIdInfo.currentLevelScore / fromIdInfo.targetLevelScore) * 100,
        friendFlag: false,
        aliveFlag: true,
        avatarUrl: fromIdInfo.avatarUrl,
        degenlandNftCount: fromIdInfo.degenlandCount,
        tycoonNftCount: fromIdInfo.tycoonCount,
        mogulNftCount: fromIdInfo.mogulCount,
        investorNftCount: fromIdInfo.investorCount
      };

      let _newNotification = new Notification({
        accountId: toId,
        playerId: toPlayerId,
        alertType: 'private message',
        playerInfo: playerInfo,
      });
      await _newNotification.save();

      let _newMessage = new PrivateMessage({
        senderAccountId: fromId,
        receiverAccountId: toId,
        chatContent: val
      })
      await _newMessage.save();

      let toIdInfo = await Account.findOne({ accountId: toId });
      io.to(toIdInfo.socketId).emit('receivePrivateMsg', _newNotification, val);
    }
  });

  //Send nft swap offer
  socket.on("sendOffer", async (provider, receiver, offerInfo) => {
    /** Save offer in db */
    let providerToken = {
      hbar: offerInfo.myHbar,
      pal: offerInfo.myPal
    };

    let providerNfts = [];

    if (offerInfo.myNftInfo.length > 0) {
      offerInfo.myNftInfo.map((item, index) => {
        if (item.tokenId != env.getDegenlandNftId && item.tokenId != env.getTycoonNftId && item.tokenId != env.getMogulNftId && item.tokenId != env.getInvestorNftId) {
          let nft = {
            tokenId: item.tokenId,
            serialNum: item.serialNum,
            fallbackFee: item.fallback,
            nft_type: 'NormalNft',
            imgUrl: item.imgUrl,
            creator: item.creator,
            name: item.name,
            buildingCount: item.buildingCount,
            score: item.score,
            totalVisitor: item.totalVisitor
          };
          providerNfts.push(nft);
        }
        else
          providerNfts.push(item);
      });
    }

    let receiverToken = {
      hbar: offerInfo.friendHbar,
      pal: offerInfo.friendPal
    };

    let receiverNfts = [];

    offerInfo.friendNftInfo.map((item, index) => {
      if (item.tokenId != env.getDegenlandNftId && item.tokenId != env.getTycoonNftId && item.tokenId != env.getMogulNftId && item.tokenId != env.getInvestorNftId) {
        let nft = {
          tokenId: item.tokenId,
          serialNum: item.serialNum,
          fallbackFee: item.fallback,
          nft_type: 'NormalNft',
          imgUrl: item.imgUrl,
          creator: item.creator,
          name: item.name,
          buildingCount: item.buildingCount,
          score: item.score,
          totalVisitor: item.totalVisitor
        };
        receiverNfts.push(nft);
      }
      else
        receiverNfts.push(item);
    });

    let providerInfo = {
      accountId: provider.accountId,
      playerId: provider.playerId,
      avatarUrl: provider.avatarUrl,
      connectState: provider.connectState,
      level: provider.level,
      currentLevelScore: provider.currentLevelScore,
      targetLevelScore: provider.targetLevelScore
    };

    let receiverInfo = {
      accountId: receiver.accountId,
      playerId: receiver.playerId,
      avatarUrl: receiver.avatarUrl,
      connectState: receiver.connectState,
      level: receiver.level,
      currentLevelScore: receiver.currentLevelScore,
      targetLevelScore: receiver.targetLevelScore
    };

    let newOffer = new OfferList({
      providerInfo: providerInfo,
      providerToken: providerToken,
      providerNfts: providerNfts,
      receiverInfo: receiverInfo,
      receiverToken: receiverToken,
      receiverNfts: receiverNfts
    });
    await newOffer.save();

    /** Create notification */
    let playerInfo = {
      accountId: provider.accountId,
      playerId: provider.playerId
    };

    let newNotification = new Notification({
      accountId: receiver.accountId,
      playerId: receiver.playerId,
      alertType: 'nft swap offer',
      alertId: newOffer._id,
      playerInfo: playerInfo,
    });
    await newNotification.save();

    socket.emit('createdOffer', newOffer._id);
    io.to(receiver.socketId).emit('successSendOffer', newOffer);
  });

  /**
   * Accept offer
   */
  socket.on("setAcceptOffer", async (offerInfo) => {
    const receiverInfo = offerInfo.receiverInfo;
    const providerInfo = offerInfo.providerInfo;

    await Notification.findOneAndUpdate(
      { alertId: offerInfo._id },
      { state: 'accepted' },
      { new: true }
    );

    socket.emit("successAcceptOffer", receiverInfo.accountId);

    let fromIdInfo = await Account.findOne({ accountId: providerInfo.accountId });
    io.to(fromIdInfo.socketId).emit("alertOfferAccepted", providerInfo.accountId);
  });

  //Offer Decline
  socket.on("setOfferDecline", async (offerInfo) => {
    const receiverInfo = offerInfo.receiverInfo;
    const receiverToken = offerInfo.receiverToken;
    const providerInfo = offerInfo.providerInfo;
    const providerToken = offerInfo.providerToken;

    await Notification.findOneAndUpdate(
      { alertId: offerInfo._id },
      { state: 'declined' },
      { new: true }
    );

    const a = await Notification.findOneAndUpdate(
      { alertId: offer._id, state: 'unread' },
      { state: 'declined' },
      { new: true }
    );

    socket.emit("successDeclineOffer", receiverInfo.accountId);

    let fromIdInfo = await Account.findOne({ accountId: providerInfo.accountId });
    io.to(fromIdInfo.socketId).emit("alertOfferDeclined", providerInfo.accountId);
  });

  //--------------------------------------------------------
  // Phaser
  socket.on("map", async (accountId) => {
    await Account.findOneAndUpdate(
      { accountId: accountId },
      {
        socketId: socket.id
      },
      { new: true }
    );
  });

  socket.on("join", async (mode, address, targetPos, x, y, n, m, accountId) => {
    // view mode
    if (mode == 'view') {
      let player = await Account.findOneAndUpdate(
        { accountId: accountId },
        {
          address: address,
          targetPos: targetPos,
          x: x,
          y: y,
          n: n,
          m: m,
          connectState: true,
          socketId: socket.id
        },
        { new: true }
      );

      // Calculate score
      let place = await Place.findOne({ address: address, pos: targetPos });
      await Place.findOneAndUpdate(
        { address: place.address, pos: place.pos },
        {
          score: place.score + 10,
          totalVisitor: ++place.totalVisitor,
          currentVisitor: ++place.currentVisitor
        },
        { new: true }
      );

      // Get players in the same address
      let players = await Account.find({ address: address });

      let buildingList = await Placement.find({ address: address, built: true });
      socket.join(address);
      socket.emit("mapInit", player, buildingList);
      socket.emit("currentPlayers", players);
      socket.broadcast.to(address).emit("newPlayer", player);
    }
    else if (mode == 'construction') {
      // construction mode
      let buildingList = await Placement.find({ address: address, built: true });
      socket.join(address);
      /*
            socket.join(address);
            socket.broadcast.to(address).emit("updateMap", buildingList);
      */
      socket.emit("mapInit", buildingList);
    }
  });

  // Get building Info
  socket.on('getBuildingInfo', async () => {
    let buildingInfo = await Building.find({});
    socket.emit("setBuildingInfo", buildingInfo);
  });

  socket.on("chating", async (chatContent, playerId, address) => {
    socket.broadcast.to(address).emit("chating", chatContent, playerId);
  });

  socket.on("emojing", async (emoji, playerId, address) => {
    socket.broadcast.to(address).emit("emojing", emoji, playerId);
  });

  socket.on("playerMovement", async (target, accountId, address) => {
    let player = await Account.findOne({ accountId: accountId });

    var tilem = target.tilem;
    var tilen = target.tilen;
    // emit a message to all players about the player that moved
    socket.broadcast.to(address).emit("playerMoved", player, tilem, tilen);
  });

  socket.on("playerPosition", async (posInfo, n, m, accountId) => {
    console.log(n, m, accountId);
    let player = await Account.findOneAndUpdate(
      { accountId: accountId },
      {
        x: posInfo.x,
        y: posInfo.y,
        n: n,
        m: m
      },
      { new: true }
    );
  });

  socket.on("setRoad", async (building) => {
    // Get building info
    let buildingInfo = await Building.findOne({ index: building.type });

    let newBuilding = new Placement({
      address: building.address,
      pos: building.pos,
      sno: building.sno,
      type: building.type,
      buildingType: buildingInfo.type,
      built: building.built,
      ads: building.ads,
      owner: building.owner
    });
    // Save user to DB
    await newBuilding.save();

    // Increase the score of the place
    let place = await Place.findOne({ address: building.address, pos: building.pos });
    await Place.findOneAndUpdate(
      { address: place.address, pos: place.pos },
      {
        buildingCount: place.buildingCount + 1,
        score: place.score + 1
      },
      { new: true }
    );

    socket.emit("updateInfo");
    //    socket.broadcast.to(building.address).emit("changeMap", newBuilding);
  });

  socket.on("setBuilding", async (building) => {
    // Get building info
    let buildingInfo = await Building.findOne({ index: building.type });

    let newBuilding = new Placement({
      address: building.address,
      pos: building.pos,
      sno: building.sno,
      type: building.type,
      buildingType: buildingInfo.type,
      built: building.built,
      remaintime: buildingInfo.buildtime,
      ads: building.ads,
      linkurl: '',
      owner: building.owner
    });
    // Save user to DB
    await newBuilding.save();

    //    socket.broadcast.to(building.address).emit("changeMap", newBuilding);

    let count = buildingInfo.buildtime + 1;
    let interval = setInterval(async () => {
      count--;

      let build = await Placement.findOne({ address: building.address, sno: building.sno, type: building.type });
      if (build) {
        build = await Placement.findOneAndUpdate(
          { address: building.address, sno: building.sno, type: building.type },
          { remaintime: count - 1 },
          { new: true }
        );
        socket.emit("buildingTime", build);
      }

      /**
       * building completion
       */
      if (count == 1) {
        // Increase the score of the place
        let place = await Place.findOne({ address: building.address, pos: building.pos });
        await Place.findOneAndUpdate(
          { address: place.address, pos: place.pos },
          {
            buildingCount: place.buildingCount + 1,
            score: place.score + buildingInfo.score
          },
          { new: true }
        );

        let build = await Placement.findOne({ address: building.address, sno: building.sno, type: building.type });
        if (build) {
          build = await Placement.findOneAndUpdate(
            { address: building.address, sno: building.sno, type: building.type },
            { built: true },
            { new: true }
          );
        }
        //        io.emit("buildingCompletion", build);
        //        io.to(building.address).emit("buildingCompletion", build);
        socket.emit("buildingCompletion", build);
        socket.emit("updateInfo");
        clearInterval(interval);
      }
    }, 1000);
  });

  /**
   * In Construction
   */
  socket.on("inConstruction", async (building) => {
    let count = building.remaintime + 1;
    let interval = setInterval(async () => {
      count--;

      let build = await Placement.findOne({ address: building.address, sno: building.sno, type: building.type });
      if (build) {
        build = await Placement.findOneAndUpdate(
          { address: building.address, sno: building.sno, type: building.type },
          { remaintime: count - 1 },
          { new: true }
        );
        socket.emit("in-buildingTime", build);
      }

      /**
       * building completion
       */
      if (count == 1) {
        clearInterval(interval);
        //        io.emit("in-buildingCompletion", building);
        socket.emit("updateInfo");
        io.to(building.address).emit("in-buildingCompletion", building);
        let build = await Placement.findOne({ address: building.address, sno: building.sno, type: building.type });
        if (build) {
          build = await Placement.findOneAndUpdate(
            { address: building.address, sno: building.sno, type: building.type },
            { built: true },
            { new: true }
          );
        }
      }
    }, 1000);
  });

  socket.on("building_destroy", async (sno, address) => {
    const building = await Placement.findOneAndRemove({ sno: sno, address: address });

    // Get building info
    let buildingInfo = await Building.findOne({ index: building.type });

    // Decrease the score of the place
    let place = await Place.findOne({ address: building.address, pos: building.pos });
    await Place.findOneAndUpdate(
      { address: place.address, pos: place.pos },
      {
        buildingCount: place.buildingCount - 1,
        score: place.score - buildingInfo.score
      },
      { new: true }
    );

    socket.emit("updateInfo");
    //    socket.broadcast.to(address).emit("building_destroy", sno);
  });

  socket.on("setLink", async (sno, address, url) => {
    await Placement.findOneAndUpdate(
      { sno: sno, address: address },
      { linkurl: url },
      { new: true }
    );
  });

  socket.on("disconnect", async () => {
    if (socket.id != null) {
      let player = await Account.findOneAndUpdate(
        { socketId: socket.id },
        {
          address: '',
          targetPos: '',
          x: 0,
          y: 0,
          n: 0,
          m: 0,
          socketId: '',
          connectState: false
        }
      );

      if (player != null) {
        console.log("user disconnected: ", player.accountId);
        // decrease current visitor
        let place = await Place.findOne({ address: player.address, pos: player.targetPos });

        place = await Place.findOneAndUpdate(
          { address: player.address, pos: player.targetPos },
          { currentVisitor: place.currentVisitor - 1 },
          { new: true }
        );
        socket.broadcast.to(player.address).emit("disconnected", player);
      }
    }
    socket.disconnect();
  });
});

//server.listen(3306, () => 'Server is running on port 3306');
server.listen(httpsPort, () => {
  console.log(`[pengupals.tech] servier is running at port ${httpsPort} as https.`);
});