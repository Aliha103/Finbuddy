import React, { Suspense, lazy, useEffect, useCallback } from 'react'
import { Routes, Route, useLocation, Link } from 'react-router-dom'
import DashboardNavBar from './Dashboard_NavBar'
import ErrorBoundary from '../../Components/ErrorBoundary/ErrorBoundary'
import { useBalanceData } from '../../hooks/useBalanceData'
import { AnimatePresence, motion } from 'framer-motion'
import BalanceChart from '../../Components/balanceChart/balanceChart'
import { useAIAssistant } from '../../hooks/useAIAssistant'
import AIAssistantBanner from '../../Components/AIAssistantBanner/AIAssistantBanner'
import './DashboardHome.scss'
import { atom, useRecoilState } from 'recoil'

// Lazy-loaded components
const Balance = lazy(() => import('../../Components/Balance/Balance'))
const AddExpensePopup = lazy(
  () => import('../../Components/PopUp/AddExpensePopup'),
)
const CreateGroup = lazy(
  () => import('../../Components/PopUp/CreateGroup/CreateGroup'),
)

const MODAL = Object.freeze({
  NONE: null,
  ADD_EXPENSE: 'add-expense',
  CREATE_GROUP: 'create-group',
})

const modalState = atom({
  key: 'modalState',
  default: MODAL.NONE,
})

const recentExpenseState = atom({
  key: 'recentExpenseState',
  default: null,
})

// --- LAYOUT COMPONENTS ---
function GroupList() {
  return (
    <div className="dashboard-card dashboard-group-list">
      <h2>Group List</h2>
      <div className="dashboard-placeholder">GROUP LIST</div>
    </div>
  )
}

function RecentActivity() {
  return (
    <div className="dashboard-card dashboard-recent-activity">
      <h2>Recent Activity</h2>
      <div className="dashboard-placeholder" style={{ color: '#ea2626' }}>
        No recent activity
      </div>
    </div>
  )
}

function SuspenseFallback({ message = 'Loading...' }) {
  return (
    <div className="dashboard-loading">
      <span role="img" aria-label="Loading" style={{ marginRight: 12 }}>
        🚀
      </span>
      {message}
    </div>
  )
}

// --- Dashboard Home Section with LLM Assistant ---
function DashboardHomeSection({
  onOpenAddExpense,
  onOpenCreateGroup,
  recentExpense,
  systemStatusBanner,
}) {
  const { data, totals } = useBalanceData()
  const { getTip } = useAIAssistant()

  // Automatically fetch an LLM tip when an expense is added
  useEffect(() => {
    if (recentExpense) {
      const context = `User's balance: €${totals.net}. Last expense: €${
        recentExpense.amount
      } for ${recentExpense.category ?? 'unknown category'}.`
      const question =
        'What can the user do to keep finances healthy or fix mistakes?'
      getTip(context, question)
    }
  }, [recentExpense, totals.net, getTip])

  return (
    <main className="dashboard-section" tabIndex={0}>
      {/* --- LLM Assistant Banner --- */}
      <AIAssistantBanner />
      {/* Top Banner + Buttons */}
      <div className="dashboard-top-row">
        {systemStatusBanner}
        <div className="dashboard-toolbar-right">
          <button
            className="dashboard-btn dashboard-btn-create-group"
            onClick={onOpenCreateGroup}
            aria-label="Create a new group"
            type="button"
          >
            + Create Group
          </button>
          <button
            className="dashboard-btn dashboard-btn-add-expense"
            onClick={onOpenAddExpense}
            aria-label="Add an expense"
            type="button"
          >
            + Add Expense
          </button>
        </div>
      </div>
      {/* --- Grid Layout --- */}
      <div className="dashboard-content-layout">
        {/* Left Column */}
        <div className="dashboard-left-col">
          <Link
            to="/dashboard/balance"
            className="dashboard-card dashboard-balance dashboard-card-link"
            style={{ textDecoration: 'none' }}
            aria-label={`View Balance: €${totals.net}`}
            tabIndex={0}
          >
            <h2>Balance</h2>
            <div
              style={{ fontSize: '2rem', fontWeight: 700, color: '#246bf7' }}
            >
              €{totals.net.toLocaleString()}
            </div>
          </Link>
          <GroupList />
        </div>
        {/* Center Column */}
        <div className="dashboard-center-col">
          <div className="dashboard-card dashboard-spending-history">
            <BalanceChart data={data} title="Spending History" height={320} />
          </div>
        </div>
        {/* Right Column */}
        <div className="dashboard-right-col">
          <RecentActivity />
        </div>
      </div>
      {/* --- Feedback on expense add --- */}
      <AnimatePresence>
        {recentExpense && (
          <motion.div
            className="dashboard-expense-added-feedback"
            initial={{ opacity: 0, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.8 }}
            transition={{ duration: 0.36, type: 'spring' }}
            aria-live="polite"
            tabIndex={0}
          >
            <strong>Expense added!</strong>
          </motion.div>
        )}
      </AnimatePresence>
      {/* --- Optional: Button to Manually Ask AI --- */}
      <button
        className="dashboard-btn-ai-help"
        onClick={() =>
          getTip(
            `User's balance: €${totals.net}. Recent spending patterns: ...`,
            'How can I optimize my finances this month?',
          )
        }
      >
        Ask AI for Advice
      </button>
    </main>
  )
}

function Dashboard() {
  const location = useLocation()
  const [modal, setModal] = useRecoilState(modalState)
  const [recentExpense, setRecentExpense] = useRecoilState(recentExpenseState)
  const { totals } = useBalanceData()

  const routeKey =
    location.pathname === '/dashboard' || location.pathname === '/dashboard/'
      ? 'home'
      : location.pathname.includes('balance')
      ? 'balance'
      : 'other'

  const handleAddExpense = useCallback(
    (expense) => {
      setRecentExpense(expense)
      setTimeout(() => setRecentExpense(null), 2200)
      setModal(MODAL.NONE)
    },
    [setRecentExpense, setModal],
  )

  const handleCreateGroup = useCallback(() => {
    setModal(MODAL.NONE)
  }, [setModal])

  const openModal = (type) => setModal(type)

  return (
    <>
      <DashboardNavBar />
      <ErrorBoundary>
        <Suspense fallback={<SuspenseFallback />}>
          <Routes>
            <Route
              path="/"
              element={
                <DashboardHomeSection
                  onOpenAddExpense={() => openModal(MODAL.ADD_EXPENSE)}
                  onOpenCreateGroup={() => openModal(MODAL.CREATE_GROUP)}
                  recentExpense={recentExpense}
                  systemStatusBanner={null}
                />
              }
            />
            <Route
              path="/balance"
              element={
                <Suspense
                  fallback={<SuspenseFallback message="Loading Balance..." />}
                >
                  <Balance />
                </Suspense>
              }
            />
          </Routes>
        </Suspense>
      </ErrorBoundary>
      {/* --- Popups --- */}
      <AnimatePresence>
        {modal === MODAL.ADD_EXPENSE && (
          <Suspense
            fallback={<SuspenseFallback message="Opening Expense Popup..." />}
          >
            <AddExpensePopup
              onClose={() => setModal(MODAL.NONE)}
              onAdd={handleAddExpense}
            />
          </Suspense>
        )}
        {modal === MODAL.CREATE_GROUP && (
          <Suspense
            fallback={<SuspenseFallback message="Opening Create Group..." />}
          >
            <CreateGroup
              onCancel={() => setModal(MODAL.NONE)}
              onCreate={handleCreateGroup}
            />
          </Suspense>
        )}
      </AnimatePresence>
    </>
  )
}

export default Dashboard
