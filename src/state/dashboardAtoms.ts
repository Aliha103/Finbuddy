import { atom } from 'recoil'

export const MODAL = Object.freeze({
  NONE: null,
  ADD_EXPENSE: 'add-expense',
  CREATE_GROUP: 'create-group',
})

export const modalState = atom({
  key: 'modalState',
  default: MODAL.NONE,
})

export const recentExpenseState = atom({
  key: 'recentExpenseState',
  default: null,
})
