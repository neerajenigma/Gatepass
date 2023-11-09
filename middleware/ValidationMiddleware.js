const nonEmptyStringRegex = /^.+$/;
const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,15}$/
const validationMiddleware = async (req, res, next) => {
    console.log("-------entered in validation middleware---------");
    let errors = {};
    if ("name" in req.body && (!nonEmptyStringRegex.test(req.body.name))) {
        errors["name"] = "invalid name";
    }
    if ("email" in req.body && (!emailRegex.test(req.body.email))) {
        errors["email"] = "invalid email";
    }
    if ("password" in req.body && (!passwordRegex.test(req.body.password))) {
        errors["password"] = "invalid password";
    }
    if ("userType" in req.body && (!(["outsider", "student", "security", "admin", "caretaker"].includes(req.body.userType)))) {
        errors["userType"] = "invalid user type"
    }
    if ("personIdType" in req.body && (!(["panCard", "voterId", "universityId", "aadharCard"].includes(req.body.personIdType)))) {
        errors["personIdType"] = "invalid person id type"
    }
    if ("personId" in req.body && (!(nonEmptyStringRegex.test(req.body.personId)))) {
        errors["personId"] = "invalid person id type"
    }
    if ("contact" in req.body && (req.body.contact < 1000000000 || req.body.contact > 9999999999)) {
        errors["contact"] = "invalid contact"
    }
    if ("hostel" in req.body && (!(["vidhyanchal", "trikuta", "nilgiri", "none", "basholi", "outsider"].includes(req.body.hostel)))) {
        errors["hostel"] = "invalid hostel"
    }
    if ("dateOfBirth" in req.body && ((!(nonEmptyStringRegex.test(req.body.dateOfBirth))) || (req.body.dateOfBirth.substring(1, 10) > new Date().toISOString().substring(1, 10)))) {
        errors["dateOfBirth"] = "invalid date of birth"
    }
    if ("permanentAddress" in req.body && (!(nonEmptyStringRegex.test(req.body.permanentAddress)))) {
        errors["permanentAddress"] = "invalid person permanent Address"
    }
    if ("entryDate" in req.body && ((!(nonEmptyStringRegex.test(req.body.entryDate))) || (req.body.entryDate < new Date().toISOString().substring(1, 10)))) {
        errors["entryDate"] = "invalid entry date"
    }
    if ("exitDate" in req.body && ((!(nonEmptyStringRegex.test(req.body.exitDate))) || (req.body.exitDate < new Date().toISOString().substring(1, 10)))) {
        errors["exitDate"] = "invalid exit date"
    }
    if ("admissionDate" in req.body && ((!(nonEmptyStringRegex.test(req.body.admissionDate))) || (req.body.admissionDate.substring(1, 10) > new Date().toISOString().substring(1, 10)))) {
        errors["admissionDate"] = "invalid admission Date"
    }
    if (Object.keys(errors).length !== 0) {
        return res.status(400).send({ ...errors, validationError: true });
    }
    next();
};

module.exports = validationMiddleware
