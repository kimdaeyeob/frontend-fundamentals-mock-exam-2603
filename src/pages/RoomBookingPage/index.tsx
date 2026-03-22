import { css } from '@emotion/react';
import { useNavigate } from 'react-router-dom';
import { Top, Spacing, Border, Button, Text, Select, ListRow } from '_tosslib/components';
import { colors } from '_tosslib/constants/colors';
import { useRoomBooking } from './useRoomBooking';
import { EQUIPMENT_LABELS, ALL_EQUIPMENT, TIME_SLOTS, formatDate } from './utils';

export function RoomBookingPage() {
  const navigate = useNavigate();
  const {
    date, setDate,
    startTime, setStartTime,
    endTime, setEndTime,
    attendees, setAttendees,
    equipment, setEquipment,
    preferredFloor, setPreferredFloor,
    selectedRoomId, setSelectedRoomId,
    errorMessage,
    floors,
    availableRooms,
    isFilterComplete,
    validationError,
    isLoadingRooms,
    isRoomsError,
    refetchRooms,
    handleBook,
    handleFilterChange,
    isBooking,
  } = useRoomBooking();

  return (
    <div css={css`background: ${colors.white}; padding-bottom: 40px;`}>
      <div css={css`padding: 12px 24px 0;`}>
        <button
          type="button"
          onClick={() => navigate('/')}
          aria-label="뒤로가기"
          css={css`
            background: none; border: none; padding: 0; cursor: pointer; font-size: 14px;
            color: ${colors.grey600}; &:hover { color: ${colors.grey900}; }
          `}
        >
          ← 예약 현황으로
        </button>
      </div>
      <Top.Top03 css={css`padding-left: 24px; padding-right: 24px;`}>
        예약하기
      </Top.Top03>

      {errorMessage && (
        <div css={css`padding: 0 24px;`}>
          <Spacing size={12} />
          <div
            css={css`
              padding: 10px 14px; border-radius: 10px; background: ${colors.red50};
              display: flex; align-items: center; gap: 8px;
            `}
          >
            <Text typography="t7" fontWeight="medium" color={colors.red500}>{errorMessage}</Text>
          </div>
        </div>
      )}

      <Spacing size={24} />

      {/* 예약 조건 입력 */}
      <div css={css`padding: 0 24px;`}>
        <Text typography="t5" fontWeight="bold" color={colors.grey900}>
          예약 조건
        </Text>
        <Spacing size={16} />

        {/* 날짜 */}
        <div css={css`display: flex; flex-direction: column; gap: 6px;`}>
          <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>날짜</Text>
          <input
            type="date"
            value={date}
            min={formatDate(new Date())}
            onChange={e => { setDate(e.target.value); handleFilterChange(); }}
            aria-label="날짜"
            css={css`
              box-sizing: border-box; font-size: 16px; font-weight: 500; line-height: 1.5; height: 48px;
              background-color: ${colors.grey50}; border-radius: 12px; color: ${colors.grey800};
              width: 100%; border: 1px solid ${colors.grey200}; padding: 0 16px; outline: none;
              transition: border-color 0.15s; &:focus { border-color: ${colors.blue500}; }
            `}
          />
        </div>
        <Spacing size={14} />

        {/* 시간 */}
        <div css={css`display: flex; gap: 12px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>시작 시간</Text>
            <Select
              value={startTime}
              onChange={e => { setStartTime(e.target.value); handleFilterChange(); }}
              aria-label="시작 시간"
            >
              <option value="">선택</option>
              {TIME_SLOTS.slice(0, -1).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>종료 시간</Text>
            <Select
              value={endTime}
              onChange={e => { setEndTime(e.target.value); handleFilterChange(); }}
              aria-label="종료 시간"
            >
              <option value="">선택</option>
              {TIME_SLOTS.slice(1).map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </Select>
          </div>
        </div>
        <Spacing size={14} />

        {/* 참석 인원 + 선호 층 */}
        <div css={css`display: flex; gap: 12px;`}>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>참석 인원</Text>
            <input
              type="number"
              min={1}
              value={attendees}
              onChange={e => { setAttendees(Math.max(1, Number(e.target.value))); handleFilterChange(); }}
              aria-label="참석 인원"
              css={css`
                box-sizing: border-box; font-size: 16px; font-weight: 500; line-height: 1.5; height: 48px;
                background-color: ${colors.grey50}; border-radius: 12px; color: ${colors.grey800};
                width: 100%; border: 1px solid ${colors.grey200}; padding: 0 16px; outline: none;
                transition: border-color 0.15s; &:focus { border-color: ${colors.blue500}; }
              `}
            />
          </div>
          <div css={css`display: flex; flex-direction: column; gap: 6px; flex: 1;`}>
            <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>선호 층</Text>
            <Select
              value={preferredFloor ?? ''}
              onChange={e => {
                const val = e.target.value;
                setPreferredFloor(val === '' ? null : Number(val));
                handleFilterChange();
              }}
              aria-label="선호 층"
            >
              <option value="">전체</option>
              {floors.map(f => (
                <option key={f} value={f}>{f}층</option>
              ))}
            </Select>
          </div>
        </div>
        <Spacing size={14} />

        {/* 장비 */}
        <div>
          <Text as="label" typography="t7" fontWeight="medium" color={colors.grey600}>필요 장비</Text>
          <Spacing size={8} />
          <div css={css`display: flex; gap: 8px; flex-wrap: wrap;`}>
            {ALL_EQUIPMENT.map(eq => {
              const selected = equipment.includes(eq);
              return (
                <button
                  key={eq}
                  type="button"
                  onClick={() => {
                    const next = selected ? equipment.filter(e => e !== eq) : [...equipment, eq];
                    setEquipment(next);
                    handleFilterChange();
                  }}
                  aria-label={EQUIPMENT_LABELS[eq]}
                  aria-pressed={selected}
                  css={css`
                    padding: 8px 16px; border-radius: 20px;
                    border: 1px solid ${selected ? colors.blue500 : colors.grey200};
                    background: ${selected ? colors.blue50 : colors.grey50};
                    color: ${selected ? colors.blue600 : colors.grey700};
                    font-size: 14px; font-weight: 500; cursor: pointer; transition: all 0.15s;
                    &:hover { border-color: ${selected ? colors.blue500 : colors.grey400}; }
                  `}
                >
                  {EQUIPMENT_LABELS[eq]}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {validationError && (
        <div css={css`padding: 0 24px;`}>
          <Spacing size={8} />
          <span css={css`color: ${colors.red500}; font-size: 14px;`} role="alert">{validationError}</span>
        </div>
      )}

      <Spacing size={24} />
      <Border size={8} />
      <Spacing size={24} />

      {/* 예약 가능 회의실 목록 */}
      {isFilterComplete && (
        <div css={css`padding: 0 24px;`}>
          <div css={css`display: flex; align-items: baseline; gap: 6px;`}>
            <Text typography="t5" fontWeight="bold" color={colors.grey900}>
              예약 가능 회의실
            </Text>
            {!isLoadingRooms && (
              <Text typography="t7" fontWeight="medium" color={colors.grey500}>
                {availableRooms.length}개
              </Text>
            )}
          </div>
          <Spacing size={16} />

          {isRoomsError ? (
            <div css={css`padding: 40px 0; text-align: center; background: ${colors.grey50}; border-radius: 14px; display: flex; flex-direction: column; align-items: center; gap: 12px;`}>
              <Text typography="t6" color={colors.grey500}>
                회의실 정보를 불러오지 못했습니다.
              </Text>
              <Button type="primary" style="weak" size="small" onClick={() => refetchRooms()}>
                다시 시도
              </Button>
            </div>
          ) : isLoadingRooms ? (
            <div css={css`padding: 40px 0; text-align: center; background: ${colors.grey50}; border-radius: 14px;`}>
              <Text typography="t6" color={colors.grey500}>
                조회 중...
              </Text>
            </div>
          ) : availableRooms.length === 0 ? (
            <div css={css`padding: 40px 0; text-align: center; background: ${colors.grey50}; border-radius: 14px;`}>
              <Text typography="t6" color={colors.grey500}>
                조건에 맞는 회의실이 없습니다.
              </Text>
            </div>
          ) : (
            <div css={css`display: flex; flex-direction: column; gap: 10px;`}>
              {availableRooms.map(room => {
                const isSelected = selectedRoomId === room.id;
                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedRoomId(room.id)}
                    role="button"
                    aria-pressed={isSelected}
                    aria-label={room.name}
                    css={css`
                      cursor: pointer; padding: 14px 16px; border-radius: 14px;
                      border: 2px solid ${isSelected ? colors.blue500 : colors.grey200};
                      background: ${isSelected ? colors.blue50 : colors.white};
                      transition: all 0.15s;
                      &:hover { border-color: ${isSelected ? colors.blue500 : colors.grey300}; }
                    `}
                  >
                    <ListRow
                      contents={
                        <ListRow.Text2Rows
                          top={room.name}
                          topProps={{ typography: 't6', fontWeight: 'bold', color: colors.grey900 }}
                          bottom={`${room.floor}층 · ${room.capacity}명 · ${room.equipment.map(e => EQUIPMENT_LABELS[e]).join(', ')}`}
                          bottomProps={{ typography: 't7', color: colors.grey600 }}
                        />
                      }
                      right={
                        isSelected ? (
                          <Text typography="t7" fontWeight="bold" color={colors.blue500}>선택됨</Text>
                        ) : undefined
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}

          <Spacing size={16} />
          <Button display="full" onClick={handleBook} disabled={isBooking}>
            {isBooking ? '예약 중...' : '확정'}
          </Button>
        </div>
      )}

      <Spacing size={24} />
    </div>
  );
}
