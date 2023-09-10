import fs from 'fs'


const getUploadUrl = async (file) => {
    const res = await fetch(
      "https://vcw29hcgll.execute-api.ap-south-1.amazonaws.com/S3upload",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          title: "HELLO",
          description: "Srajan"
        }),
      }
    );
    const response = await res.json();
    console.log(response);
    return response.url;
  };
  const uploadFile = async (file) => {
    const uploadUrl = await getUploadUrl(file);
    console.log(uploadUrl);
    
    await fetch(uploadUrl, {
      method: "PUT",
      body: file,
    });
  };
fs.readFile('output/video-1694264932198-ou2.mp4_640:360.mp4',async(err,data)=>{
    if(err){
        console.log(err)
    }
    
  const blob = new Blob([data], { type: 'video/mp4' });
  const file = new File([blob], 'test2', { type: 'video/mp4'});
  uploadFile(file);
})
