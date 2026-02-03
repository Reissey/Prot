

        const role=document.getElementById('role');
        const subj=document.getElementById('subj').style.display='none';
        let sle=document.getElementById('selClass').style.display='none';
        role.addEventListener('change',()=>{
            if(document.getElementById('role').value === 'teacher'){
                document.getElementById('subj').style.display='block';
                document.getElementById('selClass').style.display='none';
            }else{
                document.getElementById('subj').style.display='none';
                document.getElementById('selClass').style.display='block';
            }
        });
        const subject=document.getElementById('subject').value

        const form=document.getElementById('form')
        form.addEventListener('submit',async(e)=>{
                    try {
                    e.preventDefault();
                    const email=document.getElementById('email').value;
                    const role=document.getElementById('role').value.trim().toLowerCase();
                    const selClass=document.getElementById('selClass').value;
                    const FirstName=document.getElementById('name').value;
                    const LastName=document.getElementById('Lname').value;
                    const age=document.getElementById('numbe').value;
                    const password=document.getElementById('password').value;
                    const subject=document.getElementById('subject').value;
                    console.log(selClass || 'Nothing to display');
                    if(selClass == ''){
                        console.log("No selected class.")
                    }
        if(!(email || FirstName||LastName||age||password)){
            console.log("Fill every fields");
            return document.getElementById('pump').style.display='block';
        }else if(role === 'student' && (selClass === '' || selClass === undefined)){
            document.getElementById('pump').style.display='block';
            setTimeout(()=>{
                document.getElementById('pump').style.display='none';
            },5000);
        }else if(role === 'teacher' && (subject === '' || subject === undefined)){
            document.getElementById('pump').style.display='block';
            setTimeout(()=>{
                document.getElementById('pump').style.display='none';
            },5000);
        }else{
            console.log("Email stored in localStorage successfully");
            localStorage.setItem('email',email);
            const animo=await fetch('/register',{
                method:"POST",
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify({
                    email:email,
                    selClass:selClass,
                    age:age,
                    password:password,
                    subject:subject,
                    FirstName:FirstName,
                    LastName:LastName,
                    role:role
                })
            })
            if(!animo.ok){
              console.error("Error in registration");
              setTimeout(()=>{
                    document.getElementById('ret').textContent='Error processing registration,Please wait for page reload.';                         
                    window.location.reload();
              },5000);
              return;
        }
        const fine=await animo.json();
        console.log(fine);
        if(fine.msg){
            document.getElementById('ret').textContent='This email has already been used.'
            setTimeout(()=>{
                document.getElementById('ret').textContent=''
            },5000);
            return console.log("Multiple email")
        }
        else if(fine.red){
            return window.location.href=fine.red;
        }
        else if(fine.redi){
            return window.location.href=fine.redi;
        }else{
            console.log("Nothing to display")
        }
        console.log("Registration successful");   
        }
                    } catch (error) {
                        console.error("Error in sending registration Data...",error);
                    }
        })