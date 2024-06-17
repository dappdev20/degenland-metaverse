const Place = require('../../models/Place');
const Account = require('../../models/Account');

exports.decreaseVisitor = async (req, res) => {
  try {
    console.log(req.body.address, req.body.pos);
    if (!req.body.address || !req.body.pos) {
      res.send({
        status: false,
        message: 'failed'
      });
    } else {
      let place = await Place.findOne({ address: req.body.address, pos: req.body.pos });
      console.log(place.currentVisitor);

      place = await Place.findOneAndUpdate(
        { address: req.body.address, pos: req.body.pos },
        {
          currentVisitor: --place.currentVisitor
        },
        { new: true }
      );

      //send response
      res.send({
        status: true,
        message: 'Success',
      });
    }
  } catch (err) {
    res.status(500).send(err);
  }
}

exports.getcurrentVisitor = async (req, res) => {
  try {
    const address = req.query.address;
    const pos = req.query.pos;

    place = await Place.findOne({ address: address, pos: pos });

    //send response
    res.send({
      status: true,
      message: 'Success',
      data: place.currentVisitor
    });
  } catch (err) {
    res.status(500).send(err);
  }
}

exports.getPlaceInfo = async (req, res) => {
  try {
    const address = req.query.address;
    const targetPos = req.query.targetPos;
    const nftdata = JSON.parse(req.query.nftdata);

    let placeOwner = await Account.findOne({ accountId: nftdata.owner });

    let ownerInfo = {
      playerId: placeOwner.playerId,
      avatarUrl: placeOwner.avatarUrl,
      connectState: placeOwner.connectState,
      level: placeOwner.level,
      currentLevelScore: placeOwner.currentLevelScore,
      targetLevelScore: placeOwner.targetLevelScore,
      degenlandNftCount: placeOwner.degenlandCount,
      tycoonNftCount: placeOwner.tycoonCount,
      mogulNftCount: placeOwner.mogulCount,
      investorNftCount: placeOwner.investorCount
    }

    place = await Place.findOneAndUpdate(
      { token_id: nftdata.token_id, serialNumber: nftdata.serial_number },
      {
        address: address,
        pos: targetPos,
        ownerInfo: ownerInfo
      },
      { new: true }
    );

    //send response
    res.send({
      status: true,
      message: 'Success',
      data: place
    });
  } catch (err) {
    res.status(500).send(err);
  }
}

/** Get places info from nfts */
exports.getPlacesInfoFromNft = async (req, res) => {
  try {
    const nftInfo = JSON.parse(req.query.nftInfo);
    let placeInfo = [];
    await Promise.all(nftInfo.map(async (item, index) => {
      let place = await Place.findOne({ token_id: item.token_id, serialNumber: item.serial_number });

      if(place) {
        let newInfo = {
          token_id: place.token_id,
          serial_number: place.serialNumber,
          buildingCount: place.buildingCount,
          totalVisitor: place.totalVisitor,
          score: place.score
        };
        placeInfo.push(newInfo);
      }
      else {
        let newInfo = {
          token_id: "",
          serial_number: 0,
          buildingCount: 0,
          totalVisitor: 0,
          score: 0
        };
        placeInfo.push(newInfo);
      }
    }));

    //send response
    res.send({
      status: true,
      message: 'Success',
      data: placeInfo
    });
  } catch (err) {
    res.status(500).send(err);
  }
}

exports.updatePlaceInfo = async (req, res) => {
  try {
    const address = req.query.address;
    const targetPos = req.query.targetPos;

    place = await Place.findOne({ address: address, pos: targetPos });

    //send response
    res.send({
      status: true,
      message: 'Success',
      data: place
    });
  } catch (err) {
    res.status(500).send(err);
  }
}