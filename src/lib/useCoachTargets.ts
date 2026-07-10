import { useCallback, useRef, useState } from 'react';
import { ScrollView, View } from 'react-native';
import type { CoachRect } from '../components/CoachMarks';

/**
 * เก็บ ref ของสิ่งที่ coach marks จะไฮไลต์ แล้ววัดตำแหน่งจริงบนจอ.
 *
 * ทำไมต้องวัดตอน runtime แทนที่จะใช้ onLayout: onLayout ให้พิกัดเทียบกับ
 * parent ใกล้สุด แต่ overlay อยู่บน Modal ที่ใช้พิกัดของหน้าจอ — คนละระบบ.
 * `measureInWindow` ให้พิกัดหน้าจอตรง ๆ.
 *
 * และเพราะบาง target อยู่ล่างสุดจนมองไม่เห็น จึงต้องเลื่อน ScrollView ไปหาก่อน
 * แล้วค่อยวัด. ตำแหน่งภายในเนื้อหาได้จาก `measureLayout` เทียบกับ inner view
 * ของ ScrollView — แม่นแม้ target ซ้อนอยู่ในกล่องลึกหลายชั้น ซึ่ง onLayout
 * ธรรมดาให้ค่าผิด (มันเทียบกับ parent ที่ห่อ ไม่ใช่เนื้อหาทั้งแผ่น).
 */
export function useCoachTargets(
  scrollRef: React.RefObject<ScrollView | null>,
) {
  const nodes = useRef<Record<string, View | null>>({});
  /** undefined = ยังไม่เคยวัด, null = วัดแล้วแต่ target ไม่อยู่บนจอ (fallback) */
  const [rects, setRects] = useState<Record<string, CoachRect | null | undefined>>({});

  const register = useCallback(
    (key: string) => ({
      ref: (node: View | null) => {
        nodes.current[key] = node;
      },
    }),
    [],
  );

  const measure = useCallback((key: string): Promise<CoachRect | undefined> => {
    const node = nodes.current[key];
    if (!node) return Promise.resolve(undefined);
    return new Promise((resolve) => {
      node.measureInWindow((x, y, width, height) => {
        if (width === 0 && height === 0) resolve(undefined);
        else resolve({ x, y, width, height });
      });
    });
  }, []);

  /**
   * ตำแหน่งบนจอของ "หัวเนื้อหา" ที่เลื่อนได้ — เนื้อหาเลื่อนขึ้นเท่าไหร่
   * หัวมันก็ลอยพ้นจอขึ้นไปเท่านั้น. เอา window-y ของ target ลบค่านี้จะได้
   * ตำแหน่งภายในเนื้อหาโดยไม่ต้องใช้ measureLayout ซึ่ง Fabric ไม่รองรับ
   * กับ node handle (โยน "must be called with a ref to a native component").
   */
  const contentTopInWindow = useCallback((): Promise<number | null> => {
    const sv = scrollRef.current as unknown as {
      getInnerViewRef?: () => View | null;
    } | null;
    const inner = sv?.getInnerViewRef?.();
    if (!inner?.measureInWindow) return Promise.resolve(null);
    return new Promise((resolve) => {
      inner.measureInWindow((_x, y) => resolve(y));
    });
  }, [scrollRef]);

  /** เลื่อนให้ target มาอยู่กลางจอ แล้ววัด — คืน rect ที่ overlay ใช้ได้จริง */
  const focus = useCallback(
    async (key: string, viewportHeight: number) => {
      const before = await measure(key);
      const innerTop = await contentTopInWindow();
      if (before && innerTop !== null && scrollRef.current) {
        const contentY = before.y - innerTop;
        // จัดกลางจอให้กดง่าย — ยกเว้น target ที่สูงเกินครึ่งจอ ให้ยึดหัวไว้
        // แทน ไม่งั้นจัดกลางแล้วหัวหลุดขอบบน. ScrollView clamp สุดขอบเนื้อหา
        // ให้เอง กรณี target อยู่บน/ล่างสุดจนเลื่อนถึงกลางไม่ได้.
        const target =
          before.height > viewportHeight * 0.6
            ? contentY - viewportHeight * 0.12
            : contentY - (viewportHeight - before.height) / 2;
        scrollRef.current.scrollTo({ y: Math.max(0, target), animated: true });
        // รอ scroll จบก่อนวัด ไม่งั้นได้พิกัดระหว่างทาง
        await new Promise((r) => setTimeout(r, 380));
      }
      const rect = await measure(key);
      setRects((prev) => ({ ...prev, [key]: rect ?? null }));
      return rect;
    },
    [contentTopInWindow, measure, scrollRef],
  );

  return { register, focus, rects };
}
