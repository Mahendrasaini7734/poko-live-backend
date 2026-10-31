const multer = require("multer");
const multerS3 = require("multer-s3");
const AWS = require("aws-sdk");
const path = require("path");

// AWS Config
const awsConfig = {
  region: process.env.AWS_REGION,
};

// Local Development
if (
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY
) {
  awsConfig.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  awsConfig.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
}

AWS.config.update(awsConfig);

const s3 = new AWS.S3();

const upload = (folder) =>
  multer({
    storage: multerS3({
      s3,
      bucket: process.env.AWS_S3_BUCKET,
      contentType: multerS3.AUTO_CONTENT_TYPE,

      key: (req, file, cb) => {
        const ext = path.extname(file.originalname);

        const fileName = `${folder}/${Date.now()}-${Math.round(
          Math.random() * 1e9
        )}${ext}`;

        cb(null, fileName);
      },
    }),
  });

module.exports = upload;