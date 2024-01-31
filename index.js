const express = require('express');
const app = express();
const port = process.env.PORT || 5000;
const cors = require('cors');
const multer = require('multer');
const ExcelJS = require('exceljs');
const path = require('path');
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());










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
    const teacherID = req.body.teacherID
    // console.log
    const collection = db.collection('Class')
    const p = await collection.find({ "teacherID": teacherID }).toArray()

    res.json(p)
})
//==================================================================== end ============================================================




//============================================================ Post Create ============================================================
app.post('/makePost', async(req, res)=>{
    console.log("HK called")
    const value = req.body
    console.log("HK: ", value)
    // res.json({"HK":"HK"})
    const collection = db.collection("Post")
    const p = await collection.insertOne(value)
    console.log("Inserted!!!") 
    return res.json(p) 
})
//==================================================================== end ============================================================



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
    res.send("HK");
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
    const collection = db.collection('Questions')
    const p = await collection.find(value).toArray()
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




//============================================================ listning while accesing route ============================================================
app.listen(port, () => {
    console.log("HK running from port no:", port);
});
//============================================================ end ============================================================
