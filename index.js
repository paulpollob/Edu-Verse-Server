const fs = require('fs');
const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const storage = multer.memoryStorage();
const storage2 = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./files");
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now();
      cb(null, uniqueSuffix + file.originalname);
    },
  });
const upload = multer({ storage: storage });
const upld = multer({storage:storage2});


app.use(cors());
app.use(express.json());
app.use("/files",express.static("files"))




//============================================================ to send mails to students ============================================================
const send = async (emails, title, code, room) => {
    let rslt = "not ok"

    await fetch('https://api.emailjs.com/api/v1.0/email/send',
        {
            method: 'POST',
            body: JSON.stringify({
                "service_id": "edu-verse",
                "template_id": "template_jiovo57",
                "user_id": "kmWdTfS7tU0MKREkO",
                "accessToken": "70TzxP98ihMR81DGB6tlf",
                "template_params": {
                    "subject": "subject",
                    "message": "You have been added to a new class \n" +
                        "Classname: " + title +
                        "\nCourse Code: " + code +
                        "\nRoom no: " + room,
                    "toEmail": emails,
                    "toName": "student",
                    "fromName": "Edu-verse",
                },
            }),
            headers: { 'Content-Type': 'application/json' },
        })
        .then(res => rslt = res.statusText)
    return rslt

}
//============================================================ end ============================================================








// app.post('/sendMails', async(req, res) =>
// {
//   const {subject, message, toEmail, toName, fromName} = req.body
//   // console.log("HK sendmails route", toEmail, toName, subject, body)
//   const rslt = await send(subject, message, toEmail, toName, fromName)
//   console.log("HK rslt: ")
//   res.json({"rslt": rslt})
// })













//============================================================ mongodb connection ============================================================
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { getApp } = require('firebase/app');
const uri = "mongodb+srv://eduversepro:eduversePro23@cluster0.8mutjrz.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});
let db;

async function run() {
    try {
        await client.connect();
        // Send a ping to confirm a successful connection
        db = await client.db("prisma")
        db.command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);
//============================================================== end ============================================================













//============================================================ for inserting single value =======================================================================
const insertOne = async (data) => {

}
//=============================================================== end ========================================================================================================================








//============================================================ for inserting single value =======================================================================
const insert = async(collectionName, value) => {
    const collection = db.collection(collectionName)
    const p = await collection.insertOne(value)
    return (JSON.stringify(p))
}
//=============================================================== end ========================================================================================================================

















//====================================================== for inserting classroom data while creating classroom ======================================================
app.post('/insert', upload.single('file'), async (req, res) => {
    const { image, title, code, section, room, teacherID } = req.body
    let data = "";


    if (!req.file) {
        console.log("HK no file")
        return res.status(400).json({ error: 'No file provided' });
    }

    console.log("HK file")


    const workbook = await new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer).then(async () => {
        // Process the Excel file here
        const sheet = await workbook.getWorksheet(1);
        const emails = [];

        let emailRow = -1
        await sheet.eachRow(async (row, rownmbr) => {
            await (emailRow == -1) && row.eachCell({ includeEmpty: true }, (cell) => {
                if ((cell.value?.toString()?.toLowerCase() == "email")) emailRow = cell._address[0]
            });

            await emails.push(sheet.getCell(emailRow + rownmbr).value.text);
        });

        data = { image, title, code, section, room, teacherID, emails }


        const rslt = await send(emails, title, code, room)
        // console.log("HK: rslt: ", rslt)
        // console.log("HK: data: ", data)
    });
    const collection = db.collection('Class')
    const p = await collection.insertOne(data)
    return res.send(JSON.stringify(p))
})
//============================================================ end ============================================================












//============================================================== get classroom data ============================================================
app.post('/getAll', async (req, res) => {
    console.log("getall called")
    const teacherID = req.body.teacherID
    // console.log
    const collection = db.collection('Class')
    const p = await collection.find({ "teacherID": teacherID }).toArray()

    res.json(p)
})
//==================================================================== end ============================================================




//============================================================ Post Create ============================================================
app.post('/makePost', async(req, res)=>{
    console.log("makePost called")
    const value = req.body  
    const collection = db.collection("Post")
    const p = await collection.insertOne(value)
    console.log("Inserted!!!") 
    return res.json(p) 
})
//==================================================================== end ============================================================



//============================================================ add User ============================================================
app.post('/addUser', async(req, res)=>{
    console.log("addUser called")
    const value = req.body  
    const { _id,name,email,password,phone,occupation,img } = value
    const data = { _id, name, email, phone, img }
    const collection = db.collection(occupation)
    const p = await collection.insertOne(value)
    console.log("Inserted!!!") 
    return res.json(value) 
})
//==================================================================== end ============================================================







//============================================================ add User ============================================================
app.post('/getStClasses', async(req, res)=>{
    console.log("getStClasses called")
    const email = req.body.email  
    console.log("email is: ", email)
    if(email == null) return res.json({}) 
    const collection = db.collection('Class')


    const data = await collection.find( 
        {
            emails: { $all: [email] }
        }
       ).toArray()
     
    console.log("got!!!", data) 
    return res.json(data) 
})
//==================================================================== end ============================================================





