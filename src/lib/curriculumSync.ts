import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { CurriculumState, TermData, YearReportDate, LockState } from '../types';
import { INITIAL_PLAN } from '../data/defaultPlan';
import { DEFAULT_YEAR_REPORT_DATES } from '../data/reportCycles';

const CURRICULUM_DOC_REF = doc(db, 'curriculum', 'main');

// In-memory / cache fallback
const DEFAULT_STATE: CurriculumState = {
  version: 1,
  lastUpdated: new Date().toISOString(),
  lock: {
    isLocked: false,
    hasPin: true,
    lockedBy: 'Department'
  },
  plan: INITIAL_PLAN,
  reportDates: DEFAULT_YEAR_REPORT_DATES
};

/**
 * Fetch the latest document from Firestore once.
 */
export async function getCurriculumFromCloud(): Promise<CurriculumState | null> {
  try {
    const snap = await getDoc(CURRICULUM_DOC_REF);
    if (snap.exists()) {
      const data = snap.data() as any;
      return {
        version: data.version || 1,
        lastUpdated: data.lastUpdated || new Date().toISOString(),
        lock: data.lock || { isLocked: false, hasPin: true },
        plan: Array.isArray(data.plan) && data.plan.length > 0 ? data.plan : INITIAL_PLAN,
        reportDates: Array.isArray(data.reportDates) ? data.reportDates : DEFAULT_YEAR_REPORT_DATES
      };
    }
  } catch (err) {
    console.error('Failed to get curriculum from cloud:', err);
  }
  return null;
}

/**
 * Subscribe in real time to the curriculum document in Firestore.
 * When changes are saved on desktop, mobile immediately receives the update through this listener.
 */
export function subscribeToCurriculum(
  onUpdate: (state: CurriculumState) => void,
  onError: (err: any) => void
) {
  try {
    // 1. First trigger an eager fetch to show changes instantly upon opening
    getCurriculumFromCloud().then((cloudData) => {
      if (cloudData) {
        onUpdate(cloudData);
      }
    });

    // 2. Real-time snapshot listener
    const unsubscribe = onSnapshot(
      CURRICULUM_DOC_REF,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as any;
          const cleanState: CurriculumState = {
            version: data.version || 1,
            lastUpdated: data.lastUpdated || new Date().toISOString(),
            lock: data.lock || { isLocked: false, hasPin: true },
            plan: Array.isArray(data.plan) && data.plan.length > 0 ? data.plan : INITIAL_PLAN,
            reportDates: Array.isArray(data.reportDates) ? data.reportDates : DEFAULT_YEAR_REPORT_DATES
          };
          
          try {
            localStorage.setItem('curriculum_plan_v2', JSON.stringify(cleanState.plan));
            localStorage.setItem('curriculum_report_dates_v2', JSON.stringify(cleanState.reportDates));
            localStorage.setItem('curriculum_lock_state', JSON.stringify(cleanState.lock));
            localStorage.setItem('curriculum_last_updated', cleanState.lastUpdated);
          } catch {}

          onUpdate(cleanState);
        } else {
          // If no document in cloud yet, seed with current initial state
          saveCurriculumToCloud(INITIAL_PLAN, DEFAULT_YEAR_REPORT_DATES, { isLocked: false, hasPin: true })
            .then(() => onUpdate(DEFAULT_STATE))
            .catch((err) => console.warn('Could not auto-seed cloud curriculum:', err));
        }
      },
      (error) => {
        console.error('Firestore real-time subscription error:', error);
        onError(error);
      }
    );
    return unsubscribe;
  } catch (err) {
    console.error('Error setting up Firestore listener:', err);
    onError(err);
    return () => {};
  }
}

/**
 * Save updated curriculum plan, report dates, or lock state directly to Firestore.
 */
export async function saveCurriculumToCloud(
  plan?: TermData[],
  reportDates?: YearReportDate[],
  lock?: LockState
): Promise<{ success: boolean; lastUpdated: string }> {
  const lastUpdated = new Date().toISOString();
  const updatePayload: Record<string, any> = {
    lastUpdated
  };

  if (plan && Array.isArray(plan)) {
    updatePayload.plan = plan;
  }
  if (reportDates && Array.isArray(reportDates)) {
    updatePayload.reportDates = reportDates;
  }
  if (lock) {
    updatePayload.lock = lock;
  }

  try {
    await setDoc(CURRICULUM_DOC_REF, updatePayload, { merge: true });
    return { success: true, lastUpdated };
  } catch (err) {
    console.error('Error saving to Firestore:', err);
    throw err;
  }
}
