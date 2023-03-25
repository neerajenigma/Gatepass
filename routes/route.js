const express = require("express");
const router = new express.Router();
const { user, gatepass } = require("../models/User");
const mongoose = require('mongoose');
const midd = require("../middleware/Jwtauth.js");
const cookieParser = require('cookie-parser');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secreat = "this is your secreat";
let date = new Date();

router.use(cookieParser())

handle_error = (err) => {
    let errors = { email: '', passwd: '' };
    if (err.code === 11000) {
        errors.email = "this email is already registered";
        return errors;
    }
    if (err.message.includes("user validation failed")) {
        Object.values(err.errors).forEach(({ properties }) => {
            errors[properties.path] = [properties.message];
        })
    }
    return errors;
};

createtoken = (id) => {
    const token = jwt.sign({ id }, secreat, {
        expiresIn: 60 * 60 * 24
    });
    return token;
}
router.post("/signup", async (req, res) => {
    try {
        console.log("sign up request received")
        const pre_token = await req.cookies.user;
        if (pre_token) {
            res.send("invalid request!");
        }
        else {
            const temp_User = await user.create(req.body);
            // const ress=await tuser.save();
            // const token = createtoken(temp_User._id);
            // res.cookie('user', token, { maxAge: 1000 * 60 * 60 * 24, httpOnly: false });
            const resi = { "status": "success", "data": `${temp_User}` }
            // console.log(res.cookies)
            res.status(200).send(resi);
        }
    }
    catch (err) {
        console.log(err)
        const temp_Error = handle_error(err);
        res.status(200).send(temp_Error);
    }
})

router.post("/signin", async (req, res) => {
    try {
        // console.log(req.body);
        const pre_token = await req.cookies.user;
        if (pre_token) {
            res.send("invalid request!");
        }
        else {
            let errors = { email: '', passwd: '' };
            const usermail = req.body.email;
            const p = req.body.passwd;
            // console.log(usermail,p);
            const d = await user.findOne({ email: usermail })
            // console.log(d)
            if (d) {
                const pass_auth = await bcrypt.compare(p, d.passwd);
                // console.log(d._id);
                if (pass_auth) {
                    console.log("pass_authenticated");
                    const token = createtoken(d._id);
                    res.cookie('user', token, { maxAge: 1000 * 60 * 60 * 24, httpOnly: true });
                }
                else {
                    errors.passwd = "invalid passwd!"
                    res.send(errors)
                }
                // console.log(d);
                // console.log(res.cookies)
                const resi = { "req_status": "success", d }
                res.send(resi)
            }
            else {
                errors.email = "invalid Email!";
                res.send(errors)
            }
        }
    }
    catch (err) {
        console.log(err);
    }
})

router.use(midd);

router.post("/gatepass", async (req, res) => {
    try {
        console.log("req recieved");
        if (req.body.err) {
            res.send(req.body.err);
        }
        const s_id = req.body.user;
        const d = await user.findOne({ '_id': s_id })
        if (d && d.status != "verified") { res.send("you r not verified user") }
        else if (d) {
            let ed = req.body
            const temp = {
                usertype: d.usertype,
                name: d.name,
                person_id: d.person_id,
                mobnumber: d.mobnumber,
                hostel: d.hostel,
                user_id: s_id,
                apply_date: date.toISOString(),
                enntry_date: ed.entry_date,
                exit_date: ed.exit_date,
                purpose: ed.purpose,
                status: "pending"
            }
            // console.log(caretaker)
            const gp = await gatepass.create(temp);
            console.log(gp)
            res.send(gp)
        }
        else {
            res.send("we logged out!")
        }
    }
    catch (err) {
        console.log(err)
        res.status(200).send(err)
    }
})

