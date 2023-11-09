const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcrypt");
const { default: isEmail } = require("validator/lib/isEmail");

const userSchema = new mongoose.Schema({
    email: {
        type: String,
        unique: true,
        required: [true, 'please enter an email'],
        validate: {
            validator: validator.isEmail,
            message: '{VALUE} is not a valid email',
            isAsync: false
        }
    },
    contact: {
        type: Number,
        required: [true, 'Please enter contact'],
        unique: true,
        validate: {
            validator: function (value) {
                if (value < 1000000000 || value > 9999999999) {
                    throw new mongoose.Error.ValidationError(this, {
                        message: 'Invalid mobile number',
                        path: 'contact'
                    });
                }
            }
        }
    },
    password: {
        type: String,
        required: [true, 'please enter password'],
        validate: {
            validator: function (value) {
                if (!(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/.test(value))) {
                    throw new mongoose.Error.ValidationError(this, {
                        message: "enter strong password",
                        path: 'password'
                    })
                }
            }
        }
    },
    userType: {
        type: String,
        required: [true, 'please select your user type']
    },
    name: {
        type: String,
        required: [true, 'please enter your name']
    },
    personId: {
        type: String,
        required: [true, 'please enter id']
    },
    personIdType: {
        type: String,
        required: [true, 'please enter id']
    },

    department: {
        type: String,
        default: ""
        // required: [true,'please enter your department']
    },
    hostel: {
        type: String,
        default: ""
    },
    dateOfBirth: {
        type: Date,
        default: null
    },
    degree: {
        type: String,
        default: ""
    },
    admissionDate: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        default: "pending"
    },
    permanentAddress: {
        type: String,
        require: true
    },
    userPower: {
        type: String,
        default: ""
    }
})

const gatepassSchema = new mongoose.Schema({
    applicantId: {

    },
    userType: {
        type: String,
        required: [true, 'please select your user type']
    },
    name: {
        type: String,
        required: [true, 'please enter your name']
    },
    personId: {
        type: String,
        required: [true, 'please enter id']
    },
    contact: {
        type: Number,
        // required: [true,'please enter number']
    },
    hostel: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        default: "pending"
    },
    purpose: {
        type: String,
        default: ""
    },
    entryDate: {
        type: Date,
        default: null
    },
    exitDate: {
        type: Date,
        default: null
    },
    applyDate: {
        type: Date,
        default: null
    },
    actionDate: {
        type: Date,
        default: null
    },
    actionBy: {

    },
    inDate: {
        type: Date,
        default: null
    },
    outDate: {
        type: Date,
        default: null
    },
    message: {
        type: String,
        default: ""
    }
})

userSchema.pre('save', async function (next) {
    const salt = await bcrypt.genSalt();
    this.password = await bcrypt.hash(this.password, salt);
    next();
})

const user = new mongoose.model("USER", userSchema)
const gatepass = new mongoose.model("GATEPASS", gatepassSchema)
module.exports = { user, gatepass }