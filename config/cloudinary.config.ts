const cloudinary = require('cloudinary').v2;
import config from "./config";

cloudinary.config({
    cloud_name: config.cloudImage.cloud_name,
    api_key: config.cloudImage.api_key,
    api_secret: config.cloudImage.api_secret
});

module.exports = cloudinary;