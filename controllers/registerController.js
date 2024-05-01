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
        const userInfo = response.body;
        // Error during registration
        if (!userInfo) {
          return res.json({message: "회원가입 실패"});
        } else {
          const token = jwt.sign(userInfo, process.env.JWT_SECRET_KEY);
          // Store user's userId in the cookie upon successful registration
          res.cookie("authToken", token, {
            maxAge: 86400_000,
            httpOnly: true,
          });
          res.cookie("userType", 1, {
            maxAge: 86400_000,
            httpOnly: true,
          });
          res.redirect('/');
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
    // agent_list_ra_regno에는 공공데이터의 SYS_REGNO를 대입
    // 서울시 공공데이터 api
    let startIndex = 1;
    let hasMoreData = true;
    while(hasMoreData) {
      const apiResponse = await fetch(
          `http://openapi.seoul.go.kr:8088/${process.env.API_KEY}/json/landBizInfo/${startIndex}/${startIndex+999}/`
      );
      const js = await apiResponse.json();
      if(js.landBizInfo && js.landBizInfo.row) {
        const agentPublicData = js.landBizInfo.row;

        for(const row of agentPublicData) {
          if(row.RA_REGNO === requestBody.agentList_ra_regno) {
            requestBody.agentList_ra_regno = row.SYS_REGNO;
            hasMoreData = false;
            break;
          }
        }
        startIndex += 1000;
      } else {
        hasMoreData = false;
      }
    }

    httpRequest(postOptions, requestBody)
        .then(response => {
          const userInfo = response.body;
          if (!userInfo) {
            res.json({ message: "회원가입 실패" });
          } else {
            console.log("회원 가입 성공");
            const token = jwt.sign(userInfo, process.env.JWT_SECRET_KEY);
            // Store user's userId in the cookie upon successful registration
            res.cookie("authToken", token, {
              maxAge: 86400_000,
              httpOnly: true,
            });
            res.cookie("userType", 0, {
              maxAge: 86400_000,
              httpOnly: true,
            });
            res.redirect('/');
          }
        });
  },
  
  getPhoneNumber: async (req, res) => {
    const ra_regno = req.params.ra_regno;
    console.log(ra_regno);
    /* msa */
    // 서울시 공공데이터 api
    let startIndex = 1;
    let phoneNumber = '';
    let hasMoreData = true;
    while(hasMoreData) {
      const apiResponse = await fetch(
        `http://openapi.seoul.go.kr:8088/${process.env.API_KEY}/json/landBizInfo/${startIndex}/${startIndex+999}/`
      );
      const js = await apiResponse.json();
      if(js.landBizInfo && js.landBizInfo.row) {
        const agentPublicData = js.landBizInfo.row;

        for(const row of agentPublicData) {
          if(row.RA_REGNO === ra_regno) {
            phoneNumber = row.TELNO;
            hasMoreData = false;
            break;
          }
        }
        startIndex += 1000;
      } else {
        hasMoreData = false;
      }
    }

    if (phoneNumber !== '') {
      res.json({phoneNumber: phoneNumber});
    } else {
      res.json({phoneNumber: ''});
    }
  }
};











