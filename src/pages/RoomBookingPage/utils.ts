import type { Room, Reservation, FilterState } from './types';

// ─── 상수 ────────────────────────────────────────────────────────────────────

export const EQUIPMENT_LABELS: Record<string, string> = {
  tv: 'TV',
  whiteboard: '화이트보드',
  video: '화상장비',
  speaker: '스피커',
};

export const ALL_EQUIPMENT = ['tv', 'whiteboard', 'video', 'speaker'] as const;

/** 09:00 ~ 20:00, 30분 간격 */
export const TIME_SLOTS: string[] = (() => {
  const slots: string[] = [];
  for (let h = 9; h <= 20; h++) {
    slots.push(`${String(h).padStart(2, '0')}:00`);
    if (h < 20) slots.push(`${String(h).padStart(2, '0')}:30`);
  }
  return slots;
})();

// ─── 순수 함수 ────────────────────────────────────────────────────────────────

/** Date → 'YYYY-MM-DD' */
export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * 예약 시간 유효성 검사.
 * 두 시간이 모두 입력된 경우에만 검사하고, 문제 없으면 null 반환.
 */
export function validateBookingTime(
  startTime: string,
  endTime: string,
  attendees: number
): string | null {
  if (!startTime || !endTime) return null;
  if (endTime <= startTime) return '종료 시간은 시작 시간보다 늦어야 합니다.';
  if (attendees < 1) return '참석 인원은 1명 이상이어야 합니다.';
  return null;
}

/**
 * 필터 조건에 맞는 예약 가능 회의실 목록을 반환한다. (순수 함수)
 * 정렬: 층수 오름차순 → 이름순
 */
export function filterAvailableRooms(
  rooms: Room[],
  reservations: Reservation[],
  filter: FilterState
): Room[] {
  const { attendees, equipment, preferredFloor, date, startTime, endTime } = filter;

  return rooms
    .filter(room => {
      // 수용 인원
      if (room.capacity < attendees) return false;
      // 장비 조건
      if (!equipment.every(eq => room.equipment.includes(eq))) return false;
      // 층 조건
      if (preferredFloor !== null && room.floor !== preferredFloor) return false;
      // 시간 충돌: [start, end) 구간 겹침
      const hasConflict = reservations.some(
        r => r.roomId === room.id && r.date === date && r.start < endTime && r.end > startTime
      );
      return !hasConflict;
    })
    .sort((a, b) => {
      if (a.floor !== b.floor) return a.floor - b.floor;
      return a.name.localeCompare(b.name);
    });
}
