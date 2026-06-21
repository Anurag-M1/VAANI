const mongoose = require('mongoose');

const wardSchema = new mongoose.Schema({
  ward_no: Number,
  ward_name: String,
  discom_zone: String,
  pincode: String,
}, { _id: false });

const zoneSchema = new mongoose.Schema({
  zone_name: String,
  wards: [wardSchema],
}, { _id: false });

const districtWardSchema = new mongoose.Schema({
  district_name: { type: String, required: true },
  code: { type: String, required: true, unique: true },
  dm_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  zones: [zoneSchema],
  total_population: Number,
  area_sqkm: Number,
  lat: Number,
  lng: Number,
}, { timestamps: true });

module.exports = mongoose.model('DistrictWard', districtWardSchema);
