// src/config/cloudinary.config.ts
import { v2 as cloudinary } from "cloudinary";
import config from "./config";

cloudinary.config({
  cloud_name: config.cloudImage.cloud_name,
  api_key: config.cloudImage.api_key,
  api_secret: config.cloudImage.api_secret,
});

export default cloudinary;
