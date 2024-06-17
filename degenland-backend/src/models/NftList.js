const mongoose = require('mongoose');
const NftListSchema = new mongoose.Schema({
  name: { type: String, required: true },
  token_id: { type: String, default: null },
  serial_number: { type: Number, required: true },
  owner: { type: String, default: null },
  date: { type: Date, default: Date.now }
});

module.exports = User = mongoose.model('NftList', NftListSchema);
