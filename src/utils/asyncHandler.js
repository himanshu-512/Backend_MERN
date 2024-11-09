// const asyncHandler = (fn)=> async(req,res,next)=>{
//     try {
//         await fn(req,res,next)
//     } catch (error) {
//         res.status(err.code || 500).JSON({
//             success:false,
//             Message : err.message
//         })
//     }
// }

const asyncHandler =(requestHandler)=>{
    (req,res,next) => {
        Promise.resolve(requestHandler(req,res,next)).catch((err) => next(err))
    }
}











export {asyncHandler}