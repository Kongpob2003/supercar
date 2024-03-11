import express from "express";
import { conn, mysql } from "../dbconnect";
export const router = express.Router();

router.get("/yesterday", (req, res) => {
  conn.query(
    `
        SELECT  
            image.*,
            RANK() OVER (ORDER BY SUM(vote.score) DESC) AS rankingyesterday
        FROM 
            image,vote
        WHERE  
            image.imageid = vote.imgid
        AND
            DATE(vote.vateDate) = CURDATE() - INTERVAL 1 DAY
        GROUP BY 
            image.imageid, image.imageurl, image.name, image.score, image.Userid 
        ORDER BY 
            image.score DESC
        LIMIT 0, 10 `,
    (err, result, fields) => {
      if (result && result.length > 0) {
        // ส่ง response กลับด้วยข้อมูลผู้ใช้
        res.json(result);
      } else {
        // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
        res.json({
          success: false,
        });
      }
    }
  );
});

router.get("/today", (req, res) => {
  conn.query(
    `
        SELECT  
            image.*,
            RANK() OVER (ORDER BY SUM(vote.score) DESC) AS rankingtoday
        FROM 
            image,vote
        WHERE  
            image.imageid = vote.imgid
        GROUP BY 
            image.imageid, image.imageurl, image.name, image.score, image.Userid
        ORDER BY 
            image.score DESC
        LIMIT 0, 10 `,
    (err, result, fields) => {
      if (result && result.length > 0) {
        // ส่ง response กลับด้วยข้อมูลผู้ใช้
        res.json(result);
      } else {
        // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
        res.json({
          success: false,
        });
      }
    }
  );
});

router.get("/graph/:uid", (req, res) => {
  let uid = +req.params.uid;
  const sql = `
  SELECT 
  GROUP_CONCAT(voteDate ORDER BY voteDate ASC) AS voteDate,
  GROUP_CONCAT(totalScore ORDER BY voteDate ASC) AS totalScore,
  imgid,
  name,
  imageurl
  FROM (
      SELECT 
      DATE(vateDate) AS voteDate,
      500 + SUM(vote.score) AS totalScore,
      vote.imgid,
      image.name,
      image.imageurl
      FROM vote,image
      WHERE vote.imgid = image.imageid
         AND DATE(vateDate) >= CURDATE() - INTERVAL 7 DAY
      AND DATE(vateDate) < CURDATE()
      AND vote.userid = ?
      GROUP BY DATE(vateDate), vote.imgid
      ) AS subquery
      GROUP BY imgid
      ORDER BY imgid, MAX(voteDate) ASC
    `;
  conn.query(sql, [uid], (err, result, fields) => {
    if (result && result.length > 0) {
      // ส่ง response กลับด้วยข้อมูลผู้ใช้
      res.json(result);
    } else {
      // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
      res.json({
        success: false,
      });
    }
  });
});