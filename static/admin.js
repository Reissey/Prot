const form=document.getElementById('form');
form.addEventListener('submit',async(e)=>{
    e.preventDefault();
    const textt=document.getElementById('spaw').value;
    const res=await fetch('/adminInfo',{
        method:"POST",
        headers:{
            'Content-type':'application/json'
        },
        body:JSON.stringify({
            textt
        })
    })
    if(!res.ok){
        return console.error("Error sending data to server...");
    }
    console.log("Data sent successfully...");
    console.log(res.json());
    textt.value='';
})

const form2=document.getElementById('form2');
form2.addEventListener('submit', async (e) => {
  e.preventDefault();

  const formData = new FormData(form2);

  const res = await fetch('/uploadImage', {
    method: 'POST',
    body: formData
  });

  const data = await res.json();
  console.log(data);
})

fetch('/images')
  .then(res => res.json())
  .then(images => {
    images.forEach(img => {
      const image = document.createElement('img');
      image.src = `/uploads/${img.path}`;
      document.body.appendChild(image);
    });
  });

  const InfoStuff=async()=>{
  const response=await fetch('/infor');
  if(!response.ok){
   return console.error("Error fetching information from server...");
  }
  const actRes= await response.json();
  console.log(actRes);
  let count;
  actRes.forEach((f)=>{
    count=1;
    const showIt=document.getElementById('iftp');
    const p=document.createElement("p");
    p.textContent=` ${f.info}`
    showIt.appendChild(p);
    console.log(f.info);
  })
  //showIt.te
  }
  InfoStuff();

  const dataIt = async () => {
  try {
    const resp = await fetch('/getFeeRec');

    if (!resp.ok) {
      throw new Error("Error fetching fee receipt from server");
    }

    const rows = await resp.json();
    console.log(rows);

    const tbody = document.querySelector("tbody");
    tbody.innerHTML = ""; // clear old rows

    rows.forEach(row => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${row.name}</td>
        <td>${row.class}</td>
        <td>${row.term}</td>
        <td>${new Date(row.paidat).toLocaleDateString()}</td>
        <td>${row.email}</td>
        <td>${row.reference}</td>
        <td>₦${Number(row.amount).toLocaleString()}</td>
        <td>
          <span class="status ${row.status.toLowerCase()}">
            ${row.status}
          </span>
        </td>
      `;

      tbody.appendChild(tr);
    });

  } catch (err) {
    console.error(err.message);
  }
};

// load immediately
dataIt();

  