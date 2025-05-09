document.addEventListener('DOMContentLoaded', function() {
    // 初始化購物車
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    // 更新購物車計數
    updateCartCount();
    
    // 為所有加入購物車按鈕添加點擊事件
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function() {
            // 獲取產品信息
            const productCard = this.closest('.product-card');
            const productId = productCard.getAttribute('data-product-id');
            const productName = productCard.getAttribute('data-product-name');
            const productPrice = parseInt(productCard.getAttribute('data-product-price'));
            const productImage = productCard.querySelector('.product-image img').src;
            
            // 檢查產品是否已在購物車中
            const existingItemIndex = cart.findIndex(item => item.id === productId);
            
            if (existingItemIndex > -1) {
                // 如果已存在，增加數量
                cart[existingItemIndex].quantity += 1;
            } else {
                // 如果不存在，添加新商品
                cart.push({
                    id: productId,
                    name: productName,
                    price: productPrice,
                    image: productImage,
                    quantity: 1
                });
            }
            
            // 保存購物車到 localStorage
            localStorage.setItem('cart', JSON.stringify(cart));
            
            // 更新購物車計數，帶動畫效果
            updateCartCount(true);
            
            // 按鈕添加動畫效果
            const originalText = this.textContent;
            this.classList.add('btn-added');
            this.classList.add('success');
            this.textContent = "已加入";
            
            setTimeout(() => {
                this.classList.remove('btn-added');
                this.classList.remove('success');
                this.textContent = originalText;
            }, 1000);
        });
    });
    
    // 更新購物車數量顯示
    function updateCartCount(animate = false) {
        // 獲取所有購物車計數器元素
        const cartCount = document.getElementById('cart-count');
        const cartCountMobile = document.getElementById('cart-count-mobile');
        const cartCountFixed = document.getElementById('cart-count-fixed'); // 新增的手機版右上角購物車
        
        const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
        
        // 更新所有計數器數量
        if (cartCount) cartCount.textContent = totalItems;
        if (cartCountMobile) cartCountMobile.textContent = totalItems;
        if (cartCountFixed) cartCountFixed.textContent = totalItems;
        
        // 如果購物車為空，隱藏計數器
        const updateVisibility = (element) => {
            if (element) {
                if (totalItems === 0) {
                    element.style.display = 'none';
                } else {
                    element.style.display = 'flex';
                    
                    // 如果需要動畫效果
                    if (animate) {
                        element.classList.add('update');
                        setTimeout(() => {
                            element.classList.remove('update');
                        }, 300);
                    }
                }
            }
        };
        
        // 為所有計數器應用顯示/隱藏邏輯
        updateVisibility(cartCount);
        updateVisibility(cartCountMobile);
        updateVisibility(cartCountFixed);
    }
});