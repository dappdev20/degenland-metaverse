const Building = require('../models/Building');
const NftList = require('../models/NftList');
const Place = require('../models/Place');

exports.onInit = async (io, socket) => {
  console.log("socket id", socket.id);

  //buildings init
  let buildingInfo = await Building.find({});

  if (buildingInfo.length == 0) {
    for (let i = 0; i <= 21; i++) {
      if (i == 0) {
        buildingInfo = new Building({
          index: i,
          type: 'ground',
          url: '/buildings/ground/g(' + i + ').png',
          default: true,
          size: '1*1',
          cost: 0,
          score: 1
        });
      }
      else if (i >= 1 && i <= 11) {
        buildingInfo = new Building({
          index: i,
          type: 'road',
          url: '/buildings/road/r (' + i + ').png',
          default: true,
          size: '1*1',
          cost: 0,
          score: 1
        });
      }
      else {
        let buildingSize;
        let score;
        let buildtime;
        if (i == 12) {
          buildingSize = '1*2';
          score = 5;
          buildtime = 20;
        }
        else if(i >= 13 && i <= 17) {
          buildingSize = '2*2';
          score = 15;
          buildtime = 20;
        }
        else if(i >= 18 && i <= 20) {
          buildingSize = '4*4';
          score = 40;
          buildtime = 20;
        }
        else if(i == 21) {
          buildingSize = '9*11';
          score = 200;
          buildtime = 20;
        }

        buildingInfo = new Building({
          index: i,
          type: 'building',
          url: '/buildings/building/b (' + (i - 11) + ').png',
          default: true,
          size: buildingSize,
          cost: 0,
          score: score,
          buildtime: buildtime
        });
      }
      await buildingInfo.save();
    }
  }

  //nft init
  const DEGENLAND_NFT_ID = "0.0.1466939";
  const TYCOON_NFT_ID = "0.0.1467455";
  const MOGUL_NFT_ID = "0.0.1467309";
  const INVESTOR_NFT_ID = "0.0.1467207";

  let nft = await NftList.find({});
  if (nft.length == 0) {
    for (let i = 1; i < 10000; i++) {
      if (i <= 1000) {
        let grandnft = new NftList({
          name: 'Degenland',
          token_id: DEGENLAND_NFT_ID,
          serial_number: i
        });
        await grandnft.save();

        let bignft = new NftList({
          name: 'Tycoon',
          token_id: TYCOON_NFT_ID,
          serial_number: i
        });
        await bignft.save();

        let mediumnft = new NftList({
          name: 'Mogul',
          token_id: MOGUL_NFT_ID,
          serial_number: i
        });
        await mediumnft.save();

        let smallnft = new NftList({
          name: 'Investor',
          token_id: INVESTOR_NFT_ID,
          serial_number: i
        });
        await smallnft.save();
      }
      else if (i <= 2000) {
        let bignft = new NftList({
          name: 'Tycoon',
          token_id: TYCOON_NFT_ID,
          serial_number: i
        });
        await bignft.save();

        let mediumnft = new NftList({
          name: 'Mogul',
          token_id: MOGUL_NFT_ID,
          serial_number: i
        });
        await mediumnft.save();

        let smallnft = new NftList({
          name: 'Investor',
          token_id: INVESTOR_NFT_ID,
          serial_number: i
        });
        await smallnft.save();
      }
      else if (i <= 3000) {
        let mediumnft = new NftList({
          name: 'Mogul',
          token_id: MOGUL_NFT_ID,
          serial_number: i
        });
        await mediumnft.save();

        let smallnft = new NftList({
          name: 'Investor',
          token_id: INVESTOR_NFT_ID,
          serial_number: i
        });
        await smallnft.save();
      }
      else if (i <= 4000) {
        let smallnft = new NftList({
          name: 'Investor',
          token_id: INVESTOR_NFT_ID,
          serial_number: i
        });
        await smallnft.save();
      }
    }
  }

  //place init
  let place = await Place.find({});
  if (place.length == 0) {
    for (let i = 1; i < 10000; i++) {
      if (i <= 1000) {
        let degenlandPlace = new Place({
          token_id: DEGENLAND_NFT_ID,
          serialNumber: i
        });
        await degenlandPlace.save();

        let tycoonPlace = new Place({
          token_id: TYCOON_NFT_ID,
          serialNumber: i
        });
        await tycoonPlace.save();

        let mogulPlace = new Place({
          token_id: MOGUL_NFT_ID,
          serialNumber: i
        });
        await mogulPlace.save();

        let investorPlace = new Place({
          token_id: INVESTOR_NFT_ID,
          serialNumber: i
        });
        await investorPlace.save();
      }
      else if (i <= 2000) {
        let tycoonPlace = new Place({
          token_id: TYCOON_NFT_ID,
          serialNumber: i
        });
        await tycoonPlace.save();

        let mogulPlace = new Place({
          token_id: MOGUL_NFT_ID,
          serialNumber: i
        });
        await mogulPlace.save();

        let investorPlace = new Place({
          token_id: INVESTOR_NFT_ID,
          serialNumber: i
        });
        await investorPlace.save();
      }
      else if (i <= 3000) {
        let mogulPlace = new Place({
          token_id: MOGUL_NFT_ID,
          serialNumber: i
        });
        await mogulPlace.save();

        let investorPlace = new Place({
          token_id: INVESTOR_NFT_ID,
          serialNumber: i
        });
        await investorPlace.save();
      }
      else if (i <= 4000) {
        let investorPlace = new Place({
          token_id: INVESTOR_NFT_ID,
          serialNumber: i
        });
        await investorPlace.save();
      }
    }
  }
}