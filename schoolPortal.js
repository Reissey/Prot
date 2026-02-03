const {Pool} = require('pg');
const path=require('path');
const jwt=require('jsonwebtoken');
const crypto=require('crypto');
const bcrypt=require('bcryptjs')
const ejs=require('ejs');
const express = require('express');
const session=require('express-session')
const app= express();
const cors=require('cors');
const {parse} = require('json2csv');
//const uuids= require('uuid');
const pdfDoc= require('pdfkit');
const { rejects, ok } = require('assert');
const { get } = require('http');
const bcryptjs = require('bcryptjs');
const memory=require('memory-cache');
const multer = require('multer');
const { emit } = require('process');
const paystack=require('paystack')('sk_test_396704ef8cb1fda1c5de2f7df32c1029860fb5da');;
const twilio=require('twilio');
const bodyParser=require('body-parser');
app.use('/uploads', express.static('uploads'));

app.post('/paystack-webhook', bodyParser.raw({type:'application/json'}), async(req, res) => {
    const signature = req.headers['x-paystack-signature'];
    const payload = JSON.stringify(req.body); 
    const secretKey = 'sk_test_396704ef8cb1fda1c5de2f7df32c1029860fb5da'
    const generatedSignature = crypto.createHmac('sha512', secretKey).update(req.body).digest('hex');

    if (generatedSignature !== signature) {
        return res.status(400).json({ message: 'Invalid signature' });
    }
    //console.log('Incoming webhook data',signature ,'and payload',payload);
    const event = JSON.parse(req.body.toString());
    console.log('Webhook event: '+event);
    const data=event.data;
    const classField = data.metadata.custom_fields.find(
  f => f.variable_name === 'student_class'
);

const termField = data.metadata.custom_fields.find(
  f => f.variable_name === 'term'
);

const studentClass = classField?.value;
const term = termField?.value;

console.log('Class:', studentClass);
console.log('Term:', term);
    switch (event.event) {
        case 'charge.success':
            case 'payment.success':
            console.log('Payment Successful:', event.data);
            const data = event.data;
            if(!data) return console.error('There is an issue logging paystack success');
            console.log('This is paystack payment receipt '+JSON.stringify(data));
            const datas=JSON.stringify(data);
            console.log('This is stringified data... '+datas);
           // console.log("Send this data: ",datas.customer.email);
           let emm=data.customer.email;
           console.log('This is email ...', emm);
            const rew=await pool.query('select * from serl where email=$1',[emm]);
            if(rew.rowCount === 0) return console.error('Error fetching student email...');
            console.log(rew.rows[0]);
            const theData=[
                `${rew.rows[0].firstname} __ ${rew.rows[0].lastname}`,
                data.customer.email,
                data.amount / 100,
                data.currency,
                data.paidAt,
                data.status,
                data.reference,
                data.authorization.channel,
                term,
                studentClass
            ]
            await pool.query('insert into feeReceipt(name,email,amount,currency,paidAt,status,reference,channel,term,class) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)',theData);
            console.log("Receipt data stored...");
            break;

        case 'charge.failed':
            console.log('Payment Failed:', event.data);
            break;

       // case 'payment.success':
         //   console.log('Payment Successful:', event.data);
            
           // break;

        case 'payment.failed':
            console.log('Payment Failed:', event.data);
            break;

        default:
            console.log('Unhandled event:', event.event);
    }
    
    res.status(200).json({ message: 'Webhook processed successfully' });
});
const SECRET='akbdvuipahalwbicuoaogd';
app.use(express.json())
app.use(cors())
app.use(
    session({
        name:'school.sid',
        resave:false,
        saveUninitialized:true,
        cookie:{
            maxAge:60 * 60 * 1000,
            httpOnly:true,
            sameSite:'lax'
        },
        secret:'passp'
    })
)

let pool= new Pool({
    host:'localhost',
    database:'erin',
    password:'passp',
    user:'erink',
    port:5432
})

app.use(express.urlencoded({extended:true}));
app.use(express.static(__dirname))

