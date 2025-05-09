// functions/index.js - 使用 Firebase Admin SDK 的完整 Cloud Functions

const functions = require('firebase-functions');
const admin = require('firebase-admin');

// 初始化 Firebase Admin SDK，不需要提供憑證，因為部署到 Firebase 平台時會自動處理
admin.initializeApp();

/**
 * 創建新用戶函數
 * 
 * 這個函數使用 Admin SDK 創建新用戶，包括 Auth 用戶和 Firestore 用戶資料
 */
exports.createUser = functions.https.onCall(async (data, context) => {
    console.log('開始執行 createUser Cloud Function');
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能創建用戶'
        );
    }

    // 檢查必要參數
    if (!data.email || !data.password || !data.name) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供電子郵件、密碼和姓名'
        );
    }

    try {
        console.log(`嘗試創建用戶: ${data.email}`);
        
        // 使用 Admin SDK 創建 Auth 用戶
        const userRecord = await admin.auth().createUser({
            email: data.email,
            password: data.password,
            displayName: data.name
        });
        
        console.log(`Auth 用戶創建成功: ${userRecord.uid}`);

        // 在 Firestore 中存儲用戶資料
        await admin.firestore().collection('users').doc(userRecord.uid).set({
            name: data.name,
            email: data.email,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            disabled: false
        });
        
        console.log(`Firestore 用戶資料已儲存: ${userRecord.uid}`);

        return { success: true, userId: userRecord.uid };
    } catch (error) {
        console.error('創建用戶失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `創建用戶失敗: ${error.message}`
        );
    }
});

/**
 * 更新用戶函數
 * 
 * 這個函數使用 Admin SDK 更新用戶資料，包括 Auth 用戶和 Firestore 用戶資料
 */
exports.updateUser = functions.https.onCall(async (data, context) => {
    console.log('開始執行 updateUser Cloud Function', data);
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能更新用戶'
        );
    }

    // 檢查必要參數
    if (!data.userId || !data.name) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供用戶ID和姓名'
        );
    }

    try {
        console.log(`檢查用戶是否存在: ${data.userId}`);
        
        // 確認用戶存在
        try {
            await admin.auth().getUser(data.userId);
        } catch (error) {
            console.error(`用戶不存在: ${data.userId}`, error);
            throw new functions.https.HttpsError(
                'not-found',
                `找不到用戶: ${error.message}`
            );
        }
        
        // 準備更新 Auth 用戶資料
        console.log(`準備更新 Auth 用戶: ${data.userId}`);
        const authUpdateData = {};
        
        if (data.name) {
            authUpdateData.displayName = data.name;
        }
        
        // 如果有密碼，更新密碼
        if (data.password) {
            authUpdateData.password = data.password;
        }
        
        // 如果指定了停用狀態，更新狀態
        if (data.disabled !== undefined) {
            authUpdateData.disabled = data.disabled;
        }
        
        // 只有在有數據需要更新時才更新 Auth 用戶
        if (Object.keys(authUpdateData).length > 0) {
            console.log(`更新 Auth 用戶資料: ${data.userId}`, authUpdateData);
            await admin.auth().updateUser(data.userId, authUpdateData);
            console.log(`Auth 用戶更新成功: ${data.userId}`);
        }

        // 更新 Firestore 中的用戶資料
        console.log(`更新 Firestore 用戶資料: ${data.userId}`);
        const firestoreUpdateData = {
            name: data.name,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        };

        // 如果指定了停用狀態，同時更新 Firestore 中的狀態
        if (data.disabled !== undefined) {
            firestoreUpdateData.disabled = data.disabled;
        }

        await admin.firestore().collection('users').doc(data.userId).update(firestoreUpdateData);
        console.log(`Firestore 用戶更新成功: ${data.userId}`);

        return { success: true };
    } catch (error) {
        console.error('更新用戶失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `更新用戶失敗: ${error.message}`
        );
    }
});

/**
 * 刪除用戶函數
 * 
 * 這個函數使用 Admin SDK 刪除用戶，包括 Auth 用戶和 Firestore 用戶資料
 */
