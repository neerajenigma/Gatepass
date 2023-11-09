const express = require("express")

const errorHandling = async (error, req, res, next) => {
    try {
        console.log(error);
        error.code = error.code || 500;
        error.message = error.message || "Internal server error";
        error.attribute = error.attribute || "";
        let customError = {}
        console.log("-----entered in errorHandling middleware-----");
        if (error.code === 200) {
            return res.status(error.code).json({
                success: false,
                message: error.message
            })
        }
        if (error.name === 'MongoServerError' && error.code === 11000) {
            console.log(error);
            const propertyName = Object.keys(error.keyValue)[0];
            customError[propertyName] = `${propertyName} is already registered`;
            return res.status(409).send(customError);
        }
        if (error.message.includes("user validation failed")) {
            Object.values(err.errors).forEach(({ properties }) => {
                customError[properties.path] = [properties.message];
            })
            return res.send(400).json(customError);
        }
        if (error.code === 401) {
            return res.status(error.code).json({
                message: error.message
            });
        }
        if (error.code === 404) {
            return res.status(error.code).json({
                message: error.message,
                attribute: error.attribute
            })
        }
        if (error.code === 400) {
            return res.status(error.code).json({
                message: error.message,
                attribute: error.attribute
            })
        }
        if (error.code === 403) {
            return res.status(error.code).json({
                message: error.message
            });
        }
        return res.status(error.code).send(error);
    }
    catch (err) {
        console.log(err)
        res.status(500).send(err);
    }
};

module.exports = errorHandling;