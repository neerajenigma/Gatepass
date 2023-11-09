const express = require("express");
const router = new express.Router();
const customError = require("../customerror/CustomError");
const { user, gatepass } = require("../models/User");
const mongoose = require('mongoose');
const jwtAuthenticator = require("../middleware/Jwtauth.js");
const validationMiddleware = require("../middleware/ValidationMiddleware.js");
const errorHandling = require("../middleware/ErrorHandling.js");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secreat = "this is your secreat";
router.use(cookieParser())


createtoken = (id) => {
    const token = jwt.sign({ id }, secreat, {
        expiresIn: 60 * 60 * 24
    });
    return token;
}

router.use(jwtAuthenticator);
router.post("/signup", validationMiddleware, async (req, res, next) => {
    try {
        console.log("------signupreq------");
        console.log(req.body);
        const reqBody = { ...req.body, userPower: "", status: "pending" };
        const tempUser = await user.create(reqBody);
        console.log(tempUser);
        if (tempUser) res.status(200).json({ success: true });
    }
    catch (error) {
        next(error);
    }
})

router.post("/signin", async (req, res, next) => {
    try {
        console.log("-------entered in sign in req------");
        const email = req.body.email;
        const password = req.body.password;
        const currentUser = await user.findOne({ email: email }).select('email password')
        // console.log(user);
        if (currentUser) {
            // console.log("user pass_authenticated");
            const passwordCheck = await bcrypt.compare(password, currentUser.password);
            if (passwordCheck) {
                // console.log("pass_authenticated");
                const token = createtoken(currentUser._id);
                res.cookie('user', token, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
                return res.status(200).json({
                    success: true,
                })
            }
            else {
                // console.log("not pass_authenticated");
                throw new customError("wrong password", 404, "Password");
            }
        }
        else {
            throw new customError("Email not registered", 404, "Email");
        }
    }
    catch (error) {
        // console.log("enter in error block")
        console.log(error)
        next(error);
    }
})

router.delete("/gatepass/:gpId", async (req, res, next) => {
    try {
        console.log("-------entered in delete req-------");
        const gatepassId = req.params.gpId;
        const currentUserId = req.body.user;
        const currentGatepass = await gatepass.findOne({ '_id': gatepassId })
        if (!currentGatepass) {
            throw new customError("Gatepasss not found!", 404)
        }
        if (currentGatepass.applicantId != currentUserId) {
            throw new customError("you are not allowed for delete this gatepass!", 403)
        }
        const deletedGatepass = await gatepass.deleteOne({ '_id': gatepassId });
        if (deletedGatepass) return res.status(200).json({ success: true });
    }
    catch (error) {
        next(error);
    }
})

router.post("/gatepass", validationMiddleware, async (req, res, next) => {
    try {
        console.log("-------gpapplyreqrecieved--------");
        // console.log(req.body);
        const reqBody = req.body;
        // console.log(reqBody)
        const currentUserId = reqBody.user;
        const currentUser = await user.findOne({ '_id': currentUserId })
        // console.log(currentUser);
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else if (currentUser && reqBody) {
            // console.log(reqBody);
            if (currentUser.userType === "outsider" && reqBody.exitDate < reqBody.entryDate) {
                throw new customError("exit date must be after entry date", 400, "exit date");
            }
            if (currentUser.userType === "student" && reqBody.exitDate > reqBody.entryDate) {
                throw new customError("entry date must be after exit date", 400, "entry date");
            }
            // console.log("112");
            const now = Date.now();
            const istOffset = 5.5 * 60 * 60 * 1000;
            const date = new Date(now + istOffset).toISOString();
            // const reqBody = req.body
            const newGatepass = {
                userType: currentUser.userType,
                name: currentUser.name,
                personId: currentUser.personId,
                contact: currentUser.contact,
                hostel: currentUser.hostel,
                applicantId: currentUserId,
                applyDate: date,
                entryDate: reqBody.entryDate,
                exitDate: reqBody.exitDate,
                purpose: reqBody.purpose,
                status: "pending"
            }
            const createdGatepass = await gatepass.create(newGatepass);
            if (createdGatepass) return res.status(200).json({
                success: true
            });
        }
    }
    catch (error) {
        console.log(error);
        next(error)
    }
})

router.patch("/gatepass/:gpId", validationMiddleware, async (req, res, next) => {
    try {
        console.log("-------gpeditreqrecieved--------");
        // console.log(req.body);
        let reqBody = req.body;
        // console.log(reqBody)
        const currentUserId = reqBody.user;
        delete reqBody.user;
        reqBody['status'] = "pending";
        // console.log(reqBody)
        const currentUser = await user.findOne({ '_id': currentUserId })
        // console.log(currentUser);
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else if (currentUser && reqBody) {
            // console.log(reqBody);
            if (currentUser.userType === "outsider" && reqBody.exitDate < reqBody.entryDate) {
                throw new customError("exit date must be after entry date", 400, "exit date");
            }
            if (currentUser.userType === "student" && reqBody.exitDate > reqBody.entryDate) {
                throw new customError("entry date must be after exit date", 400, "entry date");
            }
            const updatedGatepass = await gatepass.findByIdAndUpdate(reqBody._id, reqBody, { new: true });
            if (updatedGatepass) return res.status(200).json({
                success: true
            });
        }
    }
    catch (error) {
        console.log(error);
        next(error)
    }
})

router.get("/allgp", async (req, res, next) => {
    try {
        console.log("-------allgp req recieved------");
        const pageNumber = req.query.pno;
        const pageSize = req.query.psize;
        let reqQuery = req.query
        delete reqQuery.pno;
        delete reqQuery.psize;
        const currentUserId = req.body.user;
        const currentUser = await user.findOne({ '_id': currentUserId })

        if (reqQuery.hostel === "all") delete reqQuery.hostel;
        if (reqQuery.status === "all") delete reqQuery.status;
        if (reqQuery.userType === "all") delete reqQuery.userType;
        if (currentUser.userType === "caretaker") {
            reqQuery['hostel'] = currentUser.hostel;
        }
        else if (["student", "outsider"].includes(currentUser.userType)) {
            reqQuery = { ...reqQuery, applicantId: currentUserId };
        }
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status != "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            // console.log(reqQuery);
            gatepass.find(reqQuery)
                .select('name contact hostel purpose entryDate exitDate applyDate status')
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .exec(function (err, gatepasses) {
                    if (err) {
                        throw (err);
                    }
                    else {
                        return res.status(200).send(gatepasses)
                    }
                })

        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/gpcount", async (req, res, next) => {
    try {
        console.log("------gpcount req recieved-------");
        let reqQuery = req.query
        const currentUserId = req.body.user;
        const currentUser = await user.findOne({ '_id': currentUserId })

        if (reqQuery.hostel === "all") delete reqQuery.hostel;
        if (reqQuery.status === "all") delete reqQuery.status;
        if (reqQuery.userType === "all") delete reqQuery.userType;
        if (currentUser.userType === "caretaker") {
            reqQuery['hostel'] = currentUser.hostel;
        }
        else if (["student", "outsider"].includes(currentUser.userType)) {
            reqQuery = { ...reqQuery, applicantId: currentUserId };
        }
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status != "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            gatepass.countDocuments(reqQuery, function (err, gatepassCount) {
                if (err) {
                    throw (err);
                }
                else {
                    return res.send(gatepassCount.toString())
                }
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/View_gp/:gpId", async (req, res, next) => {
    try {
        console.log("------viewgp_ req recieved------");
        const currentUserId = req.body.user;
        const gatepassId = req.params.gpId;
        const currentUser = await user.findOne({ '_id': currentUserId })
        if (!currentUser) res.redirect("/logout");
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            const currentGatepass = await gatepass.findOne({ '_id': gatepassId })
            if (!currentGatepass) {
                throw new customError("gatepass not found", 404)
            }
            else if (!((["admin", "security"].includes(currentUser.userPower)) || currentGatepass.applicantId === currentUserId || (currentGatepass.hostel === currentUser.hostel && currentUser.userPower === "caretaker"))) {
                throw new customError("u r not allowed to do this request", 403);
            }
            return res.status(200).send(currentGatepass);
        }
    }
    catch (err) {
        next(err);
    }
});

router.post("/gp_action/:gpId", async (req, res, next) => {
    try {
        console.log("-------gpaction--------");
        const currentUserId = req.body.user;
        const gatepassId = req.params.gpId;
        const currentUser = await user.findOne({ '_id': currentUserId })
        const currentGatepass = await gatepass.findOne({ '_id': gatepassId })
        let reqBody = req.body;

        if (!currentUser) res.redirect("/logout");
        if (!currentGatepass) {
            throw new customError("gatepass not found", 404);
        }
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else if (!((["admin", "caretaker"].includes(currentUser.userPower) && reqBody.hasOwnProperty("status")) || (currentUser.userPower === "security" && (!reqBody.hasOwnProperty("status"))))) {
            throw new customError("you are not allowed to do this", 403);
        }
        else {
            delete reqBody.user;
            const newGatepass = { ...currentGatepass._doc, ...reqBody };
            const updatedGatepass = await gatepass.findByIdAndUpdate(gatepassId, newGatepass, { new: true });
            if (updatedGatepass) return res.status(200).json({ success: true });
        }
    }
    catch (err) {
        // console.log(err);
        next(err);
    }
})

router.get("/Show_profile/:userId", async (req, res, next) => {
    try {
        console.log("--------Show_profile req recieved--------");
        const currentUserId = req.body.user;
        const viewUserId = req.params.userId;
        const currentUser = await user.findOne({ '_id': currentUserId })
        if (!currentUser) res.redirect("/logout");
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            const viewUser = await user.findOne({ '_id': viewUserId }).select('-password')
            if (!viewUser) {
                throw new customError("user not found", 404);
            }
            else if (!(["admin", "caretaker", "security"].includes(currentUser.userPower))) {
                throw new customError("u r not allowed to do this request", 403)
            }
            else {
                return res.status(200).send(viewUser);
            }
        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/myself", async (req, res, next) => {
    try {
        console.log("--------myprofile req recieved--------");
        if (!req.body.hasOwnProperty("user")) {
            res.redirect("/logout");
        }
        else {
            console.log(req.body);
            const currentUserId = req.body.user;
            const currentUser = await user.findOne({ '_id': currentUserId }).select('-password')
            if (!currentUser) res.redirect("/logout");
            else return res.status(200).send(currentUser);
        }
    }
    catch (err) {
        next(err);
    }
})

router.patch("/myself", validationMiddleware, async (req, res, next) => {
    try {
        console.log("--------edit myprofile req recieved--------");
        let reqBody = req.body;

        // console.log(reqBody)
        const currentUserId = reqBody.user;
        delete reqBody.user;
        let currentUser = await user.findOne({ '_id': currentUserId })
        // console.log(currentUser);
        if (!currentUser) res.redirect('/logout');
        if (currentUser.userType !== "admin") reqBody['status'] = "pending";
        if (currentUser && reqBody) {
            for (let prop in reqBody) {
                currentUser[prop] = reqBody[prop];
            }
            // currentUser[status]="pending";
            // console.log(currentUser);
            const updatedUser = await user.findByIdAndUpdate(currentUser._id, currentUser, { new: true });
            // console.log(updatedUser);
            if (updatedUser) return res.status(200).json({
                success: true
            });
        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/alluser", async (req, res, next) => {
    try {
        console.log("-------alluserreq------")
        const pageNumber = req.query.pno;
        const pageSize = req.query.psize;
        let reqQuery = await req.query
        delete reqQuery.pno;
        delete reqQuery.psize;

        const currentUserId = req.body.user;
        const currentUser = await user.findOne({ '_id': currentUserId })

        if (reqQuery.hostel === "all") delete reqQuery.hostel;
        if (reqQuery.status === "all") delete reqQuery.status;
        if (reqQuery.userType === "all") delete reqQuery.userType;
        if (currentUser.userType === "caretaker") {
            reqQuery['hostel'] = currentUser.hostel;
        }
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status != "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            user.find(reqQuery)
                .select('name email status userType contact')
                .skip((pageNumber - 1) * pageSize)
                .limit(pageSize)
                .exec(function (err, users, next) {
                    if (err) {
                        next(err);
                    }
                    else {
                        res.status(200).send(users)
                    }
                })

        }
    }
    catch (err) {
        next(err);
    }
})

router.get("/usercount", async (req, res, next) => {
    try {
        console.log("--------usercount req recieved--------");
        let reqQuery = await req.query

        const currentUserId = req.body.user;
        const currentUser = await user.findOne({ '_id': currentUserId })
        if (reqQuery.hostel === "all") delete reqQuery.hostel;
        if (reqQuery.status === "all") delete reqQuery.status;
        if (reqQuery.userType === "all") delete reqQuery.userType;
        if (currentUser.userType === "caretaker") {
            reqQuery['hostel'] = currentUser.hostel;
        }
        if (!currentUser) res.redirect('/logout');
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else {
            user.countDocuments(reqQuery, function (err, userCount, next) {
                if (err) {
                    next(err);
                }
                else {
                    return res.status(200).send(userCount.toString());
                }
            })
        }
    }
    catch (err) {
        next(err);
    }
})

router.post("/user_action", async (req, res, next) => {
    try {
        console.log("--------useraction req recieved--------");
        let reqBody = req.body;
        const currentUserId = reqBody.user;
        const actionUserId = reqBody.userId;
        let actionUser = await user.findOne({ '_id': actionUserId });
        const currentUser = await user.findOne({ '_id': currentUserId })
        if (!currentUser) res.redirect('/logout');
        else if (!actionUser) {
            throw new customError("user not found!", 404)
        }
        else if (currentUser.status !== "verified") {
            throw new customError("you are not verified user!", 403)
        }
        else if (currentUser.userPower !== "admin" || currentUserId === actionUserId) {
            throw new customError("you are not allowed!", 403)
        }
        else {
            const newUser = { ...actionUser._doc, userPower: reqBody.userPower, status: reqBody.status }
            const updatedUser = await user.findByIdAndUpdate(actionUserId, newUser, { new: true });
            return res.status(200).send(updatedUser);
        }
    }
    catch (err) {
        next(err)
    }
})

router.get("/logout", async (req, res) => {
    try {
        console.log("--------logout req recieved--------");
        return res
            .clearCookie("user")
            .status(200)
            .send("Successfully logged out");
    }
    catch (err) {
        res.status(401).send(err)
    }
})

router.use(errorHandling)

module.exports = router;
