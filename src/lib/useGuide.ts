import { useCallback, useEffect, useRef, useState } from 'react';
import { ScrollView, useWindowDimensions } from 'react-native';
import type { CoachStep } from '../components/CoachMarks';
import { useCoachTargets } from './useCoachTargets';
import { getNumber, setNumber, guideKeys } from './storage';

type GuideId = Parameters<typeof guideKeys>[0];

/**
 * วงจรชีวิตของ quick start guide หนึ่งหน้า:
 * เปิดเองครั้งแรก (ตามเวอร์ชัน) → เลื่อนจอไปหา target ของขั้นปัจจุบัน →
 * จำขั้นที่ค้าง → ปิดแล้วบันทึกว่าดูเวอร์ชันนี้จบ.
 *
 * แยกออกมาเพราะมีสามหน้าใช้ (Home / นัดหมาย / จองนัด) — ก๊อป logic สามชุด
 * คือสามที่ที่จะแก้บั๊กไม่ครบ.
 */
export function useGuide(opts: {
  id: GuideId;
  version: number;
  steps: CoachStep[];
  scrollRef: React.RefObject<ScrollView | null>;
  /** หน่วงก่อนเปิดครั้งแรก ให้เฟรมแรกวาดเสร็จก่อนวัดตำแหน่ง */
  startDelayMs?: number;
}) {
  const { id, version, steps, scrollRef, startDelayMs = 600 } = opts;
  const keys = guideKeys(id);
  const { register, focus, rects } = useCoachTargets(scrollRef);
  const { height: windowHeight } = useWindowDimensions();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const openedOnce = useRef(false);

  // เปิดเองเมื่อยังไม่เคยดูเวอร์ชันนี้จบ — เวอร์ชันใหม่กว่า = หน้าเปลี่ยนโครง
  // มากพอที่คนเก่าควรเห็นอีกครั้ง
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const seen = await getNumber(keys.completedVersion);
      if (cancelled || (seen !== null && seen >= version)) return;
      const saved = await getNumber(keys.step);
      const startAt = saved !== null && saved < steps.length ? saved : 0;
      setTimeout(() => {
        if (cancelled || openedOnce.current) return;
        openedOnce.current = true;
        setStep(startAt);
        setOpen(true);
      }, startDelayMs);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // เลื่อนจอไปหา target ของขั้นปัจจุบัน แล้ววัดให้ spotlight
  useEffect(() => {
    if (!open) return;
    const key = steps[step]?.key;
    if (!key) return;
    void focus(key, windowHeight);
    void setNumber(keys.step, step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, step, steps]);

  const finish = useCallback(() => {
    setOpen(false);
    void setNumber(keys.completedVersion, version);
    void setNumber(keys.step, 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  /** เปิดใหม่จากปุ่ม replay — เริ่มขั้นแรกเสมอ */
  const start = useCallback(() => {
    openedOnce.current = true;
    setStep(0);
    setOpen(true);
  }, []);

  return { open, step, setStep, start, finish, register, rects };
}
