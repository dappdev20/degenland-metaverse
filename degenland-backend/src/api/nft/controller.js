const NftList = require('../../models/NftList');

exports.setNft = async (req, res) => {
  try {
    if (!req.body.accountId || !req.body.nftData) {
      res.send({
        status: false,
        message: 'failed'
      });
    } else {
      let nftData = req.body.nftData;
      let accountId = req.body.accountId;

      await NftList.updateMany({ owner: accountId }, { owner: null });

      for (let i = 0; i < nftData.length; i++) {
        let oldnftData = await NftList.findOne({ name: nftData[i].name, serial_number: nftData[i].serial_number });
        if (oldnftData.owner != nftData[i].owner) {
          let newnftData = await NftList.findOneAndUpdate(
            { name: nftData[i].name, serial_number: nftData[i].serial_number },
            {
              token_id: nftData[i].token_id,
              owner: nftData[i].owner
            },
            { new: true }
          );
        }
      }
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

exports.addNftList = async (req, res) => {
  try {
    if (!req.body.accountId || !req.body.nftData) {
      res.send({
        status: false,
        message: 'failed'
      });
    } else {
      let accountId = atob(req.body.accountId);
      let nftData = JSON.parse(atob(req.body.nftData));

      for (let i = 0; i < nftData.length; i++) {
        await NftList.findOneAndUpdate(
          { token_id: nftData[i].tokenId, serial_number: nftData[i].serialNum },
          { owner: accountId }
        );
      }
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

exports.getNFTData = async (req, res) => {
  try {
    //Get all NFT Data
    let allNFTData = await NftList.find({});
    let NFTData = [];
    for (let i = 0; i < allNFTData.length; i++) {
      if (allNFTData[i].owner != null)
        NFTData.push(allNFTData[i]);
    }
    //send response
    res.send({
      status: true,
      message: 'Success',
      data: NFTData
    });
  } catch (err) {
    res.status(500).send(err);
  }
}