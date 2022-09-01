const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const { resolve, reject } = require('promise')
const moment = require('moment');
const objectId = require('mongodb').ObjectId

module.exports = { 
    addOffer:(offerData)=>{
        return new Promise(async(resolve,reject)=>{
            let query=offerData.categoryId
            let categories= await db.get().collection(collection.CATEGORY_COLLECTION).findOne(query).toArray()
            if(categories.offer){
                let err="The selected category already have an offer"
                reject(err)
            }else{
                offerData.percent=parseInt(offerData.percent)
                offerData.isEnabled=false
                db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(query)},{
                    $set:{offer:offerData}
                }).then((data=>{
                    resolve()
                })).catch((err)=>{
                    reject(err)
                })
            }
           
        })
    },
    getOffer:(catId)=>{
        return new Promise((resolve,reject)=>{
             db.get().collection(collection.CATEGORY_COLLECTION).findOne({_id:objectId(catId)}).then((offerData)=>{
                resolve(offerData)
            }).catch((err)=>{
                reject(err)
            })
        })
    },
    editOffer:(offerData)=>{
        return new Promise((resolve,reject)=>{
            let query=offerData.categoryId
            offerData.percent=parseInt(offerData.percent)
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(query)},{
                $set:{offer:offerData}
            }).then((data=>{
                resolve()
            })).catch((err)=>{
                reject(err)
            })
        })
    },
    enableOffer:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(catId)},{
                $set:{"offer.isEnabled":true}
            }).then((data=>{
                resolve()
            })).catch((err)=>{
                reject(err)
            })
        })
    },
    disableOffer:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(catId)},{
                $set:{"offer.isEnabled":false}
            }).then((data=>{
                resolve()
            })).catch((err)=>{
                reject(err)
            })
        })
    },
    
    deleteOffer:(catId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CATEGORY_COLLECTION).findOneAndUpdate({_id:objectId(catId)},{
                $unset:{offer:""}
            }).then((data=>{
                resolve()
            })).catch((err)=>{
                reject(err)
            })
        }) 
    }
}