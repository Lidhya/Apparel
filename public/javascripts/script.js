function addToCart(proId, stock, dPrice){
  let input = $('#sizes').find(":selected").val();
  let input1 = $('#single-size').text()

  if(stock<=0){
    document.getElementById(proId).style.display = "none";
  }else if(input==0){
    document.getElementById('size-select').style.display = "block";
  }else{
    document.getElementById('size-select').style.display = "none";
    if(input1){
      input=input1
    }
    console.log(input)
    $.ajax({
      url:'/add-to-cart/'+proId,
      method:'post',
      data:{
        dPrice: dPrice,
        size:input
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