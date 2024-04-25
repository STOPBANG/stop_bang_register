const dotenv = require("dotenv");
dotenv.config();

const express = require("express");
const cookieParser = require("cookie-parser");
const app = express();
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(cookieParser(process.env.COOKIE_SECRET_KEY));

app.set("port", process.env.PORT || 3000);
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 회원가입
const registerController = require("./controllers/registerController");
app.post("/certification", registerController.certification);
app.post("/certificationCheck", registerController.certificationCheck);
app.post("/register/resident", registerController.registerResident);
app.post("/register/agent", registerController.registerAgent);
app.get("/phoneNumber/:ra_regno", registerController.getPhoneNumber);

app.listen(app.get("port"), () => {
    console.log(app.get("port"), "번 포트에게 대기중");
});
