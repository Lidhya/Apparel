const { response } = require('express');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var userHelpers=require('../helpers/user-helpers');


const verifyLogin=(req,res,next)=>{
  if(req.session.loggedIn){
    next()
}else{
    res.redirect('/')
 }
}
   

/* GET home page. */
router.get('/', async function(req, res, next) {
  let categories=await productHelpers.getCategories()
  let products= await productHelpers.getAllProducts()
  let cartCount=null
    if(req.session.loggedIn){
      if(req.session.user){
        var user=req.session.user
        cartCount= await userHelpers.getCartCount(req.session.user._id)
        //Object.keys(products).length
        res.render('index',{user, index:true, products, categories, cartCount});
      }else{
        var admin=req.session.admin
        res.setHeader('cache-control','no-store')
        res.render('admin/dashboard',{title: " | Admin",admin});
      }
    }else{  
      res.render('index',{products,index:true,categories, cartCount});
    }
});

router.get('/login', function(req, res, next) {
  if(req.session.loggedIn)
  {
    res.redirect('/')
  }else{
    res.render('user/login',{ title: '| Login','loginErr':req.session.loginErr });
    req.session.loginErr=false
  }
});

router.post("/login",(req,res)=>{
  userHelpers.doLogin(req.body).then((response)=>{
    req.session.loggedIn=true
    req.session.user=response.user
    req.session.admin=response.admin
    res.redirect('/')
}).catch((err)=>{
  console.log(err)
req.session.loginErr=err
res.redirect('/login')
})
})

router.get('/signup', function(req, res, next) {
  if(req.session.loggedIn)
  {
res.redirect('/')
  }else{
    res.render('user/signup',{ title: '| Signup', "signupErr": req.session.signupErr });
    req.session.signupErr=false
  }
  
});

router.post("/signup",(req,res)=>{
  console.log(req.body)
  userHelpers.doSignup(req.body).then((response)=>{
     console.log(response)
     res.redirect('/login')
  }).catch((err)=>{
    req.session.signupErr=err
    res.redirect('/signup')
  })
})

router.get('/product-details/:id',verifyLogin,async (req,res)=>{
  let proId = req.params.id;
  let products= await productHelpers.getAllProducts()
  productHelpers.getProductDetails(proId).then(async(productDetails) => {
    console.log(productDetails.category);
    let cartCount= await userHelpers.getCartCount(req.session.user._id)
    res.setHeader('cache-control','no-store')
    res.render('user/product-details', { title: '| Product details', productDetails, user:req.session.user ,cartCount ,products});
  })
})

router.get('/cart', verifyLogin, async function(req, res, next) {
  let categories=await productHelpers.getCategories()
  let products= await userHelpers.getCartProducts(req.session.user._id)
  let total=await userHelpers.getTotalAmount(req.session.user._id) 
  console.log(total)
  res.render('user/cart',{ title:' | Cart',categories, user:true, products, total});
});

router.get('/add-to-cart/:id',verifyLogin,(req,res)=>{
  console.log('api call')
 userHelpers.addToCart(req.params.id,req.session.user._id).then(()=>{ 
  res.status(200).json({status:true});
 // res.redirect('/')
 })
})

router.post('/change-product-quantity',(req,res)=>{
  userHelpers.changeProductQuantity(req.body).then(async(response)=>{
    response.total=await userHelpers.getTotalAmount(req.session.user._id)
    res.json(response)
  })
})

router.post('/remove-from-cart',verifyLogin,(req,res)=>{
  userHelpers.removeFromCart(req.body).then((response)=>{
    res.json(response)
  })
})

router.get('/place-order', verifyLogin, async function(req, res, next) {
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  if(total){
    res.render('user/checkout',{ title: '| Checkout', total, user:req.session.user});
  }

});

router.post('/place-order',async function(req, res, next) {
  let products= await userHelpers.getCartProductList(req.session.user._id)
  let total=await userHelpers.getTotalAmount(req.session.user._id)
  userHelpers.placeOrder( req.body, products, total).then(()=>{
    res.json({status:true})
  })
});

router.get('/order-success', verifyLogin, async function(req, res, next) {
 res.render('user/order-success',{ title: '| Success', user:req.session.user})
});

router.get('/orders', verifyLogin, async function(req, res, next) {
let orders=await userHelpers.getUserOrders(req.session.user._id)
  res.render('user/orders',{ title: '| Orders', user:req.session.user, orders})
 });


router.get('/account', verifyLogin, async function(req, res, next) {
  cartCount= await userHelpers.getCartCount(req.session.user._id)
    res.render('user/account',{ title: '| Account', user:req.session.user, cartCount})
   });

router.get('/cancel-order/:id',verifyLogin,(req,res)=>{
  let orderId=req.params.id
     userHelpers.cancelOrder(orderId).then((response)=>{
      res.redirect('/orders')
     })
})



router.get('/logout',verifyLogin,(req,res)=>{
  req.session.loggedIn=false
  req.session.destroy()
  res.redirect('/')
})

module.exports = router;