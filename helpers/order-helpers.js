const db = require('../config/connection')
const collection = require('../config/collection')
const bcrypt = require('bcrypt')
const Promise = require('promise')
const objectId = require('mongodb').ObjectId
const moment = require('moment');
const Razorpay = require('razorpay');


module.exports = {

cancelOrder: (orderId) => {
    return new Promise(async(resolve, reject) => {
        let query = { _id: objectId(orderId) };
        let order= await db.get().collection(collection.ORDER_COLLECTION).find(query).toArray()
        let userId=order[0].userId
        let total=order[0].total
        db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query, { $set: { delivery_status:'Cancelled'} }).then(async(response) => {
            for(let x in order[0].products){
                   await  db.get().collection(collection.PRODUCT_COLLECTION).updateOne({"_id": objectId(order[0].products[x].item)},
                     {
                         $inc: { stock : order[0].products[x].quantity }
                     })
                 }
                 if(order[0].payment_method!='COD' && order[0].status=='Placed'){
                        await  db.get().collection(collection.USER_COLLECTION).updateOne({"_id": objectId(userId)},
                          {   
                              $set:{"wallet.last_added":new Date()},
                              $inc: { "wallet.balance" : total }
                          })
                 }
            resolve(response)
        }).catch((err) => {
            console.log(err)
            reject(err)
        })
    })
}
}

// db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then(async(response) => {
//     for(var x in products){
//      console.log(products[x].item)
//    await  db.get().collection(collection.PRODUCT_COLLECTION).updateOne({"_id": objectId(products[x].item)},
//      {
//          $inc: { stock : -products[x].quantity }
//      })
//  }
//  db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
//  resolve(response.insertedId)
// }).catch((err) => {
//  reject(err)
// })