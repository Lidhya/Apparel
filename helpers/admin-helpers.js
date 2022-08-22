var db=require('../config/connection')
var collection=require('../config/collection')
const bcrypt=require('bcrypt')
const Promise=require('promise')
var objectId=require('mongodb').ObjectId

module.exports={

    getAllUsers:()=>{
        return new Promise(async(resolve,reject)=>{
            let users= await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
     },

    blockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(objectId(userId))
            let query={ _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query,{$set:{block:true}}).then((response)=>{
                console.log(response)
                resolve(response)
            }).catch((err)=>{
                console.log(err)
            })
        })
    },

    unblockUser:(userId)=>{
        return new Promise((resolve,reject)=>{
            console.log(objectId(userId))
            let query={ _id: objectId(userId) };
            db.get().collection(collection.USER_COLLECTION).findOneAndUpdate(query,{$set:{block:false}}).then((response)=>{
                console.log(response)
                resolve(response)
            }).catch((err)=>{
                console.log(err)
            })
        })
    },

    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
          // console.log(orders)
           resolve(orders)
        })
    },
    cancelOrder:(orderId)=>{
        return new Promise((resolve,reject)=>{
            let query={ _id: objectId(orderId) };
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query,{$set:{cancel:true}}).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                console.log(err)
                reject(err)
            })
        })
    },

    updateOrder:(orderId, updateData)=>{
        return new Promise((resolve,reject)=>{
            let query={ _id: objectId(orderId) };
            let status=updateData.status
            db.get().collection(collection.ORDER_COLLECTION).findOneAndUpdate(query,{$set:{status:status}}).then((response)=>{
                resolve(response)
            }).catch((err)=>{
                console.log(err)
                reject(err)
            })
        })
    }
}
    