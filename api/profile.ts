import express from "express";
import {conn, mysql} from "../dbconnect";
import { SigUpGet, Uppassword, Upuser } from "../model/signup-model";
import multer from "multer";
export const router = express.Router();


router.get("/:uid", (req, res) => {
    let uid = +req.params.uid;
    const sql ="SELECT * FROM image WHERE image.userid = ?";
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

router.get("/seuser/:uid", (req, res) => {
    let uid = +req.params.uid;
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
  import { getStorage,ref,getDownloadURL,uploadBytesResumable,deleteObject  } from "firebase/storage";
    import { ProfileGet } from "../model/profile-model";
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
router.post("/addimg", fileupload.diskLoader.single("file"), async (req, res) => {
    // ตรวจสอบว่ามีการอัปโหลดไฟล์หรือไม่
    if (!req.file) {
        // ถ้าไม่มีไฟล์อัปโหลด
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        // จัดการกับการอัปโหลดไฟล์ภาพ และข้อมูลผู้ใช้
        const { name, userid,description } = req.body; // รับข้อมูลจากฟอร์ม
        
        // Convert uid to integer
        const intUid = parseInt(userid, 10);
        
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
        let sql = "INSERT INTO `image`(`imageurl`,`description`,`name` , `userid`) VALUES (?, ?, ? , ?)";
        sql = mysql.format(sql, [   
            downloadUrl,
            description,
            name,
            intUid

        ]);
        conn.query(sql, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            return res.status(201).json({ affected_row: result.affectedRows });
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});
//เปลี่ยนรหัส
router.put("/uppass", async(req,res)=>{
    let uppass : Uppassword = req.body;
    let   sql = "update  `user` set `Password`=? where `Userid`=?";
        sql = mysql.format(sql , [
            uppass.password,
            uppass.uid,
        ]);
        conn.query(sql,(err,result)=>{
            if(err)throw err;
            res.status(200).json({
                affected_row : result.affectedRows,
                success: true
            });
        });
});
//เปลี่ยนรูป
router.put("/changeuser", fileupload.diskLoader.single("file"), async (req, res) => {
    // ตรวจสอบว่ามีการอัปโหลดไฟล์หรือไม่
    const storage = getStorage();
    if (!req.file) {
        // ถ้าไม่มีไฟล์อัปโหลด
        return res.status(400).json({ error: 'No file uploaded' });
    }
    
    try {
        // จัดการกับการอัปโหลดไฟล์ภาพ และข้อมูลผู้ใช้
        const { name , userid ,oldimg} = req.body; // รับข้อมูลจากฟอร์ม
        if(oldimg){
            const filePath = decodeURIComponent(oldimg.split('?')[0].split('/o/')[1]);
            const fileRef = ref(storage, filePath);
        deleteObject(fileRef).then(() => {
                    // ลบไฟล์สำเร็จ
                    console.log('ลบไฟล์สำเร็จ');
                })
                .catch((error) => {
                    // เกิดข้อผิดพลาด
                    console.error('เกิดข้อผิดพลาดในการลบไฟล์:', error);
                });
        }
        // Convert uid to integer
        const intUid = parseInt(userid, 10);
        
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
        let sql = "update `user` set `name`=?  ,`image`=? where `userid`=?";
        sql = mysql.format(sql, [
            name,
            downloadUrl,
            intUid,
        ]);
        conn.query(sql, (err, result) => {
            if (err) {
                console.error('Error inserting user:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }
            return res.status(201).json({ affected_row: result.affectedRows,success: true });
        });
    } catch (error) {
        console.error('Error uploading file:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
});

router.put("/upname", async(req,res)=>{
    let upuser : Upuser = req.body;
    let   sql = "update  `user` set `name`=? where `Userid`=?";
        sql = mysql.format(sql , [
            upuser.name,
            upuser.uid,
        ]);
        conn.query(sql,(err,result)=>{
            if(err)throw err;
            res.status(200).json({
                affected_row : result.affectedRows,
                success: true
            });
        });
});

router.delete("/deleteimg/:imgid/:uid", (req, res) => {
    let imgid = +req.params.imgid;
    let uid = +req.params.uid;
    let sql = "DELETE FROM vote WHERE imgid=? AND userid=?";
    sql = mysql.format(sql, [
        imgid,
        uid,
    ]);
    conn.query(sql, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).send("Internal Server Error");
        }
            sql = "DELETE FROM image WHERE imageid=? AND userid=?";
            sql = mysql.format(sql, [
                imgid,
                uid,
            ]);
            conn.query(sql, (err, result) => {
                if (err) {
                    console.error(err);
                    return res.status(500).send("Internal Server Error");
                }
                res.status(200).json({
                    affected_row : result.affectedRows,
                    success: true
                });
            });
    });
});

router.put("/Deleteurl", async(req,res)=>{
    const storage = getStorage();
    const { imgurl } = req.body; // รับข้อมูลจากฟอร์ม
    if(imgurl){
        const filePath = decodeURIComponent(imgurl.split('?')[0].split('/o/')[1]);
        const fileRef = ref(storage, filePath);
        deleteObject(fileRef).then(() => {
            res.status(200).json({
                success: true
            });
                console.log('ลบไฟล์สำเร็จ');
            })
            .catch((error) => {

                console.error('เกิดข้อผิดพลาดในการลบไฟล์:', error);
            });
    }
});