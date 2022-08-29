const express = require('express');
const router = express.Router();
const fs = require('fs');
const productHelper=require("../helpers/product-helpers")
const adminHelpers=require("../helpers/admin-helpers");
const productHelpers = require('../helpers/product-helpers');
const { response } = require('express');
const path=require('path')
const multer=require('multer')

const storage=multer.diskStorage({
  destination:(req,file,cb)=>{
    cb(null,'Images')
  }
})
const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
}else{
    res.redirect('/')
 }
}
/* GET users listing. */
router.get('/',async function(req, res, next) {
if(req.session.loggedIn && req.session.admin){               
  var admin=req.session.admin
  let details=await adminHelpers.getReport()
  res.setHeader('cache-control','no-store')
  res.render('admin/dashboard',{title: " | Admin",admin, details});
}else{
  res.redirect('/')
}
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
 productHelper.addProduct(req.body,(id)=>{
  let images = []
  let  image_path=[]
            if(req.files?.Image1){images.push(req.files?.Image1)}
            if(req.files?.Image2){images.push(req.files?.Image2)}
            if(req.files?.Image3){images.push(req.files?.Image3)}
            if(images.length){
              for (let i = 0; i <images.length; i++) {
                  var uploadPath = './public/product-images/'+ id+'-'+ i+'.jpg'
                  var img ='/product-images/'+ id+'-'+i+'.jpg'
                  image_path.push(img)
                  images[i]?.mv(uploadPath,(err)=>{
                  if(err){
                      console.log(err);
                      req.session.updateStatus="Something went wrong"
                      return res.status(500).send(err);
                  }else{
                    req.session.updateStatus="Product added successfully"
                  }
                  })
                  }
          }
          productHelper.addImagePath(image_path, id).then((response)=>{
            res.redirect('/admin/add-product')
          }).catch((err)=>{
            console.log(err);
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
   productHelpers.updateProduct(req.params.id,req.body).then((response)=>{
    console.log('vann vann  '+response)
    let id=req.params.id

              if(req.files?.Image1){
                console.log('vann vann  img 1')
               let image1=req.files?.Image1
              // var imgpath1='/product-images/'+ id+'-0.jpg'
               fs.unlinkSync('./public/product-images/'+ id+'-0.jpg')
                image1.mv('./public/product-images/'+ id+'-0.jpg',(err)=>{
                  if(err){
                      console.log(err);
                  }
                  })
              }

              if(req.files?.Image2){
                console.log('vann vann  img2')
                let image2=req.files?.Image2
               // var imgpath2='/product-images/'+ id+'-1.jpg'
                fs.unlinkSync('./public/product-images/'+ id+'-1.jpg')
                 image2.mv('./public/product-images/'+ id+'-1.jpg',(err)=>{
                   if(err){
                       console.log(err);
                   }
                   })
                  }

              if(req.files?.Image3){
                console.log('vann vann  img3')
                let image3=req.files?.Image3
                var imgpath3='/product-images/'+ id+'-2.jpg'
                fs.unlinkSync('./public/product-images/'+ id+'-2.jpg')
                 image3.mv('./public/product-images/'+ id+'-2.jpg',(err)=>{
                   if(err){
                       console.log(err);
                   }
                   })
                  }
             
            // productHelper.addImagePath(image_path, id).then((response)=>{
            //   res.redirect('/admin/products')
            // }).catch((err)=>{
            //   console.log(err);
            // })
            res.redirect('/admin/products')
   })
  })


  router.get('/delete-products/:id',verifyLogin,(req,res)=>{
    let proId=req.params.id
    console.log(proId)
    for(let i=0; i<3;i++){
      fs.unlinkSync('./public/product-images/'+ proId+'-'+i+'.jpg')
    }
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

  router.post('/update-status/:id',verifyLogin, (req,res)=>{
    let orderId=req.params.id
    console.log(req.body)
     adminHelpers.updateStatus(orderId, req.body).then((response)=>{
      res.redirect('/admin/all-orders')
     })
  })

  router.get('/get-report',verifyLogin, async (req,res)=>{
    let details=await adminHelpers.getReport()
    res.json(details)
  })

module.exports = router;
