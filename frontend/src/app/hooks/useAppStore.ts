// ==========================================
// HyperPush — Typed Redux Hooks
// (纯类型工具，不含 GraphQL)
// ==========================================

import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch } from '@app/store';

/** Typed dispatch hook */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed selector hook */
export const useAppSelector = useSelector.withTypes<RootState>();
