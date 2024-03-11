import express from "express";
import {conn, mysql, queryAsync} from "../dbconnect";
import { Img } from "../model/img-model";

export const router = express.Router();

router.get("/", (req, res) => {
    conn.query('select * from image', (err, result, fields)=>{
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

  router.put("/update/:imgid", async(req,res)=>{
    const imgid = +req.params.imgid;
    let img : Img = req.body;
        let sql = "update  `image` set `score`=? where `imageid`=?";
        sql = mysql.format(sql , [
            img.score,
            imgid
        ]);
        //5.Send Query for updata
        conn.query(sql,(err,result)=>{
            if(err)throw err;
            res.status(200).json({
                affected_row : result.affectedRows
            });
        });
});