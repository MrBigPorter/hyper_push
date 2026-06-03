// ==========================================
// HyperPush — Typed Redux Hooks
// (纯类型工具，不含 GraphQL)
// ==========================================

import type { AppDispatch, RootState } from '@app/store';
import { useDispatch, useSelector } from 'react-redux';

/** Typed dispatch hook */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed selector hook */
export const useAppSelector = useSelector.withTypes<RootState>();
