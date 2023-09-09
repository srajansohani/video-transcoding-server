import express from 'express';
import ffmpeg from 'fluent-ffmpeg'
import multer from 'multer'
import { Readable } from 'stream';
import { exec } from "child_process";
import fs from 'fs'
const app = express();
const port = 3002;
let inputFilename = "";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      return cb(null, 'uploads')
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + file.originalname
      inputFilename = file.fieldname + '-' + uniqueSuffix;
      return cb(null, file.fieldname + '-' + uniqueSuffix)
    }
  })
  
const upload = multer({ storage: storage });
app.use(express.json());
const transcode = (inputFile, outputDirectory, resolution)=> {
  return new Promise((resolve, reject) => {
    const outputFilename = `${inputFile}_${resolution}.mp4`;
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
const heavyProcess = ()=>{
  return new Promise((resolve,reject)=>{
    setTimeout(()=>{
      resolve("Holded you for 10seconds");
    },10000)
  });
}
app.post('/transcode', upload.single('video'), async(req, res) => {
  console.log(req.file);
  console.log(req.body);
  try {
    
    await transcode(`${inputFilename}`, 'output','1280:720'); // 720p
    await transcode(`${inputFilename}`, 'output', '854:480');  // 480p
    await transcode(`${inputFilename}`, 'output', '640:360');  // 360p
    
    //Delete the temporary file
    fs.unlink(`uploads/${inputFilename}`,(err)=>{
      if(err)
      console.log("Error:",err);
      else{
        console.log("Successfully Deletedd");
      }
    })
    let processedFilesPath = [];
    let processedVideos = [];
    fs.readdir('output',(err,files)=>{
      if(err){
        res.status(500).json({message: "Error Reading directory output"})
      }
      files.forEach((file)=>{
        processedFilesPath.push(file);
      })
    })
     fs.readFile('output/video-1693748668535-ou2.mp4_1280:720.mp4',(err,data)=>{
      if(err){
        res.status(500).json({message: "Error Reading directory output"})
      }
      processedVideos.push(data);s
    })
    
  } catch (error) {
    console.error('Error:', error);
  }
})

app.listen(port,()=>{
    console.log(`Listening on ${port}`)
});