//============================================================ add User ============================================================
app.post('/getUserInfo', async(req, res)=>{
    console.log("getUserInfo called")
    const value = req.body  
    console.log("HK: ", value)
    const { _id, cllctn } = value 
    if(!cllctn){console.log("HK no collection found!!");return res.json(cllctn)}
    const collection = db.collection(cllctn)
    const p = await collection.findOne({"_id":  _id})
    console.log("got!!!", p) 
    return res.json(p) 
})
//================================================================== end ============================================================


//====================================================== add quiz points to User ====================================================
app.post('/addQuizPoints', async(req, res)=>{
    console.log("addQuizPoints called")
    const { _id, occupation, value } = req.body
    console.log(_id, occupation, value)
    if(!occupation){console.log("HK no collection found!!");return res.json(cllctn)}
    const collection = db.collection(occupation)
    // const p = await collection.findOne({"_id": _id})
    console.log("hk OK")
    const rslt = collection.updateOne(
        { _id: _id },
        { $push: { quizRslt:value } }
     ); 
    return res.json(rslt) 
})
//================================================================== end ============================================================




//============================================================ comment create ============================================================
app.post('/makeComment', async(req, res)=>
{
    const _id = req.body._id
    const cmnt = req.body.cmnt
    const userID = req.body.userID
    const time = req.body.time
    const occupation = req.body.occupation
    const value = {_id, cmnt, userID, occupation, time}
    console.log("HK: ", value)
    const collection = db.collection("Post")
    // collection.updateOne()
    const rslt = collection.updateOne(
        { _id: new ObjectId(_id) },
        { $push: { comment: value } }
     );
     return res.json(rslt)
})
//============================================================ end ============================================================




//============================================================ get comments ============================================================
app.post('/getComments', async(req, res)=>
{
    const _id = req.body   
    const collection = db.collection("Post")
    // collection.updateOne()
    const rslt = collection.updateOne(
        { _id: new ObjectId(_id) },
        { $push: { comment: value } }
     );
     return res.json(rslt)
})
//============================================================ end ============================================================



app.post('/getPost', async (req, res) => {
    const classID = req.body.classID
    // console.log
    const collection = db.collection('Post')
    const p = await collection.find({ "classID": classID }).toArray()

    res.json(p)
})



//============================================================ root ============================================================
app.get('/', (req, res) => {
    res.send("Welcome to Eduverse");
});
//=============================================================== end =========================================================



//============================================================ temp ============================================================
app.post('/hk', (req, res) => {
    res.json({ hk: req.body });
});
//============================================================ end ============================================================


//============================================================ upload ============================================================
app.post('/upload', (req, res) => {
    console.log("HK req:", req.body);
    res.json({ message: req.body });
});
//============================================================ end ============================================================


//================================================== question upload to mongodb ============================================================
app.post('/createQuestions', async (req, res) => {
    const value = req.body
    const Questions = await db.collection('Questions')
    const p = await Questions.insertOne(value)
    console.log("HK data: ", p)
    res.json(p)
})
//============================================================ end ============================================================




//============================================================ quiz from mongodb ============================================================
app.post('/getQuiz', async (req, res) => {

    const value = req.body
    console.log("HK: ", value)
    const collection = db.collection(value.type)
    const p = await collection.find({"classID":value.classID}).toArray()
    console.log("HK: ", value, " hk ", p)
    res.json(p)
})
//============================================================ end ============================================================










//============================================================ upload excel get emails ============================================================
app.post('/Check', upload.single('file'), async (req, res) => {
    if (!req.file) {
        console.log("HK no file")
        return res.status(400).json({ error: 'No file provided' });
    }


    const workbook = await new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer).then(async () => {
        const sheet = await workbook.getWorksheet(1);
        const emails = [];

        let emailRow = -1
        await sheet.eachRow(async (row, rownmbr) => {
            const rowData = [];
            await (emailRow == -1) && row.eachCell({ includeEmpty: true }, (cell) => {
                if ((cell.value?.toString()?.toLowerCase() == "email")) emailRow = cell._address[0]
            });

            await emails.push(sheet.getCell(emailRow + rownmbr).value.text);
        });

        const rslt = send(emails)

        res.json({ emails, rslt });
    });
});
//============================================================ end ============================================================






//============================================================ Create Assignment ============================================================
app.post('/CreateAssignment',  async (req, res) => {
    console.log("create assignments")
    const value = req.body 
    const Questions = await db.collection('Asignments')
    const p = await Questions.insertOne(value) 
   

    res.json({"status": "200", "response": p})


});
//============================================================ end ============================================================


//============================================================ Create Assignment ============================================================
app.post('/storeFile', upld.single('file'),  async (req, res) => {
    console.log("create assignments", req.file, req.body)
    const value = req.body 
    value.fileName = req.file.path

    const Questions = await db.collection('AsignmentsAnswer')
    const p = await Questions.insertOne(value) 
   

    res.json({"status": "200", "response": p})


});
//============================================================ end ============================================================







//============================================================ Get Ans ============================================================
app.post('/getAssignmentAns',  async (req, res) => {

    console.log("getAssignmentsAns called")
    const value = req.body  

    const cl = await db.collection('AsignmentsAnswer')
    const p = await cl.find(value).toArray()
    console.log("HK ", value, " HK ", p)

    res.json({"status": "200", "response": p})


});
//============================================================ end ============================================================






//============================================================ listning while accesing route ============================================================
app.listen(port, () => {
    console.log("Eduverse running from port no:", port);
});
//============================================================ end ============================================================


 