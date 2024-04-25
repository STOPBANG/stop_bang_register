const authModel = require("../models/authModel");
const jwt = require("jsonwebtoken");
const mailer = require("../modules/mailer");
const db = require("../config/db");
const _makeCertificationKey = () => {
    var key = ""; // 인증키

    // 난수 생성 후 인증키로 활용
    for (var i = 0; i < 5; i++) {
        key = key + Math.floor(Math.random() * (10 - 0));
    }

    return key;
};

function checkUsernameExists(username, responseToClient) {
    authModel.getUserByUsername(username, (user) => {
        if (user[0].length !== 0) return responseToClient(true);

        authModel.getAgentByUsername(username, (user) => {
            responseToClient(user[0].length !== 0);
        });
    });
}

function checkPasswordCorrect(password) {
    const uppercaseRegex = /[A-Z]/;
    const lowercaseRegex = /[a-z]/;
    const numberRegex = /[0-9]/;
    const specialCharRegex = /[!@#$%^&*]/;

    return (
        uppercaseRegex.test(password) &&
        lowercaseRegex.test(password) &&
        numberRegex.test(password) &&
        specialCharRegex.test(password)
    );
}

module.exports = {

    certification: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email || typeof email !== "string") {
                return res.status(400).send("Invalid Param");
            }

            const code = _makeCertificationKey();
            const [rows, fields] = await db.query(
                `SELECT * FROM certification WHERE email='${email}'`
            );
            if (rows.length > 0) {
                await db.query(
                    `UPDATE certification SET code='${code}' WHERE email='${email}'`
                );
            } else {
                await db.query("INSERT INTO certification (email, code) VALUE(?, ?);", [
                    email,
                    code,
                ]);
            }
            await mailer.sendEmail(email, code);
            res.send("Success!");
        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error");
        }
    },

    certificationCheck : async (req, res) => {
        try {
            const { email, code } = req.body;

            if (
                !email ||
                typeof email !== "string" ||
                !code ||
                typeof code !== "string"
            ) {
                return res.status(400).send("Invalid Param");
            }

            const [rows, fields] = await db.query(
                `SELECT * FROM certification WHERE email='${email}' AND code='${code}'`
            );
            if (!rows[0]) {
                return res.status(404).send("Data Not Found.");
            }

            res.send("Success!");
        } catch (error) {
            console.log(error);
            res.status(500).send("Server Error");
        }
    },

    registerView: (req, res) => {
        res.render("users/register");
    },

    registerResident: async (req, res) => {
        // Check if required fields are missing
        const body = req.body;

        if (!checkPasswordCorrect(body.password))
            return res.render('notFound.ejs', {message: "비밀번호 제약을 확인해주세요"});

        checkUsernameExists(body.username, async (usernameExists) => {
            if (usernameExists) {
                return res.render('notFound.ejs', {message: "이미 사용중인 아이디입니다."});
            }

            try {
                // Save new user information to the database
                const userId = await authModel.registerResident(req.body);

                if (!userId) {
                    return res.render('notFound.ejs', {message: "회원가입 실패"});
                } else {
                    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY);
                    // Store user's userId in the cookie upon successful registration
                    res.cookie("authToken", token, {
                        maxAge: 86400_000,
                        httpOnly: true,
                    });
                    res.cookie("userType", 1, {
                        maxAge: 86400_000,
                        httpOnly: true,
                    }).redirect("/");
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("Server Error");
            }
        });
    },

    registerResidentView: (req, res) => {
        res.render("users/resident/register");
    },

    registerAgent: async (req, res) => {
        // Check if required fields are missing
        const body = req.body;

        if (!checkPasswordCorrect(body.password))
            return res.render('notFound.ejs', {message: "비밀번호 제약을 확인해주세요"});

        checkUsernameExists(body.username, async (usernameExists) => {
            if (usernameExists) {
                return res.render('notFound.ejs', {message: "이미 사용중인 아이디입니다."});
            }

            try {
                // Save new agent information to the database
                const userId = await authModel.registerAgent(req.body);

                if (!userId) {
                    return res.render('notFound.ejs', {message: "회원가입 실패"});
                } else {
                    const token = jwt.sign({ userId }, process.env.JWT_SECRET_KEY);
                    // Store agent's userId in the cookie upon successful registration
                    res.cookie("authToken", token, {
                        maxAge: 86400_000,
                        httpOnly: true,
                    });
                    res.cookie("userType", 0, {
                        maxAge: 86400_000,
                        httpOnly: true,
                    }).redirect("/");
                }
            } catch (error) {
                console.error(error);
                res.status(500).send("Server Error");
            }
        });
    },

    registerAgentView: (req, res) => {
        res.render("users/agent/register");
    },
};











