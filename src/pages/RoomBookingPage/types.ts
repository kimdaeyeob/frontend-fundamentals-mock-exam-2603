/** 지원 장비 타입 */
export type Equipment = 'tv' | 'whiteboard' | 'video' | 'speaker';

export interface Room {
  id: string;
  name: string;
  floor: number;
  capacity: number;
  /** API는 string[]으로 반환 — Equipment는 문서화 목적 */
  equipment: string[];
}

export interface Reservation {
  id: string;
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}

export interface FilterState {
  date: string;
  startTime: string;
  endTime: string;
  attendees: number;
  equipment: string[];
  preferredFloor: number | null;
}

export interface BookingPayload {
  roomId: string;
  date: string;
  start: string;
  end: string;
  attendees: number;
  equipment: string[];
}
