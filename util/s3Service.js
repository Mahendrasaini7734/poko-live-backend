const AWS = require("aws-sdk");

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

const deleteFromS3 = async (key) => {
  if (!key) return;

  await s3
    .deleteObject({
      Bucket: process.env.AWS_S3_BUCKET,
      Key: key,
    })
    .promise();
};

module.exports = {
  deleteFromS3,
};
