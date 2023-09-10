import express from 'express';
import multer from 'multer'
import { exec } from "child_process";
import fs from 'fs'
import { resolve } from 'path';
import cors from 'cors'
const app = express();
const port = 3002;
let inputFilename = "";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      inputFilename = file.originalname;
      return cb(null, file.originalname)
    }
  })
const upload = multer({ storage: storage });
app.use(express.json());
app.use(cors());
//Transcoder
const transcode = (inputFile, resolution)=> {
  return new Promise((resolve, reject) => {
    const outputFilename = `${inputFile}_${resolution.slice(-3)}.mp4`;
    const outputPath = `${outputFilename}`;

    const command = `ffmpeg -i uploads/${inputFile} -vf "scale=${resolution}" -c:a copy output/${outputFilename}`;

    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error converting to ${resolution}: ${error}`);
        reject(error);
      } else {
        console.log(`Converted to ${resolution}: ${outputPath}`);
        resolve(outputPath);
      }
    });
  });
}


const uploadFile = async (file) => {


//Get upload URL through lambda function
  const getUploadUrl = async (file) => {
    const res = await fetch(
      "https://vcw29hcgll.execute-api.ap-south-1.amazonaws.com/S3putURL",
      {
        method: "POST",
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
         
        }),
      }
    );
    const response = await res.json();
    // console.log(response.url);
    return response.url;
  };

//Upload file on bucket
const uploadUrl = await getUploadUrl(file);
  console.log(uploadUrl);
  
  await fetch(uploadUrl, {
    method: "PUT",
    body: file,
  });
};



//Read processed files from output folder and upload them on bucket
const uploadProccesedFile= async()=>{
    fs.readdir('output',(err,files)=>{
      if(err){
        res.status(500).json({message: "Error Reading directory output"})
      }
      files.forEach((file)=>{
        console.log(file);
        //uploading each file indivisually
        fs.readFile(`output/${file}`,async(err,data)=>{
          if(err){
              console.log(err)
          }
        const blob = new Blob([data], { type: 'video/mp4' });
        let fileToUpload = new File([blob], file.slice(0,-4), { type: 'video/mp4'});
        await uploadFile(fileToUpload)
      })

      //Delete
      fs.unlink(`output/${file}`,(err)=>{
        if(err)
        console.log("Error:",err);
        else{
          console.log("Successfully Deletedd the file");
        }
      })
      })
    })
}



app.post('/transcode', upload.single('video'), async(req, res) => {
  console.log(req.file);
  console.log(req.body);
  const file = req.file;
  try {
    await transcode(`${inputFilename}`,'1280:720'); // 720p
    await transcode(`${inputFilename}`, '854:480');  // 480p
    await transcode(`${inputFilename}`, '640:360');  // 360p

    
    // Delete the temporary file
    await uploadProccesedFile();
    fs.unlink(`uploads/${inputFilename}`,(err)=>{
      if(err)
      console.log("Error:",err);
      else{
        console.log("Successfully Deletedd Input files");
      }
    })
    res.status(200).json({message: 'Successfully added in bucket'})
  } catch (error) {
    console.error('Error:', error);
  }
})
app.listen(port,()=>{
    console.log(`Listening on ${port}`)
});

