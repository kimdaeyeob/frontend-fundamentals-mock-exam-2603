import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { getRooms, getReservations, createReservation } from 'pages/remotes';
import { formatDate, validateBookingTime, filterAvailableRooms, TIME_SLOTS } from './utils';
import type { Room, Reservation, BookingPayload } from './types';

export function useRoomBooking() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── 필터 상태 (URL 쿼리와 동기화) ──────────────────────────────────────────
  const [date, setDate] = useState(
    () => searchParams.get('date') || formatDate(new Date())
  );
  const [startTime, setStartTime] = useState(
    () => searchParams.get('startTime') || ''
  );
  const [endTime, setEndTime] = useState(
    () => searchParams.get('endTime') || ''
  );
  const [attendees, setAttendees] = useState(
    () => Number(searchParams.get('attendees')) || 1
  );
  const [equipment, setEquipment] = useState<string[]>(
    () => searchParams.get('equipment')?.split(',').filter(Boolean) ?? []
  );
  const [preferredFloor, setPreferredFloor] = useState<number | null>(
    () => (searchParams.get('floor') ? Number(searchParams.get('floor')) : null)
  );

  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // ── URL 쿼리 파라미터 동기화 ────────────────────────────────────────────────
  useEffect(() => {
    const params: Record<string, string> = {};
    if (date) params.date = date;
    if (startTime) params.startTime = startTime;
    if (endTime) params.endTime = endTime;
    if (attendees > 1) params.attendees = String(attendees);
    if (equipment.length > 0) params.equipment = equipment.join(',');
    if (preferredFloor !== null) params.floor = String(preferredFloor);
    setSearchParams(params, { replace: true });
  }, [date, startTime, endTime, attendees, equipment, preferredFloor, setSearchParams]);

  // ── 서버 데이터 ─────────────────────────────────────────────────────────────
  const { data: rawRooms = [], isLoading: isLoadingRooms, isError: isRoomsError, refetch: refetchRooms } = useQuery(['rooms'], getRooms);
  const rooms = rawRooms as Room[];

  const { data: rawReservations = [] } = useQuery(
    ['reservations', date],
    () => getReservations(date),
    { enabled: !!date }
  );
  const reservations = rawReservations as Reservation[];

  const createMutation = useMutation(
    (payload: BookingPayload) => createReservation(payload),
    {
      onSuccess: (_data, variables) => {
        queryClient.invalidateQueries(['reservations', variables.date]);
        queryClient.invalidateQueries(['myReservations']);
      },
    }
  );

  // ── derived state ───────────────────────────────────────────────────────────
  const validationError = useMemo(
    () => validateBookingTime(startTime, endTime, attendees),
    [startTime, endTime, attendees]
  );

  const hasTimeInputs = startTime !== '' && endTime !== '';
  const isFilterComplete = hasTimeInputs && !validationError;

  // 오늘 날짜 선택 시 현재 시간 이전 슬롯 제외
  const availableStartTimes = useMemo(() => {
    const slots = TIME_SLOTS.slice(0, -1);
    const today = formatDate(new Date());
    if (date !== today) return slots;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    return slots.filter(slot => {
      const [h, m] = slot.split(':').map(Number);
      return h * 60 + m > currentMinutes;
    });
  }, [date]);

  // startTime 이후 슬롯만 종료 시간에 노출
  const availableEndTimes = useMemo(
    () => TIME_SLOTS.slice(1).filter(t => !startTime || t > startTime),
    [startTime]
  );

  const floors = useMemo(
    () => Array.from(new Set(rooms.map(r => r.floor))).sort((a, b) => a - b),
    [rooms]
  );

  const availableRooms = useMemo(
    () =>
      isFilterComplete
        ? filterAvailableRooms(rooms, reservations, {
            date,
            startTime,
            endTime,
            attendees,
            equipment,
            preferredFloor,
          })
        : [],
    [isFilterComplete, rooms, reservations, date, startTime, endTime, attendees, equipment, preferredFloor]
  );

  // ── 핸들러 ──────────────────────────────────────────────────────────────────
  const handleFilterChange = useCallback(() => {
    setSelectedRoomId(null);
    setErrorMessage(null);
  }, []);

  const handleBook = useCallback(async () => {
    if (!selectedRoomId) {
      setErrorMessage('회의실을 선택해주세요.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMessage('시작 시간과 종료 시간을 선택해주세요.');
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        roomId: selectedRoomId,
        date,
        start: startTime,
        end: endTime,
        attendees,
        equipment,
      });

      if ('ok' in result && result.ok) {
        navigate('/', { state: { message: '예약이 완료되었습니다!' } });
        return;
      }

      const errResult = result as { message?: string };
      setErrorMessage(errResult.message ?? '예약에 실패했습니다.');
      setSelectedRoomId(null);
    } catch (err: unknown) {
      let serverMessage = '예약에 실패했습니다.';
      if (axios.isAxiosError(err)) {
        const data = err.response?.data as { message?: string } | undefined;
        serverMessage = data?.message ?? serverMessage;
      }
      setErrorMessage(serverMessage);
      setSelectedRoomId(null);
    }
  }, [selectedRoomId, startTime, endTime, date, attendees, equipment, createMutation, navigate]);

  return {
    // 필터 상태
    date,
    setDate,
    startTime,
    setStartTime,
    endTime,
    setEndTime,
    attendees,
    setAttendees,
    equipment,
    setEquipment,
    preferredFloor,
    setPreferredFloor,
    // 선택 & 에러
    selectedRoomId,
    setSelectedRoomId,
    errorMessage,
    // 서버 derived
    floors,
    availableRooms,
    availableStartTimes,
    availableEndTimes,
    isFilterComplete,
    validationError,
    isLoadingRooms,
    isRoomsError,
    refetchRooms,
    // 액션
    handleBook,
    handleFilterChange,
    isBooking: createMutation.isLoading,
  };
}
