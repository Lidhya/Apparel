function addToCart(proId, stock){
  if(stock<=0){
    document.getElementById(proId).style.display = "none";
  }else{
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'get',
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