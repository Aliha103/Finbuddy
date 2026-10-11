// src/state/ai.ts
import { atom, selector } from 'recoil'

export const aiTipState = atom<string | null>({
  key: 'aiTipState',
  default: null,
})
export const aiErrorState = atom<string | null>({
  key: 'aiErrorState',
  default: null,
})
export const aiLoadingState = atom<boolean>({
  key: 'aiLoadingState',
  default: false,
})
