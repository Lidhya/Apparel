const express = require('express');
const router = express.Router();
const fs = require('fs');
const productHelper = require("../helpers/product-helpers")
const adminHelpers = require("../helpers/admin-helpers");
const productHelpers = require('../helpers/product-helpers');
const offerHelpers = require('../helpers/offer-helpers');
const orderHelpers = require('../helpers/order-helpers');

/* ------------------------- Verify login middleware ------------------------ */
const verifyLogin = (req, res, next) => {
  if (req.session.loggedIn) {
    next()
  } else {
    res.redirect('/')
  }
}
 /* ---------------------------- GET users listing --------------------------- */
router.get('/', async function (req, res, next) {
  try { 
    if (req.session.loggedIn && req.session.admin) {
      var admin = req.session.admin
      let details = await adminHelpers.getReport()
      res.setHeader('cache-control', 'no-store')
      res.render('admin/dashboard', { title: " | Admin", admin, details });
    } else {
      res.redirect('/')
    }
  } catch (err) {
  next(err)
  }
});

/* ----------------------- Dashboard data through ajax ---------------------- */
router.get('/get-report', verifyLogin, async (req, res, next) => {
  try {
    let details = await adminHelpers.getReport()
    res.json(details)
  } catch (err) {
   next(err)
  }
})

/* ----------------------------- Product list ---------------------------- */
router.get('/products', verifyLogin, (req, res, next) => {
  try{
    res.setHeader('cache-control', 'no-store')
  productHelper.getAllProducts().then((products) => {
    res.render('admin/products', { title: " | Admin", admin: true, products });
  }).catch((err)=>{ next(err)})
  }catch(err){
    next(err)
  }
 
});

/* ------------------------------- add product form ------------------------------ */
router.get('/add-product', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  res.render('admin/add-product', { title: " | Admin", admin: true, categories, "updateStatus": req.session.updateStatus });
  req.session.updateStatus = false
}catch(err){
 next(err)
}
})

/* ------------------------------- add product ------------------------------ */
router.post('/add-product', (req, res, next) => {
  try{
  productHelper.addProduct(req.body, (id) => {
    let images = []
    let image_path = []
    if (req.files?.Image1) { images.push(req.files?.Image1) }
    if (req.files?.Image2) { images.push(req.files?.Image2) }
    if (req.files?.Image3) { images.push(req.files?.Image3) }
    if (images.length) {
      for (let i = 0; i < images.length; i++) {
        var uploadPath = './public/product-images/' + id + '-' + i + '.jpg'
        var img = '/product-images/' + id + '-' + i + '.jpg'
        image_path.push(img)
        images[i]?.mv(uploadPath, (err) => {
          if (err) {
            req.session.updateStatus = "Something went wrong"
            return res.status(500).send(err);
          } else {
            req.session.updateStatus = "Product added successfully"
          }
        })
      }
    }
    productHelper.addImagePath(image_path, id).then((response) => {
      res.redirect('/admin/add-product')
    }).catch((err) => {
      next(err)
    })
  })
}catch(err){
 next(err)
}
})

/* ---------------------------- product edit form --------------------------- */
router.get('/product-edit/:id', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  let proId = req.params.id;
  productHelper.getProductDetails(proId).then((productDetails) => {
    res.render('admin/edit-product', { title: " | Admin", productDetails, categories, admin: true, "proErr": req.session.proErr });
    req.session.proErr = false;
  }).catch((err) => { next(err) })
}catch(err){
 next(err)
}
})

