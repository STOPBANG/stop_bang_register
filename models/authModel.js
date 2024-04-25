//db정보받기
const db = require("../config/db.js");
const bcrypt = require("bcrypt");
const sql = require("../config/db");
const saltRounds = 10;

module.exports = {
    getAgentByUsername: async (username, result) => {
        try {
            let rawQuery = `SELECT a_username FROM agent WHERE a_username = ?`;
            const res = await db.query(rawQuery, [username]);
            result(res);
        } catch (error) {
            console.log("🚀 ~ error:", error);
            result(null, error);
        }
    },

    registerResident: async (params, result) => {
        try {
            // 비밀번호 암호화해서 db에 저장하기
            const passwordHash = await bcrypt.hash(params.password, saltRounds);

            // 새로운 사용자 생성하기
            let rawQuery = `
            INSERT INTO resident (r_username, r_password, r_phone, r_realname, r_email, r_birth) 
            VALUES (?, ?, ?, ?, ?, ?);
            `;
            await db.query(rawQuery, [
                params.username,
                passwordHash,
                params.phone,
                params.realname,
                params.email,
                params.birth !== '' ? params.birth : null
            ]);

            // 새로 생성된 사용자 id 가져오기
            return result(params.username);
        } catch (err) {
            console.error("🚀 ~ err:", err);
            return result(null);
        }
    },

    registerAgent: async (params, result) => {
        try {
            // 비밀번호 암호화해서 db에 저장하기
            const passwordHash = await bcrypt.hash(params.password, saltRounds);

            // 새로운 공인중개사 생성하기
            let rawQuery = `
            INSERT INTO agent (a_username, a_password, a_realname, a_email, a_phone, agentList_ra_regno) 
            VALUES (?, ?, ?, ?, ?, ?); 
            `;
            await db.query(rawQuery, [
                params.username,
                passwordHash,
                params.realname,
                params.email,
                params.phone,
                params.agentList_ra_regno,
            ]);
            return result(params.username);
        } catch (err) {
            console.error("🚀 ~ err:", err);
            return result(null);
        }
    },

    getUserByUsername: async (username, result) => {
        try {
            const res = await sql.query(
                `SELECT r_username FROM resident WHERE r_username = ?`,
                [username]
            );
            result(res);
        } catch (error) {
            console.log("🚀 ~ getUserByUsername error:", error);
            result(null, error);
        }
    },
};