async function table() {
try{
await pool.connect();

let tab=`
create table if not exists serl(
id serial primary key,
FirstName varchar(50) not null,
LastName varchar(50)  not null,
age integer  not null,
email varchar(44) unique not null,
password varchar(60) not null,
role varchar(15) not null,
created_at timestamp default current_timestamp
)
`

let newTab=`
create table if not exists grades(
id serial primary key,
student_id integer references serl(id) on delete cascade,
subject varchar(30),
grades varchar(10),
created_at timestamp default current_timestamp
)
`
await pool.query(tab);
await pool.query(newTab);

console.log('Table Created Successfully')
    }catch(err){
        if(err) throw err
    }
}

app.use(express.static(path.join(__dirname,'static')))
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; 

  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.get('/teacher.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'teacher.html'));
});

app.get('/stud.html', authenticateToken, (req, res) => {
  res.sendFile(path.join(__dirname, 'static', 'stud.html'));
});

app.get('/',(req,res)=>{
res.sendFile(path.join(__dirname, 'static' ,'schoolPortal.html'))
})

app.get('/registration.html',(req,res)=>{
res.sendFile(path.join(__dirname ,'static','registration.html'))
})

app.post('/register',async (req,res)=>{
const {FirstName,LastName,email,age,password,role,subject,selClass} = req.body;
console.log(FirstName,LastName,email,age,password,role,subject,selClass)
let hashed= await bcrypt.hash(password,10)

let checkQuery={
    texts:'select * from serl where email=$1',
    vals:[email]
}

const {texts,vals}=checkQuery

const tot=await pool.query(texts,vals);
if(tot.rows.length === 'undefined'){
    console.log("Inaccurate response")
}
    else if(tot.rows.length >0) {
       return res.json({msg:"Email used already try a new one"})
    }else if(subject){
        console.log("Working for teacher login is perfect !")
        const querd={
            Qtext:'insert into serl(FirstName,LastName,age,email,password,role,subject) values($1,$2,$3,$4,$5,$6,$7)',
            Qvalues:[FirstName,LastName,age,email,hashed,role,subject]
        }        
        const {Qtext,Qvalues} = querd;

        await pool.query(Qtext,Qvalues);
       return res.json({redi:'/Login.html'})
    }
    else{
        const query={
            text:'insert into serl(FirstName,LastName,age,email,password,role,studClass) values($1,$2,$3,$4,$5,$6,$7)',
            values:[FirstName,LastName,age,email,hashed,role,selClass]
        }

        const {text,values} = query;
        console.log(LastName,FirstName,email,age,role)
        let enter=memory.put('regData',{LastName,FirstName,email,age,role,subject});
        console.log("the student data "+enter.LastName,enter.FirstName,enter.email,enter.age,enter.role,enter.subject);
        await pool.query(text,values);        
        return res.json({redi:'/Login.html'});
    }
         if(role === 'administrative'){
           return res.json({admin:'/admin'});
        }else if(role === 'pay'){
            return res.json({payIt:'/studentPayment.html'})
        }        
        else{
            return res.send('No page to load for you.')
        }
})

/**
 *     if(subject){
        memory.put(dats.uuid,{FirstName,LastName,age,email,password,role,subject});
        let loginData= memory.get(dats.uuid);
        console.log('This is login Data ',loginData.FirstName,loginData.LastName,loginData.age,loginData.email,loginData.role,loginData.subject); 
    }
    let loginData= memory.get(dats.uuid);
    console.log('This is login Data ',loginData.FirstName,loginData.LastName,loginData.age,loginData.email,loginData.role) 

    if(loginData){
        console.log('Working:')
    }        else{
        console.log('NOt working')
    }
 */

app.post('/login', async (req,res)=>{
const {FirstName,LastName,age,email,password,role,subject} = req.body;
console.log('Login Data: '+FirstName,LastName,age,email,password,role,subject);
if(FirstName && LastName && age && email && password && role){
 console.log('Good to go');
}

let resuls= await pool.query('select * from serl where email=$1',[email])
let dats= await resuls.rows[0];
console.log("This is " + dats);
if(!dats){
    return res.send('NO such email')
}

let passWordMatch= bcrypt.compareSync(password,dats.password);
if(passWordMatch){
    if(dats.role === 'student'){
      const token = jwt.sign(
    {
      id: dats._id,
      role: dats.role 
    },
    SECRET,
    { expiresIn: "40m" }
  );

  res.json({ token,role:"student" });
    }
    else if(dats.role === 'teacher' && dats.subject){
        const token = jwt.sign({
      id: dats._id,
      role: dats.role 
    },
    SECRET,
    { expiresIn: "40m" }
  );

  res.json({ token,role:'teacher' });
    }else if(dats.role === 'pay'){
        res.redirect('./stud.html');
    }
}else{
    return res.status(401).send('Error in Logging in ,No available page...')
}
})

