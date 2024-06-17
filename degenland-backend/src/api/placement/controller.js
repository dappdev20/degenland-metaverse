const Placement = require('../../models/Placement');

exports.getUrl = async (req, res) => {
    console.log("getUrl");
//    console.log(req.params.body);
    console.log(req.body);
    try {
        if (!req.body.address || !req.body.pos) {
            res.send({
              status: false,
              message: 'failed'
            });
        } else {
          let building = await Placement.findOne({ address: req.body.address, pos: req.body.pos });

          //send response
          res.send({
            status: true,
            message: 'Success',
            data: building.linkurl
          });
        }
    } catch (err) {
        res.status(500).send(err);
    }
}

exports.setLinkUrl = async (req, res) => {
  console.log("setLinkUrl");
  try {
      if (!req.body.address || !req.body.pos) {
          res.send({
            status: false,
            message: 'failed'
          });
      } else {
        let building = await Placement.findOne({ address: req.body.address, pos: req.body.pos });

        //send response
        res.send({
          status: true,
          message: 'Success',
          data: building.linkurl
        });
      }
  } catch (err) {
      res.status(500).send(err);
  }
}