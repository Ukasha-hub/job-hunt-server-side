const express = require('express');
const cors = require('cors');
const app = express()
const jwt = require('jsonwebtoken');
const cookieParser= require('cookie-parser')
const port= process.env.PORT || 5000
const { ObjectId } = require('mongodb');
require('dotenv').config()
//middle ware

app.use(cors({
  origin:['http://localhost:5173'],
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())



const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.ijq2qvm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
//console.log(process.env.DB_PASSWORD)
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

//middlewares
const logger=(req, res, next)=>{
  console.log('log info', req.method, req.url);
  next();
}

const verifyToken= (req, res, next)=>{
  const token = req?.cookies?.token
  //console.log('token in middleware', token)
  if(!token){
    return res.status(401).send({message: 'unauthorized access'})
  }
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded)=>{
    if(err){
      return res.status(401).send({message: 'unauthorized access'})
    }
    req.user= decoded
    next()
  })

}



async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobCollection=  client.db('jobHuntDB').collection('jobs')
    const appliedCollection=  client.db('jobHuntDB').collection('applied')
    
    app.post('/jwt', logger, async (req,res)=>{
      const user =req.body
      console.log('user for token', user)
      const token= jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res.cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      })
      res.send({success: true})
    })

    app.post('/logout', async(req,res)=>{
      const user= req.body
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    })

    app.get('/jobs', async(req,res)=>{
        const cursor= jobCollection.find()
        const result= await cursor.toArray()
        res.send(result)
      })


      app.get('/jobs/email/:email', logger, verifyToken, async(req,res)=>{
        const email = req.params.email;

        //const query={ email: email }
        console.log('token owner: ', req.user)
        if(req.user.email!==email){
             return res.status(403).send({message: 'forbidded access'})
        }

        //console.log(email)
            
        const cursor = jobCollection.find({ email: email });
        
      
        const result = await cursor.toArray();
        
      
        res.json(result);
      })



      app.get('/jobs/:id', async(req, res)=>{
        const id= req.params.id
        console.log('iD number:',id)
        const query= {_id: new ObjectId(id)}
        const result =await jobCollection.findOne(query)
        res.send(result)


        
  
      }) 

      app.get('/applied', async(req, res)=>{
        const cursor= appliedCollection.find()
        const result= await cursor.toArray()
        res.send(result)
  
      })  

      
      
      app.get('/applied/:email' , logger, verifyToken, async(req, res)=>{
        const email = req.params.email;

        console.log('token owner: ', req.user)
        if(req.user.email!==email){
             return res.status(403).send({message: 'forbidded access'})
        }
            
        const cursor = appliedCollection.find({ email: email });
        
      
        const result = await cursor.toArray();
        
      
        res.json(result);
  
      })  



      app.post('/jobs', async(req,res)=>{
        const newJob= req.body;
        console.log(newJob)
        const result =await jobCollection.insertOne(newJob)

       // const jobId = result.insertedId; // Get the _id of the newly inserted document
        //const incrementResult = await jobCollection.updateOne(
          //  { _id: jobId },
           // { $inc: { applicant: 1 } }
       // );
         
        res.send(result)
        
      })
    
      app.post('/applied', async(req,res)=>{
        const newApplied= req.body;
        console.log(newApplied)
        const result =await appliedCollection.insertOne(newApplied)

        const jobId = result.insertedId; // Get the _id of the newly inserted document
        
        const incrementResult = await jobCollection.updateOne(
            { _id: jobId },
            { $inc: { applicant: 1 } }
        );
         
        res.send(result)
        
      })



      app.put('/jobs/:id', async(req, res)=>{
  
        const id= req.params.id
      
        console.log('Received ID:', id); 
      
      const filter= {_id: new ObjectId(id)}
      
      const options= {upsert:true}
      const updateJob= req.body
      const Job={
        $set:{
           photo: updateJob.photo,
           
           job: updateJob.job,
           category: updateJob.category,
           salary: updateJob.salary,
           description: updateJob.description,
          
           deadline: updateJob.deadline,
           applicant: updateJob.applicant,
         
           
           
        }
      }
      
      const result= await jobCollection.updateOne(filter, Job, options)
      
      res.send(result)
     

    })

    app.delete('/jobs/:id', async(req,res)=>{
        const id= String(req.params.id)
        
  
        const query= {_id: new ObjectId(id)}
        
        const result= await jobCollection.deleteOne(query)
        res.send(result)
      })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req,res)=>{
    res.send('project running')
})

app.listen(port, ()=>{
    console.log('Server running')
})