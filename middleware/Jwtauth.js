const express = require("express")
const jwt = require("jsonwebtoken");
const customError = require("../customerror/CustomError")
const secreat = "this is your secreat";

const middle = async (req, res, next) => {
    try {
        console.log("--enterd in Jwtauth--")
        const token = await req.cookies.user;
        jwt.verify(token, secreat, async function (err, decodedtoken) {
            try {
                if (err && req.path !== "/signup" && req.path !== "/signin") {
                    console.log("err and signup");
                    const error = new customError("kindly login first!", 401, "all");
                    throw error
                }
                else if (!err && (req.path === "/signup" || req.path === "/signin")) {
                    console.log("no err and signup");
                    const error = new customError("user already logged in,kindly logout first!", 200, "all");
                    throw error
                }
                else if (!err) {
                    console.log("no err and no signup");
                    const p = await decodedtoken.id;
                    req.body = await { ...req.body, "user": p };

                }
                next()
            }
            catch (error) {
                next(error)
            }
        });
    }
    catch (error) {
        next(error);
    }
}

module.exports = middle;