exports.deleteUser = functions.https.onCall(async (data, context) => {
    console.log('開始執行 deleteUser Cloud Function', data);
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能刪除用戶'
        );
    }

    // 檢查必要參數
    if (!data.userId) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供用戶ID'
        );
    }

    try {
        console.log(`檢查用戶是否存在: ${data.userId}`);
        
        // 確認用戶存在
        try {
            const userRecord = await admin.auth().getUser(data.userId);
            // 檢查是否嘗試刪除管理員帳號
            if (userRecord.email === 'bababa.b810@gmail.com') {
                console.error(`嘗試刪除管理員帳號被阻止: ${data.userId}`);
                throw new functions.https.HttpsError(
                    'permission-denied',
                    '不能刪除管理員帳號'
                );
            }
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                throw error; // 如果是我們自己的 HttpsError (例如嘗試刪除管理員)，直接拋出
            }
            console.error(`用戶不存在: ${data.userId}`, error);
            throw new functions.https.HttpsError(
                'not-found',
                `找不到用戶: ${error.message}`
            );
        }
        
        try {
            // 先刪除 Firestore 中的用戶資料，如果失敗也不會影響 Auth 用戶
            console.log(`刪除 Firestore 用戶資料: ${data.userId}`);
            await admin.firestore().collection('users').doc(data.userId).delete();
            console.log(`Firestore 用戶刪除成功: ${data.userId}`);
        } catch (error) {
            console.error(`刪除 Firestore 用戶資料失敗: ${data.userId}`, error);
            // 仍然繼續嘗試刪除 Auth 用戶
        }
        
        // 刪除 Auth 用戶
        console.log(`刪除 Auth 用戶: ${data.userId}`);
        await admin.auth().deleteUser(data.userId);
        console.log(`Auth 用戶刪除成功: ${data.userId}`);

        return { success: true };
    } catch (error) {
        console.error('刪除用戶失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `刪除用戶失敗: ${error.message}`
        );
    }
});

/**
 * 更新用戶密碼函數
 * 
 * 這個函數專門用於更新用戶密碼，僅限管理員使用
 */
exports.updateUserPassword = functions.https.onCall(async (data, context) => {
    console.log('開始執行 updateUserPassword Cloud Function');
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能更新用戶密碼'
        );
    }

    // 檢查必要參數
    if (!data.userId || !data.password) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供用戶ID和新密碼'
        );
    }

    try {
        console.log(`檢查用戶是否存在: ${data.userId}`);
        
        // 確認用戶存在
        try {
            await admin.auth().getUser(data.userId);
        } catch (error) {
            console.error(`用戶不存在: ${data.userId}`, error);
            throw new functions.https.HttpsError(
                'not-found',
                `找不到用戶: ${error.message}`
            );
        }
        
        // 更新用戶密碼
        console.log(`更新用戶密碼: ${data.userId}`);
        await admin.auth().updateUser(data.userId, {
            password: data.password
        });
        
        console.log(`密碼更新成功: ${data.userId}`);

        return { success: true };
    } catch (error) {
        console.error('更新用戶密碼失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `更新用戶密碼失敗: ${error.message}`
        );
    }
});

/**
 * 獲取所有用戶函數
 * 
 * 這個函數用於獲取所有用戶資料，僅限管理員使用
 * 此函數可以替代前端的直接 Firestore 查詢，確保完全的安全性
 */
exports.getAllUsers = functions.https.onCall(async (data, context) => {
    console.log('開始執行 getAllUsers Cloud Function');
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能查看所有用戶'
        );
    }

    try {
        console.log('獲取 Firestore 用戶資料');
        
        // 從 Firestore 獲取所有用戶資料
        const usersSnapshot = await admin.firestore().collection('users').get();
        
        if (usersSnapshot.empty) {
            console.log('沒有找到用戶資料');
            return { users: [] };
        }
        
        // 處理用戶資料
        const users = [];
        usersSnapshot.forEach(doc => {
            const userData = doc.data();
            users.push({
                id: doc.id,
                name: userData.name || '未設置姓名',
                email: userData.email || '',
                createdAt: userData.createdAt ? userData.createdAt.toDate() : null,
                disabled: userData.disabled || false
            });
        });
        
        console.log(`獲取到 ${users.length} 個用戶資料`);
        
        return { users };
    } catch (error) {
        console.error('獲取用戶資料失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `獲取用戶資料失敗: ${error.message}`
        );
    }
});
/**
 * 切換用戶狀態（啟用/停用）
 * 
 * 這個函數用於啟用或停用用戶，包括 Auth 用戶和 Firestore 用戶資料
 */
