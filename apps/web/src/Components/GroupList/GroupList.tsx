import React from 'react'
import { Link } from 'react-router-dom'
import { FaUserFriends, FaPlus } from 'react-icons/fa'
import { Group } from '../../types'
import './GroupList.css'

interface GroupListProps {
  groups?: Group[]
  onCreateGroup?: () => void
}

// Mock data if none provided (for visualization during dev)
const MOCK_GROUPS: Group[] = [
  {
    id: 'g1',
    name: 'Trip to Paris',
    purpose: 'Travel',
    members: ['Alice', 'Bob', 'You'],
    isPersonal: false,
    createdBy: 'You',
    createdAt: new Date().toISOString(),
    totalExpenses: 1250.50,
    balances: { 'You': 150.00 } // Positive means you are owed
  },
  {
    id: 'g2',
    name: 'Apartment 4B',
    purpose: 'Household',
    members: ['John', 'Jane', 'You'],
    isPersonal: false,
    createdBy: 'John',
    createdAt: new Date().toISOString(),
    totalExpenses: 450.00,
    balances: { 'You': -32.50 } // Negative means you owe
  },
  {
    id: 'g3',
    name: 'Friday Lunch',
    purpose: 'Food',
    members: ['Team', 'You'],
    isPersonal: false,
    createdBy: 'You',
    createdAt: new Date().toISOString(),
    totalExpenses: 85.00,
    balances: { 'You': 0 } // Settled
  }
]

function GroupList({ groups = MOCK_GROUPS, onCreateGroup }: GroupListProps) {
  return (
    <div className="group-list-card">
      <div className="group-list-header">
        <h2>My Groups</h2>
        {onCreateGroup && (
          <button className="add-group-btn-icon" onClick={onCreateGroup} aria-label="Create Group">
            <FaPlus />
          </button>
        )}
      </div>

      <div className="groups-container">
        {groups.length === 0 ? (
          <div className="empty-groups">
            <p>No groups yet.</p>
            {onCreateGroup && <button onClick={onCreateGroup}>Create a Group</button>}
          </div>
        ) : (
          groups.map(group => {
            const myBalance = group.balances['You'] || 0
            const balanceClass = myBalance > 0 ? 'owed' : myBalance < 0 ? 'owing' : 'settled'
            const balanceText = myBalance > 0
              ? `you are owed €${myBalance.toFixed(2)}`
              : myBalance < 0
                ? `you owe €${Math.abs(myBalance).toFixed(2)}`
                : 'settled'

            return (
              <Link to={`/dashboard/group/${group.id}`} key={group.id} className="group-item">
                <div className="group-icon">
                  <FaUserFriends />
                </div>
                <div className="group-info">
                  <span className="group-name">{group.name}</span>
                  <span className="group-purpose">{group.purpose}</span>
                </div>
                <div className={`group-balance ${balanceClass}`}>
                  {balanceText}
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}

export default GroupList