/* ----------------------------- edit a product ----------------------------- */
router.post('/edit-product/:id', verifyLogin, (req, res, next) => {
  try{
  productHelpers.updateProduct(req.params.id, req.body).then((response) => {
    let id = req.params.id
    if (req.files?.Image1) {
      let image1 = req.files?.Image1
      fs.unlinkSync('./public/product-images/' + id + '-0.jpg')
      image1.mv('./public/product-images/' + id + '-0.jpg', (err) => {
        if (err) {
          next(err)
        }
      })
    }

    if (req.files?.Image2) {
      let image2 = req.files?.Image2
      fs.unlinkSync('./public/product-images/' + id + '-1.jpg')
      image2.mv('./public/product-images/' + id + '-1.jpg', (err) => {
        if (err) {
          next(err)
        }
      })
    }

    if (req.files?.Image3) {
      let image3 = req.files?.Image3
      fs.unlinkSync('./public/product-images/' + id + '-2.jpg')
      image3.mv('./public/product-images/' + id + '-2.jpg', (err) => {
        if (err) {
          next(err)
        }
      })
    }
    res.redirect('/admin/products')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* ---------------------------- delete a product ---------------------------- */
router.get('/delete-products/:id', verifyLogin, (req, res, next) => {
  try{
  let proId = req.params.id
  for (let i = 0; i < 3; i++) {
    fs.unlinkSync('./public/product-images/' + proId + '-' + i + '.jpg')
  }
  productHelpers.deleteProduct(proId).then((response) => {
    res.redirect('/admin/products')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* ----------------------------- User list ---------------------------- */
router.get('/users', verifyLogin, (req, res, next) => {
  try{
  adminHelpers.getAllUsers().then((usersData) => {
    res.setHeader('cache-control', 'no-store')
    res.render("admin/users", { title: " | Admin", usersData, admin: true, "updateStatus": req.session.updateStatus })
    req.session.updateStatus = false
  }).catch((err)=>{
    next(err)
  })
}catch(err){
  next(err)
}
});

/* ------------------------------- block user ------------------------------- */
router.get('/user-block/:id', verifyLogin, (req, res, next) => {
  try{
  let userId = req.params.id;
  adminHelpers.blockUser(userId).then((response) => {
    res.redirect('/admin/users')
  }).catch((err)=>{
    next(err)
  })
}catch(err){
 next(err)
}
})

/* ------------------------------ unblock user ------------------------------ */
router.get('/user-unblock/:id', verifyLogin, (req, res, next) => {
  try{
  let userId = req.params.id;
  adminHelpers.unblockUser(userId).then((response) => {
    res.redirect('/admin/users')
  }).catch((err)=>{
    next(err)
  })
}catch(err){
 next(err)
}
})

/* ----------------------------- Category list ---------------------------- */
router.get('/categories', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  res.setHeader('cache-control', 'no-store')
  res.render('admin/categories', { admin: true, categories, "catErr": req.session.catErr });
  req.session.catErr = false
}catch(err){
 next(err)
}
})

/* ---------------------------- add new category ---------------------------- */
router.post('/add-category', (req, res, next) => {
  try{
  productHelper.addCategory(req.body).then((data) => {
    res.redirect('/admin/categories')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* --------------------------- delete a category --------------------------- */
router.get('/delete-category/:id', verifyLogin, (req, res, next) => {
  try{
  let catId = req.params.id
  productHelpers.deleteCategory(catId).then((response) => {
    res.redirect('/admin/categories')
  }).catch((err) => {
    req.session.catErr = err
    res.redirect('/admin/categories')
  })
}catch(err){
 next(err)
}
})

/* ----------------------------- Orders list ---------------------------- */

router.get('/all-orders', verifyLogin, async (req, res, next) => {
  try{
  let orders = await orderHelpers.getAllOrders()
  res.render('admin/all-orders', { title: " | Admin", admin: true, orders })
}catch(err){
 next(err)
}
})

/* ------------------------------ cancel order ------------------------------ */
router.get('/cancel-order/:id', verifyLogin, (req, res, next) => {
  try{
  let orderId = req.params.id
  orderHelpers.cancelOrder(orderId).then((response) => {
    res.redirect('/admin/all-orders')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* --------------------------- update order status -------------------------- */
router.post('/update-order/:id', verifyLogin, (req, res, next) => {
  try{
  let orderId = req.params.id
  orderHelpers.updateOrder(orderId, req.body).then((response) => {
    res.redirect('/admin/all-orders')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* ------------------------- Update delivery status ------------------------- */
router.post('/update-status/:id', verifyLogin, (req, res, next) => {
  try{
  let orderId = req.params.id
  orderHelpers.updateStatus(orderId, req.body).then((response) => {
    res.redirect('/admin/all-orders')
  }).catch((err)=>{next(err)})
}catch(err){
 next(err)
}
})

/* ----------------------------- Category & referral offer list ---------------------------- */

router.get('/category-offers', verifyLogin, async (req, res, next) => {
  try{
  let categories = await offerHelpers.getOffers()
  let referrals = await offerHelpers.getReferrals()
  res.render('admin/category-offers', { title: " | Admin", admin: true, categories, referrals })
}catch(err){
 next(err)
}
})

/* --------------------------- edit referral offer -------------------------- */
router.post('/edit-referrals', verifyLogin, (req, res, next) => { 
  try{
  offerHelpers.editReferrals(req.body).then((data) => {
    res.redirect('/admin/category-offers')
  }).catch((err)=>{
    next(err)
  })
}catch(err){
 next(err)
}
})

/* ------------------------- add new category form ------------------------- */
router.get('/add-offer', verifyLogin, async (req, res, next) => {
  try{
  let categories = await offerHelpers.getNonOfferCat() //get categories with no existing offers
  res.render('admin/add-cate-offer', { title: " | Admin", admin: true, categories, "offerErr": req.session.offerErr })
  req.session.offerErr = false
}catch(err){
 next(err)
}
})

/* ---------------------------- add new category offer ---------------------------- */
router.post('/add-offer', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.addOffer(req.body).then((response) => {
    res.redirect('/admin/category-offers')
  }).catch((err) => {
    req.session.offerErr = err
    res.redirect('/admin/add-offer')
  })
}catch(err){
 next(err)
}
})

/* --------------------------- edit ctegory offer form --------------------------- */
router.get('/edit-offer/:id', verifyLogin, async (req, res, next) => {
  try{
  let categories = await productHelpers.getCategories()
  let offerDetails = await offerHelpers.getOffer(req.params.id)
  res.render('admin/edit-cate-offer', { title: " | Admin", admin: true, categories, offerDetails })
   }catch(err){
   next(err)
  }
})

/* --------------------------- edit ctegory offer --------------------------- */
router.get('/offer-enable/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.enableOffer(req.params.id).then((response) => {
    res.redirect('/admin/category-offers')
  }).catch((err)=>{
    next(err)
  })
   }catch(err){
   next(err)
  }
})

/* --------------------------- disable ctegory offer --------------------------- */
router.get('/offer-disable/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.disableOffer(req.params.id).then((response) => {
    res.redirect('/admin/category-offers')
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* --------------------------- enable ctegory offer --------------------------- */
router.post('/edit-offer', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.editOffer(req.body).then((response) => {
    res.redirect('/admin/category-offers')
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* --------------------------- delete ctegory offer --------------------------- */
router.get('/delete-offer/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.deleteOffer(req.params.id).then(()=>{
    res.redirect('/admin/category-offers')
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

/* ---------------------------- Coupons list --------------------------- */
router.get('/coupons', verifyLogin, async (req, res, next) => {
  try{
  let coupons = await offerHelpers.getAllCoupons()
  res.render('admin/coupons', { title: " | Admin", admin: true, coupons })
   }catch(err){
   next(err)
  }
})

/* ----------------------------- Add coupon form ---------------------------- */
router.get('/add-coupon', verifyLogin, async (req, res, next) => {
  try{
  res.render('admin/add-coupon', { title: " | Admin", admin: true,  "couponErr":req.session.adminCouponErr })
  req.session.adminCouponErr=false
   }catch(err){
   next(err)
  }
})

/* ----------------------------- add new coupon ----------------------------- */
router.post('/add-coupon', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.createCoupon(req.body).then(() => {
    res.redirect('/admin/coupons')
  }).catch((err)=>{
    req.session.adminCouponErr=err
    res.redirect('/admin/add-coupon')
  })
}catch(err){
   next(err)
  }
})

/* ---------------------------- edit coupon form ---------------------------- */
router.get('/edit-coupon/:id', verifyLogin, async (req, res, next) => {
  try{
  let couponId = req.params.id
  let coupon = await offerHelpers.getCoupon(couponId)
  res.render('admin/coupon-edit', { title: " | Admin", admin: true, coupon, "couponErr":req.session.adminCouponErr })
  req.session.adminCouponErr=false
   }catch(err){
   next(err)
  }
})

/* ------------------------------- edit coupon ------------------------------ */
router.post('/edit-coupon/:id', verifyLogin, async (req, res, next) => {
  try{
  let couponId = req.params.id
  offerHelpers.editCoupon(req.body, couponId).then(() => {
    res.redirect('/admin/coupons')
  }).catch((err)=>{
    req.session.adminCouponErr=err
    res.redirect(`/admin/edit-coupon/${couponId}`)
  })
   }catch(err){
   next(err)
  }
})

/* ------------------------------ enable a coupon ------------------------------ */
router.get('/coupon-enable/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.enableCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  }).catch((err)=>{ next(err) })
   }catch(err){
   next(err)
  }
})

/* ------------------------------ disable a coupon ------------------------------ */
router.get('/coupon-disable/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.disableCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  }).catch((err)=>{ next(err) })
   }catch(err){
   next(err)
  }
})

/* ------------------------------delete a coupon ------------------------------ */
router.get('/delete-coupon/:id', verifyLogin, async (req, res, next) => {
  try{
  offerHelpers.deleteCoupon(req.params.id).then((response) => {
    res.json({ status: true })
  }).catch((err)=>{next(err)})
   }catch(err){
   next(err)
  }
})

module.exports = router;
