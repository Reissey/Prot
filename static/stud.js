const fname = document.getElementById('fname');
const lname = document.getElementById('lname');
const form = document.getElementById('form');
let fUsed;
let nUsed;
const loginData=fetch('/loginStudent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body:JSON.stringify({
    email:localStorage.getItem('studentEmail'),
    msg:"Student email received successfully."
  })
})
  .then(loginData => {
    if (!loginData.ok) throw new Error('Failed to fetch student');
    return loginData.json();
  })
  .then(data => {
    let studentInfo={
      firstName:data.fName,
      lastName:data.lName
    }
    console.log(`${studentInfo.firstName} and ${studentInfo.lastName}`)
    fname.textContent = data.fName;
    lname.textContent = data.lName;
    const text = document.getElementById('welc').textContent;
    if (window.speechSynthesis) {
      const speech = new SpeechSynthesisUtterance(text);
      speech.pitch = 0.8;
      speech.rate = 0.8;
      speech.volume = 1;
      window.speechSynthesis.speak(speech);
    }
  })
  .catch(err => console.error(err));

const itsTime = async () => {
  const email = document.getElementById('email').value;
  const year = document.getElementById('year').value;
  const term = document.getElementById('term').value;

  const response = await fetch(`/student?email=${email}&year=${year}&term=${term}`);
  if(!response.ok){
    return console.error("Error returning response");
  }
  const dataRes = await response.json();
  console.log(dataRes);
  if(!dataRes){
    return console.log("Empty response");
  }
  if (!dataRes.remy || dataRes.remy.length === 0) {
    document.getElementById('inf').textContent =
      'Your results have not been uploaded yet,Please exercise patience and wait till result upload.Thank you';
    setTimeout(() => (document.getElementById('inf').textContent = ''), 5000);
    return;
  }

  const table = document.getElementById('open');
  table.innerHTML = '';

  dataRes.remy.forEach(sub => {
    const row = document.createElement('tr');

    const fields = [
      sub.subject,
      sub.grades,
      sub.year,
      sub.term,
      sub.studclass
    ];

    fields.forEach(val => {
      const td = document.createElement('td');
      td.textContent = val;
      row.appendChild(td);
    });

    table.appendChild(row);
  });

  localStorage.setItem('email', email);
  localStorage.setItem('year', year);
  localStorage.setItem('term', term);

  const pdfRes = await fetch(`/grades?email=${email}&year=${year}&term=${term}`);
  if (!pdfRes.ok) return console.error('PDF download failed');

  const blob = await pdfRes.blob();
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `grades_${email}_${year}_${term}.pdf`;
  a.click();
  a.remove();
};

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const reference =
  'payment_verification_' +
  Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, '');

const amount = 1500;
const email = document.getElementById('email').value;
console.log(email);
  try {
    const handler = PaystackPop.setup({
      key: 'pk_test_9ba3a415c4b1c7fdf53881fde1abaff29082117a',
      email:email,
      amount:amount * 100,
      currency: 'NGN',
      ref: reference,
      metadata:{
        custom_fields:[
          {
            display_name:'Student_Name',
            variable_name:'Student_Name',
            variable:`${studentInfo.firstName} ${studentInfo.lastName}`
          }
        ]
      },
      callback: function (response) {
         fetch('/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({reference:response.reference })
        }).then(res=>{
            console.log(res);
            if(!res.ok){
                return console.error("Error verifying payment...");
            }
            return res.json();
        }).then(result=>{
            console.log(result);
            if(result.success){
                itsTime();
            }else{
                console.error("Error in displaying result...");
            }
        })
      },

      onClose:function() {
        console.log('Payment closed');
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Submission error:', error);
  }
});
const currentYear = new Date().getFullYear();
const yearSelect = document.getElementById('year');

[currentYear - 3, currentYear - 2, currentYear - 1, currentYear].forEach(y => {
  const option = document.createElement('option');
  option.value = y;
  option.textContent = y;
  yearSelect.appendChild(option);
});

//PAY SCHOOL FEE SECTION...
let payFeesBtn=document.getElementById('feeForm');
payFeesBtn.addEventListener('submit',async(e)=>{
  e.preventDefault();
  const emailFee=document.getElementById('feeEmail').value;
  const classFee=document.getElementById('feeSelect').value;
  const TermFee=document.getElementById('feeTerm').value;
  const reference =
  'SchoolFee_payment_verification_' +
  Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, '');
  let fee;
console.log(email);
  try {
    fee=100000;
    const handler = PaystackPop.setup({
      key: 'pk_test_9ba3a415c4b1c7fdf53881fde1abaff29082117a',
      email:emailFee,
      amount:fee * 100,
      currency: 'NGN',
      ref: reference,
        metadata: {
    custom_fields: [
      {
        display_name: "Class",
        variable_name: "student_class",
        value: classFee
      },
      {
        display_name: "Term",
        variable_name: "term",
        value: TermFee
      },
     {
        display_name: "Amount",
        variable_name: "amount",
        value: fee
      }
    ]
  },
      callback: function (response) {
         fetch('/verify-Feepayment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({reference:response.reference,email:localStorage.getItem('studentEmail') })
        }).then(res=>{
            console.log(res);
            if(!res.ok){
              return console.error("Error verifying payment...");
            }
            return res.json();
        }).then(result=>{
            console.log(result);
            if(result.success){
                //itsTime();
                document.getElementById('feeInfo').textContent=`${result.success}`;
            }else if(result.tret){
              console.log(result.tret);
              document.getElementById('feeInfo').textContent=`${result.tret} ,Please select the desired unpaid class or term, will reload after 10 seconds`;
              window.location.reload();
            }
            else{
                console.error("Error in displaying result...");
            }
        })
      },

      onClose:function() {
        console.log('Payment closed');
      }
    });

    handler.openIframe();
  } catch (error) {
    console.error('Submission error:', error);
  }

  setTimeout(async()=>{ 
  const getReceipt=await fetch(`/getFeeReceipt?email=${emailFee}&term=${TermFee}&clas=${classFee}`);
  if(!getReceipt.ok) return console.error(`Error getting ${emailFee} receipt data...`);
  console.log(getReceipt);
  const blob= await getReceipt.blob();
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  a.href=url;
  a.download=`School Fee Receipt ${emailFee}_${TermFee}_${classFee}.pdf`;
  //document.body.appendChild(a);
  a.click();
  a.remove();
  //URL.revokeObjectURL()
  },100000);
});

  const token = localStorage.getItem('authToken');
  if (!token) {
    window.location.href = '/login.html';
  } else {
    fetch('/stud.html', {
      headers: {
        'Authorization': 'Bearer ' + token
      }
    }).then(res => {
      if (res.status === 403) {
        alert('Session expired. Please log in again.');
        localStorage.removeItem('authToken'); 
        localStorage.removeItem('studentEmail');
        window.location.href = '/Login.html';
      }
    });
  }

  console.log(JSON.stringify(PaystackPop)+ "This is it...");

  fetch('/images')
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const image = document.createElement('img');
      image.src = `/uploads/${img.path}`;
      document.body.appendChild(image);
    });
  });