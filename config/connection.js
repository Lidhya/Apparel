const mongoClient=require('mongodb').MongoClient
const state={ db:null}

/* ---------------------------- connect to cloud db ---------------------------- */
module.exports.connect=function(done){
    const url='mongodb+srv://lidhyajeejan:bSUnAdS45xPLKgw3@cluster0.7lsdxpb.mongodb.net/?retryWrites=true&w=majority'
    const dbname='Apparel'

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}

/* --------------------------- connect to local db -------------------------- */
// module.exports.connect=function(done){
//     const url='mongodb://localhost:27017'
//     const dbname='Apparel'

//     mongoClient.connect(url,(err,data)=>{
//         if(err) return done(err)
//         state.db=data.db(dbname)
//         done()
//     })
// }

module.exports.get=function(){
    return state.db
}