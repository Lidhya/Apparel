const db = require('../config/connection')
const collection = require('../config/collection')
const Promise = require('promise')
const objectId = require('mongodb').ObjectId

module.exports = {

    /* -------------------------------------------------------------------------- */
    /*                             Product management                             */
    /* -------------------------------------------------------------------------- */

    /* ------------------------------- Add product ------------------------------ */

    addProduct: async (productData, callback) => {
        try {
            const { name, description, category, sizes, stock, material_type, actual_price, discount_price } = productData
            let categoryId = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: productData.category })
            let product = {
                name: name,
                description: description,
                category: category,
                sizes: sizes,
                stock: parseInt(stock),
                material_type: material_type,
                actual_price: parseFloat(actual_price),
                discount_price: parseFloat(discount_price),
                categoryId: categoryId._id,
                inserted_date: new Date().toISOString(),
            }
            db.get().collection(collection.PRODUCT_COLLECTION).insertOne(product).then((data) => {
                callback(data.insertedId)
            }).catch((err) => {
                return err;
            })
        } catch (err) {
            return err;
        }
    },

    /* ----------------------------- Add image path ----------------------------- */

    addImagePath: (image_path, proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectId(proId) },
                    {
                        $set: {
                            image_path: image_path
                        }
                    }).then((response) => {
                        resolve()
                    }).catch((err) => {
                        reject(err)
                    })
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ---------------------------- List all products --------------------------- */

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ---------------------------- get single products --------------------------- */
    getProductDetails: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectId(proId) }).then((product) => {
                    resolve(product)
                }).catch((err) => { reject(err) })
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ----------------------------- update products ---------------------------- */

    updateProduct: (proId, proData) => {
        return new Promise(async (resolve, reject) => {
            try {
                const { name, description, category, sizes, stock, material_type, actual_price, discount_price } = proData
                let categoryId = await db.get().collection(collection.CATEGORY_COLLECTION).findOne({ category: proData.category })
                db.get().collection(collection.PRODUCT_COLLECTION)
                    .updateOne({ _id: objectId(proId) }, {
                        $set: {
                            name: name,
                            description: description,
                            category: category,
                            sizes: sizes,
                            stock: parseInt(stock),
                            material_type: material_type,
                            actual_price: parseFloat(actual_price),
                            discount_price: parseFloat(discount_price),
                            categoryId: categoryId._id,
                            modified_date: new Date().toISOString(),
                        }
                    }).then((response) => {
                        resolve(response)
                    }).catch((err) => { reject(err) })
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ----------------------------- Delete product ----------------------------- */

    deleteProduct: (proId) => {
        return new Promise((resolve, reject) => {
            try {
                let query = { _id: objectId(proId) };
                db.get().collection(collection.PRODUCT_COLLECTION).deleteOne(query).then((response) => {
                    resolve(response)
                })
            } catch (err) {
                reject(err)
            }
        })
    },

    /* -------------------------------------------------------------------------- */
    /*                             Category management                            */
    /* -------------------------------------------------------------------------- */

    /* ---------------------------- get all categories --------------------------- */

    getCategories: () => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).find().toArray().then((category) => {
                    resolve(category)
                }).catch((err) => { reject(err) })
            } catch (err) {
                reject(err)
            }
        })
    },

    /* ---------------------------- Add category --------------------------- */

    addCategory: (category) => {
        return new Promise((resolve, reject) => {
            try {
                db.get().collection(collection.CATEGORY_COLLECTION).insertOne(category).then((data) => {
                    resolve(data)
                }).catch((err) => {
                    reject(err)
                })
            } catch (err) {
                reject(err)
            }
        })

    },

    /* ----------------------------- Delete category ---------------------------- */

    deleteCategory: (catId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let proCheck = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ categoryId: objectId(catId) })
                if (proCheck) {
                    let err = 'Products exist in this category'
                    reject(err)
                } else {
                    db.get().collection(collection.CATEGORY_COLLECTION).deleteOne({ _id: objectId(catId) }).then((response) => {
                        resolve(response)
                    }).catch((err) => { reject(err) })
                }
            } catch (err) {
                err = 'something went wrong'
                reject(err)
            }
        })
    },

}

