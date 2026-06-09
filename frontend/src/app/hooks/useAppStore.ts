// ==========================================
// HyperPush — Typed Redux Hooks
// (Typed helpers, no GraphQL)
// ==========================================

import type { AppDispatch, RootState } from '@app/store';
import { useDispatch, useSelector } from 'react-redux';

/** Typed dispatch hook */
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();

/** Typed selector hook */
export const useAppSelector = useSelector.withTypes<RootState>();