app.get('/getFeeRec',async(req,res)=>{
    const getIt=await pool.query('select * from feeReceipt');
    console.log(getIt);
    res.json({data:getIt.rows});
});

// UNUSED ENDPOINT...
app.get('/user', (req, res) => {
    const regData=memory.get('regData');
    if (!regData) {
        return console.error("Error in /user");
    }

    res.json({
        firstName: regData.FirstName,
        lastName: regData.LastName,
        role: regData.role,
        email: regData.email
    });
    console.log('User Data...'+regData.FirstName,regData.LastName,regData.role,regData.email)
});

app.post('/loginTeacher',async(req,res)=>{
const {email}= req.body;
if(!email){
    return console.error("Teacher email not found!");
}else{
    const results= 'select * from serl where email=$1';
    const disp=await pool.query(results,[email]);
    console.log(disp.rows[0]);
    const sendIt=disp.rows[0]
    console.log(sendIt);
    if(!disp || disp.rowCount === 0){
        return console.error ("No teacher email of such was found.");
    }
    console.log(email)
     res.json({
        firstName: sendIt.firstname,
        lastName: sendIt.lastname,
        role: sendIt.role,
        email: sendIt.email,
        subject:sendIt.subject,
        msg:"Data for teacher info sent successfully."
    });
}
});

app.post('/loginStudent',async(req,res)=>{
    const {email} = req.body;
  if(!email){
    return console.log("No email Data found...");
  }  
  console.log(email);

  const selt='select * from serl where email=$1';
  const result=await pool.query(selt,[email]);
  if(result === undefined || result.rowCount === 0){
    console.error("No such email exists...")
  }else{
    const nes=result.rows[0];
    res.json({
        fName:nes.firstname,
        lName:nes.lastname,
        msg:"Data received successfully for student info."
    })
  }
});

app.get('/student',async (req,res)=>{
        const {email,year,term} = req.query;
        let logData=memory.get('loginData');
        console.log(year,term,email);
            console.log("I am working");
            let qrew={
                ttt:`select * from grades where email=$1 and term =$2 and year=$3`,
                vall:[email,term,year]
            };
            try{
            const {ttt,vall} = qrew;
            let shofs=await pool.query(ttt,vall)
            console.log('here is the table'+ shofs.rows);
            let remy= shofs.rows
            res.json({
                remy:remy
            });
            if(remy.length === 0){
            console.log("Rows are not available");
            }
            }catch(err){
         if(err){
            console.error("Error in sending student Data...");
            return res.json({StudentDataErr:'Error in retrieving student Data...'});
                }
}
});

    app.post('/submitGrade', async (req, res) => {
        try {
        const {subject,grade,term,year,email,seleClass,studentName} = req.body;
        console.log('Submit grade data: ',subject,grade,term,year,email,seleClass,studentName);
        if (!( subject && grade && term && year && seleClass)) {
            return res.json({
                imp:`Enter all fields for ${studentName} ,one or two informations are missing,Thank you`
            });
        }
        const check={
            checkTxt:'select * from grades where subject=$1 and term=$2 and year=$3 and studClass=$4 and email=$5',
            checkVal:[subject,term,year,seleClass,email]
        }
        const {checkTxt,checkVal} = check;
        const dart=await pool.query(checkTxt,checkVal);
        if(dart.rows.length >= 1){
            console.log("Student already has a grade.");
            return res.json({ErrMsg:`${studentName} already has a grade for ${subject}:${term}/${year}/${seleClass}`});
        }

        const query = {
            text: `INSERT INTO grades(subject, grades,term,year,email,studclass,studname) VALUES($1, $2, $3,$4,$5,$6,$7)`,
            values: [ subject, grade,term,year,email,seleClass,studentName]
        };
            await pool.query(query.text,query.values);
            return res.json({successful:"grade successfully uploaded."});
        } catch (error) {
            console.error("Error in submitting data from server ",error);
        }
    });    

    app.get('/getData',async(req,res)=>{
        const {selectedClass}= req.query;
        console.log('Get data product: ',selectedClass);
        const check={
            checkTxt:'select * from serl where role=$1 and studclass=$2',
            checkVal:['student',selectedClass]
        }
        const {checkTxt,checkVal} = check;
        let sendData=await pool.query(checkTxt,checkVal);
        res.json({data:sendData.rows});
    });

