import React, { useEffect, useState } from 'react'
import { useEngine } from '@ldesign/engine-react'

// 模拟用户数据
const mockUsers: Record<string, any> = {
  '1': { id: '1', name: 'Alice', role: 'Admin', email: 'alice@example.com', avatar: '👩' },
  '2': { id: '2', name: 'Bob', role: 'User', email: 'bob@example.com', avatar: '👨' },
  '3': { id: '3', name: 'Charlie', role: 'Developer', email: 'charlie@example.com', avatar: '👨‍💻' },
}

function User() {
  const engine = useEngine()
  const [userId, setUserId] = useState<string>('1')
  const [user, setUser] = useState<any>(null)

  // 从路由参数获取用户 ID（如果路由器可用）
  useEffect(() => {
    if (engine.router) {
      const route = engine.router.getCurrentRoute()
      const id = route.value?.params?.id || '1'
      setUserId(id)
    }
  }, [engine.router])

  // 加载用户数据
  useEffect(() => {
    const userData = mockUsers[userId] || mockUsers['1']
    setUser(userData)
    
    // 更新 engine 状态
    engine.state.set('currentUser', userData)
  }, [userId, engine])

  const handleUserChange = (newUserId: string) => {
    setUserId(newUserId)
    
    // 如果路由器可用，使用路由导航
    if (engine.router) {
      engine.router.push(`/user/${newUserId}`)
    }
  }

  if (!user) {
    return <div className="page">加载中...</div>
  }

  return (
    <div className="page">
      <h2>👤 用户详情</h2>
      
      <div className="card">
        <div className="user-profile">
          <div className="user-avatar">{user.avatar}</div>
          <div className="user-info">
            <h3>{user.name}</h3>
            <p className="user-role">{user.role}</p>
            <p className="user-email">{user.email}</p>
          </div>
        </div>
      </div>

      <div className="card">
        <h3>🔄 切换用户</h3>
        <div className="user-switcher">
          {Object.values(mockUsers).map((u) => (
            <button
              key={u.id}
              onClick={() => handleUserChange(u.id)}
              className={userId === u.id ? 'active' : ''}
            >
              {u.avatar} {u.name}
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <h3>📊 用户统计</h3>
        <table className="info-table">
          <tbody>
            <tr>
              <td><strong>用户 ID:</strong></td>
              <td>{user.id}</td>
            </tr>
            <tr>
              <td><strong>姓名:</strong></td>
              <td>{user.name}</td>
            </tr>
            <tr>
              <td><strong>角色:</strong></td>
              <td>{user.role}</td>
            </tr>
            <tr>
              <td><strong>邮箱:</strong></td>
              <td>{user.email}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>🛣️ 路由参数</h3>
        <p>当前路由参数: <code>id = {userId}</code></p>
        <p className="hint">
          这个页面演示了如何使用路由参数。尝试切换不同的用户，观察 URL 的变化。
        </p>
      </div>
    </div>
  )
}

export default User

