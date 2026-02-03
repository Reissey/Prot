        const email=document.getElementById('email').value;
        localStorage.setItem('email',email);
        const role=document.getElementById('role');
        const subj=document.getElementById('subj')
        subj.style.display='none';
        role.addEventListener('input',()=>{
            if(role.value === 'teacher'){
                subj.style.display='block';
            }else{
                subj.style.display='none';
            }
        });

        document.getElementById('form').addEventListener('submit',async(e)=>{
            e.preventDefault();
            const FirstName=document.getElementById('name').value;
            const age=document.getElementById('number').value;
            const email=document.getElementById('email').value;
            const LastName=document.getElementById('Lname').value;
            const password=document.getElementById('password').value;
            const role=document.getElementById('role').value.trim().toLowerCase();
            const subject=document.getElementById('subject').value.trim().toLowerCase() || 'NAT';
            if(role === 'teacher'){
              localStorage.setItem('teacherEmail',email);
            }else{
                localStorage.setItem('studentEmail',email)
            }
                const loginDetails= await fetch('/login',{
                    method:"POST",
                    headers:{
                        'Content-type':'application/json'
                        },
                    body:JSON.stringify({
                        FirstName,age,email,LastName,password,role,subject
                })
            });
                    if(!loginDetails.ok){
                        document.getElementById('informationAA').textContent='Error getting response,This user is not registered.'
                       console.error('Error gettig response from login');
                       setTimeout(()=>{
                            window.location.reload();
                       },5000);
                       return;
                    }
            const loginResponse=await loginDetails.json();
            console.log("Response from login "+loginResponse);
            if(loginResponse.role === 'student'){
                window.location.href='/stud.html';
                console.log(`This is your response: ${loginResponse.token} ${loginResponse.role}`)
                localStorage.setItem('authToken',loginResponse.token);
            }
            else if(loginResponse.role === 'teacher'){
                window.location.href='/teacher.html';
                console.log("This is your response ID: " + loginResponse.token + loginResponse.role);
                localStorage.setItem('authToken',loginResponse.token);
            }
        })