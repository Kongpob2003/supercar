import express from "express";
import { conn, mysql, queryAsync } from "../dbconnect";
import { VoteItem } from "../model/top10-model";
export const router = express.Router();

router.get("/yesterday", (req, res) => {
  conn.query(
    `
        SELECT  
            image.*,
            ROW_NUMBER() OVER (ORDER BY SUM(vote.score) DESC) AS rankingyesterday
        FROM 
            image,vote
        WHERE  
            image.imageid = vote.imgid
        AND
            DATE(vote.vateDate) < CURDATE()
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
            ROW_NUMBER() OVER (ORDER BY SUM(vote.score) DESC) AS rankingtoday
        FROM 
            image
        INNER JOIN  
            vote ON image.imageid = vote.imgid
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

// router.get("/graph/:uid", (req, res) => {
//   let uid = +req.params.uid;
//   const sql = `
//   SELECT 
//   GROUP_CONCAT(voteDate ORDER BY voteDate ASC) AS voteDate,
//   GROUP_CONCAT(totalScore ORDER BY voteDate ASC) AS totalScore,
//   imgid,
//   name,
//   imageurl
//   FROM (
//       SELECT 
//       DATE(vateDate) AS voteDate,
//       500 + SUM(vote.score) AS totalScore,
//       vote.imgid,
//       image.name,
//       image.imageurl
//       FROM vote,image
//       WHERE vote.imgid = image.imageid
//          AND DATE(vateDate) >= CURDATE() - INTERVAL 7 DAY
//       AND vote.userid = ?
//       GROUP BY DATE(vateDate), vote.imgid
//       ) AS subquery
//       GROUP BY imgid
//       ORDER BY imgid, MAX(voteDate) ASC
//     `;
//   conn.query(sql, [uid], (err, result, fields) => {
//     if (result && result.length > 0) {
//       // ส่ง response กลับด้วยข้อมูลผู้ใช้
//       res.json(result);
//     } else {
//       // ถ้าไม่พบผู้ใช้, ส่ง response กลับเป็น { success: false }
//       res.json({
//         success: false,
//       });
//     }
//   });
// });
const formatDate = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

router.get("/graph/:uid", async (req, res) => {
  const uid = +req.params.uid;
  let day7: any = {};
  // เริ่มที่วันที่ 6 ถึง 0 (แทน 7 วันย้อนหลัง)
  for (let i = 6; i >= 0; i--) {
    let sql: string;
    if (i === 0) {
      sql = mysql.format(
        `SELECT 
          image.imageid,
          image.name,
          DATE(CURDATE()) AS voteDate,
          SUM(vote.score) as score,
          image.imageurl
        FROM vote, image
        WHERE vote.imgid = image.imageid
        AND vote.userid = ?
        GROUP BY imageid, DATE(CURDATE()), image.imageurl, image.name`,
        [uid]
      );
    } else {
      sql = mysql.format(
        `SELECT 
        image.imageid,
        image.name,
        DATE(DATE_SUB(NOW(), INTERVAL ? DAY)) AS voteDate,
        SUM(CASE WHEN DATE(vateDate) <= CURDATE() - INTERVAL ? DAY THEN vote.score ELSE 0 END) AS score,
        image.imageurl
      FROM vote, image
      WHERE vote.imgid = image.imageid
      AND vote.userid = ?
      GROUP BY imageid, DATE(DATE_SUB(NOW(), INTERVAL ? DAY)), image.imageurl, image.name`,
        [i, i, uid, i]
      );
    }

    let results: any[] = await queryAsync(sql) as unknown[];
    // ตรวจสอบผลลัพธ์ที่ได้จากการสอบถามฐานข้อมูล
    for (let result of results) {
      // ตรวจสอบว่าออบเจกต์ที่มี key เป็นวันที่หรือยัง
      if (day7[result.imageid]) {
        // ถ้ามีอยู่แล้ว เพิ่มค่าเสียงเข้าไปในออบเจกต์ที่มีอยู่แล้ว
        day7[result.imageid].voteDate += ',' + formatDate(new Date(result.voteDate));
        day7[result.imageid].score += ',' + result.score;
      } else {
        // ถ้ายังไม่มีให้สร้าง key ใหม่และใส่ค่าเสียงเข้าไป
        day7[result.imageid] = {
          imageid: result.imageid,
          name : result.name,
          voteDate: formatDate(new Date(result.voteDate)),
          score: result.score.toString(),
          imageurl: result.imageurl,
        };
      }
    }
  }

  // แปลง object ให้กลายเป็น array ของค่าเสียง
  let day7Array = Object.values(day7);
  // ลบด้วยนะจ้ะ  อีเหี้ยคิว
  res.json(day7Array);
});


