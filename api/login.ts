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
// router.post("/signup",(req,res)=>{
//     let signup : SigUpGet = req.body;
//     let sql = "INSERT INTO  user(Email,Password,name,type) VALUES (?,?,?,?) ";
//     sql = mysql.format(sql,[
        
//         signup.Email,
//         signup.password,
//         signup.name,
//         signup.type
        
//     ]);
//     conn.query(sql,(err,result)=>{
//         if(err)throw err;
//         res.status(201).json({affected_row : result.affectedRows });
//     });

// });

const firebaseConfig = {
    apiKey: "AIzaSyCPywBr9BTiwgQtbCPCceO_tGfIAyR3PZU",
    authDomain: "supercarvote.firebaseapp.com",
    projectId: "supercarvote",
    storageBucket: "supercarvote.appspot.com",
    messagingSenderId: "119432468202",
    appId: "1:119432468202:web:09e8163e7de452f922a993",
    measurementId: "G-2W8K0TVKZ0"
  };
  //import libs
  import { initializeApp } from "firebase/app";
  import { getStorage,ref,getDownloadURL,uploadBytesResumable } from "firebase/storage";
import multer from "multer";
  // strat connecting to firebase
  initializeApp(firebaseConfig);
  //create object from filebase storage
  const storage = getStorage();


class FileMiddleware {
    filename = "";
    // create multer object to save file in disk
    public readonly diskLoader = multer({
        // diskStorage = save to memmory
      storage: multer.memoryStorage(),
      // limit size
      limits: {
        fileSize: 67108864, // 64 MByte
      },
    });
  }
// post upload
const fileupload = new FileMiddleware();
router.post("/signup", fileupload.diskLoader.single("file"), async (req, res) => {
    // ตรวจสอบว่ามีการอัปโหลดไฟล์หรือไม่
    if (!req.file) {
        // ถ้าไม่มีไฟล์อัปโหลด
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        // จัดการกับการอัปโหลดไฟล์ภาพ และข้อมูลผู้ใช้
        const {Email, password , name, type } = req.body; // รับข้อมูลจากฟอร์ม
        
        // Create file name
        const filename = Math.round(Math.random() * 10000) + ".png";
        // Set name to be saved on Firebase storage
        const storageRef = ref(storage, "images/" + filename);
        // Set details of the file to be uploaded
        const metadata ={
            contentType : req.file.mimetype
        }
        // Upload to storage
        const snapshot = await uploadBytesResumable(storageRef, req.file.buffer, metadata);
        // Get URL image from storage
        const downloadUrl = await getDownloadURL(snapshot.ref);
        
        // Insert user data into database
        let sql = "INSERT INTO `user`(`Email`, `name`, `Password`, `type`, `image`) VALUES (?, ?, ?, ?, ?)";
        sql = mysql.format(sql, [
            Email,
            name,
            password,
            type,
            downloadUrl // Use the downloadUrl as the image path
        ]);
        conn.query(sql, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ error: 'Internal server errorrrr' });
            }
            return res.status(201).json({ affected_row: result.affectedRows });
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});