const jwt = require("jsonwebtoken");
const mailer = require("../modules/mailer");
const {httpRequest} = require('../utils/httpRequest');

module.exports = {

  certification: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        return res.status(400).send("Invalid Param");
      }

      /* msa */
      const postOptions = {
        host: 'stop_bang_auth_DB',
        port: process.env.PORT,
        path: `/db/cert/create`,
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const requestBody = req.body;
      httpRequest(postOptions, requestBody)
        .then(res => {
          mailer.sendEmail(res.body.email, res.body.code);
        });

      res.send("Success!");
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  },

  certificationCheck: async (req, res) => {
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

      /* msa */
      const postOptions = {
        host: 'stop_bang_auth_DB',
        port: process.env.PORT,
        path: `/db/cert/compare`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      };

      const requestBody = req.body;
      httpRequest(postOptions, requestBody)
        .then(res => {
          if (!res) {
            return res.status(404).send("Data Not Found.");
          }
        })

      res.send("Success!");
    } catch (error) {
      console.log(error);
      res.status(500).send("Server Error");
    }
  },

  registerResident: async (req, res) => {
    /* msa */
    const postOptions = {
      host: 'stop_bang_auth_DB',
      port: process.env.PORT,
      path: `/db/resident/create`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const requestBody = req.body;
    httpRequest(postOptions, requestBody)
      .then(response => {
        const userId = response.body.id;
        // Error during registration
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
          })
          .redirect("/");
        }
      });
  },

  registerAgent: async (req, res) => {
    /* msa */
    const postOptions = {
      host: 'stop_bang_auth_DB',
      port: process.env.PORT,
      path: `/db/agent/create`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    };

    const requestBody = req.body;
    httpRequest(postOptions, requestBody)
      .then(response => {
        const userId = response.body.id;
        if (!userId) {
          return res.render('notFound.ejs', { message: "회원가입 실패" });
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
      });
  },
  
  getPhoneNumber: async (req, res) => {
    const ra_regno = req.params.ra_regno;
    /* msa */
    // 서울시 공공데이터 api
    const apiResponse = await fetch(
      `http://openapi.seoul.go.kr:8088/${process.env.API_KEY}/json/landBizInfo/1/1000`
    );
    const js = await apiResponse.json();
    const agentPublicData = js.landBizInfo.row;

    for(const row of agentPublicData) {
      if(row.SYS_REGNO === ra_regno || row.RA_REGNO === ra_regno) {
        return res.json({phoneNumber: row.TELNO});
      }
    }
    return res.json({phoneNumber: ''});
  }
};











