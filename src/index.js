// require('dotenv').config()
import dotenv from "dotenv"

import connectDB from "./db/index.js";
import {app} from './app.js'

dotenv.config({
    path : './env'
})


connectDB()
.then(()=>{
    app.listen(process.env.PORT||8000, ()=> {
        console.log(`Server at running at ${process.env.PORT}`)
    })
})
.catch((err)=> {
    console.log("MOGoDB ERR" ,err)
})







// (async()=>{
//    try {
//     await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//    } catch (error) {
//     console.log(error);
//     throw error
//    }


// })()