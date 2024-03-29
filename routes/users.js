var express = require("express");
const bodyParser = require("body-parser");
var User = require("../models/user");
const cors = require("./cors");
const authenticate = require("../authenticate");
var passport = require("passport");
var fs = require("fs");
const user = require("../models/user");

var router = express.Router();
router.use(bodyParser.json());

/* GET users listing. */
// router.options("*", cors.corsWithOptions, (req, res) => {
//   res.sendStatus(200);
// });
router
  .route("/")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(
    cors.corsWithOptions,
    authenticate.verifyUser,
    function (req, res, next) {
      User.find({})
        .then(
          (users) => {
            res.statusCode = 200;
            res.setHeader("Content-Type", "application/json");
            res.json(users);
          },
          (err) => next(err)
        )
        .catch((err) => next(err));
    }
  );

router
  .route("/register")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    User.register(
      new User({ username: req.body.username }),
      req.body.password,
      (err, user) => {
        // console.log(req.body);
        if (err) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.json({ err: err });
        } else {
          if (req.body.firstname) {
            user.firstname = req.body.firstname;
          }
          if (req.body.lastname) {
            user.lastname = req.body.lastname;
          }
          if (req.body.email) {
            user.email = req.body.email;
          }
          if (req.body.gender) {
            user.gender = req.body.gender;
          }
          if (req.body.imageName) {
            user.image = "images/profile/" + req.body.imageName;
          }
          // if (req.body.image) {
          // }
          user.save((err, user) => {
            if (err) {
              res.statusCode = 500;
              res.setHeader("Content-Type", "application/json");
              res.json({ err: err });
              return;
            }
            passport.authenticate("local")(req, res, () => {
              res.statusCode = 200;
              res.setHeader("Content-Type", "application/json");
              res.json({ success: true, status: "Registration Successful!" });
            });
          });
        }
      }
    );
  });

router
  .route("/login")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);

      if (!user) {
        res.statusCode = 401;
        res.setHeader("Content-Type", "application/json");
        res.json({ success: false, status: "Log In unsuccessful", err: info });
      }
      req.logIn(user, (err) => {
        if (err) {
          res.statusCode = 401;
          res.setHeader("Content-Type", "application/json");
          // res.header("Access-Control-Allow-Credentials", true);
          res.json({
            success: false,
            status: "Login Unsuccessful!",
            err: "Could not log in user!",
          });
        }
        var token = authenticate.getToken({ _id: req.user._id });
        res.cookie("jwt-token", token, {
          signed: true,
          path: "/",
          // For production
          secure: true,
          sameSite: "none",

          httpOnly: true,
        });
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.json({ success: true, status: "Login Successful!", user: user });

        // res.end();
      });
    })(req, res, next);
  });

router
  .route("/logout")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .post(cors.corsWithOptions, (req, res, next) => {
    // if (req.session) {
    // console.log(req.session);
    // req.session.destroy();
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.clearCookie("jwt-token", { path: "/", signed: true, httpOnly: true });
    res.json({ success: true, message: "Logout Successfull" });

    // res.redirect("/");
    // }
  });

router
  .route("/user")
  .options(cors.corsWithOptions, (req, res) => {
    res.sendStatus(200);
  })
  .get(cors.corsWithOptions, authenticate.verifyUser, (req, res, next) => {
    User.findById(req.user._id)
      .then(
        (user) => {
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.json(user);
        },
        (err) => next(err)
      )
      .catch((err) => next(err));
  });

module.exports = router;
