const FeedPost = require("../../models/feedPost.model");
const User = require("../../models/user.model");

const { success, error } = require("../../util/response");
const {
  FEED_EVENTS,
  emitFeedEvent,
} = require("../../services/feedRealtime.service");


// ======================================
// GET ALL FEED USERS
// ======================================

exports.getFeedUsers = async (req, res) => {

  try {

    // ======================================
    // PAGINATION
    // ======================================

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const skip =
      (page - 1) * limit;

    // ======================================
    // FETCH POSTS
    // ======================================

    const posts =
      await FeedPost.find({

        status: true

      })

      .populate({

        path: "userId",

        select: `
          name
          image
          uniqueId
          isVip
          country
          countryFlagImage
        `

      })

      .sort({

        createdAt: -1

      })

      .lean();

    // ======================================
    // EMPTY
    // ======================================

    if (!posts.length) {

      return success(

        res,

        {

          users: [],

          pagination: {

            total: 0,

            page,

            limit,

            totalPages: 0

          }

        },

        "No feed users found"

      );

    }

    // ======================================
    // UNIQUE USERS MAP
    // ======================================

    const usersMap = new Map();

    // ======================================
    // LOOP POSTS
    // ======================================

    posts.forEach((post) => {

      // ======================================
      // SKIP INVALID USER
      // ======================================

      if (!post.userId) return;

      const userId =
        post.userId._id.toString();

      // ======================================
      // NEW USER
      // ======================================

      if (!usersMap.has(userId)) {

        usersMap.set(userId, {

          user: post.userId,

          totalPosts: 1,

          latestPostAt:
            post.createdAt

        });

      }

      // ======================================
      // EXISTING USER
      // ======================================

      else {

        const existing =
          usersMap.get(userId);

        existing.totalPosts += 1;

      }

    });

    // ======================================
    // FINAL USERS
    // ======================================

    const allUsers =
      Array.from(

        usersMap.values()

      );

    // ======================================
    // TOTAL
    // ======================================

    const total =
      allUsers.length;

    // ======================================
    // PAGINATED USERS
    // ======================================

    const paginatedUsers =
      allUsers.slice(

        skip,

        skip + limit

      );

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        users: paginatedUsers,

        pagination: {

          total,

          page,

          limit,

          totalPages:
            Math.ceil(total / limit)

        }

      },

      "Feed users fetched successfully"

    );

  } catch (err) {

    console.log(

      "GET FEED USERS ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};


// ======================================
// GET FEEDS BY USER
// ======================================

exports.getFeedsByUser = async (req, res) => {

  try {

    // ======================================
    // PARAMS
    // ======================================

    const userId =
      req.params.userId;

    // ======================================
    // PAGINATION
    // ======================================

    const page =
      Number(req.query.page) || 1;

    const limit =
      Number(req.query.limit) || 10;

    const skip =
      (page - 1) * limit;

    // ======================================
    // QUERY
    // ======================================

    const query = {

      userId,

      status: true

    };

    // ======================================
    // FETCH POSTS
    // ======================================

    const [posts, total] =
      await Promise.all([

        FeedPost.find(query)

          .populate({

            path: "userId",

            select: `
              name
              image
              uniqueId
              isVip
              country
              countryFlagImage
            `

          })

          .sort({

            createdAt: -1

          })

          .skip(skip)

          .limit(limit)

          .lean(),

        FeedPost.countDocuments(
          query
        )

      ]);

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {

        posts,

        pagination: {

          total,

          page,

          limit,

          totalPages:
            Math.ceil(total / limit)

        }

      },

      "User feeds fetched successfully"

    );

  } catch (err) {

    console.log(

      "GET FEEDS BY USER ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};


// ======================================
// DELETE FEED
// ======================================

exports.deleteFeed = async (req, res) => {

  try {

    // ======================================
    // PARAMS
    // ======================================

    const postId =
      req.params.postId;

    // ======================================
    // FIND POST
    // ======================================

    const post =
      await FeedPost.findById(postId);

    if (!post) {

      return error(
        res,
        "Feed not found"
      );

    }

    // ======================================
    // DELETE POST
    // ======================================

    await FeedPost.findByIdAndDelete(
      postId
    );

    // realtime: viewers / host galleries remove this item
    emitFeedEvent(FEED_EVENTS.DELETED, {
      feedId: postId,
      hostId: post.hostId,
      action: "delete",
      updatedCount: 0,
    });

    // ======================================
    // RESPONSE
    // ======================================

    return success(

      res,

      {},

      "Feed deleted successfully"

    );

  } catch (err) {

    console.log(

      "DELETE FEED ERROR =>",

      err

    );

    return error(
      res,
      err.message,
      500
    );

  }

};