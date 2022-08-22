var express = require('express');
var router = express.Router();
var productHelper=require("../helpers/product-helpers")
var adminHelpers=require("../helpers/admin-helpers");
const productHelpers = require('../helpers/product-helpers');
const { response } = require('express');
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
}else{
    res.redirect('/')
 }
}
/* GET users listing. */
router.get('/', function(req, res, next) {
  res.redirect('/');
});

router.get('/products',verifyLogin, (req, res, next)=> {
  res.setHeader('cache-control','no-store')
  productHelper.getAllProducts().then((products)=>{
    res.render('admin/products',{title: " | Admin",admin:true, products});
  })
});

router.get('/users',verifyLogin, (req, res, next)=> {
  adminHelpers.getAllUsers().then((usersData)=>{
    res.setHeader('cache-control','no-store')
    res.render("admin/users", {title: " | Admin", usersData, admin:true,"updateStatus":req.session.updateStatus})
    req.session.updateStatus=false
  })
});

router.get('/categories',verifyLogin, async (req, res, next)=> {
  let categories=await productHelpers.getCategories()
  res.setHeader('cache-control','no-store')
  res.render('admin/categories',{admin:true,categories});
})

router.post('/add-category',((req,res)=>{
  productHelper.addCategory(req.body).then((data)=>{
    res.redirect('/admin/categories')
  })
}))

router.get('/delete-category/:id',verifyLogin,(req,res)=>{
  let catId=req.params.id
  console.log(catId)
  productHelpers.deleteCategory(catId).then((response)=>{
    res.redirect('/admin/categories')
  })
})

router.get('/add-product',verifyLogin,async (req, res, next)=>{
  let categories=await productHelpers.getCategories()
 res.render('admin/add-product',{title: " | Admin", admin:true, categories, "updateStatus":req.session.updateStatus});
 req.session.updateStatus=false 
})

router.post('/add-product',(req,res)=>{
  console.log(req.body)
  console.log(req.files.image);

 productHelper.addProduct(req.body,(id)=>{
  let image=req.files.image
  console.log(id)
 image.mv('./public/product-images/'+id+'.jpg',(err,done)=>{
  if(!err){
    req.session.updateStatus="Product added successfully"
    res.redirect('/admin/add-product');
  }else{
    console.log(err)
  }
 })
 })
})

router.get('/product-edit/:id',verifyLogin, async (req, res)=> {
    let categories=await productHelpers.getCategories()
    let proId = req.params.id;
    productHelper.getProductDetails(proId).then((productDetails) => {
      console.log(productDetails);
      res.render('admin/edit-product', { title: " | Admin", productDetails, categories,admin:true, "proErr":req.session.proErr});
      req.session.proErr=false;
    });
  })

  router.post('/edit-product/:id', (req,res)=>{
   productHelpers.updateProduct(req.params.id,req.body).then(()=>{
    res.redirect('/admin/products')
    if(req.files.image){
      let image=req.files.image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
   })
  })


  router.get('/delete-products/:id',verifyLogin,(req,res)=>{
    let proId=req.params.id
    console.log(proId)
    productHelpers.deleteProduct(proId).then((response)=>{
      res.redirect('/admin/products')
    })
  })


  router.get('/user-block/:id',verifyLogin,(req,res)=>{
    let userId=req.params.id;
    adminHelpers.blockUser(userId).then((response)=>{
     res.redirect('/admin/users')
    })
  })

  router.get('/user-unblock/:id',verifyLogin,(req,res)=>{
    let userId=req.params.id;
    adminHelpers.unblockUser(userId).then((response)=>{
     res.redirect('/admin/users')
    })
  })

  router.get('/all-orders',verifyLogin,async(req,res)=>{
    let orders=await adminHelpers.getAllOrders()
    res.render('admin/all-orders',{title: " | Admin",admin:true, orders})
  })

  router.get('/cancel-order/:id',verifyLogin, (req,res)=>{
    let orderId=req.params.id
     adminHelpers.cancelOrder(orderId).then((response)=>{
      res.redirect('/admin/all-orders')
     })
  })


  router.post('/update-order/:id',verifyLogin, (req,res)=>{
    let orderId=req.params.id
    console.log(req.body)
     adminHelpers.updateOrder(orderId, req.body).then((response)=>{
      res.redirect('/admin/all-orders')
     })
  })

module.exports = router;
