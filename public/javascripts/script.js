function addToCart(proId, stock, dPrice){
  if(stock<=0){
    document.getElementById(proId).style.display = "none";
  }else{
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'post',
      data:{
        dPrice: dPrice,
      },
      success:(response)=>{
        if(response.status){
            let count=$('#cart-count').html()
            count=parseInt(count)+1
            $('#cart-count').html(count)
        }
      }
    })
  }

  }