// const Setting = require("./setting");

// console.log("Setting", Setting.privateKey)

module.exports = () => {
  return (req, res, next) => {
    // console.log(req.body.privateKey);
    const key =
      req.headers.key ||
      req.body.privateKey ||
      req.query.key ||
      process.env.secretKey;
    // console.log("key=======>>>>" ,key)
    const isEqual = (a, b) => JSON.stringify(a) === JSON.stringify(b);

    if (key) {
      if (isEqual(key, process.env.secretKey)) {
        next();
      } else {
        return res.status(400).json({
          status: false,
          error: "Unpermitted infiltration",
        });
      }
    } else {
      return res.status(400).json({
        status: false,
        error: "Unpermitted infiltration",
      });
    }
  };
};




// const admin =
// require("firebase-admin");

// const Admin =
// require("./models/admin.model");

// module.exports = () => {

//   return async (

//     req,

//     res,

//     next

//   ) => {

//     try {

//       // ======================================
//       // SECRET KEY
//       // ======================================

//       const key =

//         req.headers.key ||

//         req.body.privateKey ||

//         req.query.key;

//       // ======================================
//       // KEY REQUIRED
//       // ======================================

//       if (!key) {

//         return res.status(401).json({

//           status: false,

//           message: "Secret key required"

//         });

//       }

//       // ======================================
//       // INVALID KEY
//       // ======================================

//       if (

//         key !== process.env.secretKey

//       ) {

//         return res.status(401).json({

//           status: false,

//           message: "Invalid secret key"

//         });

//       }

//       // ======================================
//       // AUTHORIZATION
//       // ======================================

//       const authHeader =
//         req.headers.authorization;

//       if (

//         !authHeader ||

//         !authHeader.startsWith(

//           "Bearer "

//         )

//       ) {

//         return res.status(401).json({

//           status: false,

//           message: "Authorization token required"

//         });

//       }

//       // ======================================
//       // TOKEN
//       // ======================================

//       const token =
//         authHeader.split(" ")[1];

//       // ======================================
//       // VERIFY FIREBASE TOKEN
//       // ======================================

//       const decoded =

//         await admin

//         .auth()

//         .verifyIdToken(token);

//       // ======================================
//       // X ADMIN UID
//       // ======================================

//       const adminUid =
//         req.headers["x-admin-uid"];

//       if (!adminUid) {

//         return res.status(401).json({

//           status: false,

//           message: "x-admin-uid required"

//         });

//       }

//       // ======================================
//       // UID MATCH
//       // ======================================

//       if (

//         decoded.uid !== adminUid

//       ) {

//         return res.status(401).json({

//           status: false,

//           message: "Invalid admin uid"

//         });

//       }

//       // ======================================
//       // FIND ADMIN
//       // ======================================

//       const adminUser =
//         await Admin.findOne({

//           uid: adminUid

//         });

//       if (!adminUser) {

//         return res.status(401).json({

//           status: false,

//           message: "Admin not found"

//         });

//       }

//       // ======================================
//       // STORE ADMIN
//       // ======================================

//       req.admin = adminUser;

//       // ======================================
//       // NEXT
//       // ======================================

//       next();

//     } catch (err) {

//       console.log(

//         "CHECK ACCESS ERROR =>",

//         err

//       );

//       return res.status(401).json({

//         status: false,

//         message: "Unauthorized"

//       });

//     }

//   };

// };