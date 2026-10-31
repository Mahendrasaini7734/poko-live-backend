// import multer from "multer";
// import multerS3 from "multer-s3";
// import path from "path";
// import { S3Client } from "@aws-sdk/client-s3";

// const s3 = new S3Client({
//   region: process.env.AWS_REGION,
//   credentials: {
//     accessKeyId: process.env.AWS_ACCESS_KEY_ID,
//     secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
//   },
// });

// const upload = multer({
//   storage: multerS3({
//     s3,
//     bucket: process.env.AWS_S3_BUCKET,
//     acl: "public-read",
//     contentType: multerS3.AUTO_CONTENT_TYPE,

//     key: (req, file, cb) => {
//       cb(
//         null,
//         `uploads/${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(
//           file.originalname
//         )}`
//       );
//     },
//   }),
// });

// export default upload;