app.get('/getEmail',async(req,res)=>{
    const {email} = req.body;
    const check={
        checkText:'select * from serl where email=$1',
        checkVal:[email]
    }
    const {checkText,checkVal} = check;
    let son=await pool.query(checkText,checkVal);
    if(son.rows <1 ){
        console.log("Email not found")
        return res.json({EmailErr:'Email not found...'})
    }else if(son.rows.length > 1){
        console.log("Email already used...")
        return res.json({EmailDup:'Email already used...'})
    }else{
        console.log("Sent email successfully...")
        res.json({Email:son.rows});
    }
})

app.post('/verify-payment', async (req,res)=>{
    const {reference}=req.body
    console.log(reference)
     const verifyPayment=async()=>{
        return new Promise((resolve,reject)=>{
            paystack.transaction.verify(reference,(err,respond)=>{
                if(err){
                    reject("Error in payment verification...")
                }else{
                    resolve(respond.data)
                    console.log(respond.data);
                }
            })
        })
    }

 try{
    const logData=memory.get('loginData');
    const paymentResponse=await verifyPayment();
    if(!(paymentResponse.status === 'success')) return res.status(401).json({unsux:"Payment unsuccessful"}); 
    if(paymentResponse.status === 'success'){
        const now= new Date().toISOString();
        res.json({success:"Payment successful..."});
    }else{
        console.log("Payment response did not load...")
    }
     }
 catch(err){
    if(err){
        return res.status(404).json({ins:"Payment unsuccessful"})
    }
 }
 })

