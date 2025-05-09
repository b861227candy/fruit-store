// 會員管理系統功能
document.addEventListener('DOMContentLoaded', function() {
    // 獲取DOM元素
    const usersList = document.getElementById('users-list');
    const searchInput = document.getElementById('search-input');
    const searchBtn = document.getElementById('search-btn');
    const statusFilter = document.getElementById('status-filter');
    const pagination = document.getElementById('pagination');
    
    // 新增會員相關元素
    const addUserBtn = document.getElementById('add-user-btn');
    const addUserModal = document.getElementById('add-user-modal');
    const closeAddUser = document.getElementById('close-add-user');
    const addUserForm = document.getElementById('add-user-form');
    const cancelAddUser = document.getElementById('cancel-add-user');
    
    // 提示訊息元素
    const toast = document.getElementById('toast');
    const toastMessage = document.querySelector('.toast-message');
    const toastClose = document.querySelector('.toast-close');
    
    // 從window對象獲取Firebase服務 (與member.js一致)
    const { 
        auth, 
        db, 
        createUserWithEmailAndPassword, 
        onAuthStateChanged,
        collection,
        getDocs,
        query,
        orderBy,
        doc,
        setDoc,
        serverTimestamp
    } = window.firebaseServices;

    // 分頁設置
    let currentPage = 1;
    const usersPerPage = 10;
    let filteredUsers = [];
    
    // 檢查用戶是否為管理員
    const checkAdminAccess = function() {
        onAuthStateChanged(auth, function(user) {
            if (!user || user.email !== 'bababa.b810@gmail.com') {
                console.log('非管理員訪問，重定向回首頁');
                window.location.href = 'index.html';
            } else {
                console.log('管理員已登入');
                // 加載會員數據
                loadUsers();
            }
        });
    };
    
    // 載入會員數據
    const loadUsers = async function() {
        try {
            usersList.innerHTML = `
                <tr class="loading-row">
                    <td colspan="5">
                        <div class="loader"></div>
                        <p>載入會員資料中...</p>
                    </td>
                </tr>
            `;
            
            // 從 Firestore 獲取用戶數據
            const usersCollection = collection(db, 'users');
            const usersQuery = query(usersCollection, orderBy('createdAt', 'desc'));
            const usersSnapshot = await getDocs(usersQuery);
            
            if (usersSnapshot.empty) {
                usersList.innerHTML = `
                    <tr class="no-data-row">
                        <td colspan="5">尚無會員資料</td>
                    </tr>
                `;
                return;
            }
            
            // 處理用戶數據
            const users = [];
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                users.push({
                    id: doc.id,
                    name: userData.name || '未設置姓名',
                    email: userData.email || '',
                    createdAt: userData.createdAt ? new Date(userData.createdAt.seconds * 1000) : new Date(),
                    disabled: userData.disabled || false
                });
            });
            
            // 保存所有用戶數據
            filteredUsers = [...users];
            
            // 顯示用戶數據
            displayUsers(filteredUsers);
            
        } catch (error) {
            console.error('載入會員數據失敗:', error);
            usersList.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="5">載入會員資料失敗，請重試</td>
                </tr>
            `;
        }
    };
    
    // 顯示會員數據
    const displayUsers = function(users, page = 1) {
        // 獲取當前頁會員
        const startIndex = (page - 1) * usersPerPage;
        const endIndex = startIndex + usersPerPage;
        const currentUsers = users.slice(startIndex, endIndex);
        
        if (currentUsers.length === 0) {
            usersList.innerHTML = `
                <tr class="no-data-row">
                    <td colspan="5">無符合條件的會員資料</td>
                </tr>
            `;
            pagination.innerHTML = '';
            return;
        }
        
        // 創建表格內容
        let html = '';
        currentUsers.forEach(user => {
            const createdDate = formatDate(user.createdAt);
            const statusClass = user.disabled ? 'status-disabled' : 'status-active';
            const statusText = user.disabled ? '已停用' : '啟用中';
            
            html += `
                <tr data-user-id="${user.id}">
                    <td>${user.id.substring(0, 8)}...</td>
                    <td>${user.name}</td>
                    <td>${user.email}</td>
                    <td>${createdDate}</td>
                    <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                </tr>
            `;
        });
        
        usersList.innerHTML = html;
        
        // 創建分頁控制
        createPagination(users.length, page);
    };
    
    // 創建分頁控制
    const createPagination = function(totalItems, currentPage) {
        const totalPages = Math.ceil(totalItems / usersPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let html = '';
        
        // 上一頁按鈕
        html += `
            <div class="page-item">
                <a href="#" class="page-link ${currentPage === 1 ? 'disabled' : ''}" 
                   onclick="${currentPage > 1 ? 'changePage(' + (currentPage - 1) + ')' : 'return false'}" 
                   title="上一頁">
                    <i class="fas fa-chevron-left"></i>
                </a>
            </div>
        `;
        
        // 頁碼按鈕
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, startPage + 4);
        
        for (let i = startPage; i <= endPage; i++) {
            html += `
                <div class="page-item">
                    <a href="#" class="page-link ${i === currentPage ? 'active' : ''}" 
                       onclick="changePage(${i})">${i}</a>
                </div>
            `;
        }
        
        // 下一頁按鈕
        html += `
            <div class="page-item">
                <a href="#" class="page-link ${currentPage === totalPages ? 'disabled' : ''}" 
                   onclick="${currentPage < totalPages ? 'changePage(' + (currentPage + 1) + ')' : 'return false'}" 
                   title="下一頁">
                    <i class="fas fa-chevron-right"></i>
                </a>
            </div>
        `;
        
        pagination.innerHTML = html;
    };
    
    // 切換頁面
    window.changePage = function(page) {
        currentPage = page;
        displayUsers(filteredUsers, currentPage);
    };
    
    // 格式化日期
    const formatDate = function(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };
    
    // 過濾會員
    const filterUsers = function() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const statusValue = statusFilter.value;
        
        let result = filteredUsers;
        
        // 按關鍵字過濾
        if (searchTerm) {
            result = result.filter(user => 
                user.name.toLowerCase().includes(searchTerm) || 
                user.email.toLowerCase().includes(searchTerm)
            );
        }
        
        // 按狀態過濾
        if (statusValue !== 'all') {
            const isDisabled = statusValue === 'disabled';
            result = result.filter(user => user.disabled === isDisabled);
        }
        
        // 重置頁碼並顯示結果
        currentPage = 1;
        displayUsers(result, currentPage);
    };
    
    // 顯示提示訊息
    const showToast = function(message, type = 'success') {
        toastMessage.textContent = message;
        toast.className = 'toast toast-' + type;
        toast.style.display = 'flex';
        
        // 5秒後自動隱藏
        setTimeout(() => {
            toast.style.display = 'none';
        }, 5000);
    };
    
    // 監聽搜尋按鈕點擊
    if (searchBtn) {
        searchBtn.addEventListener('click', filterUsers);
    }
    
    // 監聽搜尋輸入框回車鍵
    if (searchInput) {
        searchInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                filterUsers();
            }
        });
    }
    
    // 監聽狀態過濾器變化
    if (statusFilter) {
        statusFilter.addEventListener('change', filterUsers);
    }
    
    // 新增會員彈窗
    if (addUserBtn) {
        addUserBtn.addEventListener('click', function() {
            addUserModal.style.display = 'block';
        });
    }
    
    // 關閉新增會員彈窗
    if (closeAddUser) {
        closeAddUser.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        });
    }
    
    // 取消新增會員
    if (cancelAddUser) {
        cancelAddUser.addEventListener('click', function() {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        });
    }
    
    // 關閉提示訊息
    if (toastClose) {
        toastClose.addEventListener('click', function() {
            toast.style.display = 'none';
        });
    }
    
    // 提交新增會員表單 (與member.js中的註冊功能保持一致)
    if (addUserForm) {
        addUserForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const name = document.getElementById('new-user-name').value;
            const email = document.getElementById('new-user-email').value;
            const password = document.getElementById('new-user-password').value;
            
            // 處理註冊前的界面更新
            const submitBtn = this.querySelector('button[type="submit"]');
            const originalBtnText = submitBtn.textContent;
            submitBtn.textContent = '處理中...';
            submitBtn.disabled = true;
            
            // 使用 Firebase 創建用戶 (與member.js保持一致)
            console.log("嘗試創建用戶:", email);
            createUserWithEmailAndPassword(auth, email, password)
                .then((userCredential) => {
                    console.log("用戶創建成功:", userCredential.user.uid);
                    // 創建成功，添加用戶資料到 Firestore
                    const user = userCredential.user;
                    
                    // 使用新的Firestore語法
                    return setDoc(doc(db, 'users', user.uid), {
                        name: name,
                        email: email,
                        createdAt: serverTimestamp(),
                        disabled: false
                    });
                })
                .then(() => {
                    console.log("用戶資料保存成功");
                    showToast('會員新增成功！');
                    addUserModal.style.display = 'none';
                    addUserForm.reset();
                    
                    // 重新加載會員列表
                    loadUsers();
                })
                .catch((error) => {
                    console.error('創建用戶失敗:', error);
                    
                    // 處理常見錯誤
                    let errorMessage = error.message;
                    if (error.code === 'auth/email-already-in-use') {
                        errorMessage = '此電子郵件已被使用';
                    } else if (error.code === 'auth/invalid-email') {
                        errorMessage = '無效的電子郵件格式';
                    } else if (error.code === 'auth/weak-password') {
                        errorMessage = '密碼強度太弱，請使用更強的密碼';
                    }
                    
                    showToast(`新增會員失敗: ${errorMessage}`, 'error');
                })
                .finally(() => {
                    // 恢復按鈕狀態
                    submitBtn.textContent = originalBtnText;
                    submitBtn.disabled = false;
                });
        });
    }
    
    // 點擊彈窗外關閉彈窗
    window.addEventListener('click', function(event) {
        if (event.target === addUserModal) {
            addUserModal.style.display = 'none';
            addUserForm.reset();
        }
    });
    
    // 直接檢查管理員權限并加載數據
    try {
        console.log("Firebase 檢查初始化");
        checkAdminAccess();
    } catch (error) {
        console.error("Firebase 初始化失敗:", error);
        alert("Firebase 初始化失敗，會員管理功能可能無法正常使用");
    }
});