router.get("/allgp", async (req, res) => {
    try {
        const c_id = req.body.user;
        let c = await user.findOne({ '_id': c_id })
        if (!c) { res.send("invalid user request") }
        // else if (!(c.user_power == "admin" || (req.body.hostel == c.hostel && c.user_power == "permit"))) { res.send("u r not allowed to do this request") }
        else {
            if (req.body.hostel != "" && (c.user_power == "admin" || c.user_power == "security")) {
                temp = { "hostel": req.body.hostel }
            }
            else if (c.user_power == "caretaker") {
                temp = { "hostel": req.body.hostel }
            }
            else if (c.user_power == "request") {
                temp = {
                    "hostel": req.body.hostel,
                    "user_id": c._id
                }
            }
            console.log(temp);
            gatepass.find(temp, function (err, gps) {
                if (err) {
                    res.send(err);
                }
                else {
                    console.log(gps);
                    res.send(gps)
                }
            });
        }
    }
    catch (err) {
        res.send(err);
    }
})

router.post("/gp_action", async (req, res) => {
    try {
        const c_id = req.body.user;
        const g_id = req.body.g_id;
        let c = await user.findOne({ '_id': c_id })
        let d = await gatepass.findOne({ '_id': g_id })
        if (c.status != "verified") { res.send("you r not verified user") }
        else if (c.user_power != "permit" || c.hostel != d.hostel) { res.send("you r not allow to do this task") }
        else if (d) {
            const bd = req.body;
            d.status = bd.status;
            d.message = bd.message;
            d.action_by = c_id;
            d.action_date = date.toISOString();
            const d_new = await gatepass.findByIdAndUpdate(g_id, d, { new: true });
            res.send(d_new);
        }
        else {
            res.status(200).send("invalid gp_action request")
        }
    }
    catch (err) {
        res.status(200).send(err)
    }
})

router.get("/alluser", async (req, res) => {
    try {
        const c_id = req.body.user;
        let c = await user.findOne({ '_id': c_id })
        if (!c) { res.send("invalid user request") }
        else if (!(c.user_power == "admin" || (c.user_power == "permit" && c.hostel == req.body.hostel))) { res.send("u r not allowed to do this request") }
        else {
            const isadmin = (c.user_power == "admin" ? true : false)
            let temp = {};
            if (req.body.hostel != "") {
                temp[hostel] = (isadmin ? req.body.hostel : c.hostel)
            }
            if (isadmin && req.body.usertype != "") {
                temp[usertype] = req.body.usertype
            }
            else if (!isadmin) {
                temp[user_type] = "{ $in:[outsider,student]}}";
            }
            console.log("temp set")
            console.log(temp);
            user.find(temp, function (err, users) {
                if (err) {
                    res.send(err);
                }
                else {
                    console.log(users);
                    res.send(users)
                }
            });
        }
    }
    catch (err) {
        res.send(err);
    }
})

router.post("/user_action", async (req, res) => {
    try {
        const admin_id = req.body.user;
        const user_id = req.body.user_id;
        let guest = await user.findOne({ '_id': user_id });
        const admin = await user.findOne({ '_id': admin_id })
        if (guest && admin && admin.user_power == "admin") {
            guest.status = req.body.action
            guest.user_power = req.body.user_power
            console.log(guest)
            const de = await user.findByIdAndUpdate(user_id, guest, { new: true });
            res.send(de);
        }
        else {
            res.status(200).send("admin or guest is wrong")
        }
    }
    catch (err) {
        res.status(200).send(err)
    }
})

router.post("/gate_update", async (req, res) => {
    try {
        sec_id = req.body.user;
        g_id = req.body.g_id;
        sec = await user.findOne({ '_id': sec_id });
        gp = await gatepass.findOne({ '_id': sec_id });
        action_type = req.body.action_type;
        if (!gp || !sec) { res.send("gp or sec does not exist") }
        if (action_type = "in") {
            gp.in = req.body.in;
        }
        else if (action_type = "out") {
            gp.out = req.body.out;
        }
        else if (action_type = "report") {
            user = await user.findOne({ '_id': gp.user_id });
            user.report = user.report + 1;
            user = await user.findByIdAndUpdate(gp.user_id, user, { new: true })
            res.send(user);
        }
        gp = await gatepass.findByIdAndUpdate(g_id, gp, { new: true })
        res.send(gp)
    }
    catch (err) {
        res.send(err);
    }
})

router.get("/logout", async (req, res) => {
    try {
        return res
            .clearCookie("user")
            .status(200)
            .send("Successfully logged out 😏 🍀");
    }
    catch (err) {
        res.status(401).send(err)
    }
})

module.exports = router;
