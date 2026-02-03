//const doc = require("pdfkit");

const btn = document.getElementById('btn');
const reference = 'payment_verification_' + Math.random().toString(36).substr(2, 9).replace(/[^a-zA-Z0-9]/g, '');
const amount = 1500;

btn.addEventListener('click', async () => {
  try {

    const response = await fetch('/loginStudent');
    if (!response.ok) {
      console.log("Error fetching login data");
      return;
    }

    const data = await response.json();
    const email = data.email;

    console.log("Email fetched:", email);

    const handler = PaystackPop.setup({
      key: 'pk_test_9ba3a415c4b1c7fdf53881fde1abaff29082117a',
      email: email,
      amount: amount,
      currency: 'NGN',
      ref: reference,
      callback: function (response) {
        console.log(reference);
        fetch('/verify-payment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ reference })
        })
        .then(res => {
          if (!res.ok) {
            console.log("Response not available...for payment...");
          }
          return res.json();
        })
          .catch(err => {
          console.log("Error in payment frontend ", err);
        });
      },
      onClose: function () {
        console.log('Transaction cancelled or closed');
      }
    });
    handler.openIframe();
  } catch (err) {
    console.log("Unexpected error:", err);
  }
});

const loadIt=async()=>{
  const getIt=await fetch("/loginStudent");
  if(!getIt.ok){
    return console.error("error in logging out student response.");
  }
  const retd=await getIt.json();
  console.log(retd);
  const fname=document.getElementById("fname").textContent=retd.firstName + ' ' + retd.lastName;
  //const lname=document.getElementById('lname').textContent=retd.lastName;
  console.log(fname,lname);
}
loadIt();

/**
                .then(data => {
          console.log(data);
          if (data.success) {
            console.log("This is the success message...", data.success);
            fetch('/mark-data',{
              method:"POST",
              headers:{
                'Content-Type':'application/json'
              },
              body:JSON.stringify({email:data.email})
            }).then(response=>{
              console.log("Email for markData sent...",email);
              return response.json();
            }).then(res=>{
              if(res.marked){
                  fetch('/check-access')
    .then(response => response.json())
    .then(data => {
      if (data.suc && data.redirect) {
        setTimeout(()=>{
          window.location.href = data.redirect;
        });
      } else {
        console.log("Still not allowed even after marking...");
      }
    })
              }
            })
          }else{
            console.log("Error in receiving success...");
          }
        })
 */