app.post('/verify-Feepayment', async (req,res)=>{
    const {reference,email}=req.body
    console.log(reference)
     const verifyPayment=async()=>{
        return new Promise((resolve,reject)=>{
            paystack.transaction.verify(reference,(err,respond)=>{
                if(err){
                    reject("Error in payment verification...")
                }else{
                    resolve(respond.data)
                    console.log('This is a resolved spot: ',respond.data);
                const classField = respond.data.metadata.custom_fields.find(
                    f => f.variable_name === 'student_class'
                        );

                const termField = respond.data.metadata.custom_fields.find(
                    f => f.variable_name === 'term'
                        );
               const feeField = respond.data.metadata.custom_fields.find(
                    f => f.variable_name === 'amount'
                        );
                const studentClass = classField?.value;
                const term = termField?.value;
                const fee= feeField?.value;
                if(!studentClass || !term || !fee) return console.error("Fees,class and term not available...")
                console.log("This is verify payment endpoint data: " + studentClass,term,fee);
 try{
    const loadPls=async()=>{
    const paymentResponse=await verifyPayment();
    if(!(paymentResponse.status === 'success')) return res.status(401).json({unsux:"Payment unsuccessful"}); 
    if(paymentResponse.status === 'success'){
        const now= new Date().toISOString();
        const want=await pool.query('select * from serl where email=$1',[email]);
        if(want.rows === 0){
            return console.error('No email of such exists.');
        }
        console.log(want);
    const rede=await pool.query('select 1 from feeReceipt where email=$1 and term=$2 and class=$3',[email,term,studentClass]);
    if(rede.rowCount > 0) return res.json({tret:`${rede.rows[0].firstname} ${rede.rows[0].lastname} already paid for ${term} ${studentClass}`}) 
        res.json({success:"Payment successful for school Fees...",neededData:want.rows[0]});
    }else{
        console.log("Payment response did not load...")
    }
    }
    loadPls();
   }
 catch(err){
    if(err){
        return res.status(404).json({ins:"Payment unsuccessful for school fees!"})
    }
 }
                }
            })
        })
    }
 })

 app.post('/getpromotion',async(req,res)=>{
    const {email , term, seleClass}=req.body;
    console.log(email,term,seleClass);
    try {
        if(term === '3rd Term'){
            const classes=['primary 1','primary 2','primary 3','primary 4','primary 5','primary 6'];
            const okk=await pool.query('select grades from grades where email = $1 and term=$2 and studclass=$3',[email,term,seleClass]);
            console.log(okk.rows);
            okk.rows.map(grade=>{
                console.log('The grade',grade);
            });
            let resi=okk.rows.filter(gra=>{
                gra === 'A' 
            }).length + 2
                        console.log('The result length',resi);
                let resB=okk.rows.filter(gra=>{
                gra === 'B' 
            }).length 
            console.log('The result length',resB);
                let resC=okk.rows.filter(gra=>{
                gra === 'C' 
            }).length 
                console.log('The result length',resC);
                let resD=okk.rows.filter(gra=>{
                gra === 'D' 
            }).length
                console.log('The result length',resD); 
                let resE=okk.rows.filter(gra=>{
                gra === 'E' 
            }).length
                console.log('The result length',resE); 
            let resF=okk.rows.filter(gra=>{
                gra === 'F' 
            }).length 
                console.log('The result length',resF);
            const esmo=classes.indexOf(seleClass) + 1;
            console.log("3rd term new class ",classes[esmo]);
            if( resi>  resF){
                console.log("Working third term endpoint...");
                const esmo=classes.indexOf(seleClass) + 1;
               // await pool.query('insert into grades(studClass,email)  values($1,$2)',[classes[esmo],email]);
                await pool.query('update serl set studclass=$1 where email=$2',[classes[esmo],email]);
                console.log(`Student passed: Promoted to next class:${classes[esmo]}`);
                return res.json({Success:"Student Passed",news:`Promoted to the next class:${classes[esmo]}`});
            }else{
               return res.json({msg:'Student did not meet up to school demands'});
            }
        }
    } catch (error) {
        console.error("Error in catching data ",error);
    }
 })

app.post('/mark-data',async(req,res)=>{
    const {email}=req.body
    await pool.query('update serl set paidAt=NOW() where email=$1',[email]);
    res.json({marked:"Marked successfully"});
    console.log('Updated time successfully...')        
})

