document.addEventListener('DOMContentLoaded', function() {
    // 獲取會員系統相關元素
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const userActions = document.getElementById('user-actions');
    const userProfile = document.getElementById('user-profile');
    const usernameDisplay = document.getElementById('username-display');
    const logoutBtn = document.getElementById('logout-btn');
    const userDropdownBtn = document.getElementById('user-dropdown-btn');
    const userMenu = document.getElementById('user-menu');
    
    // 獲取模態框元素
    const loginModal = document.getElementById('login-modal');
    const registerModal = document.getElementById('register-modal');
    const closeLogin = document.getElementById('close-login');
    const closeRegister = document.getElementById('close-register');
    const switchToRegister = document.getElementById('switch-to-register');
    const switchToLogin = document.getElementById('switch-to-login');
    
    // 獲取表單元素
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    
    // 檢查是否使用 Firebase 服務
    const isUsingFirebase = !!window.firebaseServices;
    
    // 如果不使用 Firebase，則檢查是否已登入（使用本地存儲）
    if (!isUsingFirebase) {
        const isLoggedIn = localStorage.getItem('isLoggedIn');
        const username = localStorage.getItem('username');
        
        if (isLoggedIn === 'true' && username) {
            // 顯示已登入狀態
            if (userActions) userActions.style.display = 'none';
            if (userProfile) userProfile.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = username;
        }
    }
    
    // 打開登入模態框
    if (loginBtn) {
        loginBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'block';
        });
    }
    
    // 打開註冊模態框
    if (registerBtn) {
        registerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerModal) registerModal.style.display = 'block';
        });
    }
    
    // 關閉登入模態框
    if (closeLogin) {
        closeLogin.addEventListener('click', function() {
            if (loginModal) loginModal.style.display = 'none';
        });
    }
    
    // 關閉註冊模態框
    if (closeRegister) {
        closeRegister.addEventListener('click', function() {
            if (registerModal) registerModal.style.display = 'none';
        });
    }
    
    // 切換到註冊模態框
    if (switchToRegister) {
        switchToRegister.addEventListener('click', function(e) {
            e.preventDefault();
            if (loginModal) loginModal.style.display = 'none';
            if (registerModal) registerModal.style.display = 'block';
        });
    }
    
    // 切換到登入模態框
    if (switchToLogin) {
        switchToLogin.addEventListener('click', function(e) {
            e.preventDefault();
            if (registerModal) registerModal.style.display = 'none';
            if (loginModal) loginModal.style.display = 'block';
        });
    }
    
    // 點擊模態框外部關閉模態框
    window.addEventListener('click', function(e) {
        if (e.target === loginModal) {
            loginModal.style.display = 'none';
        }
        if (e.target === registerModal) {
            registerModal.style.display = 'none';
        }
    });
    
    // 處理登入表單提交 - 只有在不使用 Firebase 時才啟用
    if (loginForm && !isUsingFirebase) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            
            // 這裡應該與後端API進行驗證
            // 簡單模擬登入成功
            const username = email.split('@')[0]; // 使用郵箱名稱作為用戶名
            
            // 儲存登入狀態到本地儲存
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('username', username);
            
            // 更新界面為已登入狀態
            if (userActions) userActions.style.display = 'none';
            if (userProfile) userProfile.style.display = 'block';
            if (usernameDisplay) usernameDisplay.textContent = username;
            
            // 關閉登入模態框
            loginModal.style.display = 'none';
            
            alert('登入成功！');
        });
    }
    
    // 處理註冊表單提交 - 只有在不使用 Firebase 時才啟用
    if (registerForm && !isUsingFirebase) {
        registerForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('register-name').value;
            const email = document.getElementById('register-email').value;
            const password = document.getElementById('register-password').value;
            const confirmPassword = document.getElementById('register-confirm-password').value;
            
            if (password !== confirmPassword) {
                alert('兩次輸入的密碼不一致，請重新輸入！');
                return;
            }
            
            // 這裡應該與後端API進行註冊
            // 簡單模擬註冊成功
            
            // 關閉註冊模態框
            registerModal.style.display = 'none';
            
            // 打開登入模態框
            loginModal.style.display = 'block';
            
            alert('註冊成功！請登入您的帳號。');
        });
    }
    
    // 處理登出 - 只有在不使用 Firebase 時才啟用
    if (logoutBtn && !isUsingFirebase) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            
            // 清除登入狀態
            localStorage.removeItem('isLoggedIn');
            localStorage.removeItem('username');
            
            // 更新界面為未登入狀態
            if (userProfile) userProfile.style.display = 'none';
            if (userActions) userActions.style.display = 'flex';
            
            alert('已成功登出！');
        });
    }
    
    // 顯示/隱藏用戶選單
    if (userDropdownBtn && userMenu) {
        userDropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            userMenu.style.display = userMenu.style.display === 'block' ? 'none' : 'block';
        });
        
        // 點擊文檔其他部分關閉用戶選單
        document.addEventListener('click', function(e) {
            if (!userDropdownBtn.contains(e.target) && !userMenu.contains(e.target)) {
                userMenu.style.display = 'none';
            }
        });
    }
    
    // 顯示通知函數 - 可以在頁面頂部顯示通知
    window.showNotification = function(message, type = 'success') {
        // 建立通知元素
        const notification = document.createElement('div');
        notification.className = 'notification ' + type;
        notification.textContent = message;
        
        // 添加到頁面頂部
        document.body.insertBefore(notification, document.body.firstChild);
        
        // 設定通知樣式
        Object.assign(notification.style, {
            position: 'fixed',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '10px 20px',
            borderRadius: '5px',
            zIndex: '9999',
            opacity: '0',
            transition: 'opacity 0.3s ease'
        });
        
        // 設定不同類型的樣式
        if (type === 'success') {
            notification.style.backgroundColor = '#4CAF50';
            notification.style.color = 'white';
        } else if (type === 'error') {
            notification.style.backgroundColor = '#F44336';
            notification.style.color = 'white';
        } else if (type === 'info') {
            notification.style.backgroundColor = '#2196F3';
            notification.style.color = 'white';
        }
        
        // 顯示通知
        setTimeout(() => {
            notification.style.opacity = '1';
        }, 10);
        
        // 3秒後自動關閉
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    };
});
