const express = require('express');
const cors = require('cors');
const app = express()
const port= process.env.PORT || 5000
const { ObjectId } = require('mongodb');
require('dotenv').config()
//middle ware

app.use(cors())
app.use(express.json())



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

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const jobCollection=  client.db('jobHuntDB').collection('jobs')
    const appliedCollection=  client.db('jobHuntDB').collection('applied')


    app.get('/jobs', async(req,res)=>{
        const cursor= jobCollection.find()
        const result= await cursor.toArray()
        res.send(result)
      })


      app.get('/jobs/email/:email', async(req,res)=>{
        const email = req.params.email;
            
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

      
      
      app.get('/applied/:email', async(req, res)=>{
        const email = req.params.email;
            
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
           
           email: updateJob.email,
           name: updateJob.name
           
           
        }
      }
      
      const result= await jobCollection.updateOne(filter, Spot, options)
      
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