import express, { Express } from "express";
import { conn , mysql} from "../dbconnect";
import { SigUpGet } from "../model/signup-model";

export const router = express.Router();
router.get("/", (req, res) => {
    conn.query('select * from user', (err, result, fields)=>{
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

  router.get("/:uid", (req, res) => {
    let uid = req.params.uid;
    const sql ="SELECT * FROM user WHERE Userid = ?";
    conn.query(sql, [uid], (err, result, fields) => {
            // ตรวจสอบว่ามีผลลัพธ์หรือไม่
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



router.get("/:Email/:password", (req ,res)=>{
    let email = req.params.Email;
    let password = req.params.password;
    const sql = "SELECT * FROM user WHERE Email = ? AND Password = ?";
    conn.query(sql,[email,password],(err,result,fields)=>{
        if (result && result.length > 0 ){
            res.json(result);
        } else {
            res.json({
                success : false,
            });
        }
    })
});
router.post("/signup",(req,res)=>{
    let signup : SigUpGet = req.body;
    let sql = "INSERT INTO  user(Email,Password,name,type) VALUES (?,?,?,?) ";
    sql = mysql.format(sql,[
        
        signup.Email,
        signup.password,
        signup.name,
        signup.type
        
    ]);
    conn.query(sql,(err,result)=>{
        if(err)throw err;
        res.status(201).json({affected_row : result.affectedRows });
    });

});