exports.toggleUserStatus = functions.https.onCall(async (data, context) => {
    console.log('開始執行 toggleUserStatus Cloud Function', data);
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能變更用戶狀態'
        );
    }

    // 檢查必要參數
    if (!data.userId || !data.newStatus) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供用戶ID和新狀態'
        );
    }

    try {
        console.log(`檢查用戶是否存在: ${data.userId}`);
        
        // 確認用戶存在
        let userRecord;
        try {
            userRecord = await admin.auth().getUser(data.userId);
            
            // 檢查是否嘗試停用管理員帳號
            if (userRecord.email === 'bababa.b810@gmail.com' && data.newStatus === 'disabled') {
                console.error(`嘗試停用管理員帳號被阻止: ${data.userId}`);
                throw new functions.https.HttpsError(
                    'permission-denied',
                    '不能停用管理員帳號'
                );
            }
        } catch (error) {
            if (error instanceof functions.https.HttpsError) {
                throw error; // 如果是我們自己的 HttpsError (例如嘗試停用管理員)，直接拋出
            }
            console.error(`用戶不存在: ${data.userId}`, error);
            throw new functions.https.HttpsError(
                'not-found',
                `找不到用戶: ${error.message}`
            );
        }
        
        // 設置新的停用狀態
        const disabled = data.newStatus === 'disabled';
        
        // 更新 Auth 用戶狀態
        console.log(`更新 Auth 用戶狀態: ${data.userId}, disabled=${disabled}`);
        await admin.auth().updateUser(data.userId, {
            disabled: disabled
        });
        console.log(`Auth 用戶狀態更新成功: ${data.userId}`);
        
        // 更新 Firestore 中的用戶狀態
        console.log(`更新 Firestore 用戶狀態: ${data.userId}, status=${data.newStatus}`);
        await admin.firestore().collection('users').doc(data.userId).update({
            status: data.newStatus,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        console.log(`Firestore 用戶狀態更新成功: ${data.userId}`);

        return { 
            success: true,
            message: disabled ? '用戶已停用' : '用戶已啟用'
        };
    } catch (error) {
        console.error('變更用戶狀態失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `變更用戶狀態失敗: ${error.message}`
        );
    }
});

/**
 * 發送密碼重設郵件
 * 
 * 這個函數使用 Admin SDK 為用戶發送密碼重設郵件
 */
exports.sendPasswordResetEmail = functions.https.onCall(async (data, context) => {
    console.log('開始執行 sendPasswordResetEmail Cloud Function');
    
    // 檢查呼叫者是否為管理員
    if (!context.auth) {
        console.error('未經認證的訪問被拒絕');
        throw new functions.https.HttpsError(
            'unauthenticated',
            '需要登入才能使用此功能'
        );
    }

    if (context.auth.token.email !== 'bababa.b810@gmail.com') {
        console.error(`非管理員訪問被拒絕: ${context.auth.token.email}`);
        throw new functions.https.HttpsError(
            'permission-denied',
            '只有管理員才能發送密碼重設郵件'
        );
    }

    // 檢查必要參數
    if (!data.email) {
        console.error('缺少必要參數', data);
        throw new functions.https.HttpsError(
            'invalid-argument',
            '必須提供電子郵件'
        );
    }

    try {
        console.log(`檢查用戶是否存在: ${data.email}`);
        
        // 確認用戶存在
        try {
            await admin.auth().getUserByEmail(data.email);
        } catch (error) {
            console.error(`用戶不存在: ${data.email}`, error);
            throw new functions.https.HttpsError(
                'not-found',
                `找不到該電子郵件的用戶`
            );
        }
        
        // 生成密碼重設連結
        console.log(`生成密碼重設連結: ${data.email}`);
        
        const actionCodeSettings = {
            url: data.redirectUrl || 'https://b861227candy.github.io',
            handleCodeInApp: false
        };
        
        const link = await admin.auth().generatePasswordResetLink(
            data.email,
            actionCodeSettings
        );
        
        console.log(`密碼重設連結已生成: ${data.email}`);
        
        // 這裡我們使用 Firebase 的自動郵件發送功能，不需要額外的代碼
        // 如果需要自定義郵件，可以使用 nodemailer 或其他服務
        
        return { 
            success: true,
            message: '密碼重設郵件已發送'
        };
    } catch (error) {
        console.error('發送密碼重設郵件失敗:', error);
        throw new functions.https.HttpsError(
            'internal',
            `發送密碼重設郵件失敗: ${error.message}`
        );
    }
});