app.get('/getFeeReceipt',async(req,res)=>{
    const {email,term,clas}= req.query;
    console.log(email);
    if(!email || !term || !clas) return console.error("Email not found...");
    const rew=await pool.query('select * from feeReceipt where email=$1 and term=$2 and class=$3',[email,term,clas] );
    console.log(rew.rows[0]);
    if(rew.rows.length === 0)return console.error("Error in fee payment receipt...");
    
const doc= new pdfDoc();
res.header('Content-type','application/pdf')
res.attachment(`School Fee Receipt_${email},${term},${rew.rows[0].name}`)
doc.pipe(res);

        doc.fontSize(20).text(`Name - ${rew.rows[0].name} `, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Term - ${term}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Email - ${email}`, {align: 'center'});
        doc.moveDown();

        doc.fontSize(12).text(`Amount - ${rew.rows[0].currency}${rew.rows[0].amount}`, {align: 'center'});
        doc.moveDown();

        doc.fontSize(12).text(`PaidAt - ${rew.rows[0].paidat}`, {align:'center'});
        doc.moveDown();

        doc.fontSize(12).text(`Status - ${rew.rows[0].status}`, {align:'center'});
        doc.moveDown();

        doc.fontSize(12).text(`Payment Reference - ${rew.rows[0].reference}`, {align:'center'});
        doc.moveDown();

        doc.end();
})

app.get('/check-access',async(req,res)=>{
    const logData=memory.get('loginData');
    console.log('this is check access email...',logData.email)
    const result = await pool.query(
  `SELECT paidAt FROM serl WHERE email = $1`,
  [logData.email]
);
console.log('check access the email is ...',logData.email);
if (result.rows[0].paidAt) {
  const paidAt = new Date(result.rows[0].paidAt);
  const now = new Date();
  const diffMs = now - paidAt;
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  console.log("Respect yourself check access...");
  if (diffDays <= 7) {
    return res.json({suc:'Worked',redirect:"/stud.html"});
  }
}
res.json({ Notallowed: 'Did not work' });
});
 
app.get('/grades',async(req,res)=>{
    const {email,year,term} = req.query;
    
    let queree= {
        ins:`select * from grades where email=$1 and year=$2 and term=$3`,
        val:[email,year,term]
    }

    const {ins,val} = queree;
    let results = await pool.query(ins,val)
    let display= results.rows;

    if(display.length === 0){
        return res.status(404).send("Exercise Patience your results have not yet been uploaded")
    }else{
        console.log(display)
    }
    const ert={
        ertText:'select * from serl where email=$1',
        ertVal:[email]
    }
    let okay=await pool.query(ert.ertText,ert.ertVal);
    

const doc= new pdfDoc();
res.header('Content-type','application/pdf')
res.attachment(`grades_${email},${year},${okay.rows[0].firstname},${okay.rows[0].lastname}`)
doc.pipe(res);

        doc.fontSize(20).text(`Grades Report - ${term} ${year} ${okay.rows[0].firstname} ${okay.rows[0].lastname}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Term: ${term}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(14).text('Course | Grade', { bold: true });
        display.forEach((row) => {
            doc.text(`${row.subject} | ${row.grades}`);
        });
        doc.end();
})

app.get('/getTranscript',async(req,res)=>{
    const {email} = req.query;
    const results=await pool.query('select * from grades where email=$1',[email]);
    console.log(results);
    const display=results.rows
    console.log('Display...',display);
    const doc= new pdfDoc();
    res.header('Content-type','application/pdf')
    res.attachment(`transcript_${email}_${year}_${okay.results[0].firstname}_${okay.results[0].lastname}`)
    doc.pipe(res);

        doc.fontSize(20).text(`Grades Report - ${term} ${year}`, { align: 'center' });
        doc.moveDown();

        doc.fontSize(12).text(`Student ID: ${term}`, { align: 'left' });
        doc.moveDown();

        doc.fontSize(14).text('Course | Grade', { bold: true });
        display.forEach((row) => {
            doc.text(`${row.subject} | ${row.grades}`);
        });
        doc.end();
})

app.get('/displayTrans',async(req,res)=>{
    try {
        const {email} = req.query;
        console.log("Transcript email: ",email);
        const reso=await pool.query('select * from grades where email=$1',[email]);
        console.log(reso,'reso working...');
        res.json({reso:reso});
    } catch (error) {
        console.error("Error fetching transcript ",error)
    }
})

app.post('/adminInfo',async(req,res)=>{
    const {textt}=req.body;
    if(!textt){
        return console.error("Text for information not available");
    }
            const query = {
            text: `INSERT INTO informations(info) VALUES($1)`,
            values: [ textt]
        };
            await pool.query(query.text,query.values);    
            res.json({msg:"Data sent curiously..."});
})

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ storage });

app.post('/uploadImage', upload.single('image'), async (req, res) => {
  const imagePath = req.file.filename;

  await pool.query(
    'INSERT INTO images(path) VALUES ($1)',
    [imagePath]
  );

  res.json({ message: 'Image uploaded', imagePath });
});

app.get('/images', async (req, res) => {
  const { rows } = await pool.query('SELECT path FROM images');
  res.json(rows);
});

app.get('/infor',async(req,res)=>{
    const {rows} = await pool.query('select info from informations');
    res.json(rows);
})
app.post('/logout',(req,res)=>{
req.session.destroy(err=>{
    if(err) throw err + console.log("Error in logging out")
        else{
    console.log("Everywhere good")
        }
})

res.clearCookie('connect.sid')

res.redirect('/Login.html')
})

async function RunAppL(){
    try{
        await table()
    }catch(err){
    console.error('Error ,Connect again' + err.stack)
    }
    }
    RunAppL().catch(err=> console.error('Could not load '))
    app.set('view engine','ejs');
    app.set('views',path.join(__dirname ,'views'))
 
 let port=3000
 app.listen(port).on('error',(err)=>{
    console.error('Error Over here' + err)
    process.exit(1)
 });